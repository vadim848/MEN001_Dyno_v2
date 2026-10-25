// Race/glitch probe for last-cycle reads on canonical E6v (stand semantics: scanMs 1, catalog plant).
// For each transition T and disturbance D, inject D (level or 1-scan pulse) at every scan e-3..e+3 around every
// event scan e (stage/status/OUT change) of the undisturbed run, plus 0..30 after the gesture.
// Checks: (C0) exactly one main state per scan (stand rule 5, x.viol); (C1) Emergency-type D: no energy rise after
// injection, Emergency+STO+C1/C2 OFF reached, worst latency; (C2) Emergency-type 1-scan pulse latches EMG.
// usage: node probe.mjs [maxRunsPerCase]
import {program,toRnD,toRun} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/catalog-program.js';
const P=program();const LIM=Number(process.argv[2]??400);const ONLY=process.argv[3];const W=Number(process.argv[4]??1);
const T={
 'Safe->R&D(BOTH)':{base:()=>P.safe(),go:x=>x.both(),done:s=>s.st[0]==='RND'},
 'R&D->Run(BOTH)':{base:()=>P.rnd(),go:x=>x.both(),done:s=>s.st[0]==='RUN'&&!s.STO&&s.out_HV_C2},
 'Run->R&D(green)':{base:()=>P.run(),go:x=>x.green(100),done:s=>s.st[0]==='RND'&&!s.out_HV_C2&&!s.c2f},
 'Run->R&D(PLC)':{base:()=>P.run(),go:x=>x.step({CMD_RUN_TO_RND:true},5),done:s=>s.st[0]==='RND'&&!s.out_HV_C2&&!s.c2f,end:{CMD_RUN_TO_RND:false}},
 'R&D->Safe(PLC)':{base:()=>P.rnd(),go:x=>x.step({CMD_RND_TO_SAFE:true},5),done:s=>s.st[0]==='SAFE'&&!s.out_LV_C1&&!s.c1f,end:{CMD_RND_TO_SAFE:false}},
 'R&D steady':{base:()=>P.rnd(),go:x=>x.step({},1),done:s=>true},
 'Run steady':{base:()=>P.run(),go:x=>x.step({},1),done:s=>true},
 'Safe->R&D(PLC)':{base:()=>P.safe(),go:x=>x.step({CMD_SAFE_TO_RND:true},5),done:s=>s.st[0]==='RND',end:{CMD_SAFE_TO_RND:false}},
};
const D={ES:{in_ES_NC_1:false},ES_PLC:{in_Estop_PLC:true},MENTEE:{in_Mentee_EStop:true},IL1:{in_InterLock_NC_1:false},
 LVF:{in_LV_Faulty_FBK:true},HVF:{in_HV_Faulty_FBK:true},C1FBK_LOSS:{hold:{in_LV_C1_FBK:false}},C2FBK_LOSS:{hold:{in_HV_C2_FBK:false}}};
