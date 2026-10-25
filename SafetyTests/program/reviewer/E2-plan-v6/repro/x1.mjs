// Reviewer v6 x1: DIS-HOLD side cases on the architect's v6 model (and v5 model for comparison). Model, not native.
const V=process.argv[2]||'';   // '' = v6 repro, 'v5' = repro/v5
const base='file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/'+(V?V+'/':'');
const {rt,toRun,gesture}=await import(base+'run.mjs');
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const H='out_HV_Discharge_Request', L='out_LV_Discharge_Request';
const tr=(r,n,sigs)=>{let prev='',log=[],t0=r.t;for(let i=0;i<n;i++){r.step(1);const s=r.ph()+'|'+r.sts()+'|'+sigs.map(x=>x.replace('out_','').replace('_Discharge_Request','REQ')+'='+(+!!r.get(x))).join(',');if(s!==prev){log.push((r.t-t0)+':'+s);prev=s;}}return log.join('  ');};
const S=['out_HV_C2','out_LV_C1',H,L];
// A) buttons: R&D after Run->R&D (req TRUE), then emergency during StartingRun at SU+50
{const r=rt({});toRun(r);gesture(r,{green:true});r.step(5100);
 console.log('A pre: ',r.ph(),r.sts(),'HVreq',+r.get(H));
 r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});let a=-1;for(let i=0;i<1100&&a<0;i++){r.step(1);if(r.get('recRndC_SU'))a=r.t;}
 r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(48);
 r.setInputs({in_ES_NC_1:false});console.log('A ES at a+'+(r.t-a)+': ',tr(r,15000,S));}
// B) legacy PLC path: Safe -> R&D (1,0) -> Run (1,1), hold (1,1), emergency in Run
{const r=rt({});boot(r);r.step(1,{inPLC_RnD_Mode:true});r.step(3000);console.log('B R&D?',r.ph(),r.sts(),'HV',+r.get(H),'LV',+r.get(L));
 r.step(1,{inPLC_RnD_Mode_2:true});r.step(3000);console.log('B Run?',r.ph(),r.sts(),'C2',+r.get('out_HV_C2'),'HVreq',+r.get(H));
 r.setInputs({in_ES_NC_1:false});console.log('B ES in Run, PLC(1,1) held:',tr(r,15000,S));}
// C) button R&D with HV req TRUE; PLC (1,1) while cover open (legacy attempt rejected by FBAnd16)
{const r=rt({});toRun(r);gesture(r,{green:true});r.step(5100);console.log('C pre',r.ph(),r.sts(),'HVreq',+r.get(H));
 r.step(1,{in_InterLock_NC_1:false});r.step(100);r.step(1,{inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});console.log('C PLC(1,1) cover open:',tr(r,1500,S));}
// D) button Safe with LV/HV req TRUE (after R&D->Safe); emergency in Safe with PLC (1,0) held
{const r=rt({});boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);gesture(r,{green:true});r.step(4000);console.log('D pre',r.ph(),r.sts(),'HV',+r.get(H),'LV',+r.get(L));
 r.step(1,{in_ES_NC_1:false});r.step(100);r.step(1,{inPLC_RnD_Mode:true});console.log('D ES in Safe then PLC(1,0):',tr(r,1500,S.concat(['b_Step12_Set'])));}
// E) buttons: Safe->R&D does not clear HV; R&D->Run does not clear LV
{const r=rt({});toRun(r);gesture(r,{green:true});r.step(5100);gesture(r,{green:true});r.step(4000);console.log('E Safe pre',r.ph(),'HV',+r.get(H),'LV',+r.get(L));
 gesture(r,{green:true,blue:true,ms:1100});console.log('E Safe->R&D:',tr(r,2500,S));
 gesture(r,{green:true,blue:true,ms:1100});console.log('E R&D->Run:',tr(r,2500,S));}
