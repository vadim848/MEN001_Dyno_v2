// VIS name mapping (VIS-Q5): "our" names (the catalog's) -> signals of the loaded SAL. 1:1, no polarity option.
import { signalName } from "../src/signal-names.js";

const PLC_IN = ["SAFE_TO_RND", "RND_TO_RUN", "RUN_TO_RND", "RND_TO_SAFE", "HEARTBEAT"];
const PLC_OUT = ["FAULT", "SAFETYFAULT", "COVER_LOCKED", "CFG"];
const STATUS4 = ["STS_SAFE", "STS_RND", "STS_RUN", "STS_EMG"];
const OUT = ["out_LV_C1", "out_HV_C2", "STO_DR1", "STO_DR2", "out_C3_BatRelay", "out_RBM_Bat", "out_LV_Discharge_Request", "out_HV_Discharge_Request",
  "out_Door_Unlock_Solonoeid", "out_SS1_DR1", "out_SS1_DR2", "outPLC_RnD", "b_EStop_Ok"];

// kinds: input / output / internal. Built from the canonical program Pc (names the catalog uses).
export function ourNames(Pc) {
  const rows = new Map(); const add = (n, k) => { if (n && !rows.has(n)) rows.set(n, k); };
  const x = Pc.create();
  for (const n of Object.keys(x.inputs)) add(n, "input");
  for (const k of PLC_IN) add(Pc.sym(k), "input");
  for (const n of OUT) add(n, "output");
  for (const n of STATUS4) add(n, "output");
  for (const k of PLC_OUT) add(Pc.sym(k), "output");
  for (const o of Pc.phases) add(o.symbol, "internal");
  // names the canonical SAL does not declare (e.g. unused RAW0 keys) are not part of the namespace
  return [...rows].filter(([n]) => Pc.names.has(n)).map(([name, kind]) => ({ name, kind }));
}
export function loadedNames(m) {
  const all = new Set(m.variables.map(v => v.name));
  for (const b of m.networks.flatMap(n => n.blocks)) for (const p of b.outputs) for (const g of p.globals) if (g.resolvedName) all.add(g.resolvedName);
  const inputs = new Set(m.variables.filter(v => v.targetPorts.length && !v.sourcePorts.length).map(v => v.name));
  return { all: [...all].sort(), inputs: [...inputs].sort() };
}
// Auto table: identical name, or the D-ARCH-POL-RENAME counterpart that the catalog itself resolves (value-preserving).
export function autoTable(ours, m) {
  const ln = new Set(loadedNames(m).all); const t = {};
  for (const { name } of ours) {
    if (ln.has(name)) { t[name] = name; continue; }
    try { const a = signalName(m, name); if (ln.has(a)) t[name] = a; } catch { /* not a renamed signal */ }
  }
  return t;
}
export function validateTable(table, m, ours = null) {
  if (!table || typeof table !== "object" || Array.isArray(table)) throw new Error("table must be an object {ours: loaded}");
  const lnn = loadedNames(m); const ln = new Set(lnn.all), lin = new Set(lnn.inputs); const seen = new Map(); const kind = new Map((ours ?? []).map(o => [o.name, o.kind]));
  for (const [our, loaded] of Object.entries(table)) {
    if (typeof loaded !== "string") throw new Error(`value for ${our} is not a string`);
    if (!ln.has(loaded)) throw new Error(`signal "${loaded}" is not in the loaded program (for ${our})`);
    const k = kind.get(our);
    if (k === "input" && !lin.has(loaded)) throw new Error(`"${our}" is an input but "${loaded}" is not an input of the loaded program (kind mismatch)`);
    if (k && k !== "input" && lin.has(loaded)) throw new Error(`"${our}" is ${k === "output" ? "an output" : "an internal signal"} but "${loaded}" is an input of the loaded program (kind mismatch)`);
    if (seen.has(loaded)) throw new Error(`signal "${loaded}" is mapped twice: ${seen.get(loaded)} and ${our} (1:1 required)`);
    seen.set(loaded, our);
  }
}
export function unmappedOf(ours, table) { return ours.filter(o => !Object.hasOwn(table, o.name)).map(o => o.name); }

// In-place model rename loaded -> our (before programFromModel). Fails closed on collision / residual name.
export function applyMapping(m, table) {
  validateTable(table, m);
  const ren = new Map(Object.entries(table).filter(([o, l]) => o !== l).map(([o, l]) => [l, o]));
  if (!ren.size) return m;
  const newName = n => ren.get(n) ?? n;
  const out = new Map();
  for (const n of loadedNames(m).all) { const nn = newName(n); if (out.has(nn)) throw new Error(`name conflict after renaming: "${out.get(nn)}" and "${n}" -> "${nn}"`); out.set(nn, n); }
  for (const v of m.variables) v.name = newName(v.name);
  const tail = s => { const i = s.lastIndexOf("."); const t = i >= 0 ? s.slice(i + 1) : s; return ren.has(t) ? (i >= 0 ? s.slice(0, i + 1) : "") + ren.get(t) : s; };
  for (const b of m.networks.flatMap(n => n.blocks)) for (const p of [...b.inputs, ...b.outputs]) for (const g of p.globals) {
    if (g.resolvedName) g.resolvedName = newName(g.resolvedName);
    if (typeof g.lastKnownPath === "string") g.lastKnownPath = tail(g.lastKnownPath);
  }
  const after = new Set(loadedNames(m).all); const news = new Set(ren.values());
  for (const l of ren.keys()) if (after.has(l) && !news.has(l)) throw new Error(`"${l}" remains after renaming: mapping rejected`);
  return m;
}
