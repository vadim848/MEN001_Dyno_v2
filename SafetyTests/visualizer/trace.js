// VIS trace instrumentation. Patches SalRuntime.prototype PROCESS-GLOBALLY: use only inside the exam worker, never in the
// server / check:software process. Records (a) input changes per runtime (change-encoded), (b) touches of unmapped names.
import { SalRuntime } from "../src/sal-runtime.js";
import { OUT } from "../test/helpers/catalog-program.js";

const trk = new WeakMap();          // runtime -> {count,last:Map,changes:[[scanIdx,name,bool]]}
const state = { installed: false, inputNames: [], unmapped: new Set(), defaults: {}, stack: [] };
const T = r => { let t = trk.get(r); if (!t) { t = { count: 0, last: new Map(), changes: [] }; trk.set(r, t); } return t; };
const touch = n => { const s = state.stack[state.stack.length - 1]; if (s) s.add(n); };

// inputNames: tracked input names (for diagrams); unmapped: Set of our names absent from the loaded SAL; defaults: RAW0 defaults.
export function install({ inputNames, unmapped, defaults }) {
  state.inputNames = inputNames; state.unmapped = new Set(unmapped); state.defaults = defaults;
  if (state.installed) return; state.installed = true;
  const P = SalRuntime.prototype, scan = P.scan, setInputs = P.setInputs, get = P.get;
  P.scan = function (dt) {
    const t = T(this);
    if (t.count === 0) for (const n of state.inputNames) { const v = Boolean(this.values.get("var:" + n)); if (t.last.get(n) !== v) { t.last.set(n, v); t.changes.push([1, n, v]); } }
    const r = scan.call(this, dt); t.count++; return r;
  };
  P.setInputs = function (values) {
    const t = T(this);
    for (const [k, v] of Object.entries(values)) {
      const b = Boolean(v);
      if (t.last.get(k) !== b && (state.inputNames.includes(k))) { t.last.set(k, b); t.changes.push([t.count + 1, k, b]); }
      // any later write attempt, or a non-default value, is a touch (initial create() defaults excluded)
      if (state.unmapped.has(k) && (b !== Boolean(state.defaults[k] ?? false) || t.count > 0)) touch(k);
    }
    return setInputs.call(this, values);
  };
  P.get = function (name) {
    if (state.unmapped.size) { const n = name.startsWith("var:") ? name.slice(4) : name; if (state.unmapped.has(n)) touch(n); }
    return get.call(this, name);
  };
}
export function setUnmapped(u) { state.unmapped = new Set(u); }

// Scenario touch collection (incl. cached steady states built on demand, merged into each scenario that uses them).
export function beginScenario() { const s = new Set(); state.stack.push(s); return s; }
export function endScenario() { return [...state.stack.pop()].sort(); }
// symCanon: kind -> canonical symbol name that the catalog resolves by pattern (P.sym). Resolving a kind whose canonical name is unmapped is a touch,
// even when the target lookup returns null (B1).
export function wrapProgram(P, symCanon = {}) {
  const origSym = P.sym; P.sym = kind => { const c = symCanon[kind]; if (c && state.unmapped.has(c)) touch(c); return origSym(kind); };
  const orig = P.cached.bind(P); const kt = new Map();
  P.cached = (kind, builder) => {
    const top = () => state.stack[state.stack.length - 1];
    if (!kt.has(kind)) { const set = new Set(); kt.set(kind, set); state.stack.push(set); try { return orig(kind, builder); } finally { state.stack.pop(); for (const n of set) top()?.add(n); } }
    try { return orig(kind, builder); } finally { for (const n of kt.get(kind)) top()?.add(n); }
  };
  return P;
}

// ---- lane series ----
export const LOG_BOOL = [...OUT, "STO", "fault", "plcFault", "cover"];
const KEYS = [...LOG_BOOL, "st", "stg"];
const val = (s, k) => k === "st" ? s.st.join("+") : s[k];
export function laneOf(x) { const t = trk.get(x.r) ?? { count: 0, changes: [] }; return { x, offset: x.t - t.count, changes: t.changes }; }
// change-encoded full series {name:[[t,v],...]} (t = scan index, 1-based like x.log[i].t)
export function laneSeries(lane) {
  const out = {};
  for (const [c, n, v] of lane.changes) (out["in:" + n] ??= []).push([c + lane.offset, v]);
  const log = lane.x.log;
  for (const k of KEYS) { const a = []; let prev; for (const s of log) { const v = val(s, k); if (v !== prev || a.length === 0) { a.push([s.t, v]); prev = v; } } out[k] = a; }
  return out;
}
// Cut a window [w0,w1]: keep signals that change in the window (plus st/stg and the divergent signal).
export function windowSeries(series, w0, w1, extra = []) {
  const res = {};
  for (const [k, a] of Object.entries(series)) {
    let start; const inside = [];
    for (const [t, v] of a) { if (t <= w0) start = v; else if (t <= w1) inside.push([t, v]); }
    const pts = [[w0, start === undefined ? (typeof a[0]?.[1] === "string" ? "" : false) : start], ...inside];
    const interesting = inside.length > 0 || extra.includes(k) || k === "st" || k === "stg";
    if (interesting) res[k] = pts;
  }
  return res;
}
// First difference between two lanes (outputs/status/stages). null = identical over the shared length.
export function firstDivergence(a, b) {
  const la = a.x.log, lb = b.x.log, n = Math.min(la.length, lb.length);
  for (let i = 0; i < n; i++) for (const k of KEYS) { const va = val(la[i], k), vb = val(lb[i], k); if (va !== vb) return { t: la[i].t, signal: k, expected: vb, actual: va }; }
  if (la.length !== lb.length) return { t: n + 1, signal: "(trace length)", expected: lb.length, actual: la.length };
  return null;
}
