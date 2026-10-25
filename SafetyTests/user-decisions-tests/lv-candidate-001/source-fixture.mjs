import fs from 'node:fs';
import crypto from 'node:crypto';
import {parseSalFile} from '../../src/sal-parser.js';
import {SalRuntime} from '../../src/sal-runtime.js';
import {effectiveEstopInputs} from '../../src/estop-native-pairs.js';
import {ObservedSamples} from '../../src/observed-samples.js';
const phases=['b_Step1','b_Step2','b_Step3','b_Step4','b_Step5','b_Step6','b_Step12','b_Step_RnD'];
const raw={in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,in_Reset_PB:false,in_Relase_Door_PB:false,in_Door_Monitor:true,in_Safety_Run:false,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,inPLC_BypassC1C2:false,in_LV_C1_FBK:false,in_HV_C2_FBK:false,in_STO_DR1_FBK:true,in_STO_DR2_FBK:true,in_LV_Healthy_FBK:true,in_HV_Healthy_FBK:true,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false};
export function createRndDownFixture({salPath,sgvlPath,initialPhase='b_Step1',initialDischarge=false}={}){
 if(!salPath||!sgvlPath)throw Error('Explicit source pair required');

 const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 const identities={sourceSha256:hash(salPath),sgvlSha256:hash(sgvlPath)};
 const m=parseSalFile(salPath,{bindingMode:'current',sgvlPath});
 if(m.bindingAudit.status!=='PASS')throw Error('Whole source audit failed');
 const all=m.networks.flatMap(n=>n.blocks),owner=new Map(),ports=new Map(),writers=new Map(),targets=new Map();
 const add=(name,p)=>{if(!writers.has(name))writers.set(name,new Set());writers.get(name).add(p);};
 for(const b of all)for(const p of [...b.inputs,...b.outputs]){ports.set(p.path,p);owner.set(p.path,b);}
 for(const v of m.variables){for(const p of v.sourcePorts)add(v.name,p);for(const p of v.targetPorts)targets.set(p,v.name);}
 for(const b of all)for(const p of b.outputs)for(const g of p.globals)add(g.resolvedName,p.path);
 const n4=all.find(b=>b.path==='//Network4/FBDecouple1');
 const boundary=n4.outputs.filter(p=>p.globals.length).map(p=>({path:p.path,id:p.Id,globals:p.globals,value:false,reason:'Explicit inactive Network4 lifecycle boundary; native/group value not inferred'}));
 if(boundary.length!==7)throw Error('Expected seven exact Network4 boundaries');
 const signals={...Object.fromEntries(phases.map(p=>[p,p])),lv:'out_LV_C1',hv:'out_HV_C2',sto1:'STO_DR1',sto2:'STO_DR2',estop:'b_EStop_Ok',safeUp:'b_Step12_Set',down:'b_Set_Transition_2',up:'b_Set_Transition_3',SU:'//RndPhysicalCompact/STATE_SU/RsOut',SG:'//RndPhysicalCompact/STATE_SG/RsOut',C:'//RndPhysicalCompact/STATE_C/RsOut',T:'//RndPhysicalCompact/STATE_T/RsOut',mode:'//SafeResumption/MODE/OrOut'};
 signals.completion='//Network12/FBAnd15/AndOut';
 signals.lvDischarge='out_LV_Discharge_Request';
 Object.assign(signals,{safeSetOr:'//Network3/FBOr2/OrOut',safeResetOr:'//Network3/FBOr1/OrOut',safeFallback:'//Network3/FBAnd1/AndOut',safeSet1:'b_Step1_Set',safeSet2:'b_Step1_Set_2',safeSet3:'b_Step1_Set_3',step2SafeFault:'//Network5/FBAnd7/AndOut'});
 Object.assign(signals,{runPhysical:'//Network6/FBAnd23/AndOut',runStop:'//Network6/FBOr5/OrOut',runResetSto1:'b_Reset_STO_DR1_4',runResetSto2:'b_Reset_STO_DR2_4',runDischarge:'b_Set_HV_Discharge_Request_3',runResetHv:'b_Reset_HV_C2_4',confirmRun:'b_Step3_Set_2',hvRequest:'b_Set_HV_C2_1',hvDischarge:'out_HV_Discharge_Request'});
 Object.assign(signals,{setLv:'//Network5/FBDecouple1/DecOut1',setHv:'//Network5/FBDecouple1/DecOut2',lvProposal:'//Network1/FBOr17/OrOut',hvProposal:'//Network1/FBOr18/OrOut',lvPermittedSet:'//Network1/FBAndLvSetPermit/AndOut',hvPermittedSet:'//Network1/FBAndHvSetPermit/AndOut'});
 const selected=new Set(),demanded=new Set(),pending=[],cuts=[];
 function variable(name,consumer){if(writers.has(name)){pending.push(...writers.get(name));return;}const v=m.variables.find(v=>v.name===name);if(!v?.alias||!Object.hasOwn(raw,name))throw Error('Unknown input '+name+' for '+consumer);cuts.push({name,id:v.id,consumer,value:raw[name]});}
 for(const p of Object.values(signals))if(p.startsWith('//'))pending.push(p);else variable(p,'observer');
 while(pending.length){const path=pending.pop();if(demanded.has(path))continue;demanded.add(path);const b=owner.get(path);if(!b)throw Error('No writer '+path);if(b.path===n4.path)continue;selected.add(b);
 const inputs=b.functionName==='safeEstop'?[b.inputs.find(p=>p.name==='Restart'),...effectiveEstopInputs(b,{isBound:p=>p.sources.length||p.globals.length||targets.has(p.path)}).map(x=>x.port)]:b.functionName==='safeDecouple'?[b.inputs[b.outputs.findIndex(p=>p.path===path)]]:b.inputs.filter(p=>!['Deactivated','Both Deactivated'].includes(p.channelInterface)&&!p.name.startsWith('EDM'));
 for(const p of inputs){demanded.add(p.path);if(p.sources.length)pending.push(...p.sources);else if(p.globals.length)for(const g of p.globals)variable(g.resolvedName,p.path);else if(targets.has(p.path))variable(targets.get(p.path),p.path);else throw Error('Unbound demanded input '+p.path);}}
 const r=new SalRuntime({...m,networks:m.networks.map(n=>({...n,blocks:n.blocks.filter(b=>selected.has(b))})).filter(n=>n.blocks.length)},{scanMs:1,unconnectedInput:false});
 r.setInputs(raw);for(const p of boundary)r.write(ports.get(p.path),false);
 const clock=new ObservedSamples(r,1),frames=[],blockEvents=[],protocolWrites=[],nativeSet=r.setInputs.bind(r);let started=false;
 const evaluate=r.evaluate.bind(r);r.evaluate=(b,dt)=>{const critical=['//Network1/FBRs1','//Network1/FBRs2','//Network1/FBRs3','//Network1/FBRs4','//Network12/FBAnd15','//Network3/FBRs1'];const consumed=started&&critical.includes(b.path)?Object.fromEntries(b.inputs.filter(p=>p.channelInterface!=='Deactivated').map(p=>[p.name,{path:p.path,id:p.Id,value:r.read(p)}])):undefined;evaluate(b,dt);if(started&&['//Network3/FBRs2','//Network3/FBRs3','//Network3/FBRs7','//RndPhysicalCompact/STATE_SU','//Network12/FBAnd15','//Network3/FBRs1','//RndPhysicalCompact/STATE_SG','//Network5/FBAnd1',...critical].includes(b.path))blockEvents.push({consumed,timeMs:clock.timeMs+dt,block:b.path,order:b.orderOfExecution,Step2:r.get('b_Step2'),completion:r.get('//Network12/FBAnd15/AndOut'),powerOn:r.get('//Network5/FBAnd1/AndOut'),Run:r.get('b_Step3'),RnD:r.get('b_Step_RnD'),SU:r.get('//RndPhysicalCompact/STATE_SU/RsOut')});};
 r.setInputs=inputs=>{if(started){const bad=Object.keys(inputs).filter(k=>!Object.hasOwn(raw,k));if(bad.length)throw Error('Protocol write forbidden: '+bad);protocolWrites.push({timeMs:clock.timeMs+1,inputs});}return nativeSet(inputs);};
 const scan=r.scan.bind(r);r.scan=dt=>{scan(dt);if(started)frames.push({timeMs:clock.timeMs+dt,signals:Object.fromEntries(Object.entries(signals).map(([k,p])=>[k,r.get(p)])),raw:Object.fromEntries(Object.keys(raw).map(k=>[k,r.get(k)]))});return r;};
 // Prepare actual main-EStop Restart with no phase owner. Declare initial
 // Safe or ordinary Step2, optionally generic discharge. Never seed recognizer.
 clock.sample();clock.advance(10);clock.sample({in_Reset_PB:true});clock.sample({in_Reset_PB:false});
 if(!r.get('b_EStop_Ok'))throw Error('Main Restart failed');
 if(!['b_Step1','b_Step2'].includes(initialPhase))throw Error('Unsupported declared initial component');
 const initial=all.find(b=>b.outputs.some(p=>p.globals.some(g=>g.resolvedName===initialPhase)));
 r.memory.set(initial.path,{value:true});r.write(initial.outputs[0],true);
 let dischargeSeed;
 if(initialDischarge){const path=[...writers.get('out_LV_Discharge_Request')][0],p=ports.get(path),b=owner.get(path);if(b.functionName!=='safeRs')throw Error('Discharge not RS');r.memory.set(b.path,{value:true});r.write(p,true);dischargeSeed={path,id:p.Id,kind:'Declared initial generic discharge, not RnD-down origin'};}
 const initialState={phase:initialPhase,dischargeSeed,writer:initial.path,port:initial.outputs[0].path,id:initial.outputs[0].Id,recognizerMemorySeeded:false};
 started=true;clock.sample();clock.advance(2100);
 const unbound=()=>[...r.assumedUnconnectedPorts].filter(p=>demanded.has(p));
 if(unbound().length)throw Error('Demanded runtime fallback '+unbound());
 const scope={...identities,sourceAudit:m.bindingAudit.status,initialState,network4Boundary:boundary,inputs:cuts,selected:[...selected].map(b=>({path:b.path,order:b.orderOfExecution})).sort((a,b)=>a.order-b.order),limits:['Conditional initialSafe and seven inactive Network4 globals','No BOOT/group lifecycle proof','No phase/owner injection after protocolstart','LVfeedbackFALSE completion per explicit user decision; no full HV completion oracle']};
 return{clock,frames,blockEvents,scope,protocolWrites,sample:x=>clock.sample(x),advance:x=>clock.advance(x),unbound,get:k=>r.get(signals[k]??k)};
}
