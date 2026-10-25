// Reviewer probe (diagnostic, not oracle): RC-5(iii) under E2_LV_HEALTHY_MODE=split - which Run scans have C2_FBK OFF.
import * as L from '../../../../test/helpers/e2-lifecycle.js';
const {BOTH,OFF}=L;const x=L.cached('RnD');x.hold={in_HV_C2_FBK:false};const p=x.t+1;let cmd=null;
for(;;){const n=x.t+1;if(cmd!=null&&x.t===cmd+399)delete x.hold.in_HV_C2_FBK;x.step({...(n===p?BOTH:{}),...(n===p+1100?OFF:{})});
 if(cmd==null&&x.get('out_HV_C2'))cmd=x.t;if(cmd!=null&&x.t>=cmd+1000)break;if(x.t>p+3000)break;}
const s=x.log.filter(s=>s.t>=cmd+395&&s.t<=cmd+405).map(s=>`u+${s.t-cmd} fbk=${s.c2fbk} run=${s.statuses.includes('STS_RUN')} C2=${s.out.out_HV_C2}`);
console.log('u',cmd);console.log(s.join('\n'));
const bad=x.log.filter(s=>s.t>=cmd&&s.statuses.includes('STS_RUN')&&!s.c2fbk).map(s=>s.t-cmd);console.log('Run with fbk OFF at u+',bad.slice(0,10),bad.length);
