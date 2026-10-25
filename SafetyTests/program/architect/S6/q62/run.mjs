// usage: node run6.mjs <base|s6|mutant-module> [stages|ids]
import {programFromModel,runScenario,SCENARIOS} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/catalog-program.js';
import {inputRuleCheck} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-input-rule.js';
for(const l of ['k','c','e','u','d','h','w','p','g'])await import(`file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/catalog/lib/${l}.js`);
import {load,kit,root} from './kit.mjs';
const [variant='base',sel='all']=process.argv.slice(2);
const m=load();if(variant!=='base'){const mod=await import('./'+variant+'.mjs');mod.apply(m,kit(m));}
const P=programFromModel(m,{label:variant,salSha256:'scratch',sgvlSha256:'scratch'});
const ids=[...SCENARIOS.values()].filter(s=>sel==='all'||sel.split(',').includes(s.stage)||sel.split(',').includes(s.id)).map(s=>s.id);
let pass=0,fail=0,nv=0;
for(const id of ids){const r=runScenario(id,P);if(r.fails.length){fail++;console.log('FAIL',id,'|',r.fails.join(' ## ').slice(0,300));}else{pass++;if(r.nv.length)nv++;}}
const ir=inputRuleCheck(m,root);
console.log('blocks',m.networks.flatMap(n=>n.blocks).length,'scenarios',ids.length,'pass',pass,'fail',fail,'withNV',nv,'| inputRule',ir.status,ir.errors.length,ir.errors.map(e=>e.block+'.'+(e.port??'')+':'+e.kind).join(' '));
