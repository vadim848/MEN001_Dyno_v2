import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const here=import.meta.dirname,candidate=path.join(here,'../editor/candidate/TwinSafeGroup1.sal'),gvl=path.join(here,'../editor/candidate/GVL1.sgvl');
const source=fs.readFileSync(candidate,'utf8'),dir=path.join(here,'mutations');fs.mkdirSync(dir,{recursive:true});
const cases=[
 ['active-NC-removed',s=>s.replace('deactivate1="Break Contact (NC)"','')],
 ['extra-whitespace',s=>s.replace('<networks>','<networks> ')],
 ['WINDOW-timer-changed',s=>s.replace('timing="250"','timing="251"')],
 ['contact-polarity-changed',s=>s.replace('deactivate1="Break Contact (NC)"','deactivate1="Make Contact (NO)"')]
];
const results=[];
for(const [name,mutate]of cases){const altered=mutate(source);assert.notEqual(altered,source,name+' mutation applies');const file=path.join(dir,name+'.sal');fs.writeFileSync(file,altered);const run=spawnSync(process.execPath,[path.join(here,'verify.mjs'),file,gvl],{encoding:'utf8',maxBuffer:1024*1024});assert.notEqual(run.status,0,name+' must reject');results.push({name,status:'REJECTED',exitCode:run.status});}
fs.writeFileSync(path.join(here,'MUTATION_RESULTS.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
