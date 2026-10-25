// E2 G1 v2 (v2-tester) — IL-01, IL-02, IL-02b, HLT-01, HLT-01b, HLT-02, POL-01(b)(c) (CRITERIA v2 + CRITERIA_DELTA).
// Oracle sources (SafetyTests/SCENARIO_DECISIONS.md, SHA in program/tester/E2-G1/HANDOFF_v2.md):
//  V14-Q21(a): InterLock NC loss in Safe/R&D is not an emergency, it only forbids R&D->Run.
//  V14-Q7: Safe->R&D allowed with the cover open (buttons). V14-Q5: R&D->Run requires NC1 AND NC2.
//  V14-Q11 / CVR-004: a held gesture is not executed after the cover closes; a new gesture is required.
//  Q-RC-03(b1): cover loss during R&D->Safe changes nothing, the transition continues.
//  E2-Q2(a) / D-LV-OFF-COMPLETE: LV lost in R&D -> R&D->Safe (C1 OFF, C3/BMS OFF, C1_FBK OFF -> Safe), not Emergency;
//  restoration does not return R&D. E2-Q2(b): HV Healthy ignored in R&D. MOD5-01: green 500 ms R&D->Safe.
//  Q-ARCH-05 / Q-RC-11 (Vadim: А): LV loss in R&D -> SafetyFault (HealthyLost) TRUE not later than Safe, held until the
//  E6-Q2 acknowledgement; HV loss in R&D -> NO SafetyFault (CRITERIA_DELTA HLT-01/01b/02). Observable only via a source
//  symbol (A8); while absent these parts are NOT VERIFIED (t.todo after all observable checks), never PASS.
//  D-ARCH-POL-RENAME (+ Vadim's outPLC addition): in_LV/HV_Faulty_FBK and outPLC_LV/HV_Faulty with unchanged alias;
//  POL-01(c) (CRITERIA_DELTA): Network10 relays the raw Faulty value (TRUE = fault) to outPLC_*_Faulty.
// Not written here (BLOCKED / other slice): PLC CMD_* variants (E4), Config parts (CFG-02); IL-02 boundaries N-1/N/N+1:
//  current-e2b-cover-transitions.test.js. "No Emergency" = b_EStop_Ok TRUE, no STS_EMG, no S4..S6.
// Assumptions A1..A9: helpers/e2-lifecycle.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,GREEN,OFF}=L;
const NC={NC1:{in_InterLock_NC_1:false},NC2:{in_InterLock_NC_2:false},both:{in_InterLock_NC_1:false,in_InterLock_NC_2:false}};
const CLOSED={in_InterLock_NC_1:true,in_InterLock_NC_2:true};
const emgScans=seg=>seg.filter(s=>!s.out.b_EStop_Ok||s.statuses.includes('STS_EMG')||s.stages.some(v=>['b_Step4','b_Step5','b_Step6'].includes(v))).map(s=>s.t);
const noEmg=(c,seg,msg)=>{const e=emgScans(seg);c(e.length===0,`${msg}: ${e.slice(0,3)}`);};
const since=(x,t)=>x.log.filter(s=>s.t>t);
function waitFor(x,pred,max){const lim=x.t+max;while(!pred()&&x.t<lim)x.step();return pred();}
// SafetyFault (A8). expect: 'set' = TRUE from the first Safe scan until the end (no acknowledgement in between);
// 'never' = FALSE in every scan of seg. Returns true when observable.
function safetyFault(c,x,seg,expect,label){if(!x.sf)return false;
 if(expect==='never')c(seg.every(s=>!s.out[x.sf]),`${label}: no SafetyFault (${x.sf}) (Q-RC-11, E2-Q2b)`);
 else{const fs=seg.findIndex(s=>s.stages.includes('b_Step1'));c(fs>=0&&seg.slice(fs).every(s=>s.out[x.sf]),`${label}: SafetyFault (${x.sf}) TRUE not later than Safe and held until acknowledgement (Q-ARCH-05/Q-RC-11)`);}
 return true;}
