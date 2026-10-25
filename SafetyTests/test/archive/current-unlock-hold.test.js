import * as V2 from '../helpers/v2-structural.js';
import {createSafeRunFixture} from '../helpers/safe-run-source.js';
import { compact,movedPath,expectedOrder } from "../helpers/compact-expectations.js";
import { physicalRndSource } from "../../src/physical-rnd-source.js";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseSalFile } from "../../src/sal-parser.js";
import { SalRuntime } from "../../src/sal-runtime.js";

const file = V2.salUrl;
const model = parseSalFile(file, V2.parseOptions);
const xml = fs.readFileSync(file, "utf8");
const oldXml = fs.readFileSync(new URL("../../fixtures/v2-4bb8703/TwinSafeGroup1.sal", import.meta.url), "utf8");
const old = parseSalFile(new URL("../../fixtures/v2-4bb8703/TwinSafeGroup1.sal", import.meta.url));
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

test("CVR LV254 sole final writer254, exact composed order manifest, timers and physical aliases", () => {
 // Approved baseline+explicit v2 delta; no source masking.
 V2.final(); V2.orders(); V2.timers(); V2.aliases();


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

test("CVR approved Safe blue500 qualification, original grant conditions, release clears",()=>{
const x=createSafeRunFixture('Safe');x.sample({in_Relase_Door_PB:true});x.advance(499);for(const f of x.frames)for(const k of ['safeBlue','grant','unlock'])assert.equal(f.signals[k],false,'before500 '+k+' at '+f.timeMs);assert.equal(x.get('unlock'),false,'499ms negative');x.advance(1);assert.equal(x.r.get('//RndPhysicalCompact/BLUE/TonOut'),true,'native500 qualification');assert.equal(x.r.get('//RndPhysicalCompact/STATE_BA/RsOut'),true,'native accepted500 blue');assert.equal(x.get('unlock'),false,'And7 already consumed previous BA on500');x.advance(1);assert.equal(x.get('safeBlue'),true,'next actual And7 consumption501');assert.equal(x.get('grant'),true);assert.equal(x.get('unlock'),true,'same501 actual Or4/RS/final chain');x.sample({in_Relase_Door_PB:false});assert.equal(x.get('unlock'),false);assert.equal(x.get('grant'),false);
for(const rawOverrides of [{in_Door_Monitor:false},{in_ES_NC_1:false},{in_ES_NC_2:false},{in_Estop_PLC:true}]){const y=createSafeRunFixture('Safe');y.sample({...rawOverrides,in_Relase_Door_PB:true});y.advance(600);for(const f of y.frames)for(const k of ['grant','unlock'])assert.equal(f.signals[k],false,JSON.stringify(rawOverrides)+' '+k+' at '+f.timeMs);assert.equal(y.get('unlock'),false,JSON.stringify(rawOverrides));}
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
