import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../src/sal-parser.js";
import { SalRuntime } from "../src/sal-runtime.js";

const model = parseSalFile(fileURLToPath(new URL("../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal", import.meta.url)));

test("SAL-SEM01 default execution follows all group block numbers across network boundaries", () => {
  const r = new SalRuntime(model);
  const actual = [];
  r.evaluate = b => actual.push(b.path);
  r.scan();
  const expected = model.networks.flatMap(n => n.blocks)
    .sort((a, b) => a.orderOfExecution - b.orderOfExecution).map(b => b.path);
  assert.deepEqual(actual, expected);
  const legacy = new SalRuntime(model, { executionOrder: "legacy-network" });
  const historical = [];
  legacy.evaluate = b => historical.push(b.path);
  legacy.scan();
  assert.notDeepEqual(historical, actual, "this project interleaves networks in its block numbers");
});

test("SAL-SEM02 real RS holds, sets and resets with Reset dominant", () => {
  const block = model.networks.find(n => n.name === "Network1").blocks.find(b => b.name === "FBRs2");
  const r = new SalRuntime({ ...model, networks: [{ blocks: [block] }] });
  function apply(set, reset, expected) {
    r.values.set(`${block.path}/Set`, set);
    r.values.set(`${block.path}/Reset`, reset);
    r.scan();
    assert.equal(r.get("out_HV_C2"), expected);
  }
  apply(false, false, false);
  apply(true, false, true);
  apply(false, false, true);
  apply(true, true, false);
  apply(false, false, false);
});

test("SAL-SEM03 unconnected Decouple inputs are reported and sensitive to the chosen assumption", () => {
  const n = model.networks.find(n => n.name === "Network4");
  for (const assumed of [false, true]) {
    const r = new SalRuntime({ ...model, networks: [n] }, { unconnectedInput: assumed }).scan();
    assert.equal(r.get("b_Step2_Set"), assumed);
    assert.equal(r.assumedUnconnectedPorts.has("//Network4/FBDecouple1/DecIn7"), true);
  }
});
