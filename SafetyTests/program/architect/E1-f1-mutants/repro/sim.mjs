import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
import {SalRuntime} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-runtime.js';
const root=process.env.SALROOT||'C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/resumed-f1/native';
const salName=process.env.SALROOT?'/TwinSafeGroup1/TwinSafeGroup1.sal':'/TwinSafeGroup1.sal';const gvlName=process.env.SALROOT?'/GVLs/GVL1.sgvl':'/GVL1.sgvl';
export const phases=['b_Step1','b_Step2','b_Step3','b_Step4','b_Step5','b_Step6','b_Step12','b_Step_RnD'];
export const raw0={in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,in_Reset_PB:false,in_Relase_Door_PB:false,in_Door_Monitor:true,in_Safety_Run:false,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,inPLC_BypassC1C2:false,in_LV_C1_FBK:true,in_HV_C2_FBK:true,in_STO_DR1_FBK:false,in_STO_DR2_FBK:false,in_LV_Healthy_FBK:false,in_HV_Healthy_FBK:false,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false};
export const MUT={F1:null,MU06:['//Network6/FBAnd24','AndIn2'],MU10:['//Network6/RUN_DOWN_RESET','OrIn1'],MU11:['//Network6/RUN_DOWN_RESET','OrIn2']};
export function make(mut,{seed='b_Step3'}={}){
 const m=parseSalFile(root+salName,{bindingMode:'current',sgvlPath:root+gvlName});
 const all=m.networks.flatMap(n=>n.blocks);
 if(MUT[mut]){const [b,p]=MUT[mut];const port=all.find(x=>x.path===b).inputs.find(x=>x.name===p);port.channelInterface='Deactivated';}
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false});
 r.setInputs(raw0);
 for(let i=0;i<10;i++)r.scan(1);
 r.setInputs({in_Reset_PB:true});r.scan(1);r.setInputs({in_Reset_PB:false});r.scan(1);
 if(!r.get('b_EStop_Ok'))throw Error('estop');
 if(seed){const b=all.find(x=>x.outputs.some(p=>p.globals.some(g=>g.resolvedName===seed)));r.memory.set(b.path,{value:true});r.write(b.outputs[0],true);}
 for(let i=0;i<2100;i++)r.scan(1);
 return {r,all,m};
}
export function snapshot(r){return [...r.values.entries()].filter(([k])=>!k.endsWith('/Delay Time (s)')).sort((a,b)=>a[0]<b[0]?-1:1);}
