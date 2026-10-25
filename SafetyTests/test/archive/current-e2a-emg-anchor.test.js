// E2 G1 v3/v4 (v2-tester) — rule L3 anchors (CRITERIA_DELTA_v4 §0.1; v6 §2 L3-Safe, §3 SS1, §5 N3): in_Estop_PLC in steady
// Run / steady Safe on the candidate vs the reference 4495a1f measured with the SAME helper (helpers/e2-emergency.js timeline
// + rule-L profile) on the pinned reference (A12: fixtures/pinned SAL efddc60b…0dc334 via src/pinned-sources.js,
// helpers/e2-ref-4495a1f SGVL 8020e3d6…b5e757; SHA asserted by e2-lifecycle.js). The normative L3 checks run inside
// "E2a EMG6-01 EMGREF-RUN: in_Estop_PLC TRUE in Run" / "E2a EMG6-01 EMGREF: in_Estop_PLC TRUE in Safe" against
// helpers/e2-rule-l.js REF_RUN_PLC / REF_SAFE_PLC. This file only re-measures the pinned numbers, confirms that the reference
// itself passes the N3 status rule (review G1 v3 N3, v6 §5), and self-tests the EMG-RD-L oracle on synthetic profiles.
// All names start with "E2-STAND" (outside ^E2[a-d] ): a failure is a stand/oracle error, never a candidate verdict.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../helpers/e2-emergency.js';
import * as RL from '../helpers/e2-rule-l.js';
import * as L from '../helpers/e2-lifecycle.js';
test('E2-STAND L3 reference 4495a1f re-measured on the pinned copy equals helpers/e2-rule-l.js REF_RUN_PLC',t=>{
 const p=E.refAnchorProfile();t.diagnostic('reference profile: '+JSON.stringify(p)+' identity '+JSON.stringify(L.identity('ref')));
 assert.deepEqual(p,{...RL.REF_RUN_PLC});});
test('E2-STAND L3-Safe reference 4495a1f (in_Estop_PLC in steady Safe) re-measured equals REF_SAFE_PLC (v6 §2)',t=>{
 const p=E.refSafeProfile();t.diagnostic('reference Safe profile: '+JSON.stringify(p));assert.deepEqual(p,{...RL.REF_SAFE_PLC});});
test('E2-STAND N3: the reference 4495a1f itself passes the EMGREF-RUN status rule (STS_RUN only before the first Emergency scan) and L3/L4',t=>{
 const r=E.refRunTrace();const c=L.checks();const p=RL.profile(r.x.log,r.pre,r.e,r.latchEnd);
 const around=r.x.log.filter(s=>s.t>=r.e-1&&s.t<=r.e+3).map(s=>`+${s.t-r.e} ${s.statuses}/${s.stages}`);t.diagnostic('reference around e: '+around.join('; '));
 RL.latched(c,r.x.log,r.e,r.latchEnd);RL.noRunAfter(c,r.x.log,r.e,r.latchEnd,r.pre.statuses.includes('STS_RUN'));RL.L3(c,p,RL.REF_RUN_PLC);RL.L4(c,p);
 c.done('reference fails the N3/L3 oracle');});
// ---- EMG-RD-L oracle self-test (v5 §2 / v6 §6, Q-T3-1 "А"): synthetic profiles, e=1000, q_N(STO)=2500, q_R(STO)=7006 ----
const RUN={...RL.REF_RUN_PLC};const e=1000;
const prof=sto=>({status:1,STO_DR1:sto,STO_DR2:sto});
const judge=(sto,{R=null,qN={STO_DR1:2500,STO_DR2:2500},mode}={})=>{const c=L.checks();RL.EMGRDL(c,prof(sto),{e,qN,run:RUN,R,log:[],end:e+10000,mode});return c.list;};
test('E2-STAND EMG-RD-L self-test: branch А (tau in W_N) PASS; shortened, delayed-not-to-chain, chain moment (Б), never -> FAIL',()=>{
 assert.deepEqual(judge(1500),[],'tau = q_N');assert.deepEqual(judge(1501),[],'tau = q_N+1');
 for(const [v,why] of [[1499,'shortened q_N-1'],[1502,'delayed q_N+2'],[3000,'delayed, not to the chain'],[7006,'chain moment (Б) excluded by Q-T3-1 А'],[null,'never']])
  assert.ok(judge(v).length>0,why);});
