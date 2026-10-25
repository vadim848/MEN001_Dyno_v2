// E2 G1 v3 (v2-tester) — UNL-04 in Safe (CRITERIA_DELTA_v4 §Unlock, READY; Q-ARCH-04 "А" (Vadim 2026-10-21): in Safe a
// qualified blue >= 500 ms gives Unlock regardless of an already open cover; CVR-001/002/003, BTN-004).
// Initial: steady Safe, NC1, NC2 or both FALSE (cover open), in_Door_Monitor TRUE, EStop OK, in_Estop_PLC FALSE, buttons
// released >= 2 s. Blue held from s: Unlock FALSE at s+499; TRUE by s+501 (s+500 observation); TRUE while blue is held
// without green; release -> FALSE (SPEC §5 p.4; checked from the release scan +1 - the release-scan value is an
// observation). Forbidden: refusing Unlock because the cover is open; Unlock before 500 ms; Unlock while green is pressed.
// Control: the same with the cover closed - the same result. Late green (> 250 ms after the blue, AGENTS Q-500 note
// "green снимает удерживаемый Unlock"): Unlock FALSE in every scan where green is pressed.
// NOT written (BLOCKED_v3.md): Door FALSE variant - conflicts with the preserved DoorMonitor role of Unlock
// (D-DOOR-INTERLOCK; approved test current-unlock-hold.test.js: in_Door_Monitor FALSE -> no Unlock in Safe) - question
// Q-T3-2 to the analyst. G1 v3 update: UNL-04 in R&D is READY by Q-ARCH-10 "А" (Vadim 2026-10-21, SCENARIO_DECISIONS
// ff59e2f8…a645): steady R&D, the same blue sequence, Unlock also with the cover open; in Run Unlock stays forbidden
// (Q-ARCH-10 "в Run, Config и Emergency Unlock запрещён") - Run control with the cover closed.
// Assumptions A1..A9: helpers/e2-lifecycle.js.
import test from 'node:test';
import * as L from '../helpers/e2-lifecycle.js';
const {BLUE,GREEN,BOTH,OFF}=L;
const COVER={closed:{},NC1:{in_InterLock_NC_1:false},NC2:{in_InterLock_NC_2:false},both:{in_InterLock_NC_1:false,in_InterLock_NC_2:false}};
const U='out_Door_Unlock_Solonoeid';
function blueHold(t,x,cn,state,stage){const c=L.checks();x.step({...COVER[cn],...OFF},2100);
  c(x.stageSet().join()===stage&&!x.get(U),`precondition: steady ${state}, Unlock FALSE with the cover ${cn}; stages=${x.stageSet()}`);
  const s=x.t+1;x.step(BLUE,3000);const r=x.t+1;x.step(OFF,500);const at=d=>x.log.find(v=>v.t===d)?.out[U];
  c(x.log.filter(v=>v.t>=s&&v.t<=s+499).every(v=>!v.out[U]),`no Unlock before 500 ms (BTN-004): first TRUE at ${L.firstAt(x.log.filter(v=>v.t>=s),v=>v.out[U])} (s=${s})`);
  c(x.log.filter(v=>v.t>=s+501&&v.t<r).every(v=>v.out[U]),`Unlock TRUE from s+501 while the blue is held (Q-ARCH-04/Q-ARCH-10 "А": cover open is not a reason to refuse); s+501=${at(s+501)}`);
  t.diagnostic(`observation: Unlock at s+500=${at(s+500)}, at the release scan=${at(r)}`);
  c(x.log.filter(v=>v.t>r).every(v=>!v.out[U]),'Unlock FALSE after the blue is released (SPEC §5 p.4)');
  c(x.log.filter(v=>v.t>=s).every(v=>v.stages.join()===stage&&v.out.b_EStop_Ok),`${state} kept, no Emergency`);c.done();}
for(const cn of ['NC1','NC2','both','closed'])
 test(L.T(`E2d UNL-04 R&D (Q-ARCH-10 "А"), cover ${cn==='closed'?'closed (control)':cn+' open'}, Door TRUE: blue held 3000 ms -> Unlock FALSE at s+499, TRUE from s+501 while held, FALSE after release`),t=>{
  blueHold(t,L.cached('RnD'),cn,'R&D','b_Step_RnD');});
