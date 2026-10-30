// Independent tests of PLC action MAIN.act_LED_Control (NIV-GAPS Q-LED-1..4, 3a, 3b).
// Oracle: SafetyTests/program/analyst/NIV_LED_TRUTH_TABLE.md (rows LED-T*, R*, G*, B*, F*)
// and SafetyTests/SCENARIO_DECISIONS.md section NIV-GAPS. Expected values are taken from
// the truth table, not from the code. Subject: JS transcription (act-led-control.mjs),
// NOT PLC execution; TwinCAT Build/runtime is Vadim's step.
// Run from SafetyTests: node --test test/independent/act-led-control.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createLedControl, TRANSCRIBED_ST } from './act-led-control.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');
const MAIN_REL = 'MEN001_Dyno/PLC_Dyno/POUs/MAIN.TcPOU';
const ORIGINAL_COMMIT = '0293e216bbdfa5466c0e10fc9b0a9ea2e32954d2';

// ---------------------------------------------------------------- helpers
const NEW = () => createLedControl({ variant: 'new' });
const ORIG = () => createLedControl({ variant: 'original' });

// Run constant inputs for `ms` with cycle dt; returns samples (one per scan, with time).
function run(ctl, inputs, ms, dt = 10) {
  const out = [];
  for (let t = dt; t <= ms; t += dt) out.push({ t, ...ctl.scan(inputs, dt) });
  return out;
}
// Lengths (ms) of complete constant phases of `key` (first/last partial phases dropped).
function phases(samples, key) {
  const edges = [];
  for (let i = 1; i < samples.length; i++) if (samples[i][key] !== samples[i - 1][key]) edges.push(samples[i].t);
  const res = [];
  for (let i = 1; i < edges.length; i++) res.push(edges[i] - edges[i - 1]);
  return res;
}
// BLINK = LED follows bPulse (pre-update value, i.e. bPulse returned by previous scan),
// toggles with each phase = expected t_BlinkTime (+-1 PLC cycle), t_BlinkTime as expected.
function assertBlink(ctl, inputs, led, expectMs, dt = 10, label = '') {
  const s = run(ctl, inputs, expectMs * 6 + 5 * dt, dt);
  for (let i = 1; i < s.length; i++) {
    assert.equal(s[i][led], s[i - 1].bPulse, `${label} ${led} != bPulse at t=${s[i].t}`);
    assert.equal(s[i].t_BlinkTimeMs, expectMs, `${label} t_BlinkTime at t=${s[i].t}`);
  }
  const ph = phases(s, led);
  assert.ok(ph.length >= 3, `${label} ${led} not toggling: ${ph}`);
  for (const p of ph) assert.ok(Math.abs(p - expectMs) <= dt, `${label} ${led} phase ${p} ms, expected ${expectMs}+-${dt}`);
  return s;
}
function assertConst(ctl, inputs, led, value, ms = 3500, dt = 10, label = '') {
  const s = run(ctl, inputs, ms, dt);
  for (const x of s) assert.equal(x[led], value, `${label} ${led} at t=${x.t}`);
  return s;
}
const withInit = (variant, init) => createLedControl({ variant, initial: init });
const bools = [false, true];

// ------------------------------------------------- (a) transcription guard
function extractAction(xml) {
  const m = xml.match(/<Action Name="act_LED_Control"[^>]*>\s*<Implementation>\s*<ST><!\[CDATA\[([\s\S]*?)\]\]><\/ST>/);
  assert.ok(m, 'act_LED_Control CDATA not found');
  return m[1];
}
const norm = (s) => s.replace(/\s+/g, ' ').trim();

test('GUARD original transcription == act_LED_Control at 0293e21 (HEAD at transcription)', () => {
  const xml = execFileSync('git', ['-C', repoRoot, 'show', `${ORIGINAL_COMMIT}:${MAIN_REL}`], { encoding: 'utf8' });
  assert.equal(norm(extractAction(xml)), norm(TRANSCRIBED_ST.original));
});
test('GUARD new transcription == act_LED_Control in working copy MAIN.TcPOU', () => {
  const xml = fs.readFileSync(path.join(repoRoot, MAIN_REL), 'utf8');
  assert.equal(norm(extractAction(xml)), norm(TRANSCRIBED_ST.new));
});

