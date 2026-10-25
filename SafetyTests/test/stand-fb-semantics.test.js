// E0 stand: simulator FB semantics against the Beckhoff oracle, NOT against
// the simulator itself. Oracle: "TwinSAFE Logic FB" manual, Version 4.3.0
// (2025-12-03), https://download.beckhoff.com/download/document/automation/twinsafe/twinsafe-logic-fb_en.pdf
// (PDF SHA256 b303b4e8c314e0a2a6e9290491cc2ad2a996e8eacda261958bfc1d43e577cc8c).
// Each test names the section whose sentence is the expected value. Synthetic
// single-block models with explicit port injection: no canonical SAL is read,
// so these tests prove model semantics only, never program behaviour.
// Mapping table and NV list: program/stand/FB_SEMANTICS.md.
import test from "node:test";
import assert from "node:assert/strict";
import { SalRuntime } from "../src/sal-runtime.js";

const NC = "Break Contact (NC)", NO = "Make Contact (NO)";
const port = (block, name, extra = {}) => ({ name, path: `//T/${block}/${name}`, sources: [], targets: [], globals: [], ...extra });
const model = blocks => ({ bindingMode: "explicit-test-injection", networks: [{ name: "T", blocks }], variables: [] });
const runtime = (blocks, scanMs = 10) => new SalRuntime(model(blocks), { scanMs, unconnectedInput: false });
const drive = (r, values) => { for (const [p, v] of Object.entries(values)) r.values.set(p, v); return r; };

function logicBlock(fn, prefix, outName, contacts, order = 1) {
  // contacts: array of NC | NO | null(deactivated), one per input 1..8
  const name = `${prefix}1`;
  const inputs = Array.from({ length: 8 }, (_, i) => port(name, `${prefix}In${i + 1}`,
    contacts[i] ? { channelInterface: "Activated", deactivate1: contacts[i] } : { channelInterface: "Deactivated" }));
  return { functionName: fn, name, path: `//T/${name}`, orderOfExecution: order, inputs, outputs: [port(name, outName)], parameters: [] };
}
const combos = n => Array.from({ length: 1 << n }, (_, k) => Array.from({ length: n }, (_, i) => Boolean(k & (1 << i))));

test("FB-AND §4.1.1/§4.1.2: AND of active inputs, make contact negated before AND, deactivated inputs ignored", () => {
  const block = logicBlock("safeAnd", "And", "AndOut", [NC, NO, NC, null, null, null, null, null]);
  for (const [a, b, c] of combos(3)) for (const ignored of [false, true]) {
    const r = drive(runtime([block]), { [block.inputs[0].path]: a, [block.inputs[1].path]: b, [block.inputs[2].path]: c });
    for (const p of block.inputs.slice(3)) r.values.set(p.path, ignored);
    r.scan();
    assert.equal(r.get(block.outputs[0].path), a && !b && c, `raw ${a}/${b}/${c}, inactive=${ignored}`);
  }
});

test("FB-OR §4.2.1/§4.2.2: OR of active inputs, make contact negated before OR, deactivated inputs ignored", () => {
  const block = logicBlock("safeOr", "Or", "OrOut", [NC, NO, null, null, null, null, null, NC]);
  for (const [a, b, h] of combos(3)) for (const ignored of [false, true]) {
    const r = drive(runtime([block]), { [block.inputs[0].path]: a, [block.inputs[1].path]: b, [block.inputs[7].path]: h });
    for (const p of block.inputs.slice(2, 7)) r.values.set(p.path, ignored);
    r.scan();
    assert.equal(r.get(block.outputs[0].path), a || !b || h, `raw ${a}/${b}/${h}, inactive=${ignored}`);
  }
});

function rsBlock(resetContact = NC, setContact = NC) {
  return { functionName: "safeRs", name: "Rs1", path: "//T/Rs1", orderOfExecution: 1,
    inputs: [port("Rs1", "Reset", { channelInterface: "Activated", deactivate1: resetContact }),
      port("Rs1", "Set", { channelInterface: "Activated", deactivate1: setContact })],
    outputs: [port("Rs1", "RsOut")], parameters: [] };
}

