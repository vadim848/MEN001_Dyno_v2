// v2-reviewer S5: canonical E4 -> candidates/E5 parsed-graph diff (review evidence)
import {parseSalFile} from '../../../src/sal-parser.js';import fs from 'node:fs';
const A=parseSalFile('../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:'../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl'});
const B=parseSalFile('candidates/E5/native/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:'candidates/E5/native/GVL1.sgvl'});
const out=[];const all=m=>new Map(m.networks.flatMap(n=>n.blocks.map(b=>[b.path,b])));const a=all(A),b=all(B);
const vt=m=>{const r=new Map();for(const v of m.variables){for(const p of v.targetPorts)r.set(p,(r.get(p)??[]).concat('V:'+v.name));for(const p of v.sourcePorts)r.set('SRC'+p,(r.get('SRC'+p)??[]).concat('V:'+v.name));}return r;};
const va=vt(A),vb=vt(B);
out.push(`blocks ${a.size} -> ${b.size}; networks ${A.networks.length} -> ${B.networks.length}`);
for(const k of a.keys())if(!b.has(k))out.push('REMOVED '+k);
const sig=(p,v)=>JSON.stringify({ci:p.channelInterface,d1:p.deactivate1,d2:p.deactivate2,src:p.sources,g:(p.globals??[]).map(g=>g.resolvedName),v:v.get(p.path)??[]});
for(const [k,x] of a){const y=b.get(k);if(!y)continue;
 if(x.functionName!==y.functionName)out.push('FN CHANGED '+k);
 if(JSON.stringify(x.parameters)!==JSON.stringify(y.parameters))out.push('PARAM CHANGED '+k+' '+JSON.stringify(x.parameters)+' -> '+JSON.stringify(y.parameters));
 const pa=new Map(x.inputs.map(p=>[p.path,p])),pb=new Map(y.inputs.map(p=>[p.path,p]));
 for(const [pp,p] of pa){const q=pb.get(pp);if(!q){out.push('PORT REMOVED '+pp);continue;}const s1=sig(p,va),s2=sig(q,vb);if(s1!==s2)out.push('PORT '+pp+'\n   '+s1+'\n -> '+s2);}
 for(const pp of pb.keys())if(!pa.has(pp))out.push('PORT ADDED '+pp);
 for(const o of x.outputs??[]){const s1=JSON.stringify(va.get('SRC'+o.path)??[]),s2=JSON.stringify(vb.get('SRC'+o.path)??[]);if(s1!==s2)out.push('OUTVAR '+o.path+' '+s1+' -> '+s2);}
}
const go=m=>m.networks.flatMap(n=>n.blocks).sort((p,q)=>p.orderOfExecution-q.orderOfExecution).map(x=>x.path);
const ga=go(A),gB=go(B),gb=gB.filter(p=>a.has(p));out.push('global exec order of old blocks preserved: '+(ga.join()===gb.join()));
const ords=gB.map(p=>Number(b.get(p).orderOfExecution));out.push('orders contiguous 1..N: '+ords.every((o,i)=>o===i+1));
const vB=new Map();for(const v of B.variables)for(const p of v.targetPorts)vB.set(p,v.name);
for(const p of gB)if(!a.has(p)){const x=b.get(p);out.push(`ADDED ${p} ${x.functionName} order=${x.orderOfExecution} params=${JSON.stringify(x.parameters)}`);
 for(const q of x.inputs)out.push(`   ${q.path.split('/').pop()} ci=${q.channelInterface} d1=${q.deactivate1??''} src=${q.sources.join(',')} g=${(q.globals??[]).map(g=>g.resolvedName)} v=${vB.get(q.path)??''}`);
 for(const o of x.outputs??[]){const s=vb.get('SRC'+o.path);if(s)out.push('   OUT '+o.path+' -> '+s);}}
out.push('exec STATE_SU '+gB.indexOf('//RndPhysicalCompact/STATE_SU')+' first new '+gB.findIndex(p=>!a.has(p))+' last new '+gB.findLastIndex(p=>!a.has(p)));
const vn=m=>new Map(m.variables.map(v=>[v.name,v]));const VA=vn(A),VB=vn(B);
for(const [n,v] of VB){const u=VA.get(n);if(!u){out.push(`VAR ADDED ${n} alias=${v.alias} src=${v.sourcePorts} tgt=${v.targetPorts}`);continue;}
 if(JSON.stringify(u.alias)!==JSON.stringify(v.alias))out.push('VAR ALIAS '+n);
 const d=JSON.stringify([u.sourcePorts.slice().sort(),u.targetPorts.slice().sort()])!==JSON.stringify([v.sourcePorts.slice().sort(),v.targetPorts.slice().sort()]);
 if(d)out.push(`VAR USAGE ${n}: src ${u.sourcePorts.length}->${v.sourcePorts.length} tgt ${u.targetPorts.length}->${v.targetPorts.length}; +${v.targetPorts.filter(p=>!u.targetPorts.includes(p))} -${u.targetPorts.filter(p=>!v.targetPorts.includes(p))}`);}
for(const n of VA.keys())if(!VB.has(n))out.push('VAR REMOVED '+n);
// inter-network wires
let inter=0;for(const [k,x] of b)for(const q of x.inputs)for(const s of q.sources){const nn=s.split('/')[2];if(nn&&nn!==k.split('/')[2])inter++;}
out.push('inter-network wire sources: '+inter);
out.push('keys port: '+Object.keys(B.networks[0].blocks[0].inputs[0]).join(','));
console.log(out.join('\n'));fs.writeFileSync('program/reviewer/S4/diff.out.txt',out.join('\n')+'\n');
