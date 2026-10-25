// E2 G1 v9.2 (v2-tester) — coverage gaps found by G3 (program/tester/E2-G3/G3_REPORT.md: surviving mutants with minimal scenarios).
// Every test is derived from a requirement (ID in the name), not from the mutant; the mutant is only the reason the scenario was added.
//  G-1  E2-01 / MOD-006 (one stage, one main status in every scan) - Run->R&D, C2_FBK held, in_ES_NC_1 FALSE 1..3 scans before the C2_FBK release.
//  G-2  MOD-002 / SPEC §7 / question 68 "Б" (Run only after C2_FBK confirmation) - R&D->Run by BOTH with in_HV_C2_FBK never ON -> no Run ever
//       (the WDG-03 rollback itself is E6 and not judged here).
//  G-3  EMG6-01 (CRITERIA_DELTA E2-G1-questions: "Restart при активной причине ... остаётся Emergency, без последующего отложенного выхода").
//  G-4  EMG6-01 + V14-Q6 "А" ("снимается, как сейчас, зелёной кнопкой (FBEstop1.Restart)"): Restart acts as in the reference - the exit happens
//       at the release of the green (reference 4495a1f measured on the stand, A12: b_EStop_Ok at the release scan, b_Step1 +1); no Safe while held.
//  G-5  EMG6-01 / SPEC §12 (exit only with feedback OFF): Restart with C1_FBK stuck ON -> Emergency; FBK OFF later -> no deferred exit.
//  G-6  E2-01 + EMG6-01: Restart during the emergency chain (e+2000 ... e+3000) -> one stage/status in every scan; Safe only alone, energy OFF.
//  G-7  EMG6-01-BOOT (E2-04, Q-RC-10) + V14-Q6 as G-4: boot with C1_FBK ON, refused Restart, FBK OFF, green held 300 ms -> no Safe while held.
//  G-8  HLT-01 / STP-I boundary c = u-1 (LV lost before the acceptance -> UP not executed, R&D->Safe): LV Faulty at Q-2, Q-1 -> no C2 / STO
//       release in any scan, chained R&D->Safe, no Emergency.
//  G-9  BTN-002 / MOD-003 / MOD-004 (a held gesture is not executed in a new state): R&D, BOTH held 4000 ms, LV Faulty at +500 -> R&D->Safe;
//       the held BOTH never starts Safe->R&D.
//  G-10 E2-01 + STP-I ("C1 OFF not before C2_FBK OFF"): LV Faulty at Q-1, Q, Q+1 -> in no scan C2 ON or STO released while C1 is OFF; one stage.
//  G-11 BTN-001 / Q-REL-AFTER-PERMIT "А" (a new attempt after both released >= 2001 ms is accepted): Safe->R&D by BOTH, new BOTH at
//       release+2001 / +2050 -> R&D->Run accepted (first lift in [Q2, Q2+400], TD-06).
// Assumptions A1..A9 helpers/e2-lifecycle.js. G-4/G-7 "exit at release" is the reference behaviour preserved by V14-Q6 "как сейчас" (READY-D,
// listed for the analyst in HANDOFF_v9_2).
import test from 'node:test';
import * as L from '../helpers/e2-lifecycle.js';
const {BOTH,GREEN,OFF}=L;
const one=s=>s.stages.length<=1&&s.statuses.length===1;
const safeOnly=s=>s.stages.join()==='b_Step1'&&s.statuses.length===1&&s.statuses[0]==='STS_SAFE';
const ENERGY=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat'];
const lift=s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2;
// ---- G-1 ----
for(const d of [1,2,3])test(L.T(`E2a G-1 E2-01 Run->R&D (green 600 ms) with C2_FBK held ON after the C2 OFF command, in_ES_NC_1 FALSE ${d} scan(s) before the C2_FBK release -> exactly one stage and one main status in every scan, Emergency latched (E2-01, MOD-006, EMGREF)`),t=>{
 const ref=L.cached('Run');ref.hold={in_HV_C2_FBK:true};const g=ref.t+1;ref.step(GREEN,600);ref.step(OFF);const c2off=L.firstAt(ref.log.filter(s=>s.t>=g),s=>!s.out.out_HV_C2);
 const c=L.checks();c(c2off!=null,'precondition: C2 OFF command in the descent');if(c2off==null){c.finish(t);return;}const rel=c2off+300,e=rel-d;
 const x=L.cached('Run');x.hold={in_HV_C2_FBK:true};for(let n=x.t+1;n<=rel+3000;n++){const o={};if(n===g)Object.assign(o,GREEN);if(n===g+600)Object.assign(o,OFF);if(n===e)o.in_ES_NC_1=false;if(n===rel)x.hold={};x.step(o);}
 const bad=x.log.filter(s=>s.t>=g&&!one(s));c(bad.length===0,`one stage / one main status in every scan; first ${bad.slice(0,3).map(s=>s.t-rel+':'+s.stages.join('+')+'/'+s.statuses.join('+'))}`);
 const i=x.log.findIndex(s=>s.t>=e&&L.isEmg(s));c(i>=0&&x.log.slice(i).every(L.isEmg),'Emergency reached and latched (no Restart given)');c.finish(t,`violated checks (e=rel-${d})`);});
