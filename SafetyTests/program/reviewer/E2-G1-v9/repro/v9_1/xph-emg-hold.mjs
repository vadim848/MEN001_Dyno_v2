// Reviewer probe (G1 v9.1): XPH-01 emergency combination with the cause held H ms (6000 vs 12000) - why is the Restart rejected at 6 s?
const L=await import('file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/e2-lifecycle.js');
const {BOTH,OFF}=L;const P10={inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:false};
for(const H of [3000,6000,8000,10000,12000]){
 const x=L.cached('Safe');x.step(OFF,2100);const t1=x.t+1;let A1=null;
 x.step(P10);while(A1==null){if(x.get('b_Step12')||x.get('out_LV_C1'))A1=x.t;else x.step();}
 const f=A1+10,e=A1+200;while(x.t<e+H){const n=x.t+1;const o={};if(n>=f&&n<e+3000)Object.assign(o,BOTH);if(n===e+3000)Object.assign(o,OFF);if(n===e)o.in_Estop_PLC=true;x.step(o);}
 x.step({in_Estop_PLC:false,inPLC_RnD_Mode:false},1);x.step(OFF,100);
 const em=x.log.filter(q=>q.t>=e).find(L.isEmg)?.t;const s=x.snap();const msgs=[];const c=(ok,m)=>{if(!ok)msgs.push(m.slice(0,200));};c.nv=()=>{};
 L.restartToSafe(x,c,'');
 const on=['out_LV_C1','out_HV_C2','out_C3_BatRelay','out_RBM_Bat','STO_DR1','STO_DR2'].filter(k=>s.out[k]);
 console.log(JSON.stringify({H,A1,e,em,pre:{on,c1fbk:s.c1fbk,c2fbk:s.c2fbk,st:s.stages,ss:s.statuses,lvDis:s.out.out_LV_Discharge_Request},fails:msgs}));}
