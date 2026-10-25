// E2 G1 v3 (v2-tester): rule L - moments of the emergency reaction (CRITERIA_DELTA_v4 §0.1, analyst E2-G1-v2-questions,
// answers T1/T3/N2; replaces every absolute "<= e+1" / "same scan" of EMGREF(1)(3), EMGREF-LV(1)(2), IL-03, IL-05a, IL-05d,
// EMG4-03). Notation: e = event scan (the snapshot with t=e is the state AFTER scan e; offset 0 = changed in scan e);
// tau(o) = first scan >= e where output o reaches its emergency target value, as an offset from e.
//  Imm (immediate): status Emergency; C3/BMS OFF; out_LV_Discharge_Request TRUE; Unlock FALSE; SS1 requested (v6 §3).
//  Del (delayed):   C1 OFF (2 s); STO_DR1/STO_DR2 active (FALSE); out_HV_Discharge_Request TRUE; C2 OFF.
//  L1 cause X != in_Estop_PLC vs in_Estop_PLC R (same state, same e): Imm tau_X <= tau_R; Del tau_R-1 <= tau_X <= tau_R.
//  L2 in_Estop_PLC in state S != steady Run vs steady Run: Imm tau_S <= tau_Run+1; Del tau_Run <= tau_S <= tau_Run+1.
//  L3 in_Estop_PLC in steady Run vs reference 4495a1f measured on the stand: Imm <= ref+1; Del in [ref, ref+1].
//  L4 status Emergency not later than the first Imm/Del output change of the emergency chain of the same trace.
// "n/a": the output already had its target value right before e (nothing to change) - not compared by L1..L3.
// G1 v4 (review G1 v3 N6): tester assumption A11 is REMOVED. The no-event continuation of a trace is never used to relax
//  L2 or L4 any more (it is the implementation's own trace - G1 rule "expectations from requirements, not from code"). In
//  phases of an already running energy descent the moments are given by EMG-RD-L below (CRITERIA_DELTA v5 §2,
//  analyst E2-G1-v3-questions) with the NORMATIVE q_N of the descent criterion (STP-A/B, STP-E/I, STP-G) computed on scans
//  of the same trace; the no-event trace is at most a t.diagnostic.
// G1 v4 (m-1; CRITERIA_DELTA_v6 §3 SS1-EMG, READY-D): out_SS1_DR1/2 are Imm outputs with target FALSE (SS1 requested).
export const IMM=[['status',true],['out_C3_BatRelay',false],['out_RBM_Bat',false],['out_LV_Discharge_Request',true],['out_Door_Unlock_Solonoeid',false],['out_SS1_DR1',false],['out_SS1_DR2',false]];
export const DEL=[['out_LV_C1',false],['STO_DR1',false],['STO_DR2',false],['out_HV_Discharge_Request',true],['out_HV_C2',false]];
const isEmg=s=>s.statuses.length===1&&s.statuses[0]==='STS_EMG';
const val=(s,k)=>k==='status'?isEmg(s):s.out[k];
// profile of one trace: log = snapshots (any superset), pre = snapshot right before e, window e..end.
export function profile(log,pre,e,end){const seg=log.filter(s=>s.t>=e&&s.t<=end);const p={};
 for(const [k,tg] of [...IMM,...DEL]){if(k!=='status'&&!(k in pre.out)){p[k]='absent';continue;}
  if(val(pre,k)===tg){p[k]='n/a';continue;}const s=seg.find(s=>val(s,k)===tg);p[k]=s?s.t-e:null;}
 return p;}
