// v7.8 combined probes on E2d v7.7 (c2f9ccd7) [+ c11b WIN_C1_IN fix]:
//  L3: NEW Network8/FBOrS5 safeOr (b_Step5, b_Step5_Set) -> N8/FBAnd1.AndIn1
//  E2-02-R: NEW SafeResumption/HLT_DESC_SET safeAnd (in_LV_Faulty_FBK, linkRunDownOwner, in_False NO), HLT_MEM safeRs (Reset b_Step1, Set HLT_DESC_SET),
//           HLT_LV_SRC safeOr (in_LV_Faulty_FBK, HLT_MEM) -> HLT_LV.AndIn1
//  EMG6-FBK: NEW Network1/RESTART_OK safeAnd (in_Reset_PB, in_LV_C1_FBK NO, in_HV_C2_FBK NO) -> FBEstop1.Restart
//  M-E2a-32/33/34 rebind-global on E2a-RC (FBOr5.OrIn2 -> recRndC_T / b_Step3_Set_2 / recRndC_SU)
import { cand, toRnd, boot } from './cand.mjs';
import { fix as fixWin } from './c11b.mjs';
const NC = 'Break Contact (NC)', NO = 'Make Contact (NO)';
const OFF = { in_Reset_PB: false, in_Relase_Door_PB: false };
const section = process.argv[2] ?? 'all';
function api(m) {
  const B = new Map(m.networks.flatMap(n => n.blocks).map(b => [b.path, b]));
  const out = p => B.get('//' + p).outputs[0];
  const mkIn = (path, n, kind, src, c) => { const p = { name: n, path: `${path}/${n}`, sources: [], targets: [], globals: [], channelInterface: 'Activated', deactivate1: c || NC }; if (kind === 'g') p.globals = [{ resolvedName: src }]; else { const o = out(src); p.sources = [o.path]; o.targets.push(p.path); } return p; };
  const nb = (net, name, fn, outName, ins, before) => { const path = `//${net}/${name}`; const b = { type: 'x', name, functionName: fn, orderOfExecution: 0, path, inputs: ins.map(([n, k, s, c]) => mkIn(path, n, k, s, c)), outputs: [{ name: outName, path: `${path}/${outName}`, targets: [], sources: [], globals: [] }], parameters: [] };
    m.networks.find(x => x.name === net).blocks.push(b); B.set(path, b);
    const all = m.networks.flatMap(n => n.blocks).filter(x => x !== b).sort((a, c) => a.orderOfExecution - c.orderOfExecution); all.splice(all.indexOf(B.get('//' + before)), 0, b); all.forEach((x, k) => x.orderOfExecution = k + 1); return b; };
  const rebindWire = (blockPath, port, srcBlock) => { const p = B.get('//' + blockPath).inputs.find(q => q.name === port); for (const s of p.sources) { const o = [...B.values()].flatMap(b => b.outputs).find(o => o.path === s); if (o) o.targets = o.targets.filter(t => t !== p.path); }
    p.globals = []; const o = out(srcBlock); p.sources = [o.path]; o.targets.push(p.path); p.channelInterface = p.channelInterface ?? 'Activated'; };
  return { B, nb, rebindWire };
}
export const fixL3 = m => { const a = api(m); a.nb('Network8', 'FBOrS5', 'safeOr', 'OrOut', [['OrIn1', 'g', 'b_Step5'], ['OrIn2', 'g', 'b_Step5_Set']], 'Network8/FBAnd1'); a.rebindWire('Network8/FBAnd1', 'AndIn1', 'Network8/FBOrS5'); };
export const fixHlt = (m, { mut } = {}) => { const a = api(m);
  a.nb('SafeResumption', 'HLT_DESC_SET', 'safeAnd', 'AndOut', [['AndIn1', 'g', 'in_LV_Faulty_FBK'], ['AndIn2', 'g', 'linkRunDownOwner'], ['AndIn3', 'g', 'in_False_SI2_CH8', NO]].filter(([n]) => mut !== 'set.' + n), 'SafeResumption/HLT_LV');
  a.nb('SafeResumption', 'HLT_MEM', 'safeRs', 'RsOut', [['Reset', 'g', mut === 'noReset' ? 'in_False_SI2_CH8' : 'b_Step1'], ['Set', 'w', 'SafeResumption/HLT_DESC_SET']], 'SafeResumption/HLT_LV');
  a.nb('SafeResumption', 'HLT_LV_SRC', 'safeOr', 'OrOut', [['OrIn1', 'g', 'in_LV_Faulty_FBK'], ['OrIn2', 'w', 'SafeResumption/HLT_MEM']].filter(([n]) => mut !== 'src.' + n), 'SafeResumption/HLT_LV');
  a.rebindWire('SafeResumption/HLT_LV', 'AndIn1', 'SafeResumption/HLT_LV_SRC'); };
