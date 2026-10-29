// Catalog section D - step down.
import {def,stIs,emg,toSafeToRnd,toStartingRun} from '../../helpers/catalog-program.js';
import {T_SS1,T_COAST,T_HOLD,T_REL} from './timers.js';
const TOL=50;
// Run->R&D trace after the down event at `a`: moments of STO active, HV discharge command, C2 OFF command, C2_FBK OFF, R&D.
export function downTrace(x,a){return {STO:x.first(s=>s.STO,a-1),DIS:x.first(s=>s.out_HV_Discharge_Request,a-1),C2:x.first(s=>!s.out_HV_C2,a-1),
 FBK:x.first(s=>!s.c2f,a-1),RND:x.first(s=>stIs(s,'RND'),a-1)};}
const rel=(v,a)=>v===undefined?'none':'a+'+(v-a);
// TMR-1-Q1: C2 OFF command exactly T_HOLD (5 s) after the HV discharge command (DN_T_HOLD, shared normal descent / StartingRun abort).
export function holdCheck(c,t,a,label){c(t.DIS!==undefined&&t.C2!==undefined&&Math.abs(t.C2-(t.DIS+T_HOLD))<=TOL,`${label}: C2 OFF at Discharge+${t.DIS===undefined||t.C2===undefined?'none':t.C2-t.DIS}, expected ${T_HOLD}+-${TOL} (discharge hold 5 s) [TMR-1-Q1]`);}
export function checkOrder(c,t,a,label){
 c(t.STO!==undefined&&t.DIS!==undefined&&t.C2!==undefined,`${label}: STO, Discharge and C2 OFF all occur (STO ${rel(t.STO,a)}, DIS ${rel(t.DIS,a)}, C2 ${rel(t.C2,a)})`);
 if(t.STO!==undefined&&t.DIS!==undefined)c(t.DIS>=t.STO+TOL,`${label}: STO strictly before Discharge (not simultaneous) [E2-Q1]; STO ${rel(t.STO,a)} DIS ${rel(t.DIS,a)}`);
 if(t.DIS!==undefined&&t.C2!==undefined)c(t.C2>=t.DIS+TOL,`${label}: Discharge strictly before C2 OFF (discharge hold) [E2-Q1]; DIS ${rel(t.DIS,a)} C2 ${rel(t.C2,a)}`);
 if(t.RND!==undefined&&t.FBK!==undefined)c(t.RND>=t.FBK,`${label}: R&D only after C2_FBK OFF; FBK ${rel(t.FBK,a)} R&D ${rel(t.RND,a)}`);
 c(t.RND!==undefined,`${label}: R&D reached`);
}

def('D-01','E3','Run: green 0.5 s -> STO at 2 s; HV discharge command at 4 s; hold 5 s; C2 OFF at 9 s; R&D after C2_FBK OFF',(P,c)=>{
 const x=P.run();const g=x.green(550);const a=g.p+500;x.wait(20000);const t=downTrace(x,a);
 c(t.STO!==undefined&&Math.abs(t.STO-(a+T_SS1))<=TOL,`STO at ${rel(t.STO,a)}, expected a+${T_SS1}+-${TOL} (SS1 2 s) [D-RUN-STOP-WAITS, TMR-1-Q1]`);
 c(t.DIS!==undefined&&Math.abs(t.DIS-(a+T_SS1+T_COAST))<=TOL,`HV discharge command at ${rel(t.DIS,a)}, expected a+${T_SS1+T_COAST}+-${TOL} (SS1 2 s + coast 2 s) [E2-Q1, TMR-1-Q1]`);
 holdCheck(c,t,a,'Run->R&D');
 checkOrder(c,t,a,'Run->R&D');c(!x.never(emg,a),'no Emergency');
 // T1 (S3 review): SS1 requested at descent start (A12: out_SS1_DRx FALSE = SS1 requested, as STO_DRx FALSE = STO active).
 const ss1=x.first(s=>!s.out_SS1_DR1&&!s.out_SS1_DR2,a-1-TOL);c(ss1!==undefined&&Math.abs(ss1-a)<=TOL&&(t.STO===undefined||ss1<t.STO),`T1: SS1 requested at descent start (${rel(ss1,a)}, expected a+-${TOL}, before STO) [E2-Q1, D-RUN-STOP-WAITS]`);
},{source:'D-RUN-STOP-WAITS, E2-Q1'});

