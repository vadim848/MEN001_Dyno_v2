// E2 G1 v5 (v2-tester) — FBK-10: contactor FBK ON without an ON command in steady Safe / R&D (MOD-008, WDG-004).
// Oracle: program/analyst/E2-G1-v4/CRITERIA_DELTA_v7.md §4.5 (378a9f93…f8459); SCENARIO_DECISIONS.md ddee4552…c07 Q-V4-02 "В"
// (lead 2026-10-22: "В" = SafetyFault + lift ban, not Emergency), E6-Q2 (acknowledgement: any button, then both released 2 s),
// Q-RC-07 (descent not blocked).
// Initial: (S1) steady Safe, C1/C2 commands OFF, C1/C2_FBK OFF, buttons released >= 2000 ms; event C1_FBK TRUE in f without a
// command. (S2) the same with C2_FBK. (R) steady R&D (C1 ON, C2 command OFF), event C2_FBK TRUE. FBK held f..f+2999, then
// FALSE; variant 1 scan (FBK ON only in f).
// Expected: no Emergency / latch; state (stage + status) and energy outputs (C1, C2, STO, SS1, discharge requests, C3/BMS)
// unchanged in every scan from f; lift ban from f: BOTH (Safe->R&D / R&D->Run) not executed while FBK ON (k1, also after an
// acknowledgement during FBK ON) and after FBK OFF without an acknowledgement (k3); after FBK OFF + acknowledgement, BOTH 1 s
// -> lift executed (k2, positive control); (R) green 600 ms -> R&D->Safe executed (Q-RC-07); FBK-10 + in_Estop_PLC ->
// Emergency by the EStop cause. SafetyFault TRUE <= f+1 - NV without the symbol (A8); PLC Fault bit - E4/E5 (not written).
// G1 v6: k4 (Q-V7-04 "Б"), K3-ACK additions and the boundary "FBK ON in f with a qualified BOTH" - current-e2d-fbk-k3ack.test.js.
// Not written here: FBK ON within 500 ms of an OFF
// command (E6-Q1/WDG-05). "Lift executed" = C1 ON command (Safe) / C2 ON command or STO released (R&D) - command outputs,
// A2 plant. Acknowledgement gesture = blue 100 ms, then both released 2100 ms (E6-Q2 "любая кнопка").
// m-9 (G1 v5 review; K3-ACK §1): SafetyFault is acknowledged AT THE PRESS SCAN (п.13, WDG-06(a)) - the 2 s release is the
// condition of the NEW attempt, not the moment of the acknowledgement. In k3 the first BOTH after FBK OFF is that acknowledging
// press: it consumes the attempt, so no lift in the same gesture under any reading (K3-ACK READY).
// Assumptions A1..A9: helpers/e2-lifecycle.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,BLUE,GREEN,OFF}=L;
const KEEP=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_SS1_DR1','out_SS1_DR2','out_LV_Discharge_Request','out_HV_Discharge_Request','out_C3_BatRelay','out_RBM_Bat'];
const emg=s=>!s.out.b_EStop_Ok||s.statuses.includes('STS_EMG');
const CASES={S1:{label:'steady Safe, C1_FBK',base:'Safe',fbk:'in_LV_C1_FBK'},S2:{label:'steady Safe, C2_FBK',base:'Safe',fbk:'in_HV_C2_FBK'},R:{label:'steady R&D, C2_FBK',base:'RnD',fbk:'in_HV_C2_FBK'}};
const lifted=(cs,s)=>cs.base==='Safe'?s.out.out_LV_C1:(s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);
function start(cs){const x=L.cached(cs.base);x.step(OFF,2100);const pre=x.snap();
 assert.ok(!pre.out.out_HV_C2&&!pre.c2fbk&&(cs.base==='RnD'?pre.out.out_LV_C1:!pre.out.out_LV_C1&&!pre.c1fbk),`precondition: ${cs.label} with the command OFF and its FBK OFF`);
 return {x,pre,f:x.t+1};}
// common checks: state/energy unchanged and no Emergency in scans [from, to]
function steady(c,x,pre,from,to,label){const seg=x.log.filter(s=>s.t>=from&&s.t<=to);
 const e=seg.find(emg);c(!e,`${label}no Emergency/latch (FBK-10 is not an emergency, Q-V4-02 "В"); first t=${e?.t}`);
 const st=seg.find(s=>s.stages.join()!==pre.stages.join()||s.statuses.join()!==pre.statuses.join());c(!st,`${label}state unchanged (${pre.stages}/${pre.statuses}); first change t=${st?.t} ${st?.stages}/${st?.statuses}`);
 const en=seg.flatMap(s=>KEEP.filter(k=>s.out[k]!==pre.out[k]).map(k=>`${k}@${s.t}`));c(en.length===0,`${label}energy / STO / SS1 / discharge outputs unchanged: ${en.slice(0,4)}`);}
function sfCheck(c,x,f){if(x.sf){const b=x.log.find(s=>s.t>=f&&s.t<=f+1&&s.out[x.sf]);c(!!b,`SafetyFault (${x.sf}) TRUE not later than f+1 (Q-V4-02 "В")`);}
 else c.nv('SafetyFault TRUE <= f+1 (Q-V4-02 "В") - no SafetyFault symbol in the source (A8); observable checks PASSED');}
const both=(x,label,cs)=>{const p=x.t+1;x.step(BOTH,1100);x.step(OFF,300);return {p,ex:x.log.filter(s=>s.t>=p).find(s=>lifted(cs,s))};};
const ack=x=>{x.step(BLUE,100);x.step(OFF,2100);};
for(const [id,cs] of Object.entries(CASES)){
 test(L.T(`E2d FBK-10 (${id}) ${cs.label} TRUE without command f..f+2999, BOTH 1 s at f+500 -> lift not executed, state/energy unchanged, no Emergency (Q-V4-02 "В")`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},500);const b=both(x,'',cs);x.step({},Math.max(0,f+2999-x.t));
  c(!b.ex,`lift ban while FBK ON: BOTH at f+500 not executed; first lift t=${b.ex?.t}`);steady(c,x,pre,f,f+2999,'');sfCheck(c,x,f);c.finish(t);});
 test(L.T(`E2d FBK-10 (${id}) k3: ${cs.label} TRUE f..f+2999 then FALSE, no acknowledgement, BOTH 1 s after 2.1 s -> lift not executed (ban until FBK OFF + acknowledgement)`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},3000);x.hold={};x.step({},2100);const b=both(x,'',cs);
  c(!b.ex,`k3: FBK OFF without acknowledgement - lift still forbidden; first lift t=${b.ex?.t}`);steady(c,x,pre,f,x.t,'');sfCheck(c,x,f);c.finish(t);});
 test(L.T(`E2d FBK-10 (${id}) k2: ${cs.label} TRUE f..f+2999 then FALSE, acknowledgement (blue 100 ms, release 2.1 s), BOTH 1 s -> lift executed (positive control)`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},3000);x.hold={};x.step({},100);const a0=x.t;ack(x);
  steady(c,x,pre,f,x.t,'until the lift: ');const b=both(x,'',cs);c(!!b.ex,`k2: after FBK OFF + acknowledgement the lift is executed (other permits present); stages=${x.stageSet()} (ack from ${a0+1})`);c.finish(t);});
 test(L.T(`E2d FBK-10 (${id}) k1: ${cs.label} TRUE, acknowledgement while FBK ON, then BOTH 1 s while FBK still ON -> lift not executed`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},100);ack(x);const b=both(x,'',cs);
  c(!b.ex,`k1: acknowledgement during FBK ON does not lift the ban; first lift t=${b.ex?.t}`);steady(c,x,pre,f,x.t,'');x.hold={};c.finish(t);});
 test(L.T(`E2d FBK-10 (${id}) ${cs.label} TRUE for 1 scan only (f), no acknowledgement, BOTH 1 s after 2.1 s -> lift not executed, no Emergency (READY-D: no filter)`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step();x.hold={};x.step({},2100);const b=both(x,'',cs);
  c(!b.ex,`1 scan FBK ON sets the ban until FBK OFF + acknowledgement; first lift t=${b.ex?.t}`);steady(c,x,pre,f,x.t,'');sfCheck(c,x,f);c.finish(t);});
 test(L.T(`E2d FBK-10 (${id}) + in_Estop_PLC at f+500 while FBK ON -> Emergency by the EStop cause, latched`),t=>{
  const {x,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},500);x.step({in_Estop_PLC:true},1000);
  const seg=x.log.filter(s=>s.t>=f+500);const i=seg.findIndex(L.isEmg);c(i>=0&&seg.slice(i).every(L.isEmg),`Emergency reached (first +${i<0?'never':seg[i].t-f-500}) and latched while the EStop cause is active`);
  c(seg.every(s=>!lifted(cs,s)||cs.base==='RnD'&&s.out.out_LV_C1&&!s.out.out_HV_C2&&!s.out.STO_DR1&&!s.out.STO_DR2),'no lift');c.finish(t);});
}
test(L.T('E2d FBK-10 (R) steady R&D, C2_FBK TRUE without command, green 600 ms at f+500 -> R&D->Safe executed (descent not blocked, Q-RC-07)'),t=>{
 const cs=CASES.R;const {x,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},500);const g=x.t+1;x.step(GREEN,600);x.step(OFF,1400);
 const seg=x.log.filter(s=>s.t>=g);c(seg.some(s=>!s.out.out_LV_C1),`R&D->Safe executed: C1 OFF command within 2000 ms of the green press; stages=${x.stageSet()}`);
 const e=x.log.filter(s=>s.t>=f).find(emg);c(!e,'no Emergency; first t='+e?.t);c.finish(t);});
