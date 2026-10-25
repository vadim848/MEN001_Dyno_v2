// Reviewer v6 x2: alternative HV reset source = N12/FBAnd4.AndOut (existing Symbol b_Set_HV_C2_1, gated by b_Step_RnD and cover)
// instead of linkRunUpAccepted (N12/FBOr1.OrOut). Feasibility sketch only (model on architect's v6 proto), not a design.
import {build} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/proto.mjs';
import {SalRuntime} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-runtime.js';
import {raw0} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/h.mjs';
const ALT=process.argv[2]==='alt';
const ST=['b_Step1','b_Step12','b_Step_RnD','b_Step3','b_Step4','b_Step5','b_Step6','b_Step2'];
const STS=['//Network3/DEC_SAFE/AndOut','//Network3/DEC_RND/AndOut','//Network3/DEC_RUN/AndOut','//Network3/DEC_EMG/AndOut'];
function rt(){const {m}=build({});
 if(ALT){const b=m.networks.flatMap(n=>n.blocks).find(b=>b.path==='//Network1/FBOr5');b.inputs.find(i=>i.name==='OrIn2').globals=[{resolvedName:'b_Set_HV_C2_1'}];}
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false});r.setInputs({...raw0});r.t=0;
 r.step=(n=1,inp)=>{if(inp)r.setInputs(inp);for(let i=0;i<n;i++){r.setInputs({in_LV_C1_FBK:r.get('out_LV_C1'),in_HV_C2_FBK:r.get('out_HV_C2'),in_STO_DR1_FBK:!r.get('STO_DR1'),in_STO_DR2_FBK:!r.get('STO_DR2')});r.scan(1);r.t++;}return r;};
 r.ph=()=>ST.filter(s=>r.get(s)).map(s=>s.replace('b_Step','S')).join('+')||'none';
 r.sts=()=>STS.filter(s=>r.get(s)).map(s=>s.split('/')[3].slice(4)).join('+');return r;}
const gesture=(r,{green=false,blue=false,ms=600})=>{r.step(1,{in_Reset_PB:green,in_Relase_Door_PB:blue});r.step(ms);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});};
const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const H='out_HV_Discharge_Request';
const S=['out_HV_C2',H];
const tr=(r,n)=>{let prev='',log=[],t0=r.t;for(let i=0;i<n;i++){r.step(1);const s=r.ph()+'|'+r.sts()+'|'+S.map(x=>x.replace('out_','').replace('_Discharge_Request','REQ')+'='+(+!!r.get(x))).join(',');if(s!==prev){log.push((r.t-t0)+':'+s);prev=s;}}return log.join('  ');};
const toRnd=r=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
const toRun=r=>{toRnd(r);gesture(r,{green:true,blue:true,ms:1100});r.step(3000);};
console.log(ALT?'ALT b_Set_HV_C2_1':'v6 linkRunUpAccepted');
{const r=rt();toRun(r);gesture(r,{green:true});r.step(5100);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});
 let a=-1,u=-1,d=-1;for(let i=0;i<1300;i++){r.step(1);if(a<0&&r.get('recRndC_SU'))a=r.t;if(u<0&&r.get('out_HV_C2'))u=r.t;if(a>0&&d<0&&!r.get(H))d=r.t;}
 console.log(' buttons R&D->Run: a',a,'u-a',u-a,'reqOFF-a',d-a);}
{const r=rt();toRun(r);gesture(r,{green:true});r.step(5100);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});
 let a=-1;for(let i=0;i<1300&&a<0;i++){r.step(1);if(r.get('recRndC_SU'))a=r.t;}r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(48);
 r.setInputs({in_ES_NC_1:false});console.log(' ES in StartingRun a+50:',tr(r,10000));}
{const r=rt();boot(r);r.step(1,{inPLC_RnD_Mode:true});r.step(3000);r.step(1,{inPLC_RnD_Mode_2:true});r.step(3000);
 r.setInputs({in_ES_NC_1:false});console.log(' legacy PLC Run(1,1) held, ES:',tr(r,10000));}
{const r=rt();toRun(r);gesture(r,{green:true});r.step(5100);r.step(1,{in_InterLock_NC_1:false});r.step(100);r.step(1,{inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});console.log(' legacy PLC (1,1) cover open in R&D:',tr(r,1500));}
{const r=rt();toRun(r);gesture(r,{green:true});r.step(5100);r.step(1,{inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});
 let u=-1,d=-1;const t0=r.t;for(let i=0;i<1500;i++){r.step(1);if(u<0&&r.get('out_HV_C2'))u=r.t;if(d<0&&!r.get(H))d=r.t;}console.log(' legacy PLC R&D->Run accepted: u',u-t0,'reqOFF',d-t0,r.ph(),r.sts());}
{const r=rt();toRun(r);gesture(r,{green:true});r.step(5100);r.step(1,{in_ES_NC_1:false});r.step(0);
 let mn=1;r.step(1,{inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});for(let i=0;i<3000;i++){r.step(1);mn=Math.min(mn,+r.get(H));}console.log(' R&D, ES then PLC(1,1) next scan: min HVreq over 3 s',mn,r.ph(),r.sts());}
{const r=rt();toRun(r);gesture(r,{green:true});r.step(5100);let mn=1;r.step(1,{in_ES_NC_1:false,inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});for(let i=0;i<3000;i++){r.step(1);mn=Math.min(mn,+r.get(H));}console.log(' R&D, ES and PLC(1,1) same scan: min HVreq over 3 s',mn,r.ph(),r.sts());}
