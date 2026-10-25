// G3 follow-ups: (A) Restart from Emergency entered in Safe with C1_FBK ON; (B) HLT-01b on E2c vs E2d; (C) M-E2b-48/49 killers on E2b.
import { cand, toRnd, boot, gesture } from './cand.mjs';
const NC = 'Break Contact (NC)', NO = 'Make Contact (NO)';
const OFF = { in_Reset_PB: false, in_Relase_Door_PB: false };
const which = process.argv[2] ?? 'all';
// proposed gate: NEW Network1/RESTART_OK safeAnd (in_Reset_PB NC, in_LV_C1_FBK NO, in_HV_C2_FBK NO) -> FBEstop1.Restart
const gate = m => { const n1 = m.networks.find(x => x.name === 'Network1'); const es = n1.blocks.find(b => b.name === 'FBEstop1'); const rs = es.inputs.find(q => q.name === 'Restart');
  const path = '//Network1/RESTART_OK'; const mk = (n, g, c) => ({ name: n, path: `${path}/${n}`, sources: [], targets: [], globals: [{ resolvedName: g }], channelInterface: 'Activated', deactivate1: c });
  const b = { type: 'x', name: 'RESTART_OK', functionName: 'safeAnd', orderOfExecution: 0, path, inputs: [mk('AndIn1', 'in_Reset_PB', NC), mk('AndIn2', 'in_LV_C1_FBK', NO), mk('AndIn3', 'in_HV_C2_FBK', NO)], outputs: [{ name: 'AndOut', path: `${path}/AndOut`, targets: [rs.path], sources: [], globals: [] }], parameters: [] };
  rs.globals = []; rs.sources = [b.outputs[0].path]; n1.blocks.push(b);
  const all = m.networks.flatMap(n => n.blocks).filter(x => x !== b).sort((a, c) => a.orderOfExecution - c.orderOfExecution); all.splice(all.indexOf(es), 0, b); all.forEach((x, k) => x.orderOfExecution = k + 1); };
const st = r => `${r.ph()} EOk=${+r.get('b_EStop_Ok')}`;
if (which === 'all' || which === 'A') {
  console.log('== (A) Emergency entered in Safe, C1_FBK stuck ON, Restart');
  for (const [n, v] of [['E2d v7.7', null], ['E2d v7.7 + RESTART_OK', gate]]) for (const fbk of ['in_LV_C1_FBK', 'in_HV_C2_FBK', null]) {
    const r = cand('E2d', v); boot(r); r.step(2400, OFF); r.plant = false; r.plantC2 = false; if (fbk) r.hold = { [fbk]: true };
    r.step(1, { in_Estop_PLC: true }); r.step(100); r.step(1, { in_Estop_PLC: false }); r.step(12000); const a = st(r);
    r.step(1, { in_Reset_PB: true }); r.step(300); r.step(1, { in_Reset_PB: false }); r.step(200); const b = st(r);
    r.hold = {}; r.setInputs({ in_LV_C1_FBK: false, in_HV_C2_FBK: false }); r.step(3000); const c = st(r); r.step(1, { in_Reset_PB: true }); r.step(300); r.step(1, { in_Reset_PB: false }); r.step(300);
    console.log(`${n} FBK ON: ${fbk ?? 'none'}`.padEnd(48), `before Restart: ${a} | Restart+200: ${b} | FBK OFF +3 s: ${c} | 2nd Restart: ${st(r)}`); }
  // chain case from R&D (G10_EXIT path): unchanged?
  for (const [n, v] of [['E2d v7.7', null], ['E2d v7.7 + RESTART_OK', gate]]) { const r = cand('E2d', v); toRnd(r); r.step(2100); r.step(1, { in_ES_NC_1: false }); r.step(100); r.step(1, { in_ES_NC_1: true }); r.step(12000); const a = st(r);
    r.step(1, { in_Reset_PB: true }); r.step(300); r.step(1, { in_Reset_PB: false }); r.step(300); console.log(`${n} R&D chain, Restart at +12.1 s`.padEnd(48), `before: ${a} | after: ${st(r)}`); }
}
if (which === 'all' || which === 'B') {
  console.log('== (B) HLT-01b: steady R&D, cover open (NC1 FALSE), LV Faulty');
  for (const c of ['E2c', 'E2d']) { const r = cand(c); toRnd(r); r.step(2100); r.step(1, { in_InterLock_NC_1: false }); r.step(500); r.step(1, { in_LV_Faulty_FBK: true }); r.step(4000);
    console.log(`${c}`.padEnd(10), `${st(r)} C1=${+r.get('out_LV_C1')} SG=${+r.get('recRndC_SG')} LvCurrentPermit=${+r.get('//Network1/FBAndLvCurrentPermit/AndOut')}`); }
}
if (which === 'all' || which === 'C') {
  console.log('== (C) M-E2b-48 (GATE_SPOIL_S.AndIn1 deactivated) on E2b: Safe, LV connector FALSE, blue single 700 ms');
  const mut48 = m => { const b = m.networks.flatMap(n => n.blocks).find(x => x.path === '//RndPhysicalCompact/GATE_SPOIL_S'); const p = b.inputs.find(q => q.name === 'AndIn1'); p.channelInterface = 'Deactivated'; p.sources = []; };
  for (const [n, v] of [['E2b', null], ['E2b mut48', mut48]]) for (const lost of [true, false]) { const r = cand('E2b', v); boot(r); r.step(2400, OFF); if (lost) r.step(1, { in_LV_Connector_Interlock: false }); r.step(300);
    r.step(1, { in_Relase_Door_PB: true }); let ul = null; for (let k = 0; k < 700; k++) { r.step(1); if (ul === null && r.get('out_Door_Unlock_Solonoeid')) ul = k + 1; } r.step(1, OFF); r.step(50);
    console.log(`${n} connector ${lost ? 'LOST' : 'ok'}`.padEnd(30), `Unlock at +${ul ?? '-'} ; ${st(r)}`); }
}
