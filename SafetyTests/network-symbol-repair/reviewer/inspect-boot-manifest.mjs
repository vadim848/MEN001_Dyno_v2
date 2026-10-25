import fs from 'node:fs';
import assert from 'node:assert/strict';
const base='SafetyTests/network-symbol-repair',read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const before=read('SafetyTests/BOOT_PREFLIGHT_SOURCE_MANIFEST.json'),after=read(`${base}/tester/proposal/BOOT_PREFLIGHT_SOURCE_MANIFEST.json`),layer=read(`${base}/tester/proposal/NETWORK_SYMBOL_REPAIR_LAYER.json`),plan=read(`${base}/architect/SYMBOL_PLAN.json`).plan;
const normalized=structuredClone(after.inventory),old=before.inventory;
const globals=new Map(plan.filter(p=>p.mechanism==='reuse-sgvl-symbol').flatMap(p=>p.targets.map(t=>[t,p.existingGlobal[0]])));
const aliasTargets=new Map(plan.filter(p=>p.mechanism!=='reuse-sgvl-symbol').flatMap(p=>p.targets.map(t=>[t,p])));
const newIds=new Map(layer.newSymbols.map(s=>[s.name,s.id]));
const removals=layer.removedWires;
const oldBlocks=new Map(old.blocks.map(b=>[b.path,b]));
for(const b of normalized.blocks){const prior=oldBlocks.get(b.path);assert.ok(prior);
 for(const p of b.inputs){const q=prior.inputs.find(q=>q.path===p.path);assert.ok(q);
  const removed=removals.filter(e=>e.to===p.path);if(removed.length){assert.equal(removed.length,1);assert.deepEqual(q.sources,[removed[0].from]);assert.deepEqual(p.sources,[]);p.sources=q.sources;
   if(globals.has(p.path)){const g=globals.get(p.path);assert.equal(p.globals.length,1);assert.equal(p.globals[0].variableId,g.variableId);assert.equal(p.globals[0].lastKnownPath,g.lastKnownPath);p.globals=q.globals;}
   else {const a=aliasTargets.get(p.path),id=a.mechanism==='new-sal-symbol'?newIds.get(a.symbolName):a.existingAlias[0].Id;assert.deepEqual(p.aliasTargets,[...q.aliasTargets,id]);p.aliasTargets=q.aliasTargets;}
  }
 }
 for(const p of b.outputs){const q=prior.outputs.find(q=>q.path===p.path);assert.ok(q);const removed=removals.filter(e=>e.from===p.path).map(e=>e.to);assert.deepEqual(p.targets,q.targets.filter(t=>!removed.includes(t)));p.targets=q.targets;
  const a=plan.find(a=>a.from===p.path&&a.mechanism==='new-sal-symbol');if(a){assert.deepEqual(p.aliasSources,[...q.aliasSources,newIds.get(a.symbolName)]);p.aliasSources=q.aliasSources;}
 }
}
function normalizeAliases(list,prior){for(const p of plan.filter(p=>p.mechanism==='reuse-sal-symbol')){const v=list.find(v=>v.id===p.existingAlias[0].Id),q=prior.find(v=>v.id===p.existingAlias[0].Id);assert.deepEqual(v.targetPorts,[...q.targetPorts,...p.targets]);v.targetPorts=q.targetPorts;}}
normalizeAliases(normalized.aliases,old.aliases);normalizeAliases(normalized.outwardOutputs,old.outwardOutputs);
for(const a of layer.newSymbols){const at=normalized.aliases.findIndex(v=>v.id===a.id);assert.ok(at>=0);assert.deepEqual(normalized.aliases[at],{name:a.name,id:a.id,sourcePorts:[a.from],targetPorts:a.targets,groupPorts:[]});normalized.aliases.splice(at,1);}
const addedReaders=normalized.globalReaders.filter(r=>globals.has(r.port));assert.equal(addedReaders.length,6);
normalized.globalReaders=normalized.globalReaders.filter(r=>!globals.has(r.port));
for(const p of plan.filter(p=>p.mechanism==='reuse-sgvl-symbol')){const v=normalized.globalDeclarations.find(v=>v.attributes.Id===p.existingGlobal[0].variableId),q=old.globalDeclarations.find(v=>v.attributes.Id===p.existingGlobal[0].variableId),target=v.usageIndices.find(u=>u.role==='TargetUsages'),prior=q.usageIndices.find(u=>u.role==='TargetUsages');const added=addedReaders.filter(r=>p.targets.includes(r.port));assert.deepEqual(target.ports,[...prior.ports,...p.targets.map(t=>added.find(r=>r.port===t).portId)]);target.ports=prior.ports;}
assert.deepEqual(normalized,old,'BOOT descriptive inventory changes restricted to approved representation layer');
assert.equal(after.normalization,before.normalization);assert.equal(after.rawLocalEvidenceSha256.runtime,before.rawLocalEvidenceSha256.runtime);assert.equal(after.normalizedSha256.runtime,before.normalizedSha256.runtime);
const result={status:'PASS',source:'independent old-manifest plus approved representation ledger normalization',sal:after.rawLocalEvidenceSha256.sal,sgvl:after.rawLocalEvidenceSha256.sgvl};
fs.writeFileSync(`${base}/reviewer/BOOT_MANIFEST_INSPECTION.json`,JSON.stringify(result,null,2)+'\n');console.log(result);

