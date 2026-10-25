// E2 G1 v2 (v2-tester): Emergency scenarios shared by current-e2*-emg-*.test.js and current-e2a-sweep-*.test.js.
// Oracle sources (SCENARIO_DECISIONS.md working copy, SHA in program/tester/E2-G1/HANDOFF_v2.md;
// CRITERIA v2 §0 EMGREF/EMGREF-RUN + analyst CRITERIA_DELTA EMGREF-LV/EMG6-01/EMG4-03):
//  G1 v3: all moments by rule L (helpers/e2-rule-l.js; CRITERIA_DELTA_v4 §0.1) - the absolute "<= e+1" and "same scan" of
//    v2 and the A10 whole-sequence shift are removed. L1 for every cause != in_Estop_PLC (incl. connector, EMG4-03),
//    L2 for in_Estop_PLC in every phase != steady Run, L3 for in_Estop_PLC in steady Run vs reference 4495a1f, L4 always.
//  EMGREF (1) status Emergency and latched; exit only by EMG6-01 Restart; (2) no new energy increase,
//    no STO release, Unlock FALSE; (3) moments by rule L.
//  EMGREF-RUN: end state STO active, C2/C1/C3/BMS OFF, discharge performed (Q-RC-01).
//  EMGREF-LV (Q-ARCH-01 "А", Q-RC-14 "А"): from R&D / R&D->Safe / accepted Safe->R&D: general emergency chain as in Run:
//    C3/BMS OFF and LV discharge at once, C1 OFF after 2 s - rule L2 vs in_Estop_PLC in steady Run (q-1 C1 still ON,
//    q+1 OFF); STO active and C2 OFF continuously; HV discharge: if absent only reported (CRITERIA_DELTA EMGREF-LV 2).
//    Safe->R&D: R&D never confirmed >= e, C3/BMS not switched on; C1 OFF after 2 s as in Run (Q-E2Q-01 "А").
//  EMG6-01 refused Restart (review M-a): green press at e+1000 whenever the cause is active or C1_FBK is still ON there -
//    also for 1-scan causes (cause already gone) - and a variant "cause removed at e+500, Restart at e+1000" (run(..,
//    {removeAt:500})): stays Emergency, no delayed exit.
//  EMG6-01 / V14-Q6 / Q-ARCH-01 / Q-RC-14: Restart (green press+release) at active cause or before C1_FBK OFF -> stays
//    Emergency, no delayed exit; after the cause is removed and energy removed -> ONLY Safe (reviewer G1 C2).
//  Causes: ES_NC_1/2, in_Estop_PLC, Mentee (V14-Q19 "как в любом состоянии"), LV/HV connector (Q-RC-14; not in Safe:
//    EMG-003), connector 1 scan and steady (EMG4-03; EMG-005 restoration does not cancel).
import assert from 'node:assert/strict';
import * as L from './e2-lifecycle.js';
import * as RL from './e2-rule-l.js';
const {BOTH,GREEN,OFF}=L;
export const CAUSES={
 ES1:{label:'in_ES_NC_1 FALSE',on:{in_ES_NC_1:false},off:{in_ES_NC_1:true},tag:'E2a'},
 ES2:{label:'in_ES_NC_2 FALSE',on:{in_ES_NC_2:false},off:{in_ES_NC_2:true},tag:'E2a'},
 PLC:{label:'in_Estop_PLC TRUE',on:{in_Estop_PLC:true},off:{in_Estop_PLC:false},tag:'E2a'},
 MENTEE:{label:'in_Mentee_EStop TRUE',on:{in_Mentee_EStop:true},off:{in_Mentee_EStop:false},tag:'E2a'},
 LVC:{label:'in_LV_Connector_Interlock FALSE steady',on:{in_LV_Connector_Interlock:false},off:{in_LV_Connector_Interlock:true},tag:'E2b',conn:true},
 HVC:{label:'in_HV_Connector_Interlock FALSE steady',on:{in_HV_Connector_Interlock:false},off:{in_HV_Connector_Interlock:true},tag:'E2b',conn:true},
 LVC1:{label:'in_LV_Connector_Interlock FALSE 1 scan',on:{in_LV_Connector_Interlock:false},off:{in_LV_Connector_Interlock:true},tag:'E2b',conn:true,pulse:true},
 HVC1:{label:'in_HV_Connector_Interlock FALSE 1 scan',on:{in_HV_Connector_Interlock:false},off:{in_HV_Connector_Interlock:true},tag:'E2b',conn:true,pulse:true}};
