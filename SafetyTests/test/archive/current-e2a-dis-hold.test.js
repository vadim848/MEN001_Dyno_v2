// E2 G1 v6 (v2-tester) — DIS-HOLD: discharge requests are held as a level until the accepted lift (review G1 v5 N1(d), R5-1).
// Oracle: program/analyst/E2-plan-v5-questions/CRITERIA.md 0a2f7de9…6b4c §1; SCENARIO_DECISIONS.md f7ae580f…835d:
//  - DIS-HOLD-HV (READY): Q-V7-01 "Г" + question 73 "А" - out_HV_Discharge_Request, once issued by a descent (d = first TRUE),
//    is TRUE in every scan [d, a-1] whatever happens before the accepted R&D->Run (R&D, Unlock, R&D->Safe, Safe, Safe->R&D,
//    Emergency + Restart, every refused lift attempt); FALSE in scan u+1 and every later scan until a new issue by a descent.
//    a = first scan of the R&D->Run acceptance (out_HV_C2 TRUE or STO released - STATE_SU is not observable), u = first scan
//    out_HV_C2 TRUE (a <= u); [a, u] observation. done-left (a pulse) and a withdrawal at u+600 (v5) are FAILs.
//  - DIS-HOLD-LV (READY: question 74 "А" + DIS-HOLD-HV (question 73 "А"); a1 - E2-RC-D2 LV-A1, program/analyst/E2-RC-D2/CRITERIA.md
//    dc8b9853…afb1 §2; not a TEAM-DEFAULT): the same for out_LV_Discharge_Request with the accepted Safe->R&D. a1 = first scan >= p
//    (first press of the accepted gesture) with stage b_Step12 TRUE OR out_LV_C1 TRUE (the earlier one); u1 = first scan >= p with
//    out_LV_C1 TRUE; a1 <= u1. TRUE [d, a1-1], FALSE in u1+1 and later, [a1, u1] diagnostic. (G1 v7: was a1 = u1.)
// Not written: issue sequence (4) WDG-03 rollback (E6), (6) Config exit (E4), refused CMD_R&D_TO_RUN (E4); re-issue after an abort
// of the lift (judged by STP-006 / Q-RC-12 / EMG-RD-L tests). Emergency at e in {a, a+1}: observation (not written).
// G1 v9.2 (G3 §2.2, DIS-HOLD x8): the Restart of the issue/event sequences is pressed at e+12000 (was e+6100, before the end of the emergency
// chain); the Restart is only a stimulus to reach Safe here (its own timing is judged by EMG6-01 / G-6), the DIS-HOLD oracle is unchanged.
// Assumptions: A1..A9 helpers/e2-lifecycle.js; "R&D steady" = only b_Step_RnD, C2 OFF, C2_FBK OFF, buttons released 2100 ms.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,BLUE,GREEN,OFF}=L;
const HV='out_HV_Discharge_Request',LV='out_LV_Discharge_Request';
const grantHV=s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2;
const rndSteady=x=>x.stageSet().join()==='b_Step_RnD'&&!x.get('out_HV_C2')&&!x.get('in_HV_C2_FBK')&&x.get('out_LV_C1');
const safeSteady=x=>x.stageSet().join()==='b_Step1'&&L.statusIs(x,'STS_SAFE')&&!x.get('in_LV_C1_FBK');
function toRnDSteady(x,label){x.until(()=>rndSteady(x),20000,label);x.step(OFF,2100);}
function toSafeSteady(x,label){x.until(()=>safeSteady(x),20000,label);x.step(OFF,2100);}
// ---- HV issue sequences (each ends in steady R&D with the request issued) ----
const ISSUE={
 'STP-A Run->R&D (green 600 ms)':()=>{const x=L.cached('Run');const from=x.t+1;x.step(GREEN,600);x.step(OFF);toRnDSteady(x,'R&D after Run->R&D');return {x,from};},
 'STP-G protective descent (HV Healthy lost 200 ms in Run)':()=>{const x=L.cached('Run');const from=x.t+1;x.step({in_HV_Faulty_FBK:true},200);x.step({in_HV_Faulty_FBK:false});toRnDSteady(x,'R&D after the protective descent');return {x,from};},
 // G1 v8 (review G1 v7 N17; analyst E2-G1-v7-q §1/§4): the abort green must follow a FULL 2 s clearing from rb (both released) - pause 2100 ms
 // (was 200 ms = invalid green). rb = p+1100; green front rb+2100 >= rb+2001.
 'STP-006 abort StartingRun (green 600 ms after a 2100 ms full clearing, HV Faulty holding StartingRun)':()=>{const x=L.cached('RnD');x.step({in_HV_Faulty_FBK:true});const from=x.t+1;x.step(BOTH,1100);x.step(OFF,2100);
  assert.ok((x.get('STO_DR1')||x.get('out_HV_C2'))&&!x.statusSet().includes('STS_RUN'),'precondition: StartingRun');x.step(GREEN,600);x.step({...OFF,in_HV_Faulty_FBK:false});toRnDSteady(x,'R&D after the abort');return {x,from};},
 'Emergency chain from Run (in_ES_NC_1 FALSE 100 ms), Restart -> Safe, Safe->R&D':()=>{const x=L.cached('Run');const from=x.t+1;x.step({in_ES_NC_1:false},100);x.step({in_ES_NC_1:true},12000);
  L.restart(x);toSafeSteady(x,'Safe after Restart');x.step(BOTH,1100);x.step(OFF);toRnDSteady(x,'R&D after Safe->R&D');return {x,from};}};
