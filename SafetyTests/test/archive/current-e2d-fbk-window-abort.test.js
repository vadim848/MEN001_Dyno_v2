// E2 G1 v8 (v2-tester) — FBK-05/06 rewritten after review G1 v7 N16 (N11 -> N16).
// Oracle: program/analyst/E2-G1-v7-q/CRITERIA.md 4f6d2916… (replaces E2-plan-v5-questions §5):
//  §1 (READY; D-STARTINGRUN-GREEN-DOWN "после полной очистки", V14-Q12/Q13 "новая", SPEC §3.1 p.1/2/9/10/11, BTN-001/002/007,
//     Vadim confirmations 2026-10-21 p.9/p.11): an abort green is valid only after BOTH buttons were FALSE continuously 2000 ms from rb
//     (rb = first scan with both released after the BOTH gesture) and then green alone 500 ms. Front <= rb+1999: invalid, nothing changes,
//     no deferred execution; rb+2000 observation; >= rb+2001 valid.
//  §2: FBK-05/06 points a_b in {u+10, u+300, u+499} are unreachable by the button (earliest button abort >= Q+2502 > w).
//  §3.1 FBK-05/06-CMD (abort by CMD_* front inside the window) - BLOCKED-E4 (E4 frozen, no CMD_* in the interface): todo, never PASS.
//  §3.2 FBK-05/06-W (READY, E6): the v7 stimulus (BOTH p..Q+1, rb = Q+2, green 600 ms from u+a_b, a_b in {10,300,499}; FBK never ON or
//     ON u+1..u+199 then FALSE) compared scan by scan with X0 = the same inputs WITHOUT the green: window rollback (05 WDG-03 / Q-RC-12:
//     abort-StartingRun sequence + SafetyFault; 06 WDG-01: rollback to Safe + SafetyFault), rollback start not later than w+1 (no rollback
//     inside [u, w-1]: E2-G1-v4/CRITERIA_DELTA_v7 §4.0), X == X0 in every scan, SafetyFault <= w+1 (NV until the symbol, A8), no Emergency
//     (Q-V4-01), the FBK drop at u+200 inside the window is not an Emergency.
//  §3.3 FBK-05/06-NEG (READY): transition held by Faulty TRUE (05 HV Faulty: StartingRun, WDG-03 30 s / Q-RC-RUNCONF-01; 06 LV Faulty:
//     Safe->R&D, WDG-02), invalid green (a) rb+10/300/1999 600 ms, (b) rb+1999 held to rb+3000, (c) rb+300 600 ms then again after 1999 ms
//     -> no abort / descent / SafetyFault in [g0, h-1], h = max(end of last green, rb+3500)+1000 = Faulty FALSE; then RUN-CONF-T /
//     RND-CONF-T (TD-02): K = h, no Run/R&D <= h+99, Run/R&D at h+101 and kept (no deferred execution of the old green).
//  §3.4 FBK-05/06-POS (READY-D): same base, valid green g0 in {rb+2001 (q+1), rb+5000}, rb+2000 DIAG (q); 499 ms -> no abort (BTN-003 q-1).
//     05 (STP-E / V14-Q12 / D-STARTINGRUN-NO-COAST): no abort signs [g0, g0+499]; STO active <= g0+502; Discharge <= g0+503 held as a level
//     (Q-V7-01 "Г"); no SS1; C2 OFF not before t_d+T_DIS; R&D after C2_FBK OFF; C1 kept, no R&D->Safe (E2-01); after R&D HV Faulty FALSE ->
//     no Run / C2 ON / STO release for 3000 ms. 06 (V14-Q13 / PLC-09(b)): no abort signs [g0, g0+499]; C1 OFF after a (moment observed);
//     Safe after C1_FBK OFF; after Safe LV Faulty FALSE -> no R&D / C1 ON for 3000 ms. Both: no Emergency; SafetyFault observation only.
//     Emergency combinations (FBK-05/06 v4): (05) C2_FBK FALSE after a before the C2 OFF command -> Emergency (Q-RC-19); EStop
//     (in_Estop_PLC) during the abort -> Emergency (V14-Q9); (06) C1_FBK FALSE between a and the C1 OFF command - observation (DIAG).
//     NC1 during the abort StartingRun: IL-05d(1) in current-e2b-cover-transitions.
// Declared test-side conventions (not oracle): StartingRun = C2 ON command with STO released and neither Run nor R&D (stage b_Step_RnD /
//  STS_RND) - as STP-I (current-e2c-stp-i); "not Safe" during Safe->R&D = no stage b_Step1 and C1 ON (D2-A maps b_Step12 to STS_SAFE);
//  R&D reached = stage b_Step_RnD or STS_RND; Emergency moments in the combination tests are diagnostic (rule L bound not applied here).
//  T_DIS = 1000 ms (existing Network8 hold; not changed). Assumptions A1..A9: helpers/e2-lifecycle.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,GREEN,OFF}=L;
const T_DIS=1000;
const K={'05':{base:'RnD',cmd:'out_HV_C2',fbk:'in_HV_C2_FBK',fk:'c2fbk',faulty:'in_HV_Faulty_FBK',dis:'out_HV_Discharge_Request',label:'abort StartingRun',held:'StartingRun',
  W:'WDG-03 / Q-RC-12 rollback = abort-StartingRun sequence + SafetyFault'},
 '06':{base:'Safe',cmd:'out_LV_C1',fbk:'in_LV_C1_FBK',fk:'c1fbk',faulty:'in_LV_Faulty_FBK',dis:'out_LV_Discharge_Request',label:'abort Safe->R&D',held:'Safe->R&D',
  W:'WDG-01 rollback to Safe + SafetyFault'}};
