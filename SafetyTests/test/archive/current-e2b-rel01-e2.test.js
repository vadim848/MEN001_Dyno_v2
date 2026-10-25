// E2 G1 v6 (v2-tester) — REL01-e2: a permit episode during a held BOTH (review G1 v5 §6 N7).
// Oracle: program/analyst/E2-plan-v4-questions/CRITERIA.md 5d6bcc1a…120b §4 (READY-D; SPEC §5.1 / EMG-003 "after restoration a
// NEW gesture is required", IL-02, CVR-004, BTN-001/002, SPEC §3.1 p.10, Q-REL-AFTER-PERMIT "А", V14-Q7 "Б1", EMG-004 / Q-RC-14,
// Q-RC-03(a)); classification READY-D confirmed in E2-plan-v5-questions/CRITERIA.md §7.
// Initial: steady Safe (R0, buttons released > 2000 ms, no SafetyFault) / steady R&D (NC1/NC2 TRUE).
// Gesture: blue at f, green at p = f+100 (p-f <= 250), both held until Q+100, Q = p+1000 (T_BOTH); both released at rb = Q+101.
// Episode [s, r): permit FALSE in scans s..r-1, r = first restored scan. Safe: in_LV_Connector_Interlock / in_HV_Connector_Interlock /
// both; R&D (R&D->Run): in_InterLock_NC_1 / NC_2 / both.
//  refused: [p+500, p+999), [p+1, p+2), [p+500, p+501), [f, p+300), [f-300, f+10), [Q-1, Q+1) (covers Q), [p+800, p+1300) -> no
//    transition, no lift (Safe: C1 ON command; R&D: C2 ON / STO release), no fault, no Emergency; the held gesture is not executed
//    after r or after Q (observed until Q+3000).
//  accepted: r <= f-1 ([f-300, f-1)).  r = f: observation.  s >= Q: G1 v8 REL01-e2-LATE (analyst E2-G1-v7-m §1, TD-07) - replaces the
//    former rows "s = Q+2: accepted, then Emergency" and "s in {Q, Q+1}: observation" (see the block below).
//  after a refusal: new BOTH after release 1999 ms refused, 2001 ms accepted (2000 observation, not written).
//  control: Safe with NC1/NC2 FALSE [p+500, p+999) -> Safe->R&D accepted (V14-Q7 "Б1": the cover is not a Safe->R&D permit).
// G1 v7 (N15, review G1 v6; analyst E2-G1-v6-q §1 recommendation): "accepted" = TEAM-DEFAULT TD-06: no lift in any scan <= Q-1 and the
// first lift <= Q+400 (exact scan - diagnostic); "refused" = no lift until >= Q+1500 (observed to Q+3000 / Q2+1600). Was "<= Q+1500".
// Fault: SafetyFault NV (A8).
// Assumptions A1..A9 helpers/e2-lifecycle.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,BLUE,OFF}=L;
const CASES={'Safe LV connector':{base:'Safe',sig:['in_LV_Connector_Interlock']},'Safe HV connector':{base:'Safe',sig:['in_HV_Connector_Interlock']},
 'Safe both connectors':{base:'Safe',sig:['in_LV_Connector_Interlock','in_HV_Connector_Interlock']},
 'R&D NC1':{base:'RnD',sig:['in_InterLock_NC_1']},'R&D NC2':{base:'RnD',sig:['in_InterLock_NC_2']},'R&D NC1+NC2':{base:'RnD',sig:['in_InterLock_NC_1','in_InterLock_NC_2']}};
const lifted=(cs,s)=>cs.base==='Safe'?s.out.out_LV_C1:(s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);
// TD-06 "accepted": no lift in [from, Q-1], first lift in [Q, Q+400]; moment -> diagnostic.
function accepted(t,c,x,lift,from,Q,label=''){const seg=x.log.filter(s=>s.t>=from);const early=seg.find(s=>s.t<=Q-1&&lift(s));
 c(!early,`${label}no lift in any scan <= Q-1 (TEAM-DEFAULT TD-06 (1)); first early lift Q${early?early.t-Q:''}`);const l=seg.find(lift);
 t.diagnostic(`TD-06 observation ${label}first lift ${l?'Q+'+(l.t-Q):'never'}`);c(l&&l.t<=Q+400,`${label}accepted: first lift <= Q+400 (TEAM-DEFAULT TD-06 (2)); first lift ${l?'Q'+(l.t-Q>=0?'+':'')+(l.t-Q):'never'}`);return l;}