// accepted R&D->Run; returns {p,a,u}
function liftRun(x){const p=x.t+1;x.step(BOTH,1100);x.step(OFF,2500);const seg=x.log.filter(s=>s.t>=p);return {p,a:L.firstAt(seg,grantHV),u:L.firstAt(seg,s=>s.out.out_HV_C2)};}
function liftRnD(x){const sym=L.hasName('b_Step12_Set');const p=x.t+1;let g2=null;if(sym)x.listeners.push((s,y)=>{if(g2==null&&s.t>=p&&y.r.get('b_Step12_Set'))g2=s.t;});
 x.step(BOTH,1100);x.step(OFF,2500);const seg=x.log.filter(s=>s.t>=p);const u=L.firstAt(seg,s=>s.out.out_LV_C1);
 const a=L.firstAt(seg,s=>s.stages.includes('b_Step12')||s.out.out_LV_C1);// E2-RC-D2 LV-A1
 t_diag.push(`LV-A1: a1=${a}, u1=${u}${sym?`, g2 (b_Step12_Set first TRUE) - a1 = ${g2==null||a==null?'n/a':g2-a} (diagnostic only)`:''}`);return {p,a,u};}
function judge(c,x,k,from,{p,a,u},lift,label=''){const d=L.firstAt(x.log.filter(s=>s.t>=from),s=>s.out[k]);
 c(d!=null&&d<p,`${label}${k} issued by the descent before the lift attempt (d=${d}, lift press p=${p})`);
 c(a!=null&&u!=null,`${label}${lift} accepted (a=${a}, u=${u}) - precondition of the release check`);
 if(d!=null&&a!=null){const off=x.log.filter(s=>s.t>=d&&s.t<=a-1&&!s.out[k]);c(off.length===0,`${label}${k} TRUE in every scan [d, a-1] = [${d}, ${a-1}] (held as a level until the accepted ${lift}; done-left / withdrawal by a refused attempt, Restart, Safe or another transition = FAIL); first FALSE t=${off[0]?.t}`);}
 if(u!=null){const on=x.log.filter(s=>s.t>=u+1&&s.out[k]);c(on.length===0,`${label}${k} FALSE in scan u+1 and every later scan (u=${u}; withdrawn at the acceptance, not at the confirmation/window u+600); first TRUE t=${on[0]?.t} (u+${on[0]?on[0].t-u:'-'})`);
  t_diag.push(`observation [a, u]=[${a}, ${u}]: ${x.log.filter(s=>s.t>=a&&s.t<=u).map(s=>+!!s.out[k]).join('')}`);}}
