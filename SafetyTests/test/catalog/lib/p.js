// Catalog section P - PLC commands (E4, v1.4 §8). Command inputs are resolved by name (A7); absent = NOT IMPLEMENTED (FAIL).
import {def,stIs,emg,toSafeToRnd,toStartingRun,pre} from '../../helpers/catalog-program.js';
import {cmdName,edge} from './w.js';
import {downTrace,checkOrder} from './d.js';
const TOL=50;
const upRnd=(x,from)=>x.first(s=>s.out_HV_C2||!s.STO,from);

def('P-01','E4','Safe: edge CMD_SAFE_TO_R&D -> as BOTH (cover may be open)',(P,c)=>{
 for(const cov of ['closed','open']){const x=P.safe();if(cov==='open')x.step({in_InterLock_NC_1:false,in_InterLock_NC_2:false},100);
  const t=edge(x,'SAFE_TO_RND');x.wait(3000);c(x.first(s=>s.out_LV_C1,t)!==undefined&&x.is('RND'),`cover ${cov}: Safe->R&D executed [v1.4 §8, V14-Q7]; status=${x.status()}`);}
},{source:'v1.4 §8, V14-Q7'});
def('P-02','E4','R&D, cover open: edge CMD_R&D_TO_RUN -> not executed',(P,c)=>{
 const x=P.rnd();x.step({in_InterLock_NC_1:false,in_InterLock_NC_2:false},100);const t=edge(x,'RND_TO_RUN');x.wait(3000);
 c(upRnd(x,t)===undefined&&x.is('RND'),'no R&D->Run with open cover [V14-Q5]');
},{source:'V14-Q5'});
def('P-03','E4','Run: edge CMD_RUN_TO_R&D -> as green (D-01)',(P,c)=>{
 const x=P.run();const a=edge(x,'RUN_TO_RND');x.wait(20000);const t=downTrace(x,a);
 c(t.STO!==undefined&&Math.abs(t.STO-(a+2000))<=TOL,`STO at a+2000+-${TOL}; got ${t.STO===undefined?'none':'a+'+(t.STO-a)} [V14-Q3]`);
 c(t.DIS!==undefined&&Math.abs(t.DIS-(a+7000))<=TOL,`Discharge at a+7000+-${TOL}; got ${t.DIS===undefined?'none':'a+'+(t.DIS-a)}`);checkOrder(c,t,a,'PLC Run->R&D');
},{source:'v1.4 §8, V14-Q3'});
def('P-04','E4','StartingRun: edge CMD_RUN_TO_R&D -> abort (as D-03)',(P,c)=>{
 const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(100);const a=edge(x,'RUN_TO_RND');x.wait(10000);const t=downTrace(x,a);
 c(t.STO!==undefined&&t.STO<=a+TOL,`STO at once; got ${t.STO===undefined?'none':'a+'+(t.STO-a)} [V14-Q12]`);c(t.DIS!==undefined&&t.DIS<=a+TOL,'Discharge at once [V14-Q12]');
 c(x.is('RND')&&!x.never(s=>stIs(s,'RUN'),a),`abort to R&D, no Run; status=${x.status()}`);
 // Q-E4-2 A (REC-ACCEPTED, architect): abort edge executed with another command TRUE; ignored while the PLC error is active.
 {const y=P.rnd();const o=cmdName(y,'RND_TO_SAFE');toStartingRun(y,{holdHvFaulty:true});y.step({[o]:true},100);const a2=edge(y,'RUN_TO_RND');y.wait(500);
  c(y.first(s=>s.STO,a2-1)!==undefined,'abort edge with CMD_R&D_TO_SAFE also TRUE: abort executed [Q-E4-2 A]');y.step({[o]:false});}
 {const y=P.rnd();const a=cmdName(y,'RND_TO_RUN'),b=cmdName(y,'RND_TO_SAFE');y.step({[a]:true,[b]:true},200);y.step({[a]:false},100);
  c(y.plcFaultName&&y.r.get(y.plcFaultName),'precondition: PLC error active (CMD_R&D_TO_SAFE kept TRUE)');y.wait(2100);toStartingRun(y,{holdHvFaulty:true});y.wait(100);
  const a3=edge(y,'RUN_TO_RND');y.wait(1000);c(y.first(s=>s.STO,a3-1)===undefined,'abort edge while PLC error active: ignored [Q-E4-2 A, V14-Q8/Q10]');}
},{source:'V14-Q12, Q-E4-2 A'});
def('P-05','E4','Safe->R&D: edge CMD_R&D_TO_SAFE -> abort to Safe',(P,c)=>{
 const x=P.safe();toSafeToRnd(x,{holdLvFaulty:true});x.wait(100);const t=edge(x,'RND_TO_SAFE');x.wait(1500);
 c(x.fall('out_LV_C1',t)!==undefined&&x.is('SAFE')&&!x.r.get('in_LV_C1_FBK'),`abort to Safe (C1 OFF, C1_FBK OFF) [V14-Q13]; status=${x.status()}`);
 // gap: in steady R&D CMD_R&D_TO_SAFE is the normal R&D->Safe step down (V14-Q11, D-LV-OFF-COMPLETE), not the Step12 abort.
 {const y=P.rnd();y.plant.c1=300;const t2=edge(y,'RND_TO_SAFE');y.wait(2000);const off=y.fall('out_LV_C1',t2-1),fb=y.fall('c1f',t2-1),sf=y.first(s=>stIs(s,'SAFE'),t2-1);
  c(off!==undefined&&off<=t2+TOL,`steady R&D: C1 OFF at edge+${off===undefined?'none':off-t2} [V14-Q11]`);
  c(fb!==undefined&&sf!==undefined&&sf>=fb&&sf<=fb+TOL,`steady R&D: Safe after C1_FBK OFF (FBK ${fb===undefined?'none':'+'+(fb-t2)}, Safe ${sf===undefined?'none':'+'+(sf-t2)}) [D-LV-OFF-COMPLETE]`);
  c(!y.never(s=>!stIs(s,'RND')&&!stIs(s,'SAFE'),t2),'steady R&D: only R&D then Safe');}
 // S4 review: CMD_R&D_TO_SAFE edge in StartingRun is ignored (Q-RC-08 item 2), abort only in Safe->R&D.
 {const y=P.rnd();toStartingRun(y,{holdHvFaulty:true});y.wait(100);const t=edge(y,'RND_TO_SAFE');y.wait(1000);
  c(!y.never(s=>s.STO||!s.out_HV_C2||!s.out_LV_C1,t),'StartingRun: CMD_R&D_TO_SAFE ignored (C1, C2 ON, STO released) [Q-RC-08 2]');}
},{source:'V14-Q13, V14-Q11, Q-RC-08'});
def('P-06','E4','Safe->R&D: CMD_R&D_TO_RUN held until R&D -> not executed (new edge needed)',(P,c)=>{
 const x=P.safe();const n=cmdName(x,'RND_TO_RUN');const {u1}=toSafeToRnd(x);x.step({[n]:true},3000);
 c(x.first(s=>stIs(s,'RND'),u1)!==undefined,'R&D reached');c(upRnd(x,u1)===undefined,'held command is not executed on arrival [V14-Q11]');x.step({[n]:false});
 // gap: R&D->Run edge only in steady R&D (V14-Q11, Q-RC-08 3) - edge during Safe->R&D / R&D->Safe is ignored and not deferred.
 {const y=P.safe();toSafeToRnd(y,{holdLvFaulty:true});y.wait(100);const t=edge(y,'RND_TO_RUN');y.step({in_LV_Faulty_FBK:false},3000);
  c(y.is('RND')&&upRnd(y,t)===undefined,`edge during Safe->R&D: not executed, not deferred [V14-Q11]; status=${y.status()}`);}
 {const y=P.rnd();y.plant.c1=400;const g=y.green(550);y.wait(Math.max(0,g.p+600-y.t));const t=edge(y,'RND_TO_RUN');y.wait(2000);
  c(upRnd(y,t)===undefined&&y.is('SAFE'),`edge during R&D->Safe: ignored, ends Safe [Q-RC-08 3]; status=${y.status()}`);}
 // S4 review: a command raised earlier and held (no new edge in the source state) is never executed [V14-Q11].
 {const y=P.rnd();const n=cmdName(y,'SAFE_TO_RND');y.step({[n]:true},100);y.green(550);y.wait(3000);c(y.is('SAFE'),'CMD_SAFE_TO_R&D held from R&D: Safe reached');const t=y.t;y.step({[n]:true},2000);
  c(y.first(s=>s.out_LV_C1,t)===undefined,'held CMD_SAFE_TO_R&D not executed in Safe [V14-Q11]');y.step({[n]:false});}
 {const y=P.safe();const n=cmdName(y,'RND_TO_SAFE');y.step({[n]:true},100);y.both();y.wait(3000);const t=y.t;y.step({[n]:true},2000);
  c(y.is('RND')&&y.r.get('out_LV_C1'),`held CMD_R&D_TO_SAFE: neither Safe->R&D abort nor R&D->Safe [V14-Q11]; status=${y.status()}`);void t;y.step({[n]:false});}
 {const y=P.rnd();const n=cmdName(y,'RUN_TO_RND');y.step({[n]:true},100);y.both();y.wait(3000);y.step({[n]:true},2000);
  c(y.is('RUN')&&y.r.get('STO_DR1'),`held CMD_RUN_TO_R&D: no StartingRun abort, no Run->R&D [V14-Q11]; status=${y.status()}`);y.step({[n]:false});}
},{source:'V14-Q11, Q-RC-08'});
def('P-07','E4','R&D: two commands TRUE (incl. different edges) -> error, none executed; cleared after all FALSE 1 s',(P,c)=>{
 {const y=P.rnd();const a=cmdName(y,'RND_TO_RUN'),b=cmdName(y,'RND_TO_SAFE');const t=y.t;y.step({[a]:true,[b]:true},500);y.step({[a]:false,[b]:false},1500);
  c(upRnd(y,t)===undefined&&y.is('RND'),'same-scan RND_TO_RUN + RND_TO_SAFE: none executed, stays R&D [V14-Q8]');}
 {const y=P.safe();const s2r=cmdName(y,'SAFE_TO_RND'),r2r=cmdName(y,'RND_TO_RUN');y.step({[s2r]:true},3000);c(y.is('RND'),'CMD_SAFE_TO_R&D (held) reached R&D');
  const t=y.t;y.step({[s2r]:true,[r2r]:true},500);c(upRnd(y,t)===undefined,'held SAFE_TO_R&D + new RND_TO_RUN edge: error, R&D->Run not executed [Q-RC-04]');
  c(y.plcFaultName&&y.r.get(y.plcFaultName),'PLC error (Fault) reported [V14-Q8, Q-RC-13]');y.step({[s2r]:false,[r2r]:false},950);
  c(y.plcFaultName&&y.r.get(y.plcFaultName),'PLC error still active 950 ms after all FALSE [V14-Q10]');y.wait(150);
  c(y.plcFaultName&&!y.r.get(y.plcFaultName),'PLC error cleared after all FALSE 1 s [V14-Q10]');}
 // S4 review: Bypass counts as a command (Q-RC-18a): the error stays while Bypass is TRUE, clears 1 s after it is FALSE too.
 {const y=P.rnd();const a=cmdName(y,'RND_TO_RUN'),b=cmdName(y,'RND_TO_SAFE');y.step({[a]:true,[b]:true,inPLC_BypassC1C2:true},200);y.step({[a]:false,[b]:false},1500);
  c(y.plcFaultName&&y.r.get(y.plcFaultName),'error stays while Bypass is still TRUE [Q-RC-18a, V14-Q10]');y.step({inPLC_BypassC1C2:false},1100);
  c(y.plcFaultName&&!y.r.get(y.plcFaultName),'error cleared 1 s after Bypass FALSE too [V14-Q10]');}
},{source:'V14-Q8, V14-Q10, Q-RC-04, Q-RC-18a'});
def('P-08','E4','any state with PLC error: CMD_TRIGGER_EMERGENCY -> Emergency',(P,c)=>{
 const x=P.rnd();const a=cmdName(x,'RND_TO_RUN'),b=cmdName(x,'RND_TO_SAFE'),e=cmdName(x,'TRIGGER_EMG');x.step({[a]:true,[b]:true},200);
 const ev=x.t;x.step({[e]:true},200);const t=x.first(emg,ev-1);c(t!==undefined&&t<=ev+TOL,'Emergency despite PLC error [V14-Q9]');
},{source:'V14-Q9'});
def('P-09','E4','R&D, green pressed 200 ms: command edge -> ignored and not deferred',(P,c)=>{
 const x=P.rnd();const n=cmdName(x,'RND_TO_RUN');x.step({in_Reset_PB:true},100);const t=x.t;x.step({in_Reset_PB:true,[n]:true},100);x.step({in_Reset_PB:false,[n]:true},2000);x.step({[n]:false},500);
  c(upRnd(x,t)===undefined&&x.is('RND'),'edge during a pressed button is ignored and not executed after release [V14-Q14]');
 const during=(y,btn,kind,ms=2000)=>{const n=cmdName(y,kind);y.step({[btn]:true},50);const t=y.t;y.step({[btn]:true,[n]:true},100);y.step({[btn]:false,[n]:true},ms);y.step({[n]:false});return t;};
 {const y=P.safe();const t=during(y,'in_Relase_Door_PB','SAFE_TO_RND');c(y.first(s=>s.out_LV_C1,t)===undefined,'Safe, blue pressed: CMD_SAFE_TO_R&D ignored [V14-Q14]');}
 {const y=P.rnd();const t=during(y,'in_Relase_Door_PB','RND_TO_SAFE');c(!y.never(s=>!stIs(s,'RND')||!s.out_LV_C1,t),'R&D, blue pressed: CMD_R&D_TO_SAFE ignored [V14-Q14]');}
 {const y=P.rnd();const t=during(y,'in_Relase_Door_PB','RND_TO_RUN');c(upRnd(y,t)===undefined,'R&D, blue pressed: CMD_R&D_TO_RUN ignored [V14-Q14]');}
 {const y=P.run();const t=during(y,'in_Reset_PB','RUN_TO_RND');c(!y.never(s=>!stIs(s,'RUN')||s.STO,t),'Run, green pressed: CMD_RUN_TO_R&D ignored [V14-Q14]');}
 {const y=P.rnd();toStartingRun(y,{holdHvFaulty:true});y.wait(100);const t=during(y,'in_Reset_PB','RUN_TO_RND',1000);c(!y.never(s=>s.STO,t),'StartingRun, green pressed: abort edge ignored [V14-Q14, Q-E4-2 A]');}
 {const y=P.safe();toSafeToRnd(y,{holdLvFaulty:true});y.wait(100);const t=during(y,'in_Reset_PB','RND_TO_SAFE',1000);c(!y.never(s=>!s.out_LV_C1,t),'Safe->R&D, green pressed: abort edge ignored [V14-Q14, Q-E4-2 A]');}
},{source:'V14-Q14, Q-E4-2 A'});
def('P-10','E4','PLC error active: BOTH by buttons -> executed',(P,c)=>{
 const x=P.rnd();const a=cmdName(x,'RND_TO_RUN'),b=cmdName(x,'RND_TO_SAFE');x.step({[a]:true,[b]:true},200);x.step({[a]:false,[b]:false},100);
 c(x.plcFaultName&&x.r.get(x.plcFaultName),'precondition: PLC error active');x.wait(2100);const g=x.both();x.wait(1500);
 c(upRnd(x,g.p1)!==undefined,'BOTH executes despite the PLC error [Q-RC-18b]');
},{source:'Q-RC-18b'});
def('P-11','E4','any state: heartbeat stopped 3 s -> Emergency',(P,c)=>{
 for(const [k,mk] of [['Safe',()=>P.safe()],['R&D',()=>P.rnd()]]){const x=mk();pre(x.hb,'NOT IMPLEMENTED on target: heartbeat input (V14-Q20) not declared');
  x.wait(250);const ev=x.t;x.hbStopped=true;const lc=x.hbLast;x.wait(3500);const t=x.first(emg,ev);
  // Q-E4-4 A (REC-ACCEPTED): 3 s without a heartbeat level change, measured from the last level change.
  c(t!==undefined&&Math.abs(t-(lc+3000))<=TOL,`${k}: Emergency at last level change+${t===undefined?'none':t-lc}, expected 3000+-${TOL} [V14-Q20, Q-E4-4 A]`);}
},{source:'V14-Q20, Q-E4-4 A'});
def('P-12','E4','STS_COVER_LOCKED = NC1&NC2; outPLC_RnD TRUE in StartingRun/abort, FALSE in Safe->R&D',(P,c)=>{
 const x=P.safe();pre(x.coverName,'NOT IMPLEMENTED on target: STS_COVER_LOCKED not published');
 for(const [a,b] of [[true,true],[false,true],[true,false],[false,false]]){x.step({in_InterLock_NC_1:a,in_InterLock_NC_2:b},50);c(x.r.get(x.coverName)===(a&&b),`STS_COVER_LOCKED = NC1&NC2 for (${a},${b}) [V14-Q5]`);}
 {const y=P.safe();const {u1}=toSafeToRnd(y,{holdLvFaulty:true});y.wait(500);c(!y.never(s=>s.outPLC_RnD,u1),'outPLC_RnD FALSE during Safe->R&D [question 78]');}
 {const y=P.rnd();const {u}=toStartingRun(y,{holdHvFaulty:true});y.wait(500);c(!y.never(s=>!s.outPLC_RnD,u),'outPLC_RnD TRUE in StartingRun [question 78]');
  y.wait(1600);const g=y.green(550);y.wait(300);c(!y.never(s=>!s.outPLC_RnD,g.p),'outPLC_RnD TRUE during abort [question 78]');}
},{source:'V14-Q5, question 78'});
export const PP=['P-01','P-02','P-03','P-04','P-05','P-06','P-07','P-08','P-09','P-10','P-11','P-12'];
