import {cand,toRun,toRnd,gesture} from './cand.mjs';
// IL-05b: find t_a (owner set) in no-event run, then cover at t_a-1, t_a, t_a+1
const own='//Network6/RUN_DOWN_OWNER/RsOut';
const r0=cand('E2b');toRun(r0);console.log('E2b reach',r0.ph());r0.step(1,{in_Reset_PB:true});let ta=-1;for(let i=1;i<=700;i++){r0.step(1);if(r0.get(own)){ta=i;break;}}console.log('owner set at press+',ta);
for(const d of [-3,-2,-1,0,1]){const r=cand('E2b');toRun(r);r.step(1,{in_Reset_PB:true});for(let i=1;i<ta+d;i++)r.step(1);r.step(1,{in_InterLock_NC_1:false});const tr=[];let prev='';for(let i=0;i<9000;i++){r.step(1);const s=r.ph()+' EOk='+(+r.get('b_EStop_Ok'))+' own='+(+r.get(own));if(s!==prev){tr.push(i+':'+s);prev=s;}if(i===600)r.setInputs({in_Reset_PB:false});}console.log('cover at t_a'+(d>=0?'+':'')+d,tr.slice(0,6).join(' | '));}
