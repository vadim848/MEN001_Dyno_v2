// E2 G1 v4 (v2-tester) — EMG-RD-L sweep (review G1 v3 N6; CRITERIA_DELTA v5 §2 boundaries/sweep, v6 §6 Q-T3-1 "А").
// Initial: steady Run (real lifecycle, C3/BMS set), green pressed at g for 600 ms (STP-A normal stop; t_a = down acceptance
// observed on the same trajectory before e, reference point - not oracle). Event at e (timeline of helpers/e2-emergency.js:
// buttons released at e, cause held, refused Restart at e+1000, removed at e+10000, final Restart -> only Safe).
// Oracle (no no-event trace - A11 removed):
//  - e = t_a-1: steady Run -> in_Estop_PLC by L3 (REF_RUN_PLC, reference 4495a1f), ES_NC_1 by L1 vs in_Estop_PLC at e;
//  - e = t_a+1, t_a+1999, t_a+2001, t_s+4999, t_d+T_DIS-1, C2_FBK wait (C2 OFF command +100, C2_FBK pinned ON):
//    EMG-RD-L with the NORMATIVE q_N of STP-A/B: STO t_a+2000, Discharge t_s+5000, C2 OFF t_d+T_DIS (t_s/t_d = actual scans
//    of the same trace); Q-T3-1 "А": tau in [min(q_N, e+q_R), +1], base L2 (in_Estop_PLC vs steady Run) / L1 (ES_NC_1 vs
//    in_Estop_PLC at e); p.3 L1/L2 for C1/C3/BMS/LV discharge/SS1; p.4 already-at-target outputs stay; L4 without the
//    branch-А changes; latch; EMGREF(2) incl. no SS1 release (v6 §3); Unlock FALSE in Emergency (v6 §2); no STS_RUN from the
//    first Emergency scan (v6 §5); Restart -> only Safe;
//  - e = t_a and e = q_N(STO), q_N(Discharge): observation (DIAG); e = t_a+1000 together with HV Healthy loss (STP-D) in the
//    same scan -> Emergency has priority, moments by EMG-RD-L.
// G1 v5 (review G1 v4 C1/C2/C4):
//  C1 (v7 §1 READY): PLC + HV Healthy loss (STP-D) - the v4 oracle took q_N(STO)=t_a+2000 (inverted). Now q_N(STO)=min(t_a+2000, h),
//    W_N [q_N, q_N+1]; + boundaries h=e=t_a+1 / t_a+1999, LV (STP-H), h < e, h > e (READY-D); SafetyFault NV without symbol (A8).
//  C2 (v7 §2) superseded in G1 v6: "issued in W_N, withdrawn before e" - EMGRDL ledger 'done-left' = FAIL (Q-V7-01 "Г", 73 "А").
//  C4: precondition g <= t_a < e on every EMG-RD-L point; ledger of the clause that judged each Del key asserted against the
//    clause expected from the normative q_N / e+q_R relation of the point (EXPECT below); 'absent' outputs are ERROR.
// Assumptions A1..A9/A12: helpers/e2-lifecycle.js; T_DIS = 1000 (Network8, as current-e2c-stp-i.test.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
import * as E from '../helpers/e2-emergency.js';
import * as RL from '../helpers/e2-rule-l.js';
const {GREEN,OFF}=L;
const sched=(g,n)=>n===g?GREEN:n===g+600?OFF:{};
let B;
function base(){if(!B){try{const b=L.cached('Run',{c3:true});const g=b.t+1,preG=b.snap();const y=b.fork();
  y.hold={in_HV_C2_FBK:true};let tc=null;
  for(let n=g;n<g+16000;n++){y.step(sched(g,n));if(tc==null&&!y.get('out_HV_C2'))tc=y.t;if(tc!=null&&y.t>=tc+200)break;}
  const ta=E.downTa(y.log,g,preG),q=E.qNrunDown(y.log,ta);
  assert.ok(ta!=null&&q.pts.t_s!=null&&q.pts.t_d!=null&&tc!=null,`precondition: normal stop observed (t_a ${ta}, t_s ${q.pts.t_s}, t_d ${q.pts.t_d}, C2 OFF ${tc})`);
  B={b,g,preG,ta,ts:q.pts.t_s,td:q.pts.t_d,tc};}catch(err){B={error:err};}}
 if(B.error)throw B.error;return B;}