export const FAMILY={Safe:'safe','Safe->R&D':'lvRise','R&D':'lv','R&D->Safe':'lv',StartingRun:'run',Run:'run','Run-down':'run'};
const phaseNow=x=>`${x.stageSet().join('+')||'none'} C1=${x.get('out_LV_C1')} C2=${x.get('out_HV_C2')} STO=${x.get('STO_DR1')}/${x.get('STO_DR2')}`;
// Phase producers (real lifecycle, then a gesture); feedback pins < 500 ms (A2) keep the transition open until e.
const bases=new Map();
function enter(phase){
 if(bases.has(phase)){const b=bases.get(phase);if(b.error)throw b.error;const x=b.x.fork();return x;}
 let b,g=null,preG=null;try{let x;
  if(phase==='Safe')x=L.cached('Safe');
  else if(phase==='Safe->R&D'){x=L.cached('Safe');x.hold={in_LV_C1_FBK:false};x.step(BOTH);
   x.until(()=>x.get('out_LV_C1'),1500,'Safe->R&D accepted (C1 ON command)');x.step(OFF,30);
   assert.ok(!x.get('b_Step_RnD')&&!x.statusSet().includes('STS_RND'),'precondition: R&D not confirmed (C1_FBK pinned OFF 30 ms)');}
  else if(phase==='R&D')x=L.cached('RnD',{c3:true});
  else if(phase==='R&D->Safe'){x=L.cached('RnD',{c3:true});x.hold={in_LV_C1_FBK:true};x.step(GREEN);
   x.until(()=>!x.get('out_LV_C1'),1000,'R&D->Safe accepted (C1 OFF command)');x.step(OFF,30);
   assert.ok(!x.get('b_Step1'),'precondition: Safe not reached (C1_FBK pinned ON 30 ms)');}
  else if(phase==='StartingRun'){x=L.cached('RnD',{c3:true});x.hold={in_HV_C2_FBK:false};x.step(BOTH);
   x.until(()=>x.get('out_HV_C2')||x.get('STO_DR1'),1500,'R&D->Run accepted (C2 ON or STO released)');x.step(OFF,50);
   assert.ok(!x.get('b_Step3')&&!x.statusSet().includes('STS_RUN'),'precondition: Run not confirmed (C2_FBK pinned OFF 50 ms)');}
  else if(phase==='Run')x=L.cached('Run',{c3:true});
  else if(phase==='Run-down'){x=L.cached('Run',{c3:true});g=x.t+1;preG=x.snap();x.step(GREEN,600);}
  else throw Error('unknown phase '+phase);
  b={x,g,preG};}catch(e){b={error:e};}
 bases.set(phase,b);if(b.error)throw b.error;return b.x.fork();
}
const memo=new Map();
// Emergency timeline shared by candidate scenarios AND the reference anchor (same helper, rule L3): event at e (buttons
// released); 1-scan causes restored at e+1; optional removal at removeAt; refused Restart = green 100 ms at e+1000 when the
// cause is still active OR C1_FBK is still ON (EMG6-01 "до C1_FBK OFF"; M-a); cause removed at e+10000; latchEnd = e+10099.
// G1 v5 (v7 §1 combos): inject = {at: absolute scan, inp} - an additional input change inside the timeline (e.g. Healthy loss h >= e).
export function timeline(x,cause,{removeAt=null,inject=null}={}){const out={};const e=x.t+1;out.e=e;x.hold={};x.step({...cause.on,...OFF,...(inject?.at===e?inject.inp:{})});if(cause.pulse)x.step(cause.off);
 const to=inject&&inject.at>e?t=>{while(x.t<t){const n=x.t+1;x.step(n===inject.at?inject.inp:{});}}:t=>{if(x.t<t)x.step({},t-x.t);};
 if(removeAt!=null&&!cause.pulse){to(removeAt-1);x.step(cause.off);}
 to(e+999);out.c1fbkAtRestart=!!x.get('in_LV_C1_FBK');const active=!cause.pulse&&removeAt==null;
 out.refused=active||out.c1fbkAtRestart;if(out.refused){x.step(GREEN,100);x.step(OFF);}
 to(e+9999);if(!cause.pulse&&removeAt==null)x.step(cause.off);to(e+10099);out.latchEnd=x.t;return out;}
