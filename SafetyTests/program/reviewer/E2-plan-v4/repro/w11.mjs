// Reviewer v4: Q-T3-1 "A" (step = min(normal, emergency chain)) on plan v4 model, full E2 and R1+E2a+E2b.
// (1) R&D->Safe (green 500 ms) with event at p+off; (2) Run->R&D (green 600) with event at t_a+off. First OFF scans vs no-event.
import {rt,toRun,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const toRnd=r=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);r.step(2100);};
const sig={C1off:r=>!r.get('out_LV_C1'),STOoff:r=>!r.get('STO_DR1'),C2off:r=>!r.get('out_HV_C2')};
const meas=(o,phase,ev,off)=>{const r=rt(o); let p; if(phase==='RnD->Safe'){toRnd(r);p=r.t;r.step(1,{in_Reset_PB:true});} else {toRun(r);r.step(2000);p=r.t;r.step(1,{in_Reset_PB:true});}
 const t={};const init={};for(const [k,f] of Object.entries(sig))init[k]=f(r);
 for(let i=1;i<15000;i++){const rel=r.t-p; let inp; if(rel===600)inp={in_Reset_PB:false}; if(ev&&rel===off)inp={...(inp||{}),...ev}; r.step(1,inp); for(const [k,f] of Object.entries(sig)) if(t[k]===undefined&&!init[k]&&f(r))t[k]=r.t-p;}
 return Object.keys(sig).map(k=>k+'='+(init[k]?'n/a':(t[k]??'never'))).join(' ')+' end '+r.ph();};
for(const [sn,o] of [['R1+E2a+E2b',{e2c:false,e2d:false}],['R1+E2a..E2d',{}]]){
 console.log(sn,'R&D->Safe no event      ',meas(o,'RnD->Safe',null));
 for(const off of [300,499,501,502,503,505,520]) console.log(sn,`R&D->Safe ES1 at p+${off}`.padEnd(24),meas(o,'RnD->Safe',{in_ES_NC_1:false},off));
 console.log(sn,'Run->R&D no event       ',meas(o,'Run->RnD',null));
 for(const off of [505,520,1000,1900,2100]) console.log(sn,`Run->R&D ES1 at t_a+${off}`.padEnd(24),meas(o,'Run->RnD',{in_ES_NC_1:false},off));
}
