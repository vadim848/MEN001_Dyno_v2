import {parseSalFile} from '../../../src/sal-parser.js';import fs from 'node:fs';
const F=parseSalFile('../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:'../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl'});
const B=parseSalFile('candidates/E2e/native/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:'candidates/E2e/native/GVL1.sgvl'});
const all=m=>new Map(m.networks.flatMap(n=>n.blocks.map(b=>[b.path,b])));const a=all(F),b=all(B);const out=[];
const add=[...b.keys()].filter(k=>!a.has(k)),rem=[...a.keys()].filter(k=>!b.has(k));
out.push(`F1 ${a.size} blocks, E2e ${b.size}; added ${add.length}, removed ${rem.length}; networks F1 ${F.networks.map(n=>n.name)} | E2e ${B.networks.map(n=>n.name)}`);
let pc=0;for(const [k,x] of a){const y=b.get(k);if(!y)continue;for(const p of x.inputs){const q=y.inputs.find(z=>z.path===p.path);if(!q||JSON.stringify([p.channelInterface,p.deactivate1,p.sources,(p.globals??[]).map(g=>g.resolvedName)])!==JSON.stringify([q.channelInterface,q.deactivate1,q.sources,(q.globals??[]).map(g=>g.resolvedName)]))pc++;}}
out.push('changed input ports on common blocks: '+pc);
const pch=[...a].filter(([k,x])=>b.has(k)&&JSON.stringify(x.parameters)!==JSON.stringify(b.get(k).parameters)).map(([k,x])=>k+' '+JSON.stringify(x.parameters)+' -> '+JSON.stringify(b.get(k).parameters));
out.push('param changes: '+pch.length);out.push(...pch);
const tm=m=>m.networks.flatMap(n=>n.blocks).filter(x=>/ton|tof|tp|estop|edm|mon/i.test(x.functionName)).map(x=>x.path+'='+JSON.stringify(x.parameters));
const ta=new Set(tm(F));out.push('timer-like blocks added in E2e: '+tm(B).filter(s=>!ta.has(s)).join(' ; '));
const va=new Map(F.variables.map(v=>[v.name,v.alias])),vb=new Map(B.variables.map(v=>[v.name,v.alias]));
out.push('vars F1 '+va.size+' E2e '+vb.size+'; removed '+[...va.keys()].filter(k=>!vb.has(k)).join(',')+'; added '+[...vb.keys()].filter(k=>!va.has(k)).join(','));
console.log(out.join('\n'));fs.writeFileSync('program/reviewer/S2/diff3.out.txt',out.join('\n')+'\n');
