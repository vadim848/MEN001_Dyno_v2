// VIS local SAL trainer server. Binds 127.0.0.1 ONLY (port VIS_PORT, default 8642). Plain node:http, no dependencies.
// Model only: not Verify/TwinCAT, not hardware. Exams run in forked workers (SalRuntime instrumentation is process-global).
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import { canonicalTarget, getTarget, storeUpload, removeTarget, uploadIds } from "./target.js";
import { loadProgram, parseTarget } from "./model.js";
import { ourNames, loadedNames, autoTable, validateTable, applyMapping, unmappedOf } from "./mapping.js";
import { loadCatalog, catalogVersion } from "./catalog.js";
import { reportHtml } from "./report.js";
import * as manual from "./manual.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const HOST = "127.0.0.1";
export const MAX_BODY = 28 * 1000 * 1000; // ~20 MB of raw files after base64
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };
const jobs = new Map();
let canon = null;
function canonical() { if (!canon) { const t = canonicalTarget(); const { P } = loadProgram(t, null); canon = { t, P, ours: ourNames(P) }; } return canon; }
const parsed = new Map();
let currentUpload = null;
// Temp dirs of replaced uploads / finished exams are removed (a target is kept while it is current or a running exam uses it).
function sweep() { for (const id of uploadIds()) { if (id === currentUpload) continue; if ([...jobs.values()].some(j => j.state === "running" && j.targetId === id)) continue; removeTarget(id); parsed.delete(id); } }
function parsedModel(t) { if (!parsed.has(t.id)) { try { parsed.set(t.id, { m: parseTarget(t) }); } catch (e) { parsed.set(t.id, { error: String(e.message).split("\n").slice(0, 4).join(" / ") }); } } return parsed.get(t.id); }

const send = (res, code, obj, type = "application/json; charset=utf-8", extra = {}) => { res.writeHead(code, { "content-type": type, "cache-control": "no-store", ...extra }); res.end(typeof obj === "string" || Buffer.isBuffer(obj) ? obj : JSON.stringify(obj)); };
async function body(req) {
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > MAX_BODY) throw Object.assign(new Error("request too large (20 MB limit)"), { code: 413 }); chunks.push(c); }
  const s = Buffer.concat(chunks).toString("utf8"); return s ? JSON.parse(s) : {};
}
const tableFor = (t, table) => { if (table) return table; const pm = parsedModel(t); return pm.m ? autoTable(canonical().ours, pm.m) : {}; };

