import {parseSalFile} from '../../../src/sal-parser.js';import fs from 'node:fs';
const ld=d=>parseSalFile(`candidates/${d}/native/TwinSafeGroup1.sal`,{bindingMode:'current',sgvlPath:`candidates/${d}/native/GVL1.sgvl`});
const A=ld('E2d'),B=ld('E2e');const out=[];
const all=m=>new Map(m.networks.flatMap(n=>n.blocks.map(b=>[b.path,b])));const a=all(A),b=all(B);
for(const [k,x] of a){const y=b.get(k);if(JSON.stringify(x.parameters)!==JSON.stringify(y.parameters))out.push('PARAM CHANGED '+k);}
const vmap=m=>{const r=new Map();for(const v of m.variables)for(const p of v.targetPorts)r.set(p,v.name);return r;};const vb=vmap(B);
for(const n of B.networks){const names=n.blocks.map(x=>x.name);for(const x of n.blocks)if(!a.has(x.path)){
 out.push(`${x.path} ${x.functionName} order=${x.orderOfExecution} pos=${names.indexOf(x.name)} prev=${names[names.indexOf(x.name)-1]} next=${names[names.indexOf(x.name)+1]} params=${JSON.stringify(x.parameters)}`);
 for(const p of x.inputs)out.push(`   ${p.path.split('/').pop()} ci=${p.channelInterface} d1=${p.deactivate1??''} src=${p.sources.join(',')} g=${(p.globals??[]).map(g=>g.resolvedName)} v=${vb.get(p.path)??''}`);}}
// order of exec numbers per network contiguous?
for(const n of B.networks){const o=n.blocks.map(x=>Number(x.orderOfExecution));const s=[...o].sort((p,q)=>p-q);for(let i=1;i<s.length;i++)if(s[i]!==s[i-1]+1){out.push('order gap in '+n.name);break;}}
const go=m=>m.networks.flatMap(n=>n.blocks).sort((p,q)=>p.orderOfExecution-q.orderOfExecution).map(x=>x.path);
const ga=go(A),gb=go(B).filter(p=>a.has(p));out.push('global exec order of old blocks preserved: '+(ga.join()===gb.join()));
const O=go(B);for(const p of ['//Network8/FBOrS5','//Network8/FBAnd1','//Network7/FBAnd8','//Network3/FBRs5','//Network1/EXIT_FBK_OK','//Network1/FBEstop1','//RndPhysicalCompact/SG_SCOPE','//RndPhysicalCompact/STATE_SG','//Network12/FBAnd15','//Network3/FBRs8','//Network3/FBOrS12Reset','//SafeResumption/HLT_LV','//Network11/WIN_C1_IN','//Network11/WIN_C1','//Network1/FBRs1'])out.push(`exec ${O.indexOf(p)} ${p}`);
console.log(out.join('\n'));fs.writeFileSync('program/reviewer/S2/diff2.out.txt',out.join('\n')+'\n');
