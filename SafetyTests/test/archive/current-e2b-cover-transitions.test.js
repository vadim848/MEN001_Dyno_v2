// E2 G1 v2 (v2-tester) — IL-05a, IL-05b(1)(2), IL-02 boundaries (CRITERIA v2 §C; reviewer G1 M3; kills E2b-03/04/11).
// Oracle sources (SCENARIO_DECISIONS.md, SHA in program/tester/E2-G1/HANDOFF_v2.md):
//  IL-05a (Q-RC-03(a)): accepted R&D->Run, STO released, Run not confirmed; NC FALSE in c -> EMGREF-RUN: Emergency from c
//   (<= c+1), STO restored and C2/C1/C3/BMS removed at the SAME offsets from the event as with in_Estop_PLC in steady Run
//   (differential; reference = helpers/e2-emergency.js runRef); Run not confirmed after c even with C2_FBK / HV healthy;
//   forbidden: STO released and C2 ON indefinitely, "R&D" with Run-level energy after Restart. Boundaries: c=u-1 -> IL-02
//   (UP rejected, R&D); c=u+1, c=r-1 -> IL-05a; c=r+1 -> IL-03; u and r observation (taken from a no-event fork).
//  IL-02 boundaries: NC FALSE in N, UP in N-1 (-> IL-05a), N, N+1 (rejected). N=u-1 (UP in N+1) normative; N=u (UP in the
//   same scan) - G1 v3: ONE normative disjunction for IL-02 N=u / IL-05a c=u (CRITERIA_DELTA_v4 §C, analyst T2): (i) no STO
//   release / C2 ON in any scan >= u, R&D, no Emergency/fault, closing the cover does not execute the held UP; or (ii) if STO
//   released or C2 ON in any scan >= u: Emergency by rule L (reference in_Estop_PLC in StartingRun at u), full EMGREF-RUN,
//   Restart -> only Safe. Forbidden either way: Run. Which outcome occurred - t.diagnostic.
//  G1 v3: IL-05a / IL-05b boundary / IL-05d moments by rule L1 (helpers/e2-rule-l.js; CRITERIA_DELTA_v4 §0.1, analyst N2)
//   against in_Estop_PLC applied in the SAME scan of the SAME drive; the in_Estop_PLC trace itself by L2 against steady
//   Run; L4 and the latch on every trace. The v2 exact equality "same offset as in_Estop_PLC in steady Run" is replaced.
//  IL-05b (Q-RC-03(b1), V14-Q7, V14-Q21(a)): NC FALSE during (1) normal Run->R&D - moments unchanged (differential with the
//   same program without the event), result R&D, then R&D with the cover open (IL-02); (2) Safe->R&D before R&D - continues
//   (MOD1-01). No Emergency, no fault. Boundary with Run: NC FALSE in t_a-1 -> IL-03 (Emergency); t_a+1 -> (1); t_a observation.
//  EMG6-01: after Emergency, Restart -> ONLY Safe. (3) R&D->Safe = IL-02b(c) (current-e2a-rnd-cover-healthy).
//  IL-05d (Q-RC-17 "Б"): (1)(3) at the end of this file. Not written: IL-05b(4) (PLC-09b / WDG-01/02 - E4/E6), IL-05d(2)(4) (E6/E4).
//  G1 v8: acceptance point A - TD-08 (TEAM-DEFAULT); IL-02, Q-RC-03(a), DIS-HOLD-HV a, LV-A1, TD-07 (analyst E2b-dev/CRITERIA.md §1.2-1.5):
//   c <= A-1 refusal (IL-02); c = A normative disjunction (was N=u); [A+1, u] IL-05a, no new C2/STO in any scan >= c; E2d COV-1 (§2.4).
//   IL-05b t_a = linkRunDownOwner (TEAM-DEFAULT TD-09, analyst E2-v73-q §1); absent -> ERROR. L2 in StartingRun - TEAM-DEFAULT TD-10 (§2).
// Assumptions A1..A9: helpers/e2-lifecycle.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
import * as E from '../helpers/e2-emergency.js';
import * as RL from '../helpers/e2-rule-l.js';
const {BOTH,GREEN,OFF}=L;
const NC={NC1:{in_InterLock_NC_1:false},NC2:{in_InterLock_NC_2:false},both:{in_InterLock_NC_1:false,in_InterLock_NC_2:false}};
const CLOSED={in_InterLock_NC_1:true,in_InterLock_NC_2:true};
const emg=s=>!s.out.b_EStop_Ok||s.statuses.includes('STS_EMG')||s.stages.some(v=>['b_Step4','b_Step5','b_Step6'].includes(v));
const outs=s=>Object.fromEntries(Object.entries(s.out).filter(([k])=>k!=='out_EStop_Status'));
// ---- R&D -> Run: u (acceptance) and r (Run confirmation) observed on a no-event fork ----
let up;
// G1 v8 (lead 2026-10-22; analyst E2b-dev/CRITERIA.md §1.2/§1.3, TD-08 TEAM-DEFAULT; IL-02, Q-RC-03(a), DIS-HOLD-HV a, LV-A1, TD-07):
// A = first scan >= p with ANY acceptance sign of R&D->Run on the no-event fork: STATE_SU (Symbol recRndC_SU), out_HV_C2 TRUE, STO_DR1/2
// released. Symbol recRndC_SU absent in the source -> stand ERROR for every test that uses A (no silent A = u). u - A -> diagnostic only.
const SU='recRndC_SU';
function upPoints(){if(!up){try{const b=L.cached('RnD',{c3:true});const x=b.fork();const p=x.t+1;let su=null;const hasSU=L.hasName(SU);
  if(hasSU)x.listeners.push((q,y)=>{if(su==null&&q.t>=p&&y.r.get(SU))su=q.t;});x.step(BOTH,1100);x.step(OFF);
  x.until(()=>x.statusSet().includes('STS_RUN'),3000,'Run confirmed after BOTH from R&D (no-event reference)');
  const seg=x.log.filter(s=>s.t>=p);up={b,p,u:L.firstAt(seg,s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2),r:L.firstAt(seg,s=>s.statuses.includes('STS_RUN'))};
  up.A=hasSU?Math.min(...[su,up.u].filter(v=>v!=null)):null;up.Aerr=hasSU?null:`ERROR stand: Symbol ${SU} (STATE_SU) absent in this source - acceptance point A (TD-08) not observable; no silent A = u`;
  assert.ok(up.u!=null&&up.r!=null&&up.r>up.u+1,`precondition: u ${up.u} and r ${up.r} observed`);}catch(e){up={error:e};}}
 if(up.error)throw up.error;return up;}
