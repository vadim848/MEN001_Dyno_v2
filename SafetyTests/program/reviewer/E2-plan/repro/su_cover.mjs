import {make} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/h.mjs';
for (const ev of [{in_InterLock_NC_1:false},{in_ES_NC_1:false}]) {
 const {r}=make({in_LV_Healthy_FBK:true}); r.plant=false;
 const st=(n=1,inp)=>{ if(inp) r.setInputs(inp); for(let i=0;i<n;i++){ r.setInputs({in_LV_C1_FBK:r.get('out_LV_C1'),in_STO_DR1_FBK:!r.get('STO_DR1'),in_STO_DR2_FBK:!r.get('STO_DR2'),in_HV_C2_FBK:false}); r.scan(1); r.t++; } };
 st(10); st(1,{in_Reset_PB:true}); st(1,{in_Reset_PB:false}); st(2100);
 st(1,{in_Reset_PB:true,in_Relase_Door_PB:true}); st(1100); st(1,{in_Reset_PB:false,in_Relase_Door_PB:false}); st(2500);
 st(1,{in_Reset_PB:true,in_Relase_Door_PB:true}); st(1100); st(1,{in_Reset_PB:false,in_Relase_Door_PB:false}); st(50);
 const pre=`SU=${r.get('recRndC_SU')} STO1=${r.get('STO_DR1')} C2=${r.get('out_HV_C2')} C1=${r.get('out_LV_C1')} ${r.ph()}`;
 st(1,ev); st(10000);
 console.log(JSON.stringify(ev),'pre',pre,' | after 10s: SU',r.get('recRndC_SU'),'STO1',r.get('STO_DR1'),'STO2',r.get('STO_DR2'),'C2',r.get('out_HV_C2'),'C1',r.get('out_LV_C1'),'EOk',r.get('b_EStop_Ok'),r.ph());
}
