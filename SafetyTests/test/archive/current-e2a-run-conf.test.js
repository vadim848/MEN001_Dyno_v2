// E2 G1 v5 (v2-tester) — RUN-CONF (ID MOD-002, WDG-003) and R&D confirmation (MOD-001 / MOD1-01, FBK-01/FBK-03).
// Oracle: program/analyst/E2-G1-v4/CRITERIA_DELTA_v7.md (378a9f93…f8459) §3 (m-7) and §4.0-§4.2, §4.4 - replaces v6 §1 and
// E2-runconf RC-1..RC-7; SCENARIO_DECISIONS.md ddee4552…c07: Q-V4-01 "Б", question 68 "Б" (lead 2026-10-22: Q-V7-02 closed by
// 68 "Б" "то же для C1 и R&D" -> R&D not <= u1+599, R&D at u1+601, as RC-5), Q-RC-RUNCONF-01 "В", Q-RC-19, D-STO-LAUNCH.
// Notation: u = scan of the C2 ON command (out_HV_C2 FALSE->TRUE); w = u+500 (end of the FBK window); t_f = first C2_FBK ON;
// k = first scan of the continuous interval C2_FBK ON AND in_HV_Faulty_FBK FALSE lasting until Run, counted only from scans
// >= w (question 68); K = max(k, w). "Run" = status STS_RUN (published or D2-A, A6). Plant A2: FBK follows the command with
// one scan delay; a hold overrides it.
//  RC-1 no Run in any scan < K; no Run in a scan with C2_FBK OFF or HV Faulty TRUE.   RC-2 no Run in any scan <= u+599.
//  RC-3 Run at K+101 and every later scan of the window (K+100 observation).           RC-4 STO FBK pinned "STO active": the same.
//  RC-5 table (v7 §4.1): (i) C2_FBK u+1, (ii) u+30, (iii) u+400, (v) u+499, (vi) bounce OFF u+100..u+110 -> K=u+500, no Run
//    <= u+599, Run at u+601; (iv) HV Faulty TRUE until u+2999 -> K=u+3000, no Run <= u+3099, Run at u+3101. Always: no Emergency,
//    no rollback, SafetyFault FALSE (NV without the symbol, A8).
//  RC-6 HV Faulty after the window: 1 scan u+550 (no Run <= u+650, Run u+652), u+550..u+569 (<= u+669, u+671), 1 scan u+599
//    (<= u+699, u+701); inside the window u+51 (1 scan) and u+51..u+70: count not affected (<= u+599, u+601).
//  m-7 invariant (v7 §3): s_i = first scan >= u-1 with STO_DRi released, a = min(u, s_1, s_2): u, s_1, s_2 in {a, a+1}; C2 ON in
//    every scan [u, Run-1]; STO_DRi released in every scan [s_i, Run-1]; no SS1 request, no Emergency/abort.
//  RC-7 C2_FBK FALSE 1 scan, command kept: inside the window (t_f+1, t_f+50) -> no Emergency, no rollback, Run at u+601;
//    after the window l in {u+502, u+550, u+599} -> Emergency (EMGREF-RUN, rule L1 vs in_Estop_PLC at l in the same drive, L4,
//    latch), no Run in any scan >= l, Restart -> only Safe; l in {u+500, u+501} observation (DIAG).
//  R&D (v7 §4.2; G1 v6: READY by question 68 "Б", upper bound TD-02): u1 = C1 ON command; no R&D (STS_RND) in any scan <= u1+599, R&D at u1+601 and later; C1_FBK
//    FALSE 1 scan inside the window (u1+51) -> no Emergency, R&D at u1+601; after the window (u1+550) -> Emergency (FBK-01,
//    EMGREF-LV: C2 OFF / STO active, R&D never), Restart -> only Safe. LV-only loss after the window: DIAG observation (v7 §4.2
//    left it an observation; not re-derived here).
//  Not written here (E6): the end-of-window rollback WDG-01/03 (FBK FALSE at w-1..w+1), watchdog 30 s (Q-CA1-01 "Б").
// G1 v6 (analyst E2-plan-v5-questions/CRITERIA.md 0a2f7de9…6b4c §2; SCENARIO_DECISIONS f7ae580f…835d):
//  RUN-CONF-T: no Run <= K+99 (READY, question 68 "Б"); K+100 observation; Run at K+101 = TEAM-DEFAULT TD-02 (SCENARIO_DECISIONS
//  «Решено командой», ждёт просмотра Вадимом); the RC-UB tolerance q_total+2 = u+602 is cancelled (Run first at u+602 = FAIL).
//  RND-CONF-T: the same for R&D with u1 / C1_FBK / LV - "no R&D <= u1+599, R&D at u1+601" is READY by question 68 "Б" ("то же для
//  C1 и R&D"; closes Q-V7-02 - no longer a lead instruction); the K1+101 upper bound is TD-02. LV-only drop in the 100 ms after the
//  window restarts the count (READY, 68 "Б") - the v5 DIAG test became normative.
//  N6 (review G1 v5): RC-5 (i)/(ii)/(iii)/(v) assert the stimulus moment t_f = first C2_FBK ON >= u (u+1/30/400/499) and (vi) the
//  C2_FBK FALSE exactly in u+100..u+110 (ON at u+99 and u+111) as stand preconditions - kObs alone does not see a wrong stimulus
//  before the window.
// Assumptions A1..A9: helpers/e2-lifecycle.js; rule L: helpers/e2-rule-l.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
import * as RL from '../helpers/e2-rule-l.js';
const {BOTH,OFF}=L;
const run=s=>s.statuses.includes('STS_RUN'),rnd=s=>s.statuses.includes('STS_RND');
const emgOrFault=s=>!s.out.b_EStop_Ok||s.statuses.includes('STS_EMG');
// variant: {pre: inputs before BOTH, hold: feedback pins, during(x,u): called before every scan once the C2 ON command u is seen}.
// G1 v5: driven scan by scan from the press (BOTH p..p+1099) - in v4 `during` started only after the whole 1100 ms press
// (~u+98), so the u+29 release of RC-5(ii) never fired (harness defect of v4, never executed on canonical).
function scenario(v){const x=L.cached('RnD');Object.keys(v.pre??{}).length&&x.step(v.pre);x.hold={...(v.hold??{})};
 const p=x.t+1,span=v.span??1000;let cmd=null;
 for(;;){const n=x.t+1;if(cmd!=null)v.during?.(x,cmd);x.step({...(n===p?BOTH:{}),...(n===p+1100?OFF:{})});
  if(cmd==null&&x.get('out_HV_C2'))cmd=x.t;if(cmd==null&&x.t>=p+1500)assert.fail('precondition: C2 ON command within 1500 ms of BOTH (R&D->Run accepted)');
  if(cmd!=null&&x.t>=cmd+span)break;}
 return {x,p,cmd,end:cmd+span};}