// ------------------------------------------------------------- LED-T*
test('LED-T1 step2 -> t_BlinkTime 0.5 s (also with TS, with step1)', () => {
  for (const extra of [{}, { TransitionStep: true }, { TransitionStep: true, step1: true }, { step1: true }]) {
    const r = NEW().scan({ step2: true, ...extra }, 10);
    assert.equal(r.t_BlinkTimeMs, 500, JSON.stringify(extra));
  }
});
test('LED-T2 TS AND NOT step1 -> 0.5 s', () => {
  assert.equal(NEW().scan({ TransitionStep: true }, 10).t_BlinkTimeMs, 500);
});
test('LED-T3 TS AND step1 AND NOT step2 -> 1.5 s (forbidden: 0.5 s)', () => {
  assert.equal(NEW().scan({ TransitionStep: true, step1: true }, 10).t_BlinkTimeMs, 1500);
});
test('LED-T4 NOT step2 AND NOT TS -> 1.5 s', () => {
  for (const extra of [{}, { step1: true }, { stepRnD: true }, { Safety_Armed: true }])
    assert.equal(NEW().scan(extra, 10).t_BlinkTimeMs, 1500, JSON.stringify(extra));
});
test('LED-T boundary: on the scan TS rises, step1 FALSE -> 0.5 s, step1 TRUE -> 1.5 s', () => {
  const a = NEW(); a.scan({}, 10);
  assert.equal(a.scan({}, 10).t_BlinkTimeMs, 1500);
  assert.equal(a.scan({ TransitionStep: true }, 10).t_BlinkTimeMs, 500);
  const b = NEW(); b.scan({ step1: true }, 10);
  assert.equal(b.scan({ step1: true, TransitionStep: true }, 10).t_BlinkTimeMs, 1500);
  // step1 falls while TS TRUE (Safe->R&D) -> fast on that scan
  assert.equal(b.scan({ TransitionStep: true }, 10).t_BlinkTimeMs, 500);
});

// ------------------------------------------------------------- LED-R*
test('LED-R1 Ok AND Status -> red OFF (from ON too)', () => {
  assertConst(withInit('new', { RedLED: true }), { EStop_Ok: true, EStop_Status: true }, 'RedLED', false);
});
test('LED-R2 NOT Ok AND Status -> red BLINK at 1.5 s (T4) and 0.5 s (T1)', () => {
  assertBlink(NEW(), { EStop_Status: true }, 'RedLED', 1500, 10, 'R2/T4');
  assertBlink(NEW(), { EStop_Status: true, step2: true }, 'RedLED', 500, 10, 'R2/T1');
});
test('LED-R3 NOT Ok AND NOT Status -> red ON', () => {
  assertConst(NEW(), {}, 'RedLED', true);
});
test('LED-R4 Ok AND NOT Status -> red ON, not HOLD (from OFF and from ON)', () => {
  const c = NEW();
  assert.equal(c.scan({ EStop_Ok: true, EStop_Status: true }, 10).RedLED, false);
  assertConst(c, { EStop_Ok: true }, 'RedLED', true, 3500, 10, 'R4 after R1');
  assertConst(withInit('new', { RedLED: true }), { EStop_Ok: true }, 'RedLED', true);
});
test('LED-R5 STS_FAULT does not change red for all 4 EStop combinations', () => {
  for (const Ok of bools) for (const St of bools) for (const ctx of [{}, { step2: true }, { STS_EMG: true }, { step1: true, STS_SAFE: true, DoorMonitor: true }]) {
    const base = { EStop_Ok: Ok, EStop_Status: St, ...ctx };
    const a = run(NEW(), base, 4000), b = run(NEW(), { ...base, STS_FAULT: true }, 4000);
    a.forEach((x, i) => assert.equal(b[i].RedLED, x.RedLED, `Ok=${Ok} St=${St} ${JSON.stringify(ctx)} t=${x.t}`));
    const exp = Ok && St ? false : !Ok && St ? 'blink' : true;
    if (exp !== 'blink') b.forEach((x) => assert.equal(x.RedLED, exp));
  }
});

