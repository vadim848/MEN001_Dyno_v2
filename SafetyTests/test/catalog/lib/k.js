// Catalog section K - buttons and gestures (SCENARIO_CATALOG.md). Oracle: catalog row + Vadim's decisions (source column).
import {def,stIs,emg} from '../../helpers/catalog-program.js';
const TOL=50;
const UNL='out_Door_Unlock_Solonoeid';
// Up-step acceptance marker: first scan with C1 ON (Safe->R&D) or C2 ON / STO released (R&D->Run).
const upSafe=(x,from,to)=>x.first(s=>s.out_LV_C1,from,to);
const upRnd=(x,from,to)=>x.first(s=>s.out_HV_C2||!s.STO,from,to);
// Down acceptance marker from R&D: first change C1 OFF / LV discharge ON / status leaves R&D.
const downRnd=(x,from,to)=>x.first(s=>!s.out_LV_C1||s.out_LV_Discharge_Request||!stIs(s,'RND'),from,to);
const noFault=(x,from,c,label)=>{const f=x.never(s=>s.fault===true||s.plcFault===true,from);c(!f,`${label}: no fault expected, fault at t=${f?.t}`);
 const e=x.never(emg,from);c(!e,`${label}: no Emergency expected, Emergency at t=${e?.t}`);};

def('K-01','E2','Safe: BOTH (second after 200 ms), hold 1 s -> Safe->R&D starts',(P,c)=>{
 for(const first of ['green','blue']){const x=P.safe();const g=x.both({first,delta:200,hold:1000+TOL});x.wait(1500);
  const u=upSafe(x,g.p1);c(u!==undefined,`${first}-first: Safe->R&D must start (C1 ON) [D-TIMING, D-CHORD250]`);
  if(u!==undefined)c(u>g.p2+1000-TOL&&u<=g.p2+1000+TOL,`${first}-first: C1 ON at second+${u-g.p2} ms, expected 1000+-${TOL} (BOTH 1 s from second press)`);}
},{source:'D-TIMING, D-CHORD250'});

def('K-02','E2','Safe: second button after 300 ms -> no step up, no fault',(P,c)=>{
 for(const first of ['green','blue']){const x=P.safe();const g=x.both({first,delta:300,hold:1500});x.wait(2000);
  c(upSafe(x,g.p1)===undefined,`${first}-first: delta 300 ms > 250 ms: no Safe->R&D (C1 must stay OFF) [D-CHORD250]`);
  c(x.never(s=>s[UNL],g.p1)===undefined,`${first}-first: no Unlock from the invalid attempt`);noFault(x,g.p1,c,first+'-first');}
},{source:'D-CHORD250'});

def('K-03','E2','Safe: BOTH, release one after 0.8 s -> nothing (no single, no step up)',(P,c)=>{
 for(const keep of ['green','blue']){const x=P.safe();const g=x.both({delta:100,hold:800,release:false});
  const held=keep==='green'?{in_Reset_PB:true,in_Relase_Door_PB:false}:{in_Reset_PB:false,in_Relase_Door_PB:true};
  x.step(held,1500);x.step({in_Reset_PB:false,in_Relase_Door_PB:false});x.wait(1500);
  c(upSafe(x,g.p1)===undefined,`keep ${keep}: no Safe->R&D [p.7]`);
  c(x.never(s=>s[UNL],g.p1)===undefined,`keep ${keep}: remaining button does not become a single command (no Unlock) [p.7]`);
  c(x.is('SAFE'),`keep ${keep}: stays Safe; status=${x.status()}`);noFault(x,g.p1,c,'keep '+keep);}
},{source:'p.7'});

def('K-04','E2','R&D: green 0.4 s -> nothing; green 0.6 s -> R&D->Safe',(P,c)=>{
 {const x=P.rnd();const g=x.green(400);x.wait(1500);c(downRnd(x,g.p)===undefined,'green 0.4 s: no down (R&D, C1 ON kept) [D-TIMING]');}
 {const x=P.rnd();const g=x.green(600);x.wait(2500);const d=downRnd(x,g.p);
  c(d!==undefined&&d>g.p+500-TOL&&d<=g.p+500+TOL,`green 0.6 s: R&D->Safe accepted at press+${d===undefined?'none':d-g.p} ms, expected 500+-${TOL}`);
  c(x.is('SAFE')&&!x.r.get('out_LV_C1'),`green 0.6 s: ends in Safe with C1 OFF; status=${x.status()}`);}
},{source:'D-TIMING'});

def('K-05','E2','R&D: green, blue exactly 500 ms later -> only down, no step up',(P,c)=>{
 const x=P.rnd();const p=x.t;x.step({in_Reset_PB:true},500);x.step({in_Reset_PB:true,in_Relase_Door_PB:true},1500);
 x.step({in_Reset_PB:false,in_Relase_Door_PB:false});x.wait(2500);
 const d=downRnd(x,p);c(d!==undefined&&d>p+500-TOL&&d<=p+500+TOL,`down (R&D->Safe) accepted by press+${500+TOL} [D-Q500]; got ${d===undefined?'none':d-p}`);
 c(upRnd(x,p)===undefined,'no R&D->Run (C2/STO unchanged) from the same attempt [D-Q500]');
 c(x.never(s=>s[UNL],p)===undefined,'no Unlock from the late blue [D-Q500]');
 c(x.is('SAFE'),`ends in Safe (no retro step up); status=${x.status()}`);
},{source:'D-Q500'});

