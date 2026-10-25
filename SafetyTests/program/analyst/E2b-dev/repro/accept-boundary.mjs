// E2b-dev (v2-analyst): факт кандидата вокруг точки принятия для границ IL-02 (R&D->Run, крышка) и EMG4-03 (Safe->R&D, connector).
// Справка о поведении кандидата, не oracle. Запуск: E2_SOURCE_ROOT=<root> node accept-boundary.mjs
import * as L from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/e2-lifecycle.js';
const {BOTH,OFF}=L;
const emg=s=>!s.out.b_EStop_Ok||s.statuses.includes('STS_EMG')||s.stages.some(v=>['b_Step4','b_Step5','b_Step6'].includes(v));
function drive(base,p,at,inpEv,until,syms){const x=base.fork();const rows=[];for(let n=x.t+1;n<=until;n++){const inp={};if(n===p)Object.assign(inp,BOTH);if(n===p+1100)Object.assign(inp,OFF);
 if(at!=null&&n===at)Object.assign(inp,inpEv);x.step(inp);rows.push({t:n,sy:Object.fromEntries(syms.map(k=>[k,x.get(k)]))});}return {x,rows};}
function row(s,sy){return `t=${s.t} st=${s.stages.join('+')} sts=${s.statuses.join('+')} EOk=${+!!s.out.b_EStop_Ok} C1=${+!!s.out.out_LV_C1} C2=${+!!s.out.out_HV_C2} STO=${+!!s.out.STO_DR1}${+!!s.out.STO_DR2} `+Object.entries(sy||{}).map(([k,v])=>k+'='+(+!!v)).join(' ');}
function summary(x,from,until){const seg=x.log.filter(s=>s.t>=from&&s.t<=until);const e=seg.find(emg);
 const rel=seg.filter(s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);const c1=seg.filter(s=>s.out.out_LV_C1);
 return `firstEmg=${e?e.t:'none'} C2/STO scans=${rel.length}${rel.length?' ['+rel[0].t+'..'+rel[rel.length-1].t+']':''} run=${seg.some(s=>s.statuses.includes('STS_RUN'))} rnd=${seg.some(s=>s.stages.includes('b_Step_RnD'))} C1scans=${c1.length}${c1.length?' ['+c1[0].t+'..'+c1[c1.length-1].t+']':''}`;}
// A. R&D -> Run, cover NC1 FALSE (held) at c
{const b=L.cached('RnD',{c3:true});const p=b.t+1;const syms=['recRndC_SU','b_EStop_Ok'];
 const ref=drive(b,p,null,{},p+3000,syms);const seg=ref.x.log.filter(s=>s.t>=p);
 const u=L.firstAt(seg,s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);const su=ref.rows.find(r=>r.sy.recRndC_SU)?.t;
 console.log(`A ref: p=${p} SU first=${su} (p+${su-p}) u=${u} (p+${u-p}) a=SU? u-su=${u-su}`);
 for(const s of ref.x.log.filter(s=>s.t>=su-2&&s.t<=u+2))console.log('  ref',row(s,ref.rows.find(r=>r.t===s.t)?.sy));
 for(const d of [-3,-2,-1,0,1]){const c=u+d;const r=drive(b,p,c,{in_InterLock_NC_1:false},c+6000,syms);
  console.log(`A NC1 at c=u${d>=0?'+':''}${d} (=SU${c-su>=0?'+':''}${c-su}): `+summary(r.x,c,c+6000));
  for(const s of r.x.log.filter(s=>s.t>=c-1&&s.t<=c+4))console.log('   ',row(s,r.rows.find(q=>q.t===s.t)?.sy));}}
// B. Safe -> R&D, LV/HV connector FALSE (held) at e
for(const sig of ['in_LV_Connector_Interlock','in_HV_Connector_Interlock']){const b=L.cached('Safe');const p=b.t+1;const syms=['b_Step12_Set','b_EStop_Ok'];
 const ref=drive(b,p,null,{},p+3000,syms);const seg=ref.x.log.filter(s=>s.t>=p);
 const u=L.firstAt(seg,s=>s.out.out_LV_C1);const g2=ref.rows.find(r=>r.sy.b_Step12_Set)?.t;const a=L.firstAt(seg,s=>s.stages.includes('b_Step12')||s.out.out_LV_C1);
 console.log(`B ${sig} ref: p=${p} g2=${g2} (p+${g2-p}) a1(S12|C1)=${a} u1=${u}`);
 for(const s of ref.x.log.filter(s=>s.t>=g2-1&&s.t<=u+2))console.log('  ref',row(s,ref.rows.find(r=>r.t===s.t)?.sy));
 for(const d of [-3,-2,-1,0,1]){const e=u+d;const r=drive(b,p,e,{[sig]:false},e+6000,syms);
  console.log(`B ${sig} at e=u1${d>=0?'+':''}${d} (=a1${e-a>=0?'+':''}${e-a}): `+summary(r.x,e,e+6000));
  for(const s of r.x.log.filter(s=>s.t>=e-1&&s.t<=e+4))console.log('   ',row(s,r.rows.find(q=>q.t===s.t)?.sy));}}
