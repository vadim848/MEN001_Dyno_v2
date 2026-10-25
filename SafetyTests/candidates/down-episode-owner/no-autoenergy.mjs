import assert from 'node:assert/strict';
import {createLifecycleFixture} from './lifecycle-fixture.mjs';
const x=createLifecycleFixture(),both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false};
function until(key,value,budget=2500){const end=x.clock.timeMs+budget;while(x.get(key)!==value&&x.clock.timeMs<end)x.sample();assert.equal(x.get(key),value,'observation budget '+key);return x.clock.timeMs;}
try{
 x.sample(both);x.advance(1000);until('lv',true);x.sample({in_LV_C1_FBK:true});until('b_Step_RnD',true);x.sample(off);x.advance(2100);
 x.sample({in_Reset_PB:true});until('SG',true);until('lv',false);x.sample({in_LV_C1_FBK:false});const step2=until('b_Step2',true);
 assert.equal(x.get('//SafeResumption/RND_DOWN_STEP2_OWNER/RsOut'),true,'owner captured on actual first Step2 scan');
 until('b_Step_RnD',false);until('SG',false);x.sample(off);x.advance(4000);
 const trace=x.frames.filter(f=>f.timeMs>=step2);
 assert.equal(trace.some(f=>f.signals.setLv||f.signals.setHv||f.signals.lvPermittedSet||f.signals.hvPermittedSet||f.signals.lv||f.signals.hv),false,'no automatic power request or energy after down enters Step2');
 assert.equal(x.get('//SafeResumption/RND_DOWN_STEP2_OWNER/RsOut'),true,'owner retained through current Step2 episode');assert.deepEqual(x.unbound(),[]);
 x.save('no-autoenergy.json',{status:'PASS',step2,observationEnd:x.clock.timeMs,owner:true,limit:'Conditional Network4 boundary; no Safe endpoint or new normative timeout'});console.log({status:'PASS',step2,end:x.clock.timeMs});
}catch(e){x.save('no-autoenergy.json',{status:'FAIL',error:e.message});throw e;}
