// E2 G1 v6 (v2-tester) — FBK-10 acknowledgement (MOD-008, WDG-004): K3-ACK additions, k4, FBK-10 boundaries (review G1 v5 N3, N8).
// G1 v7 (review G1 v6 N10, N14): lift moment by TEAM-DEFAULT TD-06 (SCENARIO_DECISIONS c26025c3…; analyst E2-G1-v6-q f86f8ed5… §1) in
// every liftIn call; FBK10-K4 g-1: SafetyFault TRUE [f+1, p2-1] / FALSE from [p2, p2+1] (E2-G1-v6-q §2, READY-D; NV until A8).
// Oracle (no expectation taken from the implementation):
//  - program/analyst/E2-G1-v5-k3/CRITERIA.md 502113e8…7d34 (K3-ACK, READY): the first BOTH after FBK OFF without an earlier
//    acknowledgement ONLY acknowledges (attempt consumed, no lift in any scan of that gesture, incl. a long hold); a new gesture
//    after both buttons released continuously >= 2001 ms from r lifts (C1 ON (S) / C2 ON or STO release (R)); G1 v7: moment by
//    TEAM-DEFAULT TD-06 (no lift in [p2, Q2-1], first lift <= Q2+400, exact scan diagnostic) - the window [Q2, Q2+1] is cancelled;
//    r+1999 refused (no lift, no fault), r+2000 observation; p in {g, g+1, g+2100}; blue-first / green-first, delta 0 / 250;
//    (R) green-first is a BOTH attempt, not a descent; SafetyFault TRUE [f+1, p-1], FALSE from [p, p+1] (NV until the symbol, A8);
//    PLC front without acknowledgement not executed, a NEW PLC front after the acknowledgement executed; EStop in [f, Q2] ->
//    Emergency by the EStop cause.
//  - SCENARIO_DECISIONS.md 71ad3f94…73d2: Q-V7-04 "Б" (k4: a press while FBK is still ON is NOT an acknowledgement, the attempt is
//    consumed; after FBK OFF a NEW acknowledgement is required), Q-V4-02 "В", E6-Q2 "А", п.13 (acknowledgement at the press scan).
//  - CRITERIA_DELTA_v7.md 378a9f93…8459 §4.5: boundary "FBK ON in f together with a qualified BOTH: lift in f observation, in f+1
//    and later FAIL"; FBK-10 + EStop -> Emergency, Restart requires FBK OFF (SPEC §12); FBK-10 + LV loss in R&D -> HLT-01 not
//    blocked.
// Notation (K3-ACK §2): f first FBK TRUE scan, g first FBK FALSE scan (g = f+3000; 1-scan variant g = f+1), p first press of
// BOTH-1, delta delay of the second button, Q1 = p+delta+1000, r first scan with both released, p2 / Q2 for BOTH-2 (delta 0).
// BOTH-1 is held until Q1+100 (long variant Q1+4000); BOTH-2 1100 ms.
// "Lift" = command output: (S1/S2) out_LV_C1 TRUE; (R) out_HV_C2 TRUE or STO_DR1/2 released (A2 plant, as current-e2d-fbk-unsolicited).
// Assumptions: A1..A9 helpers/e2-lifecycle.js. PLC commands CMD_SAFE_TO_R&D / CMD_R&D_TO_RUN do not exist on canonical F1 (E4,
// full revision): looked up as E2_CMD_SAFE_TO_RND_SYMBOL / E2_CMD_RND_TO_RUN_SYMBOL or by name; absent -> NOT VERIFIED (t.todo),
// never PASS. Such a symbol is driven by the test directly (declared PLC input injection, not a raw RAW0 input).
// The emergency moments of the EStop variants are judged by rule L elsewhere (E2a emg tests); here: Emergency reached and
// latched, no lift, no energy increase (EMGREF (1)(2)).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,BLUE,GREEN,OFF}=L;
const KEEP=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_SS1_DR1','out_SS1_DR2','out_LV_Discharge_Request','out_HV_Discharge_Request','out_C3_BatRelay','out_RBM_Bat'];
const emg=s=>!s.out.b_EStop_Ok||s.statuses.includes('STS_EMG');
const CASES={S1:{label:'steady Safe, C1_FBK',base:'Safe',fbk:'in_LV_C1_FBK'},S2:{label:'steady Safe, C2_FBK',base:'Safe',fbk:'in_HV_C2_FBK'},R:{label:'steady R&D, C2_FBK',base:'RnD',fbk:'in_HV_C2_FBK'}};
const lifted=(cs,s)=>cs.base==='Safe'?s.out.out_LV_C1:(s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);
const firstLift=(x,cs,from,to=Infinity)=>x.log.find(s=>s.t>=from&&s.t<=to&&lifted(cs,s))?.t;
function start(cs){const x=L.cached(cs.base);x.step(OFF,2100);const pre=x.snap();
 assert.ok(!pre.out.out_HV_C2&&!pre.c2fbk&&(cs.base==='RnD'?pre.out.out_LV_C1:!pre.out.out_LV_C1&&!pre.c1fbk),`precondition: ${cs.label} with the command OFF and its FBK OFF`);
 return {x,pre,f:x.t+1};}
