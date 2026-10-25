import {readBindingXml} from './sal-binding-validator.js';
const walk=n=>[n,...n.children.flatMap(walk)];
const ancestor=(n,tag)=>{for(let p=n.parent;p;p=p.parent)if(p.tag===tag)return p;};
// Separate native serialization preflight. The typed full SAL/SGVL binding audit
// still runs unchanged immediately afterward; historical fixtures are untouched.
export function inspectNativeSalStructure(salXml){
 const errors=[];let nodes;try{nodes=walk(readBindingXml(salXml));}catch(e){return{status:'ERROR',errors:[e.message]};}
 function singleton(parent,tag,context){const children=parent.children.filter(n=>n.tag===tag);if(children.length!==1)errors.push(`${context}: ${parent.tag} requires one ${tag}, found ${children.length}`);return children;}
 const variables=nodes.filter(n=>n.tag==='variable');for(const v of variables)for(const[role,relationship]of[['sourceUsages','variableHasSourceUsages'],['targetUsages','variableHasTargetUsages']])for(const r of singleton(v,role,v.attr.name))for(const link of singleton(r,relationship,v.attr.name))for(const usage of singleton(link,'variableUsages',v.attr.name))singleton(usage,'usages',v.attr.name);
 const ports=new Map();for(const p of nodes.filter(n=>['inPort','outPort'].includes(n.tag))){const network=ancestor(p,'Network'),block=ancestor(p,'networkHasFunctionBlocks')?.children[0];if(network&&block)ports.set(`//${network.attr.name}/${block.attr.name}/${p.attr.name}`,p);}
 let crossNetworkWires=0;for(const wire of nodes.filter(n=>n.tag==='wiredLink')){const owner=wire.parent?.parent,moniker=wire.children[0],other=ports.get(moniker?.attr.name);if(!['inPort','outPort'].includes(owner?.tag)||!other){errors.push(`Native wire unresolved owner/endpoint ${wire.attr.Id}`);continue;}const a=ancestor(owner,'Network'),b=ancestor(other,'Network');if(!a||!b||a.attr.Id!==b.attr.Id){crossNetworkWires++;errors.push(`Graphical wire crosses networks ${wire.attr.Id}: ${a?.attr.name} -> ${b?.attr.name}`);}}
 return{status:errors.length?'ERROR':'PASS',errors,counts:{networks:nodes.filter(n=>n.tag==='Network').length,blocks:nodes.filter(n=>n.parent?.tag==='networkHasFunctionBlocks').length,ports:ports.size,variables:variables.length,wires:nodes.filter(n=>n.tag==='wiredLink').length,crossNetworkWires}};
}
export function assertNativeSalStructure(salXml){const result=inspectNativeSalStructure(salXml);if(result.status!=='PASS')throw Error('Native SAL serialization preflight failed before execution:\n'+result.errors.join('\n'));return result;}