function pointA(t){const q=upPoints();if(q.Aerr)throw Error(q.Aerr);t.diagnostic(`A=${q.A} (TD-08), u=${q.u}, u-A=${q.u-q.A} (diagnostic)`);return q;}
function driveUp(c,open,door,until){const {b,p}=upPoints();const x=b.fork();
 for(let n=x.t+1;n<=until;n++){const inp={};if(n===p)Object.assign(inp,BOTH);if(n===p+1100)Object.assign(inp,OFF);
  if(n===c)Object.assign(inp,open,door===false?{in_Door_Monitor:false}:{});x.step(inp);}return x;}
// rule-L traces at event scan c of the R&D->Run drive: in_Estop_PLC (L1 reference), memoised. G1 v4: the no-event trace is
// no longer used (A11 removed, review G1 v3 N6).
const upTr=new Map();
function upTrace(kind,c,until){const id=kind+'|'+c+'|'+until;if(!upTr.has(id)){const x=kind==='PLC'?driveUp(c,{in_Estop_PLC:true},true,until):driveUp(null,{},true,until);
  upTr.set(id,{x,pre:x.log.find(s=>s.t===c-1),p:RL.profile(x.log,x.log.find(s=>s.t===c-1),c,until)});}return upTr.get(id);}
function ruleL(ck,t,x,c,until,label='',l1opt={},su=false){const pre=x.log.find(s=>s.t===c-1);const P=RL.profile(x.log,pre,c,until);
 const R=upTrace('PLC',c,until);RL.latched(ck,x.log,c,until,label);
 // G1 v9 TD-11 (TEAM-DEFAULT TD-11, analyst E2-G1-v8-q §1.2 L2-SU-HV0): in StartingRun, a trace with out_HV_C2 FALSE and STO active in EVERY scan >= c
 // has no lower bound for out_HV_Discharge_Request except tau >= c (upper d_Run+1); L1 for it: tau_X <= tau_R. Otherwise TD-10 unchanged.
 const DIS='out_HV_Discharge_Request',hvX=su&&RL.hv0(x.log,c,until),hvR=su&&RL.hv0(R.x.log,c,until);if(su)t.diagnostic(`${label}TD-11 precondition (HV never raised at/after c): X ${hvX}, R ${hvR}`);
 const sk=new Set([...(l1opt.skip??[]),...(hvX&&hvR?[DIS]:[])]);RL.L1(ck,P,R.p,label,{...l1opt,skip:sk});
 if(hvX&&hvR){const x1=P[DIS],r1=R.p[DIS];ck(x1==='n/a'&&r1==='n/a'||typeof x1==='number'&&(r1===null||typeof r1==='number'&&x1<=r1),`${label}L1 (TD-11) ${DIS}: cause +${x1} vs in_Estop_PLC +${r1} (tau_X <= tau_R, no lower bound)`);}
 RL.L4(ck,P,null,label);
 let ref=null;try{ref=E.runRef();}catch(err){ck(false,label+'L2 base (in_Estop_PLC in steady Run) unavailable: '+err.message);}
 // G1 v8 TD-10 / G1 v9 TD-12: in StartingRun L2 Del window [d_Run-1, d_Run+1] for the reference; for the cause X the lower bound tau_X - e >= d_Run-2
 // (+ C1 OFF >= 2000); TD-11 replaces both for the HV discharge when its precondition holds on that trace. In Run (c=r+1) L2 unchanged.
 if(ref){if(su){RL.L2su(ck,R.p,ref,label+'reference trace in_Estop_PLC at c: ',m=>t.diagnostic(m),{hv0:hvR});if(hvR)RL.hv0Discharge(ck,R.p,ref,R.x.log,c,until,label+'reference trace: ');
   RL.L1suLower(ck,P,ref,label,{skip:new Set(hvX?[DIS]:[])});if(hvX)RL.hv0Discharge(ck,P,ref,x.log,c,until,label);}
  else RL.L2(ck,R.p,ref,label+'reference trace in_Estop_PLC at c: ',m=>t.diagnostic(m));}return P;}