let t_diag=[];
const run=(t,fn)=>{t_diag=[];try{fn();}finally{for(const m of t_diag)t.diagnostic(m);}};
// ---- DIS-HOLD-HV ----
const EVENTS={
 'no event':x=>{},
 'blue 700 ms in R&D (Unlock), released':x=>{x.step(BLUE,700);x.step(OFF,2100);},
 'R&D->Safe (green 600 ms), steady Safe, Safe->R&D (BOTH)':x=>{x.step(GREEN,600);x.step(OFF);toSafeSteady(x,'Safe after R&D->Safe');x.step(BOTH,1100);x.step(OFF);toRnDSteady(x,'R&D after Safe->R&D');},
 'Emergency in R&D (in_ES_NC_1 FALSE 100 ms), Restart -> Safe, Safe->R&D':x=>{x.step({in_ES_NC_1:false},100);x.step({in_ES_NC_1:true},11900);L.restart(x);toSafeSteady(x,'Safe after Restart');x.step(BOTH,1100);x.step(OFF);toRnDSteady(x,'R&D after Safe->R&D');},
 'refused BOTH with the cover open (NC1 FALSE during the whole gesture)':x=>{x.step({...BOTH,in_InterLock_NC_1:false},1100);x.step({...OFF},200);x.step({in_InterLock_NC_1:true},2100);
  assert.ok(rndSteady(x),'precondition: R&D->Run refused with the cover open (IL-02)');},
 'refused BOTH with a permit episode NC1 FALSE [p+500, p+999) (REL01-e2)':x=>{const p=x.t+1;for(let n=p;n<p+1100;n++)x.step({...BOTH,in_InterLock_NC_1:!(n>=p+500&&n<p+999)});x.step(OFF,2100);},
 'refused BOTH at r+1999 after a blue single (pause 2 s not elapsed)':x=>{x.step(BLUE,700);x.step(OFF,1999);x.step(BOTH,1100);x.step(OFF,2100);},
 'refused late second button (green 300 ms after blue)':x=>{x.step(BLUE,300);x.step(BOTH,1100);x.step(OFF,2100);},
 // G1 v6 (review of plan E2 v6 R6-1, repro x1): legacy PLC levels (inPLC_RnD_Mode, inPLC_RnD_Mode_2) = (1,1) is the legacy Run
 // request (netlist N12/FBAnd10); it is not an accepted lift by itself.
 'refused legacy PLC lift (1,1) 300 ms with the cover open (NC1 FALSE)':x=>{x.step({in_InterLock_NC_1:false},50);x.step({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true},300);
  x.step({inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false},50);x.step({in_InterLock_NC_1:true},2100);
  assert.ok(rndSteady(x),'precondition: legacy PLC R&D->Run refused with the cover open (IL-02); stages='+x.stageSet());},
 'Emergency in R&D (in_ES_NC_1 FALSE) while legacy PLC (1,1) held 3000 ms, Restart -> Safe, Safe->R&D':x=>{x.step({in_ES_NC_1:false,inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true},3000);
  x.step({in_ES_NC_1:true,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false},11900);L.restart(x);toSafeSteady(x,'Safe after Restart');x.step(BOTH,1100);x.step(OFF);toRnDSteady(x,'R&D after Safe->R&D');},
 'refused BOTH after FBK-10 (C2_FBK TRUE 1 scan without command; BOTH only acknowledges, K3-ACK)':x=>{x.hold={in_HV_C2_FBK:true};x.step();x.hold={};x.step({},2100);x.step(BOTH,1100);x.step(OFF,2100);}};
