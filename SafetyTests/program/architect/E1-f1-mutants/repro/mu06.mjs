import {make} from './sim.mjs';
// Directed: green press in Run; in_False_SI2_CH8 pulse of width w scans starting at offset o (ms after green press).
let cases=0,div=0,ex=[];
const base=make('F1').r; // warm parse check
for(const w of [1,2,3,600])for(const o of [0,250,498,499,500,501,502,503,504,700]){
 const A=make('F1').r,B=make('MU06').r;let t=0,d=null;
 const step=inp=>{for(const r of [A,B]){if(inp)r.setInputs(inp);r.scan(1);}t++;if(!d)for(const [k,v] of A.values)if((k.startsWith('var:')||k.includes('/Network6/')||k.includes('/Network3/'))&&B.values.get(k)!==v){d={t,k};break;}};
 step({in_Reset_PB:true});
 for(let i=1;i<1500;i++){if(i===o)step({in_False_SI2_CH8:true});else if(i===o+w)step({in_False_SI2_CH8:false});else step();}
 cases++;if(d){div++;ex.push({w,o,...d});}
}
console.log(JSON.stringify({cases,divergent:div,ex:ex.slice(0,5)}));
