// Catalog section U - step up and confirmation.
import {def,stIs,emg,toSafeToRnd,toStartingRun,pre} from '../../helpers/catalog-program.js';
const TOL=50;
const upRnd=(x,from)=>x.first(s=>s.out_HV_C2||!s.STO,from);

def('U-01','E2','Safe: BOTH; C1_FBK after 50 ms -> R&D not before C1 command + 500 + 100 ms',(P,c)=>{
 const x=P.safe();x.plant.c1=50;const {u1}=toSafeToRnd(x);x.wait(1500);
 const r=x.first(s=>stIs(s,'RND'),u1);
 c(r!==undefined&&r>u1+600-TOL&&r<=u1+600+TOL,`R&D at C1 command+${r===undefined?'none':r-u1}, expected 600+-${TOL} (window 500 + 100 continuous) [question 68]`);
 c(x.is('RND')&&x.r.get('out_LV_C1'),'R&D with C1 ON');
},{source:'question 68'});

def('U-02','E2','Safe: BOTH -> LV discharge removed at acceptance',(P,c)=>{
 const x=P.rnd();x.green(550);x.until(s=>stIs(s,'SAFE')&&!s.out_LV_C1&&!s.c1f,5000,'Safe after R&D->Safe');x.wait(2100);
 pre(x.r.get('out_LV_Discharge_Request'),'LV discharge request active in steady Safe after R&D->Safe (precondition; boot case: question S1-Q2)');
 const {u1}=toSafeToRnd(x);x.wait(1000);const f=x.fall('out_LV_Discharge_Request',u1-200);
 c(f!==undefined&&Math.abs(f-u1)<=TOL,`LV discharge removed at acceptance (C1 ON at ${u1}); removed at ${f===undefined?'never':(f-u1>=0?'+':'')+(f-u1)} [TD-01/question 74]`);
},{source:'TD-01, question 74'});

def('U-03','E2','R&D: BOTH -> at acceptance C2 ON, STO released, HV discharge removed',(P,c)=>{
 const x=P.run();x.green(550);x.until(s=>stIs(s,'RND')&&!s.out_HV_C2&&!s.c2f,25000,'R&D after Run->R&D');x.wait(2100);
 pre(x.r.get('out_HV_Discharge_Request'),'HV discharge request active in steady R&D after Run->R&D (precondition, Q-V7-01)');
 const g=x.both();x.wait(200);const u=upRnd(x,g.p1);
 c(u!==undefined&&u>g.p2+1000-TOL&&u<=g.p2+1000+TOL,`acceptance at second+${u===undefined?'none':u-g.p2}, expected 1000+-${TOL}`);
 if(u!==undefined){const c2=x.rise('out_HV_C2',g.p1),sto=x.first(s=>s.STO_DR1&&s.STO_DR2,g.p1),hd=x.fall('out_HV_Discharge_Request',g.p1);
  c(c2!==undefined&&Math.abs(c2-u)<=TOL,`C2 ON at acceptance (+${c2===undefined?'none':c2-u}) [D-STO-LAUNCH]`);
  c(sto!==undefined&&Math.abs(sto-u)<=TOL,`STO released (both drives) at acceptance (+${sto===undefined?'none':sto-u}), not waiting for C2_FBK/HV [D-STO-LAUNCH]`);
  c(hd!==undefined&&Math.abs(hd-u)<=TOL,`HV discharge removed at acceptance (+${hd===undefined?'none':hd-u}) [question 73]`);}
},{source:'D-STO-LAUNCH, question 73'});

def('U-04','E2','StartingRun: C2_FBK + HV normal -> Run not before command + 600 ms',(P,c)=>{
 const x=P.rnd();const {u}=toStartingRun(x);x.wait(1500);const c2=x.rise('out_HV_C2',u-5)??u;
 const r=x.first(s=>stIs(s,'RUN'),c2-1);c(r!==undefined&&r>c2+600-TOL&&r<=c2+600+TOL,`Run at C2 command+${r===undefined?'none':r-c2}, expected 600+-${TOL} [question 68, RUNCONF]`);
},{source:'question 68, Q-RC-RUNCONF-01'});