function il05a(t,c,open,door,label,{A=null,restore=CLOSED}={}){
 const x=driveUp(c,open,door,c+12000);const ck=L.checks();const seg=x.log.filter(s=>s.t>=c);
 const pre=x.log.find(s=>s.t===c-1);t.diagnostic(`phase before c: ${pre.stages} C2=${pre.out.out_HV_C2} STO=${pre.out.STO_DR1}/${pre.out.STO_DR2}`);
 // G1 v8 (TD-08 §1.5): with the acceptance point A known the precondition is A <= c-1; otherwise (legacy rows) STO released / C2 ON before c.
 if(A!=null)ck(A<=c-1,`precondition: R&D->Run accepted before c (A=${A} <= c-1=${c-1}, TD-08)`);
 else ck(pre.out.STO_DR1||pre.out.STO_DR2||pre.out.out_HV_C2||pre.statuses.includes('STS_RUN'),'precondition: R&D->Run accepted before c (STO released or C2 ON)');
 ruleL(ck,t,x,c,c+12000,'',{},!pre.statuses.includes('STS_RUN'));
 RL.noRunAfter(ck,x.log,c,c+12000,pre.statuses.includes('STS_RUN'));// v6 §5 (N3): not Run before c -> no STS_RUN in any scan >= c; Run before c (c=r+1) -> none from the first Emergency scan
 // G1 v8 (TD-08 §1.5): rises judged from c-1 so that a rise IN scan c (c vs c-1) is also a FAIL.
 const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid','out_SS1_DR1','out_SS1_DR2'].flatMap(k=>L.rises(x.log.filter(s=>s.t>=(A!=null?c-1:c)),k).map(v=>k+'@'+(v-c)));// c vs c-1 only for the TD-08 rows (A given)
 ck(rs.length===0,'EMGREF(2): no energy increase / STO release / Unlock in scan c or after (c vs c-1 included): '+rs.slice(0,5));
 for(const k of ['STO_DR1','STO_DR2','out_HV_C2','out_LV_C1','out_C3_BatRelay','out_RBM_Bat'])if(!pre.out[k])ck(seg.every(s=>!s.out[k]),`${k} stays OFF (was OFF before c)`);
 if(pre.out.out_HV_C2)ck(seg.some(s=>s.out.out_HV_Discharge_Request),'EMGREF-RUN: HV discharge performed');
 x.step(restore,100);L.restartToSafe(x,ck,'');ck.finish(t,`violated checks (${label})`);}
for(const [nm,cOf,cn,door] of [['u+1',q=>q.u+1,'NC1',true],['u+50',q=>q.u+50,'NC1',true],['u+50',q=>q.u+50,'NC2',true],['u+50',q=>q.u+50,'both',true],
 ['u+50',q=>q.u+50,'both',false],['r-1',q=>q.r-1,'NC1',true]])
 test(L.T(`E2b IL-05a StartingRun, ${cn} FALSE (Door ${door}) at c=${nm}: Emergency, rule L vs in_Estop_PLC at c, Run not confirmed, Restart -> only Safe`),t=>{
  const q=upPoints();il05a(t,cOf(q),NC[cn],door,`c=${nm}=${cOf(q)}, u=${q.u}, r=${q.r}`);});
// G1 v8 (TD-08 §1.3): IL-05a-A - c = A+1 is already the accepted StartingRun: Emergency by rule L1, no C2 ON / STO release in any scan >= c.
for(const cn of ['NC1','NC2','both'])test(L.T(`E2b IL-05a-A StartingRun, ${cn} FALSE at c=A+1 (first scan after the acceptance sign, TD-08): Emergency, rule L vs in_Estop_PLC at c, no C2 ON / STO release in any scan >= c, Restart -> only Safe`),t=>{
 const q=pointA(t);il05a(t,q.A+1,NC[cn],true,`c=A+1=${q.A+1}, A=${q.A}, u=${q.u}`,{A:q.A});});
// G1 v9 (review G1 v8 m-23; E2b-dev §1.3 "Connector (LV/HV) в R&D->Run в c >= A+1 - EMG4-03 (EMGREF-RUN), та же граница A"; EMGREF / rule L for
// ES_NC_1/2 and Mentee): other L1 causes at c = A+1 in StartingRun -> Emergency by rule L1 vs in_Estop_PLC at c, no new C2 / STO in any scan >= c.
for(const [cn,on,off] of [['in_LV_Connector_Interlock FALSE',{in_LV_Connector_Interlock:false},{in_LV_Connector_Interlock:true}],['in_HV_Connector_Interlock FALSE',{in_HV_Connector_Interlock:false},{in_HV_Connector_Interlock:true}],
 ['in_ES_NC_1 FALSE',{in_ES_NC_1:false},{in_ES_NC_1:true}],['in_ES_NC_2 FALSE',{in_ES_NC_2:false},{in_ES_NC_2:true}],['in_Mentee_EStop TRUE',{in_Mentee_EStop:true},{in_Mentee_EStop:false}]])
 test(L.T(`E2b IL-05a-A StartingRun, ${cn} at c=A+1 (TD-08; EMG4-03 / EMGREF-RUN): Emergency, rule L vs in_Estop_PLC at c, no C2 ON / STO release in any scan >= c, Restart -> only Safe`),t=>{
  const q=pointA(t);il05a(t,q.A+1,on,true,`c=A+1=${q.A+1}, A=${q.A}, u=${q.u}, ${cn}`,{A:q.A,restore:{...CLOSED,...off}});});
// G1 v8 (lead 2026-10-22, kill target M-E2d-17..22, PLAN v7.4; oracle V14-Q5/Q7, IL-05a, TD-08, analyst E2b-dev §2.4 E2d-COV-1): accepted
// R&D->Run (SU at u-2 on the candidates), cover lost from c in {u-1, u, u+1}: no C2 ON and no STO_DR1/STO_DR2 release in any scan >= c that was
// not already there at c-1, Emergency by rule L1 vs in_Estop_PLC in the same scan. Precondition A <= c-1.
for(const [nm,cOf] of [['u-1',q=>q.u-1],['u',q=>q.u],['u+1',q=>q.u+1]])for(const cn of ['NC1','NC2','both'])
 test(L.T(`E2d COV-1 R&D->Run accepted (A <= c-1), ${cn} FALSE from c=${nm}: no C2 ON / STO_DR1 / STO_DR2 release in any scan >= c, Emergency by rule L1 vs in_Estop_PLC at c, Restart -> only Safe`),t=>{
  const q=pointA(t);il05a(t,cOf(q),NC[cn],true,`COV-1 c=${nm}=${cOf(q)}, A=${q.A}, u=${q.u}`,{A:q.A});});
