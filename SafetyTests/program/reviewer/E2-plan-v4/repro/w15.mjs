// Reviewer v4: survivors from S2 split on the full E2 v4 model: ES-06 (N3/FBAnd1.AndIn2) and UL-05 (N12/FBAnd2.AndIn3).
import {rt,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const OUT=['out_LV_C1','out_HV_C2','STO_DR1','out_Door_Unlock_Solonoeid','b_Step1','b_EStop_Ok'];
const sig=r=>OUT.map(k=>+r.get(k)).join('')+'|'+r.ph();
// ES-06: boot without Restart (ES ok / ES pressed), then Restart; per-scan signature diff vs base
const es06=(mut,es)=>{const r=rt({mut});r.setInputs({in_ES_NC_1:es});const s=[];for(let i=0;i<300;i++){r.step(1);s.push(sig(r));}r.step(1,{in_ES_NC_1:true});r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});for(let i=0;i<300;i++){r.step(1);s.push(sig(r));}return s;};
for(const es of [true,false]){const a=es06([],es),b=es06([D('//Network3/FBAnd1','AndIn2')],es);const d=a.findIndex((x,i)=>x!==b[i]);console.log('ES-06 boot ES_NC_1='+es,'first diff scan',d,d>=0?`base ${a[d]} mut ${b[d]}`:'(none)');}
// UL-05: R&D, blue from 0, green pressed at g..1000, blue released 1500
const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const ul=(mut,g,st)=>{const r=rt({mut});boot(r);if(st==='RnD'){gesture(r,{green:true,blue:true,ms:1100});r.step(2500);}r.step(2100);const s=[];for(let i=0;i<2000;i++){const inp={};if(i===0)inp.in_Relase_Door_PB=true;if(i===g)inp.in_Reset_PB=true;if(i===1000)inp.in_Reset_PB=false;if(i===1500)inp.in_Relase_Door_PB=false;r.step(1,inp);s.push(sig(r));}return s;};
for(const st of ['Safe','RnD'])for(const g of [0,1,100,499,500,501,700]){const a=ul([],g,st),b=ul([D('//Network12/FBAnd2','AndIn3')],g,st);const d=a.findIndex((x,i)=>x!==b[i]);console.log('UL-05',st,'green at',g,'first diff',d,d>=0?`base ${a[d]} mut ${b[d]}`:'(none)','end',a[a.length-1]);}