const kind=k=>IMM.some(([n])=>n===k)?'Imm':'Del';
// G1 v5 (review G1 v4 C4/C5.1): every Imm/Del output of rule L is mandatory. 'absent' (output name not in the source) is an
// ERROR of the trace, never a silent skip - otherwise a renamed STO/SS1/Discharge output would make the moment checks vacuous.
export function absentErr(c,label,rule,k,who){c(false,`${label}ERROR anti-vacuity (C4) ${rule} ${k}: output absent in the source (${who}); rule-L outputs are mandatory, not skipped`);}
const fmt=v=>v===null?'never':v;
// L1: X (cause) vs R (in_Estop_PLC) - both profiles of the same state/e. opt.skip: keys judged by EMG-RD-L.
export function L1(c,X,R,label='',opt={}){
 for(const k of Object.keys(R)){const x=X[k],r=R[k];if(opt.skip?.has(k))continue;if(r==='absent'||x==='absent'){absentErr(c,label,'L1',k,x==='absent'?'cause trace':'in_Estop_PLC reference');continue;}if(x==='n/a'&&r==='n/a')continue;
  if(x==='n/a'||r==='n/a'){c(false,`${label}L1 ${k}: pre-state differs from the in_Estop_PLC reference (${x}/${r})`);continue;}
  if(kind(k)==='Imm')c(r===null||(x!==null&&x<=r),`${label}L1 Imm ${k}: cause +${fmt(x)} vs in_Estop_PLC +${fmt(r)} (must not lag)`);
  else c(r===null?x===null:(x!==null&&x>=r-1&&x<=r),`${label}L1 Del ${k}: cause +${fmt(x)} vs in_Estop_PLC +${fmt(r)} (allowed [${r===null?'never':r-1}, ${fmt(r)}]: lead <= 1 scan, no lag)`);}}
// L2: S (in_Estop_PLC in state S) vs Run (in_Estop_PLC in steady Run). opt.hvAbsentDiag: EMGREF-LV - a missing HV discharge
// is reported, not asserted (CRITERIA_DELTA EMGREF-LV (2), returned to the analyst). opt.skip: keys judged by EMG-RD-L.
export function L2(c,S,Run,label='',diag=()=>{},opt={}){
 for(const k of Object.keys(Run)){const s=S[k],q=Run[k];if(opt.skip?.has(k))continue;if(s==='absent'||q==='absent'){absentErr(c,label,'L2',k,s==='absent'?'state trace':'steady Run base');continue;}if(s==='n/a')continue;
  if(q==='n/a'||q===null){if(kind(k)==='Del'&&q===null)c(s===null,`${label}L2 Del ${k}: +${fmt(s)} while steady Run never changes it`);continue;}
  if(kind(k)==='Imm'){c(s!==null&&s<=q+1,`${label}L2 Imm ${k}: +${fmt(s)} vs steady Run +${q} (allowed <= ${q+1})`);continue;}
  if(s===null&&opt.hvAbsentDiag&&k==='out_HV_Discharge_Request'){diag(`${label}EMGREF-LV observation: no HV discharge request (steady Run +${q}); not asserted (CRITERIA_DELTA EMGREF-LV 2)`);continue;}
  c(s!==null&&s>=q&&s<=q+1,`${label}L2 Del ${k}: +${fmt(s)} vs steady Run +${q} (allowed [${q}, ${q+1}])`);}}
// G1 v8 TD-10 (TEAM-DEFAULT TD-10; analyst E2-v73-q/CRITERIA.md 2ee04ebb… §2.2; CRITERIA_DELTA_v4 §0.1 L2; T1 p.2-3): L2 for in_Estop_PLC in
// StartingRun ONLY. Del: tau_SU - e in [d_Run-1, d_Run+1] (-2 or earlier FAIL "shortened", +2 or never FAIL "lag"); Imm unchanged (<= d_Run+1);
// an output already at target before e ('n/a') must stay at target (EMGREF(2), judged by the callers' 'stays OFF' / no-rise checks).
// Absent outputs -> ERROR anti-vacuity. In every other state L2 is unchanged ([d_Run, d_Run+1]).
export function L2su(c,S,Run,label='',diag=()=>{},opt={}){
 for(const k of Object.keys(Run)){const s=S[k],q=Run[k];if(opt.skip?.has(k))continue;if(opt.hv0&&k==='out_HV_Discharge_Request')continue;/* TD-11 */if(s==='absent'||q==='absent'){absentErr(c,label,'L2-SU',k,s==='absent'?'state trace':'steady Run base');continue;}if(s==='n/a')continue;
  if(q==='n/a'||q===null){if(kind(k)==='Del'&&q===null)c(s===null,`${label}L2-SU Del ${k}: +${fmt(s)} while steady Run never changes it`);continue;}
  if(kind(k)==='Imm'){c(s!==null&&s<=q+1,`${label}L2-SU Imm ${k}: +${fmt(s)} vs steady Run +${q} (allowed <= ${q+1})`);continue;}
  c(s!==null&&s>=q-1&&s<=q+1,`${label}L2-SU Del ${k}: +${fmt(s)} vs steady Run +${q} (TD-10 allowed [${q-1}, ${q+1}])`);}}
