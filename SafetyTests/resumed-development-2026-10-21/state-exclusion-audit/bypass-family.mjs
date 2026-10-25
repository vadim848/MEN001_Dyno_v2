import fs from 'node:fs';
import {inspectNativeSalStructure} from '../../src/sal-native-structure.js';
import {createRndDownFixture} from '../../test/helpers/rnd-down-source.js';
const sal=new URL('../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url);
if(inspectNativeSalStructure(fs.readFileSync(sal,'utf8')).status!=='PASS')throw Error('Whole native preflight required');
const both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false},rows=[];
function wait(x,k,v,budget=2500){const end=x.clock.timeMs+budget;while(x.get(k)!==v&&x.clock.timeMs<end)x.sample();if(x.get(k)!==v)throw Error('Preparation unavailable '+k+'='+v);return x.clock.timeMs;}
for(const bypass of [false,true]){
 const x=createRndDownFixture(),marks={};let error;
 try{
  x.sample(both);x.advance(1000);wait(x,'lv',true);x.sample({in_LV_C1_FBK:true});wait(x,'b_Step_RnD',true);x.sample(off);x.advance(2100);
  x.sample({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:false});x.advance(10);marks.green=x.sample({in_Reset_PB:true});x.advance(500);wait(x,'SG',true);wait(x,'lv',false);
  marks.plc=x.sample({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true,in_HV_C2_FBK:true,in_HV_Healthy_FBK:true,in_STO_DR1_FBK:false,in_STO_DR2_FBK:false});wait(x,'hv',true);
  marks.bypass=x.sample({inPLC_BypassC1C2:bypass});x.advance(10500);marks.beforeConfirmation={time:x.clock.timeMs,lv:x.get('lv'),hv:x.get('hv'),down:x.get('down'),up:x.get('up'),rnd:x.get('b_Step_RnD'),run:x.get('b_Step3')};
  marks.feedbackGood=x.sample({in_HV_Healthy_FBK:false,in_LV_Healthy_FBK:false});marks.confirm=wait(x,'confirmRun',true);
  marks.feedbackOff=x.sample({in_HV_C2_FBK:false,in_LV_C1_FBK:false});x.advance(250);
 }catch(e){error=e.message;}
 let safe=true,run=false;const mid=[];
 for(const e of x.blockEvents){if(e.block==='//Network3/FBRs1')safe=e.outputs.RsOut.value;if(e.block==='//Network3/FBRs3')run=e.outputs.RsOut.value;if(safe&&run&&mid.length<10)mid.push({timeMs:e.timeMs,block:e.block,order:e.order});}
 const first=x.frames.find(f=>f.signals.b_Step1&&f.signals.b_Step3);
 rows.push({bypass,status:error?'PREPARATION_ERROR':first||mid.length?'CONDITIONAL_REACHABLE_OVERLAP':'NO_OVERLAP_IN_THIS_CONDITIONAL_TRACE',error,marks,firstOverlap:first,firstMidOverlap:mid,phaseChanges:x.frames.filter((f,i,a)=>i===0||['b_Step1','b_Step2','b_Step3','b_Step4','b_Step5','b_Step6','b_Step12','b_Step_RnD'].some(k=>f.signals[k]!==a[i-1].signals[k])).map(({timeMs,signals})=>({timeMs,signals})),protocol:x.protocolWrites,scope:x.scope,unresolvedDemanded:x.unbound()});
 console.log(bypass,rows.at(-1).status,error??first?.timeMs??'none');
}
fs.writeFileSync(new URL('BYPASS_FAMILY.json',import.meta.url),JSON.stringify({scope:'Exploratory coordinator actual-producer histories under declared initialSafe/seven inactiveN4. No Set/owner/timer injection after entry, no native startup claim; independent reproduction/review required.',rows},null,2)+'\n');