// K observed on the trace (cross-check of the input design): first scan >= w from which C2_FBK ON and HV healthy hold until
// `end` = the scan before the expected Run (design window; the candidate's own later behaviour does not move K).
// Only stimulus-driven gaps count (HV Faulty, or C2_FBK OFF while the C2 command is ON); an FBK OFF caused by the program's own
// C2 OFF command is the candidate's behaviour (judged by m-7), not an input-design error.
function kObs(log,w,end){let K=w;for(const s of log)if(s.t>=w&&s.t<=end&&(s.hvFaulty||(s.out.out_HV_C2&&!s.c2fbk)))K=s.t+1;return K;}
// m-7 invariant (v7 §3) on scans u-1 .. Run-1.
function startInvariant(c,log,u,label=''){const fr=L.firstAt(log.filter(s=>s.t>=u),run)??log.at(-1).t+1;
 const s1=L.firstAt(log.filter(s=>s.t>=u-1),s=>s.out.STO_DR1),s2=L.firstAt(log.filter(s=>s.t>=u-1),s=>s.out.STO_DR2);
 const a=Math.min(u,s1??Infinity,s2??Infinity);
 c(s1!=null&&s2!=null&&[u,s1,s2].every(v=>v===a||v===a+1),`${label}m-7: u=${u}, s_1=${s1}, s_2=${s2} must lie in {a, a+1}, a=${a} (STO release not delayed beyond a+1)`);
 const c2=log.find(s=>s.t>=u&&s.t<fr&&!s.out.out_HV_C2);c(!c2,`${label}m-7: C2 ON in every scan [u, Run-1]; first OFF t=${c2?.t}`);
 for(const [k,si] of [['STO_DR1',s1],['STO_DR2',s2]])if(si!=null){const b=log.find(s=>s.t>=si&&s.t<fr&&!s.out[k]);c(!b,`${label}m-7: ${k} released in every scan [s_i=${si}, Run-1]; first restored t=${b?.t}`);}
 const win=log.filter(s=>s.t>=u&&s.t<fr);
 const ss1=['out_SS1_DR1','out_SS1_DR2'].flatMap(q=>win.filter((s,i)=>i>0&&!s.out[q]&&win[i-1].out[q]).map(s=>q+'@'+s.t));c(ss1.length===0,`${label}m-7: no SS1 request before Run: ${ss1.slice(0,3)}`);
 const e=win.find(emgOrFault);c(!e,`${label}no Emergency/fault before Run; first t=${e?.t}`);}
