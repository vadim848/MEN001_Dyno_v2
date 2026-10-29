// Catalog section W - watchdog and SafetyFault (E5/E6).
import {def,stIs,emg,toSafeToRnd,toStartingRun,pre} from '../../helpers/catalog-program.js';
const TOL=50;
import {T_REL,T_HOLD} from './timers.js';
import {downTrace} from './d.js';
export const cmdName=(x,kind)=>{const n=x.P.sym(kind);pre(n,`NOT IMPLEMENTED on target: PLC input ${kind} (E4, v1.4 §8) not declared`);return n;};
export const edge=(x,kind,ms=200)=>{const n=cmdName(x,kind);const t=x.t;x.step({[n]:true},ms);x.step({[n]:false});return t;};
// SafetyFault in Safe via a failed Safe->R&D (C1_FBK never ON) - W-01 path.
export function safeWithFault(P){const x=P.safe();x.hold.in_LV_C1_FBK=false;const {u1}=toSafeToRnd(x);x.wait(1500);delete x.hold.in_LV_C1_FBK;x.wait(2100);
 pre(x.is('SAFE')&&!x.r.get('out_LV_C1'),'Safe after failed Safe->R&D (W-01 rollback)');pre(x.faultName&&x.r.get(x.faultName),'SafetyFault active after the rollback (W-01)');return {x,u1};}
// SafetyFault in R&D via a failed R&D->Run (C2_FBK never ON) - W-02 path.
export function rndWithFault(P){const x=P.rnd();x.hold.in_HV_C2_FBK=false;toStartingRun(x);x.wait(500+T_HOLD+1000);delete x.hold.in_HV_C2_FBK;x.wait(2100);// abort at u+500 + DN_T_HOLD 5 s (TMR-1-Q1)
 pre(x.is('RND')&&!x.r.get('out_HV_C2'),'R&D after failed R&D->Run (W-02 rollback)');pre(x.faultName&&x.r.get(x.faultName),'SafetyFault active after the rollback (W-02)');return x;}

def('W-01','E6','Safe->R&D: C1_FBK not ON within 500 ms -> rollback to Safe; SafetyFault',(P,c)=>{
 const x=P.safe();x.hold.in_LV_C1_FBK=false;const {u1}=toSafeToRnd(x);x.wait(2000);
 const off=x.fall('out_LV_C1',u1);c(off!==undefined&&off>u1+500-TOL&&off<=u1+500+TOL,`C1 OFF at C1 ON+${off===undefined?'none':off-u1}, expected 500+-${TOL} [E6-Q1]`);
 c(x.is('SAFE')&&!x.never(s=>stIs(s,'RND'),u1),`rollback to Safe, never R&D; status=${x.status()}`);c(!x.never(emg,u1),'not Emergency [E6-Q1]');c.fault(x,true,'SafetyFault [E6-Q1]');
},{source:'E6-Q1'});

def('W-02','E6','StartingRun: C2_FBK not ON within 500 ms -> abort to R&D; SafetyFault',(P,c)=>{
 const x=P.rnd();x.hold.in_HV_C2_FBK=false;const {u}=toStartingRun(x);x.wait(500+T_HOLD+1500);
 const tr=downTrace(x,u+1);c(tr.DIS!==undefined&&tr.C2!==undefined&&Math.abs(tr.C2-(tr.DIS+T_HOLD))<=TOL,`abort: C2 OFF at Discharge+${tr.DIS===undefined||tr.C2===undefined?'none':tr.C2-tr.DIS}, expected ${T_HOLD}+-${TOL} (DN_T_HOLD shared with StartingRun abort) [TMR-1-Q1]`);
 const sto=x.first(s=>s.STO,u);c(sto!==undefined&&sto>u+500-TOL&&sto<=u+500+TOL,`abort (STO active) at u+${sto===undefined?'none':sto-u}, expected 500+-${TOL} [Q-RC-12]`);
 c(x.is('RND')&&!x.r.get('out_HV_C2'),`abort ends in R&D, C2 OFF; status=${x.status()}`);c(!x.never(s=>emg(s)||stIs(s,'RUN'),u),'no Emergency, no Run');c.fault(x,true,'SafetyFault [Q-RC-12]');
},{source:'Q-RC-12'});