// ---- G1 v6 (architect E2-status PLAN.md addendum v7.1; mutants M-E2d-12/13/14): FBK-10 lift ban also on the legacy PLC lift path.
// Oracle: Q-V4-02 "В" / v7 §4.5 ("запрет подъёма ... CMD_SAFE_TO_R&D, CMD_R&D_TO_RUN не исполняются"); legacy PLC levels: (1,0) =
// inPLC_RnD_Mode TRUE, inPLC_RnD_Mode_2 FALSE (Safe->R&D request, netlist N2/FBAnd91); (1,1) = both TRUE (R&D->Run, N12/FBAnd10).
// Only the ban while FBK is ON is asserted; bypasses of the legacy path (SafetyFault, button held, edge, simultaneous commands,
// abort E3) are known FAIL until E4/E5 and are NOT asserted here.
const PLC10={inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:false},PLC11={inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true},PLC00={inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false};
for(const id of ['S1','S2'])test(L.T(`E2d FBK-10 (${id}) ${CASES[id].label} TRUE without command, legacy PLC (1,0) 1000 ms at f+500 while FBK ON -> no lift (C1 not switched on), state unchanged, no Emergency`),t=>{
 const cs=CASES[id];const {x,pre,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},500);const p=x.t+1;x.step(PLC10,1000);x.step(PLC00,500);
 const l=x.log.find(s=>s.t>=p&&lifted(cs,s));c(!l,`lift ban while FBK ON also for the legacy PLC Safe->R&D request; first C1 ON t=${l?.t}`);
 c(!x.log.some(s=>s.t>=p&&s.stages.some(v=>['b_Step12','b_Step_RnD'].includes(v))),'no Safe->R&D stage');steady(c,x,pre,f,x.t,'');x.hold={};c.finish(t);});
test(L.T('E2d FBK-10 (R) steady R&D, C2_FBK TRUE without command, legacy PLC (1,1) 1000 ms at f+500 while FBK ON -> no C2 command, STO not released, no Run, no Emergency'),t=>{
 const cs=CASES.R;const {x,pre,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},500);const p=x.t+1;x.step(PLC11,1000);x.step(PLC00,500);
 const l=x.log.find(s=>s.t>=p&&lifted(cs,s));c(!l,`lift ban while FBK ON also for the legacy PLC R&D->Run request; first C2 ON / STO release t=${l?.t}`);
 c(!x.log.some(s=>s.t>=p&&(s.statuses.includes('STS_RUN')||s.stages.includes('b_Step3'))),'no Run');steady(c,x,pre,f,x.t,'');x.hold={};c.finish(t);});
test(L.T('E2d FBK-10 positive control: steady Safe without FBK, legacy PLC (1,0) 1000 ms -> Safe->R&D started (b_Step12), C1 ON (the legacy path is alive until E4)'),t=>{
 const x=L.cached('Safe');x.step(OFF,2100);const c=L.checks();const p=x.t+1;x.step(PLC10,1000);x.step(PLC00,200);
 c(x.log.some(s=>s.t>=p&&s.stages.includes('b_Step12')),`b_Step12 reached by the legacy PLC request; stages seen ${[...new Set(x.log.filter(s=>s.t>=p).map(s=>s.stages.join('+')))]}`);
 c(x.log.some(s=>s.t>=p&&s.out.out_LV_C1),'C1 ON command issued');c.finish(t);});
// G1 v9 (Vadim, question 76 "Б", SCENARIO_DECISIONS 2026-10-22): the legacy PLC (1,1) R&D->Run lift is disabled already in E2. The former
// FBK10-PLC-REG (2) "own legacy (1,1) start -> Run at u+601" is therefore REMOVED; its normative replacement is LEG11-OFF Q76-N1 / Q76-P3 below.
// ===================================================================================================================================
// G1 v7 (review G1 v6 N12(c)(d)(e)). Oracle: program/analyst/E2-plan-v7-TD/CRITERIA.md 7ea3793e… §2 (FBK10-PLC-A/B, boundaries,
// FBK10-PLC-REG, READY-D: Q-V4-02 "В", MOD-008, Q-V7-04 "Б"; lead decision PLAN v7 §13 (а)) and §3 (known FAIL KF-1…KF-5, KF-3-DESC;
// KF-5 / KF-3-DESC added by analyst E2-G1-v6-q f86f8ed5… §3-4). Legacy PLC levels M = (inPLC_RnD_Mode, inPLC_RnD_Mode_2): (1,0) Safe->R&D,
// (1,1) R&D->Run (netlist N2/FBAnd91, N12/FBAnd10; the real PLC semantics is NV). "Lift" as above (command outputs, plant A2).
// R-T5 = steady Safe after R&D->Safe (green 600 ms in steady R&D; out_LV_Discharge_Request TRUE). R&D(HV) = steady R&D after Run->R&D
// (green 600 ms in steady Run; out_HV_Discharge_Request TRUE).
// KF-n tests: expectation BY THE REQUIREMENT, names start with "KF-n known FAIL" (outside the mutation regex ^E2[a-d] : no kill is
// expected on E2 for these guards); on E2 they are expected to FAIL - never reported as PASS, never weakened.
const UPSTG=['b_Step12','b_Step_RnD','b_Step3'];
const memo={};
function base(kind){if(!memo[kind]){try{let x;
  if(kind==='RT5'){x=L.cached('RnD');x.step(GREEN,600);x.step(OFF);x.until(()=>x.stageSet().join()==='b_Step1'&&L.statusIs(x,'STS_SAFE')&&!x.get('in_LV_C1_FBK'),20000,'R-T5: Safe after R&D->Safe');x.step(OFF,2100);
   assert.ok(x.get('out_LV_Discharge_Request')&&!x.get('out_LV_C1')&&!x.get('out_HV_C2'),'precondition R-T5: LV discharge request TRUE, C1/C2 OFF');}
  else if(kind==='RnDHV'){x=L.cached('Run');x.step(GREEN,600);x.step(OFF);x.until(()=>x.stageSet().join()==='b_Step_RnD'&&!x.get('out_HV_C2')&&!x.get('in_HV_C2_FBK')&&x.get('out_LV_C1'),20000,'R&D after Run->R&D');x.step(OFF,2100);
   assert.ok(x.get('out_HV_Discharge_Request')&&!x.get('STO_DR1')&&!x.get('STO_DR2'),'precondition R&D(HV): HV discharge request TRUE, STO set');}
  else x=L.cached(kind);memo[kind]={x};}catch(e){memo[kind]={error:e};}}
 if(memo[kind].error)throw memo[kind].error;const x=memo[kind].x.fork();x.step(OFF);return x;}
