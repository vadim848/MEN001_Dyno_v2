import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parseSalFile} from '../../src/sal-parser.js';
import {readBindingXml} from '../../src/sal-binding-validator.js';
import {effectiveEstopInputs} from '../../src/estop-native-pairs.js';
const root=path.resolve(import.meta.dirname,'../../..');
const sal=path.join(import.meta.dirname,'baseline/TwinSafeGroup1.sal');
const gvl=path.join(import.meta.dirname,'baseline/GVL1.sgvl');
const candidate=path.resolve(process.argv[2]),candidateGvl=path.resolve(process.argv[3]);
const hash=x=>crypto.createHash('sha256').update(fs.readFileSync(x)).digest('hex');
assert.equal(hash(sal),'b7096fa3cf7349ea0be08f347180deb071a0f6b75612c4e5c8a7f45cf0557161');
assert.equal(hash(gvl),'4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5');
assert.deepEqual(fs.readFileSync(candidateGvl),fs.readFileSync(gvl));
const planFile=path.resolve(import.meta.dirname,'../architect/MINIMAL_LOAD_REPAIR_PLAN.json');
const plan=JSON.parse(fs.readFileSync(planFile));
const b=fs.readFileSync(sal,'utf8'),c=fs.readFileSync(candidate,'utf8');
let expected=b,count=0;
expected=expected.replace(/<inPort\b[^>]*>/g,tag=>{
 const id=tag.match(/\bId="([^"]+)"/)?.[1];
 for(const r of plan.exactRemovals.filter(r=>r.portId===id)){
  const token=`${r.attribute}="${r.value}"`;
  assert.equal(tag.split(token).length,2,`${id} exact attribute exists once`);
  tag=tag.replace(token,'');count++;
 }return tag;
});
assert.equal(count,143);assert.equal(c,expected,'entire candidate bytes equal baseline minus exact approved attributes');
const before=parseSalFile(sal,{bindingMode:'current',sgvlPath:gvl});
const after=parseSalFile(candidate,{bindingMode:'current',sgvlPath:candidateGvl});
assert.deepEqual(after.bindingAudit,before.bindingAudit,'whole bindings/aliases/wrappers/canonical edges identical');
const blocks=m=>m.networks.flatMap(n=>n.blocks),bb=blocks(before),cb=blocks(after);
assert.equal(bb.length,254);assert.equal(cb.length,254);
const normalized=structuredClone(before);
for(const block of blocks(normalized))for(const p of block.inputs)for(const r of plan.exactRemovals.filter(r=>r.portId===p.Id))delete p[r.attribute];
normalized.file=after.file; assert.deepEqual(after,normalized,'entire parsed graph equals exact attribute-layer expected graph');
let boolChecks=0,activePorts=0,pairedChannels=0;
for(let i=0;i<bb.length;i++){
 const a=bb[i],z=cb[i];
 if(a.functionName==='safeEstop'){
  const effective=b=>effectiveEstopInputs(b).map(e=>({port:e.port.Id,master:e.master.Id,channel:e.channel,contact:e.contact,inverted:e.inverted})); assert.deepEqual(effective(z),effective(a));
  pairedChannels+=effectiveEstopInputs(a).length;
 }
 for(let j=0;j<a.inputs.length;j++){
  const p=a.inputs[j],q=z.inputs[j];
  if(['Deactivated','Both Deactivated'].includes(p.channelInterface))continue;
  // Paired ESTOP contact semantics are separately compared above; Restart is direct.
  if(a.functionName==='safeEstop'&&p.name!=='Restart')continue;
  activePorts++;
  for(const raw of [false,true]){
   assert.equal(p.deactivate1==='Make Contact (NO)'?!raw:raw,q.deactivate1==='Make Contact (NO)'?!raw:raw,p.path);boolChecks++;
  }
 }
}
const walk=n=>[n,...n.children.flatMap(walk)];
function invalid(xml){return walk(readBindingXml(xml)).filter(n=>n.tag==='inPort').flatMap(n=>{
 const m=n.attr.channelInterface??'',bad=[];
 const first=['Activated','Single-Channel 1 Activated','Single-Channel Both Activated','Two-Channel'].includes(m);
 const second=['Single-Channel 2 Activated','Single-Channel Both Activated','Two-Channel'].includes(m);
 for(const [attr,allowed]of [['deactivate1',first],['deactivate2',second]])if(n.attr[attr]&&!allowed)bad.push([n.attr.Id,attr,n.attr[attr]]);
 return bad;
});}
assert.equal(invalid(b).length,143);assert.deepEqual(invalid(c),[]);
const reference=path.resolve(root,'../MEN001_Dyno/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal');
assert.equal(hash(reference),'efddc60b1263144ae73b3d5184158100ec09c4de739dc8919309ef7b1b0dc334');
assert.deepEqual(invalid(fs.readFileSync(reference,'utf8')),[],'same contact-context predicates accept the exact reference source');
const report={status:'PASS software serialization-only equivalence',sourceSha256:hash(sal),candidateSha256:hash(candidate),sgvlSha256:hash(candidateGvl),planSha256:hash(planFile),exactAttributeRemovals:count,blocks:bb.length,ports:before.bindingAudit.portCount,parameters:bb.flatMap(b=>b.parameters).length,wholeBindingAudit:after.bindingAudit.status,activePorts,rawBooleanTruthTableChecks:boolChecks,pairedEffectiveChannelsCompared:pairedChannels,nativeInvalidAttributesBefore:invalid(b).length,nativeInvalidAttributesAfter:0,limits:['Native opening separately owned by editor; not verified by this script.','Boolean equivalence under existing runtime interpretations, not hardware validation.','Exact full-file delta protects IDs, order, timers, active settings, wiring, aliases and non-port metadata.']};
fs.writeFileSync(path.join(import.meta.dirname,'INDEPENDENT_RESULTS.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
