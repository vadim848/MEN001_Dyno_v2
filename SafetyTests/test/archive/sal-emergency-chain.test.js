// Historical pinned SAL reproduction; this is not candidate acceptance.
import { baselineSalPath } from "../../src/baseline-fixture.js";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../../src/sal-parser.js";
import { SalRuntime } from "../../src/sal-runtime.js";

const model = parseSalFile(baselineSalPath);
// Network4's unconnected used channels are unresolved. No other network is
// removed; E-Stop executes with the documented partial no-EDM assumption.
const selected = { ...model, networks: model.networks.filter(n => n.name !== "Network4") };
function armed(unconnectedInput = true) {
  const r = new SalRuntime(selected, { unconnectedInput });
  r.setInputs(Object.fromEntries(model.variables.filter(v => !v.sourcePorts.length).map(v => [v.name, false])));
  r.setInputs({ in_ES_NC_1: true, in_ES_NC_2: true,
    in_InterLock_NC_1: true, in_InterLock_NC_2: true,
    in_LV_Connector_Interlock: true, in_HV_Connector_Interlock: true,
    in_LV_C1_FBK: true, in_HV_C2_FBK: true, in_Door_Monitor: true });
  r.runFor(200);
  // This is an established armed precondition, not startup reachability.
  for (const b of selected.networks.flatMap(n => n.blocks).filter(b => b.functionName === "safeRs")) {
    const value = ["//Network1/FBRs1", "//Network1/FBRs2", "//Network1/FBRs3", "//Network1/FBRs4", "//Network3/FBRs3"].includes(b.path);
    r.memory.set(b.path, { value });
    r.write(b.outputs[0], value);
  }
  const estop = selected.networks[0].blocks.find(b => b.functionName === "safeEstop");
  r.memory.set(estop.path, { enabled: true, restartArmed: false, delayed: true, offElapsedMs: 0 });
  r.write(estop.outputs.find(p => p.name === "EStopOut"), true);
  r.runFor(100);
  assert.equal(r.get("b_Step3"), true);
  assert.equal(r.get("out_HV_C2"), true);
  return r;
}

test("V2-CHAIN01 NC1 loss removes EStop OK and enters Step4 under both constant assumptions", () => {
  for (const assumed of [false, true]) {
    const r = armed(assumed);
    r.runFor(10, { in_ES_NC_1: false });
    assert.equal(r.get("b_EStop_Ok"), false);
    r.runFor(90);
    assert.equal(r.get("b_Step3"), false);
    assert.equal(r.get("b_Step4"), true);
    assert.equal(r.get("out_Safety_Armed"), false);
    assert.equal(r.get("out_SS1_DR1"), false);
    assert.equal(r.get("out_SS1_DR2"), false);
    assert.equal(r.get("out_HV_C2"), true);
    assert.equal(r.get("STO_DR1"), true, "initial STO bit persists during the early stop phase");
    assert.equal(r.get("STO_DR2"), true);
    assert.equal(r.get("out_Door_Unlock_Solonoeid"), false);
  }
});

test("V2-CHAIN02 physical restoration does not restore Run or EStop OK", () => {
  const r = armed();
  r.runFor(100, { in_ES_NC_1: false });
  r.runFor(500, { in_ES_NC_1: true });
  assert.equal(r.get("b_EStop_Ok"), false);
  assert.equal(r.get("b_Step3"), false);
  assert.equal(r.get("b_Step4"), true);
  assert.equal(r.get("out_Safety_Armed"), false);
});

test("V2-CHAIN03 PLC emergency traverses the E-Stop block and starts removal", () => {
  const r = armed();
  r.runFor(100, { in_Estop_PLC: true });
  assert.equal(r.get("b_EStop_Ok"), false);
  assert.equal(r.get("b_Step3"), false);
  assert.equal(r.get("b_Step4"), true);
});

