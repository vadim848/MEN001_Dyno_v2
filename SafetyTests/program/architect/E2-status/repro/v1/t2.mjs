import {rt,toRun,gesture,trace} from './run.mjs';
const r=rt({});
console.log('FB',r.count,'path',toRun(r),'sts',r.sts(),'viol',r.viol.slice(0,5));
gesture(r,{green:true});
console.log('RUNDOWN',trace(r,3000,()=>'|C1='+r.get('out_LV_C1')),'viol',r.viol.slice(0,5));
r.step(2100); gesture(r,{green:true});
console.log('RND->SAFE',trace(r,2000),'viol',r.viol.slice(0,5));
// EStop in Run
const q=rt({}); toRun(q); q.step(10,{in_ES_NC_1:false});
console.log('ESTOP RUN',trace(q,12000),'viol',q.viol.slice(0,5));
// IL loss in Run
const w=rt({}); toRun(w); w.step(1,{in_InterLock_NC_1:false});
console.log('IL RUN',trace(w,12000,()=>'|EOk='+w.get('b_EStop_Ok')),'viol',w.viol.slice(0,5));
