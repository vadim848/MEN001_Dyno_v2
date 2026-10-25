// E2-R1 editor self-check: lock-step model differential canonical F1 vs R1 candidate.
// Not an acceptance oracle and not a substitute for the tester's R1-01(b) regression.
// Uses the stand runtime (src/sal-runtime.js, unconnectedInput:false = DEC-3 FALSE, DERIVED).
// node r1-differential.mjs <canonicalDir> <candidateDir> <out.json> [episodes] [seed]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {parseSalFile} from '../../../../src/sal-parser.js';
import {SalRuntime} from '../../../../src/sal-runtime.js';

const [canDir, candDir, outFile, epArg, seedArg] = process.argv.slice(2);
const EPISODES = +(epArg ?? 60), SEED = +(seedArg ?? 1);
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
// Stand parser (src/sal-parser.js elements()) does not accept self-closing <Network .../> written by the
// native serializer for empty networks. Diagnostic workaround in a temp copy only: expand to <Network ...></Network>.
function loadModel(dir) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r1diff-'));
  let sal = fs.readFileSync(path.join(dir, 'TwinSafeGroup1.sal'), 'utf8');
  const expanded = sal.replace(/<Network\b([^>]*?)\s*\/>/g, '<Network$1></Network>');
  fs.writeFileSync(path.join(tmp, 'TwinSafeGroup1.sal'), expanded);
  fs.copyFileSync(path.join(dir, 'GVL1.sgvl'), path.join(tmp, 'GVL1.sgvl'));
  const model = parseSalFile(path.join(tmp, 'TwinSafeGroup1.sal'), {bindingMode: 'current', sgvlPath: path.join(tmp, 'GVL1.sgvl')});
  if (model.bindingAudit.status !== 'PASS') throw Error('binding audit ' + dir);
  return {model, expandedSelfClosingNetworks: expanded !== sal, sha: {sal: hash(path.join(dir, 'TwinSafeGroup1.sal')), sgvl: hash(path.join(dir, 'GVL1.sgvl'))}};
}
const A = loadModel(canDir), B = loadModel(candDir);
const blocksA = A.model.networks.flatMap(n => n.blocks), blocksB = B.model.networks.flatMap(n => n.blocks);
const RAW = {in_ES_NC_1: true, in_ES_NC_2: true, in_InterLock_NC_1: true, in_InterLock_NC_2: true, in_LV_Connector_Interlock: true, in_HV_Connector_Interlock: true, in_Mentee_EStop: false, in_Estop_PLC: false, in_False_SI2_CH8: false, in_Reset_PB: false, in_Relase_Door_PB: false, in_Door_Monitor: true, in_Safety_Run: false, inPLC_RnD_Mode: false, inPLC_RnD_Mode_2: false, inPLC_BypassC1C2: false, in_LV_C1_FBK: false, in_HV_C2_FBK: false, in_STO_DR1_FBK: true, in_STO_DR2_FBK: true, in_LV_Healthy_FBK: true, in_HV_Healthy_FBK: true, in_C3_Manual_Set: false, in_C3_Manual_Reset: false, in_RBM_Manual_Set: false, in_RBM_Manual_Reset: false, GroupPort_ErrAck: false};
const outVars = A.model.variables.filter(v => v.sourcePorts.length).map(v => v.name);
const varsB = new Set(B.model.variables.map(v => v.name));
for (const v of outVars) if (!varsB.has(v)) throw Error('SAL variable missing in candidate ' + v);
// all output ports of surviving blocks (path-identical in both)
const pathsB = new Set(blocksB.flatMap(b => b.outputs.map(p => p.path)));
const comparePorts = blocksA.flatMap(b => b.outputs.map(p => p.path)).filter(p => pathsB.has(p));
const deletedOutPorts = blocksA.flatMap(b => b.outputs.map(p => p.path)).filter(p => !pathsB.has(p));
const stage = r => ['//Network3/FBRs1/RsOut', '//Network3/FBRs8/RsOut', '//Network3/FBRs7/RsOut', '//Network3/FBRs3/RsOut', '//Network3/FBRs4/RsOut', '//Network3/FBRs5/RsOut', '//Network3/FBRs6/RsOut'].map(p => r.get(p) ? 1 : 0).join('');
let rng = SEED >>> 0; const rand = () => {rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 2 ** 32;};
const pick = a => a[Math.floor(rand() * a.length)];
const report = {generatedAt: new Date().toISOString(), seed: SEED, episodes: EPISODES, canonical: A.sha, candidate: B.sha, candidateExpandedSelfClosingNetworks: B.expandedSelfClosingNetworks, comparedSalOutputs: outVars.length, comparedBlockOutputPorts: comparePorts.length, scans: 0, mismatches: [], stageCoverage: {}, canonicalStep2EverTrue: false, deletedOutputsEverTrue: {}, limits: 'Model differential on the stand runtime (not native semantics; DEC-3 unconnected DECOUPLE input = FALSE is the stand assumption, DERIVED). Random plant/fault protocol, not requirement coverage.'};
const faults = ['in_ES_NC_1', 'in_ES_NC_2', 'in_InterLock_NC_1', 'in_InterLock_NC_2', 'in_LV_Connector_Interlock', 'in_HV_Connector_Interlock', 'in_Mentee_EStop', 'in_Estop_PLC', 'in_Door_Monitor', 'in_LV_Healthy_FBK', 'in_HV_Healthy_FBK', 'inPLC_RnD_Mode', 'inPLC_RnD_Mode_2', 'inPLC_BypassC1C2', 'in_C3_Manual_Set', 'in_C3_Manual_Reset', 'in_RBM_Manual_Set', 'in_RBM_Manual_Reset', 'in_STO_DR1_FBK', 'in_STO_DR2_FBK', 'in_Safety_Run', 'GroupPort_ErrAck'];
// Scripted lifecycle (boot/Restart -> BOTH -> R&D -> optional C3 -> BOTH -> Run) with random events injected at
// random times in a random phase; then random gestures/faults. Each runtime has its own plant (A2 of the tester
// helper: C1/C2 FBK follow out_LV_C1/out_HV_C2, STO FBK = !STO_DRx, one scan delay). Identical input stream.
const OFF = {in_Reset_PB: false, in_Relase_Door_PB: false}, GREEN = {in_Reset_PB: true, in_Relase_Door_PB: false}, BLUE = {in_Reset_PB: false, in_Relase_Door_PB: true}, BOTH = {in_Reset_PB: true, in_Relase_Door_PB: true};
for (let ep = 0; ep < EPISODES; ep++) {
  const ra = new SalRuntime(A.model, {scanMs: 1, unconnectedInput: false}), rb = new SalRuntime(B.model, {scanMs: 1, unconnectedInput: false});
  const lvSplit = rand() < 0.85;
  const inp = {...RAW, in_Safety_Run: rand() < 0.85, in_LV_Healthy_FBK: lvSplit, in_HV_Healthy_FBK: false};
  ra.setInputs(inp); rb.setInputs(inp);
  const holds = {}; let epMismatch = 0, scans = 0; const plan = []; let t = 0;
  const at = (n, o) => {t += n; plan.push([t, o]);};
  // script
  at(10, OFF); at(10, GREEN); at(1, OFF); at(2200, {});
  const phases = ['Safe', 'S12', 'RnD', 'SU', 'Run', 'Down'];
  const evPhase = pick(phases), evDelay = Math.floor(rand() * 1500);
  const event = () => {const k = pick(faults.filter(f => f !== 'in_Safety_Run' || rand() < 0.2)); return {[k]: !inp[k]};};
  const ev = event();
  const pushEvent = () => {at(evDelay, ev); if (rand() < 0.6) at(300 + Math.floor(rand() * 3000), Object.fromEntries(Object.keys(ev).map(k => [k, !ev[k]])));};
  if (evPhase === 'Safe') pushEvent();
  at(1, BOTH); if (evPhase === 'S12') {at(1100, OFF); pushEvent();} else at(1100, OFF);
  at(2400, lvSplit ? {in_LV_Healthy_FBK: false} : {}); if (evPhase === 'RnD') pushEvent();
  if (rand() < 0.5) {at(100, {in_C3_Manual_Set: true}); at(100, {in_C3_Manual_Set: false, in_RBM_Manual_Set: true}); at(100, {in_RBM_Manual_Set: false});}
  at(100, BOTH); at(1100, OFF); if (evPhase === 'SU') pushEvent();
  at(3000, {}); if (evPhase === 'Run') pushEvent();
  at(500, GREEN); at(600, OFF); if (evPhase === 'Down') pushEvent();
  // random tail: gestures, PLC inputs, restart attempts
  for (let k = 0; k < 6; k++) {const g = pick([GREEN, BLUE, BOTH, OFF, {inPLC_RnD_Mode: rand() < 0.5}, {inPLC_RnD_Mode_2: rand() < 0.5}, {inPLC_BypassC1C2: rand() < 0.5}, event()]); at(200 + Math.floor(rand() * 2500), g); at(pick([100, 499, 501, 999, 1001, 1500]), OFF);}
  at(3000, {});
  plan.sort((a, b) => a[0] - b[0]);
  let pi = 0;
  for (let s = 0; s <= t; s++) {
    while (pi < plan.length && plan[pi][0] <= s) {Object.assign(inp, plan[pi][1]); pi++;}
    for (const r of [ra, rb]) {r.setInputs(inp); r.setInputs({in_LV_C1_FBK: r.get('out_LV_C1'), in_HV_C2_FBK: r.get('out_HV_C2'), in_STO_DR1_FBK: !r.get('STO_DR1'), in_STO_DR2_FBK: !r.get('STO_DR2')}); r.scan(1);}
    report.scans++; scans++;
    const st = stage(ra); report.stageCoverage[st] = (report.stageCoverage[st] ?? 0) + 1;
    if (ra.get('b_Step2')) report.canonicalStep2EverTrue = true;
    for (const p of deletedOutPorts) if (ra.get(p)) report.deletedOutputsEverTrue[p] = (report.deletedOutputsEverTrue[p] ?? 0) + 1;
    const diffs = [];
    for (const v of outVars) if (ra.get(v) !== rb.get(v)) diffs.push('var:' + v);
    for (const p of comparePorts) if (ra.get(p) !== rb.get(p)) diffs.push(p);
    if (diffs.length) {epMismatch++; if (report.mismatches.length < 50) report.mismatches.push({episode: ep, scan: s, diffs: diffs.slice(0, 20), stage: st});}
  }
  const reached = Object.keys(report.stageCoverage);
  console.log(`episode ${ep} scans ${scans} mismatches ${epMismatch} event ${evPhase} ${JSON.stringify(ev)} lvSplit=${lvSplit} safetyRun=${inp.in_Safety_Run}`);
}
report.stageLegend = 'bits S1 S12 SR S3 S4 S5 S6 (canonical runtime)';
fs.writeFileSync(outFile, JSON.stringify(report, null, 1) + '\n');
console.log(JSON.stringify({scans: report.scans, mismatches: report.mismatches.length, stageCoverage: report.stageCoverage, canonicalStep2EverTrue: report.canonicalStep2EverTrue, deletedOutputsEverTrue: report.deletedOutputsEverTrue}, null, 1));
process.exitCode = report.mismatches.length ? 1 : 0;
