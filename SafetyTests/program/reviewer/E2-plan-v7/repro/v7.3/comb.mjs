import {fix as fix73} from './fix.mjs';
import {cand,toRnd,toRun,boot,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/cand.mjs';
const NC='Break Contact (NC)';
export function fix74(m){const B=new Map(m.networks.flatMap(n=>n.blocks).map(b=>[b.path,b]));
 for(const blk of ['Network1/FBAndHvSetPermit','Network1/FBAndSto1SetPermit','Network1/FBAndSto2SetPermit'])for(const [port,v] of [['AndIn5','in_InterLock_NC_1'],['AndIn6','in_InterLock_NC_2']]){
  const p=B.get('//'+blk).inputs.find(q=>q.name===port);if(p.channelInterface==='Activated')throw Error('busy');p.channelInterface='Activated';p.deactivate1=NC;p.globals=[{resolvedName:v}];p.sources=[];}}
const V={base:null,v73:m=>fix73(m),v74:m=>fix74(m),both:m=>{fix73(m);fix74(m);}};
const OUT=['out_SS1_DR1','out_SS1_DR2','STO_DR1','STO_DR2','out_HV_Discharge_Request','out_LV_Discharge_Request','out_HV_C2','out_LV_C1','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid','b_EStop_Ok','b_Step1','b_Step12','b_Step_RnD','b_Step3','b_Step4','b_Step5','b_Step6'];
function trace(vn,scen){const r=cand('E2d',V[vn]);const log=[];const st=r.step.bind(r);r.step=(n=1,inp)=>{if(inp)r.setInputs(inp);for(let i=0;i<n;i++){st(1);log.push(OUT.map(k=>+!!r.get(k)).join(''));}return r;};scen(r);return log;}
const diff=(a,b)=>{const n=Math.max(a.length,b.length);for(let i=0;i<n;i++)if(a[i]!==b[i]){const k=OUT.filter((_,j)=>a[i]?.[j]!==b[i]?.[j]);return `first diff scan ${i}: ${k}`;}return 'identical';};
const S={
 'lifecycle closed cover: Safe->R&D->Run->R&D->Safe, unlocks':r=>{toRun(r);r.step(2100);gesture(r,{green:true});r.step(9000);r.step(2100);gesture(r,{blue:true,ms:700});r.step(2100);gesture(r,{green:true});r.step(5000);r.step(2100);gesture(r,{blue:true,ms:700});r.step(2100);},
 'Run, NC1 FALSE (IL-03)':r=>{toRun(r);r.step(2100);r.step(1,{in_InterLock_NC_1:false});r.step(10000);r.step(1,{in_InterLock_NC_1:true});r.step(100);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(3000);},
 'Run, in_Estop_PLC (L3 ref)':r=>{toRun(r);r.step(2100);r.step(1,{in_Estop_PLC:true});r.step(10000);r.step(1,{in_Estop_PLC:false});r.step(100);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(3000);},
 'Run->R&D, NC1 FALSE at owner+1 (IL-05b(1))':r=>{toRun(r);r.step(2100);r.step(1,{in_Reset_PB:true});r.step(501);r.step(1,{in_InterLock_NC_1:false});r.step(99,{in_Reset_PB:false});r.step(10000);},
 'Run->R&D, NC2 FALSE at owner+1000':r=>{toRun(r);r.step(2100);r.step(1,{in_Reset_PB:true});r.step(599);r.step(1,{in_Reset_PB:false});r.step(900);r.step(1,{in_InterLock_NC_2:false});r.step(10000);},
 'Run, HV Faulty 200 ms (STP-G protective descent)':r=>{toRun(r);r.step(2100);r.step(1,{in_HV_Faulty_FBK:true});r.step(200);r.step(1,{in_HV_Faulty_FBK:false});r.step(10000);},
 'Run, NC1 open then HV Faulty (Emergency + HLT)':r=>{toRun(r);r.step(2100);r.step(1,{in_InterLock_NC_1:false});r.step(50);r.step(1,{in_HV_Faulty_FBK:true});r.step(9000);},
 'StartingRun (HV Faulty) abort by green after 2.1 s release':r=>{toRnd(r);r.step(2100);r.step(1,{in_HV_Faulty_FBK:true});gesture(r,{green:true,blue:true,ms:1100});r.step(2100);gesture(r,{green:true});r.step(1,{in_HV_Faulty_FBK:false});r.step(10000);},
 'StartingRun, NC1 at SU+50 (IL-05a)':r=>{toRnd(r);r.step(2100);r.step(1,{in_HV_Faulty_FBK:true});r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(1050);r.step(1,{in_InterLock_NC_1:false});r.step(50,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(10000);},
 'StartingRun, in_Estop_PLC at SU+50':r=>{toRnd(r);r.step(2100);r.step(1,{in_HV_Faulty_FBK:true});r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(1050);r.step(1,{in_Estop_PLC:true});r.step(50,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(10000);},
 'R&D cover open: green down; blue unlock; LV Faulty (HLT-01)':r=>{toRnd(r);r.step(2100);r.step(1,{in_InterLock_NC_1:false});gesture(r,{blue:true,ms:700});r.step(2100);r.step(1,{in_LV_Faulty_FBK:true});r.step(6000);},
 'Safe cover open: BOTH -> R&D (V14-Q7), then close, BOTH -> Run':r=>{boot(r);r.step(1,{in_InterLock_NC_1:false});gesture(r,{green:true,blue:true,ms:1100});r.step(2500);r.step(1,{in_InterLock_NC_1:true});r.step(2100);gesture(r,{green:true,blue:true,ms:1100});r.step(3000);},
};
if(process.argv[1].endsWith("comb.mjs"))for(const [n,f] of Object.entries(S)){const b=trace('base',f);const res=['v73','v74','both'].map(v=>v+': '+diff(b,trace(v,f)));console.log(n.padEnd(62),'|',res.join(' | '));}