test('E2-STAND EMG-RD-L self-test: p.1 (q_N >= e+q_R) literal window; mode AB (pre-answer) - mixing branches FAIL',()=>{
 const far={STO_DR1:9000,STO_DR2:9000};assert.deepEqual(judge(7006,{qN:far}),[]);assert.ok(judge(7008,{qN:far}).length>0);assert.ok(judge(7005,{qN:far}).length>0);
 assert.deepEqual(judge(7006,{mode:'AB'}),[],'AB: Б allowed');
 const c=L.checks();RL.EMGRDL(c,{status:1,STO_DR1:1500,STO_DR2:7006},{e,qN:{STO_DR1:2500,STO_DR2:2500},run:RUN,log:[],end:e+10000,mode:'AB'});
 assert.ok(c.list.some(m=>/mixed/.test(m)),'AB: mixed А/Б FAIL');});
test('E2-STAND EMG-RD-L self-test: p.4 already at target stays; normal step due before e not performed -> FAIL; L1 base window',()=>{
 const log=[{t:1000,out:{STO_DR1:false}},{t:1001,out:{STO_DR1:true}}];const c=L.checks();
 RL.EMGRDL(c,{status:1,STO_DR1:'n/a'},{e,qN:{STO_DR1:2500},run:RUN,log,end:e+10,mode:'A'});assert.ok(c.list.length===1,'p.4 release after e');
 const c2=L.checks();RL.EMGRDL(c2,{status:1,STO_DR1:6000},{e,qN:{STO_DR1:900},run:RUN,log:[],end:e+10});assert.ok(c2.list.length===1,'step due before e not done');
 const R={status:1,STO_DR1:7005,STO_DR2:7005};assert.deepEqual(judge(7004,{qN:{STO_DR1:9000,STO_DR2:9000},R}),[],'L1 lead 1 scan');
 assert.ok(judge(7006,{qN:{STO_DR1:9000,STO_DR2:9000},R}).length>0,'L1 lag');});
test('E2-STAND N3 self-test: STS_RUN before the first Emergency scan allowed when Run before e; after it FAIL; not-Run pre-state: any STS_RUN FAIL',()=>{
 const S=(t,st)=>({t,statuses:[st],stages:[],out:{}});const log=[S(1000,'STS_RUN'),S(1001,'STS_EMG'),S(1002,'STS_EMG')];
 let c=L.checks();RL.noRunAfter(c,log,1000,1002,true);assert.deepEqual(c.list,[]);
 c=L.checks();RL.noRunAfter(c,log,1000,1002,false);assert.equal(c.list.length,1);
 c=L.checks();RL.noRunAfter(c,[...log.slice(0,2),S(1002,'STS_RUN')],1000,1002,true);assert.equal(c.list.length,1);});
// ---- G1 v5 self-tests (review G1 v4 C2/C3/C4): synthetic profiles/traces; E2-STAND, outside the normative count ----
test('E2-STAND C4 self-test: an absent rule-L output is an ERROR in L1/L2/L3/L4/EMG-RD-L, never a silent skip',()=>{
 const A={...RL.REF_RUN_PLC,STO_DR1:'absent'};const run=(f)=>{const c=L.checks();f(c);return c.list;};
 assert.ok(run(c=>RL.L1(c,A,RL.REF_RUN_PLC)).some(m=>/ERROR anti-vacuity.*L1 STO_DR1/.test(m)),'L1');
 assert.ok(run(c=>RL.L1(c,RL.REF_RUN_PLC,A)).some(m=>/ERROR anti-vacuity.*L1 STO_DR1/.test(m)),'L1 reference side');
 assert.ok(run(c=>RL.L2(c,A,RL.REF_RUN_PLC)).some(m=>/ERROR anti-vacuity.*L2 STO_DR1/.test(m)),'L2');
 assert.ok(run(c=>RL.L3(c,A,RL.REF_RUN_PLC)).some(m=>/ERROR anti-vacuity.*L3 STO_DR1/.test(m)),'L3');
 assert.ok(run(c=>RL.L4(c,A)).some(m=>/ERROR anti-vacuity.*L4 STO_DR1/.test(m)),'L4');
 assert.ok(run(c=>RL.EMGRDL(c,{status:1,STO_DR1:'absent'},{e,qN:{STO_DR1:2500},run:RUN,log:[],end:e+10})).some(m=>/ERROR anti-vacuity.*EMG-RD-L STO_DR1/.test(m)),'EMG-RD-L');
 assert.deepEqual(run(c=>RL.L3(c,{...RL.REF_RUN_PLC},RL.REF_RUN_PLC)),[],'complete profile: no error');});
