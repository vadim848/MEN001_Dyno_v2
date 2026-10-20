import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createLifecycleFixture} from './lifecycle-fixture.mjs';
const off={in_Reset_PB:false,in_Relase_Door_PB:false},both={in_Reset_PB:true,in_Relase_Door_PB:true};
const results=[];
function awaitValue(x,key,value,budget=2000){const end=x.clock.timeMs+budget;while(x.get(key)!==value&&x.clock.timeMs<end)x.sample();if(x.get(key)!==value)throw Error('Observation budget exhausted '+key+'='+value+'; not a new normative deadline');return x.clock.timeMs;}
function enterRnd(x){
 assert.equal(x.get('b_Step1'),true);
 const first=x.sample(both);x.advance(1000);
 const lv=awaitValue(x,'lv',true);x.sample({in_LV_C1_FBK:true});
 const rnd=awaitValue(x,'b_Step_RnD',true);
 assert.equal(x.frames.some(f=>f.timeMs>=first&&f.timeMs<=rnd&&f.signals.b_Step12),true,'Actual Step12 writer must run');
 assert.equal(x.frames.some(f=>f.timeMs>=first&&f.timeMs<=rnd&&!f.signals.mode),true,'Observed MODE gap required');
 assert.equal(x.get('SU'),false,'Safe chord must not seed RnD SU');
 x.sample(off);x.advance(2100);
 return{first,lv,rnd};
}
for(const route of ['down-to-Step2','up-to-Run']){
 let x;try{
 x=createLifecycleFixture();const entry=enterRnd(x);const start=x.clock.timeMs;
 if(route==='down-to-Step2'){
  x.sample({in_Reset_PB:true});const sg=awaitValue(x,'SG',true);
  const lvOff=awaitValue(x,'lv',false);x.sample({in_LV_C1_FBK:false});
  const step2=awaitValue(x,'b_Step2',true),rndExit=awaitValue(x,'b_Step_RnD',false);
  const sgClear=awaitValue(x,'SG',false);
  assert.equal(x.frames.some(f=>f.timeMs>=start&&f.timeMs<=sg&&f.signals.down),true);
  assert.equal(x.get('mode'),false);assert.equal(x.get('SU'),false);
  x.save('lifecycle-down.json',{status:'PASS',timing:{...entry,start,sg,lvOff,step2,rndExit,sgClear},endpoint:'ActualStep2+SGclear only; healthy Safe return not established'});
 }else{
  x.sample(both);const su=awaitValue(x,'SU',true);
  assert.equal(x.get('b_Step_RnD'),true);
  const hv=awaitValue(x,'hv',true);x.sample({in_HV_C2_FBK:true,in_HV_Healthy_FBK:false});
  const run=awaitValue(x,'b_Step3',true);awaitValue(x,'b_Step_RnD',false);
  const rndExit=x.frames.find(f=>f.timeMs>=su&&!f.signals.b_Step_RnD)?.timeMs;
  assert.ok(Number.isFinite(rndExit));
  awaitValue(x,'SU',false);
  const ownerInterval=x.frames.filter(f=>f.timeMs>=su&&f.timeMs<rndExit);
  assert.equal(ownerInterval.every(f=>f.signals.SU),true,'SU retained until actual RnD exit');
  const ownerSamples=x.blockEvents.filter(f=>f.block==='//RndPhysicalCompact/STATE_SU'&&f.timeMs>=su);
  assert.equal(ownerSamples.filter(f=>f.timeMs<=rndExit).every(f=>f.SU),true,'Owner stays through last recognizer evaluation before exit');
  assert.equal(ownerSamples.find(f=>f.timeMs>rndExit)?.SU,false,'First recognizer evaluation after exit clears owner');
  x.save('lifecycle-up.json',{status:'PASS',timing:{...entry,start,su,hv,run,rndExit},endpoint:'Normal source-confirmation route: RnD exits before next-scan Run rise; SU clears at first recognizer execution after RnD exit. No alternate overlap policy inferred.'});
 }
 assert.deepEqual(x.unbound(),[]);results.push({route,status:'PASS'});
 }catch(e){x?.save('lifecycle-'+route+'-failure.json',{status:'NOT VERIFIED',error:String(e.stack)});results.push({route,status:'NOT VERIFIED',error:String(e.stack)});}
}
fs.writeFileSync(new URL('lifecycle-results.json',import.meta.url),JSON.stringify({results,limits:['Conditional initialSafe, seven explicit inactiveN4 globals','RealN3 phasewriters; no phase/recognizer injection after protocolstart','HealthyStep2-to-Safe unresolved source gap; no inferred fullBOOT']},null,2));
console.log(results);process.exitCode=results.every(r=>r.status==='PASS')?0:1;
