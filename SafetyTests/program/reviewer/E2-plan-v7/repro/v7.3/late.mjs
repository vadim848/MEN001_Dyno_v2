import {mk} from './fix.mjs';import {boot,toRnd} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/cand.mjs';
// REL01-e2-LATE: blue f, green p=f+100, hold to Q+100; episode [s,s+100) ; observe first lift, emergency, stage
const lift=(r,base)=>base==='S'?r.get('out_LV_C1'):(r.get('out_HV_C2')||r.get('STO_DR1'));
function sc(c,v,base,sig,sOff,hold=100){const r=mk(c,v);if(base==='S')boot(r);else{toRnd(r);r.step(2100);}
 const f=r.t+1;r.step(1,{in_Relase_Door_PB:true});r.step(99);const p=r.t+1;r.step(1,{in_Reset_PB:true});const Q=p+1000;
 let L=null,E=null,stS=null;const stg=base==='S'?'b_Step12':'b_Step3';
 while(r.t<Q+4000){const n=r.t+1;const o={};if(n===Q+sOff)o[sig]=false;if(n===Q+sOff+100)o[sig]=true;if(n===Q+hold+1){o.in_Reset_PB=false;o.in_Relase_Door_PB=false;}r.step(1,o);
  if(L==null&&lift(r,base))L=r.t-Q;if(E==null&&!r.get('b_EStop_Ok'))E=r.t-Q;if(stS==null&&r.get(stg))stS=r.t-Q;}
 return `lift Q+${L} stage Q+${stS} EMG Q+${E} end ${r.ph()} EOk=${+r.get('b_EStop_Ok')}`;}
for(const c of ['E2b','E2d'])for(const v of [null,{}])for(const [base,sig] of [['S','in_LV_Connector_Interlock'],['R','in_InterLock_NC_1']])for(const s of [null,-1,0,1,2,3,401]){
 const hold=s===401?600:100; console.log(c,v?'+v7.3':'     ',base,'s=Q'+(s==null?' none':(s>=0?'+':'')+s),sc(c,v,base,sig,s==null?99999:s,hold));}