def('W-03','E6','StartingRun: HV normal not confirmed for 30 s (blinking) -> rollback to R&D at 30 s; SafetyFault',(P,c)=>{
 const x=P.rnd();x.step({in_HV_Faulty_FBK:true});const {u}=toStartingRun(x);x.until(s=>s.c2f,500,'C2_FBK ON (plant)');const tf=x.first(s=>s.c2f,u-1);
 while(x.t<tf+31000){x.step({in_HV_Faulty_FBK:false},50);x.step({in_HV_Faulty_FBK:true},60);}
 const sto=x.first(s=>s.STO,u);c(sto!==undefined&&sto>tf+30000-TOL&&sto<=tf+30000+TOL,`rollback at C2_FBK ON+${sto===undefined?'none':sto-tf}, expected 30000+-${TOL} [Q-CA1-01]`);
 c(!x.never(s=>stIs(s,'RUN'),u),'never Run');x.wait(5000);c(x.is('RND'),`rollback ends in R&D; status=${x.status()}`);c.fault(x,true,'SafetyFault [Q-CA1-01]');
},{source:'Q-CA1-01'});

def('W-04','E6','Safe->R&D: LV normal not confirmed for 30 s -> rollback to Safe; SafetyFault',(P,c)=>{
 const x=P.safe();const {u1}=toSafeToRnd(x,{holdLvFaulty:true});x.until(s=>s.c1f,500,'C1_FBK ON (plant)');const tf=x.first(s=>s.c1f,u1-1);x.wait(tf+31000-x.t);
 const off=x.fall('out_LV_C1',u1);c(off!==undefined&&off>tf+30000-TOL&&off<=tf+30000+TOL,`rollback (C1 OFF) at C1_FBK ON+${off===undefined?'none':off-tf}, expected 30000+-${TOL} [66(b)]`);
 x.wait(1000);c(x.is('SAFE'),`ends in Safe; status=${x.status()}`);c.fault(x,true,'SafetyFault [66(b), E6-Q1]');
},{source:'66(b)'});

def('W-05','E6','StartingRun: abort, then the 500 ms window expires without FBK -> SafetyFault anyway',(P,c)=>{
 const x=P.rnd();x.hold.in_HV_C2_FBK=false;const {u}=toStartingRun(x);x.wait(Math.max(0,u+150-x.t));
 // S1-Q1 A (accepted, D-S2-ACCEPT): abort by the CMD_RUN_TO_R&D edge inside the 500 ms window (green is unreachable there).
 edge(x,'RUN_TO_RND',50);x.wait(3000);c.fault(x,true,'SafetyFault after window expiry during abort [Q-V7-03, TD-E5-1]');c(!x.never(emg,u),'not Emergency');
 {const y=P.safe();y.hold.in_LV_C1_FBK=false;const {u1}=toSafeToRnd(y);y.wait(Math.max(0,u1+200-y.t));edge(y,'RND_TO_SAFE',50);y.wait(2000);
  c.fault(y,false,'abort Safe->R&D before the window expired (command removed): no SafetyFault [TD-E5-1]');c(y.is('SAFE'),`abort ends in Safe; status=${y.status()}`);}
},{source:'Q-V7-03, TD-E5-1, S1-Q1 A (D-S2-ACCEPT)'});

def('W-06','E5','Safe with SafetyFault: BOTH only acknowledges; new BOTH after the 1 s release filter -> step up',(P,c)=>{
 const {x}=safeWithFault(P);const g=x.both();x.wait(1000);c(x.first(s=>s.out_LV_C1,g.p1)===undefined,'first BOTH: no step up (acknowledge only) [E6-Q2]');
 c.fault(x,false,'first BOTH acknowledges SafetyFault [E6-Q2]');x.wait(1100);const h=x.both();x.wait(1000);
 c(x.first(s=>s.out_LV_C1,h.p1)!==undefined,'new BOTH 2.1 s after release (> filter 1 s): Safe->R&D starts [E6-Q2]');
 {const {x:y}=safeWithFault(P);const b=y.blue(600);y.wait(300);c(y.never(s=>s.out_Door_Unlock_Solonoeid,b.p)===undefined,'blue with SafetyFault: no Unlock [Q-E5-1]');c.fault(y,false,'blue acknowledges [Q-E5-1, E6-Q2]');}
 {const y=P.safe();y.hold.in_LV_C1_FBK=false;const {u1}=toSafeToRnd(y);y.wait(Math.max(0,u1+T_REL-300-y.t));delete y.hold.in_LV_C1_FBK;pre(y.faultName&&y.r.get(y.faultName),'SafetyFault after the W-01 rollback (by C1 ON+700 ms)');
  y.green(100);y.wait(200);c.fault(y,true,'press ~0.7 s (< filter 1 s) after the last release does not acknowledge [TD-E5-2, TMR-1-Q1]');y.wait(T_REL-100);y.green(100);y.wait(200);c.fault(y,false,'first press after both released 1.1 s (> filter 1 s) acknowledges [TD-E5-2, TMR-1-Q1]');}
 {const {x:y}=safeWithFault(P);y.step({in_Estop_PLC:true},300);y.step({in_Estop_PLC:false},15000);y.restart();y.wait(2000);c(y.is('SAFE'),'Restart -> Safe');
  c.fault(y,true,'Restart in Emergency does not acknowledge; SafetyFault survives Emergency->Safe [TD-E5-3]');}
 {const {x:y}=safeWithFault(P);const t=y.t;y.step({inPLC_BypassC1C2:true},1000);c(!y.never(s=>!stIs(s,'SAFE')||s.out_LV_C1||s.out_HV_C2,t),'Config entry refused while SafetyFault [Q-RC-05 b, Q-RC-07 b]');y.step({inPLC_BypassC1C2:false});}
},{source:'E6-Q2'});