for(const [iname,issue] of Object.entries(ISSUE))
 test(L.T(`E2a DIS-HOLD-HV issue by ${iname}; accepted R&D->Run -> HV discharge request TRUE in [d, a-1], FALSE from u+1 (Q-V7-01 "Г", question 73 "А")`),t=>run(t,()=>{
  const {x,from}=issue();const c=L.checks();const g=liftRun(x);judge(c,x,HV,from,g,'R&D->Run');c.finish(t,`violated checks (a=${g.a}, u=${g.u})`);}));
for(const [ename,ev] of Object.entries(EVENTS))if(ename!=='no event')
 test(L.T(`E2a DIS-HOLD-HV issue by STP-A Run->R&D; ${ename}; then accepted R&D->Run -> request TRUE in [d, a-1] (not withdrawn by the event), FALSE from u+1`),t=>run(t,()=>{
  const {x,from}=ISSUE['STP-A Run->R&D (green 600 ms)']();const c=L.checks();ev(x);x.step(OFF,100);const g=liftRun(x);judge(c,x,HV,from,g,'R&D->Run');c.finish(t,`violated checks (a=${g.a}, u=${g.u})`);}));
test(L.T('E2a DIS-HOLD-HV Emergency from steady Run while legacy PLC (1,1) is held (in_ES_NC_1 FALSE) -> the chain issues the HV discharge request before C2 OFF and keeps it TRUE (Q-V7-01 "Г": Discharge -> hold -> C2 OFF; C2 OFF without Discharge = FAIL)'),t=>{
 const x=L.cached('Run');const c=L.checks();x.step({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true},500);
 c(L.statusIs(x,'STS_RUN'),'precondition: still Run with the legacy PLC (1,1) held; statuses='+x.statusSet());
 const e=x.t+1;x.step({in_ES_NC_1:false},12000);const seg=x.log.filter(s=>s.t>=e);
 const c2off=L.firstAt(seg,s=>!s.out.out_HV_C2),d=L.firstAt(seg,s=>s.out[HV]);
 c(c2off!=null,'C2 OFF by the emergency chain (EMGREF-RUN); never');
 c(d!=null&&(c2off==null||d<c2off),`HV discharge request issued before C2 OFF (d=${d==null?'never':'e+'+(d-e)}, C2 OFF ${c2off==null?'never':'e+'+(c2off-e)})`);
 if(d!=null){const off=seg.filter(s=>s.t>=d&&!s.out[HV]);c(off.length===0,`request held TRUE in every scan from d during the Emergency; first FALSE e+${off[0]?off[0].t-e:'-'}`);}
 c.finish(t,`violated checks (e=${e})`);});
// ---- DIS-HOLD-LV (question 74 "А") ----
const LV_ISSUE={
 'Emergency in Safe->R&D (in_ES_NC_1 FALSE 100 ms, C1_FBK not yet ON), Restart -> Safe':()=>{const x=L.cached('Safe');x.hold={in_LV_C1_FBK:false};x.step(BOTH);x.until(()=>x.get('out_LV_C1'),1500,'Safe->R&D accepted (C1 ON command)');x.step(OFF,30);
  const from=x.t+1;x.hold={};x.step({in_ES_NC_1:false},100);x.step({in_ES_NC_1:true},11900);L.restart(x);toSafeSteady(x,'Safe after Restart');return {x,from};},
 'R&D->Safe (green 600 ms in steady R&D)':()=>{const x=L.cached('RnD');const from=x.t+1;x.step(GREEN,600);x.step(OFF);toSafeSteady(x,'Safe after R&D->Safe');return {x,from};},
 'Emergency in steady R&D (in_ES_NC_1 FALSE 100 ms), Restart -> Safe':()=>{const x=L.cached('RnD');const from=x.t+1;x.step({in_ES_NC_1:false},100);x.step({in_ES_NC_1:true},11900);L.restart(x);toSafeSteady(x,'Safe after Restart');return {x,from};}};
