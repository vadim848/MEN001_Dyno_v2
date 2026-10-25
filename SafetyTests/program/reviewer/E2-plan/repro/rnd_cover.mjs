import {make} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/h.mjs';
function base(holdC1){
 const {r}=make({in_LV_Healthy_FBK:true}); r.plant=false; r.c1hold=false;
 const st=(n=1,inp)=>{ if(inp) r.setInputs(inp); for(let i=0;i<n;i++){ r.setInputs({in_LV_C1_FBK:r.c1hold?true:r.get('out_LV_C1'),in_STO_DR1_FBK:!r.get('STO_DR1'),in_STO_DR2_FBK:!r.get('STO_DR2'),in_HV_C2_FBK:r.get('out_HV_C2')}); r.scan(1); r.t++; } };
 st(10); st(1,{in_Reset_PB:true}); st(1,{in_Reset_PB:false}); st(2100);
 st(1,{in_Reset_PB:true,in_Relase_Door_PB:true}); st(1100); st(1,{in_Reset_PB:false,in_Relase_Door_PB:false}); st(2500);
 return {r,st};
}
{ // A: steady R&D, cover open, green 600ms
 const {r,st}=base(); const pre=r.ph();
 st(1,{in_InterLock_NC_1:false}); st(100);
 st(1,{in_Reset_PB:true}); st(700); st(1,{in_Reset_PB:false}); st(3000);
 console.log('A R&D cover open + green:', pre,'->',r.ph(),'C1',r.get('out_LV_C1'),'SG',r.get('recRndC_SG'));
}
{ // B: R&D->Safe in progress (C1_FBK held ON), then cover opens, then FBK released
 const {r,st}=base(); r.c1hold=true;
 st(1,{in_Reset_PB:true}); st(700); st(1,{in_Reset_PB:false}); st(50);
 const mid=`SG=${r.get('recRndC_SG')} C1=${r.get('out_LV_C1')} ${r.ph()}`;
 st(1,{in_InterLock_NC_1:false}); st(50); r.c1hold=false; st(3000);
 console.log('B SG in progress + cover open:', mid,'-> SG',r.get('recRndC_SG'),'C1',r.get('out_LV_C1'),r.ph());
 st(1,{in_InterLock_NC_1:true}); st(3000);
 console.log('B  after cover closed again 3s:', r.ph(),'C1',r.get('out_LV_C1'));
}
