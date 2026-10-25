// Catalog sections G (Config, E4/E6) and B (start/restart, E7).
import {def,stIs,emg,energyOff,boot,pre} from '../../helpers/catalog-program.js';
import {cmdName,edge} from './w.js';
import {drainEnergy,restartOnlySafe} from './e.js';
const TOL=50,UNL='out_Door_Unlock_Solonoeid',BY='inPLC_BypassC1C2';
const isCfg=s=>stIs(s,'CFG');
// Config observed by the published Config status (A5/A7); a source without it has no Config state (E4) -> FAIL.
function cfgName(x){const n=x.P.sym('CFG');pre(n,'NOT IMPLEMENTED on target: Config status (STS_CFG) not published (V14-Q16, E4)');return n;}
function toConfig(P){const x=P.safe();cfgName(x);const t=x.t;x.step({[BY]:true},1000);pre(x.is('CFG'),`Config entered by Bypass edge in Safe; status=${x.status()}`);return {x,t};}

def('G-01','E4','Safe, cover closed: Bypass edge -> Config: C1+C2 ON, STO held, Unlock forbidden',(P,c)=>{
 const {x,t}=toConfig(P);c(x.r.get('out_LV_C1')&&x.r.get('out_HV_C2'),'C1 and C2 ON in Config [V14-Q16]');c(!x.never(s=>!s.STO,t),'STO never released [V14-Q16]');
 const g=x.blue(600);x.wait(300);c(x.never(s=>s[UNL],g.p)===undefined,'no Unlock in Config [V14-Q16]');
 // Q-E4-3 A (REC-ACCEPTED): Config entry resets both discharge requests (entered from a Safe reached by R&D->Safe, LV request active).
 {const y=P.rnd();y.green(550);y.until(s=>stIs(s,'SAFE')&&!s.c1f,5000,'Safe after R&D->Safe');y.wait(2100);y.step({[BY]:true},1000);
  c(y.is('CFG')&&!y.r.get('out_LV_Discharge_Request')&&!y.r.get('out_HV_Discharge_Request'),`Config entry resets LV and HV discharge requests [Q-E4-3 A]; status=${y.status()}`);}
},{source:'V14-Q16, Q-E4-3 A'});
def('G-02','E4','R&D / Safe with open cover / Bypass held from before -> Bypass ignored',(P,c)=>{
 {const x=P.rnd();cfgName(x);const t=x.t;x.step({[BY]:true},1500);c(!x.never(s=>!stIs(s,'RND')||s.out_HV_C2,t),'R&D: Bypass ignored [V14-Q16]');}
 {const x=P.safe();x.step({in_InterLock_NC_1:false},100);const t=x.t;x.step({[BY]:true},1500);c(!x.never(s=>!stIs(s,'SAFE')||s.out_LV_C1,t),'Safe, cover open: Bypass ignored [V14-Q16]');
  x.step({in_InterLock_NC_1:true,[BY]:true},1500);c(!x.never(s=>!stIs(s,'SAFE')||s.out_LV_C1,t),'Bypass held across cover closing: still ignored (needs a new edge) [Q-RC-05a]');}
 // S4 review: Config entry refused while a button is pressed, while the PLC error is active, without up-permission (connector) [Q-RC-05 b].
 {const x=P.safe();const t=x.t;x.step({in_Reset_PB:true},50);x.step({in_Reset_PB:true,[BY]:true},100);x.step({in_Reset_PB:false,[BY]:true},1500);x.step({[BY]:false});
  c(!x.never(s=>!stIs(s,'SAFE')||s.out_LV_C1||s.out_HV_C2,t),'Bypass edge while green pressed: ignored, not deferred [Q-RC-05 b, V14-Q14]');}
 {const x=P.safe();const t=x.t;x.step({in_Relase_Door_PB:true},50);x.step({in_Relase_Door_PB:true,[BY]:true},100);x.step({in_Relase_Door_PB:false,[BY]:true},1500);x.step({[BY]:false});
  c(!x.never(s=>!stIs(s,'SAFE')||s.out_LV_C1||s.out_HV_C2,t),'Bypass edge while blue pressed: ignored, not deferred [Q-RC-05 b, V14-Q14]');}
 {const x=P.safe();const a=cmdName(x,'SAFE_TO_RND'),b=cmdName(x,'RND_TO_SAFE');x.step({[a]:true,[b]:true},200);x.step({[a]:false,[b]:false},300);
  c(x.plcFaultName&&x.r.get(x.plcFaultName),'precondition: PLC error active');const t=x.t;x.step({[BY]:true},1000);c(!x.never(s=>!stIs(s,'SAFE')||s.out_LV_C1||s.out_HV_C2,t),'Bypass edge while PLC error active: no Config [Q-RC-05 b]');x.step({[BY]:false});}
 {const x=P.safe();x.step({in_LV_Connector_Interlock:false},100);const t=x.t;x.step({[BY]:true},1000);
  c(!x.never(s=>!stIs(s,'SAFE')||s.out_LV_C1||s.out_HV_C2,t),'Bypass edge with LV connector lost: no Config, no fault [Q-RC-05 b, EMG-003]');x.step({[BY]:false});}
},{source:'V14-Q16, Q-RC-05'});
def('G-03','E4','Config: any buttons / PLC commands ignored; no 10 s timer',(P,c)=>{
 const {x}=toConfig(P);const t=x.t;x.wait(2100);x.both();x.wait(2100);x.green(600);x.wait(2100);x.blue(600);x.wait(12000);
 c(!x.never(s=>!isCfg(s)||!s.out_LV_C1||!s.out_HV_C2||!s.STO||s[UNL],t),'Config unchanged by buttons and beyond 10 s [V14-Q16/Q17]');
 for(const k of ['SAFE_TO_RND','RND_TO_RUN','RUN_TO_RND','RND_TO_SAFE']){const n=x.P.sym(k);if(n){const t2=edge(x,k);x.wait(300);c(!x.never(s=>!isCfg(s),t2),`Config: ${k} ignored`);}else c(false,`NOT IMPLEMENTED: ${k}`);}
},{source:'V14-Q16, V14-Q17'});
def('G-04','E4','Config: Bypass removed -> Discharge -> hold -> C1/C2 OFF -> Safe',(P,c)=>{
 const {x}=toConfig(P);const t=x.t;x.step({[BY]:false},10000);
 const dis=x.first(s=>s.out_HV_Discharge_Request,t),c2=x.first(s=>!s.out_HV_C2,t),c1=x.first(s=>!s.out_LV_C1,t),safe=x.first(s=>stIs(s,'SAFE'),t);
 c(dis!==undefined&&c2!==undefined&&c1!==undefined&&c2>=dis+TOL&&c1>=dis+TOL,`Discharge before C1/C2 OFF (DIS ${dis}, C2 ${c2}, C1 ${c1}) [V14-Q18]`);
 c(safe!==undefined&&!x.never(s=>s.c1f||s.c2f,safe-1),'Safe only when both FBK OFF [V14-Q18]');
 c(dis!==undefined&&dis<=t+TOL,`HV discharge at exit start (+${dis===undefined?'none':dis-t}) [V14-Q18, Q-E4-3 A]`);
 const lvd=x.first(s=>s.out_LV_Discharge_Request,t);c(lvd!==undefined&&c1!==undefined&&Math.abs(lvd-c1)<=TOL,`LV discharge together with C1 OFF (LVD ${lvd}, C1 OFF ${c1}) [Q-E4-3 A]`);
},{source:'V14-Q18, Q-E4-3 A'});
def('G-05','E4','Config / Config exit: NC1 / EStop / connector -> Emergency',(P,c)=>{
 for(const [k,ev] of [['NC1',{in_InterLock_NC_1:false}],['EStop',{in_ES_NC_1:false}],['LV connector',{in_LV_Connector_Interlock:false}]]){
  {const {x}=toConfig(P);const t=x.t;x.step(ev,300);const e=x.first(emg,t-1);c(e!==undefined&&e<=t+TOL,`Config + ${k}: Emergency [V14-Q19]`);}
  {const {x}=toConfig(P);x.step({[BY]:false},100);const t=x.t;x.step(ev,300);const e=x.first(emg,t-1);c(e!==undefined&&e<=t+TOL,`Config exit + ${k}: Emergency [Q-RC-03 b2, V14-Q19]`);}}
 // S4 review: energy by the common emergency chain (Q-ARCH-01: C3/BMS + LV discharge at once, C1 OFF at 2 s, then STO/HV/C2), then Restart -> only Safe.
 {const {x}=toConfig(P);const t=x.t;x.step({in_ES_NC_1:false},300);x.step({in_ES_NC_1:true});const drained=drainEnergy(x);
  const lvd=x.first(s=>s.out_LV_Discharge_Request,t-1);c(lvd!==undefined&&lvd<=t+TOL,`Config + EStop: LV discharge at once (+${lvd===undefined?'none':lvd-t}) [Q-ARCH-01]`);
  const c1=x.fall('out_LV_C1',t-1);c(c1!==undefined&&Math.abs(c1-(t+2000))<=TOL,`Config + EStop: C1 OFF at +${c1===undefined?'none':c1-t}, expected 2000+-${TOL} [Q-ARCH-01]`);
  c(drained,'Config + EStop: all energy removed (C1, C2 OFF, FBK OFF, STO active) by the emergency chain');restartOnlySafe(x,c,'after Config Emergency');}
},{source:'V14-Q19, Q-RC-03, Q-ARCH-01, EMG6-01'});
def('G-06','E4','Config: Healthy lost -> ignored',(P,c)=>{
 const {x}=toConfig(P);const t=x.t;x.step({in_LV_Faulty_FBK:true,in_HV_Faulty_FBK:true},3000);c(!x.never(s=>!isCfg(s)||s.fault===true,t),'Config unchanged, no fault on Healthy loss [V14-Q19]');
},{source:'V14-Q19'});
def('G-07','E6','entering Config: C2_FBK not ON within 500 ms -> rollback to Safe; SafetyFault',(P,c)=>{
 const x=P.safe();cfgName(x);x.hold.in_HV_C2_FBK=false;const t=x.t;x.step({[BY]:true},3000);const on=x.first(s=>s.out_HV_C2,t);
 // TD-E5-6 / Q-RC-06: rollback = normal Config exit (HV discharge at window end, hold, C1/C2 OFF, Safe).
 const dis=on===undefined?undefined:x.first(s=>s.out_HV_Discharge_Request,on);c(dis!==undefined&&Math.abs(dis-(on+500))<=TOL,`rollback starts (HV discharge) at C2 ON+${dis===undefined?'none':dis-on}, expected 500+-${TOL} [Q-RC-06, TD-E5-6]`);
 const off=on===undefined?undefined:x.fall('out_HV_C2',on);c(off!==undefined&&dis!==undefined&&off>=dis+TOL,`C2 OFF after the discharge hold (C2 ON+${off===undefined||on===undefined?'none':off-on}) [V14-Q18, TD-E5-6] [Q-RC-06]`);
 c(x.is('SAFE')&&!x.never(emg,t),'rollback to Safe, not Emergency');c.fault(x,true,'SafetyFault [Q-RC-06]');
 // S5 review N1: same with C1_FBK not arriving (Q-RC-06 "C1_FBK or C2_FBK").
 {const y=P.safe();y.hold.in_LV_C1_FBK=false;const t1=y.t;y.step({[BY]:true},3000);const on1=y.first(s=>s.out_LV_C1,t1);
  const d1=on1===undefined?undefined:y.first(s=>s.out_HV_Discharge_Request,on1);c(d1!==undefined&&Math.abs(d1-(on1+500))<=TOL,`C1 case: rollback starts (HV discharge) at C1 ON+${d1===undefined?'none':d1-on1}, expected 500+-${TOL} [Q-RC-06, TD-E5-6]`);
  c(y.is('SAFE')&&!y.never(emg,t1)&&!y.r.get('out_LV_C1'),`C1 case: rollback to Safe, not Emergency; status=${y.status()}`);c.fault(y,true,'C1 case: SafetyFault [Q-RC-06]');}
},{source:'Q-RC-06, TD-E5-6'});

