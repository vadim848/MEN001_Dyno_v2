import {createRndDownFixture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/rnd-down-source.js';
const both={in_Reset_PB:true,in_Relase_Door_PB:true};
function obs(x,k,v,b=2500){const e=x.clock.timeMs+b;while(x.get(k)!==v&&x.clock.timeMs<e)x.sample();return x.get(k)===v;}
for(const [lv,hv] of [[false,false],[true,false],[false,true],[true,true]]){
 const x=createRndDownFixture();let err=null;
 try{x.sample({in_LV_Healthy_FBK:lv,in_HV_Healthy_FBK:hv});}catch(e){err=e.message;}
 x.sample(both);x.advance(1000);const lvOn=obs(x,'lv',true);x.sample({in_LV_C1_FBK:true});const rnd=obs(x,'b_Step_RnD',true);
 console.log(`LVraw=${lv} HVraw=${hv} err=${err} C1cmd=${lvOn} R&D=${rnd} t=${x.clock.timeMs}`);}
