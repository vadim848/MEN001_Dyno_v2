import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { parseSalFile } from "../src/sal-parser.js";
import { SalRuntime } from "../src/sal-runtime.js";
import { validateSalBindings } from "../src/sal-binding-validator.js";
const file=new URL("../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal",import.meta.url);
const model=parseSalFile(file),blocks=model.networks.flatMap(n=>n.blocks);
const get=p=>blocks.find(b=>b.path===p);
const permit=get("//Network1/FBAndLvCurrentPermit"),gate=get("//Network1/FBAndHvSetPermit"),rs=get("//Network1/FBRs2"),or=get("//Network1/FBOr18");
const healthy={b_EStop_Ok:true,in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,
  in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Estop_PLC:false};
const make=extra=>new SalRuntime({...model,networks:[{blocks:[permit,gate,rs,or,...extra]}]}, {unconnectedInput:false}).setInputs(healthy);
const noReset=r=>{for(const source of rs.inputs.find(p=>p.name==="Reset").sources)r.values.set(source,false);r.values.set(rs.inputs.find(p=>p.name==="Reset").path,false);};

test("HV current SAL: sole canonical Set path, preserved aggregate inputs and complete binding audit",()=>{
  assert.equal(model.bindingAudit.status,"PASS");
  assert.deepEqual([permit.orderOfExecution,gate.orderOfExecution,rs.orderOfExecution,or.orderOfExecution],[2,5,6,176]);
  assert.deepEqual(rs.inputs.find(p=>p.name==="Set").sources,[gate.outputs[0].path]);
  assert.deepEqual(or.outputs[0].targets,[gate.inputs[0].path]);
  assert.deepEqual(gate.inputs[1].sources,[permit.outputs[0].path]);
  assert.equal(model.bindingAudit.edges.filter(e=>e.to===rs.inputs.find(p=>p.name==="Set").path).length,1);
  assert.deepEqual(or.inputs.slice(0,3).map(p=>p.globals[0]?.resolvedName??p.sources[0]),
    ["b_Set_HV_C2","//Network1/FBAnd6/AndOut","b_Set_HV_C2_1"]);
  assert.deepEqual(gate.inputs.map(p=>p.channelInterface),["Activated","Activated","Activated",...Array(5).fill("Deactivated")]);
  assert.equal(gate.inputs[2].deactivate1,"Make Contact (NO)");
  assert.equal(permit.outputs[0].targets.includes("//Network1/FBAndLvSetPermit/AndIn2"),true);
  const xml=fs.readFileSync(file,"utf8"),sgvl=fs.readFileSync(new URL("../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl",import.meta.url),"utf8");
  const missing=xml.replace(/<wiredLink\b[^>]*>\s*<inPortMoniker name="\/\/Network1\/FBAndHvSetPermit\/AndIn2"\s*\/>\s*<\/wiredLink>/,"");
  assert.equal(validateSalBindings(missing,sgvl).status,"ERROR");
});

test("HV current SAL: permission truth table and already-latched HV without Reset",()=>{
  for(const aggregate of [false,true])for(const fault of [null,...Object.keys(healthy)]) {
    const r=make([]);noReset(r);r.values.set(or.outputs[0].path,aggregate);
    if(fault)r.setInputs({[fault]:!healthy[fault]});r.scan();
    assert.equal(r.get("out_HV_C2"),aggregate&&!fault,`${aggregate}/${fault}`);
  }
  for(const fault of Object.keys(healthy)) {
    const r=make([]);noReset(r);r.memory.set(rs.path,{value:true});r.write(rs.outputs[0],true);
    r.setInputs({[fault]:!healthy[fault]}).scan();assert.equal(r.get("out_HV_C2"),true,fault);
  }
});

test("HV current SAL: real legacy/R&D/third-route stale aggregate paired first-fault scans",()=>{
  for(const route of ["legacy-Network5","RnD-Network12","existing-retry-AND6"])for(const fault of [null,...Object.keys(healthy)]) {
    const extra=route==="legacy-Network5"?model.networks.find(n=>n.name==="Network5").blocks:
      route==="RnD-Network12"?model.networks.find(n=>n.name==="Network12").blocks:[get("//Network1/FBAnd6")];
    const r=make(extra);noReset(r);
    r.setInputs({in_False_SI2_CH8:false,in_Door_Monitor:true,b_Step2:route==="legacy-Network5",b_Step_RnD:route==="RnD-Network12",
      b_ResetPB_Lock:false,in_Reset_PB:false,in_Relase_Door_PB:false,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false});
    if(route==="RnD-Network12") {r.runFor(2100);r.setInputs({in_Reset_PB:true,in_Relase_Door_PB:true});}
    if(route==="existing-retry-AND6")r.values.set("//Network1/FBAnd4/AndOut",true); // Explicit cut upstream boundary.
    for(let i=0;i<250&&!r.get(or.outputs[0].path);i++)r.scan();
    assert.equal(r.get(or.outputs[0].path),true,`${route}: real aggregate must assert`);
    assert.equal(r.get("out_HV_C2"),false,`${route}: latch still false before aggregate is consumed`);
    if(fault)r.setInputs({[fault]:!healthy[fault]});r.scan();
    assert.equal(r.get("out_HV_C2"),!fault,`${route}/${fault}: first next scan`);
  }
});

test("HV current SAL: SGVL changes since B1 are limited to explicit07 EStop output permission usage",()=>{
  const before=spawnSync("git",["show","9ef945c:MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl"],{maxBuffer:4*1024*1024});
  assert.equal(before.status,0);
  const current=fs.readFileSync(new URL("../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl",import.meta.url));
  const removal=/<FbPortUsage\b[^>]*>\s*<ModelElementId>55c0b75c-a041-46ff-b5a3-715fa2f8d676<\/ModelElementId>\s*<\/FbPortUsage>/g;
  assert.equal([...current.toString("utf8").matchAll(removal)].length,1);
  const normalize=s=>s.replace(/>\s+</g,"><").replaceAll("\r\n","\n").trim();
  assert.equal(normalize(current.toString("utf8").replace(removal,"")),normalize(before.stdout.toString("utf8")));
});
