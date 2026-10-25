// Reviewer v4: REL-01(e) on full E2 v4 prototype (and E2a..c / E2a..b stacks): connector episode overlapping BOTH qualification in Safe.
import {rt} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2500);};
const stacks=process.argv[2]==='attr'?{'F1 (no changes)':{r1:false,e2a:false,e2b:false,e2c:false,e2d:false,e2e:false},'R1 only':{e2a:false,e2b:false,e2c:false,e2d:false,e2e:false},'R1+E2a':{e2b:false,e2c:false,e2d:false,e2e:false}}:{'R1+E2a..E2d':{},'R1+E2a..E2c':{e2d:false},'R1+E2a+E2b':{e2c:false,e2d:false}};
for(const [sn,o] of Object.entries(stacks))for(const [cn,off,on] of [['LV',{in_LV_Connector_Interlock:false},{in_LV_Connector_Interlock:true}],['HV',{in_HV_Connector_Interlock:false},{in_HV_Connector_Interlock:true}],['NC1 (cover, IL-02)',{in_InterLock_NC_1:false},{in_InterLock_NC_1:true}]]){
 const r=rt(o); boot(r); const p=r.t; let c1=-1,s12=-1,emg=-1;
 for(let i=0;i<6000;i++){const rel=r.t-p; let inp; if(rel===0)inp={in_Reset_PB:true,in_Relase_Door_PB:true}; if(rel===2000)inp={in_Reset_PB:false,in_Relase_Door_PB:false}; if(rel===800)inp={...(inp||{}),...off}; if(rel===1300)inp={...(inp||{}),...on}; r.step(1,inp);
  const rr=r.t-p; if(c1<0&&r.get('out_LV_C1'))c1=rr; if(s12<0&&r.get('b_Step12'))s12=rr; if(emg<0&&!r.get('b_EStop_Ok'))emg=rr;}
 console.log(sn.padEnd(13),cn.padEnd(20),'C1 ON @p+'+c1,'S12 @p+'+s12,'EOk drop @p+'+emg,'end',r.ph(),'viol',r.viol.length);
}