// TD-10 §2.2 lower bound for ANY cause X in StartingRun, REPLACED by TEAM-DEFAULT TD-12 (analyst E2-G1-v8-q §2.2; explicit weakening by 1 scan):
// Del tau_X - e >= d_Run - 2; for out_LV_C1 additionally tau_X - e >= 2000 (Q-ARCH-01 "C1 OFF через 2 с"). opt.skip: keys judged elsewhere (TD-11).
export function L1suLower(c,X,Run,label='',opt={}){
 for(const [k] of DEL){if(opt.skip?.has(k))continue;const s=X[k],q=Run[k];if(s==='absent'||q==='absent'){absentErr(c,label,'L1-SU lower',k,s==='absent'?'cause trace':'steady Run base');continue;}
  if(typeof s!=='number'||typeof q!=='number')continue;c(s>=q-2,`${label}L1-SU Del ${k}: +${s} vs steady Run +${q} (TD-12 lower bound tau_X - e >= d_Run-2 = ${q-2})`);
  if(k==='out_LV_C1')c(s>=2000,`${label}L1-SU Del out_LV_C1: +${s} (TD-12 absolute bound tau - e >= 2000, Q-ARCH-01)`);}}
// TEAM-DEFAULT TD-11 (analyst E2-G1-v8-q §1.2, L2-SU-HV0; explicit weakening): StartingRun trace where HV was never raised at/after e
// (out_HV_C2 FALSE and STO_DR1/2 active in EVERY scan >= e of THAT trace). Then out_HV_Discharge_Request has no lower bound except tau >= e:
// 0 <= tau - e <= d_Run + 1, and TRUE in every later scan to the end; L1 for the discharge: tau_X <= tau_R (no lower bound).
export function hv0(log,e,end){const seg=log.filter(s=>s.t>=e&&s.t<=end);return seg.length>0&&seg.every(s=>!s.out.out_HV_C2&&!s.out.STO_DR1&&!s.out.STO_DR2);}
export function hv0Discharge(c,S,Run,log,e,end,label=''){const k='out_HV_Discharge_Request',s=S[k],q=Run[k];
 if(s==='absent'||q==='absent'){absentErr(c,label,'L2-SU-HV0',k,s==='absent'?'state trace':'steady Run base');return;}if(s==='n/a')return;
 c(typeof s==='number'&&s>=0&&typeof q==='number'&&s<=q+1,`${label}L2-SU-HV0 (TD-11) ${k}: +${fmt(s)}, allowed [0, d_Run+1 = ${typeof q==='number'?q+1:q}]`);
 if(typeof s==='number'){const off=log.find(x=>x.t>=e+s&&x.t<=end&&!x.out[k]);c(!off,`${label}L2-SU-HV0 (TD-11) ${k} TRUE in every scan after its setting to the end (no accepted HV lift); first FALSE t=${off?.t}`);}}
