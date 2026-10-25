// E2-G3 independent scenario checks (v2-tester, NOT a G1 test; outside the frozen v8 snapshot).
// Oracles from requirements, not from any candidate:
//  K2  WDG-02 / MOD-001 (REQ-CONSOLIDATION, question 66(b) "yes"; analyst E2-G1-v8-r §4): Safe->R&D by BOTH with
//      in_LV_Faulty_FBK TRUE since before C1 ON -> the start is NOT refused: C1 ON in the same scan as the no-fault control,
//      no Emergency; after Faulty FALSE (C1_FBK+5000) R&D is reached (<= +700 ms, RND-CONF window 500 ms + 100 ms).
//      Variants of the Faulty start: p-200 (before the gesture), p+900 (during BOTH), A (first C1 ON scan of the control), A+1.
//  UNL-LVF CVR-001 (analyst E2-G1-v8-r §4b READY; reference 4495a1f + Q-ARCH-04 "A"): steady Safe, Door TRUE, NC1/NC2 TRUE,
//      in_LV_Faulty_FBK TRUE >= 1 s, single blue held 1000 ms from P -> Unlock FALSE at P+499, TRUE at P+501 (single 0.5 s rule,
//      AGENTS.md 2026-10-18), same as the no-fault control; no Emergency.
// Assumptions: helpers/e2-lifecycle.js A1..A9 of the frozen v8 snapshot (plant A2, 1 ms scan, raw TRUE = Faulty).
// Usage: E2_SOURCE_ROOT=<root with MEN001_Dyno/Safety_Dyno> node ind-k2-unl.mjs <label>
import * as L from '../snapshot/test/helpers/e2-lifecycle.js';
const label = process.argv[2] ?? '?';
const U = 'out_Door_Unlock_Solonoeid';
const res = [];
const rec = (id, ok, detail) => { res.push({ id, verdict: ok === null ? 'ERROR' : ok ? 'PASS' : 'FAIL', detail }); };
const emg = x => x.log.some(s => L.isEmg(s));
let safe;
try { safe = L.steadySafe(); } catch (e) { rec('precondition steady Safe', null, e.message); console.log(JSON.stringify({ label, res })); process.exit(0); }
// ---- K2 ----
function k2(start) {
  const ctl = safe.fork(); const p = ctl.t + 1; ctl.step(L.BOTH, 1100); ctl.step(L.OFF, 1500);
  const A = ctl.log.find(s => s.t >= p && s.out.out_LV_C1)?.t;
  if (A == null) return rec(`K2 control C1 ON (start ${start})`, false, 'control trace: no C1 ON after BOTH from Safe');
  const tf = { 'p+900': p + 900, 'A': A, 'A+1': A + 1 }[start];
  const end = p + 1100 + 1500;
  const z = safe.fork(); if (z.t + 1 !== p) return rec('K2', null, 'fork time mismatch');
  if (start === 'p-200') { // Faulty from base+1-200 is before p: emulate by setting it 200 scans earlier on a fresh fork
    const w = L.steadySafe(); w.step({ in_LV_Faulty_FBK: true }, 200); const q = w.t + 1; w.step(L.BOTH, 1100); w.step(L.OFF, 1500);
    return judgeK2(w, q, q + (A - p), start);
  }
  for (let t = z.t + 1; t <= end; t++) {
    const inp = {};
    if (t === p) Object.assign(inp, L.BOTH); if (t === p + 1100) Object.assign(inp, L.OFF);
    if (t === tf) inp.in_LV_Faulty_FBK = true;
    z.step(inp);
  }
  return judgeK2(z, p, A, start);
}
function judgeK2(z, p, A, start) {
  const c1 = z.log.find(s => s.t >= p && s.out.out_LV_C1)?.t;
  const d = [];
  if (c1 !== A) d.push(`C1 ON at ${c1 == null ? 'never' : 'p+' + (c1 - p)} vs control p+${A - p}`);
  if (z.log.some(s => s.t >= p && L.isEmg(s))) d.push('Emergency');
  if (c1 != null) { const fb = z.log.find(s => s.t >= c1 && s.c1fbk)?.t ?? c1 + 1; while (z.t < fb + 5000) z.step();
    z.step({ in_LV_Faulty_FBK: false }); const r0 = z.t; z.step({}, 1500);
    const rnd = z.log.find(s => s.t >= r0 && s.stages.includes('b_Step_RnD') && s.stages.length === 1)?.t;
    if (rnd == null || rnd > r0 + 700) d.push(`R&D after Faulty FALSE: ${rnd == null ? 'never' : '+' + (rnd - r0)}`); }
  rec(`K2 Safe->R&D, LV Faulty TRUE from ${start}`, d.length === 0, d.join('; ') || `C1 ON p+${c1 - p} as control`);
}
for (const s of ['p-200', 'p+900', 'A', 'A+1']) { try { k2(s); } catch (e) { rec(`K2 ${s}`, null, e.message.slice(0, 200)); } }
// ---- UNL-LVF ----
for (const lvf of [false, true]) {
  try {
    const x = L.steadySafe(); x.step({ in_LV_Faulty_FBK: lvf }, 1000); const P = x.t + 1; x.step(L.BLUE, 1000); x.step(L.OFF, 50);
    const at = t => x.log.find(s => s.t === t)?.out[U];
    const d = []; if (at(P + 499)) d.push('Unlock TRUE at P+499'); if (!at(P + 501)) d.push('Unlock FALSE at P+501'); if (!at(P + 999)) d.push('Unlock FALSE at P+999 (held)');
    if (x.log.some(s => s.t >= P && L.isEmg(s))) d.push('Emergency');
    if (x.log.some(s => s.t >= P && s.stages.join() !== 'b_Step1')) d.push('left Safe');
    rec(`UNL-LVF Safe single blue 1000 ms, LV Faulty ${lvf ? 'TRUE' : 'FALSE (control)'}`, d.length === 0, d.join('; ') || 'Unlock FALSE P+499, TRUE P+501..P+999');
  } catch (e) { rec(`UNL-LVF ${lvf}`, null, e.message.slice(0, 200)); }
}
console.log(JSON.stringify({ label, sal: L.salPath.pathname.slice(-40), res }));
