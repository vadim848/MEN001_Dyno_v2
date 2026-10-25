// Reviewer v4: Door-guard mutations vs UNL-05 / UNL-04 on full E2 v4 model. Door FALSE stable, NC1 FALSE (variant a), blue 1000 ms.
import {rt,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const toRnd=r=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
const unl=(mut,st,door,nc1)=>{const r=rt({mut});(st==='Safe'?boot:toRnd)(r);r.hold={in_Door_Monitor:door,in_InterLock_NC_1:nc1};r.step(2100);r.step(1,{in_Relase_Door_PB:true});let on=0;for(let i=0;i<1000;i++){r.step(1);on+=+r.get('out_Door_Unlock_Solonoeid');}r.step(1,{in_Relase_Door_PB:false});return `${on}`;};
for(const [n,mut] of [['base',[]],['N2/FBAnd8.AndIn1 deact',[D('//Network2/FBAnd8','AndIn1')]],['N2/FBAnd8.AndIn1 invert',[{op:'invert-contact',block:'//Network2/FBAnd8',port:'AndIn1'}]],['N1/FBOr3.OrIn1 deact',[D('//Network1/FBOr3','OrIn1')]],['N12/FBAnd2.AndIn4 deact',[D('//Network12/FBAnd2','AndIn4')]],['N12/FBAnd11.AndIn1 deact',[D('//Network12/FBAnd11','AndIn1')]],['N12/FBAnd3.AndIn2 deact',[D('//Network12/FBAnd3','AndIn2')]]]){
 console.log(n.padEnd(26),'Unlock-ON scans of 1000: UNL-05 Safe Door0 NC1=0:',unl(mut,'Safe',false,false),' R&D Door0 NC1=0:',unl(mut,'RnD',false,false),' UNL-04 Safe Door1 NC1=0:',unl(mut,'Safe',true,false),' R&D Door1 NC1=0:',unl(mut,'RnD',true,false));
}