function sfNV(c,x,from,label){if(x.sf){const b=x.log.find(s=>s.t>=from&&s.out[x.sf]);c(!b,`${label}SafetyFault FALSE (no fault in a normal start); first TRUE t=${b?.t}`);}
 else c.nv(`${label}"no SafetyFault" - no SafetyFault symbol in the source (A8); observable checks PASSED`);}
// RC-1..RC-5 check of one start. exp = {K: K - u, noRun: last scan offset without Run, runAt: offset of the first Run scan}.
function check(t,{x,p,cmd,end},label,exp){const c=L.checks();const u=cmd,seg=x.log.filter(s=>s.t>=p),at=d=>x.log.find(s=>s.t===d);
 if(exp.tf!=null){const tf=L.firstAt(x.log.filter(s=>s.t>=u),s=>s.c2fbk);c(tf===u+exp.tf,`stand precondition (N6): stimulus t_f = first C2_FBK ON = u+${exp.tf}, observed u+${tf==null?'never':tf-u} (${label})`);}
 if(exp.gap){const [a,b]=exp.gap;const ok=at(u+a-1)?.c2fbk===true&&x.log.filter(s=>s.t>=u+a&&s.t<=u+b).every(s=>!s.c2fbk)&&at(u+b+1)?.c2fbk===true;
  c(ok,`stand precondition (N6): C2_FBK ON at u+${a-1}, FALSE exactly in u+${a}..u+${b}, ON at u+${b+1} (${label})`);}
 const K=kObs(x.log,u+500,u+exp.runAt-1);c(K===u+exp.K,`stand precondition: input design gives K=u+${exp.K}, observed K=u+${K-u} (${label})`);
 c(seg.filter(s=>s.t<K).every(s=>!run(s)),`RC-1: no Run in any scan < K=u+${K-u} (${label}); Run first at u+${(L.firstAt(seg,run)??NaN)-u}`);
 c(seg.filter(run).every(s=>s.c2fbk&&!s.hvFaulty),`RC-1: no Run in a scan with C2_FBK OFF or HV Faulty TRUE (${label})`);
 c(seg.filter(s=>s.t<=u+599).every(s=>!run(s)),`RC-2 (v7): no Run in any scan <= u+599 (window 500 ms + 100 ms, question 68 "Б") (${label})`);
 c(seg.filter(s=>s.t<=u+exp.noRun).every(s=>!run(s)),`RC-5 (v7 §4.1): no Run in any scan <= u+${exp.noRun} (${label}); Run first at u+${(L.firstAt(seg,run)??NaN)-u}`);
 const late=x.log.filter(s=>s.t>=u+exp.runAt&&s.t<=end);
 c(late.length>0&&late.every(run),`RC-3/RC-5 RUN-CONF-T: Run at u+${exp.runAt} = K+101 and every later scan (TEAM-DEFAULT TD-02: K+101; RC-UB u+602 cancelled) (${label}); Run first at u+${(L.firstAt(seg,run)??NaN)-u}`);
 t.diagnostic(`observation: u=${u} K=u+${K-u} Run first at u+${(L.firstAt(seg,run)??NaN)-u}; K+100 Run=${at(K+100)?run(at(K+100)):null}`);
 startInvariant(c,x.log,u,`(${label}) `);sfNV(c,x,p,'');c.finish(t);}
