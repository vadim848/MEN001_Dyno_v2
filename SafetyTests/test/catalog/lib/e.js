// Catalog section E - Emergency and the emergency chain.
import {OUT,def,stIs,emg,energyOff,toSafeToRnd,toStartingRun,boot,pre} from '../../helpers/catalog-program.js';
const TOL=50;
const emgWithin=(x,ev,c,label)=>{const e=x.first(emg,ev-1);c(e!==undefined&&e<=ev+TOL,`${label}: Emergency within ${TOL} ms; got ${e===undefined?'none':'+'+(e-ev)}`);return e;};
// A11: Restart is issued only after the emergency chain has settled: energy removed (C1/C2/C3/BMS OFF, STO active, FBK OFF)
// and at least 15 s after the event (chain completion is not observable at the outputs; early Restart: question S1-Q3).
export const drainEnergy=(x,max=30000)=>{const t0=x.t,end=x.t+max;while(x.t<end){x.step();if(energyOff(x.log.at(-1))&&x.t-t0>=15000)return true;}return energyOff(x.log.at(-1));};
// EMG6-01 / V14-Q6: Restart (green press+release) after energy removal -> ONLY Safe, no energy, never R&D/Run/Config.
export function restartOnlySafe(x,c,label){
 c(emg(x.log.at(-1)),`${label}: Emergency latched before Restart; status=${x.status()}`);
 const from=x.t;x.restart();x.wait(2000);
 const bad=x.never(s=>s.st.some(v=>v==='RND'||v==='RUN'||v==='CFG')||s.stg.includes('Step12')||s.out_LV_C1||s.out_HV_C2||!s.STO,from);
 c(!bad,`${label}: after Restart never R&D/Run/Config/Safe->R&D and no energy (EMG6-01); first t=${bad?.t} ${bad?.st} ${bad?.stg}`);
 c(x.is('SAFE'),`${label}: Restart -> Safe within 2000 ms [V14-Q6, EMG6-01]; status=${x.status()}`);
}

def('E-01','E2','Run: EStop NC1 -> Emergency; STO, C2 OFF, C1 OFF by the emergency chain',(P,c)=>{
 const x=P.run();const ev=x.t;x.step({in_ES_NC_1:false},500);emgWithin(x,ev,c,'EStop NC1 in Run [EMG-001]');
 const ok=drainEnergy(x);c(ok,'STO active, C2 OFF, C1 OFF reached by the emergency chain within 30 s [EMG-001; bound A10]');
 const c1=x.fall('out_LV_C1',ev);c(c1!==undefined&&c1>ev+2000-TOL&&c1<=ev+2000+TOL,`C1 OFF at ev+${c1===undefined?'none':c1-ev}, expected 2000+-${TOL} (chain "as in Run", Q-ARCH-01/Q-RC-01)`);
 c(!x.never(s=>!emg(s),ev+TOL),'Emergency latched during the chain');
},{source:'EMG-001, Q-ARCH-01'});

def('E-02','E2','R&D: in_Estop_PLC -> Emergency; C3/BMS OFF + LV discharge at once, C1 OFF after 2 s',(P,c)=>{
 const x=P.rndC3();const ev=x.t;x.step({in_Estop_PLC:true},300);x.step({in_Estop_PLC:false},2500);
 emgWithin(x,ev,c,'in_Estop_PLC in R&D [Q-ARCH-01]');
 const c3=x.first(s=>!s.out_C3_BatRelay&&!s.out_RBM_Bat,ev-1);c(c3!==undefined&&c3<=ev+TOL,`C3/BMS OFF at once (<=${TOL} ms); got ${c3===undefined?'none':'+'+(c3-ev)}`);
 const lvd=x.first(s=>s.out_LV_Discharge_Request,ev-1);c(lvd!==undefined&&lvd<=ev+TOL,`LV discharge request at once (<=${TOL} ms); got ${lvd===undefined?'none':'+'+(lvd-ev)}`);
 const c1=x.fall('out_LV_C1',ev);c(c1!==undefined&&c1>ev+2000-TOL&&c1<=ev+2000+TOL,`C1 OFF at ev+${c1===undefined?'none':c1-ev}, expected 2000+-${TOL} [Q-ARCH-01]`);
},{source:'Q-ARCH-01'});