// ---- G-2 ----
test(L.T('E2a G-2 MOD-002 steady R&D, BOTH 1100 ms, in_HV_C2_FBK never ON (pinned FALSE) -> Run (stage b_Step3 / STS_RUN) in no scan to p+6000 (Run only after C2_FBK confirmation, SPEC §7, question 68 "Б"; WDG-03 rollback = E6, not judged)'),t=>{
 const x=L.cached('RnD');x.step(OFF,100);x.hold={in_HV_C2_FBK:false};const p=x.t+1;x.step(BOTH,1100);x.step(OFF,4900);const c=L.checks();
 c(x.log.some(s=>s.t>=p&&s.out.out_HV_C2),'precondition: R&D->Run accepted (C2 ON command)');const r=x.log.find(s=>s.t>=p&&(s.stages.includes('b_Step3')||s.statuses.includes('STS_RUN')));
 c(!r,`no Run in any scan [p, p+6000]; first p+${r?r.t-p:'-'}`);c.finish(t);});
// ---- G-3 ----
test(L.T('E2b G-3 EMG6-01 steady R&D, in_ES_NC_1 FALSE held, Restart at e+12000 while the cause is active -> Emergency in every scan; cause removed, no new Restart for 3000 ms -> still Emergency (no deferred exit); new Restart -> only Safe'),t=>{
 const x=L.cached('RnD');const c=L.checks();const e=x.t+1;x.step({in_ES_NC_1:false},12000);const r1=x.t+1;L.restart(x);x.step({},2000);
 const s1=x.log.filter(s=>s.t>=r1);c(s1.every(L.isEmg),`Restart with the cause active refused: Emergency in every scan; first not ${s1.find(s=>!L.isEmg(s))?.t}`);
 const rm=x.t+1;x.step({in_ES_NC_1:true},3000);const s2=x.log.filter(s=>s.t>=rm);c(s2.every(L.isEmg),`after the cause is removed, no deferred exit without a new Restart; first not Emergency ${s2.find(s=>!L.isEmg(s))?.t}`);
 L.restartToSafe(x,c,'');c.finish(t,`violated checks (e=${e})`);});
