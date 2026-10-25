// Editor copy of architect repro/c10.mjs run on REAL candidate files (no in-memory fix).
// XPH-01 (MOD-004, Q-RC-08, BTN-001/002): gesture started in another phase must not execute.
// Base: E2d v7.6 candidate (e4cf767e). v7.7 in memory:
//   NEW RndPhysicalCompact/GATE_PHASE safeOr (b_Step12, b_Step3) -> wire GATE_PF_SET.OrIn3 (STATE_PF Set; Reset RELEASE.TonOut dominant)
//   order: GATE_PHASE right before GATE_PF_SET. (c10.v1-spoilx.out.txt = first variant with SU/SG terms and an AND with any-button)
import { cand, toRnd, boot, gesture } from '../../../architect/E2-status/repro/cand.mjs';
const NC = 'Break Contact (NC)', NO = 'Make Contact (NO)', RP = 'RndPhysicalCompact';
export function fix(m, { mut } = {}) {
  const B = new Map(m.networks.flatMap(n => n.blocks).map(b => [b.path, b])); const out = p => B.get('//' + p).outputs[0];
  const net = m.networks.find(x => x.name === RP);
  const setIn = (p, kind, src, c) => { p.channelInterface = 'Activated'; p.deactivate1 = c || NC; p.globals = []; p.sources = []; if (kind === 'g') p.globals = [{ resolvedName: src }]; else { const o = out(src); p.sources = [o.path]; o.targets.push(p.path); } };
  const nb = (name, fn, outName, ins) => { const path = `//${RP}/${name}`; const b = { type: 'x', name, functionName: fn, orderOfExecution: 0, path, inputs: [], outputs: [{ name: outName, path: path + '/' + outName, targets: [], sources: [], globals: [] }], parameters: [] };
    for (const [n, kind, src, c] of ins) { const p = { name: n, path: path + '/' + n, sources: [], targets: [], globals: [] }; setIn(p, kind, src, c); b.inputs.push(p); } net.blocks.push(b); B.set(path, b); return b; };
  const phIns = [['OrIn1', 'g', 'b_Step12'], ['OrIn2', 'g', 'b_Step3']].filter(([n]) => mut !== 'ph.' + n);
  const ph = nb('GATE_PHASE', 'safeOr', 'OrOut', phIns);
  if (mut !== 'pfset.OrIn3') { const p = B.get(`//${RP}/GATE_PF_SET`).inputs.find(q => q.name === 'OrIn3') ?? (() => { const q = { name: 'OrIn3', path: `//${RP}/GATE_PF_SET/OrIn3`, sources: [], targets: [], globals: [] }; B.get(`//${RP}/GATE_PF_SET`).inputs.push(q); return q; })(); setIn(p, 'w', `${RP}/GATE_PHASE`); }
  const all = m.networks.flatMap(n => n.blocks).filter(b => b !== ph).sort((a, b) => a.orderOfExecution - b.orderOfExecution);
  const i = all.indexOf(B.get(`//${RP}/GATE_PF_SET`)); all.splice(i, 0, ph); all.forEach((b, k) => b.orderOfExecution = k + 1);
}