def('E-03','E2','Safe->R&D (C1 ON, not confirmed): Mentee -> Emergency; lift stopped, C1 OFF after 2 s',(P,c)=>{
 const x=P.safe();const {u1}=toSafeToRnd(x);x.wait(Math.max(0,u1+200-x.t));c(!x.is('RND'),'precondition: R&D not yet confirmed');const ev=x.t;
 x.step({in_Mentee_EStop:true},300);x.step({in_Mentee_EStop:false},2500);emgWithin(x,ev,c,'Mentee in Safe->R&D [Q-ARCH-01]');
 c(!x.never(s=>s.st.includes('RND')||s.out_HV_C2||!s.STO,ev),'lift stopped: R&D never reached, no C2/STO release');
 const lvd=x.first(s=>s.out_LV_Discharge_Request,ev-1);c(lvd!==undefined&&lvd<=ev+TOL,`LV discharge at once; got ${lvd===undefined?'none':'+'+(lvd-ev)}`);
 const c1=x.fall('out_LV_C1',ev);c(c1!==undefined&&c1>ev+2000-TOL&&c1<=ev+2000+TOL,`C1 OFF at ev+${c1===undefined?'none':c1-ev}, expected 2000+-${TOL} [Q-E2Q-01]`);
},{source:'Q-ARCH-01, Q-E2Q-01'});

def('E-04','E2','Emergency by PLC: cause removed, green -> only Safe',(P,c)=>{
 for(const [k,mk] of [['R&D',()=>P.rnd()],['Run',()=>P.run()]]){const x=mk();x.step({in_Estop_PLC:true},300);x.step({in_Estop_PLC:false});
  c(emg(x.log.at(-1)),`${k}: Emergency by in_Estop_PLC`);c(drainEnergy(x),`${k}: energy removed before Restart (SPEC §12)`);x.wait(500);
  restartOnlySafe(x,c,k);}
},{source:'V14-Q6, EMG6-01'});

def('E-05','E2','Emergency, cause still active, green -> stays Emergency',(P,c)=>{
 for(const [k,cause] of [['EStop NC1',{in_ES_NC_1:false}],['in_Estop_PLC',{in_Estop_PLC:true}]]){const x=P.rnd();x.step(cause,300);drainEnergy(x);x.wait(500);
  const from=x.t;x.restart();x.wait(2000);c(!x.never(s=>!emg(s),from),`${k} still active: Restart does not leave Emergency [SPEC §12]`);}
 {const x=P.rnd();x.step({in_Estop_PLC:true},300);x.step({in_Estop_PLC:false});x.hold.in_LV_C1_FBK=true;x.wait(15000);const from=x.t;x.restart();x.wait(2000);
  c(!x.never(s=>!emg(s),from),'C1_FBK still ON (feedback not OFF): Restart does not leave Emergency [SPEC §12, EMG6-01]');}
 // B2 (S2 review): Emergency entered from Safe; feedback ON at Restart -> stays Emergency (SPEC §12 feedback OFF, EMG6-01).
 for(const fb of ['in_LV_C1_FBK','in_HV_C2_FBK']){
  {const x=P.safe();x.step({in_Estop_PLC:true},300);x.step({in_Estop_PLC:false});x.wait(15000);x.hold[fb]=true;x.wait(100);const from=x.t;x.restart();x.wait(2000);
   c(!x.never(s=>!emg(s),from),`Emergency from Safe, ${fb} ON at Restart: stays Emergency (status never Safe) [SPEC §12, EMG6-01]`);}
  {const x=P.safe();x.step({in_Estop_PLC:true},300);x.step({in_Estop_PLC:false});x.wait(15000);const from=x.t;x.step({in_Reset_PB:true},50);x.hold[fb]=true;x.step({in_Reset_PB:true},50);
   x.step({in_Reset_PB:false},500);c(!x.never(s=>!emg(s),from),`${fb} ON while green held, released with FBK ON: stays Emergency [SPEC §12, EMG6-01]`);
   const off=x.t;delete x.hold[fb];x.wait(2000);c(!x.never(s=>!emg(s),off),`${fb} OFF afterwards without a new green press: no deferred exit, stays Emergency [REC-ACCEPTED (тестировщик, S1-Q7)]`);}}
 // Q-S6-2 A (Vadim): Restart counts only if the green press started in Emergency; green held from before a 1-scan EStop pulse gives no exit.
 for(const [k,ev,ok] of [['EStop NC1',{in_ES_NC_1:false},{in_ES_NC_1:true}],['in_Estop_PLC',{in_Estop_PLC:true},{in_Estop_PLC:false}]]){
  const x=P.safe();x.step({in_Reset_PB:true},100);const t=x.t;x.step({in_Reset_PB:true,...ev},1);x.step({in_Reset_PB:true,...ok},300);x.step({in_Reset_PB:false});
  c(x.first(emg,t-1)!==undefined,`${k} 1-scan pulse with green held: Emergency [EMG-001]`);drainEnergy(x);
  c(!x.never(s=>!emg(s),t+1),`${k}: green pressed before Emergency, released after: no exit, stays Emergency [Q-S6-2 A]`);
  x.restart();x.wait(2000);c(x.is('SAFE'),`${k}: new green press+release in Emergency -> Safe [Q-S6-2 A, V14-Q6]; status=${x.status()}`);}
},{source:'SPEC §12, EMG6-01, REC-ACCEPTED (тестировщик, S1-Q7), Q-S6-2 A'});