const CAUSE={PLC:E.CAUSES.PLC,ES1:E.CAUSES.ES1,PLC_HV:{label:'in_Estop_PLC TRUE + in_HV_Faulty_FBK TRUE (STP-D) same scan',on:{in_Estop_PLC:true,in_HV_Faulty_FBK:true},off:{in_Estop_PLC:false,in_HV_Faulty_FBK:false}},
 PLC_LV:{label:'in_Estop_PLC TRUE + in_LV_Faulty_FBK TRUE (STP-H) same scan',on:{in_Estop_PLC:true,in_LV_Faulty_FBK:true},off:{in_Estop_PLC:false,in_LV_Faulty_FBK:false}},
 PLC_HVLOSS:{label:'in_Estop_PLC TRUE (HV Healthy lost at h, STP-D)',on:{in_Estop_PLC:true},off:{in_Estop_PLC:false,in_HV_Faulty_FBK:false}}};
// C1 (CRITERIA_DELTA v7 §1, READY): q_N(STO)=min(t_a+2000, h), W_N=[q_N, q_N+1]; 'min' applied (null = the v5-draft NV mode).
const C1_STPD='min';
const memo=new Map();
function trace(key,e,{pin=false,loss=null}={}){const id=key+'|'+e+'|'+pin+'|'+JSON.stringify(loss);if(memo.has(id))return memo.get(id);const res={aborted:null};
 try{const P=base();const w=P.b.fork();if(pin)w.hold={in_HV_C2_FBK:true};
  while(w.t<e-1){const n=w.t+1;if(pin&&n>=P.tc+200)w.hold={};w.step({...sched(P.g,n),...(loss&&n===loss.at?loss.inp:{})});}
  const pre=w.snap(),hist=w.log.slice();res.stages=L.watchStages(w);res.status=L.watchStatus(w);const tl=E.timeline(w,CAUSE[key],{inject:loss&&loss.at>=e?loss:null});
  Object.assign(res,{x:w,pre,e:tl.e,latchEnd:tl.latchEnd,log:[...hist,...w.log.filter(s=>s.t>=e)]});
  res.profile=RL.profile(w.log,pre,tl.e,tl.latchEnd);res.end=L.checks();L.restartToSafe(w,res.end,'');}
 catch(err){res.aborted=err.message;}memo.set(id,res);return res;}