test(L.T('E2b IL-05a boundary c=r+1 (Run just confirmed), NC1 FALSE -> IL-03: Emergency, rule L vs in_Estop_PLC at c, Restart -> only Safe'),t=>{
 const q=upPoints();il05a(t,q.r+1,NC.NC1,true,`c=r+1=${q.r+1}`);});
// G1 v8 (TD-08): the refusal boundary moves from u-1 to A-1 (stricter: closer to the latch).
test(L.T('E2d IL-02 boundary NC1 FALSE in c=A-1 (A = first acceptance sign, TD-08): UP rejected - no C2 ON / STO release, R&D and LV kept, no Emergency; not executed after the cover closes'),t=>{
 const q=pointA(t),N=q.A-1;const x=driveUp(N,NC.NC1,true,N+3000);x.step(CLOSED,2000);const seg=x.log.filter(s=>s.t>=N),ck=L.checks();
 ck(seg.every(s=>!s.out.out_HV_C2&&!s.out.STO_DR1&&!s.out.STO_DR2&&!s.statuses.includes('STS_RUN')),'UP rejected (V14-Q5) and not executed after the cover closes (V14-Q11, CVR-004)');
 ck(seg.every(s=>s.stages.join()==='b_Step_RnD'&&s.out.out_LV_C1),'R&D and LV kept every scan (V14-Q21a)');
 const e=seg.filter(emg);ck(e.length===0,'no Emergency/fault: '+e.slice(0,3).map(s=>s.t));ck.done();});
// G1 v8 (TD-08 §1.3): the disjunction applies at c = A (A = u on a source without SU before the first output: legacy behaviour unchanged).
for(const cn of ['NC1','NC2','both'])test(L.T(`E2d IL-02/IL-05a boundary c=A (${cn} FALSE in the first acceptance-sign scan, TD-08): normative disjunction - (i) UP rejected, R&D, no Emergency, or (ii) Emergency by rule L with EMGREF-RUN; never Run`),t=>{
 const q=pointA(t),N=q.A,until=N+12000;const x=driveUp(N,NC[cn],true,until);const seg=x.log.filter(s=>s.t>=N),ck=L.checks();
 // G1 v9 TD-15 (analyst E2-G1-v8-r §3; E2b-dev §2.3, L Imm): at c = A no new increase (C2 ON, STO release) in scan c or later in ANY outcome; the former
 // reading '(ii) C2/STO in c, then Emergency' is withdrawn.
 {const rs=['out_HV_C2','STO_DR1','STO_DR2'].flatMap(k=>L.rises(x.log.filter(s=>s.t>=N-1),k).map(v=>k+'@c+'+(v-N)));ck(rs.length===0,'TD-15: no new C2 ON / STO release in scan c = A or later (any outcome): '+rs.slice(0,4));}
 const rel=seg.filter(s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);
 ck(seg.every(s=>!s.statuses.includes('STS_RUN')),'never Run status in any scan >= u (IL-02 and IL-05a; v6 §5: stage memories are not an oracle)');
 if(!rel.length){t.diagnostic('outcome (i): UP rejected (no STO release / C2 ON in any scan >= u)');
  ck(seg.every(s=>s.stages.join()==='b_Step_RnD'&&s.out.out_LV_C1),'(i) R&D and LV kept every scan (V14-Q21a)');
  const e=seg.filter(emg);ck(e.length===0,'(i) no Emergency/fault: '+e.slice(0,3).map(s=>s.t));
  const from=x.t;x.step(CLOSED,2000);ck(x.log.filter(s=>s.t>from).every(s=>!s.out.out_HV_C2&&!s.out.STO_DR1&&!s.out.STO_DR2&&!s.statuses.includes('STS_RUN')),'(i) closing the cover does not execute the held UP (V14-Q11, CVR-004)');}
 else{t.diagnostic(`outcome (ii): STO released / C2 ON at t=${rel[0].t} (u=${N}) -> Emergency required`);
  // N4 (review G1 v3) per CRITERIA_DELTA_v6 §4 (C-A1, READY-D): a = first scan >= u with STO released or C2 ON in X;
  // R = the same drive with the cover closed and in_Estop_PLC from c_R = a_R+1 (a_R = first release of the no-event drive
  // = upPoints().u, IL-05a c=u+1 analog, not degenerate); d_R(o) = tau_R(o) - c_R. Del o: u+d_R-1 <= tau_X <= a+1+d_R;
  // Imm o (incl. SS1, v6 §3): tau_X <= a+1+d_R. STO/C2 are measured as the first scan after their release in [a, a+1]
  // where they are back at the target (never 'n/a'); an output X never released is not timed (EMGREF(2) forbids it later).
  // Energy increases only in scans a and a+1 (the acceptance itself); from a+2 any increase FAIL.
  const a=rel[0].t,cR=q.u+1,R=upTrace('PLC',cR,until);const pu=x.log.find(s=>s.t===N-1);const PX=RL.profile(x.log,pu,N,until);
  t.diagnostic('(ii) a='+a+' c_R='+cR+' R profile '+JSON.stringify(R.p)+' X profile from u '+JSON.stringify(PX));
  // G1 v5 (C3): the per-output window check moved to RL.nuII (self-tested in current-e2a-emg-anchor); SS1 released in [a, a+1]
  // is timed from its return like STO/C2.
  const timed=RL.nuII(ck,{log:x.log,N,a,Rp:R.p,PX,diag:m=>t.diagnostic(m)});t.diagnostic('(ii) v6 §4 outputs timed: '+timed);
  RL.L4(ck,PX,null,'(ii) ');RL.latched(ck,x.log,N,until,'(ii) ');
  let ref=null;try{ref=E.runRef();}catch(err){ck(false,'(ii) L2 base (in_Estop_PLC in steady Run) unavailable: '+err.message);}
  if(ref){const hvR=RL.hv0(R.x.log,cR,until);RL.L2su(ck,R.p,ref,'(ii) reference trace in_Estop_PLC at c_R: ',m=>t.diagnostic(m),{hv0:hvR});if(hvR)RL.hv0Discharge(ck,R.p,ref,R.x.log,cR,until,'(ii) reference trace: ');}// G1 v8 TD-10, v9 TD-11
  const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid','out_SS1_DR1','out_SS1_DR2'].flatMap(k=>L.rises(seg.filter(s=>s.t>=a+1),k).filter(v=>v>=a+2).map(v=>k+'@'+(v-N)));
  ck(rs.length===0,'(ii) v6 §4 / EMGREF(2): no energy increase / STO or SS1 release / Unlock from a+2 (offsets from u): '+rs.slice(0,5));
  if(x.log.find(s=>s.t===N-1)?.out.out_HV_C2||rel.some(s=>s.out.out_HV_C2))ck(seg.some(s=>s.out.out_HV_Discharge_Request),'(ii) EMGREF-RUN: HV discharge performed');
  x.step(CLOSED,100);L.restartToSafe(x,ck,'(ii) ');}
 ck.finish(t);});
