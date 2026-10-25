// v7.2: legacy PLC R&D->Run with FBK-10 gate "not C2_FBK or out_HV_C2": positive control, unsolicited FBK, raw-level mutant
import {rt,gesture} from '../cand-run.mjs';
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const pos=(m,x)=>{const r=rt({mut:m});boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);r.plantC2=false;r.hold={in_HV_C2_FBK:false};r.setInputs({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});let u=-1,run=-1;
 for(let i=0;i<3000;i++){r.step(1);if(u<0&&r.get('out_HV_C2'))u=r.t;if(u>0&&r.t>=u+x)r.hold={in_HV_C2_FBK:true};if(run<0&&r.get('b_Step3'))run=r.t;}return `FBK at u+${x}: Run ${run<0?'never':'u+'+(run-u)} ${r.ph()} C2=${+r.get('out_HV_C2')} STO=${+r.get('STO_DR1')}`;};
const neg=(m)=>{const r=rt({mut:m});boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);r.plantC2=false;r.hold={in_HV_C2_FBK:true};r.step(5);r.setInputs({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});r.step(1500);return `unsolicited C2_FBK: ${r.ph()} C2cmd=${+r.get('out_HV_C2')} STO=${+r.get('STO_DR1')}`;};
for(const x of [1,250,499])console.log('POS base        ',pos([],x));
console.log('POS M raw-level (OrIn2 deact)',pos([D('//Network12/FBOrFbk10C2','OrIn2')],1));
console.log('NEG base        ',neg([]));
console.log('NEG M FBOrFbk10C2.OrIn1 deact',neg([D('//Network12/FBOrFbk10C2','OrIn1')]));
console.log('NEG M FBAnd10.AndIn3 deact   ',neg([D('//Network12/FBAnd10','AndIn3')]));
