import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseSalFile} from '../src/sal-parser.js';
import {physicalRndSource,PHYSICAL_SIGNALS} from '../src/physical-rnd-source.js';
const model=parseSalFile(new URL('../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url));
const observedSignals={sto1:'STO_DR1',sto2:'STO_DR2',plcSto1:'outPLC_STO_1',plcSto2:'outPLC_STO_2',acceptedUp:'recRndC_SU',
 confirmRun:'b_Step3_Set_2',completionDischargeReset:'b_Reset_HV_Discharg_Req2',completionResetPb:'b_SetLock_ResetPB_2',
 ordinary1:'b_Set_STO_DR1',ordinary2:'b_Set_STO_DR2',late1:'b_Set_STO_DR1_2',late2:'b_Set_STO_DR2_2',
 reset1:'b_Reset_STO_DR1',reset2:'b_Reset_STO_DR2',reset12:'b_Reset_STO_DR1_2',reset22:'b_Reset_STO_DR2_2',reset14:'b_Reset_STO_DR1_4',reset24:'b_Reset_STO_DR2_4'};
const phaseNames=['b_Step1','b_Step2','b_Step3','b_Step4','b_Step5','b_Step6','b_Step12','b_Step_RnD'];
const all=model.networks.flatMap(n=>n.blocks),block=p=>all.find(b=>b.path===p);
const evidence=[],scopes=new Map();
function fixture(dt=10,isolateCompletion=false){
 const x=physicalRndSource(model,dt,{observedSignals});
 // Full audit and original union closure have already completed. Only these
 // two parallel early consumers are suppressed; the SU writer stays real.
 const boundaries=[];
 if(isolateCompletion){
  const source='//RndPhysicalCompact/STATE_SU/RsOut',sourcePort=block('//RndPhysicalCompact/STATE_SU').outputs.find(p=>p.path===source);
  assert.ok(sourcePort.globals.some(g=>g.resolvedName==='recRndC_SU'),'real accepted SU writer');
  for(const target of ['//Network1/FBOr8/OrIn3','//Network1/FBOr10/OrIn3']){
   const port=all.flatMap(b=>b.inputs).find(p=>p.path===target),edges=model.bindingAudit.edges.filter(e=>e.to===target);
   assert.ok(port);assert.equal(model.variables.some(v=>v.targetPorts.includes(target)),false);
   assert.deepEqual(edges,[]);assert.deepEqual(port.sources,[]);
   assert.deepEqual(port.globals.map(g=>({variableId:g.variableId,lastKnownPath:g.lastKnownPath,resolvedName:g.resolvedName})),sourcePort.globals.filter(g=>g.resolvedName==='recRndC_SU').map(g=>({variableId:g.variableId,lastKnownPath:g.lastKnownPath,resolvedName:g.resolvedName})));
   assert.equal(port.globals.length,1);assert.equal(port.channelInterface,'Activated');assert.equal(port.deactivate1,'Break Contact (NC)');
   boundaries.push({source,sourceId:sourcePort.Id,target,targetId:port.Id,value:false,edgeAbsentInBaseline:false,
    reason:'legacy completion producer isolation: suppress parallel early producer only',reads:0});
  }
  const readRaw=x.r.readRaw.bind(x.r);x.r.readRaw=port=>{const cut=boundaries.find(b=>b.target===port.path&&!b.edgeAbsentInBaseline);if(cut){cut.reads++;return false;}return readRaw(port);};
 }
 x.scope={...x.scope,consumerReadBoundaries:boundaries,limit:x.scope.limit+(isolateCompletion?'; legacy completion Set guard with parallel early consumers suppressed, not uncut lifecycle':'')};
 x.scopeKey=`fixed${dt}/${isolateCompletion?'isolated-completion':'uncut'}`;scopes.set(x.scopeKey,x.scope);
 // Add same-scan diagnostic samples to every captured frame, including scans inside advance().
 const scan=x.r.scan.bind(x.r);x.r.scan=(delta)=>{scan(delta);const frame=x.frames.at(-1);frame.program={
  phases:Object.fromEntries(phaseNames.map(k=>[k,x.r.get(k)])),EStopOK:x.r.get('b_EStop_Ok'),PLCproducer:x.r.get('//Network1/FBAnd1/AndOut'),
  currentPermit:x.r.get('//Network1/FBAndLvCurrentPermit/AndOut'),
  set1:x.r.get('//Network1/FBOr8/OrOut'),set2:x.r.get('//Network1/FBOr10/OrOut'),reset1:x.r.get('//Network1/FBOr7/OrOut'),reset2:x.r.get('//Network1/FBOr9/OrOut'),
  completionInput:x.r.get('//Network12/FBAnd4/AndOut'),completionTon:x.r.get('//Network12/FBTon3/TonOut')};return x.r;};
 return x;
}
const both={in_Reset_PB:true,in_Relase_Door_PB:true};
function accept(x,first='green'){
 const t=x.sample(first==='green'?{in_Reset_PB:true}:{in_Relase_Door_PB:true});x.edgeAfter(t,100,both);
 const deadline=x.clock.timeMs+1200;while(!x.get('acceptedUp')&&x.clock.timeMs<deadline)x.sample();
 assert.equal(x.get('acceptedUp'),true,'real physical recognizer must accept SU, no request seed');
 return x.frames.at(-1);
}
function pending(x,route,drive){
 if(route==='ordinary')x.sample({b_Step_RnD:false,b_Step2:true,in_HV_C2_FBK:true,in_LV_Healthy_FBK:false,in_HV_Healthy_FBK:false});
 else if(route==='completion'){accept(x);x.sample({in_HV_C2_FBK:true,in_HV_Healthy_FBK:false});}
 else throw Error('Unknown route');
 const end=x.clock.timeMs+6500;
 const producer=(route==='ordinary'?'ordinary':'late')+drive;
 while((!x.r.get(`//Network1/FBOr${drive===1?8:10}/OrOut`)||!x.get(producer))&&x.clock.timeMs<end)x.sample();
 const f=x.frames.at(-1);assert.equal(f.program['set'+drive],true,'actual producer must build pending Set OR');
 assert.equal(f.signals['sto'+drive],false,'actual RS still FALSE before old aggregate is consumed');
 assert.equal(f.signals[route==='ordinary'?'ordinary'+drive:'late'+drive],true,'selected real old producer active');
 assert.equal(f.signals[route==='ordinary'?'late'+drive:'ordinary'+drive],false,'other old producer inactive');return f;
}
function scenario(name,dt,body,{isolateCompletion=false}={}){test(`EARLYSTO ${name} fixed${dt}`,()=>{
 const x=fixture(dt,isolateCompletion),checks=[],times={};const e=(label,actual,expected)=>checks.push({label,actual,expected});body(x,e,times);
 e('no unresolved demanded dependency',x.observed().commandConeUnconnected.length,0);
 const failed=checks.filter(c=>JSON.stringify(c.actual)!==JSON.stringify(c.expected));
 const spans=[];let previous;
 for(const frame of x.frames){const {timeMs,...values}=frame,key=JSON.stringify(values);if(previous===key){const last=spans.at(-1);last.lastTimeMs=timeMs;last.samples++;}else{spans.push({firstTimeMs:timeMs,lastTimeMs:timeMs,samples:1,...values});previous=key;}}
 evidence.push({name,scanMs:dt,scopeKey:x.scopeKey,consumerReadBoundaries:x.scope.consumerReadBoundaries,status:failed.length?'FAIL':'PASS',times,checks,transitions:x.transitions,observedSamples:x.frames.length,frameSpans:spans});
 assert.deepEqual(failed,[],JSON.stringify(failed));
});}
after(()=>{if(process.env.MEN001_STO_EVIDENCE_PATH)fs.writeFileSync(process.env.MEN001_STO_EVIDENCE_PATH,JSON.stringify({scopes:[...scopes.values()],cases:evidence}));});

test('EARLYSTO additive observation contract preserves default map and rejects rebinding/unknown writers',()=>{
 const a=physicalRndSource(model,10),b=physicalRndSource(model,10,{observedSignals:{}});
 assert.deepEqual(a.scope,b.scope);assert.deepEqual(a.frames,b.frames);assert.deepEqual(a.transitions,b.transitions);assert.deepEqual(a.rises,b.rises);
 assert.deepEqual(Object.keys(a.frames[0].signals),Object.keys(PHYSICAL_SIGNALS));
 assert.throws(()=>physicalRndSource(model,10,{observedSignals:{up:'STO_DR1'}}),/rebind/);
 assert.throws(()=>physicalRndSource(model,10,{observedSignals:{missing:'nonexistentSTO'}}),/Undeclared/);
});
test('EARLYSTO union closure contains actual complete old STO aggregates, RS, status and typed requests',()=>{
 const x=fixture();assert.equal(model.bindingAudit.status,'PASS');
 for(const name of ['FBRs3','FBRs4','FBOr7','FBOr8','FBOr9','FBOr10'])assert.ok(x.scope.selectedBlocks.includes('//Network1/'+name));
 for(const path of ['//Network5/FBDecouple3','//Network5/FBTon3','//Network7/FBTon2','//Network7/FBTon3','//Network2/FBDecouple2','//Network10/FBDecouple2','//Network12/FBAnd6'])assert.ok(x.scope.selectedBlocks.includes(path),path);
 for(const name of Object.values(observedSignals))assert.ok(model.variables.some(v=>v.name===name&&v.sourcePorts.length)||all.some(b=>b.outputs.some(p=>p.globals.some(g=>g.resolvedName===name))),name);
 assert.equal(new Set(x.scope.boundaries.map(b=>b.name+':'+b.consumer)).size,x.scope.boundaries.length);
});

for(const dt of [1,2,5,10])for(const first of ['green','blue'])for(const healthy of [false,true])scenario(`physical ${first}/HVHealthy${healthy} early N+2`,dt,(x,e,t)=>{
 x.sample({in_HV_C2_FBK:false,in_HV_Healthy_FBK:healthy});const n=accept(x,first);t.accepted=n.timeMs;
 const before=x.frames.filter(f=>f.timeMs<n.timeMs);e('no early STO before actual SU',before.some(f=>f.signals.sto1||f.signals.sto2),false);
 e('isolated physical path has no STO on accepted scan N',n.signals.sto1||n.signals.sto2,false);
 e('old ordinary and completion routes inactive before SU',x.frames.some(f=>f.signals.ordinary1||f.signals.ordinary2||f.signals.late1||f.signals.late2),false);
 e('no completion at SU',n.signals.confirmRun||n.signals.completionDischargeReset||n.signals.completionResetPb,false);
 x.sample();e('retained SU survives first propagation',x.get('acceptedUp'),true);e('no output at N+1',x.get('sto1')||x.get('sto2'),false);
 x.sample();e('drive1 permits torque at N+2 without C2',x.get('sto1'),true);e('drive2 permits torque at N+2 without C2',x.get('sto2'),true);
 e('PLC drive1 indication follows actual early RS this scan',x.get('plcSto1'),x.get('sto1'));e('PLC drive2 indication follows actual early RS this scan',x.get('plcSto2'),x.get('sto2'));
 x.advance(200);e('no feedback-independent completion manufactured',x.frames.some(f=>f.signals.confirmRun||f.signals.completionDischargeReset||f.signals.completionResetPb),false);
 e('C2 remains given FALSE',x.frames.at(-1).raw.in_HV_C2_FBK,false);
 // The existing 0.1s TON has already qualified; feedback is still independently required.
 e('original completion TON eventually qualified',x.frames.at(-1).program.completionTon,true);
 const tonInput=x.frames.find(f=>f.program?.completionInput),tonOut=x.frames.find(f=>f.program?.completionTon);
 e('real completion input exists independently of feedback',!!tonInput,true);
 if(tonInput&&tonOut){t.completionInput=tonInput.timeMs;t.completionTon=tonOut.timeMs;
  e('original completion TON preserves observed-edge 100ms',tonOut.timeMs-tonInput.timeMs,100);
  e('no premature completion TON pulse anywhere before100ms',x.frames.filter(f=>f.timeMs<tonInput.timeMs+100).some(f=>f.program?.completionTon),false);
 }
 const mark=x.frames.length;x.sample({in_HV_C2_FBK:true,in_HV_Healthy_FBK:false});x.advance(3*dt);
 e('old confirmation follows later C2/invertedHealthy',x.get('confirmRun'),true);e('old discharge Reset follows later feedback',x.get('completionDischargeReset'),true);e('old ResetPB completion follows later feedback',x.get('completionResetPb'),true);
 e('all late feedback samples preserve actual status copies',x.frames.slice(mark).every(f=>f.signals.plcSto1===f.signals.sto1&&f.signals.plcSto2===f.signals.sto2),true);
 e('uncut original late completion really enables drive1',x.get('sto1'),true);e('uncut original late completion really enables drive2',x.get('sto2'),true);
});

const faults={in_ES_NC_1:false,in_ES_NC_2:false,in_InterLock_NC_1:false,in_InterLock_NC_2:false,in_LV_Connector_Interlock:false,in_HV_Connector_Interlock:false,in_Estop_PLC:true,in_Mentee_EStop:true};
for(const drive of [1,2])for(const route of ['ordinary','completion']){
 scenario(`drive${drive}/${route} healthy pending Set positive`,10,(x,e,t)=>{t.pending=pending(x,route,drive).timeMs;x.sample();e('healthy pending real Set enables output',x.get('sto'+drive),true);e('same-scan real PLC status',x.get('plcSto'+drive),true);},{isolateCompletion:route==='completion'});
 for(const [fault,value]of Object.entries(faults))scenario(`drive${drive}/${route} first fault ${fault}`,10,(x,e,t)=>{
  t.pending=pending(x,route,drive).timeMs;const mark=x.frames.length;x.sample({[fault]:value});x.advance(20);
  e('no new STO output in first fault interval',x.frames.slice(mark).some(f=>f.signals['sto'+drive]),false);
 },{isolateCompletion:route==='completion'});
 for(const dt of [1,10])scenario(`drive${drive}/${route} single-sample PLC pulse and raw restore`,dt,(x,e,t)=>{
  t.pending=pending(x,route,drive).timeMs;const mark=x.frames.length;x.sample({in_Estop_PLC:true});t.fault=x.clock.timeMs;
  x.sample({in_Estop_PLC:false});t.restore=x.clock.timeMs;x.advance(4*dt);
  e('no new output anywhere in pulse/recovery interval without Restart',x.frames.slice(mark).some(f=>f.signals['sto'+drive]),false);
  e('main EStop memory actually off',x.r.get('b_EStop_Ok'),false);
 },{isolateCompletion:route==='completion'});
 scenario(`drive${drive}/${route} latched output not forcibly reset by new Set guard`,10,(x,e)=>{
  pending(x,route,drive);x.sample();e('real already-latched output positive',x.get('sto'+drive),true);
  const mark=x.frames.length;x.sample({in_Estop_PLC:true});x.sample({in_Estop_PLC:false});
  e('no spontaneous early force Reset while existing Reset OR is false',x.frames.slice(mark).filter(f=>!f.program['reset'+drive]).every(f=>f.signals['sto'+drive]),true);
 },{isolateCompletion:route==='completion'});
}

// These are preserved existing Reset waveforms, not invented Reset seeds.
for(const drive of [1,2])for(const healthy of [false,true])scenario(`drive${drive} Step4 timed Reset / Healthy${healthy}`,10,(x,e,t)=>{
 pending(x,'ordinary',drive);x.sample();e('ordinary Set establishes output',x.get('sto'+drive),true);
 x.sample({b_Step2:false,b_Step4:true,in_HV_Healthy_FBK:healthy});const entered=x.clock.timeMs;t.step4=entered;
 const mark=x.frames.length;x.advance(7100);
 const reset=x.frames.slice(mark).find(f=>f.program['reset'+drive]);e('real timed Step4 Reset eventually reaches aggregate',!!reset,true);
 const fallen=x.frames.slice(mark).find(f=>!f.signals['sto'+drive]);e('old Reset eventually removes torque permission',!!fallen,true);
 if(reset&&fallen){t.reset=reset.timeMs;t.outputFall=fallen.timeMs;e('old early RS consumes Reset one next scan',fallen.timeMs-reset.timeMs,10);}
 e('PLC indication remains real output copy throughout reset',x.frames.slice(mark).every(f=>f.signals['plcSto'+drive]===f.signals['sto'+drive]),true);
});

for(const [fault,value]of Object.entries(faults))scenario(`physical accepted SU then current fault ${fault}`,10,(x,e,t)=>{
 t.accepted=accept(x).timeMs;const mark=x.frames.length;x.sample({[fault]:value});x.advance(30);
 e('accepted physical route never enables either drive while current fault present',x.frames.slice(mark).some(f=>f.signals.sto1||f.signals.sto2),false);
});
for(const dt of [1,10])scenario('physical accepted SU pulse before N+2 raw restore',dt,(x,e,t)=>{
 t.accepted=accept(x).timeMs;const mark=x.frames.length;x.sample({in_Estop_PLC:true});x.sample({in_Estop_PLC:false});x.advance(4*dt);
 e('no torque permission anywhere after pulse without Restart',x.frames.slice(mark).some(f=>f.signals.sto1||f.signals.sto2),false);
 e('real emergency memory not cleared by raw restore',x.r.get('b_EStop_Ok'),false);
});
for(const drive of [1,2])for(const route of ['ordinary','completion'])scenario(`drive${drive}/${route} accepted manual Restart healthy positive`,10,(x,e)=>{
 x.sample({in_Estop_PLC:true});x.advance(30);e('actual EStop first drops',x.r.get('b_EStop_Ok'),false);
 x.sample({in_Estop_PLC:false});x.advance(30);e('raw recovery is insufficient',x.r.get('b_EStop_Ok'),false);
 x.sample({in_Reset_PB:true});e('Restart high is not accepted falling edge',x.r.get('b_EStop_Ok'),false);
 x.sample({in_Reset_PB:false});e('actual manual falling Restart accepted',x.r.get('b_EStop_Ok'),true);
 x.advance(2100);pending(x,route,drive);x.sample();e('new real route after accepted Restart enables drive',x.get('sto'+drive),true);
},{isolateCompletion:route==='completion'});
for(const drive of [1,2])scenario(`drive${drive} actual Reset/Set collision remains Reset dominant`,10,(x,e,t)=>{
 pending(x,'ordinary',drive);x.sample();e('already enabled via genuine old Set',x.get('sto'+drive),true);
 // Deliberate conflicting Network3 phase cuts expose existing RS collision semantics;
 // this does not claim both phases are reachable together in the full sequencer.
 x.sample({b_Step4:true,in_HV_Healthy_FBK:false});const deadline=x.clock.timeMs+8000;
 while(!x.frames.at(-1).program['reset'+drive]&&x.clock.timeMs<deadline)x.sample();
 const f=x.frames.at(-1);e('existing Step4 Reset aggregate asserted',f.program['reset'+drive],true);
 e('existing ordinary Set still asserted at collision',f.program['set'+drive],true);t.collision=f.timeMs;
 x.sample();e('next scan actual RS gives Reset priority over Set',x.get('sto'+drive),false);
 e('Network10 status copies Reset output',x.get('plcSto'+drive),false);
});
for(const drive of [1,2])scenario(`drive${drive} Step1 existing Reset waveform`,10,(x,e,t)=>{
 pending(x,'ordinary',drive);x.sample();e('ordinary output initially enabled',x.get('sto'+drive),true);
 x.sample({b_Step2:false,b_Step1:true,in_LV_C1_FBK:false,in_HV_C2_FBK:false});const mark=x.frames.length;x.advance(400);
 e('existing Step1 feedback-dependent Reset request asserted',x.frames.slice(mark).some(f=>f.signals['reset'+drive]),true);
 e('Step1 Reset removes permission without direct Reset seed',x.get('sto'+drive),false);
 e('real PLC status follows output throughout Step1 Reset',x.frames.slice(mark).every(f=>f.signals['plcSto'+drive]===f.signals['sto'+drive]),true);
});
