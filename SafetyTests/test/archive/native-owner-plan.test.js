import test from "node:test";
import assert from "node:assert/strict";
import { NativeOwnerPlanRuntime, buildNativeOwnerPlan, ownerRoutes } from "../../src/native-owner-plan.js";
import { TransitionRequestPrototype } from "../../src/transition-request-prototype.js";

function inputs(p, i) {
  const x = Object.fromEntries(p.externalInputs.map(n => [n, false]));
  Object.assign(x, { ModeSafe: i.mode === "Safe", ModeRnD: i.mode === "R&D", ModeRun: i.mode === "Run",
    StepUp: !!i.stepUp, StepDown: !!i.stepDown, ManualRecovery: !!i.manualRecoveryPulse,
    AllowUp: i.allowUp === true, AllowDown: i.allowDown === true, Emergency: !!i.emergency,
    Fault: !!i.fault, InvalidState: !!i.invalidState, HazardRemoved: !!i.hazardRemoved });
  for (const r of ownerRoutes) { x[`Complete.${r}`] = i.completion?.[r] === true; x[`Timeout.${r}`] = i.timeout?.[r] === true; }
  return x;
}
function pair() {
  const native = new NativeOwnerPlanRuntime(), reference = new TransitionRequestPrototype();
  return i => {
    const a = native.scan(inputs(native.plan, i)), b = reference.tick(10, i);
    assert.deepEqual(a.requests, b.request ? [b.request] : []);
    assert.deepEqual(a.accepted, b.accepted ? [b.accepted] : []);
    assert.deepEqual(a.completed, b.completed && b.completed.route !== "EmergencyRecovery" ? [b.completed.route] : []);
    assert.equal(a.recovery, b.completed?.route === "EmergencyRecovery");
    assert.equal(a.emergency, b.requestEmergency);
    assert.equal(a.busy, b.transitionActive);
    return a;
  };
}

test("NOWNER01 four routes retain pulses and complete equivalently to the host owner", () => {
  for (const [mode, command, route] of [["Safe", "stepUp", "SafeToRnD"], ["R&D", "stepUp", "RnDToRun"],
    ["Run", "stepDown", "RunToRnD"], ["R&D", "stepDown", "RnDToSafe"]]) {
    const scan = pair(), base = { mode, allowUp: true, allowDown: true };
    assert.deepEqual(scan({ ...base, [command]: true }).requests, [route]);
    for (let i = 0; i < 30; i++) assert.deepEqual(scan(base).requests, [route]);
    assert.deepEqual(scan({ ...base, completion: { [route]: true } }).completed, [route]);
  }
});

test("NOWNER02 deterministic mixed commands/faults/recovery match the reference across 1000 scans", () => {
  const scan = pair(); let seed = 47291;
  const random = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  for (let k = 0; k < 1000; k++) scan({ mode: ["Safe", "R&D", "Run"][random(3)],
    allowUp: random(3) > 0, allowDown: random(3) > 0, stepUp: random(5) === 0, stepDown: random(5) === 0,
    manualRecoveryPulse: random(4) === 0, hazardRemoved: random(2) === 0, emergency: random(17) === 0,
    fault: random(31) === 0, completion: Object.fromEntries(ownerRoutes.map(r => [r, random(7) === 0])) });
});

test("NOWNER03 timeout takeover is suppressed by valid completion at the same boundary", () => {
  for (const done of [false, true]) {
    const r = new NativeOwnerPlanRuntime();
    const base = { mode: "R&D", allowDown: true };
    r.scan(inputs(r.plan, { ...base, stepDown: true }));
    const out = r.scan(inputs(r.plan, { ...base, timeout: { RnDToSafe: true }, completion: { RnDToSafe: done } }));
    assert.equal(out.emergency, !done);
    assert.deepEqual(out.completed, done ? ["RnDToSafe"] : []);
    assert.deepEqual(out.requests, []);
  }
});

test("NOWNER04 conflicts latch emergency and unspecified producer inputs are rejected", () => {
  const r = new NativeOwnerPlanRuntime();
  r.memory.set("State.RnDToSafe", true); r.memory.set("State.RnDToRun", true);
  const out = r.scan(inputs(r.plan, { mode: "R&D" }));
  assert.equal(out.emergency, true);
  assert.deepEqual(out.requests, []);
  assert.throws(() => new NativeOwnerPlanRuntime().scan({}), /Missing explicit Boolean input/);
  const p = buildNativeOwnerPlan();
  assert.equal(p.snapshot.channels.length, 8);
  assert.equal(p.blocks.filter(b => b.type === "safeRs").length, 8);
  assert.equal(p.blocks.filter(b => b.inputs).every(b => b.inputs.length >= 2 && b.inputs.length <= 8), true);
});

test("NOWNER05 graph matches fault-over-completion and fresh manual recovery gating", () => {
  const scan = pair(), base = { mode: "R&D", allowDown: true };
  scan({ ...base, stepDown: true });
  assert.equal(scan({ ...base, emergency: true, completion: { RnDToSafe: true } }).emergency, true);
  assert.equal(scan({ ...base, manualRecoveryPulse: true }).emergency, true);
  assert.equal(scan({ ...base, hazardRemoved: true, manualRecoveryPulse: true }).emergency, true);
  scan({ ...base, hazardRemoved: true });
  assert.equal(scan({ ...base, hazardRemoved: true, manualRecoveryPulse: true }).recovery, true);
});
