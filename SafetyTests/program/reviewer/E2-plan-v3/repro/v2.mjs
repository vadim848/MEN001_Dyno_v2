// Reviewer v3: (A) g5 (SR->S1) vs g7 (SR->S4) same-scan collision at end of R&D->Safe; (B) cover in SU without FBAnd16 move.
import {rt,gesture} from '../../../architect/E2-status/repro/run.mjs';
import {build} from '../../../architect/E2-status/repro/proto.mjs';
import {SalRuntime} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-runtime.js';
import {raw0} from '../../../architect/E2-status/repro/h.mjs';
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const toRnd=(r)=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
function down(r){toRnd(r);gesture(r,{green:true,ms:600});}
// dry run
let r=rt({}); down(r); let t5=null; for(let i=0;i<6000;i++){r.step(1); if(r.get('b_Step2_Set_2')){t5=r.t;break;}}
console.log('dry: g5 first true at t',t5,'phase',r.ph());
for(const [name,inp,len] of [['PLC pulse',{in_Estop_PLC:true},1],['PLC pulse',{in_Estop_PLC:true},2],['LVcon drop',{in_LV_Connector_Interlock:false},1],['LVcon drop',{in_LV_Connector_Interlock:false},2],['LVcon drop',{in_LV_Connector_Interlock:false},3],['ES1 pulse',{in_ES_NC_1:false},1]]){
 for(const off of [-3,-2,-1,0,1]){
  const r=rt({}); down(r); const start=t5+off; while(r.t<start-1) r.step(1);
  const rel=Object.fromEntries(Object.keys(inp).map(k=>[k,!inp[k]]));
  r.step(len,inp); r.step(1,rel); let both=''; for(let i=0;i<14000;i++){r.step(1); const st=['b_Step1','b_Step4','b_Step5','b_Step6','b_Step_RnD','b_Step12','b_Step3'].filter(s=>r.get(s)); if(st.length>1&&!both)both=r.t+':'+st.join('+');}
  console.log(name.padEnd(10),'len',len,'event at g5'+(off>=0?'+':'')+off,'-> end',r.ph().padEnd(8),'C1',+r.get('out_LV_C1'),'viol',r.viol.length,r.viol[0]||'',both?'MULTI '+both:'');
 }
}
// (B) SU + NC1 with N12/FBAnd16 left late (plan text has no move) vs proto (moved)
function rtLate(){const {m}=build({}); const b=m.networks.flatMap(n=>n.blocks).find(b=>b.path==='//Network12/FBAnd16'); const mx=Math.max(...m.networks.flatMap(n=>n.blocks).map(b=>b.orderOfExecution)); b.orderOfExecution=mx+1;
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false}); r.setInputs({...raw0}); r.t=0; r.hold={}; r.viol=[]; r.plantC2=true;
 r.step=(n=1,inp)=>{if(inp)r.setInputs(inp);for(let i=0;i<n;i++){const pl={in_LV_C1_FBK:r.get('out_LV_C1'),in_STO_DR1_FBK:!r.get('STO_DR1'),in_STO_DR2_FBK:!r.get('STO_DR2')};if(r.plantC2)pl.in_HV_C2_FBK=r.get('out_HV_C2');r.setInputs({...pl,...r.hold});r.scan(1);r.t++;}return r;};
 r.ph=()=>['b_Step1','b_Step12','b_Step_RnD','b_Step3','b_Step4','b_Step5','b_Step6'].filter(s=>r.get(s)).join('+'); return r;}
for(const [n,mk] of [['proto (FBAnd16 moved)',()=>rt({})],['FBAnd16 late (plan text)',rtLate]]){
 for(const c of [{in_InterLock_NC_1:false},{in_Estop_PLC:true}]){
  const r=mk(); r.plantC2=false; r.hold={in_HV_C2_FBK:false}; toRnd(r); gesture(r,{green:true,blue:true,ms:1100}); r.step(50);
  const tau={}; r.step(1,c); for(let i=1;i<=9000;i++){ for(const o of ['b_EStop_Ok','b_Step4','out_LV_C1','STO_DR1','out_HV_C2']) if(tau[o]===undefined&&!r.get(o))tau[o]=i; r.step(1);} console.log('SU',n.padEnd(26),JSON.stringify(c),JSON.stringify(tau));
 }
}
