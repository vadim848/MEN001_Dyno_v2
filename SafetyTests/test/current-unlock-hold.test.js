import { compact,movedPath,expectedOrder } from "./helpers/compact-expectations.js";
import { physicalRndSource } from "../src/physical-rnd-source.js";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseSalFile } from "../src/sal-parser.js";
import { SalRuntime } from "../src/sal-runtime.js";

const file = new URL("../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal", import.meta.url);
const model = parseSalFile(file);
const xml = fs.readFileSync(file, "utf8");
const oldXml = fs.readFileSync(new URL("../fixtures/v2-4bb8703/TwinSafeGroup1.sal", import.meta.url), "utf8");
const old = parseSalFile(new URL("../fixtures/v2-4bb8703/TwinSafeGroup1.sal", import.meta.url));
const gate = model.networks[0].blocks.find(b => b.name === "FBAndUnlockHold");
const latch = "//Network1/FBRs6/RsOut";
const output = "out_Door_Unlock_Solonoeid";
const cover = ["FBOr3", "FBOr4", "FBRs6", "FBAndUnlockHold"];
function runtime(extra = {}) {
  const selection = { Network1: cover, ...extra };
  return new SalRuntime({ ...model, networks: model.networks.filter(n => selection[n.name]).map(n =>
    ({ ...n, blocks: n.blocks.filter(b => selection[n.name].includes(b.name)) })) }, { unconnectedInput: false })
    .setInputs({b_EStop_Ok:true,in_Estop_PLC:false}); // Explicit healthy07 boundary; fault paths tested with actual EStop separately.
}