// ------------------------------------------------------------- LED-G*
const SAFE_IDLE = { STS_SAFE: true, step1: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true };
test('LED-G1 power-up Safe (step1, Ok, DM, TS FALSE) -> green BLINK 1.5 s', () => {
  assertBlink(NEW(), SAFE_IDLE, 'GreenLED', 1500, 10, 'G1');
});
test('LED-G2 Safe after R&D->Safe (step1, Ok, DM, TS TRUE) -> green BLINK 1.5 s (forbidden 0.5 s)', () => {
  assertBlink(NEW(), { ...SAFE_IDLE, TransitionStep: true }, 'GreenLED', 1500, 10, 'G2');
});
test('LED-G3 Safe->R&D transition (TS, step1 FALSE) -> green BLINK 0.5 s', () => {
  assertBlink(NEW(), { STS_SAFE: true, TransitionStep: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true }, 'GreenLED', 500, 10, 'G3');
});
test('LED-G4 R&D->Run transition (TS, step1 FALSE) -> green BLINK 0.5 s', () => {
  assertBlink(NEW(), { STS_RND: true, stepRnD: true, TransitionStep: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true }, 'GreenLED', 500, 10, 'G4');
});
test('LED-G5 Run->R&D transition (TS, step1 FALSE) -> green BLINK 0.5 s', () => {
  assertBlink(NEW(), { STS_RUN: true, Safety_Armed: true, TransitionStep: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true }, 'GreenLED', 500, 10, 'G5');
});
test('LED-G6 blink cond FALSE and Armed/stepRnD/step2 -> green ON (t per T*)', () => {
  for (const [k, t] of [['Safety_Armed', 1500], ['stepRnD', 1500], ['step2', 500]]) {
    const s = assertConst(NEW(), { [k]: true, DoorMonitor: true }, 'GreenLED', true, 3500, 10, `G6 ${k}`);
    assert.equal(s.at(-1).t_BlinkTimeMs, t, k);
  }
  // ON also wins over G7 OFF conditions (order)
  assertConst(NEW(), { Safety_Armed: true, step4: true, DoorMonitor: false }, 'GreenLED', true, 500, 10, 'G6 before G7');
});
test('LED-G7 blink/ON cond FALSE and step4/5/6/NOT DM -> green OFF (from ON)', () => {
  for (const x of [{ step4: true, DoorMonitor: true }, { step5: true, DoorMonitor: true }, { step6: true, DoorMonitor: true }, { DoorMonitor: false }, { step1: true, EStop_Ok: true, DoorMonitor: false }])
    assertConst(withInit('new', { GreenLED: true }), x, 'GreenLED', false, 3500, 10, `G7 ${JSON.stringify(x)}`);
});
test('LED-G8 none of G1..G7 -> green HOLD (both previous values)', () => {
  for (const v of bools) {
    assertConst(withInit('new', { GreenLED: v }), { DoorMonitor: true }, 'GreenLED', v, 3500, 10, `G8 init=${v}`);
    assertConst(withInit('new', { GreenLED: v }), { DoorMonitor: true, step1: true, EStop_Ok: false }, 'GreenLED', v, 3500, 10, `G8 step1 !Ok init=${v}`);
  }
});
test('LED-G9 step1, TS, (NOT Ok or NOT DM), no Armed/RnD/step2 -> OFF if NOT DM else HOLD; t 1.5 s', () => {
  for (const Ok of bools) {
    const s = assertConst(withInit('new', { GreenLED: true }), { step1: true, TransitionStep: true, EStop_Ok: Ok, DoorMonitor: false }, 'GreenLED', false, 3500, 10, `G9 !DM Ok=${Ok}`);
    assert.equal(s.at(-1).t_BlinkTimeMs, 1500);
  }
  for (const v of bools) {
    const s = assertConst(withInit('new', { GreenLED: v }), { step1: true, TransitionStep: true, EStop_Ok: false, DoorMonitor: true }, 'GreenLED', v, 3500, 10, `G9 DM !Ok HOLD init=${v}`);
    assert.equal(s.at(-1).t_BlinkTimeMs, 1500);
  }
});