// --- editor harness: real files; v7.6 = frozen candidates/E2d-v7.6 (e4cf767e), v7.7 = candidates/E2d built by the editor; fix-mutants on the real v7.7 model ---
const cand2 = X => cand(X.name, X.mut);
function mutReal(m, mut) {
  const B = new Map(m.networks.flatMap(n => n.blocks).map(b => [b.path, b]));
  const port = (b, n) => B.get('//' + b).inputs.find(q => q.name === n);
  const deact = p => { for (const s of p.sources) { const o = [...B.values()].flatMap(b => b.outputs).find(o => o.path === s); if (o) o.targets = o.targets.filter(t => t !== p.path); } p.sources = []; p.globals = []; p.channelInterface = 'Deactivated'; delete p.deactivate1; };
  if (mut === 'ph.OrIn1' || mut === 'ph.OrIn2') deact(port(RP + '/GATE_PHASE', mut.slice(3)));
  else if (mut === 'pfset.OrIn3') deact(port(RP + '/GATE_PF_SET', 'OrIn3'));
  else throw Error('mut ' + mut);
}
const V = { 'v7.6': { name: 'E2d-v7.6' }, 'v7.7': { name: 'E2d' }, 'mut.ph.OrIn1': { name: 'E2d', mut: m => mutReal(m, 'ph.OrIn1') }, 'mut.ph.OrIn2': { name: 'E2d', mut: m => mutReal(m, 'ph.OrIn2') }, 'mut.pfset.OrIn3': { name: 'E2d', mut: m => mutReal(m, 'pfset.OrIn3') } };
const OFF = { in_Reset_PB: false, in_Relase_Door_PB: false };
const obs = r => ({ su: r.get('recRndC_SU'), c2: r.get('out_HV_C2'), sto: r.get('STO_DR1') || r.get('STO_DR2'), run: r.get('b_Step3'), rnd: r.get('b_Step_RnD'), s12: r.get('b_Step12'), s1: r.get('b_Step1'), eok: r.get('b_EStop_Ok') });
// Safe->R&D by legacy (1,0) at t0; gesture: first button at f (blue or green), second at f+d, held 1100 ms from second
function xph(v, { f, d = 0, greenFirst = false, f2 = null, n = 7000 } = {}) {
  const r = cand2(V[v]); boot(r); r.step(2400, OFF); const t0 = r.t; const tr = [];
  const [b1, b2] = greenFirst ? ['in_Reset_PB', 'in_Relase_Door_PB'] : ['in_Relase_Door_PB', 'in_Reset_PB'];
  const rel = f == null ? null : f + d + 1100; let rel2 = null;
  for (let k = 0; k < n; k++) { const inp = {}; if (k === 0) inp.inPLC_RnD_Mode = true; if (k === 600) inp.inPLC_RnD_Mode = false;
    if (k === f) inp[b1] = true; if (k === f + d) inp[b2] = true; if (k === rel) Object.assign(inp, OFF);
    if (f2 != null) { if (k === f2) inp.in_Relase_Door_PB = true; if (k === f2 + 100) inp.in_Reset_PB = true; if (k === f2 + 1200) { Object.assign(inp, OFF); rel2 = k; } }
    r.step(1, inp); tr.push({ k, ...obs(r) }); }
  return tr;
}
const first = (tr, key, from = 0) => tr.find(x => x.k >= from && x[key])?.k;
const x0 = xph('v7.6', {}); const A1 = first(x0, 's12'), R = first(x0, 'rnd');
console.log(`X0 (legacy (1,0), no gesture): A1=t0+${A1}, R=t0+${R}, SU ${first(x0, 'su') ?? '-'}, Run ${first(x0, 'run') ?? '-'}`);
const res = tr => `R&D at ${first(tr, 'rnd') ?? '-'} | SU ${first(tr, 'su') ?? '-'} C2 ${first(tr, 'c2') ?? '-'} STO ${first(tr, 'sto') ?? '-'} Run ${first(tr, 'run') ?? '-'}${tr.some(x => !x.eok) ? ' EMG' : ''}`;
for (const v of ['v7.6', 'v7.7']) {
  console.log('==', v);
  for (const [n, f] of [['A1+10', A1 + 10], ['A1+300', A1 + 300], ['R-1', R - 1], ['R', R], ['R+1 (released >= 2000 before)', R + 1]])
    for (const d of [0, 250]) for (const gf of [false, true]) console.log(`f=${n} d=${d} ${gf ? 'green' : 'blue'}-first`.padEnd(48), res(xph(v, { f, d, greenFirst: gf })));
  console.log(`f=R-100 d=250 (second after R)`.padEnd(48), res(xph(v, { f: R - 100, d: 250 })));
  console.log(`f=A1+10 held through R +3000 (d=0, hold 1100+)`.padEnd(48), res(xph(v, { f: A1 + 10, d: 0, n: R + 6000 })));
  const g = A1 + 10 + 1100; // release scan of the in-phase gesture (f=A1+10, d=0)
  for (const gap of [1999, 2000, 2001]) console.log(`repeat: in-phase f=A1+10, new attempt at g+${gap}`.padEnd(48), res(xph(v, { f: A1 + 10, d: 0, f2: g + gap, n: g + gap + 4000 })));
}
// reverse directions (base v7.6 vs v7.7)
function rev(v, kind, at) { const r = cand2(V[v]); toRnd(r); r.step(2100); if (kind === 'run') { r.step(1, { in_Reset_PB: true, in_Relase_Door_PB: true }); r.step(1100); r.step(1, OFF); r.step(3000); r.step(2100); }
  const st0 = r.ph(); const P = r.t; const tr = [];
  for (let k = 0; k < 9000; k++) { const inp = {}; if (k === 0) inp.in_Reset_PB = true; if (k === 600) inp.in_Reset_PB = false; if (k === at) { inp.in_Reset_PB = true; inp.in_Relase_Door_PB = true; } if (k === at + 1100) Object.assign(inp, OFF);
    r.step(1, inp); tr.push({ k, ...obs(r), ph: r.ph() }); }
  const phs = []; for (const x of tr) if (!phs.length || phs.at(-1)[1] !== x.ph) phs.push([x.k, x.ph]);
  return `${st0} green@0 (600 ms), BOTH@${at}: ${phs.map(([k, p]) => `${p}@${k}`).join(' ')}${tr.some(x => !x.eok) ? ' EMG' : ''}`; }
