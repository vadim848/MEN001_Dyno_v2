import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { parseSalFile } from "../src/sal-parser.js";
import { SalRuntime } from "../src/sal-runtime.js";
const file=new URL("../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal",import.meta.url),model=parseSalFile(file);
const all=model.networks.flatMap(n=>n.blocks),get=p=>all.find(b=>b.path===p),and16=get("//Network12/FBAnd16");
const healthy={b_EStop_Ok:true,in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,
  in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Estop_PLC:false};
const make=blocks=>new SalRuntime({...model,networks:[{blocks}]},{scanMs:1,unconnectedInput:false});

test("DOOR06 exact alias targets separate solenoid consumers from energy InterLocks",()=>{
  const targets=name=>model.variables.find(v=>v.name===name).targetPorts;
  assert.deepEqual([...targets("in_Door_Monitor")].sort(),[
    "//Network2/FBAnd8/AndIn1","//Network12/FBAnd11/AndIn1","//Network12/FBAnd17/AndIn1"].sort());
  assert.ok(targets("in_InterLock_NC_1").includes("//Network12/FBAnd16/AndIn1"));
  assert.ok(targets("in_InterLock_NC_2").includes("//Network12/FBAnd16/AndIn3"));
  assert.ok(targets("in_False_SI2_CH8").includes("//Network12/FBAnd16/AndIn2"));
  assert.deepEqual(and16.inputs.slice(0,3).map(p=>[p.channelInterface,p.deactivate1]),[
    ["Activated","Break Contact (NC)"],["Activated","Make Contact (NO)"],["Activated","Break Contact (NC)"]]);
  assert.equal(all.length,253);
});

for(const door of [false,true])for(const nc1 of [false,true])for(const nc2 of [false,true])for(const inhibit of [false,true])
  test(`DOOR06 component Door${door}/NC1${nc1}/NC2${nc2}/False${inhibit}`,()=>{
    const r=make([and16]).setInputs({in_Door_Monitor:door,in_InterLock_NC_1:nc1,in_InterLock_NC_2:nc2,in_False_SI2_CH8:inhibit}).scan();
    assert.equal(r.get(and16.outputs[0].path),nc1&&nc2&&!inhibit,"energy producer guard must use both InterLock NC, independently of DoorMonitor");
  });

function runEnergy(route,door,nc1,nc2,extra={}) {
  const r=make([...model.networks.find(n=>n.name==="Network12").blocks,...model.networks.find(n=>n.name==="RndPhysicalCompact").blocks,...[
    "//Network1/FBAndLvCurrentPermit","//Network1/FBAndHvSetPermit","//Network1/FBRs2","//Network1/FBOr18"].map(get)]);
  r.values.set("//Network1/FBAnd1/AndOut",true); // Explicit healthy excluded PLCproducer boundary.
  const rs=get("//Network1/FBRs2");for(const source of rs.inputs.find(p=>p.name==="Reset").sources)r.values.set(source,false);
  r.setInputs({...healthy,b_Step_RnD:true,b_ResetPB_Lock:false,in_False_SI2_CH8:false,
    in_Door_Monitor:door,in_InterLock_NC_1:nc1,in_InterLock_NC_2:nc2,
    inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,in_Reset_PB:false,in_Relase_Door_PB:false,...extra});
  r.runFor(2100);
  r.setInputs(route==="physical"?{in_Reset_PB:true,in_Relase_Door_PB:true}:{inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true}).scan();
  r.runFor(1100);
  return {hv:r.get("out_HV_C2"),request:r.get("b_Set_HV_C2_1"),r};
}
for(const route of ["physical","existing-PLC-levels"])for(const door of [false,true])for(const nc1 of [false,true])for(const nc2 of [false,true])
  test(`DOOR06 actual HV chain ${route}/Door${door}/NC1${nc1}/NC2${nc2}`,()=>{
    const result=runEnergy(route,door,nc1,nc2);
    assert.equal(result.hv,nc1&&nc2,"real producer→And4→OR18→permission→RS must not depend on Door");
    assert.equal(result.request,nc1&&nc2,"upstream producer must also enforce both NC; downstream guard alone is insufficient");
  });

test("DOOR06 existing emergency/connector/False guards still prevent new HV",()=>{
  for(const route of ["physical","existing-PLC-levels"])for(const fault of ["in_ES_NC_1","in_ES_NC_2","in_LV_Connector_Interlock","in_HV_Connector_Interlock","in_Estop_PLC","b_EStop_Ok","in_False_SI2_CH8"]){
    const failed=Object.hasOwn(healthy,fault)?!healthy[fault]:true;
    assert.equal(runEnergy(route,true,true,true,{[fault]:failed}).hv,false,`${route}/${fault}`);
  }
});

test("DOOR06 preserve all three original unlock consumers and their component truth tables",()=>{
  const baseline=spawnSync("git",["show","0e4ab09:MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal"],{encoding:"utf8",maxBuffer:4*1024*1024});assert.equal(baseline.status,0);
  const xml=fs.readFileSync(file,"utf8");
  const blockText=(source,network,name)=>source.match(new RegExp('<Network\\b[^>]*name="'+network+'"[\\s\\S]*?</Network>'))[0]
    .match(new RegExp('<fBAnd\\b[^>]*name="'+name+'"[\\s\\S]*?</fBAnd>'))[0].replaceAll("\r\n","\n").replace(/orderOfExecution="\d+"/,'orderOfExecution="ORDER"');
  for(const [network,name]of [["Network2","FBAnd8"],["Network12","FBAnd11"],["Network12","FBAnd17"]]) {
    assert.equal(blockText(xml,network,name),blockText(baseline.stdout,network,name));
    const block=get(`//${network}/${name}`);
    for(const door of [false,true])for(const qualifier of [false,true]) {
      const r=make([block]).setInputs({in_Door_Monitor:door,in_False_SI2_CH8:qualifier});
      if(network==="Network2")r.values.set("//Network2/FBDecouple3/DecOut1",qualifier);
      r.scan();assert.equal(r.get(block.outputs[0].path),network==="Network2"?!door&&qualifier:door&&!qualifier);
    }
  }
});

test("DOOR06 Safe entry source has no hidden Door energy dependency",()=>{
  const r=make([get("//Network2/FBAnd6")]).setInputs({in_ES_NC_1:true,in_ES_NC_2:true,in_Door_Monitor:false});
  r.scan();assert.equal(r.get("//Network2/FBAnd6/AndOut"),true);
  r.setInputs({in_Door_Monitor:true}).scan();assert.equal(r.get("//Network2/FBAnd6/AndOut"),true);
  assert.equal(model.bindingAudit.status,"PASS");
});
