// Reviewer v4: G10 exit coincident with Bypass rising edge (base full E2 v4 model): per-scan trace.
import {rt,toRun} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const restart=r=>{r.step(20);r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});r.step(50);};
for(const plantOn of [false,true]){
const r=rt({}); toRun(r); r.step(1,{in_ES_NC_1:false}); r.step(100); r.step(1,{in_ES_NC_1:true}); restart(r); r.step(12000);
if(!plantOn){r.plant=false;r.plantC2=false;}
r.step(1,{in_Reset_PB:true}); console.log('plant FBK follow='+plantOn,'press scan (no bypass yet):',r.ph(),r.sts());
r.hold={inPLC_BypassC1C2:true,...(plantOn?{}:{in_LV_C1_FBK:false,in_HV_C2_FBK:false})};
const L=[];for(let i=0;i<3000;i++){ r.step(1,i===0?{in_Reset_PB:false}:undefined); if(i<12||i%500===0)L.push(`${i}:${r.ph()}/${r.sts()} C1=${+r.get('out_LV_C1')} C2=${+r.get('out_HV_C2')} STO=${+r.get('STO_DR1')} C1FBK=${+r.get('in_LV_C1_FBK')}`);}
console.log(L.join('\n'),'\nviol',r.viol.length,r.viol.slice(0,3).join(' '));}