// ---- G-4 ----
test(L.T('E2b G-4 EMG6-01 / V14-Q6 steady R&D, in_ES_NC_1 FALSE 100 ms, early Restart in the chain (e+120..e+220, refused), chain completed (e+12000), green held 300 ms -> Emergency in every scan while the green is held, Safe only after the release (as the reference FBEstop Restart)'),t=>{
 const x=L.cached('RnD');const c=L.checks();const e=x.t+1;x.step({in_ES_NC_1:false},100);x.step({in_ES_NC_1:true},19);x.step(GREEN,100);x.step(OFF,12000-220);
 c(x.log.filter(s=>s.t>=e+220).every(L.isEmg),'precondition: the early Restart was refused (Emergency until the chain completed)');
 const p=x.t+1;x.step(GREEN,300);const rel=x.t+1;x.step(OFF,1000);const held=x.log.filter(s=>s.t>=p&&s.t<rel);const sh=held.find(s=>!L.isEmg(s));
 c(!sh,`no exit from Emergency while the green is held [p, release-1]; first ${sh?'p+'+(sh.t-p):'-'}`);const sf=L.firstAt(x.log.filter(s=>s.t>=rel),safeOnly);c(sf!=null&&sf<=rel+100,`Safe after the release (not later than release+100); first ${sf==null?'never':'rel+'+(sf-rel)}`);
 c.finish(t,`violated checks (e=${e}, p=${p})`);});
// ---- G-5 ----
test(L.T('E2b G-5 EMG6-01 / SPEC §12 steady R&D, in_LV_C1_FBK stuck ON, in_ES_NC_1 FALSE 100 ms, Restart at +12000 -> Emergency in every scan (feedback not OFF); FBK released, no new Restart -> still Emergency; new Restart -> only Safe'),t=>{
 const x=L.cached('RnD');const c=L.checks();x.hold={in_LV_C1_FBK:true};const e=x.t+1;x.step({in_ES_NC_1:false},100);x.step({in_ES_NC_1:true},12000);
 c(x.log.filter(s=>s.t>=e+2100).every(s=>!s.out.out_LV_C1),'precondition: C1 OFF command by the emergency chain while C1_FBK stays ON');
 const r1=x.t+1;L.restart(x);x.step({},2000);const s1=x.log.filter(s=>s.t>=r1);c(s1.every(L.isEmg),`Restart with C1_FBK ON refused: Emergency in every scan; first not ${s1.find(s=>!L.isEmg(s))?.t}`);
 x.hold={};const rm=x.t+1;x.step({},3000);const s2=x.log.filter(s=>s.t>=rm);c(s2.every(L.isEmg),`FBK OFF without a new Restart: no deferred exit; first not Emergency ${s2.find(s=>!L.isEmg(s))?.t}`);
 L.restartToSafe(x,c,'');c.finish(t,`violated checks (e=${e})`);});
// ---- G-6 ----
for(const dr of [2000,2005,2010,2500,3000])test(L.T(`E2b G-6 E2-01 + EMG6-01 steady R&D, in_ES_NC_1 FALSE 100 ms, Restart pressed at e+${dr} (during / at the end of the C1 chain) -> exactly one stage and one main status in every scan; any Safe only alone with energy and FBK OFF`),t=>{
 const x=L.cached('RnD');const c=L.checks();const e=x.t+1;x.step({in_ES_NC_1:false},100);x.step({in_ES_NC_1:true},dr-100);L.restart(x);x.step({},12000);
 const seg=x.log.filter(s=>s.t>=e);const bad=seg.filter(s=>!one(s));c(bad.length===0,`one stage / one main status in every scan; first ${bad.slice(0,3).map(s=>'e+'+(s.t-e)+':'+s.stages.join('+')+'/'+s.statuses.join('+'))}`);
 const sf=seg.filter(s=>s.statuses.includes('STS_SAFE'));const w=sf.find(s=>!safeOnly(s)||ENERGY.some(k=>s.out[k])||s.c1fbk||s.c2fbk);c(!w,`Safe only as b_Step1 alone with energy and FBK OFF (EMG6-01); first e+${w?w.t-e:'-'}`);
 t.diagnostic(`outcome: ${x.statusSet()} at e+${x.t-e}; first Safe ${sf[0]?'e+'+(sf[0].t-e):'never'}`);c.finish(t,`violated checks (Restart at e+${dr})`);});
