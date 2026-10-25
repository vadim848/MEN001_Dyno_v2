// v2-reviewer S5: print inputs of named blocks and consumers of their outputs (candidate E5)
import {parseSalFile} from '../../../src/sal-parser.js';
const M=parseSalFile('candidates/E5/native/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:'candidates/E5/native/GVL1.sgvl'});
const bl=M.networks.flatMap(n=>n.blocks);const vin=new Map();for(const v of M.variables){for(const p of v.targetPorts)vin.set(p,'V:'+v.name);for(const p of v.sourcePorts)vin.set('SRC'+p,'V:'+v.name);}
for(const name of process.argv.slice(2)){for(const b of bl.filter(b=>b.path.endsWith('/'+name))){
 const ins=b.inputs.filter(p=>p.channelInterface==='Activated').map(p=>p.path.split('/').pop()+'='+(/Make/.test(p.deactivate1)?'!':'')+[...(p.sources??[]).map(s=>s.split('/').slice(-2).join('/')),...(p.globals??[]).map(g=>'G:'+g.resolvedName),vin.get(p.path)??''].join(''));
 const cons=bl.flatMap(c=>c.inputs.filter(p=>(p.sources??[]).some(s=>s.startsWith(b.path+'/'))).map(p=>p.path.split('/').slice(-2).join('/')));
 const outv=(b.outputs??[]).map(o=>vin.get('SRC'+o.path)).filter(Boolean);
 console.log(`${b.path} ${b.functionName} ord=${b.order} | ${ins.join(' ')} | -> ${cons.join(',')} ${outv.join(',')}`);}}
