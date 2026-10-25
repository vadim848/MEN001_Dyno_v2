// Reviewer v7 x8: R6-1 residual - legacy PLC(1,1) at E+delta in R&D with HV request TRUE (no EOk gate on N12/FBAnd10). Model.
const base='file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/';
const {rt,toRun,gesture}=await import(base+'run.mjs');
const H='out_HV_Discharge_Request';
for(const cause of ['in_ES_NC_1','in_InterLock_NC_1','in_Estop_PLC'])for(const d of [-2,-1,0,1,2,5]){
 const r=rt({});toRun(r);gesture(r,{green:true});r.step(5100);
 const ev={[cause]:cause==='in_Estop_PLC'};const plc={inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true};
 let mn=1,c2=0,sto=0,t=0;const T=[];
 for(let i=-5;i<6000;i++){const inp={};if(i===0)Object.assign(inp,ev);if(i===d)Object.assign(inp,plc);r.step(1,Object.keys(inp).length?inp:undefined);
  if(i>=0){mn=Math.min(mn,+r.get(H));c2=Math.max(c2,+r.get('out_HV_C2'));sto=Math.max(sto,+r.get('STO_DR1'));}}
 console.log(cause.padEnd(18),'delta',String(d).padStart(2),'| after E: minHVreq',mn,'maxC2',c2,'maxSTOrel',sto,'end',r.ph(),r.sts(),'HVreq',+r.get(H));
}
