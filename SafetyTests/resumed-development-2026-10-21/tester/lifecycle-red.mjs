import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
const root=process.env.MEN001_TEST_ROOT?pathToFileURL(path.resolve(process.env.MEN001_TEST_ROOT)+'/'):new URL('../../../',import.meta.url);
const {createRndDownFixture}=await import(new URL('SafetyTests/test/helpers/rnd-down-source.js',root));
const {compressFrames}=await import(new URL('SafetyTests/test/helpers/safe-run-source.js',root));
const {inspectNativeSalStructure}=await import(new URL('SafetyTests/src/sal-native-structure.js',root));
const sal=new URL('MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',root);const native=inspectNativeSalStructure(fs.readFileSync(sal,'utf8'));if(native.status!=='PASS')throw Error(JSON.stringify(native));
const rows=[],both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false},neutral={inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:false};
function wait(x,key,value,budget=2500){const end=x.clock.timeMs+budget;while(x.get(key)!==value&&x.clock.timeMs<end)x.sample();if(x.get(key)!==value)throw Error('Fixture preparation unavailable '+key+'='+value+'; diagnostic budget is not oracle');return x.clock.timeMs;}
function enterRnd(x){x.sample(both);x.advance(1000);wait(x,'lv',true);x.sample({in_LV_C1_FBK:true});wait(x,'b_Step_RnD',true);x.sample(off);x.advance(2100);}
function scenario(id,body){let x;const checks=[],marks={};const e=(label,actual,expected)=>checks.push({label,actual,expected});try{x=createRndDownFixture();enterRnd(x);body(x,e,marks);e('no demanded fallback',x.unbound(),[]);rows.push({id,status:checks.some(c=>JSON.stringify(c.actual)!==JSON.stringify(c.expected))?'FAIL':'PASS',checks,marks,scope:x.scope,protocolWrites:x.protocolWrites,frames:compressFrames(x.frames),blockEvents:x.blockEvents});}catch(error){rows.push({id,status:'ERROR',error:error.stack,checks,marks,scope:x?.scope,last:x?.frames.at(-1)});}console.log(id,rows.at(-1).status);}
for(const request of ['up','down'])scenario(`QP-new-PLC-${request}-buttonsOFF`,(x,e,m)=>{
 x.sample(neutral);x.advance(10);m.request=x.sample({inPLC_RnD_Mode:request==='up',inPLC_RnD_Mode_2:request==='up'});x.advance(10);
 e('standalone new PLC request accepted without physical gesture',x.frames.some(f=>f.timeMs>=m.request&&f.signals[request]),true);
 e('PLC route does not fabricate physical SU/SG',x.frames.filter(f=>f.timeMs>=m.request).some(f=>f.signals.SU||f.signals.SG),false);
});
for(const button of ['green','blue'])for(const request of ['up','down'])scenario(`QP-ignore-${request}-${button}pressed-noqueue`,(x,e,m)=>{
 x.sample(neutral);x.advance(10);x.sample(button==='green'?{in_Reset_PB:true}:{in_Relase_Door_PB:true});x.advance(100);
 m.request=x.sample({inPLC_RnD_Mode:request==='up',inPLC_RnD_Mode_2:request==='up'});x.advance(100);
 e('either pressed button rejects PLC before physical single qualification',x.frames.filter(f=>f.timeMs>=m.request).some(f=>f.signals.up||f.signals.down),false);
 m.released=x.sample(off);x.advance(2100);
 e('ignored held PLC code cannot queue on physical release',x.frames.filter(f=>f.timeMs>=m.released).some(f=>f.signals.up||f.signals.down),false);
});
scenario('QP-physical-green500-then-PLC11-down-priority',(x,e,m)=>{
 x.sample(neutral);x.advance(10);m.green=x.sample({in_Reset_PB:true});x.advance(500);wait(x,'SG',true);wait(x,'lv',false);
 m.request=x.sample({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});x.advance(20);
 e('accepted down cannot coexist with new up',x.frames.filter(f=>f.timeMs>=m.request).some(f=>f.signals.up&&f.signals.down),false);
 e('no HV permittedSet while down active',x.frames.filter(f=>f.timeMs>=m.request).some(f=>f.signals.down&&(f.signals.hvPermittedSet||f.signals.hv)),false);
});
function launch(x,m,c2=false){x.sample({in_STO_DR1_FBK:false,in_STO_DR2_FBK:false,in_HV_C2_FBK:c2,in_HV_Healthy_FBK:true});m.launch=x.sample(both);x.advance(1000);m.accepted=wait(x,'SU',true);wait(x,'sto1',true);wait(x,'sto2',true);if(x.get('b_Step3'))throw Error('Preparation unexpectedly confirmedRun');x.sample(off);x.advance(2100);}
for(const c2 of [false,true])scenario(`StartingRun-new-green500-abort-C2initial${c2}`,(x,e,m)=>{
 launch(x,m,c2);if(!x.get('SU')||x.get('b_Step3'))throw Error('Actual StartingRun not held through cleanup');
 m.green=x.sample({in_Reset_PB:true});x.advance(499);e('no stop before newgreen500',x.frames.filter(f=>f.timeMs>=m.green).some(f=>f.signals.runStop),false);x.sample();x.advance(20);
 e('accepted freshgreen blocks torque by actual outputs',x.get('sto1')||x.get('sto2'),false);
 e('accepted abort initiates discharge without SS1/coast prerequisite',x.get('hvDischarge'),true);
 m.late=x.sample({in_HV_C2_FBK:true,in_HV_Healthy_FBK:false});x.advance(200);
 e('late feedback cannot revive cancelled launch',x.frames.filter(f=>f.timeMs>=m.late).some(f=>f.signals.b_Step3||f.signals.confirmRun),false);
});
scenario('Run-normaldown-retains-C2-for-SS1-minimum2seconds',(x,e,m)=>{
 launch(x,m,true);x.sample({in_HV_Healthy_FBK:false});wait(x,'b_Step3',true);x.sample(off);x.advance(2100);
 if(!x.get('hv'))throw Error('EstablishedRun HV positive missing');m.green=x.sample({in_Reset_PB:true});x.advance(500);m.stop=wait(x,'runPhysical',true);x.advance(1999);
 e('C2 cannot fall during first1999ms of accepted normalstop',x.frames.filter(f=>f.timeMs>=m.stop&&f.timeMs<m.stop+2000).every(f=>f.signals.hv),true);
 e('normalpause retains LV',x.frames.filter(f=>f.timeMs>=m.stop).every(f=>f.signals.lv),true);
});
const report={native,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(sal)).digest('hex'),counts:Object.fromEntries(['PASS','FAIL','ERROR'].map(s=>[s,rows.filter(c=>c.status===s).length])),cases:rows,limits:['Actual owner writers after declared initialSafe; seven inactiveNetwork4cuts/group lifecycle excluded.','Finite budgets only preparation diagnostics, not new functional deadlines.','Abort test checks torque/discharge/cancel invariants only; complete order/delay/Healthyfault/reset requires expanded observation fixture and explicit marker.']};
fs.writeFileSync(process.env.MEN001_LIFECYCLE_RED_OUTPUT??new URL('lifecycle-red-results.json',import.meta.url),JSON.stringify(report)+'\n');console.log('TOTAL',JSON.stringify(report.counts));process.exitCode=report.counts.ERROR?3:report.counts.FAIL?1:0;