test('E2-STAND C4 self-test: EMG-RD-L ledger names the clause that judged each key; assertLedger FAILs on a different or missing clause',()=>{
 const S=(t,v)=>({t,out:{STO_DR1:v}});
 let c=L.checks();let r=RL.EMGRDL(c,prof(1500),{e,qN:{STO_DR1:2500,STO_DR2:2500},run:RUN,log:[],end:e+10000});
 assert.deepEqual(r.ledger,{STO_DR1:'p.2A',STO_DR2:'p.2A'});assert.equal(RL.assertLedger(c,r.ledger,{STO_DR1:['p.2A'],STO_DR2:['p.2A']}),2);assert.deepEqual(c.list,[]);
 assert.ok(RL.assertLedger(c,r.ledger,{STO_DR1:['p.4']})===0&&c.list.length===1,'wrong clause -> FAIL');
 c=L.checks();RL.assertLedger(c,{},{out_HV_C2:['p.2A']});assert.equal(c.list.length,1,'key not judged -> FAIL');
 c=L.checks();r=RL.EMGRDL(c,prof(7006),{e,qN:{STO_DR1:9000,STO_DR2:9000},run:RUN,log:[],end:e+10000});assert.equal(r.ledger.STO_DR1,'p.1');
 c=L.checks();r=RL.EMGRDL(c,{status:1,STO_DR1:'n/a'},{e,qN:{STO_DR1:900},run:RUN,log:[],end:e+10});assert.equal(r.ledger.STO_DR1,'p.4');
 c=L.checks();r=RL.EMGRDL(c,{status:1,STO_DR1:6000},{e,qN:{STO_DR1:900},run:RUN,log:[],end:e+10});assert.equal(r.ledger.STO_DR1,'missed-before-e');assert.equal(c.list.length,1);
 c=L.checks();r=RL.EMGRDL(c,{status:1,STO_DR1:6000},{e,qN:{STO_DR1:900},run:RUN,log:[S(900,false),S(901,true)],end:e+10});
 assert.equal(r.ledger.STO_DR1,'done-left');assert.equal(c.list.length,1,'G1 v6 (Q-V7-01 "Г", 73 "А"): done-left is a FAIL');assert.ok(/LEFT the target/.test(c.list[0]),'FAIL names the withdrawal');assert.equal(c.nvList.length,0,'G1 v6: not NV any more');
 assert.equal(RL.assertLedger(L.checks(),r.ledger,{STO_DR1:['p.4']}),0,'done-left is not an executed clause');
 assert.ok(r.skip.has('STO_DR1')&&r.excl.has('STO_DR1'),'C2: not passed to the base rule L1/L2, not counted by L4');});
