import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const root=process.env.MEN001_TEST_ROOT?pathToFileURL(path.resolve(process.env.MEN001_TEST_ROOT)+'/'):new URL('../../../../',import.meta.url);
const {createRndDownFixture}=await import(new URL('SafetyTests/test/helpers/rnd-down-source.js',root));
const rows=[],both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false};
function wait(x,k,v){const end=x.clock.timeMs+2500;while(x.get(k)!==v&&x.clock.timeMs<end)x.sample();if(x.get(k)!==v)throw Error('Preparation unavailable '+k+'='+v);return x.clock.timeMs;}
for(const lvHealthyAtRun of [true,false]){const x=createRndDownFixture(),marks={};try{
 x.sample(both);x.advance(1000);wait(x,'lv',true);x.sample({in_LV_C1_FBK:true});wait(x,'b_Step_RnD',true);x.sample(off);x.advance(2100);
 x.sample({in_STO_DR1_FBK:false,in_STO_DR2_FBK:false,in_HV_C2_FBK:true,in_HV_Healthy_FBK:true});x.sample(both);x.advance(1000);marks.launch=wait(x,'SU',true);wait(x,'sto1',true);wait(x,'sto2',true);x.sample(off);x.advance(2100);
 marks.confirmRaw=x.sample({in_LV_Healthy_FBK:lvHealthyAtRun,in_HV_Healthy_FBK:false});marks.run=wait(x,'b_Step3',true);x.advance(2100);
 const before=x.frames.at(-1),stableRun=x.get('b_Step3')&&!x.get('b_Step4')&&x.get('hv');
 if(!stableRun){rows.push({lvHealthyAtRun,status:'PREPARATION_NOT_VERIFIED',marks,before,reason:'Historic LVHealthyTRUE remains direct PreRnD profile, but inverted RunHealthy guard selects protectiveStep4; not a normaldown test'});continue;}
 marks.green=x.sample({in_Reset_PB:true});x.advance(500);marks.stop=wait(x,'runPhysical',true);x.advance(1999);
 const firstHvOff=x.frames.find(f=>f.timeMs>=marks.stop&&!f.signals.hv),firstLvOff=x.frames.find(f=>f.timeMs>=marks.stop&&!f.signals.lv);
 rows.push({lvHealthyAtRun,status:firstHvOff||firstLvOff?'FAIL':'PASS',marks,before,firstHvOff,firstLvOff,unresolved:x.unbound(),scope:x.scope,limit:'Observed1999ms is a necessary consequence of approved SS1minimum2s; full discharge/SS1 edge observer still required. Source-derived phase rawprofile is not universal electrical polarity claim.'});
}catch(error){rows.push({lvHealthyAtRun,status:'ERROR',error:error.stack,marks,last:x.frames.at(-1)});}}
fs.writeFileSync(new URL('normal-run-profile-results.json',import.meta.url),JSON.stringify({rows})+'\n');console.log(JSON.stringify(rows.map(({lvHealthyAtRun,status,marks,firstHvOff,firstLvOff,reason,error})=>({lvHealthyAtRun,status,marks,firstHvOff:firstHvOff?.timeMs,firstLvOff:firstLvOff?.timeMs,reason,error})),null,2));