// ---- G-7 ----
test(L.T('E2b G-7 EMG6-01-BOOT group start with in_LV_C1_FBK ON, Restart (refused), FBK OFF, then green held 300 ms -> Emergency in every scan while held, Safe only after the release (E2-04, Q-RC-10, V14-Q6 as the reference)'),t=>{
 const x=L.create();const c=L.checks();x.hold={in_LV_C1_FBK:true};x.step({},10);L.restart(x,300);x.step({},500);
 c(x.log.every(L.isEmg),'precondition: Restart with C1_FBK ON refused at boot');x.hold={};x.step({},2500);
 const p=x.t+1;x.step(GREEN,300);const rel=x.t+1;x.step(OFF,1000);const sh=x.log.filter(s=>s.t>=p&&s.t<rel).find(s=>!L.isEmg(s));c(!sh,`no exit while the green is held; first p+${sh?sh.t-p:'-'}`);
 const sf=L.firstAt(x.log.filter(s=>s.t>=rel),safeOnly);c(sf!=null&&sf<=rel+100,`Safe after the release; first ${sf==null?'never':'rel+'+(sf-rel)}`);c.finish(t);});
// ---- G-8 ----
for(const k of [998,999])test(L.T(`E2c G-8 HLT-01 steady R&D, BOTH 1500 ms, in_LV_Faulty_FBK TRUE from p+${k} (Q-${1000-k}, before the acceptance) -> UP not executed: no C2 ON / STO release in any scan; chained R&D->Safe; no Emergency (STP-I boundary c = u-1, E2-Q2(a))`),t=>{
 const x=L.cached('RnD');x.step(OFF,100);const c=L.checks();const p=x.t+1;x.step(BOTH,k);x.step({...BOTH,in_LV_Faulty_FBK:true},1500-k);x.step(OFF,6000);const seg=x.log.filter(s=>s.t>=p);
 const l=seg.find(lift);c(!l,`no C2 ON / STO release in any scan; first p+${l?l.t-p:'-'}`);c(seg.some(safeOnly),'chained R&D->Safe reached (HLT-01)');const e=seg.find(L.isEmg);c(!e,`no Emergency; first p+${e?e.t-p:'-'}`);c.finish(t);});
// ---- G-9 ----
test(L.T('E2c G-9 BTN-002 / MOD-003 / MOD-004 steady R&D, BOTH held 4000 ms, in_LV_Faulty_FBK TRUE from +500 -> R&D->Safe (HLT-01); the held BOTH never starts Safe->R&D (no b_Step12, no C1 ON after Safe) until release+3000'),t=>{
 const x=L.cached('RnD');x.step(OFF,100);const c=L.checks();const p=x.t+1;x.step(BOTH,500);x.step({...BOTH,in_LV_Faulty_FBK:true},3500);x.step({...OFF},3000);const seg=x.log.filter(s=>s.t>=p);
 const sf=L.firstAt(seg,safeOnly);c(sf!=null,'R&D->Safe reached while BOTH is held (HLT-01)');if(sf!=null){const b=seg.find(s=>s.t>sf&&(s.stages.includes('b_Step12')||s.out.out_LV_C1));c(!b,`held gesture not executed in Safe: no b_Step12 / C1 ON after Safe; first p+${b?b.t-p:'-'}`);}
 const l=seg.find(lift);c(!l,'no HV lift');c.finish(t,`violated checks (Safe at ${sf})`);});
