import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
import {SalRuntime} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-runtime.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno';
export const ph=['b_Step1','b_Step2','b_Step3','b_Step4','b_Step5','b_Step6','b_Step12','b_Step_RnD'];
export const raw0={in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,in_Reset_PB:false,in_Relase_Door_PB:false,in_Door_Monitor:true,in_Safety_Run:true,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,inPLC_BypassC1C2:false,in_LV_C1_FBK:false,in_HV_C2_FBK:false,in_STO_DR1_FBK:true,in_STO_DR2_FBK:true,in_LV_Healthy_FBK:false,in_HV_Healthy_FBK:false,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false};
export function make(over={}){
 const m=parseSalFile(root+'/TwinSafeGroup1/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'/GVLs/GVL1.sgvl'});
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false});
 r.setInputs({...raw0,...over});
 // plant: FBK follow outputs with 1 scan; STO FBK = !STO output (STO_DR TRUE = torque enabled -> STO fbk false)
 r.t=0; r.plant=true; r.lvhFollow=null;
 r.step=(n=1,inp)=>{ if(inp) r.setInputs(inp); for(let i=0;i<n;i++){ if(r.plant){ r.setInputs({in_LV_C1_FBK:r.get('out_LV_C1'),in_HV_C2_FBK:r.get('out_HV_C2'),in_STO_DR1_FBK:!r.get('STO_DR1'),in_STO_DR2_FBK:!r.get('STO_DR2')}); } r.scan(1); r.t++; } return r; };
 r.ph=()=>ph.filter(p=>r.get(p)).map(p=>p.replace('b_Step','S')).join('+')||'none';
 return {r,m};
}
