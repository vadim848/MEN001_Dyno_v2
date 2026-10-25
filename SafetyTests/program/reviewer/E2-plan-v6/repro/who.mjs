// Reviewer v6: who writes / reads a given global (Symbol/SAL var) in a candidate (read-only).
import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
const cand=process.env.CAND||'E2a';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/'+cand+'/native';
const m=parseSalFile(root+'/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'/GVL1.sgvl'});
for(const name of process.argv.slice(2)){
 console.log('###',name);
 for(const b of m.networks.flatMap(n=>n.blocks)){
  for(const o of b.outputs) if((o.globals||[]).some(g=>g.resolvedName===name)) console.log('  W',b.path,o.name,'ord',b.orderOfExecution);
  for(const i of b.inputs) if((i.globals||[]).some(g=>g.resolvedName===name)) console.log('  R',b.path,i.name,i.channelInterface||'','ord',b.orderOfExecution);
 }
}
