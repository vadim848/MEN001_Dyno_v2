import * as L from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/e2-lifecycle.js';
const {BOTH,GREEN,OFF}=L;
function scen(eOff){ // eOff: ES FALSE from scan p+eOff (null = none)
 const x=L.cached('RnD');x.step(GREEN,600);x.step(OFF,3000);const p=x.t+1;const g2={},eok={};
 for(let i=0;i<9000;i++){const n=x.t+1;const inp=i<1100?{...BOTH}:{...OFF};if(eOff!=null&&n-p>=eOff&&n-p<eOff+100)inp.in_ES_NC_1=false;x.step(inp);g2[x.t]=+!!x.get('b_Step12_Set');eok[x.t]=+!!x.get('b_EStop_Ok');}
 const seg=x.log.filter(s=>s.t>=p);return {x,p,seg,g2,eok};}
const b=scen(null);const u1=L.firstAt(b.seg,s=>s.out.out_LV_C1);const G=+Object.keys(b.g2).find(t=>b.g2[t]);
console.log('base: p',b.p,'g2-p',G-b.p,'u1-p',u1-b.p);
for(const d of [-3,-2,-1,0,1,2,3,10,700]){const e=G-b.p+d;const r=scen(e);const tt=r.p+e;
 const row=r.seg.filter(s=>s.t>=tt-1&&s.t<=tt+6).map(s=>`${s.t-tt}:${s.stages.join('+')||'-'} g2${r.g2[s.t]} eok${r.eok[s.t]} C1${+!!s.out.out_LV_C1} req${+!!s.out.out_LV_Discharge_Request}`);
 const off=r.seg.filter(s=>s.t>=tt-1&&!s.out.out_LV_Discharge_Request);
 console.log(`e=g2${d>=0?'+':''}${d}`, 'anyFALSE after e-1:',off.length? (off[0].t-tt)+'..'+(off.at(-1).t-tt)+' n='+off.length:'none','C1 ever',r.seg.some(s=>s.t>=tt&&s.out.out_LV_C1));console.log('  ',row.join(' | '));}
