// reviewer S4: print inputs of named blocks in E4 candidate (with variable/global bindings)
import {parseSalFile} from '../../../src/sal-parser.js';
const B=parseSalFile('candidates/E4/native/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:'candidates/E4/native/GVL1.sgvl'});
const vB=new Map(),vS=new Map();for(const v of B.variables){for(const p of v.targetPorts)vB.set(p,v.name);for(const p of v.sourcePorts)vS.set(p,v.name);}
const all=new Map(B.networks.flatMap(n=>n.blocks.map(b=>[b.path,b])));
for(const name of process.argv.slice(2)){for(const [k,x] of all)if(k.endsWith('/'+name)){console.log(`${k} ${x.functionName} ord=${x.orderOfExecution} par=${JSON.stringify(x.parameters)}`);
 for(const q of x.inputs){if(q.deactivate1==='Deactivated'||(!q.sources.length&&!vB.get(q.path)&&!(q.globals??[]).length))continue;console.log(`   ${q.path.split('/').pop()} ci=${q.channelInterface} d1=${q.deactivate1??''} src=${q.sources.map(s=>s.split('/').slice(2).join('/')).join(',')} g=${(q.globals??[]).map(g=>g.resolvedName)} v=${vB.get(q.path)??''}`);}
 for(const o of x.outputs??[])if(vS.get(o.path))console.log('   OUT->V:'+vS.get(o.path));}}
