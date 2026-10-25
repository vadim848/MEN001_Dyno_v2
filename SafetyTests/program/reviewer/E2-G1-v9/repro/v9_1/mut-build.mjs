// Reviewer: build mutant roots of candidates/E2d (c2f9ccd7) for M-E2d-34..38 (MUTATION_PLAN_E2d 601b62f5) via src/sal-mutations.js
import fs from 'node:fs';import path from 'node:path';
const {applyMutation}=await import('file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-mutations.js');
const [,,baseRoot,outBase]=process.argv;const plan=JSON.parse(fs.readFileSync('C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/MUTATION_PLAN_E2d.json','utf8'));
const L=(plan.mutations||plan.mutants||plan);const list=(Array.isArray(L)?L:Object.values(L)).filter(m=>/M-E2d-3[4-8]$/.test(m.id));
const salRel='MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal';const xml=fs.readFileSync(path.join(baseRoot,salRel),'utf8');
for(const m of list){const dst=path.join(outBase,'root-'+m.id);fs.cpSync(baseRoot,dst,{recursive:true});const r=applyMutation(xml,m);fs.writeFileSync(path.join(dst,salRel),r.xml);console.log(m.id,JSON.stringify(r.change));}
