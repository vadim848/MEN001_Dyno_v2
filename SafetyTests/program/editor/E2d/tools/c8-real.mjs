// Editor copy of architect repro/c8.mjs run on REAL candidate files (no in-memory fix); fix-mutants applied to the real v7.6 model.
// K-1 (review G1 v8): permit episode [f-300, f+10) overlapping the FIRST button of a BOTH attempt (released before the
// second button). E2d candidate 2276d773 (v7.5) vs v7.6 fix in memory:
//   GATE_SPOIL_R/S.AndIn1 := wire GATE_002 NO (any button held instead of both held),
//   NEW GATE_PF_SET safeOr (wire SPOIL_R, wire SPOIL_S) -> NEW STATE_PF safeRs (Set GATE_PF_SET, Reset wire RELEASE.TonOut),
//   NEW GATE_SPOIL_PF safeAnd (wire GATE_003, wire STATE_PF) -> GATE_029.OrIn6; GATE_029.OrIn7 deactivate.
// Order: SPOIL_R, SPOIL_S, GATE_PF_SET, STATE_PF, GATE_SPOIL_PF right before GATE_029.
import { cand, toRnd, boot, gesture } from '../../../architect/E2-status/repro/cand.mjs';
// --- editor harness: real candidate files (E2d-v7.5 frozen, E2d v7.6 built by the editor); mutants applied to the parsed REAL v7.6 model ---
const RPm = 'RndPhysicalCompact';
const cand2 = X => cand(X.name, X.mut);
function mutReal(m, mut) {
  const B = new Map(m.networks.flatMap(n => n.blocks).map(b => [b.path, b])); const out = p => B.get('//' + p).outputs[0];
  const port = (b, n) => B.get('//' + b).inputs.find(q => q.name === n);
  const unwire = p => { for (const s of p.sources) { const o = [...B.values()].flatMap(b => b.outputs).find(o => o.path === s); if (o) o.targets = o.targets.filter(t => t !== p.path); } p.sources = []; p.globals = []; };
  const setW = (p, src, c) => { unwire(p); p.channelInterface = 'Activated'; p.deactivate1 = c; const o = out(src); p.sources = [o.path]; o.targets.push(p.path); };
  if (mut === 's.GATE_SPOIL_R' || mut === 's.GATE_SPOIL_S') setW(port(RPm + '/' + mut.slice(2), 'AndIn1'), RPm + '/GATE_003', 'Break Contact (NC)');
  else if (mut === 'noOrIn6') { const p = port(RPm + '/GATE_029', 'OrIn6'); unwire(p); p.channelInterface = 'Deactivated'; delete p.deactivate1; }
  else if (mut === 'noReset') { const p = port(RPm + '/STATE_PF', 'Reset'); unwire(p); p.channelInterface = 'Activated'; p.deactivate1 = 'Break Contact (NC)'; p.globals = [{ resolvedName: 'in_False_SI2_CH8' }]; }
  else if (mut === 'noK2') { const p = port('SafeResumption/HLT_LV', 'AndIn4'); unwire(p); p.channelInterface = 'Deactivated'; delete p.deactivate1; }
  else if (mut === 'invK2') { port('SafeResumption/HLT_LV', 'AndIn4').deactivate1 = 'Make Contact (NO)'; }
  else throw Error('mut ' + mut);
}