const isRun=s=>s.statuses.includes('STS_RUN')||s.stages.includes('b_Step3');
const isRnD=s=>s.stages.includes('b_Step_RnD')||s.statuses.includes('STS_RND');
const isSafeStage=s=>s.stages.includes('b_Step1');
// G1 v9 TD-14 (TEAM-DEFAULT TD-14, analyst E2-G1-v8-r §1; SPEC §2/§14 one-hot, MOD-002, MOD-006): in StartingRun and its abort the MAIN state is R&D,
// in Safe->R&D it is Safe; the phase is observed separately. Behavioural predicates (§1.2) do not use the main state:
//  "StartingRun held" = STO released, C2 ON, no SS1, HV Discharge FALSE, not Run; "Safe->R&D held" = C1 ON, LV Discharge FALSE, not R&D.
//  A rollback/abort is a change of these outputs. R_end (§1.3) = first scan >= a with out_HV_C2 FALSE, in_HV_C2_FBK FALSE and STO active.
//  S1 (main state R&D in StartingRun/abort) and S2 (main state Safe in Safe->R&D) are separate checks; S4 (outPLC_RnD) BLOCKED Q-V8R-01.
const srHeld=s=>stoRel(s)&&s.out.out_HV_C2&&!ss1(s)&&!s.out.out_HV_Discharge_Request&&!isRun(s);
const s2rHeld=s=>s.out.out_LV_C1&&!s.out.out_LV_Discharge_Request&&!isRnD(s);
const rEnd=(R,from,to)=>L.firstAt(seg(R,from,to),s=>!s.out.out_HV_C2&&!s.c2fbk&&stoAct(s));
const stoRel=s=>s.out.STO_DR1&&s.out.STO_DR2,stoAct=s=>!s.out.STO_DR1&&!s.out.STO_DR2;
const ss1=s=>s.out.out_SS1_DR1||s.out.out_SS1_DR2;
// Driver. BOTH p..Q+1 (Q = p+1000, delta 0), both released from rb = Q+2. greens: [{at(ctx)->scan|null, len}] (green alone, blue FALSE).
// faulty: true -> Faulty TRUE from the scan before p; faultyOff(ctx,x)->bool releases it (checked each scan). fbk: 'plant' | 'never' |
// 'pulse' (ON from the plant until u+199, FALSE from u+200). extra(n,ctx,x)->inputs/hold override. Recorded inputs per scan.
function drive(k,{greens=[],faulty=false,faultyOff=null,fbk='plant',len,extra=null}){
 const x=L.cached(k.base);x.step(OFF,100);if(faulty)x.step({[k.faulty]:true});
 const p=x.t+1,Q=p+1000,rb=Q+2,ctx={p,Q,rb,u:null,g:[]};const end=p+len,inp=new Map();let fOff=null;
 while(x.t<end){const n=x.t+1;const o={};if(n===p)Object.assign(o,BOTH);if(n===rb)Object.assign(o,OFF);
  greens.forEach((g,i)=>{if(ctx.g[i]==null){const s=g.at(ctx);if(s!=null&&n===s)ctx.g[i]=s;}const s=ctx.g[i];
   if(s!=null&&n===s)Object.assign(o,GREEN);if(s!=null&&n===s+g.len)Object.assign(o,OFF);});
  if(faulty&&fOff==null&&faultyOff&&faultyOff(ctx,x,n)){fOff=n;o[k.faulty]=false;}
  x.hold=fbk==='never'?{[k.fbk]:false}:fbk==='pulse'&&ctx.u!=null&&n>=ctx.u+200?{[k.fbk]:false}:{};
  if(extra){const e=extra(n,ctx,x);if(e?.inp)Object.assign(o,e.inp);if(e?.hold)x.hold={...x.hold,...e.hold};}
  x.step(o);inp.set(x.t,{g:x.inputs.in_Reset_PB,b:x.inputs.in_Relase_Door_PB,f:x.inputs[k.faulty]});
  if(ctx.u==null&&x.get(k.cmd))ctx.u=x.t;
  if(ctx.u==null&&x.t>p+1500)throw Error(faulty&&k.base==='Safe'?`K-2 RED (WDG-02 / MOD-001, analyst E2-G1-v8-r §4; content FAIL, not coverage): Safe->R&D not started with ${k.faulty} TRUE before the gesture (no ${k.cmd} ON within 1500 ms; stages=${x.stageSet()})`:`precondition not reached: ${k.cmd} ON within 1500 ms of BOTH from ${k.base} (stages=${x.stageSet()}, statuses=${x.statusSet()})`);}
 return {x,...ctx,fOff,inp,log:x.log.filter(s=>s.t>=p)};}
// Stand preconditions on the recorded inputs: both released [rb, g0-1], green alone [g0, g0+len-1], released at g0+len.
function greenOk(c,R,g0,len,from,label=''){const at=n=>R.inp.get(n)??{};let rel=true;for(let n=from;n<g0;n++)if(at(n).g||at(n).b)rel=false;
 c(rel,`${label}stand precondition: both buttons FALSE in [${from===R.rb?'rb':from}, g0-1] (rb=${R.rb}, g0=${g0})`);
 let held=true;for(let n=g0;n<g0+len;n++)if(!at(n).g||at(n).b)held=false;c(held,`${label}stand precondition: green TRUE, blue FALSE in every scan [g0, g0+${len-1}]`);
 c(!at(g0+len).g,`${label}stand precondition: green released at g0+${len}`);}
const seg=(R,a,b)=>R.log.filter(s=>s.t>=a&&s.t<=b);
const firstBad=(R,a,b,pred)=>seg(R,a,b).find(s=>!pred(s));
const off=(s,R)=>s==null?'-':`t=${s.t} (rb+${s.t-R.rb})`;
const noEmg=(c,R,label='')=>{const e=R.log.find(L.isEmg);c(!e,`${label}no Emergency (Q-V4-01 / V14-Q12/Q13: not an emergency); first ${off(e,R)}`);};
const sfNever=(c,R,a,b,label)=>{if(R.x.sf){const s=seg(R,a,b).find(q=>q.out[R.x.sf]);c(!s,`${label}: SafetyFault (${R.x.sf}) FALSE in every scan [${a}, ${b}]; first TRUE ${off(s,R)}`);}
 else c.nv(`${label}: SafetyFault FALSE - no SafetyFault symbol (A8)`);};

