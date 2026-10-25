// E2-G3 differential probe (v2-tester; NOT a G1 test). Runs one input scenario on E2_SOURCE_ROOT and prints the
// observable trace (stages, statuses, outputs) as compact change events, so that base and mutant can be compared.
// Scenarios follow the architect's killingScenario texts of the surviving mutants; the verdict vs requirements is
// written in G3_REPORT, not here.
// usage: E2_SOURCE_ROOT=<root> node probe-diff.mjs <scenario> [k]
import * as L from '../snapshot/test/helpers/e2-lifecycle.js';
const [sc, kArg] = process.argv.slice(2); const k = +(kArg ?? 0);
let x, t0;
const ev = [];
function watch(x) { let prev = null; x.listeners.push(s => { const key = JSON.stringify([s.stages, s.statuses, s.out]); if (key !== prev) { ev.push({ t: s.t - t0, stages: s.stages.join('+'), st: s.statuses.join('+'), on: Object.entries(s.out).filter(([, v]) => v).map(([n]) => n).join(',') }); prev = key; } }); }
if (sc === 'C05') { // steady R&D, BOTH held 4000 ms, LV Faulty TRUE from +500 (held)
  x = L.cached('RnD'); t0 = x.t + 1; watch(x); x.step(L.BOTH, 500); x.step({ in_LV_Faulty_FBK: true }, 3500); x.step(L.OFF, 3000);
} else if (sc === 'C04') { // steady R&D, BOTH held 1500 ms, LV Faulty TRUE from +k (scan sweep around qualification), held
  x = L.cached('RnD'); t0 = x.t + 1; watch(x); x.step(L.BOTH, k); x.step({ in_LV_Faulty_FBK: true }, 1500 - k); x.step(L.OFF, 3000);
} else if (sc === 'D03') { // Safe->R&D with both released at acceptance; new BOTH 1100 ms at release+2050
  x = L.cached('Safe'); x.step(L.BOTH, 1100); x.step(L.OFF); t0 = x.t; watch(x); x.step({}, 2049); x.step(L.BOTH, 1100); x.step(L.OFF, 3000);
}
console.log(JSON.stringify({ sc, k, ev: ev.slice(0, 40) }));
