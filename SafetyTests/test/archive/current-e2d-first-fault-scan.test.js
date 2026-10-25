// E2 G1 v8 (v2-tester) — first-fault-scan behaviour on the WHOLE program (subgraph-independent counterpart of the unit pins
// "stale aggregate paired first-fault scans" in current-hv-set-permit, "paired real producer" in current-step12-lv-permit and
// MENTEE05 paired in current-mentee-set-permit; lead 2026-10-22, class D-E2b-4). Runs on any source (canonical F1, candidates,
// mutants) through helpers/e2-lifecycle.js; no block paths are used.
// Oracle: analyst E2b-dev/CRITERIA.md §2.3 (HV row, NOT replaced: "в любом скане n с NC1 или NC2 FALSE в n нет нового out_HV_C2 ON и нового
//  снятия STO_DR1/2 (OFF в n-1 -> OFF в n), по каждому маршруту подъёма HV"; V14-Q5, V14-Q7, IL-02, IL-05a, rule L Imm "нет нового повышения
//  в каждом скане >= e"); EMGREF(2) / rule L for the other stop causes (ES_NC_1/2, in_Estop_PLC, Mentee, connectors: "no new energy increase
//  in every scan >= e", CRITERIA_DELTA_v4 §0.1); MENTEE05 (Mentee forbids the new Set on its first scan). LV (Safe->R&D, D-E2d-1): NC1/NC2 do
//  NOT forbid the LV Set (V14-Q7 "Б1", Q-RC-03(b1)): C1 as in the no-event trace and no Emergency; other causes forbid C1 in scan e.
// Event scan e = u: the first lift-output scan of the no-event fork (u = first out_HV_C2 TRUE or STO_DR1/2 released for R&D->Run;
//  u1 = first out_LV_C1 TRUE for Safe->R&D). Cause held from e for 300 ms, then removed WITHOUT Restart; observed to p+len+3000 (EMGREF(2): no new increase until Restart). Routes: buttons BOTH (SU) and legacy PLC (1,1)
//  (R&D->Run); buttons BOTH (Safe->R&D). Not written: the existing-retry AND6 route (no input-level stimulus derivable from the requirements
//  without the cut FBAnd4 boundary) - NV listed in HANDOFF_v8.
// Assumptions A1..A9 helpers/e2-lifecycle.js.
import test from 'node:test';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,OFF}=L;
const CAUSES={ES_NC_1:{in_ES_NC_1:false},ES_NC_2:{in_ES_NC_2:false},NC1:{in_InterLock_NC_1:false},NC2:{in_InterLock_NC_2:false},
 'LV connector':{in_LV_Connector_Interlock:false},'HV connector':{in_HV_Connector_Interlock:false},in_Estop_PLC:{in_Estop_PLC:true},Mentee:{in_Mentee_EStop:true}};
const PLC11={inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true},PLC00={inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false};
const ROUTES={'R&D->Run buttons BOTH':{base:['RnD',{c3:true}],start:{...BOTH},stop:{...OFF},len:1100,lift:s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2,keys:['out_HV_C2','STO_DR1','STO_DR2']},
 // G1 v9: route 'R&D->Run legacy PLC (1,1)' removed - the (1,1) lift is disabled in E2 (Vadim, question 76 "Б"); its ban is judged by
 // 'E2d V76 ...' in current-e2d-fbk-unsolicited.
 'Safe->R&D buttons BOTH':{base:['Safe',{}],start:{...BOTH},stop:{...OFF},len:1100,lift:s=>s.out.out_LV_C1,keys:['out_LV_C1'],lv:true}};
const memo=new Map();
function drive(rn,e,cause){const R=ROUTES[rn];const x=L.cached(...R.base);x.step(OFF,10);const p=x.t+1;const end=p+R.len+3000;
 for(let n=p;n<=end;n++){const o={};if(n===p)Object.assign(o,R.start);if(n===p+R.len)Object.assign(o,R.stop);if(cause&&n===e)Object.assign(o,cause);
  if(cause&&n===e+300)for(const k of Object.keys(cause))o[k]=L.RAW0[k];x.step(o);}return {x,p};}
function ref(rn){if(!memo.has(rn)){try{const {x,p}=drive(rn,null,null);const u=L.firstAt(x.log.filter(s=>s.t>=p),ROUTES[rn].lift);
  if(u==null)throw Error(`precondition: ${rn} lifts in the no-event trace (no lift output within ${ROUTES[rn].len+3000} ms; stages=${x.stageSet()})`);memo.set(rn,{x,p,u});}catch(err){memo.set(rn,{error:err});}}
 const m=memo.get(rn);if(m.error)throw m.error;return m;}
