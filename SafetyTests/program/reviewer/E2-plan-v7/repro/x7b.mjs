// Reviewer v7 x7b: same legacy short pulse on architect v5 / v6 protos (comparison, model).
const V=process.argv[2];
const {rt,toRun,gesture}=await import('file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/'+V+'/run.mjs');
const H='out_HV_Discharge_Request';
for(const pw of [1,50,300,700]){const r=rt({});toRun(r);gesture(r,{green:true});r.step(5100);const pre=+r.get(H);
 r.step(1,{inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});r.step(pw-1);r.setInputs({inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false});
 let mn=1;for(let i=0;i<10000;i++){r.step(1);mn=Math.min(mn,+r.get(H));}
 console.log(V,'pulse',String(pw).padStart(3),'ms: pre',r.ph&&pre,'| +10s:',r.ph(),r.sts(),'C2',+r.get('out_HV_C2'),'STO',+r.get('STO_DR1'),'HVreq',+r.get(H),'minHVreq',mn);}
