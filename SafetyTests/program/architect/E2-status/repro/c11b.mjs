// v7.8 candidate fix for S4(a)/RND-CONF-T legacy: anchor WIN_C1 to the C1 command (decision 68 B "500 ms from command C1 ON").
// NEW Network11/WIN_C1_IN safeAnd (AndIn1 wire N11/FBAnd1, AndIn2 out_LV_C1 NC) -> WIN_C1.TonIn; order: after N11/FBAnd1, before WIN_C1.
import { cand, toRnd, boot, gesture } from './cand.mjs';
const NC = 'Break Contact (NC)';
export function fix(m, { mut } = {}) {
  const B = new Map(m.networks.flatMap(n => n.blocks).map(b => [b.path, b])); const net = m.networks.find(x => x.name === 'Network11');
  const and1 = B.get('//Network11/FBAnd1').outputs[0], win = B.get('//Network11/WIN_C1'); const tin = win.inputs.find(q => q.name === 'TonIn');
  and1.targets = and1.targets.filter(t => t !== tin.path);
  const path = '//Network11/WIN_C1_IN'; const b = { type: 'x', name: 'WIN_C1_IN', functionName: 'safeAnd', orderOfExecution: 0, path, inputs: [], outputs: [{ name: 'AndOut', path: path + '/AndOut', targets: [tin.path], sources: [], globals: [] }], parameters: [] };
  b.inputs.push({ name: 'AndIn1', path: path + '/AndIn1', sources: [and1.path], targets: [], globals: [], channelInterface: 'Activated', deactivate1: NC }); and1.targets.push(path + '/AndIn1');
  if (mut !== 'noCmd') b.inputs.push({ name: 'AndIn2', path: path + '/AndIn2', sources: [], targets: [], globals: [{ resolvedName: 'out_LV_C1' }], channelInterface: 'Activated', deactivate1: NC });
  tin.sources = [b.outputs[0].path]; net.blocks.push(b);
  const all = m.networks.flatMap(n => n.blocks).filter(x => x !== b).sort((a, c) => a.orderOfExecution - c.orderOfExecution); all.splice(all.indexOf(win), 0, b); all.forEach((x, k) => x.orderOfExecution = k + 1);
}
const OFF = { in_Reset_PB: false, in_Relase_Door_PB: false };
const V = { 'v7.7': null, 'v7.8': m => fix(m), 'mut.noCmd': m => fix(m, { mut: 'noCmd' }) };
function up(v, kind, { fbkDelay = 0 } = {}) { const r = cand('E2d', V[v]); boot(r); r.step(2400, OFF); if (fbkDelay) r.plant = false; const tr = [];
  for (let k = 0; k < 2200; k++) { const inp = {}; if (kind === 'legacy') { if (k === 0) inp.inPLC_RnD_Mode = true; if (k === 600) inp.inPLC_RnD_Mode = false; } else { if (k === 0) inp.in_Relase_Door_PB = true; if (k === 100) inp.in_Reset_PB = true; if (k === 1200) Object.assign(inp, OFF); }
    r.step(1, inp); if (fbkDelay) { const u = tr.find(x => x.c1)?.k; r.setInputs({ in_LV_C1_FBK: u != null && k >= u + fbkDelay }); } tr.push({ k, c1: r.get('out_LV_C1'), rnd: r.get('b_Step_RnD'), plc: r.get('outPLC_RnD') }); }
  const u1 = tr.find(x => x.c1)?.k, R = tr.find(x => x.rnd)?.k, P = tr.find(x => x.plc)?.k; return `u1 ${u1}, R&D ${R} (u1+${R - u1}), outPLC_RnD ${P} (u1+${P - u1})`; }
if ((process.argv[1] ?? "").includes("c11b.mjs")) {
for (const v of Object.keys(V)) for (const kind of ['both', 'legacy']) console.log(`${v} ${kind}`.padEnd(20), up(v, kind));
for (const v of ['v7.7', 'v7.8']) console.log(`${v} legacy, C1_FBK at u1+550`.padEnd(20), up(v, 'legacy', { fbkDelay: 550 }));
// per-scan regression v7.7 vs v7.8 on a full cycle (expected difference: R&D one scan later on the BOTH path)
const OUTS = ['out_LV_C1', 'out_HV_C2', 'STO_DR1', 'STO_DR2', 'out_Door_Unlock_Solonoeid', 'b_Step1', 'b_Step12', 'b_Step_RnD', 'b_Step3', 'b_Step4', 'b_EStop_Ok', 'recRndC_SU'];
function trace(v) { const r = cand('E2d', V[v]); const tr = []; const rec = (n, inp) => { if (inp) r.setInputs(inp); for (let i = 0; i < n; i++) { r.step(1); tr.push(OUTS.map(o => +r.get(o)).join('')); } };
  const G = (keys, ms) => { rec(1, keys); rec(ms); rec(1, OFF); };
  boot(r); rec(2400); G({ in_Reset_PB: true, in_Relase_Door_PB: true }, 1100); rec(4500); G({ in_Reset_PB: true, in_Relase_Door_PB: true }, 1100); rec(4500); G({ in_Reset_PB: true }, 600); rec(4500); G({ in_Reset_PB: true }, 600); rec(6000); return tr; }
const a = trace('v7.7'), b = trace('v7.8'); const d = []; a.forEach((x, i) => { if (x !== b[i]) d.push(i); });
console.log(`full cycle v7.7 vs v7.8: ${d.length} differing scans${d.length ? ' at ' + d.slice(0, 5).join(',') + (d.length > 5 ? '...' : '') : ''}; ${OUTS.join(',')}`);
for (const i of d.slice(0, 3)) console.log(`  scan ${i}: v7.7 ${a[i]} v7.8 ${b[i]}`);
}
