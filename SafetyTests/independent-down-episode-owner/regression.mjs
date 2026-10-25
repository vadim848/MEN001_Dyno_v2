import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const base=new URL('./',import.meta.url),repo=new URL('../',base),sandbox=new URL('sandbox/',base);
fs.cpSync(new URL('test/',repo),new URL('SafetyTests/test/',sandbox),{recursive:true});
for(const name of fs.readdirSync(repo).filter(n=>n.endsWith('.json')))fs.copyFileSync(new URL(name,repo),new URL('SafetyTests/'+name,sandbox));
for(const rel of ['TwinSafeGroup1/TwinSafeGroup1.sal','GVLs/GVL1.sgvl']){const dst=new URL('MEN001_Dyno/Safety_Dyno/'+rel,sandbox);fs.mkdirSync(new URL('./',dst),{recursive:true});fs.copyFileSync(new URL('fixtures/candidate/MEN001_Dyno/Safety_Dyno/'+rel,base),dst);}
const tests=['current-rnd-physical-integration.test.js','current-early-sto.test.js'],rows=[];
for(const name of tests){const r=spawnSync(process.execPath,['--test','SafetyTests/test/'+name],{cwd:sandbox,encoding:'utf8',maxBuffer:32*1024*1024});fs.writeFileSync(new URL(name+'.log',base),r.stdout+r.stderr);rows.push({test:name,sha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('test/'+name,repo))).digest('hex'),exit:r.status,summary:r.stdout.match(/# tests[^]*$/)?.[0]});}
fs.writeFileSync(new URL('regression-results.json',base),JSON.stringify({rows,limits:['Unchanged software tests/runtime in isolated source substitution','No FinishUp remapping or oracle changes','No native/hardware execution']},null,2));console.log(rows);process.exitCode=rows.every(r=>r.exit===0)?0:1;
