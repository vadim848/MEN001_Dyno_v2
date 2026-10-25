// E2 G1 v4 (v2-tester) — UNL-05 (review G1 v3 N7): in_Door_Monitor FALSE -> no Unlock. Oracle: CRITERIA_DELTA v5 §1
// (program/analyst/E2-G1-v3-questions/CRITERIA.md 29f4288f…9b47) UNL-05 READY; sources reference 4495a1f Network2
// FBAnd8 + FBRs1 (Door resets the unlock grant), D-DOOR-INTERLOCK, SPEC §5 p.9, Q-ARCH-04 "как в reference", Q-ARCH-10 "как в
// Safe"; IDs CVR-001, CVR-003, CVR-004, CVR-006. v6 §2 (Unlock FALSE in every Emergency scan) for the emergency combination.
// Initial: steady Safe (S) or steady R&D (R) by the real lifecycle; in_Door_Monitor FALSE >= 2000 ms before s; InterLock
// (a) NC1 FALSE, (b) NC2 FALSE, (c) both FALSE, (d) both TRUE (control); EStop OK, in_Estop_PLC FALSE, buttons released >= 2 s.
// Event: blue pressed in s, held 1000 ms (variant 3000 ms), released; observed >= 2000 ms after the release.
// Expected in every scan s..end: Unlock FALSE; state unchanged (Safe / R&D, no Safe->R&D or R&D->Run from the single blue);
// no Emergency/fault; SafetyFault FALSE (A8: NV without the symbol - t.todo after the observable checks).
// Variants (a)-(c) are mandatory: with the NC guard removed only Door keeps Unlock FALSE (mutations of FBAnd8.AndIn1 /
// N12 FBAnd2 Door input). Boundaries: Door TRUE from s-1 -> UNL-04 (Unlock FALSE at s+499, TRUE from s+501 while held);
// Door FALSE only in scan s -> observation. Door falling during a granted Unlock, Safe only: d >= s+600 with the blue held:
// Unlock TRUE at d-1, FALSE not later than d+1 (reference FBAnd8 order 100 after FBRs1 order 96), d observation; also with
// NC1 FALSE. Emergency combinations: Door FALSE + in_Estop_PLC TRUE in one scan -> Emergency (EMGREF), Unlock FALSE; Door
// FALSE + green -> Unlock FALSE; both without any new energy increase.
// NOT written (BLOCKED Q-T3-2b, observation only): Door TRUE again with the blue still held (Safe); Door falling during
// Unlock in R&D. Assumptions A1..A9: helpers/e2-lifecycle.js.
import test from 'node:test';
import * as L from '../helpers/e2-lifecycle.js';
import * as RL from '../helpers/e2-rule-l.js';
const {BLUE,GREEN,BOTH,OFF}=L;
const U='out_Door_Unlock_Solonoeid';
const COVER={a_NC1:{in_InterLock_NC_1:false},b_NC2:{in_InterLock_NC_2:false},c_both:{in_InterLock_NC_1:false,in_InterLock_NC_2:false},d_closed:{in_InterLock_NC_1:true,in_InterLock_NC_2:true}};
const ST={S:{kind:'Safe',stage:'b_Step1',name:'Safe'},R:{kind:'RnD',stage:'b_Step_RnD',name:'R&D'}};
const emg=s=>!s.out.b_EStop_Ok||s.statuses.includes('STS_EMG')||s.stages.some(v=>['b_Step4','b_Step5','b_Step6'].includes(v));
const sfBad=(x,seg)=>x.sf?seg.filter(s=>s.out[x.sf]).length:0;
const energy=(seg,pre)=>L.ENERGY.filter(k=>k in pre.out).flatMap(k=>seg.filter(s=>s.out[k]!==pre.out[k]).slice(0,1).map(s=>k+'@'+s.t));
for(const st of ['S','R'])for(const cn of Object.keys(COVER))for(const hold of [1000,3000])
 test(L.T(`E2d UNL-05 ${ST[st].name}, Door FALSE >= 2 s, cover ${cn}: blue held ${hold} ms -> Unlock FALSE in every scan, ${ST[st].name} kept, no Emergency/fault`),t=>{
  const x=L.cached(ST[st].kind);const c=L.checks();x.step({...COVER[cn],in_Door_Monitor:false,...OFF},2100);const pre=x.snap();
  c(x.stageSet().join()===ST[st].stage&&!x.get(U),`precondition: steady ${ST[st].name}, Door FALSE, Unlock FALSE; stages=${x.stageSet()}`);
  const s=x.t+1;x.step(BLUE,hold);const r=x.t+1;x.step(OFF,2100);const seg=x.log.filter(v=>v.t>=s);
  c(seg.every(v=>!v.out[U]),`UNL-05: Unlock FALSE in every scan with Door FALSE (reference FBAnd8/FBRs1, D-DOOR-INTERLOCK); first TRUE at +${(L.firstAt(seg,v=>v.out[U])??s-1)-s}`);
  c(seg.every(v=>v.stages.join()===ST[st].stage),`state unchanged (${ST[st].name}), no transition from the single blue; first other t=${seg.find(v=>v.stages.join()!==ST[st].stage)?.t}`);
  const en=energy(seg,pre);c(en.length===0,'no energy output change: '+en.slice(0,3));
  const e=seg.filter(emg);c(e.length===0,'no Emergency/fault (CVR-003): '+e.slice(0,3).map(v=>v.t));
  c(sfBad(x,seg)===0,'SafetyFault FALSE (CVR-003)');t.diagnostic(`release scan r=${r}`);
  c.done();if(!x.sf)t.todo('NOT VERIFIED: "no SafetyFault" (CVR-003) - no SafetyFault symbol (A8); observable checks above PASSED');});
