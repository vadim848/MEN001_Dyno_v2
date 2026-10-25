// Descriptive inventory only: this module makes no capability/acceptance decision.
import {readBindingXml} from './sal-binding-validator.js';
import {effectiveEstopInputs} from './estop-native-pairs.js';
const walk=n=>[n,...n.children.flatMap(walk)];
export function inventoryBootSource(model,salXml,sgvlXml){
 const nodes=walk(readBindingXml(salXml)),gvlNodes=walk(readBindingXml(sgvlXml));
 const byId=new Map(nodes.filter(n=>n.attr?.Id).map(n=>[n.attr.Id,n]));
 const nativeBlocks=nodes.filter(n=>n.attr?.functionName&&n.attr.orderOfExecution);
 const pathOf=n=>{let parent=n.parent;while(parent&&parent.tag!=='Network')parent=parent.parent;return `//${parent.attr.name}/${n.attr.name}`;};
 const blocks=model.networks.flatMap(n=>n.blocks),nativeByPath=new Map(nativeBlocks.map(n=>[pathOf(n),n]));
 const globalWriters=[],globalReaders=[];
 for(const block of blocks)for(const [role,ports]of [['writer',block.outputs],['reader',block.inputs]])for(const port of ports)for(const g of port.globals){
  (role==='writer'?globalWriters:globalReaders).push({port:port.path,portId:port.Id,variableId:g.variableId,name:g.resolvedName,lastKnownPath:g.lastKnownPath});
 }
 const aliases=model.variables.map(v=>({name:v.name,id:v.id,sourcePorts:v.sourcePorts,targetPorts:v.targetPorts,groupPorts:v.groupPorts}));
 return {
  networks:model.networks.map(n=>({id:n.Id,name:n.name,networkName:n.networkName,blocks:n.blocks.map(b=>b.path)})),
  blocks:blocks.map(b=>({path:b.path,attributes:nativeByPath.get(b.path).attr,
   stateful:['safeRs','safeTon','safeEstop'].includes(b.functionName),
   effectiveEstopInputs:b.functionName==='safeEstop'?effectiveEstopInputs(b).map(p=>({port:p.port.path,master:p.master.path,contact:p.contact})):[],
   inputs:b.inputs.map(p=>({path:p.path,attributes:byId.get(p.Id).attr,sources:p.sources,globals:p.globals,aliasTargets:aliases.filter(v=>v.targetPorts.includes(p.path)).map(v=>v.id)})),
   outputs:b.outputs.map(p=>({path:p.path,attributes:byId.get(p.Id).attr,targets:p.targets,globals:p.globals,aliasSources:aliases.filter(v=>v.sourcePorts.includes(p.path)).map(v=>v.id)})),
   parameters:b.parameters.map(p=>byId.get(p.Id).attr)})),
  globalWriters,globalReaders,aliases,
  outwardOutputs:aliases.filter(v=>v.sourcePorts.length&&model.variables.find(a=>a.id===v.id).alias),
  globalDeclarations:gvlNodes.filter(n=>n.tag==='Variable').map(n=>({attributes:n.attr,name:n.children.find(c=>c.tag==='Name')?.text,
   usageIndices:walk(n).filter(c=>c.tag==='SourceUsages'||c.tag==='TargetUsages').map(c=>({role:c.tag,ports:walk(c).filter(p=>p.tag==='ModelElementId').map(p=>p.text)}))})),
  groupDeclarations:nodes.filter(n=>n.tag==='twinSAFEGroupAliasPort').map(n=>n.attr),
  groupBindings:aliases.filter(v=>v.groupPorts.length),
  namespace:readBindingXml(salXml).children[0].attr.xmlns
 };
}
