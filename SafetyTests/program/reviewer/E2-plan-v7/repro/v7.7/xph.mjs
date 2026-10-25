import {cand,boot} from './cand.mjs';
import {fix} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/c10.mjs';
const V={v76:null,v77:m=>fix(m),mutOr1:m=>fix(m,{mut:'ph.OrIn1'}),mutOr3:m=>fix(m,{mut:'pfset.OrIn3'})};
function xph(v,{f,d=0,gf=false,hold=1100,f2=null,n=8000}){const r=cand('E2d76',V[v]);boot(r);r.step(2400);const [b1,b2]=gf?['in_Reset_PB','in_Relase_Door_PB']:['in_Relase_Door_PB','in_Reset_PB'];let su=null,run=null,rnd=null,emg=false;
 for(let k=0;k<n;k++){const i={};if(k===0)i.inPLC_RnD_Mode=true;if(k===600)i.inPLC_RnD_Mode=false;if(f!=null){if(k===f)i[b1]=true;if(k===f+d)i[b2]=true;if(k===f+d+hold){i.in_Reset_PB=false;i.in_Relase_Door_PB=false;}}
  if(f2!=null){if(k===f2)i.in_Relase_Door_PB=true;if(k===f2+100)i.in_Reset_PB=true;if(k===f2+1200){i.in_Reset_PB=false;i.in_Relase_Door_PB=false;}}
  r.step(1,i);if(su==null&&r.get('recRndC_SU'))su=k;if(run==null&&r.get('b_Step3'))run=k;if(rnd==null&&r.get('b_Step_RnD'))rnd=k;if(!r.get('b_EStop_Ok'))emg=true;}
 return `R&D ${rnd} SU ${su??'-'} Run ${run??'-'}${emg?' EMG':''}`;}
const A1=2,R=603;
const rows=[['A1+10',{f:12}],['A1+300 d250 green-first',{f:302,d:250,gf:true}],['R-1',{f:R-1}],['R-1 d250',{f:R-1,d:250}],['R (obs)',{f:R}],['R+1',{f:R+1}],['first R-100, second after R (d250)',{f:R-100,d:250}],['A1+10 hold through R +3000',{f:12,hold:3700}],
 ['repeat g+1999',{f:12,f2:12+1100+1999}],['repeat g+2000',{f:12,f2:12+1100+2000}],['repeat g+2001',{f:12,f2:12+1100+2001}]];
for(const [n,o] of rows)console.log(n.padEnd(36),'v7.6:',xph('v76',o).padEnd(32),'v7.7:',xph('v77',o).padEnd(32),'mutOrIn1:',xph('mutOr1',o));