const LV_EVENTS={'no event':x=>{},
 'refused late second button in Safe (green 300 ms after blue)':x=>{x.step(BLUE,300);x.step(BOTH,1100);x.step(OFF,2100);},
 'refused BOTH at r+1999 after a blue single in Safe':x=>{x.step(BLUE,700);x.step(OFF,1999);x.step(BOTH,1100);x.step(OFF,2100);},
 'refused BOTH with a connector permit episode in Safe (in_LV_Connector_Interlock FALSE [p+500, p+999))':x=>{const p=x.t+1;for(let n=p;n<p+1100;n++)x.step({...BOTH,in_LV_Connector_Interlock:!(n>=p+500&&n<p+999)});x.step(OFF,2100);},
 // G1 v6 (R6-2, repro x1 (D)): legacy PLC (1,0) = Safe->R&D request (N2/FBAnd91) during an Emergency in Safe must not withdraw it.
 // G1 v7 (N12(a)): this event's oracle coincides with TEAM-DEFAULT TD-05 (SCENARIO_DECISIONS c26025c3…; analyst E2-plan-v7-TD §1) on
 // top of DIS-HOLD-LV (question 74 "А"); the full TD5-EOK criterion is written at the end of this file.
 'Emergency in Safe (in_ES_NC_1 FALSE) with legacy PLC (1,0) 300 ms [TEAM-DEFAULT TD-05], ES normal, Restart -> Safe':x=>{x.step({in_ES_NC_1:false},50);x.step({inPLC_RnD_Mode:true},300);x.step({inPLC_RnD_Mode:false},50);
  x.step({in_ES_NC_1:true},3000);L.restart(x);toSafeSteady(x,'Safe after Restart');},
 'Emergency in Safe (in_ES_NC_1 FALSE 100 ms), Restart -> Safe':x=>{x.step({in_ES_NC_1:false},100);x.step({in_ES_NC_1:true},3000);L.restart(x);toSafeSteady(x,'Safe after Restart');}};
for(const [iname,issue] of Object.entries(LV_ISSUE))for(const [ename,ev] of Object.entries(LV_EVENTS)){
 if(ename!=='no event'&&!iname.startsWith('Emergency in Safe->R&D'))continue;
 test(L.T(`E2a DIS-HOLD-LV issue by ${iname}; ${ename}; accepted Safe->R&D -> LV discharge request TRUE in [d, a1-1], FALSE from u1+1 (question 74 "А", as HV question 73)`),t=>run(t,()=>{
  const {x,from}=issue();const c=L.checks();ev(x);x.step(OFF,100);const g=liftRnD(x);judge(c,x,LV,from,g,'Safe->R&D');c.finish(t,`violated checks (u1=${g.u})`);}));}

