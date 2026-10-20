// Authorized exact manifest transfer; refuses unexpected working/source changes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateSalBindings} from '../src/sal-binding-validator.js';
const base=new URL('./',import.meta.url),repo=fs.realpathSync(fileURLToPath(new URL('../../',base))),migration=path.join(repo,'SafetyTests/test-migration-down-owner');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),mp=path.join(migration,'run-001-transfer-manifest.json');
const expectedManifest='bcaba17c54a0e6beb88f108d2182efce26d07c798333788dabb5f6fac705f74a';
if(sha(mp)!==expectedManifest)throw Error('Transfer manifest hash mismatch');
const m=JSON.parse(fs.readFileSync(mp)),proposed=JSON.parse(fs.readFileSync(new URL('PROPOSED_FILE_MAP.json',base)));
if(m.files.length!==24||new Set(m.files.map(r=>r.destination)).size!==24)throw Error('Expected exact24 distinct destinations');
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
if(!same(m.files.map(r=>r.destination),proposed.files.map(r=>r.target)))throw Error('Definitive/proposed payload list differs');
function resolveInside(root,relative){const absolute=path.resolve(root,relative);if(!absolute.toLowerCase().startsWith(root.toLowerCase()+path.sep))throw Error('Path outside authorized root '+relative);let p=absolute;while(!fs.existsSync(p))p=path.dirname(p);const real=fs.realpathSync(p);if(real.toLowerCase()!==root.toLowerCase()&&!real.toLowerCase().startsWith(root.toLowerCase()+path.sep))throw Error('Resolved ancestor outside root '+relative);return absolute;}
const inputsPath=path.join(migration,'run-001-inputs.json');if(sha(inputsPath)!==m.inputManifestSha256)throw Error('Pinned280 manifest changed');
const inputs=JSON.parse(fs.readFileSync(inputsPath));for(const r of inputs.files)if(sha(resolveInside(path.join(migration,'run-001'),r.path))!==r.sha256)throw Error('Pinned input changed '+r.path);
const rows=m.files.map(r=>{const source=resolveInside(migration,r.source),target=resolveInside(repo,r.destination),old=fs.existsSync(target)?sha(target):null;if(old!==r.oldSha256)throw Error('Working precondition mismatch '+r.destination);if(sha(source)!==r.newSha256)throw Error('Source mismatch '+r.source);const pp=proposed.files.find(p=>p.target===r.destination);if(pp.oldSha256!==r.oldSha256||pp.newSha256!==r.newSha256)throw Error('Proposed SHA differs '+r.destination);return {...r,sourceAbsolute:source,targetAbsolute:target};});
for(const p of proposed.protectedFiles)if(sha(resolveInside(repo,p.path))!==p.sha256)throw Error('Protected core changed '+p.path);
const preflight={status:'PASS',authorization:'root explicit final review READY and exact24file transfer',transferManifestSha256:expectedManifest,pinnedInputs:inputs.files.length,protectedCore:proposed.protectedFiles,rows};
fs.writeFileSync(new URL('TRANSFER_PREFLIGHT.json',base),JSON.stringify(preflight,null,2));
for(const r of rows){fs.mkdirSync(path.dirname(r.targetAbsolute),{recursive:true});fs.copyFileSync(r.sourceAbsolute,r.targetAbsolute);}
for(const r of rows)if(sha(r.targetAbsolute)!==r.newSha256)throw Error('Post-copy SHA mismatch '+r.destination);
for(const p of proposed.protectedFiles)if(sha(resolveInside(repo,p.path))!==p.sha256)throw Error('Protected core changed after copy '+p.path);
const salPath=resolveInside(repo,'MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal'),gvlPath=resolveInside(repo,'MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl'),audit=validateSalBindings(fs.readFileSync(salPath,'utf8'),fs.readFileSync(gvlPath,'utf8'));
const result={status:audit.status==='PASS'?'PASS':'ERROR',copied:24,sourceSha256:sha(salPath),sgvlSha256:sha(gvlPath),protectedCoreUnchanged:true,bindingAudit:audit,crc:'recorded metadata retained; not recomputed',copiedFiles:rows.map(r=>({path:r.destination,sha256:sha(r.targetAbsolute)}))};
fs.writeFileSync(new URL('TRANSFER_RESULT.json',base),JSON.stringify(result,null,2));console.log({status:result.status,copied:24,sourceSha256:result.sourceSha256,sgvlSha256:result.sgvlSha256,bindingErrors:audit.errors});
if(result.status!=='PASS')process.exitCode=1;