def('D-02','E3','Run->R&D: strict order STO < Discharge < C2 OFF, nothing simultaneous',(P,c)=>{
 const x=P.run();const g=x.green(550);const a=g.p+500;x.wait(20000);checkOrder(c,downTrace(x,a),a,'Run->R&D');
},{source:'E2-Q1'});

def('D-03','E3','StartingRun: green 0.5 s -> abort: STO + Discharge at once, hold, C2 OFF, R&D; no SS1/coast',(P,c)=>{
 const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(2100);
 const b=x.blue(600);x.wait(300);c(x.never(s=>s.out_Door_Unlock_Solonoeid,b.p)===undefined,'blue 0.6 s in StartingRun: no Unlock [Q-E3-1 REC-ACCEPTED]');x.wait(1800);
 const y=x.fork();const g=x.green(550);const a=g.p+500;x.wait(10000);const t=downTrace(x,a);
 c(t.STO!==undefined&&t.STO<=a+TOL&&t.STO>a-TOL,`STO at once (${rel(t.STO,a)}, expected a+-${TOL}) - no SS1 [V14-Q12]`);
 c(t.DIS!==undefined&&t.DIS<=a+TOL,`Discharge at once (${rel(t.DIS,a)}) - no coast [V14-Q12]`);holdCheck(c,t,a,'StartingRun abort');
 if(t.DIS!==undefined&&t.C2!==undefined)c(t.C2>=t.DIS+TOL,`C2 OFF after the discharge hold; DIS ${rel(t.DIS,a)} C2 ${rel(t.C2,a)}`);
 // TD-14: StartingRun is already main R&D; abort end R_end = C2 OFF & C2_FBK OFF & STO active (REC-ACCEPTED D-03 oracle).
 const rEnd=x.first(s=>!s.out_HV_C2&&!s.c2f&&s.STO,a-1);c(rEnd!==undefined,'abort ends (C2 OFF, C2_FBK OFF, STO active) [TD-14]');
 c(x.is('RND')&&x.r.get('out_LV_C1'),`abort ends in R&D with C1 ON, not Safe [V14-Q12]; status=${x.status()}`);
 c(!x.never(s=>!stIs(s,'RND'),g.p),'main state R&D throughout the abort (no Safe/Emergency/Run) [TD-14, V14-Q12]');
 // Unlock during the abort (Q-E3-1): with hold 5 s and release filter 1 s (TMR-1-Q1) the abort outlasts release pause + 0.6 s.
 {const h=y.green(550);y.wait(T_REL+100);const live=s=>s.out_HV_C2||s.c2f||!s.STO;
  c(live(y.log.at(-1)),`abort still in progress at green release+${T_REL+100} ms (hold 5 s > filter 1 s) [TMR-1-Q1]`);
  if(live(y.log.at(-1))){const b2=y.blue(600);y.wait(300);c(y.never(s=>s.out_Door_Unlock_Solonoeid,b2.p)===undefined,'blue 0.6 s during the abort: no Unlock [Q-E3-1]');}
  void h;}c(!x.never(s=>stIs(s,'RUN'),g.p),'cancelled start does not resume (no Run)');
},{source:'V14-Q12, D-STARTINGRUN-ABORT, TD-14, Q-E3-1'});

