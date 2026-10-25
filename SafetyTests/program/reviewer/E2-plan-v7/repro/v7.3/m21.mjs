import {fix as fix73} from './fix.mjs';import {fix74} from './comb.mjs';
import {cand,toRnd,boot,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/cand.mjs';
const deact=(blk,port)=>m=>{const b=m.networks.flatMap(n=>n.blocks).find(b=>b.path==='//'+blk);const p=b.inputs.find(q=>q.name===port);p.channelInterface='Deactivated';p.globals=[];p.sources=[];};
const SC={
 'R&D cover open whole BOTH 3000 ms, restored at p+1500 while held':r=>{toRnd(r);r.step(2100);r.step(1,{in_InterLock_NC_1:false});r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(1500);r.step(1,{in_InterLock_NC_1:true});r.step(1500);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(1500);},
 'R&D cover open, BOTH released before restore, then restore, wait 500':r=>{toRnd(r);r.step(2100);r.step(1,{in_InterLock_NC_1:false});gesture(r,{green:true,blue:true,ms:1100});r.step(1,{in_InterLock_NC_1:true});r.step(1500);},
 'Safe conn FALSE whole BOTH, restored after Q while held':r=>{boot(r);r.step(1,{in_LV_Connector_Interlock:false});r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(1500);r.step(1,{in_LV_Connector_Interlock:true});r.step(1500);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(1500);},
 'R&D BOTH at r+1999 after blue single, held 3000':r=>{toRnd(r);r.step(2100);gesture(r,{blue:true,ms:700});r.step(1998);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(3000);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(1500);},
};
for(const [n,f] of Object.entries(SC))for(const [vn,v] of [['E2d+v73+v74',m=>{fix73(m);fix74(m);}],['  + M-E2b-21',m=>{fix73(m);fix74(m);deact('RndPhysicalCompact/GATE_030','OrIn5')(m);}],['E2b+v73',m=>fix73(m)],['  + M-E2b-21',m=>{fix73(m);deact('RndPhysicalCompact/GATE_030','OrIn5')(m);}]]){const c=vn.includes('E2b')||(vn.startsWith('  ')&&false)?'E2b':'E2d';}
const rows=[['E2d',m=>{fix73(m);fix74(m);},'E2d+v7.3+v7.4'],['E2d',m=>{fix73(m);fix74(m);deact('RndPhysicalCompact/GATE_030','OrIn5')(m);},'  +M-E2b-21'],['E2b',m=>fix73(m),'E2b+v7.3'],['E2b',m=>{fix73(m);deact('RndPhysicalCompact/GATE_030','OrIn5')(m);},'  +M-E2b-21']];
for(const [n,f] of Object.entries(SC))for(const [c,v,l] of rows){const r=cand(c,v);f(r);console.log(n.padEnd(66),l.padEnd(16),r.ph(),'C1',+r.get('out_LV_C1'),'C2',+r.get('out_HV_C2'));}
