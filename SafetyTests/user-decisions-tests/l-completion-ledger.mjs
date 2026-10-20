import fs from 'node:fs';
import {createRndDownFixture} from './lifecycle-source.js';
import {compressFrames} from '../test/helpers/safe-run-source.js';
const x=createRndDownFixture(),off={in_Reset_PB:false,in_Relase_Door_PB:false};
function wait(key,value){const end=x.clock.timeMs+2000;while(x.get(key)!==value&&x.clock.timeMs<end)x.sample();if(x.get(key)!==value)throw Error('Fixture '+key);}
x.sample({in_Reset_PB:true,in_Relase_Door_PB:true});x.advance(1000);wait('lv',true);x.sample({in_LV_C1_FBK:true});wait('b_Step_RnD',true);x.sample(off);x.advance(2100);x.sample({in_Reset_PB:true});wait('SG',true);wait('lv',false);x.sample({in_LV_C1_FBK:false});wait('b_Step2',true);wait('b_Step_RnD',false);x.sample(off);x.advance(2500);
const last=x.frames.at(-1);
fs.writeFileSync(new URL('l-completion-ledger.json',import.meta.url),JSON.stringify({status:'NOT VERIFIED eventual Safe; source proof candidate for architect, no deadline oracle',scope:x.scope,last,protocolWrites:x.protocolWrites,frames:compressFrames(x.frames)},null,2));
console.log(JSON.stringify(last));