const recSetHv=x=>{const n='b_Set_HV_C2_1';if(!L.hasName(n))return false;x.listeners.push((s,y)=>{s.setHv=y.r.get(n);});return true;};
const noEmgSeg=(c,seg,label='')=>{const e=seg.find(emg);c(!e,`${label}no Emergency (Q-V4-02 "В": FBK-10 is not an emergency); first t=${e?.t}`);};
// ---- FBK10-PLC-A: Safe->R&D by legacy (1,0) while FBK ON without command ----
const FBA={'C1_FBK':{in_LV_C1_FBK:true},'C2_FBK':{in_HV_C2_FBK:true},'both FBK':{in_LV_C1_FBK:true,in_HV_C2_FBK:true}};
for(const [bn,bk] of [['R-T5 (Safe after R&D->Safe)','RT5'],['steady Safe after boot','Safe']])for(const [fn,pins] of Object.entries(FBA))for(const dt of [1,100,3000])
 test(L.T(`E2d FBK10-PLC-A ${bn}, ${fn} ON without command from f, legacy PLC (1,0) front at f+${dt} held 1000 ms -> no S12, C1 OFF, LV discharge request kept, STO set in every scan [t, t+1500], no Emergency`),t=>{
  const x=base(bk);const c=L.checks();const pre=x.snap();c(!pre.out.out_LV_C1&&!pre.out.out_HV_C2&&!pre.c1fbk&&!pre.c2fbk,'stand precondition: steady Safe, C1/C2 and FBK OFF');
  const f=x.t+1;x.hold={...pins};x.step({},dt);const tt=x.t+1;x.step(PLC10,1000);x.step(PLC00,Math.max(1,tt+1500-x.t));x.hold={};x.step({},200);
  const seg=x.log.filter(s=>s.t>=tt&&s.t<=tt+1500);c(seg.length===1501&&seg.every(s=>Object.keys(pins).every(k=>k==='in_LV_C1_FBK'?s.c1fbk:s.c2fbk)),'stand precondition: FBK ON in every scan [t, t+1500]');
  const up=seg.find(s=>s.stages.some(v=>UPSTG.includes(v)));c(!up,`no S12 / R&D in any scan [t, t+1500]; first t+${up?up.t-tt:'-'} ${up?.stages}`);
  const c1=seg.find(s=>s.out.out_LV_C1);c(!c1,`out_LV_C1 FALSE in every scan [t, t+1500]; first ON t+${c1?c1.t-tt:'-'}`);
  if(pre.out.out_LV_Discharge_Request){const lr=seg.find(s=>!s.out.out_LV_Discharge_Request);c(!lr,`LV discharge request TRUE kept in every scan [t, t+1500] (no withdrawal); first FALSE t+${lr?lr.t-tt:'-'}`);}
  else t.diagnostic('LV discharge request was not issued in this base (criterion: "если был выдан")');
  const st=seg.find(s=>s.out.STO_DR1||s.out.STO_DR2);c(!st,`STO set in every scan [t, t+1500]; first release t+${st?st.t-tt:'-'}`);
  noEmgSeg(c,x.log.filter(s=>s.t>=f&&s.t<=tt+1500));c.finish(t,`violated checks (f=${f}, t=${tt})`);});
// G1 v9 (review V75-C; analyst E2-Q76 §4): FBK10-PLC-B removed - its oracle is replaced by LEG11-OFF Q76-N2 (ban also after FBK OFF).
// ---- boundaries FBK OFF (g first FBK FALSE scan, g = f+3000): pulse 50 ms ending in g-1 -> no lift until t+3000 (READY-D) ----
const BND=[...Object.entries(FBA).flatMap(([fn,pins])=>[['R-T5','RT5'],['boot Safe','Safe']].map(([bn,bk])=>({lab:`${bn}, ${fn}`,bk,pins,M:PLC10,safe:true}))),
 {lab:'R&D(HV), C2_FBK',bk:'RnDHV',pins:{in_HV_C2_FBK:true},M:PLC11,safe:false}];
for(const b of BND)test(L.T(`E2d FBK10-PLC boundary ${b.lab} ON f..g-1 (g=f+3000), legacy PLC ${b.safe?'(1,0)':'(1,1)'} pulse 50 ms ending in g-1 -> no lift in any scan until t+3000 (no held level after FBK OFF)`),t=>{
 const x=base(b.bk);const c=L.checks();const cs={base:b.safe?'Safe':'RnD'};const f=x.t+1;x.hold={...b.pins};x.step({},2950);const tt=x.t+1;x.step(b.M,50);x.hold={};const g=x.t+1;
 c(g===f+3000&&tt===g-50,`stand precondition: pulse [g-50, g-1], g=f+3000 (f=${f}, t=${tt}, g=${g})`);x.step(PLC00,Math.max(1,tt+3000-x.t));
 const l=x.log.find(s=>s.t>=tt&&s.t<=tt+3000&&(lifted(cs,s)||s.stages.some(v=>b.safe?UPSTG.includes(v):v==='b_Step3')));c(!l,`no lift / transition in any scan [t, t+3000]; first t+${l?l.t-tt:'-'}`);
 noEmgSeg(c,x.log.filter(s=>s.t>=f));c.finish(t,`violated checks (f=${f}, t=${tt}, g=${g})`);});
for(const b of [BND[1],BND.at(-1)])test(L.T(`DIAG observation E2d FBK10-PLC boundary ${b.lab}, legacy PLC pulse 50 ms ending exactly in g (convention q)`),t=>{
 let x;try{x=base(b.bk);}catch(err){t.diagnostic('unavailable: '+err.message);return;}const cs={base:b.safe?'Safe':'RnD'};x.hold={...b.pins};x.step({},2951);const tt=x.t+1;x.step(b.M,49);x.hold={};x.step(b.M,1);const g=x.t;x.step(PLC00,3000);
 t.diagnostic(`t=${tt}, g=${g}: first lift ${L.firstAt(x.log.filter(s=>s.t>=tt),s=>lifted(cs,s))??'never'}`);});
// ---- FBK10-PLC-REG (1): own legacy Safe->R&D start not cut by the gate ----
for(const tf of [1,250,499])test(L.T(`E2d FBK10-PLC-REG (1) R-T5 Safe, FBK OFF, legacy PLC (1,0) front held, C1_FBK ON from u1+${tf} (after the own C1 command) -> C1 kept, no R&D <= u1+599, R&D at u1+601 (RND-CONF-T, TEAM-DEFAULT TD-02), no Emergency, no return to Safe`),t=>{
 const x=base('RT5');const c=L.checks();const p=x.t+1;let u=null;
 for(let n=p;n<=p+3000;n++){x.hold=u!=null&&n<u+tf?{in_LV_C1_FBK:false}:{};x.step(n===p?PLC10:u!=null&&n===u+1000?PLC00:{});if(u==null&&x.get('out_LV_C1'))u=x.t;}
 x.step(PLC00);c(u!=null,'legacy PLC (1,0) accepted: C1 ON command issued (positive control of the legacy path)');
 if(u!=null){const tfo=L.firstAt(x.log.filter(s=>s.t>u),s=>s.c1fbk);c(tfo===u+tf,`stand precondition: C1_FBK first ON at u1+${tf}; observed u1+${tfo==null?'never':tfo-u}`);
  const rnd=s=>s.statuses.includes('STS_RND')||s.stages.includes('b_Step_RnD');const fr=L.firstAt(x.log.filter(s=>s.t>=u),rnd);
  c(x.log.filter(s=>s.t>=p&&s.t<=u+599).every(s=>!rnd(s)),`no R&D <= u1+599; R&D first at u1+${fr==null?'never':fr-u}`);
  c(x.log.filter(s=>s.t>=u+601&&s.t<=p+3000).every(rnd),`R&D at u1+601 and later (RND-CONF-T; TD-02); R&D first at u1+${fr==null?'never':fr-u}`);
  const off=x.log.find(s=>s.t>=u&&s.t<=p+3000&&!s.out.out_LV_C1);c(!off,`own FBK ON does not remove C1: C1 ON in every scan [u1, end]; first OFF u1+${off?off.t-u:'-'}`);
  const back=x.log.find(s=>s.t>u&&s.stages.join()==='b_Step1');c(!back,`no return to Safe (b_Step1 only) after u1; first u1+${back?back.t-u:'-'}`);
  const e=x.log.filter(s=>s.t>=p).find(emg);c(!e,'no Emergency; first t='+e?.t);
  if(x.sf){const sf=x.log.find(s=>s.t>=p&&s.out[x.sf]);c(!sf,`no SafetyFault from the own FBK; first t=${sf?.t}`);}else c.nv('no SafetyFault from the own FBK - no SafetyFault symbol (A8)');}
 x.hold={};c.finish(t,`violated checks (p=${p}, u1=${u})`);});