// ------------------------------------------------------------- LED-B*
function blueOffAll(base, label) {
  for (const DM of bools) for (const SOL of bools) for (const extra of [{}, { step1: true }, { stepRnD: true }, { TransitionStep: true }])
    assertConst(withInit('new', { BlueLED: true }), { ...base, DoorMonitor: DM, SolenoedMonitor: SOL, ...extra }, 'BlueLED', false, 3500, 10, `${label} DM=${DM} SOL=${SOL} ${JSON.stringify(extra)}`);
}
test('LED-B1 STS_RUN -> blue OFF (any DM/SOL; forbidden ON/BLINK)', () => blueOffAll({ STS_RUN: true, Safety_Armed: true }, 'B1'));
test('LED-B2 STS_CFG -> blue OFF', () => blueOffAll({ STS_CFG: true }, 'B2'));
test('LED-B3 STS_EMG -> blue OFF', () => blueOffAll({ STS_EMG: true }, 'B3'));
test('LED-B4 Safe->R&D: STS_SAFE AND NOT step1 -> blue OFF (any DM/SOL)', () => {
  for (const DM of bools) for (const SOL of bools) for (const TS of bools)
    assertConst(withInit('new', { BlueLED: true }), { STS_SAFE: true, DoorMonitor: DM, SolenoedMonitor: SOL, TransitionStep: TS }, 'BlueLED', false, 3500, 10, `B4 DM=${DM} SOL=${SOL} TS=${TS}`);
});
test('LED-B5 STS_SAFE, step1, DM, NOT SOL -> blue BLINK 1.5 s (also TS TRUE)', () => {
  assertBlink(NEW(), { STS_SAFE: true, step1: true, DoorMonitor: true }, 'BlueLED', 1500, 10, 'B5');
  assertBlink(NEW(), { STS_SAFE: true, step1: true, DoorMonitor: true, TransitionStep: true }, 'BlueLED', 1500, 10, 'B5 TS');
});
test('LED-B6 STS_SAFE, step1, NOT DM (any SOL) -> blue ON', () => {
  for (const SOL of bools) assertConst(NEW(), { STS_SAFE: true, step1: true, DoorMonitor: false, SolenoedMonitor: SOL }, 'BlueLED', true, 3500, 10, `B6 SOL=${SOL}`);
});
test('LED-B7 STS_SAFE, step1, SOL (any DM) -> blue ON', () => {
  for (const DM of bools) assertConst(NEW(), { STS_SAFE: true, step1: true, DoorMonitor: DM, SolenoedMonitor: true }, 'BlueLED', true, 3500, 10, `B7 DM=${DM}`);
});
test('LED-B8 STS_RND, DM, NOT SOL -> blue BLINK 1.5 s (R&D idle)', () => {
  assertBlink(NEW(), { STS_RND: true, stepRnD: true, DoorMonitor: true }, 'BlueLED', 1500, 10, 'B8');
});
test('LED-B9 STS_RND, NOT DM (any SOL) -> blue ON', () => {
  for (const SOL of bools) assertConst(NEW(), { STS_RND: true, stepRnD: true, DoorMonitor: false, SolenoedMonitor: SOL }, 'BlueLED', true, 3500, 10, `B9 SOL=${SOL}`);
});
test('LED-B10 STS_RND, SOL (any DM) -> blue ON', () => {
  for (const DM of bools) assertConst(NEW(), { STS_RND: true, stepRnD: true, DoorMonitor: DM, SolenoedMonitor: true }, 'BlueLED', true, 3500, 10, `B10 DM=${DM}`);
});
test('LED-B11 no STS_SAFE/RND/RUN/CFG/EMG -> blue OFF (Q-LED-3b = A)', () => blueOffAll({}, 'B11'));
test('LED-B12 observation only (not an oracle): several STS bits', (t) => {
  const obs = [];
  for (const combo of [['STS_SAFE', 'STS_RUN'], ['STS_RND', 'STS_EMG'], ['STS_SAFE', 'STS_RND'], ['STS_RND', 'STS_CFG']]) {
    const x = { step1: true, DoorMonitor: false };
    for (const k of combo) x[k] = true;
    obs.push(`${combo.join('+')}: Blue=${NEW().scan(x, 10).BlueLED}`);
  }
  t.diagnostic(`B12 observed (not asserted): ${obs.join('; ')}`);
});