// ---- G1 v7 (N12(b)) TD5-EOK — legacy PLC (1,0) is not executed during an Emergency in Safe (TEAM-DEFAULT TD-05) ----
// Oracle: program/analyst/E2-plan-v7-TD/CRITERIA.md 7ea3793e… §1 (TD-05, SCENARIO_DECISIONS c26025c3…, status "ждёт просмотра";
// positive control READY: TD-01 / question 74 "А" / DIS-HOLD-LV). ID MOD-001, MOD-005, EMG-011; mutant M-E2a-35.
// R-T5: steady Safe after R&D->Safe (out_Step1 only, out_LV_Discharge_Request TRUE, C1/C2 OFF, C1/C2_FBK OFF, STO set), cover closed,
// connectors normal, M = (inPLC_RnD_Mode, inPLC_RnD_Mode_2) = (0,0), buttons released. Cause from e (held to the end of the
// observation): in_ES_NC_1 FALSE / in_ES_NC_2 FALSE / in_Mentee_EStop TRUE; E = first scan b_EStop_Ok FALSE. M = (1,0) front at
// t in {E+1, E+50, E+2000}; held 3000 ms or a 50 ms pulse; then (0,0).
// Expected in every scan [t, t+3000] (Emergency active): no b_Step12 / R&D / Run stage; out_LV_Discharge_Request TRUE; out_LV_C1 and
// out_HV_C2 FALSE; STO set (STO_DR1/2 FALSE); Emergency status in every scan [E, t+3000] (not left by the PLC command).
// Then the cause removed with M = (0,0), Restart -> only Safe and no lift in the next 3000 ms (no delayed execution, D-TEAM p.1).
// t = E: observation (DIAG). t = E-1: not normed (not written). (1,0) held THROUGH the Restart: known FAIL KF-3 (current-e2d-fbk-unsolicited).
// "R&D->Safe" for R-T5: green 600 ms in steady R&D (MOD-005). Assumptions A1..A9 helpers/e2-lifecycle.js.
const PLC10={inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:false},PLC00={inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false};
let rt5=null;
function baseRT5(){if(!rt5){try{const x=L.cached('RnD');x.step(GREEN,600);x.step(OFF);toSafeSteady(x,'R-T5: Safe after R&D->Safe');rt5={x};}catch(e){rt5={error:e};}}
 if(rt5.error)throw rt5.error;const x=rt5.x.fork();const pre=x.snap();
 assert.ok(pre.stages.join()==='b_Step1'&&pre.out[LV]&&!pre.out.out_LV_C1&&!pre.out.out_HV_C2&&!pre.c1fbk&&!pre.c2fbk&&!pre.out.STO_DR1&&!pre.out.STO_DR2,
  `precondition R-T5: steady Safe after R&D->Safe with the LV discharge request TRUE, C1/C2 and FBK OFF, STO set; ${JSON.stringify({stages:pre.stages,lvReq:pre.out[LV],C1:pre.out.out_LV_C1,C2:pre.out.out_HV_C2})}`);return x;}
const CAUSE={'in_ES_NC_1 FALSE':[{in_ES_NC_1:false},{in_ES_NC_1:true}],'in_ES_NC_2 FALSE':[{in_ES_NC_2:false},{in_ES_NC_2:true}],'in_Mentee_EStop TRUE':[{in_Mentee_EStop:true},{in_Mentee_EStop:false}]};
const UPSTG=['b_Step12','b_Step_RnD','b_Step3'];
for(const [cn,[on,offc]] of Object.entries(CAUSE))for(const dt of [1,50,2000])for(const [fn,len] of [['held 3000 ms',3000],['pulse 50 ms',50]])
 test(L.T(`E2a TD5-EOK (TEAM-DEFAULT TD-05) R-T5 Safe, Emergency by ${cn}, legacy PLC (1,0) ${fn} at E+${dt} -> no S12, LV discharge request TRUE, C1/C2 OFF, STO set, Emergency kept in every scan [t, t+3000]; Restart with (0,0) -> only Safe, no delayed lift`),t=>{
  const x=baseRT5();const c=L.checks();const e=x.t+1;x.step(on);x.until(()=>!x.get('b_EStop_Ok'),500,'b_EStop_Ok FALSE after '+cn);const E=L.firstAt(x.log.filter(s=>s.t>=e),s=>!s.out.b_EStop_Ok);
  if(x.t<E+dt-1)x.step({},E+dt-1-x.t);const tt=x.t+1;c(tt===E+dt,`stand precondition: PLC front at E+${dt} (E=${E}, t=${tt})`);x.step(PLC10,len);x.step(PLC00,Math.max(1,tt+3000-x.t));
  const seg=x.log.filter(s=>s.t>=tt&&s.t<=tt+3000);c(seg.length===3001,'stand precondition: [t, t+3000] observed');
  const up=seg.find(s=>s.stages.some(v=>UPSTG.includes(v)));c(!up,`no Safe->R&D (b_Step12) / R&D / Run stage in any scan [t, t+3000]; first t+${up?up.t-tt:'-'} ${up?.stages}`);
  const lr=seg.find(s=>!s.out[LV]);c(!lr,`out_LV_Discharge_Request TRUE in every scan [t, t+3000] (TD-05, TD-01); first FALSE t+${lr?lr.t-tt:'-'}`);
  const en=seg.find(s=>s.out.out_LV_C1||s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);c(!en,`out_LV_C1 / out_HV_C2 FALSE, STO set in every scan [t, t+3000]; first t+${en?en.t-tt:'-'}`);
  const ne=x.log.filter(s=>s.t>=E&&s.t<=tt+3000).find(s=>!L.isEmg(s));c(!ne,`Emergency in every scan [E, t+3000] (not left by the PLC command); first other t=${ne?.t} [${ne?.statuses}]`);
  x.step({...offc,...PLC00},1000);L.restartToSafe(x,c,'cause removed, M=(0,0): ');const r=x.t+1;x.step({},3000);
  const l=x.log.filter(s=>s.t>=r).find(s=>s.out.out_LV_C1||s.stages.some(v=>UPSTG.includes(v)));c(!l,`after the Restart no delayed execution of the (1,0) given in the Emergency (D-TEAM p.1): no C1 ON / S12 in 3000 ms; first t=${l?.t}`);
  c.finish(t,`violated checks (e=${e}, E=${E}, t=${tt})`);});
