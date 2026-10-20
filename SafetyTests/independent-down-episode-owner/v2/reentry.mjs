import assert from 'node:assert/strict';
import {createLifecycleFixture} from './lifecycle-fixture.mjs';
const x=createLifecycleFixture(),off={in_Reset_PB:false,in_Relase_Door_PB:false},both={in_Reset_PB:true,in_Relase_Door_PB:true};
const wait=(key,value)=>{const end=x.clock.timeMs+2000;while(x.get(key)!==value&&x.clock.timeMs<end)x.sample();assert.equal(x.get(key),value,'Observation budget '+key);return x.clock.timeMs;};
function downEpisode(){x.sample(both);x.advance(1000);wait('lv',true);x.sample({in_LV_C1_FBK:true});wait('b_Step_RnD',true);x.sample(off);x.advance(2100);x.sample({in_Reset_PB:true});wait('SG',true);wait('lv',false);x.sample({in_LV_C1_FBK:false});wait('b_Step2',true);wait('b_Step_RnD',false);wait('SG',false);x.sample(off);assert.equal(x.get('owner'),true);return x.clock.timeMs;}
try{
 const first=downEpisode();x.advance(500);const fault=x.sample({in_False_SI2_CH8:true,in_ES_NC_1:false});
 wait('estop',false);const exit=wait('b_Step2',false);wait('owner',false);
 const clear=x.blockEvents.find(f=>f.timeMs>=exit&&f.block==='//SafeResumption/RND_DOWN_STEP2_OWNER');assert.equal(clear.owner,false);
 const safe=wait('b_Step1',true);
 x.sample({...off,in_False_SI2_CH8:false,in_ES_NC_1:true});x.advance(20);
 x.sample({in_Reset_PB:true});x.sample({in_Reset_PB:false});wait('estop',true);x.advance(2100);
 assert.equal(x.get('owner'),false);
 const second=downEpisode();assert.ok(second>first);x.advance(500);
 assert.equal(x.get('owner'),true);assert.equal(x.get('lv'),false);assert.equal(x.get('hv'),false);
 x.save('reentry.json',{status:'PASS',timing:{first,fault,exit,safe,second},limits:['Explicit actual fault-branch reset/availability component proof','Does not establish normal shutdown-to-Safe or complete emergency endpoint']});console.log('PASS owner actual fault-exit clear and fresh reentry capture');
}catch(e){x.save('reentry-failure.json',{status:'FAIL',error:String(e.stack)});throw e;}
