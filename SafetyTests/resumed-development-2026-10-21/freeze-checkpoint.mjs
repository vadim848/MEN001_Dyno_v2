// Lossless evidence packaging only. Does not modify program or test sources.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'../..');
const baseline=path.join(here,'tester/baseline');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const ledger={scope:'Frozen RED checkpoint; no implementation, no review gate passed',files:[]};
function copy(from,to){fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);ledger.files.push({source:path.relative(repo,from).replaceAll('\\','/'),snapshot:path.relative(repo,to).replaceAll('\\','/'),sha256:sha(to)});}
for(const name of ['SOFTWARE_CHECK_RESULTS.json','SOFTWARE_CHECK_RESULTS.md','SAL_NATIVE_STRUCTURE_RESULTS.json','BOOT_PREFLIGHT_RESULTS.json']){
 copy(path.join(baseline,'sandbox/v2/SafetyTests',name),path.join(baseline,'final-reports',name));
}
for(const [from,name] of [
 ['MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal','TwinSafeGroup1.sal'],
 ['MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal.diagram','TwinSafeGroup1.sal.diagram'],
 ['MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl','GVL1.sgvl']])copy(path.join(repo,from),path.join(baseline,'source',name));
for(const name of ['lifecycle-red-results.json','lifecycle-red-v2-results.json']){
 const input=path.join(here,'tester',name),output=input+'.gz';
 const hash=crypto.createHash('sha256');
 const reader=fs.createReadStream(input);reader.on('data',chunk=>hash.update(chunk));
 await pipeline(reader,zlib.createGzip({level:6}),fs.createWriteStream(output));
 ledger.files.push({source:path.relative(repo,input).replaceAll('\\','/'),snapshot:path.relative(repo,output).replaceAll('\\','/'),uncompressedSha256:hash.digest('hex'),compressedSha256:sha(output),uncompressedBytes:fs.statSync(input).size,compressedBytes:fs.statSync(output).size});
}
fs.writeFileSync(path.join(here,'CHECKPOINT_FILES.json'),JSON.stringify(ledger,null,2)+'\n');
console.log(JSON.stringify(ledger.files.map(x=>({snapshot:x.snapshot,bytes:x.compressedBytes??fs.statSync(path.join(repo,x.snapshot)).size})),null,2));