test(L.T('E2d UNL-04 control: steady Run, cover closed, blue held 3000 ms -> Unlock FALSE in every scan (Q-ARCH-10: forbidden in Run)'),()=>{
 const x=L.cached('Run');const c=L.checks();x.step(OFF,2100);const s=x.t+1;x.step(BLUE,3000);x.step(OFF,300);
 c(x.log.filter(v=>v.t>=s).every(v=>!v.out[U]),`no Unlock in Run: first TRUE at ${L.firstAt(x.log.filter(v=>v.t>=s),v=>v.out[U])}`);c.done();});
for(const cn of ['NC1','NC2','both','closed'])
 test(L.T(`E2d UNL-04 Safe, cover ${cn==='closed'?'closed (control)':cn+' open'}, Door TRUE: blue held 3000 ms -> Unlock FALSE at s+499, TRUE from s+501 while held, FALSE after release`),t=>{
  const x=L.cached('Safe');const c=L.checks();x.step({...COVER[cn],...OFF},2100);
  c(x.stageSet().join()==='b_Step1'&&!x.get(U),`precondition: steady Safe, Unlock FALSE with the cover ${cn}; stages=${x.stageSet()}`);
  const s=x.t+1;x.step(BLUE,3000);const r=x.t+1;x.step(OFF,500);const at=d=>x.log.find(v=>v.t===d)?.out[U];
  c(x.log.filter(v=>v.t>=s&&v.t<=s+499).every(v=>!v.out[U]),`no Unlock before 500 ms (BTN-004): first TRUE at ${L.firstAt(x.log.filter(v=>v.t>=s),v=>v.out[U])} (s=${s})`);
  c(x.log.filter(v=>v.t>=s+501&&v.t<r).every(v=>v.out[U]),`Unlock TRUE from s+501 while the blue is held (Q-ARCH-04 "А": cover open is not a reason to refuse); s+501=${at(s+501)}`);
  t.diagnostic(`observation: Unlock at s+500=${at(s+500)}, at the release scan=${at(r)}`);
  c(x.log.filter(v=>v.t>r).every(v=>!v.out[U]),'Unlock FALSE after the blue is released (SPEC §5 p.4)');
  c(x.log.filter(v=>v.t>=s).every(v=>v.stages.join()==='b_Step1'&&v.out.b_EStop_Ok),'Safe kept, no Emergency');c.done();});
for(const cn of ['NC1','closed'])
 test(L.T(`E2d UNL-04 Safe, cover ${cn==='closed'?'closed (control)':cn+' open'}: blue held, green pressed 1000 ms later for 300 ms -> Unlock FALSE in every scan with green pressed`),()=>{
  const x=L.cached('Safe');const c=L.checks();x.step({...COVER[cn],...OFF},2100);const s=x.t+1;x.step(BLUE,1000);
  c(x.get(U)===true,`precondition: Unlock TRUE after 1000 ms blue with the cover ${cn}`);
  const g=x.t+1;x.step(BOTH,300);c(x.log.filter(v=>v.t>=g&&v.t<g+300).every(v=>!v.out[U]),`Unlock FALSE while green is pressed (CVR-001); first TRUE at ${L.firstAt(x.log.filter(v=>v.t>=g),v=>v.out[U])} (g=${g})`);
  x.step(OFF,300);c.done();});
// G1 v4 m-4 (review G1 v3): the same green variant in steady R&D (Q-ARCH-10 "А": as in Safe). Door FALSE variants: UNL-05,
// current-e2d-unlock-door.test.js (CRITERIA_DELTA v5 §1; this file keeps UNL-04 for Door TRUE only).
for(const cn of ['NC1','closed'])
 test(L.T(`E2d UNL-04 R&D, cover ${cn==='closed'?'closed (control)':cn+' open'}: blue held, green pressed 1000 ms later for 300 ms -> Unlock FALSE in every scan with green pressed`),()=>{
  const x=L.cached('RnD');const c=L.checks();x.step({...COVER[cn],...OFF},2100);const s=x.t+1;x.step(BLUE,1000);
  c(x.get(U)===true,`precondition: Unlock TRUE after 1000 ms blue in R&D with the cover ${cn}`);
  const g=x.t+1;x.step(BOTH,300);c(x.log.filter(v=>v.t>=g&&v.t<g+300).every(v=>!v.out[U]),`Unlock FALSE while green is pressed (CVR-001); first TRUE at ${L.firstAt(x.log.filter(v=>v.t>=g),v=>v.out[U])} (g=${g})`);
  x.step(OFF,300);c.done();});