// G1 v9.2 L2-RD (REC-ACCEPTED G3Q-1, analyst E2-G3-q §1; explicit weakening): states of the common chain R&D, R&D->Safe, Safe->R&D - Del window
// [d_Run-1, d_Run+1] (as TD-10), out_LV_C1 OFF additionally tau - e >= 2000; Imm unchanged; opt.hvAbsentDiag as L2 (EMGREF-LV (2)).
// For L1 causes in these states use L1suLower (d_Run-2, C1 >= 2000; G3Q-1 table row "причина L1 X").
export function L2rd(c,S,Run,label='',diag=()=>{},opt={}){
 for(const k of Object.keys(Run)){const s=S[k],q=Run[k];if(opt.skip?.has(k))continue;if(s==='absent'||q==='absent'){absentErr(c,label,'L2-RD',k,s==='absent'?'state trace':'steady Run base');continue;}if(s==='n/a')continue;
  if(q==='n/a'||q===null){if(kind(k)==='Del'&&q===null)c(s===null,`${label}L2-RD Del ${k}: +${fmt(s)} while steady Run never changes it`);continue;}
  if(kind(k)==='Imm'){c(s!==null&&s<=q+1,`${label}L2-RD Imm ${k}: +${fmt(s)} vs steady Run +${q} (allowed <= ${q+1})`);continue;}
  if(s===null&&opt.hvAbsentDiag&&k==='out_HV_Discharge_Request'){diag(`${label}EMGREF-LV observation: no HV discharge request (steady Run +${q}); not asserted`);continue;}
  c(s!==null&&s>=q-1&&s<=q+1,`${label}L2-RD Del ${k}: +${fmt(s)} vs steady Run +${q} (G3Q-1 allowed [${q-1}, ${q+1}])`);
  if(k==='out_LV_C1'&&typeof s==='number')c(s>=2000,`${label}L2-RD Del out_LV_C1: +${s} (G3Q-1 absolute bound tau - e >= 2000)`);}}
// L3: candidate in_Estop_PLC in steady Run vs pinned reference offsets.
export function L3(c,S,REFP,label=''){
 for(const [k,q] of Object.entries(REFP)){const s=S[k];if(s==='absent'||s===undefined){absentErr(c,label,'L3',k,'candidate');continue;}if(q==='n/a')continue;
  if(s==='n/a'){c(false,`${label}L3 ${k}: candidate pre-state already at target, reference changes it (+${q})`);continue;}
  if(q===null){if(kind(k)==='Del')c(s===null,`${label}L3 Del ${k}: +${fmt(s)}, reference never`);continue;}
  if(kind(k)==='Imm')c(s!==null&&s<=q+1,`${label}L3 Imm ${k}: candidate +${fmt(s)} vs reference 4495a1f +${q} (allowed <= ${q+1})`);
  else c(s!==null&&s>=q&&s<=q+1,`${label}L3 Del ${k}: candidate +${fmt(s)} vs reference 4495a1f +${q} (allowed [${q}, ${q+1}])`);}}
// L4: status Emergency not later than the first Imm/Del change of the trace. excl (Set, optional): outputs whose change is the
// NORMAL descent step inside W_N (EMG-RD-L branch А, v5 §2 p.5) - not counted. No no-event profile is used (A11 removed).
export function L4(c,X,excl=null,label=''){if(excl!=null&&!(excl instanceof Set))throw Error('L4: excl must be a Set (A11 removed, G1 v4)');
 for(const [k,v] of Object.entries(X))if(v==='absent')absentErr(c,label,'L4',k,'trace');
 const st=X.status;if(st==='n/a'||st==='absent')return;
 const outs=Object.entries(X).filter(([k,v])=>k!=='status'&&typeof v==='number'&&!excl?.has(k));
 const first=outs.reduce((m,[k,v])=>v<m[1]?[k,v]:m,[null,Infinity]);
 c(st!==null&&(first[0]===null||st<=first[1]),`${label}L4: status Emergency (+${fmt(st)}) not later than the first emergency output change (${first[0]??'none'} +${first[1]===Infinity?'-':first[1]})`);}
