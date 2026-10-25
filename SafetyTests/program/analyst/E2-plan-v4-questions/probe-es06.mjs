// Analyst probe (diagnostic, not oracle): ES-06 mutant N3/FBAnd1.AndIn2 deactivated vs base, full E2 v4 model stack.
// Question: is the boot stage memory (S1 before Restart) observable through requirement-level outputs/status?
import {rt} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const MUT=[D('//Network3/FBAnd1','AndIn2')];
const OUT=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_Door_Unlock_Solonoeid','b_EStop_Ok'];
const sig=r=>OUT.map(k=>+r.get(k)).join('')+'|'+r.sts();
const full=r=>sig(r)+'|'+r.ph();
const scen={
 'boot idle 300, Restart': r=>[[300,{}],[1,{in_Reset_PB:true}],[1,{in_Reset_PB:false}],[300,{}]],
 'boot blue 700 (no Restart)': r=>[[50,{}],[700,{in_Relase_Door_PB:true}],[1,{in_Relase_Door_PB:false}],[200,{}]],
 'boot Bypass 300 (no Restart)': r=>[[50,{}],[300,{inPLC_BypassC1C2:true}],[1,{inPLC_BypassC1C2:false}],[200,{}]],
 'boot PLC RnD_Mode 300 (no Restart)': r=>[[50,{}],[300,{inPLC_RnD_Mode:true}],[1,{inPLC_RnD_Mode:false}],[200,{}]],
 'boot ES pressed, Restart while pressed, release, no 2nd Restart': r=>[[1,{in_ES_NC_1:false}],[50,{}],[1,{in_Reset_PB:true}],[1,{in_Reset_PB:false}],[50,{}],[1,{in_ES_NC_1:true}],[300,{}]],
 'boot ES pressed, release, Restart': r=>[[1,{in_ES_NC_1:false}],[50,{}],[1,{in_ES_NC_1:true}],[50,{}],[1,{in_Reset_PB:true}],[1,{in_Reset_PB:false}],[300,{}]],
 'boot Restart then blue 700 at +2100': r=>[[20,{}],[1,{in_Reset_PB:true}],[1,{in_Reset_PB:false}],[2100,{}],[700,{in_Relase_Door_PB:true}],[1,{in_Relase_Door_PB:false}],[100,{}]],
 'boot Restart then BOTH 1100 at +2100': r=>[[20,{}],[1,{in_Reset_PB:true}],[1,{in_Reset_PB:false}],[2100,{}],[1100,{in_Reset_PB:true,in_Relase_Door_PB:true}],[1,{in_Reset_PB:false,in_Relase_Door_PB:false}],[2500,{}]],
};
const run=(mut,steps)=>{const r=rt({mut});const s=[],f=[];for(const [n,inp] of steps(r)){r.step(1,inp);s.push(sig(r));f.push(full(r));for(let i=1;i<n;i++){r.step(1);s.push(sig(r));f.push(full(r));}}return {s,f,viol:r.viol.length};};
for(const [name,steps] of Object.entries(scen)){
 const a=run([],steps),b=run(MUT,steps);
 const d=a.s.findIndex((x,i)=>x!==b.s[i]); const df=a.f.findIndex((x,i)=>x!==b.f[i]);
 console.log(name.padEnd(62),'outputs/status first diff:',d<0?'none':`scan ${d+1} base ${a.s[d]} mut ${b.s[d]}`,'| incl. stage first diff:',df<0?'none':`scan ${df+1} base ${a.f[df]} mut ${b.f[df]}`,'| end base',a.f.at(-1),'viol',a.viol,b.viol);
}
// Part 2: Restart with contactor feedback ON (SPEC §12 p.4, EMG6-01 "Restart при FBK ON -> Emergency").
for(const fb of ['in_LV_C1_FBK','in_HV_C2_FBK']){
 const go=mut=>{const r=rt({mut});r.plantC2=false;r.hold={[fb]:true};const s=[];r.step(50);s.push(full(r));r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});for(let i=0;i<300;i++){r.step(1);s.push(full(r));}return s;};
 const a=go([]),b=go(MUT);const d=a.findIndex((x,i)=>x!==b[i]);
 console.log(('boot '+fb+' held TRUE, Restart').padEnd(62),'first diff:',d<0?'none':`#${d} base ${a[d]} mut ${b[d]}`,'| end base',a.at(-1),'mut',b.at(-1));
}