const NC = 'Break Contact (NC)', NO = 'Make Contact (NO)';
const RP = 'RndPhysicalCompact';
export function fix(m, { mut } = {}) {
  const B = new Map(m.networks.flatMap(n => n.blocks).map(b => [b.path, b])); const out = p => B.get('//' + p).outputs[0];
  const net = n => m.networks.find(x => x.name === n);
  const setIn = (p, kind, src, c) => { p.channelInterface = 'Activated'; p.deactivate1 = c || NC; p.globals = []; p.sources = []; if (kind === 'g') p.globals = [{ resolvedName: src }]; else { const o = out(src); p.sources = [o.path]; o.targets.push(p.path); } };
  const unwire = p => { for (const s of p.sources) { const o = [...B.values()].flatMap(b => b.outputs).find(o => o.path === s); if (o) o.targets = o.targets.filter(t => t !== p.path); } p.sources = []; p.globals = []; };
  const nb = (name, fn, outName, ins) => { const path = `//${RP}/${name}`; const b = { type: 'x', name, functionName: fn, orderOfExecution: 0, path, inputs: [], outputs: [{ name: outName, path: path + '/' + outName, targets: [], sources: [], globals: [] }], parameters: [] };
    for (const [n, kind, src, c] of ins) { const p = { name: n, path: path + '/' + n, sources: [], targets: [], globals: [] }; setIn(p, kind, src, c); b.inputs.push(p); }
    net(RP).blocks.push(b); B.set(path, b); return b; };
  for (const s of ['GATE_SPOIL_R', 'GATE_SPOIL_S']) { const p = B.get(`//${RP}/${s}`).inputs.find(q => q.name === 'AndIn1'); unwire(p); if (mut === 's.' + s) setIn(p, 'w', `${RP}/GATE_003`); else setIn(p, 'w', `${RP}/GATE_002`, NO); }
  const g29 = B.get(`//${RP}/GATE_029`);
  for (const n of ['OrIn6', 'OrIn7']) { const p = g29.inputs.find(q => q.name === n); unwire(p); p.channelInterface = 'Deactivated'; delete p.deactivate1; }
  const pfs = nb('GATE_PF_SET', 'safeOr', 'OrOut', [['OrIn1', 'w', `${RP}/GATE_SPOIL_R`], ['OrIn2', 'w', `${RP}/GATE_SPOIL_S`]]);
  const pf = nb('STATE_PF', 'safeRs', 'RsOut', mut === 'noReset' ? [['Reset', 'g', 'in_False_SI2_CH8'], ['Set', 'w', `${RP}/GATE_PF_SET`]] : [['Reset', 'w', `${RP}/RELEASE`], ['Set', 'w', `${RP}/GATE_PF_SET`]]);
  const sp = nb('GATE_SPOIL_PF', 'safeAnd', 'AndOut', [['AndIn1', 'w', `${RP}/GATE_003`], ['AndIn2', 'w', `${RP}/STATE_PF`]]);
  if (mut !== 'noOrIn6') { const p = g29.inputs.find(q => q.name === 'OrIn6'); setIn(p, 'w', `${RP}/GATE_SPOIL_PF`); }
  const all = m.networks.flatMap(n => n.blocks).filter(b => b.orderOfExecution > 0 || [pfs, pf, sp].includes(b)).filter(b => ![pfs, pf, sp].includes(b)).sort((a, b) => a.orderOfExecution - b.orderOfExecution);
  const i = all.indexOf(g29); all.splice(i, 0, pfs, pf, sp); all.forEach((b, k) => b.orderOfExecution = k + 1);
}
const OFF = { in_Reset_PB: false, in_Relase_Door_PB: false };
// REL01-e2 geometry: blue at f, green at p=f+100, both held until Q+100, Q=p+1000, released at Q+101; episode [s, r)
function rel(variant, safe, sig, s0, r0, { tail = 3000 } = {}) {
  const r = cand2(variant); if (safe) boot(r); else { toRnd(r); } r.step(2400, OFF);
  const f = r.t + 301, p = f + 100, Q = p + 1000, rb = Q + 101, s = s0({ f, p, Q }), e = r0({ f, p, Q });
  const st0 = r.ph(); let up = null, emg = false;
  const set = v => Object.fromEntries(sig.map(k => [k, v]));
  while (r.t < rb + tail) { const t = r.t; const inp = {};
    if (t === s) Object.assign(inp, set(false)); if (t === e) Object.assign(inp, set(true));
    if (t === f) inp.in_Relase_Door_PB = true; if (t === p) inp.in_Reset_PB = true; if (t === rb) Object.assign(inp, OFF);
    r.step(1, inp); if (up === null && r.ph() !== st0) up = r.t - f; if (!r.get('b_EStop_Ok')) emg = true; }
  return `${st0} -> ${r.ph()}${up !== null ? ' (change at f+' + up + ')' : ''}${emg ? ' EMG' : ''}`;
}
if ((process.argv[1] ?? "").includes("c8-real.mjs")) {
const SAFE = ['in_LV_Connector_Interlock'], RND = ['in_InterLock_NC_1'];
const cases = [
  ['K-1 Safe LV conn [f-300,f+10)', true, SAFE, ({ f }) => f - 300, ({ f }) => f + 10],
  ['K-1 Safe both conn [f-300,f+10)', true, ['in_LV_Connector_Interlock', 'in_HV_Connector_Interlock'], ({ f }) => f - 300, ({ f }) => f + 10],
  ['K-1 R&D NC1 [f-300,f+10)', false, RND, ({ f }) => f - 300, ({ f }) => f + 10],
  ['K-1 R&D NC1+NC2 [f-300,f+10)', false, ['in_InterLock_NC_1', 'in_InterLock_NC_2'], ({ f }) => f - 300, ({ f }) => f + 10],
  ['R&D NC1 [f,p+300)', false, RND, ({ f }) => f, ({ p }) => p + 300],
  ['R&D NC1 [p+500,p+999)', false, RND, ({ p }) => p + 500, ({ p }) => p + 999],
  ['Safe LV [p+1,p+2)', true, SAFE, ({ p }) => p + 1, ({ p }) => p + 2],
  ['accept: R&D NC1 r<=f-1 [f-300,f-1)', false, RND, ({ f }) => f - 300, ({ f }) => f - 1],
  ['accept: Safe LV r<=f-1 [f-300,f-1)', true, SAFE, ({ f }) => f - 300, ({ f }) => f - 1],
  ['obs: R&D NC1 r=f', false, RND, ({ f }) => f - 300, ({ f }) => f],
  ['control: Safe NC1 [p+500,p+999) accepted (V14-Q7)', true, RND, ({ p }) => p + 500, ({ p }) => p + 999],
  ['no episode Safe', true, SAFE, () => -1, () => -1],
  ['no episode R&D', false, RND, () => -1, () => -1],
];
const V = [['E2d 2276d773', { name: 'E2d-v7.5' }], ['E2d+v7.6', { name: 'E2d' }]]; // real files: frozen v7.5 / editor-built v7.6
for (const [n, safe, sig, s, e] of cases) for (const [vn, v] of V) console.log(n.padEnd(52), vn.padEnd(14), rel(v, safe, sig, s, e));
// regressions: singles with permit lost must still work (V14-Q21a, Q-ARCH-10), new attempt after full clearing
const rndGreenCoverOpen = v => { const r = cand2(v); toRnd(r); r.step(2100); r.step(1, { in_InterLock_NC_1: false }); gesture(r, { green: true }); r.step(1500); return r.ph(); };
const rndBlueCoverOpen = v => { const r = cand2(v); toRnd(r); r.step(2100); r.step(1, { in_InterLock_NC_1: false }); r.step(1, { in_Relase_Door_PB: true }); r.step(700); return 'UL=' + (+r.get('out_Door_Unlock_Solonoeid')); };
const blueThenBothLater = (v, gap) => { const r = cand2(v); toRnd(r); r.step(2100); r.step(1, { in_InterLock_NC_1: false }); r.step(1, { in_Relase_Door_PB: true }); r.step(100); r.step(1, { in_Relase_Door_PB: false, in_InterLock_NC_1: true }); r.step(gap); gesture(r, { green: true, blue: true, ms: 1100 }); r.step(1500); return r.ph(); };
const safeGreenConnLost = v => { const r = cand2(v); boot(r); r.step(1, { in_LV_Connector_Interlock: false }); gesture(r, { green: true }); r.step(100); const a = r.ph(); r.step(1, { in_LV_Connector_Interlock: true }); r.step(2200); gesture(r, { green: true, blue: true, ms: 1100 }); r.step(1500); return `${a}; after restore+2.2 s BOTH: ${r.ph()}`; };
for (const [vn, v] of V) {
  console.log('R&D cover open, green single'.padEnd(52), vn.padEnd(14), rndGreenCoverOpen(v));
  console.log('R&D cover open, blue single'.padEnd(52), vn.padEnd(14), rndBlueCoverOpen(v));
  console.log('R&D blue 100ms cover open, release, BOTH after 1000ms'.padEnd(52), vn.padEnd(14), blueThenBothLater(v, 1000));
  console.log('R&D blue 100ms cover open, release, BOTH after 2100ms'.padEnd(52), vn.padEnd(14), blueThenBothLater(v, 2100));
  console.log('Safe LV lost, green single, restore, BOTH'.padEnd(52), vn.padEnd(14), safeGreenConnLost(v));
}
// mutants of the fix (K-1 R&D / Safe as killer)
for (const mut of ['s.GATE_SPOIL_R', 's.GATE_SPOIL_S', 'noOrIn6', 'noReset']) {
  console.log(`mut ${mut}`.padEnd(30), 'K-1 R&D:', rel({ name: 'E2d', mut: m => mutReal(m, mut) }, false, RND, ({ f }) => f - 300, ({ f }) => f + 10), '| K-1 Safe:', rel({ name: 'E2d', mut: m => mutReal(m, mut) }, true, SAFE, ({ f }) => f - 300, ({ f }) => f + 10), mut === 'noReset' ? '| blue+BOTH 2100: ' + blueThenBothLater({ name: 'E2d', mut: m => mutReal(m, mut) }, 2100) : '');
}

}
