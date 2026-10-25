import {make,raw0} from './sim.mjs';
const [,,mut,runs='40',scans='4000',seedBase='1']=process.argv;
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const names=Object.keys(raw0);
const weights=Object.fromEntries(names.map(n=>[n,1]));Object.assign(weights,{in_Reset_PB:12,in_Relase_Door_PB:6,in_HV_C2_FBK:4,in_LV_C1_FBK:3,in_LV_Healthy_FBK:3,in_HV_Healthy_FBK:3,in_STO_DR1_FBK:2,in_STO_DR2_FBK:2,in_False_SI2_CH8:2});
const total=Object.values(weights).reduce((a,b)=>a+b,0);
const seeds=['b_Step3','b_Step3','b_Step3','b_Step_RnD','b_Step12','b_Step1'];
let diverged=0,ownerHigh=0,res=[],rndSet=0,rndSetOwnerPrev=0,s4Owner=0,falseOwner=0;
for(let i=0;i<+runs;i++){
 const R=rng(+seedBase*1000+i),seed=seeds[i%seeds.length];
 const A=make('F1',{seed}).r,B=make(mut,{seed}).r;
 let next=0,first=null;const cur={...raw0};
 for(let s=0;s<+scans;s++){
  if(s>=next){let x=R()*total,n;for(n of names){x-=weights[n];if(x<=0)break;}
   // "return to nominal" bias for safety inputs so run continues
   cur[n]=R()<0.5?!cur[n]:raw0[n]; if(R()<0.15)for(const k of names)if(!['in_Reset_PB','in_Relase_Door_PB'].includes(k))cur[k]=raw0[k];
   A.setInputs(cur);B.setInputs(cur);next=s+1+Math.floor(R()<0.3?R()*4:R()*900);}
  const op=A.get('//Network6/RUN_DOWN_OWNER/RsOut');A.scan(1);B.scan(1);if(A.get('//Network6/RUN_DOWN_OWNER/RsOut'))ownerHigh++;if(A.get('b_Step_RnD_Set')){rndSet++;if(op)rndSetOwnerPrev++;}if(op&&A.get('b_Step4_Set'))s4Owner++;if(op&&cur.in_False_SI2_CH8)falseOwner++;
  for(const [k,v] of A.values){if(k.startsWith('var:')||k.includes('/Network3/')||k.includes('RUN_DOWN'))if(B.values.get(k)!==v){first={scan:s,k,seed};break;}}
  if(first)break;}
 if(first){diverged++;res.push(first);}
}
console.log(JSON.stringify({mut,runs:+runs,scans:+scans,diverged,ownerHighScans:ownerHigh,rndSet,rndSetOwnerPrev,s4Owner,falseOwner,examples:res.slice(0,5)}));
