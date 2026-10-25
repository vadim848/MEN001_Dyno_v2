import fs from 'node:fs';
let s=fs.readFileSync(new URL('../../../test/helpers/rnd-down-source.js',import.meta.url),'utf8');
// Independent read-only extension: preserve helper's producer closure, add actual
// status/unlock producers, expose runtime for observation/snapshot search only.
s=s.replaceAll("'../../src/","'../../../src/").replaceAll("'../../../MEN001_Dyno/","'../../../../MEN001_Dyno/");
s=s.replace("const selected=new Set()","Object.assign(signals,{outSafe:'out_Step1',outRun:'out_Step3',outArmed:'out_Safety_Armed',unlock:'out_Door_Unlock_Solonoeid'});\n const selected=new Set()");
const a=s.indexOf(' const evaluate=r.evaluate.bind(r);'),b=s.indexOf(' r.setInputs=inputs=>',a);
if(a<0||b<a)throw Error('Helper instrumentation signature changed');
s=s.slice(0,a)+s.slice(b);
s=s.replace('if(started)frames.push','if(started&&false)frames.push');
s=s.replace('return{clock,frames','return{r,m,signals,demanded,clock,frames');
fs.writeFileSync(new URL('fixture.mjs',import.meta.url),s);
