// E2 G1 v2 (v2-tester) — HLT-03 (unblocked by Q-RC-11 "А"; CRITERIA_DELTA §H): after HLT-01 (LV lost in R&D -> Safe)
// SafetyFault (HealthyLost) is active in Safe; acknowledgement per E6-Q2 / WDG-06.
// Oracle: (a) SafetyFault TRUE in Safe; (b) BOTH before the acknowledgement is not executed and not executed later;
//  (c) any button (green/blue, 1 scan and 600 ms) -> SafetyFault FALSE from the press scan, no transition (and, per
//  WDG-06(a) for Safe with SafetyFault, no Unlock - the press does not become a command);
//  (d) new BOTH after both buttons released >= 2000 ms -> Safe->R&D accepted; released 1999 ms -> not accepted
//  (WDG-06(b), explicit in HLT-03(d): 2000 inclusive). (e) PLC does not clear - E4, not written.
// LV Healthy is restored 100 ms after Safe so that the later Safe->R&D is not refused for LV (MOD1-01 positive control).
// SafetyFault value parts are NOT VERIFIED without a source symbol (A8) - t.todo after all observable checks.
// Chained case after Run->R&D: BLOCKED Q-E2Q-02 (not written). Assumptions A1..A9: helpers/e2-lifecycle.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,GREEN,BLUE,OFF}=L;
let base;
function safeWithFault(){if(!base){try{const x=L.cached('RnD',{c3:true});x.step({in_LV_Faulty_FBK:true});
  x.until(()=>x.get('b_Step1'),3000,'HLT-01: LV lost in R&D -> Safe');x.step({},100);x.step({in_LV_Faulty_FBK:false},2400);
  assert.equal(x.stageSet().join(),'b_Step1','precondition: Safe after HLT-01, buttons released > 2000 ms');base={x};}catch(e){base={error:e};}}
 if(base.error)throw base.error;return base.x.fork();}
const ACKS={'green 1 scan':[GREEN,1],'green 600 ms':[GREEN,600],'blue 1 scan':[BLUE,1],'blue 600 ms':[BLUE,600],'BOTH 1100 ms (UP gesture before acknowledgement)':[BOTH,1100]};
const up=(seg)=>seg.some(s=>s.out.out_LV_C1||s.stages.includes('b_Step12')||s.stages.includes('b_Step_RnD'));
for(const [an,[btn,dur]] of Object.entries(ACKS))
 test(L.T(`E2c HLT-03 Safe with SafetyFault after HLT-01, first press ${an}: acknowledges, no transition/Unlock; new BOTH after release 1999 ms rejected, 2000 ms accepted`),t=>{
  const x=safeWithFault(),c=L.checks();const sfObs=!!x.sf;
  if(sfObs)c(x.get(x.sf)===true,`(a) SafetyFault (${x.sf}) TRUE in Safe after HLT-01 before any press`);
  const p=x.t+1;x.step(btn,dur);x.step(OFF);const pressSeg=x.log.filter(s=>s.t>=p);
  if(sfObs)c(pressSeg.every(s=>!s.out[x.sf]),'(c) SafetyFault FALSE from the press scan (E6-Q2, WDG-06(a))');
  c(!up(pressSeg),`(b)(c) the acknowledging press is not executed: no C1 ON / Safe->R&D (HLT-03, WDG-06(a)); stages=${x.stageSet()}`);
  c(pressSeg.every(s=>!s.out.out_Door_Unlock_Solonoeid),'(c) no Unlock from the acknowledging press (WDG-06(a): the press does not become a command)');
  const ack=x.fork();
  const y=ack.fork();y.step(OFF,1998);const q=y.t+1;y.step(BOTH,1100);y.step(OFF,1500);
  c(!up(y.log.filter(s=>s.t>=p)),`(b)(d) BOTH after both released 1999 ms is not accepted, and the first gesture is not executed later (WDG-06(b)); stages=${y.stageSet()}`);
  const z=ack.fork();z.step(OFF,1999);z.step(BOTH,1100);z.step(OFF);
  c(z.log.filter(s=>s.t>=q).some(s=>s.out.out_LV_C1),`(d) new BOTH after both released 2000 ms -> Safe->R&D accepted (C1 ON) (HLT-03(d), WDG-06(b)); stages=${z.stageSet()}`);
  c.done();if(!sfObs)t.todo('NOT VERIFIED: HLT-03 (a) SafetyFault TRUE in Safe and (c) cleared from the press scan - no SafetyFault symbol (A8); transition parts above PASSED');
 });
