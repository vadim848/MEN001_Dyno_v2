// Analyst probe (diagnostic): boot, contactor FBK held TRUE from start, Restart -> status? F1 stack vs full E2 v4 model.
import {rt} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const stacks={'F1':{r1:false,e2a:false,e2b:false,e2c:false,e2d:false,e2e:false},'R1+E2a..E2d':{}};
for(const [sn,o] of Object.entries(stacks))for(const fb of ['in_LV_C1_FBK','in_HV_C2_FBK']){
 const r=rt(o);r.plantC2=false;r.hold={[fb]:true};r.step(50);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(300);
 console.log(sn.padEnd(12),fb.padEnd(14),'after Restart:',r.ph(),r.sts(),'EOk',+r.get('b_EStop_Ok'),'C1',+r.get('out_LV_C1'),'C2',+r.get('out_HV_C2'));
}
