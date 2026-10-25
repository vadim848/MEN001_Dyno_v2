import test from "node:test";
import assert from "node:assert/strict";
import { SafetyModel, Mode, defaultInputs } from "../src/safety-model.js";

const tickFor = (m, input, ms, step = 100) => {
  let s;
  for (let t = 0; t < ms; t += step) s = m.tick(Math.min(step, ms - t), input);
  return s;
};

const release = (m, input) => tickFor(m, { ...input, green: false, blue: false }, 2000);
const stepUp = (m, input) => {
  release(m, input);
  return tickFor(m, { ...input, green: true, blue: true }, 2000);
};
const stepDown = (m, input) => {
  release(m, input);
  return tickFor(m, { ...input, green: true, blue: false }, 1000);
};

test("D01/E01 full upward path requires feedback and locked cover", () => {
  const m = new SafetyModel();
  let i = defaultInputs();
  stepUp(m, i);
  assert.equal(m.mode, Mode.STARTING_RND);
  i = { ...i, lvFeedback: true };
  m.tick(100, i);
  assert.equal(m.mode, Mode.RND);
  i = { ...i, healthy: true };
  stepUp(m, i);
  assert.equal(m.mode, Mode.STARTING_RUN);
  i = { ...i, c2Feedback: true };
  m.tick(100, i);
  assert.equal(m.mode, Mode.RUN);
});

test("C06 upward request with open cover is silently ignored", () => {
  const m = new SafetyModel();
  const i = { ...defaultInputs(), coverClosed: false, coverLocked: false };
  stepUp(m, i);
  assert.equal(m.mode, Mode.SAFE);
  assert.equal(m.fault, null);
});

test("C01/C05/C06/C08 cover unlock, open wait, rejected rise, relock and fresh rise", () => {
  const m = new SafetyModel();
  let i = defaultInputs();

  // Qualify neutral state, then hold only blue for one second.
  release(m, i);
  let s = tickFor(m, { ...i, blue: true }, 900);
  assert.equal(s.outputs.unlockCover, false);
  s = tickFor(m, { ...i, blue: true }, 100);
  assert.equal(s.outputs.unlockCover, true);
  assert.equal(s.mode, Mode.SAFE);

  // The operator opens the cover while holding blue, then releases blue.
  i = { ...i, coverClosed: false, coverLocked: false };
  s = m.tick(100, { ...i, blue: true });
  assert.equal(s.outputs.unlockCover, true);
  s = m.tick(100, { ...i, blue: false });
  assert.equal(s.outputs.unlockCover, false);
  assert.equal(s.mode, Mode.SAFE);
  assert.equal(s.fault, null);

  // The open cover may remain open indefinitely without a timeout fault.
  s = tickFor(m, i, 60000, 1000);
  assert.equal(s.mode, Mode.SAFE);
  assert.equal(s.fault, null);

  // A fully qualified StepUp with the cover open is consumed and ignored.
  stepUp(m, i);
  assert.equal(m.mode, Mode.SAFE);
  assert.equal(m.fault, null);
  assert.equal(m.outputs.lvCommand, false);

  // Closing and locking cannot reuse the old request.
  i = { ...i, coverClosed: true, coverLocked: true };
  m.tick(100, i);
  assert.equal(m.mode, Mode.SAFE);

  // Only a fresh release filter and a fresh two-button gesture may rise.
  stepUp(m, i);
  assert.equal(m.mode, Mode.STARTING_RND);
  assert.equal(m.outputs.unlockCover, false);
  assert.equal(m.outputs.lvCommand, true);

  // R&D is declared only after LV feedback.
  i = { ...i, lvFeedback: true };
  m.tick(100, i);
  assert.equal(m.mode, Mode.RND);
});

test("F01 normal Run to R&D keeps C2 during SS1 and discharge", () => {
  const m = new SafetyModel({ ss1Ms: 1000, normalStopWaitMs: 500 });
  let i = { ...defaultInputs(), lvFeedback: true, c2Feedback: true, healthy: true };
  m.mode = Mode.RUN;
  stepDown(m, i);
  assert.equal(m.mode, Mode.STOPPING_SS1);
  assert.equal(m.outputs.ss1, true);
  assert.equal(m.outputs.c2Command, true);
  tickFor(m, i, 1500);
  assert.equal(m.mode, Mode.DISCHARGING);
  assert.equal(m.outputs.discharge, true);
  assert.equal(m.outputs.c2Command, true);
  i = { ...i, dischargeComplete: true };
  m.tick(100, i);
  assert.equal(m.mode, Mode.DISCONNECTING);
  assert.equal(m.outputs.c2Command, false);
  i = { ...i, c2Feedback: false };
  m.tick(100, i);
  assert.equal(m.mode, Mode.RND);
});

