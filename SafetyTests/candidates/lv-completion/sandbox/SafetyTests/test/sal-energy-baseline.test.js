// Historical pinned SAL reproduction; this is not candidate acceptance.
import { baselineSalPath } from "../src/baseline-fixture.js";
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSalFile, buildDependencyGraph, findPath } from "../src/sal-parser.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const sal = baselineSalPath;
const model = parseSalFile(sal);
const graph = buildDependencyGraph(model);
const network = name => model.networks.find(item => item.name === name);
const block = (networkName, blockName) => network(networkName).blocks.find(item => item.name === blockName);
const timing = (networkName, blockName) => Number(block(networkName, blockName).parameters.find(p => p.timing).timing);

test("V2-ENERGY01 Step4 starts LV discharge and a 2 s common gate", () => {
  assert.ok(findPath(graph, "var:b_Step4", "var:b_Set_LV_Discharge_Request"));
  assert.equal(timing("Network7", "FBTon1"), 2);
});

test("V2-ENERGY02 both HV Healthy branches are gated by the same 2 s TON", () => {
  const output = block("Network7", "FBTon1").outputs.find(port => port.name === "TonOut");
  assert.ok(output.targets.includes("//Network7/FBAnd2/AndIn3"));
  assert.ok(output.targets.includes("//Network7/FBAnd3/AndIn3"));
});

test("V2-ENERGY03 retained-Healthy STO path adds 5 s after the 2 s gate", () => {
  assert.equal(timing("Network7", "FBTon2"), 5);
  assert.equal(timing("Network7", "FBTon3"), 5);
});

test("V2-ENERGY04 Step5 commands HV discharge before the timed C2 reset", () => {
  assert.ok(findPath(graph, "var:b_Step5", "var:b_Set_HV_Discharge_Request"));
  assert.ok(findPath(graph, "var:b_Step5", "var:b_Reset_HV_C2_2"));
  assert.equal(timing("Network8", "FBTon1"), 1);
  assert.equal(timing("Network8", "FBTon2"), 1);
});

test("V2-ENERGY05 no distinct safe-voltage or discharge-complete input exists", () => {
  const normalized = model.variables.map(variable => variable.name.toLowerCase());
  assert.equal(normalized.some(name => /hv.*safe|safe.*hv|discharge.*complete/.test(name)), false);
});

test("V2-ENERGY06 SS1 outputs are controlled by Step2 and Step3", () => {
  assert.ok(findPath(graph, "var:out_Step2", "var:out_SS1_DR1"));
  assert.ok(findPath(graph, "var:out_Step2", "var:out_SS1_DR2"));
  assert.ok(findPath(graph, "var:out_Step3", "var:out_SS1_DR1"));
  assert.ok(findPath(graph, "var:out_Step3", "var:out_SS1_DR2"));
});
