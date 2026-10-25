// Candidate-only fixture adaptation: observation paths for retired Safe TON.
// Every state owner/producer included by the original fixture remains real;
// its Network3 cut remains an explicit limit (not lifecycle acceptance).
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const base=new URL('./',import.meta.url),out=new URL('sandbox/',base);
const helper=new URL('SafetyTests/test/helpers/safe-run-source.js',out);
let s=fs.readFileSync(helper,'utf8').replaceAll('//Network2/FBAnd10/AndOut','//RndPhysicalCompact/BOTH/TonOut').replaceAll('//Network2/FBTon3/TonOut','//RndPhysicalCompact/BOTH/TonOut').replaceAll('//Network2/FBTon3/TonIn','//RndPhysicalCompact/BOTH/TonIn');
fs.writeFileSync(helper,s);
const text=`import test from 'node:test';
import assert from 'node:assert/strict';
import {createSafeRunFixture} from './helpers/safe-run-source.js';
for(const releaseFirst of [false,true])test('B1 guard-ready '+(releaseFirst?'after release':'while held'),()=>{
const x=createSafeRunFixture('Safe',{scanMs:10,rawOverrides:{in_STO_DR1_FBK:false,in_STO_DR2_FBK:false}});
x.sample({in_Reset_PB:true,in_Relase_Door_PB:true});x.advance(1100);
assert.equal(x.get('safeTonQ'),true);assert.equal(x.get('safeUp'),false);
if(releaseFirst)x.sample({in_Reset_PB:false,in_Relase_Door_PB:false});
x.sample({in_STO_DR1_FBK:true,in_STO_DR2_FBK:true});x.advance(300);
assert.equal(x.get('safeReady'),true);assert.equal(x.get('safeUp'),!releaseFirst);
assert.deepEqual(x.unbound(),[]);
});
`;
fs.writeFileSync(new URL('SafetyTests/test/candidate-handoff.test.js',out),text);
const r=spawnSync(process.execPath,['--test','SafetyTests/test/candidate-handoff.test.js','SafetyTests/test/current-safe-run-gestures.test.js'],{cwd:out,encoding:'utf8',maxBuffer:16*1024*1024});fs.writeFileSync(new URL('handoff.log',base),r.stdout+r.stderr);console.log({exit:r.status,summary:r.stdout.match(/# tests[^]*$/)?.[0]});
