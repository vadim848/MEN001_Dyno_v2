import {rt,gesture} from './run.mjs';
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const s12=r=>{boot(r);r.plant=false;r.hold={in_LV_C1_FBK:false};gesture(r,{green:true,blue:true,ms:1100});r.step(30);r.step(1,{in_ES_NC_1:false});r.step(3000);return `${r.ph()} C1=${+r.get('out_LV_C1')} viol=${r.viol.length}`;};
const g10hold=r=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);r.step(1,{in_ES_NC_1:false});r.step(12000);r.step(1,{in_ES_NC_1:true});r.step(20);r.step(1,{in_Reset_PB:true});r.step(300);return r.ph()+' (green still held)';};
for(const [n,m,f] of [['base',null,s12],['STAGE_LVON.OrIn1',{op:'deactivate-input',block:'//Network6/STAGE_LVON',port:'OrIn1'},s12],['base',null,g10hold],['G10.AndIn3',{op:'deactivate-input',block:'//Network3/G10_EXIT',port:'AndIn3'},g10hold]])
 console.log(n.padEnd(18),f(rt({mut:m?[m]:[]})));