// FBK episode [f, g-1]; returns g.
function episode(x,cs,len=3000){x.hold={[cs.fbk]:true};x.step({},len);x.hold={};return x.t+1;}
function steady(c,x,pre,from,to,label=''){const seg=x.log.filter(s=>s.t>=from&&s.t<=to);
 const e=seg.find(emg);c(!e,`${label}no Emergency/latch (Q-V4-02 "В": FBK-10 / acknowledgement are not an emergency); first t=${e?.t}`);
 const st=seg.find(s=>s.stages.join()!==pre.stages.join()||s.statuses.join()!==pre.statuses.join());c(!st,`${label}state unchanged (${pre.stages}/${pre.statuses}) - no transition, no descent; first change t=${st?.t} ${st?.stages}/${st?.statuses}`);
 const en=seg.flatMap(s=>KEEP.filter(k=>s.out[k]!==pre.out[k]).map(k=>`${k}@${s.t}`));c(en.length===0,`${label}energy / STO / SS1 / discharge outputs unchanged: ${en.slice(0,4)}`);}
// BOTH gesture: order 'blue'|'green' first for d scans (d=0: both in the same scan), both held until Q+hold, then released.
function gesture(x,{order='blue',d=0,hold=100,extra={}}={}){const p=x.t+1;if(d>0)x.step({...(order==='blue'?BLUE:GREEN),...extra},d);
 const Q=p+d+1000;x.step({...BOTH,...extra},Q+hold-x.t);const r=x.t+1;x.step(OFF);return {p,Q,r};}
const waitTo=(x,t,inp={})=>{if(x.t<t-1)x.step(inp,t-1-x.t);};// next step() lands on scan t
function sfAround(c,x,f,p,end){if(x.sf){const on=x.log.filter(s=>s.t>=f+1&&s.t<=p-1&&!s.out[x.sf]);c(on.length===0,`SafetyFault (${x.sf}) TRUE in every scan [f+1, p-1] (FBK OFF at g does not clear it); first FALSE t=${on[0]?.t}`);
  const off=x.log.filter(s=>s.t>=p+1&&s.t<=end&&s.out[x.sf]);c(off.length===0,`SafetyFault FALSE from [p, p+1] on (K3-ACK, п.13); first TRUE after p+1: t=${off[0]?.t}`);}
 else c.nv('SafetyFault TRUE [f+1, p-1] and FALSE from [p, p+1] (K3-ACK §2) - no SafetyFault symbol in the source (A8); observable checks PASSED');}
