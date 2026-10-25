import {cand,toRnd,toRun,boot,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/cand.mjs';
import {fix as fixK1} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/c8.mjs';
const NC='Break Contact (NC)';
export const fixK2=m=>{const b=m.networks.flatMap(n=>n.blocks).find(b=>b.path==='//SafeResumption/HLT_LV');const p=b.inputs.find(q=>q.name==='AndIn4');if(p.channelInterface==='Activated')throw Error('busy');p.channelInterface='Activated';p.deactivate1=NC;p.sources=[];p.globals=[{resolvedName:'b_Step_RnD'}];};
export const V={base:null,v76:m=>{fixK1(m);fixK2(m);}};
const OUT=['out_SS1_DR1','out_SS1_DR2','STO_DR1','STO_DR2','out_HV_Discharge_Request','out_LV_Discharge_Request','out_HV_C2','out_LV_C1','out_C3_BatRelay','out_RBM_Bat','out_Door_Unlock_Solonoeid','b_EStop_Ok','b_Step1','b_Step12','b_Step_RnD','b_Step3','b_Step4','b_Step5','b_Step6'];
function trace(vn,scen){const r=cand('E2d-v7.5',V[vn]);const log=[];const st=r.step.bind(r);r.step=(n=1,inp)=>{if(inp)r.setInputs(inp);for(let i=0;i<n;i++){st(1);log.push(OUT.map(k=>+!!r.get(k)).join(''));}return r;};scen(r);return {log,end:r.ph()};}
const diff=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++)if(a[i]!==b[i])return 'DIFF@'+i+': '+OUT.filter((_,j)=>a[i]?.[j]!==b[i]?.[j]);return 'identical';};
const F=v=>({in_LV_Faulty_FBK:v}),H=v=>({in_HV_Faulty_FBK:v});
const S={
 'lifecycle closed cover':r=>{toRun(r);r.step(2100);gesture(r,{green:true});r.step(9000);r.step(2100);gesture(r,{blue:true,ms:700});r.step(2100);gesture(r,{green:true});r.step(5000);r.step(2100);gesture(r,{blue:true,ms:700});r.step(2100);},
 'Run LV Faulty held (protective)':r=>{toRun(r);r.step(2100);r.step(1,F(true));r.step(12000);},
 'Run LV Faulty 200 ms':r=>{toRun(r);r.step(2100);r.step(1,F(true));r.step(200);r.step(1,F(false));r.step(12000);},
 'StartingRun LV Faulty (Q-ARCH-03)':r=>{toRnd(r);r.step(2100);r.step(1,H(true));gesture(r,{green:true,blue:true,ms:1100});r.step(1,F(true));r.step(12000);},
 'Run->R&D descent, LV Faulty at +1000':r=>{toRun(r);r.step(2100);gesture(r,{green:true});r.step(400);r.step(1,F(true));r.step(12000);},
 'R&D->Safe descent, LV Faulty at +100':r=>{toRnd(r);r.step(2100);gesture(r,{green:true});r.step(1,F(true));r.step(6000);},
 'R&D LV Faulty then BOTH (HLT-01)':r=>{toRnd(r);r.step(2100);r.step(1,F(true));r.step(100);gesture(r,{green:true,blue:true,ms:1100});r.step(6000);},
 'R&D BOTH, LV Faulty at p+500':r=>{toRnd(r);r.step(2100);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(500);r.step(1,F(true));r.step(600);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(6000);},
 'Safe LV Faulty, blue Unlock':r=>{boot(r);r.step(1,F(true));gesture(r,{blue:true,ms:700});r.step(2000);},
 'Safe LV Faulty, PLC (1,0)':r=>{boot(r);r.step(1,F(true));r.step(1,{inPLC_RnD_Mode:true});r.step(600);r.step(1,{inPLC_RnD_Mode:false});r.step(8000);},
 'Safe LV Faulty, BOTH (K-2)':r=>{boot(r);r.step(1,F(true));r.step(200);gesture(r,{green:true,blue:true,ms:1100});r.step(8000);},
 'Safe LV Faulty + LV connector lost, BOTH':r=>{boot(r);r.step(1,{...F(true),in_LV_Connector_Interlock:false});r.step(200);gesture(r,{green:true,blue:true,ms:1100});r.step(3000);},
 'Run in_Estop_PLC':r=>{toRun(r);r.step(2100);r.step(1,{in_Estop_PLC:true});r.step(9000);},
 'R&D cover open: green; blue':r=>{toRnd(r);r.step(2100);r.step(1,{in_InterLock_NC_1:false});gesture(r,{blue:true,ms:700});r.step(2100);gesture(r,{green:true});r.step(5000);},
};
if(process.argv[1].endsWith('v76.mjs'))for(const [n,f] of Object.entries(S)){const a=trace('base',f),b=trace('v76',f);console.log(n.padEnd(42),'|',diff(a.log,b.log).padEnd(40),'| base',a.end,'| v76',b.end);}
