import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createLifecycleFixture} from './lifecycle-fixture.mjs';
const off={in_Reset_PB:false,in_Relase_Door_PB:false};
const results=[];
function wait(x,key,value,budget=2000){const end=x.clock.timeMs+budget;while(x.get(key)!==value&&x.clock.timeMs<end)x.sample();if(x.get(key)!==value)throw Error('Observation budget exhausted '+key);return x.clock.timeMs;}
for(const baseline of [false,true]){
 const source=baseline?'baseline':'candidate';let x,protocolComplete=false;
 try{
 x=createLifecycleFixture({baseline});
 x.sample({in_Reset_PB:true,in_Relase_Door_PB:true});x.advance(1000);
 wait(x,'lv',true);x.sample({in_LV_C1_FBK:true});wait(x,'b_Step_RnD',true);
 x.sample(off);x.advance(2100);x.sample({in_Reset_PB:true});wait(x,'SG',true);
 wait(x,'lv',false);x.sample({in_LV_C1_FBK:false});wait(x,'b_Step2',true);wait(x,'b_Step_RnD',false);wait(x,'SG',false);
 const start=x.sample(off);protocolComplete=true;x.advance(1000);
 const illegal=x.frames.filter(f=>f.timeMs>=start&&['lvPermittedSet','hvPermittedSet','lv','hv'].some(k=>f.signals[k]));
 const observed={firstViolation:illegal[0],violationSamples:illegal.length,start,end:x.clock.timeMs};
 x.save(`no-reenergization-${source}.json`,{status:illegal.length?'FAIL':'PASS',observed,oracle:'SPEC11 no renewed energy request after accepted RnD shutdown; does not choose discharge endpoint'});
 assert.equal(illegal.length,0,'New LV/HV Set or output after accepted shutdown with no new command');
 results.push({source,status:'PASS',...observed});
 }catch(e){results.push({source,status:protocolComplete?'FAIL':'NOT VERIFIED',error:String(e.stack)});if(!protocolComplete)x?.save(`no-reenergization-${source}-infrastructure.json`,{error:String(e.stack)});}
}
const report={results,interpretation:'Same raw protocol on candidate and production baseline. Conditional inactive Network4 boundary and initialSafe; no physical system defect claim beyond software source trace.'};
fs.writeFileSync(new URL('no-reenergization-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(results);process.exitCode=results.every(r=>r.status==='PASS')?0:1;
