// VIS catalog access: scenario list (same registry as test/catalog/*.test.js, minus section M and HDR), version, per-scenario evaluation.
// NEVER imports test/catalog/*.test.js (they call node:test test() and auto-run). Only lib/*.js (they call def() to fill SCENARIOS).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { SCENARIOS, runScenario } from "../test/helpers/catalog-program.js";
import * as trace from "./trace.js";

const root = fileURLToPath(new URL("../", import.meta.url));
let loaded = false;
// Registration order of the test files (b,c,d,e,g,h,k,n,p,u,w; n = n-c3bms, sorts between k-buttons and p-plc): the ids exported by the lib modules.
export async function loadCatalog() {
  if (loaded) return catalogList();
  const L = {}; for (const f of ["k", "c", "e", "u", "d", "h", "w", "p", "g", "n"]) L[f] = await import(`../test/catalog/lib/${f}.js`);
  loaded = true; return catalogList(L);
}
let ORDER = null;
function catalogList(L) {
  if (L) ORDER = [...L.g.B, ...L.c.C, ...L.d.D, ...L.e.E, ...L.g.G, ...L.h.H, ...L.k.K, ...L.n.N, ...L.p.PP, ...L.u.U, ...L.w.W];
  return ORDER.map(id => { const s = SCENARIOS.get(id); return { id, stage: s.stage, title: s.title }; });
}
export function catalogVersion() {
  const h = crypto.createHash("sha256"); const dir = path.join(root, "test/catalog/lib");
  const files = [...fs.readdirSync(dir).filter(f => f.endsWith(".js")).sort().map(f => path.join(dir, f)), path.join(root, "test/helpers/catalog-program.js")];
  for (const f of files) { h.update(path.basename(f)); h.update(fs.readFileSync(f)); }
  let git = ""; try { const r = spawnSync("git", ["log", "-1", "--format=%h", "--", "SafetyTests/test/catalog/lib", "SafetyTests/test/helpers/catalog-program.js"], { cwd: path.join(root, ".."), encoding: "utf8" }); if (r.status === 0) git = r.stdout.trim(); } catch { /* git optional */ }
  return h.digest("hex").slice(0, 16) + (git ? " (git " + git + ")" : "");
}

const WIN = [-500, 1500];
// Evaluate one scenario on P. cmp = {mkTarget(), mkCanonical()} program factories, used only for the divergence of FAIL scenarios.
export function evaluate(id, P, cmp) {
  const sc = SCENARIOS.get(id);
  trace.beginScenario(); const ctx = runScenario(id, P); const touched = trace.endScenario();
  let status = ctx.fails.length ? "FAIL" : ctx.nv.length ? "TODO" : "PASS";
  if (touched.length) status = "NOT CHECKED";
  const rec = { id, stage: sc.stage, title: sc.title, status, fails: ctx.fails, nv: ctx.nv, touchedUnmapped: touched, source: sc.source };
  if (status === "FAIL") {
    try { Object.assign(rec, failDetail(id, cmp)); } catch (e) { rec.divergence = { available: false, reason: "diagram build error: " + e.message }; }
  }
  return rec;
}
function failDetail(id, cmp) {
  // fresh (cold-cache) programs per FAIL scenario: lane creation order is then comparable lane by lane
  const rt = runScenario(id, cmp.mkTarget()), rc = runScenario(id, cmp.mkCanonical());
  const lt = rt.xs.map(trace.laneOf), lc = rc.xs.map(trace.laneOf);
  const out = {};
  const lane = lt.length ? lt.length - 1 : -1;
  if (lane < 0) return { divergence: { available: false, reason: "scenario produced no traces" } };
  let div = null, why = null;
  if (rc.fails.length) why = "the canonical program also fails this scenario";
  else for (let k = 0; k < Math.min(lt.length, lc.length) && !div; k++) { const d = trace.firstDivergence(lt[k], lc[k]); if (d) div = { lane: k, ...d }; }
  if (!div && !why && lt.length !== lc.length) why = `trace count differs (target ${lt.length}, reference ${lc.length}), no differences in common traces`;
  let k = lane, t = lt[lane].x.t;
  if (div) { k = div.lane; t = div.t; out.divergence = { available: true, ...div, note: "reference = canonical program behavior under the same stimulus (diagnostic; the oracle is the catalog checks)" }; }
  else out.divergence = why ? { available: false, reason: why } : { available: false, reason: "traces match the reference over the common length" };
  const w0 = div ? t + WIN[0] : lt[k].x.t - 2000, w1 = div ? t + WIN[1] : lt[k].x.t;
  const ser = trace.laneSeries(lt[k]);
  const extra = div ? [div.signal, "in:" + div.signal] : [];
  const diagram = { lane: k, lanes: lt.length, t: div ? t : null, w0, w1, series: trace.windowSeries(ser, w0, w1, extra) };
  if (div && lc[k]) diagram.expected = trace.windowSeries(trace.laneSeries(lc[k]), w0, w1, extra)[div.signal] ?? null, diagram.expectedSignal = div.signal;
  out.diagram = diagram; return out;
}