// No-event continuation of a phase - DIAGNOSTIC ONLY since G1 v4 (A11 removed, review G1 v3 N6), memoised per phase.
const noEv=new Map();
export function noEvent(phase){if(!noEv.has(phase)){let v;try{const x=enter(phase);const pre=x.snap(),e=x.t+1;x.hold={};x.step(OFF);x.step({},10099);
  v={x,pre,e,p:RL.profile(x.log,pre,e,e+10099)};}catch(err){v={error:err};}noEv.set(phase,v);}
 const v=noEv.get(phase);if(v.error)throw v.error;return v;}
export function run(phase,key,opt={}){const id=phase+'|'+key+(opt.removeAt?'|removed':'');if(memo.has(id))return memo.get(id);
 const cause=CAUSES[key];const res={phase,key,cause,checks:L.checks(),aborted:null,stages:[],status:[],variant:opt.removeAt?'removed':''};
 try{const x=enter(phase);res.x=x;res.hit=phaseNow(x);res.pre=x.snap();res.hist=bases.get(phase).x.log;res.g=bases.get(phase).g;res.preG=bases.get(phase).preG;
  res.stages=L.watchStages(x);res.status=L.watchStatus(x);
  const tl=timeline(x,cause,{removeAt:opt.removeAt?x.t+1+opt.removeAt:null});Object.assign(res,tl);
  res.profile=RL.profile(x.log,res.pre,res.e,res.latchEnd);
  L.restartToSafe(x,res.checks,'');res.end=x.t;
 }catch(err){res.aborted=err.message;}
 memo.set(id,res);return res;}
// Rule-L profile of in_Estop_PLC in steady Run (L2 base).
export function runRef(){const r=run('Run','PLC');if(r.aborted)throw Error('reference in_Estop_PLC in steady Run aborted: '+r.aborted);return r.profile;}
// Rule L3: the same steady-Run producer and timeline on the pinned reference 4495a1f (A12). Reference lifecycle: Safe ->
// green held 2100 ms (reference Step2 start, Network2/FBTon3 2.0 s) -> Run (b_Step3) -> 2100 ms -> C3/BMS manual set.
export function refAnchorProfile(){const x=L.boot(L.create({source:'ref'}));x.step(GREEN,2100);x.step(OFF);
 x.until(()=>x.get('b_Step3'),12000,'reference Run (b_Step3)');x.step({},2100);L.withC3(x);
 assert.ok(x.stageSet().join()==='b_Step3'&&['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2'].every(k=>x.get(k)),'reference precondition: steady Run with C1/C2 ON, STO released');
 const pre=x.snap();const tl=timeline(x,CAUSES.PLC);return RL.profile(x.log,pre,tl.e,tl.latchEnd);}
// L3-Safe anchor (CRITERIA_DELTA_v6 §2, READY-D): the same Safe producer and timeline on the pinned reference 4495a1f (A12):
// boot (group start -> Emergency -> Restart -> Safe, 2100 ms) -> buttons released 2100 ms -> in_Estop_PLC at e.
export function refSafeProfile(){const x=L.boot(L.create({source:'ref'}));x.step(OFF,2100);
 assert.ok(x.stageSet().join()==='b_Step1','reference precondition: steady Safe (b_Step1 only)');
 const pre=x.snap();const tl=timeline(x,CAUSES.PLC);return RL.profile(x.log,pre,tl.e,tl.latchEnd);}
// Reference traces for the N3 check on the reference itself (stand test): steady Run + in_Estop_PLC, whole log.
export function refRunTrace(){const x=L.boot(L.create({source:'ref'}));x.step(GREEN,2100);x.step(OFF);
 x.until(()=>x.get('b_Step3'),12000,'reference Run (b_Step3)');x.step({},2100);L.withC3(x);const pre=x.snap();const tl=timeline(x,CAUSES.PLC);return {x,pre,...tl};}
