import fs from 'node:fs';
import crypto from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
const results=[],archives=[];
for(const name of ['baseline-results','startingrun-results']){
 const raw=new URL(name+'.json',import.meta.url),zip=new URL(name+'.json.gz',import.meta.url);
 if(fs.existsSync(raw)){const bytes=fs.readFileSync(raw);fs.writeFileSync(zip,gzipSync(bytes));if(!gunzipSync(fs.readFileSync(zip)).equals(bytes))throw Error('Lossless roundtrip failed');fs.unlinkSync(raw);}
 const bytes=gunzipSync(fs.readFileSync(zip)),report=JSON.parse(bytes);
 archives.push({file:name+'.json.gz',rawSha256:crypto.createHash('sha256').update(bytes).digest('hex'),compressedSha256:crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex'),roundtrip:'PASS'});
 for(const r of report.results)results.push({id:r.id,status:r.status,checks:r.checks,notes:r.notes,marks:r.marks,sourceSha256:r.scope?.sourceSha256,sgvlSha256:r.scope?.sgvlSha256,audit:r.scope?.sourceAudit??r.scope?.bindingAudit?.status,observedTransitions:r.frames?.length,scopeLimits:r.scope?.limits,firstDown:r.frames?.find(f=>f.signals.runPhysical||f.signals.runStop||f.signals.runResetSto1),limits:r.limits,error:r.error});
}
const totals=Object.fromEntries(['PASS','FAIL','NOT VERIFIED','ERROR'].map(s=>[s,results.filter(r=>r.status===s).length]));
fs.writeFileSync(new URL('SUMMARY.json',import.meta.url),JSON.stringify({kind:'Current source baseline, independent diagnostic cases, not full acceptance',totals,archives,results},null,2));
console.log(totals);
