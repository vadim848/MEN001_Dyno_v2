import {rt} from './run.mjs';
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const f=(m)=>{const r=rt({mut:m},{in_LV_C1_FBK:true});r.plant=false;r.hold={in_LV_C1_FBK:true};r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(100);r.hold={in_LV_C1_FBK:false};r.step(500);r.step(1,{in_Reset_PB:true});r.step(300);const a=r.ph();r.step(1,{in_Reset_PB:false});r.step(10);return 'during press '+a+' after release '+r.ph();};
console.log('BOOT press-hold base          ',f([]));
console.log('BOOT press-hold M Boot.AndIn3 ',f([D('//Network3/FBAndBootFbkOff','AndIn3')]));
