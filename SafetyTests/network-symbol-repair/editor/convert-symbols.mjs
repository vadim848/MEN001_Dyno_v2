import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {readBindingXml,validateSalBindings} from '../../src/sal-binding-validator.js';

// Run from repository root only after the lead authorizes implementation.
const root='SafetyTests/network-symbol-repair';
const sourceSal='MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal';
const sourceGvl='MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl';
const manifest=JSON.parse(fs.readFileSync(`${root}/architect/SYMBOL_PLAN.json`,'utf8'));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
let sal=fs.readFileSync(sourceSal,'utf8'),gvl=fs.readFileSync(sourceGvl,'utf8');
assert.equal(sha(sal),manifest.sourceSha256,'Unexpected SAL baseline');
assert.equal(sha(gvl),'4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5','Unexpected SGVL baseline');
const walk=n=>[n,...n.children.flatMap(walk)];
const ancestor=(n,t)=>{for(let p=n.parent;p;p=p.parent)if(p.tag===t)return p;};
const nodes=walk(readBindingXml(sal));
const ports=new Map(nodes.filter(n=>['inPort','outPort'].includes(n.tag)).map(p=>{
 const b=ancestor(p,'networkHasFunctionBlocks').children[0],n=ancestor(p,'Network');
 return [`//${n.attr.name}/${b.attr.name}/${p.attr.name}`,p];
}));
const newIds=[];
const guid=()=>{const id=crypto.randomUUID();newIds.push(id);return id;};
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function editId(xml,tag,id,edit){
 const re=new RegExp(`<${tag}\\b[^>]*\\bId="${escape(id)}"[^>]*>`,'g');
 const matches=[...xml.matchAll(re)];assert.equal(matches.length,1,`${tag} Id ${id}`);
 const m=matches[0],start=m.index;
 const end=m[0].endsWith('/>')?start+m[0].length:xml.indexOf(`</${tag}>`,start+m[0].length)+tag.length+3;
 assert(end>start,`Closing ${tag}`);
 const before=xml.slice(start,end),after=edit(before);
 assert.notEqual(before,after,`Expected mutation ${tag} ${id}`);
 return xml.slice(0,start)+after+xml.slice(end);
}
function appendElement(xml,tag,child){
 const start=xml.match(new RegExp(`^<${tag}\\b[^>]*>`));assert(start,`Opening ${tag}`);
 if(start[0].endsWith('/>'))return start[0].slice(0,-2)+`>${child}</${tag}>`;
 assert(xml.endsWith(`</${tag}>`));return xml.slice(0,-tag.length-3)+child+`</${tag}>`;
}
function appendRole(xml,tag,child){
 const re=new RegExp(`<${tag}\\b[^>]*(?:/>|>[\\s\\S]*?</${tag}>)`,'g');
 const matches=[...xml.matchAll(re)];assert.equal(matches.length,1,`Unique ${tag}`);
 const m=matches[0];return xml.slice(0,m.index)+appendElement(m[0],tag,child)+xml.slice(m.index+m[0].length);
}
const portUsage=(p,direction)=>`<variableUsagesHasUsages Id="${guid()}"><fbPortUsage Id="${guid()}"><functionBlockPort><fbPortUsageReferencesFunctionBlockPort Id="${guid()}"><${direction}PortMoniker name="${p}" /></fbPortUsageReferencesFunctionBlockPort></functionBlockPort></fbPortUsage></variableUsagesHasUsages>`;
const usageCollection=(role,paths,direction)=>`<${role}Usages><variableHas${role[0].toUpperCase()+role.slice(1)}Usages Id="${guid()}"><variableUsages Id="${guid()}"><usages>${paths.map(p=>portUsage(p,direction)).join('')}</usages></variableUsages></variableHas${role[0].toUpperCase()+role.slice(1)}Usages></${role}Usages>`;
const removedIds=new Set(manifest.plan.flatMap(p=>p.wireIds));assert.equal(removedIds.size,24);
const removed=[];
sal=sal.replace(/<targetFunctionBlockPorts\b[^>]*>[\s\S]*?<\/targetFunctionBlockPorts>/g,container=>{
 let modified=false;
 const result=container.replace(/<wiredLink\b[^>]*>[\s\S]*?<\/wiredLink>/g,wire=>{
  const id=wire.match(/\bId="([^"]+)"/)[1];if(!removedIds.has(id))return wire;
  removed.push(id);modified=true;return '';
 });
 if(modified&&!/<wiredLink\b/.test(result))return '';
 return result;
});
assert.deepEqual([...removed].sort(),[...removedIds].sort());
for(const p of manifest.plan){
 assert(ports.has(p.from));for(const target of p.targets)assert(ports.has(target));
 if(p.mechanism==='reuse-sal-symbol'){
  sal=editId(sal,'variable',p.existingAlias[0].Id,v=>{
   const role=v.match(/<targetUsages\b[^>]*>[\s\S]*?<\/targetUsages>/)[0];
   const amended=appendRole(role,'usages',p.targets.map(t=>portUsage(t,'in')).join(''));
   return v.replace(role,amended);
  });
 }else if(p.mechanism==='new-sal-symbol'){
  const variable=`<safetyApplicationHasVariables Id="${guid()}"><variable Id="${guid()}" name="${p.symbolName}" isLocal="false">${usageCollection('source',[p.from],'out')}${usageCollection('target',p.targets,'in')}</variable></safetyApplicationHasVariables>`;
  assert.equal((sal.match(/<\/variables>/g)||[]).length,1);sal=sal.replace('</variables>',`${variable}</variables>`);
 }else if(p.mechanism==='reuse-sgvl-symbol'){
  const global=p.existingGlobal[0];
  for(const target of p.targets){
   const port=ports.get(target);
   sal=editId(sal,'inPort',port.attr.Id,v=>appendElement(v,'inPort',`<fbPortGlobalVariableReferences><functionBlockPortHasFbPortGlobalVariableReferences Id="${guid()}"><fbPortGlobalVariableReference Id="${guid()}" variableId="${global.variableId}" lastKnownPath="${global.lastKnownPath}" /></functionBlockPortHasFbPortGlobalVariableReferences></fbPortGlobalVariableReferences>`));
  }
  gvl=editId(gvl,'Variable',global.variableId,v=>appendRole(v,'TargetUsages',p.targets.map(t=>`<FbPortUsage Id="${guid()}"><ModelElementId>${ports.get(t).attr.Id}</ModelElementId></FbPortUsage>`).join('')));
 }else throw Error(`Unknown mechanism ${p.mechanism}`);
}
const audit=validateSalBindings(sal,gvl);assert.equal(audit.errors.length,0,JSON.stringify(audit.errors));
assert.equal(new Set(newIds).size,newIds.length);
const out=`${root}/editor/candidate`;fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'TwinSafeGroup1.sal'),sal);
fs.writeFileSync(path.join(out,'GVL1.sgvl'),gvl);
const result={sourceSalSha256:manifest.sourceSha256,sourceGvlSha256:'4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5',candidateSalSha256:sha(sal),candidateGvlSha256:sha(gvl),removedWireIds:removed,newIds,sourceCrcUntouched:true,audit};
fs.writeFileSync(`${root}/editor/CONVERSION.json`,JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,audit:{status:audit.status,errors:audit.errors,warnings:audit.warnings},newIds:newIds.length},null,2));
