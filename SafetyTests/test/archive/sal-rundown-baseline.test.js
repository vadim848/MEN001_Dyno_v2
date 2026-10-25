// Historical pinned SAL reproduction; this is not candidate acceptance.
import { baselineSalPath } from "../../src/baseline-fixture.js";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../../src/sal-parser.js";
import { SalRuntime } from "../../src/sal-runtime.js";

const model = parseSalFile(baselineSalPath);
const network6 = model.networks.find(n => n.name === "Network6");
// Execute only Network6. Observe internal requests, not physical outputs.
const commands = ["b_Reset_STO_DR1_4", "b_Reset_STO_DR2_4", "b_Set_HV_Discharge_Request_3", "b_Reset_HV_C2_4"];
function ready(extra = {}) {
  return new SalRuntime({ ...model, networks: [network6] }).setInputs({
    b_Step3: true, b_Step_RnD: false, b_ResetPB_Lock: false,
    in_False_SI2_CH8: false, in_Reset_PB: false, in_Relase_Door_PB: false,
    inPLC_RnD_Mode: false, inPLC_RnD_Mode_2: false,
    in_ES_NC_1: true, in_ES_NC_2: true, in_Estop_PLC: false, in_Mentee_EStop: false,
    in_InterLock_NC_1: true, in_InterLock_NC_2: true,
    in_LV_Connector_Interlock: true, in_HV_Connector_Interlock: true,
    // Raw levels accepted by Network6/FBAnd9; electrical polarity is unvalidated.
    in_LV_Healthy_FBK: false, in_HV_Healthy_FBK: false,
    in_HV_C2_FBK: true, in_C3_Manual_Reset: false, in_C3_Manual_Set: false,
    in_RBM_Manual_Reset: false, in_RBM_Manual_Set: false,
    b_RBN_Bat_Reset: false, b_RBN_Bat_Reset_2: false,
    b_C3_BetReset: false, b_C3_BetReset_2: false, out_TransitionStep: false,
    ...extra
  }).runFor(100);
}

test("V2-DOWN01 green stop requests STO reset, discharge and C2 reset together", () => {
  const r = ready();
  r.setInputs({ in_Reset_PB: true });
  let first;
  for (let time = 10; time <= 700; time += 10) {
    r.scan();
    if (commands.some(name => r.get(name))) {
      first = time;
      assert.deepEqual(commands.map(name => r.get(name)), [true, true, true, true]);
      break;
    }
  }
  assert.ok(first >= 500 && first <= 550, `first request at ${first} ms`);
  assert.equal(r.get("b_Step12_Set_2"), false);
});

test("V2-DOWN02 PLC mode 01 bypasses the physical green qualification", () => {
  const r = ready();
  r.runFor(50, { inPLC_RnD_Mode_2: true });
  assert.deepEqual(commands.map(name => r.get(name)), [true, true, true, true]);
  assert.equal(r.get("in_Reset_PB"), false);
});

test("V2-DOWN03 Step12 request waits for C2 OFF but no separate discharge feedback", () => {
  const r = ready();
  r.runFor(1000, { in_Reset_PB: true });
  assert.equal(r.get("b_Step12_Set_2"), false);
  r.runFor(30, { in_HV_C2_FBK: false });
  assert.equal(r.get("b_Step12_Set_2"), true);
  assert.equal(r.get("b_Step4_Set"), false);
});

test("V2-DOWN04 releasing green removes the nonlatched removal requests", () => {
  const r = ready();
  r.runFor(650, { in_Reset_PB: true });
  assert.deepEqual(commands.map(name => r.get(name)), [true, true, true, true]);
  r.runFor(100, { in_Reset_PB: false });
  assert.deepEqual(commands.map(name => r.get(name)), [false, false, false, false]);
  assert.equal(r.get("b_Step12_Set_2"), false);
});