// ------------------------------------------------------------- LED-F*
const STATES = {
  safe: SAFE_IDLE,
  safeOpen: { ...SAFE_IDLE, DoorMonitor: false },
  rnd: { STS_RND: true, stepRnD: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true },
  run: { STS_RUN: true, Safety_Armed: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true },
  cfg: { STS_CFG: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true },
  transition: { STS_SAFE: true, TransitionStep: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true },
  emg: { STS_EMG: true, EStop_Status: false, DoorMonitor: true },
  none: { DoorMonitor: true },
};
function assertFaultAlternation(name, inputs) {
  const dt = 10;
  const f = run(NEW(), { ...inputs, STS_FAULT: true }, 2000, dt);
  const n = run(NEW(), inputs, 2000, dt);
  f.forEach((x, i) => {
    assert.notEqual(x.GreenLED, x.BlueLED, `${name} green==blue t=${x.t}`);
    assert.equal(x.GreenLED, x.bFaultPulse, `${name} green!=FP t=${x.t}`);
    assert.equal(x.RedLED, n[i].RedLED, `${name} red changed by fault t=${x.t}`);
  });
  const ph = phases(f, 'GreenLED');
  assert.ok(ph.length >= 3, `${name} no alternation`);
  for (const p of ph) assert.ok(Math.abs(p - 200) <= dt, `${name} FP phase ${p}`);
}
test('LED-F1 STS_FAULT in Safe/R&D/Run/Cfg/transition -> green FP, blue NOT FP, red per R*', () => {
  for (const k of ['safe', 'safeOpen', 'rnd', 'run', 'cfg', 'transition']) assertFaultAlternation(`F1 ${k}`, STATES[k]);
});
test('LED-F2 STS_FAULT AND STS_EMG -> alternation overrides B3 OFF', () => assertFaultAlternation('F2', STATES.emg));
test('LED-F3 STS_FAULT with no STS bit -> alternation', () => assertFaultAlternation('F3', STATES.none));
test('LED-F4 FP phase 200 ms at 1 ms cycle (199 no toggle / 200..201 toggle), green != blue', () => {
  const c = NEW();
  const s = run(c, { ...STATES.safe, STS_FAULT: true }, 1500, 1);
  // elapsed since first scan = t - 1
  const at = (el) => s.find((x) => x.t - 1 === el);
  assert.equal(at(199).GreenLED, false, 'toggled before 200 ms');
  assert.equal(at(200).GreenLED, true, 'not toggled at 200 ms');
  assert.equal(at(201).GreenLED, true);
  const ph = phases(s, 'GreenLED');
  assert.ok(ph.length >= 4);
  for (const p of ph) assert.ok(p >= 200 && p <= 201, `phase ${p} outside [200,201]`);
  s.forEach((x) => assert.notEqual(x.GreenLED, x.BlueLED, `t=${x.t}`));
});
test('LED-F5 STS_FAULT TRUE->FALSE -> next scan normal indication', () => {
  // Safe, lid open: normal = green OFF (G7), blue ON (B6)
  const a = NEW();
  run(a, { ...STATES.safeOpen, STS_FAULT: true }, 1000);
  for (let i = 0; i < 30; i++) {
    const c = NEW(); run(c, { ...STATES.safeOpen, STS_FAULT: true }, 1000 + i * 10);
    const r = c.scan(STATES.safeOpen, 10);
    assert.equal(r.GreenLED, false, `G7 after fault (i=${i})`);
    assert.equal(r.BlueLED, true, `B6 after fault (i=${i})`);
  }
  // Run: normal = blue OFF (B1), green ON (G6)
  const b = NEW(); run(b, { ...STATES.run, STS_FAULT: true }, 1210);
  const rb = b.scan(STATES.run, 10);
  assert.equal(rb.BlueLED, false); assert.equal(rb.GreenLED, true);
  // Safe idle: normal = green/blue BLINK = previous bPulse
  const c = NEW(); const s = run(c, { ...STATES.safe, STS_FAULT: true }, 1230);
  const r = c.scan(STATES.safe, 10);
  assert.equal(r.GreenLED, s.at(-1).bPulse); assert.equal(r.BlueLED, s.at(-1).bPulse);
});
test('LED-F6 cause not distinguished: outputs depend only on STS_FAULT (extra cause keys ignored)', () => {
  const a = run(NEW(), { ...STATES.rnd, STS_FAULT: true, SafetyFault: true }, 2000);
  const b = run(NEW(), { ...STATES.rnd, STS_FAULT: true, CmdConflict: true }, 2000);
  assert.deepEqual(a, b);
});

