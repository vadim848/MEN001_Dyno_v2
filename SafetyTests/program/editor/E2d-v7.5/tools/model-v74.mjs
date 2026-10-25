// v7.3/v7.4 model self-check on the REAL candidates (no in-memory fix): architect repro c4 (spoil) and c6 (E2d-COV-1)
// scenarios + V73-D discriminating case; mutants = stand deactivate-input. Stand runtime model, not native, not G3.
// node model-v74.mjs <E2bDir> <E2dDir> <scratch> <out.json>
import fs from 'node:fs';
import {rt as rt0, gesture} from './cand-run.mjs';
const [e2b, e2d, scratch, out] = process.argv.slice(2); process.env.MUT_SCRATCH = scratch;
const D = (b, p) => ({op: 'deactivate-input', block: '//' + b, port: p});
const boot = r => {r.step(10); r.step(1, {in_Reset_PB: true}); r.step(1, {in_Reset_PB: false}); r.step(2100);};
const toRnd = r => {boot(r); gesture(r, {green: true, blue: true, ms: 1100}); r.step(2500);};
const coverHold = r => {toRnd(r); r.step(2100); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); r.step(300); r.step(1, {in_InterLock_NC_1: false}); r.step(200); r.step(1, {in_InterLock_NC_1: true}); r.step(1000); r.step(1, {in_Reset_PB: false, in_Relase_Door_PB: false}); r.step(2000); const a = r.ph(); r.step(2100); gesture(r, {green: true, blue: true, ms: 1100}); r.step(1500); return `after episode: ${a}; new gesture: ${r.ph()}`;};
// V73-D discriminating: cover episode restored BEFORE qualification (press at p, episode [p+from, p+from+len)), release at p+1100
const coverBeforeQ = (from, len) => r => {toRnd(r); r.step(2100); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); r.step(from - 1); r.step(len, {in_InterLock_NC_1: false}); r.step(1, {in_InterLock_NC_1: true}); r.step(1100 - from - len - 1); r.step(1, {in_Reset_PB: false, in_Relase_Door_PB: false}); r.step(2000); return r.ph();};
const connHold = r => {boot(r); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); r.step(300); r.step(1, {in_LV_Connector_Interlock: false}); r.step(200); r.step(1, {in_LV_Connector_Interlock: true}); r.step(1000); r.step(1, {in_Reset_PB: false, in_Relase_Door_PB: false}); r.step(2000); const a = r.ph(); r.step(2100); gesture(r, {green: true, blue: true, ms: 1100}); r.step(1500); return `after episode: ${a}; new gesture: ${r.ph()}`;};
const connBeforeQ = r => {boot(r); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); r.step(299); r.step(200, {in_LV_Connector_Interlock: false}); r.step(1, {in_LV_Connector_Interlock: true}); r.step(599); r.step(1, {in_Reset_PB: false, in_Relase_Door_PB: false}); r.step(2000); return r.ph();};
const safeCoverOpen = r => {boot(r); r.step(1, {in_InterLock_NC_1: false}); gesture(r, {green: true, blue: true, ms: 1100}); r.step(1500); return r.ph();};
const rndGreenCoverOpen = r => {toRnd(r); r.step(2100); r.step(1, {in_InterLock_NC_1: false}); gesture(r, {green: true}); r.step(1500); return r.ph();};
const rndBlueCoverOpen = r => {toRnd(r); r.step(2100); r.step(1, {in_InterLock_NC_1: false}); r.step(1, {in_Relase_Door_PB: true}); r.step(700); return 'UL=' + (+r.get('out_Door_Unlock_Solonoeid'));};
const rndBothCoverOpenWhole = r => {toRnd(r); r.step(2100); r.step(1, {in_InterLock_NC_1: false}); r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); r.step(1500); r.step(1, {in_InterLock_NC_1: true}); r.step(1500); return r.ph();};
function drive(r, ev, evAt) {
  toRnd(r); r.step(2100); r.plantC2 = false; r.hold = {in_HV_C2_FBK: false}; r.step(1, {in_Reset_PB: true, in_Relase_Door_PB: true}); const log = [];
  for (let i = 0; i < 9500; i++) {if (i === 1100) r.setInputs({in_Reset_PB: false, in_Relase_Door_PB: false}); if (evAt != null && i === evAt) r.setInputs(ev); r.step(1); log.push({t: i, su: r.get('recRndC_SU'), c2: r.get('out_HV_C2'), sto1: r.get('STO_DR1'), sto2: r.get('STO_DR2'), eok: r.get('b_EStop_Ok')});}
  return log;
}
const rows = [];
const say = (name, stack, res) => {rows.push({name, stack, res}); console.log(name.padEnd(56), stack.padEnd(36), res);};
const mk = (dir, mut = []) => () => rt0({dir, mut});
const C4 = [['R&D cover episode 200 ms during BOTH hold (c4)', coverHold], ['R&D cover p+300..p+500 restored before Q (V73-D)', coverBeforeQ(300, 200)], ['R&D cover 1 scan at p+998 (V73-D probe)', coverBeforeQ(998, 1)],
  ['Safe connector episode during BOTH hold (c4)', connHold], ['Safe connector p+300..p+500 restored before Q', connBeforeQ],
  ['Safe cover open BOTH (V14-Q7)', safeCoverOpen], ['R&D cover open green down', rndGreenCoverOpen], ['R&D cover open blue (Q-ARCH-10)', rndBlueCoverOpen], ['R&D BOTH with cover open, restore while held (IL-02)', rndBothCoverOpenWhole]];
