// Reviewer v7 (rerun on architect v7 proto) x3: M-E2a-32 (reset from linkRndBothQualified) killability on E2a-RC-only stack (no E2b) vs full stack. Model.
import {build} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/proto.mjs';
import {SalRuntime} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-runtime.js';
import {raw0} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/h.mjs';
function rt(stack,mut){const opts=stack==='rc'?{e2b:false,e2c:false,e2d:false,e2e:false}:{};const {m}=build(opts);
 if(mut){const b=m.networks.flatMap(n=>n.blocks).find(b=>b.path==='//Network1/FBOr5');b.inputs.find(i=>i.name==='OrIn2').globals=[{resolvedName:'linkRndBothQualified'}];}
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false});r.setInputs({...raw0});r.t=0;
 r.step=(n=1,inp)=>{if(inp)r.setInputs(inp);for(let i=0;i<n;i++){r.setInputs({in_LV_C1_FBK:r.get('out_LV_C1'),in_HV_C2_FBK:r.get('out_HV_C2'),in_STO_DR1_FBK:!r.get('STO_DR1'),in_STO_DR2_FBK:!r.get('STO_DR2')});r.scan(1);r.t++;}return r;};return r;}
const g=(r,gr,bl,ms)=>{r.step(1,{in_Reset_PB:gr,in_Relase_Door_PB:bl});let mn=1;for(let i=0;i<ms;i++){r.step(1);mn=Math.min(mn,+r.get('out_HV_Discharge_Request'));}r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});return mn;};
const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
for(const stack of ['rc','full'])for(const mut of [false,true]){
 const run=()=>{const r=rt(stack,mut);boot(r);g(r,1,1,1100);r.step(2500);g(r,1,1,1100);r.step(3000);g(r,1,0,600);r.step(5100);return r;};
 let r=run();const pre=+r.get('out_HV_Discharge_Request');r.setInputs({in_InterLock_NC_1:false});r.step(50);const m1=g(r,1,1,1300);
 r=run();g(r,1,0,600);r.step(5000);const pre2=+r.get('out_HV_Discharge_Request');const m2=g(r,1,1,1300);
 console.log(stack,mut?'M-E2a-32':'base','| R&D pre',pre,'cover-open BOTH min HVreq',m1,'| Safe pre',pre2,'Safe->R&D BOTH min HVreq',m2);}
