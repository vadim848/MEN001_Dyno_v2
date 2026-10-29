// Catalog section H - Healthy (raw Faulty polarity, loss).
import {def,stIs,emg,toSafeToRnd} from '../../helpers/catalog-program.js';
import {downTrace,checkOrder,holdCheck} from './d.js';
import {T_SS1,T_COAST} from './timers.js';
const TOL=50;
const rel=(v,a)=>v===undefined?'none':'+'+(v-a);

def('H-01','E2','raw in_LV_Faulty_FBK FALSE = normal, TRUE = loss (same everywhere)',(P,c)=>{
 {const x=P.safe();const {u1}=toSafeToRnd(x);x.wait(1500);c(x.first(s=>stIs(s,'RND'),u1)!==undefined,'raw FALSE: Safe->R&D is confirmed (LV normal) [D-ARCH-POL]');}
 {const x=P.safe();const {u1}=toSafeToRnd(x,{holdLvFaulty:true});x.wait(1500);c(x.first(s=>stIs(s,'RND'),u1)===undefined,'raw TRUE: Safe->R&D is not confirmed (LV lost) [D-ARCH-POL]');}
 {const x=P.rnd();const ev=x.t;x.step({in_LV_Faulty_FBK:true},3000);c(x.first(s=>!s.out_LV_C1,ev)!==undefined&&x.is('SAFE'),`raw TRUE in R&D: loss -> R&D->Safe [D-ARCH-POL, E2-Q2a]; status=${x.status()}`);}
 {const x=P.rnd();const ev=x.t;x.wait(3000);c(!x.never(s=>!stIs(s,'RND'),ev),'raw FALSE in R&D: normal, R&D kept');}
},{source:'D-ARCH-POL'});

function protective(P,c,sig,{chained}){
 const x=P.run();const ev=x.t;x.step({[sig]:true},25000);const t=downTrace(x,ev);
 c(t.STO!==undefined&&t.STO<=ev+TOL,`immediate STO (${rel(t.STO,ev)}) [Q-RC-02]`);
 c(t.DIS!==undefined&&Math.abs(t.DIS-(ev+T_COAST))<=TOL,`Discharge after coast 2 s (${rel(t.DIS,ev)}, expected +${T_COAST}+-${TOL}) [Q-RC-02, TMR-1-Q1]`);holdCheck(c,t,ev,'protective descent');
 checkOrder(c,t,ev,'protective descent');c(!x.never(emg,ev),'not Emergency [Q-RC-02]');
 if(chained)c(x.is('SAFE')&&!x.r.get('out_LV_C1'),`then chained R&D->Safe [Q-RC-02, E2-Q2a]; status=${x.status()}`);
 else c(x.is('RND'),`stays in R&D (HV ignored in R&D) [Q-RC-02, E2-Q2b]; status=${x.status()}`);
 c.fault(x,true,'SafetyFault HealthyLost [Q-ARCH-05]');
}
def('H-02','E3','Run: HV Faulty TRUE -> immediate STO, coast 2 s, Discharge, hold 5 s, C2 OFF, R&D; SafetyFault',(P,c)=>protective(P,c,'in_HV_Faulty_FBK',{chained:false}),{source:'Q-RC-02, Q-ARCH-05'});
def('H-03','E3','Run: LV Faulty TRUE -> as H-02, then R&D->Safe; SafetyFault',(P,c)=>{protective(P,c,'in_LV_Faulty_FBK',{chained:true});
 // T2 (S3 review): 200 ms LV loss in Run is remembered -> still ends in Safe [Q-RC-16, Q-RC-02].
 const x=P.run();const ev=x.t;x.step({in_LV_Faulty_FBK:true},200);x.step({in_LV_Faulty_FBK:false},20000);
 c(x.is('SAFE')&&!x.r.get('out_LV_C1'),`T2: LV lost 200 ms in Run -> protective descent, then Safe although LV returned [Q-RC-16]; status=${x.status()}`);c(!x.never(emg,ev),'T2: no Emergency');
},{source:'Q-RC-02, Q-RC-16'});

