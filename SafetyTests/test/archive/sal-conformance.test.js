import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSalFile, buildDependencyGraph, findPath } from "../../src/sal-parser.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const sal = path.resolve(here, "../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal");
const model = parseSalFile(sal);
const graph = buildDependencyGraph(model);

test("SAL01 v2 SAL parser finds networks, blocks and variables", () => {
  assert.ok(model.networks.length >= 10);
  assert.ok(model.networks.flatMap(n => n.blocks).length > 50);
  assert.ok(model.variables.length > 50);
  assert.ok(model.crc);
});

test("SAL02 power connector inputs have the expected physical alias channels", () => {
  const lv = model.variables.find(v => v.name === "in_LV_Connector_Interlock");
  const hv = model.variables.find(v => v.name === "in_HV_Connector_Interlock");
  assert.equal(lv?.alias?.sdsId, "61");
  assert.equal(lv?.alias?.channelId, "9");
  assert.equal(hv?.alias?.sdsId, "61");
  assert.equal(hv?.alias?.channelId, "11");
});

test("SAL03 external emergency interlock remains a two-channel input", () => {
  const ch1 = model.variables.find(v => v.name === "in_InterLock_NC_1");
  const ch2 = model.variables.find(v => v.name === "in_InterLock_NC_2");
  assert.equal(ch1?.alias?.sdsId, "62");
  assert.equal(ch1?.alias?.channelId, "9");
  assert.equal(ch2?.alias?.sdsId, "62");
  assert.equal(ch2?.alias?.channelId, "11");
});

for (const input of [
  "in_LV_Connector_Interlock",
  "in_HV_Connector_Interlock",
  "in_InterLock_NC_1",
  "in_InterLock_NC_2"
]) {
  test(`SAL04 ${input} reaches STO reset logic for both drives`, () => {
    const toDrive1 = findPath(graph, `var:${input}`, "var:b_Reset_STO_DR1");
    const toDrive2 = findPath(graph, `var:${input}`, "var:b_Reset_STO_DR2");
    assert.ok(toDrive1, `${input} has no dependency path to b_Reset_STO_DR1`);
    assert.ok(toDrive2, `${input} has no dependency path to b_Reset_STO_DR2`);
  });
}

test("SAL05 connector interlocks are exported to PLC status", () => {
  assert.ok(findPath(graph, "var:in_LV_Connector_Interlock", "var:outPLC_LV_Interlock"));
  assert.ok(findPath(graph, "var:in_HV_Connector_Interlock", "var:outPLC_HV_Interlock"));
});