// Boundary: Door TRUE from s-1 (after >= 2 s FALSE) -> UNL-04 timing.
for(const st of ['S','R'])
 test(L.T(`E2d UNL-05 boundary ${ST[st].name}, cover NC1 open, Door FALSE >= 2 s then TRUE from s-1: blue held 1000 ms -> UNL-04 (Unlock FALSE at s+499, TRUE from s+501 while held)`),t=>{
  const x=L.cached(ST[st].kind);const c=L.checks();x.step({...COVER.a_NC1,in_Door_Monitor:false,...OFF},2100);x.step({in_Door_Monitor:true});
  const s=x.t+1;x.step(BLUE,1000);const r=x.t+1;x.step(OFF,300);const at=d=>x.log.find(v=>v.t===d)?.out[U];
  c(x.log.filter(v=>v.t>=s&&v.t<=s+499).every(v=>!v.out[U]),'no Unlock before 500 ms (BTN-004)');
  c(x.log.filter(v=>v.t>=s+501&&v.t<r).every(v=>v.out[U]),`Unlock TRUE from s+501 while held (UNL-04, Door TRUE from s-1); s+501=${at(s+501)}`);
  t.diagnostic(`observation: s+500=${at(s+500)}`);c.done();});
test(L.T('DIAG observation E2d UNL-05: Safe, Door FALSE only in scan s (TRUE otherwise), blue held 1000 ms'),t=>{
 const x=L.cached('Safe');x.step(OFF,2100);const s=x.t+1;x.step({...BLUE,in_Door_Monitor:false});x.step({in_Door_Monitor:true},999);x.step(OFF,300);
 t.diagnostic(`Unlock first TRUE at +${(L.firstAt(x.log.filter(v=>v.t>=s),v=>v.out[U])??s-1)-s} (observation only)`);});
