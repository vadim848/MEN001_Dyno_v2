// Tester: dump a whole network of canonical F1 (inputs with contact/source, outputs) in execution order.
import {parseSalFile} from '../../../../src/sal-parser.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno/';
const m=parseSalFile(root+'TwinSafeGroup1/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'GVLs/GVL1.sgvl'});
const tgt=new Map();for(const v of m.variables)for(const p of v.targetPorts)tgt.set(p,v.name);
const src=new Map();for(const v of m.variables)for(const p of v.sourcePorts)src.set(p,v.name);
const srcName=p=>[...p.sources.map(s=>'wire:'+s),...p.globals.map(g=>'glob:'+g.resolvedName),...(tgt.has(p.path)?['sym:'+tgt.get(p.path)]:[])].join(',');
for(const n of m.networks.filter(n=>process.argv.slice(2).some(w=>n.name===w||n.path===w||(n.path||'').endsWith(w)))){console.log('NETWORK',n.name||n.path);
 for(const b of [...n.blocks].sort((a,b)=>a.orderOfExecution-b.orderOfExecution)){console.log(b.path,'ord',b.orderOfExecution,b.functionName,b.parameters?JSON.stringify(b.parameters):'');
 for(const p of b.inputs.filter(p=>!['Deactivated','Both Deactivated'].includes(p.channelInterface)))console.log('   ',p.name,p.channelInterface,p.deactivate1==='Make Contact (NO)'?'NOT':'',srcName(p));
 for(const o of b.outputs)console.log('   ->',o.name,o.globals.map(g=>g.resolvedName).join(','),(o.targets||[]).join(','),src.has(o.path)?'sym:'+src.get(o.path):'');}}
