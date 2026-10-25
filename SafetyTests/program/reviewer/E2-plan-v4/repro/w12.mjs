// Reviewer v4: targeted g5/g7 coincidence probe (M-E2b-30). g5 = b_Step2_Set_2 (N12/FBAnd15), g7 = b_Step4_Set.
// Find scan k of g5 in base R&D->Safe; apply 1..2-scan pulses of each cause ending at k-2..k+1; report g5&g7 same scan and S1&S4.
import {rt,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const prep=r=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);r.step(2100);r.step(1,{in_Reset_PB:true});return r.t;};
let kg5;{const r=rt({});const t0=prep(r);for(let i=0;i<3000;i++){r.step(1,r.t-t0===600?{in_Reset_PB:false}:undefined);if(r.get('b_Step2_Set_2')){kg5=r.t-t0;break;}}console.log('base: g5 first TRUE at press+'+kg5);}
const causes={PLC:['in_Estop_PLC',true],LVc:['in_LV_Connector_Interlock',false],HVc:['in_HV_Connector_Interlock',false],ES1:['in_ES_NC_1',false],ES2:['in_ES_NC_2',false],Mentee:['in_Mentee_EStop',true]};
for(const mut of [[],[{op:'deactivate-input',block:'//Network3/FBOr1',port:'OrIn4'}]]){const rows=[];
 for(const [cn,[k,v]] of Object.entries(causes))for(let len=1;len<=2;len++)for(let s=kg5-4;s<=kg5+1;s++){
  const r=rt({mut});const t0=prep(r);let co=false,both=false;
  for(let i=0;i<3000;i++){const rel=r.t-t0;let inp;if(rel===600)inp={in_Reset_PB:false};if(rel===s)inp={...(inp||{}),[k]:v};if(rel===s+len)inp={...(inp||{}),[k]:!v};r.step(1,inp);if(r.get('b_Step2_Set_2')&&r.get('b_Step4_Set'))co=true;if(r.get('b_Step1')&&r.get('b_Step4'))both=true;}
  if(co||both||r.viol.length)rows.push(`${cn} len${len} start k${s-kg5>=0?'+':''}${s-kg5}: g5&g7=${co} S1&S4=${both} viol=${r.viol.length} end ${r.ph()}`);}
 console.log((mut.length?'MUT FBOr1.OrIn4':'BASE').padEnd(16),'runs',6*2*6,'hits',rows.length);rows.forEach(x=>console.log('  ',x));}
