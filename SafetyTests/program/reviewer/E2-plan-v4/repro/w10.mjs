// Reviewer v4: Bypass rising edge in steady Safe: 1-scan C1/C2 pulse? F1 vs full E2 v4 model.
import {rt} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
for(const [sn,o] of [['F1',{r1:false,e2a:false,e2b:false,e2c:false,e2d:false,e2e:false}],['R1+E2a..E2d',{}]]){
 const r=rt(o); r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2500);
 r.hold={inPLC_BypassC1C2:true}; let c1=0,c2=0; for(let i=0;i<500;i++){r.step(1); c1+=+r.get('out_LV_C1'); c2+=+r.get('out_HV_C2');}
 console.log(sn.padEnd(12),'steady Safe + Bypass 500 ms: scans with C1 ON',c1,'C2 ON',c2,'end',r.ph());
}
