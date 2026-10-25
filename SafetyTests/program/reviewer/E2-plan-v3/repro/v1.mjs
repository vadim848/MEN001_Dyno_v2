// Reviewer v3: emergency causes in R&D / S12 / SU on architect prototype (model only, not native).
import {rt,toRun,gesture} from '../../../architect/E2-status/repro/run.mjs';
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const toRnd=(r)=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
const toS12=(r)=>{boot(r);r.plant=false;r.hold={in_LV_C1_FBK:false};gesture(r,{green:true,blue:true,ms:1100});r.step(30);};
const toSU=(r)=>{r.plantC2=false;r.hold={in_HV_C2_FBK:false};toRnd(r);gesture(r,{green:true,blue:true,ms:1100});r.step(50);};
const causes={PLC:{in_Estop_PLC:true},ES1:{in_ES_NC_1:false},ES2:{in_ES_NC_2:false},Mentee:{in_Mentee_EStop:true},LVcon:{in_LV_Connector_Interlock:false},HVcon:{in_HV_Connector_Interlock:false},NC1:{in_InterLock_NC_1:false}};
const outs=['b_EStop_Ok','b_Step4','out_LV_Discharge_Request','out_C3_BatRelay','out_RBM_Bat','out_LV_C1','STO_DR1','out_HV_C2'];
for(const [sn,setup] of [['RnD',toRnd],['S12',toS12],['SU',toSU]]){
 for(const [cn,c] of Object.entries(causes)){
  const r=rt({}); setup(r); if(sn==='S12'){r.hold={};r.plant=true;}
  const init=Object.fromEntries(outs.map(o=>[o,r.get(o)])); const tau={}; const ph0=r.ph();
  r.step(1,c); // event scan e = 1
  for(let i=1;i<=12000;i++){ for(const o of outs){ if(tau[o]===undefined && r.get(o)!==init[o]) tau[o]=i; } if(i<12000) r.step(1); }
  console.log(sn.padEnd(4),cn.padEnd(7),'from',ph0.padEnd(6),'end',r.ph().padEnd(6),'viol',r.viol.length,JSON.stringify(tau));
 }
}