// stpd: absolute scan h of the Healthy loss (STP-D/STP-H) on this trace, or null; loss: {at:h, inp} when h != e (key PLC_HVLOSS).
function judge(t,key,e,{pin=false,steady=false,expect=null,stpd=null,loss=null}={}){const P=base();const r=trace(key,e,{pin,loss});assert.equal(r.aborted,null,`scenario aborted (coverage incomplete): ${r.aborted}`);
 const c=L.checks(),dg=m=>t.diagnostic(m);const latch=r.x.log.filter(s=>s.t>=e&&s.t<=r.latchEnd);
 dg(`t_a=${P.ta} t_s=${P.ts} t_d=${P.td} C2 OFF=${P.tc}; e=${e} (t_a${e-P.ta>=0?'+':''}${e-P.ta}); profile ${JSON.stringify(r.profile)}`);
 RL.latched(c,r.x.log,e,r.latchEnd);
 const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid','out_SS1_DR1','out_SS1_DR2'].flatMap(k=>L.rises(latch,k).map(v=>k+'@'+(v-e)));
 c(rs.length===0,'EMGREF(2): no energy increase / STO or SS1 release / Unlock after e: '+rs.slice(0,6));
 c(latch.filter(L.isEmg).every(s=>!s.out.out_Door_Unlock_Solonoeid),'v6 §2: Unlock FALSE in every Emergency scan');
 c(r.stages.length===0,'E2-01 one stage memory: '+r.stages.slice(0,3));c(r.status.length===0,'E2-01/MOD-006 one status: '+r.status.slice(0,3));
 let ref=null;try{ref=E.runRef();}catch(err){c(false,'L2 base / q_R (in_Estop_PLC in steady Run) unavailable: '+err.message);}
 const R=key==='ES1'?trace('PLC',e,{pin}):null;if(R?.aborted)c(false,'L1 reference in_Estop_PLC at e aborted: '+R.aborted);
 if(steady){if(key==='ES1'){if(R&&!R.aborted)RL.L1(c,r.profile,R.profile);}else RL.L3(c,r.profile,RL.REF_RUN_PLC);RL.L4(c,r.profile);}
 else if(ref&&(!R||!R.aborted)){const ta=E.downTa(r.log,P.g,P.preG);const q=E.qNrunDown(r.log,ta);dg('EMG-RD-L scans of this trace: '+JSON.stringify(q.pts));
  const taOk=ta!=null&&ta>=P.g&&ta<e;c(taOk,`ERROR stand precondition (C4): down acceptance t_a=${ta} must satisfy g=${P.g} <= t_a < e=${e}`);
  const qN={...q.qN},h=stpd;const STO=['STO_DR1','STO_DR2'];
  if(h!=null&&C1_STPD==='min')for(const k of STO)if(qN[k]!=null)qN[k]=Math.min(qN[k],h);
  if(h!=null&&C1_STPD!=='min')for(const k of STO)delete qN[k];
  if(h!=null)dg(`v7 §1: Healthy loss h=${h} (t_a+${h-ta}); q_N(STO)=min(t_a+2000, h)=${qN.STO_DR1} (offset ${qN.STO_DR1-e} from e)`);
  const rd=taOk?RL.EMGRDL(c,r.profile,{e,qN,run:ref,R:R?R.profile:null,log:r.log,end:r.latchEnd,diag:dg}):{skip:new Set(),excl:new Set(),ledger:{}};
  if(h!=null&&C1_STPD!=='min'){for(const k of STO){rd.skip.add(k);rd.excl.add(k);rd.ledger[k]='nv-C1';}
   const tau=r.profile.STO_DR1,cand=typeof tau==='number'&&tau>=0&&tau<=1;
   c.nv(`STO_DR1/2 under STP-D + in_Estop_PLC in the same scan h=e (ждёт v7 C1): tau +${tau}/+${r.profile.STO_DR2}; under the proposed q_N=min(t_a+2000, h) W_N=[+0, +1] this would be ${cand?'inside':'outside'} (observation only)`);}
  if(expect)dg(`EMG-RD-L executed assertions (C4): ${RL.assertLedger(c,rd.ledger,expect)}`);
  RL.L4(c,r.profile,rd.excl);if(R)RL.L1(c,r.profile,R.profile,'',{skip:rd.skip});else RL.L2(c,r.profile,ref,'',dg,{skip:rd.skip});}
 RL.noRunAfter(c,r.x.log,e,r.latchEnd,r.pre.statuses.includes('STS_RUN'));
 if(r.pre.out.out_HV_C2)c(latch.some(s=>s.out.out_HV_Discharge_Request),'EMGREF-RUN: HV discharge performed (C2 ON at e)');
 if(stpd!=null){const sf=r.x.sf;if(sf)c(r.x.log.some(s=>s.t>=stpd&&s.t<=r.latchEnd&&s.out[sf]),`v7 §1 (Q-ARCH-05, 66(a)): ${sf} TRUE after the Healthy loss in SS1, not cancelled by Emergency`);
  else c.nv('v7 §1: SafetyFault after the Healthy loss in SS1 (Q-ARCH-05, 66(a)) - no SafetyFault symbol in the source (A8)');}
 c.list.push(...r.end.list);c.finish(t,`violated checks (e=${e})`);}
