import * as V2 from './helpers/v2-structural.js';
import { removeCompactGvl } from "./helpers/compact-expectations.js";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { validateSalBindings,readBindingXml } from "../src/sal-binding-validator.js";
import { parseSalFile } from "../src/sal-parser.js";
import { SalRuntime } from "../src/sal-runtime.js";
const salUrl=new URL("../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal",import.meta.url);
const sal=fs.readFileSync(salUrl,"utf8"),gvl=fs.readFileSync(new URL("../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl",import.meta.url),"utf8");
const fixture=new URL("../fixtures/v2-4bb8703/TwinSafeGroup1.sal",import.meta.url),original=fs.readFileSync(fixture,"utf8");
const walk=n=>[n,...n.children.flatMap(walk)];
const compact=JSON.parse(fs.readFileSync(new URL("../03B_COMPACT_OPTIMIZED_PLAN.json",import.meta.url)));
const additions={in_Relase_Door_PB:["FBOr3/OrIn3","FBAndUnlockHold/AndIn2"],in_Reset_PB:["FBOr3/OrIn4","FBAndUnlockHold/AndIn3"],
  in_Mentee_EStop:["FBAndLvSetPermit/AndIn3","FBAndHvSetPermit/AndIn3","FBAndSto1SetPermit/AndIn3","FBAndSto2SetPermit/AndIn3"],
  in_ES_NC_1:["FBAndLvCurrentPermit/AndIn2"],in_ES_NC_2:["FBAndLvCurrentPermit/AndIn3"],in_InterLock_NC_1:["FBAndLvCurrentPermit/AndIn4","../Network12/FBAnd16/AndIn1"],
  in_InterLock_NC_2:["FBAndLvCurrentPermit/AndIn5","../Network12/FBAnd16/AndIn3"],in_LV_Connector_Interlock:["FBAndLvCurrentPermit/AndIn6"],
  in_HV_Connector_Interlock:["FBAndLvCurrentPermit/AndIn7"],in_Estop_PLC:["FBAndLvCurrentPermit/AndIn8","FBAndUnlockHold/AndIn5"]};

test("B1 V2 physical aliases and required wires preserved through exact logical consumer delta",()=>{
 // Approved baseline+explicit v2 delta; no source masking.
 V2.aliases(); V2.wires();


});

