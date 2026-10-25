// E2b-dev (v2-analyst): справка — сколько держатся C2/STO после события в StartingRun (крышка против in_Estop_PLC). Не oracle.
import * as L from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/e2-lifecycle.js';
const {BOTH,OFF}=L;
const b=L.cached('RnD',{c3:true});const p=b.t+1;
function drive(at,ev,until){const x=b.fork();for(let n=x.t+1;n<=until;n++){const inp={};if(n===p)Object.assign(inp,BOTH);if(n===p+1100)Object.assign(inp,OFF);if(at!=null&&n===at)Object.assign(inp,ev);x.step(inp);}return x;}
const ref=drive(null,{},p+3000);const u=L.firstAt(ref.x?ref.x.log:ref.log.filter(s=>s.t>=p),s=>s.out.out_HV_C2||s.out.STO_DR1);
const last=(x,k,from)=>{const s=x.log.filter(s=>s.t>=from&&s.out[k]);return s.length?s[s.length-1].t:null;};
for(const [nm,ev] of [['NC1',{in_InterLock_NC_1:false}],['EstopPLC',{in_Estop_PLC:true}],['ES_NC_1',{in_ES_NC_1:false}]])for(const d of [-1,0,1,50]){const c=u+d;const x=drive(c,ev,c+15000);
 console.log(`${nm} c=u${d>=0?'+':''}${d}: lastC2=${last(x,'out_HV_C2',c)-c} lastSTO1=${(last(x,'STO_DR1',c)??c-1)-c} lastC1=${last(x,'out_LV_C1',c)-c} firstEmg=${(x.log.find(s=>s.t>=c&&!s.out.b_EStop_Ok)?.t??NaN)-c} stagesEnd=${x.stageSet()}`);}
