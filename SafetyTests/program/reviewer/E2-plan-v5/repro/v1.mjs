// Reviewer v5: R1 candidate netlist facts for E2a-RC / E2b / E2d points (read-only).
import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/E2-R1/native';
const m=parseSalFile(root+'/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'/GVL1.sgvl'});
const B=new Map(m.networks.flatMap(n=>n.blocks).map(b=>[b.path,b]));
const show=p=>{const b=B.get('//'+p);if(!b){console.log('NO',p);return;}
 console.log(`== ${p} ${b.functionName} ord=${b.orderOfExecution} params=${JSON.stringify(b.parameters)}`);
 for(const i of b.inputs)console.log(`   in ${i.name} ${i.channelInterface||''} ${i.deactivate1||''} src=${JSON.stringify(i.sources)} g=${JSON.stringify((i.globals||[]).map(g=>g.resolvedName))}`);
 for(const o of b.outputs)console.log(`   out ${o.name} tgt=${JSON.stringify(o.targets)} g=${JSON.stringify((o.globals||[]).map(g=>g.resolvedName))}`);};
for(const p of process.argv.slice(2))show(p);
