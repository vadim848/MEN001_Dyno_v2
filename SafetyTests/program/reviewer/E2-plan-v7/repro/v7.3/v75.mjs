import {cand,toRnd,toRun,boot,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/cand.mjs';
// v7.5 as planned: delete N12/FBAnd8/9/10 (with their in-wires), deactivate N12/FBOr1.OrIn2
const v75=m=>{for(const n of m.networks){const del=n.blocks.filter(b=>/^\/\/Network12\/FBAnd(8|9|10)$/.test(b.path));for(const b of del){for(const o of b.outputs)for(const t of o.targets){}}
  n.blocks=n.blocks.filter(b=>!del.includes(b));}
 const all=m.networks.flatMap(n=>n.blocks);for(const b of all){for(const o of b.outputs)o.targets=o.targets.filter(t=>!/Network12\/FBAnd(8|9|10)\//.test(t));}
 const p=all.find(b=>b.path==='//Network12/FBOr1').inputs.find(q=>q.name==='OrIn2');p.channelInterface='Deactivated';p.sources=[];p.globals=[];
 const ord=all.filter(b=>b.orderOfExecution>0).sort((a,b)=>a.orderOfExecution-b.orderOfExecution);ord.forEach((b,k)=>b.orderOfExecution=k+1);};
const OUT=['out_SS1_DR1','out_SS1_DR2','STO_DR1','STO_DR2','out_HV_Discharge_Request','out_LV_Discharge_Request','out_HV_C2','out_LV_C1','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid','b_EStop_Ok','b_Step1','b_Step12','b_Step_RnD','b_Step3','b_Step4','b_Step5','b_Step6'];
function trace(mut,scen){const r=cand('E2d-v7.4.1',mut);const log=[];const st=r.step.bind(r);r.step=(n=1,inp)=>{if(inp)r.setInputs(inp);for(let i=0;i<n;i++){st(1);log.push(OUT.map(k=>+!!r.get(k)).join(''));}return r;};scen(r);return {log,end:r.ph(),c2:log.filter(l=>l[6]==='1').length};}
const diff=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++)if(a[i]!==b[i])return 'first diff '+i+': '+OUT.filter((_,j)=>a[i]?.[j]!==b[i]?.[j]);return 'identical';};
const M=(a,b)=>({inPLC_RnD_Mode:!!a,inPLC_RnD_Mode_2:!!b});
const S={
 'lifecycle buttons Safe->R&D->Run->R&D->Safe':r=>{toRun(r);r.step(2100);gesture(r,{green:true});r.step(9000);r.step(2100);gesture(r,{green:true});r.step(5000);},
 'Safe PLC (1,0) 600 ms -> R&D':r=>{boot(r);r.step(1,M(1,0));r.step(600);r.step(1,M(0,0));r.step(3000);},
 'Safe C1_FBK ON + PLC (1,0) (FBK10-PLC-A)':r=>{boot(r);r.hold={in_LV_C1_FBK:true};r.plant=false;r.step(100);r.step(1,M(1,0));r.step(1000);r.step(1,M(0,0));r.step(500);},
 'Run PLC (0,1) 600 ms (legacy descent)':r=>{toRun(r);r.step(2100);r.step(1,M(0,1));r.step(600);r.step(1,M(0,0));r.step(9000);},
 'Run PLC (1,0) held 3 s':r=>{toRun(r);r.step(2100);r.step(1,M(1,0));r.step(3000);r.step(1,M(0,0));r.step(1000);},
 'R&D PLC (0,1) 600 ms':r=>{toRnd(r);r.step(2100);r.step(1,M(0,1));r.step(600);r.step(1,M(0,0));r.step(5000);},
 'R&D PLC (1,0) 600 ms':r=>{toRnd(r);r.step(2100);r.step(1,M(1,0));r.step(600);r.step(1,M(0,0));r.step(3000);},
 'Safe PLC (1,1) held 3 s':r=>{boot(r);r.step(1,M(1,1));r.step(3000);r.step(1,M(0,0));r.step(2000);},
 'Run PLC (1,1) held 3 s':r=>{toRun(r);r.step(2100);r.step(1,M(1,1));r.step(3000);r.step(1,M(0,0));r.step(2000);},
 'R&D PLC (1,1) held 5 s':r=>{toRnd(r);r.step(2100);r.step(1,M(1,1));r.step(5000);r.step(1,M(0,0));r.step(1000);},
 'R&D PLC (1,0)->(1,1) transition held':r=>{toRnd(r);r.step(2100);r.step(1,M(1,0));r.step(50);r.step(1,M(1,1));r.step(3000);r.step(1,M(0,0));r.step(1000);},
 'Run in_Estop_PLC':r=>{toRun(r);r.step(2100);r.step(1,{in_Estop_PLC:true});r.step(9000);},
 'StartingRun abort by green after 2.1 s':r=>{toRnd(r);r.step(2100);r.step(1,{in_HV_Faulty_FBK:true});gesture(r,{green:true,blue:true,ms:1100});r.step(2100);gesture(r,{green:true});r.step(1,{in_HV_Faulty_FBK:false});r.step(9000);},
};
for(const [n,f] of Object.entries(S)){const a=trace(null,f),b=trace(v75,f);console.log(n.padEnd(44),'|',diff(a.log,b.log).padEnd(40),'| base end',a.end,'C2 scans',a.c2,'| v7.5 end',b.end,'C2 scans',b.c2);}
