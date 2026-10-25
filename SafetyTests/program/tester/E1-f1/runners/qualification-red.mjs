import fs from 'node:fs';import {createSafeRunFixture,compressFrames} from './run-source.js';
const both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false},cases=[];
function test(id,body){if(process.env.MEN001_F1_TEST_FILTER&&!id.includes(process.env.MEN001_F1_TEST_FILTER))return;let x;const checks=[],times={};const e=(label,actual,expected)=>checks.push({label,actual,expected});try{x=createSafeRunFixture('Run');body(x,e,times);e('all demanded inputs resolved',x.unbound(),[]);cases.push({id,status:checks.some(c=>JSON.stringify(c.actual)!==JSON.stringify(c.expected))?'FAIL':'PASS',checks,times,scope:x.scope,rises:x.rises,frames:compressFrames(x.frames)});}catch(error){cases.push({id,status:'ERROR',error:error.stack,checks,times,scope:x?.scope});}console.log(id,cases.at(-1).status);}
const any=(x,from,keys)=>x.frames.some(f=>f.timeMs>=from&&keys.some(k=>f.signals[k]));
test('F1-single-green499-500-shared-qualification-and-order',(x,e,t)=>{
 t.first=x.sample({in_Reset_PB:true});x.advance(499);e('no down before500',any(x,t.first,['rawAnd23','runPhysical','runAggregate']),false);x.sample();t.q=x.first('sharedGreen',t.first)??null;e('sharedGREEN qualifies at first+500',t.q,t.first+500);x.advance(4);
 e('physical accepted owner exists',x.scope.signals.runPhysical,'//Network6/RUN_DOWN_OWNER/RsOut');
 if(t.q!==null){e('And23 first accepted source is q+1',x.first('rawAnd23',t.first),t.q+1);e('owner first capture is q+1',x.first('runPhysical',t.first),t.q+1);e('OR5 reads actualowner on q+2',x.first('runAggregate',t.first),t.q+2);
 const qFrame=x.frames.find(f=>f.timeMs===t.q+1);e('owner consumed actual SetTRUE and ResetFALSE',{set:qFrame?.consumed.ownerConsumedSet,reset:qFrame?.consumed.ownerConsumedReset},{set:true,reset:false});}
});
for(const delta of [500,600])test('F1-green-qualified-lateblue'+delta+'-cannot-cancel',(x,e,t)=>{
 t.first=x.sample({in_Reset_PB:true});t.second=x.edgeAfter(t.first,delta,both);x.advance(10);
 e('acceptedgreen survives lateblue by first+503',any(x,t.first,['runPhysical']),true);
 const first=x.first('runPhysical',t.first);if(first!==undefined)e('lateblue doesnotresetacceptedowner',x.frames.filter(f=>f.timeMs>=first).every(f=>f.signals.runPhysical),true);
 e('only one physical down rise',x.rises.runPhysical,1);e('no up/unlock from sameattempt',any(x,t.first,['safeUp','safeTransition','safeBlue','rndBlue','unlock']),false);
});
for(const delta of [500,600])test('F1-blue-qualified-lategreen'+delta+'-cannot-become-down',(x,e,t)=>{
 t.first=x.sample({in_Relase_Door_PB:true});t.second=x.edgeAfter(t.first,delta,both);x.advance(700);x.sample({in_Relase_Door_PB:false});x.advance(700);
 e('Armedblueignored and lategreen cannot create secondcommand',any(x,t.first,['runPhysical','rawAnd23','runAggregate','safeUp','rndBlue','unlock']),false);
});
for(const fault of ['in_InterLock_NC_1','in_Estop_PLC'])test('F1-owner-reset-priority-'+fault,(x,e,t)=>{
 t.first=x.sample({in_Reset_PB:true});x.advance(499);t.q=x.sample({[fault]:fault==='in_Estop_PLC'});x.advance(10);e('fault at qualification never permitsowner/down',any(x,t.q,['runPhysical','runAggregate']),false);
 t.restore=x.sample({[fault]:fault!=='in_Estop_PLC'});x.advance(700);e('rawrestore withoutRestart cannot reviveowner',any(x,t.restore,['runPhysical','runAggregate']),false);
});
for(const fault of ['in_InterLock_NC_1','in_Estop_PLC'])for(const at of ['q+1','after-acceptance'])test('F1-owner-real-reset-'+fault+'-'+at,(x,e,t)=>{
 t.first=x.sample({in_Reset_PB:true});x.advance(at==='q+1'?500:506);
 if(at==='after-acceptance')e('healthy accepted physical route positive',x.get('runPhysical'),true);
 t.fault=x.sample({[fault]:fault==='in_Estop_PLC'});x.advance(5);
 e('critical source clears physical owner immediately and holds',any(x,t.fault,['runPhysical']),false);
 e('real owner Reset source was observedTRUE',x.frames.filter(f=>f.timeMs>=t.fault).some(f=>f.consumed.ownerConsumedReset===true),true);
 if(at==='q+1')e('Set+Reset coincidence records native reset dominance',x.frames.some(f=>f.timeMs===t.fault&&f.consumed.ownerConsumedSet===true&&f.consumed.ownerConsumedReset===true&&!f.signals.runPhysical),true);
 t.restore=x.sample({[fault]:fault!=='in_Estop_PLC'});x.advance(700);e('raw restoration cannot revive consumed owner',any(x,t.restore,['runPhysical']),false);
});
for(const release of ['early1999','complete2000'])test('F1-Run-neutral-'+release+'-freshgreen',(x,e,t)=>{
 t.both=x.sample(both);x.advance(1001);t.off=x.sample(off);x.advance(release==='early1999'?1998:1999);
 if(release==='complete2000'){e('releaseTON isFALSE at rawneutral1999',x.r.get('//RndPhysicalCompact/RELEASE/TonOut'),false);x.sample();t.enabled=x.frames.find(f=>f.timeMs>=t.off&&f.consumed.releaseTonEnable===true)?.timeMs??null;e('actual releaseenable is observed afterneutral',t.enabled!==null,true);if(t.enabled!==null){while(x.clock.timeMs<t.enabled+2000)x.sample();t.actualTimerQualified=x.clock.timeMs;e('native releaseTON requires full2000 from consumed enablededge',x.r.get('//RndPhysicalCompact/RELEASE/TonOut'),true);}}
 t.green=x.sample({in_Reset_PB:true});x.advance(504);
 e('freshgreen permitted iff bothOFF complete2000',any(x,t.green,['runPhysical']),release==='complete2000');
 e('no request from initial ignoredBOTH',x.frames.filter(f=>f.timeMs>=t.both&&f.timeMs<t.off).some(f=>f.signals.runPhysical||f.signals.runAggregate),false);
});
for(const duration of [999,1000])test('F1-BOTH-boundary-'+duration+'-partialrelease-cannot-degrade',(x,e,t)=>{
 t.both=x.sample(both);x.advance(duration);e('ignored RunBOTH cannot produce any command before partialrelease',any(x,t.both,['runPhysical','runAggregate','safeUp','rndBlue','unlock']),false);
 t.partial=x.sample({in_Relase_Door_PB:false});x.advance(700);e('partialrelease after boundary cannot become green',any(x,t.both,['runPhysical','runAggregate']),false);
});
test('F1-real-lock-producer-rejects-green-and-doesnotqueue',(x,e,t)=>{
 // Run component remains an explicit ownership cut. PLC01 traverses the real old
 // Run receiver/TON/Step12 request/LockSet3 writer; neither Lock nor owner is seeded.
 t.green=x.sample({in_Reset_PB:true,in_HV_C2_FBK:false,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:true});
 x.advance(230);e('actual ResetPBLock set by native PLCstop completion producer',x.get('lock'),true);
 x.advance(274);e('qualifiedgreen while actuallockTRUE cannot own physicaldown',x.get('runPhysical'),false);
 t.off=x.sample({...off,inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:false});x.advance(10);e('actual greenrelease clearslock',x.get('lock'),false);
 x.advance(2100);e('clearinglock never queues oldgreen authorization',any(x,t.off,['runPhysical']),false);
 t.fresh=x.sample({in_Reset_PB:true});x.advance(504);e('fresh fullyclean green availability preserved',x.get('runPhysical'),true);
});
const report={phase:'Frozen F1 independent RED/acceptance runner; P0 priorRun20 remains independent boundary/rearm oracle',counts:Object.fromEntries(['PASS','FAIL','ERROR'].map(s=>[s,cases.filter(c=>c.status===s).length])),cases,limits:['Run owner component boundary; actual Reset source producer closure retained, no override of native owner Set/Reset','No normal2sSS1/F2 completion claim; current oldreceiver remains knownFAIL','C need not beTRUE for ignoredRunBOTH; do not invent internalC requirement']};
fs.writeFileSync(process.env.MEN001_F1_OUTPUT??new URL('qualification-red-results.json',import.meta.url),JSON.stringify(report)+'\n');console.log('TOTAL',JSON.stringify(report.counts));process.exitCode=report.counts.ERROR?3:report.counts.FAIL?1:0;
