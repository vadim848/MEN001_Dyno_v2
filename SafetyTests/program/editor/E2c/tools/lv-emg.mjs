// Analyst E2-RC-D2 §4 emergency rows (EStop at e = g2+d during Safe->R&D after R&D->Safe), re-run on a candidate root
// (E2_SOURCE_ROOT) with the stand helper test/helpers/e2-lifecycle.js, same scenario as program/analyst/E2-RC-D2/repro/trace-lv2.mjs,
// extended by the re-issue observation of out_LV_Discharge_Request. Editor self-check, model only.
import * as L from '../../../../test/helpers/e2-lifecycle.js';
const {BOTH, GREEN, OFF} = L;
const K = 'out_LV_Discharge_Request';
function scen(eOff) {
  const x = L.cached('RnD'); x.step(GREEN, 600); x.step(OFF, 3000); const p = x.t + 1; const g2 = {};
  for (let i = 0; i < 9000; i++) {const n = x.t + 1; const inp = i < 1100 ? {...BOTH} : {...OFF}; if (eOff != null && n - p >= eOff && n - p < eOff + 100) inp.in_ES_NC_1 = false; x.step(inp); g2[x.t] = +!!x.get('b_Step12_Set');}
  return {x, p, seg: x.log.filter(s => s.t >= p), g2};
}
const b = scen(null); const u1 = L.firstAt(b.seg, s => s.out.out_LV_C1); const G = +Object.keys(b.g2).find(t => b.g2[t]);
console.log('base: g2-p', G - b.p, 'u1-p', u1 - b.p);
for (const d of [-3, -1, 0, 1, 2, 3, 10, 700]) {
  const e = G - b.p + d; const r = scen(e); const tt = r.p + e; const seg = r.seg.filter(s => s.t >= tt - 1);
  const firstF = seg.find(s => !s.out[K]); const reT = firstF ? seg.find(s => s.t > firstF.t && s.out[K]) : null;
  const lastFalseRun = firstF ? (reT ? reT.t - firstF.t : 'never re-issued') : 0;
  const end = r.seg.at(-1);
  const c1On = seg.filter(s => s.out.out_LV_C1); const c1Last = c1On.at(-1);
  console.log(`e=g2${d >= 0 ? '+' : ''}${d}: req FALSE from e${firstF ? (firstF.t - tt >= 0 ? '+' : '') + (firstF.t - tt) : ' never'}; re-issued ${reT ? 'at e+' + (reT.t - tt) + ' (FALSE ' + lastFalseRun + ' ms)' : firstF ? 'never within 9000 ms' : '-'}; C1 ON last at ${c1Last ? 'e+' + (c1Last.t - tt) : 'never'}; end (p+9000): stages ${end.stages.join('+') || '-'} statuses ${(end.statuses ?? []).join('+')} C1 ${+!!end.out.out_LV_C1} req ${+!!end.out[K]}`);
}
