// Reviewer v3: g5 (SR->S1) vs g7 (SR->S4) collision at end of R&D->Safe (model). t1 = first scan with b_Step1 after R&D.
import {rt} from '../../../architect/E2-status/repro/run.mjs';
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const both=(r)=>{r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(1100);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(2500);};
const prep=()=>{const r=rt({});boot(r);both(r);r.step(1,{in_Reset_PB:true});return r;};
let r=prep(); let t1=null,g5=null; for(let i=0;i<8000;i++){ if(r.t>0&&r.get('in_Reset_PB')&&i===600) r.setInputs({in_Reset_PB:false}); r.step(1); if(g5===null&&r.get('b_Step2_Set_2'))g5=r.t; if(r.get('b_Step1')){t1=r.t;break;} }
console.log('dry: b_Step2_Set_2 first seen',g5,'S1 first',t1);
const run=(inp,len,at)=>{const r=prep(); let i=0; const rel=Object.fromEntries(Object.keys(inp).map(k=>[k,!inp[k]]));
 let multi='',ph=new Set(); while(r.t<at-1){ if(i===600) r.setInputs({in_Reset_PB:false}); r.step(1); i++; }
 for(let k=0;k<len;k++){ if(i===600) r.setInputs({in_Reset_PB:false}); r.step(1,inp); i++; }
 r.setInputs(rel); if(i<=600) r.setInputs({in_Reset_PB:false});
 for(let k=0;k<14000;k++){ r.step(1); const st=['b_Step1','b_Step4','b_Step5','b_Step6','b_Step_RnD','b_Step12','b_Step3'].filter(s=>r.get(s)); ph.add(st.join('+')); if(st.length>1&&!multi)multi=r.t+':'+st.join('+'); }
 return `end ${r.ph()} C1=${+r.get('out_LV_C1')} EOk=${+r.get('b_EStop_Ok')} viol=${r.viol.length} ${r.viol[0]||''} ${multi?'MULTI '+multi:''} seen=[${[...ph].join(',')}]`;};
for(const [n,inp,len] of [['PLC',{in_Estop_PLC:true},1],['PLC',{in_Estop_PLC:true},2],['LVcon',{in_LV_Connector_Interlock:false},1],['LVcon',{in_LV_Connector_Interlock:false},2],['LVcon',{in_LV_Connector_Interlock:false},3]])
 for(let off=-4;off<=0;off++) console.log(n.padEnd(6),'len',len,'start t1'+off,run(inp,len,t1+off));
