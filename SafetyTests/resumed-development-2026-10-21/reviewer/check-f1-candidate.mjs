import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {parseSalFile} from '../../src/sal-parser.js';
import {readBindingXml} from '../../src/sal-binding-validator.js';
import {inspectNativeSalStructure} from '../../src/sal-native-structure.js';
const root=new URL('../../../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8'),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(new URL(p,root))).digest('hex');
const planFile='SafetyTests/resumed-development-2026-10-21/architect/F1_RUN_RECOGNIZER_PLAN.json';
assert.equal(hash(planFile),'b52f6b0e440a09ce138ad91e633b2fcd78f431d246a4dbdabc083809a0a08b60');
const p=JSON.parse(read(planFile)),base='SafetyTests/candidates/resumed-f1/native/';
for(const [f,h]of [[p.source.sal,p.source.salSha256],[p.source.sgvl,p.source.sgvlSha256],[p.source.diagram,p.source.diagramSha256]])assert.equal(hash(f),h);
for(const f of [p.source.sal,base+'TwinSafeGroup1.sal'])assert.equal(inspectNativeSalStructure(read(f)).status,'PASS');
const old=parseSalFile(new URL(p.source.sal,root),{bindingMode:'current',sgvlPath:new URL(p.source.sgvl,root)}),neo=parseSalFile(new URL(base+'TwinSafeGroup1.sal',root),{bindingMode:'current',sgvlPath:new URL(base+'GVL1.sgvl',root)});
assert.equal(neo.bindingAudit.status,'PASS');assert.equal(neo.bindingAudit.globalRefs.length,209);
const key=e=>e.from+'|'+e.to+'|'+e.id;assert.deepEqual(neo.bindingAudit.edges.map(key).sort(),p.expectedCanonicalWires.map(key).sort());
const walk=n=>[...(n.attr?[n]:[]),...n.children.flatMap(walk)],a=walk(readBindingXml(read(p.source.sal))),b=walk(readBindingXml(read(base+'TwinSafeGroup1.sal')));
const nativeBlocks=ns=>ns.filter(n=>n.attr.functionName).map(n=>{let net=n.parent;while(net&&net.tag!=='Network')net=net.parent;return{path:'//'+net.attr.name+'/'+n.attr.name,id:n.attr.Id,order:+n.attr.orderOfExecution};}).sort((a,b)=>a.order-b.order);
assert.deepEqual(nativeBlocks(b),p.fullOrderedManifest.map(r=>({path:r.path,id:r.id,order:r.newOrder})));
const oldBs=old.networks.flatMap(n=>n.blocks),newBs=neo.networks.flatMap(n=>n.blocks);
const changed=new Map(p.portAttributeDelta.map(d=>[d.portId,d]));let retainedPorts=0;
const onlyAttrs=x=>Object.fromEntries(Object.entries(x).filter(([k,v])=>typeof v!=='object'&&k!=='path'));
for(const block of oldBs.filter(x=>x.path!==p.retire.path)){
 const n=newBs.find(x=>x.path===block.path);assert(n);assert.equal(n.type,block.type);assert.equal(n.functionName,block.functionName);assert.deepEqual(n.parameters,block.parameters);
 for(const port of [...block.inputs,...block.outputs]){let expected=onlyAttrs(port),delta=changed.get(port.Id);if(delta){for(const[k,v]of Object.entries(delta.after)){if(k==='removeDeactivate1')delete expected.deactivate1;else expected[k]=v;}}const actual=[...n.inputs,...n.outputs].find(x=>x.Id===port.Id);assert(actual);assert.deepEqual(onlyAttrs(actual),expected);retainedPorts++;}
}
const norm=n=>({tag:n.tag,attr:n.attr,text:n.text.trim(),children:n.children.map(norm)});
const nonprogram=ns=>ns.filter(n=>/Usage$/.test(n.tag)&&n.tag!=='fbPortUsage').map(n=>JSON.stringify(norm(n))).sort();assert.deepEqual(nonprogram(b),nonprogram(a));
const byId=new Map(b.filter(n=>n.attr.Id).map(n=>[n.attr.Id,n]));
for(const v of a.filter(n=>n.tag==='variable')){
 const expected=structuredClone(norm(v)),actual=structuredClone(norm(byId.get(v.attr.Id)));
 function strip(node,moves){node.children=node.children.filter(c=>!(c.tag==='variableUsagesHasUsages'&&moves.some(m=>JSON.stringify(c).includes('"name":"'+m.target+'"'))));node.children.forEach(c=>strip(c,moves));}
 strip(expected,p.localReaderRemove);strip(actual,p.localReaderAdd);assert.deepEqual(actual,expected,v.attr.name);
}
const oldRefs=old.bindingAudit.globalRefs.map(r=>({portId:r.portId,variableId:r.variableId,name:r.name,qualified:r.qualified}));
const newRefs=neo.bindingAudit.globalRefs.filter(r=>!p.globalReaderAdd.some(x=>x.portId===r.portId&&x.variableId===r.variableId)).map(r=>({portId:r.portId,variableId:r.variableId,name:r.name,qualified:r.qualified}));assert.deepEqual(newRefs,oldRefs);
for(const x of p.globalReaderAdd)assert.equal(neo.bindingAudit.globalRefs.filter(r=>r.portId===x.portId&&r.variableId===x.variableId).length,1);
const gnorm=n=>({tag:n.tag,attr:Object.fromEntries(Object.entries(n.attr).filter(([k])=>k!=='Crc')),text:n.text.trim(),children:n.children.map(gnorm)});
const ga=gnorm(readBindingXml(read(p.source.sgvl)).children[0]),gb=gnorm(readBindingXml(read(base+'GVL1.sgvl')).children[0]);
function prune(n){n.children=n.children.filter(c=>!(c.tag==='FbPortUsage'&&c.children.some(x=>p.globalReaderAdd.some(y=>y.portId===x.text))));n.children.forEach(prune);}prune(gb);assert.deepEqual(gb,ga);
const report={status:'PASS',candidate:Object.fromEntries(['TwinSafeGroup1.sal','GVL1.sgvl','TwinSafeGroup1.sal.diagram'].map(f=>[f,hash(base+f)])),counts:inspectNativeSalStructure(read(base+'TwinSafeGroup1.sal')).counts,globalRefs:209,exactOrderedNativeIds:242,retainedDataPorts:retainedPorts,retainedParameterRecords:newBs.flatMap(x=>x.parameters).length,nonprogramUsages:nonprogram(b).length,completeSymbols:75,completeGvlRecords:85,limits:'Independent source/delta inspection only; behavioral/native/candidate regression gates remain separate'};
fs.writeFileSync(new URL('F1_STRUCTURE_CHECK.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