for (const [n, f] of C4) for (const [lbl, dir] of [['E2b', e2b], ['E2d', e2d]]) say(n, lbl, f(mk(dir)()));
const MUTS = [
  ['R&D cover episode 200 ms during BOTH hold (c4)', coverHold, 'RndPhysicalCompact/GATE_029', 'OrIn6', 'E2b', 'M-E2b-42'],
  ['R&D cover p+300..p+500 restored before Q (V73-D)', coverBeforeQ(300, 200), 'RndPhysicalCompact/GATE_029', 'OrIn6', 'E2b', 'M-E2b-42'],
  ['Safe connector episode during BOTH hold (c4)', connHold, 'RndPhysicalCompact/GATE_029', 'OrIn7', 'E2b', 'M-E2b-43'],
  ['Safe connector p+300..p+500 restored before Q', connBeforeQ, 'RndPhysicalCompact/GATE_029', 'OrIn7', 'E2b', 'M-E2b-43'],
  ['R&D cover episode 200 ms during BOTH hold (c4)', coverHold, 'RndPhysicalCompact/GATE_SPOIL_R', 'AndIn3', 'E2b', 'M-E2b-44'],
  ['Safe connector episode during BOTH hold (c4)', connHold, 'RndPhysicalCompact/GATE_SPOIL_S', 'AndIn3', 'E2b', 'M-E2b-45'],
  ['Safe cover open BOTH (V14-Q7)', safeCoverOpen, 'RndPhysicalCompact/GATE_SPOIL_R', 'AndIn2', 'E2d', 'M-E2b-46'],
  ['R&D cover open green down', rndGreenCoverOpen, 'RndPhysicalCompact/GATE_SPOIL_R', 'AndIn1', 'E2d', 'M-E2b-47'],
  ['R&D cover open blue (Q-ARCH-10)', rndBlueCoverOpen, 'RndPhysicalCompact/GATE_SPOIL_R', 'AndIn1', 'E2d', 'M-E2b-47'],
];
for (const [n, f, b, p, st, id] of MUTS) say(n, `${st} mut ${b.split('/')[1]}.${p} (${id})`, f(mk(st === 'E2d' ? e2d : e2b, [D(b, p)])()));
const ref = drive(mk(e2d)(), null, null); const su = ref.find(s => s.su).t, u = ref.find(s => s.c2).t;
say('c6 no-event reference', 'E2d', `SU at ${su}, u (C2 ON) at ${u}, STO at ${ref.find(s => s.sto1)?.t}`);
const rep = log => {const at = k => log.filter(s => s.t >= u && s[k]).map(s => s.t - u); const r = k => {const a = at(k); return `${a.length}${a.length ? ' (u+' + a[0] + '..u+' + a.at(-1) + ')' : ''}`;}; const e = log.find(s => s.t >= u && !s.eok); return `C2 ON scans from u: ${r('c2')} | STO_DR1 released: ${r('sto1')} | STO_DR2 released: ${r('sto2')} | EOk FALSE at u+${e ? e.t - u : '-'}`;};
const P = ['FBAndHvSetPermit', 'FBAndSto1SetPermit', 'FBAndSto2SetPermit'];
const C6 = [['c6 NC1 at u', [], {in_InterLock_NC_1: false}], ['c6 NC2 at u', [], {in_InterLock_NC_2: false}], ['c6 in_Estop_PLC at u', [], {in_Estop_PLC: true}], ['c6 no event (positive)', [], null],
  ...P.flatMap((b, bi) => [5, 6].map(i => [`c6 mut ${b}.AndIn${i}, NC${i - 4} at u (M-E2d-${17 + bi * 2 + i - 5})`, [D('Network1/' + b, 'AndIn' + i)], {['in_InterLock_NC_' + (i - 4)]: false}]))];
for (const [n, mut, ev] of C6) say(n, 'E2d', rep(drive(mk(e2d, mut)(), ev, ev ? u : null)));
fs.writeFileSync(out, JSON.stringify({note: 'stand runtime model on real candidates; editor self-check only', e2b, e2d, rows}, null, 1) + '\n');
