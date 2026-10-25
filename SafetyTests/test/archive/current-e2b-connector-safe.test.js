// E2 G1 v2 (v2-tester) — EMG4-03 in Safe (EMG-003) and the Safe->R&D acceptance boundary (CRITERIA_DELTA §I; Q-RC-14 "А").
// Oracle: in Safe a lost LV/HV connector only forbids UP - no fault, no Emergency (EMG-003); restoration does not start
//  anything without a new gesture; a new BOTH after 2 s release with the connector present is accepted (positive control).
//  Boundary on the acceptance scan u of Safe->R&D (u observed on a no-event fork): loss in u-1 -> EMG-003 (UP rejected);
//  u+1 -> EMGREF-LV (Emergency latched, R&D never confirmed, Restart -> only Safe); u - observation.
//  G1 v3: u+1 moments by rule L1 vs in_Estop_PLC in the same scan of the same drive (EMG4-03 "моменты по правилу L1",
//  CRITERIA_DELTA_v4 §I), L4, latch from the first Emergency scan (the absolute "from u+2" of v2 is removed).
// "No fault": no Emergency (b_EStop_Ok TRUE, no STS_EMG, no S4..S6) and, if a SafetyFault symbol exists (A8), SafetyFault
//  FALSE; without the symbol that part is NOT VERIFIED (t.todo after the observable checks).
// Steady connector loss in all other phases: current-e2a-emg-*.test.js (E2b EMG4-03 ...). Assumptions A1..A9: e2-lifecycle.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
import * as RL from '../helpers/e2-rule-l.js';
const {BOTH,OFF}=L;
const emg=s=>!s.out.b_EStop_Ok||s.statuses.includes('STS_EMG')||s.stages.some(v=>['b_Step4','b_Step5','b_Step6'].includes(v));
const CON={LV:'in_LV_Connector_Interlock',HV:'in_HV_Connector_Interlock'};
for(const [k,sig] of Object.entries(CON)){
 test(L.T(`E2b EMG4-03 Safe, ${k} connector FALSE: no Emergency/fault, BOTH rejected; restoration does not start; new BOTH accepted`),t=>{
  const x=L.cached('Safe'),c=L.checks(),p=x.t;x.step({[sig]:false},3000);x.step(BOTH,1100);x.step(OFF,1000);
  const seg=x.log.filter(s=>s.t>p);
  c(seg.every(s=>s.stages.join()==='b_Step1'&&!s.out.out_LV_C1),'Safe kept, UP rejected: no C1 ON / Safe->R&D (EMG-003)');
  const e=seg.filter(emg);c(e.length===0,'no Emergency (EMG-003, Q-RC-14 "В Safe — без изменений"): '+e.slice(0,3).map(s=>s.t));
  const sf=x.sf?c(seg.every(s=>!s.out[x.sf]),`no SafetyFault (${x.sf})`):false;
  const q=x.t;x.step({[sig]:true},2500);c(x.log.filter(s=>s.t>q).every(s=>!s.out.out_LV_C1),'restoration alone does not start Safe->R&D (EMG-003)');
  x.step(BOTH,1100);x.step(OFF,300);c(x.log.filter(s=>s.t>q).some(s=>s.out.out_LV_C1),'new BOTH after release with the connector present: Safe->R&D accepted (positive control)');
  c.done();if(!x.sf)t.todo('NOT VERIFIED: "without fault" beyond "no Emergency" - no SafetyFault symbol (A8); observable checks PASSED');});
}
let ref;
function acc(){if(!ref){try{const b=L.cached('Safe');const x=b.fork();const p=x.t+1;x.step(BOTH,1100);x.step(OFF,100);
  const u=L.firstAt(x.log.filter(s=>s.t>=p),s=>s.out.out_LV_C1);assert.ok(u!=null,'precondition: Safe->R&D accepted (C1 ON) on the no-event fork');
  // G1 v8 (TD-08, analyst E2b-dev §1.2/§1.4; LV-A1): A = first scan >= p with stage b_Step12 or C1 ON (no-event fork); A <= u.
  const A=L.firstAt(x.log.filter(s=>s.t>=p),s=>s.stages.includes('b_Step12')||s.out.out_LV_C1);ref={b,p,u,A};}catch(e){ref={error:e};}}
 if(ref.error)throw ref.error;return ref;}
function drive(at,sig,until,val=false){const {b,p}=acc();const x=b.fork();for(let n=x.t+1;n<=until;n++){const inp={};if(n===p)Object.assign(inp,BOTH);if(n===p+1100)Object.assign(inp,OFF);
 if(n===at)inp[sig]=val;x.step(inp);}return x;}
