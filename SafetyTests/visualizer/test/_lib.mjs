// Tester helpers for VIS tests (not a test file). Oracle sources: SCENARIO_DECISIONS.md "## VIS" (VIS-Q1..Q6),
// program/architect/VIS_PLAN.md §2/§8. Implementation modules are used only for endpoint shapes / starting the server.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fork, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export const VIS = fileURLToPath(new URL("../", import.meta.url));
export const ST = path.resolve(VIS, "..");               // SafetyTests
export const REPO = path.resolve(ST, "..");
export const CANON_DIR = path.join(REPO, "MEN001_Dyno", "Safety_Dyno", "TwinSafeGroup1");
export const CANON_SAL = path.join(CANON_DIR, "TwinSafeGroup1.sal");
export const CANON_SGVL = path.join(REPO, "MEN001_Dyno", "Safety_Dyno", "GVLs", "GVL1.sgvl");
export const sha = b => crypto.createHash("sha256").update(b).digest("hex");
export const SCRATCH = process.env.VIS_TEST_SCRATCH || path.join(os.tmpdir(), "men001-vis-tester");
fs.mkdirSync(SCRATCH, { recursive: true });

// ---- server (in-process; exam workers are forked by the server itself) ----
export async function startServer() {
  const mod = await import("../server.js");
  const s = await mod.startServer(0);
  const port = s.address().port;
  const base = `http://127.0.0.1:${port}`;
  const call = async (method, p, body) => {
    const opts = () => ({ method, headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
    // one retry on a transport-level failure only (keep-alive socket closed by the server under load: undici "fetch failed");
    // HTTP statuses are never retried, so no oracle is affected; a dead server fails the retry too.
    let r; try { r = await fetch(base + p, opts()); } catch (e) { if (!/fetch failed/.test(String(e?.message))) throw e; r = await fetch(base + p, opts()); }
    const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch { /* html */ }
    return { status: r.status, json, text, headers: r.headers };
  };
  return { server: s, port, base, call, stop: () => { mod.stopAll(); s.close(); } };
}

// files for upload: {name, base64}; alias devices from the canonical folder (optional)
export function filesOf({ sal, sgvl, diagram = null, alias = true }) {
  const f = [{ name: "TwinSafeGroup1.sal", base64: Buffer.from(sal).toString("base64") }, { name: "GVL1.sgvl", base64: Buffer.from(sgvl).toString("base64") }];
  if (diagram) f.push({ name: "TwinSafeGroup1.sal.diagram", base64: Buffer.from(diagram).toString("base64") });
  if (alias) { const root = path.join(CANON_DIR, "Alias Devices");
    const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
    for (const p of walk(root).filter(p => p.endsWith(".sds"))) f.push({ name: "Alias Devices/" + path.relative(root, p).replace(/\\/g, "/"), base64: fs.readFileSync(p).toString("base64") }); }
  return f;
}
export const canonText = () => ({ sal: fs.readFileSync(CANON_SAL, "utf8"), sgvl: fs.readFileSync(CANON_SGVL, "utf8") });

export async function runExam(call, target, table, { timeoutMs = 25 * 60 * 1000 } = {}) {
  const body = { target }; if (table) body.table = table;
  const r = await call("POST", "/api/exam", body);
  if (r.status !== 200) throw new Error("exam start " + r.status + " " + r.text);
  const id = r.json.jobId; const t0 = Date.now();
  for (;;) {
    await new Promise(res => setTimeout(res, 1000));
    const g = await call("GET", "/api/exam/" + id);
    if (g.json.state === "done") return { id, ...g.json };
    if (g.json.state === "error") throw new Error("exam error: " + g.json.error);
    if (Date.now() - t0 > timeoutMs) throw new Error("exam timeout");
  }
}

// Exam worker on a scenario subset (worker IPC protocol {target, table, ids, withStructure}, plan §1/§3).
export async function workerSubset(targetRec, table, ids, withStructure = false) {
  const env = { ...process.env, CATALOG_SAL_DIR: targetRec.dir };
  for (const k of Object.keys(env)) if (/^CATALOG_(STAGES|SYM_|FAULT_|SAFETYFAULT_|PLANT_)/.test(k)) delete env[k];
  return new Promise((resolve, reject) => {
    const c = fork(path.join(VIS, "exam-worker.js"), [], { env, silent: true });
    let structure = null;
    c.on("message", m => { if (m.type === "structure") structure = m.structure; else if (m.type === "result") resolve({ ...m.result, structure: structure ?? m.result.structure }); else if (m.type === "error") reject(new Error(m.error)); });
    c.on("exit", code => { if (code) reject(new Error("worker exit " + code)); });
    c.send({ target: targetRec, table, ids, withStructure });
  });
}

// ---- reference: check:catalog TAP (the oracle of item 1) ----
export function parseTap(out) {
  const m = new Map();
  for (const x of out.matchAll(/^(not ok|ok) \d+ - (.*?)(?: # (TODO|SKIP)\b.*)?$/gm)) {
    const name = x[2].trim(); const mm = name.match(/^\[([^\]]+)\] (\S+)/);
    if (!mm) continue; const [, stage, id0] = mm; const id = stage === "HDR" ? "HDR" : id0;
    m.set(stage === "M" ? "M:" + id : id,x[3] === "TODO" ? "TODO" : x[3] === "SKIP" ? "SKIP" : x[1] === "ok" ? "PASS" : "FAIL");
  }
  return m;
}
export function catalogTap() {
  const pre = process.env.VIS_TEST_TAP;
  if (pre && fs.existsSync(pre)) return Promise.resolve(fs.readFileSync(pre, "utf8"));
  const out = path.join(SCRATCH, "catalog-tap.txt");
  return new Promise((resolve, reject) => {
    const env = { ...process.env, CATALOG_TAP_OUT: out }; delete env.CATALOG_SAL_DIR; delete env.CATALOG_STAGES; delete env.NODE_TEST_CONTEXT;
    const p = spawn(process.execPath, ["scripts/catalog-check.js"], { cwd: ST, env, stdio: "ignore" });
    p.on("exit", () => fs.existsSync(out) ? resolve(fs.readFileSync(out, "utf8")) : reject(new Error("no TAP")));
  });
}
export function sh(cmd, args, opts = {}) {
  return new Promise(resolve => { const p = spawn(cmd, args, { cwd: opts.cwd ?? ST, env: opts.env ?? process.env, shell: opts.shell ?? false });
    let o = ""; p.stdout.on("data", d => o += d); p.stderr.on("data", d => o += d); p.on("exit", code => resolve({ code, out: o })); });
}

// Canonical baseline after TMR-1 + Vadim IDE Verify (commit 1912ad8, 2026-10-29): SAL with recomputed native CRC.
// Structure must be full PASS (native CRC included); no stale-CRC allowance.
export const CANON_SAL_SHA = "f81b1a5e565dc5d9c5893dff9b2f7c25f27712c45be442905e3f6835706544f4";