// All EMGREF/EMG6-01 checks of one scenario (M6: every violated check reported).
export function emergencyChecks(r,t){
 const c=r.checks,{x,e}=r;const latch=x.log.filter(s=>s.t>=e&&s.t<=r.latchEnd);const fam=FAMILY[r.phase];const diag=m=>t?.diagnostic(m);
 RL.latched(c,x.log,e,r.latchEnd);
 if(!r.refused)diag('no refused Restart in this scenario (1-scan cause and C1_FBK already OFF at e+999)');
 const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid','out_SS1_DR1','out_SS1_DR2'].flatMap(k=>L.rises(latch,k).map(v=>k+'@'+(v-e)));
 c(rs.length===0,`EMGREF(2): no new energy increase / STO release / Unlock after e (offsets from e): ${rs.slice(0,6)}`);
 c(latch.filter(s=>s.t>e).every(s=>!s.out.out_Door_Unlock_Solonoeid),'EMGREF(2): Unlock FALSE');
 // v6 §2 (Q-ARCH-10, EMGREF(2)): Unlock FALSE in every scan with status Emergency (also scan e if already Emergency there).
 const ue=latch.filter(s=>L.isEmg(s)&&s.out.out_Door_Unlock_Solonoeid);c(ue.length===0,'v6 §2: Unlock FALSE in every Emergency scan; first violation t=+'+(ue[0]?ue[0].t-e:'-'));
 if(r.variant==='removed')return c;// timing rules apply to the primary scenario; this variant checks the refused Restart + latch.
 // G1 v4: no no-event relaxation (A11 removed, N6). Descent phases (Run-down = STP-A after the green; R&D->Safe) by EMG-RD-L.
 // v6 §2: in Safe L2 is not applied (no base); in_Estop_PLC in Safe -> L3-Safe (status <= ref_Safe+1), other causes L1 as before.
 const area=descentArea(r);let ref=null;if(area||(r.key==='PLC'&&r.phase!=='Run'&&r.phase!=='Safe')){try{ref=runRef();}catch(err){c(false,'L2 base / q_R (in_Estop_PLC in steady Run) unavailable: '+err.message);}}
 const p=r.key==='PLC'?null:run(r.phase,'PLC');if(p?.aborted)c(false,'L1 reference in_Estop_PLC in '+r.phase+' aborted: '+p.aborted);
 let rd={skip:new Set(),excl:new Set()};
 if(area?.error)c(false,area.error);// C4: stand precondition g <= t_a < e (else downTa would take the emergency reaction as t_a)
 if(area&&!area.error&&ref&&(r.key==='PLC'||p&&!p.aborted)){
  if(area.ta!==undefined)diag(`EMG-RD-L reference scans (same trace): ${JSON.stringify(area.pts)}`);
  rd=RL.EMGRDL(c,r.profile,{e,qN:area.qN,run:ref,R:r.key==='PLC'?null:p.profile,log:area.log,end:r.latchEnd,diag});
  diag(`EMG-RD-L executed assertions (C4): ${RL.assertLedger(c,rd.ledger,area.expect)}`);
  try{diag('no-event continuation (diagnostic only, not oracle): '+JSON.stringify(noEvent(r.phase).p));}catch{}}
 RL.L4(c,r.profile,rd.excl);
 if(r.key==='PLC'){
  if(r.phase==='Run')RL.L3(c,r.profile,RL.REF_RUN_PLC);
  else if(r.phase==='Safe'){const st=r.profile.status,q=RL.REF_SAFE_PLC.status;
   c(typeof st==='number'&&st<=q+1,`L3-Safe (v6 §2): status Emergency +${st===null?'never':st} vs reference 4495a1f in Safe +${q} (allowed <= ${q+1})`);
   const ss=latch.filter(s=>s.t>=e+(typeof st==='number'?st:0)&&s.statuses.includes('STS_SAFE'));c(ss.length===0,'L3-Safe: STS_SAFE only in scans e..e+tau-1; first later t=+'+(ss[0]?ss[0].t-e:'-'));
   for(const k of ['out_LV_Discharge_Request','out_HV_Discharge_Request'])if(typeof r.profile[k]==='number'||r.profile[k]===null)diag(`observation (v6 §2, not required): ${k} +${r.profile[k]??'never'}`);}
  else if(ref&&r.phase==='StartingRun'){const h=RL.hv0(x.log,e,r.latchEnd);diag('TD-11 precondition (HV never raised at/after e): '+h);RL.L2su(c,r.profile,ref,'',diag,{skip:rd.skip,hv0:h});if(h)RL.hv0Discharge(c,r.profile,ref,x.log,e,r.latchEnd);}// G1 v8 TD-10, v9 TD-11
  else if(ref&&['R&D','R&D->Safe','Safe->R&D'].includes(r.phase))RL.L2rd(c,r.profile,ref,'',diag,{hvAbsentDiag:fam==='lv'||fam==='lvRise',skip:rd.skip});// G1 v9.2 G3Q-1
  else if(ref)RL.L2(c,r.profile,ref,'',diag,{hvAbsentDiag:fam==='lv'||fam==='lvRise',skip:rd.skip});}
 else if(p&&!p.aborted){const hS=r.phase==='StartingRun'&&RL.hv0(x.log,e,r.latchEnd)&&RL.hv0(p.x.log,p.e,p.latchEnd);const DIS='out_HV_Discharge_Request';
  RL.L1(c,r.profile,p.profile,'',{skip:new Set([...rd.skip,...(hS?[DIS]:[])])});// G1 v9 TD-11: L1 for the discharge tau_X <= tau_R only
  if(hS){const a=r.profile[DIS],b=p.profile[DIS];c(a==='n/a'&&b==='n/a'||typeof a==='number'&&(b===null||typeof b==='number'&&a<=b),`L1 (TD-11) ${DIS}: cause +${a} vs in_Estop_PLC +${b} (tau_X <= tau_R, no lower bound)`);}
   if(['R&D','R&D->Safe','Safe->R&D'].includes(r.phase)){let rr=null;try{rr=runRef();}catch(err){c(false,'G3Q-1 L1 lower bound: steady Run base unavailable: '+err.message);}if(rr)RL.L1suLower(c,r.profile,rr,'G3Q-1 ');}// G1 v9.2 G3Q-1 (L1 causes: d_Run-2, C1 >= 2000)
   if(r.phase==='StartingRun'){let rr=null;try{rr=runRef();}catch(err){c(false,'TD-10 L1-SU lower bound: steady Run base unavailable: '+err.message);}if(rr){const h=RL.hv0(x.log,e,r.latchEnd);RL.L1suLower(c,r.profile,rr,'',{skip:new Set(h?['out_HV_Discharge_Request']:[])});if(h)RL.hv0Discharge(c,r.profile,rr,x.log,e,r.latchEnd);}}// G1 v8 TD-10, v9 TD-12/TD-11
   const d=RL.otherDiffs(latch,p.x.log.filter(s=>s.t>=p.e&&s.t<=p.latchEnd),e);
   if(d.length)diag('observation (outputs outside rule L): '+d.join('; '));}
 if(fam==='lv'||fam==='lvRise'){
  c(latch.every(s=>!s.out.out_HV_C2&&!s.out.STO_DR1&&!s.out.STO_DR2),'EMGREF-LV(2): C2 OFF and STO active continuously from e');
  c(L.firstAt(latch,s=>s.out.out_LV_Discharge_Request)!=null,'EMGREF-LV(4): LV discharge performed');
  if(r.phase==='Safe->R&D'){
   c(latch.every(s=>!s.stages.includes('b_Step_RnD')&&!s.statuses.includes('STS_RND')),'EMGREF-LV(3): R&D never confirmed after e although C1_FBK ON and LV healthy (Q-ARCH-01 "подъём прекращается немедленно")');
   c(latch.every(s=>!s.out.out_C3_BatRelay&&!s.out.out_RBM_Bat),'EMGREF-LV(3): C3/BMS not switched on');}
 }
 if(fam==='run'){
  if(r.pre.out.out_HV_C2)c(L.firstAt(latch,s=>s.out.out_HV_Discharge_Request)!=null,'EMGREF-RUN: HV discharge performed (C2 was ON at e)');
  // N3 (review G1 v3): no "STS_RUN gone in scan e" and no own bound on b_Step3; moment by rule L, then no Run.
  RL.noRunAfter(c,x.log,e,r.latchEnd,r.pre.statuses.includes('STS_RUN'));}
 return c;
}
// ---- EMG-RD-L reference scans (CRITERIA_DELTA v5 §2; STP-A/B table of REQ-CONSOLIDATION/CRITERIA v2 §B) ----
// T_DIS = 1000 ms: existing Network8 discharge hold (CRITERIA §0 "число не менять"; as in current-e2c-stp-i.test.js).
export const T_DIS=1000;
export const DOWN_KEYS=['out_SS1_DR1','out_SS1_DR2','STO_DR1','STO_DR2','out_HV_Discharge_Request','out_HV_C2'];
// t_a = scan of the down acceptance: first scan >= g (green press) where a down output differs from the state before g
// (reference point of the same trace, observation as u/r elsewhere - not an oracle).
// G1 v8 TD-09 (TEAM-DEFAULT TD-09; analyst E2-v73-q/CRITERIA.md 2ee04ebb… §1.1): t_a = first scan >= g with linkRunDownOwner TRUE (marker of
// the down acceptance). Symbol absent in the source -> ERROR stand (thrown); marker never set although the descent runs -> null (callers'
// precondition ERROR). Falling back to the first output change is forbidden; that point is downTaObs() - diagnostic only.
export function downTa(log,g,preG){const seg=log.filter(s=>s.t>=g);if(seg.length&&seg.every(s=>s.owner===undefined))throw Error('ERROR stand (TD-09): Symbol linkRunDownOwner (down-acceptance marker) absent in this source - t_a not observable; no fallback to the first output change');
 return L.firstAt(seg,s=>s.owner===true);}