// G1 v7 (N10, review G1 v6): TEAM-DEFAULT TD-06 (SCENARIO_DECISIONS c26025c3…, analyst E2-G1-v6-q §1) replaces the window [Q2, Q2+1]
// (no source): (1) no lift in any scan [p2, Q2-1] (BTN-006, q-1) - normative; (2) "accepted" = first lift in [Q2, Q2+400] - normative;
// (3) the exact scan - diagnostic only. The observation runs to >= Q2+401 (gesture released at Q2+101, then 300 ms).
function liftIn(t,c,x,cs,p2,Q2,label){const pl=x.log.find(s=>s.t===p2-1);
 if(pl&&lifted(cs,pl)){c(false,`${label}: lift moment not evaluable - already lifted at p-1 = ${p2-1} (energy from an earlier gesture; that violation is reported by the no-lift check above)`);return;}
 const early=firstLift(x,cs,p2,Q2-1);c(early==null,`${label}: no lift in any scan [p, Q-1] = [${p2}, ${Q2-1}] (TEAM-DEFAULT TD-06 (1), BTN-006 q-1); first early lift t=${early}`);
 const l=firstLift(x,cs,p2);t.diagnostic(`TD-06 observation ${label}: first lift ${l==null?'never':'Q'+(l-Q2>=0?'+':'')+(l-Q2)}`);c(l!=null&&l<=Q2+400,`${label}: new gesture after the acknowledgement and >= 2001 ms release lifts, first lift <= Q+400 (E6-Q2 "новым жестом", K3-ACK; TEAM-DEFAULT TD-06 (2)); first lift ${l==null?'never':'Q'+(l-Q2>=0?'+':'')+(l-Q2)}; stages=${x.stageSet()}`);}