// ---- IL-05b(1): normal Run->R&D by green; t_a observed on the no-event fork ----
let down;
function downBase(holdC2){const key=String(holdC2);down??={};if(!down[key]){try{const b=L.cached('Run',{c3:true});const x=b.fork();if(holdC2)x.hold={in_HV_C2_FBK:true};
  const p=x.t+1,pre=x.snap();let cOff,own=null;const OWN='linkRunDownOwner',hasOwn=L.hasName(OWN);
  if(hasOwn)x.listeners.push((q,y)=>{if(own==null&&q.t>=p&&y.r.get(OWN))own=q.t;});x.step(GREEN,600);x.step(OFF);
  const lim=x.t+15000;while(!x.get('b_Step_RnD')&&x.t<lim){if(holdC2&&cOff==null&&!x.get('out_HV_C2'))cOff=x.t;if(cOff!=null&&x.t>=cOff+200)delete x.hold.in_HV_C2_FBK;x.step();}
  if(holdC2)assert.ok(cOff!=null,'precondition: C2 OFF command observed');
  assert.ok(x.get('b_Step_RnD'),`precondition: normal Run->R&D by green reached R&D (no-event reference); stages=${x.stageSet()}`);x.step({},3000);
  const keys=['out_SS1_DR1','out_SS1_DR2','STO_DR1','STO_DR2','out_HV_Discharge_Request','out_HV_C2'];
  const taObs=L.firstAt(x.log.filter(s=>s.t>=p),s=>keys.some(k=>s.out[k]!==pre.out[k]));
  // G1 v8 TD-09 (TEAM-DEFAULT TD-09; analyst E2-v73-q/CRITERIA.md 2ee04ebb… §1.1/§1.5; REQ §B, IL-05b, Q-RC-03(b1), Q-RC-01): t_a = first scan >= P
  // with linkRunDownOwner TRUE on this no-event trace. Symbol absent -> ERROR stand; Symbol present but never set although the descent runs ->
  // ERROR precondition. NO fallback to the first output change t_a(obs) (diagnostic only).
  if(!hasOwn)assert.fail('ERROR stand (TD-09): linkRunDownOwner absent in this source - down acceptance t_a not observable (no fallback to t_a(obs))');
  assert.ok(own!=null,'ERROR precondition (TD-09): linkRunDownOwner never set although the normal Run->R&D runs (t_a(obs)='+taObs+')');
  down[key]={b,p,ta:own,taObs,taSrc:'linkRunDownOwner',ref:x,cOff};}catch(e){down[key]={error:e};}}
 if(down[key].error)throw down[key].error;return down[key];}
function driveDown(d,at,open,holdC2){const x=d.b.fork();if(holdC2)x.hold={in_HV_C2_FBK:true};const end=d.ref.t;
 for(let n=x.t+1;n<=end;n++){const inp={};if(n===d.p)Object.assign(inp,GREEN);if(n===d.p+600)Object.assign(inp,OFF);if(n===at)Object.assign(inp,open);
  if(holdC2&&n===d.cOff+200+1)delete x.hold.in_HV_C2_FBK;x.step(inp);}return x;}
for(const [nm,atOf,cn,holdC2] of [['t_a+1',d=>d.ta+1,'NC1',false],['t_a+1',d=>d.ta+1,'NC2',false],['t_a+1',d=>d.ta+1,'both',false],['t_a+1000',d=>d.ta+1000,'NC2',false],
 ['C2 OFF command+1 (C2_FBK pinned ON 200 ms)',d=>d.cOff+1,'both',true]])
 test(L.T(`E2b IL-05b(1) normal Run->R&D by green, ${cn} FALSE at ${nm}: stop continues with unchanged moments, R&D, then R&D kept with the cover open; no Emergency`),t=>{
  const d=downBase(holdC2),at=atOf(d);assert.ok(at!=null&&!Number.isNaN(at),'precondition: event point observed');
  const x=driveDown(d,at,NC[cn],holdC2);const ck=L.checks();
  t.diagnostic(`t_a=${d.ta} (${d.taSrc}); first output change ${d.taObs}`);const ph=d.ref.log.find(s=>s.t===at-1);t.diagnostic(`no-event phase at event-1: ${ph?.stages} SS1=${ph?.out.out_SS1_DR1} STO=${ph?.out.STO_DR1} C2=${ph?.out.out_HV_C2}`);
  const A=x.log.filter(s=>s.t>=at),B=d.ref.log.filter(s=>s.t>=at);const diff=[];
  for(let i=0;i<A.length&&i<B.length&&diff.length<4;i++){const a=outs(A[i]),b=outs(B[i]);for(const k of Object.keys(b))if(a[k]!==b[k]){diff.push(`t=${A[i].t} ${k}: cover-open=${a[k]} vs no-event=${b[k]}`);break;}}
  ck(diff.length===0,'IL-05b(1): output moments of the normal stop unchanged by the cover loss (Q-RC-03 b1): '+diff.join('; '));
  const e=A.filter(emg);ck(e.length===0,'no Emergency/fault: '+e.slice(0,3).map(s=>s.t));
  const tr=L.firstAt(A,s=>s.stages.includes('b_Step_RnD'));ck(tr!=null,'result R&D');
  if(tr!=null)ck(A.filter(s=>s.t>=tr).every(s=>s.stages.join()==='b_Step_RnD'&&s.out.out_LV_C1),'then R&D kept with the cover open, LV ON (IL-02)');
  ck.done();});
