import * as L from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/e2-lifecycle.js';
const {BOTH,GREEN,OFF}=L;
const sym=['b_Step12_Set','b_EStop_Ok'];
function tr(x,label,from){const seg=x.log.filter(s=>s.t>=from);const u1=L.firstAt(seg,s=>s.out.out_LV_C1);
 for(const s of seg.filter(s=>s.t>=u1-5&&s.t<=u1+3))console.log(label,'t-u1=',s.t-u1,'stages',s.stages.join('+'),'C1',+!!s.out.out_LV_C1,'LVreq',+!!s.out.out_LV_Discharge_Request,'STO',+!!s.out.STO_DR1, 'g2?',x.__g2?.[s.t]);}
// scenario: R&D -> Safe (green 600), steady Safe, BOTH
const x=L.cached('RnD');x.step(GREEN,600);x.step(OFF,3000);
console.log('stages',x.stageSet(),'LVreq',x.get('out_LV_Discharge_Request'));
const g2={};const p=x.t+1;
for(let i=0;i<1100;i++){x.step(BOTH);g2[x.t]=x.get('b_Step12_Set');}
for(let i=0;i<2500;i++){x.step(OFF);g2[x.t]=x.get('b_Step12_Set');}
x.__g2=g2;tr(x,'RnD->Safe->BOTH',p);