const NV=(t,what)=>t.todo(`NOT VERIFIED: ${what} - no SafetyFault symbol in the source (A8; Q-ARCH-05/Q-RC-11); observable checks above PASSED`);
for(const [cn,open] of Object.entries(NC))for(const door of [true,false]){
 const tag=`${cn} FALSE, Door ${door}`;
 test(L.T(`E2d IL-01 Safe, ${tag}: no Emergency; BOTH Safe->R&D accepted with the cover open`),()=>{
  const x=L.cached('Safe'),t0=x.t,c=L.checks();x.step({...open,in_Door_Monitor:door},3000);
  noEmg(c,since(x,t0),'no Emergency/fault in Safe with the cover open (V14-Q21a)');
  c(since(x,t0).every(s=>s.stages.length===1&&s.stages[0]==='b_Step1'),'Safe kept');
  const p=x.t;x.step(BOTH,1100);x.step(OFF);
  c(waitFor(x,()=>x.get('b_Step_RnD'),3000),`Safe->R&D accepted with the cover open (V14-Q7, MOD1-01); stages=${x.stageSet()} out_LV_C1=${x.get('out_LV_C1')}`);
  c(x.get('out_LV_C1')===true,'LV C1 ON in R&D');noEmg(c,since(x,p),'no Emergency during Safe->R&D');c.done();
 });
 test(L.T(`E2d IL-02 R&D, ${tag}: no Emergency, R&D and LV kept; BOTH rejected; held BOTH across cover close not executed; new BOTH accepted`),()=>{
  const x=L.cached('RnD'),t0=x.t,c=L.checks();x.step({...open,in_Door_Monitor:door},3000);
  noEmg(c,since(x,t0),'no Emergency/fault in R&D with the cover open (V14-Q21a)');
  c(since(x,t0).every(s=>s.stages.length===1&&s.stages[0]==='b_Step_RnD'&&s.out.out_LV_C1),'R&D and LV C1 kept every scan');
  let p=x.t;x.step(BOTH,1100);x.step(OFF,1000);
  c(since(x,p).every(s=>!s.out.out_HV_C2&&!s.out.STO_DR1&&!s.out.STO_DR2&&!s.stages.includes('b_Step3')),'BOTH with the cover open rejected: no C2 ON, no STO release, no Run (V14-Q5)');
  noEmg(c,since(x,p),'rejection without Emergency');
  x.step({},1100);p=x.t;x.step(BOTH,1500);x.step(CLOSED);x.step({},1500);x.step(OFF,1000);
  c(since(x,p).every(s=>!s.out.out_HV_C2&&!s.out.STO_DR1&&!s.out.STO_DR2&&!s.stages.includes('b_Step3')),'BOTH held across cover close is not executed (V14-Q11, CVR-004)');
  x.step({in_Door_Monitor:true},2100);x.step(BOTH,1100);x.step(OFF);
  c(waitFor(x,()=>x.get('b_Step3'),4000),'new BOTH after 2 s release with the cover closed: Run reached (positive control)');c.done();
 });
 test(L.T(`E2d IL-02b(a) R&D, ${tag}: green 600 ms -> R&D->Safe`),()=>{
  const x=L.cached('RnD'),c=L.checks();x.step({...open,in_Door_Monitor:door},500);const p=x.t;x.step(GREEN,600);x.step(OFF);
  c(waitFor(x,()=>x.get('b_Step1'),3000),`R&D->Safe with the cover open (MOD5-01, V14-Q21a); stages=${x.stageSet()}`);
  c(x.get('out_LV_C1')===false,'C1 OFF in Safe');noEmg(c,since(x,p),'no Emergency');c.done();
 });
 test(L.T(`E2c HLT-01b R&D, ${tag}: LV lost (in_LV_Faulty_FBK TRUE) -> R&D->Safe + SafetyFault`),t=>{
  const x=L.cached('RnD'),c=L.checks();x.step({...open,in_Door_Monitor:door},500);const p=x.t;x.step({in_LV_Faulty_FBK:true},3000);
  c(x.get('b_Step1')===true,`LV lost in R&D with the cover open -> Safe (E2-Q2a); stages=${x.stageSet()}`);
  c(x.get('out_LV_C1')===false,'C1 OFF');noEmg(c,since(x,p),'not Emergency');
  const obs=safetyFault(c,x,since(x,p),'set','HLT-01b');c.done();if(!obs)NV(t,'HLT-01b SafetyFault (HealthyLost) TRUE');
 });
}
for(const [cn,open] of Object.entries(NC))test(L.T(`E2d IL-02b(c) R&D->Safe accepted, then ${cn} FALSE before C1_FBK OFF: continues to Safe, C1 not re-energised`),()=>{
 const x=L.cached('RnD'),c=L.checks();x.hold={in_LV_C1_FBK:true};x.step(GREEN,600);x.step(OFF);
 assert.equal(x.get('out_LV_C1'),false,'precondition: R&D->Safe accepted (C1 OFF command), C1_FBK still ON');
 const p=x.t;x.step(open,50);delete x.hold.in_LV_C1_FBK;x.step({},2000);
 c(x.get('b_Step1')===true,`transition continues to Safe (Q-RC-03 b1); stages=${x.stageSet()}`);
 c(since(x,p).every(s=>!s.out.out_LV_C1),'C1 never returns (no abort back to R&D)');noEmg(c,since(x,p),'no Emergency');c.done();
});
for(const dur of [100,3000])test(L.T(`E2c HLT-01 steady R&D with C3/BMS ON, LV lost for ${dur} ms then restored: R&D->Safe, C1/C3/BMS OFF, no return to R&D, SafetyFault`),t=>{
 const x=L.cached('RnD',{c3:true}),c=L.checks();
 assert.ok(x.get('out_C3_BatRelay')&&x.get('out_RBM_Bat'),'precondition (reviewer G1 M2): C3 and BMS ON before the LV loss');
 const p=x.t;x.step({in_LV_Faulty_FBK:true},dur);x.step({in_LV_Faulty_FBK:false});
 c(waitFor(x,()=>x.get('b_Step1'),3000),`LV lost >=100 ms in R&D -> Safe (E2-Q2a, HLT-01); stages=${x.stageSet()}`);
 x.step({},2500);
 const seg=since(x,p);
 c(x.log.filter(s=>s.t>p).slice(-2400).every(s=>s.stages.length===1&&s.stages[0]==='b_Step1'),'restoration does not return R&D');
 c(!x.get('out_LV_C1')&&!x.get('out_C3_BatRelay')&&!x.get('out_RBM_Bat'),`C1, C3, BMS OFF in Safe (D-LV-OFF-COMPLETE, V14-Q15): C1=${x.get('out_LV_C1')} C3=${x.get('out_C3_BatRelay')} BMS=${x.get('out_RBM_Bat')}`);
 const rs=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2'].flatMap(k=>L.rises(seg,k).map(v=>k+'@'+v));c(rs.length===0,'no re-energising: '+rs);
 noEmg(c,seg,'not Emergency');
 const obs=safetyFault(c,x,seg,'set','HLT-01');c.done();if(!obs)NV(t,'HLT-01 SafetyFault (HealthyLost) TRUE not later than Safe, held until acknowledgement');
});
for(const [hv,drive] of [['constantly lost',x=>x.step({in_HV_Faulty_FBK:true},5000)],['toggling every 100 ms',x=>{for(let i=0;i<50;i++)x.step({in_HV_Faulty_FBK:i%2===0},100);x.step({in_HV_Faulty_FBK:true});}]])
 test(L.T(`E2c HLT-02 steady R&D, HV Healthy ${hv}: ignored (R&D, LV kept, no Emergency, no SafetyFault); R&D->Run accepted with HV lost at start`),t=>{
  const x=L.cached('RnD'),p=x.t,c=L.checks();drive(x);
  c(since(x,p).every(s=>s.stages.length===1&&s.stages[0]==='b_Step_RnD'&&s.out.out_LV_C1),'R&D and LV kept (E2-Q2b)');
  noEmg(c,since(x,p),'no Emergency/fault');
  const obs=safetyFault(c,x,since(x,p),'never','HLT-02');
  const q=x.t;x.step(BOTH,1100);x.step(OFF,300);
  c(since(x,q).some(s=>s.out.out_HV_C2),'R&D->Run accepted (C2 ON command) independent of HV Healthy before launch (HLT-02)');
  c.done();if(!obs)NV(t,'HLT-02 "no SafetyFault" for HV loss in R&D');
 });