// drives the gesture with an episode; returns {x,f,p,Q,rb}
function drive(cs,sig,ep,{tail=3000,from}={}){const x=from??L.cached(cs.base);x.step(OFF,400);const f=x.t+301,p=f+100,Q=p+1000,rb=Q+101;const [s,r]=ep({f,p,Q});
 const end=Q+tail;while(x.t<end){const n=x.t+1;const o={};const v=!(n>=s&&n<r);for(const k of sig)o[k]=v;
  if(n===f)Object.assign(o,BLUE);if(n===p)Object.assign(o,BOTH);if(n===rb)Object.assign(o,OFF);x.step(o);}
 return {x,f,p,Q,rb,s,r};}
function refused(c,cs,d,label=''){const {x,f}=d;const pre=x.log.find(s=>s.t===f-1);const seg=x.log.filter(s=>s.t>=f);
 const l=seg.find(s=>lifted(cs,s));c(!l,`${label}refused: no lift in any scan (also after the permit restoration r=${d.r} and after Q=${d.Q}: a held gesture is not a new gesture, SPEC §5.1 / IL-02); first lift t=${l?.t}`);
 const st=seg.find(s=>s.stages.join()!==pre.stages.join()||s.statuses.join()!==pre.statuses.join());c(!st,`${label}no transition (state ${pre.stages}/${pre.statuses}); first change t=${st?.t} ${st?.stages}/${st?.statuses}`);
 const e=seg.find(L.isEmg);c(!e,`${label}no Emergency (episode in ${cs.base} only blocks the lift, EMG-003); first t=${e?.t}`);
 if(x.sf){const b=seg.find(s=>s.out[x.sf]);c(!b,`${label}no SafetyFault; first t=${b?.t}`);}else c.nv(`${label}no fault - no SafetyFault symbol (A8)`);}
const EP=[['[p+500, p+999)',({p})=>[p+500,p+999]],['[p+1, p+2) (1 scan)',({p})=>[p+1,p+2]],['[p+500, p+501) (1 scan)',({p})=>[p+500,p+501]],['[f, p+300)',({f,p})=>[f,p+300]],
 ['[f-300, f+10)',({f})=>[f-300,f+10]],['[Q-1, Q+1) (s <= Q-1 < Q < r, covers the threshold)',({Q})=>[Q-1,Q+1]],['[p+800, p+1300)',({p})=>[p+800,p+1300]]];