// G1 v8 TD-09 §1.3: t_a-1 for NC1, NC2 and both (t_a = linkRunDownOwner).
for(const cn of ['NC1','NC2','both'])test(L.T(`E2b IL-05b boundary: ${cn} FALSE in t_a-1 (t_a = linkRunDownOwner, TD-09; before the down is accepted) -> IL-03 Emergency (rule L vs in_Estop_PLC), no normal R&D, Restart -> only Safe`),t=>{
 const d=downBase(false),at=d.ta-1;t.diagnostic(`t_a=${d.ta} (${d.taSrc}); first output change ${d.taObs}`);const x=driveDown(d,at,NC[cn],false);const ck=L.checks();const seg=x.log.filter(s=>s.t>=at);
 x.step({},Math.max(0,at+12000-x.t));const until=x.t;
 // rule L1 vs in_Estop_PLC at the same scan of the same drive; L4 (G1 v4: no no-event relaxation).
 const R=driveDown(d,at,{in_Estop_PLC:true},false);R.step({},Math.max(0,until-R.t));const P=RL.profile(x.log,x.log.find(s=>s.t===at-1),at,until);
 const Rp=RL.profile(R.log,R.log.find(s=>s.t===at-1),at,until);
 RL.latched(ck,x.log,at,until);RL.L1(ck,P,Rp);RL.L4(ck,P);
 ck(seg.every(s=>!s.stages.includes('b_Step_RnD')&&!s.statuses.includes('STS_RND')),'no protective descent into R&D instead of Emergency (IL-03)');
x.step(CLOSED,100);L.restartToSafe(x,ck,'');ck.done();});
// G1 v8 TD-09 §1.3 c = t_a: observation, normative disjunction - (i) IL-03 (Emergency latched, no normal R&D, Restart -> only Safe) or (ii) IL-05b(1)
// (stop continues, R&D, no Emergency, R&D kept with the cover open). Either way forbidden: Run in any scan >= c+1 without Emergency; new energy
// increase (C2 ON, STO release, C1 ON, C3/BMS ON, Unlock) in any scan >= c (c vs c-1 included). Outcome -> diagnostic.
for(const cn of ['NC1','NC2','both'])test(L.T(`E2b IL-05b boundary: ${cn} FALSE in c=t_a (t_a = linkRunDownOwner, TD-09) -> normative disjunction: (i) IL-03 Emergency latched, Restart -> only Safe, or (ii) IL-05b(1) R&D without Emergency; no new energy increase in scan >= c, no Run without Emergency`),t=>{
 const d=downBase(false),at=d.ta;t.diagnostic(`t_a=${d.ta} (${d.taSrc}); first output change ${d.taObs} (t_a(obs)-t_a=${d.taObs-d.ta})`);const x=driveDown(d,at,NC[cn],false);x.step({},Math.max(0,at+12000-x.t));
 const ck=L.checks();const seg=x.log.filter(s=>s.t>=at);const em=seg.find(emg);
 const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid'].flatMap(k=>L.rises(x.log.filter(s=>s.t>=at-1),k).map(v=>k+'@c+'+(v-at)));
 ck(rs.length===0,'no new energy increase / STO release / Unlock in scan c or later (c vs c-1): '+rs.slice(0,4));
 if(!em){const run=seg.find(s=>s.t>=at+1&&s.statuses.includes('STS_RUN'));ck(!run,`no Run in any scan >= c+1 without Emergency; first t=${run?.t}`);}
 if(em){t.diagnostic(`outcome (i) IL-03: first Emergency c+${em.t-at}`);RL.latched(ck,x.log,at,x.t,'(i) ');ck(seg.every(s=>!s.stages.includes('b_Step_RnD')&&!s.statuses.includes('STS_RND')),'(i) no normal R&D after the Emergency path');
  x.step(CLOSED,100);L.restartToSafe(x,ck,'(i) ');}
 else{t.diagnostic('outcome (ii) IL-05b(1): no Emergency');const tr=L.firstAt(seg,s=>s.stages.includes('b_Step_RnD'));ck(tr!=null,'(ii) result R&D');
  if(tr!=null)ck(seg.filter(s=>s.t>=tr).every(s=>s.stages.join()==='b_Step_RnD'&&s.out.out_LV_C1),'(ii) then R&D kept with the cover open, LV ON (IL-02)');}
 ck.done();});
