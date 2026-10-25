import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const base=new URL('./',import.meta.url),repo=new URL('../../../',base),out=new URL('sandbox/SafetyTests/',base);
// Complete dependencies without overwriting the explicitly adapted observers.
for(const dir of ['scripts','fixtures','scenarios','docs','checkpoints'])fs.cpSync(new URL('SafetyTests/'+dir,repo),new URL(dir,out),{recursive:true});
for(const f of fs.readdirSync(new URL('SafetyTests/',repo),{withFileTypes:true}))if(f.isFile())fs.copyFileSync(new URL('SafetyTests/'+f.name,repo),new URL(f.name,out));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const meta={candidateSal:hash(new URL('TwinSafeGroup1.sal',base)),candidateGvl:hash(new URL('GVL1.sgvl',base)),helper:hash(new URL('test/helpers/safe-run-source.js',out)),observer:hash(new URL('src/physical-rnd-source.js',out)),mappings:['Safe retired AND/TON diagnostic paths→BOTH TON','retired FinishGreen/Blue→native TON outputs; FinishUp retained'],extraFiles:['candidate-handoff.test.js','candidate-gaps.test.js'],reference:'sandbox sibling reference absent unless separately provided; no substitution'};
const r=spawnSync('npm.cmd',['run','check:software'],{cwd:out,encoding:'utf8',maxBuffer:32*1024*1024,shell:true});
fs.writeFileSync(new URL('full-check255.log',base),r.stdout+r.stderr);fs.writeFileSync(new URL('full-check255-meta.json',base),JSON.stringify({...meta,exit:r.status},null,2));
for(const name of ['SOFTWARE_CHECK_RESULTS.json','SOFTWARE_CHECK_RESULTS.md','BOOT_PREFLIGHT_RESULTS.json'])if(fs.existsSync(new URL(name,out)))fs.copyFileSync(new URL(name,out),new URL('full255-'+name,base));
console.log({exit:r.status,stdout:r.stdout,error:r.error?.message});
