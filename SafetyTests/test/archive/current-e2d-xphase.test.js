// E2 G1 v9.1 (v2-tester) — XPH-01: a BOTH gesture started in the Safe->R&D phase is not executed (READY; analyst E2-G1-v9-q/CRITERIA.md §2;
// MOD-004 / SPEC §15 "Любой Transition: новая команда вверх не принимается", SOFTWARE_ACCEPTANCE_SCOPE MOD-004 / Q-RC-08 "А" "без отложенного
// исполнения", BTN-001/002/007, BTN-006, MOD-001/002; analogies V14-Q11, V14-Q13, D-TEAM p.1/p.2, TD-07).
// Initial: steady Safe, buttons released >= 2000 ms, cover closed, permits present. Phase started by legacy (1,0) (held) or by BOTH (variant:
// the phase is kept open by in_LV_Faulty_FBK TRUE from A1+1 so that a >= 2000 ms clearing fits before f; WDG-02 30 s). A1 = first b_Step12 or
// C1 ON; R = first main-state R&D scan of the no-gesture trace X0. Gesture: first button at f, second at f+delta, delta in {0, 250}, both orders,
// held 1100 ms from the second, then released.
// Expected for f in {A1+10, A1+300, R-1}: no recRndC_SU, no C2 ON, no STO release, no Run until R+6000 (and later); Safe->R&D completes as in X0
// (R&D in the same scan); no Emergency/SafetyFault. f = R - DIAG observation. f = R+1 after a clean 2000 ms - ordinary gesture (lift in [Q, Q+400],
// TD-06). Repeat after the ignored gesture (release g): new BOTH at g+1999 ignored, at g+2001 accepted. Variants: second button after R; hold
// through R for >= 3000 ms. Emergency combinations: in_Estop_PLC during the phase with BOTH held -> Emergency, Restart -> only Safe, gesture
// not executed; cover lost in the phase -> Safe->R&D continues, after R no R&D->Run until the cover closes and a new gesture.
// Assumptions A1..A9 helpers/e2-lifecycle.js; recRndC_SU part only if the Symbol exists (absence -> diagnostic; outputs still judged).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,BLUE,GREEN,OFF}=L;
const P10={inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:false};
const rnd=s=>s.statuses.length===1&&s.statuses[0]==='STS_RND';
const runLike=s=>s.statuses.includes('STS_RUN')||s.stages.includes('b_Step3');
function rec(x){const m=new Map();if(L.hasName('recRndC_SU'))x.listeners.push((s,y)=>{m.set(s.t,!!y.r.get('recRndC_SU'));});return m;}
const lift=(s,su)=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2||su.get(s.t)||runLike(s);
// how: 'legacy' - (1,0) set at t1 and held; 'BOTH' - BOTH at t1 1100 ms, released, LV Faulty TRUE from A1+1 until fOff (keeps the phase open).
// btn(n) -> button inputs for scan n; extra(n) -> other inputs. Returns the trace and its phase points.
function phase(how,{btn=()=>null,extra=()=>null,len=12000,faultyUntil=null}={}){const x=L.cached('Safe');x.step(OFF,2100);const su=rec(x);const t1=x.t+1;let A1=null;
 for(let n=t1;n<=t1+len;n++){const o={};if(how==='legacy'&&n===t1)Object.assign(o,P10);if(how==='BOTH'){if(n===t1)Object.assign(o,BOTH);if(n===t1+1100)Object.assign(o,OFF);}
  if(how==='BOTH'&&A1!=null&&n===A1+1)o.in_LV_Faulty_FBK=true;if(how==='BOTH'&&faultyUntil!=null&&n===faultyUntil)o.in_LV_Faulty_FBK=false;
  const b=btn(n);if(b)Object.assign(o,b);const e=extra(n);if(e)Object.assign(o,e);x.step(o);if(A1==null&&(x.get('b_Step12')||x.get('out_LV_C1')))A1=x.t;}
 const log=x.log.filter(s=>s.t>=t1);return {x,su,t1,A1,R:L.firstAt(log,rnd),log};}
const X0={};function ref(how,fu=null){const k=how+'|'+fu;if(!X0[k]){try{const r=phase(how,{faultyUntil:fu});if(r.A1==null||r.R==null)throw Error(`precondition: Safe->R&D by ${how} accepted and confirmed in X0 (A1=${r.A1}, R=${r.R})`);X0[k]=r;}catch(e){X0[k]={error:e};}}
 if(X0[k].error)throw X0[k].error;return X0[k];}
