import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {createRndDownFixture} from './helpers/rnd-down-source.js';
const off={in_Reset_PB:false,in_Relase_Door_PB:false},both={in_Reset_PB:true,in_Relase_Door_PB:true};
function wait(x,key,value){const end=x.clock.timeMs+2000;while(x.get(key)!==value&&x.clock.timeMs<end)x.sample();assert.equal(x.get(key),value,'Observation budget exhausted: '+key+'; no new normative deadline');return x.clock.timeMs;}
function enterDown(x){
 const chord=x.sample(both);x.advance(1000);wait(x,'lv',true);
 x.sample({in_LV_C1_FBK:true});wait(x,'b_Step_RnD',true);
 x.sample(off);x.advance(2100);const accepted=x.sample({in_Reset_PB:true});wait(x,'SG',true);
 wait(x,'lv',false);x.sample({in_LV_C1_FBK:false});wait(x,'b_Step2',true);wait(x,'b_Step_RnD',false);wait(x,'SG',false);
 const firstStep=x.frames.find(f=>f.timeMs>=accepted&&f.signals.b_Step2);
 assert.equal(firstStep.signals.owner,true,'Actual down origin captured on first Step2 scan');
 const begin=x.sample(off);return{chord,accepted,firstStep:firstStep.timeMs,begin};
}
function evidence(t,name,x){
 assert.deepEqual(x.unbound(),[],'No demanded runtime fallback');
 t.diagnostic(JSON.stringify({sourceSha256:x.scope.sourceSha256,sgvlSha256:x.scope.sgvlSha256,sourceAudit:x.scope.sourceAudit,selectedBlocks:x.scope.selected.length,scans:x.frames.length,scope:x.scope.limits,initialState:x.scope.initialState,network4Boundary:x.scope.network4Boundary}));
 const dir=process.env.MEN001_RND_DOWN_EVIDENCE_DIR;
 if(dir){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,name+'.json.gz'),gzipSync(JSON.stringify({scope:x.scope,protocolWrites:x.protocolWrites,frames:x.frames,blockEvents:x.blockEvents})));}
}
test('current SAL: accepted RnD down never re-energizes its Step2 episode',t=>{
 const x=createRndDownFixture();try{
 const marks=enterDown(x);x.advance(2500);
 const frames=x.frames.filter(f=>f.timeMs>=marks.begin);
 assert.ok(frames.length>=2501);
 assert.equal(frames.every(f=>f.signals.b_Step2&&f.signals.owner),true,'Owner survives SG clear and button release throughout episode');
 assert.equal(frames.some(f=>['lvPermittedSet','hvPermittedSet','lv','hv'].some(k=>f.signals[k])),false,'No new permitted energy Set or LV/HV output');
 const gates=x.blockEvents.filter(f=>f.timeMs>=marks.firstStep&&f.block==='//Network5/FBAnd1');
 assert.ok(gates.length);assert.equal(gates.every(f=>f.owner&&!f.powerOn),true,'First and later N5 evaluations are inhibited');
 }finally{evidence(t,'current-down-no-reenergy',x);}
});
for(const initialDischarge of [false,true])test('current SAL: ordinary initial Step2 preserves power-on, generic LV discharge='+initialDischarge,t=>{
 const x=createRndDownFixture({initialPhase:'b_Step2',initialDischarge});try{
 assert.equal(x.get('owner'),false);assert.equal(x.get('down'),false);assert.equal(x.get('SG'),false);
 for(const key of ['setLv','setHv','lvPermittedSet','hvPermittedSet','lv','hv'])assert.equal(x.get(key),true,key+' ordinary availability');
 if(initialDischarge)assert.equal(x.get('lvDischarge'),true,'Generic discharge is not RnD-down origin');
 }finally{evidence(t,'current-ordinary-step2-discharge-'+initialDischarge,x);}
});
test('current SAL technical component: actual fault-branch Step2 exit clears owner and fresh episode recaptures it',t=>{
 const x=createRndDownFixture();try{
 const first=enterDown(x);x.advance(500);
 x.sample({in_False_SI2_CH8:true,in_ES_NC_1:false});wait(x,'estop',false);const exit=wait(x,'b_Step2',false);wait(x,'owner',false);
 const ownerEvent=x.blockEvents.find(f=>f.timeMs>=exit&&f.block==='//SafeResumption/RND_DOWN_STEP2_OWNER');assert.equal(ownerEvent.owner,false);
 wait(x,'b_Step1',true);x.sample({...off,in_False_SI2_CH8:false,in_ES_NC_1:true});x.advance(20);
 x.sample({in_Reset_PB:true});x.sample({in_Reset_PB:false});wait(x,'estop',true);x.advance(2100);
 assert.equal(x.get('owner'),false);const second=enterDown(x);assert.ok(second.begin>first.begin);x.advance(500);
 assert.equal(x.get('owner'),true);assert.equal(x.get('lv'),false);assert.equal(x.get('hv'),false);
 }finally{evidence(t,'current-technical-fault-exit-reentry',x);}
});
