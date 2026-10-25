// Historical pinned SAL reproduction; this is not candidate acceptance.
import { baselineSalPath } from "../src/baseline-fixture.js";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../src/sal-parser.js";
import { runPhaseCase, emergencyEvents } from "../src/emergency-phase-matrix.js";
const model = parseSalFile(baselineSalPath);
const event = name => emergencyEvents.find(e => e[0] === name);

test("V2-PHASE01 NC1 removes EStop OK but does not clear seeded non-Run states", () => {
  for (const phase of ["Step1", "Step_RnD", "Step12", "Step2", "Step4", "Step5", "Step6"]) {
    const row = runPhaseCase(model, phase, event("NC1"), false);
    assert.deepEqual(row.initial.steps, [phase]);
    assert.equal(row.fault100ms.signals.b_EStop_Ok, false);
    assert.deepEqual(row.fault100ms.steps, [phase]);
    assert.equal(row.restored500ms.signals.b_EStop_Ok, false);
  }
});

test("V2-PHASE02 Step2 connector-loss trace raises HV command as does the no-fault control", () => {
  for (const name of ["control", "HVConnector"]) {
    const row = runPhaseCase(model, "Step2", event(name), false);
    assert.equal(row.initial.signals.out_HV_C2, false);
    assert.equal(row.observed.hvRiseDuringFault, true);
    assert.deepEqual(row.fault100ms.steps, ["Step2"]);
  }
});

test("V2-PHASE03 Step12 can raise LV command despite NC1 loss in this scoped trace", () => {
  const row = runPhaseCase(model, "Step12", event("NC1"), false);
  assert.equal(row.observed.lvRiseDuringFault, true);
  assert.equal(row.fault100ms.signals.b_EStop_Ok, false);
  assert.equal(row.fault100ms.signals.out_LV_C1, true);
  assert.equal(row.fault100ms.signals.out_HV_C2, false);
});