console.log('== reverse directions');
for (const v of ['v7.6', 'v7.7']) {
  for (const at of [650, 900]) console.log(`${v} Run->R&D:`.padEnd(16), rev(v, 'run', at));
  for (const at of [650, 1500, 3000]) console.log(`${v} R&D->Safe:`.padEnd(16), rev(v, 'rnd', at));
}
// legacy (0,1) Run->R&D descent with BOTH pressed during the descent (stage S3), qualifying after arrival in R&D
function leg01(v, at, { hold01 = 3000 } = {}) { const r = cand2(V[v]); toRnd(r); r.step(2100); r.step(1, { in_Reset_PB: true, in_Relase_Door_PB: true }); r.step(1100); r.step(1, OFF); r.step(3000); r.step(2400);
  const st0 = r.ph(); const tr = [];
  for (let k = 0; k < 8000; k++) { const inp = {}; if (k === 0) inp.inPLC_RnD_Mode_2 = true; if (k === hold01) inp.inPLC_RnD_Mode_2 = false; if (k === at) { inp.in_Reset_PB = true; inp.in_Relase_Door_PB = true; } if (k === at + 1100) Object.assign(inp, OFF);
    r.step(1, inp); tr.push({ k, ...obs(r), ph: r.ph() }); }
  const phs = []; for (const x of tr) if (!phs.length || phs.at(-1)[1] !== x.ph) phs.push([x.k, x.ph]);
  return `${st0} PLC (0,1)@0..${hold01}, BOTH@${at}: ${phs.map(([k, p]) => `${p}@${k}`).join(' ')} | SU ${first(tr, 'su', 1) ?? '-'}${tr.some(x => !x.eok) ? ' EMG' : ''}`; }
