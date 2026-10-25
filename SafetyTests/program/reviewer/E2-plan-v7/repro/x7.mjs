// Reviewer v7 x7: legacy PLC (1,1) short pulse in R&D (HV req TRUE) - is HV left ON in R&D without Run, request cleared?
// Compare v7 full, v7 without E2d, F1-like (no e2a at all is not runnable here, so v6 proto for DIS-HOLD comparison). Model.
const base='file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/';
const {rt,toRun,gesture}=await import(base+'run.mjs');
const H='out_HV_Discharge_Request';
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
for(const [n,o] of [['v7 full',{}],['v7 no-FBK-gate',{mut:[D('//Network12/FBAnd10','AndIn3')]}]])for(const pw of [1,50,300,700]){
 const r=rt(o);toRun(r);gesture(r,{green:true});r.step(5100);const pre=+r.get(H);
 r.step(1,{inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});r.step(pw-1);r.setInputs({inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false});
 let mn=1;for(let i=0;i<10000;i++){r.step(1);mn=Math.min(mn,+r.get(H));}
 console.log(n.padEnd(12),'pulse',String(pw).padStart(3),'ms: pre HVreq',pre,'| +10s:',r.ph(),r.sts(),'C2',+r.get('out_HV_C2'),'STO',+r.get('STO_DR1'),'HVreq',+r.get(H),'minHVreq',mn);
}
