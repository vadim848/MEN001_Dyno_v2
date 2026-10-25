// Reviewer v4: REL-01(e) windows from G1 v3 probe on the plan v4 prototype stacks (model), LV and HV connector.
import {rt} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2500);};
const stacks={'F1':{r1:false,e2a:false,e2b:false,e2c:false,e2d:false,e2e:false},'R1+E2a':{e2b:false,e2c:false,e2d:false,e2e:false},'R1+E2a+E2b':{e2c:false,e2d:false},'R1+E2a..E2d':{}};
for(const [sn,o] of Object.entries(stacks))for(const c of ['in_LV_Connector_Interlock','in_HV_Connector_Interlock'])for(const [hold,a,b] of (process.argv[2]==="n5"?[[4000,800,2500],[2500,800,1300]]:[[2000,800,1300],[3000,800,1300],[3000,800,2500],[2000,500,999],[2000,1001,1500]])){
 const r=rt(o); boot(r); const p=r.t; let c1=-1,s12=-1;
 for(let i=0;i<hold+3000;i++){const rel=r.t-p; let inp; if(rel===0)inp={in_Reset_PB:true,in_Relase_Door_PB:true}; if(rel===hold)inp={in_Reset_PB:false,in_Relase_Door_PB:false}; if(rel===a)inp={...(inp||{}),[c]:false}; if(rel===b)inp={...(inp||{}),[c]:true}; r.step(1,inp); if(c1<0&&r.get('out_LV_C1'))c1=r.t-p; if(s12<0&&r.get('b_Step12'))s12=r.t-p;}
 console.log(sn.padEnd(12),c.slice(3,5),`hold ${hold} episode [${a},${b})`.padEnd(28),'S12 '+(s12<0?'never':'p+'+s12),'C1 ON '+(c1<0?'never':'p+'+c1));
}
