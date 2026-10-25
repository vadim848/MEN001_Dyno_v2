import {cand,toRnd} from './cand.mjs';
const r=cand('E2b');toRnd(r);console.log(r.ph(),'C1',+r.get('out_LV_C1'));r.step(2100);
r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});
const S=['//RndPhysicalCompact/BOTH/TonOut','//RndPhysicalCompact/GATE_020/AndOut','recRndC_SU','b_Set_HV_C2_1','out_HV_C2','b_Step3','recRndC_C','recRndC_A','recRndC_L','linkRndGatePermit','linkCoverClosed'];
let prev='';for(let i=0;i<2000;i++){if(i===1100)r.setInputs({in_Reset_PB:false,in_Relase_Door_PB:false});r.step(1);const p=S.map(s=>+r.get(s)).join('');if(p!==prev){console.log(i,p);prev=p;}}console.log(S.join(' '));