// ---- EMG-RD-L (CRITERIA_DELTA v5 §2; replaces A11) ----
// Area: phases where the NORMATIVE descent without the event itself brings Del output o to its emergency target (Run->R&D
// STP-A/B, abort StartingRun STP-E/I, protective descent STP-G/H, R&D->Safe, WDG-03/Config rollbacks). Event at e:
// in_Estop_PLC (base L2 vs steady Run, run = its profile) or another cause (base L1 vs in_Estop_PLC in the same phase and
// scan, R = its profile; q_R still from run). qN: {key: ABSOLUTE scan q_N(o) from the descent criterion on scans of the
// same trace, or null if the trace lacks the reference scan}; only keys listed in qN are judged here (returned in skip;
// the caller passes skip to L1/L2 and excl to L4). W_N(o)=[q_N, q_N+1]; base window B = [e+q_R, e+q_R+1] (L2) or
// [e+tau_R-1, e+tau_R] (L1).
//  p.1 q_N >= e+q_R: literal base window.  p.2 q_N < e+q_R: (А) tau in W_N  or  (Б) tau in B; anything else FAIL
//   (delayed-but-not-to-the-chain, shortened tau < min(q_N, e+q_R), never). One branch per trace - mixing FAIL.
//  p.4 already at target before e ("n/a"): stays at target in every scan e..end.  p.5 L4 ignores branch-А changes.
// Q-T3-1: Vadim answered "А" (SCENARIO_DECISIONS.md §Q-T3-1, 2026-10-21: every step of the accepted descent "не позже
// нормального момента", moment = min(normal, chain)); v5 §2 last paragraph: answer (А) narrows p.2 to (А). Hence the
// normative mode is 'A'; mode 'AB' (the pre-answer disjunction) is kept for traceability and used only if this constant
// is changed after an analyst revision.
export const Q_T3_1='A';
// G1 v5 (review G1 v4 C2/C4): EMGRDL returns ledger {key: branch} - which clause actually judged each key:
//  'p.4' already at target, stays | 'p.1' literal base window | 'p.2A' branch А window W_N | 'p.2AB' pre-answer disjunction |
//  'missed-before-e' normal step due before e not performed (FAIL) | 'done-left' step performed in W_N before e and left
//  the target since (G1 v6: FAIL by Q-V7-01 "Г" + question 73 "А" - held as a level until the accepted lift; was BLOCKED in v5) |
//  'qN-null' (FAIL) | 'base:no-qR' / 'base:no-R' (key left to L1/L2) | 'absent' (ERROR).
// Callers assert the expected branch per sweep point with assertLedger (anti-vacuity C4/C5.2).
export function EMGRDL(c,X,{e,qN,run,R=null,log,end,label='',diag=()=>{},mode=Q_T3_1}){
 const skip=new Set(),excl=new Set(),onlyA=[],onlyB=[],seen=[],ledger={},nv=[];
 for(const [k,tg] of DEL){if(!(k in qN))continue;const x=X[k];
  if(x===undefined||x==='absent'){ledger[k]='absent';skip.add(k);absentErr(c,label,'EMG-RD-L',k,'trace');continue;}
  if(x==='n/a'){skip.add(k);ledger[k]='p.4';const bad=log.filter(s=>s.t>=e&&s.t<=end&&s.out[k]!==tg);
   c(bad.length===0,`${label}EMG-RD-L p.4 ${k}: at the emergency target before e, must stay there in every scan >= e; first off-target t=${bad[0]?.t} (+${bad[0]?bad[0].t-e:'-'})`);continue;}
  const qr=run?.[k];if(typeof qr!=='number'){ledger[k]='base:no-qR';continue;}// base rule (L1/L2) judges it
  let lo,hi,base;if(R){const r=R[k];if(typeof r!=='number'){ledger[k]='base:no-R';continue;}lo=e+r-1;hi=e+r;base=`L1 vs in_Estop_PLC same phase +${r}`;}
  else{lo=e+qr;hi=e+qr+1;base=`L2 vs steady Run +${qr}`;}
  const q=qN[k],tau=x===null?null:e+x,rel=v=>v==null?'never':`${v-e>=0?'+':''}${v-e}`;
  // Normal step due wholly before e (q_N+1 < e) and the output is not at target at e-1.
  if(q!=null&&q+1<e){const done=log.some(s=>s.t>=q&&s.t<=q+1&&s.out[k]===tg);
   if(done){// G1 v6 (Q-V7-01 "Г" + question 73 "А", SCENARIO_DECISIONS 71ad3f94…): a descent step once issued is held as a level
    // until the next ACCEPTED lift (R&D->Run grant / Config entry); no lift happens inside an Emergency -> "issued in W_N, withdrawn
    // before e" is a FAIL (was BLOCKED/NV in G1 v5). Judged here: not passed to L1/L2, not counted by L4.
    skip.add(k);excl.add(k);ledger[k]='done-left';
    c(false,`${label}EMG-RD-L ${k}: normal descent step performed in W_N [${rel(q)}, ${rel(q+1)}] before e and LEFT the target before e (re-assertion tau ${rel(tau)}) - ${k==='out_HV_Discharge_Request'?'HV discharge request withdrawn before the next accepted HV lift':'descent output left its target without an accepted lift'} (Q-V7-01 "Г", question 73 "А": held as a level until the accepted R&D->Run grant)`);
    continue;}
   skip.add(k);ledger[k]='missed-before-e';
   if(mode==='A'){c(false,`${label}EMG-RD-L p.2(А) ${k}: normal descent step due in W_N [${rel(q)}, ${rel(q+1)}] (before e) not performed (Q-T3-1 "А": never later than the normal moment); tau ${rel(tau)}`);continue;}}
  skip.add(k);
  if(q==null){ledger[k]='qN-null';c(false,`${label}EMG-RD-L ${k}: normative q_N not determinable on this trace (the descent reference scan is missing); tau ${rel(tau)}`);continue;}
  if(q>=e+qr){ledger[k]='p.1';c(tau!==null&&tau>=lo&&tau<=hi,`${label}EMG-RD-L p.1 ${k}: q_N ${rel(q)} >= e+q_R +${qr} -> literal ${base}: tau ${rel(tau)}, allowed [${rel(lo)}, ${rel(hi)}]`);continue;}
  const inA=tau!==null&&tau>=q&&tau<=q+1,inB=tau!==null&&tau>=lo&&tau<=hi;if(inA)excl.add(k);
  seen.push(`${k}: tau ${rel(tau)} W_N [${rel(q)}, ${rel(q+1)}] B [${rel(lo)}, ${rel(hi)}] -> ${inA&&inB?'А=Б':inA?'А':inB?'Б':'none'}`);
  if(mode==='A'){ledger[k]='p.2A';c(inA,`${label}EMG-RD-L p.2(А) ${k} (Q-T3-1 "А": not later than the normal descent moment, moment = min(q_N, e+q_R)): tau ${rel(tau)} must be in W_N [${rel(q)}, ${rel(q+1)}]`+(inB?' - observed the chain moment (branch Б), excluded by Q-T3-1 "А"':tau!==null&&tau<q?' - shortened (earlier than q_N)':' - delayed beyond W_N'));}
  else{ledger[k]='p.2AB';c(inA||inB,`${label}EMG-RD-L p.2 ${k}: tau ${rel(tau)} neither in W_N [${rel(q)}, ${rel(q+1)}] (А) nor in ${base} [${rel(lo)}, ${rel(hi)}] (Б)`);
   if(inA&&!inB)onlyA.push(k);if(inB&&!inA)onlyB.push(k);}}
 if(mode!=='A')c(!(onlyA.length&&onlyB.length),`${label}EMG-RD-L p.2: one branch per trace - mixed А (${onlyA}) and Б (${onlyB})`);
 if(seen.length)diag(`${label}EMG-RD-L branches: ${seen.join('; ')}`);
 diag(`${label}EMG-RD-L ledger: ${JSON.stringify(ledger)}`);
 return {skip,excl,ledger,nv};}