test("CVR current SAL: sole final writer, normalized single wire, native port IDs and contiguous execution", () => {
  assert.deepEqual(model.variables.find(v => v.name === output).sourcePorts, [gate.outputs[0].path]);
  assert.equal(model.networks.flatMap(n => n.blocks).flatMap(b => b.outputs).filter(p =>
    p.globals.some(g => g.lastKnownPath === `GVL1.${output}`)).length, 0);
  assert.deepEqual(gate.inputs[0].sources, [latch]);
  assert.ok(model.networks[0].blocks.find(b => b.name === "FBRs6").outputs[0].targets.includes(gate.inputs[0].path));
  assert.deepEqual(gate.inputs.map(p => p.varId), ["2", "3", "4", "5", "6", "7", "8", "9"]);
  assert.equal(gate.outputs[0].varId, "20");
  const ids = [...xml.matchAll(/\bId="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(model.networks.flatMap(n => n.blocks).map(b => b.orderOfExecution).sort((a,b) => a-b),
    Array.from({ length: 253 }, (_,i) => i+1));
  assert.equal(gate.orderOfExecution, 253);
  for (const previous of old.networks.flatMap(n => n.blocks)) {
    const current = model.networks.flatMap(n => n.blocks).find(b => b.path === movedPath(previous.path));
    const afterLV=previous.orderOfExecution >= 2 ? previous.orderOfExecution + 2 : 1;
    assert.equal(current.orderOfExecution,expectedOrder(previous.path));
  }
  for (const variable of old.variables) {
    const current = model.variables.find(v => v.name === variable.name);
    assert.deepEqual(current.alias, variable.alias);
    assert.equal(current.id, variable.id);
  }
  const params = m => m.networks.flatMap(n => n.blocks).map(b => [b.path, b.parameters]).filter(([,p]) => p.length);
  const mappedOld=params(old).map(([path,p])=>[movedPath(path),p]).sort();
  assert.deepEqual(params(model).filter(([path])=>!["//RndPhysicalCompact/RELEASE","//RndPhysicalCompact/WINDOW"].includes(path)).sort(),mappedOld);
  assert.equal(xml.match(/<safetyApplication\b[^>]*>/)[0], oldXml.match(/<safetyApplication\b[^>]*>/)[0]);
  // B1 intentionally adds logical consumers through SAL alias usage roles.
  // Preserve descriptors and old consumers; exact allowed fanout is audited in
  // current-native-bindings.test.js rather than forbidding logical connections.
  for(const previous of old.variables) {
    const current=model.variables.find(v=>v.name===previous.name);
    for(const target of previous.targetPorts) {
      if(previous.name==="in_Door_Monitor"&&target==="//Network12/FBAnd16/AndIn1")continue; // deliberate06 energy guard change
      if(["//Network12/FBTon2/TonIn","//Network12/FBTon4/TonIn"].includes(target))continue; // moved TON enables now belong to actual recognizer
      assert.ok(current.targetPorts.includes(target));
    }
    assert.deepEqual(current.sourcePorts, previous.name===output ? [gate.outputs[0].path] : previous.sourcePorts);
  }
});

test("CVR current SAL: eight final gate combinations use the actual parsed block", () => {
  for (const permit of [false,true]) for (const blue of [false,true]) for (const green of [false,true]) {
    const r = new SalRuntime({ ...model, networks: [{ blocks: [gate] }] });
    r.values.set(latch, permit);
    r.setInputs({ in_Relase_Door_PB: blue, in_Reset_PB: green,b_EStop_Ok:true,in_Estop_PLC:false }).scan();
    assert.equal(r.get(output), permit && blue && !green);
  }
});

test("CVR current SAL: reset dominates a concurrent Set and clears stale permission", () => {
  for (const controls of [{ in_Relase_Door_PB:false, in_Reset_PB:false }, { in_Relase_Door_PB:true, in_Reset_PB:true }]) {
    const r = runtime().setInputs({ b_Set_Door_Unlock:true, ...controls });
    r.scan(); assert.equal(r.get(latch), false); assert.equal(r.get(output), false);
    r.setInputs({ b_Set_Door_Unlock:false, in_Relase_Door_PB:true, in_Reset_PB:false }).scan();
    assert.equal(r.get(latch), false); assert.equal(r.get(output), false);
  }
});

test("CVR current SAL: existing Safe producer permits held blue and release clears first scan", () => {
  const r = runtime({ Network2:["FBDecouple3", "FBAnd7", "FBAnd8"] }).setInputs({ b_Step1:true, in_Door_Monitor:true, in_Relase_Door_PB:true });
  r.scan(); assert.equal(r.get(output), true);
  r.setInputs({ in_Relase_Door_PB:false }).scan();
  assert.equal(r.get(output), false); assert.equal(r.get(latch), false);
  // Safe has no blue TON. Full recognizer/rearm remains a separate known gap.
});

test("CVR current SAL: actual R&D TON must expire again after blue interruption", () => {
  const r = physicalRndSource(model,10).r;
  r.runFor(1200,{in_Relase_Door_PB:true}); assert.equal(r.get(output),true);
  r.setInputs({in_Relase_Door_PB:false}).scan();
  assert.equal(r.get(output),false);assert.equal(r.get(latch),false);
  r.runFor(1200,{in_Relase_Door_PB:true});assert.equal(r.get(output),false,"interrupted attempt cannot rearm before complete neutral");
  r.runFor(2100,{in_Relase_Door_PB:false});
  r.setInputs({in_Relase_Door_PB:true}).scan().runFor(490);assert.equal(r.get(output),false);
  r.runFor(30);assert.equal(r.get(output),true,"fresh complete release and new500ms qualification");
  r.setInputs({ in_Reset_PB:true }).scan();
  assert.equal(r.get(output), false); assert.equal(r.get(latch), false);
});

test("CVR current SAL: full selected chain cannot bypass final held-blue/green gate", () => {
  // Actual code throughout, Network4 excluded because its unconnected semantics remain unmodeled.
  for (const fallback of [false,true]) {
    const r = new SalRuntime({ ...model, networks:model.networks.filter(n => n.name !== "Network4") }, { unconnectedInput:fallback });
    r.setInputs(Object.fromEntries(model.variables.filter(v => !v.sourcePorts.length).map(v => [v.name,false])));
    r.setInputs({ in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,
      in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Door_Monitor:true });
    for (const buttons of [[false,false],[true,false],[true,true],[false,true],[false,false]]) {
      r.setInputs({ in_Relase_Door_PB:buttons[0],in_Reset_PB:buttons[1] });
      for (let i=0;i<250;i++) { r.scan(); if (!buttons[0] || buttons[1]) assert.equal(r.get(output),false); }
    }
    assert.equal(r.unsupported.size,0);
  }
});
