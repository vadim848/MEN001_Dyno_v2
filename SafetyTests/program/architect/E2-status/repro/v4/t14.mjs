import {rt,gesture} from './run.mjs';
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const f=(r,gap)=>{boot(r);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});let t=0;while(!r.get('b_Step12')&&t<3000){r.step(1);t++;}r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});const rel=r.t;let arr=0;while(!r.get('b_Step_RnD')){r.step(1);}arr=r.t-rel;r.step(gap-(r.t-rel));gesture(r,{green:true,blue:true,ms:1100});r.step(200);return `arrival+${arr} gesture@release+${gap} -> ${r.ph()} SU=${+r.get('recRndC_SU')}`;};
for(const [n,m] of [['base',null],['MODE.OrIn4',{op:'deactivate-input',block:'//SafeResumption/MODE',port:'OrIn4'}]])for(const gap of [1990,2050])console.log(n.padEnd(11),f(rt({mut:m?[m]:[]}),gap));
