// Tester E1-f1-reclass: search for a reachable MU24 distinguisher with in_False_SI2_CH8 held constant FALSE
// (Q-MU06-01 B). Full canonical F1 program (all blocks) vs in-memory mutant GATE_016.AndIn4 Deactivated.
// Declared initial Safe: b_Step1 seeded before protocol (same convention as reviewer repro / tester lifecycle-source).
import {parseSalFile} from '../../../../src/sal-parser.js';
import {SalRuntime} from '../../../../src/sal-runtime.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno/';
const raw={in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,in_Reset_PB:false,in_Relase_Door_PB:false,in_Door_Monitor:true,in_Safety_Run:false,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,inPLC_BypassC1C2:false,in_LV_C1_FBK:false,in_HV_C2_FBK:false,in_STO_DR1_FBK:true,in_STO_DR2_FBK:true,in_LV_Healthy_FBK:true,in_HV_Healthy_FBK:true,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false};
let falseTouched=false;
function make(mut){const m=parseSalFile(root+'TwinSafeGroup1/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'GVLs/GVL1.sgvl'});const all=m.networks.flatMap(n=>n.blocks);
 if(mut){all.find(x=>x.path==='//RndPhysicalCompact/GATE_016').inputs.find(x=>x.name==='AndIn4').channelInterface='Deactivated';}
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false});r.setInputs(raw);
 const s=(i={},n=1)=>{if('in_False_SI2_CH8' in i)falseTouched=true;r.setInputs(i);for(let k=0;k<n;k++)r.scan(1);};
 s({},10);s({in_Reset_PB:true});s({in_Reset_PB:false});if(!r.get('b_EStop_Ok'))throw Error('estop');
 const b=all.find(x=>x.outputs.some(p=>p.globals.some(g=>g.resolvedName==='b_Step1')));r.memory.set(b.path,{value:true});r.write(b.outputs[0],true);s({},2100);return {r,s};}
function wait(r,s,k,v,b=3000){for(let i=0;i<b&&r.get(k)!==v;i++)s();if(r.get(k)!==v)throw Error('wait '+k);}
const both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false};
const ph=r=>['b_Step1','b_Step2','b_Step3','b_Step4','b_Step5','b_Step6','b_Step12','b_Step_RnD'].filter(p=>r.get(p)).join('+')||'-';
function toRnD(mut){const o=make(mut);const {r,s}=o;s(both,1000);wait(r,s,'out_LV_C1',true);s({in_LV_C1_FBK:true});wait(r,s,'b_Step_RnD',true);s(off,2100);return o;}
const ctx=process.argv[2]||'Safe';
const faults=[['in_InterLock_NC_1',false],['in_InterLock_NC_2',false],['in_LV_Connector_Interlock',false],['in_HV_Connector_Interlock',false],['in_Estop_PLC',true],['in_Mentee_EStop',true]];
const holds={green:{in_Reset_PB:true},blue:{in_Relase_Door_PB:true},none:{}};
const repress={both:[both,1100],blue:[{in_Relase_Door_PB:true},700],green:[{in_Reset_PB:true},700]};
const obs=['out_LV_C1','out_Door_Unlock_Solonoeid','b_Step_RnD','b_Step1','b_Step12','b_Step2','b_Step4'];
for(const [f,bad] of faults)for(const [hn,h] of Object.entries(holds))for(const gap of [998,1999,2001])for(const [rn,[rp,rlen]] of Object.entries(repress)){
 const res={};for(const mut of [false,true]){const {r,s}=ctx==='RnD'?toRnD(mut):make(mut);
  const before=ph(r);s(h,100);s({[f]:bad},300);const during=ph(r)+'/EOk='+r.get('b_EStop_Ok');s({[f]:!bad},700);const afterRestore=ph(r);
  s(off,gap);const seen={};s(rp);for(let i=0;i<rlen;i++){s();for(const o of obs)if(r.get(o))seen[o]=true;}
  s(off,50);res[mut?'MU24':'F1']={before,during,afterRestore,end:ph(r),EOk:r.get('b_EStop_Ok'),seen:Object.keys(seen).sort().join(',')};}
 const d=JSON.stringify(res.F1.seen)!==JSON.stringify(res.MU24.seen)||res.F1.end!==res.MU24.end;
 console.log(d?'DIFF':'same',ctx,f,'hold',hn,'gap',gap,'repress',rn,'F1',JSON.stringify(res.F1),'MU24',JSON.stringify(res.MU24));}
console.log('in_False_SI2_CH8 driven by protocol:',falseTouched);
