import {rt,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const O=(r)=>`C1=${+r.get('out_LV_C1')} C2=${+r.get('out_HV_C2')} STO=${+r.get('STO_DR1')}${+r.get('STO_DR2')} SU=${+r.get('recRndC_SU')} SG=${+r.get('recRndC_SG')} HV_DIS=${+r.get('out_HV_Discharge_Request')}`;
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const toRnd=(r)=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
for(const d of [0,200,500,950,999,1000,1001,1002]){
 const r=rt(); toRnd(r); const t0=r.t; r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});
 let log=[],prev='';
 for(let i=0;i<4000;i++){ const inp={}; if(i===d) inp.in_LV_Healthy_FBK=true; if(i===1100){inp.in_Reset_PB=false;inp.in_Relase_Door_PB=false;} r.step(1,inp); const s=r.ph()+' '+O(r); if(s!==prev){log.push((r.t-t0)+':'+s);prev=s;} }
 console.log('LV faulty at +'+d,'viol',r.viol.length,'\n  '+log.join('\n  '));
}
