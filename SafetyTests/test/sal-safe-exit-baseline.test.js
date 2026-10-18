// Historical pinned SAL reproduction; this is not candidate acceptance.
import { baselineSalPath } from "../src/baseline-fixture.js";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../src/sal-parser.js";
import { SalRuntime } from "../src/sal-runtime.js";

const model = parseSalFile(baselineSalPath);
function runtime(networks, extra = {}) {
  const r = new SalRuntime({ ...model, networks: model.networks.filter(n => networks.includes(n.name)) });
  r.setInputs(Object.fromEntries(model.variables.filter(v => !v.sourcePorts.length).map(v => [v.name, false])));
  r.setInputs({ in_Safety_Run: false, b_EStop_Ok: false, ...extra });
  r.runFor(100);
  // Establish an idle latch precondition after combinational warmup. This
  // adapter's uninitialized links are not a validated power-up simulation.
  for (const n of r.model.networks.filter(n => n.name === "Network3")) {
    for (const b of n.blocks.filter(b => b.functionName === "safeRs")) {
      r.memory.set(b.path, { value: false });
      r.write(b.outputs[0], false);
    }
  }
  return r.runFor(100);
}

test("V2-EXIT01 Step2 Safe request requires raw constant input TRUE and EStop OK FALSE", () => {
  for (const constant of [false, true]) {
    for (const estopOk of [false, true]) {
      const r = runtime(["Network5"], { b_Step2: true, in_False_SI2_CH8: constant, b_EStop_Ok: estopOk });
      assert.equal(r.get("b_Step1_Set_3"), constant && !estopOk);
      assert.equal(r.get("b_Set_LV_C1"), !constant && estopOk);
      assert.equal(r.get("b_Set_HV_C2"), !constant && estopOk);
    }
  }
});

test("V2-EXIT02 Step6 stays latched with raw constant FALSE and exits when TRUE", () => {
  const r = runtime(["Network3", "Network9"]);
  r.runFor(50, { b_Step6_Set: true });
  r.runFor(1000, { b_Step6_Set: false });
  assert.equal(r.get("b_Step6"), true);
  assert.equal(r.get("b_Step1_Set_2"), false);
  assert.equal(r.get("out_Step1"), false);
  r.runFor(100, { in_False_SI2_CH8: true });
  assert.equal(r.get("b_Step1_Set_2"), false, "request clears after Step6 exits");
  assert.equal(r.get("b_Step6"), false);
  assert.equal(r.get("out_Step1"), true);
});

test("V2-EXIT03 R&D exit request enters Step2 and raises LV/HV set requests with EStop OK", () => {
  const r = runtime(["Network3", "Network5"], { b_EStop_Ok: true });
  r.runFor(50, { b_Step_RnD_Set: true });
  r.runFor(50, { b_Step_RnD_Set: false, b_Step2_Set_2: true });
  r.runFor(1000, { b_Step2_Set_2: false });
  assert.equal(r.get("b_Step_RnD"), false);
  assert.equal(r.get("b_Step2"), true);
  assert.equal(r.get("b_Set_LV_C1"), true);
  assert.equal(r.get("b_Set_HV_C2"), true);
  assert.equal(r.get("b_Step1_Set_3"), false);
  assert.equal(r.get("out_Step1"), false);
});

test("V2-EXIT04 Step2 remains latched on EStop OK loss with raw constant FALSE", () => {
  const r = runtime(["Network3", "Network5"], { b_EStop_Ok: true });
  r.runFor(50, { b_Step2_Set_2: true });
  r.runFor(1000, { b_Step2_Set_2: false, b_EStop_Ok: false });
  assert.equal(r.get("b_Step2"), true);
  assert.equal(r.get("b_Set_HV_C2"), false);
  assert.equal(r.get("b_Step1_Set_3"), false);
  assert.equal(r.get("out_Step1"), false);
});

test("V2-EXIT05 supposed constant is a physical alias, not an XML Boolean constant", () => {
  const v = model.variables.find(v => v.name === "in_False_SI2_CH8");
  assert.equal(v.alias.sdsId, "62");
  assert.equal(v.alias.channelId, "15");
  assert.deepEqual(v.sourcePorts, []);
});
