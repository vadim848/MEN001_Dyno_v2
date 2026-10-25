import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
const cand=process.env.CAND||'E2a';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/'+cand+'/native';
const m=parseSalFile(root+'/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'/GVL1.sgvl'});
const B=new Map(m.networks.flatMap(n=>n.blocks).map(b=>[b.path,b]));
const [p,port]=process.argv.slice(2);const b=B.get('//'+p);
const x=[...b.inputs,...b.outputs].find(i=>i.name===port);console.log(JSON.stringify(x,null,1));
