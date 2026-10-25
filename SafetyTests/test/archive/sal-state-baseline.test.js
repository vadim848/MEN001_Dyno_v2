// Historical pinned SAL reproduction; this is not candidate acceptance.
import { baselineSalPath } from "../../src/baseline-fixture.js";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../../src/sal-parser.js";
import { SalRuntime } from "../../src/sal-runtime.js";

const model = parseSalFile(baselineSalPath);
const stateNetwork = model.networks.find(n => n.name === "Network3");
const states = ["b_Step1", "b_Step2", "b_Step3", "b_Step4", "b_Step5", "b_Step6", "b_Step_RnD", "b_Step12"];

// Isolate latch ownership. Commands below are internal set requests, not
// physical inputs: this does not validate their upstream interlocks or timing.
function harness() {
  const runtime = new SalRuntime({ ...model, networks: [stateNetwork] });
  runtime.setInputs({ in_Safety_Run: false, b_EStop_Ok: false, in_False_SI2_CH8: false });
  return {
    runtime,
    pulse(command, expected) {
      runtime.runFor(50, { [command]: true });
      runtime.runFor(50, { [command]: false });
      assert.deepEqual(states.filter(name => runtime.get(name)), [expected]);
      const index = states.indexOf(expected);
      const output = ["out_Step1", "out_Step2", "out_Step3", "out_Step4", "out_Step5", "out_Step6", "outPLC_RnD", "out_Step12"][index];
      assert.equal(runtime.get(output), true);
      assert.equal(runtime.get("out_Safety_Armed"), expected === "b_Step3");
    }
  };
}

test("V2-STATE01 Network3 Safe -> Step12 -> R&D -> armed ownership", () => {
  const h = harness();
  h.pulse("b_Step1_Set", "b_Step1");
  h.pulse("b_Step12_Set", "b_Step12");
  h.pulse("b_Step_RnD_Set", "b_Step_RnD");
  h.pulse("b_Step3_Set_2", "b_Step3");
});

test("V2-STATE02 Network3 armed -> Step12 -> R&D uses the same Step12 latch", () => {
  const h = harness();
  h.pulse("b_Step3_Set_2", "b_Step3");
  h.pulse("b_Step12_Set_2", "b_Step12");
  h.pulse("b_Step_RnD_Set", "b_Step_RnD");
});

test("V2-STATE03 Network3 R&D -> Step2 -> Safe ownership", () => {
  const h = harness();
  h.pulse("b_Step_RnD_Set", "b_Step_RnD");
  h.pulse("b_Step2_Set_2", "b_Step2");
  h.pulse("b_Step1_Set_3", "b_Step1");
});

test("V2-STATE04 Network3 armed -> Step4 -> Step5 -> Step6 -> Safe ownership", () => {
  const h = harness();
  h.pulse("b_Step3_Set_3", "b_Step3");
  h.pulse("b_Step4_Set", "b_Step4");
  h.pulse("b_Step5_Set", "b_Step5");
  h.pulse("b_Step6_Set", "b_Step6");
  h.pulse("b_Step1_Set_2", "b_Step1");
});
