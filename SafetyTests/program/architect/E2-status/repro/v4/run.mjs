import {build} from './proto.mjs';
import {SalRuntime} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-runtime.js';
import {raw0} from './h.mjs';
export const ST=['b_Step1','b_Step12','b_Step_RnD','b_Step3','b_Step4','b_Step5','b_Step6','b_Step2'];
export const STS=['//Network3/DEC_SAFE/AndOut','//Network3/DEC_RND/AndOut','//Network3/DEC_RUN/AndOut','//Network3/DEC_EMG/AndOut'];
export function rt(opts,over={}){
 const {m,count}=build(opts);
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false}); r.setInputs({...raw0,...over}); r.t=0;
 r.viol=[]; r.hold={}; r.plantC2=true;
 r.step=(n=1,inp)=>{if(inp)r.setInputs(inp);for(let i=0;i<n;i++){
   const pl={in_LV_C1_FBK:r.get('out_LV_C1'),in_STO_DR1_FBK:!r.get('STO_DR1'),in_STO_DR2_FBK:!r.get('STO_DR2')};
   if(r.plantC2)pl.in_HV_C2_FBK=r.get('out_HV_C2');
   r.setInputs({...pl,...r.hold});r.scan(1);r.t++;
   const st=ST.filter(s=>r.get(s)), sts=STS.filter(s=>r.get(s));
   if(st.length>1||sts.length!==1)r.viol.push(r.t+':'+st.join('+')+':'+sts.join('+'));}return r;};
 r.ph=()=>ST.filter(s=>r.get(s)).map(s=>s.replace('b_Step','S')).join('+')||'none';
 r.sts=()=>STS.filter(s=>r.get(s)).map(s=>s.split('/')[3].slice(4)).join('+');
 r.count=count; return r;
}
export function gesture(r,{green=false,blue=false,ms=600}){r.step(1,{in_Reset_PB:green,in_Relase_Door_PB:blue});r.step(ms);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});}
export function toRun(r){
 r.step(10); r.step(1,{in_Reset_PB:true}); r.step(1,{in_Reset_PB:false}); r.step(2100);
 gesture(r,{green:true,blue:true,ms:1100}); r.step(2500); const rnd=r.ph();
 gesture(r,{green:true,blue:true,ms:1100}); r.step(3000); return rnd+' -> '+r.ph();
}
export function trace(r,n,f=()=>''){let prev='';const log=[];const t0=r.t;for(let i=0;i<n;i++){r.step(1);const p=r.ph()+'|'+r.sts()+f();if(p!==prev){log.push((r.t-t0)+':'+p);prev=p;}}return log.join('  ');}