const reference=sal.match(/<fbPortGlobalVariableReference\b[^>]*lastKnownPath="GVL1.b_EStop_Ok"\s*\/>/)[0];
const newGlobal=sal.match(/<inPort\b[^>]*Id="75f42369-fbd7-49b1-a11b-18df643208ea"[\s\S]*?<\/inPort>/)[0];
const changedRef=newGlobal.match(/<fbPortGlobalVariableReference\b[^>]*\/>/)[0];
const mutations=[
  ["foreign inherited default namespace",()=>[sal.replace("<fbPortGlobalVariableReferences>",'<fbPortGlobalVariableReferences xmlns="urn:wrong">'),gvl]],
  ["foreign single-quoted default namespace",()=>[sal.replace("<fbPortGlobalVariableReferences>","<fbPortGlobalVariableReferences xmlns='urn:wrong'>"),gvl]],
  ["cleared inherited namespace",()=>[sal.replace("<fbPortGlobalVariableReferences>",'<fbPortGlobalVariableReferences xmlns="">'),gvl]],
  ["foreign declared prefix",()=>[sal.replace(/<fbPortGlobalVariableReferences>/,'<bad:fbPortGlobalVariableReferences xmlns:bad="urn:wrong">').replace('</fbPortGlobalVariableReferences>','</bad:fbPortGlobalVariableReferences>'),gvl]],
  ["undeclared element prefix",()=>[sal.replace('<fbPortGlobalVariableReferences>','<bad:fbPortGlobalVariableReferences>').replace('</fbPortGlobalVariableReferences>','</bad:fbPortGlobalVariableReferences>'),gvl]],
  ["foreign SGVL child namespace",()=>[sal,gvl.replace('<TargetUsages>','<TargetUsages xmlns="urn:wrong">')]],
  ["bare global ref",()=>[sal.replace(newGlobal,newGlobal.replace(/<fbPortGlobalVariableReferences>[\s\S]*?<\/fbPortGlobalVariableReferences>/,changedRef)),gvl]],
  ["alias GUID as global",()=>[sal.replace(changedRef,changedRef.replace("98ab783a-9ee4-42cd-8375-54abc169e250","a9271cc5-5599-48f1-b6ea-c7da3eb00e9d")),gvl]],
  ["unknown global GUID, correct basename",()=>[sal.replace(changedRef,changedRef.replace("98ab783a-9ee4-42cd-8375-54abc169e250","00000000-0000-0000-0000-000000000001")),gvl]],
  ["wrong qualified path",()=>[sal.replace(changedRef,changedRef.replace("GVL1.b_EStop_Ok","Alias.b_EStop_Ok")),gvl]],
  ["missing SGVL usage",()=>[sal,gvl.replace(/<FbPortUsage\b[^>]*>\s*<ModelElementId>75f42369-fbd7-49b1-a11b-18df643208ea<\/ModelElementId>\s*<\/FbPortUsage>/,"")]],
  ["nonexistent port moniker",()=>[sal.replace('name="//Network1/FBAndUnlockHold/AndIn1"','name="//Network1/DOES_NOT_EXIST/AndIn1"'),gvl]],
  ["reversed direction",()=>[sal.replace('<inPortMoniker name="//Network1/FBAndUnlockHold/AndIn1"','<outPortMoniker name="//Network1/FBAndUnlockHold/AndIn1"'),gvl]],
  ["missing relationship wrapper",()=>[sal.replace(/<fbPortUsageReferencesFunctionBlockPort\b[^>]*>([\s\S]*?)<\/fbPortUsageReferencesFunctionBlockPort>/,"$1"),gvl]],
  ["duplicate wire pair",()=>{const wire=sal.match(/<wiredLink\b[^>]*>\s*<inPortMoniker name="\/\/Network1\/FBAndUnlockHold\/AndIn5"\s*\/>\s*<\/wiredLink>/)[0];return[sal.replace(wire,wire+wire.replace(/Id="[^"]+"/,'Id="11111111-1111-1111-1111-111111111111"')),gvl];}]
];
for(const [name,mutate]of mutations)test(`B1 rejects ${name} before any functional execution`,()=>{
  const [s,g]=mutate();assert.notEqual(s+g,sal+gvl,"mutation must change source");
  const result=validateSalBindings(s,g);assert.equal(result.status,"ERROR",JSON.stringify(result));assert.ok(result.errors.length);
});

test("B1 conflicting producers fail closed for two aliases, wire+alias and global+alias",()=>{
  const twoAliases=sal.replace('name="//Network1/FBAndLvCurrentPermit/AndIn3"','name="//Network1/FBAndLvCurrentPermit/AndIn2"');
  const wireAlias=sal.replace('name="//Network1/FBOr3/OrIn4"','name="//Network1/FBAndUnlockHold/AndIn1"');
  const model=parseSalFile(salUrl),port=model.networks[0].blocks.find(b=>b.name==="FBAndLvCurrentPermit").inputs[1];
  const portXml=sal.match(new RegExp('<inPort\\b[^>]*Id="'+port.Id+'"[^>]*/>'))[0];
  const ref=changedRef.replace(/\bId="[^"]+"/,'Id="22222222-2222-2222-2222-222222222222"');
  const globalAlias=sal.replace(portXml,portXml.replace(/\s*\/>$/,`><fbPortGlobalVariableReferences><functionBlockPortHasFbPortGlobalVariableReferences Id="33333333-3333-3333-3333-333333333333">${ref}</functionBlockPortHasFbPortGlobalVariableReferences></fbPortGlobalVariableReferences></inPort>`));
  for(const source of [twoAliases,wireAlias,globalAlias]) {
    const result=validateSalBindings(source,gvl);
    assert.equal(result.status,"ERROR");
    assert.ok(result.errors.some(e=>e.startsWith("Conflicting producers")),result.errors.join("\n"));
  }
});

test("B1 serialized input-side and output-side single wires normalize identically",()=>{
  const current=parseSalFile(salUrl),edge=current.bindingAudit.edges.find(e=>e.from==="//Network1/FBRs6/RsOut");
  assert.equal(current.bindingAudit.edges.filter(e=>e.from===edge.from&&e.to===edge.to).length,1);
  const block=current.networks[0].blocks.find(b=>b.name==="FBAndUnlockHold");
  const target=block.inputs.find(p=>p.name==='AndIn5'&&p.Id==='3f513b29-6b63-4f75-926e-811ca7650568');assert.ok(target);assert.equal(edge.to,target.path);assert.deepEqual(target.sources,[edge.from]);
  const r=new SalRuntime({...current,networks:[{blocks:[block]}]});
  r.values.set(edge.from,true);r.setInputs({in_Relase_Door_PB:true,in_Reset_PB:false,b_EStop_Ok:true,in_Estop_PLC:false}).scan();
  assert.equal(r.get("out_Door_Unlock_Solonoeid"),true);
  assert.ok(walk(readBindingXml(sal)).some(n=>n.tag==="fbPortGlobalVariableReferences"));
  assert.ok(reference);
  const serialized=sal.match(/<wiredLink\b[^>]*>\s*<inPortMoniker name="\/\/Network1\/FBAndUnlockHold\/AndIn5"\s*\/>\s*<\/wiredLink>/)[0];
  let inputSide=sal.replace(serialized,"");
  
  inputSide=inputSide.replace(new RegExp('(<inPort\\b[^>]*Id="'+target.Id+'"[^>]*?)\\s*/>'),
    `$1><targetFunctionBlockPorts>${serialized.replace('inPortMoniker name="'+edge.to+'"','outPortMoniker name="'+edge.from+'"')}</targetFunctionBlockPorts></inPort>`);
  assert.equal(validateSalBindings(inputSide,gvl).status,"PASS");
  const temp=path.join(os.tmpdir(),`men001-input-wire-${Date.now()}.sal`);
  try {
    fs.writeFileSync(temp,inputSide);
    const inputModel=parseSalFile(temp,{bindingMode:"current"});
    const inputBlock=inputModel.networks[0].blocks.find(b=>b.name===block.name);
    const inputRuntime=new SalRuntime({...inputModel,networks:[{blocks:[inputBlock]}]});
    inputRuntime.values.set(edge.from,true);
    inputRuntime.setInputs({in_Relase_Door_PB:true,in_Reset_PB:false,b_EStop_Ok:true,in_Estop_PLC:false}).scan();
    assert.equal(inputRuntime.get("out_Door_Unlock_Solonoeid"),true);
    assert.deepEqual(inputBlock.inputs.find(p=>p.name==='AndIn5'&&p.Id===target.Id).sources,[edge.from]);assert.deepEqual(target.sources,[edge.from]);
  }finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
});

test("B1 LV254 SGVL declarations and all source indices unchanged through exact composed target delta",()=>{
 // Approved baseline+explicit v2 delta; no source masking.
 V2.sgvl();


});


test("PLC V2 native producer96, preserved contacts and exact whole graph fanout",()=>{
 // Approved baseline+explicit v2 delta; no source masking.
 V2.plc();


});
