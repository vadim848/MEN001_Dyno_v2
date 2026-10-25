import {cand,toRnd,boot} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/cand.mjs';
import {V} from './v76.mjs';
const deact=(blk,port)=>m=>{const b=m.networks.flatMap(n=>n.blocks).find(b=>b.path==='//'+blk);const p=b.inputs.find(q=>q.name===port);p.channelInterface='Deactivated';p.globals=[];p.sources=[];};
// R&D: NC1 FALSE, blue 100 ms (PF set), release at r; NC1 TRUE at r+50; BOTH at r+g, held 1100
function run(vn,extra,base,g,{sig='in_InterLock_NC_1'}={}){const r=cand('E2d-v7.5',m=>{V[vn]?.(m);extra?.(m);});if(base==='R'){toRnd(r);r.step(2100);}else{boot(r);}
 r.step(1,{[sig]:false});r.step(1,{in_Relase_Door_PB:true});r.step(99);const rr=r.t+1;r.step(1,{in_Relase_Door_PB:false});r.step(49);r.step(1,{[sig]:true});
 while(r.t<rr+g-1)r.step(1);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(1099);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(2500);return r.ph();}
for(const base of ['R','S'])for(const g of [1999,2000,2001,2002,2100]){const sig=base==='R'?'in_InterLock_NC_1':'in_LV_Connector_Interlock';console.log(base,'BOTH at r+'+g,'base v7.5:',run('base',null,base,g,{sig}),'| v7.6:',run('v76',null,base,g,{sig}));}
// control without episode
for(const base of ['R','S'])for(const g of [1999,2001]){const r=cand('E2d-v7.5',V.v76);if(base==='R'){toRnd(r);r.step(2100);}else boot(r);r.step(1,{in_Relase_Door_PB:true});r.step(99);const rr=r.t+1;r.step(1,{in_Relase_Door_PB:false});while(r.t<rr+g-1)r.step(1);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(1099);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(2500);console.log('control no episode',base,'r+'+g,r.ph());}
// M-E2b-47/48 on v7.6: cover/connector open with no button, during clearing; then BOTH at r+2001 with episode crossing the reset
for(const [id,mut] of [['none',null],['M-E2b-47 SPOIL_R.AndIn1',deact('RndPhysicalCompact/GATE_SPOIL_R','AndIn1')],['M-E2b-48 SPOIL_S.AndIn1',deact('RndPhysicalCompact/GATE_SPOIL_S','AndIn1')]]){
 const out=[];for(const [base,sig] of [['R','in_InterLock_NC_1'],['S','in_LV_Connector_Interlock']])for(const [s,e] of [[-300,-1],[-300,0],[-1,1],[-2000,-1]]){const r=cand('E2d-v7.5',m=>{V.v76(m);mut?.(m);});if(base==='R'){toRnd(r);r.step(2100);}else boot(r);r.step(2400);const p=r.t+400;
  while(r.t<p+1100+2500){const n=r.t+1,o={};if(n===p+s)o[sig]=false;if(n===p+e)o[sig]=true;if(n===p)Object.assign(o,{in_Reset_PB:true,in_Relase_Door_PB:true});if(n===p+1100)Object.assign(o,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(1,o);}out.push(base+'['+s+','+e+')='+r.ph());}
 console.log(id.padEnd(26),out.join(' '));}