// =============================================== FBK-05/06-W (§3.2) ===============================================
const ALL_OUT=s=>JSON.stringify({o:s.out,st:s.stages,ss:s.statuses});
for(const [id,k] of Object.entries(K))for(const ab of [10,300,499])for(const fbk of ['never','pulse'])
 test(L.T(`E2d FBK-${id}-W ${k.held} accepted (BOTH released from Q+2), ${k.fbk} ${fbk==='never'?'never ON':'ON u+1..u+199, then FALSE'}, INVALID green 600 ms at u+${ab} (< 2 s clearing, v7-q §1) -> same as without the green: window end w=u+500 -> ${k.W}, rollback start <= w+1 (none in [u, w-1]), SafetyFault <= w+1 (NV), no Emergency`),t=>{
  const G=[{at:c=>c.u==null?null:c.u+ab,len:600}];const X=drive(k,{greens:G,fbk,len:20000}),X0=drive(k,{fbk,len:20000});const c=L.checks();const u=X.u,w=u+500;
  c(X0.u===u,`stand precondition: same command scan u in X and X0 (${u}/${X0.u})`);const g0=X.g[0];
  c(g0===u+ab,`stand precondition: green front g0 = u+${ab} (g0=${g0}, u=${u})`);if(g0!=null)greenOk(c,X,g0,600,X.rb);
  c(g0==null||g0-X.rb<=1999,`stand precondition: green front <= rb+1999 (invalid, v7-q §1): g0-rb=${g0==null?'-':g0-X.rb}`);
  let x0g=false;for(const [,v] of X0.inp)if(v.g&&!v.b)x0g=true;c(!x0g,'stand precondition: X0 has no green alone');
  const win=seg(X,w-1,w+1);c(win.length===3&&win.every(s=>!s[k.fk]),`stand precondition: ${k.fbk} FALSE in w-1..w+1 (X)`);
  if(X.log.find(s=>s.t===w)?.out[k.cmd]!==true)c(false,`stand precondition: command ${k.cmd} still ON at w=${w} (otherwise outside the window rule)`);
  t.diagnostic(`stimulus: BOTH ${X.p}..${X.Q+1}, rb=${X.rb}, u=Q+${u-X.Q}, invalid green g0=u+${ab}=rb+${g0-X.rb}, w=${w}`);
  // X == X0 in every scan (outputs incl. SafetyFault, stages, statuses): [u, w+3000+T_DIS] normative window and the whole trace (§1: no deferred execution)
  const m0=new Map(X0.log.map(s=>[s.t,s]));const diff=(a,b)=>X.log.filter(s=>s.t>=a&&s.t<=b&&ALL_OUT(s)!==ALL_OUT(m0.get(s.t)??{out:{},stages:[],statuses:[]})).map(s=>`u+${s.t-u}`);
  const d1=diff(u,w+3000+T_DIS),d2=diff(X.p,X.x.t);
  c(d1.length===0,`outputs (STO/Discharge/C1/C2/...), stages and statuses equal to X0 in every scan [u, w+3000+T_DIS] (the invalid green changes nothing); first differences ${d1.slice(0,4)}`);
  c(d2.length===0,`equal to X0 over the whole trace [p, p+20000] (no deferred execution of the invalid green, v7-q §1); first differences ${d2.slice(0,4)}`);
  // window rollback in X (and therefore in X0)
  if(id==='05'){const t0=L.firstAt(seg(X,u,w-1),s=>s.out.out_HV_C2&&stoRel(s));c(t0!=null,`stand precondition: StartingRun established in [u, w-1] (C2 ON command and STO released); none`);
   if(t0!=null){const sign=s=>!s.out.out_HV_C2||s.out[k.dis]||stoAct(s)||ss1(s);// TD-14: no main-state predicateconst e=seg(X,t0,w-1).find(sign);
    c(!e,`no rollback inside the window [t0, w-1] (FBK FALSE inside the window is not a fault, CRITERIA_DELTA_v7 §4.0); first sign at u+${e?e.t-u:'-'}`);
    const rs=L.firstAt(seg(X,t0,X.x.t),stoAct);c(rs!=null&&rs<=w+1,`rollback start (STO active, first step of the abort sequence Q-RC-12) not later than w+1: STO active at ${rs==null?'never':'u+'+(rs-u)}`);
    const td=L.firstAt(seg(X,u,X.x.t),s=>s.out[k.dis]);c(td!=null&&rs!=null&&td<=rs+1,`Discharge at once after STO (Q-RC-12 "STO -> сразу Discharge"; <= start+1): Discharge at ${td==null?'never':'u+'+(td-u)}`);
    c(!seg(X,u,X.x.t).some(ss1),'no SS1 / coast (Q-RC-12 "без SS1/выбега")');
    if(td!=null){const early=firstBad(X,u,td+T_DIS-1,s=>s.out.out_HV_C2);c(!early,`C2 not OFF before t_d+T_DIS (abort sequence); first OFF u+${early?early.t-u:'-'}`);}
    const c2off=L.firstAt(seg(X,u+1,X.x.t),s=>!s.out.out_HV_C2);const fOff=c2off==null?null:L.firstAt(seg(X,c2off,X.x.t),s=>!s.c2fbk);const tr=rs==null?null:rEnd(X,rs,X.x.t);// TD-14: R&D = R_end
    c(c2off!=null&&tr!=null&&fOff!=null&&tr>=fOff,`R&D after C2 OFF and C2_FBK OFF: C2 OFF ${c2off}, C2_FBK OFF ${fOff}, R&D ${tr}`);
    c(seg(X,X.p,X.x.t).every(s=>s.out.out_LV_C1)&&!seg(X,u,X.x.t).some(isSafeStage),'LV C1 kept, no R&D->Safe (abort StartingRun ends in R&D)');
    c(!X.log.some(isRun),'never Run');c(X.x.stageSet().join()==='b_Step_RnD'&&L.statusIs(X.x,'STS_RND'),`end state R&D; stages=${X.x.stageSet()} statuses=${X.x.statusSet()}`);}}
  else{const sign=s=>!s.out.out_LV_C1;// TD-14: rollback sign = C1 OFF (main state Safe is not a sign)const e=seg(X,u,w-1).find(sign);
   c(!e,`no rollback inside the window [u, w-1] (CRITERIA_DELTA_v7 §4.0); first sign at u+${e?e.t-u:'-'}`);
   const rs=L.firstAt(seg(X,u,X.x.t),s=>!s.out.out_LV_C1);c(rs!=null&&rs<=w+1,`rollback start (C1 OFF command, WDG-01) not later than w+1: C1 OFF at ${rs==null?'never':'u+'+(rs-u)}`);
   const f=rs==null?null:L.firstAt(seg(X,rs,X.x.t),s=>!s.c1fbk),sf=L.firstAt(seg(X,u,X.x.t),isSafeStage);
   c(sf!=null&&f!=null&&sf>=f,`Safe after C1 OFF and C1_FBK OFF: C1 OFF ${rs}, C1_FBK OFF ${f}, Safe ${sf}`);
   c(!X.log.some(isRnD),'never R&D (rollback, not a completed Safe->R&D)');
   if(rs!=null){const on=seg(X,rs,X.x.t).find(s=>s.out.out_LV_C1);c(!on,`no new C1 ON after the rollback; first u+${on?on.t-u:'-'}`);}
   c(X.x.stageSet().join()==='b_Step1'&&L.statusIs(X.x,'STS_SAFE'),`end state Safe; stages=${X.x.stageSet()} statuses=${X.x.statusSet()}`);}
  noEmg(c,X);
  if(X.x.sf){const sf=X.x.sf;const pre=seg(X,u,w-1).find(s=>s.out[sf]);c(!pre,`no SafetyFault inside the window [u, w-1]; first u+${pre?pre.t-u:'-'}`);
   const f=L.firstAt(seg(X,u,X.x.t),s=>s.out[sf]);c(f!=null&&f<=w+1,`SafetyFault (${sf}) TRUE not later than w+1 (WDG-01/03); first ${f==null?'never':'u+'+(f-u)}`);
   if(f!=null){const lost=seg(X,f,X.x.t).find(s=>!s.out[sf]);c(!lost,`SafetyFault held (no acknowledgement given); first FALSE u+${lost?lost.t-u:'-'}`);}}
  else c.nv('SafetyFault TRUE not later than w+1 (WDG-01/03, as in X0) - no SafetyFault symbol (A8); observable checks above executed');
  c.finish(t,`violated checks (u=${u}, w=${w}, g0=u+${ab})`);});

// =============================================== FBK-05/06-NEG (§3.3) ===============================================
const NEG=[['(a) g0=rb+10, 600 ms',[[10,600]]],['(a) g0=rb+300, 600 ms',[[300,600]]],['(a) g0=rb+1999, 600 ms',[[1999,600]]],
 ['(b) g0=rb+1999 held until rb+3000',[[1999,1001]]],['(c) g0=rb+300 600 ms, again 1999 ms after its release (rb+2899) 600 ms',[[300,600],[2899,600]]]];