const RC5=[['(i) natural: C2_FBK ON one scan after the command, HV healthy',{},{K:500,noRun:599,runAt:601,tf:1}],
 ['(ii) C2_FBK delayed 30 ms (ON from u+30)',{hold:{in_HV_C2_FBK:false},during:(x,u)=>{if(x.t===u+29)delete x.hold.in_HV_C2_FBK;}},{K:500,noRun:599,runAt:601,tf:30}],
 ['(iii) C2_FBK delayed 400 ms (ON from u+400)',{hold:{in_HV_C2_FBK:false},during:(x,u)=>{if(x.t===u+399)delete x.hold.in_HV_C2_FBK;}},{K:500,noRun:599,runAt:601,tf:400}],
 ['(v) C2_FBK ON from u+499 (just before the end of the window)',{hold:{in_HV_C2_FBK:false},during:(x,u)=>{if(x.t===u+498)delete x.hold.in_HV_C2_FBK;}},{K:500,noRun:599,runAt:601,tf:499}],
 ['(vi) C2_FBK bounce OFF u+100..u+110 inside the window, ON from u+111: not an emergency',{during:(x,u)=>{if(x.t===u+99)x.hold={in_HV_C2_FBK:false};if(x.t===u+110)x.hold={};}},{K:500,noRun:599,runAt:601,gap:[100,110]}]];
for(const [nm,v,exp] of RC5)
 test(L.T(`E2a RUN-CONF RC-5 ${nm}: no Run <= u+${exp.noRun}, Run at u+${exp.runAt} (Q-V4-01 "Б", question 68 "Б"), no Emergency`),t=>{const r=scenario(v);check(t,r,nm,exp);});
// (iv): name kept from G1 v3 (stand baseline) - its oracle "Run at k+101, not at k+99" is unchanged by v7 (K = k = u+3000).
test(L.T('E2a RUN-CONF HV Faulty TRUE for 3000 ms after C2_FBK ON: no Run meanwhile; HV healthy -> Run at k+101, not at k+99'),t=>{
 const r=scenario({pre:{in_HV_Faulty_FBK:true},span:3500,during:(x,u)=>{if(x.t===u+2999)x.step({in_HV_Faulty_FBK:false},0);}});
 check(t,r,'(iv) HV Faulty TRUE until u+2999',{K:3000,noRun:3099,runAt:3101});});
test(L.T('E2a RUN-CONF RC-4 drives STO FBK pinned to "STO active" (in_STO_DRx_FBK TRUE): Run at K+101 = u+601 (STO FBK not required, no 5 s hold)'),t=>{
 const r=scenario({hold:{in_STO_DR1_FBK:true,in_STO_DR2_FBK:true}});check(t,r,'RC-4 STO FBK pinned',{K:500,noRun:599,runAt:601});});
// Scan-by-scan R&D->Run drive (the BOTH press, 1100 ms from p): stepTo(y,p,t,extra) advances y to scan t with the same button
// schedule (BOTH released at p+1100); extra(n) adds inputs for scan n.
let upb;
function upBase(){if(!upb){try{const b=L.cached('RnD',{c3:true});const p=b.t+1;const y=b.fork();
  const tf=(()=>{for(let n=p;n<p+1600;n++){y.step(n===p?BOTH:{});if(y.log.at(-1).c2fbk)return y.t;}return null;})();
  assert.ok(tf!=null,'precondition: C2_FBK ON within 1600 ms of the BOTH press');
  const cmd=L.firstAt(y.log,s=>s.out.out_HV_C2);upb={b,p,tf,cmd};}catch(e){upb={error:e};}}
 if(upb.error)throw upb.error;return upb;}
