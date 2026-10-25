// Reviewer G1 v4 (diagnostic, not oracle): helper behaviour for a Discharge request PULSE performed in W_N before e and
// dropped before e (q_N+1 < e): EMGRDL hands it to the base rule L2 (+7008 window) - tester refinement, not in v5/v6.
import * as RL from '../../../../test/helpers/e2-rule-l.js';
const e=20000,q=e-500,K='out_HV_Discharge_Request';
const log=[{t:q,out:{[K]:true}},{t:q+1,out:{[K]:true}},{t:e-1,out:{[K]:false}}];
for(const [nm,x] of [['no re-request after e',null],['re-request at e+3',3],['re-request at e+7008',7008]]){
 const list=[];const c=(ok,m)=>{if(!ok)list.push(m);};const X={status:1,[K]:x};
 const rd=RL.EMGRDL(c,X,{e,qN:{[K]:q},run:{...RL.REF_RUN_PLC},log,end:e+10000,mode:'A'});
 RL.L2(c,X,{...RL.REF_RUN_PLC},'',()=>{},{skip:rd.skip});const d=list.filter(m=>m.includes(K));console.log(nm,'->',d.length?'FAIL: '+d.join(' | '):'PASS (for '+K+')');}