// ------------------------------------- (c) contrast on ORIGINAL (gaps existed)
test('CONTRAST Q-LED-4: original R4 (Ok, NOT Status) = HOLD', () => {
  for (const v of bools) assertConst(withInit('original', { RedLED: v }), { EStop_Ok: true }, 'RedLED', v, 3500, 10, `orig R4 init=${v}`);
});
test('CONTRAST Q-LED-1: original G2/T3 fast blink 0.5 s in Safe with step1 and TS', () => {
  assertBlink(ORIG(), { ...SAFE_IDLE, TransitionStep: true }, 'GreenLED', 500, 10, 'orig G2');
});
test('CONTRAST Q-LED-1: original G9 (step1, TS, lid open) green BLINK via TS', () => {
  assertBlink(ORIG(), { step1: true, TransitionStep: true, EStop_Ok: true, DoorMonitor: false }, 'GreenLED', 500, 10, 'orig G9');
});
test('CONTRAST Q-LED-3: original blue reverse-R&D logic differs from B*', () => {
  // B9: R&D lid open -> required ON; original BLINK
  assertBlink(ORIG(), { STS_RND: true, stepRnD: true, DoorMonitor: false }, 'BlueLED', 1500, 10, 'orig B9');
  // B8: R&D lid closed, no solenoid -> required BLINK; original ON
  assertConst(ORIG(), { STS_RND: true, stepRnD: true, DoorMonitor: true }, 'BlueLED', true, 3500, 10, 'orig B8');
  // B1: Run, lid open -> required OFF; original ON
  assertConst(ORIG(), { STS_RUN: true, Safety_Armed: true, DoorMonitor: false }, 'BlueLED', true, 3500, 10, 'orig B1');
  // B11: no STS, step1 & DM -> required OFF; original BLINK
  assertBlink(ORIG(), { step1: true, DoorMonitor: true }, 'BlueLED', 1500, 10, 'orig B11');
});
test('CONTRAST Q-LED-2: original has no fault alternation', () => {
  const s = run(ORIG(), { ...STATES.run, STS_FAULT: true }, 2000);
  s.forEach((x) => { assert.equal(x.GreenLED, true); assert.equal(x.bFaultPulse, false); });
  assert.ok(s.some((x) => x.GreenLED === x.BlueLED) || s.every((x) => x.BlueLED === false));
});
test('UNCHANGED rows R1-R3, G1, G6-G8, T1, T4: original == new', () => {
  const cases = {
    R1: { EStop_Ok: true, EStop_Status: true }, R2: { EStop_Status: true }, R2fast: { EStop_Status: true, step2: true }, R3: {},
    G1: SAFE_IDLE, G6a: { Safety_Armed: true, DoorMonitor: true }, G6b: { stepRnD: true, DoorMonitor: true }, G6c: { step2: true, DoorMonitor: true },
    G7a: { step4: true, DoorMonitor: true }, G7b: { DoorMonitor: false }, G8: { DoorMonitor: true },
  };
  for (const [id, x] of Object.entries(cases)) for (const init of bools) {
    const a = run(withInit('original', { RedLED: init, GreenLED: init }), x, 4000);
    const b = run(withInit('new', { RedLED: init, GreenLED: init }), x, 4000);
    a.forEach((o, i) => {
      for (const k of ['RedLED', 'GreenLED', 't_BlinkTimeMs', 'bPulse']) assert.equal(b[i][k], o[k], `${id} init=${init} ${k} t=${o.t}`);
    });
  }
});
test('UNCHANGED randomized: TS=FALSE, no fault, EStop not (Ok,!Status) -> red/green/t identical', () => {
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const keys = ['Safety_Armed', 'step1', 'step2', 'step4', 'step5', 'step6', 'stepRnD', 'DoorMonitor', 'SolenoedMonitor', 'STS_SAFE', 'STS_RND'];
  for (let trial = 0; trial < 50; trial++) {
    const a = ORIG(), b = NEW();
    for (let k = 0; k < 400; k++) {
      const x = {};
      for (const key of keys) x[key] = rnd() < 0.3;
      const e = Math.floor(rnd() * 3); // 0: Ok&Status, 1: !Ok&Status, 2: !Ok&!Status
      x.EStop_Ok = e === 0; x.EStop_Status = e !== 2;
      const dt = 1 + Math.floor(rnd() * 20);
      const reps = 1 + Math.floor(rnd() * 30);
      for (let r = 0; r < reps; r++) {
        const o = a.scan(x, dt), n = b.scan(x, dt);
        for (const kk of ['RedLED', 'GreenLED', 't_BlinkTimeMs', 'bPulse']) assert.equal(n[kk], o[kk], `trial ${trial} step ${k} ${kk}`);
      }
    }
  }
});