// C4 ledger: expected EMG-RD-L clause per Del key at each point, from the NORMATIVE chain q_N(STO)=t_a+2000, q_N(Dis)=t_s+5000,
// q_N(C2)=t_d+T_DIS against e+q_R (q_R = steady Run in_Estop_PLC, L3: STO 7006, Dis 7008, C2 8009; bound +1):
//  t_a+1 / t_a+1999: all three q_N < e+q_R, none at target at e-1 -> p.2A;
//  t_a+2001: STO due in [t_a+2000, t_a+2001] -> at target at e-1 (p.4) or reached in scan e = q_N+1 (p.2A); Dis/C2 p.2A;
//  t_s+4999: STO p.4; Dis q_N=e+1 -> p.2A; C2 p.2A;  t_d+T_DIS-1: STO p.4; Dis at target (p.4) or a finished request pulse
//  (G1 v6: only p.4, the request is a held level - Q-V7-01 "Г"); C2 q_N=e+1 -> p.2A;  C2_FBK wait: C2 OFF command at t_c < e -> p.4; STO p.4; Dis p.4;
//  PLC+HV/LV (STP-D/STP-H, v7 §1) h=e in {t_a+1, t_a+1000, t_a+1999}: q_N(STO)=min(t_a+2000, h)=h < e+7006 -> p.2A (STO in [h, h+1]);
//  Dis q_N=t_s+5000, C2 t_d+T_DIS from the actual t_s/t_d -> p.2A;  h < e (HV lost at t_a+500, PLC at t_a+1000): STO at target
//  at e-1 -> p.4;  h > e (PLC at t_a+1, HV lost at t_a+1000; TEAM-DEFAULT TD-03, SCENARIO_DECISIONS «Решено командой», ждёт просмотра Вадимом): q_N(STO)=h -> p.2A.
const A2=['p.2A'],P4=['p.4'],DIS_DONE=['p.4'];// G1 v6: done-left is a FAIL (Q-V7-01 "Г", question 73 "А") - Discharge only p.4
const X3=(sto,dis,c2)=>({STO_DR1:sto,STO_DR2:sto,out_HV_Discharge_Request:dis,out_HV_C2:c2});
const POINTS=[['t_a-1',P=>P.ta-1,{steady:true}],['t_a+1',P=>P.ta+1,{expect:X3(A2,A2,A2)}],['t_a+1999',P=>P.ta+1999,{expect:X3(A2,A2,A2)}],['t_a+2001',P=>P.ta+2001,{expect:X3(['p.4','p.2A'],A2,A2)}],
 ['t_s+4999',P=>P.ts+4999,{expect:X3(P4,A2,A2)}],['t_d+T_DIS-1',P=>P.td+E.T_DIS-1,{expect:X3(P4,DIS_DONE,A2)}],['C2_FBK wait (C2 OFF command +100, C2_FBK pinned ON 200 ms)',P=>P.tc+100,{pin:true,expect:X3(P4,DIS_DONE,P4)}]];
for(const key of ['PLC','ES1'])for(const [nm,eOf,o={}] of POINTS)
 test(L.T(`E2a EMG6-01 ${o.steady?'L3/L1 boundary':'EMG-RD-L'}: Run-down (green 600 ms), ${CAUSE[key].label} at e=${nm} -> Emergency latch, ${o.steady?'rule L as in steady Run':'descent steps not later than normal (Q-T3-1 "А")'}, Restart -> only Safe`),t=>{
  const P=base();judge(t,key,eOf(P),o);});
