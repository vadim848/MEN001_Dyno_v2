import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseSalFile} from '../../../src/sal-parser.js';
const here=new URL('./',import.meta.url),repo=new URL('../../../../',here);
const old=parseSalFile(new URL('MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',repo));
const now=parseSalFile(new URL('TwinSafeGroup1.sal',here),{bindingMode:'current',sgvlPath:new URL('GVL1.sgvl',here)});
const rows=m=>m.networks.flatMap(n=>n.blocks),previous=rows(old),current=rows(now),lookup=new Map(current.map(b=>[b.path,b]));
const expected=JSON.parse(fs.readFileSync(new URL('../../../SAFE_RUN_GESTURE_COUNTED_PLAN.json',here))).downEpisodeOwnerCandidateV2.final;
assert.equal(now.bindingAudit.status,'PASS');assert.equal(current.length,expected);
assert.deepEqual(current.map(b=>b.orderOfExecution).sort((a,b)=>a-b),Array.from({length:expected},(_,i)=>i+1));
const stripOrder=b=>({...b,orderOfExecution:undefined});
for(const path of ['//Network6/FBTon2','//Network6/FBAnd24','//Network6/FBAnd23'])assert.deepEqual(stripOrder(lookup.get(path)),stripOrder(previous.find(b=>b.path===path)),path);
for(const b of previous.filter(b=>b.path.startsWith('//Network6/')))assert.deepEqual(stripOrder(lookup.get(b.path)),stripOrder(b),'entire Run branch '+b.path);
for(const v of old.variables.filter(v=>v.name.startsWith('inPLC_')))assert.deepEqual(now.variables.find(n=>n.id===v.id),v,'PLC alias binding '+v.name);
const manifest=JSON.parse(fs.readFileSync(new URL('../../../SAFE_RUN_GESTURE_COUNTED_PLAN.json',here))).downEpisodeOwnerCandidateV2.ordering.manifest;
for(const row of manifest)assert.equal(lookup.get(row.kind==='new'?'//SafeResumption/'+row.path:row.path)?.orderOfExecution,row.order,'accepted order manifest '+row.path);
const finish=lookup.get('//RndPhysicalCompact/GATE_020'),oldFinish=previous.find(b=>b.path===finish.path);
for(let i=0;i<4;i++)assert.deepEqual(finish.inputs[i],oldFinish.inputs[i],'original FinishUp input'+i);
assert.deepEqual(finish.inputs[4].sources,['//SafeResumption/RND_SCOPE/AndOut']);
assert.equal(finish.inputs[4].deactivate1,'Break Contact (NC)');
assert.deepEqual(lookup.get('//RndPhysicalCompact/STATE_SU').inputs.find(p=>p.name==='Set').sources,['//RndPhysicalCompact/GATE_020/AndOut']);
assert.deepEqual(lookup.get('//RndPhysicalCompact/GATE_030').inputs.find(p=>p.name==='OrIn3').sources,['//RndPhysicalCompact/GATE_020/AndOut']);
for(const b of previous)if(lookup.has(b.path))assert.deepEqual(lookup.get(b.path).parameters,b.parameters,b.path+' timer/parameters unchanged');
const retained=previous.filter(b=>lookup.has(b.path)&&b.path!=='//Network2/FBAnd4').sort((a,b)=>a.orderOfExecution-b.orderOfExecution);
assert.deepEqual(retained.map(b=>b.path),retained.toSorted((a,b)=>lookup.get(a.path).orderOfExecution-lookup.get(b.path).orderOfExecution).map(b=>b.path));
const evidence={status:'PASS',blockCount:expected,bindingAudit:'PASS',checks:['contiguous order','exact accepted order manifest including PLC chronology','retained relative order except declared And4 move','all retained parameters exact','entire Network6 Run graph port identities and bindings unchanged','all inPLC alias bindings unchanged','retained FinishUp four inputs exact plus direct RND_SCOPE input5 and current SU/CSet fanouts'],limits:['No native build CRC or hardware validation','No lifecycle reachability claim']};
fs.writeFileSync(new URL('invariants.json',here),JSON.stringify(evidence,null,2));console.log(evidence);



