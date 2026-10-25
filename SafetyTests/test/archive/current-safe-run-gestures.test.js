import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createSafeRunFixture,compressFrames} from '../helpers/safe-run-source.js';
import {anySignalDuring} from '../../src/scan-observer.js';
const evidence=[],scopes=new Map(),observerMeta={tests:1,pass:0,errors:0,scope:'Interior 1ms pulse detector; not actual SAL acceptance'},both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false};
const hold=first=>first==='green'?{in_Reset_PB:true}:{in_Relase_Door_PB:true};
const any=(x,keys,from,to=Infinity)=>x.frames.some(f=>f.timeMs>=from&&f.timeMs<=to&&keys.some(k=>f.signals[k]));
const normalDown=['runPhysical','runResetSto1','runResetSto2','runDischarge','runResetHv'];
function scenario(id,mode,body,options={}){test(id,()=>{
 let x;const checks=[],times={};const e=(label,actual,expected)=>checks.push({label,actual,expected});
 try{x=createSafeRunFixture(mode,options);const key=mode+'/'+JSON.stringify(options);scopes.set(key,x.scope);
  body(x,e,times);e('no unresolved input in demanded command cone',x.unbound(),[]);
  const violations=checks.filter(c=>JSON.stringify(c.actual)!==JSON.stringify(c.expected));
  evidence.push({id,mode,status:violations.length?'FAIL':'PASS',scopeKey:key,times,checks,rises:x.rises,transitions:compressFrames(x.transitions),
   setupSamples:x.setup.length,setup:compressFrames(x.setup),observedSamples:x.frames.length,frameSpans:compressFrames(x.frames),inputLedger:x.ledger()});
  assert.deepEqual(violations,[],JSON.stringify(violations));
 }catch(error){if(!evidence.some(c=>c.id===id))evidence.push({id,mode,status:'ERROR',error:error.message,checks,times,scope:x?.scope,lastFrame:x?.current()});throw error;}
});}
const chronology=(x,from)=>Object.fromEntries(['safeBlue','safeTonQ','safeGate','safeUp','safeTransition','runTonQ','runQualifier','runPhysical',...normalDown.slice(1),'unlock'].map(k=>[k,x.first(k,from)??null]));
function clearAttempt(x){x.sample(off);x.advance(2000);if(x.get('lock'))throw Error('Real ResetPB_Lock did not clear after neutral; no artificial lock cut');}
function bluePositive(x,e,t){const first=x.sample({in_Relase_Door_PB:true});t.blueFirst=first;x.advance(500);x.sample();
 e('correct fresh held blue has an actual Safe producer',x.get('safeBlue'),true);e('correct fresh held blue reaches sole final Unlock',x.get('unlock'),true);t.blueChronology=chronology(x,first);return first;}
function safeChord(x,first,delta){const a=x.sample(hold(first)),b=x.edgeAfter(a,delta,both);return{first:a,second:b};}
function runGreenPositive(x,e,t,label='positive'){const first=x.sample({in_Reset_PB:true});x.advance(499);
 e(label+' no normal down before500',any(x,normalDown,first,x.clock.timeMs),false);
 x.sample();const at500=x.get('runPhysical');x.sample();
 e(label+' actual physical Run branch available after full500/current causal lag',at500||x.get('runPhysical'),true);
 x.advance(2);e(label+' actual four downstream requests available',normalDown.slice(1).every(k=>x.get(k)),true);
 t[label]={first,observed:chronology(x,first)};return first;}

test('SR-OBSERVER interior one-sample pulse cannot be hidden by endpoint FALSE',()=>{
 try{let time=0;const pulse={scanMs:1,scan(){time++;},get(){return time===250;}};
  assert.equal(anySignalDuring(pulse,999,'request'),true);assert.equal(pulse.get(),false);assert.equal(time,999);observerMeta.pass=1;
 }catch(error){observerMeta.errors=1;throw error;}
});

