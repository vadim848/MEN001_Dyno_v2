// v3 scenarios: B-1, Q-ARCH-01, Q-RC-14, EX (g10), C-1, C-2, Q-ARCH-04, Q-REL-AFTER-PERMIT (model).
import {rt,toRun,gesture} from './run.mjs';
const E=(r)=>`EOk=${+r.get('b_EStop_Ok')} C1=${+r.get('out_LV_C1')} C2=${+r.get('out_HV_C2')} STO=${+r.get('STO_DR1')} SU=${+r.get('recRndC_SU')} SG=${+r.get('recRndC_SG')} UL=${+r.get('out_Door_Unlock_Solonoeid')}`;
const say=(n,r,x='')=>console.log(n.padEnd(44),r.ph().padEnd(7),r.sts().padEnd(5),E(r),x,'viol',r.viol.length,r.viol[0]||'');
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const toRnd=(r)=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
const restart=(r)=>{r.step(20);r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});r.step(50);};
const opt=process.argv[2]?JSON.parse(process.argv[2]):{};
{ const r=rt(opt); const p=toRun(r); console.log('FB',r.count,'lifecycle',p); }
{ const r=rt(opt); r.plantC2=false; r.hold={in_HV_C2_FBK:false}; toRnd(r); gesture(r,{green:true,blue:true,ms:1100}); r.step(50); say('2 SU',r);
  r.step(3,{in_Estop_PLC:true}); r.step(1,{in_Estop_PLC:false}); r.step(12000); say('  in_Estop_PLC 3ms pulse +12s (B-1)',r); restart(r); say('  Restart',r); }
{ const r=rt(opt); r.plantC2=false; r.hold={in_HV_C2_FBK:false}; toRnd(r); gesture(r,{green:true,blue:true,ms:1100}); r.step(50);
  r.step(1,{in_LV_Connector_Interlock:false}); r.step(12000); say('3 SU + LV connector lost +12s',r); r.step(1,{in_LV_Connector_Interlock:true}); restart(r); say('  connector back + Restart',r); }
{ const r=rt(opt); toRnd(r); r.step(1,{in_ES_NC_1:false}); r.step(1999); say('4 R&D EStop +2000',r); r.step(10000); say('  +12s',r); r.step(1,{in_ES_NC_1:true}); restart(r); say('  Restart',r); r.step(2100); gesture(r,{green:true,blue:true,ms:1100}); r.step(2500); say('  new BOTH',r); }
{ const r=rt(opt); boot(r); r.plant=false; r.hold={in_LV_C1_FBK:false}; gesture(r,{green:true,blue:true,ms:1100}); r.step(30); say('5 S12 (C1 FBK held off)',r); r.step(1,{in_ES_NC_1:false}); r.hold={}; r.plant=true; r.step(1998); say('  EStop +1999',r); r.step(4); say('  EStop +2003',r); r.step(10000); say('  +12s',r); }
{ const r=rt(opt); toRnd(r); r.step(1,{in_HV_Connector_Interlock:false}); r.step(12000); say('6 R&D HV connector lost +12s',r); restart(r); say('  Restart with connector still lost',r); r.step(1,{in_HV_Connector_Interlock:true}); restart(r); say('  connector back + Restart',r); }
{ const r=rt(opt); toRnd(r); r.step(2100); r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true}); r.step(998); r.step(1,{in_LV_Healthy_FBK:true}); let both=false;for(let i=0;i<3000;i++){r.step(1); if(r.get('recRndC_SU')&&r.get('recRndC_SG'))both=true;} say('7 C-1 LV faulty 1 scan before BOTH',r,'SU&SG ever='+both); }
{ const r=rt(opt); toRnd(r); r.step(2100); r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true}); r.step(500); r.step(1,{in_LV_Healthy_FBK:true}); let up=false;for(let i=0;i<4000;i++){r.step(1); if(r.get('b_Step12'))up=true;} say('8 C-2 BOTH held through HLT',r,'S12 ever='+up); }
{ const r=rt(opt); boot(r); r.step(1,{in_InterLock_NC_1:false}); r.step(10); r.step(1,{in_Relase_Door_PB:true}); r.step(700); say('9a Safe cover open blue 700',r); r.step(1,{in_Relase_Door_PB:false}); }
{ const r=rt(opt); toRnd(r); r.step(1,{in_InterLock_NC_1:false}); r.step(10); r.step(1,{in_Relase_Door_PB:true}); r.step(700); say('9b R&D cover open blue 700',r); }
{ const r=rt(opt); boot(r); r.step(1,{in_InterLock_NC_1:false}); r.step(300); r.step(1,{in_InterLock_NC_1:true}); r.step(1700); gesture(r,{green:true,blue:true,ms:1100}); r.step(2500); say('10 Q-REL Safe cover 300ms then BOTH at +1.7s',r); }
{ const r=rt(opt); toRun(r); r.step(1,{in_ES_NC_1:false}); r.step(100); r.step(1,{in_ES_NC_1:true}); restart(r); say('11 Run EStop, early Restart (energy on)',r); r.step(12000); say('  +12s (no new gesture)',r); restart(r); say('  Restart again',r); }
