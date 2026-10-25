// E2a-core model self-check (stand runtime, NOT native, NOT an acceptance test):
// per-scan invariant "<=1 stage / exactly 1 status" (D2-A formula over stage memories + b_EStop_Ok)
// on the architect's scenarios (repro/t10, t11, t15 adapted to the real candidate, no proto, no decoder blocks).
// Runs the same scenarios on R1 (baseline) and the E2a-core candidate.
// node invariant.mjs <r1Dir> <candidateDir> <out.json>
import fs from 'node:fs';
import path from 'node:path';
import {parseSalFile} from '../../../../src/sal-parser.js';
import {SalRuntime} from '../../../../src/sal-runtime.js';
const [r1Dir, candDir, out] = process.argv.slice(2);
const STAGES = [['S1', 'b_Step1'], ['S12', 'b_Step12'], ['SR', 'b_Step_RnD'], ['S3', 'b_Step3'], ['S4', 'b_Step4'], ['S5', 'b_Step5'], ['S6', '//Network3/FBRs6/RsOut']];
function rt(dir) {
  const m = parseSalFile(path.join(dir, 'TwinSafeGroup1.sal'), {bindingMode: 'current', sgvlPath: path.join(dir, 'GVL1.sgvl')});
  const names = new Set(m.variables.map(v => v.name));
  const LV = names.has('in_LV_Faulty_FBK') ? 'in_LV_Faulty_FBK' : 'in_LV_Healthy_FBK', HV = names.has('in_HV_Faulty_FBK') ? 'in_HV_Faulty_FBK' : 'in_HV_Healthy_FBK';
  const raw0 = {in_ES_NC_1: true, in_ES_NC_2: true, in_InterLock_NC_1: true, in_InterLock_NC_2: true, in_LV_Connector_Interlock: true, in_HV_Connector_Interlock: true, in_Mentee_EStop: false, in_Estop_PLC: false, in_False_SI2_CH8: false, in_Reset_PB: false, in_Relase_Door_PB: false, in_Door_Monitor: true, in_Safety_Run: true, inPLC_RnD_Mode: false, inPLC_RnD_Mode_2: false, inPLC_BypassC1C2: false, in_LV_C1_FBK: false, in_HV_C2_FBK: false, in_STO_DR1_FBK: true, in_STO_DR2_FBK: true, [LV]: false, [HV]: false, in_C3_Manual_Set: false, in_C3_Manual_Reset: false, in_RBM_Manual_Set: false, in_RBM_Manual_Reset: false};
  for (const k of Object.keys(raw0)) if (!names.has(k)) throw Error('unknown input ' + k);
  const r = new SalRuntime(m, {scanMs: 1, unconnectedInput: false});
  r.setInputs(raw0); r.t = 0; r.viol = []; r.hold = {}; r.plant = true; r.plantC2 = true; r.LV = LV; r.HV = HV;
  const map = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k === 'LV' ? LV : k === 'HV' ? HV : k, v]));
  r.step = (n = 1, inp) => {
    if (inp) r.setInputs(map(inp));
    for (let i = 0; i < n; i++) {
      if (r.plant) {const pl = {in_LV_C1_FBK: r.get('out_LV_C1'), in_STO_DR1_FBK: !r.get('STO_DR1'), in_STO_DR2_FBK: !r.get('STO_DR2')}; if (r.plantC2) pl.in_HV_C2_FBK = r.get('out_HV_C2'); r.setInputs(pl);}
      r.setInputs(map(r.hold)); r.scan(1); r.t++;
      const st = r.stages(), sts = r.status();
      if (st.length > 1 || sts.length !== 1) r.viol.push(`${r.t}:${st.join('+')}:${sts.join('+')}`);
    }
    return r;
  };
  r.stages = () => STAGES.filter(([, s]) => r.get(s)).map(([n]) => n);
  r.status = () => {const s = new Set(r.stages()), eok = r.get('b_EStop_Ok'); const safe = (s.has('S1') || s.has('S12')) && eok, rnd = s.has('SR') && eok, run = s.has('S3') && eok; const o = []; if (safe) o.push('SAFE'); if (rnd) o.push('RND'); if (run) o.push('RUN'); if (!safe && !rnd && !run) o.push('EMG'); return o;};
  r.ph = () => r.stages().join('+') || 'none';
  return r;
}
const gesture = (r, {green = false, blue = false, ms = 600}) => {r.step(1, {in_Reset_PB: green, in_Relase_Door_PB: blue}); r.step(ms); r.step(1, {in_Reset_PB: false, in_Relase_Door_PB: false});};
const boot = r => {r.step(10); r.step(1, {in_Reset_PB: true}); r.step(1, {in_Reset_PB: false}); r.step(2100);};
const toRnd = r => {boot(r); gesture(r, {green: true, blue: true, ms: 1100}); r.step(2500);};
const toRun = r => {toRnd(r); gesture(r, {green: true, blue: true, ms: 1100}); r.step(3000);};
const restart = r => {r.step(20); r.step(1, {in_Reset_PB: true}); r.step(100); r.step(1, {in_Reset_PB: false}); r.step(50);};
const E = r => `EOk=${+r.get('b_EStop_Ok')} C1=${+r.get('out_LV_C1')} C2=${+r.get('out_HV_C2')} STO=${+r.get('STO_DR1')}`;
const first = (r, pred, max = 20000) => {for (let i = 1; i <= max; i++) {r.step(1); if (pred()) return i;} return -1;};
const SC = {
  'lifecycle Safe->R&D->Run': r => {boot(r); const a = r.ph(); gesture(r, {green: true, blue: true, ms: 1100}); r.step(2500); const b = r.ph(); gesture(r, {green: true, blue: true, ms: 1100}); r.step(3000); return `${a} -> ${b} -> ${r.ph()}`;},
  'Run -> green down -> R&D -> green -> Safe': r => {toRun(r); const a = r.ph(); gesture(r, {green: true, ms: 600}); r.step(12000); const b = r.ph(); gesture(r, {green: true, ms: 600}); r.step(12000); return `${a} -> ${b} -> ${r.ph()} ${E(r)}`;},
  't10#2 SU + in_Estop_PLC 3ms (B-1) + Restart': r => {r.plantC2 = false; r.hold = {in_HV_C2_FBK: false}; toRnd(r); gesture(r, {green: true, blue: true, ms: 1100}); r.step(50); r.step(3, {in_Estop_PLC: true}); r.step(1, {in_Estop_PLC: false}); r.step(12000); const a = r.ph(); restart(r); return `${a} -> restart ${r.ph()} ${E(r)}`;},
  't10#3 SU + LV connector lost + Restart': r => {r.plantC2 = false; r.hold = {in_HV_C2_FBK: false}; toRnd(r); gesture(r, {green: true, blue: true, ms: 1100}); r.step(50); r.step(1, {in_LV_Connector_Interlock: false}); r.step(12000); const a = r.ph(); r.step(1, {in_LV_Connector_Interlock: true}); restart(r); return `${a} -> restart ${r.ph()}`;},
  't10#4 R&D EStop +12s + Restart + BOTH': r => {toRnd(r); r.step(1, {in_ES_NC_1: false}); r.step(12000); const a = r.ph(); r.step(1, {in_ES_NC_1: true}); restart(r); const b = r.ph(); r.step(2100); gesture(r, {green: true, blue: true, ms: 1100}); r.step(2500); return `${a} -> ${b} -> ${r.ph()}`;},
  't10#5 S12 (C1 FBK held off) EStop': r => {boot(r); r.plant = false; r.hold = {in_LV_C1_FBK: false}; gesture(r, {green: true, blue: true, ms: 1100}); r.step(30); const a = r.ph(); r.step(1, {in_ES_NC_1: false}); r.hold = {}; r.plant = true; r.step(12000); return `${a} -> ${r.ph()} ${E(r)}`;},
  't10#6 R&D HV connector lost + Restart': r => {toRnd(r); r.step(1, {in_HV_Connector_Interlock: false}); r.step(12000); const a = r.ph(); restart(r); const b = r.ph(); r.step(1, {in_HV_Connector_Interlock: true}); restart(r); return `${a} -> ${b} -> ${r.ph()}`;},
  't10#7 C-1 LV faulty 1 scan before BOTH': r => {toRnd(r); r.step(2100); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); r.step(998); r.step(1, {LV: true}); r.step(3000); return `${r.ph()} ${E(r)}`;},
  't10#8 C-2 BOTH held through LV faulty': r => {toRnd(r); r.step(2100); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); r.step(500); r.step(1, {LV: true}); r.step(4000); return `${r.ph()} ${E(r)}`;},
  't10#9a Safe cover open blue 700': r => {boot(r); r.step(1, {in_InterLock_NC_1: false}); r.step(10); r.step(1, {in_Relase_Door_PB: true}); r.step(700); return `${r.ph()} UL=${+r.get('out_Door_Unlock_Solonoeid')}`;},
  't10#9b R&D cover open blue 700': r => {toRnd(r); r.step(1, {in_InterLock_NC_1: false}); r.step(10); r.step(1, {in_Relase_Door_PB: true}); r.step(700); return `${r.ph()} UL=${+r.get('out_Door_Unlock_Solonoeid')}`;},
  't10#10 Q-REL cover 300ms then BOTH': r => {boot(r); r.step(1, {in_InterLock_NC_1: false}); r.step(300); r.step(1, {in_InterLock_NC_1: true}); r.step(1700); gesture(r, {green: true, blue: true, ms: 1100}); r.step(2500); return r.ph();},
  't10#11 Run EStop, early Restart': r => {toRun(r); r.step(1, {in_ES_NC_1: false}); r.step(100); r.step(1, {in_ES_NC_1: true}); restart(r); const a = r.ph(); r.step(12000); const b = r.ph(); restart(r); return `${a} -> ${b} -> ${r.ph()}`;},
  't11 earlyRestart Run EStop +12s': r => {toRun(r); r.step(1, {in_ES_NC_1: false}); r.step(100); r.step(1, {in_ES_NC_1: true}); restart(r); r.step(12000); return r.ph();},
  't11 c1Stuck R&D EStop C1 FBK stuck': r => {toRnd(r); r.plant = false; r.hold = {in_LV_C1_FBK: true}; r.step(1, {in_ES_NC_1: false}); r.step(12000); r.step(1, {in_ES_NC_1: true}); restart(r); return `${r.ph()}`;},
  't15 L1 R&D in_Estop_PLC': r => {toRnd(r); r.setInputs({in_Estop_PLC: true}); const e = first(r, () => !r.get('b_EStop_Ok')); const s4 = first(r, () => r.get('b_Step4')); r.step(12000); return `EOk falls e+${e - 1} S4 at e+${s4 < 0 ? 'never' : e + s4 - 1} final ${r.ph()}`;},
  't15 L1 R&D LV connector': r => {toRnd(r); r.setInputs({in_LV_Connector_Interlock: false}); const e = first(r, () => !r.get('b_EStop_Ok')); const s4 = first(r, () => r.get('b_Step4')); r.step(12000); return `EOk falls e+${e - 1} S4 at e+${s4 < 0 ? 'never' : e + s4 - 1} final ${r.ph()}`;},
  't15 L1 R&D HV connector': r => {toRnd(r); r.setInputs({in_HV_Connector_Interlock: false}); const e = first(r, () => !r.get('b_EStop_Ok')); const s4 = first(r, () => r.get('b_Step4')); r.step(12000); return `EOk falls e+${e - 1} S4 at e+${s4 < 0 ? 'never' : e + s4 - 1} final ${r.ph()}`;},
  'Run + in_Estop_PLC (S3 emergency chain)': r => {toRun(r); r.setInputs({in_Estop_PLC: true}); const s4 = first(r, () => r.get('b_Step4')); r.step(15000); return `S4 at +${s4} final ${r.ph()} ${E(r)}`;},
  'Run + NC1 cover open': r => {toRun(r); r.setInputs({in_InterLock_NC_1: false}); const s4 = first(r, () => r.get('b_Step4')); r.step(15000); return `S4 at +${s4} final ${r.ph()} ${E(r)}`;},
  'Run + LV Faulty 1 scan (HEALTH_GUARD)': r => {toRun(r); r.step(1, {LV: true}); r.step(1, {LV: false}); r.step(5000); return `${r.ph()} ${E(r)}`;},
  'Run + HV Faulty held': r => {toRun(r); r.step(1, {HV: true}); r.step(15000); return `${r.ph()} ${E(r)}`;},
  'Run down (green) + LV Faulty during run-down': r => {toRun(r); gesture(r, {green: true, ms: 600}); r.step(200); r.step(1, {LV: true}); r.step(12000); return `${r.ph()} ${E(r)}`;},
  'S12 LV completion with LV Faulty held (N11 polarity)': r => {boot(r); r.hold = {LV: true}; gesture(r, {green: true, blue: true, ms: 1100}); r.step(5000); const a = r.ph(); r.hold = {LV: false}; r.step(5000); return `faulty: ${a} -> healthy: ${r.ph()}`;},
  'Safe EStop then Restart (no stage before Restart)': r => {r.step(10); const a = r.ph(); r.step(1, {in_Reset_PB: true}); r.step(1, {in_Reset_PB: false}); r.step(5); return `boot ${a} -> after Restart ${r.ph()}`;},
};
const res = {note: 'stand runtime model (unconnectedInput:false, 1 ms scan, plant: FBK follow outputs); self-check only', scenarios: {}};
for (const [n, f] of Object.entries(SC)) {
  const row = {};
  for (const [lbl, dir] of [['R1', r1Dir], ['E2a', candDir]]) {const r = rt(dir); let o; try {o = f(r);} catch (e) {o = 'ERROR ' + e.message;} row[lbl] = {result: o, scans: r.t, violations: r.viol.length, firstViolations: r.viol.slice(0, 3)};}
  res.scenarios[n] = row;
  console.log(n.padEnd(52), '| R1:', row.R1.result, 'viol', row.R1.violations, '| E2a:', row.E2a.result, 'viol', row.E2a.violations, row.E2a.firstViolations.join(' '));
}
const tot = l => Object.values(res.scenarios).reduce((a, s) => a + s[l].violations, 0);
res.totals = {R1: tot('R1'), E2a: tot('E2a')};
console.log('total violations R1', res.totals.R1, 'E2a', res.totals.E2a);
fs.writeFileSync(out, JSON.stringify(res, null, 1) + '\n');
