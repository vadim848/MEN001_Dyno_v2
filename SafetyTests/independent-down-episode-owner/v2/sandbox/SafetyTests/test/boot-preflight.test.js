import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {preflightWorkingProgram} from '../src/boot-preflight.js';
import {parseSalFile} from '../src/sal-parser.js';
const sal=fs.readFileSync(new URL('../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url),'utf8');
const sgvl=fs.readFileSync(new URL('../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',import.meta.url),'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function pair(run,s=sal,g=sgvl){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'men001-boot-preflight-'));try{
 const salPath=path.join(dir,'full.sal'),sgvlPath=path.join(dir,'matching.sgvl');fs.writeFileSync(salPath,s);fs.writeFileSync(sgvlPath,g);return run({salPath,sgvlPath});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}}
test('BOOT preflight owns fresh full-source parsing, all native inventory and exact two unsupported categories',()=>{
 const r=preflightWorkingProgram();assert.equal(r.status,'NOT VERIFIED');assert.equal(r.bindingAudit.status,'PASS');assert.equal(r.sourceCoverage.status,'MATCH');
 assert.equal(r.source.sal.rawSha256,sha(sal));assert.equal(r.source.sgvl.rawSha256,sha(sgvl));assert.equal(r.inventory.blocks.length,255);
 assert.ok(r.inventory.networks.some(n=>n.name==='Network3'));assert.ok(r.inventory.networks.some(n=>n.name==='Network4'));
 assert.equal(r.inventory.globalWriters.length,85);assert.equal(r.inventory.outwardOutputs.length,37);assert.equal(r.inventory.blocks.filter(b=>b.stateful).length,52);
 assert.ok(r.inventory.blocks.every(b=>b.attributes.Id&&b.inputs.every(p=>p.attributes.Id)&&b.outputs.every(p=>p.attributes.Id)));
 assert.equal(r.functionalBootPass,0);assert.equal(r.execution.performed,false);assert.deepEqual(r.execution.phaseCuts,[]);assert.deepEqual(r.execution.seededOutputs,[]);
 assert.equal(r.cases.some(c=>c.status==='PASS'),false);assert.deepEqual(r.cases.map(c=>c.code),['UNSUPPORTED_UNBOUND_PROGRAM_INPUT','UNSUPPORTED_GROUP_LIFECYCLE']);
});
test('BOOT Network4 lists eight unbound native inputs, seven precise phase writers/readers, unused channel8',()=>{
 const row=preflightWorkingProgram().cases.find(c=>c.code==='UNSUPPORTED_UNBOUND_PROGRAM_INPUT');
 assert.equal(row.observations.unboundInputs,8);assert.equal(row.observations.usedChannels,7);
 assert.deepEqual(row.observations.channels.flatMap(c=>c.writers.map(w=>w.name)),['b_Step3_Reset','b_Step4_Reset','b_Step5_Reset','b_Step6_Reset','b_Step1_Reset','b_Step1_Set','b_Step2_Set']);
 for(const channel of row.observations.channels){assert.ok(channel.input.id&&channel.output.id);assert.equal(channel.nativeUnboundValue,'UNSPECIFIED');assert.equal(channel.input.sources.length+channel.input.globals.length+channel.input.aliasTargets.length,0);}
 assert.ok(row.observations.channels.slice(0,7).every(c=>c.writers.every(w=>w.readers.length&&w.readers.every(r=>r.port.startsWith('//Network3/')))));
 assert.equal(row.observations.channels[7].used,false);assert.equal(row.observations.channels[7].writers.length,0);
});
test('BOOT declared RunStop/ErrAck are typed connections, not inferred group RUN or main Restart',()=>{
 const r=preflightWorkingProgram(),o=r.cases.find(c=>c.code==='UNSUPPORTED_GROUP_LIFECYCLE').observations;
 assert.equal(o.groupEngineModeled,false);assert.equal(o.groupStateInferred,false);assert.equal(o.mainEStopRestartIsGroupErrAck,false);assert.equal(o.nativeErrorStubIsGroupNoFaultProof,false);
 assert.deepEqual(o.interfaces.map(p=>[p.declaration.name,p.declaration.Id,p.bindings.map(v=>v.name)]),[
  ['ErrAck','95033787-cf62-4bb9-a993-a9e8ce16f161',['GroupPort_ErrAck']],['RunStop','e7c9a069-5d3b-4ece-abd2-cea3276dca9f',['in_Safety_Run']]]);
 for(const numericState of [2,4])assert.equal(preflightWorkingProgram({groupState:numericState}).status,'ERROR','numeric status cannot fabricate capability RUN');
});
test('BOOT rejects supplied filtered models, copied auditPASS, fallback/seeds and caller trust overrides',()=>{
 const model=parseSalFile(new URL('../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url));model.networks=model.networks.filter(n=>n.name!=='Network4');
 for(const input of [model,{model},{bindingAudit:{status:'PASS'}},{fallback:true},{phaseCuts:{}},{seededOutputs:{}},{manifest:{inventory:[]}},null]){
  const r=preflightWorkingProgram(input);assert.equal(r.status,'ERROR');assert.equal(r.functionalBootPass,0);assert.equal(r.cases.some(c=>c.status==='PASS'),false);
 }
});
test('BOOT accepts matching relocated file pairs, portable LF/CRLF without dropping any source attributes',()=>{
 const baseline=preflightWorkingProgram();
 for(const newline of ['\n','\r\n'])pair(paths=>{const r=preflightWorkingProgram(paths);assert.equal(r.status,'NOT VERIFIED');assert.equal(r.sourceCoverage.status,'MATCH');
  assert.equal(r.source.sal.normalizedSha256,baseline.source.sal.normalizedSha256);assert.equal(r.source.sgvl.normalizedSha256,baseline.source.sgvl.normalizedSha256);assert.equal(r.inventorySha256,baseline.inventorySha256);
 },sal.replaceAll('\r\n','\n').replaceAll('\n',newline),sgvl.replaceAll('\r\n','\n').replaceAll('\n',newline));
});
test('BOOT custom SGVL must be explicit and parser audits that exact requested file',()=>{
 assert.equal(preflightWorkingProgram({salPath:'anything.sal'}).error.code,'FILE_PAIR_REQUIRED');
  assert.throws(()=>parseSalFile(new URL('../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url),{bindingMode:'current',sgvlPath:null}),/path|argument|type/i,'explicit invalid SGVL cannot silently select canonical file');
 pair(paths=>{const r=preflightWorkingProgram(paths);assert.equal(r.status,'ERROR');assert.throws(()=>parseSalFile(paths.salPath,{bindingMode:'current',sgvlPath:paths.sgvlPath}),/binding validation/);},sal,sgvl.replace('<Name>b_EStop_Ok</Name>','<Name>wrong_EStop</Name>'));
});
test('BOOT rejects present-but-null/undefined/invalid custom paths without canonical fallback',()=>{
 for(const invalid of [undefined,null,'','   ',3,{},new URL('https://example.invalid/program.sgvl')]){
  for(const pair of [{salPath:'relocated.sal',sgvlPath:invalid},{salPath:invalid,sgvlPath:'relocated.sgvl'}]){
   const r=preflightWorkingProgram(pair);assert.equal(r.status,'ERROR');assert.equal(r.error.code,'FILE_PAIR_REQUIRED');assert.equal(r.source,undefined,'invalid pair rejected before default file read');
  }
 }
});
const mutations=[
 ['remove complete Network4',s=>s.replace(/<safetyApplicationHasNetworks\b[^>]*>\s*<Network\b[^>]*name="Network4"[\s\S]*?<\/Network>\s*<\/safetyApplicationHasNetworks>/,'')],
 ['mask Network4 name',s=>s.replace('name="Network4"','name="HiddenNetwork4"')],
 ['remove one actual state writer',s=>s.replace(/<fbPortGlobalVariableReferences><functionBlockPortHasFbPortGlobalVariableReferences[^>]*><fbPortGlobalVariableReference[^>]*lastKnownPath="GVL1.recRndC_SU"[\s\S]*?<\/fbPortGlobalVariableReferences>/,'')],
 ['foreign namespace relationship',s=>s.replace('<fbPortGlobalVariableReferences>','<fbPortGlobalVariableReferences xmlns="urn:foreign">')],
 ['alter full-source metadata revision',s=>s.replace('Crc="872783435"','Crc="872783436"')],
 ['change native attribute while preserving count',s=>s.replace('name="FBAndSto1SetPermit" instanceName="FBAndSto1SetPermit"','name="FBAndSto1SetPermit" instanceName="masked-native-instance"')]
];
for(const [name,mutate]of mutations)test('BOOT file mutation rejected: '+name,()=>{
 const changed=mutate(sal);assert.notEqual(changed,sal,'mutation must affect actual source');pair(paths=>{const r=preflightWorkingProgram(paths);assert.equal(r.status,'ERROR');assert.equal(r.functionalBootPass,0);assert.equal(r.cases.some(c=>c.status==='PASS'),false);},changed);
});
test('BOOT rejects a dropped trusted inventory entry instead of accepting copied source digests',t=>{
 const original=fs.readFileSync.bind(fs);const mock=t.mock.method(fs,'readFileSync',(file,...args)=>{
  const value=original(file,...args);if(String(file).endsWith('BOOT_PREFLIGHT_SOURCE_MANIFEST.json')){const m=JSON.parse(value.toString());m.inventory.blocks.pop();return JSON.stringify(m);}return value;
 });
 try{const r=preflightWorkingProgram();assert.equal(r.status,'ERROR');assert.equal(r.error.code,'SOURCE_COVERAGE_MISMATCH');}finally{mock.mock.restore();}
});
test('BOOT rejects an unsupported adapter revision rather than inventing group capability',t=>{
 const original=fs.readFileSync.bind(fs);const mocked=t.mock.method(fs,'readFileSync',(file,...args)=>{
  const value=original(file,...args);if(String(file).endsWith('sal-runtime.js'))return Buffer.concat([Buffer.from(value),Buffer.from('\n// unreviewed model revision\n')]);return value;
 });
 try{const r=preflightWorkingProgram();assert.equal(r.status,'ERROR');assert.equal(r.error.code,'UNSUPPORTED_SOURCE_REVISION');assert.equal(r.functionalBootPass,0);}finally{mocked.mock.restore();}
});
