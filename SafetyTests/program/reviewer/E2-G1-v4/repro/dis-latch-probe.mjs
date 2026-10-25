// Reviewer G1 v4 probe (diagnostic, not oracle): out_HV_Discharge_Request over the whole Emergency latch for in_Estop_PLC in steady
// Run on the pinned reference 4495a1f, and the canonical Run-down no-event trace (pulse vs level of the discharge request).
import * as L from '../../../../test/helpers/e2-lifecycle.js';
import * as E from '../../../../test/helpers/e2-emergency.js';
const r=E.refRunTrace();const {x,e,latchEnd}=r;
const tr=k=>{const seg=x.log.filter(s=>s.t>=e&&s.t<=latchEnd);const ch=[];let prev=r.pre.out[k];for(const s of seg){if(s.out[k]!==prev){ch.push(`+${s.t-e}:${s.out[k]}`);prev=s.out[k];}}return ch.join(' ');};
for(const k of ['out_HV_Discharge_Request','out_LV_Discharge_Request','out_HV_C2','STO_DR1','out_SS1_DR1','out_LV_C1'])console.log('REF Run+PLC',k,'pre',r.pre.out[k],'changes',tr(k));
console.log('latch length',latchEnd-e);
