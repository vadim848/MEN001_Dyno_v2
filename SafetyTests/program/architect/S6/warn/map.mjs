// Map 95 Verify "last update cycle" warnings (lead/S6/VERIFY_RESULT_3.md) to canonical E6v FB/ports;
// classify PRE-EXISTING (REF 4495a1f or F1 fixture) vs NEW (first candidate stage). Match by instanceName key AND by block Id key.
// usage: REFDIR=<dir with git-show 4495a1f TwinSafeGroup1.sal+GVL1.sgvl> node map.mjs
import fs from 'node:fs';
import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
const R='C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/';
const src={REF:process.env.REFDIR,F1:R+'fixtures/stand-f1-04b45456'};
for(const s of ['E2a','E2b','E2c','E2d-v7.6','E2e','E3','E4','E5','E6v'])src[s]=R+'candidates/'+s+'/native';
const ld=d=>{try{return parseSalFile(d+'/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:d+'/GVL1.sgvl'});}catch{return parseSalFile(d+'/TwinSafeGroup1.sal',{bindingMode:'legacy'});}};
const idsOf=d=>{const x=fs.readFileSync(d+'/TwinSafeGroup1.sal','utf8');const m=new Map();let net='';
 for(const t of x.matchAll(/<(Network|fB\w+)\s[^>]*>/g)){const g=a=>(t[0].match(new RegExp('\\s'+a+'="([^"]*)"'))||[])[1];
  if(t[1]==='Network')net=g('name');else m.set('//'+net+'/'+g('name'),g('Id'));}return m;};
const pn=p=>p.split('/').at(-1);const nm=b=>b.instanceName??b.name;
function back(m,ids){const blk=new Map();for(const n of m.networks)for(const b of n.blocks){b.net=n.name;for(const p of [...b.inputs,...b.outputs])blk.set(p.path,b);}
 const K=new Map(),KI=new Map();
 const add=(k,a,sp,b,tp)=>{if(!(a&&b&&b.orderOfExecution<a.orderOfExecution))return;const ik=ids.get(a.path)+'.'+sp+'>'+ids.get(b.path)+'.'+tp;
  const v={po:a.orderOfExecution,co:b.orderOfExecution,pnet:a.net,cnet:b.net,pf:a.functionName,cf:b.functionName,ik};K.set(k,v);KI.set(ik,k);};
 for(const b of new Set(blk.values()))for(const p of b.inputs){for(const s of p.sources){const a=blk.get(s);if(a)add(`W:${nm(a)}.${pn(s)}->${nm(b)}.${p.name}`,a,pn(s),b,p.name);}}
 for(const v of m.variables)for(const s of v.sourcePorts)for(const t of v.targetPorts){const a=blk.get(s),b=blk.get(t);if(a&&b)add(`V:${v.name}:${nm(a)}.${pn(s)}->${nm(b)}.${pn(t)}`,a,pn(s),b,pn(t));}
 const gw=new Map();for(const b of new Set(blk.values()))for(const o of b.outputs)for(const g of o.globals??[])if(g.resolvedName)gw.set(g.resolvedName,[b,o.name]);
 for(const b of new Set(blk.values()))for(const p of b.inputs)for(const g of p.globals??[]){const w=g.resolvedName&&gw.get(g.resolvedName);if(w)add(`G:GVL1.${g.resolvedName}:${nm(w[0])}.${w[1]}->${nm(b)}.${p.name}`,w[0],w[1],b,p.name);}
 return {K,KI};}
const M={};for(const [k,d] of Object.entries(src))M[k]=back(ld(d),idsOf(d));
const md=fs.readFileSync(R+'program/lead/S6/VERIFY_RESULT_3.md','utf8');const W=[];
for(const m of md.matchAll(/WiredLink connects the OutPort (\w+) of FunctionBlock (\w+) and the InPort (\w+) of FunctionBlock (\w+)/g))W.push({kind:'WiredLink',key:`W:${m[2]}.${m[1]}->${m[4]}.${m[3]}`});
for(const m of md.matchAll(/Variable (\w+) is used at (\w+) of FunctionBlock (\w+) which .*? assigned by (\w+) of FunctionBlock (\w+)/g))W.push({kind:'Variable',key:`V:${m[1]}:${m[5]}.${m[4]}->${m[3]}.${m[2]}`});
for(const m of md.matchAll(/Variable '([\w.]+)'.*?port \w+\.(\w+)\.(\w+) .*?by '\w+\.(\w+)\.(\w+)'/g))W.push({kind:'GVL',key:`G:${m[1]}:${m[4]}.${m[5]}->${m[2]}.${m[3]}`});
const order=Object.keys(src);const out=[];
for(const w of W){const c=M.E6v.K.get(w.key);
 const hit=s=>M[s].K.has(w.key)||(c&&M[s].KI.has(c.ik));const first=order.find(hit);
 out.push({...w,inCanonicalModel:!!c,...(c||{}),inREF:hit('REF'),inF1:hit('F1'),firstStage:first??'NOT_FOUND',
  status:(hit('REF')||hit('F1'))?'PRE-EXISTING':'NEW'});}
const gvlModel=[...M.E6v.K.keys()].filter(k=>k.startsWith('G:'));
fs.writeFileSync(new URL('./map.out.json',import.meta.url),JSON.stringify({counts:Object.fromEntries(order.map(s=>[s,M[s].K.size])),warnings:out,gvlBackwardInModel:gvlModel.length},null,1));
console.log('parsed',W.length,'unmapped',out.filter(o=>!o.inCanonicalModel).map(o=>o.key).join(' ')||'none','modelGvlBackward',gvlModel.length);
const by={};for(const o of out)(by[o.status+'/'+o.firstStage]??=[]).push(o.key);for(const [s,l] of Object.entries(by))console.log(s,l.length);
