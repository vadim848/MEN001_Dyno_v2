// Catalog section N - C3/BMS battery relays switch ON only on a NEW command (Q-C3-1 = Б, Vadim 2026-10-29; Niv gap #1).
// Oracle: SCENARIO_DECISIONS.md NIV-GAPS / Q-C3-1, criteria program/analyst/Q-C3-1_CRITERIA.md (CR-1..CR-8), Q-ARCH-01.
// Target: env CATALOG_SAL_DIR (default canonical). Full program, real inputs only, standard start Emergency->Restart->Safe.
// Command model (PLC MAIN.TcPOU, BatRelay_CMD / BatBMS_Cmd, unchanged by Q-C3-1): "cmd ON" = Set TRUE, Reset FALSE;
// "cmd OFF" = Set FALSE, Reset TRUE (complementary pair). Only C3-19 (optional) drives the non-PLC combination Set=Reset=TRUE.
// Test assumptions: plant feedback model A2 (FBK follows command after 20 ms); in C3-14 the C1 feedback delay is set to 400 ms
// (< 500 ms watchdog) so that R&D->Safe lasts long enough for a 200 ms OFF/ON toggle inside it (plant parameter, not a SAL signal).
// "R&D status" = first scan with the single main state R&D; "rise accepted" (Safe->R&D) = first scan with C1 ON.
import {def,pre,stIs,emg,boot,toRun} from '../../helpers/catalog-program.js';
import {drainEnergy} from './e.js';
const TOL=50, HOLD_OFF=3000;
const CH={C3:['in_C3_Manual_Set','in_C3_Manual_Reset','out_C3_BatRelay'],BMS:['in_RBM_Manual_Set','in_RBM_Manual_Reset','out_RBM_Bat']};
const BOTHCH=['C3','BMS'];
const cmd=(on,chs=BOTHCH)=>Object.assign({},...chs.map(k=>({[CH[k][0]]:on,[CH[k][1]]:!on})));
const out=k=>CH[k][2];
const anyOn=s=>s.out_C3_BatRelay||s.out_RBM_Bat;
const rel=(v,a)=>v===undefined?'none':'+'+(v-a);
// ON within TOL after the edge given at e (first scan with the new input = e+1) and still ON at the end of the check window.
function onWithin(x,c,k,e,label){const t=x.first(s=>s[out(k)],e-1);c(t!==undefined&&t<=e+TOL,`${label}: ${k} ON <=${TOL} ms after the new command; got ${rel(t,e)} [Q-C3-1, CR-1]`);return t;}
function offWithin(x,c,k,e,label){const t=x.first(s=>!s[out(k)],e-1);c(t!==undefined&&t<=e+TOL,`${label}: ${k} OFF <=${TOL} ms; got ${rel(t,e)}`);
 if(t!==undefined)c(!x.never(s=>s[out(k)],t),`${label}: ${k} stays OFF afterwards`);return t;}
function neverOn(x,c,from,chs,label){for(const k of chs){const b=x.never(s=>s[out(k)],from);c(!b,`${label}: ${k} stays OFF (held command does not switch ON) [Q-C3-1, CR-2]; first ON t=${b?.t} status=${b?.st}`);}}
// R&D with C3+BMS ON by a new command given in R&D (cmd OFF 50 ms, then cmd ON), command held ON.
function rndOn(P){const x=P.rnd();x.step(cmd(false),50);const e=x.t;x.step(cmd(true),100);
 pre(BOTHCH.every(k=>x.log.at(-1)[out(k)]),`precondition: C3/BMS ON after a new command in R&D (e=${e})`);return x;}
function runOn(P){const x=rndOn(P);toRun(x);pre(BOTHCH.every(k=>x.log.at(-1)[out(k)]),'precondition: C3/BMS ON in Run');return x;}
// BOTH from Safe -> R&D; returns {s, tR}.
function upToRnd(x,label='R&D after BOTH from Safe'){const s=x.t;x.both();x.until(s2=>stIs(s2,'RND'),3000,label);return {s,tR:x.first(s2=>stIs(s2,'RND'),s)};}
// Emergency by in_Estop_PLC (pulse 300 ms), emergency chain drained, green Restart -> steady Safe. Commands unchanged (held).
function emgToSafe(x){x.step({in_Estop_PLC:true},300);x.step({in_Estop_PLC:false});pre(emg(x.log.at(-1)),'Emergency by in_Estop_PLC');
 pre(drainEnergy(x),'emergency chain drained');x.wait(500);x.restart();x.until(s=>stIs(s,'SAFE'),2000,'Safe after Restart');x.wait(2100);pre(x.is('SAFE'),'steady Safe');return x;}