def('D-04','E2','Safe->R&D (C1 ON): green 0.5 s -> abort to Safe: C1 OFF, C1_FBK OFF',(P,c)=>{
 const x=P.safe();toSafeToRnd(x,{holdLvFaulty:true});x.wait(2100);const g=x.green(550);x.wait(1500);
 const off=x.fall('out_LV_C1',g.p);c(off!==undefined&&off>g.p+500-TOL&&off<=g.p+500+TOL,`C1 OFF at press+${off===undefined?'none':off-g.p}, expected 500+-${TOL} [V14-Q13]`);
 c(x.is('SAFE')&&!x.r.get('in_LV_C1_FBK'),`Safe with C1_FBK OFF [V14-Q13, D-LV-OFF-COMPLETE]; status=${x.status()}`);
 const s0=x.t;x.step({in_LV_Faulty_FBK:false},2000);c(!x.never(s=>s.out_LV_C1||stIs(s,'RND'),s0),'cancelled transition does not resume when LV becomes normal');
},{source:'V14-Q13'});

def('D-05','E3','Run->R&D in SS1: green again -> ignored',(P,c)=>{
 const x=P.run();const g=x.green(550);const a=g.p+500;x.wait(Math.max(0,a+1000-x.t));x.green(600);x.wait(20000);const t=downTrace(x,a);
 c(t.STO!==undefined&&Math.abs(t.STO-(a+T_SS1))<=TOL,`second green ignored: STO still at a+${T_SS1}+-${TOL}; got ${rel(t.STO,a)} [Q-RC-08]`);
 c(t.DIS!==undefined&&Math.abs(t.DIS-(a+T_SS1+T_COAST))<=TOL,`second green ignored: discharge still at a+${T_SS1+T_COAST}+-${TOL}; got ${rel(t.DIS,a)} [TMR-1-Q1]`);
 c(x.is('RND'),`ends in R&D (no deferred R&D->Safe); status=${x.status()}`);
},{source:'Q-RC-08'});

def('D-06','E2','R&D: green 0.5 s -> C1 OFF; Safe after C1_FBK OFF',(P,c)=>{
 const x=P.rnd();x.plant.c1=300;const g=x.green(550);x.wait(2000);
 const off=x.fall('out_LV_C1',g.p);c(off!==undefined&&off>g.p+500-TOL&&off<=g.p+500+TOL,`C1 OFF at press+${off===undefined?'none':off-g.p}, expected 500+-${TOL}`);
 const fb=x.fall('c1f',g.p);const safe=x.first(s=>stIs(s,'SAFE'),g.p);
 c(fb!==undefined&&safe!==undefined&&safe>=fb&&safe<=fb+TOL,`Safe after C1_FBK OFF (FBK OFF ${fb===undefined?'none':'+'+(fb-g.p)}, Safe ${safe===undefined?'none':'+'+(safe-g.p)}) [D-LV-OFF-COMPLETE]`);
},{source:'D-LV-OFF-COMPLETE'});

def('D-07','E3','Run->R&D: HV discharge held as a level until the next accepted HV step up',(P,c)=>{
 const x=P.run();const g=x.green(550);x.until(s=>stIs(s,'RND')&&!s.c2f,25000,'R&D after Run->R&D');const d0=x.first(s=>s.out_HV_Discharge_Request,g.p);
 x.wait(3000);c(d0!==undefined&&!x.never(s=>!s.out_HV_Discharge_Request,d0),'HV discharge request stays TRUE from its command through steady R&D [Q-V7-01]');
 const h=x.both();x.wait(300);const u=x.first(s=>s.out_HV_C2||!s.STO,h.p1),f=x.fall('out_HV_Discharge_Request',h.p1);
 c(u!==undefined&&f!==undefined&&Math.abs(f-u)<=TOL,`request removed at the next accepted step up (u=${u}, removed ${f}) [Q-V7-01, question 73]`);
},{source:'Q-V7-01'});

