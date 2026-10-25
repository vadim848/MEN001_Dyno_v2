// Reviewer: dump inputs (contact, source) and order of blocks used in MU06/MU10 proofs, F1 source.
import {parseSalFile} from '../../../../src/sal-parser.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/resumed-f1/native/';
const m=parseSalFile(root+'TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'GVL1.sgvl'});
const all=m.networks.flatMap(n=>n.blocks);const tgt=new Map();for(const v of m.variables)for(const p of v.targetPorts)tgt.set(p,v.name);
const srcName=p=>[...p.sources.map(s=>'wire:'+s),...p.globals.map(g=>'glob:'+g.resolvedName),...(tgt.has(p.path)?['sym:'+tgt.get(p.path)]:[])].join(',');
const writerOf=new Map();for(const b of all)for(const o of b.outputs){for(const g of o.globals)writerOf.set(g.resolvedName,b.path+' ord'+b.orderOfExecution);}
for(const v of m.variables)for(const s of v.sourcePorts)writerOf.set(v.name,s);
const want=process.argv.slice(2);
for(const b of all.filter(b=>want.some(w=>b.path.endsWith(w)))){console.log(b.path,'ord',b.orderOfExecution,b.functionName,b.parameters?JSON.stringify(b.parameters):'');
 for(const p of b.inputs.filter(p=>!['Deactivated','Both Deactivated'].includes(p.channelInterface)))console.log('   ',p.name,p.channelInterface,p.deactivate1==='Make Contact (NO)'?'NOT':'',srcName(p));
 for(const o of b.outputs)console.log('   ->',o.name,o.globals.map(g=>g.resolvedName).join(','),(o.targets||[]).join(','));}
if(process.env.W)for(const n of process.env.W.split(','))console.log('writer',n,'=',writerOf.get(n));