// Ledger assertion (C4): expected = {key: [allowed branches]} derived from the NORMATIVE relation of q_N and e+q_R at the
// sweep point (not from the trace). A key missing from the ledger or judged by another clause -> FAIL (vacuity guard).
// Returns the number of executed normative EMG-RD-L assertions (p.1/p.2A/p.4) for the report.
export const EXEC_BRANCHES=['p.1','p.2A','p.2AB','p.4'];
export function assertLedger(c,ledger,expected,label=''){let n=0;
 for(const [k,allowed] of Object.entries(expected)){const b=ledger?.[k];
  const ok=c(allowed.includes(b),`${label}EMG-RD-L ledger (C4): ${k} judged by '${b??'not judged'}', expected one of [${allowed}] at this point`);
  if(ok&&EXEC_BRANCHES.includes(b))n++;}
 return n;}
// ---- N=u branch (ii) of IL-02/IL-05a (CRITERIA_DELTA_v6 §4, READY-D) - G1 v5 extracted from current-e2b-cover-transitions
// for self-tests; C3 (review G1 v4): SS1 released in [a, a+1] is measured like STO/C2. ----
// log: trace X (cover lost from u=N); a = first scan >= u with STO released or C2 ON in X; Rp = rule-L profile of R (same drive,
// cover closed, in_Estop_PLC from c_R = a_R+1), d_R(o) = Rp[o]; PX = profile of X from u-1.
// Del o: u+d_R-1 <= tau_X <= a+1+d_R; Imm o (incl. SS1, v6 §3): tau_X <= a+1+d_R. Outputs RELEASED in [a, a+1] by the acceptance
// itself (STO_DR1/2, C2 ON, SS1_DR1/2 TRUE) are timed from their return: tau_X = first scan after the last released scan of
// [a, a+1] where the output is back at the emergency target. Not released in [a, a+1] -> not timed here (EMGREF(2) from a+2).
export const NU_RELEASE=['STO_DR1','STO_DR2','out_HV_C2','out_SS1_DR1','out_SS1_DR2'];
export function nuII(ck,{log,N,a,Rp,PX,diag=()=>{}}){const DELK=DEL.map(([k])=>k);let timed=0;
 for(const [k,tg] of [...IMM,...DEL]){const d=Rp[k];const isDel=DELK.includes(k);
  if(d==='absent'||d===undefined||PX[k]==='absent'||PX[k]===undefined){absentErr(ck,'(ii) ','N=u',k,d==='absent'||d===undefined?'reference R':'trace X');continue;}
  let tau,released=false;
  if(NU_RELEASE.includes(k)){const up=log.filter(s=>s.t>=a&&s.t<=a+1&&s.out[k]!==tg).map(s=>s.t);
   if(up.length){released=true;const b=log.find(s=>s.t>up.at(-1)&&s.out[k]===tg)?.t;tau=b??null;}
   else if(PX[k]==='n/a'){diag('(ii) '+k+' not released in [a, a+1] - not timed (EMGREF(2) forbids a later release)');continue;}}
  if(!released){if(PX[k]==='n/a')continue;tau=PX[k]===null?null:N+PX[k];}
  if(d==='n/a'){// R needs no change of o: no d_R exists. A release by the acceptance in X then has no normative bound here.
   if(released){const m='(ii) '+k+' released in [a, a+1] in X but already at target in the reference R (no d_R) - return moment not normed by v6 §4';ck.nv?.(m);diag(m);}
   continue;}
  if(d===null){if(isDel)ck(tau===null,'(ii) '+k+': changed at '+tau+' while the in_Estop_PLC reference never changes it');
   else if(released)diag('(ii) Imm '+k+': the in_Estop_PLC reference R never returns it (d_R never; R itself judged by L2) - tau_X '+tau+' not bounded here');continue;}
  const hi=a+1+d,lo=N+d-1;timed++;
  ck(tau!==null&&tau<=hi&&(!isDel||tau>=lo),'(ii) v6 §4 '+(isDel?'Del':'Imm')+' '+k+(released?' (timed from its return after the release in [a, a+1])':'')+': tau_X='+tau+' (offset from u '+(tau==null?'never':tau-N)+'), allowed '+(isDel?'['+lo+', '+hi+']':'<= '+hi)+' (u='+N+', a='+a+', d_R='+d+')');}
 return timed;}
