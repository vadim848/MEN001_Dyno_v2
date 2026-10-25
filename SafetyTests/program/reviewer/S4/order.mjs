// reviewer S4: relative exec order of surviving old blocks
import {parseSalFile} from '../../../src/sal-parser.js';
const A=parseSalFile('../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:'../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl'});
const B=parseSalFile('candidates/E4/native/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:'candidates/E4/native/GVL1.sgvl'});
const go=m=>m.networks.flatMap(n=>n.blocks).sort((p,q)=>p.orderOfExecution-q.orderOfExecution).map(x=>x.path);
const ga=go(A),gb=go(B);const sb=new Set(gb),sa=new Set(ga);
const a=ga.filter(p=>sb.has(p)),b=gb.filter(p=>sa.has(p));
for(let i=0;i<a.length;i++)if(a[i]!==b[i]){console.log('first diff at',i,a.slice(i-2,i+5),b.slice(i-2,i+5));break;}
console.log(a.length,b.length);
console.log('new order:',gb.map((p,i)=>sa.has(p)?null:(i+1)+':'+p).filter(Boolean).join(' '));
