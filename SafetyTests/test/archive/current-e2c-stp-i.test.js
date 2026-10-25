// E2 G1 v2 (v2-tester) — STP-I (CRITERIA_DELTA §B, new, READY; Q-ARCH-03 "Б", Q-ARCH-05 "А"): LV Healthy lost in
// StartingRun -> abort StartingRun (STO -> at once Discharge -> T_DIS -> C2 OFF -> C2_FBK OFF -> R&D), then chained
// R&D->Safe without a new command (E2-Q2a); NOT Emergency; SafetyFault (HealthyLost) not later than Safe (NV without symbol).
// Table: c (<= c+1) STO active, no SS1; Run in no scan >= c; Discharge <= c+2; t_d+T_DIS-1 C2 still ON, t_d+T_DIS+1 C2 OFF
// (q = t_d+T_DIS observation); R&D not before C2_FBK OFF; C1 OFF not before C2_FBK OFF; then C1/C3/BMS OFF, C1_FBK OFF ->
// Safe. Whole segment: not Emergency, Unlock FALSE, BOTH/green not executed now or later (V14-Q11, Q-RC-08 READY-D).
// T_DIS = 1000 ms: existing Network8 discharge hold (SCENARIO_DECISIONS E6 note "Network8 1 с/1 с"; CRITERIA §0: number
// not changed). u = acceptance scan of R&D->Run, r = Run confirmation scan: both OBSERVED on a no-event fork (boundary
// reference points, not oracle). Boundary c = u-1 -> HLT-01 (UP not executed, R&D->Safe); c = r+1 -> STP-G (E3, not here).
// G1 v3 m-b: tc is taken after the C2 OFF command. STP-I(4) LV restored before R&D: Q-RC-16 "А" (Vadim 2026-10-21) - the chained R&D->Safe is still executed. Assumptions A1..A9: helpers/e2-lifecycle.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,GREEN,OFF}=L;
const T_DIS=1000;
let ref;
function points(){if(!ref){try{const b=L.cached('RnD',{c3:true});const x=b.fork();const p=x.t+1;x.step(BOTH,1100);x.step(OFF);
  x.until(()=>x.statusSet().includes('STS_RUN'),3000,'Run confirmed after BOTH from R&D (no-event reference)');
  const seg=x.log.filter(s=>s.t>=p);const u=L.firstAt(seg,s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2),r=L.firstAt(seg,s=>s.statuses.includes('STS_RUN'));
  assert.ok(u!=null&&r!=null&&r>u+1,`precondition: u (acceptance) ${u} and r (Run confirmation) ${r} observed`);ref={b,p,u,r};}catch(e){ref={error:e};}}
 if(ref.error)throw ref.error;return ref;}
// Drive from the base: BOTH 1100 ms from p, LV lost at c (held), extra inputs at given scans; observe 5000 ms after c.
function drive(c,extra={}){const {b,p}=points();const x=b.fork();const end=c+5000;
 for(let n=x.t+1;n<=end;n++){const inp={};if(n===p)Object.assign(inp,BOTH);if(n===p+1100)Object.assign(inp,OFF);
  if(n===c)inp.in_LV_Faulty_FBK=true;if(extra[n])Object.assign(inp,extra[n]);x.step(inp);}
 return x;}