// EMGREF(1) without the absolute bound: Emergency appears (moment by L1..L4) and is latched until latchEnd.
export function latched(c,log,e,latchEnd,label=''){const seg=log.filter(s=>s.t>=e&&s.t<=latchEnd);const i=seg.findIndex(isEmg);
 const bad=i<0?seg:seg.slice(i).filter(s=>!isEmg(s));
 c(i>=0&&bad.length===0,`${label}EMGREF(1): status Emergency reached (first +${i<0?'never':seg[i].t-e}) and latched until the final Restart; ${bad.length} later scans not Emergency, first t=${bad[0]?.t} [${bad[0]?.statuses}]`);}
// EMGREF-RUN status part (review G1 v3 N3; CRITERIA v2 EMGREF-RUN, IL-05a, rule L): from the FIRST scan with status Emergency
// no STS_RUN (no return to / confirmation of Run); the moment of that first scan is bounded only by L1..L4 (no absolute
// "STS_RUN gone in scan e"). wasRun=false (StartingRun, IL-05a "Run не подтверждается после c"): additionally no NEW Run
// confirmation in any scan >= e. The stage memory is judged only through the status and E2-01 (no own bound on b_Step3).
// The exact moment of Run->Emergency (C-A1, analyst) is left to L1..L4.
export function noRunAfter(c,log,e,end,wasRun,label=''){const seg=log.filter(s=>s.t>=e&&s.t<=end);const i=seg.findIndex(isEmg);
 const after=i<0?[]:seg.slice(i).filter(s=>s.statuses.includes('STS_RUN'));
 c(after.length===0,`${label}EMGREF-RUN: no STS_RUN from the first Emergency scan (+${i<0?'never':seg[i].t-e}); ${after.length} scans, first t=${after[0]?.t}`);
 if(!wasRun){const nr=seg.filter(s=>s.statuses.includes('STS_RUN'));c(nr.length===0,`${label}EMGREF-RUN/IL-05a: Run not confirmed after the event (pre-state not Run); first STS_RUN at +${nr[0]?nr[0].t-e:'-'}`);}}