// POL-01(b): canonical F1 hardware alias of in_*_Healthy_FBK / outPLC_*_Healthy, pinned (rename only, alias unchanged).
const PINNED={in_LV_Faulty_FBK:{Id:'d1665016-c453-43da-8a62-1dcd92a16f63',sdsId:'61',channelId:'7',functionId:'1613824257'},
 in_HV_Faulty_FBK:{Id:'0d84f909-f37c-4177-887f-3fd7002dfc84',sdsId:'61',channelId:'3',functionId:'1611727105'},
 outPLC_LV_Faulty:{Id:'276079f6-2b46-4900-938a-68b7c8f9b189',sdsId:'89',channelId:'1',functionId:'1131179972'},
 outPLC_HV_Faulty:{Id:'505bfb3a-ae3b-414d-ada4-28718f314f4e',sdsId:'90',channelId:'1',functionId:'1131179972'}};
test(L.T('E2a POL-01(b) symbols renamed in_LV/HV_Faulty_FBK and outPLC_LV/HV_Faulty with unchanged hardware alias, old names removed'),()=>{
 const c=L.checks();
 for(const [n,a] of Object.entries(PINNED)){const v=L.variableInfo(n);
  if(c(v,`${n} present (D-ARCH-POL-RENAME${n.startsWith('outPLC')?' + outPLC addition':''})`))c(JSON.stringify(v.alias)===JSON.stringify(a),`${n}: hardware alias unchanged ${JSON.stringify(v.alias)}`);
  c(L.variableInfo(n.replace('Faulty','Healthy'))===undefined,`old name ${n.replace('Faulty','Healthy')} removed`);}
 c.done();
});
test(L.T('E2a POL-01(c) Network10 relays the raw Faulty value: in_LV/HV_Faulty_FBK TRUE -> outPLC_LV/HV_Faulty TRUE, FALSE -> FALSE (in Safe)'),()=>{
 const c=L.checks();for(const k of ['LV','HV'])c(L.hasName(`outPLC_${k}_Faulty`),`outPLC_${k}_Faulty present (D-ARCH-POL-RENAME outPLC addition)`);
 assert.deepEqual(c.list,[],'relay output symbols missing');
 const x=L.cached('Safe');
 for(const [lv,hv] of [[true,false],[false,true],[true,true],[false,false]]){x.step({in_LV_Faulty_FBK:lv,in_HV_Faulty_FBK:hv},20);
  c(x.get('outPLC_LV_Faulty')===lv&&x.get('outPLC_HV_Faulty')===hv,`raw LV=${lv} HV=${hv} -> outPLC_LV_Faulty=${x.get('outPLC_LV_Faulty')} outPLC_HV_Faulty=${x.get('outPLC_HV_Faulty')} (no inversion)`);}
 c.done();
});
