import fs from 'node:fs';
import crypto from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {createRndDownFixture} from '../test/helpers/rnd-down-source.js';
import {createSafeRunFixture,compressFrames} from '../test/helpers/safe-run-source.js';
const off={in_Reset_PB:false,in_Relase_Door_PB:false},both={in_Reset_PB:true,in_Relase_Door_PB:true};
const results=[];
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex');
function run(id,body){const checks=[],notes=[];let x;const e=(label,actual,expected)=>checks.push({label,actual,expected,status:JSON.stringify(actual)===JSON.stringify(expected)?'PASS':'FAIL'});try{x=body(e,notes);results.push({id,status:checks.some(c=>c.status==='FAIL')?'FAIL':notes.some(n=>n.status==='NOT VERIFIED')?'NOT VERIFIED':'PASS',checks,notes,scope:x.scope,protocolWrites:x.protocolWrites,frames:compressFrames(x.frames),blockEvents:x.blockEvents});}catch(err){results.push({id,status:'ERROR',error:err.stack,checks,notes});}console.log(id,results.at(-1).status);}
function wait(x,key,value,budget=2000){const end=x.clock.timeMs+budget;while(x.get(key)!==value&&x.clock.timeMs<end)x.sample();if(x.get(key)!==value)throw Error('Fixture preparation missing '+key+'='+value+'; diagnostic budget '+budget);return x.clock.timeMs;}
function enterRnd(x){x.sample(both);x.advance(1000);wait(x,'lv',true);x.sample({in_LV_C1_FBK:true});wait(x,'b_Step_RnD',true);x.sample(off);x.advance(2100);}
for(const history of ['feedback-later-off','already-off'])run('L-'+history,(e,notes)=>{
 const x=createRndDownFixture();enterRnd(x);e('Actual RnD entry',x.get('b_Step_RnD'),true);
 if(history==='already-off')x.sample({in_LV_C1_FBK:false});
 const green=x.sample({in_Reset_PB:true});x.advance(499);e('No accepted SG before500',x.frames.filter(f=>f.timeMs>=green).some(f=>f.signals.SG),false);x.sample();wait(x,'SG',true);wait(x,'lv',false);
 if(history==='feedback-later-off'){x.advance(100);e('FeedbackON prevents premature Safe',x.get('b_Step1'),false);x.sample({in_LV_C1_FBK:false});}
 const begin=x.clock.timeMs;x.advance(2500);e('No LV/HV reenergization after commandOFF',x.frames.filter(f=>f.timeMs>=begin).some(f=>['lv','hv','lvPermittedSet','hvPermittedSet'].some(k=>f.signals[k])),false);
 if(!x.get('b_Step1'))notes.push({status:'NOT VERIFIED',requirement:'Eventual healthy Safe/fresh reentry',reason:'2500ms diagnostic observation exhausted; not a normative deadline',last:x.frames.at(-1)});
 else{e('Actual Safe exits RnD and Step2',x.get('b_Step_RnD')||x.get('b_Step2'),false);x.sample(off);x.advance(2100);enterRnd(x);e('Actual fresh-cycle RnD reentry',x.get('b_Step_RnD'),true);}
 e('No demanded fallback',x.unbound(),[]);return x;
});
const down=['runPhysical','runResetSto1','runResetSto2','runDischarge','runResetHv'];
for(const first of ['green','blue'])for(const delta of [0,249,250,300])for(const retained of ['green','blue'])run(`R-${first}-delta${delta}-retain${retained}`,(e)=>{
 const x=createSafeRunFixture('Run'),start=x.clock.timeMs+1;
 if(delta===0)x.sample(both);else{const a=x.sample(first==='green'?{in_Reset_PB:true}:{in_Relase_Door_PB:true});x.edgeAfter(a,delta,both);}
 x.advance(1200);const mark=x.frames.length;
 const any=()=>x.frames.filter(f=>f.timeMs>=start).some(f=>[...down,'safeUp','safeTransition','safeBlue','rndBlue','unlock'].some(k=>f.signals[k]));
 e('BOTH does not generate any command',any(),false);
 x.sample(retained==='green'?{in_Relase_Door_PB:false}:{in_Reset_PB:false});x.advance(700);e('No single from retained button of same attempt',any(),false);
 e('Established energy unchanged before fresh command',x.frames.filter(f=>f.timeMs>=start).every(f=>f.signals.lv&&f.signals.hv&&f.signals.sto1&&f.signals.sto2),true);
 x.sample(off);x.advance(2100);const fresh=x.sample({in_Reset_PB:true});x.advance(499);e('Fresh green no down before500',x.frames.filter(f=>f.timeMs>=fresh).some(f=>f.signals.runPhysical),false);x.sample();x.advance(4);e('Fresh green actual normal stop fanout available',down.every(k=>x.get(k)),true);e('No demanded fallback',x.unbound(),[]);return x;
});
for(const first of ['green','blue'])run('R-shortchord-remain-'+first,(e)=>{const x=createSafeRunFixture('Run');const a=x.sample(first==='green'?{in_Reset_PB:true}:{in_Relase_Door_PB:true});x.edgeAfter(a,100,both);x.advance(100);x.sample({in_Relase_Door_PB:false});x.advance(700);e('Failed short BOTH never becomes green single',x.frames.filter(f=>f.timeMs>=a).some(f=>down.some(k=>f.signals[k])),false);return x;});
const identities={runtime:hash('../src/sal-runtime.js'),parser:hash('../src/sal-parser.js'),binding:hash('../src/sal-binding-validator.js'),clock:hash('../src/observed-samples.js'),pairs:hash('../src/estop-native-pairs.js')};
fs.writeFileSync(new URL('baseline-results.json.gz',import.meta.url),gzipSync(JSON.stringify({kind:'Independent baseline actual-source diagnostics; not whole project acceptance',identities,results},null,2)));
console.log('TOTAL',Object.fromEntries(['PASS','FAIL','NOT VERIFIED','ERROR'].map(s=>[s,results.filter(r=>r.status===s).length])));
