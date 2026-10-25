import test from 'node:test';
import assert from 'node:assert/strict';
import {createSafeRunFixture} from './helpers/safe-run-source.js';
const off={in_Reset_PB:false,in_Relase_Door_PB:false},both={in_Reset_PB:true,in_Relase_Door_PB:true};
const any=(x,keys,from)=>x.frames.some(f=>f.timeMs>=from&&keys.some(k=>f.signals[k]));
test('Safe green full release then blue remains available',()=>{
const x=createSafeRunFixture('Safe',{scanMs:10});
const start=x.sample({in_Reset_PB:true});x.advance(600);
assert.equal(any(x,['safeUp','safeTransition','safeBlue','rndBlue','unlock'],start),false);
x.sample(off);x.advance(2000);x.sample({in_Relase_Door_PB:true});x.advance(520);
assert.equal(x.get('safeBlue'),true);assert.equal(x.get('unlock'),true);assert.deepEqual(x.unbound(),[]);
});
test('Safe absent connectors allow blue access but block valid energy chord',()=>{
const x=createSafeRunFixture('Safe',{scanMs:10,rawOverrides:{in_LV_Connector_Interlock:false,in_HV_Connector_Interlock:false}});
x.sample({in_Relase_Door_PB:true});x.advance(520);assert.equal(x.get('unlock'),true);
x.sample(off);x.advance(2000);const start=x.sample(both);x.advance(1200);
assert.equal(any(x,['safeUp','safeTransition','lv','hv'],start),false);assert.equal(x.get('estop'),true);assert.deepEqual(x.unbound(),[]);
});
test('Safe first EStop clears grant and fresh restart fullrelease restores availability',()=>{
const x=createSafeRunFixture('Safe',{scanMs:10});x.sample({in_Relase_Door_PB:true});x.advance(520);assert.equal(x.get('unlock'),true);
const fault=x.sample({in_ES_NC_1:false});x.advance(30);assert.equal(x.get('estop'),false);assert.equal(x.get('unlock'),false);
x.sample({...off,in_ES_NC_1:true});x.advance(100);assert.equal(x.get('estop'),false);
x.sample({in_Reset_PB:true});x.sample({in_Reset_PB:false});x.advance(2100);assert.equal(x.get('estop'),true);
const fresh=x.sample({in_Relase_Door_PB:true});x.advance(520);assert.equal(x.get('safeBlue'),true);assert.equal(x.get('unlock'),true);
assert.deepEqual(x.unbound(),[]);
});
