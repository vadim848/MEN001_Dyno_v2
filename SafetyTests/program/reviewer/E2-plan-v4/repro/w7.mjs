// Reviewer v4: legacy Bypass (inPLC_BypassC1C2) after Emergency chain: F1 vs plan stacks. Model only.
import {rt,toRun} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const restart=r=>{r.step(20);r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});r.step(50);};
const stacks={'F1':{r1:false,e2a:false,e2b:false,e2c:false,e2d:false,e2e:false},'R1+E2a':{e2b:false,e2c:false,e2d:false,e2e:false},'R1+E2a+E2b':{e2c:false,e2d:false},'R1+E2a..E2d':{}};
for(const [sn,o] of Object.entries(stacks))for(const early of [true,false]){
 const r=rt(o); toRun(r); r.step(1,{in_ES_NC_1:false}); r.step(100); if(early){r.step(1,{in_ES_NC_1:true}); restart(r);} r.step(12000);
 const a=`${r.ph()} EOk=${+r.get('b_EStop_Ok')}`;
 r.hold={inPLC_BypassC1C2:true}; r.step(300);
 console.log(sn.padEnd(12),(early?'early Restart':'ES held     ').padEnd(14),'before bypass:',a.padEnd(10),'| bypass 300 ms:',r.ph(),`C1=${+r.get('out_LV_C1')} C2=${+r.get('out_HV_C2')} STO=${+r.get('STO_DR1')}`);
}