for(const [cn,cs] of Object.entries(CASES)){
 for(const [en,ep] of EP)test(L.T(`E2b REL01-e2 ${cn}: permit FALSE ${en} during the held BOTH -> refused, no fault/Emergency, the held gesture not executed after restoration`),t=>{
  const d=drive(cs,cs.sig,ep);const c=L.checks();refused(c,cs,d);c.finish(t,`violated checks (f=${d.f}, p=${d.p}, Q=${d.Q}, episode [${d.s}, ${d.r}))`);});
 test(L.T(`E2b REL01-e2 ${cn}: permit restored before the first press (r = f-1) -> BOTH accepted (first lift <= Q+400, TEAM-DEFAULT TD-06)`),t=>{
  const d=drive(cs,cs.sig,({f})=>[f-300,f-1]);const c=L.checks();const l=d.x.log.find(s=>s.t>=d.f&&lifted(cs,s));
  accepted(t,c,d.x,s=>lifted(cs,s),d.f,d.Q,'REL-01(a)/(b)/(c), Q-REL-AFTER-PERMIT: ');c.finish(t);});
 test(L.T(`DIAG observation E2b REL01-e2 ${cn}: permit restored exactly at the first press (r = f)`),t=>{
  let d;try{d=drive(cs,cs.sig,({f})=>[f-300,f]);}catch(err){t.diagnostic('unavailable: '+err.message);return;}const l=d.x.log.find(s=>s.t>=d.f&&lifted(cs,s));t.diagnostic(`first lift ${l?'Q+'+(l.t-d.Q):'never'}`);});
 // G1 v8 (lead 2026-10-22; analyst E2-G1-v7-m 'REL01-e2-LATE', READY-D; measure TEAM-DEFAULT TD-07 refining TD-06): episode [s, s+100) with s >= Q.
 //  l = first lift output scan >= f; a = first scan >= f with a lift-transition stage (Safe: b_Step12/b_Step_RnD/b_Step3; R&D: b_Step3; emergency stages excluded).
 //  l >= s+1 or a >= s+1 -> FAIL (deferred lift through the permit loss: SPEC §5.1/EMG-003, IL-02, EMG-011, EMG-004/005, D-TEAM p.1);
 //  a <= s (or a lift l <= s) -> Emergency required, no new lift rise in [s+1, end] ("accepted without Emergency" forbidden; a = s / l = s
 //  is the q observation where only refusal-without-energy or accepted+Emergency are allowed); a and l never -> refusal: initial stage in
 //  every scan, no Emergency, no SafetyFault (NV). The Emergency moment is diagnostic here (EMG-004 / Q-RC-03(a) bounds are judged elsewhere).
 // G1 v9 TD-13 (REL01-e2-LATE-A, analyst E2-G1-v8-q §4.2): a := A by TD-08 on the no-episode fork X0 - R&D->Run: first scan >= f with recRndC_SU TRUE,
 // out_HV_C2 TRUE or STO released; Safe->R&D: b_Step12 or out_LV_C1. recRndC_SU absent (R&D) -> ERROR precondition (acceptance not attributed).
 const SU='recRndC_SU';
 const x0memo=new Map();const X0=(cn,cs)=>{if(!x0memo.has(cn)){try{const b=L.cached(cs.base);let su=null;if(cs.base!=='Safe'&&L.hasName(SU))b.listeners.push((q,y)=>{if(su==null&&y.r.get(SU))su=q.t;});
   const d=drive(cs,cs.sig,()=>[0,0],{tail:6000,from:b});const seg=d.x.log.filter(q=>q.t>=d.f);
   const out=cs.base==='Safe'?seg.find(q=>q.stages.includes('b_Step12')||q.out.out_LV_C1)?.t:seg.find(q=>q.out.out_HV_C2||q.out.STO_DR1||q.out.STO_DR2)?.t;
   d.A=cs.base==='Safe'?out??null:(L.hasName(SU)?Math.min(...[su!=null&&su>=d.f?su:null,out].filter(v=>v!=null)):null);if(d.A===Infinity)d.A=null;
   d.Aerr=cs.base!=='Safe'&&!L.hasName(SU)?'ERROR precondition (TD-13): Symbol recRndC_SU absent - acceptance point A not attributed (no fallback to outputs)':null;
   x0memo.set(cn,{d});}catch(e){x0memo.set(cn,{error:e});}}
  const m=x0memo.get(cn);if(m.error)throw m.error;return m.d;};
 const l0of=(cn,cs)=>{const d=X0(cn,cs);const l=d.x.log.find(s=>s.t>=d.f&&lifted(cs,s));return {l0:l?.t??null,Q:d.Q,f:d.f};};
 const UPST=cs.base==='Safe'?['b_Step12','b_Step_RnD','b_Step3']:['b_Step3'];// lift-transition stages (emergency stages b_Step4/5/6 excluded)
 const LIFT_SIG=cs.base==='Safe'?['out_LV_C1']:['out_HV_C2','STO_DR1','STO_DR2'];
 function late(t,c,d,{mustAccept=false}={}){const {x,f,s,Q}=d;const pre=x.log.find(q=>q.t===f-1);const init=pre.stages.join();const seg=x.log.filter(q=>q.t>=f);
  const x0=X0(cn,cs);
  const l=seg.find(q=>lifted(cs,q))?.t??null,e=seg.find(q=>q.t>=s&&L.isEmg(q))?.t??null;
  const rel=v=>v==null?'never':'s'+(v-s>=0?'+':'')+(v-s);
  // G1 v9.1 (review m-30; v8-q §4.2): A-independent checks first - no first lift >= s+1 (incl. after the restoration) and no new lift rise >= s;
  // a missing recRndC_SU is then an ERROR precondition of the A-dependent rows only.
  if(x0.Aerr){c(l==null||l<=s,`no first lift in any scan >= s+1 (A-independent): l=${rel(l)}`);const rs0=LIFT_SIG.flatMap(k=>L.rises(x.log.filter(q=>q.t>=s-1),k).map(v=>k+'@'+rel(v)));c(rs0.length===0,'no new lift rise in any scan >= s (A-independent): '+rs0.slice(0,4));
   if(l==null&&e==null){const em=seg.find(L.isEmg);c(!em,`refusal without Emergency (A-independent); first ${rel(em?.t)}`);}c(false,x0.Aerr);return;}
  const A=x0.A;
  t.diagnostic(`REL01-e2-LATE-A observation: s=Q+${s-Q}, A=${rel(A)} (X0, TD-08), l=${rel(l)} (Q${l==null?'':(l-Q>=0?'+':'')+(l-Q)}), first Emergency ${rel(e)}`);
  c(A!=null,'stand precondition: the no-episode control X0 accepts the gesture (A observed)');if(A==null)return;
  c(l==null||l<=s,`no first lift in any scan >= s+1 (incl. the restoration scan r=${d.r}; TD-07 / SPEC §5.1 / EMG-011 / D-TEAM p.1): l=${rel(l)}`);
  // no NEW lift rise in any scan >= s (s vs s-1 included): invariant L Imm, E2b-dev §2.3, COV-1 - for every row of TD-13
  const rs=LIFT_SIG.flatMap(k=>L.rises(x.log.filter(q=>q.t>=s-1),k).map(v=>k+'@'+rel(v)));c(rs.length===0,`no new lift rise (C2 ON / STO release / C1 ON) in any scan >= s (TD-13): ${rs.slice(0,4)}`);
  if(mustAccept){const early=seg.find(q=>q.t<=Q-1&&lifted(cs,q));c(!early,'no lift <= Q-1 (TD-06 (1))');c(A<=s-1,`acceptance before the episode: A <= s-1 (TD-06 + TD-13): A=${rel(A)}`);}
  if(A<=s-1){c(e!=null,`A <= s-1 -> Emergency required (${cs.base==='Safe'?'EMG-004 / Q-RC-14 "А"':'StartingRun -> Emergency, Q-RC-03(a) "Б"'}; TD-13): ${rel(e)}`);
   t.diagnostic(`outcome: ${l!=null&&l<=s-1?'lift output before s':'no lift output at all'} (both allowed, TD-13)`);}
  else if(A===s){t.diagnostic(`A = s: observation (TD-08 c = A) - outcome ${e!=null?'(ii) Emergency':'(i) refused'}`);
   // G1 v9 m-21 (analyst E2-G1-v8-r §2): (i) refusal at A = s counts only with no Emergency/fault, no lift to the end, main state unchanged in every
   // scan, and a new gesture after >= 2001 ms full release accepted (first lift <= Q2+400, TD-06). (ii) Emergency without increase. Lift without Emergency forbidden.
   if(e==null){const em=seg.find(L.isEmg);c(!em,`(i) refused without Emergency; first ${rel(em?.t)}`);c(l==null,`(i) no lift in any scan to the end (TD-07); l=${rel(l)}`);
    const ms=cs.base==='Safe'?'STS_SAFE':'STS_RND';const m=seg.find(q=>!(q.statuses.length===1&&q.statuses[0]===ms));c(!m,`(i) main state ${ms} in every scan; first ${rel(m?.t)} ${m?.statuses}`);
    if(x.sf){const b=seg.find(q=>q.out[x.sf]);c(!b,'(i) no SafetyFault');}else c.nv('(i) no fault - no SafetyFault symbol (A8)');
    x.step(OFF,2001);const p2=x.t+1;x.step(BOTH,1100);x.step(OFF,1500);const l2=L.firstAt(x.log.filter(q=>q.t>=p2),q=>lifted(cs,q));c(l2!=null&&l2>=p2+1000&&l2<=p2+1400,`(i) a new gesture after >= 2001 ms release is accepted (first lift in [Q2, Q2+400]); first p2+${l2==null?'never':l2-p2}`);}}
  else{const st=seg.find(q=>q.stages.join()!==init);c(!st,`A >= s+1 in X0 -> in X the transition must not start during/after the episode (TD-07/TD-13): initial stage ${init} in every scan; first change t=${st?.t} ${st?.stages}`);
   const em=seg.find(L.isEmg);c(!em,`refused without Emergency (EMG-003, IL-02); first ${rel(em?.t)}`);
   if(x.sf){const bb=seg.find(q=>q.out[x.sf]);c(!bb,`refused without SafetyFault; first ${rel(bb?.t)}`);}else c.nv('refused without fault - no SafetyFault symbol (A8)');}}
 const SRC=cs.base==='Safe'?'EMG-004 / Q-RC-14':'StartingRun -> Emergency, Q-RC-03(a)';
 for(const k of [0,1,2])test(L.T(`E2b REL01-e2-LATE-A ${cn}: permit FALSE from s = Q+${k} for 100 ms -> refused without energy/fault/Emergency, or transition started <= s with Emergency; first lift or transition stage at >= s+1 (deferred through the permit loss) forbidden (TD-07)`),t=>{
  const d=drive(cs,cs.sig,({Q})=>[Q+k,Q+k+100],{tail:6000});const c=L.checks();late(t,c,d);c.finish(t,`violated checks (Q=${d.Q}, episode [${d.s}, ${d.r}))`);});
 test(L.T(`E2b REL01-e2-LATE-A ${cn}: permit FALSE from s = Q+401 for 100 ms -> lift accepted before s (<= Q+400, TD-06), then Emergency (${SRC}); no new lift after s (TD-07)`),t=>{
  const d=drive(cs,cs.sig,({Q})=>[Q+401,Q+501],{tail:6000});const c=L.checks();late(t,c,d,{mustAccept:true});c.finish(t,`violated checks (Q=${d.Q}, episode [${d.s}, ${d.r}))`);});
 for(const [nm,dl] of [['l0',0],['l0+1',1]])test(L.T(`E2b REL01-e2-LATE-A ${cn}: permit FALSE from s = ${nm} for 100 ms (l0 = first lift of the no-episode control X0) -> ${dl?'lift already issued: Emergency required':'coinciding scan (q): refused without energy or accepted with Emergency'}; no lift / stage at >= s+1 (TD-07)`),t=>{
  const {l0,Q}=l0of(cn,cs);const c=L.checks();c(l0!=null,`stand precondition: the no-episode control X0 lifts (l0=${l0==null?'never':'Q+'+(l0-Q)})`);
  if(l0!=null){const d=drive(cs,cs.sig,()=>[l0+dl,l0+dl+100],{tail:6000});c(d.Q===Q,'stand precondition: same Q in X0 and X');t.diagnostic(`l0=Q+${l0-Q}`);
   late(t,c,d,{mustAccept:dl===1});}c.finish(t,`violated checks (l0=${l0})`);});
 for(const [gap,acc] of [[1999,false],[2001,true]])test(L.T(`E2b REL01-e2 ${cn}: after the refusal ([p+500, p+999)), both released ${gap} ms -> new BOTH ${acc?'accepted (first lift <= Q2+400, TD-06)':'refused'} (BTN-001/002, SPEC §3.1 p.10)`),t=>{
  const d=drive(cs,cs.sig,({p})=>[p+500,p+999],{tail:101});const x=d.x;const c=L.checks();c(!x.log.some(s=>s.t>=d.f&&lifted(cs,s)),'precondition: first gesture refused');
  x.step(OFF,gap-1);const p2=x.t+1;c(p2===d.rb+gap,`stand precondition: new press at rb+${gap} (rb=${d.rb}, p2=${p2})`);x.step(BOTH,1100);x.step(OFF,1500);
  if(acc)accepted(t,c,x,s=>lifted(cs,s),p2,p2+1000,'release 2001 ms: new gesture ');else{const l=x.log.find(s=>s.t>=p2&&lifted(cs,s));c(!l,`release 1999 ms: new gesture refused (no lift until Q2+1600); lifted at p2+${l?l.t-p2:'-'}`);}c.finish(t);});
}
for(const sig of [['in_InterLock_NC_1'],['in_InterLock_NC_2']])test(L.T(`E2b REL01-e2 control: steady Safe, ${sig[0]} FALSE [p+500, p+999) during BOTH -> Safe->R&D accepted, first C1 ON <= Q+400 (V14-Q7 "Б1": the cover is not a Safe->R&D permit; TD-06)`),t=>{
 const d=drive({base:'Safe'},sig,({p})=>[p+500,p+999]);const c=L.checks();const l=d.x.log.find(s=>s.t>=d.f&&s.out.out_LV_C1);
 accepted(t,c,d.x,s=>s.out.out_LV_C1,d.f,d.Q,'Safe->R&D ');c.finish(t);});
