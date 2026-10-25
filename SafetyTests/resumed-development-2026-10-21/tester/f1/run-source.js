import fs from 'node:fs';
import crypto from 'node:crypto';
import {parseSalFile} from '../../../src/sal-parser.js';
import {readBindingXml} from '../../../src/sal-binding-validator.js';
import {effectiveEstopInputs,SAL_NATIVE_PAIR_CONTRACT} from '../../../src/estop-native-pairs.js';
import {SalRuntime,SAL_CLOCK_CONTRACT} from '../../../src/sal-runtime.js';
import {ObservedSamples} from '../../../src/observed-samples.js';
import {assertNativeSalStructure} from '../../../src/sal-native-structure.js';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const sourceRoot=process.env.MEN001_F1_ROOT?pathToFileURL(path.resolve(process.env.MEN001_F1_ROOT)+'/'):new URL('../../../../',import.meta.url);
const source=new URL('MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',sourceRoot);
const sgvl=new URL('MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',sourceRoot);
const phases=['b_Step1','b_Step2','b_Step3','b_Step4','b_Step5','b_Step6','b_Step12','b_Step_RnD'];
const rawCommon={in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,
 in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,
 in_Reset_PB:false,in_Relase_Door_PB:false,in_Door_Monitor:true,in_Safety_Run:false,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,inPLC_BypassC1C2:false,
 in_LV_Healthy_FBK:false,in_HV_Healthy_FBK:false,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false};
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
export function createSafeRunFixture(mode,{scanMs=1,rawOverrides={}}={}){
 if(!['Safe','Run'].includes(mode))throw Error('Fixture mode must be Safe or Run');
 assertNativeSalStructure(fs.readFileSync(source,'utf8'));
 const model=parseSalFile(source,{bindingMode:'current',sgvlPath:sgvl});if(model.bindingAudit.status!=='PASS')throw Error('Full source binding audit required');
 const all=model.networks.flatMap(n=>n.blocks),ports=new Map(all.flatMap(b=>[...b.inputs,...b.outputs]).map(p=>[p.path,p]));
 const outputOwners=new Map(all.flatMap(b=>b.outputs.map(p=>[p.path,b]))),writers=new Map(),targets=new Map(),cuts=[];
 const add=(name,path)=>{if(!writers.has(name))writers.set(name,[]);writers.get(name).push(path);};
 for(const v of model.variables){for(const p of v.sourcePorts)add(v.name,p);for(const p of v.targetPorts)targets.set(p,v);}
 for(const b of all)for(const p of b.outputs)for(const g of p.globals)add(g.resolvedName,p.path);
 const raw={...rawCommon,in_LV_C1_FBK:mode==='Run',in_HV_C2_FBK:mode==='Run',in_STO_DR1_FBK:mode==='Safe',in_STO_DR2_FBK:mode==='Safe'};
 for(const [name,value]of Object.entries(rawOverrides)){if(!Object.hasOwn(raw,name)||typeof value!=='boolean')throw Error('Not a given raw input '+name);raw[name]=value;}
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
export function compressFrames(frames){const spans=[];let previous;for(const frame of frames){const{timeMs,...values}=frame,key=JSON.stringify(values);if(key===previous){spans.at(-1).lastTimeMs=timeMs;spans.at(-1).samples++;}else{spans.push({firstTimeMs:timeMs,lastTimeMs:timeMs,samples:1,...values});previous=key;}}return spans;}