for(const [k,sig] of Object.entries(CON)){
 // G1 v8 (TD-08 §1.4): boundaries on A (first acceptance sign) instead of u: A-1 -> EMG-003 (also no b_Step12), A -> observation disjunction,
// A+1 -> EMGREF-LV with C1 ON in no scan >= e; u+1 kept.
 test(L.T(`E2b EMG4-03 boundary: ${k} connector FALSE in A-1 (one scan before the first Safe->R&D acceptance sign, TD-08) -> EMG-003: UP rejected, no S12, no Emergency`),t=>{
  const {u,A}=acc();t.diagnostic(`A=${A}, u=${u}`);const x=drive(A-1,sig,u+3000);const seg=x.log.filter(s=>s.t>=A-1),c=L.checks();
  c(seg.every(s=>!s.out.out_LV_C1&&!s.stages.includes('b_Step_RnD')&&!s.stages.includes('b_Step12')),'UP rejected: no C1 ON, no b_Step12, no R&D (EMG-003)');
  const e=seg.filter(emg);c(e.length===0,'no Emergency: '+e.slice(0,3).map(s=>s.t));c.done();});
 test(L.T(`E2b EMG4-03 boundary: ${k} connector FALSE in u+1 (Safe->R&D accepted) -> EMGREF-LV: Emergency latched (rule L1 vs in_Estop_PLC), R&D never confirmed, Restart -> only Safe`),()=>{
  const {u}=acc();const e0=u+1;const x=drive(e0,sig,e0+10000);x.step({[sig]:true},100);const c=L.checks();const seg=x.log.filter(s=>s.t>e0);
  const until=e0+10000,pf=y=>RL.profile(y.log,y.log.find(s=>s.t===e0-1),e0,until);
  const R=drive(e0,'in_Estop_PLC',until,true);RL.latched(c,x.log,e0,until);RL.L1(c,pf(x),pf(R));RL.L4(c,pf(x));// G1 v4: no no-event relaxation (A11 removed)
  c(seg.every(s=>!s.stages.includes('b_Step_RnD')&&!s.statuses.includes('STS_RND')),'R&D never confirmed after the event (Q-ARCH-01 (2))');
  const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid','out_SS1_DR1','out_SS1_DR2'].flatMap(q=>L.rises(seg,q).map(v=>q+'@'+(v-e0)));
  c(rs.length===0,'no energy increase / Unlock after the event: '+rs.slice(0,4));
  L.restartToSafe(x,c,'');c.done();});
 for(const [nm,dA,norm] of [['A+1',1,true],['A',0,false]])test(L.T(`E2b EMG4-03 boundary: ${k} connector FALSE in ${nm} (TD-08) -> ${norm?'EMGREF-LV: Emergency latched (rule L1 vs in_Estop_PLC), C1 ON in no scan >= e, R&D never, Restart -> only Safe':'observation disjunction: (i) Safe, C1 OFF, no Emergency, or (ii) EMGREF-LV; in both no C1 ON in scan >= e (TD-15); R&D forbidden'}`),t=>{
  const {u,A}=acc();const e0=A+dA,until=e0+10000;t.diagnostic(`A=${A}, u=${u}, e=${e0}`);const x=drive(e0,sig,until);const c=L.checks();const seg=x.log.filter(s=>s.t>=e0);
  c(seg.every(s=>!s.stages.includes('b_Step_RnD')&&!s.statuses.includes('STS_RND')),'R&D never in any scan >= e');
  const c1=seg.filter(s=>s.out.out_LV_C1);const em=seg.find(L.isEmg);
  if(norm){c(c1.length===0,`C1 ON in no scan >= e (EMGREF-LV, TD-08 A+1); first t=e+${c1[0]?c1[0].t-e0:'-'}`);
   const pf=y=>RL.profile(y.log,y.log.find(s=>s.t===e0-1),e0,until);const R=drive(e0,'in_Estop_PLC',until,true);RL.latched(c,x.log,e0,until);RL.L1(c,pf(x),pf(R));RL.L4(c,pf(x));}
  else{t.diagnostic(`outcome: ${em?'(ii) Emergency at e+'+(em.t-e0):'(i) no Emergency'}; C1 ON scans >= e: ${c1.length}`);
   if(!em){c(c1.length===0,'(i) Safe: C1 OFF in every scan >= e (C1 ON without Emergency forbidden)');c(seg.every(s=>s.t===e0||!s.stages.includes('b_Step12')),'(i) b_Step12 only allowed in A itself');}
   else{RL.latched(c,x.log,e0,until,'(ii) ');c(c1.length===0,`(ii) TD-15 (analyst E2-G1-v8-r §3): no C1 ON in scan e = A or later in any outcome; first C1 ON t=e+${c1[0]?c1[0].t-e0:'-'}`);}}
  const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid'].flatMap(q=>L.rises(seg,q).map(v=>q+'@'+(v-e0)));
  if(norm)c(rs.length===0,'no energy increase / Unlock after the event: '+rs.slice(0,4));
  x.step({[sig]:true},100);if(em||norm)L.restartToSafe(x,c,'');c.done();});
}
