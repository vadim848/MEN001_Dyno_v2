import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {createRndDownFixture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/rnd-down-source.js';
const off={in_Reset_PB:false,in_Relase_Door_PB:false},both={in_Reset_PB:true,in_Relase_Door_PB:true};
function observe(x,key,value,budget=2500){const end=x.clock.timeMs+budget;while(x.get(key)!==value&&x.clock.timeMs<end)x.sample();return x.get(key)===value;}
function prepare(x,key,value){if(!observe(x,key,value))throw Error('Fixture ERROR: preparation unavailable '+key+'='+value+'; diagnostic budget only');return x.clock.timeMs;}
function rnd(x){x.sample({in_LV_Healthy_FBK:true});x.sample(both);x.advance(1000);prepare(x,'lv',true);x.sample({in_LV_C1_FBK:true});prepare(x,'b_Step_RnD',true);x.sample({...off,in_LV_Healthy_FBK:false});x.advance(2100);}
function invariant(x,from,to=x.clock.timeMs){
 const start=x.frames.findIndex(f=>f.timeMs>=from);assert.ok(start>0,'Continuously observed sample immediately before accepted-down boundary exists');
 const frames=x.frames.filter(f=>f.timeMs>=from&&f.timeMs<=to);assert.ok(frames.length,'Actual accepted-down interval observed');
 assert.equal(frames.some(f=>f.signals.b_Step2),false,'No accepted-down route into original Step2 startup');
 assert.equal(frames.some(f=>['lvProposal','hvProposal','lvPermittedSet','hvPermittedSet'].some(k=>f.signals[k])),false,'No LV/HV proposal or permitted Set replay');
 let previous=x.frames[start-1];for(const frame of frames){for(const k of ['lv','hv'])assert.equal(!previous.signals[k]&&frame.signals[k],false,'No '+k+' OFF→ON replay including accepted-down boundary');previous=frame;}
 const consumers=x.blockEvents.filter(f=>f.timeMs>=from&&f.timeMs<=to&&['//Network1/FBRs1','//Network1/FBRs2'].includes(f.block));assert.ok(consumers.length,'Actual native energy RS consumers observed');for(const event of consumers)assert.equal(event.consumed.Set.value,false,'No actual native '+event.block+' consumed energy Set replay');
}
function causalObligations(x,from=-Infinity){
 const events=x.blockEvents.filter(f=>f.timeMs>=from&&f.consumed?.Set&&f.consumed?.Reset);let lastEligible;
 for(const event of events){const set=event.consumed.Set.value,reset=event.consumed.Reset.value;assert.ok(event.outputs?.RsOut,'Native RS output observed at actual evaluation');if(reset)assert.equal(event.outputs.RsOut.value,false,'Actual reset-dominant native response '+event.block+' at '+event.timeMs);else if(set){lastEligible=event;assert.equal(event.outputs.RsOut.value,true,'Actual native SetTRUE/ResetFALSE response '+event.block+' at '+event.timeMs);}}
 return {lastEligible,lastConsumer:events.at(-1),lastCompletion:x.blockEvents.filter(f=>f.timeMs>=from&&f.block==='//Network12/FBAnd15').at(-1)};
}
function notVerified(t,x,from,reason){const causal=causalObligations(x,from);t.diagnostic(JSON.stringify({classification:'NOT VERIFIED after causal assertions',reason,causal}));t.todo('NOT VERIFIED: '+reason+'; diagnostic budget is not normative deadline');}
function evidence(t,name,x){assert.deepEqual(x.unbound(),[],'No demanded fallback');t.diagnostic(JSON.stringify({sourceSha256:x.scope.sourceSha256,sgvlSha256:x.scope.sgvlSha256,audit:x.scope.sourceAudit,scans:x.frames.length,limits:x.scope.limits}));const dir=process.env.MEN001_RND_DOWN_EVIDENCE_DIR;if(dir){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,name+'.json.gz'),gzipSync(JSON.stringify({scope:x.scope,protocolWrites:x.protocolWrites,frames:x.frames,blockEvents:x.blockEvents})));}}
for(const history of ['later-off','already-off'])test('current SAL: healthy LV completion '+history+' reaches Safe and real fresh RnD without reenergization',t=>{
 const x=createRndDownFixture();try{
 rnd(x);if(history==='already-off')x.sample({in_LV_C1_FBK:false});const green=x.sample({in_Reset_PB:true});x.advance(499);
 assert.equal(x.frames.filter(f=>f.timeMs>=green).some(f=>f.signals.SG),false,'No down before green500');x.sample();prepare(x,'SG',true);const accepted=x.frames.find(f=>f.timeMs>=green&&f.signals.SG).timeMs;const lvOff=prepare(x,'lv',false);
 if(history==='later-off'){const from=x.clock.timeMs;x.advance(100);assert.equal(x.frames.filter(f=>f.timeMs>=from).some(f=>f.signals.b_Step1),false,'Held LV feedbackON cannot complete Safe');x.sample({in_LV_C1_FBK:false});}
 if(!observe(x,'b_Step1',true)){invariant(x,accepted);notVerified(t,x,accepted,'eventual healthy Safe not observed');return;}
 const safe=x.frames.find(f=>f.timeMs>=accepted&&f.signals.b_Step1);assert.ok(safe.timeMs>=lvOff,'Actual LV commandOFF precedes actual Safe');assert.equal(x.get('b_Step_RnD'),false,'Real RnD owner exited');
 if(!observe(x,'SG',false)){invariant(x,accepted);notVerified(t,x,accepted,'SG scope clear after actual Safe');return;}
 x.advance(1000);x.sample(off);x.advance(2100);invariant(x,accepted);
 const fresh=x.sample(both);x.advance(999);assert.equal(x.frames.filter(f=>f.timeMs>=fresh).some(f=>f.signals.safeUp),false,'New BOTH cannot advance before continuous1000');invariant(x,accepted,x.clock.timeMs);
 x.sample();if(!observe(x,'lv',true)){notVerified(t,x,fresh,'actual new Safe startup unavailable');return;}x.sample({in_LV_C1_FBK:true});if(!observe(x,'b_Step_RnD',true)){notVerified(t,x,fresh,'actual fresh RnD completion unavailable');return;}
 assert.equal(x.get('b_Step_RnD'),true,'Actual fresh cycle, no terminal phase seed');
 causalObligations(x,green);
 }finally{evidence(t,'current-lv-completion-'+history,x);}
});
for(const initialDischarge of [false,true])test('current SAL: ordinary Step2 startup preserved, generic discharge='+initialDischarge,t=>{
 const x=createRndDownFixture({initialPhase:'b_Step2',initialDischarge});try{assert.equal(x.get('down'),false);assert.equal(x.get('SG'),false);for(const k of ['setLv','setHv','lvPermittedSet','hvPermittedSet','lv','hv'])assert.equal(x.get(k),true,k+' actual original startup availability');if(initialDischarge)assert.equal(x.get('lvDischarge'),true);}finally{evidence(t,'current-ordinary-step2-discharge-'+initialDischarge,x);}
});
