import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {parseSalFile} from '../src/sal-parser.js';
import {readBindingXml} from '../src/sal-binding-validator.js';
import {compact,removeCompactGvl,afterEarlyStoOrder} from './helpers/compact-expectations.js';
const sf=new URL('../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url);
const model=parseSalFile(sf),all=model.networks.flatMap(n=>n.blocks),get=path=>all.find(b=>b.path===path);
const gvl=fs.readFileSync(new URL('../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',import.meta.url),'utf8');
const walk=n=>[n,...n.children.flatMap(walk)];
test('RNDCOMPACT full native audit and exact255 block budget/order map',()=>{
 assert.equal(model.bindingAudit.status,'PASS');assert.equal(all.length,255);assert.ok(all.length<=255);
 assert.deepEqual(all.map(b=>b.orderOfExecution).sort((a,b)=>a-b),Array.from({length:255},(_,i)=>i+1));
 for(const row of compact.sequence){const path=row.newPath??row.oldPath,b=get(path);assert.ok(b,path);assert.equal(b.orderOfExecution,afterEarlyStoOrder(row.newOrder),path);}
});
test('RNDCOMPACT every native port/parameter identity and typed producer matches the reviewed graph',()=>{
 for(const planned of compact.blocks){const path=`//${compact.network}/${planned.name}`,b=get(path);assert.ok(b,path);assert.equal(b.functionName,planned.type);
  for(const [role,expected]of [['inputs',planned.nativePorts.inputs],['outputs',planned.nativePorts.outputs]]){
   assert.equal(b[role].length,expected.length,path);
   for(const p of expected){const actual=b[role].find(a=>a.name===p.name);assert.ok(actual);for(const key of ['Id','portNum','objectIndex','varId','filter','portDataType'])assert.equal(actual[key],p[key],`${path}/${p.name}:${key}`);
    if(role!=='inputs')continue;
    if(planned.type==='safeEstop'){
     if(p.name.startsWith('EStopIn'))assert.equal(actual.channelInterface,p.name==='EStopIn1'?'Single-Channel 1 Activated':'Both Deactivated');
     if(p.name.startsWith('EDM')){assert.equal(actual.channelInterface,undefined);assert.equal(actual.deactivate1,undefined);assert.deepEqual(actual.sources,[]);assert.deepEqual(actual.globals,[]);}
    }
    if(!p.active)continue;
    const source=p.bindingSource;
    assert.equal(actual.deactivate1,source.inverted?'Make Contact (NO)':'Break Contact (NC)',`${path}/${p.name} polarity`);
    if(source.kind==='salAliasTargetUsage')assert.ok(model.variables.find(v=>v.id===source.id&&v.name===source.name)?.targetPorts.includes(actual.path),actual.path);
    else if(source.kind?.endsWith('SgvlReference'))assert.deepEqual(actual.globals.map(g=>[g.variableId,g.lastKnownPath]),[[source.id,source.name]],actual.path);
    else assert.deepEqual(actual.sources,[source.path],actual.path);
   }
  }
  assert.deepEqual(b.parameters.map(({targets,sources,globals,...p})=>p),planned.parameters??[]);
 }
});
test('RNDCOMPACT exact canonical graph and integration edges have no bypass/duplicate driver',()=>{
 for(const e of [...compact.canonicalWires,...compact.integration.map(e=>({source:e.newSource,target:e.target}))])assert.equal(model.bindingAudit.edges.filter(w=>w.from===e.source&&w.to===e.target).length,1,`${e.source} -> ${e.target}`);
 for(const e of compact.integration){const path=e.target.slice(0,e.target.lastIndexOf('/')),port=get(path).inputs.find(p=>p.path===e.target);assert.deepEqual(port.sources,[e.newSource]);}
});
test('RNDCOMPACT moved original TON block, port and parameter identities survive; all other old timer values unchanged',()=>{
 const before=spawnSync('git',['show','c69bc32:MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal'],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(before.status,0);
 const oldNodes=walk(readBindingXml(before.stdout)),newNodes=walk(readBindingXml(fs.readFileSync(sf,'utf8')));
 for(const p of oldNodes.filter(n=>n.tag==='parameterPort')){const now=newNodes.find(n=>n.tag==='parameterPort'&&n.attr?.Id===p.attr.Id);assert.deepEqual(now?.attr,p.attr);}
 for(const b of compact.blocks.filter(b=>b.moveExisting)){assert.ok(oldNodes.some(n=>n.attr?.Id===b.id));for(const p of [...b.nativePorts.inputs,...b.nativePorts.outputs])assert.ok(oldNodes.some(n=>n.attr?.Id===p.Id));}
 assert.equal(all.filter(b=>b.functionName==='safeTon').length,21);
});
test('RNDCOMPACT ten new software variables have exact source/target usage indices; all previous declarations unchanged',()=>{
 const nodes=walk(readBindingXml(gvl));for(const d of compact.sgvlDeclarations){const v=nodes.find(n=>n.tag==='Variable'&&n.attr?.Id===d.id);assert.ok(v);assert.equal(v.children.find(c=>c.tag==='Name').text,d.name);
  const uses=role=>walk(v.children.find(n=>n.tag===role)).filter(n=>n.tag==='ModelElementId').map(n=>n.text.trim());
  assert.deepEqual(uses('SourceUsages'),[d.sourcePortId]);assert.deepEqual(uses('TargetUsages'),d.targetPortIds);
 }
 const before=spawnSync('git',['show','c69bc32:MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl'],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(before.status,0);
 const norm=s=>s.replace(/>\s+</g,'><').trim();assert.equal(norm(removeCompactGvl(gvl)),norm(before.stdout));
});
