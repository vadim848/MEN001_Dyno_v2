// Reviewer v7 x10: exit from the stuck "R&D with C2 ON" (legacy (1,1) 50 ms pulse) by green R&D->Safe and by in_ES_NC_1. Model.
const base='file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/'+(process.argv[2]?process.argv[2]+'/':'');
const {rt,toRun,gesture}=await import(base+'run.mjs');
const S=['out_HV_C2','out_LV_C1','out_HV_Discharge_Request','out_LV_Discharge_Request'];
const tr=(r,n)=>{let prev='',log=[],t0=r.t;for(let i=0;i<n;i++){r.step(1);const s=r.ph()+'|'+r.sts()+'|'+S.map(x=>x.replace('out_','').replace('_Discharge_Request','REQ')+'='+(+!!r.get(x))).join(',');if(s!==prev){log.push((r.t-t0)+':'+s);prev=s;}}return log.join('  ');};
for(const exit of ['green','ES']){const r=rt({});toRun(r);gesture(r,{green:true});r.step(5100);
 r.step(1,{inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});r.step(49);r.setInputs({inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false});r.step(3000);
 console.log('stuck:',r.ph(),r.sts(),'C2',+r.get('out_HV_C2'),'HVreq',+r.get('out_HV_Discharge_Request'));
 if(exit==='green'){r.step(1,{in_Reset_PB:true});r.step(600);r.step(1,{in_Reset_PB:false});}else r.setInputs({in_ES_NC_1:false});
 console.log(exit,':',tr(r,15000));}