test('E2-STAND C4 self-test: synthetic Run-down trace - downTa/qNrunDown/EMGRDL take branch А (positive control); chain moment (Б) FAILs',()=>{
 const g=100,ta=600,base={out_SS1_DR1:true,out_SS1_DR2:true,STO_DR1:true,STO_DR2:true,out_HV_Discharge_Request:false,out_HV_C2:true};
 const mk=(stoAt,disAt,c2At)=>{const log=[];for(let t=g;t<=12000;t+=1){const o={...base};if(t>=ta){o.out_SS1_DR1=false;o.out_SS1_DR2=false;}
   if(t>=stoAt){o.STO_DR1=false;o.STO_DR2=false;}if(t>=disAt)o.out_HV_Discharge_Request=true;if(t>=c2At)o.out_HV_C2=false;log.push({t,out:o,owner:t>=ta-3});}return log;};// G1 v8 TD-09: marker 3 scans before the outputs
 const preG={t:g-1,out:{...base}},ev=ta+1;
 const judgeTrace=log=>{const t0=E.downTa(log,g,preG);assert.equal(t0,ta-3,'t_a = marker scan (TD-09)');assert.equal(E.downTaObs(log,g,preG),ta,'t_a(obs) diagnostic');const q=E.qNrunDown(log,t0);const pre=log.find(s=>s.t===ev-1);
  const p={status:1};for(const k of ['STO_DR1','STO_DR2','out_HV_Discharge_Request','out_HV_C2']){const tg=RL.DEL.find(([n])=>n===k)[1];
   p[k]=pre.out[k]===tg?'n/a':(log.find(s=>s.t>=ev&&s.out[k]===tg)?.t??null)-ev;}
  const c=L.checks();const rd=RL.EMGRDL(c,p,{e:ev,qN:q.qN,run:RUN,log,end:12000});
  const n=RL.assertLedger(c,rd.ledger,{STO_DR1:['p.2A'],STO_DR2:['p.2A'],out_HV_Discharge_Request:['p.2A'],out_HV_C2:['p.2A']});return {c,n};};
 const ok=judgeTrace(mk(ta-3+2000,ta-3+7000,ta-3+8000));// G1 v8 TD-09: normal moments from the marker t_a = ta-3assert.deepEqual(ok.c.list,[],'normal moments: branch А PASS');assert.equal(ok.n,4,'4 executed EMG-RD-L assertions');
 const chain=judgeTrace(mk(ev+7006,ev+7008,ev+8009));assert.ok(chain.c.list.some(m=>/branch Б/.test(m)),'chain moments: FAIL');});
test('E2-STAND C3 self-test: N=u (ii) - SS1 released in [a, a+1] is timed from its return (Imm <= a+1+d_R); not released -> not timed',()=>{
 const N=1000,a=1000,d=3;const Rp={...RL.REF_RUN_PLC,out_SS1_DR1:d,out_SS1_DR2:d};
 for(const k of ['STO_DR1','STO_DR2','out_HV_C2','out_HV_Discharge_Request','out_LV_C1','out_C3_BatRelay','out_RBM_Bat','out_LV_Discharge_Request','out_Door_Unlock_Solonoeid'])Rp[k]='n/a';
 const PX={status:1,...Object.fromEntries([...RL.IMM,...RL.DEL].filter(([k])=>k!=='status').map(([k])=>[k,'n/a']))};
 const tr=back=>{const log=[];for(let t=N-1;t<=N+50;t++)log.push({t,out:{out_SS1_DR1:t<a?false:t<=a+1?true:!(back!=null&&t>=back),out_SS1_DR2:false}});return log;};
 const run=back=>{const c=L.checks();const n=RL.nuII(c,{log:tr(back),N,a,Rp,PX});return {c,n};};
 let r=run(a+1+d);assert.deepEqual(r.c.list,[],'return at a+1+d_R: PASS');assert.equal(r.n,2,'status and SS1_DR1 timed');
 r=run(a+2+d);assert.ok(r.c.list.some(m=>/out_SS1_DR1/.test(m)),'return at a+2+d_R: FAIL');
 r=run(null);assert.ok(r.c.list.some(m=>/out_SS1_DR1/.test(m)),'never returned: FAIL');
 assert.equal(r.n,2,'SS1_DR2 (not released) not timed');});
