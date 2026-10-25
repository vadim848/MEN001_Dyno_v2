import {make,phases} from './sim.mjs';
const OWN='//Network6/RUN_DOWN_OWNER/RsOut';
const A=make('F1').r,B=make('MU10').r;const both=f=>{f(A);f(B);};
const ph=r=>phases.filter(p=>r.get(p)).join('+');
let t=0,diff=null,ev=[];let prevA='';
function step(inp){if(inp)both(r=>r.setInputs(inp));both(r=>r.scan(1));t++;
 for(const [k,v] of A.values)if((k.startsWith('var:')||k.includes('RUN_DOWN'))&&B.values.get(k)!==v&&!diff)diff={t,k};
 const p=ph(A)+'|own='+(+A.get(OWN))+'|permit='+(+A.get('linkRndGatePermit'))+'|rndSet='+(+A.get('b_Step_RnD_Set'));if(p!==prevA){ev.push(t+':'+p);prevA=p;}}
step({in_Reset_PB:true});for(let i=0;i<800;i++)step();step({in_Reset_PB:false});
for(let i=0;i<20;i++)step({in_HV_C2_FBK:false});
for(let i=0;i<300;i++)step({in_LV_C1_FBK:false});
step({in_LV_Healthy_FBK:true,in_LV_C1_FBK:true});for(let i=0;i<6000;i++)step();
console.log(JSON.stringify({firstDivergence:diff,finalA:ph(A),finalB:ph(B)}));console.log(ev.slice(0,30).join('\n'));
