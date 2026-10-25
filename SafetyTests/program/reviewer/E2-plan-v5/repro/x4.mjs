// Reviewer v5: E2a-RC against CRITERIA_DELTA_v7 §4.1 RC-5/RC-6/RC-7(window) and §4.2 (R&D), v5 prototype + M-E2a-21 (swap) and
// M-E2a-26 (full "old scheme" rewire). u = first scan out_HV_C2 TRUE (scan index), Run = first scan b_Step3. Model only.
import {build} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/proto.mjs';
import {SalRuntime} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-runtime.js';
import {raw0} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/h.mjs';
function rt(mut){const {m}=build({});const B=new Map(m.networks.flatMap(n=>n.blocks).map(b=>[b.path,b]));
 const seq=()=>[...B.values()].filter(b=>b.orderOfExecution>0).sort((a,b)=>a.orderOfExecution-b.orderOfExecution);
 const renum=a=>a.forEach((b,i)=>b.orderOfExecution=i+1);
 if(mut==='M21'){const a=seq();const f=B.get('//Network12/FBAnd6');const r=a.filter(b=>b!==f);r.splice(r.indexOf(B.get('//Network12/FBTon3'))+1,0,f);renum(r);}
 if(mut==='M26'){// TON fed by window; FBAnd6 = TonOut & FBK & HV after TON, feeding DecIn1..4 + Symbol
  const w=B.get('//Network12/WIN_C2'),t=B.get('//Network12/FBTon3'),f=B.get('//Network12/FBAnd6');
  const ti=t.inputs.find(p=>p.name==='TonIn');const fi=f.inputs.find(p=>p.name==='AndIn1');
  for(const o of [w.outputs[0],f.outputs[0],t.outputs[0]])o.targets=o.targets.filter(x=>x!==ti.path&&x!==fi.path);
  ti.sources=[w.outputs[0].path];w.outputs[0].targets.push(ti.path);fi.sources=[t.outputs[0].path];t.outputs[0].targets.push(fi.path);
  const dec=t.outputs[0].targets.filter(x=>x.includes('FBDecouple2'));t.outputs[0].targets=t.outputs[0].targets.filter(x=>!x.includes('FBDecouple2'));
  for(const d of dec){const p=[...B.values()].flatMap(b=>b.inputs).find(q=>q.path===d);p.sources=[f.outputs[0].path];f.outputs[0].targets.push(d);}
  f.outputs[0].globals=t.outputs[0].globals;t.outputs[0].globals=[];
  const a=seq();const r=a.filter(b=>b!==f);r.splice(r.indexOf(t)+1,0,f);renum(r);}
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false});r.setInputs({...raw0});
 r.step=(n=1,inp,hold={})=>{if(inp)r.setInputs(inp);for(let i=0;i<n;i++){r.setInputs({in_LV_C1_FBK:r.get('out_LV_C1'),in_HV_C2_FBK:r.get('out_HV_C2'),in_STO_DR1_FBK:!r.get('STO_DR1'),in_STO_DR2_FBK:!r.get('STO_DR2'),...hold});r.scan(1);}return r;};return r;}
const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const gest=r=>{r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(1100);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});};
// fbk(x)/hv(x): functions of x = scans since u (x=0 is scan u)
function runCase(mut,fbk,hvBad){const r=rt(mut);boot(r);gest(r);r.step(2500);r.step(2100);
 let u=-1,run=-1,a4=-1,emg=-1;r.setInputs({in_Reset_PB:true,in_Relase_Door_PB:true});
 for(let i=0;i<5000;i++){if(i===1100)r.setInputs({in_Reset_PB:false,in_Relase_Door_PB:false});
  const x=u<0?-1:i-u; const hold={in_HV_C2_FBK:u<0?false:fbk(x),in_HV_Healthy_FBK:u<0?false:hvBad(x)};
  r.step(1,undefined,hold);
  if(a4<0&&r.get('//Network12/FBAnd4/AndOut'))a4=i;if(u<0&&r.get('out_HV_C2'))u=i;if(u>=0&&run<0&&r.get('b_Step3'))run=i-u;if(u>=0&&emg<0&&!r.get('b_EStop_Ok'))emg=i-u;}
 return `FBAnd4 rise rel u: ${a4-u}; Run u+${run}${emg>=0?' EMG u+'+emg:''}`;}
const T=()=>true,F=()=>false;
const cases=[['RC-5(i) FBK from u+1',x=>x>=1,F],['RC-5(iii) FBK from u+400',x=>x>=400,F],['RC-5(v) FBK from u+499',x=>x>=499,F],
 ['RC-5(iv) HV Faulty until u+2999',x=>x>=1,x=>x<=2999],['late FBK from u+700',x=>x>=700,F],
 ['RC-5(vi) FBK dip u+100..110',x=>x>=1&&!(x>=100&&x<=110),F],
 ['RC-6 HV 1 scan u+550',x=>x>=1,x=>x===550],['RC-6 HV u+550..569',x=>x>=1,x=>x>=550&&x<=569],['RC-6 HV 1 scan u+599',x=>x>=1,x=>x===599],
 ['RC-6 HV in window u+51',x=>x>=1,x=>x===51],['RC-7 FBK 1 scan dip u+51 (window)',x=>x>=1&&x!==51,F],
 ['RC-7 FBK dip u+550 (after window; v7 wants EMG)',x=>x>=1&&x!==550,F]];
for(const mut of ['base','M21','M26'])for(const [n,f,h] of cases)console.log(mut.padEnd(5),n.padEnd(48),runCase(mut,f,h));
