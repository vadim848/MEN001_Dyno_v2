import {rt,gesture,trace} from './run.mjs';
const r=rt({});
r.step(10); r.step(1,{in_Reset_PB:true}); r.step(1,{in_Reset_PB:false}); r.step(2100);
gesture(r,{green:true,blue:true,ms:1100}); r.step(2500); console.log('at',r.t,r.ph(),r.sts());
gesture(r,{green:true,blue:true,ms:1100});
const G=['b_Step12_Set','b_Step_RnD_Set','b_Step3_Set_2','b_Step2_Set_2','b_Step12_Set_2','b_Step4_Set','//Network3/FBAnd1/AndOut','recRndC_SU','recRndC_SG','out_HV_C2','in_HV_C2_FBK','STO_DR1'];
let prev='';for(let i=0;i<3000;i++){r.step(1);const p=r.ph()+'|'+G.filter(g=>r.get(g)).join(',');if(p!==prev){console.log(r.t,p);prev=p;}}
