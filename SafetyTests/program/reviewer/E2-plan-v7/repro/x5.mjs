// Reviewer v7 x5: legacy PLC R&D->Run (1,1) with plant FBK following command, v7.1 gate N12/FBAnd10.AndIn3 := !C2_FBK
// vs same stack without E2d (e2d:false). Model on architect v7 proto, not native.
const base='file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/';
const {rt}=await import(base+'run.mjs');
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const sig=['out_HV_C2','in_HV_C2_FBK','STO_DR1','b_Set_HV_C2_1','out_HV_Discharge_Request'];
const tr=(r,n)=>{let prev='',log=[],t0=r.t,cnt=0;for(let i=0;i<n;i++){r.step(1);const s=r.ph()+'|'+r.sts()+'|'+sig.map(x=>x.replace(/^(out_|in_)/,'')+'='+(+!!r.get(x))).join(',');if(s!==prev){cnt++;if(log.length<14)log.push((r.t-t0)+':'+s);prev=s;}}return `changes=${cnt} `+log.join('  ');};
for(const [n,o] of [['full v7 (E2d v7.1)',{}],['stack w/o E2d',{e2d:false}]]){
 const r=rt(o);boot(r);r.step(1,{inPLC_RnD_Mode:true});r.step(3000);console.log(n,'after PLC(1,0) 3s:',r.ph(),r.sts());
 r.step(1,{inPLC_RnD_Mode_2:true});console.log(n,'PLC(1,1) 4 s:',tr(r,4000));
}
