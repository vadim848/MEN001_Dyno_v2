// Reviewer v4: REL-01(e) as killer for M-E2b-21 (GATE_030.OrIn5) on full E2 v4 prototype.
import {rt} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2500);};
for(const [n,mut] of [['base',[]],['M-E2b-21 GATE_030.OrIn5',[{op:'deactivate-input',block:'//RndPhysicalCompact/GATE_030',port:'OrIn5'}]]]){
 const r=rt({mut}); boot(r); const p=r.t; let c1=-1;
 for(let i=0;i<6000;i++){const rel=r.t-p; let inp; if(rel===0)inp={in_Reset_PB:true,in_Relase_Door_PB:true}; if(rel===2000)inp={in_Reset_PB:false,in_Relase_Door_PB:false}; if(rel===800)inp={...(inp||{}),in_LV_Connector_Interlock:false}; if(rel===1300)inp={...(inp||{}),in_LV_Connector_Interlock:true}; r.step(1,inp); if(c1<0&&r.get('out_LV_C1'))c1=r.t-p;}
 console.log(n.padEnd(26),'REL-01(e) LV p+800..1300, BOTH 2000: C1 ON @p+'+c1,'end',r.ph());
}
