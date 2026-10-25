import {createSafeRunFixture} from './helpers/safe-run-source.js';
import { physicalRndSource } from "../src/physical-rnd-source.js";
import test from "node:test";
import assert from "node:assert/strict";
import { parseSalFile } from "../src/sal-parser.js";
import { SalRuntime } from "../src/sal-runtime.js";
const model=parseSalFile(new URL("../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal",import.meta.url));
const all=model.networks.flatMap(n=>n.blocks),get=p=>all.find(b=>b.path===p),gate=get("//Network1/FBAndUnlockHold");
const final="out_Door_Unlock_Solonoeid",latch="//Network1/FBRs6/RsOut";
function prepared(mode) {
if(mode==='Safe'){const x=createSafeRunFixture('Safe');x.sample({in_Relase_Door_PB:true});x.advance(600);assert.equal(x.get('unlock'),true,'audited actual closure healthy positive');return x.r;}

  if(mode==="R&D"){const x=physicalRndSource(model,1);x.sample({in_Relase_Door_PB:true});x.advance(600);assert.equal(x.get("unlock"),true,"actual integrated R&D grant positive");return x.r;}
  const common=["FBAnd1","FBEstop1","FBOr3","FBOr4","FBRs6","FBAndUnlockHold"].map(n=>get(`//Network1/${n}`));
  const grant=mode==="Safe"?["FBDecouple3","FBAnd7","FBAnd8"].map(n=>get(`//Network2/${n}`)):
    ["FBAnd1","FBAnd2","FBAnd3","FBTon2","FBAnd11","FBAnd17"].map(n=>get(`//Network12/${n}`));
  const r=new SalRuntime({...model,networks:[{blocks:[...common,...grant]}]},{scanMs:1,unconnectedInput:false});
  r.setInputs({b_Step1:mode==="Safe",b_Step_RnD:mode==="R&D",in_ES_NC_1:true,in_ES_NC_2:true,in_Mentee_EStop:false,in_Estop_PLC:false,
    in_False_SI2_CH8:false,in_Door_Monitor:true,in_Reset_PB:false,in_Relase_Door_PB:false});
  r.runFor(10);r.setInputs({in_Reset_PB:true}).scan();r.setInputs({in_Reset_PB:false}).scan();
  assert.equal(r.get("b_EStop_Ok"),true,"actual main EStop manually prepared");
  r.setInputs({in_Relase_Door_PB:true}).scan().runFor(600);
  assert.equal(r.get(final),true,"actual producer + grant latch + sole output healthy positive");
  assert.equal(r.get("//Network1/FBAnd1/AndOut"),true,"PLC producer starts healthy before first fault scan");
  return r;
}
for(const mode of ["Safe","R&D"]) {
  test(`UNLOCK07 ${mode}: healthy actual grant producer remains available`,()=>{assert.equal(prepared(mode).get(final),true);});
  for(const event of ["NC1-held","PLC-held","PLC-single-sample"])test(`UNLOCK07 ${mode}/${event}: fault then raw recovery without Restart`,()=>{
    const r=prepared(mode),input=event==="NC1-held"?"in_ES_NC_1":"in_Estop_PLC",failed=input==="in_Estop_PLC";
    const observations=[];r.setInputs({[input]:failed}).scan();
    observations.push({phase:"first fault sample",unlock:r.get(final),estop:r.get("b_EStop_Ok")});
    if(event!=="PLC-single-sample")r.runFor(10);
    r.setInputs({[input]:!failed}).scan();observations.push({phase:"first restored raw sample",unlock:r.get(final),estop:r.get("b_EStop_Ok")});
    r.runFor(10);observations.push({phase:"restored without manual Restart",unlock:r.get(final),estop:r.get("b_EStop_Ok")});
    assert.deepEqual(observations.map(o=>o.estop),[event==="NC1-held"?false:true,false,false],"NC1 immediate / PLC stale producer ordering must actually be exercised");
    assert.deepEqual(observations.map(o=>o.unlock),[false,false,false],JSON.stringify(observations));
  });
}

for(const blue of [false,true])for(const green of [false,true])for(const enabled of [false,true])for(const plc of [false,true])
  test(`UNLOCK07 component blue${blue}/green${green}/EStop${enabled}/PLC${plc}`,()=>{
    const r=new SalRuntime({...model,networks:[{blocks:[gate]}]},{unconnectedInput:false});r.values.set(latch,true);
    r.setInputs({in_Relase_Door_PB:blue,in_Reset_PB:green,b_EStop_Ok:enabled,in_Estop_PLC:plc}).scan();
    assert.equal(r.get(final),blue&&!green&&enabled&&!plc);
  });

test("UNLOCK07 final component does not acquire an energy connector/InterLock access ban",()=>{
  const r=new SalRuntime({...model,networks:[{blocks:[gate]}]},{unconnectedInput:false});r.values.set(latch,true);
  r.setInputs({in_Relase_Door_PB:true,in_Reset_PB:false,b_EStop_Ok:true,in_Estop_PLC:false,
    in_LV_Connector_Interlock:false,in_HV_Connector_Interlock:false,in_InterLock_NC_1:false,in_InterLock_NC_2:false}).scan();
  assert.equal(r.get(final),true,"component access grant is not the common energy permit");
});
test("UNLOCK07 existing Door solenoid consumers and EStop configuration are preserved",()=>{
  assert.deepEqual([...model.variables.find(v=>v.name==="in_Door_Monitor").targetPorts].sort(),[
    "//Network2/FBAnd8/AndIn1","//Network12/FBAnd11/AndIn1","//Network12/FBAnd17/AndIn1"].sort());
  for(const name of ["EStopIn2","EStopIn4"])assert.equal(get("//Network1/FBEstop1").inputs.find(p=>p.name===name).channelInterface,"Both Deactivated");
  assert.equal(all.length,254);assert.equal(model.bindingAudit.status,"PASS");
});
test("UNLOCK07 global permission is a resolved SGVL reference with usage index",()=>{
  assert.deepEqual(gate.inputs.map(p=>p.channelInterface),[...Array(5).fill("Activated"),...Array(3).fill("Deactivated")]);
  const p=gate.inputs[3];assert.equal(p.channelInterface,"Activated");assert.equal(p.deactivate1,"Break Contact (NC)");
  assert.equal(p.globals[0]?.variableId,"98ab783a-9ee4-42cd-8375-54abc169e250");assert.equal(p.globals[0]?.resolvedName,"b_EStop_Ok");
  assert.equal(model.bindingAudit.globalRefs.filter(r=>r.portId===p.Id&&r.name==="b_EStop_Ok").length,1);
});
test("UNLOCK07 current PLC stop uses native inverted alias usage, not a fake global",()=>{
  const p=gate.inputs[0];assert.equal(p.name,"AndIn1");assert.equal(p.objectIndex,"8");assert.equal(p.channelInterface,"Activated");assert.equal(p.deactivate1,"Make Contact (NO)");
  assert.deepEqual(p.globals,[]);assert.equal(model.variables.find(v=>v.name==="in_Estop_PLC").targetPorts.filter(path=>path===p.path).length,1);
});
