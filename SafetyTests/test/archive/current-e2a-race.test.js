// E2 G1 v2 (v2-tester) — E2-02: Healthy loss while an accepted Run->R&D waits for C2_FBK OFF has the single outcome R&D.
// Oracle sources (SafetyTests/SCENARIO_DECISIONS.md; CRITERIA.md E2-02):
//  E2-Q1 (Vadim: В): the normal stop completes in R&D; Healthy loss is then handled by R&D rules; Step4^Step12 forbidden.
//  E2-Q2 (a) LV Healthy lost in R&D -> R&D->Safe (C1 OFF, C1_FBK OFF -> Safe), not Emergency; (b) HV ignored in R&D.
//  Q-RC-09 (Vadim: А): Healthy loss after STO in a normal stop - the stop continues to R&D (consistent).
//  E2-01: one stage / one status per scan. STP-A last row: R&D not before C2_FBK OFF.
//  D-ARCH-POL: raw FALSE = healthy, raw TRUE = lost (stimulus polarity).
// Scenario (windows from program/reviewer/E1-f1/repro/race-lifecycle.mjs): steady Run by a real lifecycle; green
//  pressed (held / released 550 ms / 800 ms after press); C2_FBK pinned ON (assumption: plant keeps the contactor
//  feedback ON) until the C2 OFF command is observed + w ms (w=50 or 300, both < 500 ms so STP-C is not reached);
//  Healthy lost (raw TRUE) at h; C2_FBK OFF at h+d, d=1..5; observed 3000 ms (+3000 ms for H).
// Assumptions: helpers/e2-lifecycle.js A1..A9 (in_Safety_Run TRUE, no injection); PLC CMD_RUN_TO_R&D variant not written
// (E4 under revision). SafetyFault for (L): Q-E2Q-02 "А" (set, NV without the symbol, A8); HV: no SafetyFault (if observable);
// 'no Emergency / no protective phase' stays normative (E2-Q1, Q-RC-09).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
const {GREEN,OFF}=L;
const bases=new Map();
function waiting(release,w){const key=release+'/'+w;
 if(!bases.has(key)){let b;try{
  const x=L.cached('Run');x.hold={in_HV_C2_FBK:true};const p=x.t+1;x.step(GREEN);
  const lim=x.t+15000;while(x.get('out_HV_C2')&&x.t<lim)x.step(release!=null&&x.t+1===p+release?OFF:{});
  if(x.get('out_HV_C2'))throw Error('precondition: C2 OFF command not observed within 15000 ms after green down');
  const h=Math.max(x.t+w,release!=null?p+release+5:0);while(x.t<h-1)x.step(release!=null&&x.t+1===p+release?OFF:{});
  if(release!=null&&x.get('in_Reset_PB'))x.step(OFF);
  b={x,p};}catch(e){b={error:e};}bases.set(key,b);}
 const b=bases.get(key);if(b.error)throw b.error;return {x:b.x.fork(),p:b.p};}
