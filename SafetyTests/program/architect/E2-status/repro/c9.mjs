// K-2 (WDG-02/MOD-001) attribution + fix, TD-15 check. Base: E2d 2276d773 (v7.5). v7.6 = c8 fix (K-1) + K-2 fix:
//   SafeResumption/HLT_LV.AndIn4 := b_Step_RnD (NC)  - HLT consumes the attempt (GATE_030.OrIn6) only in R&D.
import { cand, toRnd, boot } from './cand.mjs';
import { fix as fixK1 } from './c8.mjs';
const NC = 'Break Contact (NC)';
const fixK2 = m => { const b = m.networks.flatMap(n => n.blocks).find(b => b.path === '//SafeResumption/HLT_LV'); const p = b.inputs.find(q => q.name === 'AndIn4');
  if (p.channelInterface === 'Activated') throw Error('AndIn4 busy'); p.channelInterface = 'Activated'; p.deactivate1 = NC; p.sources = []; p.globals = [{ resolvedName: 'b_Step_RnD' }]; };
const fixK2inv = m => { fixK2(m); const p = m.networks.flatMap(n => n.blocks).find(b => b.path === '//SafeResumption/HLT_LV').inputs.find(q => q.name === 'AndIn4'); p.deactivate1 = 'Make Contact (NO)'; };
const V = { base: null, k1: m => fixK1(m), v76: m => { fixK1(m); fixK2(m); }, mutInv: m => { fixK1(m); fixK2inv(m); } };
// note: k = scan index relative to p (inputs applied in scan k are seen in scan k)
const OFF = { in_Reset_PB: false, in_Relase_Door_PB: false };
// Safe->R&D by BOTH (blue f, green p=f+100, held 1100 ms); events: map t->inputs (t relative to p)
function safeUp(v, ev = {}, { n = 40000 } = {}) {
  const r = cand('E2d', V[v]); boot(r); r.step(2400, OFF); const p = r.t + 401; const f = p - 100;
  const tr = []; while (r.t < p + n) { const k = r.t - p, inp = {}; if (r.t === f) inp.in_Relase_Door_PB = true; if (k === 0) inp.in_Reset_PB = true; if (k === 1101) Object.assign(inp, OFF);
    if (ev[k]) Object.assign(inp, ev[k]); r.step(1, inp); tr.push({ k: r.t - p - 1, s12: r.get('b_Step12'), rnd: r.get('b_Step_RnD'), s1: r.get('b_Step1'), c1: r.get('out_LV_C1'), fbk: r.get('in_LV_C1_FBK'), eok: r.get('b_EStop_Ok') }); }
  return tr;
}
const first = (tr, k, from = -1e9) => tr.find(x => x.k >= from && x[k])?.k;
const ref = safeUp('base'); const A = first(ref, 's12'); const tf = first(ref, 'fbk');
console.log(`no-event Safe->R&D (base): A(b_Step12)=p+${A}, C1 ON p+${first(ref, 'c1')}, C1_FBK p+${tf}, R&D p+${first(ref, 'rnd')}`);
const show = (n, tr) => console.log(n.padEnd(62), `S12 ${first(tr, 's12') ?? '-'} C1 ${first(tr, 'c1') ?? '-'} R&D ${first(tr, 'rnd') ?? '-'} end ${['s1', 's12', 'rnd'].filter(k => tr.at(-1)[k]).join('+') || '?'}${tr.some(x => !x.eok) ? ' EMG' : ''}`);
console.log('== K-2 (WDG-02): LV Faulty TRUE from t, cleared at t_f+5000 (R&D expected) / held (30 s rollback = E6, not implemented)');
for (const v of ['base', 'k1', 'v76']) for (const [n, t0] of [['p-200', -200], ['p+900', 900], ['A', A], ['A+1', A + 1]]) {
  const ON = { in_LV_Faulty_FBK: true }, OFFF = { in_LV_Faulty_FBK: false };
  show(`${v} Faulty from ${n}, cleared t_f+5000`, safeUp(v, { [t0]: ON, [tf + 5000]: OFFF }, { n: tf + 8000 }));
  show(`${v} Faulty from ${n}, held`, safeUp(v, { [t0]: ON }, { n: tf + 8000 }));
}
// HLT-01 regression: steady R&D, LV Faulty -> leaves R&D (HLT); R&D->Run with LV Faulty refused/aborted as before
const hlt = v => { const r = cand('E2d', V[v]); toRnd(r); r.step(2100); r.step(1, { in_LV_Faulty_FBK: true }); r.step(4000); return r.ph() + ' C1=' + (+r.get('out_LV_C1')); };
for (const v of ['base', 'k1', 'v76', 'mutInv']) console.log(`HLT-01 steady R&D, LV Faulty -> (${v})`.padEnd(62), hlt(v));
// TD-15: Safe->R&D, connector FALSE from c (held): no C1 ON in any scan >= c
console.log('== TD-15 Safe->R&D: LV connector FALSE from c (held)');
for (const v of ['base', 'v76']) for (const c of [A - 1, A, A + 1]) { const tr = safeUp(v, { [c]: { in_LV_Connector_Interlock: false } }, { n: 6000 }); const up = tr.filter(x => x.k >= c && x.c1).length;
  console.log(`${v} c=A${c - A >= 0 ? '+' : ''}${c - A}`.padEnd(20), `C1 ON scans >= c: ${up}`, `S12 ${first(tr, 's12') ?? '-'}`, tr.some(x => !x.eok) ? `EMG at p+${tr.find(x => !x.eok).k}` : 'no EMG'); }
