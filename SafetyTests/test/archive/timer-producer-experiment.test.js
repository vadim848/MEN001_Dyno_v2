import test from "node:test";
import assert from "node:assert/strict";
import { timerExperiment, timerContinuitySummary } from "../../src/timer-producer-experiment.js";

test("TIMER01 Armed->Candidate maintains the first sample; faulty fixtures lose one scan", () => {
  const rows = timerContinuitySummary();
  assert.equal(rows[0].at990ms, false); assert.equal(rows[0].at1000ms, true);
  for (const row of rows.slice(1)) { assert.equal(row.at1000ms, false); assert.equal(row.at1010ms, true); }
  assert.equal(rows.every(r => r.fallbackPorts.length === 0), true);
});

test("TIMER02 Candidate->TwoAttempt preserves both-button timing and resets on channel loss", () => {
  const r = timerExperiment();
  r.runFor(10, { Q_G: true, I_Green: true, I_Blue: true, WithinProof: true });
  r.runFor(1990, { Q_G: false, Q_T: true }); // age1990 from first sample
  assert.equal(r.get("BothDone"), false);
  r.runFor(10); assert.equal(r.get("BothDone"), true);
  r.runFor(10, { I_Green: false }); assert.equal(r.get("BothDone"), false);
  r.setInputs({ I_Green: true }).scan().runFor(1990); assert.equal(r.get("BothDone"), false);
  r.runFor(10); assert.equal(r.get("BothDone"), true);
});

test("TIMER03 inhibit clears timers and requires a new complete neutral interval", () => {
  const r = timerExperiment();
  r.setInputs({ Q_W: true }).scan().runFor(1990); assert.equal(r.get("ReleaseDone"), false);
  r.runFor(10, { Inhibit: true }); assert.equal(r.get("ReleaseDone"), false);
  r.setInputs({ Inhibit: false }).scan().runFor(1990); assert.equal(r.get("ReleaseDone"), false);
  r.runFor(10); assert.equal(r.get("ReleaseDone"), true);
  r.runFor(10, { I_Blue: true }); assert.equal(r.get("ReleaseDone"), false);
});