for(const [id,k] of Object.entries(K))for(const [vn,gl] of NEG)
 test(L.T(`E2d FBK-${id}-NEG ${k.held} held by ${k.faulty} TRUE (from before BOTH), INVALID green ${vn} (front <= rb+1999 after the BOTH release, v7-q §1) -> no abort / descent / SafetyFault in [g0, h-1]; Faulty FALSE at h -> ${id==='05'?'Run':'R&D'} not <= h+99, at h+101 and kept (no deferred execution), no Emergency`),t=>{
  const lastEnd=Math.max(...gl.map(([o,l])=>o+l)),hOf=rb=>Math.max(rb+lastEnd,rb+3500)+1000;
  const R=drive(k,{greens:gl.map(([o,l])=>({at:c=>c.rb+o,len:l})),faulty:true,faultyOff:(c,x,n)=>n===hOf(c.rb),len:1002+lastEnd+5000+4000});
  const c=L.checks();const h=hOf(R.rb),g0=R.g[0],u=R.u;
  gl.forEach(([o,l],i)=>greenOk(c,R,R.g[i],l,i===0?R.rb:R.g[i-1]+gl[i-1][1],`green ${i+1}: `));
  c(R.fOff===h,`stand precondition: ${k.faulty} released at h=${h} (${R.fOff})`);let fl=true;for(let n=R.p-1;n<h;n++)if(R.inp.has(n)&&!R.inp.get(n).f)fl=false;
  c(fl,`stand precondition: ${k.faulty} TRUE in every scan [p, h-1]`);c(u!=null&&u<g0,`stand precondition: ${k.held} accepted (command at u=${u}) before g0=${g0}`);
  t.diagnostic(`rb=${R.rb}, u=rb${u-R.rb>=0?'+':''}${u-R.rb}, greens ${gl.map(([o,l])=>`rb+${o}..rb+${o+l-1}`)}, h=rb+${h-R.rb}`);
  if(id==='05'){const b=firstBad(R,g0,h-1,srHeld);// TD-14 §1.2
   const m=firstBad(R,g0,h-1,s=>s.statuses.length===1&&s.statuses[0]==='STS_RND');c(!m,`S1 (TD-14 §1.4, SPEC §14): main state R&D (one-hot) in every scan [g0, h-1]; first ${off(m,R)} ${m?.statuses}`);
   c(!b,`StartingRun held in every scan [g0, h-1] (TD-14 §1.2): STO released, C2 ON, no SS1, HV Discharge FALSE (question 73), not Run; first violation ${off(b,R)} ${b?ALL_OUT(b).slice(0,200):''}`);
   const r99=seg(R,g0,h+99).find(isRun);c(!r99,`no Run <= h+99 (RUN-CONF-T, K = h); first ${off(r99,R)}`);
   const nr=firstBad(R,h+101,h+3000,isRun);c(!nr,`Run at h+101 and in every scan to h+3000 (RUN-CONF-T TD-02; no deferred Run->R&D from the old green); first not Run ${off(nr,R)}`);}
  else{const b=firstBad(R,g0,h-1,s2rHeld);// TD-14 §1.2: C1 ON, LV Discharge FALSE, not R&D
   const m=firstBad(R,g0,h-1,s=>s.statuses.length===1&&s.statuses[0]==='STS_SAFE');c(!m,`S2 (TD-14 §1.4, SPEC §14, MOD-001): main state Safe (one-hot) in every scan [g0, h-1]; first ${off(m,R)} ${m?.statuses}`);
   c(!b,`Safe->R&D held in every scan [g0, h-1] (TD-14 §1.2): C1 ON, LV Discharge FALSE (TD-01), not R&D; first violation ${off(b,R)} ${b?ALL_OUT(b).slice(0,200):''}`);
   const r99=seg(R,g0,h+99).find(isRnD);c(!r99,`no R&D <= h+99 (RND-CONF-T, K1 = h; WDG-02); first ${off(r99,R)}`);
   const nr=firstBad(R,h+101,h+3000,s=>isRnD(s)&&s.out.out_LV_C1&&!isSafeStage(s));c(!nr,`R&D at h+101 and in every scan to h+3000 with C1 ON (RND-CONF-T TD-02; no deferred R&D->Safe from the old green); first violation ${off(nr,R)}`);}
  sfNever(c,R,g0,h+3000,'no SafetyFault from the invalid green');noEmg(c,R);c.finish(t,`violated checks (rb=${R.rb}, g0=${g0}, h=${h})`);});

// =============================================== FBK-05/06-POS (§3.4) ===============================================
// Faulty TRUE until the abort end state is reached (05: R&D; 06: Safe), then FALSE (released in the next scan), observation 3000 ms after.
// G1 v9 TD-14 §1.3: 05 - the abort end R_end (C2 OFF, C2_FBK OFF, STO active), not the stage b_Step_RnD; 06 - Safe stage after C1 OFF.
function pos(k,id,go,len,extra=null){let endAt=null;const done=id==='05'?(x)=>{const q=x.snap();return !q.out.out_HV_C2&&!q.c2fbk&&!q.out.STO_DR1&&!q.out.STO_DR2;}:(x)=>x.get('b_Step1')&&!x.get('out_LV_C1');
 return drive(k,{greens:[{at:c=>c.rb+go,len}],faulty:true,len:1002+go+12000,extra,
  faultyOff:(c,x,n)=>{if(endAt==null&&c.g[0]!=null&&x.t>=c.g[0]&&done(x))endAt=x.t;return endAt!=null&&n===endAt+1;}});}
