import {load} from './kit.mjs';
const m=load();
const vt=new Map();for(const v of m.variables){for(const t of v.targetPorts)vt.set(t,'V:'+v.name);}
const vs=new Map();for(const v of m.variables){for(const t of v.sourcePorts)vs.set(t,(vs.get(t)?vs.get(t)+',':'')+'V:'+v.name);}
const sh=p=>p.replace(/^\/\/[^/]+\//,'');
for(const n of m.networks){console.log('=== '+n.name);
 for(const b of [...n.blocks].sort((a,b)=>a.orderOfExecution-b.orderOfExecution)){
  const ins=b.inputs.map(p=>{if(p.channelInterface==='Deactivated')return null;const inv=p.deactivate1==='Make Contact (NO)'?'!':'';
   const src=[...p.sources.map(s=>s.startsWith('//'+n.name+'/')?sh(s):s),...p.globals.map(g=>'G:'+g.resolvedName),vt.get(p.path)].filter(Boolean).join('|')||'?';return p.name+'='+inv+src;}).filter(Boolean);
  const outs=b.outputs.map(p=>{const x=[...p.globals.map(g=>'G:'+g.resolvedName),vs.get(p.path)].filter(Boolean);return x.length?p.name+'->'+x.join(','):null;}).filter(Boolean);
  const par=b.parameters?.length?' T='+JSON.stringify(b.parameters):'';
  console.log(b.orderOfExecution,b.name,b.functionName||b.type,par,'(',ins.join('; '),')',outs.length?'=> '+outs.join(' '):'');}}
