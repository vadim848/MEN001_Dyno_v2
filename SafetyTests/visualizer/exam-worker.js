// VIS exam worker (forked by server.js; one exam per process, env CATALOG_SAL_DIR=<target dir>).
// Part 1: structureCheck() unchanged, the file as is (mapping NOT applied). Part 2: all catalog scenarios (no section M, no HDR),
// run even when part 1 FAILs/ERRORs (VIS-Q2). Instruments SalRuntime.prototype - hence a separate process.
import { structureCheck } from "../scripts/structure-check.js";
import { loadCatalog, evaluate } from "./catalog.js";
import { loadProgram } from "./model.js";
import { ourNames, unmappedOf } from "./mapping.js";
import { canonicalTarget } from "./target.js";
import * as trace from "./trace.js";

const SYM_KINDS = ["SAFE_TO_RND", "RND_TO_RUN", "RUN_TO_RND", "RND_TO_SAFE", "TRIGGER_EMG", "HEARTBEAT", "COVER_LOCKED", "FAULT", "SAFETYFAULT", "CFG"];
const send = m => process.send?.(m);
process.once("message", async msg => {
  let out;
  try { out = { type: "result", result: await run(msg) }; } catch (e) { out = { type: "error", error: String(e.stack ?? e) }; }
  process.send(out, () => process.exit(0));
});

// msg: {target, table, ids (subset of the catalog, default all), withStructure}. Returns a partial result; server.js merges workers.
async function run({ target, table, ids, withStructure = true }) {
  let structureOut = null;
  if (withStructure) {
    send({ type: "progress", part: 1, done: 0, total: 1 });
    let structure;
    try { structure = structureCheck(); } catch (e) { structure = { status: "ERROR", checks: [{ name: "structure check", status: "ERROR", detail: String(e.message) }] }; }
    structureOut = { status: structure.status, counts: structure.counts ?? null, native: structure.native ?? null,
      checks: structure.checks.map(c => ({ name: c.name, status: c.status, detail: c.detail })) };
    send({ type: "structure", structure: structureOut });
  }

  const list = (await loadCatalog()).filter(s => !ids || ids.includes(s.id));
  const canon = canonicalTarget();
  const Pc0 = loadProgram(canon, null).P;
  const ours = ourNames(Pc0);
  const defaults = Pc0.create().inputs;
  let loadError = null, P = null, unmapped = [];
  try { const r = loadProgram(target, table); P = r.P; unmapped = unmappedOf(ours, table); }
  catch (e) { loadError = String(e.message).split("\n").slice(0, 6).join(" / "); }
  const rows = [];
  if (P) {
    trace.install({ inputNames: ours.filter(o => o.kind === "input").map(o => o.name), unmapped, defaults });
    trace.wrapProgram(P, Object.fromEntries(SYM_KINDS.map(k => [k, Pc0.sym(k)])));
  }
  const cmp = { mkTarget: () => loadProgram(target, table).P, mkCanonical: () => loadProgram(canon, null).P };
  let done = 0;
  for (const s of list) {
    let rec;
    if (!P) rec = { id: s.id, stage: s.stage, title: s.title, status: "FAIL", fails: ["PROGRAM NOT LOADED: " + loadError], nv: [], touchedUnmapped: [], divergence: { available: false, reason: "program not loaded" } };
    else rec = evaluate(s.id, P, cmp);
    rows.push(rec); done++;
    send({ type: "progress", part: 2, done, total: list.length, id: s.id, status: rec.status });
  }
  return { structure: structureOut, rows, loadError, unmapped, ours };
}