// =========================================== known FAIL KF-1 … KF-5, KF-3-DESC ===========================================
// KF-1 (WDG-004, MOD-008; Q-V4-02 "В", Q-V7-04 "Б", E6-Q2 "PLC не квитирует"): after FBK-10 the lift stays blocked until a BUTTON
// acknowledgement; a legacy PLC front after FBK OFF (no acknowledgement) or a level held through g must not lift. Until E5 (E4 for PLC).
// Not written: other SafetyFault causes (window end without FBK, Q-V7-03; HealthyLost) - listed in HANDOFF_v7.
// G1 v9: the (R) row ((1,1) after FBK-10) is normative now - LEG11-OFF Q76-N2 (b) / Q76-N4 below; KF-1 stays for (1,0) only (analyst E2-Q76 §5).
for(const [id,cs] of Object.entries(CASES).filter(([id])=>id!=='R')){const M=cs.base==='Safe'?PLC10:PLC11,mn=cs.base==='Safe'?'(1,0)':'(1,1)';
 test(L.T(`KF-1 known FAIL (until E5) FBK-10 (${id}) ${cs.label} f..f+2999, FBK OFF, no button acknowledgement, legacy PLC ${mn} NEW front at g+2100 held 1000 ms -> not executed (PLC does not acknowledge, UP blocked)`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},3000);x.hold={};const g=x.t+1;x.step({},2100);const tt=x.t+1;x.step(M,1000);x.step(PLC00,1500);
  const l=x.log.find(s=>s.t>=g&&lifted(cs,s));c(!l,`no lift after FBK OFF without a button acknowledgement (Q-V7-04 "Б", WDG-004); first lift t+${l?l.t-tt:'-'}`);steady(c,x,pre,f,x.t,'');
  if(x.sf){const off=x.log.find(s=>s.t>=f+1&&!s.out[x.sf]);c(!off,`SafetyFault stays TRUE (PLC does not acknowledge); first FALSE t=${off?.t}`);}else c.nv('SafetyFault stays TRUE - no SafetyFault symbol (A8)');c.finish(t,`violated checks (f=${f}, g=${g}, t=${tt})`);});
 test(L.T(`KF-1 known FAIL (until E5) FBK-10 (${id}) ${cs.label} f..f+2999, legacy PLC ${mn} from g-500 held through FBK OFF until g+1000 -> not executed (level held after g is not an acknowledgement)`),t=>{
  const {x,pre,f}=start(cs);const c=L.checks();x.hold={[cs.fbk]:true};x.step({},2500);const tt=x.t+1;x.step(M,500);x.hold={};const g=x.t+1;x.step(M,1000);x.step(PLC00,2000);
  const l=x.log.find(s=>s.t>=tt&&lifted(cs,s));c(!l,`no lift from the level held through g (KF-1 / v7-TD §2 boundary "M удерживается до g+1"); first lift g+${l?l.t-g:'-'}`);steady(c,x,pre,f,x.t,'');c.finish(t,`violated checks (f=${f}, g=${g})`);});}
// KF-2 (PLC-004; V14-Q14 "А"): while any physical button is pressed a PLC transition front is ignored and not executed after the release.
const KF2=[['steady Safe, blue held 1500 ms','Safe',BLUE,1500,PLC10,'pulse'],['steady Safe, blue held 1500 ms','Safe',BLUE,1500,PLC10,'held'],
 ['steady Safe, green held 400 ms','Safe',GREEN,400,PLC10,'pulse']];// G1 v9: the (1,1) rows are normative now - LEG11-OFF Q76-N3
for(const [lab,bk,btn,len,M,kind] of KF2)test(L.T(`KF-2 known FAIL (until E4) ${lab}, legacy PLC ${M===PLC10?'(1,0)':'(1,1)'} front at press+100 ${kind==='pulse'?'for 200 ms (inside the press)':'held until release+1500'} -> not executed, not executed after the release (V14-Q14 "А")`),t=>{
 const x=base(bk);const c=L.checks();const cs={base:bk};const b=x.t+1;x.step(btn,100);
 if(kind==='pulse'){x.step({...btn,...M},200);x.step({...btn,...PLC00},len-300);x.step(OFF,3000);}
 else{x.step({...btn,...M},len-100);x.step({...OFF,...M},1500);x.step({...OFF,...PLC00},3000);}
 const l=x.log.find(s=>s.t>=b&&(lifted(cs,s)||s.stages.some(v=>bk==='Safe'?UPSTG.includes(v):v==='b_Step3')));c(!l,`no lift / transition in any scan from the press; first t=b+${l?l.t-b:'-'} ${l?.stages}`);c.finish(t,`violated checks (press ${b})`);});
// KF-3 (MOD-003, PLC-001; V14-Q11, D-TEAM p.1): a command set before the stable source state (in Emergency / in a transition / in another
// state) and held is ignored until reset and a NEW front; a held level is never executed later / repeated.
test(L.T('KF-3 known FAIL (until E4) steady Safe, Emergency (in_ES_NC_1 FALSE), legacy PLC (1,0) set in the Emergency and HELD through the Restart (3000 ms after) -> no lift (no delayed execution of a held level)'),t=>{
 const x=base('Safe');const c=L.checks();x.step({in_ES_NC_1:false},50);x.step(PLC10,300);x.step({in_ES_NC_1:true},3000);L.restart(x);const r=x.t+1;x.step({},3000);x.step(PLC00);
 const l=x.log.find(s=>s.t>=r&&(s.out.out_LV_C1||s.stages.some(v=>UPSTG.includes(v))));c(!l,`held (1,0) not executed after the Restart; first t=r+${l?l.t-r:'-'}`);c.finish(t);});
test(L.T('KF-3 known FAIL (until E4) steady R&D, R&D->Safe (green 600 ms), legacy PLC (1,0) set during the descent (press+100) and HELD 3000 ms after Safe -> no Safe->R&D'),t=>{
 const x=base('RnD');const c=L.checks();const g=x.t+1;x.step(GREEN,100);x.step({...GREEN,...PLC10},500);x.step(OFF);
 x.until(()=>x.stageSet().join()==='b_Step1'&&!x.get('out_LV_C1')&&!x.get('in_LV_C1_FBK'),20000,'Safe after R&D->Safe');const s0=x.t;x.step({},3000);x.step(PLC00);
 const l=x.log.find(s=>s.t>s0&&(s.out.out_LV_C1||s.stages.some(v=>UPSTG.includes(v))));c(!l,`(1,0) set in the transition is ignored in Safe until a new front; first t=Safe+${l?l.t-s0:'-'}`);c.finish(t,`violated checks (green ${g}, Safe ${s0})`);});
// G1 v9: KF-3 '(1,1) set in Safe and held through BOTH Safe->R&D' is normative now - LEG11-OFF Q76-N5.
// ====================== G1 v9: LEG11-OFF - legacy PLC (1,1) R&D->Run disabled (Vadim, question 76 "Б") ======================
// Oracle: program/analyst/E2-Q76/CRITERIA.md ff0d82aa… (r2): N0 - in E2 M = (1,1) is not an R&D->Run command: in no state, for no length/front/level
// does it give an HV lift (out_HV_C2, b_Set_HV_C2_1, STO_DR1/2 release, recRndC_SU, stage SR/Run), withdraw out_HV_Discharge_Request, move the stages
// upward, or set SafetyFault/Emergency. LEG11-OFF (kill set of M-E2d-23, PLAN v7.5, review V75-B) = Q76-N1 (held >= 5 s; pulse 50/300/601; V75-1
// (1,0)->(1,1) incl. boundary r-1/r/r+1) + Q76-N6. Q76-N2..N8 - further bans of N0; Q76-P1..P5 - positive controls. FBK10-PLC-B and
// FBK10-PLC-REG (2) oracles are replaced by LEG11-OFF (V75-C); M-E2d-14/15/16 "removed with v7.5". out_SS1_DR* are NOT compared in N6/N7/P2
// (N1/FBAnd2 by the level M remains a legacy path, Q76 §6 OBS).
// Test-side conventions (declared): the analyst's stage "S12 = R&D" is observed as stage b_Step_RnD / STS_RND (helpers A6); b_Set_HV_C2_1 and
// recRndC_SU are part of the "HV lift" only when present in the source (absence -> diagnostic, the output part still judged).
const DIS='out_HV_Discharge_Request',SETHV='b_Set_HV_C2_1',SUS='recRndC_SU';
const rnd=s=>s.stages.includes('b_Step_RnD')||s.statuses.includes('STS_RND');
function rec(x){const h=L.hasName(SETHV),u=L.hasName(SUS);x.listeners.push((s,y)=>{if(h)s.setHv=!!y.r.get(SETHV);if(u)s.su=!!y.r.get(SUS);});return x;}
const hvLift=s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2||s.setHv||s.su||runLike(s);
const runLike=s=>s.statuses.includes('STS_RUN')||s.stages.includes('b_Step3');
// N0 in a window: R&D only, no HV lift, HV request equal to its value before 'from', C1 unchanged ON, no Emergency, no SafetyFault from (1,1).
function n0(c,x,from,to,label='',{c1=true}={}){const pre=x.log.find(s=>s.t===from-1);const seg=x.log.filter(s=>s.t>=from&&s.t<=to);
 const l=seg.find(hvLift);c(!l,`${label}no HV lift (C2 / ${SETHV} / STO release / ${SUS} / SR-Run) in any scan [${from}, ${to}] (Q76-N0); first t=${l?.t} ${l?JSON.stringify({C2:l.out.out_HV_C2,STO:l.out.STO_DR1+'/'+l.out.STO_DR2,setHv:l.setHv,su:l.su,st:l.stages}):''}`);
 const r=seg.find(s=>s.stages.join()!=='b_Step_RnD');c(!r,`${label}stage R&D only in every scan; first t=${r?.t} ${r?.stages}`);
 if(pre){const h=seg.find(s=>!!s.out[DIS]!==!!pre.out[DIS]);c(!h,`${label}${DIS} equal to its value before (${pre.out[DIS]}) in every scan (Q-V7-01 "Г", 73 "А"); first change t=${h?.t}`);}
 if(c1){const o=seg.find(s=>!s.out.out_LV_C1);c(!o,`${label}out_LV_C1 TRUE unchanged; first FALSE t=${o?.t}`);}
 const e=seg.find(L.isEmg);c(!e,`${label}no Emergency; first t=${e?.t}`);
 if(x.sf&&pre&&!pre.out[x.sf]){const f=seg.find(s=>s.out[x.sf]);c(!f,`${label}no SafetyFault from (1,1); first t=${f?.t}`);}}
