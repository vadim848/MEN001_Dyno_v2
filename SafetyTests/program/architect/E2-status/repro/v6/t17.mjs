import {rt,gesture} from './run.mjs';
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const f=(mut,fbkSafe)=>{const r=rt({mut});boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);r.plantC2=false;r.hold={in_HV_C2_FBK:true};r.step(2100);gesture(r,{green:true,blue:true,ms:1100});r.step(100);return `${r.ph()} SU=${+r.get('recRndC_SU')} STO=${+r.get('STO_DR1')}`;};
const g=(mut)=>{const r=rt({mut});boot(r);r.plant=false;r.hold={in_LV_C1_FBK:true};gesture(r,{green:true,blue:true,ms:1100});r.step(300);return r.ph();};
console.log('FBK-10 R&D C2_FBK ON, BOTH: base',f([]),'| mut GATE_020.AndIn8',f([{op:'deactivate-input',block:'//RndPhysicalCompact/GATE_020',port:'AndIn8'}]));
console.log('FBK-10 Safe C1_FBK ON, BOTH: base',g([]),'| mut N2/FBAnd2.AndIn2',g([{op:'deactivate-input',block:'//Network2/FBAnd2',port:'AndIn2'}]));
