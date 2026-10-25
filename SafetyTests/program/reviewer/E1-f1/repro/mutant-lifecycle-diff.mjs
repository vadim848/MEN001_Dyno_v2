// Reviewer G4 E1-f1: full-program (all 242 blocks) differential F1 vs in-memory port mutant on a REAL
// lifecycle: declared initial Safe (Step1 seed before protocol, same convention as tester lifecycle-source)
// -> BOTH -> RnD -> BOTH launch -> Run -> green accepted -> protective cause pulse/restore.
import {parseSalFile} from '../../../../src/sal-parser.js';
import {SalRuntime} from '../../../../src/sal-runtime.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/resumed-f1/native/';
const raw={in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,in_Reset_PB:false,in_Relase_Door_PB:false,in_Door_Monitor:true,in_Safety_Run:false,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,inPLC_BypassC1C2:false,in_LV_C1_FBK:false,in_HV_C2_FBK:false,in_STO_DR1_FBK:true,in_STO_DR2_FBK:true,in_LV_Healthy_FBK:true,in_HV_Healthy_FBK:true,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false};
const MUT={F1:null,MU12:['//Network6/RUN_DOWN_RESET','OrIn3'],MU11:['//Network6/RUN_DOWN_RESET','OrIn2'],MU24:['//RndPhysicalCompact/GATE_016','AndIn4']};
function make(mut){const m=parseSalFile(root+'TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'GVL1.sgvl'});const all=m.networks.flatMap(n=>n.blocks);
 if(MUT[mut]){const [b,p]=MUT[mut];const port=all.find(x=>x.path===b).inputs.find(x=>x.name===p);if(!port)throw Error('no port');port.channelInterface='Deactivated';}
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false});r.setInputs(raw);const s=(i={},n=1)=>{r.setInputs(i);for(let k=0;k<n;k++)r.scan(1);};
 s({},10);s({in_Reset_PB:true});s({in_Reset_PB:false});if(!r.get('b_EStop_Ok'))throw Error('estop');
 const b=all.find(x=>x.outputs.some(p=>p.globals.some(g=>g.resolvedName==='b_Step1')));r.memory.set(b.path,{value:true});r.write(b.outputs[0],true);
 s({},2100);return {r,s};}
function wait(r,s,k,v,b=3000){for(let i=0;i<b&&r.get(k)!==v;i++)s();if(r.get(k)!==v)throw Error('wait '+k);}
const both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false};
function toRun(mut){const {r,s}=make(mut);s(both,1000);wait(r,s,'out_LV_C1',true);s({in_LV_C1_FBK:true});wait(r,s,'b_Step_RnD',true);s(off,2100);
 s({in_STO_DR1_FBK:false,in_STO_DR2_FBK:false,in_HV_C2_FBK:true,in_HV_Healthy_FBK:true});s(both,1000);wait(r,s,'STO_DR1',true);wait(r,s,'STO_DR2',true);s({in_LV_Healthy_FBK:false,in_HV_Healthy_FBK:false});wait(r,s,'b_Step3',true);s(off,2100);
 if(!r.get('b_Step3'))throw Error('no Run');return {r,s};}
const watch=['b_Step1','b_Step2','b_Step3','b_Step4','b_Step5','b_Step6','b_Step12','b_Step_RnD','//Network6/RUN_DOWN_OWNER/RsOut','//Network6/FBOr5/OrOut','STO_DR1','STO_DR2','out_HV_C2','out_LV_C1','out_HV_Discharge_Request','out_Door_Unlock_Solonoeid','b_EStop_Ok'];
const faults=[['in_InterLock_NC_1',false],['in_InterLock_NC_2',false],['in_Estop_PLC',true],['in_ES_NC_1',false],['in_LV_Connector_Interlock',false],['in_HV_Connector_Interlock',false],['in_Mentee_EStop',true],['in_False_SI2_CH8',true],['in_HV_Healthy_FBK',true]];
const mut=process.argv[2];let diffs=0,cases=0;
for(const [f,bad] of faults)for(const at of [490,500,501,502,506,600])for(const width of [1,3,50]){cases++;
 const A=toRun('F1'),B=toRun(mut);const trace=[];
 for(let t=0;t<2600;t++){let inp={};if(t===0)inp.in_Reset_PB=true;if(t===at)inp[f]=bad;if(t===at+width)inp[f]=!bad;if(t===1500)inp.in_Reset_PB=false;
  A.s(inp);B.s(inp);for(const w of watch)if(A.r.get(w)!==B.r.get(w)){trace.push({t,w,F1:A.r.get(w),[mut]:B.r.get(w)});}}
 if(trace.length){diffs++;console.log(mut,f,'at',at,'w',width,'first diffs',JSON.stringify(trace.slice(0,4)),'n',trace.length);}}
console.log(mut,'cases',cases,'distinguishing',diffs);
