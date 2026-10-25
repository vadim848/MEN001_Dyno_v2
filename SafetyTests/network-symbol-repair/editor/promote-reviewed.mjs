import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const base='SafetyTests/network-symbol-repair',editor=`${base}/editor`,manifestFile=`${base}/tester/FINAL_TRANSFER_MANIFEST.json`;
const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8')),hash=p=>fs.existsSync(p)?crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'):null;
const sources=[
 {source:`${editor}/native-reviewed-output/TwinSafeGroup1.sal`,destination:'MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',sha256:manifest.salSha256,previousCanonicalSha256:'ffd6c64e567131cb4fd5c4dd58816e0e5e8bb4f60777142d7959d9cc591ef0d1'},
 {source:`${editor}/native-reviewed-output/GVL1.sgvl`,destination:'MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',sha256:manifest.sgvlSha256,previousCanonicalSha256:'4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5'},
 {source:`${editor}/native-reviewed-output/TwinSafeGroup1.sal.diagram`,destination:'MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal.diagram',sha256:manifest.diagramSha256,previousCanonicalSha256:'17ebe04ad3ab1d43a77676e69cebc443b6dbf7cf6c09e394f2a0e84a04458699'},
 ...manifest.files
];assert.equal(sources.length,13);
const approvals=JSON.parse(fs.readFileSync(`${base}/reviewer/FINAL_APPROVED_FILES.json`,'utf8'));
for(const item of manifest.files){const approved=approvals.find(a=>`SafetyTests/${a.file}`===item.destination);assert(approved&&approved.matchesExecuted&&approved.sha256===item.sha256,`Reviewed identity ${item.destination}`);}
for(const item of sources){assert.equal(hash(item.source),item.sha256,`Frozen source changed: ${item.source}`);assert.equal(hash(item.destination),item.previousCanonicalSha256,`Canonical changed; STOP: ${item.destination}`);}
for(const item of manifest.unchangedOriginalCore)assert.equal(hash(`SafetyTests/${item.file}`),item.sha256,`Original core changed: ${item.file}`);
const recursive=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?recursive(`${dir}/${d.name}`):[`${dir}/${d.name}`]);
const projectFiles=[...recursive('MEN001_Dyno'),...recursive('TwinCAT Drive Manager 2 Project1'),'MEN001_Dyno.sln'];
const projectBefore=Object.fromEntries(projectFiles.map(p=>[p,hash(p)]));
const preflight={status:'PRECONDITIONS_PASS_AWAITING_LEAD_GO',manifestSha256:hash(manifestFile),files:sources.map(s=>({...s,beforeSha256:hash(s.destination)})),unchangedProjectFileCount:projectFiles.length,projectBefore};
if(!process.argv.includes('--apply')){fs.writeFileSync(`${editor}/PROMOTION_PREFLIGHT.json`,JSON.stringify(preflight,null,2));console.log('PASS: all13canonical preconditions and frozen reviewed identities; NO canonical writes');process.exit(0);}
assert.equal(process.env.NETWORK_SYMBOL_REPAIR_LEAD_GO,'APPROVED_13_FILES','Explicit lead GO required');
const previous=JSON.parse(fs.readFileSync(`${editor}/PROMOTION_PREFLIGHT.json`,'utf8'));
assert.equal(previous.manifestSha256,preflight.manifestSha256);assert.deepEqual(previous.projectBefore,projectBefore,'Project changed since preflight; STOP');
for(const item of sources){if(fs.existsSync(item.destination)){const backup=`${editor}/promotion-backup/${item.destination}`;fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(item.destination,backup);}}
for(const item of sources){fs.mkdirSync(path.dirname(item.destination),{recursive:true});fs.copyFileSync(item.source,item.destination);assert.equal(hash(item.destination),item.sha256,`Postcopy identity ${item.destination}`);}
const allowed=new Set(sources.slice(0,3).map(s=>s.destination));
for(const[file,before]of Object.entries(projectBefore))if(!allowed.has(file))assert.equal(hash(file),before,`Unexpected canonical project delta: ${file}`);
for(const item of manifest.unchangedOriginalCore)assert.equal(hash(`SafetyTests/${item.file}`),item.sha256);
const result={...preflight,status:'PROMOTED_EXACT_REVIEWED_BYTES',files:preflight.files.map(s=>({...s,afterSha256:hash(s.destination)})),otherCanonicalProjectFilesUnchanged:true,originalCoreUnchanged:true};
fs.writeFileSync(`${editor}/PROMOTION_RESULTS.json`,JSON.stringify(result,null,2));console.log('PASS:13approved files binarycopied; allSHA256verified; no other canonical project deltas');
