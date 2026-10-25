// E2 G1 v2 (v2-tester) — IL-03 (CRITERIA v2) / EMG-002 (Run): InterLock NC1 or NC2 lost in steady Run -> Emergency (EMGREF-RUN).
// Oracle sources (SafetyTests/SCENARIO_DECISIONS.md, SHA in program/tester/E2-G1/HANDOFF_v2.md): Q-RC-01 (Vadim: В —
//  Emergency; "защёлка, снятие всей энергии, восстановление по V14-Q6"), supersedes V14-Q21(b); CRITERIA v2 §0 EMGREF:
//  (3) the OUTPUT sequence equals the reaction to in_Estop_PLC TRUE in the same state and scan; EMGREF-RUN end state;
//  EMG6-01 / V14-Q6 / Q-ARCH-01: Restart -> ONLY Safe, energy removed (reviewer G1 C2).
// G1 v3: EMGREF(3) moments by rule L1 (helpers/e2-rule-l.js; CRITERIA_DELTA_v4 §0.1/§C, analyst N2): per output first
//  change tau - Imm (status Emergency, C3/BMS OFF, LV discharge, Unlock FALSE) not later than in_Estop_PLC; Del (C1 OFF, STO,
//  HV discharge, C2 OFF) equal or leading by 1 scan; any lag FAIL. L4 status first; latch from the first Emergency scan.
//  The v2 scan-by-scan equality is replaced (other outputs only diagnostic).
// Differential: one real lifecycle to steady Run (in_Safety_Run TRUE, no injection), forked; run A drops the InterLock
//  channel(s) in scan t, run B raises in_Estop_PLC in scan t; every observed OUTPUT (alias outputs + b_EStop_Ok) must be
//  equal in every scan for 12 s, then the cause is removed (held 12000 / short 100 ms), both stay latched 3 s, the same
//  Restart (A9: green press 100 ms + release, blue released) is applied to both. Stage memories b_Step* and STS_* are NOT
//  part of the equality (reviewer G1 M1: EMGREF(3) speaks about outputs) - their differences are printed as diagnostics.
//  out_EStop_Status is excluded (it reports the cause: ES/PLC/Mentee).
// in_Door_Monitor TRUE/FALSE variants (V14-Q5: Door is not part of "cover closed"). Assumptions A1..A9: e2-lifecycle.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
import * as RL from '../helpers/e2-rule-l.js';
const {OFF}=L;
const causes={NC1:{in_InterLock_NC_1:false},NC2:{in_InterLock_NC_2:false},both:{in_InterLock_NC_1:false,in_InterLock_NC_2:false}};
const restore={in_InterLock_NC_1:true,in_InterLock_NC_2:true};
const outs=s=>Object.fromEntries(Object.entries(s.out).filter(([k])=>k!=='out_EStop_Status'));
const bases=new Map();
function base(door){if(!bases.has(door)){let b;try{const x=L.cached('Run',{c3:true});if(!door)x.step({in_Door_Monitor:false},10);
  assert.equal(x.stageSet().join(),'b_Step3','precondition: steady Run');b={x};}catch(e){b={error:e};}bases.set(door,b);}
 const b=bases.get(door);if(b.error)throw b.error;return b.x;}
function drive(x,on,off,hold,c){x.step({...on,...OFF});x.step({},hold-1);x.step(off);x.step({},Math.max(0,12000-hold)+3000);const latchEnd=x.t;
 L.restartToSafe(x,c,'');return latchEnd;}
const refs=new Map();
function ref(door,hold){const k=door+'/'+hold;if(!refs.has(k)){const b=base(door).fork();const c=L.checks();drive(b,{in_Estop_PLC:true},{in_Estop_PLC:false},hold,c);refs.set(k,b);}return refs.get(k);}
for(const [cn,cause] of Object.entries(causes))for(const door of [true,false])for(const hold of [12000,100])
 test(L.T(`E2b IL-03 steady Run, ${cn} FALSE (Door ${door}), cause removed after ${hold} ms: reaction moments by rule L1 vs in_Estop_PLC, latch (EMGREF), Restart -> only Safe`),t=>{
  const bx=base(door),t0=bx.t+1;const a=bx.fork(),b=ref(door,hold);const c=L.checks();
  const pre=a.snap();c(pre.out.out_C3_BatRelay&&pre.out.out_RBM_Bat,'precondition: C3/BMS ON before the event (end-state check non-vacuous)');
  const latchEnd=drive(a,cause,restore,hold,c);
  const A=a.log.filter(s=>s.t>=t0),B=b.log.filter(s=>s.t>=t0);
  const obs=[];for(let i=0;i<A.length&&i<B.length&&obs.length<4;i++)if(A[i].stages.join()!==B[i].stages.join()||A[i].statuses.join()!==B[i].statuses.join())obs.push(`t=${A[i].t} stages ${A[i].stages}/${B[i].stages} statuses ${A[i].statuses}/${B[i].statuses}`);
  if(obs.length)t.diagnostic('observation only (M1): internal stage/status differs from the in_Estop_PLC run: '+obs.join('; '));
  const PA=RL.profile(a.log,pre,t0,latchEnd),PB=RL.profile(b.log,pre,t0,latchEnd);t.diagnostic('rule L profiles NC/in_Estop_PLC: '+JSON.stringify(PA)+' / '+JSON.stringify(PB));
  RL.L1(c,PA,PB);RL.L4(c,PA,null);RL.latched(c,a.log,t0,latchEnd);
  const od=RL.otherDiffs(A.filter(s=>s.t<=latchEnd),B.filter(s=>s.t<=latchEnd),t0);if(od.length)t.diagnostic('observation (outputs outside rule L): '+od.join('; '));
  const latch=A.filter(s=>s.t<=latchEnd);
  const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_Door_Unlock_Solonoeid','out_C3_BatRelay','out_RBM_Bat','out_SS1_DR1','out_SS1_DR2'].flatMap(k=>L.rises(latch,k).map(x=>k+'@'+x));
  c(rs.length===0,'no energy increase, no STO release, no Unlock: '+rs.slice(0,4));
  c(latch.every(s=>!s.out.out_Door_Unlock_Solonoeid),'Unlock FALSE');
  RL.noRunAfter(c,a.log,t0,latchEnd,pre.statuses.includes('STS_RUN'));// G1 v4 N3 / v6 §5: STS_RUN only before the first Emergency scan (moment by L1), stages not an oracle
  c(latch.some(s=>s.out.out_HV_Discharge_Request),'EMGREF-RUN: HV discharge performed');
  c.done();
 });