test("V2-CHAIN04 emergency sequence reaches discharge and Step6 only after feedback", () => {
  const r = armed();
  r.runFor(8000, { in_ES_NC_1: false });
  assert.equal(r.get("STO_DR1"), false);
  assert.equal(r.get("STO_DR2"), false);
  assert.equal(r.get("b_Step4"), true, "STO feedback has not yet been supplied");
  r.runFor(200, { in_STO_DR1_FBK: true, in_STO_DR2_FBK: true });
  assert.equal(r.get("b_Step5"), true);
  assert.equal(r.get("out_HV_Discharge_Request"), true);
  assert.equal(r.get("out_HV_C2"), true);
  r.runFor(2200);
  assert.equal(r.get("out_HV_C2"), false);
  assert.equal(r.get("b_Step5"), true, "C2 OFF feedback has not yet been supplied");
  r.runFor(200, { in_HV_C2_FBK: false });
  assert.equal(r.get("b_Step6"), true);
  assert.equal(r.get("out_Step1"), false);
  assert.equal(r.get("out_Door_Unlock_Solonoeid"), false);
});

for (const [id, input, failed, restored] of [
  ["05", "in_ES_NC_2", false, true],
  ["06", "in_Mentee_EStop", true, false],
  ["07", "in_LV_Connector_Interlock", false, true],
  ["08", "in_HV_Connector_Interlock", false, true],
  ["09", "in_InterLock_NC_1", false, true],
  ["10", "in_InterLock_NC_2", false, true]
]) {
  test(`V2-CHAIN${id} ${input} starts Step4; NC2/Mentee also drop effective main EStop`, () => {
    for (const assumed of [false, true]) {
      const r = armed(assumed);
      r.runFor(100, { [input]: failed });
      const effectiveMainInput=["in_ES_NC_2","in_Mentee_EStop"].includes(input);
      assert.equal(r.get("b_EStop_Ok"),!effectiveMainInput,"SDK masterBoth activates NC2/Mentee; connector/external inputs retain their other chain");
      assert.equal(r.get("b_Step3"), false);
      assert.equal(r.get("b_Step4"), true);
      assert.equal(r.get("out_Safety_Armed"), false);
      assert.equal(r.get("out_SS1_DR1"), false);
      assert.equal(r.get("out_SS1_DR2"), false);
      assert.equal(r.get("out_Door_Unlock_Solonoeid"), false);
      r.runFor(500, { [input]: restored });
      assert.equal(r.get("b_Step3"), false);
      assert.equal(r.get("b_Step4"), true, "restoration must not erase the established stop step");
    }
  });
}

test("V2-CHAIN11 raw HV Healthy TRUE selects STO removal only after common 2 s gate", () => {
  const r = armed();
  r.runFor(100, { in_HV_Healthy_FBK: true });
  assert.equal(r.get("b_EStop_Ok"), true);
  assert.equal(r.get("b_Step4"), true);
  assert.equal(r.get("STO_DR1"), true);
  assert.equal(r.get("STO_DR2"), true);
  r.runFor(1800);
  assert.equal(r.get("STO_DR1"), true);
  assert.equal(r.get("STO_DR2"), true);
  r.runFor(400);
  assert.equal(r.get("STO_DR1"), false);
  assert.equal(r.get("STO_DR2"), false);
});

test("V2-CHAIN12 raw Healthy recovery before gate expiry changes the selected delay branch", () => {
  const r = armed();
  r.runFor(100, { in_HV_Healthy_FBK: true });
  r.runFor(2200, { in_HV_Healthy_FBK: false });
  assert.equal(r.get("b_Step4"), true);
  assert.equal(r.get("STO_DR1"), true, "unlike held-TRUE branch at the same 2.3 s checkpoint");
  assert.equal(r.get("STO_DR2"), true);
  r.runFor(5500);
  assert.equal(r.get("STO_DR1"), false);
  assert.equal(r.get("STO_DR2"), false);
  assert.equal(r.get("b_Step3"), false);
});
