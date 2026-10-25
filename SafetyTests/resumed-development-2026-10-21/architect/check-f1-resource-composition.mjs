import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir=new URL('./',import.meta.url), read=n=>JSON.parse(fs.readFileSync(new URL(n,dir))), sha=n=>crypto.createHash('sha256').update(fs.readFileSync(new URL(n,dir))).digest('hex');
const f=read('F1_RUN_RECOGNIZER_PLAN.json'),r=read('RESOURCE_EXTENSION10_PLAN.json');
assert.equal(f.source.salSha256,r.source.salSha256);assert.equal(f.source.sgvlSha256,r.source.sgvlSha256);
const retired=new Set(r.retiredNativeBlocks), order=new Map(f.fullOrderedManifest.map(b=>[b.path,b.newOrder]));
const block=p=>p.slice(0,p.lastIndexOf('/')), key=e=>`${e.from}->${e.to}`;
const edges=new Map(f.expectedCanonicalWires.map(e=>[key(e),e]));
const removed=[];for(const e of r.wireRemove){assert(edges.has(key(e)),'Resource deletion absent in F1: '+key(e));removed.push(edges.get(key(e)));edges.delete(key(e));}
const added=[];for(const e of r.wireAdd){assert(!edges.has(key(e)),'Duplicate composed edge '+key(e));edges.set(key(e),e);added.push(e);}
assert([...edges.values()].every(e=>!retired.has(block(e.from))&&!retired.has(block(e.to))));
const age=(p,c)=>p<c?0:1;
const windows=[];
for(const t of r.transformations){const p=order.get(block(t.producer)),q=order.get(t.path);assert(Number.isInteger(p)&&Number.isInteger(q));
  for(const w of t.windows){const c=order.get(block(w.consumer));assert(Number.isInteger(c));const old=t.kind==='relay'?age(p,q)+age(q,c):age(q,c),direct=age(p,c);assert.equal(old,direct,t.path+' '+w.consumer);windows.push({...w,producerOrder:p,retiredOrder:q,consumerOrder:c,oldProducerAge:old,newProducerAge:direct,kind:'existing-reader'});}
  for(const m of t.globalWriterMoves??[])for(const g of f.globalReaderAdd.filter(g=>g.variableId===m.variableId)){const c=order.get(block(g.target));assert(Number.isInteger(c));const old=age(p,q)+age(q,c),direct=age(p,c);assert.equal(old,direct,'F1 new global reader '+g.target);windows.push({kind:'F1-added-reader',variable:m.name,variableId:m.variableId,consumer:g.target,consumerPortId:g.portId,producer:t.producer,producerOrder:p,retiredOrder:q,consumerOrder:c,oldProducerAge:old,newProducerAge:direct,firstScan:c<p&&c<q?'Same preserved global initial value before either writer':'Same current producer value at reader'});}
}
const retained=f.fullOrderedManifest.filter(b=>!retired.has(b.path)).map((b,i)=>({...b,f1Order:b.newOrder,newOrder:i+1}));
assert.equal(retained.length,232);assert.equal(edges.size,287);
const result={status:'COMPOSED DESIGN CHECK PASS; not candidate/native/equivalence acceptance',inputs:{f1:{file:'F1_RUN_RECOGNIZER_PLAN.json',sha256:sha('F1_RUN_RECOGNIZER_PLAN.json')},resource10:{file:'RESOURCE_EXTENSION10_PLAN.json',sha256:sha('RESOURCE_EXTENSION10_PLAN.json')}},source:f.source,resourceRetire: r.retiredNativeBlocks,retainedOrder:retained,wireRemove:removed,wireAdd:added,expectedCanonicalWires:[...edges.values()],windows,expectedCounts:{blocks:232,ports:1937,variables:75,globalRefs:209,wires:287},obligations:['Verify exact realized F1/native hashes before candidate rebase','Keep every F1 owner/Reset global reference and unchanged port metadata','Compare every actual consumer and initialized prior-output value under paired raw histories','Fresh native save/reload and complete geometry/usage/input-rule validation','Independent tester/reviewer acceptance; source untouched']};
fs.writeFileSync(new URL('F1_RESOURCE10_COMPOSITION.json',dir),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,counts:result.expectedCounts,windows:windows.length,newF1Readers:windows.filter(w=>w.kind==='F1-added-reader')},null,2));