function stepTo(y,p,t,extra=()=>({})){while(y.t<t){const n=y.t+1;y.step({...(n===p?BOTH:{}),...(n===p+1100?OFF:{}),...extra(n)});}return y;}
// ---- RC-6 (v7 §4.1): HV Faulty TRUE before Run. g, len relative to u; after the window the count restarts at k'=g+len. ----
for(const [nm,g0,len,noRun,runAt] of [['1 scan at u+550 (K+50, after the window)',550,1,650,652],['20 ms u+550..u+569 (after the window)',550,20,669,671],
 ['1 scan at u+599 (K+99, boundary before Run)',599,1,699,701],['1 scan at u+51 (inside the window)',51,1,599,601],['20 ms u+51..u+70 (inside the window)',51,20,599,601]])
 test(L.T(`E2a RUN-CONF RC-6 (v7) HV Faulty TRUE ${nm}: no Run <= u+${noRun}, Run at u+${runAt}, start kept (m-7), no Emergency (Q-RC-RUNCONF-01 "В", question 68 "Б")`),t=>{
  const {b,p,cmd}=upBase();const u=cmd,g=u+g0,k2=g+len;const x=stepTo(b.fork(),p,u+runAt+400,n=>n===g?{in_HV_Faulty_FBK:true}:n===k2?{in_HV_Faulty_FBK:false}:{});
  const c=L.checks();const seg=x.log.filter(s=>s.t>=p);
  c(x.log.filter(s=>s.t>=g&&s.t<k2).every(s=>s.hvFaulty===true)&&x.log.find(s=>s.t===k2)?.hvFaulty===false,`stand precondition: HV Faulty TRUE exactly in scans g..${k2-1} (u=${u})`);
  c(seg.filter(s=>s.t<=u+noRun).every(s=>!run(s)),`RC-6: no Run in any scan <= u+${noRun}; Run first at u+${(L.firstAt(seg,run)??NaN)-u}`);
  c(x.log.filter(s=>s.t>=u+runAt).every(run),`RC-6: Run at u+${runAt} and later; Run first at u+${(L.firstAt(seg,run)??NaN)-u}`);
  startInvariant(c,x.log,u,'RC-6 ');sfNV(c,x,p,'');c.finish(t);});
// ---- RC-7 (v7 §4.1, FBK-03): C2_FBK FALSE 1 scan with the C2 command kept, before Run ----
for(const d of [1,50])test(L.T(`E2a RUN-CONF RC-7 (v7) C2_FBK FALSE 1 scan at t_f+${d} inside the 500 ms window, command kept: not an emergency, no rollback, Run at u+601 (Q-V4-01 "Б")`),t=>{
 const {b,p,tf,cmd}=upBase();const u=cmd,ev=tf+d;const y=stepTo(b.fork(),p,ev-1);
 assert.ok(ev<u+500,`precondition: bounce scan ${ev} inside the window (u+500=${u+500})`);
 y.hold={in_HV_C2_FBK:false};stepTo(y,p,ev);y.hold={};stepTo(y,p,u+1000);
 const c=L.checks();const seg=y.log.filter(s=>s.t>=p);
 c(seg.filter(s=>s.t<=u+599).every(s=>!run(s)),`RC-7/RC-2: no Run <= u+599; Run first at u+${(L.firstAt(seg,run)??NaN)-u}`);
 c(y.log.filter(s=>s.t>=u+601).every(run),`RC-7: Run at u+601 and later (bounce inside the window does not affect the count); Run first at u+${(L.firstAt(seg,run)??NaN)-u}`);
 startInvariant(c,y.log,u,'RC-7 ');sfNV(c,y,p,'');c.finish(t,`violated checks (u=${u}, t_f=${tf}, bounce ${ev})`);});
function rc7After(t,l0,diagOnly){const {b,p,tf,cmd}=upBase();const u=cmd,ev=u+l0,until=ev+12000;const y=stepTo(b.fork(),p,ev-1);const pre=y.snap();
 assert.ok(pre.out.out_HV_C2&&pre.c2fbk&&!y.log.some(run),`precondition: C2 command ON, C2_FBK ON, Run not yet confirmed at ev-1 (u=${u}, t_f=${tf})`);
 const tr=(inp,bounce)=>{const z=y.fork();if(bounce)z.hold={in_HV_C2_FBK:false};stepTo(z,p,ev,n=>n===ev?inp:{});z.hold={};stepTo(z,p,until);return {z,p:RL.profile(z.log,pre,ev,until)};};
 const X=tr({},true);if(diagOnly){const s=X.z.log.filter(q=>q.t>=ev);t.diagnostic(`observation l=u+${l0}: profile ${JSON.stringify(X.p)}; Emergency first +${(L.firstAt(s,L.isEmg)??NaN)-ev}; Run first +${(L.firstAt(s,run)??NaN)-ev}`);return;}
 const R=tr({in_Estop_PLC:true},false);const c=L.checks();const seg=X.z.log.filter(s=>s.t>=ev);
 t.diagnostic('rule L profiles bounce / in_Estop_PLC: '+JSON.stringify(X.p)+' / '+JSON.stringify(R.p));
 RL.latched(c,X.z.log,ev,until);RL.L1(c,X.p,R.p);RL.L4(c,X.p);RL.noRunAfter(c,X.z.log,ev,until,false);
 const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid','out_SS1_DR1','out_SS1_DR2'].flatMap(k=>L.rises(seg,k).map(v=>k+'@'+(v-ev)));
 c(rs.length===0,'EMGREF(2): no energy increase / STO or SS1 release / Unlock after the loss: '+rs.slice(0,5));
 c(seg.some(s=>s.out.out_HV_Discharge_Request),'EMGREF-RUN: HV discharge performed (C2 was ON)');
 L.restartToSafe(X.z,c,'');c.finish(t,`violated checks (u=${u}, t_f=${tf}, loss at u+${l0})`);}
