// Reviewer: is GAP-HELD-ACROSS (Run held while IL1 lost/Estop_PLC raised and restored) reachable in the full
// program on a real lifecycle? Also F1 vs MU24 (GATE_016.AndIn4 deactivated) on that full-program sequence.
import {parseSalFile} from '../../../../src/sal-parser.js';
import {SalRuntime} from '../../../../src/sal-runtime.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/resumed-f1/native/';
const raw={in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,in_Reset_PB:false,in_Relase_Door_PB:false,in_Door_Monitor:true,in_Safety_Run:false,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,inPLC_BypassC1C2:false,in_LV_C1_FBK:false,in_HV_C2_FBK:false,in_STO_DR1_FBK:true,in_STO_DR2_FBK:true,in_LV_Healthy_FBK:true,in_HV_Healthy_FBK:true,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false};
function make(mut){const m=parseSalFile(root+'TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'GVL1.sgvl'});const all=m.networks.flatMap(n=>n.blocks);
 if(mut){all.find(x=>x.path==='//RndPhysicalCompact/GATE_016').inputs.find(x=>x.name==='AndIn4').channelInterface='Deactivated';}
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false});r.setInputs(raw);const s=(i={},n=1)=>{r.setInputs(i);for(let k=0;k<n;k++)r.scan(1);};
 s({},10);s({in_Reset_PB:true});s({in_Reset_PB:false});
 const b=all.find(x=>x.outputs.some(p=>p.globals.some(g=>g.resolvedName==='b_Step1')));r.memory.set(b.path,{value:true});r.write(b.outputs[0],true);s({},2100);return {r,s};}
function wait(r,s,k,v,b=3000){for(let i=0;i<b&&r.get(k)!==v;i++)s();if(r.get(k)!==v)throw Error('wait '+k);}
const both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false};
const ph=r=>['b_Step1','b_Step2','b_Step3','b_Step4','b_Step5','b_Step6','b_Step12','b_Step_RnD'].filter(p=>r.get(p)).join('+');
for(const mut of [false,true])for(const [f,bad] of [['in_InterLock_NC_1',false],['in_Estop_PLC',true],['in_False_SI2_CH8',true],['in_InterLock_NC_2',false],['in_LV_Connector_Interlock',false]]){
 const {r,s}=make(mut);s(both,1000);wait(r,s,'out_LV_C1',true);s({in_LV_C1_FBK:true});wait(r,s,'b_Step_RnD',true);s(off,2100);
 s({in_STO_DR1_FBK:false,in_STO_DR2_FBK:false,in_HV_C2_FBK:true,in_HV_Healthy_FBK:true});s(both,1000);wait(r,s,'STO_DR1',true);wait(r,s,'STO_DR2',true);s({in_LV_Healthy_FBK:false,in_HV_Healthy_FBK:false});wait(r,s,'b_Step3',true);s(off,2100);
 const before=ph(r);s({in_Reset_PB:true},100);s({[f]:bad},300);const during=ph(r);s({[f]:!bad},700);const after=ph(r);
 let down=false;const chk=()=>{if(r.get('//Network6/RUN_DOWN_OWNER/RsOut')||r.get('//Network6/FBOr5/OrOut'))down=true;};
 s({in_Reset_PB:false});for(let i=0;i<998;i++){s();chk();}s({in_Reset_PB:true});for(let i=0;i<800;i++){s();chk();}
 console.log(mut?'MU24':'F1',f,'before',before,'during',during,'afterRestore',after,'end',ph(r),'EStopOk',r.get('b_EStop_Ok'),'RunDownAfterRepress',down);}
