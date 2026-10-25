import test from "node:test";
import assert from "node:assert/strict";
import { ButtonCoverPrototype } from "../../src/button-cover-prototype.js";
const base = { mode: "R&D", safeEnergyForAccess: true };
function run(p, ms, input = {}) {
  const out = [];
  for (let t = 0; t < ms; t += 10) out.push(p.tick(10, { ...base, ...input }));
  return out;
}
function armed() { const p = new ButtonCoverPrototype(); run(p, 2000); return p; }

test("PROTO01 startup-held and incomplete neutral cannot create a command", () => {
  const p = new ButtonCoverPrototype();
  assert.equal(run(p, 4000, { blue: true }).some(o => o.unlock), false);
  run(p, 1500);
  assert.equal(run(p, 2000, { green: true }).some(o => o.stepDown), false);
});
test("PROTO02 green pulse occurs once; short release cannot re-arm", () => {
  const p = armed();
  const events = run(p, 3000, { green: true });
  assert.equal(events.filter(o => o.stepDown).length, 1);
  run(p, 100);
  assert.equal(run(p, 2000, { green: true }).some(o => o.stepDown), false);
});
test("PROTO03 inclusive chord boundary accepts 490/500 and rejects 510 ms", () => {
  for (const stagger of [490, 500, 510]) {
    const p = armed(); run(p, stagger, { green: true });
    const events = run(p, 2200, { green: true, blue: true });
    assert.equal(events.filter(o => o.stepUp).length, stagger <= 500 ? 1 : 0);
    assert.equal(events.some(o => o.stepDown || o.unlock), false);
  }
});
test("PROTO04 failed chord never degrades and requires a fresh simultaneous interval", () => {
  const p = armed(); run(p, 1500, { green: true, blue: true });
  assert.equal(run(p, 3000, { blue: true }).some(o => o.unlock || o.stepDown || o.stepUp), false);
  assert.equal(run(p, 1900, { green: true, blue: true }).some(o => o.stepUp), false);
  assert.equal(run(p, 100, { green: true, blue: true }).filter(o => o.stepUp).length, 1);
});
test("PROTO05 blue permission falls on release/fault and cannot resume while held", () => {
  const p = armed();
  assert.equal(run(p, 1200, { blue: true }).at(-1).unlock, true);
  assert.equal(run(p, 10, { blue: true, emergency: true }).at(-1).unlock, false);
  assert.equal(run(p, 2000, { blue: true }).some(o => o.unlock), false);
  run(p, 2010);
  assert.equal(run(p, 1200, { blue: true }).at(-1).unlock, true);
  assert.equal(run(p, 10).at(-1).unlock, false);
});
test("PROTO06 mode/transition and missing energy proof inhibit access", () => {
  for (const change of [{ mode: "Run" }, { transition: true }, { safeEnergyForAccess: false }]) {
    const p = armed(); run(p, 1200, { blue: true });
    assert.equal(run(p, 10, { blue: true, ...change }).at(-1).unlock, false);
    assert.equal(run(p, 2100, { blue: true }).some(o => o.unlock), false);
  }
});

test("PROTO07 conflicting state memories inhibit outputs and return to release qualification", () => {
  const p = armed(); p.q.U = true;
  const out = p.tick(10, { ...base, blue: true });
  assert.equal(out.recognizerFault, true);
  assert.equal(out.state, "W");
  assert.equal(out.unlock || out.stepUp || out.stepDown, false);
});