def('D-08','E2','Run->R&D waiting C2 OFF: LV lost, C2_FBK OFF 2 scans later -> exactly R&D, then chained R&D->Safe',(P,c)=>{
 const x=P.run();const g=x.green(550);const off=x.until(s=>!s.out_HV_C2,25000,'C2 OFF command in Run->R&D');x.hold.in_HV_C2_FBK=true;x.step({},5);
 x.step({in_LV_Faulty_FBK:true},2);x.hold.in_HV_C2_FBK=false;x.wait(5000);
 const r=x.first(s=>stIs(s,'RND'),off-1),sf=x.first(s=>stIs(s,'SAFE'),off-1);
 c(r!==undefined,'R&D reached exactly (single outcome) [E2-Q1]');c(sf!==undefined&&(r===undefined||sf>r),'then chained R&D->Safe [E2-Q2a]');
 c(!x.never(emg,g.p),'no Emergency');c(x.is('SAFE')&&!x.r.get('out_LV_C1'),`ends Safe, C1 OFF; status=${x.status()}`);
 {// B1 (S2 review): LV lost then returned BEFORE C2_FBK OFF -> still R&D, then chained R&D->Safe (Q-RC-16 applies to the E2-Q1 race).
  const y=P.run();const g2=y.green(550);const off2=y.until(s=>!s.out_HV_C2,25000,'C2 OFF command in Run->R&D (B1)');y.hold.in_HV_C2_FBK=true;y.step({},5);
  y.step({in_LV_Faulty_FBK:true},2);y.step({in_LV_Faulty_FBK:false},2);y.hold.in_HV_C2_FBK=false;y.wait(5000);
  const r2=y.first(s=>stIs(s,'RND'),off2-1),s2=y.first(s=>stIs(s,'SAFE'),off2-1);
  c(r2!==undefined,'B1 LV returned before C2_FBK OFF: R&D reached [E2-Q1]');c(s2!==undefined&&(r2===undefined||s2>r2),'B1: chained R&D->Safe although LV returned (loss remembered) [Q-RC-16]');
  c(!y.never(emg,g2.p),'B1: no Emergency');c(y.is('SAFE')&&!y.r.get('out_LV_C1'),`B1: ends Safe, C1 OFF; status=${y.status()}`);}
},{source:'E2-Q1, E2-Q2, Q-RC-16'});

def('D-09','E3','StartingRun: LV Healthy lost -> abort to R&D, then R&D->Safe',(P,c)=>{
 const x=P.rnd();const {u}=toStartingRun(x);x.wait(Math.max(0,u+200-x.t));const ev=x.t;x.step({in_LV_Faulty_FBK:true},15000);
 const sto=x.first(s=>s.STO,ev-1);c(sto!==undefined&&sto<=ev+TOL,`abort: STO at once (+${sto===undefined?'none':sto-ev}) [Q-ARCH-03]`);
 c(!x.never(s=>stIs(s,'RUN'),ev),'Run never confirmed');const r=x.first(s=>stIs(s,'RND')&&!s.out_HV_C2&&!s.c2f&&s.STO,ev);const c1off=x.fall('out_LV_C1',ev);
 c(r!==undefined&&c1off!==undefined&&c1off>=r,`C1 stays ON until the abort ends (R_end ${r===undefined?'none':'+'+(r-ev)}, C1 OFF ${c1off===undefined?'none':'+'+(c1off-ev)}) [Q-ARCH-03, TD-14]`);
 c(r!==undefined,'abort ends in R&D');if(r!==undefined)c.fault(x,true,'SafetyFault HealthyLost set by the StartingRun loss, before the abort reaches R&D [Q-ARCH-05]',r-1);c(x.is('SAFE'),`then chained R&D->Safe; status=${x.status()}`);c(!x.never(emg,ev),'no Emergency');
},{source:'Q-ARCH-03'});
export const D=['D-01','D-02','D-03','D-04','D-05','D-06','D-07','D-08','D-09'];