// G1 v8 TD-09 §1.2 (BTN-003, READY-D): the marker itself vs the green qualification. q_G = P+500 (T_SINGLE expiry, convention q).
test(L.T('E2b TA-OWNER steady Run, green from P held 600 ms: linkRunDownOwner FALSE and no descent output in every scan <= q_G-1, TRUE not later than q_G+1 (q_G = P+500; BTN-003, TD-09)'),t=>{
 if(!L.hasName('linkRunDownOwner'))assert.fail('ERROR stand (TD-09): linkRunDownOwner absent in this source');
 const b=L.cached('Run',{c3:true});const x=b.fork();x.step(OFF,10);const pre=x.snap(),P=x.t+1,qG=P+500;x.step(GREEN,600);x.step(OFF,100);const ck=L.checks();
 const keys=['out_SS1_DR1','out_SS1_DR2','STO_DR1','STO_DR2','out_HV_Discharge_Request','out_HV_C2'];
 const early=x.log.find(s=>s.t>=P&&s.t<=qG-1&&(s.owner||keys.some(k=>s.out[k]!==pre.out[k])));ck(!early,`no marker and no descent output in [P, q_G-1]; first t=P+${early?early.t-P:'-'}`);
 const own=L.firstAt(x.log.filter(s=>s.t>=P),s=>s.owner);t.diagnostic(`marker at P+${own==null?'never':own-P} (q_G = P+500 observation)`);ck(own!=null&&own<=qG+1,`marker TRUE not later than q_G+1 = P+501; first P+${own==null?'never':own-P}`);ck.done();});
test(L.T('E2b TA-OWNER steady Run, green released at P+499 (shorter than T_SINGLE) -> marker never set, Run kept (BTN-003 q-1, TD-09)'),t=>{
 if(!L.hasName('linkRunDownOwner'))assert.fail('ERROR stand (TD-09): linkRunDownOwner absent in this source');
 const b=L.cached('Run',{c3:true});const x=b.fork();x.step(OFF,10);const P=x.t+1;x.step(GREEN,499);x.step(OFF,3000);const ck=L.checks();const seg=x.log.filter(s=>s.t>=P);
 const own=seg.find(s=>s.owner);ck(!own,`marker never set; first t=P+${own?own.t-P:'-'}`);ck(seg.every(s=>s.statuses.includes('STS_RUN')),'Run kept in every scan');ck.done();});
// ---- IL-05b(2): Safe->R&D accepted, NC FALSE before R&D -> continues to R&D (MOD1-01, V14-Q7) ----
for(const cn of ['NC1','both'])test(L.T(`E2b IL-05b(2) Safe->R&D accepted, ${cn} FALSE one scan after acceptance: continues to R&D, outputs as without the event, no Emergency`),t=>{
 const b=L.cached('Safe');const r=b.fork();const p=r.t+1;r.step(BOTH,1100);r.step(OFF,3000);
 const s0=L.firstAt(r.log.filter(s=>s.t>=p),s=>s.out.out_LV_C1);assert.ok(s0!=null,'precondition: Safe->R&D accepted (C1 ON) on the no-event fork');
 const x=b.fork();for(let n=x.t+1;n<=r.t;n++){const inp={};if(n===p)Object.assign(inp,BOTH);if(n===p+1100)Object.assign(inp,OFF);if(n===s0+1)Object.assign(inp,NC[cn]);x.step(inp);}
 const ck=L.checks();const A=x.log.filter(s=>s.t>s0),B=r.log.filter(s=>s.t>s0);const diff=[];
 for(let i=0;i<A.length&&i<B.length&&diff.length<4;i++){const a=outs(A[i]),c=outs(B[i]);for(const k of Object.keys(c))if(a[k]!==c[k]){diff.push(`t=${A[i].t} ${k}: ${a[k]} vs ${c[k]}`);break;}}
 ck(diff.length===0,'IL-05b(2): Safe->R&D continues unchanged: '+diff.join('; '));
 ck(x.stageSet().join()==='b_Step_RnD'&&x.get('out_LV_C1'),`R&D reached with the cover open (MOD1-01); stages=${x.stageSet()}`);
 const e=A.filter(emg);ck(e.length===0,'no Emergency/fault: '+e.slice(0,3).map(s=>s.t));ck.done();});
// ---- IL-05d (Q-RC-17 "Б", Vadim 2026-10-21): cover loss in other descents -> Emergency. (1) aborted StartingRun after
// the abort event; (3) protective descent from Run after Healthy loss (Q-RC-02). (2) WDG-03 rollback - E6, (4) Config - E4:
// not written. Expected: EMGREF (status Emergency from the cover event +1, latched; no energy increase / STO release /
// Unlock); then cause removed, Restart -> only Safe (EMG6-01). Abort/descent points are observed, not oracle.
// G1 v3: x is the drive right BEFORE the cover event (state at ev-1); three forks: NC1 (X), in_Estop_PLC (rule L1 reference,
// same phase and scan), no event (A11/L4). Latch window ev..ev+12000, then cause removed and Restart.
// G1 v4 (N6; CRITERIA_DELTA v5 §2 + v6 §6, Q-T3-1 "А"): EMG-RD-L with the NORMATIVE q_N of the descent (qNof(log): STP-E/I
// abort or STP-G protective descent, scans of the same trace = history x.log + the event fork) for both the in_Estop_PLC
// trace R (base L2 vs steady Run) and the NC1 trace X (base L1 vs R); L4 without the no-event relaxation (A11 removed).
// G1 v5 (C4 ledger): exp = {key: allowed EMG-RD-L branches} from the normative q_N of the descent at ev (same for X and R).
function il05d(t,x,ev,label,qNof,exp){const ck=L.checks();const until=ev+12000;const pre=x.snap();const hist=x.log.slice();
 const tr=inp=>{const y=x.fork();y.step(inp);y.step({},Math.max(0,until-y.t));return {y,p:RL.profile(y.log,pre,ev,until),log:[...hist,...y.log]};};
 const X=tr(NC.NC1),R=tr({in_Estop_PLC:true});const seg=X.y.log.filter(s=>s.t>=ev);const dg=m=>t.diagnostic(m);
 RL.latched(ck,X.y.log,ev,until);
 let ref=null;try{ref=E.runRef();}catch(err){ck(false,'L2 base / q_R (in_Estop_PLC in steady Run) unavailable: '+err.message);}
 let rdX={skip:new Set(),excl:new Set()},rdR={skip:new Set(),excl:new Set()};
 if(ref){const qx=qNof(X.log),qr=qNof(R.log);dg('EMG-RD-L reference scans X '+JSON.stringify(qx.pts)+' R '+JSON.stringify(qr.pts));
  rdR=RL.EMGRDL(ck,R.p,{e:ev,qN:qr.qN,run:ref,log:R.log,end:until,label:'reference trace in_Estop_PLC at ev: ',diag:dg});
  const nR=RL.assertLedger(ck,rdR.ledger,exp,'reference trace in_Estop_PLC at ev: ');
  RL.L2(ck,R.p,ref,'reference trace in_Estop_PLC at ev: ',dg,{skip:rdR.skip});RL.L4(ck,R.p,rdR.excl,'reference trace in_Estop_PLC at ev: ');
  rdX=RL.EMGRDL(ck,X.p,{e:ev,qN:qx.qN,run:ref,R:R.p,log:X.log,end:until,diag:dg});
  const nX=RL.assertLedger(ck,rdX.ledger,exp);dg(`EMG-RD-L executed assertions (C4): R ${nR}, X ${nX}`);}
 RL.L1(ck,X.p,R.p,'',{skip:rdX.skip});RL.L4(ck,X.p,rdX.excl);RL.noRunAfter(ck,X.y.log,ev,until,pre.statuses.includes('STS_RUN'));
 const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid','out_SS1_DR1','out_SS1_DR2'].flatMap(k=>L.rises(seg,k).map(v=>k+'@'+(v-ev)));
 ck(rs.length===0,'EMGREF(2): no energy increase / STO release / Unlock after the event: '+rs.slice(0,5));
 const y=X.y;y.step({...CLOSED,in_LV_Faulty_FBK:false,in_HV_Faulty_FBK:false},100);L.restartToSafe(y,ck,'');ck.finish(t,`violated checks (${label})`);}