export function downTaObs(log,g,preG){return L.firstAt(log.filter(s=>s.t>=g),s=>DOWN_KEYS.some(k=>s.out[k]!==preG.out[k]));}
const stoOn=s=>!s.out.STO_DR1&&!s.out.STO_DR2;
// STP-A/B (Run->R&D): q_N(STO)=t_a+2000, q_N(Discharge)=t_s+5000, q_N(C2 OFF)=t_d+T_DIS; t_s/t_d = actual STO / Discharge
// scans of the SAME trace (v5 §2). Never taken from a no-event trace.
export function qNrunDown(log,ta){const ts=ta==null?null:L.firstAt(log.filter(s=>s.t>=ta),stoOn);
 const td=ts==null?null:L.firstAt(log.filter(s=>s.t>=ts),s=>s.out.out_HV_Discharge_Request);
 return {qN:{STO_DR1:ta==null?null:ta+2000,STO_DR2:ta==null?null:ta+2000,out_HV_Discharge_Request:ts==null?null:ts+5000,out_HV_C2:td==null?null:td+T_DIS},pts:{t_a:ta,t_s:ts,t_d:td}};}
// STP-E/I (abort StartingRun) and STP-G (protective descent): STO at the abort/loss scan a (window [a, a+1]); STP-E/I
// "Discharge сразу после STO" (window [t_s, t_s+1]); STP-G Discharge t_s+5000; C2 OFF t_d+T_DIS.
export function qNabort(log,a,{coast}){const ts=a==null?null:L.firstAt(log.filter(s=>s.t>=a),stoOn);
 const td=ts==null?null:L.firstAt(log.filter(s=>s.t>=ts),s=>s.out.out_HV_Discharge_Request);
 return {qN:{STO_DR1:a,STO_DR2:a,out_HV_Discharge_Request:ts==null?null:ts+(coast?5000:0),out_HV_C2:td==null?null:td+T_DIS},pts:{a,t_s:ts,t_d:td}};}