// G1 v8 TD-10 self-test (TEAM-DEFAULT TD-10, analyst E2-v73-q §2.3): synthetic StartingRun profile against the steady-Run base;
// Del offsets d_Run-2 FAIL, -1/0/+1 PASS, +2 and never FAIL; absent output -> ERROR anti-vacuity; L1-SU lower bound -2 FAIL, -1 PASS.
test('E2-STAND TD-10 self-test: L2-SU Del window [d_Run-1, d_Run+1], -2/+2/never FAIL, absent ERROR; L1-SU lower bound d_Run-1',()=>{
 const B=RL.REF_RUN_PLC;const run=f=>{const c=L.checks();f(c);return c.list;};
 for(const [k] of RL.DEL){if(typeof B[k]!=='number')continue;
  for(const [d,ok] of [[-2,false],[-1,true],[0,true],[1,true],[2,false]]){const S={...B,[k]:B[k]+d};const l=run(c=>RL.L2su(c,S,B));assert.equal(l.length===0,ok,`L2-SU ${k} offset ${d}: ${l}`);}
  assert.ok(run(c=>RL.L2su(c,{...B,[k]:null},B)).length>0,`L2-SU ${k} never -> FAIL`);
  assert.ok(run(c=>RL.L2su(c,{...B,[k]:'absent'},B)).some(m=>/ERROR anti-vacuity.*L2-SU/.test(m)),`L2-SU ${k} absent -> ERROR`);
  assert.ok(run(c=>RL.L2(c,{...B,[k]:B[k]-1},B)).length>0,`L2 (other states) ${k} -1 still FAIL`);
  // G1 v9 TD-12 (analyst E2-G1-v8-q §2.2): lower bound d_Run-2 (-3 FAIL, -2/-1/0 PASS); C1 OFF additionally >= 2000
  assert.ok(run(c=>RL.L1suLower(c,{...B,[k]:B[k]-3},B)).length>0,`L1-SU lower ${k} -3 FAIL`);
  for(const d of [-2,-1,0])if(k!=='out_LV_C1'||B[k]+d>=2000)assert.deepEqual(run(c=>RL.L1suLower(c,{...B,[k]:B[k]+d},B)),[],`L1-SU lower ${k} ${d} PASS`);
  assert.ok(run(c=>RL.L1suLower(c,{...B,[k]:'absent'},B)).some(m=>/ERROR anti-vacuity/.test(m)),`L1-SU lower ${k} absent -> ERROR`);}
 assert.ok(RL.DEL.some(([k])=>typeof B[k]==='number'),'anti-vacuity: the steady-Run base has numeric Del offsets');});
test('E2-STAND TD-09 self-test: downTa = first linkRunDownOwner TRUE scan; Symbol absent -> ERROR (no fallback); marker never set -> null',()=>{
 const g=10,mk=own=>Array.from({length:50},(_,i)=>({t:g+i,out:{STO_DR1:i<20},owner:own(i)}));const preG={t:g-1,out:{STO_DR1:true}};
 assert.equal(E.downTa(mk(i=>i>=5),g,preG),g+5,'marker scan');assert.equal(E.downTaObs(mk(i=>i>=5),g,preG),g+20,'first output change is diagnostic only');
 assert.throws(()=>E.downTa(mk(()=>undefined),g,preG),/TD-09/,'absent Symbol -> ERROR');assert.ok(E.downTa(mk(()=>false),g,preG)==null,'never set -> null/undefined (callers: ERROR precondition)');});
// G1 v9 TD-12 / TD-11 self-tests (analyst E2-G1-v8-q §1.2/§2.2).
test('E2-STAND TD-12 self-test: L1-SU C1 OFF tau - e = 1999 FAILs even when d_Run <= 2001; 2000 PASS',()=>{
 const run=f=>{const c=L.checks();f(c);return c.list;};const B={...RL.REF_RUN_PLC,out_LV_C1:2001};
 assert.ok(run(c=>RL.L1suLower(c,{...B,out_LV_C1:1999},B)).some(m=>/absolute bound/.test(m)),'C1 1999 FAIL');
 assert.deepEqual(run(c=>RL.L1suLower(c,{...B,out_LV_C1:2000},B)),[],'C1 2000 PASS');});
