// Reviewer v7.2 x11: FBOrFbk10C2 edge cases, M-E2d-14/15/16 kills, isolation N12/FBOr1.OrIn2. Model on architect proto v7.2.
const base='file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/';
const {rt,toRun,gesture}=await import(base+'run.mjs');
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const toRnd=(r)=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
const st=r=>`${r.ph()}/${r.sts()} C2=${+r.get('out_HV_C2')} STO=${+r.get('STO_DR1')} HVreq=${+r.get('out_HV_Discharge_Request')}`;
const M={base:[],'M14':[D('//Network12/FBAnd10','AndIn3')],'M15':[D('//Network12/FBOrFbk10C2','OrIn2')],'M16':[D('//Network12/FBOrFbk10C2','OrIn1')],'ISO':[D('//Network12/FBOr1','OrIn2')]};
const sc={
 legacyPos:(m)=>{const r=rt({mut:m});toRnd(r);r.setInputs({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});r.step(3000);return st(r);},
 unsolicited:(m)=>{const r=rt({mut:m});toRnd(r);r.plantC2=false;r.hold={in_HV_C2_FBK:true};r.step(600);r.setInputs({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});r.step(3000);return st(r);},
 // welded: Run->R&D by green (descent), C2_FBK stays ON after C2 OFF, then PLC(1,1) at +3000
 weldedAfterDescent:(m)=>{const r=rt({mut:m});toRun(r);r.plantC2=false;r.hold={in_HV_C2_FBK:true};gesture(r,{green:true});r.step(8000);const pre=st(r);r.setInputs({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});r.step(3000);return 'pre '+pre+' -> '+st(r);},
 // PLC (1,1) held during whole Run->R&D descent by green (level repeat): when out_HV_C2 still TRUE in R&D?
 heldThroughDescent:(m)=>{const r=rt({mut:m});toRun(r);r.setInputs({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});r.step(10);gesture(r,{green:true});let rndC2=0,first='';for(let i=0;i<12000;i++){r.step(1);if(r.get('b_Step_RnD')&&r.get('out_HV_C2')&&!first)first='R&D with C2 at +'+i;}return (first||'no R&D+C2')+' end '+st(r);},
 buttonRun:(m)=>{const r=rt({mut:m});toRnd(r);r.step(2100);gesture(r,{green:true,blue:true,ms:1100});r.step(3000);return st(r);},
 stuckThenPLC:(m)=>{const r=rt({mut:m});toRnd(r);r.setInputs({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});r.step(50);r.setInputs({inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false});r.step(3000);const pre=st(r);r.setInputs({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});r.step(3000);return 'pre '+pre+' -> '+st(r);}
};
for(const [k,f] of Object.entries(sc))for(const [n,m] of Object.entries(M)){ if(k==='buttonRun'&&!['base','ISO','M16'].includes(n))continue; console.log(k.padEnd(20),n.padEnd(5),f(m)); }
