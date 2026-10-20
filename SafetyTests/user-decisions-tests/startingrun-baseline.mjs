import fs from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createRndDownFixture} from './lifecycle-source.js';
import {compressFrames} from '../test/helpers/safe-run-source.js';
const off={in_Reset_PB:false,in_Relase_Door_PB:false},both={in_Reset_PB:true,in_Relase_Door_PB:true},results=[];
function wait(x,key,value,budget=2000){const end=x.clock.timeMs+budget;while(x.get(key)!==value&&x.clock.timeMs<end)x.sample();if(x.get(key)!==value)throw Error('Fixture preparation missing '+key+'='+value);return x.clock.timeMs;}
for(const context of ['C2OFF','C2ON-healthy-unconfirmed']){
 let x;const checks=[],marks={};const e=(label,actual,expected)=>checks.push({label,actual,expected,status:JSON.stringify(actual)===JSON.stringify(expected)?'PASS':'FAIL'});
 try{
 x=createRndDownFixture();x.sample(both);x.advance(1000);wait(x,'lv',true);x.sample({in_LV_C1_FBK:true});wait(x,'b_Step_RnD',true);x.sample(off);x.advance(2100);
 x.sample({in_STO_DR1_FBK:false,in_STO_DR2_FBK:false,in_HV_C2_FBK:context!=='C2OFF',in_HV_Healthy_FBK:true});
 marks.launchGesture=x.sample(both);x.advance(1000);marks.accepted=wait(x,'SU',true);wait(x,'sto1',true);wait(x,'sto2',true);
 if(x.get('b_Step3')||x.get('confirmRun'))throw Error('StartingRun already confirmed during preparation');
 x.sample(off);x.advance(2100);if(!x.get('SU')||x.get('b_Step3')||x.get('confirmRun'))throw Error('Cannot hold actual unconfirmed accepted StartingRun through cleanup');
 marks.freshGreen=x.sample({in_Reset_PB:true});x.advance(499);e('No normal stop before fresh green500',x.frames.filter(f=>f.timeMs>=marks.freshGreen).some(f=>f.signals.runStop),false);
 x.sample();x.advance(20);marks.afterQualification=x.clock.timeMs;
 const keys=['runResetSto1','runResetSto2','runDischarge','runResetHv'];
 e('Fresh green500 initiates normal Run-down stop owner/fanout',keys.every(k=>x.frames.some(f=>f.timeMs>=marks.freshGreen&&f.signals[k])),true);
 e('Run remains unconfirmed before abort feedback probe',x.get('b_Step3')||x.get('confirmRun'),false);
 marks.lateConfirmation=x.sample({in_HV_C2_FBK:true,in_HV_Healthy_FBK:false});x.advance(200);
 e('Late launch feedback cannot complete cancelled launch',x.frames.filter(f=>f.timeMs>=marks.lateConfirmation).some(f=>f.signals.b_Step3||f.signals.confirmRun),false);
 e('No demanded fallback',x.unbound(),[]);
 results.push({id:'T-'+context,status:checks.some(c=>c.status==='FAIL')?'FAIL':'PASS',checks,marks,scope:x.scope,protocolWrites:x.protocolWrites,frames:compressFrames(x.frames),blockEvents:x.blockEvents,limits:['Full HV shutdown endpoint remains NOT VERIFIED; independent unresolved completion contract','1ms native causal propagation observation after threshold; no physical deadline asserted']});
 }catch(error){results.push({id:'T-'+context,status:'ERROR',error:error.stack,checks,marks,scope:x?.scope,last:x?.frames.at(-1),limits:['Failed preparation is fixture ERROR, not SAL defect']});}
 console.log(results.at(-1).id,results.at(-1).status);
}
fs.writeFileSync(new URL('startingrun-results.json.gz',import.meta.url),gzipSync(JSON.stringify({results},null,2)));
