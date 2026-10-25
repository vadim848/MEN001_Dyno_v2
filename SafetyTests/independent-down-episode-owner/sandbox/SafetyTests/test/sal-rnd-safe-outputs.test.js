// Historical pinned SAL reproduction; this is not candidate acceptance.
import { baselineSalPath } from "../src/baseline-fixture.js";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../src/sal-parser.js";
import { SalRuntime } from "../src/sal-runtime.js";

const model = parseSalFile(baselineSalPath);
const selected = { ...model, networks: model.networks.filter(n =>
  ["Network1", "Network3", "Network5", "Network12"].includes(n.name)).map(n =>
  n.name === "Network1" ? { ...n, blocks: n.blocks.filter(b => b.functionName !== "safeEstop") } : n) };

function rnd(options) {
  const r = new SalRuntime(selected, options);
  r.setInputs(Object.fromEntries(model.variables.filter(v => !v.sourcePorts.length).map(v => [v.name, false])));
  r.setInputs({ b_EStop_Ok: true, in_LV_C1_FBK: true, in_LV_Healthy_FBK: true,
    in_Door_Monitor: true });
  // Seed an established R&D condition after warming combinational links.
  // E-Stop OK is external here; safeEstop and competing networks are excluded.
  r.runFor(200);
  for (const b of selected.networks.flatMap(n => n.blocks).filter(b => b.functionName === "safeRs")) {
    const value = ["//Network1/FBRs1", "//Network3/FBRs7"].includes(b.path);
    r.memory.set(b.path, { value });
    r.write(b.outputs[0], value);
  }
  r.runFor(100);
  assert.equal(r.get("outPLC_RnD"), true);
  assert.equal(r.get("out_LV_C1"), true);
  assert.equal(r.get("out_HV_C2"), false);
  return r;
}

test("V2-RNDSAFE01 green removes LV and requests discharge before LV OFF feedback", () => {
  const r = rnd();
  r.runFor(650, { in_Reset_PB: true });
  assert.equal(r.get("out_LV_C1"), false);
  assert.equal(r.get("out_LV_Discharge_Request"), true);
  assert.equal(r.get("b_RBN_Bat_Reset_2"), true);
  assert.equal(r.get("b_C3_BetReset_2"), true);
  assert.equal(r.get("outPLC_RnD"), true);
  assert.equal(r.get("b_Step2_Set_2"), false);
  assert.equal(r.get("out_HV_C2"), false);
});

test("V2-RNDSAFE02 legacy network order loses the short state handoff", () => {
  const r = rnd({ executionOrder: "legacy-network" });
  r.runFor(650, { in_Reset_PB: true });
  r.setInputs({ in_LV_C1_FBK: false });
  r.scan();
  assert.equal(r.get("b_Step2_Set_2"), true);
  r.scan();
  assert.equal(r.get("//Network3/FBRs2/Set"), true);
  assert.equal(r.get("//Network3/FBRs2/Reset"), true);
  r.runFor(200);
  assert.equal(r.get("outPLC_RnD"), false);
  for (const name of ["b_Step1", "b_Step2", "b_Step3", "b_Step4", "b_Step5", "b_Step6", "b_Step_RnD", "b_Step12"]) {
    assert.equal(r.get(name), false, name);
  }
  assert.equal(r.get("out_LV_C1"), false);
  assert.equal(r.get("out_HV_C2"), false);
  assert.equal(r.get("out_LV_Discharge_Request"), true);
});

test("V2-RNDSAFE05 global block order accepts Step2 then raises LV/HV outputs", () => {
  const r = rnd();
  r.runFor(650, { in_Reset_PB: true });
  r.runFor(300, { in_LV_C1_FBK: false });
  assert.equal(r.get("outPLC_RnD"), false);
  assert.equal(r.get("out_Step2"), true);
  assert.equal(r.get("out_Step1"), false);
  assert.equal(r.get("out_LV_C1"), true);
  assert.equal(r.get("out_HV_C2"), true);
  assert.equal(r.get("out_LV_Discharge_Request"), true);
});

test("V2-RNDSAFE03 releasing green before LV OFF feedback leaves R&D status active", () => {
  const r = rnd();
  r.runFor(650, { in_Reset_PB: true });
  r.runFor(150, { in_Reset_PB: false });
  r.runFor(200, { in_LV_C1_FBK: false });
  assert.equal(r.get("outPLC_RnD"), true);
  assert.equal(r.get("out_LV_C1"), false);
  assert.equal(r.get("out_HV_C2"), false);
  assert.equal(r.get("out_LV_Discharge_Request"), true);
  assert.equal(r.get("out_Step2"), false);
});

test("V2-RNDSAFE04 Network4ToBeDeleted has no explicitly driven input ports", () => {
  const n = model.networks.find(n => n.name === "Network4");
  assert.equal(n.networkName, "Network4ToBeDeleted");
  const inputPaths = n.blocks.flatMap(b => b.inputs.map(p => p.path));
  for (const b of n.blocks) for (const p of b.inputs) {
    assert.deepEqual(p.sources, []);
    assert.deepEqual(p.globals, []);
  }
  for (const b of model.networks.flatMap(n => n.blocks)) for (const o of b.outputs) {
    assert.equal(o.targets.some(t => inputPaths.includes(t)), false);
  }
  assert.equal(model.variables.some(v => v.targetPorts.some(t => inputPaths.includes(t))), false);
});