test("F02 Healthy loss during SS1 immediately selects STO coast path", () => {
  const m = new SafetyModel({ stoCoastMs: 5000 });
  let i = { ...defaultInputs(), lvFeedback: true, c2Feedback: true, healthy: true };
  m.mode = Mode.RUN;
  stepDown(m, i);
  i = { ...i, healthy: false };
  const s = m.tick(100, i);
  assert.equal(s.mode, Mode.STO_COAST);
  assert.equal(s.outputs.sto, true);
  i = { ...i, healthy: true };
  tickFor(m, i, 4900);
  assert.equal(m.mode, Mode.STO_COAST);
  tickFor(m, i, 100);
  assert.equal(m.mode, Mode.DISCHARGING);
});

test("G06 before timeout missing discharge completion prevents C2 opening and R&D", () => {
  const m = new SafetyModel();
  const i = { ...defaultInputs(), lvFeedback: true, c2Feedback: true };
  m.mode = Mode.DISCHARGING;
  const s = tickFor(m, i, 9000, 1000);
  assert.equal(s.mode, Mode.DISCHARGING);
  assert.equal(s.outputs.c2Command, true);
  assert.equal(s.outputs.discharge, true);
});

test("A05 E-Stop dominates from Run and enters emergency coast", () => {
  const m = new SafetyModel();
  m.mode = Mode.RUN;
  const s = m.tick(10, { ...defaultInputs(), eStopOk: false, c2Feedback: true });
  assert.equal(s.mode, Mode.EMERGENCY_COAST);
  assert.equal(s.outputs.sto, true);
  assert.equal(s.outputs.c2Command, true);
  assert.equal(s.outputs.unlockCover, false);
});

test("END-TO-END normal Safe -> R&D -> Run -> R&D -> Safe cycle", () => {
  const m = new SafetyModel({ ss1Ms: 3000, normalStopWaitMs: 1000 });
  let i = defaultInputs();

  // Safe -> StartingRnD: a fresh StepUp is accepted only with a locked cover.
  stepUp(m, i);
  assert.equal(m.mode, Mode.STARTING_RND);
  assert.equal(m.outputs.lvCommand, true);
  assert.equal(m.outputs.c2Command, false);
  assert.equal(m.outputs.sto, true);

  // StartingRnD -> R&D only after LV feedback.
  i = { ...i, lvFeedback: true };
  m.tick(100, i);
  assert.equal(m.mode, Mode.RND);

  // R&D -> StartingRun; C2 is requested but Run waits for its feedback.
  i = { ...i, healthy: true };
  stepUp(m, i);
  assert.equal(m.mode, Mode.STARTING_RUN);
  assert.equal(m.outputs.c2Command, true);
  assert.equal(m.outputs.sto, false);

  i = { ...i, c2Feedback: true };
  m.tick(100, i);
  assert.equal(m.mode, Mode.RUN);

  // Run -> StoppingSS1; regenerative source/C2 must remain connected.
  stepDown(m, i);
  assert.equal(m.mode, Mode.STOPPING_SS1);
  assert.equal(m.outputs.ss1, true);
  assert.equal(m.outputs.sto, false);
  assert.equal(m.outputs.c2Command, true);

  // Normal SS1 plus its validated wait completes before discharge.
  tickFor(m, i, 3900);
  assert.equal(m.mode, Mode.STOPPING_SS1);
  tickFor(m, i, 100);
  assert.equal(m.mode, Mode.DISCHARGING);
  assert.equal(m.outputs.sto, true);
  assert.equal(m.outputs.discharge, true);
  assert.equal(m.outputs.c2Command, true);

  // C2 may open only after discharge completion.
  i = { ...i, dischargeComplete: true };
  m.tick(100, i);
  assert.equal(m.mode, Mode.DISCONNECTING);
  assert.equal(m.outputs.discharge, false);
  assert.equal(m.outputs.c2Command, false);

  // R&D is not declared until C2 feedback confirms OFF.
  i = { ...i, c2Feedback: false };
  m.tick(100, i);
  assert.equal(m.mode, Mode.RND);
  assert.equal(m.outputs.sto, true);

  // R&D -> StoppingToSafe -> Safe requires a fresh green gesture and LV OFF feedback.
  stepDown(m, i);
  assert.equal(m.mode, Mode.STOPPING_SAFE);
  i = { ...i, lvFeedback: false };
  m.tick(100, i);
  assert.equal(m.mode, Mode.SAFE);
  assert.equal(m.outputs.lvCommand, false);
  assert.equal(m.outputs.c2Command, false);
  assert.equal(m.outputs.sto, true);
  assert.equal(m.outputs.unlockCover, false);
});

