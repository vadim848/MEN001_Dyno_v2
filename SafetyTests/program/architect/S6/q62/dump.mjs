// dump FB context on canonical: node dump.mjs NAME...  (inputs: '!'=negated (Make Contact NO), source FB.port[order] / V:var / G:global; outputs -> consumers)
import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
const m=parseSalFile('C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/E6v/native/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:'C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/E6v/native/GVL1.sgvl'});
const bl=m.networks.flatMap(n=>n.blocks.map(b=>(b.net=n.name,b)));const byP=new Map();for(const b of bl)for(const p of [...b.inputs,...b.outputs])byP.set(p.path,b);
const nm=b=>b.instanceName??b.name,pn=p=>p.split('/').at(-1);
const vT=new Map(),vS=new Map();for(const v of m.variables){for(const t of v.targetPorts)vT.set(t,v.name);for(const s of v.sourcePorts)(vS.get(s)??vS.set(s,[]).get(s)).push(v.name);}
const vCons=new Map();for(const v of m.variables)vCons.set(v.name,v.targetPorts.map(t=>nm(byP.get(t))+'.'+pn(t)+'['+byP.get(t).orderOfExecution+']'));
const gCons=new Map();for(const b of bl)for(const p of b.inputs)for(const g of p.globals)if(g.resolvedName)(gCons.get(g.resolvedName)??gCons.set(g.resolvedName,[]).get(g.resolvedName)).push(nm(b)+'.'+p.name+'['+b.orderOfExecution+']');
const wCons=new Map();for(const b of bl)for(const p of b.inputs)for(const s of p.sources)(wCons.get(s)??wCons.set(s,[]).get(s)).push(nm(b)+'.'+p.name+'['+b.orderOfExecution+']');
const vSrc=new Map();for(const v of m.variables)for(const s of v.sourcePorts)vSrc.set(v.name,nm(byP.get(s))+'['+byP.get(s).orderOfExecution+']');
const gSrc=new Map();for(const b of bl)for(const o of b.outputs)for(const g of o.globals)if(g.resolvedName)gSrc.set(g.resolvedName,nm(b)+'['+b.orderOfExecution+']');
for(const q of process.argv.slice(2)){const b=bl.find(b=>nm(b)===q);if(!b){console.log('?',q);continue;}
 const par=b.parameters.map(p=>p.name+'='+(p.value??p.defaultValue??'')).join(',');
 console.log(`${nm(b)} ${b.functionName} ${b.net} ord=${b.orderOfExecution} ${par}`);
 for(const p of b.inputs){if(p.channelInterface==='Deactivated')continue;const neg=p.deactivate1==='Make Contact (NO)'?'!':'';
  const s=p.sources.map(s=>nm(byP.get(s))+'.'+pn(s)+'['+byP.get(s).orderOfExecution+']').concat(vT.has(p.path)?['V:'+vT.get(p.path)+'<'+vSrc.get(vT.get(p.path))]:[]).concat(p.globals.map(g=>'G:'+(g.resolvedName??'?')+'<'+(gSrc.get(g.resolvedName)??'IO')));
  console.log('  in',p.name,neg+s.join(' '));}
 for(const o of b.outputs){const c=(wCons.get(o.path)??[]).concat((vS.get(o.path)??[]).map(v=>'V:'+v+'=>'+vCons.get(v).join(','))).concat(o.globals.map(g=>'G:'+g.resolvedName+'=>'+(gCons.get(g.resolvedName)??[]).join(',')));
  if(c.length)console.log('  out',o.name,'->',c.join(' '));}}
