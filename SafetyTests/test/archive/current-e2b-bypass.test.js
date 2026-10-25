// E2 G1 v6 (v2-tester) — legacy Bypass (inPLC_BypassC1C2) in Emergency / outside Safe / at the Restart exit (review G1 v5 §6 N7).
// Oracle (no expectation from the implementation):
//  - program/analyst/E2-plan-v4-questions/CRITERIA.md 5d6bcc1a…120b §1: B43-01 (READY-D) Bypass while the status is Emergency
//    gives no energy - variants (a) 300 ms / 5000 ms held, (b) 1 scan, (c) TRUE before e and held, (d) in_ES_NC_1 kept FALSE,
//    (e) Emergency from R&D and Safe->R&D, (f) after group start before the first Restart (BOOT-C); boundaries b = C2 OFF-1 /
//    C2 OFF / C2 OFF+1 all normative (event boundary, not a timer). B43-02 (READY-D) Restart exit with Bypass at g_r+delta,
//    delta in {-100, -1, 0, +1, +2}, and Bypass held through the exit: exactly one EMG->SAFE, no SAFE / EMG scan with C1 or C2,
//    no flicker, no R&D/Run/Config, the held Bypass never executed later.
//    Lead decision on B4-3: variant (А) - legacy Bypass only in Safe (E2-plan-v5-questions §4 records it as Vadim's V14-Q16).
//  - program/analyst/E2-plan-v5-questions/CRITERIA.md 0a2f7de9…6b4c §4: B51-01 (READY; V14-Q16, Q-RC-05(a), EMG-011) Bypass
//    outside steady Safe is inert - C1/C2/STO/Discharge/Unlock and status equal scan by scan to the same trace without Bypass;
//    SAFE-NOENERGY (READY; SPEC §2, MOD-006) - in every scan with status Safe out_LV_C1 = out_HV_C2 = FALSE.
//  - Status classification: published STS_* or D2-A (A6). "No fault": SafetyFault NV until the symbol (A8).
// Notation: e = event scan (in_ES_NC_1 FALSE 100 ms, then TRUE); early Restart = green e+120..e+219 (S6: status EMG, EOk TRUE);
// "chain end" = first scan >= e from which C1, C2 are OFF for good in the trace without Bypass; "C2 OFF" boundary = first scan
// >= e with out_HV_C2 FALSE (for R&D / Safe->R&D, where C2 is already OFF, the boundary is the C1 OFF scan - the last energy
// removed: tester's choice of test points, the norm "no energy at status Emergency" holds in every scan anyway).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,GREEN,OFF}=L;
const BP='inPLC_BypassC1C2';
const DIFF=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_HV_Discharge_Request','out_LV_Discharge_Request','out_Door_Unlock_Solonoeid','out_C3_BatRelay','out_RBM_Bat'];
const ENERGY=['out_LV_C1','out_HV_C2','out_C3_BatRelay','out_RBM_Bat'];
const isSafe=s=>s.statuses.length===1&&s.statuses[0]==='STS_SAFE';
const UPSTAGE=['b_Step12','b_Step_RnD','b_Step3'];
// ---- phase producers (real lifecycle) ----
const PH={
 Run:()=>L.cached('Run',{c3:true}),
 'R&D':()=>L.cached('RnD',{c3:true}),
 Safe:()=>L.cached('Safe'),
 'Safe->R&D':()=>{const x=L.cached('Safe');x.hold={in_LV_C1_FBK:false};x.step(BOTH);x.until(()=>x.get('out_LV_C1'),1500,'Safe->R&D accepted (C1 ON command)');x.step(OFF,30);
  assert.ok(!x.get('b_Step_RnD')&&!x.statusSet().includes('STS_RND'),'precondition: R&D not confirmed (C1_FBK pinned OFF 30 ms)');x.hold={};return x;},
 'R&D->Safe':()=>{const x=L.cached('RnD',{c3:true});x.hold={in_LV_C1_FBK:true};x.step(GREEN);x.until(()=>!x.get('out_LV_C1'),1000,'R&D->Safe accepted (C1 OFF command)');x.step(OFF,30);
  assert.ok(!x.get('b_Step1'),'precondition: Safe not reached (C1_FBK pinned ON 30 ms)');x.hold={};return x;},
 StartingRun:()=>{const x=L.cached('RnD',{c3:true});x.step({in_HV_Faulty_FBK:true});x.step(BOTH,1100);x.step(OFF,50);
  assert.ok((x.get('out_HV_C2')||x.get('STO_DR1'))&&!x.statusSet().includes('STS_RUN'),'precondition: StartingRun (accepted, Run not confirmed; HV Faulty holds it)');return x;},
 'Run-down SS1 (g+500)':()=>{const x=L.cached('Run',{c3:true});x.step(GREEN,500);return x;},
 'Run-down coast (g+3000)':()=>{const x=L.cached('Run',{c3:true});x.step(GREEN,600);x.step(OFF,2400);return x;},
 'Run-down discharge (g+7500)':()=>{const x=L.cached('Run',{c3:true});x.step(GREEN,600);x.step(OFF,6900);return x;},
 'Safe, cover open (NC1 FALSE)':()=>{const x=L.cached('Safe');x.step({in_InterLock_NC_1:false},500);return x;},
 'Safe, cover open (NC2 FALSE)':()=>{const x=L.cached('Safe');x.step({in_InterLock_NC_2:false},500);return x;}};