test("D04 LV ON feedback timeout prevents R&D", () => {
  const m = new SafetyModel({ lvOnTimeoutMs: 5000 });
  const i = defaultInputs();
  stepUp(m, i);
  tickFor(m, i, 4900);
  assert.equal(m.mode, Mode.STARTING_RND);
  const s = tickFor(m, i, 100);
  assert.equal(s.mode, Mode.FAULT);
  assert.equal(s.fault, "lv_on_timeout");
  assert.equal(s.outputs.lvCommand, false);
  assert.equal(s.outputs.sto, true);
});

test("E04 C2 ON feedback timeout prevents Run", () => {
  const m = new SafetyModel({ c2OnTimeoutMs: 5000 });
  let i = { ...defaultInputs(), lvFeedback: true, healthy: true };
  m.mode = Mode.RND;
  stepUp(m, i);
  tickFor(m, i, 4900);
  assert.equal(m.mode, Mode.STARTING_RUN);
  const s = tickFor(m, i, 100);
  assert.equal(s.mode, Mode.FAULT);
  assert.equal(s.fault, "c2_on_timeout");
  assert.notEqual(s.mode, Mode.RUN);
});

test("G06 discharge timeout faults while keeping C2 and discharge commanded", () => {
  const m = new SafetyModel({ dischargeTimeoutMs: 10000 });
  const i = { ...defaultInputs(), lvFeedback: true, c2Feedback: true };
  m.mode = Mode.DISCHARGING;
  tickFor(m, i, 9900);
  assert.equal(m.mode, Mode.DISCHARGING);
  const s = tickFor(m, i, 100);
  assert.equal(s.mode, Mode.FAULT);
  assert.equal(s.fault, "discharge_timeout");
  assert.equal(s.outputs.sto, true);
  assert.equal(s.outputs.discharge, true);
  assert.equal(s.outputs.c2Command, true);
  assert.equal(s.outputs.unlockCover, false);
});

test("G07 C2 OFF feedback timeout prevents R&D", () => {
  const m = new SafetyModel({ c2OffTimeoutMs: 5000 });
  const i = { ...defaultInputs(), lvFeedback: true, c2Feedback: true, dischargeComplete: true };
  m.mode = Mode.DISCONNECTING;
  tickFor(m, i, 4900);
  assert.equal(m.mode, Mode.DISCONNECTING);
  const s = tickFor(m, i, 100);
  assert.equal(s.mode, Mode.FAULT);
  assert.equal(s.fault, "c2_off_timeout");
  assert.equal(s.outputs.c2Command, false);
  assert.equal(s.outputs.sto, true);
});

test("H02 LV OFF feedback timeout prevents Safe", () => {
  const m = new SafetyModel({ lvOffTimeoutMs: 5000 });
  const i = { ...defaultInputs(), lvFeedback: true };
  m.mode = Mode.STOPPING_SAFE;
  tickFor(m, i, 4900);
  assert.equal(m.mode, Mode.STOPPING_SAFE);
  const s = tickFor(m, i, 100);
  assert.equal(s.mode, Mode.FAULT);
  assert.equal(s.fault, "lv_off_timeout");
  assert.notEqual(s.mode, Mode.SAFE);
  assert.equal(s.outputs.lvCommand, false);
});

test("A05 E-Stop in Safe and R&D goes directly to de-energized Emergency", () => {
  for (const initial of [Mode.SAFE, Mode.RND, Mode.STARTING_RND, Mode.STOPPING_SAFE]) {
    const m = new SafetyModel();
    m.mode = initial;
    const s = m.tick(10, { ...defaultInputs(), eStopOk: false });
    assert.equal(s.mode, Mode.EMERGENCY, initial);
    assert.equal(s.outputs.sto, true, initial);
    assert.equal(s.outputs.c2Command, false, initial);
    assert.equal(s.outputs.unlockCover, false, initial);
  }
});