// G1 v8 (lead 2026-10-22; architect PLAN v7.3 D-E2b-1 / D-E2b-3(б), kill targets M-E2b-42/43, also M-E2b-44/45 by the positive part). Oracle (not the
// plan): REL-01(c), IL-02, SPEC §5.1 / EMG-003 (after restoration a NEW gesture is required), TD-07, BTN-001 (2 s full release); acceptance after
// the new gesture: MOD-002 (Run) / MOD1-01 (R&D). Episode 200 ms [p+500, p+700) while BOTH is held (p..p+1099).
for(const [cn,cs,endName,isEnd] of [['R&D NC1',CASES['R&D NC1'],'Run',x=>L.statusIs(x,'STS_RUN')&&x.stageSet().join()==='b_Step3'],
 ['R&D NC2',CASES['R&D NC2'],'Run',x=>L.statusIs(x,'STS_RUN')&&x.stageSet().join()==='b_Step3'],
 ['Safe LV connector',CASES['Safe LV connector'],'R&D',x=>x.stageSet().join()==='b_Step_RnD'&&x.get('out_LV_C1')],
 ['Safe HV connector',CASES['Safe HV connector'],'R&D',x=>x.stageSet().join()==='b_Step_RnD'&&x.get('out_LV_C1')]])
 test(L.T(`E2b REL01-e2 ${cn}: permit FALSE 200 ms [p+500, p+700) while BOTH is held -> stays ${cs.base==='Safe'?'Safe':'R&D'} (no lift, no transition, no Emergency) until rb+2100; new BOTH after 2100 ms full release -> ${endName} (REL-01(c), IL-02, SPEC §5.1, TD-07; MOD-002 / MOD1-01)`),t=>{
  const d=drive(cs,cs.sig,({p})=>[p+500,p+700],{tail:101});const x=d.x;const c=L.checks();x.step(OFF,2099);
  const seg=x.log.filter(s=>s.t>=d.f);const pre=x.log.find(s=>s.t===d.f-1);const l=seg.find(s=>lifted(cs,s));c(!l,`first gesture: no lift in any scan to rb+2100 (held gesture spoiled by the episode); first t=${l?.t}`);
  const st=seg.find(s=>s.stages.join()!==pre.stages.join());c(!st,`first gesture: state ${pre.stages} kept; first change t=${st?.t} ${st?.stages}`);
  const e=seg.find(L.isEmg);c(!e,`no Emergency (episode in ${cs.base} before acceptance only blocks the lift, EMG-003); first t=${e?.t}`);
  const p2=x.t+1;c(p2-d.rb>=2001,`stand precondition: new press after >= 2001 ms full release (rb=${d.rb}, p2=${p2})`);x.step(BOTH,1100);x.step(OFF);
  let ok=false;for(let i=0;i<6000&&!ok;i++){x.step();ok=isEnd(x);}c(ok,`new gesture accepted -> ${endName} within 6000 ms after the release; stages=${x.stageSet()} statuses=${x.statusSet()}`);
  c.finish(t,`violated checks (episode [${d.s}, ${d.r}), p2=${p2})`);});
