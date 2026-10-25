// E2 G1 v2 (v2-tester) — E2-01 / E2-04: at most one stage and exactly one main status in every scan (lifecycles).
// Emergency scenarios moved to current-e2a-emg-*.test.js / current-e2*-sweep-*.test.js (helpers/e2-emergency.js).
// Normative in_Safety_Run TRUE without injection (A1, reviewer G1 C1); DIAG variants are prefixed and outside ^E2[a-d] .
// Oracle sources (SafetyTests/SCENARIO_DECISIONS.md SHA in program/tester/E2-G1/HANDOFF_v2.md; CRITERIA_DELTA E2-01/E2-04;
// program/analyst/REQ-CONSOLIDATION/CRITERIA.md):
//  E2-01 (READY): every scan exactly one of {Emergency, Safe, R&D, Run, Config}; two at once even 1 scan is forbidden
//    (named: Step3^Step4, Step4^Step12); E2 decision (Vadim) "исключить одновременное владение двумя стадиями";
//    MOD-006 "Emergency XOR Safe XOR R&D XOR Run XOR Config".
//  E2-04 / Q-RC-10 (Vadim: А — Emergency): none active -> Emergency; the group starts in Emergency.
//  EMGREF: while an Emergency cause is active the status is Emergency.
//  No premature status: MOD1-01 (R&D only after C1_FBK ON), MOD-002 / SPEC §7 (Run only after C2_FBK ON),
//    STP-A last row (R&D not before C2_FBK OFF), MOD5-01 (Safe not before C1_FBK OFF), SPEC §6 (no Emergency
//    without a cause).
//  Lifecycle endpoints (positive): MOD1-01, MOD-002, STP-A (R&D after C2_FBK OFF), MOD5-01.
//  Child phases (READY-D): D-STARTINGRUN-GREEN-DOWN / STP-E — green 500 ms in StartingRun ends in R&D, never starts
//    R&D->Safe (LV C1 kept); MOD-004 — UP during R&D->Safe not accepted.
// Observation: stage memories b_Step* (<=1) and status symbols STS_* (architect names, assumption A6).
// Assumptions A1..A9: helpers/e2-lifecycle.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,GREEN,OFF}=L;
const memo=new Map();
// scenario: start(): fresh or forked runtime; body(x,end,setHit) drives it; watchers attach right after start().
function scenario(name,start,body){
 if(memo.has(name))return memo.get(name);
 let x,stages=[],status=[],end=[],aborted=null,hit='';
 try{x=start();stages=L.watchStages(x);status=L.watchStatus(x);recordFbk(x);body(x,end,h=>{hit=h;});}catch(e){aborted=e.message;}
 const res={stages,status,end,aborted,hit};memo.set(name,res);return res;
}
const phaseNow=x=>`${x.stageSet().join('+')||'none'}`;
function recordFbk(x){x.fbk=[];x.listeners.push(s=>x.fbk.push({t:s.t,c1:x.get('in_LV_C1_FBK'),c2:x.get('in_HV_C2_FBK')}));}
function premature(x,end,label,from,statusName,fbkKey,fbkValue){
 if(x.statusMissing.length)return;
 const st=x.log.find(s=>s.t>from&&s.statuses.includes(statusName))?.t??Infinity;
 const fb=x.fbk.find(f=>f.t>from&&f[fbkKey]===fbkValue)?.t??Infinity;
 if(st<fb)end.push(`${label}: ${statusName} at t=${st} before ${fbkKey}=${fbkValue} at t=${fb}`);
}
function waitFor(x,pred,max){const lim=x.t+max;while(!pred()&&x.t<lim)x.step();return pred();}
function lifecycle(release){return (x,end)=>{
 L.boot(x);
 let p=x.t;L.toRnD(x);premature(x,end,'Safe->R&D (MOD1-01)',p,'STS_RND','c1',true);
 p=x.t;L.toRun(x);premature(x,end,'R&D->Run (MOD-002)',p,'STS_RUN','c2',true);
 p=x.t;x.step(GREEN);let k=1;const lim=x.t+15000;
 while(!x.get('b_Step_RnD')&&x.t<lim){x.step(release!=null&&k===release?OFF:{});k++;}
 if(!x.get('b_Step_RnD'))end.push(`Run->R&D by green (release ${release??'held'}): R&D not reached within 15000 ms (STP-A last row), stages=${phaseNow(x)}`);
 premature(x,end,'Run->R&D (STP-A)',p,'STS_RND','c2',false);
 x.step(OFF,2100);
 p=x.t;x.step(BOTH,1100);x.step(OFF);
 if(!waitFor(x,()=>x.get('b_Step3'),4000))end.push(`second R&D->Run after Run-down: Run not reached (MOD-002), stages=${phaseNow(x)}, out_HV_C2=${x.get('out_HV_C2')}`);
 else{premature(x,end,'second R&D->Run (MOD-002)',p,'STS_RUN','c2',true);x.step({},2100);
  x.step(GREEN,800);x.step(OFF);
  if(!waitFor(x,()=>x.get('b_Step_RnD'),15000))end.push(`second Run->R&D: R&D not reached (STP-A), stages=${phaseNow(x)}`);x.step({},2100);}
 const inRnd=x.get('b_Step_RnD');p=x.t;x.step(GREEN,600);x.step(OFF);
 if(!waitFor(x,()=>x.get('b_Step1'),3000))end.push(`R&D->Safe by green: Safe not reached (MOD5-01), stages=${phaseNow(x)}`);
 if(inRnd)premature(x,end,'R&D->Safe (MOD5-01)',p,'STS_SAFE','c1',false);
 x.step({},500);
 if(!x.statusMissing.length){const e=x.log.find(s=>s.statuses.includes('STS_EMG')&&s.t>15);
  if(e)end.push(`normal lifecycle without any Emergency cause shows STS_EMG at t=${e.t} (SPEC §6)`);}
};}
const scenarios={
 'lifecycle Safe->R&D->Run->green held->R&D->Run->R&D->Safe':[()=>L.create(),lifecycle(null)],
 'lifecycle with green released 550 ms after press':[()=>L.create(),lifecycle(550)],
 'lifecycle with green released 800 ms after press':[()=>L.create(),lifecycle(800)],
};
for(const [name,[start,body]] of Object.entries(scenarios)){
 test(L.T(`E2a E2-01 stages<=1: ${name}`),()=>{const r=scenario(name,start,body);
  assert.equal(r.aborted,null,`scenario aborted (coverage incomplete): ${r.aborted}`);
  assert.deepEqual(r.stages.slice(0,8),[],`more than one stage memory active (E2-01; phase at injection: ${r.hit}); total ${r.stages.length} scans`);});
 test(L.T(`E2a E2-01 exactly one status: ${name}`),()=>{const r=scenario(name,start,body);
  assert.equal(r.aborted,null,`scenario aborted (coverage incomplete): ${r.aborted}`);
  assert.deepEqual(r.status.slice(0,8),[],`not exactly one main status (E2-01/MOD-006; phase at injection: ${r.hit}); total ${r.status.length}`);
  assert.deepEqual(r.end.filter(e=>/STS_|EMGREF/.test(e)),[],'status timing/Emergency (MOD1-01, MOD-002, STP-A, MOD5-01, EMGREF)');});
 if(name.startsWith('lifecycle'))test(L.T(`E2a E2-01 endpoints: ${name}`),()=>{const r=scenario(name,start,body);
  assert.equal(r.aborted,null,`lifecycle precondition failed: ${r.aborted}`);
  assert.deepEqual(r.end.filter(e=>!/STS_|EMGREF/.test(e)),[],'lifecycle endpoints (MOD1-01, MOD-002, STP-A, MOD5-01)');});
}
// E2-04 / Q-RC-10: group start (no stage yet) is Emergency until the manual Restart; observed 3000 ms (reviewer G1 M4).
// Normative: in_Safety_Run TRUE. The FALSE variant is DIAGNOSTIC (logic does not run on target with RunStop FALSE).
function groupStart(safetyRun){const x=L.create({safetyRun});x.step({},3000);const c=L.checks();
 c(x.statusMissing.length===0,'status publication present (E2-04 needs an observable Emergency status)');
 const bad=x.log.filter(s=>!L.isEmg(s));
 c(bad.length===0,`Q-RC-10: none active -> Emergency; group starts in Emergency (3000 ms, no Restart): ${bad.slice(0,5).map(s=>`t=${s.t} [${s.statuses}] ${s.stages}`)}`);
 c(x.log.every(s=>!s.stages.some(v=>['b_Step_RnD','b_Step3'].includes(v))),'no R&D/Run stage before Restart (BOOT-C)');
 c(x.log.every(s=>L.ENERGY.every(k=>!s.out[k])),`no energy at start: ${L.ENERGY.filter(k=>x.log.some(s=>s.out[k]))}`);c.done();}
