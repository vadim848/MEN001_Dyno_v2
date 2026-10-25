// E2 G1 v2 (v2-tester) — Q-REL-AFTER-PERMIT (Vadim "А", 2026-10-21; SCENARIO_DECISIONS.md): the pause "both buttons
// released 2 s" is counted ONLY by the buttons; a temporary loss of a permit (cover InterLock NC open 300 ms while the
// buttons stay released) does not restart it. Scenario of the decision: Safe, buttons released > 2 s, cover open 300 ms and
// closed, ~1.7 s later BOTH 1 s -> accepted (other permits present at acceptance). F1 restarts the count -> expected RED
// (defect to fix in E2/E5). Item 9/11 (2 s release of both buttons before a new attempt) and T_BOTH 1000 from the second
// press are unchanged; boundary by the buttons: release 2100 ms (cover episode inside) accepted, 1999 ms rejected.
// Accepted = out_LV_C1 ON (Safe->R&D accepted, MOD1-01) within the BOTH press + 300 ms. Real lifecycle, in_Safety_Run TRUE
// (A1); cover = in_InterLock_NC_1/2 FALSE (V14-Q7: the cover does not forbid Safe->R&D anyway). Assumptions: e2-lifecycle.js.
import test from 'node:test';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,BLUE,OFF}=L;
const NC={NC1:{in_InterLock_NC_1:false},NC2:{in_InterLock_NC_2:false},both:{in_InterLock_NC_1:false,in_InterLock_NC_2:false}};
const CLOSED={in_InterLock_NC_1:true,in_InterLock_NC_2:true};
// pre: ms released before the cover opens (after an optional 100 ms blue tap that starts the button count);
// after: ms after closing until the BOTH press. Button release at the press = pre + 300 + after (tap variants).
function attempt({tap,pre,open,after}){const x=L.cached('Safe');const c=L.checks();
 if(tap){x.step(BLUE,100);x.step(OFF);x.step({},pre-1);}else x.step(OFF,pre);
 if(open){x.step(open,300);x.step(CLOSED);x.step({},after-1);}else x.step({},300+after);
 const p=x.t+1;x.step(BOTH,1100);x.step(OFF,300);return {x,c,accepted:x.log.some(s=>s.t>=p&&s.out.out_LV_C1)};}
for(const cn of ['NC1','NC2','both'])
 test(L.T(`E2d REL-PERMIT Safe, buttons released > 2 s, ${cn} open 300 ms then closed, BOTH 1 s 1700 ms after closing -> accepted (Q-REL-AFTER-PERMIT "А")`),()=>{
  const {c,accepted,x}=attempt({tap:false,pre:2500,open:NC[cn],after:1700});
  c(accepted,`Safe->R&D accepted: the 2 s pause counts buttons only, the 300 ms cover episode does not restart it; stages=${x.stageSet()}`);c.done();});
test(L.T('E2d REL-PERMIT Safe, blue tap 100 ms, release 100 ms, NC1 open 300 ms, closed 1700 ms: buttons released 2100 ms at the BOTH press -> accepted'),()=>{
 const {c,accepted,x}=attempt({tap:true,pre:100,open:NC.NC1,after:1700});c(accepted,`accepted (button release 2100 ms incl. the cover episode); stages=${x.stageSet()}`);c.done();});
test(L.T('E2d REL-PERMIT boundary by buttons: blue tap, release 100 + NC1 open 300 + closed 1599 = 1999 ms at the BOTH press -> rejected (item 9/11)'),()=>{
 const {c,accepted,x}=attempt({tap:true,pre:100,open:NC.NC1,after:1599});c(!accepted,`rejected: both buttons released only 1999 ms (item 9/11); stages=${x.stageSet()}`);c.done();});
test(L.T('E2d REL-PERMIT control without cover episode: blue tap, release 2100 ms -> accepted'),()=>{
 const {c,accepted,x}=attempt({tap:true,pre:100,open:null,after:1700});c(accepted,`accepted (positive control); stages=${x.stageSet()}`);c.done();});