const greenToSafe=(c,x,t25)=>{x.step(OFF,100);const g=x.t+1;x.step(GREEN,600);x.step(OFF,Math.max(1,t25-x.t));
 const sf=x.log.find(q=>q.t>=g&&q.stages.join()==='b_Step1'&&!q.out.out_LV_C1&&!q.out.out_HV_C2&&!L.isEmg(q));c(!!sf,'green -> Safe with C1 and C2 OFF by t+25000 (MOD-005), not only via Emergency');};
// ---- Q76-N1 (READY-Q76; was KF-5, absorbs FBK10-PLC-REG (2)): pulse w / held level in steady R&D, C2_FBK (i) OFF all the time / (ii) plant ----
const N1W=[1,50,300,499,500,501,599,600,601,1500,10000];
for(const [bn,bk] of [['R&D(HV) (HV request TRUE)','RnDHV'],['steady R&D after boot','RnD']])for(const w of N1W)for(const fb of ['i','ii'])
 test(L.T(`E2d LEG11-OFF Q76-N1 ${bn}, legacy PLC (1,1) ${w===10000?'held 10000 ms':'pulse '+w+' ms'}, C2_FBK ${fb==='i'?'(i) OFF all the time':'(ii) follows the C2 command (plant)'} -> no HV lift, R&D, HV request and C1 unchanged, no Emergency/SafetyFault in every scan [t, t+10000]; green -> Safe with C1/C2 OFF by t+25000 (question 76 "Б")`),t=>{
  const x=rec(base(bk));const c=L.checks();if(!L.hasName(SETHV)||!L.hasName(SUS))t.diagnostic(`absent in the source: ${[SETHV,SUS].filter(n=>!L.hasName(n))} (judged through the outputs)`);
  if(fb==='i')x.hold={in_HV_C2_FBK:false};const tt=x.t+1;x.step(PLC11,w);x.step(PLC00,Math.max(1,10000-w));x.hold={};n0(c,x,tt,tt+9999);greenToSafe(c,x,tt+25000);
  const l=x.log.filter(s=>s.t>=tt).find(hvLift);c(!l,`no HV lift in any scan [t, t+25000]; first t=${l?.t}`);c.finish(t,`violated checks (t=${tt}, w=${w})`);});
// ---- Q76-N1 variant V75-1: (1,0) -> (1,1) in R&D; R&D reached by legacy (1,0) or by BOTH with M = (1,0) held >= 2100 ms ----
// R&D by BOTH with M=(0,0), THEN M=(1,0) set in R&D and held >= 2100 ms (G1 v9 fix: a BOTH pressed while (1,0) already starts Safe->R&D would qualify in R&D).
function rndBy10(how){const x=rec(base('Safe'));if(how==='BOTH'){x.step(BOTH,1100);x.step(OFF);x.until(()=>x.stageSet().join()==='b_Step_RnD'&&x.get('out_LV_C1'),6000,'R&D by BOTH');x.step(OFF,2100);x.step(PLC10,1);}else x.step(PLC10,1);
 x.until(()=>x.stageSet().join()==='b_Step_RnD'&&x.get('out_LV_C1'),6000,`R&D after Safe->R&D by ${how} with M=(1,0)`);x.step(PLC10,2100);return x;}
for(const how of ['legacy (1,0)','BOTH'])for(const w of [50,300,601,10000])
 test(L.T(`E2d LEG11-OFF Q76-N1 V75-1 R&D reached by ${how} with M=(1,0) held >= 2100 ms, then M2 TRUE (code (1,1)) ${w===10000?'held 10000 ms':'for '+w+' ms then back to (1,0)'} -> no HV lift, R&D, HV request unchanged, no Emergency in every scan [t, t+10000] (question 76 "Б")`),t=>{
  const x=rndBy10(how==='BOTH'?'BOTH':'legacy');const c=L.checks();const tt=x.t+1;x.step(PLC11,w);x.step(PLC10,Math.max(1,10000-w));n0(c,x,tt,tt+9999);
  x.step(PLC00,100);greenToSafe(c,x,tt+25000);const l=x.log.filter(s=>s.t>=tt).find(hvLift);c(!l,`no HV lift in any scan [t, t+25000] (review m-27 tail); first t=${l?.t}`);c.finish(t,`violated checks (t=${tt})`);});
let r10=null;function rOf10(){if(!r10){try{const x=rec(base('Safe'));const p=x.t+1;x.step(PLC10,1);x.until(()=>rnd(x.snap()),6000,'R&D by legacy (1,0)');r10={r:L.firstAt(x.log.filter(s=>s.t>=p),rnd),p};}catch(e){r10={error:e};}}if(r10.error)throw r10.error;return r10;}
for(const k of [-1,0,1])test(L.T(`E2d LEG11-OFF Q76-N1 V75-1 boundary: Safe->R&D by legacy (1,0), M2 TRUE (code (1,1)) from r${k<0?'-1':k>0?'+1':''} (r = first R&D scan) -> no HV lift in any scan until r+3000 (question 76 "Б")`),t=>{
  const {r,p}=rOf10();const x=rec(base('Safe'));const c=L.checks();for(let n=p;n<=r+3000;n++)x.step(n>=r+k?PLC11:PLC10);
  const l=x.log.filter(s=>s.t>=p&&s.t<=r+3000).find(hvLift);c(!l,`no HV lift in [p, r+3000]; first t=${l?.t} (r=${r})`);const e=x.log.filter(s=>s.t>=p).find(L.isEmg);c(!e,'no Emergency; first t='+e?.t);c.finish(t,`violated checks (r=${r})`);});
// ---- Q76-N2 (READY-Q76; replaces FBK10-PLC-B, V75-C): (1,1) with C2_FBK ON without command; also after FBK OFF ----
const N2=[['t=f+1, held 1500 ms',x=>{x.step({},1);x.step(PLC11,1500);x.step(PLC00,1500);}],['t=f+100, held 1500 ms',x=>{x.step({},100);x.step(PLC11,1500);x.step(PLC00,1500);}],
 ['t=f+3000 with C2_FBK still ON (FBK held until f+4499), held 1500 ms (review m-26; former FBK10-PLC-B f+3000)',x=>{x.step({},3000);x.step(PLC11,1500);x.hold={};x.step(PLC00,1500);}],
 ['(a) from g-500 held through FBK OFF until g+1000',x=>{x.step({},2500);x.step(PLC11,500);x.hold={};x.step(PLC11,1000);x.step(PLC00,1500);}],
 ['(b) FBK OFF at g, new front at g+2100 for 1000 ms (no button acknowledgement)',x=>{x.step({},3000);x.hold={};x.step({},2100);x.step(PLC11,1000);x.step(PLC00,1500);}],
 ...[-1,0,1].map(k=>[`front at g${k<0?'-1':k>0?'+1':''} held 1000 ms`,x=>{x.step({},3000+Math.min(k,0));if(k<0){x.step(PLC11,1);x.hold={};x.step(PLC11,999);}else{x.hold={};x.step({},k);x.step(PLC11,1000);}x.step(PLC00,1500);}])];
