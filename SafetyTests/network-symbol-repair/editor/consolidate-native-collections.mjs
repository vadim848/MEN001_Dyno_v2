import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {readBindingXml,validateSalBindings} from '../../src/sal-binding-validator.js';
const base='SafetyTests/network-symbol-repair/editor';
const input=`${base}/candidate/TwinSafeGroup1.sal`,gvlPath=`${base}/candidate/GVL1.sgvl`;
const before=fs.readFileSync(input,'utf8'),gvl=fs.readFileSync(gvlPath,'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
assert.equal(sha(before),'3e27fa82b90d3dbbdc3ba191fd65364a3e08cac1ed0c17455006fdce1413371d');
const walk=n=>[n,...n.children.flatMap(walk)];const changed=[];let sal=before;
for(const variable of walk(readBindingXml(before)).filter(n=>n.tag==='variable')){
 for(const role of variable.children.filter(n=>['sourceUsages','targetUsages'].includes(n.tag)&&n.children.length>1)){
  const relation=role.tag==='sourceUsages'?'variableHasSourceUsages':'variableHasTargetUsages';
  assert(role.children.every(n=>n.tag===relation));
  const variableRe=new RegExp(`<variable\\b[^>]*Id="${variable.attr.Id}"[^>]*>[\\s\\S]*?</variable>`);
  const original=sal.match(variableRe)[0];
  const roleXml=original.match(new RegExp(`<${role.tag}>[\\s\\S]*?</${role.tag}>`))[0];
  const collections=[...roleXml.matchAll(new RegExp(`<${relation}\\b[^>]*>[\\s\\S]*?</${relation}>`,'g'))].map(m=>m[0]);
  assert.equal(collections.length,role.children.length);
  const transferred=collections.slice(1).map(c=>{const m=c.match(/<usages>([\s\S]*?)<\/usages>/);if(m)return m[1];assert(/<usages\s*\/>/.test(c));return '';}).join('');
  const primary=collections[0];assert(primary.includes('</usages>'));
  const amendedPrimary=primary.replace('</usages>',transferred+'</usages>');
  let amendedRole=roleXml.replace(primary,amendedPrimary);for(const collection of collections.slice(1))amendedRole=amendedRole.replace(collection,'');
  sal=sal.replace(original,original.replace(roleXml,amendedRole));
  changed.push({variable:variable.attr.name,variableId:variable.attr.Id,role:role.tag,collectionCountBefore:collections.length,retainedRelationshipId:role.children[0].attr.Id,retiredContainerIds:role.children.slice(1).flatMap(n=>[n.attr.Id,n.children[0].attr.Id]),preservedUsageIds:role.children.flatMap(n=>walk(n).filter(u=>u.tag==='variableUsagesHasUsages'||u.tag==='fbPortUsage').map(u=>u.attr.Id))});
 }
}
assert.equal(changed.length,10);
const beforeAudit=validateSalBindings(before,gvl),afterAudit=validateSalBindings(sal,gvl);assert.deepEqual(afterAudit.errors,[]);
assert.deepEqual(afterAudit,beforeAudit,'Collection consolidation must preserve complete typed binding audit');
const output=`${base}/candidate-native-bindings`;fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(`${output}/TwinSafeGroup1.sal`,sal);fs.writeFileSync(`${output}/GVL1.sgvl`,gvl);
const report={source:input,sourceSha256:sha(before),candidate:`${output}/TwinSafeGroup1.sal`,candidateSha256:sha(sal),sgvlSha256:sha(gvl),reason:'Native singleton relationship collection normalization; preserve every usage record and full typed binding semantics',changed,typedBindingAuditUnchanged:true,crcUntouched:true};
fs.writeFileSync(`${base}/NATIVE_COLLECTION_CONSOLIDATION.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,changed:changed.map(c=>({variable:c.variable,count:c.collectionCountBefore,retired:c.retiredContainerIds.length}))},null,2));
