import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {inspectNativeSalStructure} from '../../../src/sal-native-structure.js';
import {parseSalFile} from '../../../src/sal-parser.js';
import {createRndDownFixture} from './fixture.mjs';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ref=new URL('../../../../../MEN001_Dyno/MEN001_Dyno/Safety_Dyno/',import.meta.url),cur=new URL('../../../../MEN001_Dyno/Safety_Dyno/',import.meta.url);
const identities=[];for(const [label,base]of [['reference',ref],['canonical',cur]]){const sal=new URL('TwinSafeGroup1/TwinSafeGroup1.sal',base),gvl=new URL('GVLs/GVL1.sgvl',base);assert.equal(inspectNativeSalStructure(fs.readFileSync(sal,'utf8')).status,'PASS');const m=parseSalFile(sal,{bindingMode:'current',sgvlPath:gvl});assert.equal(m.bindingAudit.status,'PASS');identities.push({label,sal:sha(sal),gvl:sha(gvl)});}
assert.equal(identities[1].sal,'34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b');
const both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false};
export function prefix(bypass=true,{delay=10500,followingDelay=0,feedbackOff=true}={}){
const x=createRndDownFixture(),r=x.r,changes=[],critical=[],hash=crypto.createHash('sha256');let count=0,firstMid,firstEnd;const previous=new Map(),baseEval=r.evaluate.bind(r);
r.evaluate=(b,dt)=>{const before={Safe:r.get('b_Step1'),Run:r.get('b_Step3')},ins=b.inputs.filter(p=>x.demanded.has(p.path)).map(p=>({path:p.path,id:p.Id,value:r.read(p),sources:p.sources,globals:p.globals.map(g=>({id:g.variableId,name:g.resolvedName}))}));const oldQ=r.memory.get(b.path)?.value;baseEval(b,dt);const t=x.clock.timeMs+dt,after={Safe:r.get('b_Step1'),Run:r.get('b_Step3')};
const outputs=b.outputs.map(p=>({path:p.path,id:p.Id,value:r.get(p.path),globals:p.globals.map(g=>g.resolvedName)}));
const e={t,block:b.path,order:b.orderOfExecution,oldQ,before,after,inputs:ins,outputs};
const text=JSON.stringify(e);hash.update(text+'\n');count++;
const sig=JSON.stringify(outputs.map(p=>p.value));if(previous.get(b.path)!==sig){changes.push(e);previous.set(b.path,sig);}
if(t>16320&&['//Network3/FBRs1','//Network3/FBRs3','//Network12/FBAnd15','//Network12/FBAnd6','//Network12/FBDecouple2','//Network3/FBDecouple1','//Network1/FBRs1','//Network1/FBRs2','//Network1/FBAndUnlockHold'].includes(b.path))critical.push(e);
if(after.Safe&&after.Run&&!firstMid)firstMid=e;
};
const scan=r.scan.bind(r);r.scan=dt=>{scan(dt);if(r.get('b_Step1')&&r.get('b_Step3')&&!firstEnd)firstEnd={t:x.clock.timeMs+dt,Safe:true,Run:true,outSafe:r.get('out_Step1'),outRun:r.get('out_Step3'),Armed:r.get('out_Safety_Armed'),lv:r.get('out_LV_C1'),hv:r.get('out_HV_C2'),sto1:r.get('STO_DR1'),sto2:r.get('STO_DR2'),unlock:r.get('out_Door_Unlock_Solonoeid')};return r;};
function wait(k,v,budget=2500){const end=x.clock.timeMs+budget;while(x.get(k)!==v&&x.clock.timeMs<end)x.sample();if(x.get(k)!==v)throw Error('Preparation '+k+'='+v+' unavailable');return x.clock.timeMs;}
const marks={};let error;
try{x.sample(both);x.advance(1000);wait('lv',true);x.sample({in_LV_C1_FBK:true});wait('b_Step_RnD',true);marks.rnd=x.clock.timeMs;x.sample(off);x.advance(2100);x.sample({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:false});x.advance(10);marks.green=x.sample({in_Reset_PB:true});x.advance(500);wait('SG',true);wait('lv',false);marks.plc=x.sample({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true,in_HV_C2_FBK:true,in_HV_Healthy_FBK:true,in_STO_DR1_FBK:false,in_STO_DR2_FBK:false});wait('hv',true);marks.bypass=x.sample({inPLC_BypassC1C2:bypass});x.advance(delay);marks.good=x.sample({in_HV_Healthy_FBK:false,in_LV_Healthy_FBK:false});marks.confirm=wait('confirmRun',true);x.advance(followingDelay);if(feedbackOff)marks.off=x.sample({in_HV_C2_FBK:false,in_LV_C1_FBK:false});}
catch(e){error=e.message;}
return{x,r,finish(extra=250){if(!error)x.advance(extra);assert.deepEqual(x.unbound(),[]);return{bypass,delay,followingDelay,feedbackOff,error,marks,firstMid,firstEnd,changedEvents:changes,critical,stream:{events:count,sha256:hash.digest('hex')},scope:x.scope,protocol:x.protocolWrites,unresolvedDemanded:x.unbound(),runtimeUnsupported:[...r.unsupported],limits:[...r.limitations]};}};
}
if(process.argv[1]?.endsWith('independent-reproduce.mjs')){const rows=[];for(const b of [false,true]){const row=prefix(b).finish();rows.push(row);console.log(b,row.error??row.firstEnd??'no overlap');}fs.writeFileSync(new URL('INDEPENDENT_REPRODUCE.json',import.meta.url),JSON.stringify({identities,method:'Actual producer closure extended to status/Unlock, no poststart memory/phase writes. Full native preflight before parse. Same read-only shared adapter, independent instrumentation/observations. Initial declared Safe/seven inactive N4 conditional; no fullBOOT proof.',rows},null,2)+'\n');assert.equal(sha(new URL('TwinSafeGroup1/TwinSafeGroup1.sal',cur)),identities[1].sal);}
