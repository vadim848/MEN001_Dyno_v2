import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/'+(process.env.CAND||'E2a')+'/native';
const m=parseSalFile(root+'/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'/GVL1.sgvl'});
const all=m.networks.flatMap(n=>n.blocks).sort((a,b)=>a.orderOfExecution-b.orderOfExecution);
const outName=new Map();
for(const b of all)for(const o of b.outputs){outName.set(o.path,(o.globals.map(g=>g.resolvedName).join('|'))||null);}
const varOf=new Map();for(const v of m.variables){for(const s of v.sourcePorts)varOf.set(s,v.name);}
function src(p){
  if(p.globals.length) return p.globals.map(g=>g.resolvedName).join('|');
  const tv=m.variables.find(v=>v.targetPorts.includes(p.path)); if(tv) return 'v:'+tv.name;
  if(p.sources.length) return 'W:'+p.sources.map(s=>s.replace(/^\/\//,'')+(outName.get(s)?'('+outName.get(s)+')':'')).join(',');
  return '?';
}
const counts={};
for(const n of m.networks){console.log('NET',n.name,n.blocks.length);}
for(const b of all){
  counts[b.functionName]=(counts[b.functionName]||0)+1;
  const ins=b.inputs.filter(p=>!['Deactivated','Both Deactivated'].includes(p.channelInterface)||b.functionName==='safeDecouple'||b.functionName==='safeEstop')
   .map(p=>{const s=src(p); if(s==='?'&&b.functionName==='safeDecouple')return null;return `${p.name}${p.deactivate1==='Make Contact (NO)'?'!':''}=${s}${p.channelInterface&&p.channelInterface!=='Activated'?'['+p.channelInterface+']':''}`}).filter(Boolean);
  const outs=b.outputs.map(o=>{const g=o.globals.map(g=>g.resolvedName).join('|');const v=varOf.get(o.path);const t=o.targets.length?'->'+o.targets.map(t=>t.replace(/^\/\//,'')).join(','):'';return `${o.name}=${g}${v?'v:'+v:''}${t}`;});
  const par=b.parameters.filter(p=>p.timing).map(p=>'T='+p.timing);
  console.log(String(b.orderOfExecution).padStart(3),b.path.slice(2),b.functionName.replace('safe',''),par.join(''),'|',ins.join(' '),'=>',outs.join(' '));
}
console.log(JSON.stringify(counts), 'total',all.length,'vars',m.variables.length);
