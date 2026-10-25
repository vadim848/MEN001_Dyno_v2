// E2 G1 v6 (v2-tester) — group start before the first Restart (review G1 v5 §6 N7 ES06-01) and Restart with contactor FBK ON
// after the group start (EMG6-01-BOOT, review of plan v5 B5-2).
// Oracle (no expectation from the implementation):
//  - program/analyst/E2-plan-v4-questions/CRITERIA.md 5d6bcc1a…120b §2 ES06-01 (READY-D; Q-RC-10, E2-04, BOOT-C, EMG6-01,
//    EMGREF(2), Q-ARCH-10): until EMG6-01 every scan status Emergency, C1/C2/C3/BMS FALSE, STO active, Unlock FALSE, no
//    transition / Config; after Restart (ES normal) Safe and Bypass / PLC commands held since the start are not executed.
//    BOTH at start: the green inside BOTH may act only as the Restart event (EMG6-01) - Safe allowed, nothing above Safe.
//    Internal stage memories before Restart are NOT normative (structural diagnostic only, never asserted).
//  - program/analyst/E2-plan-v5-questions/CRITERIA.md 0a2f7de9…6b4c §3 EMG6-01-BOOT (READY-D; SPEC §12 pp.3-5, EMG-006,
//    EMG6-01): start with in_LV_C1_FBK / in_HV_C2_FBK / both TRUE; Restart (green p_r..r-1, 100 ms, r = release scan):
//    FBK TRUE in every scan [p_r, r] -> Emergency in every scan until a NEW Restart after g (first FBK FALSE scan); g >= r+1 -> no
//    delayed exit; new Restart after g -> Safe; g <= p_r-1 -> Restart -> Safe (control); g in [p_r, r] observation, but never a
//    Safe scan with an FBK TRUE. Before Safe: no energy, STO active, Unlock FALSE. SafetyFault from FBK ON in Emergency:
//    observation.
// PLC CMD_* commands do not exist on canonical F1 (E4): the existing PLC inputs inPLC_RnD_Mode / inPLC_RnD_Mode_2 are used.
// Assumptions A1..A9 helpers/e2-lifecycle.js. Plant A2: FBK pins via x.hold.
import test from 'node:test';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,BLUE,GREEN,OFF}=L;
const isSafe=s=>s.statuses.length===1&&s.statuses[0]==='STS_SAFE';
const UPST=['b_Step12','b_Step_RnD','b_Step3'],UPSS=['STS_RND','STS_RUN','STS_CFG'];
const ENERGY=['out_LV_C1','out_HV_C2','out_C3_BatRelay','out_RBM_Bat'];
const noEnergy=s=>ENERGY.every(k=>!s.out[k])&&!s.out.STO_DR1&&!s.out.STO_DR2&&!s.out.out_Door_Unlock_Solonoeid;
const up=s=>s.stages.some(v=>UPST.includes(v))||s.statuses.some(v=>UPSS.includes(v));
function emgOnly(c,x,from,to,label){const seg=x.log.filter(s=>s.t>=from&&s.t<=to);
 const ne=seg.find(s=>!L.isEmg(s));c(!ne,`${label}status Emergency in every scan [${from}, ${to}] (Q-RC-10, E2-04); first other t=${ne?.t} [${ne?.statuses}]`);
 const en=seg.find(s=>!noEnergy(s));c(!en,`${label}C1/C2/C3/BMS FALSE, STO active, Unlock FALSE in every scan; first t=${en?.t}`);
 const u=seg.find(up);c(!u,`${label}no Safe->R&D / R&D / Run / Config; first t=${u?.t}`);}
const stageDiag=(t,x,to)=>t.diagnostic(`structural only (not normative, ES06-01): stage memories before Restart ${[...new Set(x.log.filter(s=>s.t<=to).map(s=>s.stages.join('+')||'none'))]}`);
// ---- ES06-01 ----
const EV={'no event':{},'blue 700 ms':{inp:BLUE,len:700},'Bypass 300 ms':{inp:{inPLC_BypassC1C2:true},len:300},
 'inPLC_RnD_Mode 300 ms':{inp:{inPLC_RnD_Mode:true},len:300},'inPLC_RnD_Mode_2 300 ms':{inp:{inPLC_RnD_Mode_2:true},len:300}};