// End of C3-02: R&D reached with cmd held ON from before Emergency.
function c302(P,{bmsOffInSafe=false,allOffInSafe=false}={}){const x=rndOn(P);const ev=x.t;emgToSafe(x);
 if(allOffInSafe)x.step(cmd(false),100);else if(bmsOffInSafe)x.step(cmd(false,['BMS']),100);
 const r=upToRnd(x);return {x,ev,...r};}
// BOTH profile scan by scan (green first, blue after 100 ms, both held 1050 ms, release) with scheduled extra inputs {absT: inputs}.
function bothPlay(x,ms,sched={}){const s=x.t;while(x.t<s+ms){const d=x.t-s;const btn=d<100?{in_Reset_PB:true,in_Relase_Door_PB:false}:d<1150?{in_Reset_PB:true,in_Relase_Door_PB:true}:{in_Reset_PB:false,in_Relase_Door_PB:false};
 x.step({...btn,...(sched[x.t]??{})});}return s;}

def('C3-01','Q-C3-1','R&D, C3+BMS ON: EStop (PLC / NC1) -> Emergency; C3/BMS OFF <=50 ms; LV discharge at once; C1 OFF after 2 s',(P,c)=>{
 for(const [k,ev0,ok] of [['in_Estop_PLC',{in_Estop_PLC:true},{in_Estop_PLC:false}],['ES_NC_1 FALSE',{in_ES_NC_1:false},{in_ES_NC_1:true}]]){
  const x=rndOn(P);const ev=x.t;x.step(ev0,300);x.step(ok,2500);
  const e=x.first(emg,ev-1);c(e!==undefined&&e<=ev+TOL,`${k}: Emergency <=${TOL} ms; got ${rel(e,ev)} [Q-ARCH-01]`);
  for(const ch of BOTHCH)offWithin(x,c,ch,ev,`${k}, cmd held ON`);
  const lvd=x.first(s=>s.out_LV_Discharge_Request,ev-1);c(lvd!==undefined&&lvd<=ev+TOL,`${k}: LV discharge at once; got ${rel(lvd,ev)} [Q-ARCH-01]`);
  const c1=x.fall('out_LV_C1',ev);c(c1!==undefined&&Math.abs(c1-(ev+2000))<=TOL,`${k}: C1 OFF at ev${rel(c1,ev)}, expected 2000+-${TOL} [Q-ARCH-01]`);}
},{source:'Niv #1 item 1, Q-ARCH-01, CR-4'});

def('C3-02','Q-C3-1','after Emergency, cmd C3/BMS held ON: Restart -> Safe -> BOTH -> R&D: C3/BMS stay OFF >=3 s (no ON at R&D confirm)',(P,c)=>{
 const {x,ev,tR}=c302(P);x.wait(Math.max(0,tR+HOLD_OFF-x.t));
 neverOn(x,c,ev+TOL,BOTHCH,'held from before Emergency, through Safe and R&D +3 s');
},{source:'Niv #1 item 2, Q-C3-1, CR-2'});

def('C3-03','Q-C3-1','R&D, C3+BMS ON: green 0.6 s -> R&D->Safe (cmd held): OFF <=50 ms after down accepted; OFF in Safe; OFF >=3 s after R&D',(P,c)=>{
 const x=rndOn(P);const g=x.green(600);const a=g.p+500;x.until(s=>stIs(s,'SAFE')&&!s.out_LV_C1&&!s.c1f,3000,'Safe after green in R&D');
 for(const ch of BOTHCH){const t=x.first(s=>!s[out(ch)],g.p);c(t!==undefined&&t<=a+TOL,`${ch}: OFF <=${TOL} ms after down accepted (a=p+500); got a${rel(t,a)} [CR-5]`);}
 x.wait(2100);const {tR}=upToRnd(x);x.wait(Math.max(0,tR+HOLD_OFF-x.t));
 neverOn(x,c,a+TOL,BOTHCH,'held through R&D->Safe, Safe, Safe->R&D and R&D +3 s');
},{source:'Niv #1 item 3, Q-C3-1, CR-2, CR-5'});

