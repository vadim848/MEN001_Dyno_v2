// v2 scenarios for reviewer findings N1-N5 (model run on in-memory R1+E2a..E2d).
import {rt,toRun,gesture,trace} from './run.mjs';
const E=(r)=>`EOk=${r.get('b_EStop_Ok')} C1=${r.get('out_LV_C1')} C2=${r.get('out_HV_C2')} STO1=${r.get('STO_DR1')} SU=${r.get('recRndC_SU')} SG=${r.get('recRndC_SG')}`;
const say=(n,r,extra='')=>console.log(n.padEnd(34),r.ph().padEnd(8),r.sts().padEnd(5),E(r),extra,'viol',r.viol.length,r.viol[0]||'');
const toRnd=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
{ const r=rt({}); const p=toRun(r); console.log('FB',r.count,'lifecycle',p); gesture(r,{green:true}); r.step(3000); r.step(2100); gesture(r,{green:true}); r.step(2000); say('1 lifecycle Run->R&D->Safe',r); }
{ const r=rt({}); toRun(r); r.step(5,{in_InterLock_NC_1:false}); say('2 steady Run IL loss +5ms',r); r.step(12000); say('  +12s',r); }
{ const r=rt({}); toRun(r); gesture(r,{green:true}); r.step(1,{in_InterLock_NC_1:false}); r.step(3000); say('3 Run-down + IL loss (b1)',r); }
{ const r=rt({}); toRnd(r); gesture(r,{green:true,blue:true,ms:1100}); r.plantC2=false; r.hold={in_HV_C2_FBK:false}; r.step(50); say('4 StartingRun (C2 FBK held off)',r); r.step(1,{in_InterLock_NC_1:false}); r.step(20); say('  +IL loss 20ms',r); r.step(12000); say('  +12s',r); }
{ const r=rt({}); toRnd(r); gesture(r,{green:true,blue:true,ms:1100}); r.plantC2=false; r.hold={in_HV_C2_FBK:false}; r.step(50); r.step(1,{in_ES_NC_1:false}); r.step(12000); say('5 StartingRun + EStop +12s',r); }
{ const r=rt({}); toRnd(r); r.step(1,{in_InterLock_NC_1:false}); r.step(10); gesture(r,{green:true}); r.step(2000); say('6 R&D cover open + green',r); }
{ const r=rt({}); toRnd(r); r.plant=false; r.hold={in_LV_C1_FBK:true}; gesture(r,{green:true}); r.step(20); r.step(1,{in_InterLock_NC_1:false}); r.hold={}; r.step(2000); say('7 R&D->Safe in progress + cover open',r); }
{ const r=rt({}); toRnd(r); r.step(1,{in_InterLock_NC_1:false}); r.step(10); r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true}); r.step(1500); r.step(1,{in_InterLock_NC_1:true}); r.step(1500); say('8 R&D NC open BOTH held, restore',r,'(expect no SU)'); r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false}); r.step(2100); gesture(r,{green:true,blue:true,ms:1100}); r.step(50); say('  new BOTH after release',r,'(expect SU or Run)'); }
{ const r=rt({}); r.step(10); r.step(1,{in_Reset_PB:true}); r.step(1,{in_Reset_PB:false}); r.step(2100); r.step(1,{in_InterLock_NC_1:false}); gesture(r,{green:true,blue:true,ms:1100}); r.step(2500); say('9 Safe NC open BOTH -> R&D',r); }
{ const r=rt({}); toRnd(r); r.step(1,{in_LV_Healthy_FBK:true}); r.step(2000); say('10 R&D LV Healthy lost (HLT-01)',r); }
{ const r=rt({}); toRnd(r); r.step(1,{in_HV_Connector_Interlock:false}); r.step(20); say('11 R&D HV connector lost (EMG-004)',r); }
