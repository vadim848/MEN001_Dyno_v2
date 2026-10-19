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
  in_Mentee_EStop:["FBAndLvSetPermit/AndIn3","FBAndHvSetPermit/AndIn3"],
  in_ES_NC_1:["FBAndLvCurrentPermit/AndIn2"],in_ES_NC_2:["FBAndLvCurrentPermit/AndIn3"],in_InterLock_NC_1:["FBAndLvCurrentPermit/AndIn4","../Network12/FBAnd16/AndIn1"],
  in_InterLock_NC_2:["FBAndLvCurrentPermit/AndIn5","../Network12/FBAnd16/AndIn3"],in_LV_Connector_Interlock:["FBAndLvCurrentPermit/AndIn6"],
  in_HV_Connector_Interlock:["FBAndLvCurrentPermit/AndIn7"],in_Estop_PLC:["FBAndLvCurrentPermit/AndIn8","FBAndUnlockHold/AndIn5"]};

test("B1 current source and unchanged historical wire roles pass structural audit",()=>{
  assert.deepEqual(validateSalBindings(original,gvl).errors,[]);
  assert.deepEqual(validateSalBindings(sal,gvl).errors,[]);
  const now=parseSalFile(salUrl),before=parseSalFile(fixture);
  let count=0;
  for(const old of before.variables) {
    const current=now.variables.find(v=>v.name===old.name),extra=[...(additions[old.name]??[]).map(p=>p.startsWith("../")?`//${p.slice(3)}`:`//Network1/${p}`),...compact.aliasTargetUsageAdditions.filter(u=>u.variableId===old.id).map(u=>u.targetPort)];
    const retained=old.targetPorts.filter(p=>!(old.name==="in_Door_Monitor"&&p==="//Network12/FBAnd16/AndIn1")&&!["//Network12/FBTon2/TonIn","//Network12/FBTon4/TonIn"].includes(p)); // explicit user-approved06 energy guard replacement
    assert.deepEqual([...current.targetPorts].sort(),[...retained,...extra].sort());count+=extra.length;
    assert.deepEqual(current.alias,old.alias);
    assert.deepEqual(current.sourcePorts,old.name==="out_Door_Unlock_Solonoeid"?["//Network1/FBAndUnlockHold/AndOut"]:old.sourcePorts);
  }
  assert.equal(count,34); // B1 eleven +06 two NC +05 two Mentee +07 one PLC consumer; only06 Door energy usage removed.
  const requiredEdges=[
    ["FBAnd1/AndOut","FBAndLvSetPermit/AndIn4"], ["FBAnd1/AndOut","FBAndHvSetPermit/AndIn4"],
    ["FBRs6/RsOut","FBAndUnlockHold/AndIn1"], ["FBOr17/OrOut","FBAndLvSetPermit/AndIn1"],
    ["FBAndLvCurrentPermit/AndOut","FBAndLvSetPermit/AndIn2"], ["FBAndLvSetPermit/AndOut","FBRs1/Set"]
  ];
  for(const [from,to]of requiredEdges)assert.equal(now.bindingAudit.edges.filter(e=>e.from===`//Network1/${from}`&&e.to===`//Network1/${to}`).length,1);
  // Original fixture Ton1->And2 is serialized only on output, not as two wires.
  const network=original.match(/<Network\b[^>]*name="Network2"[\s\S]*?<\/Network>/)[0];
  const timer=network.match(/<fBTon\b[^>]*name="FBTon1"[\s\S]*?<\/fBTon>/)[0];
  assert.ok(timer.includes('inPortMoniker name="//Network2/FBAnd2/AndIn1"'));
  const consumer=network.match(/<fBAnd\b[^>]*name="FBAnd2"[\s\S]*?<\/fBAnd>/)[0];
  assert.match(consumer,/<inPort\b[^>]*name="AndIn1"[^>]*\/>/);
});