for(const [cn,[on]] of Object.entries(CAUSE))test(L.T(`DIAG observation E2a TD5-EOK R-T5 Safe, Emergency by ${cn}, legacy PLC (1,0) 50 ms with the front exactly at t = E (convention q)`),t=>{
 let x0;try{x0=baseRT5();}catch(err){t.diagnostic('unavailable (observation only): '+err.message);return;}
 const pr=x0.fork(),e=pr.t+1;pr.step(on);pr.until(()=>!pr.get('b_EStop_Ok'),500,'EStop');const E=pr.t;// probe: E is deterministic for the same state and inputs
 const x=x0;if(E>e)x.step(on,E-e);x.step({...on,...PLC10},50);x.step(PLC00,3000);const seg=x.log.filter(s=>s.t>=E);
 t.diagnostic(`E=${E} (b_EStop_Ok FALSE first at ${L.firstAt(x.log.filter(s=>s.t>=e),s=>!s.out.b_EStop_Ok)}), front at E: S12 ${seg.some(s=>s.stages.includes('b_Step12'))}, LV request FALSE first ${L.firstAt(seg,s=>!s.out[LV])??'never'}, C1 ON first ${L.firstAt(seg,s=>s.out.out_LV_C1)??'never'}`);});
test(L.T('E2a TD5-EOK positive control (READY: TD-01 / DIS-HOLD-LV): R-T5 Safe without Emergency, legacy PLC (1,0) front held 1000 ms -> Safe->R&D accepted (b_Step12, C1 ON), LV discharge request FALSE from u1+1 (the gate is not constant FALSE)'),t=>{
 const x=baseRT5();const c=L.checks();const tt=x.t+1;x.step(PLC10,1000);x.step(PLC00,1000);const seg=x.log.filter(s=>s.t>=tt);
 const u1=L.firstAt(seg,s=>s.out.out_LV_C1);c(seg.some(s=>s.stages.includes('b_Step12')),`b_Step12 reached by the legacy (1,0); stages seen ${[...new Set(seg.map(s=>s.stages.join('+')))]}`);
 c(u1!=null,'C1 ON command issued (u1); never');if(u1!=null){const on=seg.filter(s=>s.t>=u1+1&&s.out[LV]);c(on.length===0,`out_LV_Discharge_Request FALSE from u1+1 (DIS-HOLD-LV, question 74 "А"); first TRUE u1+${on[0]?on[0].t-u1:'-'}`);}
 const e=seg.find(L.isEmg);c(!e,'no Emergency; first t='+e?.t);c.finish(t,`violated checks (t=${tt}, u1=${u1})`);});
