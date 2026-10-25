// S4 attribution on E2d v7.7 (c2f9ccd7): (a) Safe->R&D timing BOTH vs legacy (1,0); (b) StartingRun with LV loss (STP-I).
import { cand, toRnd, boot } from './cand.mjs';
const OFF = { in_Reset_PB: false, in_Relase_Door_PB: false };
const SIG = { S1: 'b_Step1', S12: 'b_Step12', SR: 'b_Step_RnD', S3: 'b_Step3', S4: 'b_Step4', S5: 'b_Step5', S6: 'b_Step6', SU: 'recRndC_SU', SG: 'recRndC_SG', C1: 'out_LV_C1', C1F: 'in_LV_C1_FBK', C2: 'out_HV_C2', PLC_RnD: 'outPLC_RnD', EOk: 'b_EStop_Ok',
  n11And1: '//Network11/FBAnd1/AndOut', win: '//Network11/WIN_C1/TonOut', or17: '//Network1/FBOr17/OrOut', lvSet: '//Network1/FBAndLvSetPermit/AndOut', lvCur: '//Network1/FBAndLvCurrentPermit/AndOut', n1And1: '//Network1/FBAnd1/AndOut', s12set: 'b_Step12_Set' };
const snap = r => Object.fromEntries(Object.entries(SIG).map(([k, v]) => { try { return [k, +!!r.get(v)]; } catch { return [k, '?']; } }));
function changes(tr, keys) { const out = []; let prev = null; for (const x of tr) { const s = keys.map(k => x[k]).join(''); if (s !== prev) out.push(`${x.k}:${keys.map(k => k + '=' + x[k]).join(',')}`); prev = s; } return out; }
const name = process.argv[2] ?? 'E2d';
function safeUp(kind) { const r = cand(name); boot(r); r.step(2400, OFF); const tr = [];
  for (let k = 0; k < 900; k++) { const inp = {}; if (kind === 'legacy') { if (k === 0) inp.inPLC_RnD_Mode = true; if (k === 600) inp.inPLC_RnD_Mode = false; }
    else { if (k === 0) inp.in_Relase_Door_PB = true; if (k === 100) inp.in_Reset_PB = true; if (k === 1200) Object.assign(inp, OFF); }
    r.step(1, inp); tr.push({ k, ...snap(r) }); if (kind !== 'legacy' && k === 899) { for (let j = 900; j < 1900; j++) { const i2 = {}; if (j === 1200) Object.assign(i2, OFF); r.step(1, i2); tr.push({ k: j, ...snap(r) }); } } }
  const f = key => tr.find(x => x[key] === 1)?.k; const A1 = f('S12'), u1 = f('C1'), R = f('SR');
  console.log(`== Safe->R&D ${kind} (${name}): A1 ${A1}, u1 ${u1}, N11/FBAnd1 ${f('n11And1')}, b_Step12_Set ${f('s12set')}, FBOr17 ${f('or17')}, LvSetPermit ${f('lvSet')}, C1_FBK ${f('C1F')}, WIN_C1 out ${f('win')}, R(SR) ${R}, outPLC_RnD ${f('PLC_RnD')} -> R-u1 = ${R - u1}`);
  console.log('   ', changes(tr.filter(x => x.k <= (A1 ?? 0) + 5), ['S12', 'n11And1', 'or17', 'lvCur', 'n1And1', 'lvSet', 'C1']).join(' | '));
}
safeUp('both'); safeUp('legacy');
// (b) StartingRun, LV Faulty during SU (STP-I): stage / outPLC_RnD per scan
function stpI(at) { const r = cand(name); toRnd(r); r.step(2400, OFF); const tr = []; let A = null;
  for (let k = 0; k < 9000; k++) { const inp = {}; if (k === 0) inp.in_Relase_Door_PB = true; if (k === 100) inp.in_Reset_PB = true; if (k === 1200) Object.assign(inp, OFF);
    if (A !== null && k === A + at) inp.in_LV_Faulty_FBK = true; r.step(1, inp); const s = snap(r); if (A === null && s.SU) A = k; tr.push({ k, ...s }); }
  console.log(`== STP-I (${name}): A(SU) ${A}, LV Faulty from A+${at}`);
  console.log('   ', changes(tr.filter(x => x.k >= A - 1), ['S1', 'S12', 'SR', 'S3', 'S4', 'S5', 'S6', 'SU', 'SG', 'C1', 'C2', 'PLC_RnD', 'EOk']).map(s => s.replace(/(\d+):/, (m, k) => `A+${k - A}:`)).join('\n    '));
}
stpI(50);
