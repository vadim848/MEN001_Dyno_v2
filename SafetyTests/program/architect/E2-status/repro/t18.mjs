// v6: DIS-HOLD (HV/LV), EMG6-01-BOOT (g1 with FBK ON), Bypass gate (A); base and mutants (model)
import {rt,toRun,gesture} from './run.mjs';
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const watch=(r,sig,trig,n=3000)=>{let ta=-1,td=-1;for(let i=0;i<n;i++){r.step(1);if(ta<0&&r.get(trig))ta=r.t;if(td<0&&!r.get(sig))td=r.t;}return {ta,td};};
function hv(mut,rejected=false){const r=rt({mut});toRun(r);gesture(r,{green:true});r.step(3000);const pre=+r.get('out_HV_Discharge_Request');r.step(2100);
 if(rejected)r.setInputs({in_InterLock_NC_1:false});r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});const w=watch(r,'out_HV_Discharge_Request','recRndC_SU',1100);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(200);
 return `pre=${pre} SU@${w.ta} reqOFF@${w.td} (${w.ta>0&&w.td>0?'reqOFF-a='+(w.td-w.ta):'-'}) end req=${+r.get('out_HV_Discharge_Request')} ${r.ph()}`;}
function lv(mut){const r=rt({mut});boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);r.step(2100);gesture(r,{green:true});r.step(2000);const pre=+r.get('out_LV_Discharge_Request');r.step(2100);
 r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});const w=watch(r,'out_LV_Discharge_Request','b_Step12_Set',1100);return `pre=${pre} g2@${w.ta} reqOFF@${w.td} (${w.ta>0&&w.td>0?'reqOFF-a='+(w.td-w.ta):'-'})`;}
function bootFbk(mut){const r=rt({mut},{in_LV_C1_FBK:true});r.plant=false;r.hold={in_LV_C1_FBK:true};r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(50);const a=r.ph()+'/'+r.sts();
 r.hold={in_LV_C1_FBK:false};r.step(10);r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});r.step(50);return `FBK ON Restart -> ${a}; FBK OFF Restart -> ${r.ph()}/${r.sts()}`;}
function byp(mut){const r=rt({mut});boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);r.step(1,{inPLC_BypassC1C2:true});r.step(3000);return `R&D Bypass 3 s: C2=${+r.get('out_HV_C2')}`;}
console.log('HV base           ',hv([]));
console.log('HV base rejected  ',hv([],true));
console.log('HV M FBOr5.OrIn2  ',hv([D('//Network1/FBOr5','OrIn2')]));
console.log('LV base           ',lv([]));
console.log('LV M FBOr1.OrIn2  ',lv([D('//Network1/FBOr1','OrIn2')]));
console.log('BOOT base         ',bootFbk([]));
console.log('BOOT M Boot.AndIn1',bootFbk([D('//Network3/FBAndBootFbkOff','AndIn1')]));
console.log('BOOT M FBAnd1.AndIn3',bootFbk([D('//Network3/FBAnd1','AndIn3')]));
console.log('BYP base          ',byp([]));
console.log('BYP M FBAnd4.AndIn5',byp([D('//Network1/FBAnd4','AndIn5')]));
