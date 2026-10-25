import test from "node:test";
import assert from "node:assert/strict";
import { TransitionRequestPrototype } from "../../src/transition-request-prototype.js";
import { ButtonCoverPrototype } from "../../src/button-cover-prototype.js";
const base = { mode: "R&D", allowDown: true, allowUp: true };
const tick = (o, extra = {}, dt = 10) => o.tick(dt, { ...base, ...extra });

test("OWNER01 one-scan down request survives release and repeated/up commands until completion", () => {
  const o = new TransitionRequestPrototype();
  assert.equal(tick(o, { stepDown: true }).accepted, "RnDToSafe");
  for (let i = 0; i < 100; i++) {
    assert.equal(tick(o, { stepUp: i % 2 === 0 }).request, "RnDToSafe");
  }
  const out = tick(o, { completion: { RnDToSafe: true } });
  assert.deepEqual(out.completed, { route: "RnDToSafe", target: "Safe" });
  assert.equal(out.status, "Idle");
});

test("OWNER02 held command cannot retrigger after completion and stale completion rejects a fresh attempt", () => {
  const o = new TransitionRequestPrototype();
  tick(o, { stepUp: true });
  tick(o, { stepUp: true, completion: { RnDToRun: true } });
  assert.equal(tick(o, { stepUp: true }).accepted, null);
  tick(o);
  assert.equal(tick(o, { stepUp: true, completion: { RnDToRun: true } }).rejected, "completion_already_high");
});

test("OWNER03 emergency beats completion and remains latched after fault disappears", () => {
  const o = new TransitionRequestPrototype();
  tick(o, { stepDown: true });
  const fault = tick(o, { emergency: true, completion: { RnDToSafe: true } });
  assert.equal(fault.requestEmergency, true);
  assert.equal(fault.request, null, "normal route is suppressed during emergency ownership");
  assert.equal(fault.interruptedRequest, "RnDToSafe");
  assert.equal(fault.completed, null);
  assert.equal(tick(o, { hazardRemoved: true }).requestEmergency, true);
  assert.equal(tick(o, { hazardRemoved: false, manualRecoveryPulse: true }).requestEmergency, true);
  assert.equal(tick(o, { hazardRemoved: true, manualRecoveryPulse: true }).requestEmergency, true);
  tick(o, { hazardRemoved: true });
  const recovered = tick(o, { hazardRemoved: true, manualRecoveryPulse: true });
  assert.deepEqual(recovered.completed, { route: "EmergencyRecovery", target: "Safe" });
});

test("OWNER04 guard rejection and simultaneous commands never select upward over downward", () => {
  const o = new TransitionRequestPrototype();
  assert.equal(tick(o, { stepUp: true, allowUp: false }).rejected, "acceptance_guard_false");
  tick(o);
  assert.equal(tick(o, { stepUp: true, stepDown: true }).accepted, "RnDToSafe");
});

test("OWNER05 illustrative timeout escalates, while completion at the boundary wins", () => {
  const a = new TransitionRequestPrototype({ timeoutMs: { RnDToSafe: 50 } });
  tick(a, { stepDown: true });
  assert.equal(tick(a, {}, 50).reason, "transition_timeout");
  const b = new TransitionRequestPrototype({ timeoutMs: { RnDToSafe: 50 } });
  tick(b, { stepDown: true });
  assert.equal(tick(b, { completion: { RnDToSafe: true } }, 50).status, "Idle");
});

test("OWNER06 integrated recognizer pulse retains request across release and inhibits new gestures", () => {
  const buttons = new ButtonCoverPrototype();
  const owner = new TransitionRequestPrototype();
  let out;
  function sample(input = {}) {
    const b = buttons.tick(10, { mode: "R&D", safeEnergyForAccess: true,
      transition: owner.status !== "Idle", ...input });
    out = tick(owner, { stepUp: b.stepUp, stepDown: b.stepDown });
    return b;
  }
  for (let i = 0; i < 200; i++) sample();
  for (let i = 0; i < 100; i++) sample({ green: true });
  assert.equal(out.request, "RnDToSafe");
  for (let i = 0; i < 400; i++) {
    const b = sample({ blue: true });
    assert.equal(b.unlock || b.stepUp || b.stepDown, false);
    assert.equal(out.request, "RnDToSafe");
  }
});
