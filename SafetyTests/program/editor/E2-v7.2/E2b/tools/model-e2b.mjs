// E2b model self-check (stand runtime on the REAL candidate via cand-run.mjs; NOT native, NOT an acceptance test).
// Architect repro t18 (DIS-HOLD, BOOT, Bypass), t20 (rows B/C/D/E, C delta sweep, BOOT B6-1) and reviewer v7 x1 (A..E), x4,
// each on the base stack (E2a-RC) and on the candidate (E2b); deactivate-input mutants on the candidate only.
// node model-e2b.mjs <baseDir> <candDir> <scratch> <out.json>
import fs from 'node:fs';
import {rt as rt0, toRun, gesture} from './cand-run.mjs';
const [baseDir, candDir, scratch, out] = process.argv.slice(2);
process.env.MUT_SCRATCH = scratch;
const D = (b, p) => ({op: 'deactivate-input', block: b, port: p});
const H = 'out_HV_Discharge_Request', L = 'out_LV_Discharge_Request';
const boot = r => {r.step(10); r.step(1, {in_Reset_PB: true}); r.step(1, {in_Reset_PB: false}); r.step(2100);};
const toRnd = r => {boot(r); gesture(r, {green: true, blue: true, ms: 1100}); r.step(3000);};
const tr = (r, n, sigs) => {let prev = '', log = [], t0 = r.t; for (let i = 0; i < n; i++) {r.step(1); const s = r.ph() + '|' + r.sts() + '|' + sigs.map(x => x.replace('out_', '').replace('_Discharge_Request', 'REQ') + '=' + (+!!r.get(x))).join(','); if (s !== prev) {log.push((r.t - t0) + ':' + s); prev = s;}} return log.join('  ');};
const SIG = ['out_HV_C2', 'out_LV_C1', H, L];
const minOver = (r, sig, n) => {let mn = 1, fs_ = -1; for (let i = 0; i < n; i++) {r.step(1); if (!r.get(sig)) {mn = 0; if (fs_ < 0) fs_ = i + 1;}} return `min=${mn}${fs_ > 0 ? ' firstFALSE@+' + fs_ : ''}`;};
const watch = (r, sig, trig, n) => {let ta = -1, td = -1; for (let i = 0; i < n; i++) {r.step(1); if (ta < 0 && r.get(trig)) ta = r.t; if (td < 0 && !r.get(sig)) td = r.t;} return {ta, td};};
const rndWithReq = rt => {const r = rt(); toRun(r); gesture(r, {green: true}); r.step(3000); r.step(2100); return r;};
const SC = {
  // ---- t18 ----
  't18 HV': rt => {const r = rt(); toRun(r); gesture(r, {green: true}); r.step(3000); const pre = +r.get(H); r.step(2100); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); const w = watch(r, H, 'recRndC_SU', 1100); r.step(1, {in_Reset_PB: false, in_Relase_Door_PB: false}); r.step(200); return `pre=${pre} SU@${w.ta} reqOFF@${w.td} (${w.ta > 0 && w.td > 0 ? 'reqOFF-a=' + (w.td - w.ta) : '-'}) end req=${+r.get(H)} ${r.ph()}`;},
  't18 HV rejected (cover open)': rt => {const r = rt(); toRun(r); gesture(r, {green: true}); r.step(3000); const pre = +r.get(H); r.step(2100); r.setInputs({in_InterLock_NC_1: false}); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); const w = watch(r, H, 'recRndC_SU', 1100); r.step(1, {in_Reset_PB: false, in_Relase_Door_PB: false}); r.step(200); return `pre=${pre} SU@${w.ta} reqOFF@${w.td} end req=${+r.get(H)} ${r.ph()}/${r.sts()}`;},
  't18 LV': rt => {const r = rt(); toRnd(r); r.step(2100); gesture(r, {green: true}); r.step(2000); const pre = +r.get(L); r.step(2100); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); const w = watch(r, L, 'b_Step12_Set', 1100); return `pre=${pre} g2@${w.ta} reqOFF@${w.td} (${w.ta > 0 && w.td > 0 ? 'reqOFF-a=' + (w.td - w.ta) : '-'})`;},
  't18 BOOT (C1_FBK ON at start)': rt => {const r = rt({}, {in_LV_C1_FBK: true}); r.hold = {in_LV_C1_FBK: true}; r.step(10); r.step(1, {in_Reset_PB: true}); r.step(1, {in_Reset_PB: false}); r.step(50); const a = r.ph() + '/' + r.sts(); r.hold = {in_LV_C1_FBK: false}; r.step(10); r.step(1, {in_Reset_PB: true}); r.step(100); r.step(1, {in_Reset_PB: false}); r.step(50); return `FBK ON Restart -> ${a}; FBK OFF Restart -> ${r.ph()}/${r.sts()}`;},
  't18 BYP R&D Bypass 3 s': rt => {const r = rt(); toRnd(r); r.step(1, {inPLC_BypassC1C2: true}); r.step(3000); return `R&D Bypass 3 s: C2=${+r.get('out_HV_C2')} ${r.ph()}`;},
  // ---- t20 ----
  't20 B rejected PLC cover open': rt => {const r = rndWithReq(rt); r.setInputs({in_InterLock_NC_1: false}); r.step(5); r.setInputs({inPLC_RnD_Mode: true, inPLC_RnD_Mode_2: true}); return minOver(r, H, 3000) + ' ' + r.ph();},
  't20 C R&D EStop PLC(1,1)': rt => {const r = rndWithReq(rt); r.setInputs({in_ES_NC_1: false}); r.step(1); r.setInputs({inPLC_RnD_Mode: true, inPLC_RnD_Mode_2: true}); return minOver(r, H, 3000) + ' ' + r.ph() + ' C1=' + +r.get('out_LV_C1') + ' C2=' + +r.get('out_HV_C2');},
  ...Object.fromEntries([-2, -1, 0, 1, 2, 5].map(dl => [`t20 C delta ${dl}`, rt => {const r = rndWithReq(rt); const es = () => r.setInputs({in_ES_NC_1: false}), plc = () => r.setInputs({inPLC_RnD_Mode: true, inPLC_RnD_Mode_2: true}); if (dl < 0) {plc(); r.step(-dl); es();} else {es(); r.step(dl); plc();} const mo = minOver(r, H, 3000); return mo + ' ' + r.ph() + ' C1=' + +r.get('out_LV_C1') + ' C2=' + +r.get('out_HV_C2') + ' STO=' + +r.get('STO_DR1');}])),
  't20 D Safe EStop PLC(1,0) LV': rt => {const r = rt(); toRnd(r); r.step(2100); gesture(r, {green: true}); r.step(2000); const pre = +r.get(L); r.setInputs({in_ES_NC_1: false}); r.step(5); r.setInputs({inPLC_RnD_Mode: true}); return `pre=${pre} ` + minOver(r, L, 3000) + ' ' + r.ph();},
  't20 E button R&D->Run': rt => {const r = rndWithReq(rt); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); let a = -1, off = -1, u = -1; for (let i = 0; i < 1100; i++) {r.step(1); if (a < 0 && r.get('recRndC_SU')) a = r.t; if (u < 0 && r.get('out_HV_C2')) u = r.t; if (off < 0 && !r.get(H)) off = r.t;} return `a=0 u=+${u - a} reqOFF=${off < 0 ? 'never' : '+' + (off - a)}`;},
  ...Object.fromEntries([1, 2000].map(g => [`t20 BOOT FBK OFF at r+${g}`, rt => {const r = rt({}, {in_LV_C1_FBK: true}); r.hold = {in_LV_C1_FBK: true}; r.step(10); r.step(1, {in_Reset_PB: true}); r.step(1, {in_Reset_PB: false}); r.step(g); r.hold = {in_LV_C1_FBK: false}; r.step(3000); const a = r.ph() + '/' + r.sts(); r.step(1, {in_Reset_PB: true}); r.step(100); r.step(1, {in_Reset_PB: false}); r.step(20); return `3 s later: ${a} -> new Restart ${r.ph()}/${r.sts()}`;}])),
  // ---- reviewer x1 ----
  'x1 A ES at SU+49 (StartingRun)': rt => {const r = rt(); toRun(r); gesture(r, {green: true}); r.step(5100); const pre = `${r.ph()} ${r.sts()} HVreq ${+r.get(H)}`; r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); let a = -1; for (let i = 0; i < 1100 && a < 0; i++) {r.step(1); if (r.get('recRndC_SU')) a = r.t;} r.step(1, {in_Reset_PB: false, in_Relase_Door_PB: false}); r.step(48); r.setInputs({in_ES_NC_1: false}); return `pre ${pre}; ES at a+${r.t - a}: ` + tr(r, 15000, SIG);},
  'x1 B legacy Safe->R&D->Run, ES in Run PLC(1,1) held': rt => {const r = rt(); boot(r); r.step(1, {inPLC_RnD_Mode: true}); r.step(3000); const a = `R&D? ${r.ph()} ${r.sts()}`; r.step(1, {inPLC_RnD_Mode_2: true}); r.step(3000); const b = `Run? ${r.ph()} ${r.sts()} C2 ${+r.get('out_HV_C2')} HVreq ${+r.get(H)}`; r.setInputs({in_ES_NC_1: false}); return `${a}; ${b}; ES: ` + tr(r, 15000, SIG);},
  'x1 C R&D req, PLC(1,1) cover open': rt => {const r = rt(); toRun(r); gesture(r, {green: true}); r.step(5100); const pre = `${r.ph()} HVreq ${+r.get(H)}`; r.step(1, {in_InterLock_NC_1: false}); r.step(100); r.step(1, {inPLC_RnD_Mode: true, inPLC_RnD_Mode_2: true}); return `pre ${pre}: ` + tr(r, 1500, SIG);},
  'x1 D Safe ES then PLC(1,0)': rt => {const r = rt(); toRnd(r); gesture(r, {green: true}); r.step(4000); const pre = `${r.ph()} ${r.sts()} HV ${+r.get(H)} LV ${+r.get(L)}`; r.step(1, {in_ES_NC_1: false}); r.step(100); r.step(1, {inPLC_RnD_Mode: true}); return `pre ${pre}: ` + tr(r, 1500, SIG.concat(['b_Step12_Set']));},
  'x1 E Safe->R&D keeps HV; R&D->Run keeps LV': rt => {const r = rt(); toRun(r); gesture(r, {green: true}); r.step(5100); gesture(r, {green: true}); r.step(4000); const pre = `${r.ph()} HV ${+r.get(H)} LV ${+r.get(L)}`; r.step(2100); gesture(r, {green: true, blue: true, ms: 1100}); const a = tr(r, 3000, SIG); gesture(r, {green: true, blue: true, ms: 1100}); return `pre ${pre}; Safe->R&D: ${a}; R&D->Run: ` + tr(r, 2500, SIG);},
  // ---- reviewer x4 ----
  ...Object.fromEntries([['C1_FBK', {in_LV_C1_FBK: true}], ['C2_FBK', {in_HV_C2_FBK: true}], ['both', {in_LV_C1_FBK: true, in_HV_C2_FBK: true}]].flatMap(([name, fbk]) => ['r+1', 'r+2000', 'never'].map(gOff => [`x4 ${name} FBK OFF at ${gOff}`, rt => {
    const r = rt({}, fbk); r.plantC2 = false; r.hold = {...fbk}; r.step(400); r.step(1, {in_Reset_PB: true}); r.step(100); r.step(1, {in_Reset_PB: false});
    if (gOff === 'r+2000') r.step(1999); const before = r.ph() + '/' + r.sts(); if (gOff !== 'never') r.hold = {in_LV_C1_FBK: false, in_HV_C2_FBK: false};
    let first = ''; for (let i = 0; i < 3000; i++) {r.step(1); const s = r.ph() + '/' + r.sts(); if (!first && s !== 'none/EMG') first = `${s} at g+${i + 1}`;}
    return `before g ${before}; after g without new Restart: ${first || 'stays none/EMG'} EOk=${+r.get('b_EStop_Ok')}`;}]))),
};
const MUT = [
  ['t18 HV', [D('//Network1/FBOr5', 'OrIn2')]],
  ['t18 LV', [D('//Network1/FBOr1', 'OrIn2')]],
  ['t18 BOOT (C1_FBK ON at start)', [D('//Network3/FBAndBootFbkOff', 'AndIn1')]],
  ['t18 BOOT (C1_FBK ON at start)', [D('//Network3/FBAnd1', 'AndIn3')]],
  ['t18 BYP R&D Bypass 3 s', [D('//Network1/FBAnd4', 'AndIn5')]],
  ['t20 B rejected PLC cover open', [D('//Network12/FBAnd4', 'AndIn2')]],
  ['t20 D Safe EStop PLC(1,0) LV', [D('//Network2/FBAnd91', 'AndIn4')]],
  ['t20 BOOT FBK OFF at r+1', [D('//Network3/FBAndBootFbkOff', 'AndIn4')]],
  ['t20 BOOT FBK OFF at r+2000', [D('//Network3/FBAndBootFbkOff', 'AndIn3')]],
  ['t20 C R&D EStop PLC(1,1)', [D('//Network6/FBOrStep4', 'OrIn2')]],
];
const rows = [];
const mk = (dir, mut = []) => (o = {}, over = {}) => rt0({mut, dir, ...o}, over);
for (const [name, f] of Object.entries(SC)) {
  const row = {name};
  for (const [lbl, dir] of [['E2a-RC', baseDir], ['E2b', candDir]]) {try {const res = f(mk(dir)); row[lbl] = res;} catch (e) {row[lbl] = 'ERROR ' + e.message;}}
  rows.push(row); console.log(name.padEnd(46), '| E2a-RC:', row['E2a-RC'], '\n'.padEnd(48), '| E2b   :', row.E2b);
}
for (const [name, mut] of MUT) {
  const row = {name: 'MUTANT ' + mut.map(m => `${m.block}.${m.port}`).join(',') + ' :: ' + name};
  try {row.E2b = SC[name](mk(candDir, mut));} catch (e) {row.E2b = 'ERROR ' + e.message;}
  rows.push(row); console.log(row.name.padEnd(46), '| E2b   :', row.E2b);
}
fs.writeFileSync(out, JSON.stringify({note: 'stand runtime model on real candidate files (cand-run.mjs); editor self-check only, not a requirement PASS', base: baseDir, candidate: candDir, rows}, null, 1) + '\n');
