import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseSalFile} from '../../../src/sal-parser.js';
import {SalRuntime} from '../../../src/sal-runtime.js';
const here=new URL('./',import.meta.url),oldbase=new URL('../../safe-resumption/',here);
const load=b=>parseSalFile(new URL('TwinSafeGroup1.sal',b),{bindingMode:'current',sgvlPath:new URL('GVL1.sgvl',b)}),old=load(oldbase),now=load(here),blocks=m=>m.networks.flatMap(n=>n.blocks),get=(m,p)=>blocks(m).find(b=>b.path===p),R='//RndPhysicalCompact/';
assert.equal(blocks(now).some(b=>b.path===R+'GATE_019'),false);
const old19=get(old,R+'GATE_019'),old23=get(old,R+'GATE_023'),new23=get(now,R+'GATE_023');
assert.equal(old.bindingAudit.edges.filter(e=>e.from===R+'GATE_019/OrOut').length,1);assert.equal(old.bindingAudit.edges.find(e=>e.from===R+'GATE_019/OrOut').to,R+'GATE_023/AndIn4');assert.equal(old19.outputs[0].globals.length,0);assert.equal(old.variables.some(v=>v.sourcePorts.includes(old19.outputs[0].path)),false);
for(let i=0;i<3;i++)assert.deepEqual(new23.inputs[i],old23.inputs[i]);
for(const [index,name,portId]of [[3,'GREEN','0a0b232e-ab7b-cfbf-2a10-4ab903ba3688'],[4,'BLUE','b4dcc910-dc3c-e114-3712-24b37eecfd07']]){assert.equal(new23.inputs[index].Id,portId);assert.deepEqual(new23.inputs[index].sources,[R+name+'/TonOut']);assert.equal(new23.inputs[index].deactivate1,'Make Contact (NO)');}
assert.ok(get(now,R+'GREEN').orderOfExecution<new23.orderOfExecution&&get(now,R+'BLUE').orderOfExecution<new23.orderOfExecution);
function drive(r,p,value){if(p.sources.length)r.values.set(p.sources[0],value);else if(p.globals.length)r.setInputs({[p.globals[0].resolvedName]:value});else{const v=r.variableTargets.get(p.path);if(v)r.setInputs({[v]:value});else r.values.set(p.path,value);}}
let cases=0;
for(let bits=0;bits<32;bits++){
 const a=new SalRuntime({...old,networks:[{blocks:[old19,old23]}]},{unconnectedInput:false}),b=new SalRuntime({...now,networks:[{blocks:[new23]}]},{unconnectedInput:false});
 for(const r of [a,b]){r.values.set(R+'GREEN/TonOut',!!(bits&1));r.values.set(R+'BLUE/TonOut',!!(bits&2));}
 for(let i=0;i<3;i++){drive(a,old23.inputs[i],!!(bits&(4<<i)));drive(b,new23.inputs[i],!!(bits&(4<<i)));}
 a.scan();b.scan();assert.equal(b.get(new23.outputs[0].path),a.get(old23.outputs[0].path),'DeMorgan tuple'+bits);cases++;
}
for(const path of [R+'STATE_SG','//SafeResumption/SG_OWNER_SET']){const a=get(old,path),b=get(now,path);for(const role of ['inputs','outputs'])assert.deepEqual(b[role].map(p=>({name:p.name,sources:p.sources,globals:p.globals.map(g=>({id:g.variableId,name:g.resolvedName})),channel:p.channelInterface,contact:p.deactivate1})),a[role].map(p=>({name:p.name,sources:p.sources,globals:p.globals.map(g=>({id:g.variableId,name:g.resolvedName})),channel:p.channelInterface,contact:p.deactivate1})),path+' SG exact arbitrary flags');}
const owner=get(now,'//SafeResumption/RND_DOWN_STEP2_OWNER'),power=get(now,'//Network5/FBAnd1');assert.ok(get(now,'//Network3/FBRs2').orderOfExecution<owner.orderOfExecution&&owner.orderOfExecution<power.orderOfExecution);assert.deepEqual(owner.inputs.find(p=>p.name==='Set').sources,['//Network12/FBDecouple1/DecOut3']);assert.equal(owner.inputs.find(p=>p.name==='Reset').globals[0].resolvedName,'b_Step2');assert.equal(owner.inputs.find(p=>p.name==='Reset').deactivate1,'Make Contact (NO)');assert.deepEqual(power.inputs[3].sources,[owner.path+'/RsOut']);assert.equal(power.inputs[3].deactivate1,'Make Contact (NO)');
const report={status:'PASS',deMorganActualNativeCombinationalCases:cases,sg:'exact Set/Reset/polarities/source IDs versus frozen64fec; arbitrary phase flags require no onehot assumption',ownerOrder:[get(now,'//Network3/FBRs2').orderOfExecution,owner.orderOfExecution,power.orderOfExecution],limits:['combinational component proof, not reachability','no timing or phase policy invented']};fs.writeFileSync(new URL('exact-proof.json',here),JSON.stringify(report,null,2));console.log(report);