// One structure worker + W catalog workers (round-robin chunks): the catalog is ~10 min single-threaded, this keeps it at a few minutes.
const WORKERS = Math.max(1, Math.min(Number(process.env.VIS_WORKERS) || os.cpus().length - 1, 8));
async function startExam({ target, table }) {
  const t = getTarget(target); const tab = tableFor(t, table);
  const pm = parsedModel(t);
  if (pm.m) { validateTable(tab, pm.m, canonical().ours); applyMapping(parseTarget(t), tab); }
  const list = await loadCatalog();
  const id = crypto.randomBytes(6).toString("hex"); const job = { id, state: "running", progress: { part: 1, done: 0, total: list.length }, structure: null, result: null, error: null, started: Date.now(), children: [], targetId: t.id };
  jobs.set(id, job);
  const env = { ...process.env, CATALOG_SAL_DIR: t.dir };
  for (const k of Object.keys(env)) if (/^CATALOG_(STAGES|SYM_|FAULT_|SAFETYFAULT_|PLANT_)/.test(k)) delete env[k];
  const chunks = Array.from({ length: Math.min(WORKERS, list.length) }, (_, w) => list.filter((_, i) => i % WORKERS === w).map(s => s.id));
  const jobsSpec = [{ ids: [], withStructure: true }, ...chunks.map(ids => ({ ids, withStructure: false }))];
  const partial = []; const done = new Array(jobsSpec.length).fill(0); let finished = 0;
  const fail = msg => { clearTimeout(timer); if (job.state === "running") { job.state = "error"; job.error = msg; setImmediate(sweep); } for (const c of job.children) c.kill(); };
  const timer = setTimeout(() => fail("exam timeout"), 30 * 60 * 1000);
  const finish = () => {
    clearTimeout(timer);
    const byId = new Map(partial.flatMap(p => p.rows).map(r => [r.id, r])); const rows = list.map(s => byId.get(s.id));
    const first = partial.find(p => p.ours) ?? partial[0]; const count = st => rows.filter(r => r.status === st).length;
    job.result = { date: new Date().toISOString(), catalogVersion: catalogVersion(),
      target: { id: t.id, canonical: t.canonical, salName: t.salName, sgvlName: t.sgvlName, salSha256: t.salSha256, sgvlSha256: t.sgvlSha256 },
      structure: job.structure,
      catalog: { loadError: first.loadError, totals: { total: rows.length, pass: count("PASS"), fail: count("FAIL"), todo: count("TODO"), notChecked: count("NOT CHECKED") }, scenarios: rows },
      mapping: { table: tab, unmapped: first.unmapped, ours: first.ours } };
    job.state = "done"; sweep();
  };
  jobsSpec.forEach((spec, k) => {
    const child = fork(path.join(here, "exam-worker.js"), [], { env }); job.children.push(child);
    child.on("message", m => {
      if (m.type === "progress" && m.part === 2) { done[k] = m.done; job.progress = { part: 2, done: done.reduce((a, b) => a + b, 0), total: list.length }; }
      else if (m.type === "structure") job.structure = m.structure;
      else if (m.type === "result") { child.__got = true; partial.push(m.result); if (++finished === jobsSpec.length && job.state === "running") { try { finish(); } catch (e) { fail(String(e.stack ?? e)); } } }
      else if (m.type === "error") fail(m.error);
    });
    child.on("close", code => { if (job.state === "running" && (code || !child.__got)) fail("worker process exited with code " + code); });
    child.send({ target: t, table: tab, ...spec });
  });
  return job;
}
const stripDiagrams = r => ({ ...r, catalog: { ...r.catalog, scenarios: r.catalog.scenarios.map(({ diagram, ...s }) => ({ ...s, hasDiagram: !!diagram })) } });