test("A06 E-Stop in an HV-capable phase uses STO coast and keeps C2 connected", () => {
  for (const initial of [Mode.STARTING_RUN, Mode.RUN, Mode.STOPPING_SS1, Mode.STO_COAST]) {
    const m = new SafetyModel({ stoCoastMs: 5000 });
    m.mode = initial;
    const s = m.tick(10, { ...defaultInputs(), eStopOk: false, c2Feedback: true });
    assert.equal(s.mode, Mode.EMERGENCY_COAST, initial);
    assert.equal(s.outputs.sto, true, initial);
    assert.equal(s.outputs.c2Command, true, initial);
    assert.equal(s.outputs.ss1, false, initial);
    assert.equal(s.outputs.unlockCover, false, initial);
  }
});

test("A06 E-Stop during discharge continues discharge with C2 ON", () => {
  const m = new SafetyModel();
  m.mode = Mode.DISCHARGING;
  const s = m.tick(10, { ...defaultInputs(), eStopOk: false, c2Feedback: true });
  assert.equal(s.mode, Mode.EMERGENCY_DISCHARGING);
  assert.equal(s.outputs.sto, true);
  assert.equal(s.outputs.discharge, true);
  assert.equal(s.outputs.c2Command, true);
  assert.equal(s.outputs.unlockCover, false);
});

test("A06 E-Stop during C2 disconnect continues waiting for C2 OFF", () => {
  const m = new SafetyModel();
  m.mode = Mode.DISCONNECTING;
  let i = { ...defaultInputs(), eStopOk: false, c2Feedback: true };
  let s = m.tick(10, i);
  assert.equal(s.mode, Mode.EMERGENCY_DISCONNECTING);
  assert.equal(s.outputs.c2Command, false);
  assert.equal(s.outputs.sto, true);
  i = { ...i, c2Feedback: false };
  s = m.tick(10, i);
  assert.equal(s.mode, Mode.EMERGENCY);
});

test("A06 complete E-Stop HV sequence cannot skip coast, discharge or C2 feedback", () => {
  const m = new SafetyModel({ stoCoastMs: 5000 });
  let i = { ...defaultInputs(), eStopOk: false, c2Feedback: true };
  m.mode = Mode.RUN;

  let s = m.tick(10, i);
  assert.equal(s.mode, Mode.EMERGENCY_COAST);
  tickFor(m, i, 4900);
  assert.equal(m.mode, Mode.EMERGENCY_COAST);
  tickFor(m, i, 100);
  assert.equal(m.mode, Mode.EMERGENCY_DISCHARGING);
  assert.equal(m.outputs.c2Command, true);
  assert.equal(m.outputs.discharge, true);

  // Waiting without HV-safe feedback never opens C2.
  tickFor(m, i, 20000, 1000);
  assert.equal(m.mode, Mode.EMERGENCY_DISCHARGING);
  assert.equal(m.outputs.c2Command, true);

  i = { ...i, dischargeComplete: true };
  m.tick(10, i);
  assert.equal(m.mode, Mode.EMERGENCY_DISCONNECTING);
  assert.equal(m.outputs.c2Command, false);

  // Final Emergency is not declared before C2 feedback is OFF.
  m.tick(1000, i);
  assert.equal(m.mode, Mode.EMERGENCY_DISCONNECTING);
  i = { ...i, c2Feedback: false };
  s = m.tick(10, i);
  assert.equal(s.mode, Mode.EMERGENCY);
  assert.equal(s.outputs.sto, true);
  assert.equal(s.outputs.unlockCover, false);
});

test("C05 open cover is permitted indefinitely in Safe and R&D", () => {
  for (const initial of [Mode.SAFE, Mode.RND]) {
    const m = new SafetyModel();
    m.mode = initial;
    const i = { ...defaultInputs(), coverClosed: false, coverLocked: false, lvFeedback: initial === Mode.RND };
    const s = tickFor(m, i, 60000, 1000);
    assert.equal(s.mode, initial);
    assert.equal(s.fault, null);
    assert.equal(s.outputs.unlockCover, false);
  }
});

test("C09 loss of cover interlock in StartingRnD faults before R&D", () => {
  const m = new SafetyModel();
  m.mode = Mode.STARTING_RND;
  const s = m.tick(10, { ...defaultInputs(), coverClosed: false, coverLocked: false });
  assert.equal(s.mode, Mode.FAULT);
  assert.equal(s.fault, "cover_interlock_lost");
  assert.equal(s.outputs.lvCommand, false);
  assert.equal(s.outputs.unlockCover, false);
});

