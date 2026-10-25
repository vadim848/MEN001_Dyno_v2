// Reviewer v4: M-E2a-21 (FBAnd6 after FBTon3) on the v4 prototype: Run timing with/without 1-scan C2_FBK dip and HV glitch.
import {build} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/proto.mjs';
import {SalRuntime} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-runtime.js';
import {raw0} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/h.mjs';
const mk=(swap)=>{const {m,seq}=build({});const B=new Map(m.networks.flatMap(n=>n.blocks).map(b=>[b.path.slice(2),b]));
 if(swap){const a=B.get('Network12/FBAnd6'),t=B.get('Network12/FBTon3');const x=a.orderOfExecution;a.orderOfExecution=t.orderOfExecution;t.orderOfExecution=x;}
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false});r.setInputs(raw0);r.t=0;r.hold={};r.plantC2=true;
 r.step=(n=1,inp)=>{if(inp)r.setInputs(inp);for(let i=0;i<n;i++){const pl={in_LV_C1_FBK:r.get('out_LV_C1'),in_STO_DR1_FBK:!r.get('STO_DR1'),in_STO_DR2_FBK:!r.get('STO_DR2')};if(r.plantC2)pl.in_HV_C2_FBK=r.get('out_HV_C2');r.setInputs({...pl,...r.hold});r.scan(1);r.t++;}};return r;};
const run=(swap,{dip=null,hv=null}={})=>{const r=mk(swap);r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);
 r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(1100);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(2500);
 r.plantC2=false;r.hold={in_HV_C2_FBK:false};r.step(2100);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});
 while(!r.get('out_HV_C2'))r.step(1);r.step(30);r.hold={in_HV_C2_FBK:true};const tf=r.t;let tr=-1;
 for(let i=0;i<400;i++){const rel=r.t-tf;if(dip!==null&&rel===dip){r.hold={in_HV_C2_FBK:false};r.step(1);r.hold={in_HV_C2_FBK:true};continue;}if(hv!==null&&rel===hv){r.hold={in_HV_C2_FBK:true,in_HV_Healthy_FBK:true};r.step(1);r.hold={in_HV_C2_FBK:true,in_HV_Healthy_FBK:false};continue;}r.step(1);if(tr<0&&r.get('b_Step3'))tr=r.t-tf;}
 return tr;};
for(const [n,o] of [['no dip',{}],['C2_FBK dip @FBK+40',{dip:40}],['HV glitch @FBK+50',{hv:50}]])console.log(n.padEnd(20),'base Run @FBK+'+run(false,o),' swap(M-E2a-21) Run @FBK+'+run(true,o));