const baseMemo=new Map();
function base(ph){if(!baseMemo.has(ph)){try{baseMemo.set(ph,{x:PH[ph]()});}catch(e){baseMemo.set(ph,{error:e});}}const b=baseMemo.get(ph);if(b.error)throw b.error;return b.x.fork();}
// drive from the current scan to `end`: sched(n) -> inputs for scan n; bp(n) -> Bypass value for scan n.
function drive(x,end,sched,bp=()=>false){while(x.t<end){const n=x.t+1;x.step({...sched(n),[BP]:bp(n)});}return x;}
// ---- Emergency traces (B43) ----
function emgSched(e,{esHeld=false}={}){return n=>{const o={};if(n===e)Object.assign(o,{in_ES_NC_1:false},OFF);if(n===e+100&&!esHeld)o.in_ES_NC_1=true;
 if(n===e+120)Object.assign(o,GREEN);if(n===e+220)Object.assign(o,OFF);return o;};}
const refMemo=new Map();
function emgRef(ph,esHeld=false){const id=ph+esHeld;if(!refMemo.has(id)){try{const x=base(ph);const pre=x.snap();const e=x.t+1;drive(x,e+18000,emgSched(e,{esHeld}));
  const seg=x.log.filter(s=>s.t>=e);const lastOn=[...seg].reverse().find(s=>s.out.out_LV_C1||s.out.out_HV_C2);const chainEnd=lastOn?lastOn.t+1:e;
  const c2off=L.firstAt(seg,s=>!s.out.out_HV_C2),c1off=L.firstAt(seg,s=>!s.out.out_LV_C1);  const bnd=pre&&pre.out.out_HV_C2?c2off:pre&&pre.out.out_LV_C1?c1off:null;
  refMemo.set(id,{x,e,chainEnd,bnd});}catch(err){refMemo.set(id,{error:err});}}const r=refMemo.get(id);if(r.error)throw r.error;return r;}