def('C3-04','Q-C3-1','end of C3-02 (R&D, held, OFF): cmd OFF 200 ms then cmd ON -> ON <=50 ms after the new edge',(P,c)=>{
 const {x,ev}=c302(P);x.wait(500);x.step(cmd(false),200);const e=x.t;
 neverOn(x,c,ev+TOL,BOTHCH,'before the new edge');x.step(cmd(true),300);
 for(const ch of BOTHCH){onWithin(x,c,ch,e,'new command in R&D');c(x.log.at(-1)[out(ch)],`${ch} still ON 300 ms after the edge`);}
},{source:'Niv #1 item 4, Q-C3-1, CR-1'});

def('C3-05','Q-C3-1','R&D, C3+BMS ON: BOTH -> Run, 2 s, green -> Run->R&D -> R&D: C3/BMS ON continuously',(P,c)=>{
 const x=rndOn(P);const s=x.t;toRun(x);x.wait(2000);x.green(550);x.until(s2=>stIs(s2,'RND')&&!s2.out_HV_C2&&!s2.c2f,25000,'R&D after green in Run');x.wait(500);
 for(const ch of BOTHCH){const b=x.never(s2=>!s2[out(ch)],s);c(!b,`${ch}: ON continuously through R&D->Run->R&D, no OFF scan [CR-3]; first OFF t=${b?.t} status=${b?.st} stg=${b?.stg}`);}
},{source:'Niv #1 item 4 (unchanged), CR-3'});

function c306(P){const x=P.safe();x.step(cmd(false),100);const e=x.t;x.step(cmd(true),HOLD_OFF);return {x,e};}
def('C3-06','Q-C3-1','Safe, cmd OFF: cmd ON in Safe held 3 s -> C3/BMS OFF',(P,c)=>{
 const {x,e}=c306(P);c(x.is('SAFE'),'still Safe');neverOn(x,c,e,BOTHCH,'cmd ON in Safe [CR-6]');
},{source:'Niv #1 item 5 (unchanged), CR-6'});

def('C3-07','Q-C3-1','cmd ON given in Safe, held: BOTH -> R&D: OFF >=3 s; then cmd OFF 200 ms -> ON: ON <=50 ms',(P,c)=>{
 const {x,e:e0}=c306(P);const {tR}=upToRnd(x);x.wait(Math.max(0,tR+HOLD_OFF-x.t));
 neverOn(x,c,e0,BOTHCH,'edge given in Safe, held into R&D +3 s');
 x.step(cmd(false),200);const e=x.t;x.step(cmd(true),300);for(const ch of BOTHCH)onWithin(x,c,ch,e,'new command in R&D');
},{source:'Q-C3-1 «данной в R&D/Run», CR-2'});

def('C3-08','Q-C3-1','Run (stable), cmd OFF, C3/BMS OFF: cmd ON -> ON <=50 ms',(P,c)=>{
 const x=P.run();x.step(cmd(false),200);pre(!anyOn(x.log.at(-1)),'precondition: C3/BMS OFF in Run');const e=x.t;x.step(cmd(true),300);
 for(const ch of BOTHCH)onWithin(x,c,ch,e,'new command in Run');
},{source:'Q-C3-1 «в R&D/Run», CR-1'});

def('C3-09','Q-C3-1','end of C3-02: BOTH -> StartingRun -> Run with cmd held: OFF throughout and >=3 s in Run; new edge in Run -> ON <=50 ms',(P,c)=>{
 const {x,ev}=c302(P);x.wait(2100);const s=x.t;x.both();x.until(s2=>stIs(s2,'RUN'),4000,'Run after BOTH from R&D');const tRun=x.first(s2=>stIs(s2,'RUN'),s);
 x.wait(Math.max(0,tRun+HOLD_OFF-x.t));neverOn(x,c,ev+TOL,BOTHCH,'held through R&D, StartingRun and Run +3 s');
 x.step(cmd(false),200);const e=x.t;x.step(cmd(true),300);for(const ch of BOTHCH)onWithin(x,c,ch,e,'new command in Run');
},{source:'Q-C3-1, CR-2'});

