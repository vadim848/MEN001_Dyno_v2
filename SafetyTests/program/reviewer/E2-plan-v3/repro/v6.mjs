// Reviewer v3: Unlock in transitions/Run after MODE.OrIn4 := b_Step12 (E2d) and cover removal (E2b). Model.
import {rt,toRun,gesture} from '../../../architect/E2-status/repro/run.mjs';
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const UL=r=>+r.get('out_Door_Unlock_Solonoeid');
const blue=(r)=>{let mx=0;r.step(1,{in_Relase_Door_PB:true});for(let i=0;i<700;i++){r.step(1);mx=Math.max(mx,UL(r));}const s=r.ph();r.step(1,{in_Relase_Door_PB:false});return `UL(max)=${mx} ${s}`;};
for(const [n,o] of [['F1+R1+E2a',{e2b:false,e2c:false,e2d:false,e2e:false}],['full E2 (plan v3)',{}],['full E2, no MODE.OrIn4',{mut:[{op:'deactivate-input',block:'//SafeResumption/MODE',port:'OrIn4'}]}]]){
 const a=rt(o); boot(a); a.plant=false; a.hold={in_LV_C1_FBK:false}; gesture(a,{green:true,blue:true,ms:1100}); a.step(2100); const s12=blue(a);
 const b=rt(o); toRun(b); const run=blue(b);
 const c=rt(o); c.plantC2=false; c.hold={in_HV_C2_FBK:false}; boot(c); gesture(c,{green:true,blue:true,ms:1100}); c.step(2500); gesture(c,{green:true,blue:true,ms:1100}); c.step(2100); const su=blue(c);
 console.log(n.padEnd(24),'| S12 (2.1s after release) blue:',s12,'| Run blue:',run,'| SU blue:',su);
}
