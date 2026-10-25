// v4 checks: L1 connector vs in_Estop_PLC (B3-1), E2a-RC timing and mutants, G10 AndIn1/AndIn6 killers (B3-5), Unlock R&D cover open (Q-ARCH-10 A)
import {rt,gesture} from './run.mjs';
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const toRnd=(r)=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const first=(r,pred,max=20000)=>{for(let i=1;i<=max;i++){r.step(1);if(pred())return i;}return -1;};
// L1
for(const [st,ev] of [['R&D',{in_Estop_PLC:true}],['R&D',{in_LV_Connector_Interlock:false}],['R&D',{in_HV_Connector_Interlock:false}]]){
 const r=rt({}); toRnd(r); r.setInputs(ev); const eok=first(r,()=>!r.get('b_EStop_Ok')); const s4=first(r,()=>r.get('b_Step4'))+eok;
 console.log('L1',st,JSON.stringify(ev),'EStop_Ok falls at e+'+(eok-1),'S4 at e+'+(s4-1));
}
// E2a-RC: Run timing vs C2_FBK
const rc=(mut,{fbkDelay=30,dip=null,hvBad=false}={})=>{const r=rt({mut}); toRnd(r); r.plantC2=false; r.hold={in_HV_C2_FBK:false,...(hvBad?{in_HV_Healthy_FBK:true}:{})};
 r.step(2100); r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true}); const t0=first(r,()=>r.get('out_HV_C2'),3000); const tc=r.t;
 r.step(fbkDelay); r.hold={...r.hold,in_HV_C2_FBK:true}; const tf=r.t; let tr=-1;
 for(let i=0;i<400;i++){ if(dip!==null&&r.t===tf+dip){r.hold={...r.hold,in_HV_C2_FBK:false};r.step(1);r.hold={...r.hold,in_HV_C2_FBK:true};continue;} r.step(1); if(r.get('b_Step3')&&tr<0)tr=r.t; }
 return `cmd@0 FBK@${tf-tc} Run@${tr<0?'none':tr-tc} (rel FBK ${tr<0?'-':tr-tf})`;};
for(const [n,m,o] of [['base',[],{}],['base dip@40',[],{dip:40}],['base HV faulty',[],{hvBad:true}],['FBAnd6.AndIn2',[D('//Network12/FBAnd6','AndIn2')],{}],['FBAnd6.AndIn3',[D('//Network12/FBAnd6','AndIn3')],{hvBad:true}],['FBAnd6.AndIn2 dip@40',[D('//Network12/FBAnd6','AndIn2')],{dip:40}]])console.log('RC',n.padEnd(22),rc(m,o));
// G10 AndIn1 killer: R&D EStop, ES released, Restart during S4 at +2.5 s (C1 already OFF)
for(const [n,m] of [['base',[]],['G10.AndIn1',[D('//Network3/G10_EXIT','AndIn1')]]]){const r=rt({mut:m}); toRnd(r); r.step(1,{in_ES_NC_1:false}); r.step(100); r.step(1,{in_ES_NC_1:true}); r.step(2400); r.step(1,{in_Reset_PB:true}); r.step(100); r.step(1,{in_Reset_PB:false}); r.step(50); console.log('G10 AndIn1',n.padEnd(12),r.ph(),'viol',r.viol.length);}
// G10 AndIn6 killer: S6, C2_FBK forced TRUE, Restart
for(const [n,m] of [['base',[]],['G10.AndIn6',[D('//Network3/G10_EXIT','AndIn6')]]]){const r=rt({mut:m}); toRnd(r); r.step(1,{in_ES_NC_1:false}); r.step(12000); r.plantC2=false; r.hold={in_HV_C2_FBK:true}; r.step(1,{in_ES_NC_1:true}); r.step(20); r.step(1,{in_Reset_PB:true}); r.step(100); r.step(1,{in_Reset_PB:false}); r.step(50); console.log('G10 AndIn6',n.padEnd(12),r.ph(),'C2FBK',+r.get('in_HV_C2_FBK'));}
// Unlock R&D cover open (Q-ARCH-10 A), S12 and Run forbidden
{ const r=rt({}); toRnd(r); r.step(1,{in_InterLock_NC_1:false}); r.step(10); r.step(1,{in_Relase_Door_PB:true}); r.step(700); console.log('UNL R&D cover open blue 700: UL',+r.get('out_Door_Unlock_Solonoeid')); }
