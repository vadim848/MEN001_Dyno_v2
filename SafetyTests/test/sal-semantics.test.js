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
    // Explicitly drive the cut wire sources of this isolated RS component.
    for(const source of block.inputs.find(p=>p.name==="Set").sources)r.values.set(source,set);
    for(const source of block.inputs.find(p=>p.name==="Reset").sources)r.values.set(source,reset);
    r.scan();
    assert.equal(r.get("out_HV_C2"), expected);
  }
  apply(false, false, false);
  apply(true, false, true);
  apply(false, false, true);
  apply(true, true, false);
  apply(false, false, false);
});

// E2-R1-stand-2 (S13): the subject is the semantics of unconnected Decouple inputs,
// not Network4 (removed from Network4 by the R1 plan). The block is a clone of a real
// safeDecouple of the source (real port encoding), detached from the source wiring, so
// the test is independent of which networks a source keeps (F1 and R1 alike).
test("SAL-SEM03 unconnected Decouple inputs are reported and sensitive to the chosen assumption", () => {
  const proto = model.networks.flatMap(n => n.blocks).find(b => b.functionName === "safeDecouple");
  assert.ok(proto, "source contains no safeDecouple to clone");
  const b = structuredClone(proto);
  b.path = "//Sem03/Decouple"; b.orderOfExecution = 1;
  for (const p of [...b.inputs, ...b.outputs]) { p.path = `${b.path}/${p.name}`; p.sources = []; p.targets = []; p.globals = []; }
  const port = name => [...b.inputs, ...b.outputs].find(p => p.name === name);
  assert.ok(port("DecIn1") && port("DecIn7") && port("DecOut1") && port("DecOut7"), "cloned safeDecouple lacks DecIn/DecOut 1 and 7");
  port("DecIn1").globals = [{ lastKnownPath: "Sem03.driven" }];
  port("DecOut1").globals = [{ lastKnownPath: "Sem03.out1" }];
  port("DecOut7").globals = [{ lastKnownPath: "Sem03.out7" }];
  for (const assumed of [false, true]) {
    const r = new SalRuntime({ networks: [{ blocks: [b] }], variables: [], bindingMode: "explicit-test-injection" }, { unconnectedInput: assumed })
      .setInputs({ driven: !assumed }).scan();
    assert.equal(r.get("out7"), assumed, "unconnected input takes the explicit assumption");
    assert.equal(r.assumedUnconnectedPorts.has(`${b.path}/DecIn7`), true, "the assumption is reported");
    assert.equal(r.get("out1"), !assumed, "a driven input is not affected by the assumption");
    assert.equal(r.assumedUnconnectedPorts.has(`${b.path}/DecIn1`), false, "a driven input is not reported as assumed");
  }
});
