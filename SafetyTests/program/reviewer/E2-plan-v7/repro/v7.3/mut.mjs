import {fix as fix73} from './fix.mjs';import {fix74} from './comb.mjs';
import {cand,toRnd,boot,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/cand.mjs';
const deact=(blk,port)=>m=>{const b=m.networks.flatMap(n=>n.blocks).find(b=>b.path==='//'+blk);const p=b.inputs.find(q=>q.name===port);p.channelInterface='Deactivated';p.globals=[];p.sources=[];};
const st=(m,...f)=>{fix73(m);fix74(m);for(const g of f)g(m);};
const cov=(sig,mut,stoKey)=>{const r=cand('E2d',m=>st(m,...(mut?[mut]:[])));toRnd(r);r.step(2100);r.plantC2=false;r.hold={in_HV_C2_FBK:false};const P=r.t+1;r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});let c2=0,s=0;
 for(let i=0;i<9000;i++){const n=r.t+1;if(n===P+1100)r.setInputs({in_Reset_PB:false,in_Relase_Door_PB:false});if(n===P+1002)r.setInputs({[sig]:false});r.step(1);if(r.t>=P+1002){if(r.get('out_HV_C2'))c2++;if(r.get(stoKey))s++;}}return `C2 ${c2} ${stoKey} ${s}`;};
for(const [id,b,p,sig,k] of [['none',null,null,'in_InterLock_NC_1','STO_DR1'],['M-E2d-17','Network1/FBAndHvSetPermit','AndIn5','in_InterLock_NC_1','STO_DR1'],['M-E2d-18','Network1/FBAndHvSetPermit','AndIn6','in_InterLock_NC_2','STO_DR1'],['M-E2d-19','Network1/FBAndSto1SetPermit','AndIn5','in_InterLock_NC_1','STO_DR1'],['M-E2d-20','Network1/FBAndSto1SetPermit','AndIn6','in_InterLock_NC_2','STO_DR1'],['M-E2d-21','Network1/FBAndSto2SetPermit','AndIn5','in_InterLock_NC_1','STO_DR2'],['M-E2d-22','Network1/FBAndSto2SetPermit','AndIn6','in_InterLock_NC_2','STO_DR2']])
 console.log(id,cov(sig,b?deact(b,p):null,k));
// AndIn1 mutants of SPOIL (proposed): R&D cover open, no buttons, then green single / blue
for(const [id,mut] of [['none',null],['SPOIL_R.AndIn1',deact('RndPhysicalCompact/GATE_SPOIL_R','AndIn1')],['SPOIL_S.AndIn1',deact('RndPhysicalCompact/GATE_SPOIL_S','AndIn1')],['SPOIL_S.AndIn2',deact('RndPhysicalCompact/GATE_SPOIL_S','AndIn2')],['M-E2b-46 SPOIL_R.AndIn2',deact('RndPhysicalCompact/GATE_SPOIL_R','AndIn2')]]){
 const a=cand('E2d',m=>st(m,...(mut?[mut]:[])));toRnd(a);a.step(2100);a.step(1,{in_InterLock_NC_1:false});a.step(500);gesture(a,{green:true});a.step(3000);
 const b=cand('E2d',m=>st(m,...(mut?[mut]:[])));toRnd(b);b.step(2100);b.step(1,{in_InterLock_NC_1:false});b.step(500);b.step(1,{in_Relase_Door_PB:true});b.step(700);
 const c=cand('E2d',m=>st(m,...(mut?[mut]:[])));boot(c);c.step(1,{in_InterLock_NC_1:false});gesture(c,{green:true,blue:true,ms:1100});c.step(1500);
 const d=cand('E2d',m=>st(m,...(mut?[mut]:[])));boot(d);d.step(1,{in_LV_Connector_Interlock:false});d.step(50,{in_LV_Connector_Interlock:true});d.step(500);gesture(d,{green:true,blue:true,ms:1100});d.step(1500);
 console.log(id.padEnd(26),'R&D open green ->',a.ph(),'| R&D open blue UL',+b.get('out_Door_Unlock_Solonoeid'),'| Safe open BOTH ->',c.ph(),'| Safe conn 50ms then BOTH after 550 ms ->',d.ph());}