for(const rn of Object.keys(ROUTES))for(const [cn,cause] of Object.entries(CAUSES)){const R=ROUTES[rn];const lvAllowed=R.lv&&(cn==='NC1'||cn==='NC2');
 test(L.T(`E2d FFS ${rn}: ${cn} in the first lift scan e=u of the no-event trace -> ${lvAllowed?'Safe->R&D continues: C1 as without the event, no Emergency (V14-Q7 "Б1", Q-RC-03(b1), D-E2d-1)':`no new ${R.keys.join(' / ')} in scan e and later${rn.includes('legacy')&&cn.startsWith('NC')?' while the cause is held [e, e+299]':''} (${cn.startsWith('NC')?'V14-Q5, IL-02/IL-05a, E2b-dev §2.3':'EMGREF(2), rule L Imm'}${cn==='Mentee'?', MENTEE05':''})`}`),t=>{
  const c=L.checks();const Rf=ref(rn);const e=Rf.u;const {x}=drive(rn,e,cause);const pre=x.log.find(s=>s.t===e-1);
  c(R.keys.every(k=>!pre.out[k]),`stand precondition: lift outputs OFF in e-1 (${R.keys.map(k=>k+'='+pre.out[k])})`);t.diagnostic(`p=${Rf.p}, e=u=${e} (u-p=${e-Rf.p})`);
  // legacy PLC route + NC: A = u (no SU, TD-08 §1.2) -> c = A is an observation; the HV row (E2b-dev §2.3) is normative while NC is FALSE; a held (1,1)
  // level executed after the restoration is KF-3 (known FAIL until E4), not judged here -> window [e, e+299]. Other causes: EMGREF(2) to the end.
  const legNC=rn.includes('legacy')&&cn.startsWith('NC');const seg=x.log.filter(s=>s.t>=e&&(!legNC||s.t<=e+299));// to the end of the trace (cause removed at e+300, no Restart): EMGREF(2) 'until Restart'
  if(lvAllowed){const rm=new Map(Rf.x.log.map(s=>[s.t,s]));const d=seg.filter(s=>s.out.out_LV_C1!==rm.get(s.t)?.out.out_LV_C1).map(s=>s.t-e);
   c(d.length===0,`C1 equal to the no-event trace in every scan [e, end] (the cover does not change Safe->R&D); first differences e+${d.slice(0,3)}`);
   const em=seg.find(L.isEmg);c(!em,`no Emergency (Q-RC-03(b1)); first e+${em?em.t-e:'-'}`);}
  else{const on=seg.flatMap(s=>R.keys.filter(k=>s.out[k]).map(k=>`${k}@e+${s.t-e}`));c(on.length===0,`no new lift output in scan e and later (OFF in e-1 -> OFF in every scan [e, ${legNC?"e+299, cause held":"end"}]${legNC?"":"; cause removed at e+300 without Restart - EMGREF(2) latched"}): ${on.slice(0,4)}`);}
  c.finish(t,`violated checks (e=${e})`);});}
// ======================== G1 v9 FFS-BYP (analyst E2-G1-v8-q §3.3, READY-D; replaces the NV of the AND6 'existing-retry' route) ========================
// inPLC_BypassC1C2 (V14-Q16 Config entry, E4 frozen) must not bypass the cover: (a) steady Safe, NC FALSE from t0, Bypass TRUE from t0+200 held
// 3000 ms -> C1, C2 OFF, STO active in every scan, no Unlock rise, no Emergency, stage Safe (V14-Q16, CFG-001, V14-Q5); SafetyFault NV (A8).
// (b) steady R&D, Bypass TRUE from t0 and held; BOTH at p >= t0+100 -> StartingRun; NC FALSE from c in {A-1, A, A+1, u} (A by TD-08, recRndC_SU
// required) -> trace WITH Bypass equal to the trace WITHOUT Bypass in every scan (outputs, stages, statuses); no new C2 ON / STO release in
// any scan >= c for c >= A (TD-08 / COV-1). (c) any C2 ON with Bypass that the control without Bypass does not have = FAIL (CFG-001).
// Config positive behaviour (C1/C2 ON with the cover closed) - BLOCKED-E4, not tested.
const BYP={inPLC_BypassC1C2:true},NCS={NC1:{in_InterLock_NC_1:false},NC2:{in_InterLock_NC_2:false},both:{in_InterLock_NC_1:false,in_InterLock_NC_2:false}};
for(const [cn,nc] of Object.entries(NCS))test(L.T(`E2d FFS-BYP (a) steady Safe, ${cn} FALSE from t0, inPLC_BypassC1C2 TRUE from t0+200 held 3000 ms -> C1/C2 OFF, STO active, no Unlock, no Emergency, Safe in every scan (V14-Q16, CFG-001, V14-Q5)`),t=>{
 const x=L.cached('Safe');x.step(OFF,2100);const c=L.checks();const t0=x.t+1;x.step(nc,200);x.step({...nc,...BYP},3000);x.step({...nc,inPLC_BypassC1C2:false},500);
 const seg=x.log.filter(s=>s.t>=t0);const b=seg.find(s=>s.out.out_LV_C1||s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);c(!b,`no C1 / C2 / STO release in any scan; first t0+${b?b.t-t0:'-'}`);
 const u=L.rises(x.log.filter(s=>s.t>=t0-1),'out_Door_Unlock_Solonoeid');c(u.length===0,'no Unlock issued by the Bypass: '+u.slice(0,3));
 const e=seg.find(L.isEmg);c(!e,`no Emergency; first t0+${e?e.t-t0:'-'}`);const st=seg.find(s=>s.stages.join()!=='b_Step1');c(!st,`stage Safe in every scan; first t0+${st?st.t-t0:'-'} ${st?.stages}`);
 if(x.sf){const f=seg.find(s=>s.out[x.sf]);c(!f,'no SafetyFault');}else c.nv('no SafetyFault from the Bypass - no SafetyFault symbol (A8)');c.finish(t,`violated checks (t0=${t0})`);});