// Area of one run() scenario: Run-down (STP-A, green 600 ms) and R&D->Safe (MOD5-01: C1 OFF is the normal step; its
// command precedes e by construction of the phase, so C1 is judged by p.4).
function descentArea(r){
 // G1 v5 (C4): precondition g <= t_a < e (review G1 v4 §3 (c)); expect = normative EMG-RD-L clause per key (ledger):
 //  Run-down, e = g+600, t_a = acceptance of the 500 ms hold (< e): q_N(STO)=t_a+2000 < e+q_R(7006), q_N(Discharge)=t_s+5000
 //  ~ t_a+7000 < e+7008, q_N(C2)=t_d+1000 ~ t_a+8000 < e+8009, none at target at e-1 -> p.2A for all three;
 //  R&D->Safe: C1 OFF command precedes e by construction of the phase -> p.4.
 if(r.phase==='Run-down'){const log=[...r.hist,...r.x.log];const ta=downTa(log,r.g,r.preG);
  if(ta==null||ta<r.g||ta>=r.e)return {error:`ERROR stand precondition (C4): down acceptance t_a=${ta} must satisfy g=${r.g} <= t_a < e=${r.e}; EMG-RD-L not applied`};
  const q=qNrunDown(log,ta);return {log,ta,...q,expect:{STO_DR1:['p.2A'],STO_DR2:['p.2A'],out_HV_Discharge_Request:['p.2A'],out_HV_C2:['p.2A']}};}
 if(r.phase==='R&D->Safe')return {log:[...r.hist,...r.x.log],qN:{out_LV_C1:null},pts:{},expect:{out_LV_C1:['p.4']}};
 return null;}