def('E-06','E2','group start with C1_FBK ON: Restart -> not Safe',(P,c)=>{
 const x=P.create();x.hold.in_LV_C1_FBK=true;x.wait(10);c(emg(x.log.at(-1)),'group start in Emergency');
 const from=x.t;x.restart();x.wait(3000);c(!x.never(s=>!emg(s),from),'C1_FBK ON at Restart: never Safe (stays Emergency) [EMG6-01-BOOT, SPEC §12 feedback OFF]');
},{source:'EMG6-01-BOOT'});

def('E-07','E3','normal Run->R&D, EStop at t+1 s: each step (STO, Discharge, C2 OFF) not later than normal',(P,c)=>{
 const base=P.run();const x=base.fork();
 const times=y=>({STO:y.first(s=>s.STO,y.t0),DIS:y.first(s=>s.out_HV_Discharge_Request,y.t0),C2:y.first(s=>!s.out_HV_C2,y.t0)});
 base.t0=base.t;base.green(550);base.wait(20000);const n=times(base);
 x.t0=x.t;x.step({in_Reset_PB:true},550);x.step({in_Reset_PB:false},450);const ev=x.t;x.step({in_ES_NC_1:false},20000);const e=times(x);
 for(const k of ['STO','DIS','C2']){c(n[k]!==undefined,`normal descent: ${k} occurs (reference trace)`);
  c(e[k]!==undefined&&(n[k]===undefined||e[k]<=n[k]+TOL),`EStop at a+~1 s: ${k} at ${e[k]===undefined?'none':e[k]-x.t0} not later than normal ${n[k]===undefined?'none':n[k]-base.t0} (+${TOL}) [Q-T3-1]`);}
 c(emg(x.log.at(-1)),'Emergency latched');void ev;
 // T5 (S3 review): after the Emergency during the descent, Restart -> Safe, then BOTH -> R&D and BOTH -> Run work again.
 x.step({in_ES_NC_1:true},500);drainEnergy(x);x.restart();x.wait(3000);c(x.is('SAFE'),`T5: Restart -> Safe; status=${x.status()}`);
 x.both();x.wait(3000);c(x.is('RND'),`T5: BOTH -> R&D; status=${x.status()}`);x.wait(2100);x.both();x.wait(3000);
 c(x.is('RUN'),`T5: BOTH -> Run again (descent sequencer reset) [EMG6-01, V14-Q6]; status=${x.status()}`);
},{source:'Q-T3-1, EMG6-01'});

def('E-08','E2','no two main states at once / none -> Emergency (invariant over a full lifecycle)',(P,c)=>{
 const x=P.run();x.green(550);x.until(s=>stIs(s,'RND')&&!s.out_HV_C2&&!s.c2f,25000,'R&D after green in Run');x.wait(2100);
 x.green(550);x.until(s=>stIs(s,'SAFE')&&!s.out_LV_C1,5000,'Safe after green in R&D');x.wait(2100);
 x.both();x.wait(3000);x.step({in_ES_NC_1:false},300);x.step({in_ES_NC_1:true});drainEnergy(x);x.wait(500);x.restart();x.wait(2500);
 c(x.is('SAFE'),`lifecycle ends in Safe; status=${x.status()}`);
 c.nv('reaction "two/none main states -> Emergency" cannot be provoked through real inputs (catalog rule 1); covered only by the per-scan invariant');
},{source:'E2, Q-RC-10'});

