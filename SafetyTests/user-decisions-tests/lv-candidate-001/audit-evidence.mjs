import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {gunzipSync,gzipSync} from 'node:zlib';
const here=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:\/)/,'$1')),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),checks=[];
for(const entry of fs.readdirSync(here).filter(f=>/^(healthy|firstEligible|RndClearGap)-.*\.json\.gz$/.test(f))){
 const report=JSON.parse(gunzipSync(fs.readFileSync(path.join(here,entry))));const accepted=report.frames.find(f=>f.timeMs>=report.marks.green&&f.signals.SG);if(!accepted)throw Error('No actual accepted SG '+entry);
 const end=report.marks.fresh??Infinity,frames=report.frames.filter(f=>f.timeMs>=accepted.timeMs&&f.timeMs<end);
 let replay=false;for(let i=1;i<frames.length;i++)for(const key of ['lv','hv'])if(!frames[i-1].signals[key]&&frames[i].signals[key])replay=true;
 const item={file:entry,acceptedActualSg:accepted.timeMs,untilFreshGesture:end===Infinity?'end':end,noDownStep2:frames.every(f=>!f.signals.b_Step2),noNewEnergySet:frames.every(f=>!f.signals.lvPermittedSet&&!f.signals.hvPermittedSet&&!f.signals.lvProposal&&!f.signals.hvProposal),noOffToOnReplay:!replay,sourceSha256:report.scope.sourceSha256,sgvlSha256:report.scope.sgvlSha256};checks.push(item);
}
const inputs=JSON.parse(fs.readFileSync(path.join(here,'REGRESSION_INPUTS.json')));for(const item of inputs.files)if(hash(path.join(here,item.path))!==item.sha256)throw Error('Regression input mutated '+item.path);
for(const name of ['safe-results.json']){const p=path.join(here,name);if(fs.existsSync(p)){const b=fs.readFileSync(p),z=gzipSync(b);if(!gunzipSync(z).equals(b))throw Error('Archive mismatch');fs.writeFileSync(p+'.gz',z);fs.unlinkSync(p);}}
const runtime=['sal-runtime.js','sal-parser.js','sal-binding-validator.js','observed-samples.js','estop-native-pairs.js'].map(name=>({name,sha256:hash(path.join(here,'regression/SafetyTests/src',name))}));
const status=checks.every(c=>c.noDownStep2&&c.noNewEnergySet&&c.noOffToOnReplay)?'PASS':'FAIL';fs.writeFileSync(path.join(here,'ACCEPTED_DOWN_AUDIT.json'),JSON.stringify({status,checks,regressionInputIntegrity:'PASS',runtime},null,2));console.log('Accepted down full-interval audit',status,checks.length);
if(status!=='PASS')process.exitCode=1;
