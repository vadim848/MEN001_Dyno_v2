import fs from 'node:fs';
import crypto from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const base=new URL('./',import.meta.url),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const files=['README.md','test/current-rnd-down-no-reenergy.test.js','test/helpers/rnd-down-source.js','run-target.mjs','target.log','target-identity.json','package.mjs'];
const evidence=fs.readdirSync(new URL('evidence/',base)).map(name=>{const bytes=fs.readFileSync(new URL('evidence/'+name,base)),raw=gunzipSync(bytes),trace=JSON.parse(raw);return{path:'evidence/'+name,sha256:sha(bytes),bytes:bytes.length,uncompressedSha256:sha(raw),uncompressedBytes:raw.length,scans:trace.frames.length,sourceSha256:trace.scope.sourceSha256,sgvlSha256:trace.scope.sgvlSha256,sourceAudit:trace.scope.sourceAudit};});
const report={status:'READY for review; canonical files untouched',canonicalProposal:files.filter(f=>f.startsWith('test/')),files:files.map(name=>({path:name,sha256:sha(fs.readFileSync(new URL(name,base)))})),evidence,sourceMode:'Relative working SAL/SGVL only; no source override',runtimeCopies:fs.readdirSync(new URL('src/',base)).filter(n=>n.endsWith('.js')).map(name=>({path:'src/'+name,sha256:sha(fs.readFileSync(new URL('src/'+name,base)))}))};
fs.writeFileSync(new URL('package-identity.json',base),JSON.stringify(report,null,2));console.log({canonicalFiles:2,evidenceArchives:evidence.length,tests:4});