for(const [nm,drv] of N2)test(L.T(`E2d LEG11-OFF Q76-N2 R&D(HV), C2_FBK ON without command f..g-1 (g=f+3000), legacy PLC (1,1) ${nm} -> no HV lift, R&D, HV request TRUE in every scan to the end, no Emergency from FBK-10 (question 76 "Б"; was FBK10-PLC-B)`),t=>{
 const x=rec(base('RnDHV'));const c=L.checks();const f=x.t+1;x.hold={in_HV_C2_FBK:true};drv(x);x.hold={};x.step({},10);
 const seg=x.log.filter(s=>s.t>=f);const l=seg.find(s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2||s.setHv||s.su||runLike(s));c(!l,`no HV lift in any scan; first t=f+${l?l.t-f:'-'}`);
 const r=seg.find(s=>s.stages.join()!=='b_Step_RnD');c(!r,`stage R&D only; first t=f+${r?r.t-f:'-'}`);const h=seg.find(s=>!s.out[DIS]);c(!h,`${DIS} TRUE in every scan; first FALSE t=f+${h?h.t-f:'-'}`);
 const e=seg.find(L.isEmg);c(!e,`no Emergency (Q-V4-02 "не Emergency"); first t=f+${e?e.t-f:'-'}`);c.finish(t,`violated checks (f=${f})`);});
// ---- Q76-N3 (READY-Q76; was KF-2 for (1,1)): (1,1) while a button is pressed ----
for(const [lab,btn,len,kind] of [['blue held 1500 ms',BLUE,1500,'pulse'],['blue held 1500 ms',BLUE,1500,'held'],['green held 400 ms (not a qualified single)',GREEN,400,'pulse']])
 test(L.T(`E2d LEG11-OFF Q76-N3 R&D(HV), ${lab}, legacy PLC (1,1) front at press+100 ${kind==='pulse'?'for 200 ms (inside the press)':'held until release+1500'} -> no HV lift until release+3000, HV request TRUE (question 76 "Б"; was KF-2)`),t=>{
  const x=rec(base('RnDHV'));const c=L.checks();const b=x.t+1;x.step(btn,100);
  if(kind==='pulse'){x.step({...btn,...PLC11},200);x.step({...btn,...PLC00},len-300);x.step(OFF,3000);}else{x.step({...btn,...PLC11},len-100);x.step({...OFF,...PLC11},1500);x.step({...OFF,...PLC00},1500);}
  const seg=x.log.filter(s=>s.t>=b);const l=seg.find(hvLift);c(!l,`no HV lift; first t=b+${l?l.t-b:'-'}`);const h=seg.find(s=>!s.out[DIS]);c(!h,`${DIS} TRUE; first FALSE t=b+${h?h.t-b:'-'}`);c.finish(t,`violated checks (press ${b})`);});
// ---- Q76-N4 (READY-Q76; was KF-1 for (1,1)): (1,1) with an active SafetyFault (FBK-10 after FBK OFF, not acknowledged) ----
for(const kind of ['pulse 50 ms','held through BOTH-1 and BOTH-2'])
 test(L.T(`E2d LEG11-OFF Q76-N4 steady R&D, FBK-10 (C2_FBK ON 3000 ms without command), FBK OFF, no acknowledgement; legacy PLC (1,1) ${kind} at g+2100 -> no HV lift, HV request kept, SafetyFault not cleared by (1,1); BOTH-1 only acknowledges; BOTH-2 after >= 2001 ms lifts (TD-06) (question 76 "Б"; E6-Q2, Q-V7-04)`),t=>{
  const x=rec(base('RnD'));const c=L.checks();const f=x.t+1;x.hold={in_HV_C2_FBK:true};x.step({},3000);x.hold={};const g=x.t+1;x.step({},2100);const m=kind.startsWith('pulse')?PLC00:PLC11;
  const tt=x.t+1;x.step(PLC11,kind.startsWith('pulse')?50:3000);x.step(m,kind.startsWith('pulse')?2950:1);
  const p1=x.t+1;x.step({...BOTH,...m},1100);const r1=x.t+1;x.step({...OFF,...m},2001);const p2=x.t+1;x.step({...BOTH,...m},1100);x.step({...OFF,...m},1500);x.step(PLC00);
  const seg=x.log.filter(s=>s.t>=g&&s.t<p2);const l=seg.find(hvLift);c(!l,`no HV lift before BOTH-2 (incl. BOTH-1 = acknowledgement only); first t=g+${l?l.t-g:'-'}`);
  if(x.sf){const off=x.log.filter(s=>s.t>=f+1&&s.t<p1).find(s=>!s.out[x.sf]);c(!off,`SafetyFault TRUE until BOTH-1 (not cleared by (1,1), E6-Q2); first FALSE t=${off?.t}`);}else c.nv('SafetyFault not cleared by (1,1) - no SafetyFault symbol (A8)');
  const u=L.firstAt(x.log.filter(s=>s.t>=p2),s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);c(u!=null&&u>=p2+1000&&u<=p2+1400,`BOTH-2 lifts: first lift in [Q2, Q2+400] (TD-06); first p2+${u==null?'never':u-p2}`);c.finish(t,`violated checks (g=${g}, t=${tt}, p1=${p1}, p2=${p2})`);});
// ---- Q76-N5 (READY-Q76; KF-3 part for (1,1)): (1,1) set in Safe and held through the button Safe->R&D ----
test(L.T('E2d LEG11-OFF Q76-N5 steady Safe, legacy PLC (1,1) from t0 held, BOTH at t0+200 -> Safe->R&D executes by the button (Q-RC-18(b)); no HV lift in [r, r+4500] (r = first R&D scan), HV request unchanged (question 76 "Б"; was KF-3)'),t=>{
 const x=rec(base('Safe'));const c=L.checks();const t0=x.t+1;x.step(PLC11,200);x.step({...BOTH,...PLC11},1100);x.step(PLC11);let r=null;
 for(let i=0;i<6000&&r==null;i++){x.step(PLC11);if(rnd(x.snap()))r=x.t;}c(r!=null,'Safe->R&D executed by BOTH although (1,1) is held (no refusal, Q-RC-18(b) "А")');
 if(r!=null){x.step(PLC11,Math.max(1,r+3000-x.t));x.step(PLC00,1500);const seg=x.log.filter(s=>s.t>=r);const l=seg.find(hvLift);c(!l,`no HV lift in [r, r+4500]; first r+${l?l.t-r:'-'}`);}c.finish(t,`violated checks (t0=${t0}, r=${r})`);});
let r5=null;function rOfBoth(){if(!r5){try{const x=base('Safe');const p=x.t+1;x.step(BOTH,1100);x.step(OFF);x.until(()=>rnd(x.snap()),6000,'R&D by BOTH');r5={p,r:L.firstAt(x.log.filter(s=>s.t>=p),rnd)};}catch(e){r5={error:e};}}if(r5.error)throw r5.error;return r5;}
for(const k of [-1,0,1])test(L.T(`E2d LEG11-OFF Q76-N5 boundary: Safe->R&D by BOTH (M=(0,0)), (1,1) front first at r${k<0?'-1':k>0?'+1':''} (r = first R&D scan of the no-event trace) held to r+3000 -> no HV lift until r+4500 (question 76 "Б")`),t=>{
 const {p,r}=rOfBoth();const x=rec(base('Safe'));const c=L.checks();for(let n=p;n<=r+4500;n++){const o={};if(n===p)Object.assign(o,BOTH);if(n===p+1100)Object.assign(o,OFF);if(n===r+k)Object.assign(o,PLC11);if(n===r+3000)Object.assign(o,PLC00);x.step(o);}
 const l=x.log.filter(s=>s.t>=r+k).find(hvLift);c(!l,`no HV lift; first r+${l?l.t-r:'-'}`);
 const ok=x.log.filter(s=>s.t>=p).find(rnd);c(!!ok,`Safe->R&D executed by BOTH although (1,1) was set around r (no refusal, Q-RC-18(b); review m-27); first R&D ${ok?.t}`);c.finish(t,`violated checks (r=${r})`);});
// ---- Q76-N6 (READY-Q76; LEG11-OFF; was KF-3-DESC): Run by BOTH, (1,1) held through the green Run->R&D descent ----
function downN6(x,c,label,hold=true){const own=L.hasName('linkRunDownOwner');if(!own)assert.fail('ERROR stand (TD-09): linkRunDownOwner absent - t_a not observable');
 let ta=null;x.listeners.push((s,y)=>{if(ta==null&&y.r.get('linkRunDownOwner'))ta=s.t;});const pg=x.t+1;const M=hold?PLC11:PLC00;x.step({...GREEN,...M},600);
 for(let i=0;i<20000&&(ta==null||x.t<ta+10000);i++)x.step({...OFF,...M});c(ta!=null,'precondition (TD-09): down acceptance marker set');
 const r=L.firstAt(x.log.filter(s=>s.t>=pg),rnd);c(r!=null,'descent Run->R&D completed (first R&D scan r)');return {pg,ta,r};}