function posChecks(c,t,R,id,k,len){const g0=R.g[0],end=R.x.t;greenOk(c,R,g0,len,R.rb);c(R.u!=null&&R.u<g0,`stand precondition: ${k.held} accepted before g0 (u=${R.u})`);
 if(id==='05'){const b=firstBad(R,g0,g0+499,srHeld);// TD-14 §1.2c(!b,`no abort signs in [g0, g0+499] (BTN-003): STO released, C2 ON, Discharge FALSE; first ${off(b,R)}`);
  const a1=L.firstAt(seg(R,g0,end),stoAct);c(a1!=null&&a1<=g0+502,`STO active not later than a+1 <= g0+502 (STP-E); first at ${a1==null?'never':'g0+'+(a1-g0)}`);
  if(a1!=null){const rel=seg(R,a1,end).find(stoRel);c(!rel,`STO not released again (not resumed); first g0+${rel?rel.t-g0:'-'}`);}
  const td=L.firstAt(seg(R,g0,end),s=>s.out[k.dis]);c(td!=null&&td<=g0+503,`Discharge not later than a+2 <= g0+503 (STP-E); first ${td==null?'never':'g0+'+(td-g0)}`);
  if(td!=null){const lv=seg(R,td,end).find(s=>!s.out[k.dis]);c(!lv,`Discharge held as a level until the next accepted lift (Q-V7-01 "Г"); first FALSE g0+${lv?lv.t-g0:'-'}`);
   const early=firstBad(R,g0,td+T_DIS-1,s=>s.out.out_HV_C2);c(!early,`C2 OFF not before t_d+T_DIS; first OFF g0+${early?early.t-g0:'-'}`);}
  c(!seg(R,g0,end).some(ss1),'no SS1 / coast 5 s (D-STARTINGRUN-NO-COAST)');
  const c2off=L.firstAt(seg(R,g0,end),s=>!s.out.out_HV_C2),f=c2off==null?null:L.firstAt(seg(R,c2off,end),s=>!s.c2fbk),tr=rEnd(R,g0,end);// TD-14: R&D = R_end
  if(td!=null)c(tr!=null&&tr<=td+T_DIS+3000,`TD-14 §1.3: abort completed (R_end) not later than t_d+T_DIS+3000; R_end=${tr}`);
  const s1=tr==null?null:seg(R,g0,tr).find(s=>!(s.statuses.length===1&&s.statuses[0]==='STS_RND'));c(!s1,`S1 (TD-14 §1.4): main state R&D (one-hot) in every scan [g0, R_end]; first ${off(s1,R)} ${s1?.statuses}`);
  c(c2off!=null&&f!=null&&tr!=null&&tr>=f,`R&D after C2_FBK OFF: C2 OFF ${c2off}, C2_FBK OFF ${f}, R&D ${tr}`);
  c(seg(R,R.p,end).every(s=>s.out.out_LV_C1)&&!seg(R,g0,end).some(isSafeStage),'LV C1 kept ON, no R&D->Safe (E2-01)');
  c(R.fOff!=null&&end-R.fOff>=3000,`stand precondition: HV Faulty FALSE after R&D, observed >= 3000 ms (fOff=${R.fOff}, end=${end})`);
  if(R.fOff!=null){const r=seg(R,R.fOff,end).find(s=>isRun(s)||s.out.out_HV_C2||!stoAct(s));c(!r,`after HV Faulty FALSE: no Run, C2 not ON again, STO not released (not resumed); first ${off(r,R)}`);}
  c(!seg(R,g0,end).some(isRun),'never Run');}
 else{const b=firstBad(R,g0,g0+499,s=>s.out.out_LV_C1&&!isRnD(s));c(!b,`no abort signs in [g0, g0+499] (BTN-003, TD-14): C1 ON and not R&D; first ${off(b,R)}`);
  const c1off=L.firstAt(seg(R,g0,end),s=>!s.out.out_LV_C1);c(c1off!=null,'C1 OFF after the qualified green (V14-Q13 / PLC-09(b))');if(c1off!=null)t.diagnostic(`C1 OFF at g0+${c1off-g0} (moment observed, PLC-09(b) does not fix the scan)`);
  const f=c1off==null?null:L.firstAt(seg(R,c1off,end),s=>!s.c1fbk),sf=L.firstAt(seg(R,g0,end),isSafeStage);c(f!=null&&sf!=null&&sf>=f,`Safe after C1_FBK OFF: C1 OFF ${c1off}, C1_FBK OFF ${f}, Safe ${sf}`);
  c(!seg(R,g0,end).some(isRnD),'never R&D');
  if(c1off!=null){const on=seg(R,c1off,end).find(s=>s.out.out_LV_C1);c(!on,`C1 not ON again (not resumed); first ${off(on,R)}`);}
  c(R.fOff!=null&&end-R.fOff>=3000,`stand precondition: LV Faulty FALSE after Safe, observed >= 3000 ms (fOff=${R.fOff}, end=${end})`);
  const ld=seg(R,g0,end).filter(s=>s.out[k.dis]).length;t.diagnostic(`LV Discharge TRUE in ${ld} scans after g0 (TD-01: observation)`);}
 noEmg(c,R);if(R.x.sf)t.diagnostic(`SafetyFault after the abort: ${seg(R,g0,end).some(s=>s.out[R.x.sf])} (observation, PLC-09(b))`);}
for(const [id,k] of Object.entries(K)){
 for(const go of [2001,5000])test(L.T(`E2d FBK-${id}-POS ${k.held} held by ${k.faulty} TRUE, VALID green 600 ms at rb+${go} (full 2 s clearing, v7-q §1/§3.4) -> ${k.label}: ${id==='05'?'STO <= g0+502, Discharge <= g0+503 held, no SS1, C2 OFF not before t_d+T_DIS, R&D after C2_FBK OFF, C1 kept; HV Faulty FALSE -> not resumed 3000 ms':'C1 OFF after a, Safe after C1_FBK OFF; LV Faulty FALSE -> no R&D / C1 ON 3000 ms'}; no Emergency`),t=>{
  const R=pos(k,id,go,600);const c=L.checks();posChecks(c,t,R,id,k,600);c.finish(t,`violated checks (rb=${R.rb}, g0=${R.g[0]})`);});
 test(L.T(`DIAG observation E2d FBK-${id}-POS valid-clearing boundary: green 600 ms at exactly rb+2000 (convention q)`),t=>{
  let R;try{R=pos(k,id,2000,600);}catch(e){t.diagnostic('unavailable: '+e.message);return;}const g0=R.g[0];
  t.diagnostic(`g0=rb+2000: first abort sign ${id==='05'?L.firstAt(seg(R,g0,R.x.t),stoAct):L.firstAt(seg(R,g0,R.x.t),s=>!s.out.out_LV_C1)??'never'} (g0=${g0})`);});
 test(L.T(`E2d FBK-${id}-POS ${k.held} held by ${k.faulty} TRUE, green held only 499 ms at rb+2001 (BTN-003 q-1) -> no abort in every scan [g0, g0+3000], no Emergency`),t=>{
  const R=drive(k,{greens:[{at:c=>c.rb+2001,len:499}],faulty:true,len:1002+2001+3100});const c=L.checks();const g0=R.g[0];greenOk(c,R,g0,499,R.rb);
  const ok=id==='05'?srHeld:s=>s.out.out_LV_C1&&!isRnD(s);// TD-14 §1.2
  const b=firstBad(R,g0,g0+3000,ok);c(!b,`${k.held} unchanged in every scan [g0, g0+3000] (499 ms is not a qualified single); first violation ${off(b,R)}`);noEmg(c,R);c.finish(t);});}
// ---- emergency combinations during the valid abort (FBK-05/06 v4, v7-q §3.4) ----
function emgAfterAbort(t,id,k,cause,lab){let a=null,ev=null;const sign=id==='05'?stoAct:s=>!s.out.out_LV_C1;
 const R=drive(k,{greens:[{at:c=>c.rb+2001,len:600}],faulty:true,len:1002+2001+600+14000,extra:(n,ctx,x)=>{
  if(a==null&&ctx.g[0]!=null&&x.t>=ctx.g[0]&&sign(x.snap()))a=x.t;if(a!=null&&ev==null&&n===a+cause.dt)ev=n;
  if(ev!=null&&n>=ev&&n<ev+12000)return cause.on(x);if(ev!=null&&n===ev+12000)return {inp:{...cause.off,[k.faulty]:false}};return null;}});
 const c=L.checks();c(a!=null&&ev!=null,`stand precondition: abort observed (a=${a}) and event at a+${cause.dt} (${ev})`);
 if(cause.pre&&ev!=null)c(cause.pre(R.log.find(s=>s.t===ev-1)),`stand precondition: ${cause.preLabel} at ev-1`);
 if(ev!=null){const s=seg(R,ev,ev+11999);const i=s.findIndex(L.isEmg);const bad=i<0?s:s.slice(i).filter(q=>!L.isEmg(q));
  c(i>=0&&bad.length===0,`Emergency reached and latched while the cause is held [ev, ev+11999] (${lab}); first Emergency ${i<0?'never':'ev+'+(s[i].t-ev)}; later non-Emergency scans ${bad.length}`);
  if(i>=0)t.diagnostic(`first Emergency at ev+${s[i].t-ev} (moment: rule L, not judged here)`);
  const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid'].flatMap(q=>L.rises(s,q).map(v=>q+'@ev+'+(v-ev)));
  c(rs.length===0,'no energy increase / STO release / Unlock after the event (EMGREF): '+rs.slice(0,4));
  R.x.step({},100);L.restartToSafe(R.x,c,'');}
 c.finish(t,`violated checks (a=${a}, ev=${ev})`);}