for(const l0 of [502,550,599])test(L.T(`E2a RUN-CONF RC-7 (v7, FBK-03) C2_FBK FALSE 1 scan at u+${l0} after the window (FBK confirmed), before Run: Emergency (rule L1 vs in_Estop_PLC), no Run, Restart -> only Safe (Q-V4-01 "Б", Q-RC-19)`),t=>rc7After(t,l0,false));
for(const l0 of [500,501])test(L.T(`DIAG observation E2a RUN-CONF RC-7: C2_FBK FALSE 1 scan at u+${l0} (end of the window, v7 §4.1 observation)`),t=>{try{rc7After(t,l0,true);}catch(err){t.diagnostic('unavailable (observation only): '+err.message);}});
// ---- R&D confirmation (v7 §4.2, Q-V7-02 closed by 68 "Б"): Safe -> R&D by BOTH ----
let rdb;
function rdBase(){if(!rdb){try{const b=L.cached('Safe');const p=b.t+1;const y=b.fork();
  for(let n=p;n<p+1600&&!y.get('out_LV_C1');n++)y.step(n===p?BOTH:{});
  const u1=L.firstAt(y.log.filter(s=>s.t>=p),s=>s.out.out_LV_C1);assert.ok(u1!=null,'precondition: C1 ON command within 1600 ms of BOTH from Safe (Safe->R&D accepted)');
  rdb={b,p,u1};}catch(e){rdb={error:e};}}
 if(rdb.error)throw rdb.error;return rdb;}
test(L.T('E2a MOD1-01 (v7 §4.2) Safe->R&D natural: no R&D <= u1+599, R&D at u1+601 and later (question 68 "Б": C1 window 500 ms + 100 ms continuous C1_FBK and LV healthy), no Emergency'),t=>{
 const {b,p,u1}=rdBase();const x=stepTo(b.fork(),p,u1+1000);const c=L.checks();const seg=x.log.filter(s=>s.t>=p);
 c(seg.filter(s=>s.t<=u1+599).every(s=>!rnd(s)&&!s.stages.includes('b_Step_RnD')),`no R&D (status or stage) in any scan <= u1+599; R&D first at u1+${(L.firstAt(seg,rnd)??NaN)-u1}`);
 c(x.log.filter(s=>s.t>=u1+601).every(rnd),`R&D at u1+601 and later (RND-CONF-T, TEAM-DEFAULT TD-02 upper bound; RC-UB u1+602 cancelled); R&D first at u1+${(L.firstAt(seg,rnd)??NaN)-u1}`);
 const e=seg.find(emgOrFault);c(!e,'no Emergency/fault; first t='+e?.t);c(x.log.filter(s=>s.t>=u1).every(s=>s.out.out_LV_C1),'C1 ON kept');sfNV(c,x,p,'');c.finish(t);});
test(L.T('E2a MOD1-01 / FBK-01 (v7 §4.2) Safe->R&D, C1_FBK FALSE 1 scan at u1+51 inside the window: not an emergency, R&D at u1+601'),t=>{
 const {b,p,u1}=rdBase();const y=stepTo(b.fork(),p,u1+50);y.hold={in_LV_C1_FBK:false};stepTo(y,p,u1+51);y.hold={};stepTo(y,p,u1+1000);
 const c=L.checks();const seg=y.log.filter(s=>s.t>=p);
 c(seg.filter(s=>s.t<=u1+599).every(s=>!rnd(s)),`no R&D <= u1+599; R&D first at u1+${(L.firstAt(seg,rnd)??NaN)-u1}`);
 c(y.log.filter(s=>s.t>=u1+601).every(rnd),`R&D at u1+601 and later; R&D first at u1+${(L.firstAt(seg,rnd)??NaN)-u1}`);
 const e=seg.find(emgOrFault);c(!e,'C1_FBK drop inside the window: no Emergency/fault; first t='+e?.t);sfNV(c,y,p,'');c.finish(t);});