const off=inp=>Object.fromEntries(Object.keys(inp).map(k=>[k,false]));
for(const esFalse of [false,true])for(const [en,ev] of Object.entries(EV))
 test(L.T(`E2a ES06-01 group start${esFalse?' with in_ES_NC_1 FALSE from the first scan':''}, no Restart for 300 ms, ${en} -> Emergency, no energy/STO release/Unlock, no transition until EMG6-01; ${esFalse?'Restart refused while ES active; after ES normal Restart -> only Safe':'Restart -> only Safe'}`),t=>{
  const x=L.create();const c=L.checks();if(esFalse)x.step({in_ES_NC_1:false});x.step({},299);
  if(ev.inp){x.step(ev.inp,ev.len);x.step(off(ev.inp));}x.step({},1500);emgOnly(c,x,1,x.t,'before Restart: ');stageDiag(t,x,x.t);
  if(esFalse){const r1=x.t+1;L.restart(x);x.step({},1000);emgOnly(c,x,r1,x.t,'Restart with ES active: ');x.step({in_ES_NC_1:true},300);}
  L.restartToSafe(x,c,'');c.finish(t);});
for(const esFalse of [false,true])
 test(L.T(`E2a ES06-01 group start${esFalse?' with in_ES_NC_1 FALSE':''}, BOTH 1100 ms at 300 -> nothing above Safe (the green may act only as the Restart, EMG6-01), no energy`),t=>{
  const x=L.create();const c=L.checks();if(esFalse)x.step({in_ES_NC_1:false});x.step({},299);const p=x.t+1;x.step(BOTH,1100);x.step(OFF,3000);
  const seg=x.log.filter(s=>s.t>=1);const bad=seg.find(s=>!noEnergy(s)||up(s));c(!bad,`no energy / STO release / Unlock, no Safe->R&D / R&D / Run / Config in any scan; first t=${bad?.t}`);
  if(esFalse)emgOnly(c,x,1,x.t,'ES active: ');
  const sb=seg.find(s=>isSafe(s)&&s.t<p);c(!sb,`no Safe before the BOTH press; t=${sb?.t}`);
  t.diagnostic(`observation: Safe first at ${L.firstAt(seg,isSafe)??'never'} (press ${p}, release ${p+1100})`);stageDiag(t,x,p-1);c.finish(t);});
for(const [hn,inp] of [['Bypass',{inPLC_BypassC1C2:true}],['inPLC_RnD_Mode',{inPLC_RnD_Mode:true}],['inPLC_RnD_Mode_2',{inPLC_RnD_Mode_2:true}]])
 // G1 v7 (m-13, review G1 v6 §6): for inPLC_RnD_Mode / inPLC_RnD_Mode_2 the same requirement is also the known FAIL KF-3 (MOD-003, PLC-001;
// analyst E2-plan-v7-TD §3: a held legacy code is executed by level after the Restart) - marked in the name; the normative expectation is unchanged.
 test(L.T(`E2a ES06-01 / BOOT-C ${hn} TRUE from the first scan and held through the first Restart -> Emergency before, only Safe after, held command never executed (3000 ms)${hn.startsWith('inPLC')?' [coincides with known FAIL KF-3 until E4]':''}`),t=>{
  const x=L.create();const c=L.checks();x.step(inp,300);emgOnly(c,x,1,x.t,'before Restart: ');const from=x.t;L.restart(x);x.step({},3000);
  const seg=x.log.filter(s=>s.t>from);const bad=seg.find(s=>!noEnergy(s)||up(s));c(!bad,`held ${hn} not executed: no energy, nothing above Safe after the Restart; first t=${bad?.t}`);
  c(L.statusIs(x,'STS_SAFE')&&x.stageSet().join()==='b_Step1',`Restart -> only Safe (EMG6-01); stages=${x.stageSet()} statuses=${x.statusSet()}`);c.finish(t);});