// Door falls during a granted Unlock (Safe only).
for(const cn of ['d_closed','a_NC1'])for(const dd of [600,1000])
 test(L.T(`E2d UNL-05 Safe, cover ${cn}, Door TRUE, blue held, Unlock TRUE; Door FALSE at d=s+${dd} with the blue held -> Unlock TRUE at d-1, FALSE from d+1 (d observation), stays FALSE, Safe kept`),t=>{
  const x=L.cached('Safe');const c=L.checks();x.step({...COVER[cn],...OFF},2100);const s=x.t+1,d=s+dd;
  while(x.t<d-1)x.step(BLUE);x.step({...BLUE,in_Door_Monitor:false});x.step(BLUE,s+1500-x.t);x.step(OFF,1000);
  const at=v=>x.log.find(q=>q.t===v)?.out[U];
  c(at(d-1)===true,`precondition / normative: Unlock TRUE at d-1 (UNL-04 granted); d-1=${at(d-1)}`);
  c(x.log.filter(v=>v.t>=d+1).every(v=>!v.out[U]),`UNL-05: Unlock FALSE not later than d+1 and while Door FALSE; first TRUE after d at ${L.firstAt(x.log.filter(v=>v.t>=d+1),v=>v.out[U])}`);
  t.diagnostic(`observation: Unlock at d=${at(d)}`);
  c(x.log.filter(v=>v.t>=s).every(v=>v.stages.join()==='b_Step1'&&!emg(v)),'Safe kept, no Emergency/fault');c.done();});
// Emergency combinations.
test(L.T('E2d UNL-05 Safe, Unlock granted (Door TRUE, blue held); Door FALSE and in_Estop_PLC TRUE in the same scan d -> Emergency latched (status <= d+2, L3-Safe), Unlock FALSE from d+1 and in every Emergency scan, no energy increase, Restart -> only Safe'),()=>{
 const x=L.cached('Safe');const c=L.checks();x.step(OFF,2100);const s=x.t+1,d=s+700;while(x.t<d-1)x.step(BLUE);
 c(x.get(U)===true,'precondition: Unlock TRUE before d');const pre=x.snap();x.step({...OFF,in_Door_Monitor:false,in_Estop_PLC:true});x.step({},3000);
 const seg=x.log.filter(v=>v.t>=d);const em=L.firstAt(seg,L.isEmg);
 c(em!=null&&em-d<=RL.REF_SAFE_PLC.status+1,`Emergency not later than d+${RL.REF_SAFE_PLC.status+1} (v6 §2 L3-Safe); first at ${em==null?'never':'+'+(em-d)}`);
 c(em!=null&&seg.filter(v=>v.t>=em).every(L.isEmg),'Emergency latched');
 c(seg.filter(v=>v.t>=d+1).every(v=>!v.out[U])&&seg.filter(L.isEmg).every(v=>!v.out[U]),'Unlock FALSE from d+1 and in every Emergency scan');
 const en=energy(seg,pre);c(en.length===0,'no energy output change: '+en.slice(0,3));
 x.step({in_Estop_PLC:false,in_Door_Monitor:true},100);L.restartToSafe(x,c,'');c.done();});
for(const st of ['S','R'])
 test(L.T(`E2d UNL-05 ${ST[st].name}, Door FALSE >= 2 s, cover NC1 open: blue held, green pressed 700 ms later for 300 ms -> Unlock FALSE in every scan, no energy increase`),()=>{
  const x=L.cached(ST[st].kind);const c=L.checks();x.step({...COVER.a_NC1,in_Door_Monitor:false,...OFF},2100);const pre=x.snap();const s=x.t+1;
  x.step(BLUE,700);x.step(BOTH,300);x.step(OFF,2100);const seg=x.log.filter(v=>v.t>=s);
  c(seg.every(v=>!v.out[U]),`Unlock FALSE in every scan (Door FALSE, green) ; first TRUE at ${L.firstAt(seg,v=>v.out[U])}`);
  const rs=L.ENERGY.flatMap(k=>L.rises(seg,k).map(v=>k+'@'+v));c(rs.length===0,'no new energy increase: '+rs.slice(0,3));
  c.done();});