test(L.T('E2d FBK-05-POS emergency combination: valid abort StartingRun, C2_FBK FALSE at a+100 (before the C2 OFF command) -> Emergency (Q-RC-19, EMGREF-RUN), latched, Restart -> only Safe'),t=>
 emgAfterAbort(t,'05',K['05'],{dt:100,on:()=>({hold:{in_HV_C2_FBK:false}}),off:{},pre:s=>s?.out.out_HV_C2&&s?.c2fbk,preLabel:'C2 command ON and C2_FBK ON'},'C2_FBK lost before the C2 OFF command'));
test(L.T('E2d FBK-05-POS emergency combination: valid abort StartingRun, in_Estop_PLC TRUE at a+100 -> Emergency (V14-Q9), latched, Restart -> only Safe'),t=>
 emgAfterAbort(t,'05',K['05'],{dt:100,on:()=>({inp:{in_Estop_PLC:true}}),off:{in_Estop_PLC:false}},'in_Estop_PLC during the abort'));
test(L.T('E2d FBK-06-POS emergency combination: valid abort Safe->R&D, in_Estop_PLC TRUE at a+1 -> Emergency (V14-Q9), latched, Restart -> only Safe'),t=>
 emgAfterAbort(t,'06',K['06'],{dt:1,on:()=>({inp:{in_Estop_PLC:true}}),off:{in_Estop_PLC:false}},'in_Estop_PLC during the abort'));
test(L.T('DIAG observation E2d FBK-06-POS C1_FBK FALSE between the abort qualification a and the C1 OFF command (gap 0-1 scan, FBK-06 v4 observation)'),t=>{
 let R;try{R=pos(K['06'],'06',2001,600);}catch(e){t.diagnostic('unavailable: '+e.message);return;}const g0=R.g[0];const a=L.firstAt(seg(R,g0,R.x.t),s=>!s.out.out_LV_C1);
 t.diagnostic(`C1 OFF command at ${a==null?'never':'g0+'+(a-g0)}; scans between qualification (<= g0+501) and the command: ${a==null?'-':Math.max(0,a-(g0+500))}`);});

// =============================================== FBK-05/06-CMD (§3.1) — BLOCKED-E4 ===============================================
for(const [id,k] of Object.entries(K))for(const ab of [10,300,499])for(const fbk of ['never','pulse'])
 test(L.T(`E2d FBK-${id}-CMD BLOCKED-E4 ${k.held}: front ${id==='05'?'CMD_RUN_TO_R&D':'CMD_R&D_TO_SAFE'} at u+${ab}, ${k.fbk} ${fbk==='never'?'never ON':'ON u+1..u+199, then FALSE'} -> SafetyFault <= w+1, abort sequence equal to the abort with FBK ON, no Emergency (Q-V7-03 "А")`),t=>{
  t.todo('BLOCKED-E4: E4 (PLC commands) frozen until new documentation from Vadim; no CMD_* signal in the interface (v7-q §3.1). Not executed, not PASS.');});
// ==================== G1 v9 TD-14 §1.4: main state and phase observed separately (S1, S2, S3; S4 BLOCKED Q-V8R-01) ====================
test(L.T('E2d TD-14 S1/S3 steady R&D, in_HV_Faulty_FBK TRUE holds StartingRun, BOTH -> every scan [A, A+3000]: exactly one main status, R&D (SPEC §2/§14, MOD-002, MOD-006), no Run; phase marker recRndC_SU TRUE in the phase and FALSE in steady R&D before p'),t=>{
 if(!L.hasName('recRndC_SU'))assert.fail('ERROR precondition (TD-14): Symbol recRndC_SU absent - StartingRun phase not observable (no fallback to "not R&D")');
 const x=L.cached('RnD');x.step(OFF,100);x.step({in_HV_Faulty_FBK:true},100);let A=null;const su=new Map();x.listeners.push((s,y)=>{su.set(s.t,!!y.r.get('recRndC_SU'));});
 const p=x.t+1;x.step(BOTH,1100);x.step(OFF,4000);const c=L.checks();const log=x.log.filter(s=>s.t>=p);A=L.firstAt(log,s=>su.get(s.t)||s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);
 c(A!=null,'precondition: R&D->Run accepted (A by TD-08)');if(A!=null){const w=x.log.filter(s=>s.t>=A&&s.t<=A+3000);
  const m=w.find(s=>!(s.statuses.length===1&&s.statuses[0]==='STS_RND'));c(!m,`S1: main state R&D (one-hot) in every scan [A, A+3000]; first t=A+${m?m.t-A:'-'} ${m?.statuses}`);
  const r=w.find(s=>s.statuses.includes('STS_RUN')||s.stages.includes('b_Step3'));c(!r,'S1: no Run while HV Faulty holds StartingRun');
  const ph=w.find(s=>!su.get(s.t));c(!ph,`S3: phase marker recRndC_SU TRUE in every scan [A, A+3000]; first FALSE t=A+${ph?ph.t-A:'-'}`);
  const pre=x.log.filter(s=>s.t>=p-100&&s.t<p).find(s=>su.get(s.t));c(!pre,'S3: phase marker FALSE in steady R&D before the gesture');}
 c.finish(t,`violated checks (p=${p}, A=${A})`);});
test(L.T('E2d TD-14 S2/S3 steady Safe, BOTH -> Safe->R&D: every scan from A to the R&D confirmation: exactly one main status, Safe (SPEC §14, MOD-001); phase marker b_Step12 TRUE in the phase and FALSE in steady Safe before p'),t=>{
 const x=L.cached('Safe');x.step(OFF,100);const p=x.t+1;x.step(BOTH,1100);x.step(OFF,3000);const c=L.checks();const log=x.log.filter(s=>s.t>=p);
 const A=L.firstAt(log,s=>s.stages.includes('b_Step12')||s.out.out_LV_C1),R=L.firstAt(log,s=>s.statuses.includes('STS_RND'));c(A!=null,'precondition: Safe->R&D accepted (A by TD-08)');
 if(A!=null){const w=x.log.filter(s=>s.t>=A&&s.t<(R??x.t+1));const m=w.find(s=>!(s.statuses.length===1&&s.statuses[0]==='STS_SAFE'));c(!m,`S2: main state Safe (one-hot) in every scan [A, R&D-1]; first t=A+${m?m.t-A:'-'} ${m?.statuses}`);
  const ph=w.find(s=>!s.stages.includes('b_Step12')&&!s.out.out_LV_C1);c(!ph,`S3: phase marker b_Step12 or C1 ON in every scan of the phase; first t=A+${ph?ph.t-A:'-'}`);
  const pre=x.log.filter(s=>s.t>=p-100&&s.t<p).find(s=>s.stages.includes('b_Step12'));c(!pre,'S3: b_Step12 FALSE in steady Safe before the gesture');}
 c.finish(t,`violated checks (p=${p}, A=${A}, R&D=${R})`);});
