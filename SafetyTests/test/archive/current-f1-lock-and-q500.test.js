// Adopted from program/tester/E1-f1/runners/qualification-red.mjs + run-source.js (E1-f1 frozen battery).
// Logic and oracle of the two source tests are unchanged; only paths/imports and the test wrapper
// (node:test instead of the runner's JSON report). The fixture below is the runner fixture
// (run-source.js) verbatim except: canonical paths via import.meta.url (no MEN001_F1_ROOT override),
// compressFrames dropped (report-only). helpers/v2-structural.js / SHA pins are not used.
// Mutation guards these tests distinguish (E1-f1 MUTATION_RESULTS, reviewer E1-kill-audit):
//  - MU05 Network6/FBAnd24.AndIn1 (NOT b_ResetPB_Lock) -> F1-real-lock-producer-rejects-green-and-doesnotqueue
//  - MU07 Network6/FBAnd23.AndIn3 raw blue suppression -> F1-green-qualified-lateblue500-cannot-cancel
// Oracle sources (SafetyTests/SCENARIO_DECISIONS.md):
//  - D-Q500 / Q-500: second button exactly 500 ms after first: already-qualified single has priority,
//    no retrospective TwoButtonsAttempt/StepUp from the same attempt; symmetric for blue/green first.
//  - D-LATE-SECOND: late second (>250 ms) BEFORE single acceptance -> neither single nor StepUp, ignore
//    without fault, new attempt only after both OFF + release filter; AFTER acceptance -> accepted command /
//    started transition is not cancelled, rolled back or interrupted; no new command until the same clearing.
//    Scenario table rows Green t0/Blue t300 (before), t500 (D-Q500), t600 (after), and symmetric Blue-first.
//  - D-STARTINGRUN-GREEN-DOWN: D-LATE-SECOND stays in force in Run; green500 is the Run normal-down attempt.
//  - D-RUN-BOTH-IGNORE: BOTH in Run creates no normal-down/up/Unlock.
//  - Reference-preserved green gating by b_ResetPB_Lock (E1-f1 G4 review; kill audit MU05 "Да").
// Neighbour cases 499/501 (tester addition, E1-f1-adopt2): 501 = after acceptance (D-LATE-SECOND, same oracle
// as 500/600); 499 = late second before 0.5 s single qualification (D-LATE-SECOND "до single": no command;
// new attempt only after both OFF + filter, positive control after 2110 ms neutral as in the lock test).
// Assumptions (as in the runner, reported in handoff): A1 Network3 phase owners cut (b_Step* seeded),
// Network4/group unexecuted; A2 Run prepared via ordinary Step2 then b_Step3 seed; A3 1 ms scan;
// A4 the lock test drives inPLC_RnD_Mode/_2 and in_HV_C2_FBK as given program inputs to reach the real
// PLC-stop Lock producer (Lock itself is never seeded); A5 "no fault" is not observable in this cone.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {parseSalFile} from '../../src/sal-parser.js';
import {readBindingXml} from '../../src/sal-binding-validator.js';
import {effectiveEstopInputs,SAL_NATIVE_PAIR_CONTRACT} from '../../src/estop-native-pairs.js';
import {SalRuntime,SAL_CLOCK_CONTRACT} from '../../src/sal-runtime.js';
import {ObservedSamples} from '../../src/observed-samples.js';
import {assertNativeSalStructure} from '../../src/sal-native-structure.js';
import {withActualNames} from '../../src/signal-names.js';
const source=new URL('../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url);
const sgvl=new URL('../../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',import.meta.url);
const phases=['b_Step1','b_Step2','b_Step3','b_Step4','b_Step5','b_Step6','b_Step12','b_Step_RnD'];
// G1 v6: D-ARCH-POL-RENAME keys written with the renamed names and mapped to the actual SAL names (stand src/signal-names.js); raw values unchanged (FALSE = healthy).
const rawCommon={in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,
 in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,
 in_Reset_PB:false,in_Relase_Door_PB:false,in_Door_Monitor:true,in_Safety_Run:false,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,inPLC_BypassC1C2:false,
 in_LV_Faulty_FBK:false,in_HV_Faulty_FBK:false,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false};
const rootSignals={safeBlue:'b_Set_Door_Unlock',rndBlue:'b_Set_Door_Unlock_1',safeUp:'b_Step12_Set',safeTransition:'b_Set_Transition_1',safeLockRequest:'b_SetLock_ResetPB_1',
 runResetSto1:'b_Reset_STO_DR1_4',runResetSto2:'b_Reset_STO_DR2_4',runDischarge:'b_Set_HV_Discharge_Request_3',runResetHv:'b_Reset_HV_C2_4',
 laterStep12:'b_Step12_Set_2',laterLockRequest:'b_SetLock_ResetPB_3',lock:'b_ResetPB_Lock',estop:'b_EStop_Ok',
 lv:'out_LV_C1',hv:'out_HV_C2',sto1:'STO_DR1',sto2:'STO_DR2',unlock:'out_Door_Unlock_Solonoeid',
 lvDischarge:'out_LV_Discharge_Request',hvDischarge:'out_HV_Discharge_Request',plcSto1:'outPLC_STO_1',plcSto2:'outPLC_STO_2',
 safeBoth:'//RndPhysicalCompact/BOTH/TonOut',safeTonQ:'//RndPhysicalCompact/BOTH/TonOut',safeReady:'//Network2/FBAnd3/AndOut',safeGate:'//Network2/FBAnd4/AndOut',
 safePlc:'//Network2/FBAnd91/AndOut',runPlc:'//Network6/FBAnd17/AndOut',runTonQ:'//RndPhysicalCompact/GREEN/TonOut',runQualifier:'//Network6/FBAnd24/AndOut',
 grant:'//Network1/FBRs6/RsOut',grantSet:'//Network1/FBOr4/OrOut',grantReset:'//Network1/FBOr3/OrOut',runAggregate:'//Network6/FBOr5/OrOut',sharedGreen:'//RndPhysicalCompact/GREEN/TonOut',attemptT:'//RndPhysicalCompact/STATE_T/RsOut',attemptC:'//RndPhysicalCompact/STATE_C/RsOut',attemptA:'//RndPhysicalCompact/STATE_A/RsOut',attemptL:'//RndPhysicalCompact/STATE_L/RsOut',rawAnd23:'//Network6/FBAnd23/AndOut'};
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const walk=n=>[n,...n.children.flatMap(walk)];
function createSafeRunFixture(mode,{scanMs=1,rawOverrides={}}={}){
 if(!['Safe','Run'].includes(mode))throw Error('Fixture mode must be Safe or Run');
 assertNativeSalStructure(fs.readFileSync(source,'utf8'));
 const model=parseSalFile(source,{bindingMode:'current',sgvlPath:sgvl});if(model.bindingAudit.status!=='PASS')throw Error('Full source binding audit required');
 const all=model.networks.flatMap(n=>n.blocks),ports=new Map(all.flatMap(b=>[...b.inputs,...b.outputs]).map(p=>[p.path,p]));
 const outputOwners=new Map(all.flatMap(b=>b.outputs.map(p=>[p.path,b]))),writers=new Map(),targets=new Map(),cuts=[];
 const add=(name,path)=>{if(!writers.has(name))writers.set(name,[]);writers.get(name).push(path);};
 for(const v of model.variables){for(const p of v.sourcePorts)add(v.name,p);for(const p of v.targetPorts)targets.set(p,v);}
 for(const b of all)for(const p of b.outputs)for(const g of p.globals)add(g.resolvedName,p.path);
 const raw={...withActualNames(model,rawCommon),in_LV_C1_FBK:mode==='Run',in_HV_C2_FBK:mode==='Run',in_STO_DR1_FBK:mode==='Safe',in_STO_DR2_FBK:mode==='Safe'};
 for(const [name,value]of Object.entries(withActualNames(model,rawOverrides))){if(!Object.hasOwn(raw,name)||typeof value!=='boolean')throw Error('Not a given raw input '+name);raw[name]=value;}
 const runPhysical=ports.get('//Network6/FBOr5/OrIn1')?.sources;
 if(runPhysical?.length!==1||!outputOwners.has(runPhysical[0]))throw Error('Actual Run physical consumer source missing');
 const signals={...rootSignals,runPhysical:runPhysical[0]},demandedOutputs=new Set(),demandedInputs=new Set(),selected=new Set(),pending=[];
 function variable(name,consumer){
  if(phases.includes(name)){const gs=all.flatMap(b=>b.outputs.flatMap(p=>p.globals)).find(g=>g.resolvedName===name);
   if(!gs)throw Error('Unknown typed state '+name);cuts.push({name,id:gs.variableId,source:writers.get(name),consumer,kind:'Network3 owner boundary',initialValue:false});return;}
  if(writers.has(name)){pending.push(...writers.get(name));return;}
  const v=model.variables.find(v=>v.name===name);if(!v?.alias||!Object.hasOwn(raw,name))throw Error('Undeclared typed external input '+name);
  cuts.push({name,id:v.id,consumer,kind:'given program input',initialValue:raw[name]});
 }
 for(const value of Object.values(signals)){if(value.startsWith('//')){if(!outputOwners.has(value))throw Error('Unknown diagnostic output '+value);pending.push(value);}else variable(value,'observed real output');}
 while(pending.length){const output=pending.pop();if(demandedOutputs.has(output))continue;demandedOutputs.add(output);
  const block=outputOwners.get(output);if(!block)throw Error('Missing actual output '+output);
  if(/^\/\/Network[34]\//.test(block.path))throw Error('Uncut phase/group source entered execution '+block.path);selected.add(block);
  const inputs=block.functionName==='safeEstop'?[block.inputs.find(p=>p.name==='Restart'),...effectiveEstopInputs(block,{isBound:p=>p.sources.length||p.globals.length||targets.has(p.path)}).map(x=>x.port)]:
   block.functionName==='safeDecouple'?[block.inputs[block.outputs.findIndex(p=>p.path===output)]]:block.inputs.filter(p=>!['Deactivated','Both Deactivated'].includes(p.channelInterface)&&!p.name.startsWith('EDM'));
  for(const p of inputs){demandedInputs.add(p.path);if(p.sources.length)pending.push(...p.sources);else if(p.globals.length)for(const g of p.globals)variable(g.resolvedName,p.path);else if(targets.has(p.path))variable(targets.get(p.path).name,p.path);else throw Error('Unbound demanded input '+p.path);}
 }
 const native=walk(readBindingXml(fs.readFileSync(source,'utf8'))),ids=new Map();
 for(const n of native.filter(n=>n.attr?.functionName)){let owner=n.parent;while(owner&&owner.tag!=='Network')owner=owner.parent;ids.set(`//${owner.attr.name}/${n.attr.name}`,n.attr.Id);}
 const scope={mode,clockContract:SAL_CLOCK_CONTRACT,nativePairContract:SAL_NATIVE_PAIR_CONTRACT,
  sourceSha256:hash(fs.readFileSync(source)),sgvlSha256:hash(fs.readFileSync(sgvl)),bindingAudit:{status:model.bindingAudit.status,portCount:model.bindingAudit.portCount,canonicalWires:model.bindingAudit.edges.length},
  selected:[...selected].map(b=>({path:b.path,id:ids.get(b.path),order:b.orderOfExecution})).sort((a,b)=>a.order-b.order),
  demandedInputs:[...demandedInputs].sort(),boundaries:[...new Map(cuts.map(c=>[c.name+':'+c.consumer,c])).values()],rawInitial:raw,signals,
  signalWriters:Object.fromEntries(Object.entries(signals).map(([k,v])=>[k,(v.startsWith('//')?[v]:writers.get(v)).map(p=>({port:p,id:ports.get(p).Id}))])),
  limits:['Network3 phase owner boundary, not full BOOT/reachability','Network4/group semantics unexecuted','No standalone PLC endpoint policy','Run down fanout observed, QD endpoint not accepted','No single-event acceptance marker is invented'],
  excludedDecoupleChannels:[...selected].filter(b=>b.functionName==='safeDecouple').flatMap(b=>b.outputs.filter(p=>!demandedOutputs.has(p.path)).map(p=>({output:p.path,id:p.Id,globals:p.globals,reason:'Outside demanded observation cone; may have live consumers, not asserted native unused/FALSE'})))};
 const r=new SalRuntime({...model,networks:model.networks.map(n=>({...n,blocks:n.blocks.filter(b=>selected.has(b))})).filter(n=>n.blocks.length)},{scanMs,unconnectedInput:false});
 r.setInputs({...raw,...Object.fromEntries(phases.map(p=>[p,false]))});
 const clock=new ObservedSamples(r,scanMs),frames=[],setup=[],transitions=[],rises=Object.fromEntries(Object.keys(signals).map(k=>[k,0]));
 let previous=Object.fromEntries(Object.keys(signals).map(k=>[k,false])),preparing=true,consumed={};
 const evaluate=r.evaluate.bind(r);r.evaluate=(b,dt)=>{for(const [key,path]of Object.entries({safeTonInput:'//RndPhysicalCompact/BOTH/TonIn',runTonInput:'//RndPhysicalCompact/GREEN/TonIn',releaseTonEnable:'//RndPhysicalCompact/RELEASE/TonIn',runConsumedQualifier:'//Network6/FBAnd23/AndIn1',ownerConsumedSet:'//Network6/RUN_DOWN_OWNER/Set',ownerConsumedReset:'//Network6/RUN_DOWN_OWNER/Reset'})){const p=ports.get(path);if(p&&b.inputs.some(i=>i.path===path))consumed[key]=r.readRaw(p);}return evaluate(b,dt);};
 const scan=r.scan.bind(r);r.scan=dt=>{consumed={};scan(dt);const current=Object.fromEntries(Object.entries(signals).map(([k,v])=>[k,r.get(v)]));
  const frame={timeMs:clock.timeMs+dt,signals:current,consumed:{...consumed},raw:Object.fromEntries(Object.keys(raw).map(k=>[k,r.get(k)])),phases:Object.fromEntries(phases.map(k=>[k,r.get(k)]))};
  if(preparing)setup.push(frame);else{frames.push(frame);for(const k of Object.keys(signals))if(current[k]&&!previous[k])rises[k]++;if(Object.keys(signals).some(k=>current[k]!==previous[k]))transitions.push(frame);}previous=current;return r;};
 clock.sample();clock.advance(10*scanMs);clock.sample({in_Reset_PB:true});clock.sample({in_Reset_PB:false});
 if(!r.get('b_EStop_Ok'))throw Error('Actual main EStop Restart preparation failed');
 if(mode==='Run'){clock.sample({b_Step2:true});const end=clock.timeMs+6500;while(!(r.get('out_LV_C1')&&r.get('out_HV_C2')&&r.get('STO_DR1')&&r.get('STO_DR2'))&&clock.timeMs<end)clock.sample();
  if(!(r.get('out_LV_C1')&&r.get('out_HV_C2')&&r.get('STO_DR1')&&r.get('STO_DR2')))throw Error('Actual ordinary Step2 outputs preparation failed');}
 preparing=false;clock.sample({b_Step2:false,[mode==='Safe'?'b_Step1':'b_Step3']:true});clock.advance(2100);
 if(r.get('b_ResetPB_Lock'))throw Error('Actual ResetPB_Lock not FALSE; no hidden lock cut allowed');
 if(r.get('//Network2/FBAnd91/AndOut')||r.get('//Network6/FBAnd17/AndOut'))throw Error('PLC00 isolation failed');
 const unbound=()=>[...r.assumedUnconnectedPorts].filter(p=>demandedInputs.has(p));if(unbound().length)throw Error('Runtime demanded unbound input '+unbound());
 return{r,clock,scope,frames,setup,transitions,rises,get:key=>r.get(signals[key]),sample:inputs=>clock.sample(inputs),advance:ms=>clock.advance(ms),
  edgeAfter:(first,delta,inputs)=>clock.observeAfter(first,delta,inputs),unbound,
  current:()=>frames.at(-1),ledger:()=>({allUnboundReadPorts:[...r.assumedUnconnectedPorts],unresolvedDemanded:unbound()}),
  first:(key,from=-Infinity)=>frames.find(f=>f.timeMs>=from&&f.signals[key])?.timeMs};
}
// ---- runner wrapper semantics preserved: every check is evaluated, the case fails if any check differs,
// plus the runner's terminal check 'all demanded inputs resolved'. Fixture/preparation throw = test failure.
const both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false};
const any=(x,from,keys)=>x.frames.some(f=>f.timeMs>=from&&keys.some(k=>f.signals[k]));
function f1case(id,body){test(id,()=>{const checks=[],times={};const e=(label,actual,expected)=>checks.push({label,actual,expected});
 const x=createSafeRunFixture('Run');body(x,e,times);e('all demanded inputs resolved',x.unbound(),[]);
 const failed=checks.filter(c=>JSON.stringify(c.actual)!==JSON.stringify(c.expected));
 assert.deepEqual(failed,[],id+' times='+JSON.stringify(times));});}

// ---- verbatim from qualification-red.mjs (MU07 killer at delta 500; 600 is the original sibling) ----
for(const delta of [500,600])f1case('F1-green-qualified-lateblue'+delta+'-cannot-cancel',(x,e,t)=>{
 t.first=x.sample({in_Reset_PB:true});t.second=x.edgeAfter(t.first,delta,both);x.advance(10);
 e('acceptedgreen survives lateblue by first+503',any(x,t.first,['runPhysical']),true);
 const first=x.first('runPhysical',t.first);if(first!==undefined)e('lateblue doesnotresetacceptedowner',x.frames.filter(f=>f.timeMs>=first).every(f=>f.signals.runPhysical),true);
 e('only one physical down rise',x.rises.runPhysical,1);e('no up/unlock from sameattempt',any(x,t.first,['safeUp','safeTransition','safeBlue','rndBlue','unlock']),false);
});
for(const delta of [500,600])f1case('F1-blue-qualified-lategreen'+delta+'-cannot-become-down',(x,e,t)=>{
 t.first=x.sample({in_Relase_Door_PB:true});t.second=x.edgeAfter(t.first,delta,both);x.advance(700);x.sample({in_Relase_Door_PB:false});x.advance(700);
 e('Armedblueignored and lategreen cannot create secondcommand',any(x,t.first,['runPhysical','rawAnd23','runAggregate','safeUp','rndBlue','unlock']),false);
});
// ---- verbatim from qualification-red.mjs (MU05 killer) ----
f1case('F1-real-lock-producer-rejects-green-and-doesnotqueue',(x,e,t)=>{
 // Run component remains an explicit ownership cut. PLC01 traverses the real old
 // Run receiver/TON/Step12 request/LockSet3 writer; neither Lock nor owner is seeded.
 t.green=x.sample({in_Reset_PB:true,in_HV_C2_FBK:false,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:true});
 x.advance(230);e('actual ResetPBLock set by native PLCstop completion producer',x.get('lock'),true);
 x.advance(274);e('qualifiedgreen while actuallockTRUE cannot own physicaldown',x.get('runPhysical'),false);
 t.off=x.sample({...off,inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:false});x.advance(10);e('actual greenrelease clearslock',x.get('lock'),false);
 x.advance(2100);e('clearinglock never queues oldgreen authorization',any(x,t.off,['runPhysical']),false);
 t.fresh=x.sample({in_Reset_PB:true});x.advance(504);e('fresh fullyclean green availability preserved',x.get('runPhysical'),true);
});

// ---- tester addition E1-f1-adopt2: neighbours of the exact-500 boundary (D-Q500 / D-LATE-SECOND) ----
// 501: second button 1 ms after the 0.5 s single qualification -> D-LATE-SECOND "after acceptance":
// identical oracle to the 500/600 originals (accepted down not cancelled, one rise, no up/unlock).
f1case('F1-green-qualified-lateblue501-cannot-cancel',(x,e,t)=>{
 t.first=x.sample({in_Reset_PB:true});t.second=x.edgeAfter(t.first,501,both);x.advance(10);
 e('acceptedgreen survives lateblue by first+501 (D-LATE-SECOND after acceptance)',any(x,t.first,['runPhysical']),true);
 const first=x.first('runPhysical',t.first);if(first!==undefined)e('lateblue doesnotresetacceptedowner',x.frames.filter(f=>f.timeMs>=first).every(f=>f.signals.runPhysical),true);
 e('only one physical down rise',x.rises.runPhysical,1);e('no up/unlock from sameattempt',any(x,t.first,['safeUp','safeTransition','safeBlue','rndBlue','unlock']),false);
});
// 499: second button 1 ms before the 0.5 s single could qualify, >250 ms after first -> late second BEFORE
// acceptance: neither single (no normal down) nor StepUp/Unlock while held and after release;
// a new attempt is available only after both OFF + release filter (positive control, liveness of the cone).
f1case('F1-green-lateblue499-before-single-no-command',(x,e,t)=>{
 t.first=x.sample({in_Reset_PB:true});t.second=x.edgeAfter(t.first,499,both);x.advance(1200);
 e('late second before single acceptance: no down while both held (D-LATE-SECOND)',any(x,t.first,['runPhysical','rawAnd23','runAggregate']),false);
 t.off=x.sample(off);x.advance(10);
 e('no down/up/unlock from the ignored attempt incl. release (D-LATE-SECOND, D-RUN-BOTH-IGNORE)',any(x,t.first,['runPhysical','rawAnd23','runAggregate','safeUp','safeTransition','safeBlue','rndBlue','unlock']),false);
 x.advance(2100);e('no deferred command after clearing',any(x,t.first,['runPhysical','runAggregate']),false);
 t.fresh=x.sample({in_Reset_PB:true});x.advance(504);e('fresh fullyclean green500 available after both OFF + filter',x.get('runPhysical'),true);
});
// Blue-first symmetric neighbours (D-Q500/D-LATE-SECOND symmetric; same oracle as the 500/600 originals).
for(const delta of [499,501])f1case('F1-blue-qualified-lategreen'+delta+'-cannot-become-down',(x,e,t)=>{
 t.first=x.sample({in_Relase_Door_PB:true});t.second=x.edgeAfter(t.first,delta,both);x.advance(700);x.sample({in_Relase_Door_PB:false});x.advance(700);
 e('Armedblueignored and lategreen cannot create secondcommand',any(x,t.first,['runPhysical','rawAnd23','runAggregate','safeUp','rndBlue','unlock']),false);
});
