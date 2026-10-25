// Historical pinned SAL reproduction; this is not candidate acceptance.
import { baselineSalPath } from "../../src/baseline-fixture.js";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../../src/sal-parser.js";
import { SalRuntime } from "../../src/sal-runtime.js";

const model = parseSalFile(baselineSalPath);
const energyBlocks = ["FBRs1", "FBRs2", "FBRs3", "FBRs4", "FBOr5", "FBOr6", "FBRs7",
  "FBOr7", "FBOr8", "FBOr9", "FBOr10", "FBOr11", "FBOr16", "FBOr17", "FBOr18",
  "FBOr12", "FBOr13", "FBAnd2", "FBAnd3", "FBAnd4", "FBAnd5", "FBAnd6", "FBAnd7", "FBAnd8", "FBTon1",
  "FBAnd9", "FBAnd10", "FBAnd11", "FBAnd12"];
const selected = { ...model, networks: model.networks.filter(n =>
  ["Network1", "Network3", "Network6", "Network11"].includes(n.name)).map(n =>
  n.name === "Network1" ? { ...n, blocks: n.blocks.filter(b => energyBlocks.includes(b.name)) } : n) };

function armed() {
  const network6 = model.networks.find(n => n.name === "Network6");
  const r = new SalRuntime({ ...model, networks: [network6] });
  r.setInputs(Object.fromEntries(model.variables.filter(v => !v.sourcePorts.length).map(v => [v.name, false])));
  r.setInputs({ b_Step3: true, in_ES_NC_1: true, in_ES_NC_2: true,
    in_InterLock_NC_1: true, in_InterLock_NC_2: true,
    in_LV_Connector_Interlock: true, in_HV_Connector_Interlock: true,
    in_HV_C2_FBK: true, in_LV_C1_FBK: true });
  // Warm the isolated gate before attaching state latches: this is an assumed
  // established armed condition, not a power-up or complete-cycle simulation.
  r.runFor(100);
  r.model = selected;
  r.runFor(100);
  for (const blockPath of ["//Network1/FBRs1", "//Network1/FBRs2", "//Network1/FBRs3", "//Network1/FBRs4", "//Network3/FBRs3"]) {
    const b = selected.networks.flatMap(n => n.blocks).find(b => b.path === blockPath);
    r.memory.set(b.path, { value: true });
    r.write(b.outputs[0], true);
  }
  r.runFor(100);
  assert.equal(r.get("out_HV_C2"), true);
  assert.equal(r.get("STO_DR1"), true);
  assert.equal(r.get("STO_DR2"), true);
  assert.equal(r.get("out_SS1_DR1"), true);
  return r;
}

test("V2-OUT01 green removal drops C2/STO while SS1 output remains at armed level", () => {
  const r = armed();
  r.setInputs({ in_Reset_PB: true });
  let dischargeAt, c2OffAt;
  for (let time = 10; time <= 650; time += 10) {
    r.scan();
    if (r.get("out_HV_Discharge_Request")) dischargeAt ??= time;
    if (!r.get("out_HV_C2")) c2OffAt ??= time;
    assert.equal(r.get("out_SS1_DR1"), true);
    assert.equal(r.get("out_SS1_DR2"), true);
  }
  assert.ok(dischargeAt >= 500);
  assert.ok(c2OffAt >= dischargeAt && c2OffAt - dischargeAt <= 20,
    `adapter trace: discharge=${dischargeAt} ms, C2 OFF=${c2OffAt} ms`);
  assert.equal(r.get("out_HV_C2"), false);
  assert.equal(r.get("out_HV_Discharge_Request"), true);
  assert.equal(r.get("STO_DR1"), false);
  assert.equal(r.get("STO_DR2"), false);
  assert.equal(r.get("out_SS1_DR1"), true);
  assert.equal(r.get("out_SS1_DR2"), true);
  assert.equal(r.get("b_Step3"), true, "C2 feedback still ON prevents Step12");
});

test("V2-OUT04 PLC mode 01 changes SS1 and removes energy without physical green", () => {
  const r = armed();
  r.runFor(100, { inPLC_RnD_Mode_2: true });
  assert.equal(r.get("in_Reset_PB"), false);
  assert.equal(r.get("out_SS1_DR1"), false);
  assert.equal(r.get("out_SS1_DR2"), false);
  assert.equal(r.get("STO_DR1"), false);
  assert.equal(r.get("STO_DR2"), false);
  assert.equal(r.get("out_HV_C2"), false);
  assert.equal(r.get("out_HV_Discharge_Request"), true);
});

test("V2-OUT02 green release retains output removal but can strand Step3", () => {
  const r = armed();
  r.runFor(650, { in_Reset_PB: true });
  r.runFor(300, { in_Reset_PB: false });
  r.runFor(300, { in_HV_C2_FBK: false });
  assert.equal(r.get("out_HV_C2"), false);
  assert.equal(r.get("out_HV_Discharge_Request"), true);
  assert.equal(r.get("STO_DR1"), false);
  assert.equal(r.get("STO_DR2"), false);
  assert.equal(r.get("b_Step3"), true);
  assert.equal(r.get("b_Step12"), false);
  assert.equal(r.get("out_Safety_Armed"), true);
});

test("V2-OUT03 held green and C2 OFF reach Step12 then R&D on LV qualification", () => {
  const r = armed();
  r.runFor(850, { in_Reset_PB: true });
  r.runFor(100, { in_HV_C2_FBK: false });
  assert.equal(r.get("b_Step3"), false);
  assert.equal(r.get("b_Step12"), true);
  assert.equal(r.get("out_SS1_DR1"), false);
  assert.equal(r.get("out_SS1_DR2"), false);
  r.runFor(200, { in_LV_Healthy_FBK: true });
  assert.equal(r.get("b_Step_RnD"), true);
  assert.equal(r.get("outPLC_RnD"), true);
  assert.equal(r.get("b_Step12"), false);
  assert.equal(r.get("out_HV_C2"), false);
  assert.equal(r.get("out_HV_Discharge_Request"), true);
});