def('H-04','E2','R&D: HV Faulty TRUE / FALSE -> ignored',(P,c)=>{
 const x=P.rnd();const ev=x.t;x.step({in_HV_Faulty_FBK:true},1500);x.step({in_HV_Faulty_FBK:false},1500);x.step({in_HV_Faulty_FBK:true},1500);
 c(!x.never(s=>!stIs(s,'RND')||!s.out_LV_C1||s.out_HV_C2||!s.STO,ev),'R&D unchanged (C1 ON, C2 OFF, STO active) [E2-Q2b]');
 c(!x.never(s=>s.fault===true||s.plcFault===true,ev),'no fault [E2-Q2b, Q-ARCH-05]');
},{source:'E2-Q2b'});

def('H-05','E2','R&D: LV Faulty TRUE -> R&D->Safe; SafetyFault',(P,c)=>{
 const x=P.rnd();const ev=x.t;x.step({in_LV_Faulty_FBK:true},3000);
 c(x.fall('out_LV_C1',ev)!==undefined,'C1 OFF (R&D->Safe) [E2-Q2a]');c(x.is('SAFE'),`Safe reached within 3 s [E2-Q2a; bound A10]; status=${x.status()}`);
 c(!x.never(emg,ev),'not Emergency');c.fault(x,true,'SafetyFault HealthyLost [Q-RC-11]');
},{source:'E2-Q2a, Q-RC-11'});

def('H-06','E3','Run->R&D in SS1: LV Faulty TRUE -> immediate STO; then R&D->Safe; SafetyFault',(P,c)=>{
 const x=P.run();const g=x.green(550);const a=g.p+500;x.wait(Math.max(0,a+1000-x.t));const ev=x.t;x.step({in_LV_Faulty_FBK:true},25000);const t=downTrace(x,a);
 c(t.STO!==undefined&&t.STO<=ev+TOL,`immediate STO on loss in SS1 (${rel(t.STO,ev)} from loss) [Q-RC-15]`);
 c(t.DIS!==undefined&&Math.abs(t.DIS-(ev+T_COAST))<=TOL,`Discharge after coast 2 s from STO (${rel(t.DIS,ev)}, expected +${T_COAST}+-${TOL}) [Q-RC-15, TMR-1-Q1]`);
 checkOrder(c,t,a,'SS1 + LV loss');c(x.is('SAFE'),`then R&D->Safe; status=${x.status()}`);c.fault(x,true,'SafetyFault HealthyLost [Q-RC-15]');
},{source:'Q-RC-15'});

def('H-07','E3','Run->R&D after STO: LV Faulty TRUE then back -> stop unchanged; R&D->Safe anyway',(P,c)=>{
 const x=P.run();const g=x.green(550);const a=g.p+500;x.wait(Math.max(0,a+3000-x.t));x.step({in_LV_Faulty_FBK:true},200);x.step({in_LV_Faulty_FBK:false},25000);const t=downTrace(x,a);
 c(t.DIS!==undefined&&Math.abs(t.DIS-(a+T_SS1+T_COAST))<=TOL,`stop unchanged: discharge at a+${T_SS1+T_COAST}+-${TOL} [TMR-1-Q1]; got ${t.DIS===undefined?'none':'a+'+(t.DIS-a)} [Q-RC-09]`);
 checkOrder(c,t,a,'stop after STO + LV blip');
 {// T4 (S3 review): LV blip after STO keeps the normal stop; NC1 lost afterwards -> no Emergency [Q-RC-09, Q-RC-03 b1].
  const y=P.run();const g2=y.green(550);const a2=g2.p+500;y.wait(Math.max(0,a2+3000-y.t));y.step({in_LV_Faulty_FBK:true},200);y.step({in_LV_Faulty_FBK:false},500);const ev=y.t;
  y.step({in_InterLock_NC_1:false},20000);c(!y.never(emg,ev),'T4: NC1 lost in the normal stop after an LV blip after STO: no Emergency [Q-RC-09, Q-RC-03 b1]');
  c(y.is('SAFE'),`T4: ends in Safe [Q-RC-16]; status=${y.status()}`);}c(x.is('SAFE'),`R&D->Safe even though LV returned [Q-RC-16]; status=${x.status()}`);
 c(!x.never(emg,a),'not Emergency');c.fault(x,true,'SafetyFault HealthyLost [Q-E2Q-02]');
},{source:'Q-RC-09, Q-RC-16'});
export const H=['H-01','H-02','H-03','H-04','H-05','H-06','H-07'];
