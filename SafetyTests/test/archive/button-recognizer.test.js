import test from "node:test";
import assert from "node:assert/strict";
import { ButtonRecognizer, ButtonState } from "../../src/button-recognizer.js";

const run = (r, ms, green, blue, step = 100) => {
  const events = [];
  for (let t = 0; t < ms; t += step) events.push(r.tick(Math.min(step, ms - t), green, blue));
  return events;
};

test("B01 green requires release filter and stable single hold", () => {
  const r = new ButtonRecognizer();
  run(r, 2000, false, false);
  const e = run(r, 1000, true, false);
  assert.equal(e.filter(x => x.stepDown).length, 1);
});

test("B03 staggered buttons inside chord window become one StepUp", () => {
  const r = new ButtonRecognizer();
  run(r, 2000, false, false);
  run(r, 300, true, false);
  const e = run(r, 2000, true, true);
  assert.equal(e.filter(x => x.stepUp).length, 1);
  assert.equal(e.some(x => x.stepDown || x.unlock), false);
});

test("B09 flicker in two-button attempt never degrades to blue", () => {
  const r = new ButtonRecognizer();
  run(r, 2000, false, false);
  run(r, 200, false, true);
  run(r, 1000, true, true);
  const flicker = run(r, 3000, false, true);
  assert.equal(flicker.some(x => x.unlock || x.stepDown || x.stepUp), false);
  assert.equal(r.state, ButtonState.TWO);
});

test("B11 two-button timer restarts after flicker", () => {
  const r = new ButtonRecognizer();
  run(r, 2000, false, false);
  run(r, 200, true, false);
  run(r, 1500, true, true);
  run(r, 100, true, false);
  assert.equal(run(r, 1900, true, true).some(x => x.stepUp), false);
  assert.equal(run(r, 100, true, true).filter(x => x.stepUp).length, 1);
});

test("B14 incomplete release filter cannot arm held input", () => {
  const r = new ButtonRecognizer();
  run(r, 1500, false, false);
  assert.equal(run(r, 5000, true, false).some(x => x.stepDown), false);
});