const combos=[[null,50],[null,300],[550,300],[800,300]];
// Q-RC-16 "А" (Vadim 2026-10-21): LV restored (raw FALSE) in the C2_FBK OFF scan c, i.e. before R&D - the chained
// R&D->Safe is still executed (loss remembered until Safe). Variant 'Lr' on two representative combos.
const cases=[...['L','H'].flatMap(v=>combos.flatMap(([release,w])=>[1,2,3,4,5].map(d=>[v,release,w,d]))),['Lr',null,50,3],['Lr',800,300,1]];
for(const [variant,release,w,d] of cases)
 test(L.T(`E2a E2-02 ${variant==='H'?'HV':'LV'} Healthy lost at h${variant==='Lr'?' and restored at h+'+d+' (Q-RC-16)':''}, C2_FBK OFF at h+${d}; green ${release==null?'held':'released '+release+' ms'}; h=C2 OFF cmd+${w}`),t=>{
  const {x}=waiting(release,w);
  assert.equal(x.get('b_Step3')||x.get('STS_RUN'),true,'precondition: still Run stage while waiting C2_FBK OFF');
  const stages=L.watchStages(x),status=L.watchStatus(x);
  const h=x.t+1,c=h+d,key=variant==='H'?'in_HV_Faulty_FBK':'in_LV_Faulty_FBK';
  x.step({[key]:true});for(let n=h+1;n<=c;n++){if(n===c)delete x.hold.in_HV_C2_FBK;x.step(n===c&&variant==='Lr'?{in_LV_Faulty_FBK:false}:{});}
  x.step({},3000-(c-h));
  const seg=x.log.filter(s=>s.t>=h);const ck=L.checks();
  ck(seg.every(s=>!(s.stages.includes('b_Step4')&&s.stages.includes('b_Step12'))),'Step4^Step12 forbidden (E2-Q1): '+seg.filter(s=>s.stages.includes('b_Step4')&&s.stages.includes('b_Step12')).map(s=>s.t).slice(0,3));
  ck(stages.length===0,'one stage per scan (E2-01): '+stages.slice(0,5));
  ck(status.length===0,'exactly one status per scan (E2-01): '+status.slice(0,5));
  const prot=seg.filter(s=>s.stages.some(v=>['b_Step4','b_Step5','b_Step6'].includes(v))||!s.out.b_EStop_Ok||s.statuses.includes('STS_EMG'));
  ck(prot.length===0,'no protective/Emergency phase: the normal stop completes (E2-Q1, Q-RC-09: not Emergency): '+prot.map(s=>`t=${s.t} ${s.stages}`).slice(0,3));
  const firstRnd=seg.find(s=>s.stages.includes('b_Step_RnD'))?.t;
  ck(firstRnd!=null,`single outcome R&D reached (E2-Q1); final stages=${x.stageSet()}`);
  ck(firstRnd==null||firstRnd>=c,`R&D not before C2_FBK OFF (STP-A): R&D at ${firstRnd}, C2_FBK OFF at ${c}`);
  if(!x.statusMissing.length){const st=seg.find(s=>s.statuses.includes('STS_RND'))?.t;ck(st!=null&&st>=c,`STS_RND published, not before C2_FBK OFF (at ${st}, C2_FBK OFF ${c})`);}
  const left=seg.findIndex(s=>!s.stages.includes('b_Step3'));
  ck(left>=0&&seg.slice(left).every(s=>!s.stages.includes('b_Step3')&&!s.statuses.includes('STS_RUN')),'no return to Run (E2-Q1)');
  const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2'].flatMap(k=>L.rises(seg,k).map(t=>k+'@'+t));
  ck(rs.length===0,'no LV request in the protective window, no re-energising of C2/STO (E2-Q1 "LV-запрос в защитной фазе"): '+rs.slice(0,4));
  if(variant!=='H'){
   ck(x.get('b_Step1')===true,`LV Healthy lost: R&D then R&D->Safe (E2-Q2a/HLT-01); final stages=${x.stageSet()}`);
   ck(x.get('out_LV_C1')===false,'LV C1 OFF in Safe');
   const firstSafe=seg.find(s=>s.stages.includes('b_Step1'))?.t;ck(firstSafe!=null&&firstRnd!=null&&firstSafe>firstRnd,'Safe only after R&D (chain, not a shortcut)');
  }else{
   x.step({},3000);
   ck(firstRnd!=null&&x.log.filter(s=>s.t>=firstRnd).every(s=>s.stages.length===1&&s.stages[0]==='b_Step_RnD'),'HV Healthy lost: steady R&D, HV ignored in R&D (E2-Q2b) for 6 s');
   ck(x.get('out_LV_C1')===true,'LV kept in R&D');
  }
  const sfObs=!!x.sf;if(variant!=='H'&&x.sf){const i=seg.findIndex(s=>s.stages.includes('b_Step1'));ck(i>=0&&seg.slice(i).every(s=>s.out[x.sf]),`SafetyFault (${x.sf}) HealthyLost TRUE not later than Safe (Q-E2Q-02 "А")`);}
  if(variant==='H'&&x.sf)ck(seg.every(s=>!s.out[x.sf]),'no SafetyFault for HV loss on the normal stop (Q-RC-09, E2-Q2b)');
  ck.done();if(!sfObs)t.todo('NOT VERIFIED: '+(variant==='H'?'no SafetyFault for HV loss (Q-RC-09, E2-Q2b)':'SafetyFault HealthyLost (Q-E2Q-02 А)')+' - no SafetyFault symbol (A8); sequence checks above PASSED');
 });