// ---- G-10 ----
for(const k of [999,1000,1001])test(L.T(`E2c G-10 E2-01 + STP-I steady R&D, BOTH 1500 ms, in_LV_Faulty_FBK TRUE from p+${k} (Q${k-1000>=0?'+':''}${k-1000}) -> in no scan C2 ON or STO released while out_LV_C1 is OFF; one stage in every scan; no Emergency`),t=>{
 const x=L.cached('RnD');x.step(OFF,100);const c=L.checks();const p=x.t+1;x.step(BOTH,k);x.step({...BOTH,in_LV_Faulty_FBK:true},1500-k);x.step(OFF,8000);const seg=x.log.filter(s=>s.t>=p);
 const b=seg.find(s=>lift(s)&&!s.out.out_LV_C1);c(!b,`HV energy without LV C1 forbidden (C1 OFF not before C2_FBK OFF, STP-I; E2-01 one transition); first p+${b?b.t-p:'-'}`);
 const m=seg.find(s=>!one(s));c(!m,`one stage / one main status; first p+${m?m.t-p:'-'} ${m?.stages}`);const e=seg.find(L.isEmg);c(!e,`no Emergency; first p+${e?e.t-p:'-'}`);
 t.diagnostic(`outcome: first lift ${L.firstAt(seg,lift)==null?'never':'p+'+(L.firstAt(seg,lift)-p)}, Safe ${L.firstAt(seg,safeOnly)==null?'never':'p+'+(L.firstAt(seg,safeOnly)-p)}`);c.finish(t);});
// ---- G-11 ----
for(const gap of [2001,2050])test(L.T(`E2d G-11 BTN-001 / Q-REL-AFTER-PERMIT "А" steady Safe, BOTH 1100 ms -> Safe->R&D, both released; new BOTH 1100 ms at release+${gap} (in R&D) -> R&D->Run accepted: no lift in [p2, Q2-1], first lift in [Q2, Q2+400] (TD-06)`),t=>{
 const x=L.cached('Safe');x.step(OFF,100);const c=L.checks();x.step(BOTH,1100);const rel=x.t+1;x.step(OFF,gap);const p2=x.t+1;c(p2===rel+gap,'stand precondition: new press at release+'+gap);
 const pre=x.snap();c(pre.stages.join()==='b_Step_RnD','precondition: R&D reached before the new gesture; stages='+pre.stages);x.step(BOTH,1100);x.step(OFF,1500);
 const l=L.firstAt(x.log.filter(s=>s.t>=p2),lift);c(l!=null&&l>=p2+1000&&l<=p2+1400,`first lift in [Q2, Q2+400]; p2+${l==null?'never':l-p2}`);c.finish(t);});
// ---- G-12 E2-02-R (READY by Q-RC-16 "А"; pulse length REC-ACCEPTED G3Q-3, analyst E2-G3-q §3): accepted Run->R&D waiting for C2_FBK OFF (green held,
// C2_FBK pinned ON until the C2 OFF command + 50 ms), in_LV_Faulty_FBK TRUE at h and FALSE from h+r (r in {1, 3, 100}; 1 scan counts as a loss),
// C2_FBK OFF at h+d (d = 1..5). Expected: E2-01 every scan; single outcome R&D (not before C2_FBK OFF); then WITHOUT a command the chained R&D->Safe
// (C1 OFF not before R&D and not before C2_FBK OFF, C1_FBK OFF -> Safe); SafetyFault (HealthyLost) not later than Safe - NV without the symbol.
// Forbidden: a steady R&D left after the LV restoration, Emergency, Step4^Step12, return to Run.
let w12=null;function waiting12(){if(!w12){try{const x=L.cached('Run');x.hold={in_HV_C2_FBK:true};x.step(GREEN);const lim=x.t+15000;while(x.get('out_HV_C2')&&x.t<lim)x.step();
  if(x.get('out_HV_C2'))throw Error('precondition: C2 OFF command not observed');const h=x.t+50;while(x.t<h-1)x.step();w12={x};}catch(e){w12={error:e};}}if(w12.error)throw w12.error;return w12.x.fork();}
