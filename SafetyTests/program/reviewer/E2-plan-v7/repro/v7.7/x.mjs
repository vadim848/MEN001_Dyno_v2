import {cand,toRnd,toRun,boot,gesture} from './cand.mjs';
import {fix} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/c10.mjs';
const V={v76:null,v77:m=>fix(m)};
const OUT=['out_SS1_DR1','out_SS1_DR2','STO_DR1','STO_DR2','out_HV_Discharge_Request','out_LV_Discharge_Request','out_HV_C2','out_LV_C1','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid','b_EStop_Ok','b_Step1','b_Step12','b_Step_RnD','b_Step3','b_Step4','b_Step5','b_Step6','recRndC_SU'];
function trace(vn,scen){const r=cand('E2d76',V[vn]);const log=[];const st=r.step.bind(r);r.step=(n=1,inp)=>{if(inp)r.setInputs(inp);for(let i=0;i<n;i++){st(1);log.push(OUT.map(k=>+!!r.get(k)).join(''));}return r;};const info=scen(r)||'';return {log,end:r.ph()+(info?' '+info:'')};}
const diff=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++)if(a[i]!==b[i])return 'DIFF@'+i+': '+OUT.filter((_,j)=>a[i]?.[j]!==b[i]?.[j]);return 'identical';};
const B1={in_Reset_PB:true,in_Relase_Door_PB:true},B0={in_Reset_PB:false,in_Relase_Door_PB:false};
const S={
 // side effects
 'lifecycle + unlocks':r=>{toRun(r);r.step(2100);gesture(r,{green:true});r.step(9000);r.step(2100);gesture(r,{blue:true,ms:700});r.step(2100);gesture(r,{green:true});r.step(5000);r.step(2100);gesture(r,{blue:true,ms:700});r.step(2100);},
 'Q-REL-AFTER-PERMIT: Safe->R&D by BOTH, new BOTH at rel+1999':r=>{boot(r);r.step(1,B1);r.step(1099);r.step(1,B0);r.step(1998);r.step(1,B1);r.step(1099);r.step(1,B0);r.step(3000);},
 'Q-REL-AFTER-PERMIT: Safe->R&D by BOTH, new BOTH at rel+2001':r=>{boot(r);r.step(1,B1);r.step(1099);r.step(1,B0);r.step(2000);r.step(1,B1);r.step(1099);r.step(1,B0);r.step(3000);},
 'Safe->R&D BOTH held through S12 to Q+700, new BOTH at rel+2001':r=>{boot(r);r.step(1,B1);r.step(1699);r.step(1,B0);r.step(2000);r.step(1,B1);r.step(1099);r.step(1,B0);r.step(3000);},
 'Safe conn 300 ms (buttons released), BOTH 1.7 s later':r=>{boot(r);r.step(1,{in_LV_Connector_Interlock:false});r.step(300);r.step(1,{in_LV_Connector_Interlock:true});r.step(1700);r.step(1,B1);r.step(1099);r.step(1,B0);r.step(3000);},
 'K-1 R&D NC1 [f-300,f+10)':r=>{toRnd(r);r.step(2400);r.step(1,{in_InterLock_NC_1:false});r.step(299);r.step(1,{in_Relase_Door_PB:true});r.step(9);r.step(1,{in_InterLock_NC_1:true});r.step(89);r.step(1,{in_Reset_PB:true});r.step(1099);r.step(1,B0);r.step(3000);},
 'K-2 Safe LV Faulty BOTH':r=>{boot(r);r.step(1,{in_LV_Faulty_FBK:true});r.step(200);gesture(r,{green:true,blue:true,ms:1100});r.step(4000);},
 'UNL-LVF Safe LV Faulty blue':r=>{boot(r);r.step(1,{in_LV_Faulty_FBK:true});gesture(r,{blue:true,ms:700});r.step(1000);},
 'V14-Q7 Safe cover open BOTH':r=>{boot(r);r.step(1,{in_InterLock_NC_1:false});gesture(r,{green:true,blue:true,ms:1100});r.step(3000);},
 'R&D cover open green / blue':r=>{toRnd(r);r.step(2100);r.step(1,{in_InterLock_NC_1:false});gesture(r,{blue:true,ms:700});r.step(2100);gesture(r,{green:true});r.step(4000);},
 'FBK-10 Safe C1_FBK w/o cmd, BOTH':r=>{boot(r);r.plant=false;r.hold={in_LV_C1_FBK:true};r.step(500);gesture(r,{green:true,blue:true,ms:1100});r.hold={};r.step(2100);gesture(r,{blue:true,ms:100});r.step(2100);gesture(r,{green:true,blue:true,ms:1100});r.step(3000);},
 'Safe->R&D: green single abort in S12 (V14-Q13) after BOTH':r=>{boot(r);r.step(1,B1);r.step(1099);r.step(1,B0);r.step(50);gesture(r,{green:true});r.step(4000);},
 'Run green single descent, then BOTH at rel+2001':r=>{toRun(r);r.step(2100);gesture(r,{green:true});r.step(2000);r.step(1,B1);r.step(1099);r.step(1,B0);r.step(4000);},
 'SU held by HV Faulty: BOTH in SU after 2.1 s, then HV ok':r=>{toRnd(r);r.step(2100);r.step(1,{in_HV_Faulty_FBK:true});gesture(r,{green:true,blue:true,ms:1100});r.step(2100);r.step(1,B1);r.step(1099);r.step(1,B0);r.step(500);r.step(1,{in_HV_Faulty_FBK:false});r.step(4000);},
 // XPH emergency combos
 'XPH: (1,0) phase, BOTH held, in_Estop_PLC at A1+300, Restart':r=>{boot(r);r.step(2400);r.step(1,{inPLC_RnD_Mode:true});r.step(10);r.step(1,B1);r.step(290);r.step(1,{in_Estop_PLC:true});r.step(300);r.step(1,{inPLC_RnD_Mode:false});r.step(500,{in_Estop_PLC:false});r.step(1,{...B0});r.step(2100);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(3000);return 'C2='+(+r.get('out_HV_C2'));},
 'XPH: (1,0) phase, cover open at A1+50, BOTH at A1+100, close after R':r=>{boot(r);r.step(2400);r.step(1,{inPLC_RnD_Mode:true});r.step(50);r.step(1,{in_InterLock_NC_1:false});r.step(49);r.step(1,B1);r.step(549);r.step(1,{inPLC_RnD_Mode:false});r.step(550);r.step(1,{in_InterLock_NC_1:true});r.step(1,B0);r.step(5000);return 'C2='+(+r.get('out_HV_C2'));},
};
for(const [n,f] of Object.entries(S)){const a=trace('v76',f),b=trace('v77',f);console.log(n.padEnd(60),'|',diff(a.log,b.log).padEnd(34),'| v7.6',a.end,'| v7.7',b.end);}
