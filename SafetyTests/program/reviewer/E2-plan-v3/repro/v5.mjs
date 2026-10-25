// Reviewer v3: intermediate stacks - Safe cover open + BOTH; R&D cover open + blue (model).
import {rt,gesture} from '../../../architect/E2-status/repro/run.mjs';
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
for(const [n,o] of [['F1+R1(no E2)',{e2a:false,e2b:false,e2c:false,e2d:false,e2e:false}],['R1+E2a',{e2b:false,e2c:false,e2d:false,e2e:false}],['R1+E2a+E2b',{e2c:false,e2d:false}],['+E2c',{e2d:false}],['full E2',{}]]){
 const r=rt(o); boot(r); r.step(1,{in_InterLock_NC_1:false}); r.step(10); gesture(r,{green:true,blue:true,ms:1100}); r.step(5000);
 const a=`${r.ph()} C1=${+r.get('out_LV_C1')} SU=${+r.get('recRndC_SU')}`;
 const q=rt(o); boot(q); gesture(q,{green:true,blue:true,ms:1100}); q.step(2500); q.step(1,{in_InterLock_NC_1:false}); q.step(10); q.step(1,{in_Relase_Door_PB:true}); q.step(700);
 console.log(n.padEnd(14),'Safe NC1 open + BOTH ->',a.padEnd(22),'| R&D NC1 open + blue 700 -> UL',+q.get('out_Door_Unlock_Solonoeid'), q.ph());
}