const rndS=s=>s.stages.includes('b_Step_RnD');
for(const r of [1,3,100])for(const d of [1,2,3,4,5])test(L.T(`E2a G-12 E2-02-R LV Healthy lost at h and restored at h+${r} (Q-RC-16 "А", G3Q-3), C2_FBK OFF at h+${d}, green held -> E2-01, R&D not before C2_FBK OFF, then chained R&D->Safe without a command; no Emergency, no return to Run`),t=>{
 const x=waiting12();const c=L.checks();x.hold={in_HV_C2_FBK:true};const h=x.t+1,cOff=h+d;for(let n=h;n<=h+8000;n++){const o={};if(n===h)o.in_LV_Faulty_FBK=true;if(n===h+r)o.in_LV_Faulty_FBK=false;if(n===cOff)x.hold={};x.step(o);}
 const seg=x.log.filter(s=>s.t>=h);const m=seg.find(s=>!one(s));c(!m,`E2-01 one stage / status; first h+${m?m.t-h:'-'} ${m?.stages}`);
 const s412=seg.find(s=>s.stages.includes('b_Step4')&&s.stages.includes('b_Step12'));c(!s412,'Step4^Step12 forbidden');
 const e=seg.find(L.isEmg);c(!e,`no Emergency; first h+${e?e.t-h:'-'}`);const rd=L.firstAt(seg,rndS);c(rd!=null&&rd>=cOff,`R&D reached, not before C2_FBK OFF (R&D h+${rd==null?'never':rd-h}, C2_FBK OFF h+${d})`);
 const run=seg.findIndex(s=>!s.stages.includes('b_Step3'));c(run>=0&&seg.slice(run).every(s=>!s.stages.includes('b_Step3')&&!s.statuses.includes('STS_RUN')),'no return to Run');
 const c1=L.firstAt(seg,s=>!s.out.out_LV_C1);c(c1!=null&&rd!=null&&c1>=rd&&c1>=cOff,`C1 OFF not before R&D and not before C2_FBK OFF (C1 OFF h+${c1==null?'never':c1-h})`);
 const sf=L.firstAt(seg,safeOnly);c(sf!=null&&rd!=null&&sf>rd,`chained R&D->Safe without a command (Q-RC-16, HLT-01): Safe h+${sf==null?'never':sf-h}; final ${x.stageSet()}`);
 if(x.sf){const f=sf==null?null:x.log.find(s=>s.t>=h&&s.t<=sf&&s.out[x.sf]);c(!!f,'SafetyFault (HealthyLost) TRUE not later than Safe (Q-E2Q-02)');}else c.nv('SafetyFault (HealthyLost) not later than Safe - no SafetyFault symbol (A8)');
 c.finish(t,`violated checks (h=${h}, r=${r}, d=${d})`);});
test(L.T('E2a G-12 E2-02-R LV Healthy lost at h (C2_FBK OFF at h+3) and restored only after R&D is reached -> chained R&D->Safe still executed (Q-RC-16 "А"); no Emergency'),t=>{
 const x=waiting12();const c=L.checks();x.hold={in_HV_C2_FBK:true};const h=x.t+1;let rd=null;for(let n=h;n<=h+8000;n++){const o={};if(n===h)o.in_LV_Faulty_FBK=true;if(n===h+3)x.hold={};if(rd!=null&&n===rd+10)o.in_LV_Faulty_FBK=false;x.step(o);if(rd==null&&x.get('b_Step_RnD'))rd=x.t;}
 const seg=x.log.filter(s=>s.t>=h);c(rd!=null,'R&D reached');const sf=L.firstAt(seg,safeOnly);c(sf!=null&&rd!=null&&sf>rd,`chained R&D->Safe; Safe ${sf}`);const e=seg.find(L.isEmg);c(!e,'no Emergency');
 if(!x.sf)c.nv('SafetyFault - no symbol (A8)');c.finish(t,`violated checks (R&D ${rd})`);});