test(L.T('E2d LEG11-OFF Q76-N6 steady Run (BOTH), legacy (1,1) from t0 <= t_a-2100 held through the green Run->R&D until t_a+10000 -> every scan [r, t_a+10000]: R&D, no SR/Run, C2 OFF, STO set, HV request TRUE; then (0,0) 600 ms and a NEW (1,1) front 1500 ms -> no HV lift until +3000; physical BOTH after >= 2100 ms -> R&D->Run (Q76-P1) (question 76 "Б")'),t=>{
 const x=rec(base('Run'));const c=L.checks();x.step(PLC11,2200);const {ta,r}=downN6(x,c,'');
 if(r!=null&&ta!=null){const seg=x.log.filter(s=>s.t>=r&&s.t<=ta+10000);const b=seg.find(s=>!rnd(s)||runLike(s)||s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2||s.setHv||s.su||!s.out[DIS]);
  c(!b,`every scan [r, t_a+10000]: R&D, no SR/Run, C2 OFF, STO set, HV request TRUE; first violation t=${b?.t} ${b?JSON.stringify({st:b.stages,C2:b.out.out_HV_C2,STO:b.out.STO_DR1,DIS:b.out[DIS]}):''}`);}
 x.step(PLC00,600);const p2=x.t+1;x.step(PLC11,1500);x.step(PLC00,1500);const l=x.log.filter(s=>s.t>=p2).find(hvLift);c(!l,`new (1,1) front: no HV lift until +3000; first p2+${l?l.t-p2:'-'}`);
 x.step(OFF,2100);const pb=x.t+1;x.step(BOTH,1100);x.step(OFF,1500);const u=L.firstAt(x.log.filter(s=>s.t>=pb),s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);
 c(u!=null&&u>=pb+1000&&u<=pb+1400,`positive control Q76-P1: BOTH lifts, first lift in [Q, Q+400] (TD-06); first p+${u==null?'never':u-pb}`);c.finish(t,`violated checks (t_a=${ta}, r=${r})`);});
let r6=null;function rOfDown(){if(!r6){try{const x=base('Run');const c=L.checks();const pre=x.t;const o=downN6(x,c,'',false);if(c.list.length)throw Error(c.list.join('; '));r6={...o,start:pre+1};}catch(e){r6={error:e};}}if(r6.error)throw r6.error;return r6;}
for(const k of [-1,0,1])test(L.T(`E2d LEG11-OFF Q76-N6 boundary: green Run->R&D with M=(0,0), (1,1) front first at r${k<0?'-1':k>0?'+1':''} (r = first R&D scan of the no-event descent) held to r+3000 -> no HV lift, C2 OFF, STO set, HV request TRUE in [r, r+3000] (question 76 "Б")`),t=>{
 const {pg,r}=rOfDown();const x=rec(base('Run'));const c=L.checks();for(let n=x.t+1;n<=r+3000;n++){const o={};if(n===pg)Object.assign(o,GREEN);if(n===pg+600)Object.assign(o,OFF);if(n>=r+k)Object.assign(o,PLC11);x.step(o);}x.step(PLC00);
 const seg=x.log.filter(s=>s.t>=r&&s.t<=r+3000);const b=seg.find(s=>!rnd(s)||runLike(s)||s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2||s.setHv||s.su||!s.out[DIS]);c(!b,`first violation t=${b?.t} ${b?.stages}`);c.finish(t,`violated checks (r=${r})`);});
// ---- Q76-N7 (READY-D): (1,1) during a StartingRun started by BOTH ----
let su7=null;function suOf(){if(!su7){try{if(!L.hasName(SUS))throw Error('ERROR precondition (TD-08): Symbol recRndC_SU absent - SU scan a not observable');
  const x=rec(base('RnD'));x.step({in_HV_Faulty_FBK:true},100);const p=x.t+1;x.step(BOTH,1100);x.step(OFF,3000);const a=L.firstAt(x.log.filter(s=>s.t>=p),s=>s.su);
  if(a==null)throw Error('precondition: SU set by BOTH (HV Faulty TRUE holds StartingRun)');su7={p,a,x};}catch(e){su7={error:e};}}if(su7.error)throw su7.error;return su7;}
function drive7(xm,{abort=false}={}){const {p,a}=suOf();const x=rec(base('RnD'));x.step({in_HV_Faulty_FBK:true},100);const end=p+(abort?20000:6000);let g=null,r=null;
 for(let n=p;n<=end;n++){const o={};if(n===p)Object.assign(o,BOTH);if(n===p+1100)Object.assign(o,OFF);if(xm!=null&&n>=a+xm)Object.assign(o,PLC11);
  if(abort&&n===p+1100+2100)Object.assign(o,GREEN);if(abort&&n===p+1100+2700)Object.assign(o,OFF);x.step(o);
  if(abort&&r==null&&n>p+3200){const q=x.snap();if(rnd(q)&&!q.out.out_HV_C2&&!q.out.STO_DR1&&!q.out.STO_DR2)r=x.t;}}return {x,r};}// r = arrival in R&D after the abort (C2 OFF, STO set)
for(const xm of [1,100,1000])test(L.T(`E2d LEG11-OFF Q76-N7(a) StartingRun by BOTH (HV Faulty TRUE holds it), (1,1) from a+${xm} (a = SU scan) held -> in every scan no HV lift / Run where the control with M=(0,0) has none (question 76 "Б"; SS1 not compared)`),t=>{
 const c=L.checks();const X=drive7(xm).x,Y=drive7(null).x;const m=new Map(Y.log.map(s=>[s.t,s]));const lift=s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2||s.setHv||s.su||runLike(s);
 const bad=X.log.filter(s=>{const y=m.get(s.t);return y&&(['out_HV_C2','STO_DR1','STO_DR2','setHv','su'].some(k=>(k in s.out?s.out[k]:s[k])&&!(k in y.out?y.out[k]:y[k]))||runLike(s)&&!runLike(y));});
 c(bad.length===0,`(1,1) adds no lift/Run versus the control; first scans ${bad.slice(0,3).map(s=>s.t)}`);c.finish(t);});
test(L.T('E2d LEG11-OFF Q76-N7(b) StartingRun by BOTH (HV Faulty TRUE), (1,1) from a+100 held; valid green 600 ms after a 2100 ms clearing aborts (V14-Q12) -> every scan [r, r+10000] after arrival in R&D: R&D, C2 OFF, STO set, HV request TRUE, no SR/Run (question 76 "Б")'),t=>{
 const c=L.checks();const {x,r}=drive7(100,{abort:true});c(r!=null,'precondition: the abort by the valid green reached R&D with C2 OFF / STO set (abort StartingRun = STP-006 / STP-E, implemented in E3; its own tests judge it)');
 if(r!=null){x.step(PLC11,Math.max(1,r+10000-x.t));const seg=x.log.filter(s=>s.t>=r&&s.t<=r+10000);const b=seg.find(s=>!rnd(s)||runLike(s)||s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2||s.su||!s.out[DIS]);c(!b,`first violation t=${b?.t}`);}
 c.finish(t,`violated checks (r=${r})`);});
