import {rt,toRun} from './run.mjs';
const f=r=>{toRun(r);r.step(1,{in_ES_NC_1:false});r.step(100);r.step(1,{in_ES_NC_1:true});r.step(20);r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});r.step(12000);r.step(1,{in_Reset_PB:true});r.step(300);const a=r.ph();r.step(1,{in_Reset_PB:false});r.step(10);return a+' during hold -> '+r.ph()+' after release';};
for(const [n,m] of [['base',null],['G10.AndIn3',{op:'deactivate-input',block:'//Network3/G10_EXIT',port:'AndIn3'}]])console.log(n.padEnd(12),f(rt({mut:m?[m]:[]})));