function noLift(c,x,cs,from,to,label){const l=firstLift(x,cs,from,to);c(l==null,`${label}; first lift t=${l} (from ${from})`);}
// p = g: TEAM-DEFAULT TD-04 (SCENARIO_DECISIONS «Решено командой», ждёт просмотра Вадимом; replaces K3-ACK READY-D "p = g -> k3"):
// whether the press in g is an acknowledgement is an OBSERVATION; no lift in this gesture is normative in both readings; hence the
// BOTH-2 outcome and the SafetyFault moment are observations there.
const P_POINTS=[['g+2100',g=>g+2100],['g+1',g=>g+1],['g (FBK OFF and the press in the same scan; TEAM-DEFAULT TD-04)',g=>g,true]];
for(const [id,cs] of Object.entries(CASES)){
 // ---- K3-ACK main: p points, BOTH-1 acknowledges only, BOTH-2 at r+2001 lifts ----
 for(const [pn,pOf,td04] of P_POINTS)test(L.T(`E2d FBK-10 K3-ACK (${id}) ${cs.label} f..f+2999, BOTH-1 at p=${pn} -> ${td04?'no lift in this gesture (TD-04); acknowledgement and BOTH-2 outcome observed':'acknowledgement only, no lift; BOTH-2 at r+2001 -> lift, first lift <= Q2+400 (K3-ACK, E6-Q2 "А"; TEAM-DEFAULT TD-06)'}`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();const g=episode(x,cs);waitTo(x,pOf(g));const b1=gesture(x);
  waitTo(x,b1.r+2001);const b2=gesture(x);x.step(OFF,300);
  noLift(c,x,cs,b1.p,b2.p-1,`BOTH-1 is only the acknowledgement: no lift in any scan [p, p2-1] incl. Q1, Q1+1 (Q1=${b1.Q})`);
  steady(c,x,pre,f,b2.p-1,'until BOTH-2: ');
  c(x.log.filter(s=>s.t>=b1.p&&s.t<=b1.r).every(s=>!s.out.out_Door_Unlock_Solonoeid),'Unlock FALSE during BOTH-1 (WDG-06(a)/(a\'))');
  if(td04){const l=firstLift(x,cs,b2.p);t.diagnostic(`TD-04 observation: BOTH-2 at r+2001 first lift ${l==null?'never':'Q2+'+(l-b2.Q)}; SafetyFault ${x.sf?'FALSE from '+L.firstAt(x.log.filter(s=>s.t>=b1.p),s=>!s.out[x.sf]):'no symbol (A8)'}`);
   if(x.sf){const on=x.log.filter(s=>s.t>=f+1&&s.t<=b1.p-1&&!s.out[x.sf]);c(on.length===0,`SafetyFault TRUE in every scan [f+1, p-1]; first FALSE t=${on[0]?.t}`);}else c.nv('SafetyFault TRUE [f+1, p-1] - no SafetyFault symbol (A8)');}
  else{sfAround(c,x,f,b1.p,b2.p-1);liftIn(t,c,x,cs,b2.p,b2.Q,'BOTH-2 at r+2001');}c.finish(t,`violated checks (f=${f}, g=${g}, p=${b1.p}, r=${b1.r}, p2=${b2.p})`);});
 test(L.T(`E2d FBK-10 K3-ACK (${id}) long hold: BOTH-1 at g+2100 held until Q1+4000 -> no lift in any scan of the hold; BOTH-2 at r+2001 -> lift <= Q2+400 (TEAM-DEFAULT TD-06)`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();const g=episode(x,cs);waitTo(x,g+2100);const b1=gesture(x,{hold:4000});
  waitTo(x,b1.r+2001);const b2=gesture(x);x.step(OFF,300);
  noLift(c,x,cs,b1.p,b2.p-1,'long hold of the acknowledging gesture never becomes a command (п.13 "РЕШЕНО")');steady(c,x,pre,f,b2.p-1,'until BOTH-2: ');
  sfAround(c,x,f,b1.p,b2.p-1);liftIn(t,c,x,cs,b2.p,b2.Q,'BOTH-2 at r+2001');c.finish(t);});
 for(const [order,d] of [['blue',250],['green',250]])test(L.T(`E2d FBK-10 K3-ACK (${id}) ${order}-first BOTH-1 (delta ${d} ms) at g+2100 -> acknowledgement only${cs.base==='RnD'&&order==='green'?', no R&D->Safe descent (BOTH attempt, not a qualified single green)':''}; BOTH-2 at r+2001 -> lift <= Q2+400 (TEAM-DEFAULT TD-06)`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();const g=episode(x,cs);waitTo(x,g+2100);const b1=gesture(x,{order,d});
  waitTo(x,b1.r+2001);const b2=gesture(x);x.step(OFF,300);
  noLift(c,x,cs,b1.p,b2.p-1,`${order}-first BOTH-1 is only the acknowledgement`);
  steady(c,x,pre,f,b2.p-1,cs.base==='RnD'&&order==='green'?'(R) green-first (chord, delta <= 250) - no descent: ':'until BOTH-2: ');
  sfAround(c,x,f,b1.p,b2.p-1);liftIn(t,c,x,cs,b2.p,b2.Q,'BOTH-2 at r+2001');c.finish(t);});
 // ---- pause boundary from r (BTN-001, REL-01(d), WDG-06(b)) ----
 test(L.T(`E2d FBK-10 K3-ACK (${id}) BOTH-2 at r+1999 -> refused (no lift, no fault), BOTH-3 after a new >= 2001 ms release -> lift <= Q3+400 (TEAM-DEFAULT TD-06)`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();const g=episode(x,cs);waitTo(x,g+2100);const b1=gesture(x);
  waitTo(x,b1.r+1999);const b2=gesture(x);waitTo(x,b2.r+2001);const b3=gesture(x);x.step(OFF,300);
  noLift(c,x,cs,b1.p,b3.p-1,'BOTH-1 acknowledgement and BOTH-2 at r+1999 (pause measured from r, not from p / Q1) - no lift');
  steady(c,x,pre,f,b3.p-1,'until BOTH-3: ');
  if(x.sf){const bad=x.log.find(s=>s.t>=b1.p+1&&s.t<b3.p&&s.out[x.sf]);c(!bad,`refused BOTH-2: SafetyFault stays FALSE; first TRUE t=${bad?.t}`);}
  else c.nv('refused BOTH-2: SafetyFault stays FALSE - no SafetyFault symbol (A8)');
  liftIn(t,c,x,cs,b3.p,b3.Q,'BOTH-3 after a new release >= 2001 ms');c.finish(t,`violated checks (r=${b1.r}, p2=${b2.p}, r2=${b2.r}, p3=${b3.p})`);});
 test(L.T(`DIAG observation E2d FBK-10 K3-ACK (${id}) BOTH-2 at r+2000 (K3-ACK: observation)`),t=>{
  let o;try{o=start(cs);}catch(err){t.diagnostic('unavailable (observation only): '+err.message);return;}const {x}=o;const g=episode(x,cs);waitTo(x,g+2100);const b1=gesture(x);
  waitTo(x,b1.r+2000);const b2=gesture(x);x.step(OFF,300);const l=firstLift(x,cs,b2.p);t.diagnostic(`BOTH-2 at r+2000: first lift ${l==null?'never':'Q2'+(l-b2.Q>=0?'+':'')+(l-b2.Q)}`);});
 // ---- 1-scan FBK episode, same norm ----
 test(L.T(`E2d FBK-10 K3-ACK (${id}) ${cs.label} TRUE 1 scan (f), BOTH-1 at g+2100 -> acknowledgement only; BOTH-2 at r+2001 -> lift <= Q2+400 (TEAM-DEFAULT TD-06)`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();const g=episode(x,cs,1);waitTo(x,g+2100);const b1=gesture(x);waitTo(x,b1.r+2001);const b2=gesture(x);x.step(OFF,300);
  noLift(c,x,cs,b1.p,b2.p-1,'1-scan episode: BOTH-1 only acknowledges (K3-ACK §3, v7 §4.5 "1 скан")');steady(c,x,pre,f,b2.p-1,'until BOTH-2: ');
  sfAround(c,x,f,b1.p,b2.p-1);liftIn(t,c,x,cs,b2.p,b2.Q,'BOTH-2 at r+2001');c.finish(t);});
 // ---- k4 (Q-V7-04 "Б") ----
 for(const dp of [1,3000])test(L.T(`E2d FBK10-K4 (${id}) blue 100 ms while ${cs.label} is still ON (not an acknowledgement, Q-V7-04 "Б"), FBK OFF, BOTH-1 at g+${dp} -> acknowledgement only, no lift; BOTH-2 at r+2001 -> lift <= Q2+400 (TEAM-DEFAULT TD-06)`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},500);const pa=x.t+1;x.step(BLUE,100);x.step(OFF,2400);x.hold={};const g=x.t+1;
  assert.equal(g,f+3000,'stand precondition: FBK ON exactly f..f+2999');
  waitTo(x,g+dp);const b1=gesture(x);waitTo(x,b1.r+2001);const b2=gesture(x);x.step(OFF,300);
  noLift(c,x,cs,pa,b2.p-1,'k4: the press during FBK ON is not counted - BOTH-1 after FBK OFF is the (new) acknowledgement, no lift');
  steady(c,x,pre,f,b2.p-1,'until BOTH-2: ');
  if(x.sf){const off=x.log.filter(s=>s.t>=pa+1&&s.t<=b1.p-1&&!s.out[x.sf]);c(off.length===0,`k4: press during FBK ON does not acknowledge - SafetyFault stays TRUE until BOTH-1; first FALSE t=${off[0]?.t}`);}
  else c.nv('k4: SafetyFault stays TRUE after the press during FBK ON (Q-V7-04 "Б") - no SafetyFault symbol (A8)');
  sfAround(c,x,f,b1.p,b2.p-1);liftIn(t,c,x,cs,b2.p,b2.Q,'BOTH-2 at r+2001');c.finish(t,`violated checks (press during FBK ON at ${pa}, g=${g}, p=${b1.p}, p2=${b2.p})`);});
 test(L.T(`E2d FBK10-K4 (${id}) BOTH-1 pressed at g-1 (${cs.label} still ON) held through FBK OFF -> no lift; BOTH-2 at r+2001 is the first press after FBK OFF = acknowledgement only; BOTH-3 at r2+2001 -> lift <= Q3+400 (TEAM-DEFAULT TD-06); SafetyFault TRUE [f+1, p2-1], FALSE from [p2, p2+1] (NV until the symbol)`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},2999);const p=x.t+1;x.step(BOTH);x.hold={};const g=x.t+1;
  assert.equal(g,f+3000,'stand precondition: FBK FALSE from g=f+3000, BOTH pressed at g-1');
  x.step(BOTH,p+1100-x.t);const r=x.t+1;x.step(OFF);waitTo(x,r+2001);const b2=gesture(x);waitTo(x,b2.r+2001);const b3=gesture(x);x.step(OFF,300);
  noLift(c,x,cs,p,b3.p-1,'k4: press at g-1 (cause active) not an acknowledgement and not a command; the next press (BOTH-2) after FBK OFF only acknowledges (Q-V7-04 "Б": new acknowledgement after FBK OFF; п.13: acknowledgement at the press scan)');
  steady(c,x,pre,f,b3.p-1,'until BOTH-3: ');
  // G1 v7 (N14; analyst E2-G1-v6-q §2 READY-D: Q-V7-04 "Б", E6-Q2, п.13 "сразу"): the held BOTH-1 (pressed at g-1) is not an
  // acknowledgement - SafetyFault TRUE in every scan [f+1, p2-1] (incl. [g, p+1100] and the pause [r, p2-1]); BOTH-2 (first press after g)
  // acknowledges at its press scan - FALSE from [p2, p2+1] to the end of the trace. NV until the symbol (A8).
  if(x.sf){const on=x.log.filter(s=>s.t>=f+1&&s.t<=b2.p-1&&!s.out[x.sf]);c(on.length===0,`k4 g-1: SafetyFault (${x.sf}) TRUE in every scan [f+1, p2-1] incl. [g, p+1100] while BOTH-1 is held through FBK OFF (a held press is not an acknowledgement); first FALSE t=${on[0]?.t}${on[0]&&on[0].t>=g?' (g+'+(on[0].t-g)+')':''}`);
   const off=x.log.filter(s=>s.t>=b2.p+1&&s.out[x.sf]);c(off.length===0,`k4 g-1: SafetyFault FALSE from [p2, p2+1] to the end (BOTH-2 = first press after FBK OFF acknowledges, п.13); first TRUE after p2+1: t=${off[0]?.t}`);}
  else c.nv('k4 g-1: SafetyFault TRUE [f+1, p2-1] (incl. [g, p+1100] with BOTH-1 held through FBK OFF) and FALSE from [p2, p2+1] (analyst E2-G1-v6-q §2) - no SafetyFault symbol in the source (A8); observable checks PASSED');
  liftIn(t,c,x,cs,b3.p,b3.Q,'BOTH-3 at r2+2001');c.finish(t,`violated checks (p=${p}, g=${g}, r=${r}, p2=${b2.p}, p3=${b3.p})`);});
 // G1 v8 (lead 2026-10-22: killer search for M-E2b-21, GATE_030.OrIn5 "rejected BOTH not consumed"; oracle analyst E2-G1-v6-q §2 chain 1-3:
 // Q-V7-04 "Б" - a press while the cause is active is no acknowledgement, the attempt is CONSUMED, no lift; E6-Q2 / п.13 - a held press is
 // neither an acknowledgement nor a command after FBK OFF). BOTH-1 qualified WHILE the FBK is still ON (p = g-2000, Q1 = g-1000), held through
 // FBK OFF until g+2000, then both released 2100 ms with no new press -> no lift and unchanged state in every scan [p, r+2099]. The BOTH-2 /
 // BOTH-3 chain is judged by the k4 g-1 test above (kept separate so that this test isolates the consumption of the held attempt).
 test(L.T(`E2d FBK10-K4 (${id}) BOTH-1 qualified while ${cs.label} is ON (p=g-2000, Q1=g-1000), held through FBK OFF until g+2000, released 2100 ms -> attempt consumed: no lift and no transition in any scan [p, r+2099] (Q-V7-04 "Б", E6-Q2, п.13)`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},1000);const p=x.t+1;x.step(BOTH,2000);x.hold={};const g=x.t+1;
  assert.equal(g,f+3000,'stand precondition: FBK FALSE from g=f+3000, BOTH pressed at g-2000');
  x.step(BOTH,g+2000-x.t);const r=x.t+1;x.step(OFF,2100);
  noLift(c,x,cs,p,r+2099,'BOTH-1 qualified while the cause is active is consumed: no lift during the hold through FBK OFF nor after the release');
  steady(c,x,pre,f,r+2099,'');
  if(x.sf){const on=x.log.filter(s=>s.t>=f+1&&s.t<=r+2099&&!s.out[x.sf]);c(on.length===0,`SafetyFault (${x.sf}) TRUE in every scan [f+1, r+2099] (held press is no acknowledgement, no new press); first FALSE t=${on[0]?.t}`);}
  else c.nv('SafetyFault TRUE [f+1, r+2099] (held BOTH-1 is no acknowledgement) - no SafetyFault symbol in the source (A8); observable checks PASSED');
  c.finish(t,`violated checks (p=${p}, g=${g}, r=${r})`);});
 // ---- EStop anywhere in [f, Q2] (K3-ACK §2 "Аварийные") ----
 for(const pt of ['f','g','p','Q1','r+1000','Q2'])test(L.T(`E2d FBK-10 K3-ACK (${id}) in_Estop_PLC TRUE at ${pt} (inside [f, Q2]) -> Emergency by the EStop cause, latched, no lift; the acknowledgement does not cancel the emergency priority`),t=>{
  const {x,f}=start(cs);const c=L.checks();let e=null;
  // drive scan by scan with the same schedule as the main K3-ACK test (p=g+2100, BOTH-2 at r+2001)
  const g=f+3000,p=g+2100,Q1=p+1000,r=Q1+101,p2=r+2001,Q2=p2+1000;const tgt={f,g,p,Q1,'r+1000':r+1000,Q2}[pt];
  for(let n=f;n<=Q2+3000;n++){const inp={};x.hold=n<g?{[cs.fbk]:true}:{};if(n>=p&&n<=Q1+100)Object.assign(inp,BOTH);if(n===r)Object.assign(inp,OFF);
   if(n>=p2&&n<=Q2+100)Object.assign(inp,BOTH);if(n===Q2+101)Object.assign(inp,OFF);if(n===tgt){inp.in_Estop_PLC=true;e=n;}x.step(inp);}// cause held to the end: latch judged while the cause is active (later BOTH gestures cannot be a valid Restart)
  const seg=x.log.filter(s=>s.t>=e);const i=seg.findIndex(L.isEmg);
  c(i>=0&&seg.slice(i).every(L.isEmg),`EMGREF(1): Emergency reached (first +${i<0?'never':seg[i].t-e}) and latched while in_Estop_PLC stays TRUE`);
  const pl=x.log.find(s=>s.t===e-1);if(pl&&!lifted(cs,pl)){const l=firstLift(x,cs,e+1);c(l==null,`no lift after the EStop (EMGREF(2)); first lift t=${l}`);}else t.diagnostic('already lifted at e-1 (another check judges that lift); EMGREF(2) rises checked below');
  const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid'].flatMap(k=>L.rises(seg,k).map(v=>k+'@+'+(v-e)));
  c(rs.length===0,'EMGREF(2): no energy increase / STO release / Unlock after the EStop: '+rs.slice(0,5));c.finish(t,`violated checks (e=${pt}=${e})`);});
 // ---- PLC command fronts (K3-ACK "Сопутствующие варианты", WDG-06(c)) ----
 const kind=cs.base==='Safe'?'SAFE_TO_RND':'RND_TO_RUN';
 test(L.T(`E2d FBK-10 K3-ACK (${id}) PLC front CMD_${kind} at g+2100 without a button acknowledgement -> not executed, SafetyFault stays TRUE (E6-Q2 "PLC не квитирует")`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();const sym=L.plcCommandName(kind);
  const g=episode(x,cs);waitTo(x,g+2100);const pf=x.t+1;if(sym)x.r.setInputs({[sym]:true});x.step({},300);if(sym)x.r.setInputs({[sym]:false});x.step({},1000);
  if(!sym){c.nv(`PLC command CMD_${kind} - no symbol in the source (E4 full revision; set E2_CMD_${kind}_SYMBOL); observable checks of the episode PASSED`);steady(c,x,pre,f,x.t,'');c.finish(t);return;}
  noLift(c,x,cs,pf,x.t,'PLC front without acknowledgement not executed (WDG-06(c))');steady(c,x,pre,f,x.t,'');
  if(x.sf)c(x.log.filter(s=>s.t>=pf&&s.t<=x.t).every(s=>s.out[x.sf]),'SafetyFault stays TRUE (PLC does not acknowledge)');else c.nv('SafetyFault stays TRUE - no SafetyFault symbol (A8)');c.finish(t);});
 test(L.T(`E2d FBK-10 K3-ACK (${id}) BOTH-1 acknowledgement at g+2100, NEW PLC front CMD_${kind} at r+2100 -> executed`),t=>{
  const {x,f}=start(cs);const c=L.checks();const sym=L.plcCommandName(kind);
  const g=episode(x,cs);waitTo(x,g+2100);const b1=gesture(x);waitTo(x,b1.r+2100);const pf=x.t+1;if(sym)x.r.setInputs({[sym]:true});x.step({},300);if(sym)x.r.setInputs({[sym]:false});x.step({},1500);
  if(!sym){c.nv(`PLC command CMD_${kind} - no symbol in the source (E4 full revision; set E2_CMD_${kind}_SYMBOL)`);noLift(c,x,cs,b1.p,x.t,'no lift without any command after the acknowledgement');c.finish(t);return;}
  noLift(c,x,cs,b1.p,pf-1,'BOTH-1 only acknowledges');c(firstLift(x,cs,pf)!=null,'new PLC front after the acknowledgement executed (E6-Q2 "новым фронтом команды PLC")');c.finish(t);});
}
// ---- N8 (review G1 v5): v7 §4.5 boundaries / combinations ----
for(const [id,cs] of Object.entries(CASES))for(const [nm,dq] of [['f = Q (FBK ON in the qualification scan)',0],['f = Q-1',-1]])
 test(L.T(`E2d FBK-10 (${id}) BOTH qualified at Q, ${cs.label} TRUE from ${nm} without a command -> no lift in f+1 or later (v7 §4.5 boundary; lift in f itself observation)`),t=>{
  const x=L.cached(cs.base);x.step(OFF,2100);const c=L.checks();const p=x.t+1,Q=p+1000,f=Q+dq;
  for(let n=p;n<=f+3500;n++){x.hold=n>=f&&n<f+3000?{[cs.fbk]:true}:{};x.step(n===p?BOTH:n===p+1100?OFF:{});}
  const l=firstLift(x,cs,f);if(l===f)t.diagnostic('observation: lift executed in f itself (v7 §4.5: observation)');
  else c(l==null,`FBK ON in f (= Q${dq?dq:''}) with the qualified BOTH: lift at f+1 or later is a FAIL; first lift at f+${l-f}`);
  const e=x.log.filter(s=>s.t>=f).find(emg);c(!e,'no Emergency (Q-V4-02 "В"); first t='+e?.t);c.finish(t,`violated checks (p=${p}, Q=${Q}, f=${f})`);});
