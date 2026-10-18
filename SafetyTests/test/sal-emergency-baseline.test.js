import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSalFile, buildDependencyGraph, findPath } from "../src/sal-parser.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Sal = path.resolve(here, "../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal");
const originalSal = path.resolve(here, "../../../MEN001_Dyno/MEN001_Dyno/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal");
const model = parseSalFile(v2Sal);
const original = parseSalFile(originalSal);
const graph = buildDependencyGraph(model);
const estop = source => source.networks.flatMap(network => network.blocks).find(block => block.functionName === "safeEstop");
const variableAt = (source, portPath) => source.variables.find(variable => variable.targetPorts.includes(portPath))?.name;

test("V2-EMG01 active E-Stop block input assignments match the original stable SAL", () => {
  const signature = source => estop(source).inputs.map(port => ({
    name: port.name,
    channelInterface: port.channelInterface,
    variable: variableAt(source, port.path)
  }));
  assert.deepEqual(signature(model), signature(original));
});

test("V2-EMG02 main E-Stop channel 1 is active and reaches b_EStop_Ok", () => {
  const port = estop(model).inputs.find(input => variableAt(model, input.path) === "in_ES_NC_1");
  assert.equal(port.channelInterface, "Single-Channel Both Activated");
  assert.ok(findPath(graph, "var:in_ES_NC_1", "var:b_EStop_Ok"));
});

test("V2-EMG03 ES_NC_2 is assigned to a deactivated E-Stop function input", () => {
  const port = estop(model).inputs.find(input => variableAt(model, input.path) === "in_ES_NC_2");
  assert.equal(port.channelInterface, "Both Deactivated");
  assert.equal(findPath(graph, "var:in_ES_NC_2", "var:b_EStop_Ok"), null);
});

test("V2-EMG04 Mentee E-Stop is assigned to a deactivated E-Stop function input", () => {
  const port = estop(model).inputs.find(input => variableAt(model, input.path) === "in_Mentee_EStop");
  assert.equal(port.channelInterface, "Both Deactivated");
  assert.equal(findPath(graph, "var:in_Mentee_EStop", "var:b_EStop_Ok"), null);
});

test("V2-EMG05 PLC E-Stop reaches the active EStopIn3 path", () => {
  assert.ok(findPath(graph, "var:in_Estop_PLC", "//Network1/FBEstop1/EStopIn3"));
  assert.ok(findPath(graph, "var:in_Estop_PLC", "var:b_EStop_Ok"));
});

for (const input of [
  "in_InterLock_NC_1",
  "in_InterLock_NC_2",
  "in_LV_Connector_Interlock",
  "in_HV_Connector_Interlock"
]) {
  test(`V2-EMG06 ${input} has active paths to both STO reset chains`, () => {
    assert.ok(findPath(graph, `var:${input}`, "var:b_Reset_STO_DR1"));
    assert.ok(findPath(graph, `var:${input}`, "var:b_Reset_STO_DR2"));
  });
}
