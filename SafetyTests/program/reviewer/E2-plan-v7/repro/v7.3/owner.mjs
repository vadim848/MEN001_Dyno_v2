import {mk} from './fix.mjs';import {toRun} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/cand.mjs';
const own='//Network6/RUN_DOWN_OWNER/RsOut';
for(const c of ['E2b','E2d'])for(const v of [null,{}]){const r=mk(c,v);toRun(r);const P=r.t+1;r.step(1,{in_Reset_PB:true});const f={};
 for(let i=0;i<3000;i++){r.step(1);if(i===600)r.setInputs({in_Reset_PB:false});const k={own:r.get(own),linkOwner:r.get('linkRunDownOwner'),SS1:!r.get('out_SS1_DR1')||!r.get('out_SS1_DR2'),STOset:!r.get('STO_DR1'),HVdis:r.get('out_HV_Discharge_Request'),UL:r.get('out_Door_Unlock_Solonoeid')};for(const [n,val] of Object.entries(k))if(f[n]==null&&val)f[n]=r.t-P;}
 console.log(c,v?'+v7.3':'',JSON.stringify(f));}
