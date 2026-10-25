// v2-reviewer S4: Emergency energy-off timing, Config vs R&D vs Run (model evidence)
import {program} from '../../../test/helpers/catalog-program.js';
const P=program();const BY='inPLC_BypassC1C2';
const mk={CFG:()=>{const x=P.safe();x.step({[BY]:true},1000);return x;},RND:()=>P.rnd(),RUN:()=>P.run()};
for(const k of ['CFG','RND','RUN']){const x=mk[k]();const a=x.t;x.step({in_ES_NC_1:false},10000);
 const ch=n=>{const r=[];let p;for(const s of x.seg(a-1)){if(s[n]!==p){r.push((s.t-a)+':'+(s[n]?1:0));p=s[n];}}return r.join(' ');};
 console.log(k,'| C1',ch('out_LV_C1'),'| C2',ch('out_HV_C2'),'| STO',ch('STO'),'| HVD',ch('out_HV_Discharge_Request'),'| LVD',ch('out_LV_Discharge_Request'),'| stg',[...new Set(x.seg(a-1).map(s=>s.stg))].join('>'));}