// ---- G1 v3 (review N1; CRITERIA_DELTA_v4 REL-01, analyst N1): permits that remain Safe->R&D permits after E2 ----
// (b) Safe: LV, HV or both connectors FALSE 300 ms with the buttons released (EMG-003: no fault) -> BOTH 1700 ms after the
//     restoration -> accepted (READY-D, generalisation of "например"). (d) boundary by the buttons with the connector
//     episode: release 1999 ms -> rejected without fault; 2000 observation; 2001 -> accepted. (e) episode overlapping the BOTH
//     qualification -> rejected; the held gesture is not executed after restoration; a new attempt after 2 s release is
//     accepted. (c) R&D: NC1/NC2/both FALSE 300 ms (the cover remains an R&D->Run permit, CVR-004/IL-02) -> BOTH 1700 ms later
//     -> R&D->Run accepted; boundary 1999 ms -> rejected. The cover variants above (Vadim's literal scenario) are kept.
const CONN={LV:{in_LV_Connector_Interlock:false},HV:{in_HV_Connector_Interlock:false},both:{in_LV_Connector_Interlock:false,in_HV_Connector_Interlock:false}};
const CONN_OK={in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true};
const fault=s=>!s.out.b_EStop_Ok||s.statuses.includes('STS_EMG')||s.stages.some(v=>['b_Step4','b_Step5','b_Step6'].includes(v));
function attemptConn({tap,pre,open,after}){const x=L.cached('Safe');const c=L.checks();const p0=x.t;
 if(tap){x.step(BLUE,100);x.step(OFF);x.step({},pre-1);}else x.step(OFF,pre);
 x.step(open,300);x.step(CONN_OK);x.step({},after-1);
 const p=x.t+1;x.step(BOTH,1100);x.step(OFF,300);return {x,c,p,accepted:x.log.some(s=>s.t>=p&&s.out.out_LV_C1),noFault:x.log.filter(s=>s.t>p0).every(s=>!fault(s))};}
for(const cn of ['LV','HV','both'])
 test(L.T(`E2d REL-01(b) Safe, buttons released > 2 s, ${cn} connector FALSE 300 ms then restored, BOTH 1 s 1700 ms later -> accepted, no fault (Q-REL-AFTER-PERMIT "А", EMG-003)`),()=>{
  const {c,accepted,noFault,x}=attemptConn({tap:false,pre:2500,open:CONN[cn],after:1700});
  c(noFault,'connector loss in Safe: no Emergency/fault (EMG-003)');
  c(accepted,`Safe->R&D accepted: the 2 s pause counts buttons only, the connector episode does not restart it; stages=${x.stageSet()}`);c.done();});
for(const [after,exp] of [[1599,false],[1601,true]])for(const cn of ['LV','HV'])
 test(L.T(`E2d REL-01(d) boundary by buttons with a ${cn} connector episode: blue tap, release 100 + connector 300 + ${after} = ${100+300+after} ms at the BOTH press -> ${exp?'accepted':'rejected without fault'}`),()=>{
  const {c,accepted,noFault,x}=attemptConn({tap:true,pre:100,open:CONN[cn],after});
  c(noFault,'no Emergency/fault');c(accepted===exp,`${exp?'accepted':'rejected'}: both buttons released ${100+300+after} ms (item 9/11, BTN-001); stages=${x.stageSet()}`);c.done();});
test(L.T('DIAG observation E2d REL-01(d): boundary 2000 ms by buttons with an LV connector episode (q, TON semantics)'),t=>{
 const {accepted}=attemptConn({tap:true,pre:100,open:CONN.LV,after:1600});t.diagnostic(`2000 ms: accepted=${accepted} (observation only)`);});