const emg=s=>!s.out.b_EStop_Ok||s.statuses.includes('STS_EMG')||s.stages.some(v=>['b_Step4','b_Step5','b_Step6'].includes(v));
function stpI(t,x,c,label){const ck=L.checks();const seg=x.log.filter(s=>s.t>=c),at=d=>x.log.find(s=>s.t===d);
 ck(at(c+1)&&!at(c+1).out.STO_DR1&&!at(c+1).out.STO_DR2,`STO active not later than c+1 (STP-I/STP-E): STO at c+1 = ${at(c+1)?.out.STO_DR1}/${at(c+1)?.out.STO_DR2}`);
 ck(seg.every(s=>!s.out.out_SS1_DR1&&!s.out.out_SS1_DR2),'no SS1 (abort StartingRun, D-STARTINGRUN-NO-COAST)');
 ck(seg.every(s=>!s.statuses.includes('STS_RUN')&&!s.stages.includes('b_Step3')),'Run in no scan >= c');
 const td=L.firstAt(seg,s=>s.out.out_HV_Discharge_Request);
 ck(td!=null&&td<=c+2,`Discharge at once after STO (<= c+2): t_d - c = ${td==null?'none':td-c}`);
 if(td!=null){ck(at(td+T_DIS-1)?.out.out_HV_C2===true,`C2 still ON at t_d+T_DIS-1 (no early C2 OFF): ${at(td+T_DIS-1)?.out.out_HV_C2}`);
  ck(at(td+T_DIS+1)?.out.out_HV_C2===false,`C2 OFF at t_d+T_DIS+1: ${at(td+T_DIS+1)?.out.out_HV_C2}`);}
 // m-b (G1 v2 review): tc = first C2_FBK OFF scan AFTER the C2 OFF command (falling edge of out_HV_C2 at or after c), so the
 // ordering checks below cannot pass vacuously when C2_FBK is still OFF right after c.
 const tcmd=x.log.find((s,i)=>i>0&&s.t>=c&&x.log[i-1].out.out_HV_C2&&!s.out.out_HV_C2)?.t;
 ck(tcmd!=null,`C2 OFF command (falling edge of out_HV_C2) observed at or after c: ${tcmd}`);
 const tc=tcmd==null?null:L.firstAt(seg.filter(s=>s.t>=tcmd),s=>!s.c2fbk);// G1 v9 TD-14 (analyst E2-G1-v8-r §1.3/§1.5): the main state is R&D during StartingRun and its abort (SPEC §14); 'R&D reached' = R_end, the first
 // scan >= c with out_HV_C2 FALSE, in_HV_C2_FBK FALSE and STO active. S1 (main state R&D in [c, R_end]) is a separate check.
 const tr=L.firstAt(seg,s=>!s.out.out_HV_C2&&!s.c2fbk&&!s.out.STO_DR1&&!s.out.STO_DR2);
 ck(tc!=null&&tr!=null&&tr>=tc,`abort completed (R_end, TD-14), not before C2_FBK OFF: R_end at ${tr}, C2_FBK OFF at ${tc}`);
 if(tr!=null){const m=seg.filter(s=>s.t<=tr).find(s=>!(s.statuses.length===1&&s.statuses[0]==='STS_RND'));ck(!m,`S1 (TD-14 §1.4): main state R&D (one-hot) in every scan [c, R_end]; first t=${m?.t} ${m?.statuses}`);}
 const c1off=L.firstAt(seg,s=>!s.out.out_LV_C1);ck(c1off!=null&&tc!=null&&c1off>=tc,`C1 OFF not before C2_FBK OFF: C1 OFF at ${c1off}, C2_FBK OFF at ${tc}`);
 const safe=L.firstAt(seg,s=>s.stages.includes('b_Step1'));
 ck(safe!=null&&tr!=null&&safe>tr,`chained R&D->Safe without a new command (E2-Q2a): Safe at ${safe}, R&D at ${tr}; final stages=${x.stageSet()}`);
 ck(!x.get('out_LV_C1')&&!x.get('out_C3_BatRelay')&&!x.get('out_RBM_Bat')&&!x.get('out_HV_C2'),'final Safe: C1, C2, C3, BMS OFF');
 const c1f=L.firstAt(seg,s=>!s.c1fbk);ck(safe==null||c1f==null||safe>c1f,`Safe only after C1_FBK OFF (${c1f} < ${safe})`);
 const e=seg.filter(emg);ck(e.length===0,`not Emergency (Q-ARCH-03 "Б"): ${e.slice(0,3).map(s=>s.t)}`);
 ck(seg.every(s=>!s.out.out_Door_Unlock_Solonoeid),'Unlock FALSE');
 const rs=['out_HV_C2','STO_DR1','STO_DR2','out_LV_C1'].flatMap(k=>L.rises(seg,k).map(v=>k+'@'+(v-c)));ck(rs.length===0,`the cancelled launch is not resumed, no re-energising (offsets from c): ${rs.slice(0,4)}`);
 let obs=false;if(x.sf){obs=true;const i=seg.findIndex(s=>s.stages.includes('b_Step1'));ck(i>=0&&seg.slice(i).every(s=>s.out[x.sf]),`SafetyFault (${x.sf}) TRUE not later than Safe (Q-ARCH-05)`);}
 ck.done(`violated checks (${label})`);if(!obs)t.todo('NOT VERIFIED: STP-I SafetyFault (HealthyLost) TRUE not later than Safe - no SafetyFault symbol (A8); sequence checks above PASSED');}
