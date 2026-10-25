import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../src/sal-parser.js";
import { SalRuntime } from "../src/sal-runtime.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const sal = path.resolve(here, "../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal");
const model = parseSalFile(sal);
const connectorModel = {
  ...model,
  networks: model.networks
    .filter(network => network.name === "Network2")
    .map(network => ({
      ...network,
      blocks: network.blocks.filter(block => ["FBAnd1", "FBTon1"].includes(block.name))
    }))
};
function runtimeAtConnectorBoundary() {
  const runtime = new SalRuntime(connectorModel);
  // This component deliberately cuts the Step1 Decouple producer. Establish
  // its output explicitly instead of relying on unconnectedInput=TRUE.
  runtime.values.set("//Network2/FBDecouple3/DecOut1",true);
  runtime.values.set("//Network2/FBAnd6/AndOut",true);
  runtime.values.set("//Network2/FBAnd5/AndOut",true);
  return runtime;
}

test("SAL-RUN01 runtime supports every function block present in v2", () => {
  // Whole-model capability scan only: inputs are deliberately not established, so
  // record mode is explicit and the registry must expose the assumed values.
  const runtime = new SalRuntime(model, { undefinedInputs: "record" }).scan();
  assert.deepEqual([...runtime.unsupported], []);
  assert.ok(runtime.undefinedInputReads.has("var:in_ES_NC_1"), "unset physical input is registered, not silent");
  assert.ok(runtime.undefinedInputReads.has("//Network4/FBDecouple1/DecIn7"), "unconnected Network4 input is registered");
});

test("SAL-RUN04 default strict mode rejects an unset external input instead of reading FALSE", () => {
  assert.throws(() => new SalRuntime(model).scan(), /Undefined input/);
});

test("SAL-RUN02 Network2 connector qualification drops immediately", () => {
  const runtime = runtimeAtConnectorBoundary();
  runtime.setInputs({
    in_ES_NC_1: true,
    in_ES_NC_2: true,
    in_Mentee_EStop: true,
    in_Estop_PLC: true,
    in_Reset_PB: true,
    in_LV_C1_FBK: true,
    in_HV_C2_FBK: true,
    in_LV_Connector_Interlock: true,
    in_HV_Connector_Interlock: true,
    in_InterLock_NC_1: true,
    in_InterLock_NC_2: true
  }).runFor(120);
  assert.equal(runtime.get("//Network2/FBTon1/TonOut"), true);

  runtime.setInputs({ in_HV_Connector_Interlock: false }).scan();
  assert.equal(runtime.get("//Network2/FBAnd1/AndOut"), false);
  assert.equal(runtime.get("//Network2/FBTon1/TonOut"), false);
});

test("SAL-RUN03 connector recovery requires the configured 100 ms TON", () => {
  const healthy = {
    in_ES_NC_1: true,
    in_ES_NC_2: true,
    in_Mentee_EStop: true,
    in_Estop_PLC: true,
    in_Reset_PB: true,
    in_LV_C1_FBK: true,
    in_HV_C2_FBK: true,
    in_LV_Connector_Interlock: true,
    in_HV_Connector_Interlock: true,
    in_InterLock_NC_1: true,
    in_InterLock_NC_2: true
  };
  const runtime = runtimeAtConnectorBoundary().setInputs({ ...healthy, in_HV_Connector_Interlock: false }).scan();
  runtime.setInputs(healthy).scan().runFor(90); // observed recovery edge +90ms
  assert.equal(runtime.get("//Network2/FBTon1/TonOut"), false);
  runtime.runFor(10);
  assert.equal(runtime.get("//Network2/FBTon1/TonOut"), true);
});