scenario('SR-SB-QUAL fresh Safe blue minimum500 and actual grant','Safe',(x,e,t)=>{
 e('real Safe feedback guard ready',x.get('safeReady'),true);const first=x.sample({in_Relase_Door_PB:true});t.first=first;
 x.advance(499);e('no Safe blue producer pulse before500',any(x,['safeBlue'],first,x.clock.timeMs),false);
 e('no final Unlock pulse before500',any(x,['unlock'],first,x.clock.timeMs),false);
 x.sample();x.sample();e('full500 fresh blue producer positive',x.get('safeBlue'),true);e('full500 final Unlock positive',x.get('unlock'),true);
 t.observed=chronology(x,first);e('Safe blue does not make energy StepUp',any(x,['safeUp','safeTransition'],first),false);
});
scenario('SR-SB-ACCESS connector absence preserves Safe access control','Safe',(x,e,t)=>{
 e('actual main EStop remains healthy with connectors absent in Safe',x.get('estop'),true);bluePositive(x,e,t);
 e('connector absence is not turned into energy advance',any(x,['safeUp','safeTransition'],t.blueFirst),false);
},{rawOverrides:{in_LV_Connector_Interlock:false,in_HV_Connector_Interlock:false}});
scenario('SR-SB-DOOR original Safe Door reset control','Safe',(x,e,t)=>{
 bluePositive(x,e,t);const mark=x.sample({in_Door_Monitor:false});x.advance(3);t.doorFalse=mark;
 e('Door FALSE existing Safe reset asserted',x.get('grantReset'),true);e('Door FALSE never retains Unlock',any(x,['unlock'],mark),false);
 x.sample({in_Door_Monitor:true});clearAttempt(x);bluePositive(x,e,t);
});
scenario('SR-SB-GREEN qualified blue final green suppression control','Safe',(x,e,t)=>{
 bluePositive(x,e,t);const mark=x.sample({in_Reset_PB:true});x.advance(10);t.greenOn=mark;
 e('green present suppresses sole Unlock from its first observed sample',any(x,['unlock'],mark),false);
 e('green interruption creates no new Safe StepUp',any(x,['safeUp','safeTransition'],mark),false);
});

for(const first of ['green','blue'])scenario(`SR-SC-VALID-${first} both250 availability and minimum1000`,'Safe',(x,e,t)=>{
 e('real old Safe guard ready',x.get('safeReady'),true);Object.assign(t,safeChord(x,first,250));
 e('dispatcher actual second delta',t.second-t.first,250);x.advance(999);
 e('no Safe StepUp before full1000 BOTH anywhere',any(x,['safeGate','safeUp','safeTransition'],t.first,x.clock.timeMs),false);
 e('valid chord cannot emit a single/Unlock anywhere',any(x,['safeBlue','rndBlue','unlock'],t.first,x.clock.timeMs),false);
 x.sample();const at1000=x.get('safeUp');x.sample();
 e('ready valid chord actual Step12 producer positive after full1000/current causal lag',at1000||x.get('safeUp'),true);
 e('actual physical transition consumer positive',x.get('safeTransition'),true);e('one actual Step12 request rise',x.rises.safeUp,1);
 t.observed=chronology(x,t.first);t.firstConsumedBoth=x.frames.find(f=>f.timeMs>=t.second&&f.consumed.safeTonInput)?.timeMs??null;
});
for(const first of ['green','blue'])scenario(`SR-SC-LATE-${first} second300 never legalizes and recovery positive`,'Safe',(x,e,t)=>{
 Object.assign(t,safeChord(x,first,300));x.advance(1200);
 e('late300 before single acceptance creates no StepUp despite prolonged BOTH',any(x,['safeGate','safeUp','safeTransition'],t.first),false);
 e('late invalid attempt creates no Safe single/Unlock',any(x,['safeBlue','rndBlue','unlock'],t.first),false);
 t.invalidObserved=chronology(x,t.first);clearAttempt(x);const fresh=safeChord(x,'green',100);t.fresh=fresh;x.advance(1001);
 e('fresh clean ready-guard chord remains available',x.get('safeUp')&&x.get('safeTransition'),true);
});
scenario('SR-SC-GUARD-PRESERVE qualify not-ready then release cannot queue launch','Safe',(x,e,t)=>{
 e('real feedback holds old And3 not ready',x.get('safeReady'),false);Object.assign(t,safeChord(x,'green',100));x.advance(1001);
 e('actual old BOTH timer qualification exists',x.get('safeTonQ'),true);e('qualification alone never launch when And3 FALSE',any(x,['safeGate','safeUp','safeTransition'],t.first),false);
 x.sample(off);x.advance(2);e('actual old TON reset after release',x.get('safeTonQ'),false);
 t.readinessRestored=x.sample({in_STO_DR1_FBK:true});x.advance(2100);
 e('genuine Safe feedback readiness restored',x.get('safeReady'),true);
 e('old unaccepted qualification cannot become delayed launch after readiness returns',any(x,['safeGate','safeUp','safeTransition'],t.readinessRestored),false);
 const fresh=safeChord(x,'green',100);t.fresh=fresh;x.advance(1001);e('new ready-guard gesture positive',x.get('safeUp')&&x.get('safeTransition'),true);
},{rawOverrides:{in_STO_DR1_FBK:false}});

