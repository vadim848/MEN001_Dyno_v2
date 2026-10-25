import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno';
const m=parseSalFile(root+'/TwinSafeGroup1/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'/GVLs/GVL1.sgvl'});
const src={},tgt={};
for(const n of m.networks)for(const b of n.blocks){for(const o of b.outputs)for(const g of o.globals){src[g.resolvedName]=(src[g.resolvedName]||0)+1;} for(const i of b.inputs)for(const g of i.globals){tgt[g.resolvedName]=(tgt[g.resolvedName]||0)+1;}}
const all=new Set([...Object.keys(src),...Object.keys(tgt)]);
console.log('symbols',all.size);
console.log('no consumer:',[...all].filter(s=>!tgt[s]).join(','));
console.log('no source:',[...all].filter(s=>!src[s]).join(','));