export function scenarioName(phase,key){const k=CAUSES[key];return `${k.label} in ${phase}`;}
// Test generator for a set of phases x causes (connector causes are skipped in Safe: EMG-003, separate tests).
export function defineEmergencyTests(test,phases,keys){
 for(const phase of phases)for(const key of keys){if(phase==='Safe'&&CAUSES[key].conn)continue;
  const nm=scenarioName(phase,key),tag=CAUSES[key].tag;
  test(L.T(`${tag} E2-01 one stage / one status: ${nm}, Restart`),()=>{const r=run(phase,key);
   assert.equal(r.aborted,null,`scenario aborted (coverage incomplete): ${r.aborted}`);
   const c=L.checks();c(r.stages.length===0,`more than one stage memory active (E2-01; phase at e: ${r.hit}); ${r.stages.length} scans: ${r.stages.slice(0,4)}`);
   c(r.status.length===0,`not exactly one main status (E2-01/MOD-006; phase at e: ${r.hit}); ${r.status.length} scans: ${r.status.slice(0,4)}`);c.done();});
  test(L.T(`${tag} ${CAUSES[key].conn?'EMG4-03':'EMG6-01'} ${FAMILY[phase]==='lv'||FAMILY[phase]==='lvRise'?'EMGREF-LV':FAMILY[phase]==='run'?'EMGREF-RUN':'EMGREF'}: ${nm} -> Emergency latch, energy chain, Restart -> only Safe`),t=>{
   const r=run(phase,key);assert.equal(r.aborted,null,`scenario aborted (coverage incomplete): ${r.aborted}`);
   t.diagnostic(`phase at e: ${r.hit}`);emergencyChecks(r,t).finish(t,`violated checks (phase at e: ${r.hit})`);});
 }
}
// Review M-a: cause removed at e+500, green Restart at e+1000 while C1_FBK is still ON (precondition) -> stays Emergency.
export function defineRemovedRestartTests(test,phases,keys){
 for(const phase of phases)for(const key of keys){const k=CAUSES[key];
  test(L.T(`${k.tag} EMG6-01 refused Restart: ${k.label.replace(' steady','')} in ${phase}, removed at e+500, green Restart at e+1000 before C1_FBK OFF -> stays Emergency, final Restart -> only Safe`),t=>{
   const r=run(phase,key,{removeAt:500});assert.equal(r.aborted,null,`scenario aborted (coverage incomplete): ${r.aborted}`);
   assert.ok(r.c1fbkAtRestart,'precondition: C1_FBK still ON at e+999 (Restart before C1_FBK OFF)');
   t.diagnostic(`phase at e: ${r.hit}`);emergencyChecks(r,t).finish(t,`violated checks (phase at e: ${r.hit})`);});}
}
// ---- Sweep around C2_FBK OFF in Run-down (reviewer G1 M4/M5): cause at c+k, k=-3..3; green released before. ----
let rundown;
function rundownBase(){if(!rundown){try{const x=L.cached('Run',{c3:true});const g=x.t+1,preG=x.snap();x.hold={in_HV_C2_FBK:true};x.step(GREEN,600);x.step(OFF);
  const lim=x.t+15000;while(x.get('out_HV_C2')&&x.t<lim)x.step();
  if(x.get('out_HV_C2'))throw Error('precondition: C2 OFF command not observed within 15000 ms after green down');x.step({},50);rundown={x,g,preG};}
  catch(e){rundown={error:e};}}
 if(rundown.error)throw rundown.error;return rundown.x.fork();}