test(L.T('E2a FBK-01 (v7 §4.2/§4.3) Safe->R&D, C1_FBK FALSE 1 scan at u1+550 after the window, before R&D: Emergency (EMGREF-LV, rule L1 vs in_Estop_PLC), R&D never, Restart -> only Safe'),t=>{
 const {b,p,u1}=rdBase();const ev=u1+550,until=ev+12000;const y=stepTo(b.fork(),p,ev-1);const pre=y.snap();
 assert.ok(pre.out.out_LV_C1&&pre.c1fbk&&!y.log.some(rnd),`precondition: C1 ON, C1_FBK ON, R&D not yet confirmed at ev-1 (u1=${u1})`);
 const tr=(inp,drop)=>{const z=y.fork();if(drop)z.hold={in_LV_C1_FBK:false};stepTo(z,p,ev,n=>n===ev?inp:{});z.hold={};stepTo(z,p,until);return {z,p:RL.profile(z.log,pre,ev,until)};};
 const X=tr({},true),R=tr({in_Estop_PLC:true},false);const c=L.checks();const seg=X.z.log.filter(s=>s.t>=ev);
 t.diagnostic('rule L profiles drop / in_Estop_PLC: '+JSON.stringify(X.p)+' / '+JSON.stringify(R.p));
 RL.latched(c,X.z.log,ev,until);RL.L1(c,X.p,R.p);RL.L4(c,X.p);
 c(seg.every(s=>!rnd(s)&&!s.stages.includes('b_Step_RnD')),'R&D never confirmed after the loss (EMGREF-LV(3))');
 c(seg.every(s=>!s.out.out_HV_C2&&!s.out.STO_DR1&&!s.out.STO_DR2),'EMGREF-LV(2): C2 OFF and STO active continuously');
 c(seg.some(s=>s.out.out_LV_Discharge_Request),'EMGREF-LV(4): LV discharge performed');
 const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid'].flatMap(k=>L.rises(seg,k).map(v=>k+'@'+(v-ev)));
 c(rs.length===0,'EMGREF(2): no energy increase after the loss: '+rs.slice(0,5));
 L.restartToSafe(X.z,c,'');c.finish(t,`violated checks (u1=${u1}, loss at u1+550)`);});
// RND-CONF-T (G1 v6): LV-only loss 1 scan at u1+550 (after the window, C1_FBK kept ON): count restarts (68 "Б"), k1' = u1+551 ->
// no R&D <= u1+650 (READY), R&D at u1+652 = k1'+101 (TD-02), no Emergency (LV norm is not the FBK), C1 kept ON.
test(L.T('E2a RND-CONF-T Safe->R&D, LV Faulty TRUE 1 scan at u1+550 after the window: count restarts - no R&D <= u1+650, R&D at u1+652, no Emergency (question 68 "Б"; upper bound TEAM-DEFAULT TD-02)'),t=>{
 const {b,p,u1}=rdBase();const x=stepTo(b.fork(),p,u1+1200,n=>n===u1+550?{in_LV_Faulty_FBK:true}:n===u1+551?{in_LV_Faulty_FBK:false}:{});
 const c=L.checks();const seg=x.log.filter(s=>s.t>=p);
 c(x.log.find(s=>s.t===u1+550)?.lvFaulty===true&&x.log.find(s=>s.t===u1+551)?.lvFaulty===false&&x.log.find(s=>s.t===u1+549)?.lvFaulty===false,'stand precondition: LV Faulty TRUE exactly in scan u1+550');
 c(seg.filter(s=>s.t<=u1+650).every(s=>!rnd(s)&&!s.stages.includes('b_Step_RnD')),`no R&D <= u1+650; R&D first at u1+${(L.firstAt(seg,rnd)??NaN)-u1}`);
 c(x.log.filter(s=>s.t>=u1+652).every(rnd),`R&D at u1+652 and later (TD-02); R&D first at u1+${(L.firstAt(seg,rnd)??NaN)-u1}`);
 const e=seg.find(emgOrFault);c(!e,'no Emergency/fault; first t='+e?.t);c(x.log.filter(s=>s.t>=u1).every(s=>s.out.out_LV_C1),'C1 ON kept');sfNV(c,x,p,'');c.finish(t,`violated checks (u1=${u1})`);});
