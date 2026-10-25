import test from "node:test";
import assert from "node:assert/strict";
import { IntegratedControlPrototype } from "../src/integrated-control-prototype.js";
const base = { mode: "R&D", safeEnergyForAccess: true, allowUp: true, allowDown: true };
function run(p, ms, extra = {}) {
  const trace = [];
  for (let t = 0; t < ms; t += 10) trace.push(p.tick(10, { ...base, ...extra }));
  return trace;
}
function armed() { const p = new IntegratedControlPrototype(); run(p, 2000); return p; }

test("COMBINED01 down pulse retains native owner across release and blocks blue access", () => {
  const p = armed();
  const command = run(p, 1000, { green: true }).at(-1);
  assert.deepEqual(command.owner.accepted, ["RnDToSafe"]);
  assert.equal(command.unlock, false);
  for (const frame of run(p, 3000, { blue: true })) {
    assert.deepEqual(frame.owner.requests, ["RnDToSafe"]);
    assert.equal(frame.unlock || frame.buttons.stepUp || frame.buttons.stepDown, false);
  }
});

test("COMBINED02 completion and mode change cannot re-enable held-blue access", () => {
  const p = armed(); run(p, 1000, { green: true });
  run(p, 100, { blue: true });
  const done = run(p, 10, { blue: true, completion: { RnDToSafe: true } }).at(-1);
  assert.deepEqual(done.owner.completed, ["RnDToSafe"]);
  assert.equal(done.unlock, false);
  assert.equal(run(p, 2200, { blue: true, mode: "Safe" }).some(x => x.unlock), false);
  run(p, 2010, { mode: "Safe" });
  assert.equal(run(p, 1200, { blue: true, mode: "Safe" }).at(-1).unlock, true);
});

test("COMBINED03 emergency drops qualified unlock in the same frame and latches through recovery", () => {
  const p = armed(); assert.equal(run(p, 1200, { blue: true }).at(-1).unlock, true);
  const fault = run(p, 10, { blue: true, emergency: true }).at(-1);
  assert.equal(fault.unlock, false); assert.equal(fault.owner.emergency, true);
  assert.equal(run(p, 2200, { blue: true }).some(x => x.unlock), false);
  const recovery = run(p, 10, { blue: true, hazardRemoved: true, manualRecoveryPulse: true }).at(-1);
  assert.equal(recovery.recoveryTarget, "Safe"); assert.equal(recovery.unlock, false);
  assert.equal(run(p, 1200, { blue: true, mode: "Safe" }).some(x => x.unlock), false);
});

test("COMBINED04 interrupted route/energy context is frozen for diagnostics without normal requests", () => {
  const p = armed(); run(p, 2000, { green: true, blue: true });
  const energy = { c2Connected: true, motionKnownSafe: false };
  const out = run(p, 10, { fault: true, energyContext: energy }).at(-1);
  assert.deepEqual(out.owner.requests, []);
  assert.deepEqual(out.interruptedContext.routes, ["RnDToRun"]);
  energy.c2Connected = false;
  const held = run(p, 100, { energyContext: { c2Connected: false } }).at(-1);
  assert.equal(held.interruptedContext.energyContext.c2Connected, true);
  assert.equal(held.owner.emergency, true);
});

test("COMBINED05 emergency wins over simultaneous completion and missing guards reject pulses", () => {
  const p = armed(); run(p, 1000, { green: true });
  const out = run(p, 10, { emergency: true, completion: { RnDToSafe: true } }).at(-1);
  assert.deepEqual(out.owner.completed, []); assert.equal(out.owner.emergency, true);
  const q = armed();
  const rejected = run(q, 1000, { green: true, allowDown: false }).at(-1);
  assert.deepEqual(rejected.owner.accepted, []); assert.deepEqual(rejected.owner.requests, []);
});