test("FB-RS §4.10.1: Set1/Reset0 -> 1, Set0/Reset1 -> 0, both 1 -> Reset dominant 0, both 0 -> hold; initial STOP output 0", () => {
  const block = rsBlock();
  const r = runtime([block]);
  const step = (set, reset) => drive(r, { [block.inputs[1].path]: set, [block.inputs[0].path]: reset }).scan().get("//T/Rs1/RsOut");
  assert.equal(step(false, false), false, "§4.10.2 status STOP/SAFE: RsOut=0 before any Set");
  assert.equal(step(true, false), true);
  assert.equal(step(false, false), true, "hold 1");
  assert.equal(step(true, true), false, "reset dominant");
  assert.equal(step(false, false), false, "hold 0");
  assert.equal(step(false, true), false);
  assert.equal(step(true, false), true);
  assert.equal(step(false, true), false);
});

test("FB-RS §4.10.2: input parameterization as make contact negates the Reset channel", () => {
  const block = rsBlock(NO, NC);
  const r = runtime([block]);
  const step = (set, resetRaw) => drive(r, { [block.inputs[1].path]: set, [block.inputs[0].path]: resetRaw }).scan().get("//T/Rs1/RsOut");
  assert.equal(step(true, false), false, "NO Reset raw 0 = logical Reset 1, dominant");
  assert.equal(step(true, true), true, "NO Reset raw 1 = logical Reset 0 -> Set wins");
  assert.equal(step(false, true), true, "hold");
  assert.equal(step(false, false), false, "logical reset");
});

function tonBlock(seconds) {
  return { functionName: "safeTon", name: "Ton1", path: "//T/Ton1", orderOfExecution: 1,
    inputs: [port("Ton1", "TonIn", { channelInterface: "Activated", deactivate1: NC })],
    outputs: [port("Ton1", "TonOut")], parameters: [{ name: "Delay Time (s)", timing: String(seconds) }] };
}

test("FB-TON §4.12.1: input 1 reaches output only after the delay; dropping before the delay never activates the output", () => {
  const block = tonBlock(0.1);
  const r = runtime([block]);
  const set = v => drive(r, { "//T/Ton1/TonIn": v });
  set(true).runFor(50);
  assert.equal(r.get("//T/Ton1/TonOut"), false, "DELAYIN at 50 ms of 100 ms");
  set(false).scan();
  assert.equal(r.get("//T/Ton1/TonOut"), false);
  set(true).runFor(60);
  assert.equal(r.get("//T/Ton1/TonOut"), false, "new rising edge restarts the delay (SAFE -> DELAYIN starts the timer)");
  r.runFor(60);
  assert.equal(r.get("//T/Ton1/TonOut"), true, "RUN once delay expired with input still 1");
  r.runFor(500);
  assert.equal(r.get("//T/Ton1/TonOut"), true, "stays 1 while input 1");
  set(false).scan();
  assert.equal(r.get("//T/Ton1/TonOut"), false, "§4.12.2 SAFE: TimerIn 0 -> TimerOut 0 on the same cycle");
});