// ==================== G1 v9 UNL-LVF (READY; analyst E2-G1-v8-r §4b; reference 4495a1f Network2, Q-ARCH-04 "А"; CVR-001, CVR-002, BTN-004) ====================
// In steady Safe the Unlock does not depend on LV Healthy. Differential against X0 (same inputs, in_LV_Faulty_FBK FALSE): single blue from P held
// 600 / 2000 ms; LV Faulty TRUE from <= P-200, P+250, P+499, P+500, P+501, P+700 (held to the end) or a 100 ms pulse inside [P-100, P+600].
// Expected: out_Door_Unlock_Solonoeid equal to X0 in every scan; Safe stage/status; no Emergency/SafetyFault; no C1/C2; STO not released.
const UNLF=[['<= P-200',P=>[P-200,null]],['P+250',P=>[P+250,null]],['P+499',P=>[P+499,null]],['P+500',P=>[P+500,null]],['P+501',P=>[P+501,null]],['P+700',P=>[P+700,null]],
 ['pulse 100 ms [P-100, P-1]',P=>[P-100,P]],['pulse 100 ms [P+250, P+349]',P=>[P+250,P+350]],['pulse 100 ms [P+500, P+599]',P=>[P+500,P+600]]];
function unlDrive(hold,on,offAt){const x=L.cached('Safe');x.step(OFF,2100);const P=x.t+301,end=P+hold+2000;for(let n=x.t+1;n<=end;n++){const o={};
  if(on!=null&&n===on)o.in_LV_Faulty_FBK=true;if(offAt!=null&&n===offAt)o.in_LV_Faulty_FBK=false;if(n===P)Object.assign(o,BLUE);if(n===P+hold)Object.assign(o,OFF);x.step(o);}return {x,P};}
for(const hold of [600,2000])for(const [nm,f] of UNLF)
 test(L.T(`E2d UNL-LVF steady Safe, single blue held ${hold} ms, in_LV_Faulty_FBK TRUE ${nm.startsWith('pulse')?nm:'from '+nm+' (held)'} -> out_Door_Unlock_Solonoeid equal to the trace without LV Faulty in every scan; Safe, no Emergency/SafetyFault, no C1/C2, STO set (Q-ARCH-04 "А", reference Network2)`),t=>{
  const X0=unlDrive(hold,null,null);const P=X0.P;const [on,offAt]=f(P);const X=unlDrive(hold,on,offAt);const c=L.checks();
  const m=new Map(X0.x.log.map(s=>[s.t,s]));const d=X.x.log.filter(s=>s.t>=P-300&&!!s.out.out_Door_Unlock_Solonoeid!==!!m.get(s.t)?.out.out_Door_Unlock_Solonoeid).map(s=>`P${s.t-P>=0?'+':''}${s.t-P}:${s.out.out_Door_Unlock_Solonoeid}`);
  c(d.length===0,`Unlock equal to X0 in every scan (no refusal/delay/earlier Unlock because of LV Faulty); first differences ${d.slice(0,4)}`);
  const u0=L.firstAt(X0.x.log.filter(s=>s.t>=P),s=>s.out.out_Door_Unlock_Solonoeid);c(u0!=null&&u0>=P+500&&u0<=P+501,`control X0: Unlock first at P+${u0==null?'never':u0-P} (BTN-004: FALSE [P, P+499], TRUE by P+501)`);
  const seg=X.x.log.filter(s=>s.t>=P-300);const st=seg.find(s=>s.stages.join()!=='b_Step1'||!L.statusIs({statusMissing:[],statusSet:()=>s.statuses},'STS_SAFE'));c(!st,`Safe stage/status in every scan; first t=${st?.t} ${st?.stages}/${st?.statuses}`);
  const e=seg.find(L.isEmg);c(!e,'no Emergency');const en=seg.find(s=>s.out.out_LV_C1||s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);c(!en,`no C1/C2, STO not released; first t=${en?.t}`);
  if(X.x.sf){const sf=seg.find(s=>s.out[X.x.sf]);c(!sf,'no SafetyFault');}else c.nv('no SafetyFault from LV Faulty in Safe - no SafetyFault symbol (A8)');c.finish(t,`violated checks (P=${P}, LV Faulty ${on}..${offAt??'end'})`);});