// Diagnostic only: first differences of outputs NOT covered by rule L (SS1, outPLC_STO_*, b_EStop_Ok; out_EStop_Status excluded).
export function otherDiffs(A,B,e){const keys=Object.keys(A[0]?.out??{}).filter(k=>![...IMM,...DEL].some(([n])=>n===k)&&k!=='out_EStop_Status');const d=[];
 for(let i=0;i<A.length&&i<B.length&&d.length<4;i++)for(const k of keys)if(A[i].out[k]!==B[i].out[k]){d.push(`+${A[i].t-e} ${k}: ${A[i].out[k]}/${B[i].out[k]}`);break;}return d;}
// Reference 4495a1f, in_Estop_PLC TRUE in steady Run (C3/BMS set), measured with helpers/e2-emergency.js refAnchorProfile()
// on the pinned reference (A12) on 2026-10-21; SAL efddc60b...0dc334, SGVL 8020e3d6...b5e757. Re-measured by the stand
// test "E2-STAND L3 ..." (current-e2a-emg-anchor.test.js); a drift there is a stand error, not a candidate verdict.
// G1 v4: + out_SS1_DR1/2 +3 (v6 §3; L3 bound <= +4), re-measured 2026-10-21 with the same helper on the same pinned SHA.
export const REF_RUN_PLC=Object.freeze({status:1,out_C3_BatRelay:4,out_RBM_Bat:4,out_LV_Discharge_Request:3,out_Door_Unlock_Solonoeid:'n/a',
 out_SS1_DR1:3,out_SS1_DR2:3,out_LV_C1:2004,STO_DR1:7006,STO_DR2:7006,out_HV_Discharge_Request:7008,out_HV_C2:8009});
// L3-Safe (CRITERIA_DELTA_v6 §2): reference 4495a1f, in_Estop_PLC in steady Safe, measured with e2-emergency.js refSafeProfile()
// on the same pinned SAL efddc60b…0dc334 / SGVL 8020e3d6…b5e757 (2026-10-21). Only status is normative (<= +2); the LV/HV
// discharge requests (never on the reference) are observations; everything else is already at target (n/a).
export const REF_SAFE_PLC=Object.freeze({status:1,out_C3_BatRelay:'n/a',out_RBM_Bat:'n/a',out_LV_Discharge_Request:null,out_Door_Unlock_Solonoeid:'n/a',
 out_SS1_DR1:'n/a',out_SS1_DR2:'n/a',out_LV_C1:'n/a',STO_DR1:'n/a',STO_DR2:'n/a',out_HV_Discharge_Request:null,out_HV_C2:'n/a'});