function estopBlock({ delayMs = 100, ch1 = NC, ch3 = null, edm = false, mode1 = "Single-Channel 1 Activated" } = {}) {
  const name = "Estop1";
  const master = (idx, mode, contact) => port(name, `EStopIn${idx - 7}`, { objectIndex: String(idx), channelInterface: mode,
    ...(contact ? { deactivate1: contact } : {}) });
  const inputs = [port(name, "Restart", { objectIndex: "0" }),
    master(8, mode1, ch1), port(name, "EStopIn2", { objectIndex: "9", channelInterface: "Both Deactivated" }),
    ch3 ? master(10, "Single-Channel 1 Activated", ch3) : master(10, "Both Deactivated"),
    port(name, "EStopIn4", { objectIndex: "11", channelInterface: "Both Deactivated" }),
    master(12, "Both Deactivated"), port(name, "EStopIn6", { objectIndex: "13", channelInterface: "Both Deactivated" }),
    master(14, "Both Deactivated"), port(name, "EStopIn8", { objectIndex: "15", channelInterface: "Both Deactivated" }),
    port(name, "EDM1", { objectIndex: "1", ...(edm ? { channelInterface: "Activated" } : {}) }), port(name, "EDM2", { objectIndex: "2" })];
  return { functionName: "safeEstop", name, path: `//T/${name}`, orderOfExecution: 1, inputs,
    outputs: [port(name, "Error"), port(name, "EStopOut"), port(name, "EStopDelOut")],
    parameters: [{ name: "Delay Time (ms)", timing: String(delayMs) }] };
}
const out = r => ({ out: r.get("//T/Estop1/EStopOut"), del: r.get("//T/Estop1/EStopDelOut"), err: r.get("//T/Estop1/Error") });

test("FB-ESTOP §4.4.2 Restart/§4.4.4: after group start the outputs stay safe until a Restart rising+falling edge with all active inputs TRUE", () => {
  const r = drive(runtime([estopBlock()]), { "//T/Estop1/EStopIn1": true, "//T/Estop1/Restart": false });
  r.runFor(200);
  assert.deepEqual(out(r), { out: false, del: false, err: false }, "no restart edge yet");
  drive(r, { "//T/Estop1/Restart": true }).runFor(100);
  assert.deepEqual(out(r), { out: false, del: false, err: false }, "START state (6) while Restart held: outputs 0");
  drive(r, { "//T/Estop1/Restart": false }).scan();
  assert.deepEqual(out(r), { out: true, del: true, err: false }, "falling edge -> RUN: EStopOut=1, EStopDelOut=1, Error=0");
});

test("FB-ESTOP §4.4.1 + status DELAYOUT: safety request drops EStopOut immediately, EStopDelOut only after Delay Time", () => {
  const r = drive(runtime([estopBlock({ delayMs: 100 })]), { "//T/Estop1/EStopIn1": true, "//T/Estop1/Restart": true });
  r.scan(); drive(r, { "//T/Estop1/Restart": false }).scan();
  assert.equal(out(r).out, true);
  drive(r, { "//T/Estop1/EStopIn1": false }).scan();
  assert.deepEqual(out(r), { out: false, del: true, err: false }, "DELAYOUT: EStopOut=0, EStopDelOut=1");
  r.runFor(50);
  assert.equal(out(r).del, true, "delay not yet expired at ~50 ms");
  r.runFor(100);
  assert.deepEqual(out(r), { out: false, del: false, err: false }, "SAFE after delay");
});

test("FB-ESTOP §4.4.1: restoring the input alone does not leave the safe state; a new Restart edge is required", () => {
  const r = drive(runtime([estopBlock()]), { "//T/Estop1/EStopIn1": true, "//T/Estop1/Restart": true });
  r.scan(); drive(r, { "//T/Estop1/Restart": false }).scan();
  drive(r, { "//T/Estop1/EStopIn1": false }).runFor(50);
  drive(r, { "//T/Estop1/EStopIn1": true }).runFor(500);
  assert.equal(out(r).out, false, "no automatic restart");
  drive(r, { "//T/Estop1/Restart": true }).scan(); drive(r, { "//T/Estop1/Restart": false }).scan();
  assert.equal(out(r).out, true);
});

test("FB-ESTOP §4.4.4 Sample 2: Restart rising before inputs are TRUE; START once both TRUE, enable on Restart falling edge", () => {
  const r = drive(runtime([estopBlock()]), { "//T/Estop1/EStopIn1": false, "//T/Estop1/Restart": false });
  r.scan();
  drive(r, { "//T/Estop1/Restart": true }).runFor(30);
  drive(r, { "//T/Estop1/EStopIn1": true }).runFor(30);
  assert.equal(out(r).out, false, "START waits for Restart falling edge");
  drive(r, { "//T/Estop1/Restart": false }).scan();
  assert.equal(out(r).out, true);
});

