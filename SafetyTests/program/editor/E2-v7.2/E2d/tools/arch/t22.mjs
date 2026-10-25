import {rt,gesture} from '../cand-run.mjs';
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const safe=(m,fbk)=>{const r=rt({mut:m});boot(r);r.plant=false;r.hold={in_LV_C1_FBK:fbk==='C1',in_HV_C2_FBK:fbk==='C2'};r.step(5);r.setInputs({inPLC_RnD_Mode:true});r.step(500);return r.ph()+' C1='+(+r.get('out_LV_C1'));};
const rnd=(m)=>{const r=rt({mut:m});boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);r.plantC2=false;r.hold={in_HV_C2_FBK:true};r.step(5);r.setInputs({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});r.step(1500);return r.ph()+' C2cmd='+(+r.get('out_HV_C2'))+' STO='+(+r.get('STO_DR1'));};
console.log('Safe C1_FBK ON + PLC10 base     ',safe([],'C1'),'| mut FBAnd91.AndIn5',safe([D('//Network2/FBAnd91','AndIn5')],'C1'));
console.log('Safe C2_FBK ON + PLC10 base     ',safe([],'C2'),'| mut FBAnd91.AndIn6',safe([D('//Network2/FBAnd91','AndIn6')],'C2'));
console.log('R&D C2_FBK ON + PLC11 base      ',rnd([]),'| mut FBAnd10.AndIn3',rnd([D('//Network12/FBAnd10','AndIn3')]));
console.log('Safe no FBK + PLC10 (positive)  ',safe([],'none'));
