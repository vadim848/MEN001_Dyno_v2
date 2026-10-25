// Catalog section C - cover, connector, interlock.
import {def,stIs,emg,toStartingRun,energyOff} from '../../helpers/catalog-program.js';
const TOL=50,UNL='out_Door_Unlock_Solonoeid';
const OPEN={in_InterLock_NC_1:false,in_InterLock_NC_2:false};
const upSafe=(x,from)=>x.first(s=>s.out_LV_C1,from);
const upRnd=(x,from)=>x.first(s=>s.out_HV_C2||!s.STO,from);
const emgWithin=(x,ev,c,label)=>{const e=x.first(emg,ev-1);c(e!==undefined&&e<=ev+TOL,`${label}: Emergency within ${TOL} ms of the event; got ${e===undefined?'none':'+'+(e-ev)}`);
 const back=e!==undefined&&x.never(s=>!emg(s),e);c(!back,`${label}: Emergency latched (no exit without Restart); left at t=${back?.t} ${back?.st}`);};
const energyRemoved=(x,c,label,max=30000)=>{const end=x.t+max;while(x.t<end&&!energyOff(x.log.at(-1)))x.step();
 c(energyOff(x.log.at(-1)),`${label}: all energy removed by the emergency chain (C1, C2, C3/BMS OFF, STO active, FBK OFF) within ${max} ms [assumption A10 bound]`);};

def('C-01','E2','Safe, cover open: BOTH -> Safe->R&D executes',(P,c)=>{
 const x=P.safe();x.step(OPEN,100);const g=x.both();x.wait(3000);
 c(upSafe(x,g.p1)!==undefined,'C1 ON (Safe->R&D started) with open cover [V14-Q7]');c(x.is('RND'),`R&D reached; status=${x.status()}`);
 c(!x.never(emg,g.p1),'no Emergency');
},{source:'V14-Q7'});

def('C-02','E2','R&D, cover open: BOTH -> no R&D->Run, no fault',(P,c)=>{
 const x=P.rnd();x.step(OPEN,100);const g=x.both();x.wait(3000);
 c(upRnd(x,g.p1)===undefined,'no C2 ON / STO release with open cover [V14-Q5, D-DOOR-INTERLOCK]');
 c(x.is('RND'),`stays R&D; status=${x.status()}`);c(!x.never(s=>emg(s)||s.fault===true,g.p1),'no Emergency/fault');
},{source:'V14-Q5'});

def('C-03','E2','Safe / R&D: NC1 FALSE -> not Emergency; R&D->Run forbidden',(P,c)=>{
 {const x=P.safe();const ev=x.t;x.step({in_InterLock_NC_1:false},2000);c(!x.never(s=>!stIs(s,'SAFE'),ev),'Safe: NC1 FALSE is not an emergency, stays Safe [V14-Q21a]');}
 {const x=P.rnd();const ev=x.t;x.step({in_InterLock_NC_1:false},2000);c(!x.never(s=>!stIs(s,'RND')||!s.out_LV_C1,ev),'R&D: NC1 FALSE is not an emergency, stays R&D with C1 ON [V14-Q21a]');
  const g=x.both();x.wait(2500);c(upRnd(x,g.p1)===undefined,'R&D with NC1 FALSE: BOTH does not start R&D->Run [V14-Q21a]');c(x.is('RND'),'stays R&D');}
},{source:'V14-Q21'});

def('C-04','E2','Run: NC2 FALSE -> Emergency',(P,c)=>{
 const x=P.run();const ev=x.t;x.step({in_InterLock_NC_2:false},500);x.step({in_InterLock_NC_2:true},500);
 emgWithin(x,ev,c,'Run NC2 loss [Q-RC-01]');energyRemoved(x,c,'Run NC2 loss');
},{source:'Q-RC-01'});

def('C-05','E2','StartingRun: NC1 FALSE -> Emergency',(P,c)=>{
 const x=P.rnd();const {u}=toStartingRun(x);x.wait(Math.max(0,u+200-x.t));const ev=x.t;c(!x.is('RUN'),'precondition: StartingRun (Run not yet confirmed)');
 x.step({in_InterLock_NC_1:false},500);emgWithin(x,ev,c,'StartingRun NC1 loss [Q-RC-03a]');c(!x.never(s=>stIs(s,'RUN'),ev),'Run never confirmed after the loss');
},{source:'Q-RC-03a'});

