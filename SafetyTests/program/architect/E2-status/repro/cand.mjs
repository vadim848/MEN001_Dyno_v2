// Harness on editor candidates (read-only): candidates/<X>/native/TwinSafeGroup1.sal + GVL1.sgvl, new input names.
import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
import {SalRuntime} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-runtime.js';
const base='C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/';
export const raw0={in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,in_Reset_PB:false,in_Relase_Door_PB:false,in_Door_Monitor:true,in_Safety_Run:true,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,inPLC_BypassC1C2:false,in_LV_C1_FBK:false,in_HV_C2_FBK:false,in_STO_DR1_FBK:true,in_STO_DR2_FBK:true,in_LV_Faulty_FBK:false,in_HV_Faulty_FBK:false,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false};
export const ST=['b_Step1','b_Step12','b_Step_RnD','b_Step3','b_Step4','b_Step5','b_Step6'];
export function cand(name,mutate){
 const m=parseSalFile(base+name+'/native/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:base+name+'/native/GVL1.sgvl'});
 if(mutate)mutate(m);
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false});r.setInputs(raw0);r.t=0;r.hold={};r.plantC2=true;r.plant=true;
 r.step=(n=1,inp)=>{if(inp)r.setInputs(inp);for(let i=0;i<n;i++){const pl={in_STO_DR1_FBK:!r.get('STO_DR1'),in_STO_DR2_FBK:!r.get('STO_DR2')};if(r.plant)pl.in_LV_C1_FBK=r.get('out_LV_C1');if(r.plantC2)pl.in_HV_C2_FBK=r.get('out_HV_C2');r.setInputs({...pl,...r.hold});r.scan(1);r.t++;}return r;};
 r.ph=()=>ST.filter(s=>r.get(s)).map(s=>s.replace('b_Step','S')).join('+')||'none';
 r.blocks=new Map(m.networks.flatMap(n=>n.blocks).map(b=>[b.path,b]));
 return r;
}
export const gesture=(r,{green=false,blue=false,ms=600})=>{r.step(1,{in_Reset_PB:green,in_Relase_Door_PB:blue});r.step(ms);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});};
export const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
export const toRnd=(r)=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
export const toRun=(r)=>{toRnd(r);r.step(2100);gesture(r,{green:true,blue:true,ms:1100});r.step(3000);};