export const fixRestart = m => { const a = api(m); a.nb('Network1', 'RESTART_OK', 'safeAnd', 'AndOut', [['AndIn1', 'g', 'in_Reset_PB'], ['AndIn2', 'g', 'in_LV_C1_FBK', NO], ['AndIn3', 'g', 'in_HV_C2_FBK', NO]], 'Network1/FBEstop1'); a.rebindWire('Network1/FBEstop1', 'Restart', 'Network1/RESTART_OK'); };
const all78 = m => { fixWin(m); fixL3(m); fixHlt(m); fixRestart(m); };
const toRun = r => { toRnd(r); r.step(2100); r.step(1, { in_Reset_PB: true, in_Relase_Door_PB: true }); r.step(1100); r.step(1, OFF); r.step(4000); };
if (!(process.argv[1] ?? '').includes('c14.mjs')) { /* imported */ } else {
if (section === 'all' || section === 'L3') {
  console.log('== L3: steady Run, in_Estop_PLC at e (k = scan index; reference REF_RUN_PLC: SS1 3, LVD 3, C1 2004, STO 7006, HVD 7008, C2 8009)');
  const SIG = { EOk: 'b_EStop_Ok', SS1: 'out_SS1_DR1', LVD: 'out_LV_Discharge_Request', C1: 'out_LV_C1', STO1: 'STO_DR1', HVD: 'out_HV_Discharge_Request', C2: 'out_HV_C2', S5: 'b_Step5', S6: 'b_Step6' };
  for (const [n, v] of [['v7.7', null], ['v7.7+L3', fixL3], ['v7.8 all', all78]]) { const r = cand('E2d', v); toRun(r); const prev = {}; for (const [k, s] of Object.entries(SIG)) prev[k] = +!!r.get(s); const ch = [];
    for (let k = 0; k < 9000; k++) { r.step(1, k === 0 ? { in_Estop_PLC: true } : undefined); for (const [kk, s] of Object.entries(SIG)) { const c = +!!r.get(s); if (c !== prev[kk]) { ch.push(`${kk}${c ? '↑' : '↓'}${k}`); prev[kk] = c; } } }
    console.log(n.padEnd(10), ch.join(' ')); }
}
if (section === 'all' || section === 'E202') {
  console.log('== E2-02-R: Run, green 600 ms (descent); C2_FBK OFF delayed; LV Faulty TRUE at h for r scans (h after C2 OFF command, before C2_FBK OFF)');
  for (const [n, v] of [['v7.7', null], ['v7.8 all', all78], ['mut set.AndIn2', m => { fixWin(m); fixL3(m); fixHlt(m, { mut: 'set.AndIn2' }); fixRestart(m); }], ['mut src.OrIn2', m => { fixWin(m); fixL3(m); fixHlt(m, { mut: 'src.OrIn2' }); fixRestart(m); }], ['mut noReset', m => { fixWin(m); fixL3(m); fixHlt(m, { mut: 'noReset' }); fixRestart(m); }]])
    for (const rr of [1, 3, 100, 0]) {
      const r = cand('E2d', v); toRun(r); r.plantC2 = false; r.hold = { in_HV_C2_FBK: true };
      r.step(1, { in_Reset_PB: true }); let c2off = null, h = null; const seq = [];
      for (let k = 1; k < 12000; k++) { const inp = {}; if (k === 600) inp.in_Reset_PB = false;
        if (c2off === null && !r.get('out_HV_C2')) { c2off = k; h = k + 2; }
        if (h !== null && rr > 0 && k === h) inp.in_LV_Faulty_FBK = true; if (h !== null && rr > 0 && k === h + rr) inp.in_LV_Faulty_FBK = false;
        if (h !== null && k === h + 4) r.hold = {};
        r.step(1, inp); const ph = r.ph(); if (!seq.length || seq.at(-1)[1] !== ph) seq.push([k, ph]); }
      if (n === 'mut noReset' && rr === 0) { /* noReset killer: after Safe, new Safe->R&D: memory stuck -> HLT in R&D */ }
      console.log(`${n} r=${rr || 'none'}`.padEnd(26), `C2 OFF cmd ${c2off}, h ${h}: ${seq.map(([k, p]) => `${p}@${k}`).join(' ')}`);
    }
  // noReset killer: after a memory-setting descent and arrival in Safe, a later clean Safe->R&D must stay in R&D
  for (const [n, v] of [['v7.8 all', all78], ['mut noReset', m => { fixWin(m); fixL3(m); fixHlt(m, { mut: 'noReset' }); fixRestart(m); }]]) {
    const r = cand('E2d', v); toRun(r); r.plantC2 = false; r.hold = { in_HV_C2_FBK: true }; r.step(1, { in_Reset_PB: true }); r.step(599); r.step(1, { in_Reset_PB: false });
    r.step(1, { in_LV_Faulty_FBK: true }); r.step(1, { in_LV_Faulty_FBK: false }); r.hold = {}; r.step(9000); const a = r.ph();
    r.step(2100); r.step(1, { in_Reset_PB: true, in_Relase_Door_PB: true }); r.step(1100); r.step(1, OFF); r.step(5000);
    console.log(`${n}: after descent with 1-scan LV loss -> ${a}; then clean BOTH Safe->R&D +5 s -> ${r.ph()}`); }
}
if (section === 'all' || section === 'RST') {
  console.log('== EMG6-FBK: Safe, C1_FBK ON (unsolicited), in_Estop_PLC 100 ms, Restart cases');
  const st = r => `${r.ph()} EOk=${+r.get('b_EStop_Ok')}`;
  for (const [n, v] of [['v7.7', null], ['v7.8 all', all78]]) {
    const run = (desc, script) => { const r = cand('E2d', v); boot(r); r.step(2400, OFF); r.plant = false; r.plantC2 = false; r.hold = { in_LV_C1_FBK: true }; r.step(1, { in_Estop_PLC: true }); r.step(100); r.step(1, { in_Estop_PLC: false }); r.step(12000); console.log(`${n} ${desc}`.padEnd(50), script(r, st)); };
    run('held through FBK OFF (press g, FBK OFF g+500, release g+1000)', (r, st) => { r.step(1, { in_Reset_PB: true }); let first = null; for (let k = 1; k < 1500; k++) { if (k === 500) { r.hold = {}; r.setInputs({ in_LV_C1_FBK: false }); } if (k === 1000) r.setInputs({ in_Reset_PB: false }); r.step(1); if (first === null && r.get('b_EStop_Ok')) first = k; } return `EOk first at g+${first ?? '-'} (FBK OFF at g+500) -> ${st(r)}`; });
    run('released before FBK OFF (press 300, FBK OFF +1000)', (r, st) => { r.step(1, { in_Reset_PB: true }); r.step(300); r.step(1, { in_Reset_PB: false }); r.step(700); r.hold = {}; r.setInputs({ in_LV_C1_FBK: false }); r.step(3000); return st(r); });
    run('no FBK (control): FBK OFF before Restart', (r, st) => { r.hold = {}; r.setInputs({ in_LV_C1_FBK: false }); r.step(100); r.step(1, { in_Reset_PB: true }); let first = null; for (let k = 1; k < 600; k++) { if (k === 300) r.setInputs({ in_Reset_PB: false }); r.step(1); if (first === null && r.get('b_EStop_Ok')) first = k; } return `EOk first at g+${first ?? '-'} -> ${st(r)}`; });
  }
  // R&D chain Emergency + Restart after chain (regression)
  for (const [n, v] of [['v7.7', null], ['v7.8 all', all78]]) { const r = cand('E2d', v); toRnd(r); r.step(2100); r.step(1, { in_ES_NC_1: false }); r.step(100); r.step(1, { in_ES_NC_1: true }); r.step(12000);
    r.step(1, { in_Reset_PB: true }); let first = null; for (let k = 1; k < 800; k++) { if (k === 300) r.setInputs({ in_Reset_PB: false }); r.step(1); if (first === null && r.get('b_EStop_Ok')) first = k; } console.log(`${n} R&D chain, Restart at +12.1 s`.padEnd(50), `EOk first at g+${first ?? '-'}, ${r.ph()}`); }
}
if (section === 'all' || section === 'DIS') {
  console.log('== M-E2a-32/33/34 on E2a-RC: N1/FBOr5.OrIn2 rebound (HV discharge request reset)');
  const reb = s => m => { const p = m.networks.flatMap(n => n.blocks).find(b => b.path === '//Network1/FBOr5').inputs.find(q => q.name === 'OrIn2'); p.globals = [{ resolvedName: s }]; };
  const V = [['base', null], ['M-32 recRndC_T', reb('recRndC_T')], ['M-33 b_Step3_Set_2', reb('b_Step3_Set_2')], ['M-34 recRndC_SU', reb('recRndC_SU')]];
  for (const [n, v] of V) {
    // (a) Safe->R&D by BOTH: HVD must stay TRUE
    { const r = cand('E2a-RC', v); boot(r); r.step(2400, OFF); const h0 = +r.get('out_HV_Discharge_Request'); let drop = null; r.step(1, { in_Reset_PB: true, in_Relase_Door_PB: true }); for (let k = 1; k < 3000; k++) { if (k === 1100) r.setInputs(OFF); r.step(1); if (drop === null && !r.get('out_HV_Discharge_Request')) drop = k; }
      process.stdout.write(`${n}`.padEnd(22) + `(a) Safe->R&D BOTH: HVD at start ${h0}, first FALSE ${drop ?? 'never'}; `); }
    // (b) R&D->Run: HVD FALSE at u (<= u+1)
    { const r = cand('E2a-RC', v); toRnd(r); r.step(2400, OFF); r.step(1, { in_Reset_PB: true, in_Relase_Door_PB: true }); let u = null, drop = null; for (let k = 1; k < 3000; k++) { if (k === 1100) r.setInputs(OFF); r.step(1); if (u === null && r.get('out_HV_C2')) u = k; if (drop === null && !r.get('out_HV_Discharge_Request')) drop = k; }
      process.stdout.write(`(b) R&D->Run: u ${u}, HVD FALSE ${drop ?? 'never'} (u${drop != null && u != null ? (drop - u >= 0 ? '+' : '') + (drop - u) : ''}); `); }
    // (c) R&D->Run accepted (SU at A), NC1 FALSE at A+1 (before u): HVD must stay TRUE (rejected/Emergency keep TRUE)
    { const r = cand('E2a-RC', v); toRnd(r); r.step(2400, OFF); r.step(1, { in_Reset_PB: true, in_Relase_Door_PB: true }); let A = null, drop = null, c2 = 0; for (let k = 1; k < 4000; k++) { if (k === 1100) r.setInputs(OFF); if (A !== null && k === A + 1) r.setInputs({ in_InterLock_NC_1: false }); r.step(1); if (A === null && r.get('recRndC_SU')) A = k; if (drop === null && !r.get('out_HV_Discharge_Request')) drop = k; c2 += +r.get('out_HV_C2'); }
      console.log(`(c) SU A ${A}, NC1 at A+1: HVD FALSE ${drop ?? 'never'}, C2 scans ${c2}`); }
  }
}
}