const sweepMemo=new Map();
// key 'NONE' = the no-event continuation of the same Run-down - DIAGNOSTIC ONLY since G1 v4 (A11 removed, N6).
export function sweep(key,k){const id=key+k;if(sweepMemo.has(id))return sweepMemo.get(id);
 const cause=key==='NONE'?{on:{},off:{},pulse:true}:CAUSES[key];const res={key,checks:L.checks(),aborted:null,stages:[],status:[]};
 try{const x=rundownBase();res.x=x;res.stages=L.watchStages(x);res.status=L.watchStatus(x);
  const c=x.t+4,es=c+k;res.c=c;res.es=es;res.e=es;let n=x.t+1;
  while(n<=Math.max(c,es)){if(n===es)res.pre=x.snap();const inp=n===es?{...cause.on}:{};if(n===c)delete x.hold.in_HV_C2_FBK;x.step(inp);n++;}
  if(cause.pulse)x.step(cause.off);
  res.hit=`C2_FBK OFF at ${c}, cause at ${es}`;
  x.step({},es+9999-x.t);if(!cause.pulse)x.step(cause.off);x.step({},es+10099-x.t);res.latchEnd=x.t;
  res.profile=RL.profile(x.log,res.pre,es,res.latchEnd);
  if(key==='NONE'){sweepMemo.set(id,res);return res;}
  RL.latched(res.checks,x.log,es,res.latchEnd);
  const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid','out_SS1_DR1','out_SS1_DR2'].flatMap(q=>L.rises(x.log.filter(s=>s.t>=es&&s.t<=res.latchEnd),q).map(v=>q+'@'+(v-es)));
  res.checks(rs.length===0,`EMGREF(2): no energy increase / STO release / Unlock after the cause: ${rs.slice(0,6)}`);
  // G1 v4 (N6): EMG-RD-L with q_N from STP-A/B on scans of the same trace (base log + this trace); L2 for in_Estop_PLC vs
  // steady Run, L1 for other causes vs in_Estop_PLC at the same k; L4 without no-event relaxation (A11 removed).
  res.diag=[];const dg=m=>res.diag.push(m);let ref=null;try{ref=runRef();}catch(err){res.checks(false,'L2 base / q_R (in_Estop_PLC in steady Run) unavailable: '+err.message);}
  const p=key==='PLC'?null:sweep('PLC',k);if(p?.aborted)res.checks(false,'L1 reference in_Estop_PLC at the same k aborted: '+p.aborted);
  const log=[...rundown.x.log,...x.log];const ta=downTa(log,rundown.g,rundown.preG);const q=qNrunDown(log,ta);dg('EMG-RD-L reference scans (same trace): '+JSON.stringify(q.pts));
  const taOk=ta!=null&&ta>=rundown.g&&ta<es;res.checks(taOk,`ERROR stand precondition (C4): down acceptance t_a=${ta} must satisfy g=${rundown.g} <= t_a < e=${es}`);
  // C4 ledger: C2 OFF command, STO and Discharge all precede the cause (c = C2 OFF +50+4) -> p.4 (G1 v6: a withdrawn Discharge request is done-left = FAIL, Q-V7-01 "Г", 73 "А").
  let rd={skip:new Set(),excl:new Set()};if(taOk&&ref&&(!p||!p.aborted)){rd=RL.EMGRDL(res.checks,res.profile,{e:es,qN:q.qN,run:ref,R:p?p.profile:null,log,end:res.latchEnd,diag:dg});
   dg('EMG-RD-L executed assertions (C4): '+RL.assertLedger(res.checks,rd.ledger,{STO_DR1:['p.4'],STO_DR2:['p.4'],out_HV_Discharge_Request:['p.4'],out_HV_C2:['p.4']}));}
  RL.L4(res.checks,res.profile,rd.excl);
  if(key==='PLC'){if(ref)RL.L2(res.checks,res.profile,ref,'',dg,{skip:rd.skip});}
  else if(!p.aborted)RL.L1(res.checks,res.profile,p.profile,'',{skip:rd.skip});
  RL.noRunAfter(res.checks,x.log,es,res.latchEnd,res.pre.statuses.includes('STS_RUN'));
  L.restartToSafe(x,res.checks,'');
 }catch(err){res.aborted=err.message;}
 sweepMemo.set(id,res);return res;}
export function defineSweepTests(test,keys){
 for(const key of keys)for(const k of [-3,-2,-1,0,1,2,3]){const cause=CAUSES[key];
  const nm=`Run-down with C2_FBK held, green released: ${cause.label} ${k>=0?'+':''}${k} scans vs C2_FBK OFF`;
  test(L.T(`${cause.tag} E2-01 one stage / one status: ${nm}`),()=>{const r=sweep(key,k);assert.equal(r.aborted,null,`scenario aborted (coverage incomplete): ${r.aborted}`);
   const c=L.checks();c(r.stages.length===0,`more than one stage memory active (E2-01; ${r.hit}); ${r.stages.length} scans: ${r.stages.slice(0,4)}`);
   c(r.status.length===0,`not exactly one main status (E2-01; ${r.hit}); ${r.status.length} scans: ${r.status.slice(0,4)}`);c.done();});
  test(L.T(`${cause.tag} ${cause.conn?'EMG4-03':'EMG6-01'} EMGREF: ${nm} -> Emergency latch, rule L moments, Restart -> only Safe`),t=>{const r=sweep(key,k);
   assert.equal(r.aborted,null,`scenario aborted (coverage incomplete): ${r.aborted}`);for(const m of r.diag??[])t.diagnostic(m);r.checks.finish(t,`violated checks (${r.hit})`);});
 }
}
