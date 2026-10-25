// Tester E1-f1 gap tests (written before the G3 verdict, from requirements; not from the editor's material).
// Oracle sources: SCENARIO_DECISIONS.md Vadim confirmations 2026-10-20/21 #3 (second<=250 inclusive, BOTH 1 s),
// #6/#11 (second >250 before single acceptance: whole attempt invalid, no single/BOTH, no fault),
// #7 (partial release of a started two-button attempt never becomes a single; both off before new attempt),
// #9 (2 s continuous both-off before a new attempt), D-RUN-BOTH-IGNORE, D-LATE-SECOND, D-Q500, BTN-001..008,
// EMG priority (emergency/protective causes are not overridden). PLAN-ORACLE rows are explicitly derived from the
// frozen architect plan F1_RUN_RECOGNIZER_PLAN (b52f6b0e) semanticEquations, not from requirements; they are listed
// separately as design conformance used to kill guard mutants.
// Usage: MEN001_F1_ROOT=<root> MEN001_F1_GAPS_OUTPUT=<json> node f1-gaps.mjs
import fs from 'node:fs';
import {createSafeRunFixture, compressFrames} from './run-source.js';
const {createRndDownFixture} = await import('./lifecycle-source.js');
const both = {in_Reset_PB: true, in_Relase_Door_PB: true}, off = {in_Reset_PB: false, in_Relase_Door_PB: false};
const single = k => k === 'green' ? {in_Reset_PB: true} : {in_Relase_Door_PB: true};
const down = ['runPhysical', 'runAggregate', 'runResetSto1', 'runResetSto2', 'runDischarge', 'runResetHv'];
const forbidden = [...down, 'safeUp', 'safeTransition', 'safeBlue', 'rndBlue', 'unlock'];
const cases = [];
const any = (x, from, keys = forbidden, to = Infinity) => x.frames.some(f => f.timeMs >= from && f.timeMs <= to && keys.some(k => f.signals[k]));
function run(id, kind, body, fixture = () => createSafeRunFixture('Run')) {
  if (process.env.MEN001_F1_TEST_FILTER && !id.includes(process.env.MEN001_F1_TEST_FILTER)) return;
  let x; const checks = [], marks = {}; const e = (label, actual, expected) => checks.push({label, actual, expected});
  try { x = fixture(); body(x, e, marks); e('zero unresolved demanded inputs', x.unbound(), []);
    const bad = checks.filter(c => JSON.stringify(c.actual) !== JSON.stringify(c.expected));
    cases.push({id, kind, status: bad.length ? 'FAIL' : 'PASS', marks, checks, firstViolations: bad, scope: x.scope, rises: x.rises, frameSpans: x.frames && x.frames[0]?.signals ? compressFrames(x.frames.map(({timeMs, signals}) => ({timeMs, signals}))) : undefined});
  } catch (error) { cases.push({id, kind, status: 'ERROR', error: error.stack, checks, marks}); }
  console.log(id, cases.at(-1).status);
}
function freshGreen(x, e, m, label = 'fresh') {
  x.sample(off); x.advance(2100); m[label] = x.sample({in_Reset_PB: true}); x.advance(499);
  e(label + ' green: no down before 500', any(x, m[label], down), false); x.sample(); x.advance(4);
  e(label + ' green500: physical owner and OR5 normal-down aggregate available', x.get('runPhysical') && x.get('runAggregate'), true);
}
// GAP-1/2: second button at 499 (after window, before single acceptance), both orders.
for (const first of ['green', 'blue']) run(`GAP-LATE499-${first}-first-invalid-attempt`, 'REQ #6/#11 D-LATE-SECOND', (x, e, m) => {
  m.first = x.sample(single(first)); m.second = x.edgeAfter(m.first, 499, both); x.advance(1200);
  e('late499 before acceptance: no single, no BOTH, no up/Unlock', any(x, m.first), false);
  m.partial = x.sample(first === 'green' ? {in_Relase_Door_PB: false} : {in_Reset_PB: false}); x.advance(800);
  e('remaining button of invalid attempt cannot become single', any(x, m.first), false);
  freshGreen(x, e, m);
});
// GAP-3: inclusive window lower neighbour 249, both orders: valid BOTH in Run is ignored.
for (const first of ['green', 'blue']) run(`GAP-BOTH249-${first}-first-ignored-in-Run`, 'REQ #3 D-RUN-BOTH-IGNORE', (x, e, m) => {
  m.first = x.sample(single(first)); m.second = x.edgeAfter(m.first, 249, both); x.advance(1300);
  e('valid Run BOTH: no down/up/Unlock', any(x, m.first), false);
  m.partial = x.sample({in_Relase_Door_PB: false}); x.advance(800);
  e('partial release to green cannot degrade to single', any(x, m.first), false);
  freshGreen(x, e, m);
});
// GAP-4: partial release and re-press of the same button without both-off, then single remaining.
for (const toggled of ['blue', 'green']) run(`GAP-REPRESS-${toggled}-without-neutral`, 'REQ #7 #9 BTN-007', (x, e, m) => {
  const k = toggled === 'blue' ? 'in_Relase_Door_PB' : 'in_Reset_PB';
  m.first = x.sample({in_Reset_PB: true}); m.second = x.edgeAfter(m.first, 100, both); x.advance(400);
  m.rel1 = x.sample({[k]: false}); x.advance(300); m.repress = x.sample({[k]: true}); x.advance(1200);
  m.rel2 = x.sample({[k]: false}); x.advance(900);
  e('no command from repress / remaining single without full neutral', any(x, m.first), false);
  m.rep2 = x.sample({[k]: true}); x.advance(300); x.sample({[k === 'in_Reset_PB' ? 'in_Relase_Door_PB' : 'in_Reset_PB']: false}); x.advance(900);
  e('still no command after second repress cycle', any(x, m.first), false);
  freshGreen(x, e, m);
});
// GAP-5: long single green produces exactly one physical down (one command per attempt).
run('GAP-SINGLE-green-held3000-one-command', 'REQ #5 BTN-003', (x, e, m) => {
  m.first = x.sample({in_Reset_PB: true}); x.advance(3000);
  e('exactly one physical down rise during 3 s hold', x.rises.runPhysical, 1);
  e('accepted down not dropped while held (no re-trigger gap)', x.frames.filter(f => f.timeMs >= m.first + 503).every(f => f.signals.runPhysical), true);
  e('no up/Unlock from held green', any(x, m.first, ['safeUp', 'safeTransition', 'safeBlue', 'rndBlue', 'unlock']), false);
});
// GAP-6: emergency inputs not covered by existing NC1/PLC cases: main EStop NC and InterLock NC2.
for (const fault of ['in_ES_NC_1', 'in_InterLock_NC_2', 'in_HV_Connector_Interlock']) run(`GAP-EMG-${fault}-after-acceptance-clears-normal-owner`, 'EMG priority / D-LATE-SECOND not abort-protection', (x, e, m) => {
  m.first = x.sample({in_Reset_PB: true}); x.advance(506); e('accepted normal down', x.get('runPhysical'), true);
  m.fault = x.sample({[fault]: false}); x.advance(5);
  e('normal physical owner cleared by protective cause', any(x, m.fault, ['runPhysical']), false);
  m.restore = x.sample({[fault]: true}); x.advance(800);
  e('raw restore does not revive normal owner (green still held)', any(x, m.restore, ['runPhysical']), false);
});
// GAP-10: green held across a permission loss/restore, then released; re-press after only 1000 ms neutral is not a new
// attempt (Vadim #9/#10, BTN-002 held-at-start). Component boundary: Run phase fixed (raw cause does not run Network3).
for (const fault of ['in_InterLock_NC_1', 'in_Estop_PLC']) run(`GAP-HELD-ACROSS-${fault}-restore-then-repress-1000ms-rejected`, 'REQ #9/#10 BTN-002', (x, e, m) => {
  const bad = fault === 'in_Estop_PLC'; m.green = x.sample({in_Reset_PB: true}); x.advance(100);
  m.fault = x.sample({[fault]: bad}); x.advance(300); m.restore = x.sample({[fault]: !bad}); x.advance(700);
  e('green held across restoration is not accepted', any(x, m.green, down), false);
  m.release = x.sample({in_Reset_PB: false}); x.advance(999); m.repress = x.sample({in_Reset_PB: true}); x.advance(800);
  e('re-press after 1000 ms neutral is not a new attempt', any(x, m.green, down), false);
  freshGreen(x, e, m);
});
// PLAN-ORACLE: protective Step4 request (not part of linkRndGatePermit) resets owner (semanticEquations.reset).
run('PLAN-STEP4-protective-request-resets-owner', 'PLAN-ORACLE reset=b_Step_RnD_Set OR b_Step4_Set OR !gate', (x, e, m) => {
  m.first = x.sample({in_Reset_PB: true}); x.advance(506); e('accepted normal down', x.get('runPhysical'), true);
  m.cause = x.sample({in_HV_Healthy_FBK: true}); x.advance(3);
  e('real b_Step4_Set producer observed TRUE', x.r.get('b_Step4_Set'), true);
  e('gate permit still TRUE (isolates Step4 reset path)', x.r.get('//RndPhysicalCompact/GATE_001/AndOut'), true);
  e('owner cleared by protective Step4 request', any(x, m.cause + 1, ['runPhysical']), false);
});
// GAP-7 (lifecycle, real Network3 writers after declared initial Safe): after a normal Run->RnD down,
// a NEW Run entry must not inherit the old down command (no stale request, BTN-008 / D-LATE-SECOND "не начинать новое").
function wait(x, k, v, budget = 2500) { const end = x.clock.timeMs + budget; while (x.get(k) !== v && x.clock.timeMs < end) x.sample(); if (x.get(k) !== v) throw Error('Fixture missing ' + k + '=' + v + '; budget is not a functional deadline'); return x.clock.timeMs; }
function enterRunFromRnD(x, m, tag) { x.sample({in_STO_DR1_FBK: false, in_STO_DR2_FBK: false, in_HV_C2_FBK: true, in_HV_Healthy_FBK: true}); m[tag + 'Launch'] = x.sample(both); x.advance(1000); wait(x, 'SU', true); wait(x, 'sto1', true); wait(x, 'sto2', true); x.sample({in_LV_Healthy_FBK: false, in_HV_Healthy_FBK: false}); m[tag] = wait(x, 'b_Step3', true); x.sample(off); x.advance(2100); if (!x.get('b_Step3')) throw Error('Run profile not held'); }
run('GAP-LIFECYCLE-Run-reentry-has-no-stale-down', 'REQ BTN-008 / D-LATE-SECOND / plan no-stale-transfer', (x, e, m) => {
  x.sample(both); x.advance(1000); wait(x, 'lv', true); x.sample({in_LV_C1_FBK: true}); wait(x, 'b_Step_RnD', true); x.sample(off); x.advance(2100);
  enterRunFromRnD(x, m, 'run1');
  m.green = x.sample({in_Reset_PB: true}); x.advance(500); wait(x, 'runStop', true);
  x.sample({in_HV_C2_FBK: false, in_STO_DR1_FBK: true, in_STO_DR2_FBK: true}); m.step12 = wait(x, 'b_Step12', true); x.sample({in_LV_Healthy_FBK: true}); m.rnd = wait(x, 'b_Step_RnD', true);
  x.sample(off); x.advance(2100);
  enterRunFromRnD(x, m, 'run2');
  x.advance(1500);
  e('second Run entry: no normal down without a new green', x.frames.filter(f => f.timeMs >= m.run2).some(f => f.signals.runStop || f.signals.runOwner), false);
  e('second Run entry: Run held', x.get('b_Step3'), true);
  m.fresh = x.sample({in_Reset_PB: true}); x.advance(499);
  e('fresh green: no down before 500', x.frames.filter(f => f.timeMs >= m.fresh).some(f => f.signals.runStop), false);
  x.sample(); x.advance(4); e('fresh green500 down available in second Run', x.get('runStop'), true);
}, () => createRndDownFixture());
// GAP-8 (lifecycle): an accepted R&D green500 (R&D->Safe one step, Vadim #5) must not also raise the Run normal-down
// command path (owner/OR5 and its Run-down fanout); PLAN-ORACLE capture=Run qualifier AND previous And24.
run('GAP-LIFECYCLE-RnD-green-does-not-raise-Run-down', 'REQ #5 one step per gesture + PLAN-ORACLE capture requires Run', (x, e, m) => {
  x.sample(both); x.advance(1000); wait(x, 'lv', true); x.sample({in_LV_C1_FBK: true}); m.rnd = wait(x, 'b_Step_RnD', true); x.sample(off); x.advance(2100);
  m.green = x.sample({in_Reset_PB: true}); x.advance(499); x.sample(); x.advance(30);
  e('R&D green500 accepted (SG or down observed)', x.frames.filter(f => f.timeMs >= m.green).some(f => f.signals.SG || f.signals.down), true);
  e('no Run owner / Run normal-down request while in R&D', x.frames.filter(f => f.timeMs >= m.green).some(f => f.signals.runOwner || f.signals.runStop || f.signals.runPhysical), false);
  x.advance(700);
  e('still no Run normal-down request while green held', x.frames.filter(f => f.timeMs >= m.green).some(f => f.signals.runOwner || f.signals.runStop), false);
}, () => createRndDownFixture());
// GAP-9 (lifecycle): initiating launch BOTH held through real Run entry, then released; a green pressed only 1000 ms
// after release (neutral < 2 s) must not start a new attempt (Vadim #9, BTN-001/002); after full 2 s neutral it works.
for (const gap of [1000, 1900]) run(`GAP-LIFECYCLE-heldBOTH-release-then-green-after-${gap}ms-rejected`, 'REQ #9 BTN-001/002', (x, e, m) => {
  x.sample(both); x.advance(1000); wait(x, 'lv', true); x.sample({in_LV_C1_FBK: true}); wait(x, 'b_Step_RnD', true); x.sample(off); x.advance(2100);
  x.sample({in_STO_DR1_FBK: false, in_STO_DR2_FBK: false, in_HV_C2_FBK: true, in_HV_Healthy_FBK: true}); m.launch = x.sample(both); x.advance(1000);
  wait(x, 'SU', true); wait(x, 'sto1', true); wait(x, 'sto2', true); x.sample({in_LV_Healthy_FBK: false, in_HV_Healthy_FBK: false}); m.run = wait(x, 'b_Step3', true);
  x.advance(300); m.release = x.sample(off); x.advance(gap - 1); m.green = x.sample({in_Reset_PB: true}); x.advance(700);
  e('green with neutral < 2 s after initiating BOTH: no Run normal down', x.frames.filter(f => f.timeMs >= m.run).some(f => f.signals.runStop || f.signals.runOwner), false);
  e('Run held', x.get('b_Step3'), true);
  x.sample(off); x.advance(2100); m.fresh = x.sample({in_Reset_PB: true}); x.advance(499); x.sample(); x.advance(4);
  e('after full 2 s neutral fresh green500 down available', x.get('runStop'), true);
}, () => createRndDownFixture());
const report = {phase: 'Tester E1-f1 gap tests (requirements first; PLAN-ORACLE rows separately labelled)', counts: Object.fromEntries(['PASS', 'FAIL', 'ERROR'].map(s => [s, cases.filter(c => c.status === s).length])), cases,
  limits: ['Run component cases use the explicit Network3 Step3 boundary of run-source.js; lifecycle case uses declared initial Safe + seven inactive Network4 cuts', 'No F2 stop-sequence acceptance; old immediate fanout is observed only as availability', 'PLAN-ORACLE row is design conformance, not a requirement-derived oracle']};
fs.writeFileSync(process.env.MEN001_F1_GAPS_OUTPUT ?? new URL('f1-gaps-results.json', import.meta.url), JSON.stringify(report) + '\n');
console.log('TOTAL', JSON.stringify(report.counts)); process.exitCode = report.counts.ERROR ? 3 : report.counts.FAIL ? 1 : 0;