// G1 v9.1 S4 (READY; Vadim question 78 "А", analyst E2-G1-v8-r §1.4b; RND-CONF-T, RUN-CONF-T): outPLC_RnD is the PLC copy of the main state R&D,
// transfer tolerance 1 scan. (a) Safe->R&D: FALSE in every scan [A1, K1+99] (K1 = max(k1, u1+500); with the plant k1 <= u1+500 -> K1 = u1+500),
// TRUE not later than tau_R+1 (tau_R = first main-state R&D scan) and in every later scan of steady R&D; no TRUE by K1+101 -> FAIL.
// (b) StartingRun and its abort: TRUE in every scan [A-1, R_end+3000] (no FALSE pulse); (c) StartingRun -> Run: TRUE in every scan <= K+99,
// FALSE not later than tau_Run+1 and in steady Run. R&D->Safe, Run->R&D, WDG-03 rollback and Emergency - not covered by question 78 (NV).
// Replaces the v9 todo "TD-14 S4 ... BLOCKED Q-V8R-01" (the only change of an existing test in G1 v9.1). outPLC_RnD absent -> ERROR stand.
const PLCR='outPLC_RnD';
function recR(x){if(!L.hasName(PLCR))assert.fail('ERROR stand (S4): outPLC_RnD absent in this source');const m=new Map();x.listeners.push((s,y)=>{m.set(s.t,!!y.r.get(PLCR));});return m;}
const mainIs=(s,st)=>s.statuses.length===1&&s.statuses[0]===st;
for(const how of ['BOTH','legacy (1,0)'])test(L.T(`E2d S4 (a) steady Safe, Safe->R&D by ${how} -> outPLC_RnD FALSE in every scan [A1, K1+99] (K1 = u1+500), TRUE not later than tau_R+1 and in every scan of steady R&D to +3000 (question 78 "А", RND-CONF-T)`),t=>{
 const x=L.cached('Safe');x.step(OFF,100);const m=recR(x);const c=L.checks();const p=x.t+1;
 if(how==='BOTH'){x.step(BOTH,1100);x.step(OFF,4000);}else{x.step({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:false},1);x.step({},4100);}
 const log=x.log.filter(s=>s.t>=p);const A1=L.firstAt(log,s=>s.stages.includes('b_Step12')||s.out.out_LV_C1),u1=L.firstAt(log,s=>s.out.out_LV_C1),tR=L.firstAt(log,s=>mainIs(s,'STS_RND'));
 c(A1!=null&&u1!=null&&tR!=null,`precondition: Safe->R&D accepted and confirmed (A1=${A1}, u1=${u1}, tau_R=${tR})`);
 if(A1!=null&&u1!=null){const K1=u1+500;const b=log.find(s=>s.t>=A1&&s.t<=K1+99&&m.get(s.t));c(!b,`FALSE in every scan [A1, K1+99]; first TRUE A1+${b?b.t-A1:'-'}`);
  t.diagnostic(`A1=${A1}, u1=${u1}, K1=${K1}, tau_R=${tR}, first TRUE ${L.firstAt(log,s=>m.get(s.t))}`);
  if(tR!=null){const tt=L.firstAt(log,s=>m.get(s.t));c(tt!=null&&tt<=tR+1,`TRUE not later than tau_R+1 = ${tR+1}; first TRUE ${tt}`);c(tt==null||tt<=K1+101,`TRUE not later than K1+101 (>= K1+102 FAIL); first ${tt}`);
   const f=log.find(s=>s.t>=tR+1&&s.t<=tR+3000&&!m.get(s.t));c(!f,`TRUE in every scan of steady R&D [tau_R+1, tau_R+3000]; first FALSE ${f?.t}`);}}
 c.finish(t,`violated checks (p=${p})`);});
test(L.T('E2d S4 (b) steady R&D, in_HV_Faulty_FBK TRUE holds StartingRun, BOTH -> outPLC_RnD TRUE in every scan [A-1, A+5000] (question 78 "А"; no FALSE pulse)'),t=>{
 const x=L.cached('RnD');x.step(OFF,100);x.step({in_HV_Faulty_FBK:true},100);const m=recR(x);const su=new Map();if(L.hasName('recRndC_SU'))x.listeners.push((s,y)=>{su.set(s.t,!!y.r.get('recRndC_SU'));});
 const c=L.checks();const p=x.t+1;x.step(BOTH,1100);x.step(OFF,5500);const log=x.log.filter(s=>s.t>=p);const A=L.firstAt(log,s=>su.get(s.t)||s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);
 c(A!=null,'precondition: R&D->Run accepted (A by TD-08)');if(A!=null){const f=x.log.find(s=>s.t>=A-1&&s.t<=A+5000&&!m.get(s.t));c(!f,`TRUE in every scan [A-1, A+5000]; first FALSE A+${f?f.t-A:'-'}`);}c.finish(t,`violated checks (A=${A})`);});
for(const [an,abort] of [['LV Healthy lost at u+50 (STP-I abort)','lv'],['valid green 600 ms after a 2100 ms clearing (STP-E abort, E3)','green']])
 test(L.T(`E2d S4 (b) StartingRun abort by ${an} -> outPLC_RnD TRUE in every scan [A-1, R_end${abort==='lv'?'] (the chained R&D->Safe after R_end is NV)':'+3000]'} (question 78 "А"; R_end by TD-14 §1.3)`),t=>{
  const x=L.cached('RnD');x.step(OFF,100);if(abort==='green')x.step({in_HV_Faulty_FBK:true},100);const m=recR(x);const su=new Map();if(L.hasName('recRndC_SU'))x.listeners.push((s,y)=>{su.set(s.t,!!y.r.get('recRndC_SU'));});
  const c=L.checks();const p=x.t+1;let u=null;for(let n=p;n<=p+12000;n++){const o={};if(n===p)Object.assign(o,BOTH);if(n===p+1100)Object.assign(o,OFF);
   if(abort==='lv'&&u!=null&&n===u+50)o.in_LV_Faulty_FBK=true;if(abort==='green'&&n===p+1100+2100)Object.assign(o,GREEN);if(abort==='green'&&n===p+1100+2700)Object.assign(o,OFF);x.step(o);if(u==null&&x.get('out_HV_C2'))u=x.t;}
  const log=x.log.filter(s=>s.t>=p);const A=L.firstAt(log,s=>su.get(s.t)||s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);const a=abort==='lv'?(u==null?null:u+50):p+1100+2600;
  const RE=a==null?null:L.firstAt(log.filter(s=>s.t>=a),s=>!s.out.out_HV_C2&&!s.c2fbk&&!s.out.STO_DR1&&!s.out.STO_DR2);
  c(A!=null&&RE!=null,`precondition: StartingRun accepted (A=${A}) and its abort completed (R_end=${RE}; abort by green = STP-E, E3)`);
  if(A!=null&&RE!=null){const to=abort==='lv'?RE:RE+3000;const f=x.log.find(s=>s.t>=A-1&&s.t<=to&&!m.get(s.t));c(!f,`TRUE in every scan [A-1, ${abort==='lv'?'R_end':'R_end+3000'}]; first FALSE ${f?.t}`);}
  c.finish(t,`violated checks (A=${A}, R_end=${RE})`);});