test("C09 cover interlock loss in HV-capable phases latches emergency energy removal", () => {
  for (const initial of [Mode.STARTING_RUN, Mode.RUN, Mode.STOPPING_SS1, Mode.STO_COAST]) {
    const m = new SafetyModel();
    m.mode = initial;
    let i = { ...defaultInputs(), coverLocked: false, c2Feedback: true, healthy: true };
    let s = m.tick(10, i);
    assert.equal(s.mode, Mode.EMERGENCY_COAST, initial);
    assert.equal(s.fault, "cover_interlock_lost_hazardous", initial);
    assert.equal(s.outputs.sto, true, initial);
    assert.equal(s.outputs.c2Command, true, initial);
    assert.equal(s.outputs.unlockCover, false, initial);

    // A restored contact cannot cancel or rewind the emergency sequence.
    i = { ...i, coverLocked: true };
    s = m.tick(10, i);
    assert.equal(s.mode, Mode.EMERGENCY_COAST, initial);
  }
});

test("C09 cover interlock loss during discharge continues emergency discharge", () => {
  const m = new SafetyModel();
  m.mode = Mode.DISCHARGING;
  const s = m.tick(10, { ...defaultInputs(), coverClosed: false, coverLocked: false, c2Feedback: true });
  assert.equal(s.mode, Mode.EMERGENCY_DISCHARGING);
  assert.equal(s.fault, "cover_interlock_lost_hazardous");
  assert.equal(s.outputs.sto, true);
  assert.equal(s.outputs.discharge, true);
  assert.equal(s.outputs.c2Command, true);
  assert.equal(s.outputs.unlockCover, false);
});

test("C09 cover interlock loss during disconnect never re-closes C2", () => {
  const m = new SafetyModel();
  m.mode = Mode.DISCONNECTING;
  const s = m.tick(10, { ...defaultInputs(), coverLocked: false, c2Feedback: true });
  assert.equal(s.mode, Mode.EMERGENCY_DISCONNECTING);
  assert.equal(s.outputs.c2Command, false);
  assert.equal(s.outputs.sto, true);
  assert.equal(s.outputs.unlockCover, false);
});

test("P01 missing LV or HV connector interlock in Safe only blocks StepUp", () => {
  for (const missing of ["lvConnectorInterlock", "hvConnectorInterlock"]) {
    const m = new SafetyModel();
    let i = { ...defaultInputs(), [missing]: false };
    stepUp(m, i);
    assert.equal(m.mode, Mode.SAFE, missing);
    assert.equal(m.fault, null, missing);
    assert.equal(m.outputs.lvCommand, false, missing);

    // Restoring the connector cannot reuse the rejected request.
    i = { ...i, [missing]: true };
    m.tick(100, i);
    assert.equal(m.mode, Mode.SAFE, missing);
    stepUp(m, i);
    assert.equal(m.mode, Mode.STARTING_RND, missing);
  }
});

test("P02 connector loss after leaving Safe starts emergency response", () => {
  for (const missing of ["lvConnectorInterlock", "hvConnectorInterlock"]) {
    const m = new SafetyModel();
    m.mode = Mode.RUN;
    const s = m.tick(10, { ...defaultInputs(), [missing]: false, c2Feedback: true, healthy: true });
    assert.equal(s.mode, Mode.EMERGENCY_COAST, missing);
    assert.equal(s.fault, "power_connector_interlock_lost", missing);
    assert.equal(s.outputs.sto, true, missing);
    assert.equal(s.outputs.c2Command, true, missing);
  }
});

test("P03 either external emergency interlock channel causes Emergency", () => {
  for (const missing of ["externalInterlockCh1", "externalInterlockCh2"]) {
    const safe = new SafetyModel();
    let s = safe.tick(10, { ...defaultInputs(), [missing]: false });
    assert.equal(s.mode, Mode.EMERGENCY, missing);
    assert.equal(s.fault, "external_emergency_interlock_lost", missing);
    assert.equal(s.outputs.sto, true, missing);

    const run = new SafetyModel();
    run.mode = Mode.RUN;
    s = run.tick(10, { ...defaultInputs(), [missing]: false, c2Feedback: true });
    assert.equal(s.mode, Mode.EMERGENCY_COAST, missing);
    assert.equal(s.outputs.sto, true, missing);
    assert.equal(s.outputs.c2Command, true, missing);
  }
});

test("P04 restored external interlock does not cancel emergency sequence", () => {
  const m = new SafetyModel();
  m.mode = Mode.RUN;
  let i = { ...defaultInputs(), externalInterlockCh1: false, c2Feedback: true };
  m.tick(10, i);
  i = { ...i, externalInterlockCh1: true };
  const s = m.tick(10, i);
  assert.equal(s.mode, Mode.EMERGENCY_COAST);
  assert.equal(s.fault, "external_emergency_interlock_lost");
});
