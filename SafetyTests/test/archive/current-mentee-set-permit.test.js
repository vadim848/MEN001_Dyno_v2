import * as V2 from '../helpers/v2-structural.js';
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseSalFile } from "../../src/sal-parser.js";
import { SalRuntime } from "../../src/sal-runtime.js";
// G1 v8 (lead 2026-10-22; analyst E2b-dev §2.5, class D-E2b-4): the source under test is V2.salUrl / V2.parseOptions (E2_SOURCE_ROOT-aware),
// not a hard canonical path.
const file=V2.salUrl,model=parseSalFile(file,V2.parseOptions);
// G1 v8 (analyst E2b-dev §2.3, D-E2d-1; V14-Q7 "Б1", Q-RC-03(b1), IL-05b(2)): NC1/NC2 no longer forbid the LV Set on the Safe->R&D path. On the
// shared LV aggregate the route is not distinguishable (legacy Network5 b_Step2 must still be blocked by NC), so the LV aggregate rows for
// NC1/NC2 are judged per route (paired Step12 route: Set as without the event; legacy Network5 route: forbidden). HV rows unchanged.
const LV_ROUTE_DEPENDENT=new Set(["in_InterLock_NC_1","in_InterLock_NC_2"]);
const all=model.networks.flatMap(n=>n.blocks),get=p=>all.find(b=>b.path===p),permit=get("//Network1/FBAndLvCurrentPermit");
const healthy={b_EStop_Ok:true,in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,
  in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Estop_PLC:false};
function make(domain,extra=[]) {
  const hv=domain==="HV",rs=get(`//Network1/FBRs${hv?2:1}`),gate=get(`//Network1/FBAnd${hv?'Hv':'Lv'}SetPermit`),aggregate=get(`//Network1/FBOr${hv?18:17}`);
  const r=new SalRuntime({...model,networks:[{blocks:[permit,gate,rs,aggregate,...extra,...(extra.some(b=>b.path.startsWith("//Network12/"))?model.networks.filter(n=>["RndPhysicalCompact","SafeResumption"].includes(n.name)).flatMap(n=>n.blocks):[])]}]},{scanMs:1,unconnectedInput:false}).setInputs({...healthy,in_Mentee_EStop:false});
  r.values.set("//Network1/FBAnd1/AndOut",true); // Explicit healthy excluded PLCproducer boundary.
  for(const source of rs.inputs.find(p=>p.name==="Reset").sources)r.values.set(source,false);
  return {r,rs,gate,aggregate,output:hv?"out_HV_C2":"out_LV_C1"};
}

for(const [domain,route]of [["LV","legacy-Network5"],["LV","Step12"],["HV","legacy-Network5"],["HV","RnD-Network12"]])for(const mentee of [false,true])
  test(`MENTEE05 paired ${domain}/${route}/Mentee${mentee}: first scan after stale request`,()=>{
    const extra=route==="Step12"?[get("//Network11/FBAnd1")]:model.networks.find(n=>n.name===(route==="RnD-Network12"?"Network12":"Network5")).blocks;
    const {r,aggregate,output}=make(domain,extra);
    r.setInputs({b_Step2:route==="legacy-Network5",b_Step12:route==="Step12",b_Step_RnD:route==="RnD-Network12",
      b_ResetPB_Lock:false,in_False_SI2_CH8:false,in_Door_Monitor:true,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,
      in_Reset_PB:false,in_Relase_Door_PB:false});
    if(route==="RnD-Network12"){r.runFor(2100);r.setInputs({in_Reset_PB:true,in_Relase_Door_PB:true});}
    for(let i=0;i<1500&&!r.get(aggregate.outputs[0].path);i++)r.scan();
    assert.equal(r.get(aggregate.outputs[0].path),true,"real upstream producer must form aggregate");
    assert.equal(r.get(output),false,"positive aggregate not yet consumed by early latch");
    r.setInputs({in_Mentee_EStop:mentee}).scan();
    assert.equal(r.get(output),!mentee,"current Mentee must prevent new Set on this first scan, not via later reset");
  });