// Expected EMG-RD-L clause per key at ev (normative q_N, CRITERIA §B STP-E/I/G; T_DIS=1000):
//  STP-E/I abort, ev ~ a+100: STO q_N=a (restored, precondition) -> p.4; Discharge q_N=t_s (< ev) -> p.4 (G1 v6: held level, Q-V7-01 "Г");
//  C2 q_N=t_d+1000 > ev, C2 ON at ev-1 -> p.2A.  STP-G, ev=h+100: STO q_N=h -> p.4; Discharge t_s+5000 and C2 t_d+1000 > ev -> p.2A.
const EXP_ABORT={STO_DR1:['p.4'],STO_DR2:['p.4'],out_HV_Discharge_Request:['p.4'],out_HV_C2:['p.2A']};// G1 v6: Discharge p.4 only (Q-V7-01 "Г", 73 "А")
const EXP_STPG={STO_DR1:['p.4'],STO_DR2:['p.4'],out_HV_Discharge_Request:['p.2A'],out_HV_C2:['p.2A']};
test(L.T('E2b IL-05d(1) StartingRun aborted by LV loss (c=u+50), NC1 FALSE at c+100 during the abort -> Emergency (rule L vs in_Estop_PLC in the same phase), Restart -> only Safe'),t=>{
 const q=upPoints(),c=q.u+50,ev=c+100;const {b,p}=q;const x=b.fork();
 for(let n=x.t+1;n<ev;n++){const inp={};if(n===p)Object.assign(inp,BOTH);if(n===p+1100)Object.assign(inp,OFF);if(n===c)inp.in_LV_Faulty_FBK=true;x.step(inp);}
 assert.ok(x.log.some(s=>s.t>c&&s.t<ev&&!s.out.STO_DR1&&!s.out.STO_DR2),'precondition: abort started (STO restored) before the cover event');
 il05d(t,x,ev,`c=${c}, cover ${ev}`,log=>E.qNabort(log,c,{coast:false}),EXP_ABORT);});
// G1 v8 (review G1 v7 N17; analyst E2-G1-v7-q §1/§4): abort green after a FULL 2 s clearing from rb (pause 2100 ms, was 200 ms = invalid green).
test(L.T('E2b IL-05d(1) StartingRun (HV Faulty TRUE holds it) aborted by green 600 ms after a 2100 ms full clearing, NC1 FALSE 100 ms after the abort -> Emergency (rule L vs in_Estop_PLC in the same phase), Restart -> only Safe'),t=>{
 const b=L.cached('RnD',{c3:true});const x=b.fork();x.step({in_HV_Faulty_FBK:true});x.step(BOTH,1100);x.step(OFF,2100);
 assert.ok((x.get('STO_DR1')||x.get('out_HV_C2'))&&!x.statusSet().includes('STS_RUN'),'precondition: StartingRun (R&D->Run accepted, Run not confirmed)');
 const g=x.t+1;x.step(GREEN,600);x.step(OFF);const a=L.firstAt(x.log.filter(s=>s.t>=g),s=>!s.out.STO_DR1&&!s.out.STO_DR2);
 assert.ok(a!=null,'precondition: abort by green observed (STO restored)');x.step({},Math.max(0,a+99-x.t));const ev=x.t+1;
 il05d(t,x,ev,`abort ${a}, cover ${ev}`,log=>E.qNabort(log,a,{coast:false}),EXP_ABORT);});
for(const k of ['LV','HV'])test(L.T(`E2b IL-05d(3) steady Run, ${k} Healthy lost (protective descent, Q-RC-02), NC1 FALSE 100 ms later -> Emergency (rule L vs in_Estop_PLC in the same phase), Restart -> only Safe`),t=>{
 const x=L.cached('Run',{c3:true});const h=x.t+1;x.step({[`in_${k}_Faulty_FBK`]:true},100);const ev=x.t+1;il05d(t,x,ev,`h ${h}, cover ${ev}`,log=>E.qNabort(log,h,{coast:true}),EXP_STPG);});