test(L.T('E2a E2-04 group start before Restart: status Emergency only, no energy, 3000 ms [in_Safety_Run true]'),()=>groupStart(true));
test('DIAG [injected-Safe, in_Safety_Run FALSE] E2a E2-04 group start before Restart [in_Safety_Run false] (not reachable on target; outside ID coverage)',()=>groupStart(false));
// Child phases of one transition (READY-D).
test(L.T('E2a E2-01 StartingRun (HV Healthy not yet present) + fresh green 600 ms: no R&D->Safe actions, LV C1 kept'),()=>{
 const x=L.cached('RnD');x.step({in_HV_Faulty_FBK:true});x.step(BOTH,1100);x.step(OFF);
 assert.ok(x.get('out_HV_C2')||x.get('STO_DR1'),'precondition: StartingRun (C2 ON command or STO released) reached');
 assert.equal(x.get('b_Step3'),false,'precondition: Run not confirmed while HV Healthy absent');
 x.step({},2100);const from=x.t;x.step(GREEN,600);x.step(OFF,2000);
 const seg=x.log.filter(s=>s.t>from);
 assert.ok(seg.every(s=>s.out.out_LV_C1),'out_LV_C1 never dropped (abort StartingRun ends in R&D with LV: STP-E, D-STARTINGRUN-GREEN-DOWN)');
 assert.ok(seg.every(s=>!s.out.out_LV_Discharge_Request),'no LV discharge request (no R&D->Safe in StartingRun)');
 assert.ok(seg.every(s=>!s.stages.includes('b_Step1')),'never Safe');
});
// C1_FBK pinned ON longer than 500 ms: on a candidate MOD5-01 may raise EMGREF meanwhile; only "UP not executed" is asserted
// (valid in both cases).
test(L.T('E2a E2-01 R&D->Safe in progress (C1_FBK held ON) + BOTH 1100 ms after 2100 ms release: no StartingRun'),()=>{
 const x=L.cached('RnD');x.hold={in_LV_C1_FBK:true};x.step(GREEN,600);x.step(OFF);
 assert.equal(x.get('out_LV_C1'),false,'precondition: R&D->Safe started (C1 OFF command)');
 x.step({},2100);const from=x.t;x.step(BOTH,1100);x.step(OFF,1500);
 const seg=x.log.filter(s=>s.t>from);
 assert.ok(seg.every(s=>!s.out.out_HV_C2),'no C2 ON (MOD-004: UP in a transition not accepted)');
 assert.ok(seg.every(s=>!s.out.STO_DR1&&!s.out.STO_DR2),'STO not released (MOD-004)');
 assert.ok(seg.every(s=>!s.stages.includes('b_Step3')),'never Run');
});
// G1 v3 (review m-d): partial publication of the main status symbols is a FAIL, never a silent fallback to D2-A (A6).
test(L.T('E2a E2-01/MOD-006 status publication: either all of STS_SAFE/STS_RND/STS_RUN/STS_EMG (D2-B) or none (D2-A derived) - partial publication FAIL'),t=>{
 const x=L.create();const present=L.STATUS_REQUIRED.filter(s=>L.hasName(s));t.diagnostic(`status mode ${x.statusMode}; present: ${present.join(',')||'none'}`);
 assert.deepEqual(x.statusMissing,[],`partial STS_* publication (m-d): present ${present.join(',')}`);});