let bypRef=null;
function bypA(){if(!bypRef){try{if(!L.hasName('recRndC_SU'))throw Error('ERROR precondition (TD-08): Symbol recRndC_SU absent - acceptance point A not observable');
  const b=L.cached('RnD',{c3:true});const x=b.fork();x.step(OFF,10);const t0=x.t+1;let su=null;x.listeners.push((q,y)=>{if(su==null&&y.r.get('recRndC_SU'))su=q.t;});
  const p=t0+100;for(let n=t0;n<=p+3000;n++)x.step(n===p?BOTH:n===p+1100?OFF:{});const seg=x.log.filter(s=>s.t>=p);
  const u=L.firstAt(seg,s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);if(u==null)throw Error('precondition: R&D->Run accepted by BOTH (no-event control)');
  bypRef={b,t0,p,u,A:Math.min(...[su,u].filter(v=>v!=null))};}catch(e){bypRef={error:e};}}if(bypRef.error)throw bypRef.error;return bypRef;}
function bypDrive(c,nc,byp,end){const {b,t0,p}=bypA();const x=b.fork();x.step(OFF,10);for(let n=t0;n<=end;n++){const o={};if(byp&&n===t0)Object.assign(o,BYP);if(n===p)Object.assign(o,BOTH);if(n===p+1100)Object.assign(o,OFF);if(n===c)Object.assign(o,nc);x.step(o);}return x;}
const snapKey=s=>JSON.stringify({o:s.out,st:s.stages,ss:s.statuses});
for(const [pn,pOf] of [['A-1',q=>q.A-1],['A',q=>q.A],['A+1',q=>q.A+1],['u',q=>q.u]])for(const [cn,nc] of Object.entries(NCS))
 test(L.T(`E2d FFS-BYP (b) steady R&D, inPLC_BypassC1C2 TRUE held, BOTH -> StartingRun, ${cn} FALSE from c=${pn} (TD-08 A): trace with Bypass equal to the trace without Bypass in every scan; no new C2 ON / STO release in scan >= c (V14-Q16, CFG-001, TD-08, COV-1)`),t=>{
  const q=bypA();const c0=pOf(q),end=c0+6000;t.diagnostic(`A=${q.A}, u=${q.u}, c=${c0}`);const X=bypDrive(c0,nc,true,end),Y=bypDrive(c0,nc,false,end);const c=L.checks();
  const m=new Map(Y.log.map(s=>[s.t,s]));const d=X.log.filter(s=>s.t>=q.t0&&snapKey(s)!==snapKey(m.get(s.t)??{out:{},stages:[],statuses:[]})).map(s=>s.t);
  c(d.length===0,`(b)/(c) Bypass changes nothing: equal to the control without Bypass in every scan; first differing scans ${d.slice(0,4)}`);
  {const rs=['out_HV_C2','STO_DR1','STO_DR2'].flatMap(k=>L.rises(X.log.filter(s=>s.t>=c0-1),k).map(v=>k+'@c+'+(v-c0)));c(rs.length===0,'no new C2 ON / STO release in scan >= c (c <= A-1: IL-02 refusal; c >= A: TD-08 / COV-1): '+rs.slice(0,4));}
  c.finish(t,`violated checks (c=${c0})`);});
