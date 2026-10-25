import fs from 'node:fs';
import {createRndDownFixture} from '../../test/helpers/rnd-down-source.js';
const rows=[],both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false};
function wait(x,k,v){const end=x.clock.timeMs+2500;while(x.get(k)!==v&&x.clock.timeMs<end)x.sample();if(x.get(k)!==v)throw Error('Preparation unavailable '+k+'='+v);}
for(const action of ['normal-down','estop-during-launch','healthy-loss-at-run']){
 const x=createRndDownFixture(),marks={};let error;
 try{
  x.sample(both);x.advance(1000);wait(x,'lv',true);x.sample({in_LV_C1_FBK:true});wait(x,'b_Step_RnD',true);marks.rnd=x.clock.timeMs;x.sample(off);x.advance(2100);
  x.sample({in_STO_DR1_FBK:false,in_STO_DR2_FBK:false,in_HV_C2_FBK:true,in_HV_Healthy_FBK:true});x.sample(both);x.advance(1000);wait(x,'SU',true);marks.launch=x.clock.timeMs;
  if(action==='estop-during-launch'){x.sample({in_ES_NC_1:false});x.advance(6000);x.sample({in_ES_NC_1:true});x.advance(100);}
  else{
   wait(x,'sto1',true);wait(x,'sto2',true);x.sample(off);x.advance(2100);x.sample({in_LV_Healthy_FBK:false,in_HV_Healthy_FBK:false});wait(x,'b_Step3',true);marks.run=x.clock.timeMs;x.advance(2100);
   if(action==='normal-down'){x.sample({in_Reset_PB:true});x.advance(500);marks.down=x.clock.timeMs;x.advance(3000);x.sample({in_HV_C2_FBK:false});x.advance(1000);}
   else{x.sample({in_HV_Healthy_FBK:true});marks.loss=x.clock.timeMs;x.advance(6000);}
  }
 }catch(e){error=e.message;}
 let safe=true,run=false;const overlaps=[];
 for(const e of x.blockEvents){if(e.block==='//Network3/FBRs1')safe=e.outputs.RsOut.value;if(e.block==='//Network3/FBRs3')run=e.outputs.RsOut.value;if(safe&&run)overlaps.push({timeMs:e.timeMs,block:e.block,order:e.order});}
 const endOverlaps=x.frames.filter(f=>f.signals.b_Step1&&f.signals.b_Step3).map(f=>f.timeMs);
 rows.push({action,status:error?'PREPARATION_ERROR':overlaps.length||endOverlaps.length?'OVERLAP_OBSERVED':'NO_OVERLAP_IN_THIS_CONDITIONAL_TRACE',error,marks,scanFrames:x.frames.length,writerEvents:x.blockEvents.length,firstWriterOverlap:overlaps[0]??null,firstEndScanOverlap:endOverlaps[0]??null,scope:x.scope,unresolvedDemanded:x.unbound(),protocol:x.protocolWrites});
 console.log(action,rows.at(-1).status,x.frames.length);
}
fs.writeFileSync(new URL('COMPONENT_PATHS.json',import.meta.url),JSON.stringify({scope:'Coordinator exploratory evidence, not independent acceptance. Declared initialSafe and seven inactive Network4 writers; no full BOOT or exhaustive legal-input reachability proof. Mid-scan observations limited to actual recorded FBRs1/FBRs3 writer publications.',rows},null,2)+'\n');