console.log('== legacy (0,1) descent + BOTH in descent');
for (const v of ['v7.6', 'v7.7', 'mut.ph.OrIn2', 'mut.pfset.OrIn3']) for (const at of [50, 300]) console.log(`${v}`.padEnd(16), leg01(v, at));
console.log('== mutants on XPH f=A1+10 d=0');
for (const v of ['mut.ph.OrIn1', 'mut.ph.OrIn2', 'mut.pfset.OrIn3']) console.log(`${v}`.padEnd(16), res(xph(v, { f: A1 + 10, d: 0 })));
// per-scan regression v7.6 vs v7.7 (outputs and stages) on scenarios without in-phase gestures
const OUTS = ['out_LV_C1', 'out_HV_C2', 'STO_DR1', 'STO_DR2', 'out_Door_Unlock_Solonoeid', 'b_Step1', 'b_Step12', 'b_Step_RnD', 'b_Step3', 'b_Step4', 'b_EStop_Ok', 'recRndC_SU'];
function trace(v, script) { const r = cand2(V[v]); const tr = []; script(r, () => tr.push(OUTS.map(o => +r.get(o)).join(''))); return tr; }
const rec = (r, push, n, inp) => { if (inp) r.setInputs(inp); for (let i = 0; i < n; i++) { r.step(1); push(); } };
const G = (r, push, keys, ms) => { rec(r, push, 1, keys); rec(r, push, ms); rec(r, push, 1, OFF); };
const scen = {
  fullCycle: (r, push) => { boot(r); rec(r, push, 2400); G(r, push, { in_Reset_PB: true, in_Relase_Door_PB: true }, 1100); rec(r, push, 4500); G(r, push, { in_Reset_PB: true, in_Relase_Door_PB: true }, 1100); rec(r, push, 4500); G(r, push, { in_Reset_PB: true }, 600); rec(r, push, 4500); G(r, push, { in_Reset_PB: true }, 600); rec(r, push, 6000); G(r, push, { in_Relase_Door_PB: true }, 700); rec(r, push, 2000); },
  legacy10ThenBothAfterClearing: (r, push) => { boot(r); rec(r, push, 2400); rec(r, push, 600, { inPLC_RnD_Mode: true }); rec(r, push, 2500, { inPLC_RnD_Mode: false }); G(r, push, { in_Reset_PB: true, in_Relase_Door_PB: true }, 1100); rec(r, push, 4000); },
  rndCoverOpenGreenBlue: (r, push) => { boot(r); rec(r, push, 2400); G(r, push, { in_Reset_PB: true, in_Relase_Door_PB: true }, 1100); rec(r, push, 4500); rec(r, push, 1, { in_InterLock_NC_1: false }); G(r, push, { in_Relase_Door_PB: true }, 700); rec(r, push, 2200); G(r, push, { in_Reset_PB: true }, 600); rec(r, push, 4000); },
  runEstopPlc: (r, push) => { boot(r); rec(r, push, 2400); G(r, push, { in_Reset_PB: true, in_Relase_Door_PB: true }, 1100); rec(r, push, 4500); G(r, push, { in_Reset_PB: true, in_Relase_Door_PB: true }, 1100); rec(r, push, 4500); rec(r, push, 3000, { in_Estop_PLC: true }); rec(r, push, 9000, { in_Estop_PLC: false }); },
  startingRunNC1: (r, push) => { boot(r); rec(r, push, 2400); G(r, push, { in_Reset_PB: true, in_Relase_Door_PB: true }, 1100); rec(r, push, 4500); rec(r, push, 1, { in_Reset_PB: true, in_Relase_Door_PB: true }); rec(r, push, 1050); rec(r, push, 1, { in_InterLock_NC_1: false }); rec(r, push, 60, OFF); rec(r, push, 9000); },
  hlt01: (r, push) => { boot(r); rec(r, push, 2400); G(r, push, { in_Reset_PB: true, in_Relase_Door_PB: true }, 1100); rec(r, push, 4500); rec(r, push, 4000, { in_LV_Faulty_FBK: true }); },
};
console.log('== per-scan regression v7.6 vs v7.7');
for (const [n, s] of Object.entries(scen)) { const a = trace('v7.6', s), b = trace('v7.7', s); const i = a.findIndex((x, j) => x !== b[j]); console.log(n.padEnd(32), a.length === b.length && i < 0 ? `identical (${a.length} scans)` : `DIFF at scan ${i}: ${a[i]} vs ${b[i]}`); }