function judgeEmg(c,X,R,from,end,label=''){const seg=X.log.filter(s=>s.t>=from&&s.t<=end),rs=new Map(R.log.map(s=>[s.t,s]));
 const d=seg.flatMap(s=>{const r=rs.get(s.t);if(!r)return [];const k=DIFF.filter(k=>s.out[k]!==r.out[k]);if(s.statuses.join()!==r.statuses.join())k.push('status');return k.length?[`t=${s.t} ${k.join(',')}`]:[];});
 c(d.length===0,`${label}Bypass ignored outside steady Safe (Q-RC-05(a), V14-Q16, B51-01): outputs and status equal scan by scan to the trace without Bypass; first differences ${d.slice(0,3)}`);
 const ne=seg.filter(s=>!L.isEmg(s));c(ne.length===0,`${label}status Emergency in every scan from the Bypass until the final Restart (early Restart refused - energy still on; EMG6-01 no delayed exit); first non-Emergency t=${ne[0]?.t} [${ne[0]?.statuses}]`);
 const en=seg.filter(s=>L.isEmg(s)&&(s.out.out_LV_C1||s.out.out_HV_C2)&&!(rs.get(s.t)?.out.out_LV_C1||rs.get(s.t)?.out.out_HV_C2));c(en.length===0,`${label}B43-01: no scan with C1/C2 TRUE at status Emergency beyond the running chain; first t=${en[0]?.t}`);
 const rise=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid'].flatMap(k=>L.rises(seg,k).map(v=>k+'@'+v));c(rise.length===0,`${label}EMGREF(2): no energy increase / STO release / Unlock: ${rise.slice(0,4)}`);}
function afterChain(c,X,from,end,label=''){const seg=X.log.filter(s=>s.t>=from&&s.t<=end);
 const bad=seg.filter(s=>ENERGY.some(k=>s.out[k])||s.out.STO_DR1||s.out.STO_DR2||s.out.out_Door_Unlock_Solonoeid||s.stages.some(v=>UPSTAGE.includes(v))||s.statuses.some(v=>['STS_SAFE','STS_RND','STS_RUN','STS_CFG'].includes(v)));
 c(bad.length===0,`${label}after the chain end: status Emergency, C1=C2=C3=BMS FALSE, STO active, Unlock FALSE, no Safe/R&D/Run/Config in every scan; first t=${bad[0]?.t} ${bad[0]?JSON.stringify({st:bad[0].statuses,C1:bad[0].out.out_LV_C1,C2:bad[0].out.out_HV_C2,STO:bad[0].out.STO_DR1}):''}`);}
function sfNone(c,X,from){if(X.sf){const b=X.log.find(s=>s.t>=from&&s.out[X.sf]);c(!b,`no fault - Bypass ignored without an error (Q-RC-05(a)); SafetyFault TRUE at t=${b?.t}`);}else c.nv('no fault (Q-RC-05(a)) - no SafetyFault symbol (A8)');}
const B_PTS=[['C2 OFF-1',R=>R.bnd-1],['C2 OFF',R=>R.bnd],['C2 OFF+1',R=>R.bnd+1],['e+12000 (chain complete)',R=>R.e+12000]];
// Safe is not a B43-01 phase: there the early Restart (energy already removed) is a valid EMG6-01 exit.
for(const ph of ['Run','R&D','Safe->R&D']){const tag=ph==='Run'?'':' (e)';
 const pts=B_PTS;
 for(const [bn,bOf] of pts)for(const [vn,len] of [['(a) 300 ms',300],['(a) held 5000 ms',5000],['(b) 1 scan',1]])
  test(L.T(`E2b B43-01${tag} Emergency from ${ph} (in_ES_NC_1 100 ms, early Restart), Bypass ${vn} at b=${bn} -> no energy at status Emergency, ignored (EMG-011, EMGREF(2), V14-Q16, Q-RC-05(a))`),t=>{
   const R=emgRef(ph);const b=bOf(R);if(!bn.startsWith("e+"))assert.ok(R.bnd!=null&&Number.isFinite(b),`precondition: boundary ${bn} determinable - energy ON at e-1 in ${ph} and removed by the chain in the trace without Bypass (bnd=${R.bnd}; a chain that never removes it is judged by the EMGREF tests)`);
   const X=drive(base(ph),R.e+18000,emgSched(R.e),n=>n>=b&&n<b+len);const c=L.checks();
   judgeEmg(c,X,R.x,b,R.e+18000);afterChain(c,X,Math.max(b,R.chainEnd),R.e+18000);sfNone(c,X,b);c.finish(t,`violated checks (e=${R.e}, b=${b}, chain end ${R.chainEnd})`);});
 test(L.T(`E2b B43-01${tag} (c) Bypass TRUE 500 ms before the Emergency in ${ph} and held -> no energy increase, ignored, no energy after the chain end`),t=>{
  // own pair of traces: Bypass from b0 = base+1, event at e2 = b0+500 (reference: same without Bypass)
  const x=base(ph);const b0=x.t+1,e2=b0+500,end=e2+18000;const R=drive(base(ph),end,emgSched(e2)),X=drive(x,end,emgSched(e2),()=>true);const c=L.checks();
  const rs=new Map(R.log.map(s=>[s.t,s]));const pd=X.log.filter(s=>s.t<e2&&DIFF.some(k=>s.out[k]!==rs.get(s.t).out[k]));
  c(pd.length===0,`B51-01 (V14-Q16, Q-RC-05(a)): Bypass in ${ph} before the event inert (outputs equal to the trace without Bypass in [e-500, e-1]); first t=${pd[0]?.t}`);
  const last=[...R.log].reverse().find(s=>s.out.out_LV_C1||s.out.out_HV_C2);const ce=last?last.t+1:e2;
  judgeEmg(c,X,R,e2,end);afterChain(c,X,ce,end);sfNone(c,X,b0);c.finish(t,`violated checks (e=${e2}, chain end ${ce})`);});
 test(L.T(`E2b B43-01${tag} (d) Emergency from ${ph}, in_ES_NC_1 kept FALSE (EOk FALSE), Bypass 300 ms at e+12000 -> no energy, ignored`),t=>{
  const R=emgRef(ph,true);const b=R.e+12000;const X=drive(base(ph),R.e+18000,emgSched(R.e,{esHeld:true}),n=>n>=b&&n<b+300);const c=L.checks();
  judgeEmg(c,X,R.x,b,R.e+18000);afterChain(c,X,b,R.e+18000);sfNone(c,X,b);c.finish(t);});}
// ---- B43-02: Restart exit with Bypass ----
function exitCheck(c,X,g,end,label=''){const seg=X.log.filter(s=>s.t>=g&&s.t<=end);
 let tr=0,flick=0;for(let i=1;i<seg.length;i++){if(L.isEmg(seg[i-1])&&isSafe(seg[i]))tr++;if(isSafe(seg[i-1])&&!isSafe(seg[i]))flick++;}
 c(tr===1&&flick===0,`${label}exactly one EMG->SAFE transition and no SAFE->EMG->SAFE flicker (EMG6-01): EMG->SAFE ${tr}, SAFE->other ${flick}`);
 const se=seg.filter(s=>(isSafe(s)||L.isEmg(s))&&(s.out.out_LV_C1||s.out.out_HV_C2));c(se.length===0,`${label}SAFE-NOENERGY / B43-02: no SAFE or EMG scan with C1 or C2 TRUE (SPEC §2); first t=${se[0]?.t} [${se[0]?.statuses}]`);
 const fb=seg.filter(s=>isSafe(s)&&(s.c1fbk||s.c2fbk||s.out.STO_DR1||s.out.STO_DR2));c(fb.length===0,`${label}in every SAFE scan C1_FBK = C2_FBK = FALSE and STO active; first t=${fb[0]?.t}`);
 const up=seg.filter(s=>s.stages.some(v=>UPSTAGE.includes(v))||s.statuses.some(v=>['STS_RND','STS_RUN','STS_CFG'].includes(v)));c(up.length===0,`${label}no R&D/Run/Safe->R&D/Config after the exit (held Bypass not executed, Config only on a new front in steady Safe - E4); first t=${up[0]?.t}`);
 const en=seg.filter(s=>ENERGY.some(k=>s.out[k]));c(en.length===0,`${label}no energy until the end of observation (held Bypass never executed later, Q-RC-05(a)); first t=${en[0]?.t}`);}
for(const ph of ['Run','R&D','Safe->R&D']){const tag=ph==='Run'?'':' ('+ph+')';
 for(const dl of [-100,-1,0,1,2,'held'])test(L.T(`E2b B43-02${tag} Restart exit (green 100 ms at g = e+12000) with Bypass ${dl==='held'?'TRUE before the press and held through the exit':`rising at g_r${dl>=0?'+':''}${dl}, 300 ms`} -> one EMG->SAFE, no SAFE/EMG scan with energy, no R&D/Run/Config`),t=>{
  const R=emgRef(ph);const g=R.e+12000,gr=g+100,end=g+6000;
  const bp=dl==='held'?n=>n>=g-500:n=>n>=gr+dl&&n<gr+dl+300;
  const X=drive(base(ph),end,n=>{const o=emgSched(R.e)(n);if(n===g)Object.assign(o,GREEN);if(n===gr)Object.assign(o,OFF);return o;},bp);const c=L.checks();
  // G1 v9.2 (G3 §2.2, B43-02 x18): chainEnd = first scan with C1 and C2 commands OFF; the plant (A2) follows the command with a 1-scan delay, so the
  // FBK is OFF from chainEnd+1 - the precondition window starts there (was chainEnd: a stand off-by-one, not a requirement).
  c(X.log.filter(s=>s.t>=R.chainEnd+1&&s.t<g).every(s=>L.isEmg(s)&&!s.c1fbk&&!s.c2fbk),'stand precondition: chain complete, Emergency, FBK OFF before the Restart press');
  exitCheck(c,X,g,end);sfNone(c,X,g);c.finish(t,`violated checks (e=${R.e}, g=${g}, g_r=${gr})`);});}
// ---- B43-01 (f) / B43-02 after group start (BOOT-C) ----
function bootDrive(end,bp,restartAt=null){const x=L.create();while(x.t<end){const n=x.t+1;const o={[BP]:bp(n)};if(restartAt!=null){if(n===restartAt)Object.assign(o,GREEN);if(n===restartAt+100)Object.assign(o,OFF);}x.step(o);}return x;}
for(const [vn,bp] of [['(a) 300 ms at 300',n=>n>=300&&n<600],['(a) held 5000 ms from 300',n=>n>=300&&n<5300],['(b) 1 scan at 300',n=>n===300],['(c) TRUE from the first scan, held',()=>true]])
 test(L.T(`E2b B43-01 (f) group start, no Restart, Bypass ${vn} -> status Emergency, no energy, STO active, Unlock FALSE in every scan (BOOT-C, Q-RC-10, EMG-011)`),t=>{
  const X=bootDrive(6000,bp);const c=L.checks();afterChain(c,X,1,6000,'boot: ');sfNone(c,X,1);c.finish(t);});
for(const [vn,bp] of [['rising at g_r+0, 300 ms',n=>n>=1100&&n<1400],['TRUE from the first scan, held through the exit',()=>true]])
 test(L.T(`E2b B43-02 (BOOT-C) first Restart (green at 1000) with Bypass ${vn} -> one EMG->SAFE, no energy, no R&D/Run/Config`),t=>{
  const X=bootDrive(7000,bp,1000);const c=L.checks();c(X.log.filter(s=>s.t<1000).every(L.isEmg),'boot: Emergency before the first Restart');exitCheck(c,X,1000,7000,'boot: ');c.finish(t);});
// ---- B51-01: Bypass outside Safe inert ----
for(const ph of ['R&D','StartingRun','Run','Run-down SS1 (g+500)','Run-down coast (g+3000)','Run-down discharge (g+7500)','Safe->R&D','R&D->Safe','Safe, cover open (NC1 FALSE)','Safe, cover open (NC2 FALSE)'])
 for(const [vn,len] of [['300 ms',300],['1 scan',1],['held 5000 ms',5000]])
  test(L.T(`E2b B51-01 ${ph}: Bypass ${vn} -> inert: C1/C2/STO/Discharge/Unlock and status equal scan by scan to the trace without Bypass, no fault (V14-Q16, Q-RC-05(a))`),t=>{
   const x0=base(ph);const b=x0.t+1,end=b+6000;const keep=x0.inputs;const sched=()=>({});
   const R=drive(x0.fork(),end,sched),X=drive(x0,end,sched,n=>n>=b&&n<b+len);const c=L.checks();
   const rs=new Map(R.log.map(s=>[s.t,s]));const d=X.log.filter(s=>s.t>=b).flatMap(s=>{const r=rs.get(s.t);const k=DIFF.filter(k=>s.out[k]!==r.out[k]);if(s.statuses.join()!==r.statuses.join())k.push('status');return k.length?[`+${s.t-b} ${k.join(',')}`]:[];});
   c(d.length===0,`Bypass in ${ph} inert (B51-01): first differences ${d.slice(0,3)}`);
   const se=X.log.filter(s=>s.t>=b&&isSafe(s)&&(s.out.out_LV_C1||s.out.out_HV_C2));c(se.length===0,`SAFE-NOENERGY: no Safe scan with C1/C2 TRUE; first t=${se[0]?.t}`);
   sfNone(c,X,b);c.finish(t,`violated checks (b=${b}; inputs ${JSON.stringify(Object.fromEntries(Object.entries(keep).filter(([k,v])=>v!==L.RAW0[k])))})`);});
// ---- SAFE-NOENERGY: steady Safe + Bypass ----
for(const [vn,len] of [['300 ms',300],['1 scan',1],['held 5000 ms',5000]])
 test(L.T(`E2b SAFE-NOENERGY steady Safe, cover closed, Bypass ${vn} -> in every scan with status Safe out_LV_C1 = out_HV_C2 = FALSE (SPEC §2, MOD-006; Config is E4)`),t=>{
  const x=base('Safe');const b=x.t+1;drive(x,b+6000,()=>({}),n=>n>=b&&n<b+len);const c=L.checks();
  const se=x.log.filter(s=>s.t>=b&&isSafe(s)&&(s.out.out_LV_C1||s.out.out_HV_C2));c(se.length===0,`no Safe scan with C1/C2 TRUE; first t=${se[0]?.t} (+${se[0]?se[0].t-b:'-'})`);
  t.diagnostic(`observation: statuses after the Bypass ${[...new Set(x.log.filter(s=>s.t>=b).map(s=>s.statuses.join('+')))]}`);c.finish(t);});
