// usage: node run.mjs <variant|base> <ids|E2,E3>
import {programFromModel,runScenario,SCENARIOS} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/catalog-program.js';
for(const l of ['k','c','e','u','d','h','w','p','g'])await import(`file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/catalog/lib/${l}.js`);
import {load,kit} from './kit.mjs';
const [variant='base',sel='E2,E3']=process.argv.slice(2);
const m=load();if(variant!=='base'){const mod=await import('./'+variant+'.mjs');mod.apply(m,kit(m));}
const P=programFromModel(m,{label:variant,salSha256:'scratch',sgvlSha256:'scratch'});
const stages=sel.split(',');const ids=[...SCENARIOS.values()].filter(s=>stages.includes(s.stage)||stages.includes(s.id)).map(s=>s.id);
let pass=0,fail=0;for(const id of ids){const r=runScenario(id,P);if(r.fails.length){fail++;console.log('FAIL',id,SCENARIOS.get(id).stage,'|',r.fails.join(' || ').slice(0,900));}else{pass++;console.log('PASS',id,SCENARIOS.get(id).stage,r.nv.length?'(NV: '+r.nv.join('|').slice(0,120)+')':'');}}
console.log('blocks',m.networks.flatMap(n=>n.blocks).length,'pass',pass,'fail',fail);
