import {cand,toRnd} from './cand.mjs';
const meas=(ev,off)=>{const r=cand('E2b');toRnd(r);r.step(2100);r.plantC2=false;r.hold={in_HV_C2_FBK:false};r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});let su=-1;for(let i=0;i<1500&&su<0;i++){r.step(1);if(r.get('recRndC_SU'))su=r.t;}
 const e=su+off;while(r.t<e-1)r.step(1);r.step(1,ev);const t0=r.t;const f={};const keys={EOk:()=>!r.get('b_EStop_Ok'),S4:()=>r.get('b_Step4'),LVdis:()=>r.get('out_LV_Discharge_Request'),C1off:()=>!r.get('out_LV_C1'),STOoff:()=>!r.get('STO_DR1'),C2off:()=>!r.get('out_HV_C2'),SS1:()=>!r.get('out_SS1_DR1')};
 for(let i=0;i<9000;i++){if(i===10)r.setInputs({in_Reset_PB:false,in_Relase_Door_PB:false});for(const [k,fn] of Object.entries(keys))if(f[k]==null&&fn())f[k]=r.t-t0;r.step(1);}
 return JSON.stringify(f);};
for(const off of [1,50])for(const [n,ev] of [['PLC',{in_Estop_PLC:true}],['NC1',{in_InterLock_NC_1:false}]])console.log('SU+'+off,n.padEnd(4),meas(ev,off));