test(L.T('E2a EMG6-01 EMG-RD-L: Run-down, in_Estop_PLC and HV Healthy loss (STP-D) in the same scan e=t_a+1000 -> Emergency has priority, moments by EMG-RD-L, Restart -> only Safe'),t=>{
 const P=base();judge(t,'PLC_HV',P.ta+1000,{stpd:P.ta+1000,expect:X3(C1_STPD==='min'?A2:['nv-C1'],A2,A2)});});
// v7 §1 boundaries and combinations (C1): STO in [h, h+1] = min(t_a+2000, h); never at t_a+2000 when h is earlier.
for(const d of [1,1999])test(L.T(`E2a EMG6-01 EMG-RD-L STP-D combo (v7 §1): Run-down, in_Estop_PLC and HV Healthy loss in the same scan h=e=t_a+${d} -> STO in [h, h+1], Discharge/C2 from the actual t_s/t_d, Restart -> only Safe`),t=>{
 const P=base();judge(t,'PLC_HV',P.ta+d,{stpd:P.ta+d,expect:X3(A2,A2,A2)});});
test(L.T('E2a EMG6-01 EMG-RD-L STP-H combo (v7 §1, Q-RC-15 "Б"): Run-down, in_Estop_PLC and LV Healthy loss in the same scan h=e=t_a+1000 -> STO in [h, h+1], Restart -> only Safe'),t=>{
 const P=base();judge(t,'PLC_LV',P.ta+1000,{stpd:P.ta+1000,expect:X3(A2,A2,A2)});});
test(L.T('E2a EMG6-01 EMG-RD-L STP-D combo (v7 §1, h < e): Run-down, HV Healthy lost at t_a+500, in_Estop_PLC at e=t_a+1000 -> STO already active stays (p.4), Discharge/C2 from the actual t_s/t_d, Restart -> only Safe'),t=>{
 const P=base();const h=P.ta+500;judge(t,'PLC_HVLOSS',P.ta+1000,{stpd:h,loss:{at:h,inp:{in_HV_Faulty_FBK:true}},expect:X3(P4,A2,A2)});});
test(L.T('E2a EMG6-01 EMG-RD-L STP-D combo (v7 §1, TEAM-DEFAULT TD-03 «Решено командой», h > e): Run-down, in_Estop_PLC at e=t_a+1, HV Healthy lost at h=t_a+1000 -> STO in [h, h+1] (not later than without the emergency), Restart -> only Safe'),t=>{
 const P=base();const h=P.ta+1000;judge(t,'PLC_HVLOSS',P.ta+1,{stpd:h,loss:{at:h,inp:{in_HV_Faulty_FBK:true}},expect:X3(A2,A2,A2)});});
test(L.T('DIAG observation E2a EMG-RD-L STP-D combo: in_Estop_PLC and HV Healthy loss at h=e=t_a (v7 §1: observation)'),t=>{
 let P;try{P=base();}catch(err){t.diagnostic('base unavailable (observation only): '+err.message);return;}const r=trace('PLC_HV',P.ta);if(r.aborted){t.diagnostic('aborted: '+r.aborted);return;}t.diagnostic(`e=${r.e}: profile ${JSON.stringify(r.profile)}`);});
for(const [nm,eOf] of [['t_a',P=>P.ta],['q_N(STO)=t_a+2000',P=>P.ta+2000],['q_N(Discharge)=t_s+5000',P=>P.ts+5000]])
 test(L.T(`DIAG observation E2a EMG-RD-L: in_Estop_PLC at e=${nm} (v5 §2: observation)`),t=>{
  let P;try{P=base();}catch(err){t.diagnostic('base unavailable (observation only): '+err.message);return;}const r=trace('PLC',eOf(P));if(r.aborted){t.diagnostic('aborted: '+r.aborted);return;}t.diagnostic(`e=${r.e}: profile ${JSON.stringify(r.profile)}`);});