// ---- EMG6-01-BOOT ----
const FB={'(a) in_LV_C1_FBK':{in_LV_C1_FBK:true},'(b) in_HV_C2_FBK':{in_HV_C2_FBK:true},'(c) both FBK':{in_LV_C1_FBK:true,in_HV_C2_FBK:true}};
const PR=300,R=400;// green in [300, 399], r = 400 (first released scan)
const G={'g <= p_r-1 (g=200, control)':200,'g in [p_r, r] (g=350, observation)':350,'g = r+1':R+1,'g = r+2000':R+2000,'FBK never removed':null};
for(const [fn,pins] of Object.entries(FB))for(const [gn,g] of Object.entries(G))
 test(L.T(`E2a EMG6-01-BOOT start with ${fn} TRUE, Restart green ${PR}..${R-1}, ${gn} -> ${g!=null&&g<PR?'Restart -> Safe':g===350?'observation (never Safe with FBK TRUE)':'Emergency until a new Restart after g; new Restart -> Safe'}`),t=>{
  const x=L.create();const c=L.checks();const fbHold=n=>g==null||n<g?pins:{};
  const end=(g??R)+3000;while(x.t<end){const n=x.t+1;x.hold=fbHold(n);x.step(n===PR?GREEN:n===R?OFF:{});}
  const seg=x.log;const sf=seg.find(s=>isSafe(s)&&(s.c1fbk||s.c2fbk));c(!sf,`no Safe scan with in_LV_C1_FBK / in_HV_C2_FBK TRUE (SPEC §12, EMG6-01); first t=${sf?.t}`);
  const en=seg.find(s=>!noEnergy(s)||up(s));c(!en,`no energy / STO release / Unlock / transition above Safe; first t=${en?.t}`);
  if(g!=null&&g<PR){c(L.statusIs(x,'STS_SAFE')&&x.stageSet().join()==='b_Step1',`FBK OFF before the press: Restart -> Safe (control, EMG6-01); stages=${x.stageSet()} statuses=${x.statusSet()}`);c.finish(t);return;}
  if(g===350){t.diagnostic(`observation g in [p_r, r]: Safe first at ${L.firstAt(seg,isSafe)??'never'}`);const fl=seg.filter((s,i)=>i>0&&isSafe(seg[i-1])&&!isSafe(s));c(fl.length===0,`no SAFE->EMG flicker; first t=${fl[0]?.t}`);c.finish(t);return;}
  emgOnly(c,x,1,end,`FBK TRUE in every scan [p_r, r]: `);
  if(g==null){const r2=x.t+1;L.restart(x);x.step({},1500);emgOnly(c,x,r2,x.t,'second Restart with FBK still TRUE: ');c.finish(t);return;}
  x.hold={};L.restartToSafe(x,c,'new Restart after g (FBK OFF): ');c.finish(t,`violated checks (g=${g})`);});
test(L.T('E2a EMG6-01-BOOT start with in_LV_C1_FBK TRUE and in_ES_NC_1 FALSE, Restart -> Emergency (both causes); after FBK OFF and ES normal, Restart -> only Safe'),t=>{
 const x=L.create();const c=L.checks();x.hold={in_LV_C1_FBK:true};x.step({in_ES_NC_1:false},299);L.restart(x);x.step({},1000);emgOnly(c,x,1,x.t,'');
 x.hold={};x.step({in_ES_NC_1:true},300);L.restartToSafe(x,c,'');c.finish(t);});
test(L.T('E2a EMG6-01-BOOT companion: Emergency from Run (in_Estop_PLC), chain complete, C2_FBK held TRUE (welded) -> Restart -> stays Emergency'),t=>{
 const x=L.cached('Run',{c3:true});const c=L.checks();x.step({in_Estop_PLC:true},1000);x.step({in_Estop_PLC:false},11000);
 c(!x.get('out_HV_C2')&&!x.get('out_LV_C1'),'stand precondition: chain complete (C1, C2 commands OFF)');x.hold={in_HV_C2_FBK:true};x.step({},100);
 const r=x.t+1;L.restart(x);x.step({},1500);const seg=x.log.filter(s=>s.t>=r);const ne=seg.find(s=>!L.isEmg(s));c(!ne,`Restart with C2_FBK TRUE: stays Emergency; first other t=${ne?.t} [${ne?.statuses}]`);x.hold={};c.finish(t);});
