import * as V2 from './helpers/v2-structural.js';
import { removeCompactGvl } from "./helpers/compact-expectations.js";
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
const make=extra=>{const r=new SalRuntime({...model,networks:[{blocks:[permit,gate,rs,or,...extra,...(extra.some(b=>b.path.startsWith("//Network12/"))?model.networks.filter(n=>["RndPhysicalCompact","SafeResumption"].includes(n.name)).flatMap(n=>n.blocks):[])]}]}, {unconnectedInput:false}).setInputs(healthy);r.values.set("//Network1/FBAnd1/AndOut",true); // Explicit healthy excluded PLCproducer boundary, exercised dynamically by PLC pulse suite.
return r;};
const noReset=r=>{for(const source of rs.inputs.find(p=>p.name==="Reset").sources)r.values.set(source,false);r.values.set(rs.inputs.find(p=>p.name==="Reset").path,false);};

test("HV V2 sole Set path and unchanged aggregate sources, exact reviewed224 order",()=>{
 // Approved baseline+explicit v2 delta; no source masking.
 V2.energy('HV');


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

test("HV V2 SGVL declarations and writers unchanged, exact eleven target usage changes",()=>{
 // Approved baseline+explicit v2 delta; no source masking.
 V2.sgvl();


});
