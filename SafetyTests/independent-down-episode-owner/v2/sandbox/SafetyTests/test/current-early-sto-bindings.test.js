import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseSalFile} from '../src/sal-parser.js';
import {readBindingXml,validateSalBindings} from '../src/sal-binding-validator.js';
const source='MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',sgvl='MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl';
const file=new URL('../../'+source,import.meta.url),gvl=fs.readFileSync(new URL('../../'+sgvl,import.meta.url),'utf8'),xml=fs.readFileSync(file,'utf8');
const old=execFileSync('git',['show','2ddafef:'+source],{encoding:'utf8',maxBuffer:4*1024*1024});
const model=parseSalFile(file),all=model.networks.flatMap(n=>n.blocks),get=path=>all.find(b=>b.path===path);
const walk=n=>[n,...n.children.flatMap(walk)],before=walk(readBindingXml(old)),now=walk(readBindingXml(xml));
const manifest=JSON.parse(fs.readFileSync(new URL('../EARLY_STO_NATIVE_MANIFEST.json',import.meta.url)));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
test('EARLYSTO native255 preserves every253 original relative order and parameter, SGVL bytes',()=>{
 assert.equal(model.bindingAudit.status,'PASS');assert.equal(all.length,255);
 assert.deepEqual(all.map(b=>b.orderOfExecution).sort((a,b)=>a-b),Array.from({length:255},(_,i)=>i+1));
 const original=before.filter(n=>n.attr?.functionName&&n.attr.orderOfExecution),actualById=new Map(now.filter(n=>n.attr?.functionName).map(n=>[n.attr.Id,n.attr]));
 assert.equal(original.length,253);
 for(const n of original){const b=actualById.get(n.attr.Id),order=+n.attr.orderOfExecution;assert.ok(b,n.attr.Id);assert.equal(+b.orderOfExecution,order<10?order:order===10?11:order+2,b.name);}
 assert.deepEqual(before.filter(n=>n.tag==='parameterPort').map(n=>n.attr),now.filter(n=>n.tag==='parameterPort').map(n=>n.attr));
 assert.equal(sha(gvl),'06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5');
 assert.equal(gvl.replaceAll('\r\n','\n'),execFileSync('git',['show','2ddafef:'+sgvl],{encoding:'utf8',maxBuffer:4*1024*1024}).replaceAll('\r\n','\n'));
});
test('EARLYSTO exact new native contacts/bindings and all prior canonical edges except two replaced Set edges',()=>{
 const oldEdges=validateSalBindings(old,gvl).edges.map(e=>e.from+'->'+e.to),edges=model.bindingAudit.edges.map(e=>e.from+'->'+e.to),added=[];
 for(const drive of [1,2]){
  const gate=get(`//Network1/FBAndSto${drive}SetPermit`),rs=get(`//Network1/FBRs${drive+2}`),or=get(`//Network1/FBOr${drive===1?8:10}`);
  assert.equal(gate.orderOfExecution,drive===1?10:12);assert.equal(rs.orderOfExecution,drive===1?11:13);
  assert.equal(gate.functionName,'safeAnd');assert.deepEqual(gate.inputs.map(p=>p.channelInterface),[...Array(4).fill('Activated'),...Array(4).fill('Deactivated')]);
  assert.deepEqual(gate.inputs.slice(0,4).map(p=>p.deactivate1),['Break Contact (NC)','Break Contact (NC)','Make Contact (NO)','Break Contact (NC)']);
  assert.deepEqual(gate.inputs[0].sources,[or.outputs[0].path]);assert.deepEqual(gate.inputs[1].sources,['//Network1/FBAndLvCurrentPermit/AndOut']);
  assert.deepEqual(gate.inputs[3].sources,['//Network1/FBAnd1/AndOut']);assert.ok(gate.inputs.every(p=>p.globals.length===0));
  assert.ok(model.variables.find(v=>v.name==='in_Mentee_EStop').targetPorts.includes(gate.inputs[2].path));
  assert.deepEqual(rs.inputs.find(p=>p.name==='Set').sources,[gate.outputs[0].path]);
  assert.deepEqual(or.inputs[2].sources,['//RndPhysicalCompact/STATE_SU/RsOut']);assert.equal(or.inputs[2].channelInterface,'Activated');assert.equal(or.inputs[2].deactivate1,'Break Contact (NC)');
  added.push(`${or.outputs[0].path}->${gate.inputs[0].path}`,`//Network1/FBAndLvCurrentPermit/AndOut->${gate.inputs[1].path}`,`//Network1/FBAnd1/AndOut->${gate.inputs[3].path}`,`${gate.outputs[0].path}->${rs.inputs.find(p=>p.name==='Set').path}`,`//RndPhysicalCompact/STATE_SU/RsOut->${or.inputs[2].path}`);
 }
 const removed=['//Network1/FBOr8/OrOut->//Network1/FBRs3/Set','//Network1/FBOr10/OrOut->//Network1/FBRs4/Set'];
 assert.deepEqual(edges.sort(),[...oldEdges.filter(e=>!removed.includes(e)),...added].sort());assert.equal(new Set(edges).size,edges.length);
});
test('EARLYSTO all old native port attributes preserved except the two approved free OR inputs',()=>{
 const mutable=new Set(['270d8d89-2f99-4e2b-84ac-f4ecadcd4d3c','45bbd24a-adec-4b7e-bfb9-c31d26a9c676']);
 const byId=new Map(now.filter(n=>n.attr?.Id).map(n=>[n.attr.Id,n]));
 for(const n of before.filter(n=>['inPort','outPort'].includes(n.tag))){const actual=byId.get(n.attr.Id);assert.ok(actual);const expected={...n.attr};if(mutable.has(n.attr.Id)){expected.channelInterface='Activated';expected.deactivate1='Break Contact (NC)';}assert.deepEqual(actual.attr,expected,n.attr.Id);}
});
test('EARLYSTO deterministic manifest is source-bound, unique and contains only actual new GUIDs',()=>{
 const red=JSON.parse(fs.readFileSync(new URL('../EARLY_STO_RED_BASELINE.json',import.meta.url)));
 assert.equal(manifest.sourceSha256,red.sha256[source]);assert.equal(manifest.sourceNormalizedSha256,sha(old.replaceAll('\r\n','\n')));assert.equal(manifest.resultSha256,sha(xml));assert.equal(manifest.sgvlSha256,sha(gvl));
 const ids=[...xml.matchAll(/\bId="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 const oldIds=new Set([...old.matchAll(/\bId="([^"]+)"/g)].map(m=>m[1]));
 const newIds=ids.filter(id=>!oldIds.has(id));assert.deepEqual([...newIds].sort(),Object.values(manifest.ids).sort());
 for(const [key,value] of Object.entries(manifest.ids)){const h=sha(manifest.guidNamespace+key),expected=`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;assert.equal(value,expected);}
});
