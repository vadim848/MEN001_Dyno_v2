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
    ({ ...n, blocks: n.blocks.filter(b => selection[n.name].includes(b.name)) })) }, { unconnectedInput: false });
}

test("CVR current SAL: sole final writer, reciprocal wire, native port IDs and contiguous execution", () => {
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
    Array.from({ length: 206 }, (_,i) => i+1));
  for (const variable of old.variables) {
    const current = model.variables.find(v => v.name === variable.name);
    assert.deepEqual(current.alias, variable.alias);
    assert.equal(current.id, variable.id);
  }
  const params = m => m.networks.flatMap(n => n.blocks).map(b => [b.path, b.parameters]).filter(([,p]) => p.length);
  assert.deepEqual(params(model), params(old));
  assert.equal(xml.match(/<safetyApplication\b[^>]*>/)[0], oldXml.match(/<safetyApplication\b[^>]*>/)[0]);
  // Apart from the relocated sole output producer, the entire variable section is unchanged.
  const variableSection = s => s.slice(s.indexOf("<variables>"));
  assert.ok(xml.includes("<variables>"));
  assert.equal(variableSection(xml).replace("//Network1/FBAndUnlockHold/AndOut", "//Network1/FBRs6/RsOut"), variableSection(oldXml));
});

test("CVR current SAL: eight final gate combinations use the actual parsed block", () => {
  for (const permit of [false,true]) for (const blue of [false,true]) for (const green of [false,true]) {
    const r = new SalRuntime({ ...model, networks: [{ blocks: [gate] }] });
    r.values.set(latch, permit);
    r.setInputs({ in_Relase_Door_PB: blue, in_Reset_PB: green }).scan();
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
  const r = runtime({ Network12:["FBAnd1","FBAnd2","FBAnd3","FBTon2","FBAnd11","FBAnd17"] }).setInputs({
    b_Step_RnD:true, in_Door_Monitor:true, in_Relase_Door_PB:true, in_Reset_PB:false,
    inPLC_RnD_Mode:false, inPLC_RnD_Mode_2:false });
  r.runFor(1200); assert.equal(r.get(output), true);
  r.setInputs({ in_Relase_Door_PB:false }).scan();
  assert.equal(r.get(output), false); assert.equal(r.get(latch), false);
  r.runFor(400, { in_Relase_Door_PB:true }); assert.equal(r.get(output), false);
  r.runFor(800); assert.equal(r.get(output), true);
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