def('B-01','E7','group start -> Emergency; no energy',(P,c)=>{
 const x=P.create();x.wait(2000);c(!x.never(s=>!emg(s),0),'Emergency from the first scan until Restart [Q-RC-10, SPEC §4]');
 c(!x.never(s=>!energyOff(s),0),'no energy at group start (C1, C2, C3/BMS OFF, STO active)');
},{source:'Q-RC-10, SPEC §4'});
def('B-02','E7','start with buttons pressed: release, then BOTH -> step up only after 2 s pause',(P,c)=>{
 for(const pause of [1500,2500]){const x=P.create();x.step({in_Reset_PB:true,in_Relase_Door_PB:true},1000);const rel=x.t;x.step({in_Reset_PB:false,in_Relase_Door_PB:false});
  let ok=x.until(s=>stIs(s,'SAFE'),1000,'Safe after releasing the buttons (FBEstop Restart, p.12)');void ok;x.wait(Math.max(0,rel+pause-x.t));
  const g=x.both();x.wait(1000);const u=x.first(s=>s.out_LV_C1,g.p1);
  if(pause===1500)c(u===undefined,'BOTH 1.5 s after the boot release: rejected [BOOT-002]');else c(u!==undefined,'BOTH 2.5 s after the boot release: accepted [BOOT-002]');}
},{source:'BOOT-002'});
def('B-03','E7','restart from Run / transition: Restart -> only Safe, Run not restored',(P,c)=>{
 {const x=P.run();x.step({in_ES_NC_1:false},300);x.step({in_ES_NC_1:true});c(drainEnergy(x),'Run: energy removed');x.wait(500);restartOnlySafe(x,c,'from Run');x.wait(3000);c(x.is('SAFE'),'Run not restored');}
 {const x=P.rnd();x.both({release:false,hold:1000});x.step({in_Reset_PB:true,in_Relase_Door_PB:true},100);x.step({in_Reset_PB:false,in_Relase_Door_PB:false});
  x.step({in_ES_NC_1:false},300);x.step({in_ES_NC_1:true});c(drainEnergy(x),'StartingRun: energy removed');x.wait(500);restartOnlySafe(x,c,'from StartingRun');}
},{source:'BOOT-001'});
export const G=['G-01','G-02','G-03','G-04','G-05','G-06','G-07'];
export const B=['B-01','B-02','B-03'];
void cmdName;void boot;
