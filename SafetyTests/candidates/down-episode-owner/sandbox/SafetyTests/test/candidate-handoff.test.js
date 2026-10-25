import test from 'node:test';
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
