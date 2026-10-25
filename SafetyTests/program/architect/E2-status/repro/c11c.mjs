// mutants of the v7.8 WIN_C1_IN block: AndIn1 deactivated (window from C1 command alone), AndIn2 inverted
import { cand, toRnd, boot } from './cand.mjs';
import { fix } from './c11b.mjs';
const NO = 'Make Contact (NO)';
const mut = kind => m => { fix(m); const b = m.networks.flatMap(n => n.blocks).find(x => x.path === '//Network11/WIN_C1_IN');
  if (kind === 'noIn1') { const p = b.inputs.find(q => q.name === 'AndIn1'); b.inputs = b.inputs.filter(q => q !== p); }
  if (kind === 'inv2') b.inputs.find(q => q.name === 'AndIn2').deactivate1 = NO; };
const OFF = { in_Reset_PB: false, in_Relase_Door_PB: false };
for (const [n, v] of [['v7.8', m => fix(m)], ['mut noIn1', mut('noIn1')], ['mut inv2', mut('inv2')]]) {
  const r = cand('E2d', v); toRnd(r); const a = r.ph(); r.step(2100); r.step(1, { in_Reset_PB: true, in_Relase_Door_PB: true }); r.step(1100); r.step(1, OFF); r.step(3000); const b = r.ph(); r.step(3000); console.log(n.padEnd(10), `after Safe->R&D: ${a}; R&D->Run +3 s: ${b}; +6 s: ${r.ph()}`); }