// REL-01(e) (review G1 v3 N5): the gesture is held 2000 ms AND >= restoration + 1000 ms + margin (3000 ms: restoration at
// p+1300, +1000 = p+2300, 700 ms margin), so an implementation that re-qualifies 1 s of continuous BOTH after the restoration
// (qualifying at >= p+2300) is still caught; LV, HV and both connectors. Second episode variant [p+800, p+2500) held 3600 ms.
for(const [cn,hold,from,to] of [['LV',2000,800,1300],['HV',2000,800,1300],['LV',3000,800,1300],['HV',3000,800,1300],['both',3000,800,1300],['both',2000,800,1300],['LV',3600,800,2500]])
 test(L.T(`E2d REL-01(e) Safe, ${cn} connector FALSE during the BOTH qualification (press+${from}..press+${to} of a ${hold} ms press): rejected, not executed after restoration; new attempt after 2.1 s release -> accepted`),()=>{
  const x=L.cached('Safe');const c=L.checks();x.step(OFF,2500);const p=x.t+1;
  for(let n=p;n<p+hold;n++){const inp=n===p?{...BOTH}:{};if(n===p+from)Object.assign(inp,CONN[cn]);if(n===p+to)Object.assign(inp,CONN_OK);x.step(inp);}
  x.step(OFF,1000);const seg=x.log.filter(s=>s.t>=p);
  c(seg.every(s=>!s.out.out_LV_C1&&!s.stages.includes('b_Step_RnD')),`permit absent at the qualification: Safe->R&D rejected, held gesture not executed after restoration (EMG-003, BTN-001/002); first C1 ON at +${(L.firstAt(seg,s=>s.out.out_LV_C1)??p-1)-p}`);
  c(seg.every(s=>!fault(s)),'no Emergency/fault');
  const q=x.t;x.step(OFF,1100);x.step(BOTH,1100);x.step(OFF,300);c(x.log.filter(s=>s.t>q).some(s=>s.out.out_LV_C1),'new attempt after >= 2 s release: accepted (positive control)');c.done();});
// (c) R&D -> Run with a cover episode (the cover is still an R&D->Run permit).
function attemptRnd({tap,pre,open,after}){const x=L.cached('RnD');const c=L.checks();x.step(OFF,500);
 if(tap){x.step(BLUE,100);x.step(OFF);x.step({},pre-1);}else x.step(OFF,pre);
 x.step(open,300);x.step(CLOSED);x.step({},after-1);
 const p=x.t+1;x.step(BOTH,1100);x.step(OFF,300);return {x,c,accepted:x.log.some(s=>s.t>=p&&(s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2))};}
for(const cn of ['NC1','NC2','both'])
 test(L.T(`E2d REL-01(c) R&D, buttons released > 2 s, ${cn} open 300 ms then closed, BOTH 1 s 1700 ms later -> R&D->Run accepted (Q-REL-AFTER-PERMIT "А")`),()=>{
  const {c,accepted,x}=attemptRnd({tap:false,pre:2500,open:NC[cn],after:1700});
  c(accepted,`R&D->Run accepted (C2 ON or STO released): the cover episode does not restart the 2 s count; stages=${x.stageSet()}`);c.done();});
// m-3 (review G1 v3): R&D boundary 2001 ms -> accepted (2000 = q, observation as in Safe).
test(L.T('E2d REL-01(c)(d) R&D boundary by buttons with a cover episode: blue tap, release 100 + NC1 300 + 1601 = 2001 ms -> R&D->Run accepted'),()=>{
 const {c,accepted,x}=attemptRnd({tap:true,pre:100,open:NC.NC1,after:1601});c(accepted,`accepted: buttons released 2001 ms (item 9/11, BTN-001); stages=${x.stageSet()}`);c.done();});
test(L.T('E2d REL-01(c)(d) R&D boundary by buttons with a cover episode: blue tap, release 100 + NC1 300 + 1599 = 1999 ms -> R&D->Run rejected'),()=>{
 const {c,accepted,x}=attemptRnd({tap:true,pre:100,open:NC.NC1,after:1599});c(!accepted,`rejected: buttons released only 1999 ms; stages=${x.stageSet()}`);c.done();});