// ---- G-13 EMG6-FBK (READY; analyst E2-G3-q §4.1; SPEC §12 p.4, V14-Q6, EMG-006, MOD-008): steady Safe, C1_FBK or C2_FBK ON without command (held),
// in_Estop_PLC TRUE 100 ms at f+500, then 3000 ms. (1) green 300 ms at g with FBK ON the whole time -> Emergency in every scan to g+5000;
// (2) green 300 ms released, FBK OFF at g+1000 -> still Emergency to g+6000 (no deferred exit), then a new Restart -> only Safe;
// (3) green held from g through FBK OFF at f2 = g+200 until g+3000 -> no Safe in any scan with FBK ON (<= f2-1 ... f2), exit to Safe after the
// release (Restart on release as in the reference, measured A12) not later than release+100. Never R&D/Run after the Restart.
// NB (reported to the analyst): the reference 4495a1f in the same stimulus leaves Emergency at the release even with C1_FBK ON (D2-A status);
// the norm here is SPEC §12 p.4 (feedback OFF), as the criterion states.
for(const [fn,fbk] of [['C1_FBK','in_LV_C1_FBK'],['C2_FBK','in_HV_C2_FBK']]){
 const base13=()=>{const x=L.cached('Safe');x.step(OFF,2100);x.hold={[fbk]:true};x.step({},500);x.step({in_Estop_PLC:true},100);x.step({in_Estop_PLC:false},3000);return x;};
 const fbkOn=s=>s.c1fbk||s.c2fbk;
 test(L.T(`E2d G-13 EMG6-FBK (1) Safe, ${fn} ON without command, in_Estop_PLC 100 ms, Restart (green 300 ms) with ${fn} ON the whole time -> Emergency in every scan to g+5000, no Safe (SPEC §12 p.4, EMG-006)`),t=>{
  const x=base13();const c=L.checks();const g=x.t+1;x.step(GREEN,300);x.step(OFF,4700);const seg=x.log.filter(s=>s.t>=g);const n=seg.find(s=>!L.isEmg(s));c(!n,`Emergency in every scan; first g+${n?n.t-g:'-'} ${n?.statuses}`);c.finish(t);});
 test(L.T(`E2d G-13 EMG6-FBK (2) Safe, ${fn} ON without command, in_Estop_PLC 100 ms, Restart released while ${fn} ON, ${fn} OFF at g+1000 -> still Emergency to g+6000 (no deferred exit); new Restart -> only Safe`),t=>{
  const x=base13();const c=L.checks();const g=x.t+1;x.step(GREEN,300);x.step(OFF,700);x.hold={};x.step({},5000);const seg=x.log.filter(s=>s.t>=g);const n=seg.find(s=>!L.isEmg(s));
  c(!n,`no exit without a new Restart after FBK OFF; first g+${n?n.t-g:'-'}`);L.restartToSafe(x,c,'');c.finish(t);});
 test(L.T(`E2d G-13 EMG6-FBK (3) Safe, ${fn} ON without command, in_Estop_PLC 100 ms, green held from g through ${fn} OFF at g+200 until g+3000 -> no Safe in any scan with FBK ON; Safe after the release (<= release+100); never R&D/Run`),t=>{
  const x=base13();const c=L.checks();const g=x.t+1;x.step(GREEN,200);x.hold={};x.step(GREEN,2800);const rel=x.t+1;x.step(OFF,2000);const seg=x.log.filter(s=>s.t>=g);
  const b=seg.find(s=>fbkOn(s)&&!L.isEmg(s));c(!b,`no Safe (exit) in any scan with C1/C2_FBK ON; first g+${b?b.t-g:'-'}`);
  const sf=L.firstAt(seg,safeOnly);c(sf!=null&&sf<=rel+100,`exit to Safe after FBK OFF, not later than release+100; first ${sf==null?'never':'rel+'+(sf-rel)}`);
  const up=seg.find(s=>s.stages.some(v=>['b_Step12','b_Step_RnD','b_Step3'].includes(v)));c(!up,'never Safe->R&D / R&D / Run after the Restart');c.finish(t);});}
