// Reviewer v7 x6: v7.1 FBK gate on legacy paths - per-scan comparison with gate (full v7) vs without E2d gate inputs.
// FBK = command + 1 scan (plant). Model on architect v7 proto, not native.
const base='file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/';
const {rt,toRun,gesture}=await import(base+'run.mjs');
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const sig=['out_LV_C1','in_LV_C1_FBK','out_HV_C2','in_HV_C2_FBK','STO_DR1','b_Step12_Set','b_Set_HV_C2_1','out_HV_Discharge_Request','out_LV_Discharge_Request'];
const tr=(r,n)=>{let prev='',log=[],t0=r.t,cnt=0;for(let i=0;i<n;i++){r.step(1);const s=r.ph()+'|'+r.sts()+'|'+sig.map(x=>x.replace(/^(out_|in_)/,'').replace('_Discharge_Request','REQ')+'='+(+!!r.get(x))).join(',');if(s!==prev){cnt++;if(log.length<12)log.push((r.t-t0)+':'+s);prev=s;}}return `changes=${cnt}\n    `+log.join('\n    ')+`\n    end@${n}: ${prev}`;};
const nog=[D('//Network2/FBAnd91','AndIn5'),D('//Network2/FBAnd91','AndIn6'),D('//Network12/FBAnd10','AndIn3')];
for(const [n,mut] of [['WITH v7.1 gate',[]],['WITHOUT v7.1 gate (3 inputs deactivated)',nog]]){
 {const r=rt({mut});boot(r);console.log(`[${n}] Safe PLC(1,0) 3s:`,tr(r.step(1,{inPLC_RnD_Mode:true}),3000));}
 {const r=rt({mut});boot(r);r.step(1,{inPLC_RnD_Mode:true});r.step(3000);console.log(`[${n}] R&D PLC(1,1) 30s:`,tr(r.step(1,{inPLC_RnD_Mode_2:true}),30000));}
 // with HV discharge request TRUE: button Run -> R&D (green), then PLC (1,0)->(1,1)
 {const r=rt({mut});toRun(r);gesture(r,{green:true});r.step(5100);console.log(`[${n}] pre: ${r.ph()} HVreq=${+r.get('out_HV_Discharge_Request')}`);
  r.step(1,{inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});console.log(`[${n}] R&D(HVreq=1) PLC(1,1) 30s:`,tr(r,30000));}
}
