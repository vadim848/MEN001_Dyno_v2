// Reviewer G1 v3 probe (diagnostic): apply the EMGREF-RUN check "no STS_RUN in any scan >= e" of helpers/e2-emergency.js
// emergencyChecks to the pinned reference 4495a1f (same producer/timeline as refAnchorProfile) - in_Estop_PLC in steady Run.
import * as L from '../../../../test/helpers/e2-lifecycle.js';
import * as E from '../../../../test/helpers/e2-emergency.js';
const x=L.boot(L.create({source:'ref'}));x.step(L.GREEN,2100);x.step(L.OFF);x.until(()=>x.get('b_Step3'),12000,'ref Run');x.step({},2100);L.withC3(x);
const tl=E.timeline(x,E.CAUSES.PLC);const e=tl.e;
for(const s of x.log.filter(s=>s.t>=e-1&&s.t<=e+2))console.log('t-e',s.t-e,'stages',s.stages.join('+'),'statuses',s.statuses.join('+'),'EStopOk',s.out.b_EStop_Ok);
const latch=x.log.filter(s=>s.t>=e&&s.t<=tl.latchEnd);
console.log('EMGREF-RUN check (no STS_RUN >= e, no b_Step3 > e+1):',latch.every(s=>!s.statuses.includes('STS_RUN')&&!(s.t>e+1&&s.stages.includes('b_Step3'))));
