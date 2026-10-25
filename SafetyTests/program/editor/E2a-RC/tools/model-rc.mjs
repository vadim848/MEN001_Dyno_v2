// E2a-RC model self-check (stand runtime, NOT native, NOT an acceptance test, does not replace G3).
// Architect scenarios repro/t16 (windows), t18 (DIS-HOLD HV/LV), t20 (rows B/C/D/E) re-run on the REAL
// candidate files (no prototype), plus the same rows on E2a-core as a baseline, plus deactivate-input mutants
// (stand operator applyMutation) for the guards named in those scripts. E2b-only rows (BOOT, Bypass) are omitted.
// Input names: candidate uses in_*_Faulty_FBK (TRUE = faulty), as in t16 hvBad/lvBad.
// node model-rc.mjs <e2aCoreDir> <candidateDir> <scratchDir> <out.json>
import fs from 'node:fs';
import path from 'node:path';
import {parseSalFile} from '../../../../src/sal-parser.js';
import {SalRuntime} from '../../../../src/sal-runtime.js';
import {applyMutation} from '../../../../src/sal-mutations.js';
const [coreDir, candDir, scratch, out] = process.argv.slice(2);
const STAGES = [['S1', 'b_Step1'], ['S12', 'b_Step12'], ['SR', 'b_Step_RnD'], ['S3', 'b_Step3'], ['S4', 'b_Step4'], ['S5', 'b_Step5'], ['S6', '//Network3/FBRs6/RsOut']];
let mutCount = 0;
function rt(dir, mut = []) {
  let salPath = path.join(dir, 'TwinSafeGroup1.sal');
  if (mut.length) {
    let xml = fs.readFileSync(salPath, 'utf8');
    for (const m of mut) xml = applyMutation(xml, m).xml;
    const d = path.join(scratch, 'mut' + (mutCount++)); fs.mkdirSync(d, {recursive: true});
    fs.writeFileSync(path.join(d, 'TwinSafeGroup1.sal'), xml); fs.copyFileSync(path.join(dir, 'GVL1.sgvl'), path.join(d, 'GVL1.sgvl'));
    salPath = path.join(d, 'TwinSafeGroup1.sal'); dir = d;
  }
  const m = parseSalFile(salPath, {bindingMode: 'current', sgvlPath: path.join(dir, 'GVL1.sgvl')});
  const names = new Set(m.variables.map(v => v.name));
  const LV = 'in_LV_Faulty_FBK', HV = 'in_HV_Faulty_FBK';
  const raw0 = {in_ES_NC_1: true, in_ES_NC_2: true, in_InterLock_NC_1: true, in_InterLock_NC_2: true, in_LV_Connector_Interlock: true, in_HV_Connector_Interlock: true, in_Mentee_EStop: false, in_Estop_PLC: false, in_False_SI2_CH8: false, in_Reset_PB: false, in_Relase_Door_PB: false, in_Door_Monitor: true, in_Safety_Run: true, inPLC_RnD_Mode: false, inPLC_RnD_Mode_2: false, inPLC_BypassC1C2: false, in_LV_C1_FBK: false, in_HV_C2_FBK: false, in_STO_DR1_FBK: true, in_STO_DR2_FBK: true, [LV]: false, [HV]: false, in_C3_Manual_Set: false, in_C3_Manual_Reset: false, in_RBM_Manual_Set: false, in_RBM_Manual_Reset: false};
  for (const k of Object.keys(raw0)) if (!names.has(k)) throw Error('unknown input ' + k);
  const r = new SalRuntime(m, {scanMs: 1, unconnectedInput: false});
  r.setInputs(raw0); r.t = 0; r.viol = []; r.hold = {}; r.plantC2 = true;
  r.step = (n = 1, inp) => {
    if (inp) r.setInputs(inp);
    for (let i = 0; i < n; i++) {
      const pl = {in_LV_C1_FBK: r.get('out_LV_C1'), in_STO_DR1_FBK: !r.get('STO_DR1'), in_STO_DR2_FBK: !r.get('STO_DR2')}; if (r.plantC2) pl.in_HV_C2_FBK = r.get('out_HV_C2');
      r.setInputs(pl); r.setInputs(r.hold); r.scan(1); r.t++;
      const st = r.stages(); if (st.length > 1) r.viol.push(`${r.t}:${st.join('+')}`);
    }
    return r;
  };
  r.stages = () => STAGES.filter(([, s]) => r.get(s)).map(([n]) => n);
  r.ph = () => r.stages().join('+') || 'none';
  return r;
}
const D = (b, p) => ({op: 'deactivate-input', block: b, port: p});
const gesture = (r, {green = false, blue = false, ms = 600}) => {r.step(1, {in_Reset_PB: green, in_Relase_Door_PB: blue}); r.step(ms); r.step(1, {in_Reset_PB: false, in_Relase_Door_PB: false});};
const boot = r => {r.step(10); r.step(1, {in_Reset_PB: true}); r.step(1, {in_Reset_PB: false}); r.step(2100);};
// Deviation from repro/run.mjs toRnd (step 2500): with the 0.5 s window R&D is entered 500 ms later (cmd+600) and the
// existing recognizer re-arm (RELEASE 2 s) then ends exactly at the next BOTH press of the architect script
// (press at R&D+2000 is not accepted, +2001 is; see MODEL_RC.log header). Settle 3000 is used for both E2a-core and E2a-RC.
const SETTLE = 3000;
const toRnd = r => {boot(r); gesture(r, {green: true, blue: true, ms: 1100}); r.step(SETTLE);};
const toRun = r => {toRnd(r); gesture(r, {green: true, blue: true, ms: 1100}); r.step(3000);};
// ---- t16 ----
const t16run = (dir, mut, {fbk = 30, hvGlitch = null, fbkDip = null, hvBad = false} = {}) => {
  const r = rt(dir, mut); toRnd(r); r.plantC2 = false; r.hold = {in_HV_C2_FBK: false, ...(hvBad ? {in_HV_Faulty_FBK: true} : {})};
  r.step(2100); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); let i = 0; while (!r.get('out_HV_C2') && i++ < 3000) r.step(1); const tc = r.t; let tr = -1;
  for (let k = 1; k <= 1500; k++) {const rel = r.t - tc; const fb = rel >= fbk && !(fbkDip !== null && rel === fbkDip); const hv = hvBad || (hvGlitch !== null && rel === hvGlitch); r.hold = {...r.hold, in_HV_C2_FBK: fb, in_HV_Faulty_FBK: hv}; r.step(1); if (r.get('b_Step3') && tr < 0) tr = r.t - tc;}
  return 'Run@cmd+' + tr;
};
const t16rnd = (dir, mut, {fbk = 30, lvBad = false} = {}) => {
  const r = rt(dir, mut); boot(r); r.hold = {in_LV_C1_FBK: false, ...(lvBad ? {in_LV_Faulty_FBK: true} : {})};
  r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); let i = 0; while (!r.get('out_LV_C1') && i++ < 3000) r.step(1); const tc = r.t; let tr = -1;
  for (let k = 1; k <= 1500; k++) {r.hold = {...r.hold, in_LV_C1_FBK: (r.t - tc) >= fbk}; r.step(1); if (r.get('b_Step_RnD') && tr < 0) tr = r.t - tc;}
  return 'R&D@cmd+' + tr;
};
// ---- t18 ----
const watch = (r, sig, trig, n) => {let ta = -1, td = -1; for (let i = 0; i < n; i++) {r.step(1); if (ta < 0 && r.get(trig)) ta = r.t; if (td < 0 && !r.get(sig)) td = r.t;} return {ta, td};};
const t18hv = (dir, mut, rejected = false) => {
  const r = rt(dir, mut); toRun(r); gesture(r, {green: true}); r.step(3000); const pre = +r.get('out_HV_Discharge_Request'); r.step(2100);
  if (rejected) r.setInputs({in_InterLock_NC_1: false}); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); const w = watch(r, 'out_HV_Discharge_Request', 'recRndC_SU', 1100); r.step(1, {in_Reset_PB: false, in_Relase_Door_PB: false}); r.step(200);
  return `pre=${pre} SU@${w.ta} reqOFF@${w.td} (${w.ta > 0 && w.td > 0 ? 'reqOFF-a=' + (w.td - w.ta) : '-'}) end req=${+r.get('out_HV_Discharge_Request')} ${r.ph()}`;
};
const t18lv = (dir, mut) => {
  const r = rt(dir, mut); boot(r); gesture(r, {green: true, blue: true, ms: 1100}); r.step(2500); r.step(2100); gesture(r, {green: true}); r.step(2000); const pre = +r.get('out_LV_Discharge_Request'); r.step(2100);
  r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); const w = watch(r, 'out_LV_Discharge_Request', 'b_Step12_Set', 1100);
  return `pre=${pre} g2@${w.ta} reqOFF@${w.td} (${w.ta > 0 && w.td > 0 ? 'reqOFF-a=' + (w.td - w.ta) : '-'})`;
};
// ---- t20 ----
const minOver = (r, sig, n) => {let mn = 1, fs_ = -1; for (let i = 0; i < n; i++) {r.step(1); if (!r.get(sig)) {mn = 0; if (fs_ < 0) fs_ = i + 1;}} return `min=${mn}${fs_ > 0 ? ' firstFALSE@+' + fs_ : ''}`;};
const rndWithReq = (dir, mut) => {const r = rt(dir, mut); toRun(r); gesture(r, {green: true}); r.step(3000); r.step(2100); return r;};
const T20 = {
  B_rejectedPLC_coverOpen: (dir, m) => {const r = rndWithReq(dir, m); const pre = +r.get('out_HV_Discharge_Request'); r.setInputs({in_InterLock_NC_1: false}); r.step(5); r.setInputs({inPLC_RnD_Mode: true, inPLC_RnD_Mode_2: true}); return `pre=${pre} ` + minOver(r, 'out_HV_Discharge_Request', 3000);},
  C_RnD_EStop_PLC11: (dir, m) => {const r = rndWithReq(dir, m); r.setInputs({in_ES_NC_1: false}); r.step(1); r.setInputs({inPLC_RnD_Mode: true, inPLC_RnD_Mode_2: true}); return minOver(r, 'out_HV_Discharge_Request', 3000) + ' ' + r.ph();},
  D_Safe_EStop_PLC10_LV: (dir, m) => {const r = rt(dir, m); boot(r); gesture(r, {green: true, blue: true, ms: 1100}); r.step(2500); r.step(2100); gesture(r, {green: true}); r.step(2000); const pre = +r.get('out_LV_Discharge_Request'); r.setInputs({in_ES_NC_1: false}); r.step(5); r.setInputs({inPLC_RnD_Mode: true}); return `pre=${pre} ` + minOver(r, 'out_LV_Discharge_Request', 3000) + ' ' + r.ph();},
  E_button_RnD_to_Run: (dir, m) => {const r = rndWithReq(dir, m); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); let a = -1, off = -1, u = -1; for (let i = 0; i < 1100; i++) {r.step(1); if (a < 0 && r.get('recRndC_SU')) a = r.t; if (u < 0 && r.get('out_HV_C2')) u = r.t; if (off < 0 && !r.get('out_HV_Discharge_Request')) off = r.t;} return `a=0 u=+${u - a} reqOFF=${off < 0 ? 'never' : '+' + (off - a)}`;},
  // R6-4 base observation (killer context of M-E2a-32): Safe with HV request set, BOTH Safe->R&D: HV request must stay TRUE in the base
  R64_Safe_to_RnD_BOTH_HVreq: (dir, m) => {const r = rt(dir, m); toRun(r); gesture(r, {green: true}); r.step(12000); gesture(r, {green: true}); r.step(12000); const a = r.ph(); const pre = +r.get('out_HV_Discharge_Request'); r.step(2100); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); const mo = minOver(r, 'out_HV_Discharge_Request', 1100); r.step(1, {in_Reset_PB: false, in_Relase_Door_PB: false}); r.step(2500); return `${a} pre=${pre} during BOTH ${mo} -> ${r.ph()} req=${+r.get('out_HV_Discharge_Request')}`;},
};
const rows = [];
const run = (group, name, fn, mut = [], dirs = [['E2a-core', coreDir], ['E2a-RC', candDir]]) => {
  const row = {group, name, mut: mut.map(x => `${x.op} ${x.block}.${x.port}`)};
  for (const [lbl, dir] of dirs) {try {row[lbl] = fn(dir, mut);} catch (e) {row[lbl] = 'ERROR ' + e.message;}}
  rows.push(row); console.log(group.padEnd(5), name.padEnd(40), JSON.stringify(Object.fromEntries(Object.entries(row).filter(([k]) => k.startsWith('E2a')))));
};
const RC = [['E2a-RC', candDir]];
run('t16', 'RUN base fbk30', (d, m) => t16run(d, m));
run('t16', 'RUN base fbk700', (d, m) => t16run(d, m, {fbk: 700}));
run('t16', 'RUN base HV glitch @560', (d, m) => t16run(d, m, {hvGlitch: 560}));
run('t16', 'RUN base FBK dip @560', (d, m) => t16run(d, m, {fbkDip: 560}));
run('t16', 'RUN base HV faulty', (d, m) => t16run(d, m, {hvBad: true}));
run('t16', 'RUN base fbk9999 (no FBK)', (d, m) => t16run(d, m, {fbk: 9999}));
run('t16', 'RUN M window bypass FBAnd6.AndIn1', (d, m) => t16run(d, m), [D('//Network12/FBAnd6', 'AndIn1')], RC);
run('t16', 'RUN M FBAnd6.AndIn2 (FBK) fbk9999', (d, m) => t16run(d, m, {fbk: 9999}), [D('//Network12/FBAnd6', 'AndIn2')], RC);
run('t16', 'RUN M FBAnd6.AndIn3 (HV) hvBad', (d, m) => t16run(d, m, {hvBad: true}), [D('//Network12/FBAnd6', 'AndIn3')], RC);
run('t16', 'RND base fbk30', (d, m) => t16rnd(d, m));
run('t16', 'RND base fbk700', (d, m) => t16rnd(d, m, {fbk: 700}));
run('t16', 'RND base LV faulty', (d, m) => t16rnd(d, m, {lvBad: true}));
run('t16', 'RND base fbk9999 (no FBK)', (d, m) => t16rnd(d, m, {fbk: 9999}));
run('t16', 'RND M window bypass N11/FBAnd4.AndIn1', (d, m) => t16rnd(d, m), [D('//Network11/FBAnd4', 'AndIn1')], RC);
run('t16', 'RND M N11/FBAnd4.AndIn2 (FBK) fbk9999', (d, m) => t16rnd(d, m, {fbk: 9999}), [D('//Network11/FBAnd4', 'AndIn2')], RC);
run('t18', 'HV base', (d, m) => t18hv(d, m));
run('t18', 'HV base rejected (cover open)', (d, m) => t18hv(d, m, true));
run('t18', 'HV M FBOr5.OrIn2', (d, m) => t18hv(d, m), [D('//Network1/FBOr5', 'OrIn2')], RC);
run('t18', 'LV base', (d, m) => t18lv(d, m));
run('t18', 'LV M FBOr1.OrIn2', (d, m) => t18lv(d, m), [D('//Network1/FBOr1', 'OrIn2')], RC);
for (const [k, f] of Object.entries(T20)) run('t20', 'base ' + k, f);
// row C with PLC (1,1) at ES+delta (review x8 asks delta in {-1,0,+1,+2} for the tester; here as editor observation)
const Cdelta = dl => (dir, m) => {const r = rndWithReq(dir, m); const es = () => r.setInputs({in_ES_NC_1: false}), plc = () => r.setInputs({inPLC_RnD_Mode: true, inPLC_RnD_Mode_2: true});
  if (dl < 0) {plc(); r.step(-dl); es();} else {es(); r.step(dl); plc();} const mo = minOver(r, 'out_HV_Discharge_Request', 3000); return mo + ' ' + r.ph() + ' C1=' + +r.get('out_LV_C1') + ' C2=' + +r.get('out_HV_C2') + ' STO=' + +r.get('STO_DR1');};
for (const dl of [-1, 0, 1, 2]) run('t20', 'C delta ' + dl + ' (PLC at ES' + (dl < 0 ? '' : '+') + dl + ')', Cdelta(dl));
run('t20', 'M FBAnd4.AndIn2 (cover) B', T20.B_rejectedPLC_coverOpen, [D('//Network12/FBAnd4', 'AndIn2')], RC);
run('t20', 'M FBAnd91.AndIn4 (EOk) D', T20.D_Safe_EStop_PLC10_LV, [D('//Network2/FBAnd91', 'AndIn4')], RC);
run('t20', 'M FBOr5.OrIn2 E', T20.E_button_RnD_to_Run, [D('//Network1/FBOr5', 'OrIn2')], RC);
fs.writeFileSync(out, JSON.stringify({note: 'stand runtime model (sal-runtime, unconnectedInput:false, 1 ms scan, plant: FBK follow outputs); editor self-check only, not a requirement PASS; architect reference outputs: repro/t16.out.txt, t18.out.txt, t20.out.txt (prototype on F1)', core: coreDir, candidate: candDir, rows}, null, 1) + '\n');