def('K-06','E2','R&D: green, blue 300 ms later (before acceptance) -> nothing, no fault',(P,c)=>{
 for(const first of ['green','blue']){const x=P.rnd();const g=x.both({first,delta:300,hold:1500});x.wait(2000);
  c(downRnd(x,g.p1)===undefined,`${first}-first: no down [D-LATE-SECOND p.11]`);c(upRnd(x,g.p1)===undefined,`${first}-first: no step up`);
  c(x.never(s=>s[UNL],g.p1)===undefined,`${first}-first: no Unlock`);noFault(x,g.p1,c,first+'-first');
  c(x.is('RND'),`${first}-first: stays R&D; status=${x.status()}`);}
},{source:'D-LATE-SECOND, p.11'});

def('K-07','E2','BOTH held without release -> exactly one step up',(P,c)=>{
 {const x=P.safe();const g=x.both({hold:4000});x.wait(2000);
  c(upRnd(x,g.p1)===undefined,'Safe, BOTH held 4 s: only Safe->R&D, never R&D->Run (no C2 ON / STO release) [p.4-5]');
  c(x.is('RND'),`Safe, BOTH held 4 s: ends in R&D; status=${x.status()}`);}
 {const x=P.rnd();const g=x.both({hold:4000});x.wait(2000);
  c(x.is('RUN'),`R&D, BOTH held 4 s: one step to Run; status=${x.status()}`);
  const dn=x.never(s=>!stIs(s,'RUN')&&!stIs(s,'RND'),g.p1);c(!dn,`R&D, BOTH held: no other state during the attempt (t=${dn?.t} ${dn?.st})`);}
},{source:'p.4-5'});

def('K-08','E2','Safe: BOTH, release; new BOTH 1.5 s / 2.5 s after release -> 1.5 no, 2.5 yes',(P,c)=>{
 for(const pause of [1500,2500]){const x=P.safe();const g=x.both();x.wait(pause-1);
  c(x.is('RND'),`pause ${pause}: first BOTH reached R&D before the second attempt; status=${x.status()}`);
  const h=x.both();x.wait(1500);const u=upRnd(x,h.p1);
  if(pause===1500)c(u===undefined,'new BOTH 1.5 s after release: rejected (2 s release pause) [p.9]');
  else c(u!==undefined&&u>h.p2+1000-TOL&&u<=h.p2+1000+TOL,`new BOTH 2.5 s after release: R&D->Run accepted at second+${u===undefined?'none':u-h.p2}, expected 1000+-${TOL} [p.9]`);}
},{source:'p.9'});

def('K-09','E2','Safe: permit lost 300 ms with buttons released, BOTH 2.1 s after release -> accepted',(P,c)=>{
 const cases={cover:{in_InterLock_NC_1:false,in_InterLock_NC_2:false},connectorLV:{in_LV_Connector_Interlock:false}};
 for(const [k,loss] of Object.entries(cases)){const x=P.safe();const g=x.green(100);const rel=g.rel;x.wait(500);
  x.step(loss,300);x.step(Object.fromEntries(Object.keys(loss).map(n=>[n,true])));x.wait(rel+2100-x.t);
  const h=x.both();x.wait(1000);const u=upSafe(x,h.p1);
  c(u!==undefined,`${k} 300 ms during the pause: BOTH at release+2.1 s accepted (pause counted by buttons only) [Q-REL-AFTER-PERMIT]`);}
},{source:'Q-REL-AFTER-PERMIT'});

def('K-10','E2','Run: BOTH -> ignored',(P,c)=>{
 const x=P.run();const g=x.both();x.wait(3000);
 const ch=x.never(s=>!stIs(s,'RUN')||!s.out_HV_C2||s.STO||!s.out_LV_C1||s[UNL],g.p1);
 c(!ch,`Run unchanged after BOTH (no down/up/Unlock) [D-RUN-BOTH-IGNORE]; first change t=${ch?.t} status=${ch?.st} C2=${ch?.out_HV_C2} STO=${ch?.STO}`);
},{source:'D-RUN-BOTH-IGNORE, p.10'});

def('K-11','E2','blue 0.6 s: Unlock in Safe and R&D (cover closed / open); not in Run/Config/Emergency',(P,c)=>{
 const open={in_InterLock_NC_1:false,in_InterLock_NC_2:false};
 for(const [st,mk] of [['Safe',()=>P.safe()],['R&D',()=>P.rnd()]])for(const cov of ['closed','open']){
  const x=mk();if(cov==='open')x.step(open,100);const g=x.blue(600);x.wait(200);const u=x.rise(UNL,g.p);
  c(u!==undefined&&u>g.p+500-TOL&&u<=g.p+500+TOL,`${st}, cover ${cov}: Unlock at press+${u===undefined?'none':u-g.p}, expected 500+-${TOL} [Q-ARCH-04/10]`);}
 {const x=P.run();const g=x.blue(600);x.wait(500);c(x.never(s=>s[UNL],g.p)===undefined,'Run: no Unlock [Q-ARCH-10]');}
 {const x=P.safe();x.step({in_Estop_PLC:true},200);x.step({in_Estop_PLC:false},100);c(x.is('EMG'),'precondition Emergency by in_Estop_PLC');
  const g=x.blue(600);x.wait(500);c(x.never(s=>s[UNL],g.p)===undefined,'Emergency: no Unlock [Q-ARCH-10]');}
 {const x=P.safe();const cfg=x.P.sym('CFG');
  if(!cfg)c.nv('Config sub-case: Config state not published by target (introduced in E4)');
  else{x.step({inPLC_BypassC1C2:true},1000);const g=x.blue(600);x.wait(500);c(x.never(s=>s[UNL],g.p)===undefined,'Config: no Unlock [V14-Q16]');}}
},{source:'Q-ARCH-04, Q-ARCH-10'});
export const K=['K-01','K-02','K-03','K-04','K-05','K-06','K-07','K-08','K-09','K-10','K-11'];