def('E-09','E6','Run: C2_FBK lost after the 500 ms window with command ON -> Emergency',(P,c)=>{
 const x=P.run();const ev=x.t;x.hold.in_HV_C2_FBK=false;x.wait(500);emgWithin(x,ev,c,'confirmed C2_FBK lost in Run [Q-RC-19, Q-V4-01]');
 {const y=P.rnd();const e2=y.t;y.hold.in_LV_C1_FBK=false;y.wait(500);emgWithin(y,e2,c,'confirmed C1_FBK lost in R&D [Q-RC-19]');}
},{source:'Q-RC-19, Q-V4-01'});

def('E-10','E6','Run->R&D: C2_FBK ON > 500 ms after C2 OFF command -> Emergency',(P,c)=>{
 const x=P.run();x.green(550);const off=x.until(s=>!s.out_HV_C2,20000,'C2 OFF command during Run->R&D');x.hold.in_HV_C2_FBK=true;x.wait(1000);
 const e=x.first(emg,off);c(e!==undefined&&e>off+500-TOL&&e<=off+500+TOL,`Emergency at C2 OFF+${e===undefined?'none':e-off}, expected 500+-${TOL} [E6-Q1]`);
 // FBK pinned ON from before the OFF command (E6-Q1, TD-E5-4: OFF failure only if FBK stays ON from the ON command).
 {const y=P.rnd();y.hold.in_LV_C1_FBK=true;const g=y.green(550);y.wait(1000);const o=y.fall('out_LV_C1',g.p);pre(o!==undefined,'C1 OFF command in R&D->Safe');
  const e1=y.first(emg,o);c(e1!==undefined&&Math.abs(e1-(o+500))<=TOL,`R&D->Safe, C1_FBK stuck ON: Emergency at C1 OFF+${e1===undefined?'none':e1-o}, expected 500+-${TOL} [E6-Q1]`);}
 // Q-V4-02 counterpart: FBK rising again after it was OFF in steady Safe -> SafetyFault, not Emergency.
 {const y=P.rnd();y.green(550);y.until(s=>stIs(s,'SAFE')&&!s.c1f,3000,'Safe after R&D->Safe');y.wait(200);const t=y.t;y.hold.in_LV_C1_FBK=true;y.wait(1000);
  c(!y.never(emg,t),'Safe, C1_FBK rises without command: not Emergency [Q-V4-02, TD-E5-4]');c.fault(y,true,'Safe, C1_FBK rises without command: SafetyFault [Q-V4-02]');}
 {const y=P.safe();y.step({inPLC_BypassC1C2:true},1000);pre(y.is('CFG'),'Config entered (Bypass edge in Safe)');y.hold.in_HV_C2_FBK=true;y.step({inPLC_BypassC1C2:false},10000);
  const o=y.first(s=>!s.out_HV_C2,y.t-10000);const e3=o===undefined?undefined:y.first(emg,o);
  c(e3!==undefined&&Math.abs(e3-(o+500))<=TOL,`Config exit, C2_FBK stuck ON: Emergency at C2 OFF+${e3===undefined?'none':e3-o}, expected 500+-${TOL} [E6-Q1, S4-F3a]`);}
},{source:'E6-Q1, S4-F3a'});
// E-11 (EMG-OFF-Q1, Vadim 2026-10-27): Emergency caused by an OFF failure (C1/C2 FBK ON > 500 ms after the OFF command) ->
// the common emergency chain as with EStop (E-01/E-02 timings): C3/BMS OFF + LV discharge at once, C1 OFF after 2 s, STO held,
// then the HV discharge/C2 OFF branch; the stuck FBK must not delay the chain.
// Assumption (test-set input): the FBK of the failed contactor is pinned ON by the test (plant model override) for the whole window.
function offFailureChain(x,c,off,fb,label,{hvBranch=true}={}){
 x.wait(15000);// observation window; FBK stays pinned ON throughout
 c(x.hold[fb]===true,`${label}: ${fb} pinned ON for the whole window (test setup)`);
 const ev=x.first(emg,off);
 c(ev!==undefined&&Math.abs(ev-(off+500))<=TOL,`${label}: Emergency at OFF+${ev===undefined?'none':ev-off}, expected 500+-${TOL} [E6-Q1]`);
 if(ev===undefined)return;
 c(!x.never(s=>!emg(s),ev),`${label}: exactly one main state (Emergency) from entry to end of window [EMG-OFF-Q1, rule 5]`);
 const c3=x.first(s=>!s.out_C3_BatRelay&&!s.out_RBM_Bat,ev-1);c(c3!==undefined&&c3<=ev+TOL,`${label}: C3/BMS OFF at once (<=${TOL} ms after Emergency); got ${c3===undefined?'none':'+'+(c3-ev)} [EMG-OFF-Q1, Q-ARCH-01]`);
 c(!x.never(s=>s.out_C3_BatRelay||s.out_RBM_Bat,ev+TOL),`${label}: C3/BMS stay OFF [EMG-OFF-Q1]`);
 const lvd=x.first(s=>s.out_LV_Discharge_Request,ev-1);c(lvd!==undefined&&lvd<=ev+TOL,`${label}: LV discharge request at once (<=${TOL} ms after Emergency); got ${lvd===undefined?'none':'+'+(lvd-ev)} [EMG-OFF-Q1, Q-ARCH-01]`);
 const at=x.log.find(s=>s.t>=ev);
 if(at?.out_LV_C1){const c1=x.fall('out_LV_C1',ev);c(c1!==undefined&&c1>ev+2000-TOL&&c1<=ev+2000+TOL,`${label}: C1 OFF at Emergency+${c1===undefined?'none':c1-ev}, expected 2000+-${TOL} [EMG-OFF-Q1, Q-ARCH-01]`);}
 else c(!x.never(s=>s.out_LV_C1,ev),`${label}: C1 already OFF at Emergency entry and never re-commanded ON [EMG-OFF-Q1]`);
 c(!x.never(s=>!s.STO,ev),`${label}: STO held (active) throughout the chain [EMG-OFF-Q1]`);
 c(!x.never(s=>s.out_HV_C2,ev),`${label}: C2 never commanded ON after Emergency [EMG-OFF-Q1]`);
 if(hvBranch){const hvd=x.first(s=>s.out_HV_Discharge_Request,ev-1);c(hvd!==undefined,`${label}: HV discharge branch requested within the window (timing not specified) [EMG-OFF-Q1]`);}
}
def('E-11a','E6','OFF failure Run->R&D, C2_FBK stuck ON: Emergency -> common emergency chain, FBK does not delay it',(P,c)=>{
 const x=P.runC3();pre(x.log.at(-1).out_C3_BatRelay&&x.log.at(-1).out_RBM_Bat,'precondition: C3/BMS ON in Run (manual set in R&D, V14-Q15)');x.hold.in_HV_C2_FBK=true;x.green(550);const off=x.until(s=>!s.out_HV_C2,20000,'C2 OFF command during Run->R&D');
 offFailureChain(x,c,off,'in_HV_C2_FBK','Run->R&D, C2_FBK stuck');
},{source:'EMG-OFF-Q1, E6-Q1, Q-ARCH-01'});
def('E-11b','E6','OFF failure R&D->Safe, C1_FBK stuck ON: Emergency -> common emergency chain, FBK does not delay it',(P,c)=>{
 const x=P.rndC3();pre(x.log.at(-1).out_C3_BatRelay,'precondition: C3 ON in R&D');x.hold.in_LV_C1_FBK=true;x.green(550);const off=x.until(s=>!s.out_LV_C1,5000,'C1 OFF command in R&D->Safe');
 offFailureChain(x,c,off,'in_LV_C1_FBK','R&D->Safe, C1_FBK stuck',{hvBranch:false});
},{source:'EMG-OFF-Q1, E6-Q1, Q-ARCH-01'});
def('E-11c','E6','OFF failure on exit from Config, C2_FBK stuck ON: Emergency -> common emergency chain, FBK does not delay it',(P,c)=>{
 const x=P.safe();x.step({inPLC_BypassC1C2:true},1000);pre(x.is('CFG'),'Config entered (Bypass edge in Safe)');x.hold.in_HV_C2_FBK=true;
 x.step({inPLC_BypassC1C2:false});const off=x.until(s=>!s.out_HV_C2,15000,'C2 OFF command on Config exit');
 offFailureChain(x,c,off,'in_HV_C2_FBK','Config exit, C2_FBK stuck');
},{source:'EMG-OFF-Q1, E6-Q1, V14-Q18, S4-F3a'});
// E-12 (Q-EMGOFF-A1 = B, Vadim 2026-10-27): any WD_EMG in steady Run (here: C1/C2 FBK lost while commanded ON, E-09) starts the
// common emergency chain: C3/BMS OFF + LV discharge at once, C1 OFF after 2 s, STO active and held, C2 OFF by the chain.
// Emergency moment per E-09 (<= loss+TOL after the 500 ms window). Assumption: lost FBK pinned OFF by the test for the whole window.
// STO/C2 timing inside the chain is not specified here (only occurrence and hold are checked).
function runFbkLossChain(x,c,fb,label){
 pre(x.is('RUN')&&x.log.at(-1).out_HV_C2&&x.log.at(-1).out_LV_C1&&x.log.at(-1).out_C3_BatRelay&&x.log.at(-1).out_RBM_Bat,'precondition: steady Run, C1+C2 ON, C3/BMS ON (manual set in R&D, V14-Q15)');
 x.wait(500);const loss=x.t;x.hold[fb]=false;x.wait(15000);
 c(x.hold[fb]===false,`${label}: ${fb} pinned OFF for the whole window (test setup)`);
 const ev=x.first(emg,loss);c(ev!==undefined&&ev<=loss+TOL,`${label}: Emergency within ${TOL} ms; got ${ev===undefined?'none':'+'+(ev-loss)} [Q-RC-19, E-09]`);
 if(ev===undefined)return;
 c(!x.never(s=>!emg(s),ev),`${label}: exactly one main state (Emergency) from entry to end of window [Q-EMGOFF-A1, rule 5]`);
 const c3=x.first(s=>!s.out_C3_BatRelay&&!s.out_RBM_Bat,ev-1);c(c3!==undefined&&c3<=ev+TOL,`${label}: C3/BMS OFF at once (<=${TOL} ms after Emergency); got ${c3===undefined?'none':'+'+(c3-ev)} [Q-EMGOFF-A1, Q-ARCH-01]`);
 c(!x.never(s=>s.out_C3_BatRelay||s.out_RBM_Bat,ev+TOL),`${label}: C3/BMS stay OFF [Q-EMGOFF-A1]`);
 const lvd=x.first(s=>s.out_LV_Discharge_Request,ev-1);c(lvd!==undefined&&lvd<=ev+TOL,`${label}: LV discharge request at once (<=${TOL} ms after Emergency); got ${lvd===undefined?'none':'+'+(lvd-ev)} [Q-EMGOFF-A1, Q-ARCH-01]`);
 const c1=x.fall('out_LV_C1',ev-1);c(c1!==undefined&&c1>ev+2000-TOL&&c1<=ev+2000+TOL,`${label}: C1 OFF at Emergency+${c1===undefined?'none':c1-ev}, expected 2000+-${TOL} [Q-EMGOFF-A1, Q-ARCH-01]`);
 c(c1===undefined||!x.never(s=>s.out_LV_C1,c1),`${label}: C1 stays OFF after the chain drop [Q-EMGOFF-A1]`);
 const sto=x.first(s=>s.STO,ev-1);c(sto!==undefined,`${label}: STO activated by the chain [Q-EMGOFF-A1, EMG-001]`);
 c(sto===undefined||!x.never(s=>!s.STO,sto),`${label}: STO held once active [Q-EMGOFF-A1]`);
 const c2=x.first(s=>!s.out_HV_C2,ev-1);c(c2!==undefined,`${label}: C2 OFF by the emergency chain within the window [Q-EMGOFF-A1]`);
 c(c2===undefined||!x.never(s=>s.out_HV_C2,c2),`${label}: C2 stays OFF [Q-EMGOFF-A1]`);
}
def('E-12a','E6','steady Run, C2_FBK lost with C2 commanded ON: Emergency -> common emergency chain',(P,c)=>{
 runFbkLossChain(P.runC3(),c,'in_HV_C2_FBK','Run, C2_FBK lost');
},{source:'Q-EMGOFF-A1, Q-RC-19, Q-ARCH-01'});
def('E-12b','E6','steady Run, C1_FBK lost with C1 commanded ON: Emergency -> common emergency chain',(P,c)=>{
 runFbkLossChain(P.runC3(),c,'in_LV_C1_FBK','Run, C1_FBK lost');
},{source:'Q-EMGOFF-A1, Q-RC-19, Q-ARCH-01'});
export const E=['E-01','E-02','E-03','E-04','E-05','E-06','E-07','E-08','E-09','E-10','E-11a','E-11b','E-11c','E-12a','E-12b'];
void boot;void pre;void toStartingRun;