test(L.T('E2d S4 (c) steady R&D, BOTH -> StartingRun -> Run (plant, HV norm): outPLC_RnD TRUE in every scan [A-1, K+99] (K = u+500), FALSE not later than tau_Run+1 and in every scan of steady Run to +3000; TRUE in a main-state Run scan only at tau_Run (question 78 "А", RUN-CONF-T)'),t=>{
 const x=L.cached('RnD');x.step(OFF,100);const m=recR(x);const su=new Map();if(L.hasName('recRndC_SU'))x.listeners.push((s,y)=>{su.set(s.t,!!y.r.get('recRndC_SU'));});
 const c=L.checks();const p=x.t+1;x.step(BOTH,1100);x.step(OFF,5000);const log=x.log.filter(s=>s.t>=p);const A=L.firstAt(log,s=>su.get(s.t)||s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2),u=L.firstAt(log,s=>s.out.out_HV_C2),tr=L.firstAt(log,s=>mainIs(s,'STS_RUN'));
 c(A!=null&&u!=null&&tr!=null,`precondition: R&D->Run accepted and Run confirmed (A=${A}, u=${u}, tau_Run=${tr})`);
 if(A!=null&&u!=null){const K=u+500;const f=x.log.find(s=>s.t>=A-1&&s.t<=K+99&&!m.get(s.t));c(!f,`TRUE in every scan [A-1, K+99]; first FALSE ${f?.t}`);}
 if(tr!=null){const b=x.log.find(s=>s.t>=tr+1&&s.t<=tr+3000&&m.get(s.t));c(!b,`FALSE from tau_Run+1 and in steady Run; first TRUE ${b?.t} (tau_Run=${tr})`);}c.finish(t,`violated checks (A=${A}, u=${u}, tau_Run=${tr})`);});
test(L.T('E2d S4 outPLC_RnD in R&D->Safe, Run->R&D, WDG-03 rollback and Emergency'),t=>{t.todo('NOT VERIFIED: not covered by Vadim\'s answer to question 78 (analyst E2-G1-v8-r §1.4b / §5) - not executed, not PASS');});
// ==================== G1 v9 m-25 / K-2: WDG-02 boundaries - Safe->R&D with in_LV_Faulty_FBK TRUE (analyst E2-G1-v8-r §4, READY) ====================
// Faulty TRUE from p-200 (before the gesture), p+900 (during BOTH), A (b_Step12), A+1; C1 ON as in the no-event trace (no refusal by LV Faulty);
// Faulty FALSE at t_f+29999 -> R&D; held -> rollback to Safe + SafetyFault at t_f+30001 (t_f+30000 observation; SafetyFault NV without symbol).
// Refusal of the start because of LV Faulty = FAIL (K-2: WDG-02 / MOD-001), never coverage. t_f = first C1_FBK ON scan.
// G1 v9.1 (review G1 v9 N20): the gesture starts 300 scans after the drive start so that 'Faulty from p-200' is really applied (stand precondition below).
let s0=null;function safeRef(){if(!s0){try{const x=L.cached('Safe');x.step(OFF,100);x.step(OFF,300);const p=x.t+1;x.step(BOTH,1100);x.step(OFF,1000);const log=x.log.filter(s=>s.t>=p);
  s0={p,A:L.firstAt(log,s=>s.stages.includes('b_Step12')||s.out.out_LV_C1),u:L.firstAt(log,s=>s.out.out_LV_C1)};if(s0.u==null)throw Error('precondition: Safe->R&D accepted without Faulty');}catch(e){s0={error:e};}}if(s0.error)throw s0.error;return s0;}
for(const [pn,fOf] of [['p-200',r=>r.p-200],['p+900',r=>r.p+900],['A',r=>r.A],['A+1',r=>r.A+1]])for(const rel of [true,false])
 test(L.T(`E2d K-2 WDG-02 steady Safe, in_LV_Faulty_FBK TRUE from ${pn}, BOTH -> C1 ON as without Faulty (no refusal, WDG-02 / question 66(b)); Faulty ${rel?'FALSE at t_f+29999 -> R&D':'held -> no R&D in [t_f, t_f+30000] (the 30 s rollback + SafetyFault at t_f+30001 is E6: NV)'}, no Emergency`),t=>{
  const R0=safeRef();const x=L.cached('Safe');x.step(OFF,100);const c=L.checks();const fs0=fOf(R0);let tf=null;const end=R0.p+36000;
  const fsSeen=new Map();x.listeners.push((s,y)=>{fsSeen.set(s.t,y.inputs.in_LV_Faulty_FBK);});
  for(let n=x.t+1;n<=end;n++){const o={};if(n===R0.p)Object.assign(o,BOTH);if(n===R0.p+1100)Object.assign(o,OFF);if(n===fs0)o.in_LV_Faulty_FBK=true;if(rel&&tf!=null&&n===tf+29999)o.in_LV_Faulty_FBK=false;x.step(o);if(tf==null&&x.get('in_LV_C1_FBK'))tf=x.t;}
  c(fs0>x.log[0].t&&fsSeen.get(fs0)===true&&fsSeen.get(fs0-1)!==true,`stand precondition (N20): in_LV_Faulty_FBK TRUE first in scan ${fs0} (recorded inputs)`);
  const u=L.firstAt(x.log.filter(s=>s.t>=R0.p),s=>s.out.out_LV_C1);c(u===R0.u,`C1 ON as in the trace without Faulty (u=${R0.u}); observed ${u==null?'never (K-2 RED: start refused by LV Faulty, WDG-02 / MOD-001)':u}`);
  if(tf!=null){if(rel){const r=L.firstAt(x.log.filter(s=>s.t>=tf+29999),s=>s.statuses.includes('STS_RND'));c(r!=null,'R&D after Faulty FALSE at t_f+29999');c(x.log.filter(s=>s.t>=tf&&s.t<tf+29999).every(s=>!s.statuses.includes('STS_RND')),'no R&D while LV Faulty TRUE');}
   else{// G1 v9.1 (review m-28): acceptance (above) and 'no R&D while Faulty' are K-2; the 30 s rollback is E6 - NV, not mixed into this verdict.
    const r=x.log.find(s=>s.t>=tf&&s.t<=tf+30000&&s.statuses.includes('STS_RND'));c(!r,`no R&D in [t_f, t_f+30000] while LV Faulty is held; first ${r?.t}`);
    const sf=x.log.find(s=>s.t===tf+30001);c.nv(`E6 (WDG-02 30 s window): rollback to Safe + SafetyFault at t_f+30001 not judged here; observed ${JSON.stringify({C1:sf?.out.out_LV_C1,st:sf?.statuses,SF:x.sf?sf?.out[x.sf]:'no symbol'})}`);}}
  const e=x.log.filter(s=>s.t>=R0.p).find(L.isEmg);c(!e,'no Emergency; first t='+e?.t);c.finish(t,`violated checks (p=${R0.p}, A=${R0.A}, t_f=${tf})`);});
