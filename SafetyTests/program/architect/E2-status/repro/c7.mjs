// v7.5 (question 76 = B): legacy PLC (1,1) R&D->Run disabled. E2d candidate (v7.4.1) = base/mutant M-E2d-23;
// v7.5 applied in-memory: Network12/FBOr1.OrIn2 deactivated (FBAnd8/9/10 and FBOrFbk10C2 then drive nothing).
import { cand, toRnd, boot, gesture } from './cand.mjs';
const v75 = m => { const B = new Map(m.networks.flatMap(n => n.blocks).map(b => [b.path, b]));
  const p = B.get('//Network12/FBOr1').inputs.find(q => q.name === 'OrIn2'); if (p.channelInterface !== 'Activated') throw Error('OrIn2 not active');
  p.channelInterface = 'Deactivated'; p.sources = []; p.globals = []; };
const M11 = { inPLC_RnD_Mode: true, inPLC_RnD_Mode_2: true }, M00 = { inPLC_RnD_Mode: false, inPLC_RnD_Mode_2: false };
const watch = (r, n, extra) => { const s = { c2: 0, sto: 0, run: 0, c2First: null, ph: new Set() }; for (let i = 0; i < n; i++) { if (extra) extra(r, i); r.step(1);
  if (r.get('out_HV_C2')) { s.c2++; s.c2First ??= i; } if (r.get('STO_DR1') || r.get('STO_DR2')) s.sto++; if (r.get('b_Step3')) s.run++; s.ph.add(r.ph()); } s.ph = [...s.ph].join(','); return s; };
const show = (name, s) => console.log(name.padEnd(58), `C2 ${s.c2} (first +${s.c2First ?? '-'}) STO ${s.sto} Run ${s.run} phases ${s.ph}`);
for (const [tag, mut] of [['E2d v7.4.1 (= mutant M-E2d-23)', null], ['E2d + v7.5', v75]]) {
  console.log('==', tag);
  { const r = cand('E2d', mut); toRnd(r); r.step(2100); show('A R&D, PLC (1,1) held 5 s', watch(r, 5000, (r, i) => { if (i === 0) r.setInputs(M11); })); }
  { const r = cand('E2d', mut); toRnd(r); r.step(2100); show('B R&D, PLC (1,1) pulse 300 ms (KF-5)', watch(r, 5000, (r, i) => { if (i === 0) r.setInputs(M11); if (i === 300) r.setInputs(M00); })); }
  { const r = cand('E2d', mut); toRnd(r); r.step(2100);
    show('C FFS: R&D, (1,1) held, NC1 FALSE 200 ms at +1, restored', watch(r, 5000, (r, i) => { if (i === 0) r.setInputs(M11); if (i === 1) r.setInputs({ in_InterLock_NC_1: false }); if (i === 201) r.setInputs({ in_InterLock_NC_1: true }); })); }
  { const r = cand('E2d', mut); toRnd(r); r.step(2100); r.step(1, { in_Reset_PB: true, in_Relase_Door_PB: true });
    show('D positive: R&D, BOTH 1.1 s -> Run', watch(r, 5000, (r, i) => { if (i === 1100) r.setInputs({ in_Reset_PB: false, in_Relase_Door_PB: false }); })); }
  { const r = cand('E2d', mut); boot(r); const s = watch(r, 3000, (r, i) => { if (i === 0) r.setInputs({ inPLC_RnD_Mode: true }); if (i === 600) r.setInputs(M00); }); show('E positive: Safe, PLC (1,0) 600 ms -> R&D (legacy kept)', s); console.log('   end phase', r.ph()); }
  { const r = cand('E2d', mut); toRnd(r); r.step(2100); r.step(1, { in_Reset_PB: true, in_Relase_Door_PB: true }); r.step(1100); r.step(1, { in_Reset_PB: false, in_Relase_Door_PB: false }); r.step(3000);
    const ph0 = r.ph(); r.step(2100); r.setInputs(M11); r.step(1, { in_Reset_PB: true }); r.step(600); r.step(1, { in_Reset_PB: false });
    const s = watch(r, 10000, (r, i) => { if (i === 9400) r.setInputs(M00); }); show(`F KF-3-DESC: Run(${ph0}) green down, (1,1) held 10 s`, s); console.log('   end phase', r.ph()); }
}