def('C-06','E3','normal Run->R&D (in SS1): NC1 FALSE -> descent continues to R&D',(P,c)=>{
 const x=P.run();const g=x.green(550);const a=g.p+500;x.wait(Math.max(0,a+1000-x.t));const ev=x.t;
 x.step({in_InterLock_NC_1:false},25000);
 c(!x.never(emg,ev),'no Emergency: normal Run->R&D continues [Q-RC-03 b1]');
 const sto=x.first(s=>s.STO,a);c(sto!==undefined&&Math.abs(sto-(a+2000))<=TOL,`STO at the normal SS1 moment a+2000+-${TOL}; got ${sto===undefined?'none':'a+'+(sto-a)}`);
 c(x.first(s=>stIs(s,'RND')&&!s.out_HV_C2&&!s.c2f,ev)!==undefined,'R&D reached');c(x.is('RND'),`after arrival R&D rules (no emergency); status=${x.status()}`);
},{source:'Q-RC-03 b1'});

def('C-07','E3','abort StartingRun / protective descent: NC1 FALSE -> Emergency',(P,c)=>{
 {const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(2100);const g=x.green(550);x.wait(300);const ev=x.t;
  c(!x.never(emg,g.p),'precondition: abort without Emergency');x.step({in_InterLock_NC_1:false},300);emgWithin(x,ev,c,'abort StartingRun + NC1 [Q-RC-17(1)]');}
 {const x=P.run();x.step({in_HV_Faulty_FBK:true},1000);const ev=x.t;c(!x.never(emg,ev-1000),'precondition: protective descent without Emergency');
  x.step({in_InterLock_NC_1:false},300);emgWithin(x,ev,c,'protective descent + NC1 [Q-RC-17(3)]');}
 {// T3 (S3 review): normal descent, LV lost in SS1 (-> protective, Q-RC-15), then NC1 lost -> Emergency [Q-RC-17(3)].
  const x=P.run();const g=x.green(550);x.wait(Math.max(0,g.p+500+1000-x.t));x.step({in_LV_Faulty_FBK:true},1000);const ev=x.t;
  c(!x.never(emg,g.p),'T3 precondition: no Emergency before NC1');x.step({in_InterLock_NC_1:false},300);emgWithin(x,ev,c,'T3: LV lost in SS1, then NC1 [Q-RC-15, Q-RC-17(3)]');}
},{source:'Q-RC-17'});

def('C-08','E2','Safe: LV connector FALSE, then BOTH -> no step up, no fault',(P,c)=>{
 const x=P.safe();const ev=x.t;x.step({in_LV_Connector_Interlock:false},200);const g=x.both();x.wait(1500);
 c(upSafe(x,ev)===undefined,'no Safe->R&D with LV connector lost [Q-RC-14, EMG-003]');
 c(!x.never(s=>!stIs(s,'SAFE')||s.fault===true,ev),'stays Safe without fault/Emergency [EMG-003]');
 x.step({in_LV_Connector_Interlock:true},3000);c(upSafe(x,ev)===undefined,'no deferred execution after the connector returns [EMG-003 new gesture]');
},{source:'Q-RC-14, EMG-003'});

def('C-09','E2','R&D / Run: HV connector FALSE -> Emergency',(P,c)=>{
 for(const [k,mk] of [['R&D',()=>P.rnd()],['Run',()=>P.run()]]){const x=mk();const ev=x.t;x.step({in_HV_Connector_Interlock:false},300);x.step({in_HV_Connector_Interlock:true},300);
  emgWithin(x,ev,c,`${k} HV connector loss [Q-RC-14]`);}
},{source:'Q-RC-14'});

def('C-10','E2','Safe: Door_Monitor FALSE, blue 0.6 s -> no Unlock',(P,c)=>{
 const x=P.safe();x.step({in_Door_Monitor:false},100);const g=x.blue(600);x.wait(500);
 c(x.never(s=>s[UNL],g.p)===undefined,'no Unlock with Door_Monitor FALSE [UNL-05, D-DOOR-INTERLOCK]');
},{source:'UNL-05, D-DOOR-INTERLOCK'});
export const C=['C-01','C-02','C-03','C-04','C-05','C-06','C-07','C-08','C-09','C-10'];
