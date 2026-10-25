import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {createRndDownFixture} from './source-fixture.mjs';
const [salArg,sgvlArg]=process.argv.slice(2);if(!salArg||!sgvlArg)throw Error('Usage: node run.mjs SAL SGVL');
const salPath=path.resolve(salArg),sgvlPath=path.resolve(sgvlArg),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),before={sal:hash(salPath),sgvl:hash(sgvlPath)};
const off={in_Reset_PB:false,in_Relase_Door_PB:false},both={in_Reset_PB:true,in_Relase_Door_PB:true},results=[];
const nc1Only=process.argv.includes('--nc1-only');
function wait(x,key,val,budget=2500){const end=x.clock.timeMs+budget;while(x.get(key)!==val&&x.clock.timeMs<end)x.sample();if(x.get(key)!==val)throw Error('Diagnostic budget exhausted '+key+'='+val);return x.clock.timeMs;}
function enterRnd(x){x.sample(both);x.advance(1000);wait(x,'lv',true);x.sample({in_LV_C1_FBK:true});wait(x,'b_Step_RnD',true);x.sample(off);x.advance(2100);}
function down(x){const first=x.sample({in_Reset_PB:true});x.advance(499);if(x.get('SG'))throw Error('Premature SG');x.sample();wait(x,'SG',true);wait(x,'lv',false);return first;}
function run(id,body,options={}){if(nc1Only&&!id.endsWith('-NC1'))return;const x=createRndDownFixture({salPath,sgvlPath,...options}),checks=[],marks={};const e=(label,actual,expected)=>checks.push({label,actual,expected,status:JSON.stringify(actual)===JSON.stringify(expected)?'PASS':'FAIL'});let error;try{body(x,e,marks);e('No demanded fallback',x.unbound(),[]);}catch(err){error=err.stack;}const status=error?'ERROR':checks.some(c=>c.status==='FAIL')?'FAIL':'PASS';fs.writeFileSync(new URL(id+'.json.gz',import.meta.url),gzipSync(JSON.stringify({id,status,error,checks,marks,scope:x.scope,protocolWrites:x.protocolWrites,frames:x.frames,blockEvents:x.blockEvents})));results.push({id,status,error,checks,marks});console.log(id,status);}
function noEnergy(x,e,from,to=x.clock.timeMs){const frames=x.frames.filter(f=>f.timeMs>=from&&f.timeMs<=to);e('No accepted-down Step2 episode',frames.some(f=>f.signals.b_Step2),false);e('No upward energy replay',frames.some(f=>['lv','hv','lvPermittedSet','hvPermittedSet'].some(k=>f.signals[k])),false);}
for(const history of ['laterOFF','alreadyOFF'])run('healthy-'+history,(x,e,m)=>{
 enterRnd(x);if(history==='alreadyOFF')x.sample({in_LV_C1_FBK:false});m.green=down(x);m.lvOff=x.clock.timeMs;
 if(history==='laterOFF'){x.advance(100);e('FeedbackON blocks healthySafe',x.get('b_Step1'),false);x.sample({in_LV_C1_FBK:false});}
 m.safe=wait(x,'b_Step1',true);e('Safe only after actual commandOFF',m.safe>=m.lvOff&&x.get('lv')===false,true);e('Actual Rnd exited',x.get('b_Step_RnD'),false);wait(x,'SG',false);x.advance(1000);noEnergy(x,e,m.lvOff);x.sample(off);x.advance(2100);noEnergy(x,e,m.lvOff);m.fresh=x.clock.timeMs+1;enterRnd(x);e('Fresh actual Safe→Rnd cycle',x.get('b_Step_RnD'),true);
});
const faults={NC1:{in_ES_NC_1:false},NC2:{in_ES_NC_2:false},Mentee:{in_Mentee_EStop:true},PLC:{in_Estop_PLC:true},External1:{in_InterLock_NC_1:false},External2:{in_InterLock_NC_2:false}},restore={NC1:{in_ES_NC_1:true},NC2:{in_ES_NC_2:true},Mentee:{in_Mentee_EStop:false},PLC:{in_Estop_PLC:false},External1:{in_InterLock_NC_1:true},External2:{in_InterLock_NC_2:true}};
for(const timing of ['firstEligible','RndClearGap'])for(const [fault,inputs]of Object.entries(faults))run(timing+'-'+fault,(x,e,m)=>{
 enterRnd(x);m.green=down(x);m.lvOff=x.clock.timeMs;
 if(timing==='firstEligible')m.fault=x.sample({in_LV_C1_FBK:false,...inputs});
 else{x.sample({in_LV_C1_FBK:false});wait(x,'b_Step_RnD',false);if(x.get('b_Step1'))throw Error('Required RndClear/Safe-notpublished gap unavailable');m.gap=x.clock.timeMs;m.fault=x.sample(inputs);}
 x.advance(20);e('Fault prevents newSafe publication',x.frames.filter(f=>f.timeMs>=m.fault).some(f=>f.signals.b_Step1),false);x.sample(off);x.advance(20);m.restore=x.sample(restore[fault]);x.advance(2100);e('Raw restore withoutRestart no staleSafe completion replay',x.frames.filter(f=>f.timeMs>=m.restore).some(f=>f.signals.completion||f.signals.b_Step1),false);noEnergy(x,e,m.lvOff);
});
for(const initialDischarge of [false,true])run('legacy-'+initialDischarge,(x,e)=>{for(const k of ['setLv','setHv','lvPermittedSet','hvPermittedSet','lv','hv'])e('Ordinary startup '+k,x.get(k),true);e('No down request',x.get('down'),false);},{initialPhase:'b_Step2',initialDischarge});
const after={sal:hash(salPath),sgvl:hash(sgvlPath)};if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Candidate mutated during execution');
fs.writeFileSync(new URL(nc1Only?'RESULTS-NC1.json':'RESULTS.json',import.meta.url),JSON.stringify({salPath,sgvlPath,before,after,totals:Object.fromEntries(['PASS','FAIL','ERROR'].map(s=>[s,results.filter(r=>r.status===s).length])),results},null,2));