// G1 v8 (D-E2d-1 per route): NC1/NC2 on the first scan after the stale request - Step12 (Safe->R&D) route: Set executes (V14-Q7);
// legacy Network5 (b_Step2) route: Set forbidden (V14-Q7 only for Safe->R&D; V14-Q5).
for(const [route,allowed] of [["Step12",true],["legacy-Network5",false]])for(const nc of ["in_InterLock_NC_1","in_InterLock_NC_2"])
  test(`MENTEE05 paired LV/${route}: ${nc} FALSE on the first scan after the stale request -> LV Set ${allowed?'executes (V14-Q7, Safe->R&D)':'forbidden (V14-Q5; Q7 only for Safe->R&D)'}`,()=>{
    const extra=route==="Step12"?[get("//Network11/FBAnd1")]:model.networks.find(n=>n.name==="Network5").blocks;const {r,aggregate,output}=make("LV",extra);
    r.setInputs({b_Step2:route==="legacy-Network5",b_Step12:route==="Step12",b_Step_RnD:false,b_ResetPB_Lock:false,in_False_SI2_CH8:false,in_Door_Monitor:true,
      inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,in_Reset_PB:false,in_Relase_Door_PB:false});
    for(let i=0;i<1500&&!r.get(aggregate.outputs[0].path);i++)r.scan();
    assert.equal(r.get(aggregate.outputs[0].path),true,"real upstream producer must form aggregate");assert.equal(r.get(output),false,"not yet consumed");
    r.setInputs({[nc]:false}).scan();assert.equal(r.get(output),allowed,`${route}/${nc}`);});

for(const domain of ["LV","HV"]) {
  test(`MENTEE05 ${domain}: already latched output is preserved without Reset`,()=>{
    const {r,rs,output}=make(domain);r.memory.set(rs.path,{value:true});r.write(rs.outputs[0],true);
    r.setInputs({in_Mentee_EStop:true}).scan();assert.equal(r.get(output),true);
  });
  test(`MENTEE05 ${domain}: all previous eight permission controls remain effective`,()=>{
    for(const fault of Object.keys(healthy)) {
      if(domain==="LV"&&LV_ROUTE_DEPENDENT.has(fault))continue; // judged per route above (D-E2d-1)
      const {r,aggregate,output}=make(domain);r.values.set(aggregate.outputs[0].path,true);
      r.setInputs({[fault]:!healthy[fault],in_Mentee_EStop:false}).scan();assert.equal(r.get(output),false,fault);
    }
  });
  test(`MENTEE05 ${domain}: third gate input has typed native alias binding and inverted contact`,()=>{
    const {gate}=make(domain),port=gate.inputs.find(p=>p.name==="AndIn3");
    assert.equal(port.channelInterface,"Activated");assert.equal(port.deactivate1,"Make Contact (NO)");
    const alias=model.variables.find(v=>v.name==="in_Mentee_EStop");
    assert.equal(alias.targetPorts.filter(p=>p===port.path).length,1);
    assert.deepEqual(port.globals,[],"SAL alias cannot masquerade as GVL1 global");
  });
}

test("MENTEE05 original Safe/Run protections, diagnostic alias and inactive main EStop port remain unchanged",()=>{
  const original=parseSalFile(new URL("../../fixtures/v2-4bb8703/TwinSafeGroup1.sal",import.meta.url));
  const old=original.variables.find(v=>v.name==="in_Mentee_EStop"),current=model.variables.find(v=>v.name===old.name);
  assert.equal(current.id,old.id);assert.deepEqual(current.alias,old.alias);assert.deepEqual(current.sourcePorts,old.sourcePorts);
  for(const p of old.targetPorts)assert.ok(current.targetPorts.includes(p));
  const estop=get("//Network1/FBEstop1");assert.equal(estop.inputs.find(p=>p.name==="EStopIn4").channelInterface,"Both Deactivated");
  for(const path of ["//Network2/FBAnd5","//Network6/FBAnd10"]) {
    const block=get(path),previous=original.networks.flatMap(n=>n.blocks).find(b=>b.path===path);
    assert.deepEqual(block.inputs.map(p=>[p.Id,p.channelInterface,p.deactivate1]),previous.inputs.map(p=>[p.Id,p.channelInterface,p.deactivate1]));
    for(const mentee of [false,true]) {
      const r=new SalRuntime({...model,networks:[{blocks:[block]}]},{unconnectedInput:false}).setInputs({...healthy,in_Mentee_EStop:mentee});
      r.scan();assert.equal(r.get(block.outputs[0].path),!mentee);
    }
  }
  assert.equal(model.bindingAudit.status,"PASS");assert.equal(all.length,242);
  const nativeCrc=JSON.parse(fs.readFileSync(new URL('../NETWORK_SYMBOL_REPAIR_LAYER.json',import.meta.url))).nativeRoundtrip;
  assert.equal(nativeCrc.beforeSalCrc,'872783435');assert.equal(nativeCrc.afterSalCrc,'83968247');const slot=JSON.parse(fs.readFileSync(new URL('../SAFE_INPUT_SLOT_REPAIR_LAYER.json',import.meta.url)));assert.equal(slot.predecessorNativeSalCrc,nativeCrc.afterSalCrc,'current native CRC chain starts at immutable prior layer');assert.equal(slot.nativeSalCrc,'3035115343');assert.equal(model.crc,'3702999762','exact independently native-verified F1 revision (tester E1-f1 NATIVE_F1.json)');
});
