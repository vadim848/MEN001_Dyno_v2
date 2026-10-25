// Analyst C-A1 probe (diagnostic, not oracle): reference 4495a1f vs canonical F1, in_Estop_PLC in Safe and steady Run.
// Uses the tester's helpers read-only (same producer/timeline/profile as rule L). Output: offsets from e (0 = changed in scan e).
import * as L from '../../../test/helpers/e2-lifecycle.js';
import * as E from '../../../test/helpers/e2-emergency.js';
import * as RL from '../../../test/helpers/e2-rule-l.js';
const out={};
const dump=(x,e,a,b)=>x.log.filter(s=>s.t>=e+a&&s.t<=e+b).map(s=>({d:s.t-e,stages:s.stages.join('+'),st:s.statuses.join('+'),ok:s.out.b_EStop_Ok,ss1:[s.out.out_SS1_DR1,s.out.out_SS1_DR2].join('/'),sto:[s.out.STO_DR1,s.out.STO_DR2].join('/')}));
const firstChange=(x,e,end,k)=>{const pre=x.log.find(s=>s.t===e-1);const v0=pre?.out[k];const s=x.log.find(s=>s.t>=e&&s.t<=end&&s.out[k]!==v0);return s?{from:v0,to:s.out[k],d:s.t-e}:{from:v0,d:'never'};};
function safeTrace(source){const x=L.boot(L.create({source}));L.restartToSafe?0:0;
 // reach Safe: boot -> Restart (A9) as the lifecycle helper does
 return x;}
for(const source of ['ref','work']){
 const r={};
 try{let x;
  if(source==='work'){x=L.cached('Safe');}
  else{x=L.boot(L.create({source:'ref'}));}
  r.preStages=x.stageSet().join('+');r.preStatus=x.statusSet().join('+');
  x.step(L.OFF,2100);
  const pre=x.snap();const tl=E.timeline(x,E.CAUSES.PLC);r.safe={pre:pre.out,profile:RL.profile(x.log,pre,tl.e,tl.latchEnd),around:dump(x,tl.e,-1,3)};
  for(const k of ['out_SS1_DR1','out_SS1_DR2','outPLC_STO_1','outPLC_STO_2','b_EStop_Ok','out_EStop_Status'])if(k in pre.out)r.safe[k]=firstChange(x,tl.e,tl.latchEnd,k);
 }catch(err){r.safeErr=err.message;}
 try{let x;
  if(source==='ref'){x=L.boot(L.create({source:'ref'}));x.step(L.GREEN,2100);x.step(L.OFF);x.until(()=>x.get('b_Step3'),12000,'ref Run');x.step({},2100);L.withC3(x);}
  else x=L.cached('Run',{c3:true});
  const pre=x.snap();const tl=E.timeline(x,E.CAUSES.PLC);r.run={pre:pre.out,profile:RL.profile(x.log,pre,tl.e,tl.latchEnd),around:dump(x,tl.e,-1,3)};
  for(const k of ['out_SS1_DR1','out_SS1_DR2','outPLC_STO_1','outPLC_STO_2','b_EStop_Ok'])if(k in pre.out)r.run[k]=firstChange(x,tl.e,tl.latchEnd,k);
  // SS1 timeline sample
  r.run.ss1=x.log.filter(s=>s.t>=tl.e-1&&s.t<=tl.latchEnd).reduce((a,s,i,arr)=>{const v=[s.out.out_SS1_DR1,s.out.out_SS1_DR2].join('/');if(!a.length||a[a.length-1].v!==v)a.push({d:s.t-tl.e,v});return a;},[]);
 }catch(err){r.runErr=err.message;}
 out[source]=r;}
console.log(JSON.stringify(out,null,1));
