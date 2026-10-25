// Historical pinned SAL reproduction; this is not candidate acceptance.
import { baselineSalPath } from "../../src/baseline-fixture.js";
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../../src/sal-parser.js";
import { SalRuntime } from "../../src/sal-runtime.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const sal = baselineSalPath;
const model = parseSalFile(sal);
const network12 = model.networks.find(network => network.name === "Network12");
const buttonModel = { ...model, networks: [network12] };
const timer = name => Number(network12.blocks.find(block => block.name === name).parameters[0].timing);

const ready = {
  b_Step_RnD: true,
  b_ResetPB_Lock: false,
  in_False_SI2_CH8: false,
  in_Door_Monitor: true,
  inPLC_RnD_Mode: false,
  inPLC_RnD_Mode_2: false,
  in_HV_C2_FBK: false,
  in_HV_Healthy_FBK: true,
  in_Reset_PB: false,
  in_Relase_Door_PB: false
};

test("V2-BTN01 Network12 actual button timers are 0.5 s / 0.5 s / 1 s", () => {
  assert.equal(timer("FBTon2"), 0.5, "blue single-button qualification");
  assert.equal(timer("FBTon4"), 0.5, "green single-button qualification");
  assert.equal(timer("FBTon1"), 1, "two-button qualification");
});

test("V2-BTN02 blue alone sets door-unlock request after 0.5 s", () => {
  const runtime = new SalRuntime(buttonModel, { scanMs: 10 })
    .setInputs({ ...ready, in_Relase_Door_PB: true })
    .scan() // first observed blue sample age0
    .runFor(490);
  assert.equal(runtime.get("b_Set_Door_Unlock_1"), false);
  runtime.runFor(20); // TON qualifies at 500 ms; downstream AND updates next scan.
  assert.equal(runtime.get("b_Set_Door_Unlock_1"), true);
});

test("V2-BTN03 both buttons produce the upward transition request after 1 s", () => {
  const runtime = new SalRuntime(buttonModel, { scanMs: 10 })
    // Establish connected feedback-wire initial values before timing the hold.
    // It is a neutral component prehistory, not a new release-filter rule.
    .setInputs(ready).runFor(20)
    .setInputs({ ...ready, in_Reset_PB: true, in_Relase_Door_PB: true })
    .scan() // first observed chord sample age0
    .runFor(990);
  assert.equal(runtime.get("b_Set_Transition_3"), false);
  runtime.runFor(10);
  assert.equal(runtime.get("b_Set_Transition_3"), true);
  assert.equal(runtime.get("b_Set_Door_Unlock_1"), false,
    "the two-button gesture must suppress the blue-only unlock branch");
});

test("V2-BTN04 Network12 has no 2 s neutral-release qualification timer", () => {
  const timings = network12.blocks
    .filter(block => block.functionName === "safeTon")
    .flatMap(block => block.parameters.map(parameter => Number(parameter.timing)));
  assert.equal(timings.includes(2), false);
});

test("V2-BTN05 failed two-button attempt degrades to blue unlock in current v2", () => {
  const runtime = new SalRuntime(buttonModel, { scanMs: 10 })
    .setInputs({ ...ready, in_Reset_PB: true, in_Relase_Door_PB: true })
    .scan() // observed initial hold; following durations are edge-relative
    .runFor(300);
  runtime.setInputs({ in_Reset_PB: false }).runFor(210);
  assert.equal(runtime.get("b_Set_Door_Unlock_1"), true,
    "records the current v2 behavior; specification requires this to remain false");
});

test("V2-BTN06 failed two-button attempt degrades to green/down transition in current v2", () => {
  const runtime = new SalRuntime(buttonModel, { scanMs: 10 })
    .setInputs({ ...ready, in_Reset_PB: true, in_Relase_Door_PB: true })
    .scan()
    .runFor(300);
  runtime.setInputs({ in_Relase_Door_PB: false }).runFor(210);
  assert.equal(runtime.get("b_Set_Transition_2"), true,
    "records the current v2 behavior; specification requires this to remain false");
});