for(const [nm,cOf] of [['u+1',q=>q.u+1],['u+50',q=>q.u+50],['r-1',q=>q.r-1]])
 test(L.T(`E2c STP-I LV Healthy lost in StartingRun at c=${nm}: abort (STO, Discharge, T_DIS, C2 OFF) -> R&D -> R&D->Safe, not Emergency`),t=>{
  const q=points(),c=cOf(q);stpI(t,drive(c),c,`c=${nm}=${c}, u=${q.u}, r=${q.r}`);});
test(L.T('E2c STP-I LV and HV Healthy lost together in StartingRun (c=u+50): LV decides, same abort sequence, not Emergency'),t=>{
 const q=points(),c=q.u+50;stpI(t,drive(c,{[c]:{in_HV_Faulty_FBK:true}}),c,`c=${c}`);});
// G1 v8 (review G1 v7 N17; analyst E2-G1-v7-q §4): renamed only - the stimulus is the REMAINDER of the BOTH gesture (BOTH held to p+1100 = Q+100 > c+10;
// blue released at c+10, green kept from the gesture until p+1100), not a fresh green; oracle unchanged (p.9, BTN-002, Q-RC-08).
test(L.T('E2c STP-I BOTH remainder during the abort (c=u+50): blue released at c+10, green kept from the BOTH gesture (not a fresh green) -> not executed - C1 not dropped before C2_FBK OFF'),t=>{
 const q=points(),c=q.u+50;stpI(t,drive(c,{[c+10]:GREEN,[c+610]:OFF}),c,`c=${c}, green c+10..c+609`);});
test(L.T('E2c STP-I BOTH 1100 ms pressed during the abort (c=u+50, press c+10): not executed now or later (launch not resumed)'),t=>{
 const q=points(),c=q.u+50;stpI(t,drive(c,{[c+10]:BOTH,[c+1110]:OFF}),c,`c=${c}, BOTH c+10..c+1109`);});
test(L.T('E2c STP-I(4) LV lost at c=u+50 and restored at c+100 (before R&D): still abort -> R&D -> chained R&D->Safe (Q-RC-16 "А")'),t=>{
 const q=points(),c=q.u+50;stpI(t,drive(c,{[c+100]:{in_LV_Faulty_FBK:false}}),c,`c=${c}, LV restored c+100`);});
test(L.T('E2c STP-I boundary c=u-1 (LV lost one scan before acceptance) -> HLT-01: UP not executed (no C2 ON / STO release), R&D->Safe, not Emergency'),()=>{
 const q=points(),c=q.u-1;const x=drive(c);const seg=x.log.filter(s=>s.t>=c),ck=L.checks();
 ck(seg.every(s=>!s.out.out_HV_C2&&!s.out.STO_DR1&&!s.out.STO_DR2),'UP not executed: no C2 ON, no STO release (HLT-01: LV lost in R&D)');
 ck(x.stageSet().join()==='b_Step1'&&!x.get('out_LV_C1'),`R&D->Safe (HLT-01); final stages=${x.stageSet()}`);
 const e=seg.filter(emg);ck(e.length===0,`not Emergency: ${e.slice(0,3).map(s=>s.t)}`);ck.done();});
