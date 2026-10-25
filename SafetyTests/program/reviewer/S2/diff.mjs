import {parseSalFile} from '../../../src/sal-parser.js';import fs from 'node:fs';
const ld=d=>parseSalFile(`candidates/${d}/native/TwinSafeGroup1.sal`,{bindingMode:'current',sgvlPath:`candidates/${d}/native/GVL1.sgvl`});
const A=ld('E2d'),B=ld('E2e');const out=[];
const idx=m=>{const r=new Map();for(const n of m.networks)n.blocks.forEach((b,i)=>r.set(b.path??`//${n.name}/${b.name}`,{n,b,i}));return r;};
const vt=m=>{const r=new Map();for(const v of m.variables)for(const p of v.targetPorts)r.set(p,(r.get(p)??[]).concat('V:'+v.name));for(const v of m.variables)for(const p of v.sourcePorts)r.set('SRC'+p,(r.get('SRC'+p)??[]).concat('V:'+v.name));return r;};
const ia=idx(A),ib=idx(B),va=vt(A),vb=vt(B);
out.push(`blocks E2d=${ia.size} E2e=${ib.size}`);
for(const k of ib.keys())if(!ia.has(k))out.push('ADDED '+k+' '+ib.get(k).b.functionName);
for(const k of ia.keys())if(!ib.has(k))out.push('REMOVED '+k);
const sig=(p,v)=>JSON.stringify({ci:p.channelInterface,d1:p.deactivate1,d2:p.deactivate2,src:p.sources,g:(p.globals??[]).map(g=>g.resolvedName),v:v.get(p.path)??[]});
const bsig=b=>JSON.stringify(Object.fromEntries(Object.entries(b).filter(([k])=>!['inputs','outputs','path','order','orderOfExecution','id','guid','x','y'].includes(k)&&typeof b[k]!=='object')));
for(const [k,{b}] of ia){const e=ib.get(k);if(!e)continue;
 if(bsig(b)!==bsig(e.b))out.push('BLOCKATTR '+k+' '+bsig(b)+' -> '+bsig(e.b));
 const pa=new Map(b.inputs.map(p=>[p.path,p])),pb=new Map(e.b.inputs.map(p=>[p.path,p]));
 for(const [pp,p] of pa){const q=pb.get(pp);if(!q){out.push('PORT REMOVED '+pp);continue;}const s1=sig(p,va),s2=sig(q,vb);if(s1!==s2)out.push('PORT '+pp+'\n   '+s1+'\n -> '+s2);}
 for(const pp of pb.keys())if(!pa.has(pp))out.push('PORT ADDED '+pp);
 for(const o of b.outputs??[]){const s1=JSON.stringify(va.get('SRC'+o.path)??[]),s2=JSON.stringify(vb.get('SRC'+o.path)??[]);if(s1!==s2)out.push('OUTVAR '+o.path+' '+s1+' -> '+s2);}
}
// relative order of pre-existing blocks per network
for(const n of A.networks){const nb=B.networks.find(x=>x.name===n.name);const oa=n.blocks.map(b=>b.name),ob=nb.blocks.map(b=>b.name).filter(x=>oa.includes(x));if(oa.join()!==ob.join())out.push('ORDER CHANGED in '+n.name);}
out.push('vars '+A.variables.length+' -> '+B.variables.length+'; names equal: '+(A.variables.map(v=>v.name+v.alias).sort().join()===B.variables.map(v=>v.name+v.alias).sort().join()));
out.push('keys sample block: '+Object.keys(A.networks[0].blocks[0]).join(','));
console.log(out.join('\n'));fs.writeFileSync('program/reviewer/S2/diff.out.txt',out.join('\n')+'\n');