def('U-05','E2','StartingRun: HV normal drops 30 ms after the window -> 100 ms count restarts, no emergency',(P,c)=>{
 const x=P.rnd();const {u}=toStartingRun(x);const c2=x.rise('out_HV_C2',u-5)??u;x.wait(Math.max(0,c2+560-x.t));
 x.step({in_HV_Faulty_FBK:true},30);x.step({in_HV_Faulty_FBK:false},1000);const back=c2+590;
 const r=x.first(s=>stIs(s,'RUN'),c2-1);c(r!==undefined&&r>back+100-TOL&&r<=back+100+TOL,`Run at HV-return+${r===undefined?'none':r-back}, expected 100+-${TOL} (count restarted) [Q-RC-RUNCONF-01]`);
 c(!x.never(s=>emg(s)||s.fault===true,u),'no Emergency/fault');
},{source:'Q-RC-RUNCONF-01'});

def('U-06','E2','Safe: LV Faulty before the gesture, BOTH -> Safe->R&D starts',(P,c)=>{
 const x=P.safe();const {u1}=toSafeToRnd(x,{holdLvFaulty:true});x.wait(3000);
 c(u1!==undefined,'Safe->R&D starts (C1 ON) with LV Faulty [question 66(b), K-2]');
 c(!x.never(s=>stIs(s,'RND'),u1),'R&D not confirmed while LV is Faulty');c(!x.never(emg,u1),'no Emergency');
},{source:'question 66(b), K-2'});

def('U-07','E2','BOTH started during Safe->R&D / StartingRun is not executed after arrival',(P,c)=>{
 for(const through of [false,true]){const x=P.safe();toSafeToRnd(x,{holdLvFaulty:true});x.wait(2100);
  const g=x.both({release:!through,hold:through?600:1050});
  if(through){x.step({in_Reset_PB:true,in_Relase_Door_PB:true,in_LV_Faulty_FBK:false},1500);x.step({in_Reset_PB:false,in_Relase_Door_PB:false});}
  else x.step({in_LV_Faulty_FBK:false});
  x.wait(3000);c(x.is('RND'),`Safe->R&D ${through?'(held through arrival)':''}: R&D reached; status=${x.status()}`);
  c(upRnd(x,g.p1)===undefined,`Safe->R&D: BOTH begun in the transition${through?' and held through arrival':''} does not start R&D->Run [XPH-01, MOD-004]`);}
 {const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(2100);const g=x.both();x.step({in_HV_Faulty_FBK:false},3000);
  c(x.is('RUN'),`StartingRun: Run reached after HV normal; status=${x.status()}`);
  c(!x.never(s=>!stIs(s,'RUN')&&!stIs(s,'RND'),g.p1),'StartingRun: BOTH begun in the transition has no effect after arrival');}
},{source:'XPH-01, MOD-004'});

def('U-08','E2','R&D: legacy PLC (1,1) -> no R&D->Run',(P,c)=>{
 const x=P.rnd();const ev=x.t;x.step({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true},1500);x.step({inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false},2000);
 c(upRnd(x,ev)===undefined,'legacy (1,1) does not start R&D->Run (no C2 ON / STO release) [question 76]');c(x.is('RND'),`stays R&D; status=${x.status()}`);
},{source:'question 76'});

def('U-09','E2','Safe: connector lost between first and second button -> gesture rejected',(P,c)=>{
 for(const sig of ['in_LV_Connector_Interlock','in_HV_Connector_Interlock']){const x=P.safe();const p1=x.t;
  x.step({in_Reset_PB:true},50);x.step({[sig]:false},50);x.step({[sig]:true},50);x.step({in_Reset_PB:true,in_Relase_Door_PB:true},1100);x.step({in_Reset_PB:false,in_Relase_Door_PB:false},1500);
  c(x.first(s=>s.out_LV_C1,p1)===undefined,`Safe, ${sig} lost between presses: no Safe->R&D [K-1, TD-07]`);c(!x.never(s=>emg(s)||s.fault===true,p1),`${sig}: no Emergency/fault`);}
 {const x=P.rnd();const p1=x.t;x.step({in_Reset_PB:true},50);x.step({in_InterLock_NC_1:false},50);x.step({in_InterLock_NC_1:true},50);
  x.step({in_Reset_PB:true,in_Relase_Door_PB:true},1100);x.step({in_Reset_PB:false,in_Relase_Door_PB:false},1500);
  c(upRnd(x,p1)===undefined,'R&D, cover lost between presses: no R&D->Run [K-1/REL01-e2]');}
},{source:'K-1, TD-07, V14-Q7 (Safe permit = connectors)'});
export const U=['U-01','U-02','U-03','U-04','U-05','U-06','U-07','U-08','U-09'];
