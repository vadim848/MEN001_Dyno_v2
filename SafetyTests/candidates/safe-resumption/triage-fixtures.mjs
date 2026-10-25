// Follow-up diagnostics only. Original full255 RED report remains untouched.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const base=new URL('./',import.meta.url),out=new URL('sandbox/',base),testdir=new URL('SafetyTests/test/',out);
const edits=[];
for(const name of ['current-door-interlock.test.js','current-hv-set-permit.test.js','current-mentee-set-permit.test.js']){
 const original=fs.readFileSync(new URL(name,testdir),'utf8'),needle='.find(n=>n.name==="RndPhysicalCompact").blocks';
 if(!original.includes(needle))throw Error('Fixture source changed '+name);
 const copy=original.replaceAll(needle,'.filter(n=>["RndPhysicalCompact","SafeResumption"].includes(n.name)).flatMap(n=>n.blocks)');
 fs.writeFileSync(new URL('triage-'+name,testdir),copy);edits.push({file:name,change:'Add actual new SafeResumption producer blocks alongside existing compact recognizer; no assertion changed'});
}
const name='current-unlock-estop-permit.test.js',original=fs.readFileSync(new URL(name,testdir),'utf8');
const copy="import {createSafeRunFixture} from './helpers/safe-run-source.js';\n"+original.replace('function prepared(mode) {',`function prepared(mode) {
  if(mode==='Safe'){const x=createSafeRunFixture('Safe');x.sample({in_Relase_Door_PB:true});x.advance(600);assert.equal(x.get('unlock'),true,'full actual-source dynamic cone healthy positive');return x.r;}
`);
fs.writeFileSync(new URL('triage-'+name,testdir),copy);edits.push({file:name,change:'Safe setup uses audited dynamic source dependency fixture, declared Network3 boundary and real EStop restart/fullrelease; original fault assertions untouched'});
const files=[...edits.map(e=>'SafetyTests/test/triage-'+e.file)];
const r=spawnSync(process.execPath,['--test','--test-name-pattern','actual HV chain|real legacy|MENTEE05 paired|UNLOCK07',...files],{cwd:out,encoding:'utf8',maxBuffer:16*1024*1024});
fs.writeFileSync(new URL('fixture-triage255.log',base),r.stdout+r.stderr);fs.writeFileSync(new URL('fixture-triage255-edits.json',base),JSON.stringify({edits,exit:r.status,limits:['diagnostic copied fixtures only','full report remains RED','this is not acceptance of omitted source assumptions']},null,2));console.log({exit:r.status,summary:r.stdout.match(/# tests[^]*$/)?.[0]});
