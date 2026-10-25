// Reviewer v4: rule L1 on full E2 v4 prototype. For each phase and cause: first scan (relative to event scan e=0)
// of b_EStop_Ok FALSE, S4, LV discharge, C1 OFF, STO_DR1 OFF, C2 OFF. Compared with in_Estop_PLC (R).
import {rt,gesture,toRun} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const opt=process.argv[2]?JSON.parse(process.argv[2]):{};
const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const toRnd=r=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
const phases={
 'S12 (C1_FBK held off)':r=>{boot(r);r.plant=false;r.hold={in_LV_C1_FBK:false};gesture(r,{green:true,blue:true,ms:1100});r.step(30);},
 'R&D':r=>{toRnd(r);},
 'SU (C2_FBK held off)':r=>{toRnd(r);r.plantC2=false;r.hold={in_HV_C2_FBK:false};gesture(r,{green:true,blue:true,ms:1100});r.step(50);},
 'Run':r=>{toRun(r);},
};
const causes={R:{in_Estop_PLC:true},NC1:{in_InterLock_NC_1:false},NC2:{in_InterLock_NC_2:false},LVc:{in_LV_Connector_Interlock:false},HVc:{in_HV_Connector_Interlock:false},ES1:{in_ES_NC_1:false},Mentee:{in_Mentee_EStop:true}};
const sig={EOk:r=>!r.get('b_EStop_Ok'),S4:r=>r.get('b_Step4'),LVdis:r=>r.get('out_LV_Discharge_Request')??null,C1off:r=>!r.get('out_LV_C1'),STOoff:r=>!r.get('STO_DR1'),C2off:r=>!r.get('out_HV_C2'),UL0:r=>!r.get('out_Door_Unlock_Solonoeid')};
for(const [pn,pf] of Object.entries(phases)){
 for(const [cn,ev] of Object.entries(causes)){
  const r=rt(opt); pf(r); const pre=r.ph(); const init={}; for(const [k,f] of Object.entries(sig))init[k]=f(r);
  const t={}; r.setInputs(ev); r.hold={...r.hold,...ev};
  for(let i=0;i<12000;i++){r.step(1); for(const [k,f] of Object.entries(sig)){ if(t[k]===undefined && !init[k] && f(r)) t[k]=i; }}
  console.log(pn.padEnd(22),pre.padEnd(6),cn.padEnd(7),Object.keys(sig).map(k=>k+'='+(init[k]?'n/a':(t[k]??'never'))).join(' '),'end',r.ph(),'viol',r.viol.length);
 }
}
