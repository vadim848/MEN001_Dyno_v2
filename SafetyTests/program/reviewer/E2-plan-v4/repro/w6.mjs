// Reviewer v4: (a) M-E2b-24/25 (G10_EXIT.AndIn7/AndIn8) reachability via legacy Bypass in S6; (b) REL-01(e) new attempt after rejection.
import {rt,toRun,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const restart=r=>{r.step(20);r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});r.step(50);};
for(const [n,mut] of [['base',[]],['G10.AndIn7',[D('//Network3/G10_EXIT','AndIn7')]],['G10.AndIn8',[D('//Network3/G10_EXIT','AndIn8')]]]){
 const r=rt({mut}); toRun(r); r.step(1,{in_ES_NC_1:false}); r.step(100); r.step(1,{in_ES_NC_1:true}); restart(r); r.step(12000);
 const a=`${r.ph()} EOk=${+r.get('b_EStop_Ok')}`;
 r.plant=false; r.plantC2=false; r.hold={in_LV_C1_FBK:false,in_HV_C2_FBK:false,inPLC_BypassC1C2:true}; r.step(200);
 const b=`bypass: C1=${+r.get('out_LV_C1')} C2=${+r.get('out_HV_C2')}`;
 restart(r); console.log(n.padEnd(11),'S6:',a,'|',b,'| after green press/release:',r.ph(),`C1=${+r.get('out_LV_C1')} C2=${+r.get('out_HV_C2')}`,'viol',r.viol.length);
}
{const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2500);};
 const r=rt({}); boot(r); const p=r.t;
 for(let i=0;i<2000;i++){const rel=r.t-p; let inp; if(rel===0)inp={in_Reset_PB:true,in_Relase_Door_PB:true}; if(rel===800)inp={in_LV_Connector_Interlock:false}; if(rel===1300)inp={in_LV_Connector_Interlock:true}; r.step(1,inp);}
 r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false}); r.step(2100); gesture(r,{green:true,blue:true,ms:1100}); r.step(2500);
 console.log('REL-01(e) then new attempt after 2.1 s release:',r.ph(),'C1',+r.get('out_LV_C1'));}
