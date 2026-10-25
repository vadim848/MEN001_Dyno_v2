import fs from 'node:fs';
import {createRndDownFixture} from '../../test/helpers/rnd-down-source.js';
const rows=[],both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false};
function wait(x,k,v){const end=x.clock.timeMs+2500;while(x.get(k)!==v&&x.clock.timeMs<end)x.sample();if(x.get(k)!==v)throw Error('Preparation unavailable '+k+'='+v);}
for(const feedbackDelay of [0,20,600]){
 const x=createRndDownFixture(),marks={};let error;
 try{
  x.sample(both);x.advance(1000);wait(x,'lv',true);x.sample({in_LV_C1_FBK:true});wait(x,'b_Step_RnD',true);x.sample(off);x.advance(2100);
  x.sample({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:false});x.advance(10);
  marks.green=x.sample({in_Reset_PB:true});x.advance(500);wait(x,'SG',true);wait(x,'lv',false);
  marks.plc=x.sample({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});x.advance(feedbackDelay);
  marks.feedback=x.sample({in_LV_C1_FBK:false,in_HV_C2_FBK:true,in_HV_Healthy_FBK:false,in_LV_Healthy_FBK:false,in_STO_DR1_FBK:false,in_STO_DR2_FBK:false});x.advance(2500);
 }catch(e){error=e.message;}
 const overlap=x.frames.find(f=>f.signals.b_Step1&&f.signals.b_Step3),opposing=x.frames.find(f=>f.signals.up&&f.signals.down);
 rows.push({feedbackDelay,error,marks,status:error?'PREPARATION_ERROR':overlap?'CONDITIONAL_REACHABLE_OVERLAP':'NO_OVERLAP_IN_THIS_CONDITIONAL_TRACE',firstOverlap:overlap,firstOpposing:opposing,phaseChanges:x.frames.filter((f,i,a)=>i===0||['b_Step1','b_Step2','b_Step3','b_Step4','b_Step5','b_Step6','b_Step12','b_Step_RnD'].some(k=>f.signals[k]!==a[i-1].signals[k])).map(({timeMs,signals})=>({timeMs,signals})),protocol:x.protocolWrites,scope:x.scope,unresolvedDemanded:x.unbound()});
 console.log(feedbackDelay,rows.at(-1).status,overlap?.timeMs??'none');
}
fs.writeFileSync(new URL('COMPETING_PATHS.json',import.meta.url),JSON.stringify({scope:'Coordinator exploratory conditional-initialSafe producer trace; no internal Set injections after start, seven inactive N4 boundaries and no full native startup proof. External PLC/button concurrence is a legal stimulus whose current acceptance violates the latest PLC rejection rule. Independent tester/reviewer gate still required.',rows},null,2)+'\n');
