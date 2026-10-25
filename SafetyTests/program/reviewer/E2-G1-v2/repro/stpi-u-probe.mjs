// Reviewer G1 v2 probe (diagnostic, split mode on canonical; not an oracle): order of C2 ON / STO release at R&D->Run
// acceptance and C2_FBK value at u+1 (STP-I tc definition).
import * as L from '../../../../test/helpers/e2-lifecycle.js';
const b=L.cached('RnD',{c3:true});const x=b.fork();const p=x.t+1;x.step(L.BOTH,1100);x.step(L.OFF,3000);
const seg=x.log.filter(s=>s.t>=p);
const f=k=>L.firstAt(seg,s=>s.out[k]);const u=L.firstAt(seg,s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);
const fb=L.firstAt(seg,s=>s.c2fbk);
console.log(JSON.stringify({p,u,c2on:f('out_HV_C2'),sto1:f('STO_DR1'),c2fbkOn:fb,c2fbkAt_u1:x.log.find(s=>s.t===u+1)?.c2fbk,run:L.firstAt(seg,s=>s.statuses.includes('STS_RUN'))}));
