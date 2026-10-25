// Runner with the API of architect repro/run.mjs (rt, toRun, gesture, trace, r.ph, r.sts, r.hold, r.plantC2), but on a REAL
// candidate directory (no prototype). Editor self-check harness, stand runtime model (not native).
// Differences to repro/run.mjs (documented):
//  - in_LV/HV_Healthy_FBK of the prototype (TRUE = faulty) are mapped to in_LV/HV_Faulty_FBK of the candidate;
//  - r.sts() is the D2-A formula over stage Symbols and b_Estop_Ok (decoder blocks are not built in E2, PLAN mechanism.decoder);
//  - toRun: settle after Safe->R&D is 3000 ms instead of 2500 (with the 0.5 s window R&D starts at cmd+600 and the existing
//    recognizer re-arm ends exactly at the next press of the 2500 ms script; see program/editor/E2a-RC/MODEL_RC.log).
import fs from 'node:fs';
import path from 'node:path';
import {parseSalFile} from '../../../../src/sal-parser.js';
import {SalRuntime} from '../../../../src/sal-runtime.js';
import {applyMutation} from '../../../../src/sal-mutations.js';
export const ST = ['b_Step1', 'b_Step12', 'b_Step_RnD', 'b_Step3', 'b_Step4', 'b_Step5', '//Network3/FBRs6/RsOut'];
const STN = {b_Step1: 'S1', b_Step12: 'S12', b_Step_RnD: 'S_RnD', b_Step3: 'S3', b_Step4: 'S4', b_Step5: 'S5', '//Network3/FBRs6/RsOut': 'S6'};
const MAP = {in_LV_Healthy_FBK: 'in_LV_Faulty_FBK', in_HV_Healthy_FBK: 'in_HV_Faulty_FBK'};
const mapIn = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [MAP[k] ?? k, v]));
export const raw0 = {in_ES_NC_1: true, in_ES_NC_2: true, in_InterLock_NC_1: true, in_InterLock_NC_2: true, in_LV_Connector_Interlock: true, in_HV_Connector_Interlock: true, in_Mentee_EStop: false, in_Estop_PLC: false, in_False_SI2_CH8: false, in_Reset_PB: false, in_Relase_Door_PB: false, in_Door_Monitor: true, in_Safety_Run: true, inPLC_RnD_Mode: false, inPLC_RnD_Mode_2: false, inPLC_BypassC1C2: false, in_LV_C1_FBK: false, in_HV_C2_FBK: false, in_STO_DR1_FBK: true, in_STO_DR2_FBK: true, in_LV_Faulty_FBK: false, in_HV_Faulty_FBK: false, in_C3_Manual_Set: false, in_C3_Manual_Reset: false, in_RBM_Manual_Set: false, in_RBM_Manual_Reset: false};
let mutDirN = 0;
export function rt({mut = [], dir = process.env.CAND_DIR} = {}, over = {}) {
  if (!dir) throw Error('CAND_DIR not set');
  let salPath = path.join(dir, 'TwinSafeGroup1.sal'), sgvl = path.join(dir, 'GVL1.sgvl');
  if (mut.length) {
    let xml = fs.readFileSync(salPath, 'utf8');
    for (const m of mut) xml = applyMutation(xml, m).xml;
    const d = path.join(process.env.MUT_SCRATCH ?? path.join(dir, '..', 'mut'), String(process.pid) + '-' + mutDirN++); fs.mkdirSync(d, {recursive: true});
    fs.writeFileSync(path.join(d, 'TwinSafeGroup1.sal'), xml); fs.copyFileSync(sgvl, path.join(d, 'GVL1.sgvl'));
    salPath = path.join(d, 'TwinSafeGroup1.sal'); sgvl = path.join(d, 'GVL1.sgvl');
  }
  const m = parseSalFile(salPath, {bindingMode: 'current', sgvlPath: sgvl});
  const names = new Set(m.variables.map(v => v.name));
  for (const k of Object.keys(raw0)) if (!names.has(k)) throw Error('unknown input ' + k);
  const r = new SalRuntime(m, {scanMs: 1, unconnectedInput: false});
  const set0 = r.setInputs.bind(r); r.setInputs = o => set0(mapIn(o));
  const get0 = r.get.bind(r); r.get = k => get0(MAP[k] ?? k);
  r.setInputs({...raw0, ...over}); r.t = 0; r.viol = []; r.hold = {}; r.plantC2 = true;
  r.step = (n = 1, inp) => {
    if (inp) r.setInputs(inp);
    for (let i = 0; i < n; i++) {
      const pl = {in_LV_C1_FBK: r.get('out_LV_C1'), in_STO_DR1_FBK: !r.get('STO_DR1'), in_STO_DR2_FBK: !r.get('STO_DR2')};
      if (r.plantC2) pl.in_HV_C2_FBK = r.get('out_HV_C2');
      r.setInputs({...pl, ...r.hold}); r.scan(1); r.t++;
      const st = ST.filter(s => r.get(s)); const sts = r.stsList();
      if (st.length > 1 || sts.length !== 1) r.viol.push(r.t + ':' + st.join('+') + ':' + sts.join('+'));
    }
    return r;
  };
  r.stsList = () => {const s = new Set(ST.filter(x => r.get(x))), eok = r.get('b_EStop_Ok'); const o = []; if ((s.has('b_Step1') || s.has('b_Step12')) && eok) o.push('SAFE'); if (s.has('b_Step_RnD') && eok) o.push('RND'); if (s.has('b_Step3') && eok) o.push('RUN'); if (!o.length) o.push('EMG'); return o;};
  r.ph = () => ST.filter(s => r.get(s)).map(s => STN[s]).join('+') || 'none';
  r.sts = () => r.stsList().join('+');
  return r;
}
export function gesture(r, {green = false, blue = false, ms = 600}) {r.step(1, {in_Reset_PB: green, in_Relase_Door_PB: blue}); r.step(ms); r.step(1, {in_Reset_PB: false, in_Relase_Door_PB: false});}
export function toRun(r) {
  r.step(10); r.step(1, {in_Reset_PB: true}); r.step(1, {in_Reset_PB: false}); r.step(2100);
  gesture(r, {green: true, blue: true, ms: 1100}); r.step(3000); const rnd = r.ph();
  gesture(r, {green: true, blue: true, ms: 1100}); r.step(3000); return rnd + ' -> ' + r.ph();
}
export function trace(r, n, f = () => '') {let prev = ''; const log = []; const t0 = r.t; for (let i = 0; i < n; i++) {r.step(1); const p = r.ph() + '|' + r.sts() + f(); if (p !== prev) {log.push((r.t - t0) + ':' + p); prev = p;}} return log.join('  ');}
