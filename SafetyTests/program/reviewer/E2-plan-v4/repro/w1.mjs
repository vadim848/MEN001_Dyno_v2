// Reviewer v4: M-E2b-30 (FBOr1.OrIn4 = g7 in Reset S1) killer search: g5 (R&D->Safe) vs 1..3-scan emergency pulses.
import {rt,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const toRnd=r=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
const M=[{op:'deactivate-input',block:'//Network3/FBOr1',port:'OrIn4'}];
// base: find t1 (first scan b_Step1 after green 500 ms in R&D)
const down=(r)=>{toRnd(r);r.step(2100);r.step(1,{in_Reset_PB:true});return r.t;};
let t1;{const r=rt({});const t0=down(r);for(let i=0;i<20000;i++){r.step(1,i===600?{in_Reset_PB:false}:undefined);if(r.get('b_Step1')){t1=r.t-t0;break;}} console.log('base R&D->Safe: S1 at press+'+t1,'viol',r.viol.length);}
const causes={PLC:[{in_Estop_PLC:true},{in_Estop_PLC:false}],LVc:[{in_LV_Connector_Interlock:false},{in_LV_Connector_Interlock:true}],HVc:[{in_HV_Connector_Interlock:false},{in_HV_Connector_Interlock:true}],ES1:[{in_ES_NC_1:false},{in_ES_NC_1:true}],ES2:[{in_ES_NC_2:false},{in_ES_NC_2:true}],Mentee:[{in_Mentee_EStop:true},{in_Mentee_EStop:false}],NC1:[{in_InterLock_NC_1:false},{in_InterLock_NC_1:true}]};
const res={};let runs=0;
for(const mut of [[],M])for(const [cn,[on,off]] of Object.entries(causes))for(let len=1;len<=3;len++)for(let o=-12;o<=2;o++){
 const r=rt({mut});const t0=down(r);let both=false,v=0;
 for(let i=1;i<=t1+3000;i++){const rel=r.t-t0; let inp; if(rel===600)inp={...(inp||{}),in_Reset_PB:false}; if(rel===t1+o)inp={...(inp||{}),...on}; if(rel===t1+o+len)inp={...(inp||{}),...off}; r.step(1,inp); if(r.get('b_Step1')&&r.get('b_Step4'))both=true;}
 runs++; const k=(mut.length?'MUT':'BASE')+' '+cn; res[k]=res[k]||{both:0,viol:0,n:0,ex:[]}; res[k].n++; if(both)res[k].both++; if(r.viol.length){res[k].viol++; if(res[k].ex.length<3)res[k].ex.push(`len${len} o${o}: ${r.viol[0]} end ${r.ph()}`);}
}
console.log('runs',runs); for(const [k,v] of Object.entries(res))console.log(k.padEnd(12),'S1&S4 runs',v.both,'viol runs',v.viol,'/',v.n,v.ex.join(' | '));