def('C3-10','Q-C3-1','Safe->R&D: cmd ON (a) 100 ms after rise accepted, (b) R&D status -50 ms, held -> OFF >=3 s after R&D status',(P,c)=>{
 const base=P.safe();base.step(cmd(false),100);
 const probe=base.fork();const s0=bothPlay(probe,3000);const u1=probe.first(s=>s.out_LV_C1,s0),tR=probe.first(s=>stIs(s,'RND'),s0);
 pre(u1!==undefined&&tR!==undefined&&tR-50>u1+100,`probe: rise accepted (C1 ON) and R&D status found (u1=${u1-s0}, tR=${tR===undefined?'none':tR-s0})`);
 for(const [k,te] of [['(a) rise accepted +100 ms',u1+100],['(b) R&D status -50 ms',tR-50]]){
  const x=base.fork();bothPlay(x,3000,{[te]:cmd(true)});const tRx=x.first(s=>stIs(s,'RND'),s0);
  pre(tRx===tR,`${k}: same R&D status moment as the probe (${tRx} vs ${tR})`);
  const atEdge=x.log.find(s=>s.t===te+1);c(atEdge&&!stIs(atEdge,'RND'),`${k}: edge scan is not in R&D (status ${atEdge?.st})`);
  x.wait(Math.max(0,tR+HOLD_OFF-x.t));neverOn(x,c,te,BOTHCH,`${k}, edge not in R&D`);}
},{source:'Q-C3-1 «данной в R&D/Run», CR-2'});

def('C3-11','Q-C3-1','Safe->R&D: cmd ON at R&D status +50 ms -> ON <=50 ms after the edge',(P,c)=>{
 const x=P.safe();x.step(cmd(false),100);const {tR}=upToRnd(x);pre(x.t<=tR+50,`R&D status observed early enough (t=${x.t}, tR=${tR})`);
 x.wait(tR+50-x.t);const e=x.t;x.step(cmd(true),300);for(const ch of BOTHCH)onWithin(x,c,ch,e,'edge at R&D +50 ms');
},{source:'Q-C3-1, CR-1 (boundary pair with C3-10b)'});

def('C3-12','Q-C3-1','R&D: C3 cmd ON only; +1 s BMS ON; +1 s C3 OFF -> channels independent',(P,c)=>{
 const x=P.rnd();x.step(cmd(false),100);const e1=x.t;x.step(cmd(true,['C3']),1000);
 onWithin(x,c,'C3',e1,'C3 only');c(!x.never(s=>s.out_RBM_Bat,e1),'BMS stays OFF while only C3 is commanded [CR-8]');
 const e2=x.t;x.step(cmd(true,['BMS']),1000);onWithin(x,c,'BMS',e2,'BMS after C3');c(!x.never(s=>!s.out_C3_BatRelay,e2),'C3 stays ON when BMS is switched ON [CR-8]');
 const e3=x.t;x.step(cmd(false,['C3']),1000);offWithin(x,c,'C3',e3,'C3 cmd OFF [CR-7]');c(!x.never(s=>!s.out_RBM_Bat,e3),'BMS stays ON when C3 is switched OFF [CR-8]');
},{source:'CR-7, CR-8'});

def('C3-13','Q-C3-1','after Emergency: C3 held ON, BMS cmd OFF in Safe; BOTH -> R&D; BMS ON at R&D +1 s -> BMS ON, C3 stays OFF',(P,c)=>{
 const {x,ev,tR}=c302(P,{bmsOffInSafe:true});x.wait(Math.max(0,tR+1000-x.t));const e=x.t;x.step(cmd(true,['BMS']),300);
 onWithin(x,c,'BMS',e,'BMS new command at R&D +1 s');x.wait(Math.max(0,tR+HOLD_OFF-x.t));neverOn(x,c,ev+TOL,['C3'],'C3 held from before Emergency (BMS edge does not affect C3) [CR-8]');
},{source:'CR-2, CR-8'});

def('C3-14','Q-C3-1','R&D, ON: green 0.6 s; inside R&D->Safe cmd OFF 200 ms -> ON; Safe; BOTH -> R&D (held) -> OFF throughout',(P,c)=>{
 const x=rndOn(P);x.plant.c1=400;// test assumption: C1_FBK drops 400 ms after the C1 OFF command (< 500 ms watchdog)
 const g=x.green(600);const a=g.p+500;x.step(cmd(false),200);const e=x.t;x.step(cmd(true));
 pre(!stIs(x.log.at(-1),'SAFE')&&!x.never(s=>stIs(s,'SAFE'),a),`edge given inside R&D->Safe (not yet Safe) at a+${e-a}; status=${x.status()}`);
 x.until(s=>stIs(s,'SAFE')&&!s.c1f,3000,'Safe after R&D->Safe');c(!x.never(emg,g.p),'no Emergency (FBK within the 500 ms watchdog)');
 x.plant.c1=20;x.wait(2100);const {tR}=upToRnd(x);x.wait(Math.max(0,tR+HOLD_OFF-x.t));
 for(const ch of BOTHCH){const t=x.first(s=>!s[out(ch)],g.p);c(t!==undefined&&t<=a+TOL,`${ch}: OFF <=${TOL} ms after down accepted; got a${rel(t,a)} [CR-5]`);}
 neverOn(x,c,a+TOL,BOTHCH,'edge inside R&D->Safe (reset-dominant), then Safe and R&D +3 s [CR-5, CR-2]');
},{source:'CR-5 (reset-dominant, recRndC_SG), CR-2'});

