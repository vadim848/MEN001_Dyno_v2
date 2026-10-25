import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const base=new URL('./',import.meta.url);
const sal=new URL('../../candidates/down-episode-owner/v2/TwinSafeGroup1.sal',base),sgvl=new URL('../../candidates/down-episode-owner/v2/GVL1.sgvl',base);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if(hash(sal)!=='72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e'||hash(sgvl)!=='de0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56')throw Error('Isolated target freeze mismatch');
const sandbox=new URL('sandbox/',base);
fs.mkdirSync(new URL('SafetyTests/',sandbox),{recursive:true});
for(const dir of ['src','test'])fs.cpSync(new URL(dir+'/',base),new URL('SafetyTests/'+dir+'/',sandbox),{recursive:true});
fs.writeFileSync(new URL('SafetyTests/package.json',sandbox),'{"type":"module"}');
for(const [src,rel]of [[sal,'TwinSafeGroup1/TwinSafeGroup1.sal'],[sgvl,'GVLs/GVL1.sgvl']]){const dst=new URL('MEN001_Dyno/Safety_Dyno/'+rel,sandbox);fs.mkdirSync(new URL('./',dst),{recursive:true});fs.copyFileSync(src,dst);}
const r=spawnSync(process.execPath,['--test','SafetyTests/test/current-rnd-down-no-reenergy.test.js'],{cwd:fileURLToPath(sandbox),env:{...process.env,MEN001_RND_DOWN_EVIDENCE_DIR:fileURLToPath(new URL('evidence/',base))},encoding:'utf8',maxBuffer:8*1024*1024});
fs.writeFileSync(new URL('target.log',base),r.stdout+r.stderr);
const files=['test/current-rnd-down-no-reenergy.test.js','test/helpers/rnd-down-source.js','run-target.mjs'];
fs.writeFileSync(new URL('target-identity.json',base),JSON.stringify({sourceSha256:hash(sal),sgvlSha256:hash(sgvl),sourceMode:'Isolated canonical filesystem copy. Tests/helper always read their working SAL/SGVL; no source ENV override.',exit:r.status,files:files.map(name=>({path:name,sha256:hash(new URL(name,base))})),summary:r.stdout.match(/# tests[^]*$/)?.[0]},null,2));
console.log({exit:r.status,summary:r.stdout.match(/# tests[^]*$/)?.[0]});process.exitCode=r.status??1;