async function api(req, res, url) {
  const p = url.pathname, q = url.searchParams, m = req.method;
  if (p === "/api/info" && m === "GET") { const c = canonicalTarget(); const list = await loadCatalog();
    return send(res, 200, { canonical: { dir: c.dir, salSha256: c.salSha256, sgvlSha256: c.sgvlSha256 }, catalogVersion: catalogVersion(), scenarioCount: list.length, host: HOST }); }
  if (p === "/api/target/canonical" && m === "POST") { const t = canonicalTarget(); const pm = parsedModel(t);
    return send(res, 200, { targetId: t.id, salSha256: t.salSha256, sgvlSha256: t.sgvlSha256, blocks: pm.m?.networks.flatMap(n => n.blocks).length ?? null, parseError: pm.error }); }
  if (p === "/api/target" && m === "POST") { const b = await body(req); const t = storeUpload(b.files); currentUpload = t.id; sweep(); const pm = parsedModel(t);
    return send(res, 200, { targetId: t.id, salSha256: t.salSha256, sgvlSha256: t.sgvlSha256, hasDiagram: t.hasDiagram, blocks: pm.m?.networks.flatMap(n => n.blocks).length ?? null, parseError: pm.error }); }
  if (p === "/api/mapping" && m === "GET") { const t = getTarget(q.get("target")); const ours = canonical().ours; const pm = parsedModel(t);
    if (!pm.m) return send(res, 200, { parseError: pm.error, rows: [], loadedNames: [], loadedInputs: [] });
    const auto = autoTable(ours, pm.m), ln = loadedNames(pm.m);
    return send(res, 200, { rows: ours.map(o => ({ our: o.name, kind: o.kind, loaded: auto[o.name] ?? null, auto: auto[o.name] !== undefined })), loadedNames: ln.all, loadedInputs: ln.inputs }); }
  if (p === "/api/mapping" && m === "PUT") { const b = await body(req); const t = getTarget(b.target); const pm = parsedModel(t);
    if (!pm.m) throw new Error("program not parsed: " + pm.error);
    validateTable(b.table, pm.m, canonical().ours); applyMapping(parseTarget(t), b.table);
    return send(res, 200, { unmapped: unmappedOf(canonical().ours, b.table) }); }
  if (p === "/api/exam" && m === "POST") { const b = await body(req); const job = await startExam(b); return send(res, 200, { jobId: job.id }); }
  let mm = p.match(/^\/api\/exam\/([0-9a-f]+)(?:\/(.*))?$/);
  if (mm && m === "GET") {
    const job = jobs.get(mm[1]); if (!job) return send(res, 404, { error: "no such exam" });
    const sub = mm[2];
    if (!sub) return send(res, 200, { state: job.state, progress: job.progress, structure: job.structure, error: job.error, result: job.result ? stripDiagrams(job.result) : undefined });
    if (sub === "report.html") { if (!job.result) return send(res, 409, { error: "exam not finished" });
      return send(res, 200, reportHtml(job.result, { canonicalSha256: canonicalTarget().salSha256 }), "text/html; charset=utf-8", { "content-disposition": 'attachment; filename="sal-exam-report.html"' }); }
    const sm = sub.match(/^scenario\/(.+)$/);
    if (sm) { const s = job.result?.catalog.scenarios.find(x => x.id === decodeURIComponent(sm[1])); return s ? send(res, 200, s) : send(res, 404, { error: "no such scenario" }); }
  }
  if (p === "/api/manual/start" && m === "POST") { const b = await body(req); const t = getTarget(b.target);
    const tab = tableFor(t, b.table); const { P } = loadProgram(t, tab); const ours = canonical().ours;
    const state = manual.startSession(P, { plant: b.plant !== false, inputNames: ours.filter(o => o.kind === "input").map(o => o.name), unmapped: unmappedOf(ours, tab) });
    return send(res, 200, state); }
  if (p === "/api/manual/cmd" && m === "POST") return send(res, 200, manual.command(await body(req)));
  if (p === "/api/manual/inputs" && m === "POST") return send(res, 200, manual.setInputs(await body(req)));
  if (p === "/api/manual/hold" && m === "POST") return send(res, 200, manual.hold(await body(req)));
  if (p === "/api/manual/state" && m === "GET") return send(res, 200, manual.getState(Number(q.get("since") ?? -1)));
  return send(res, 404, { error: "no such method" });
}

function stat(res, file, type) { fs.readFile(file, (e, d) => e ? send(res, 404, { error: "not found" }) : send(res, 200, d, type)); }
export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const port = req.socket.localPort, hostOk = h => h === "127.0.0.1:" + port || h === "localhost:" + port;
      const org = req.headers.origin;
      if (!hostOk(req.headers.host ?? "") || (org && !hostOk(org.replace("http://", "")))) return send(res, 403, { error: "invalid Host/Origin" });
      const url = new URL(req.url, "http://" + HOST);
      if (url.pathname.startsWith("/api/")) return await api(req, res, url);
      if (req.method !== "GET") return send(res, 405, { error: "method" });
      if (url.pathname === "/svg.js") return stat(res, path.join(here, "svg.js"), TYPES[".js"]);
      const rel = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
      const f = path.resolve(here, "app", rel);
      if (!f.startsWith(path.resolve(here, "app") + path.sep)) return send(res, 403, { error: "forbidden" });
      return stat(res, f, TYPES[path.extname(f)] ?? "application/octet-stream");
    } catch (e) { send(res, e.code === 413 ? 413 : 400, { error: String(e.message ?? e) }); }
  });
}
export function startServer(port = Number(process.env.VIS_PORT ?? 8642)) {
  return new Promise((resolve, reject) => { const s = createServer(); s.once("error", reject); s.listen(port, HOST, () => resolve(s)); });
}
export function stopAll() { for (const j of jobs.values()) for (const c of j.children ?? []) c.kill(); manual.stopSession(); }
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer().then(s => { console.log(`SAL trainer (model, not Verify/TwinCAT): http://${HOST}:${s.address().port}/`); process.on("SIGINT", () => { stopAll(); process.exit(0); }); }, e => { console.error(e.message); process.exit(1); });
}