test("FB-ESTOP §4.4.4: Restart falling edge while an active input requests the safe state is not accepted", () => {
  const r = drive(runtime([estopBlock()]), { "//T/Estop1/EStopIn1": true, "//T/Estop1/Restart": true });
  r.scan();
  drive(r, { "//T/Estop1/EStopIn1": false }).scan();
  drive(r, { "//T/Estop1/Restart": false }).scan();
  drive(r, { "//T/Estop1/EStopIn1": true }).runFor(100);
  assert.equal(out(r).out, false);
});

test("FB-ESTOP §4.4.1/§4.4.2: a make-contact channel requests the safe state at logic 1", () => {
  const r = drive(runtime([estopBlock({ ch3: NO })]), { "//T/Estop1/EStopIn1": true, "//T/Estop1/EStopIn3": false, "//T/Estop1/Restart": true });
  r.scan(); drive(r, { "//T/Estop1/Restart": false }).scan();
  assert.equal(out(r).out, true, "NO channel at 0 = no request");
  drive(r, { "//T/Estop1/EStopIn3": true }).scan();
  assert.equal(out(r).out, false, "NO channel at 1 = safe-state request");
});

test("FB-ESTOP NV guard: Two-Channel discrepancy and active EDM are rejected, never emulated", () => {
  const twoChannel = runtime([estopBlock({ mode1: "Two-Channel" })]);
  drive(twoChannel, { "//T/Estop1/EStopIn1": true, "//T/Estop1/EStopIn2": true, "//T/Estop1/Restart": false });
  assert.throws(() => twoChannel.scan(), /Two-Channel discrepancy lifecycle is not modeled/);
  const edm = drive(runtime([estopBlock({ edm: true })]), { "//T/Estop1/EStopIn1": true, "//T/Estop1/Restart": false });
  assert.throws(() => edm.scan(), /EDM is not implemented/);
});

test("FB-DECOUPLE §4.6.1: inputs looped through to the outputs one-to-one", () => {
  const name = "Dec1";
  const block = { functionName: "safeDecouple", name, path: `//T/${name}`, orderOfExecution: 1,
    inputs: Array.from({ length: 8 }, (_, i) => port(name, `DecIn${i + 1}`)),
    outputs: Array.from({ length: 8 }, (_, i) => port(name, `DecOut${i + 1}`)), parameters: [] };
  for (const pattern of [[1, 0, 1, 1, 0, 0, 1, 0], [0, 1, 0, 0, 1, 1, 0, 1]]) {
    const r = runtime([block]);
    pattern.forEach((v, i) => r.values.set(block.inputs[i].path, Boolean(v)));
    r.scan();
    assert.deepEqual(block.outputs.map(o => r.get(o.path)), pattern.map(Boolean));
  }
});

test("GROUP §3.1 (derived): blocks execute in configured execution-order numbering; a lower-numbered reader sees the previous-cycle value of a higher-numbered producer", () => {
  const producer = logicBlock("safeAnd", "And", "AndOut", [NC, null, null, null, null, null, null, null], 2);
  const reader = { ...logicBlock("safeOr", "Or", "OrOut", [NC, null, null, null, null, null, null, null], 1) };
  reader.inputs[0] = { ...reader.inputs[0], sources: [producer.outputs[0].path] };
  const r = drive(runtime([producer, reader]), { [producer.inputs[0].path]: true });
  r.scan();
  assert.equal(r.get(producer.outputs[0].path), true);
  assert.equal(r.get(reader.outputs[0].path), false, "reader (order 1) ran before producer (order 2) in cycle 1");
  r.scan();
  assert.equal(r.get(reader.outputs[0].path), true, "visible one cycle later");
});
