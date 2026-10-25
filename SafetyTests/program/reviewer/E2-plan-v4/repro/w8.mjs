// Reviewer v4: M-E2b-24/25 killer search: S6 (early Restart, EOk TRUE), Bypass rising edge; green press/release at offsets d.
import {rt,toRun} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const restart=r=>{r.step(20);r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});r.step(50);};
{const r=rt({}); toRun(r); r.step(1,{in_ES_NC_1:false}); r.step(100); r.step(1,{in_ES_NC_1:true}); restart(r); r.step(12000); r.plant=false;r.plantC2=false; r.hold={inPLC_BypassC1C2:true,in_LV_C1_FBK:false,in_HV_C2_FBK:false}; const tl=[]; let pv='';for(let i=0;i<400;i++){r.step(1);const s=`C1=${+r.get('out_LV_C1')} C2=${+r.get('out_HV_C2')}`;if(s!==pv){tl.push(i+':'+s);pv=s;}} console.log('bypass timeline (S6, FBK held off):',tl.join(' '));}
for(const [n,mut] of [['base',[]],['G10.AndIn7',[D('//Network3/G10_EXIT','AndIn7')]],['G10.AndIn8',[D('//Network3/G10_EXIT','AndIn8')]]]){
 const hits=[]; for(const d of [0,1,2,5,10,20,50,90,100,101,150,200,300]){
  const r=rt({mut}); toRun(r); r.step(1,{in_ES_NC_1:false}); r.step(100); r.step(1,{in_ES_NC_1:true}); restart(r); r.step(12000);
  r.plant=false;r.plantC2=false; r.hold={inPLC_BypassC1C2:true,in_LV_C1_FBK:false,in_HV_C2_FBK:false};
  r.step(d); r.step(1,{in_Reset_PB:true}); r.step(1,{in_Reset_PB:false}); let ex=null; for(let i=0;i<5;i++){r.step(1); if(r.get('b_Step1')&&!ex)ex=`S1 with C1=${+r.get('out_LV_C1')} C2=${+r.get('out_HV_C2')}`;}
  hits.push(`d${d}:${ex||r.ph()}`);}
 console.log(n.padEnd(11),hits.join(' '));
}