def('C3-15','Q-C3-1','Run, ON: ES_NC_1 FALSE; in the emergency chain cmd OFF 200 ms -> ON; Restart -> Safe -> R&D (held) -> OFF throughout',(P,c)=>{
 const x=runOn(P);const ev=x.t;x.step({in_ES_NC_1:false},500);
 const e=x.first(emg,ev-1);c(e!==undefined&&e<=ev+TOL,`Emergency <=${TOL} ms; got ${rel(e,ev)} [EMG-001]`);
 for(const ch of BOTHCH){const t=x.first(s=>!s[out(ch)],ev-1);c(t!==undefined&&t<=ev+TOL,`${ch}: OFF <=${TOL} ms after EStop; got ${rel(t,ev)} [Q-ARCH-01, CR-4]`);}
 x.step(cmd(false),200);x.step(cmd(true),100);pre(emg(x.log.at(-1)),'edge given inside Emergency');x.step({in_ES_NC_1:true},100);
 pre(drainEnergy(x),'emergency chain drained');x.wait(500);x.restart();x.until(s=>stIs(s,'SAFE'),2000,'Safe after Restart');x.wait(2100);
 const {tR}=upToRnd(x);x.wait(Math.max(0,tR+HOLD_OFF-x.t));neverOn(x,c,ev+TOL,BOTHCH,'edge inside Emergency, then Safe and R&D +3 s [CR-4, CR-2]');
},{source:'Q-ARCH-01 (CR-4), CR-2'});

def('C3-16','Q-C3-1','R&D / Run, C3+BMS ON: cmd OFF -> OFF <=50 ms',(P,c)=>{
 for(const [k,mk] of [['R&D',rndOn],['Run',runOn]]){const x=mk(P);const e=x.t;x.step(cmd(false),300);for(const ch of BOTHCH)offWithin(x,c,ch,e,`${k} cmd OFF [CR-7]`);}
},{source:'reference FBAnd12/FBAnd3 (unchanged manual off), CR-7'});

def('C3-17','Q-C3-1','group start with cmd ON from scan 0: Emergency -> Restart -> Safe -> BOTH -> R&D -> OFF >=3 s',(P,c)=>{
 const x=P.create();x.set(cmd(true));boot(x);const {tR}=upToRnd(x);x.wait(Math.max(0,tR+HOLD_OFF-x.t));
 neverOn(x,c,0,BOTHCH,'cmd ON since group start');
},{source:'Q-C3-1, CR-2 (catalog rule 2)'});

def('C3-18','Q-C3-1','after Emergency, cmd OFF in Safe before the rise; BOTH -> R&D; cmd ON at R&D +1 s -> OFF until the edge, ON <=50 ms after',(P,c)=>{
 const {x,ev,tR}=c302(P,{allOffInSafe:true});x.wait(Math.max(0,tR+1000-x.t));const e=x.t;
 neverOn(x,c,ev+TOL,BOTHCH,'before the edge');x.step(cmd(true),300);for(const ch of BOTHCH)onWithin(x,c,ch,e,'edge at R&D +1 s');
},{source:'Q-C3-1, CR-1'});

def('C3-19','Q-C3-1','OPTIONAL (non-PLC combination): R&D, OFF; Set=TRUE while Reset=TRUE 200 ms, then Reset falls with Set held -> OFF >=3 s',(P,c)=>{
 const x=P.rnd();x.step(cmd(false),100);const s=x.t;
 x.step(Object.assign({},...BOTHCH.map(k=>({[CH[k][0]]:true,[CH[k][1]]:true}))),200);
 x.step(Object.assign({},...BOTHCH.map(k=>({[CH[k][1]]:false}))),HOLD_OFF);
 neverOn(x,c,s,BOTHCH,'Set rose while Reset active; Reset fell with Set held (no ON at the Reset-fall scan) [Q-C3-1 literal, optional]');
},{source:'Q-C3-1 literal; optional (PLC never produces Set=Reset=TRUE)'});

export const N=['C3-01','C3-02','C3-03','C3-04','C3-05','C3-06','C3-07','C3-08','C3-09','C3-10','C3-11','C3-12','C3-13','C3-14','C3-15','C3-16','C3-17','C3-18','C3-19'];