test(L.T('E2d FBK-10 (R) steady R&D, C2_FBK TRUE without command from f, LV Healthy lost at f+500 (held) -> HLT-01 R&D->Safe not blocked (C1 OFF, Safe), no Emergency (v7 §4.5)'),t=>{
 const cs=CASES.R;const {x,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},500);const h=x.t+1;x.step({in_LV_Faulty_FBK:true},3000);
 const off=L.firstAt(x.log.filter(s=>s.t>=h),s=>!s.out.out_LV_C1);c(off!=null,`HLT-01: C1 OFF command after the LV loss (not blocked by FBK-10); stages=${x.stageSet()}`);
 c(L.statusIs(x,'STS_SAFE')&&x.stageSet().join()==='b_Step1',`HLT-01: Safe reached within 3000 ms of the LV loss; stages=${x.stageSet()} statuses=${x.statusSet()}`);
 const e=x.log.filter(s=>s.t>=f).find(emg);c(!e,'no Emergency (Q-V4-02 "В", HLT-01 "не Emergency"); first t='+e?.t);
 t.diagnostic(`observation: C1 OFF at h+${off==null?'never':off-h}`);x.hold={};c.finish(t);});
for(const [id,cs] of Object.entries(CASES))
 test(L.T(`E2d FBK-10 (${id}) + in_Estop_PLC: Restart while ${cs.label} still ON -> stays Emergency (SPEC §12, v7 §4.5); after FBK OFF, Restart -> only Safe`),t=>{
  const {x,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},500);const e=x.t+1;x.step({in_Estop_PLC:true},1000);x.step({in_Estop_PLC:false},11000);
  c(L.isEmg(x.snap()),`Emergency latched before the Restart; statuses=${x.statusSet()}`);const r1=x.t+1;L.restart(x);x.step({},1500);
  const seg=x.log.filter(s=>s.t>=r1);c(seg.every(L.isEmg),`Restart while ${cs.fbk} ON: stays Emergency (no exit, no delayed exit); first non-Emergency t=${seg.find(s=>!L.isEmg(s))?.t}`);
  x.hold={};x.step({},200);L.restartToSafe(x,c,'after FBK OFF: ');c.finish(t,`violated checks (f=${f}, e=${e}, refused Restart ${r1})`);});
