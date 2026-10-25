import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createLifecycleFixture} from './lifecycle-fixture.mjs';
const off={in_Reset_PB:false,in_Relase_Door_PB:false};
const rows=[];
const wait=(x,k,v)=>{const end=x.clock.timeMs+2000;while(x.get(k)!==v&&x.clock.timeMs<end)x.sample();if(x.get(k)!==v)throw Error('Observation budget '+k+'='+v);};
for(const source of ['baseline','prior','candidate']){
 let x;try{
 x=createLifecycleFixture({source});
 x.sample({in_Reset_PB:true,in_Relase_Door_PB:true});x.advance(1000);wait(x,'lv',true);
 x.sample({in_LV_C1_FBK:true});wait(x,'b_Step_RnD',true);x.sample(off);x.advance(2100);
 const downStart=x.sample({in_Reset_PB:true});wait(x,'SG',true);wait(x,'lv',false);x.sample({in_LV_C1_FBK:false});
 wait(x,'b_Step2',true);wait(x,'b_Step_RnD',false);wait(x,'SG',false);const neutral=x.sample(off);x.advance(2500);
 const frames=x.frames.filter(f=>f.timeMs>=neutral),bad=frames.filter(f=>['lvPermittedSet','hvPermittedSet','lv','hv'].some(k=>f.signals[k]));
 const firstStep=x.frames.find(f=>f.timeMs>=downStart&&f.signals.b_Step2);
 if(source==='candidate'){
  assert.equal(firstStep.signals.owner,true,'Owner captured first actual Step2 scan');
  assert.equal(frames.every(f=>f.signals.owner),true,'Owner retained while Step2 remains');
  const gates=x.blockEvents.filter(f=>f.timeMs>=firstStep.timeMs&&f.block==='//Network5/FBAnd1');
  assert.equal(gates.every(f=>f.owner&&!f.powerOn),true,'Owner blocks first/current N5 evaluation');
  assert.equal(bad.length,0,'No renewed permitted Set or LV/HV output');
 }else assert.ok(bad.length,'Frozen previous source must reproduce known RED');
 const status=source==='candidate'?'PASS':'EXPECTED RED';
 x.save('down-'+source+'.json',{status,firstStep:firstStep.timeMs,neutral,renewedEnergySamples:bad.length});
 rows.push({source,case:'accepted down episode',status,renewedEnergySamples:bad.length});
 }catch(e){x?.save('down-'+source+'-failure.json',{status:'FAIL',error:String(e.stack)});rows.push({source,case:'accepted down episode',status:'FAIL',error:String(e.stack)});}
 let positive;try{
 positive=createLifecycleFixture({source,initialPhase:'b_Step2',initialDischarge:true});
 assert.equal(positive.get('lvDischarge'),true,'Generic discharge precondition persists');
 assert.equal(positive.get('setLv'),true);assert.equal(positive.get('setHv'),true);
 assert.equal(positive.get('lvPermittedSet'),true);assert.equal(positive.get('hvPermittedSet'),true);
 assert.equal(positive.get('lv'),true);assert.equal(positive.get('hv'),true);
 assert.equal(positive.get('down'),false);assert.equal(positive.get('SG'),false);
 if(source==='candidate')assert.equal(positive.get('owner'),false);
 positive.save('legacy-'+source+'.json',{status:'PASS',precondition:'InitialStep2 + genericLVdischarge; no RnD-down origin; not BOOT reachability'});
 rows.push({source,case:'legacy generic discharge positive',status:'PASS'});
 }catch(e){positive?.save('legacy-'+source+'-failure.json',{status:'FAIL',error:String(e.stack)});rows.push({source,case:'legacy generic discharge positive',status:'FAIL',error:String(e.stack)});}
}
fs.writeFileSync(new URL('results.json',import.meta.url),JSON.stringify({rows,limits:['ActualStep2 exit/reentry still pending source-backed protocol','SG simultaneousSafeRnD conflict probe pending','Conditional inactiveN4 boundary; no fullBOOT/nativehardware claim']},null,2));
console.log(rows);process.exitCode=rows.some(r=>r.status==='FAIL')?1:0;