// TD-15 R&D->Run: NC1 FALSE from c, A = first recRndC_SU on the no-event trace
function rndUp(v, ev = {}, n = 6000) { const r = cand('E2d', V[v]); toRnd(r); r.step(2400, OFF); const p = r.t + 401, f = p - 100; const tr = [];
  while (r.t < p + n) { const k = r.t - p, inp = {}; if (r.t === f) inp.in_Relase_Door_PB = true; if (k === 0) inp.in_Reset_PB = true; if (k === 1101) Object.assign(inp, OFF); if (ev[k]) Object.assign(inp, ev[k]);
    r.step(1, inp); tr.push({ k: r.t - p - 1, su: r.get('recRndC_SU'), c2: r.get('out_HV_C2'), sto: r.get('STO_DR1') || r.get('STO_DR2'), eok: r.get('b_EStop_Ok') }); } return tr; }
const rr = rndUp('base'); const Ar = first(rr, 'su');
console.log(`== TD-15 R&D->Run: A(recRndC_SU)=p+${Ar}, C2 ON p+${first(rr, 'c2')}, STO released p+${first(rr, 'sto')}`);
for (const v of ['base', 'v76']) for (const c of [Ar - 1, Ar, Ar + 1, Ar + 2]) { const tr = rndUp(v, { [c]: { in_InterLock_NC_1: false } });
  console.log(`${v} c=A${c - Ar >= 0 ? '+' : ''}${c - Ar}`.padEnd(20), `C2 ON scans >= c: ${tr.filter(x => x.k >= c && x.c2).length}, STO released scans >= c: ${tr.filter(x => x.k >= c && x.sto).length}`, tr.some(x => !x.eok) ? `EMG at p+${tr.find(x => !x.eok).k}` : 'no EMG'); }
// TD-15 legacy PLC (1,0) Safe->R&D: connector FALSE from c
function plcUp(v, ev = {}, n = 4000) { const r = cand('E2d', V[v]); boot(r); r.step(2400, OFF); const p = r.t + 1; const tr = [];
  while (r.t < p + n) { const k = r.t - p, inp = {}; if (k === 0) inp.inPLC_RnD_Mode = true; if (k === 600) inp.inPLC_RnD_Mode = false; if (ev[k]) Object.assign(inp, ev[k]);
    r.step(1, inp); tr.push({ k: r.t - p - 1, s12: r.get('b_Step12'), c1: r.get('out_LV_C1'), eok: r.get('b_EStop_Ok') }); } return tr; }
const pr = plcUp('base'); const Ap = first(pr, 's12');
console.log(`== TD-15 legacy PLC (1,0) Safe->R&D: A(b_Step12)=t0+${Ap}, C1 ON t0+${first(pr, 'c1')}`);
for (const v of ['base', 'v76']) for (const c of [Ap - 1, Ap, Ap + 1]) { const tr = plcUp(v, { [c]: { in_LV_Connector_Interlock: false } });
  console.log(`${v} c=A${c - Ap >= 0 ? '+' : ''}${c - Ap}`.padEnd(20), `C1 ON scans >= c: ${tr.filter(x => x.k >= c && x.c1).length}`, tr.some(x => !x.eok) ? `EMG at t0+${tr.find(x => !x.eok).k}` : 'no EMG'); }