const reference=sal.match(/<fbPortGlobalVariableReference\b[^>]*lastKnownPath="GVL1.b_EStop_Ok"\s*\/>/)[0];
const newGlobal=sal.match(/<inPort\b[^>]*Id="e38bf21e-15b3-448f-89c8-2795d5bf62db"[\s\S]*?<\/inPort>/)[0];
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
  ["missing SGVL usage",()=>[sal,gvl.replace(/<FbPortUsage\b[^>]*>\s*<ModelElementId>e38bf21e-15b3-448f-89c8-2795d5bf62db<\/ModelElementId>\s*<\/FbPortUsage>/,"")]],
  ["nonexistent port moniker",()=>[sal.replace('name="//Network1/FBAndUnlockHold/AndIn1"','name="//Network1/DOES_NOT_EXIST/AndIn1"'),gvl]],
  ["reversed direction",()=>[sal.replace('<inPortMoniker name="//Network1/FBAndUnlockHold/AndIn1"','<outPortMoniker name="//Network1/FBAndUnlockHold/AndIn1"'),gvl]],
  ["missing relationship wrapper",()=>[sal.replace(/<fbPortUsageReferencesFunctionBlockPort\b[^>]*>([\s\S]*?)<\/fbPortUsageReferencesFunctionBlockPort>/,"$1"),gvl]],
  ["duplicate wire pair",()=>{const wire=sal.match(/<wiredLink\b[^>]*>\s*<inPortMoniker name="\/\/Network1\/FBAndUnlockHold\/AndIn1"\s*\/>\s*<\/wiredLink>/)[0];return[sal.replace(wire,wire+wire.replace(/Id="[^"]+"/,'Id="11111111-1111-1111-1111-111111111111"')),gvl];}]
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
  assert.ok(block.inputs[0].sources.includes(edge.from));
  const r=new SalRuntime({...current,networks:[{blocks:[block]}]});
  r.values.set(edge.from,true);r.setInputs({in_Relase_Door_PB:true,in_Reset_PB:false,b_EStop_Ok:true,in_Estop_PLC:false}).scan();
  assert.equal(r.get("out_Door_Unlock_Solonoeid"),true);
  assert.ok(walk(readBindingXml(sal)).some(n=>n.tag==="fbPortGlobalVariableReferences"));
  assert.ok(reference);
  const serialized=sal.match(/<wiredLink\b[^>]*>\s*<inPortMoniker name="\/\/Network1\/FBAndUnlockHold\/AndIn1"\s*\/>\s*<\/wiredLink>/)[0];
  let inputSide=sal.replace(serialized,"");
  const target=block.inputs[0];
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
    assert.deepEqual(inputBlock.inputs[0].sources,block.inputs[0].sources);
  }finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
});

test("B1 plus07 SGVL delta is exactly two program usages; declarations and other indices remain unchanged",()=>{
  const baseline=spawnSync("git",["show","c024651:MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl"],{encoding:"utf8",maxBuffer:4*1024*1024});
  assert.equal(baseline.status,0,baseline.stderr);
  const removal=/<FbPortUsage\b[^>]*>\s*<ModelElementId>(?:e38bf21e-15b3-448f-89c8-2795d5bf62db|55c0b75c-a041-46ff-b5a3-715fa2f8d676)<\/ModelElementId>\s*<\/FbPortUsage>/g;
  assert.equal([...gvl.matchAll(removal)].length,2);
  const normalize=s=>s.replace(/>\s+</g,"><").trim();
  assert.equal(normalize(removeCompactGvl(gvl).replace(removal,"")),normalize(baseline.stdout));
});


test("PLC pulse guards preserve producer fanout and use exactly four direct/inverted native inputs",()=>{
 const model=parseSalFile(salUrl),all=model.networks.flatMap(n=>n.blocks),get=p=>all.find(b=>b.path===p);
 assert.equal(all.length,253);
 const source=get('//Network1/FBAnd1');assert.equal(source.orderOfExecution,95);
 assert.deepEqual([...source.outputs[0].targets].sort(),['//Network1/FBEstop1/EStopIn3','//Network1/FBAndLvSetPermit/AndIn4','//Network1/FBAndHvSetPermit/AndIn4'].sort());
 for(const domain of ['Lv','Hv']){const gate=get('//Network1/FBAnd'+domain+'SetPermit');
  assert.deepEqual(gate.inputs.map(p=>p.channelInterface),[...Array(4).fill('Activated'),...Array(4).fill('Deactivated')]);
  assert.deepEqual(gate.inputs[3].sources,[source.outputs[0].path]);assert.equal(gate.inputs[3].deactivate1,'Break Contact (NC)');
  assert.deepEqual(gate.inputs[3].globals,[]);
 }
});