const EMG=new Set(['ES','ES_PLC','MENTEE']);
const has=n=>P.names.has(n)||P.inputVars.has(n);
const res=[];const summary={};
for(const [tn,t] of Object.entries(T)){if(ONLY&&tn!==ONLY)continue;
 let x0;try{x0=t.base();}catch(e){res.push({T:tn,error:'base '+e.message});continue;}
 if(t.end&&!Object.keys(t.end).every(has)){res.push({T:tn,error:'PLC cmd symbol missing'});continue;}
 const ref=x0.fork();const t0=ref.t;t.go(ref);if(t.end)ref.set(t.end);const g=ref.t;let tEnd=null;
 for(let i=0;i<6000&&tEnd==null;i++){ref.step();if(t.done(ref.log.at(-1)))tEnd=ref.t;}
 const ev=new Set();for(let i=t0+1;i<=ref.t;i++){const s=ref.log[i-1],p=ref.log[i-2];if(!p)continue;
  if(s.stg!==p.stg||s.st.join()!==p.st.join()||['out_LV_C1','out_HV_C2','STO','out_LV_Discharge_Request','out_HV_Discharge_Request'].some(k=>s[k]!==p[k]))for(let d=-W;d<=W;d++)ev.add(i+d);}
 for(let i=0;i<=10;i++)ev.add(g+i);for(let i=t0+1;i<g;i++)ev.add(i);
 const offs=[...ev].filter(o=>o>t0&&o<=(tEnd??ref.t)+3).sort((a,b)=>a-b).slice(0,LIM);
 for(const [dn,d] of Object.entries(D))for(const mode of ['level','pulse']){
  const k=`${tn} | ${dn} | ${mode}`;const S=summary[k]={T:tn,D:dn,mode,runs:0,viol:0,energyRiseAfterEmg:0,emgNotReached:0,pulseNotLatched:0,maxLatency:{},violFirst:[]};
  for(const o of offs){const x=x0.fork();S.runs++;
   // replay the gesture with injection at absolute scan o
   const inj=()=>{if(d.hold)Object.assign(x.hold,d.hold);else x.set(d);};
   const clr=()=>{if(d.hold)for(const kk of Object.keys(d.hold))delete x.hold[kk];else x.set(Object.fromEntries(Object.keys(d).map(kk=>[kk,!d[kk]])));};
   const v0=x.viol.count;const gx=x.fork();// replay by re-running gesture on a fork, scan-by-scan injection via hook
   const orig=x.r.scan.bind(x.r);let injected=false;let ti=null;
   x.r.scan=(dt)=>{const now=x.t+1;if(now===o){inj();injected=true;ti=now;}else if(mode==='pulse'&&injected&&now===o+1)clr();return orig(dt);};
   if(o<g||true){t.go(x);if(t.end)x.set(t.end);}
   if(!injected){while(x.t<o-1)x.step();x.step();}
   x.wait(EMG.has(dn)?300:2500);if(ti==null){S.notInjected=(S.notInjected??0)+1;continue;}
   if(x.viol.count>v0){S.viol++;if(S.violFirst.length<2)S.violFirst.push(`o=${o-t0}: ${x.viol.first.at(-1)}`);}
   if(EMG.has(dn)){const seg=x.seg(ti-1);
    const rise=seg.slice(1).find((s,i)=>(s.out_LV_C1&&!seg[i].out_LV_C1)||(s.out_HV_C2&&!seg[i].out_HV_C2)||(!s.STO&&seg[i].STO));if(rise){S.energyRiseAfterEmg++;S.riseFirst??=`o=${o-t0} t=${rise.t-ti} C1=${rise.out_LV_C1} C2=${rise.out_HV_C2} STO=${rise.STO}`;}
    const lat=f=>{const s=x.seg(ti-1).find(f);return s?s.t-ti:null;};
    const L={EMG:lat(s=>s.st.includes('EMG')),EStopOkFalse:lat(s=>!s.b_EStop_Ok),Step4:lat(s=>s.stg.includes('Step4'))};
    if(L.EMG==null)S.emgNotReached++;for(const [a,b] of Object.entries(L))if(b!=null)S.maxLatency[a]=Math.max(S.maxLatency[a]??0,b);
    if(mode==='pulse'&&!x.log.at(-1).st.includes('EMG'))S.pulseNotLatched++;}
  }}
}
const out={sal:'canonical E6v',identity:P.identity,summary:Object.values(summary),errors:res};
import fs from 'node:fs';fs.writeFileSync(new URL('./probe.'+(ONLY??'all').replace(/[^A-Za-z0-9]+/g,'_')+'.out.json',import.meta.url),JSON.stringify(out,null,1));
for(const s of Object.values(summary))if(s.viol||s.energyRiseAfterEmg||s.emgNotReached||s.pulseNotLatched)console.log('FLAG',JSON.stringify(s));
console.log('cases',Object.keys(summary).length,'runs',Object.values(summary).reduce((a,s)=>a+s.runs,0),'errors',JSON.stringify(res));
const ml={};for(const s of Object.values(summary))if(EMG.has(s.D))for(const [a,b] of Object.entries(s.maxLatency))ml[s.D+'.'+a]=Math.max(ml[s.D+'.'+a]??0,b);console.log('max latency (scans) Emergency-type',JSON.stringify(ml));