// BOTH gesture: first button at f (order), second at f+d, both held until f+d+1100, then released.
const gesture=(f,d,order)=>n=>n<f?null:n<f+d?(order==='blue'?BLUE:GREEN):n<f+d+1100?BOTH:n===f+d+1100?OFF:null;
function noLift(c,r,from,to,label){const l=r.x.log.find(s=>s.t>=from&&s.t<=to&&lift(s,r.su));c(!l,`${label}: no recRndC_SU / C2 ON / STO release / Run in any scan [${from}, ${to}] (MOD-004, Q-RC-08); first t=${l?.t}`);}
const noEmg=(c,r,from)=>{const e=r.x.log.find(s=>s.t>=from&&L.isEmg(s));c(!e,`no Emergency; first t=${e?.t}`);if(r.x.sf){const f=r.x.log.find(s=>s.t>=from&&s.out[r.x.sf]);c(!f,'no SafetyFault');}};
const sfNV=(c,r)=>{if(!r.x.sf)c.nv('no SafetyFault from the gesture - no SafetyFault symbol (A8)');};
for(const how of ['legacy'])for(const [fn,fOf] of [['A1+10',q=>q.A1+10],['A1+300',q=>q.A1+300],['R-1',q=>q.R-1]])for(const d of [0,250])for(const order of ['blue','green'])
 test(L.T(`E2d XPH-01 Safe->R&D by legacy (1,0), BOTH started in the phase at f=${fn} (${order} first, delta ${d}) -> not executed now or later: no SU / C2 / STO release / Run until R+6000; R&D in the same scan as without the gesture; no Emergency/SafetyFault (MOD-004, Q-RC-08)`),t=>{
  const q=ref(how);if(!L.hasName('recRndC_SU'))t.diagnostic('recRndC_SU absent in the source - judged through the outputs');const f=fOf(q);const r=phase(how,{btn:gesture(f,d,order)});const c=L.checks();
  noLift(c,r,f,q.R+6000,'gesture started in the phase');c(r.R===q.R,`Safe->R&D completes as without the gesture: R&D at ${r.R} (X0 ${q.R})`);noEmg(c,r,r.t1);sfNV(c,r);c.finish(t,`violated checks (A1=${q.A1}, R=${q.R}, f=${f})`);});
test(L.T('DIAG observation E2d XPH-01 Safe->R&D by legacy (1,0), BOTH first press exactly at R (convention q)'),t=>{let q;try{q=ref('legacy');}catch(e){t.diagnostic('unavailable: '+e.message);return;}
 const r=phase('legacy',{btn:gesture(q.R,0,'blue')});const l=L.firstAt(r.x.log.filter(s=>s.t>=q.R),s=>lift(s,r.su));t.diagnostic(`f=R=${q.R}: first lift ${l==null?'never':'R+'+(l-q.R)} (if executed, only after full qualification >= R+1000)`);});
test(L.T('E2d XPH-01 Safe->R&D by legacy (1,0), buttons released >= 2000 ms, BOTH at f=R+1 -> ordinary gesture: no lift in [f, Q-1], first lift in [Q, Q+400] (BTN-006, MOD-002, TD-06)'),t=>{
 const q=ref('legacy');const f=q.R+1;const r=phase('legacy',{btn:gesture(f,0,'blue')});const c=L.checks();const l=L.firstAt(r.x.log.filter(s=>s.t>=f),s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);
 c(l!=null&&l>=f+1000&&l<=f+1400,`first lift in [Q, Q+400]; f+${l==null?'never':l-f}`);c.finish(t,`violated checks (R=${q.R})`);});
for(const [gap,acc] of [[1999,false],[2001,true]])test(L.T(`E2d XPH-01 repeat: BOTH started in the phase at A1+10 (ignored), released at g; new BOTH at g+${gap} -> ${acc?'accepted (first lift in [Q2, Q2+400])':'ignored (no lift until +3000)'} (BTN-001; g+2000 observation)`),t=>{
 const q=ref('legacy');const f=q.A1+10,g=f+1100,f2=g+gap;const g1=gesture(f,0,'blue'),g2=gesture(f2,0,'blue');const r=phase('legacy',{btn:n=>g1(n)??g2(n)});const c=L.checks();
 noLift(c,r,f,f2-1,'first gesture');const l=L.firstAt(r.x.log.filter(s=>s.t>=f2),s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);
 if(acc)c(l!=null&&l>=f2+1000&&l<=f2+1400,`new gesture accepted: first lift f2+${l==null?'never':l-f2}`);else c(l==null||l>f2+3000,`new gesture at g+1999 ignored: no lift until f2+3000; first f2+${l==null?'never':l-f2}`);c.finish(t,`violated checks (g=${g}, f2=${f2})`);});
for(const order of ['blue','green'])test(L.T(`E2d XPH-01 variant: first button (${order}) in the phase at R-100, second at R+50 (delta 150, after R) -> attempt started in the phase: not executed until R+6000 (MOD-004)`),t=>{
 const q=ref('legacy');const f=q.R-100;const r=phase('legacy',{btn:gesture(f,150,order)});const c=L.checks();noLift(c,r,f,q.R+6000,'second button after R');noEmg(c,r,r.t1);sfNV(c,r);c.finish(t,`violated checks (R=${q.R})`);});
