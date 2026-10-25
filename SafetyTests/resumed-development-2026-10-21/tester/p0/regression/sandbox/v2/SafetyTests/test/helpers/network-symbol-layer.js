import assert from 'node:assert/strict';
const blocks=m=>m.networks.flatMap(n=>n.blocks),ports=m=>blocks(m).flatMap(b=>[...b.inputs,...b.outputs]),sort=x=>[...x].sort();
// Read-only identity resolver for representation assertions. Never edits parsed
// sources/targets, audit objects, selected execution model or runtime values.
export function resolveSymbolSources(model,input){
 assert.equal(model.bindingAudit?.status,'PASS','full audit before resolver');
 const native=blocks(model).flatMap(b=>b.inputs).find(p=>p.path===input.path&&p.Id===input.Id);assert.equal(input,native,'resolver requires actual parsed input identity');
 const outputs=blocks(model).flatMap(b=>b.outputs),aliases=model.variables.filter(v=>v.targetPorts.includes(input.path));
 assert.ok(input.sources.length<=1&&input.globals.length<=1&&aliases.length<=1,'ambiguous binding cardinality');
 assert.ok(Number(input.sources.length>0)+Number(input.globals.length>0)+Number(aliases.length>0)<=1,'competing binding mechanisms');
 if(input.sources.length){assert.ok(outputs.some(p=>p.path===input.sources[0]),'direct producer unresolved');return [...input.sources];}
 if(aliases.length){const v=aliases[0];assert.ok(v.sourcePorts.length<=1,'multiple alias writers');if(!v.sourcePorts.length){assert.ok(v.alias||v.groupPorts.length,'unresolved internal symbol producer');return [];}
  assert.ok(outputs.some(p=>p.path===v.sourcePorts[0]),'alias producer unresolved');return [...v.sourcePorts];}
 if(input.globals.length){const g=input.globals[0],valid=(p,r)=>{const a=model.bindingAudit.globalRefs.filter(a=>a.portId===p.Id&&a.variableId===r.variableId);assert.equal(a.length,1,'GUID-backed audited reference');assert.equal(a[0].qualified,r.lastKnownPath,'qualified GUID namespace');assert.equal(a[0].name,r.resolvedName,'resolved GUID name');};valid(input,g);
  const writers=outputs.filter(p=>p.globals.some(r=>r.variableId===g.variableId));assert.equal(writers.length,1,'global single resolved writer');for(const p of writers)for(const r of p.globals.filter(r=>r.variableId===g.variableId))valid(p,r);return writers.map(p=>p.path);}
 return [];
}
export function assertNetworkSymbolLayer(model,layer){
 assert.equal(layer.version,'network-symbol-repair-24-v1');assert.equal(model.bindingAudit.status,'PASS');assert.equal(layer.removedWires.length,24);assert.equal(layer.preservedLocalWires.length,319);
 assert.deepEqual(sort(model.bindingAudit.edges.map(e=>e.from+'->'+e.to)),sort(layer.preservedLocalWires.map(e=>e.from+'->'+e.to)),'all319literal local native wire pairs preserved');
 for(const e of model.bindingAudit.edges)assert.equal(e.from.split('/')[2],e.to.split('/')[2],'no graphical cross-network wires');
 const effective=new Set(model.bindingAudit.edges.map(e=>e.from+'->'+e.to));for(const b of blocks(model))for(const p of b.inputs)for(const source of resolveSymbolSources(model,p))effective.add(source+'->'+p.path);
 assert.deepEqual(sort(effective),layer.baselineEffectiveEdges,'full471effective dependency graph equals approved pre-conversion source');
 assert.equal(model.variables.length,75);assert.equal(new Set(model.variables.map(v=>v.name)).size,75);
 for(const v of model.variables)assert.ok(v.sourcePorts.length<=1,'symbol writer uniqueness '+v.name);
 for(const symbol of layer.newSymbols){const v=model.variables.find(v=>v.id===symbol.id);assert.ok(v,'planned ordinary symbol identity');assert.equal(v.name,symbol.name);assert.equal(v.alias,null);assert.deepEqual(v.sourcePorts,[symbol.from]);assert.deepEqual(sort(v.targetPorts),sort(symbol.targets));assert.deepEqual(v.groupPorts,[]);}
 assert.equal(layer.newSymbols.length,11);assert.equal(layer.aliasAdditions.length,2);assert.equal(layer.globalAdditions.length,6);
 for(const [name,,target,targetId]of layer.globalAdditions){const p=ports(model).find(p=>p.Id===targetId);assert.equal(p.path,target);assert.equal(p.sources.length,0);assert.equal(p.globals.length,1);assert.equal(p.globals[0].resolvedName,name);assert.deepEqual(resolveSymbolSources(model,p),[layer.removedWires.find(e=>e.to===target).from]);}
}