def('W-07','E5','R&D with SafetyFault: green 0.5 s -> acknowledges and descends to Safe',(P,c)=>{
 const x=rndWithFault(P);const g=x.green(550);x.wait(2000);c(x.fall('out_LV_C1',g.p)!==undefined&&x.is('SAFE'),`green descends to Safe [Q-RC-07]; status=${x.status()}`);
 c.fault(x,false,'green acknowledges SafetyFault [Q-RC-07]');
},{source:'Q-RC-07'});

def('W-08','E5','R&D with SafetyFault: PLC command -> does not acknowledge',(P,c)=>{
 {const x=rndWithFault(P);const t=edge(x,'RND_TO_RUN');x.wait(2000);c(x.first(s=>s.out_HV_C2||!s.STO,t)===undefined,'CMD_R&D_TO_RUN: no step up while SafetyFault [E6-Q2]');c.fault(x,true,'CMD_R&D_TO_RUN does not acknowledge [E6-Q2]');}
 {const x=rndWithFault(P);edge(x,'RND_TO_SAFE');x.wait(2000);c(x.is('SAFE'),'CMD_R&D_TO_SAFE descends [Q-RC-07a]');c.fault(x,true,'CMD_R&D_TO_SAFE does not acknowledge [E6-Q2]');}
},{source:'E6-Q2, Q-RC-07'});

def('W-09','E5','Safe: C1_FBK ON without command -> SafetyFault; step up forbidden until FBK OFF; press while FBK ON does not acknowledge',(P,c)=>{
 const x=P.safe();const ev=x.t;x.hold.in_LV_C1_FBK=true;x.wait(1000);c.fault(x,true,'SafetyFault on C1_FBK ON without command (by 1000 ms, bound A10) [Q-V4-02]');
 const g=x.both();x.wait(1000);c(x.first(s=>s.out_LV_C1,g.p1)===undefined,'no step up while FBK ON [Q-V4-02]');
 delete x.hold.in_LV_C1_FBK;x.wait(2100);c.fault(x,true,'press while FBK ON did not acknowledge [Q-V7-04]');
 {const y=P.rnd();y.hold.in_HV_C2_FBK=true;y.wait(1000);c.fault(y,true,'steady R&D, C2_FBK ON without command: SafetyFault [Q-V4-02, TD-E5-4]');c(!y.never(emg,y.t-1000),'R&D: not Emergency [Q-V4-02]');}
 const h=x.both();x.wait(1000);c(x.first(s=>s.out_LV_C1,h.p1)===undefined,'first BOTH after FBK OFF only acknowledges [Q-V7-04, E6-Q2]');c.fault(x,false,'acknowledged after FBK OFF');
 x.wait(1100);const k=x.both();x.wait(1000);c(x.first(s=>s.out_LV_C1,k.p1)!==undefined,'next BOTH 2.1 s after release (> filter 1 s): step up');void ev;
},{source:'Q-V4-02, Q-V7-04'});

def('W-10','E5','any error -> one PLC Fault bit = PLC command error OR SafetyFault',(P,c)=>{
 const x0=P.safe();pre(x0.plcFaultName,'NOT IMPLEMENTED on target: PLC Fault status bit (Q-RC-13) not published');
 {const {x}=safeWithFault(P);c(x.r.get(x.plcFaultName),'Fault bit TRUE with SafetyFault [Q-RC-13]');}
 {const x=P.rnd();const a=cmdName(x,'RND_TO_RUN'),b=cmdName(x,'RND_TO_SAFE');x.step({[a]:true,[b]:true},200);
  c(x.r.get(x.plcFaultName),'Fault bit TRUE on two PLC commands at once [Q-RC-13, V14-Q8]');x.step({[a]:false,[b]:false},1100);
  c(!x.r.get(x.plcFaultName),'Fault bit FALSE after all commands FALSE 1 s and no SafetyFault [V14-Q10, Q-RC-13]');}
},{source:'Q-RC-13'});
export const W=['W-01','W-02','W-03','W-04','W-05','W-06','W-07','W-08','W-09','W-10'];