test(L.T('E2d XPH-01 variant: BOTH started in the phase at A1+10 and held through R for >= 3000 ms -> no lift until R+6000 (MOD-004, BTN-002)'),t=>{
 const q=ref('legacy');const f=q.A1+10;const r=phase('legacy',{btn:n=>n<f?null:n<q.R+3000?BOTH:n===q.R+3000?OFF:null});const c=L.checks();noLift(c,r,f,q.R+6000,'held through R');noEmg(c,r,r.t1);sfNV(c,r);c.finish(t);});
// Phase started by BOTH: kept open by LV Faulty TRUE from A1+1 (WDG-02 waiting up to 30 s), clearing 2100 ms after the release, gesture in the phase.
for(const d of [0,250])test(L.T(`E2d XPH-01 Safe->R&D started by BOTH (phase kept open by in_LV_Faulty_FBK TRUE from A1+1, WDG-02), clearing 2100 ms, new BOTH in the phase (delta ${d}) -> not executed; LV Faulty FALSE later -> R&D, still no lift until R+6000`),t=>{
 const fu0=null;const x0=L.cached('Safe');x0.step(OFF,2100);const t1=x0.t+1;const f=t1+1100+2100,fu=f+1100+d+1000;const q=ref('BOTH',fu);const c=L.checks();
 const inPhase=q.log.find(s=>s.t===f);c(inPhase&&inPhase.out.out_LV_C1&&!rnd(inPhase),`stand precondition: still in Safe->R&D at f (C1 ON, not R&D; WDG-02 holds the phase); ${JSON.stringify({C1:inPhase?.out.out_LV_C1,st:inPhase?.statuses})}`);
 const r=phase('BOTH',{btn:gesture(f,d,'blue'),faultyUntil:fu});noLift(c,r,f,(r.R??fu)+6000,'gesture started in the BOTH-started phase');c(r.R===q.R,`R&D as without the gesture: ${r.R} (X0 ${q.R})`);noEmg(c,r,r.t1);sfNV(c,r);c.finish(t,`violated checks (A1=${q.A1}, f=${f}, R=${q.R})`);});
// Emergency combinations
test(L.T('E2d XPH-01 emergency combination: BOTH started in the phase at A1+10 and held, in_Estop_PLC TRUE at A1+200 -> Emergency (EMGREF-LV, Q-ARCH-01); cause removed, Restart -> only Safe; the gesture is never executed'),t=>{
 const q=ref('legacy');const f=q.A1+10,e=q.A1+200;const r=phase('legacy',{btn:n=>n<f?null:n<e+3000?BOTH:n===e+3000?OFF:null,extra:n=>n===e?{in_Estop_PLC:true}:n===e+12000?{in_Estop_PLC:false,inPLC_RnD_Mode:false}:null,len:e+12100-q.t1});// cause held 12 s (emergency chain completes, as in the EMG tests)
 const c=L.checks();const em=r.x.log.find(s=>s.t>=e&&L.isEmg(s));c(!!em,'Emergency after in_Estop_PLC');noLift(c,r,f,r.x.t,'gesture with Emergency');r.x.step(OFF,100);L.restartToSafe(r.x,c,'');
 const l=r.x.log.filter(s=>s.t>=e).find(s=>lift(s,r.su));c(!l,'gesture never executed after the Restart');c.finish(t,`violated checks (e=${e})`);});
test(L.T('E2d XPH-01 emergency combination: cover NC1 FALSE in the phase (A1+50) with BOTH started at A1+10 held -> Safe->R&D continues (Q-RC-03(b1)); after R no R&D->Run while the cover is open; cover closed, new BOTH after >= 2001 ms -> accepted'),t=>{
 const q=ref('legacy');const f=q.A1+10,cc=q.A1+50,close=q.R+3000,f2=close+2001;const g1=gesture(f,0,'blue'),g2=gesture(f2,0,'blue');
 const r=phase('legacy',{btn:n=>g1(n)??g2(n),extra:n=>n===cc?{in_InterLock_NC_1:false}:n===close?{in_InterLock_NC_1:true}:null,len:f2+3000-q.t1});const c=L.checks();
 c(r.R!=null,`Safe->R&D continues with the cover open (R&D at ${r.R})`);noLift(c,r,f,f2-1,'cover open, gesture from the phase');
 const l=L.firstAt(r.x.log.filter(s=>s.t>=f2),s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);c(l!=null&&l>=f2+1000&&l<=f2+1400,`new gesture after closure accepted; first f2+${l==null?'never':l-f2}`);c.finish(t,`violated checks (R=${r.R})`);});