test(L.T('E2d LEG11-OFF Q76-N7(c) window rollback (E6-Q1: no C2_FBK within 500 ms) while (1,1) is held -> no new lift until acknowledgement and a new BOTH'),t=>{t.todo('NOT VERIFIED: Q76-N7(c) depends on the E6 window rollback (WDG-03); written after E6 (FBK-05-W covers the rollback itself)');});
// ---- Q76-N8 (READY-Q76): (1,1) with Emergency and with the cover ----
let e8={};function eOf(cn,on){if(!e8[cn]){try{const x=base('RnDHV');const e=x.t+1;x.step(on,100);const E=L.firstAt(x.log.filter(s=>s.t>=e),s=>!s.out.b_EStop_Ok);if(E==null)throw Error('precondition: b_EStop_Ok FALSE after '+cn);e8[cn]={e,E};}catch(err){e8[cn]={error:err};}}if(e8[cn].error)throw e8[cn].error;return e8[cn];}
for(const [cn,on,offv] of [['in_ES_NC_1 FALSE',{in_ES_NC_1:false},{in_ES_NC_1:true}],['in_ES_NC_2 FALSE',{in_ES_NC_2:false},{in_ES_NC_2:true}],['in_Mentee_EStop TRUE',{in_Mentee_EStop:true},{in_Mentee_EStop:false}]])for(const k of [-1,0,1])
 test(L.T(`E2d LEG11-OFF Q76-N8 R&D(HV), ${cn} at e, (1,1) front at E${k<0?'-1':k>0?'+1':''} (E = first b_EStop_Ok FALSE) held 3000 ms, then through the Restart -> no HV lift in any scan, HV request TRUE unbroken; after Restart Safe and the held (1,1) gives neither R&D/Safe->R&D nor a lift (question 76 "Б")`),t=>{
  const {e,E}=eOf(cn,on);const x=rec(base('RnDHV'));const c=L.checks();for(let n=x.t+1;n<=E+3000;n++){const o={};if(n===e)Object.assign(o,on);if(n>=E+k)Object.assign(o,PLC11);x.step(o);}
  x.step({...offv,...PLC11},6000);L.restart(x);x.step(PLC11,3000);x.step(PLC00);const seg=x.log.filter(s=>s.t>=e);const l=seg.find(hvLift);c(!l,`no HV lift; first t=e+${l?l.t-e:'-'}`);
  const h=x.log.filter(s=>s.t>=e&&s.t<=E+3000).find(s=>!s.out[DIS]);c(!h,`${DIS} TRUE unbroken through the Emergency; first FALSE t=${h?.t}`);
  const last=x.log.slice(-3000);c(last.every(s=>!s.stages.includes('b_Step12')&&!rnd(s)),'after Restart the held (1,1) gives no Safe->R&D / R&D');c.finish(t,`violated checks (e=${e}, E=${E})`);});
for(const nc of ['in_InterLock_NC_1','in_InterLock_NC_2'])for(const held of [true,false])
 test(L.T(`E2d LEG11-OFF Q76-N8 R&D(HV), ${nc} FALSE from c, (1,1) at c+50 for 300 ms, cover closed at c+600 with (1,1) ${held?'still held':'already removed'} -> no HV lift until +3000, HV request TRUE (question 76 "Б"; D-V74-2)`),t=>{
  const x=rec(base('RnDHV'));const c=L.checks();const c0=x.t+1;x.step({[nc]:false},50);x.step({[nc]:false,...PLC11},300);if(held){x.step({[nc]:false,...PLC11},250);x.step({[nc]:true,...PLC11},3000);x.step(PLC00);}else{x.step({[nc]:false,...PLC00},250);x.step({[nc]:true},3000);}
  const seg=x.log.filter(s=>s.t>=c0);const l=seg.find(hvLift);c(!l,`no HV lift; first c+${l?l.t-c0:'-'}`);const h=seg.find(s=>!s.out[DIS]);c(!h,`${DIS} TRUE; first FALSE c+${h?h.t-c0:'-'}`);c.finish(t);});
// ---- Q76-P1..P5 positive controls ----
function bothLift(x,{m=null,fbkAt=null}={}){const p=x.t+1;let u=null;for(let n=p;n<=p+4000;n++){const o={};if(n===p)Object.assign(o,BOTH);if(n===p+1100)Object.assign(o,OFF);if(m)Object.assign(o,m(n,p));
  x.hold=fbkAt!=null&&u!=null&&n<u+fbkAt?{in_HV_C2_FBK:false}:{};x.step(o);if(u==null&&(x.get('out_HV_C2')||x.get('STO_DR1')||x.get('STO_DR2')))u=x.t;}x.hold={};return {p,u};}
test(L.T('E2d LEG11-OFF Q76-P1 R&D(HV), BOTH 1100 ms, M=(0,0) -> no lift in [p, Q-1], first lift u in [Q, Q+400] (TD-06), no Run <= u+599 and Run at u+601 (RUN-CONF-T, TD-02), HV request FALSE not later than u+1 (DIS-HOLD-HV, 73 "А")'),t=>{
 const x=base('RnDHV');const c=L.checks();const {p,u}=bothLift(x);c(u!=null&&u>=p+1000&&u<=p+1400,`first lift in [Q, Q+400]; p+${u==null?'never':u-p}`);
 if(u!=null){c(x.log.filter(s=>s.t>=p&&s.t<=u+599).every(s=>!runLike(s)),'no Run <= u+599');c(x.log.filter(s=>s.t>=u+601&&s.t<=p+4000).every(runLike),'Run at u+601 and later');
  const h=x.log.find(s=>s.t===u+1);c(h&&!h.out[DIS],`HV request FALSE at u+1; ${h?.out[DIS]}`);}c.finish(t,`violated checks (p=${p}, u=${u})`);});
for(const [vn,from] of [['from p-3000',-3000],['from p+500 (inside the gesture)',500]])
 test(L.T(`E2d LEG11-OFF Q76-P2 R&D(HV), legacy (1,1) held ${vn} to p+5000, BOTH 1100 ms -> same lift as the control with M=(0,0) in every scan (C2, STO, stages, statuses, HV request; SS1 not compared) (question 76, Q-RC-18(b), V14-Q14)`),t=>{
  const c=L.checks();const run=m=>{const x=base('RnDHV');if(m&&from<0)x.step(PLC11,-from);const r=bothLift(x,{m:m?(n,p)=>n>=p+Math.max(0,from)&&n<=p+5000?PLC11:PLC00:null});x.step(PLC00,1000);return {x,...r};};
  const X=run(true),Y=run(false);const key=s=>JSON.stringify([s.out.out_HV_C2,s.out.STO_DR1,s.out.STO_DR2,s.out[DIS],s.stages,s.statuses]);
  const dt=X.p-Y.p;const m=new Map(Y.x.log.map(s=>[s.t+dt,s]));const d=X.x.log.filter(s=>s.t>=X.p&&m.has(s.t)&&key(s)!==key(m.get(s.t))).map(s=>'p+'+(s.t-X.p));
  c(X.u!=null&&Y.u!=null&&X.u-X.p===Y.u-Y.p,`same first lift u-p: (1,1) ${X.u==null?'never':X.u-X.p}, control ${Y.u==null?'never':Y.u-Y.p}`);c(d.length===0,'equal to the control in every scan: first differences '+d.slice(0,4));c.finish(t);});
for(const xf of [1,250,499])test(L.T(`E2d LEG11-OFF Q76-P3 R&D(HV), BOTH, own C2_FBK first ON at u+${xf} -> C2 kept, no return to R&D, no Run <= u+599, Run at u+601 (RUN-CONF-T, TD-02), no Emergency/SafetyFault (Q-V4-02; replaces FBK10-PLC-REG (2))`),t=>{
 const x=base('RnDHV');const c=L.checks();const {p,u}=bothLift(x,{fbkAt:xf});c(u!=null,'BOTH lifts');
 if(u!=null){const tf=L.firstAt(x.log.filter(s=>s.t>u),s=>s.c2fbk);c(tf===u+xf,`stand precondition: C2_FBK first ON at u+${xf}; u+${tf==null?'never':tf-u}`);
  const off=x.log.find(s=>s.t>=u&&s.t<=u+601&&!s.out.out_HV_C2);c(!off,`C2 kept in [u, u+601]; first OFF u+${off?off.t-u:'-'}`);
  c(x.log.filter(s=>s.t>=u&&s.t<=u+599).every(s=>!runLike(s)),'no Run <= u+599');c(x.log.filter(s=>s.t>=u+601&&s.t<=p+4000).every(runLike),'Run at u+601 and later');
  const e=x.log.filter(s=>s.t>=p).find(L.isEmg);c(!e,'no Emergency');if(x.sf){const f=x.log.filter(s=>s.t>=p).find(s=>s.out[x.sf]);c(!f,'no SafetyFault from the own FBK');}else c.nv('no SafetyFault - no SafetyFault symbol (A8)');}
 c.finish(t,`violated checks (p=${p}, u=${u})`);});
test(L.T('E2d LEG11-OFF Q76-P5 steady Run (BOTH), legacy (0,1) front held 3000 ms -> the descent Run->R&D is executed: arrival in R&D, C2 OFF, STO set, HV request TRUE (question 76: (0,1) descent not disabled; moments not normed here)'),t=>{
 const x=base('Run');const c=L.checks();const p=x.t+1;x.step({inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:true},3000);x.step(PLC00);x.until(()=>rnd(x.snap())&&!x.get('out_HV_C2')&&!x.get('in_HV_C2_FBK'),20000,'R&D after the (0,1) descent');
 const s=x.snap();c(!s.out.STO_DR1&&!s.out.STO_DR2&&s.out[DIS],`R&D with STO set and HV request TRUE; ${JSON.stringify({STO:s.out.STO_DR1,DIS:s.out[DIS]})}`);c.finish(t,`violated checks (p=${p})`);});