test('E2-STAND TD-11 self-test: hv0 precondition and L2-SU-HV0 discharge window [0, d_Run+1], held TRUE; absent -> ERROR',()=>{
 const mk=(c2,stoRel,dis,drop)=>Array.from({length:20},(_,i)=>({t:100+i,out:{out_HV_C2:c2&&i>5,STO_DR1:stoRel&&i>5,STO_DR2:false,out_HV_Discharge_Request:i>=dis&&!(drop&&i>=dis+3)}}));
 assert.equal(RL.hv0(mk(false,false,2),100,119),true);assert.equal(RL.hv0(mk(true,false,2),100,119),false);assert.equal(RL.hv0(mk(false,true,2),100,119),false);
 const run=f=>{const c=L.checks();f(c);return c.list;};const B={out_HV_Discharge_Request:10};
 assert.deepEqual(run(c=>RL.hv0Discharge(c,{out_HV_Discharge_Request:2},B,mk(false,false,2),100,119)),[],'early discharge allowed (no lower bound)');
 assert.ok(run(c=>RL.hv0Discharge(c,{out_HV_Discharge_Request:12},B,mk(false,false,12),100,119)).length>0,'later than d_Run+1 FAIL');
 assert.ok(run(c=>RL.hv0Discharge(c,{out_HV_Discharge_Request:2},B,mk(false,false,2,true),100,119)).length>0,'withdrawn after setting FAIL');
 assert.ok(run(c=>RL.hv0Discharge(c,{out_HV_Discharge_Request:null},B,mk(false,false,99),100,119)).length>0,'never FAIL');
 assert.ok(run(c=>RL.hv0Discharge(c,{out_HV_Discharge_Request:'absent'},B,[],100,119)).some(m=>/ERROR anti-vacuity/.test(m)),'absent ERROR');});
// G1 v9.2 self-tests: L2-RD (G3Q-1) and L3 strict (G3Q-2), analyst E2-G3-q §1/§2.
test('E2-STAND G3Q-1 self-test: L2-RD Del R -2 FAIL, -1/0/+1 PASS, +2 FAIL; C1 OFF at 1999 FAIL; L1 X -3 FAIL, -2 PASS; absent ERROR',()=>{
 const B=RL.REF_RUN_PLC;const run=f=>{const c=L.checks();f(c);return c.list;};
 for(const [k] of RL.DEL){if(typeof B[k]!=='number')continue;for(const [d,ok] of [[-2,false],[-1,true],[0,true],[1,true],[2,false]]){const S={...B,[k]:B[k]+d};const l=run(c=>RL.L2rd(c,S,B));
   const exp=ok&&!(k==='out_LV_C1'&&B[k]+d<2000);assert.equal(l.length===0,exp,`L2-RD ${k} ${d}: ${l}`);}
  assert.ok(run(c=>RL.L2rd(c,{...B,[k]:'absent'},B)).some(m=>/ERROR anti-vacuity.*L2-RD/.test(m)),'absent -> ERROR');
  assert.ok(run(c=>RL.L1suLower(c,{...B,[k]:B[k]-3},B)).length>0,`L1 X ${k} -3 FAIL`);}
 const B2={...B,out_LV_C1:2001};assert.ok(run(c=>RL.L2rd(c,{...B2,out_LV_C1:1999},B2)).some(m=>/absolute bound/.test(m)),'C1 1999 FAIL');
 assert.deepEqual(run(c=>RL.L1suLower(c,{...B2,out_LV_C1:1999},B2)).length>0,true,'L1 X C1 1999 FAIL');});
test('E2-STAND G3Q-2 self-test: L3 stays strict - Del +2 vs reference FAILs, +0/+1 PASS, -1 FAILs (no widening)',()=>{
 const P=RL.REF_RUN_PLC;const run=f=>{const c=L.checks();f(c);return c.list;};
 for(const [k] of RL.DEL){if(typeof P[k]!=='number')continue;for(const [d,ok] of [[-1,false],[0,true],[1,true],[2,false]]){const l=run(c=>RL.L3(c,{...P,[k]:P[k]+d},P));assert.equal(l.length===0,ok,`L3 ${k} ${d}: ${l}`);}}});