scenario('SR-RG-QUAL actual Run green500 branch and fanout availability','Run',(x,e,t)=>{
 e('actual prior Step2 prepared all four energy/torque outputs',x.get('lv')&&x.get('hv')&&x.get('sto1')&&x.get('sto2'),true);
 e('actual ResetPB_Lock writer is FALSE',x.get('lock'),false);runGreenPositive(x,e,t);
 e('one physical authorization rise, not a full transition count',x.rises.runPhysical,1);
});
for(const first of ['green','blue'])for(const remaining of ['green','blue'])scenario(`SR-RG-INVALID-${first}-remain-${remaining} failed chord cannot degrade`,'Run',(x,e,t)=>{
 t.first=x.sample(hold(first));t.second=x.edgeAfter(t.first,100,both);x.advance(400);
 t.only=x.sample(remaining==='green'?{in_Relase_Door_PB:false}:{in_Reset_PB:false});x.advance(1200);
 e('short failed chord produces no physical/down request anywhere',any(x,normalDown,t.first),false);
 e('failed Run chord creates no Safe up/blue/Unlock',any(x,['safeUp','safeTransition','safeBlue','rndBlue','unlock'],t.first),false);
 t.invalidObserved=chronology(x,t.first);clearAttempt(x);runGreenPositive(x,e,t,'recovery');
 t.scope='Step3 owner fixed component boundary: recovery request availability is not full Run re-entry/stop completion';
});

after(()=>{
 if(!process.env.MEN001_SAFE_RUN_EVIDENCE_PATH)return;
 const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 const files=['MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal','MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl','SafetyTests/src/sal-runtime.js','SafetyTests/src/sal-parser.js','SafetyTests/src/estop-native-pairs.js','SafetyTests/src/observed-samples.js','SafetyTests/src/scan-observer.js','SafetyTests/test/helpers/safe-run-source.js','SafetyTests/test/current-safe-run-gestures.test.js','SafetyTests/SAFE_RUN_GESTURE_TEST_REQUIREMENTS.md','SafetyTests/SAFE_RUN_GESTURE_TEST_PLAN.md','SafetyTests/SAFE_RUN_GESTURE_PLAN_REVIEW.md'];
 const root=new URL('../../',import.meta.url),counts={tests:evidence.length+1,pass:evidence.filter(c=>c.status==='PASS').length+observerMeta.pass,fail:evidence.filter(c=>c.status==='FAIL').length,errors:evidence.filter(c=>c.status==='ERROR').length+observerMeta.errors};
 const report={generatedAt:new Date().toISOString(),phase:'Known Safe/Run bounded RED-only tests; no native fix',clockContract:'observed-fixed-scan-v1',counts,
  sha256:Object.fromEntries(files.map(p=>[p,sha(new URL(p,root))])),observerMeta,
  scopes:[...scopes.entries()].map(([key,scope])=>({key,...scope})),cases:evidence,
  evidenceFormat:'Every original scan observed, identical consecutive frames losslessly encoded as start/end/count spans; endpoint-only checks do not replace interval checks',
  limits:['No full BOOT/group/Network4 execution or no-fault proof','No QR/QT/QP/QF/QD endpoint policy','Fixed Network3 state owner, not reachability','Native ErrorFALSE stub is not group no-fault','Current Run source branch authorization rises, not invented accepted/completed-transition markers']};
 fs.writeFileSync(process.env.MEN001_SAFE_RUN_EVIDENCE_PATH,JSON.stringify(report)+'\n');
});
