import fs from 'node:fs';
import crypto from 'node:crypto';
import {parseSalFile} from './sandbox/SafetyTests/src/sal-parser.js';
import {SalRuntime} from './sandbox/SafetyTests/src/sal-runtime.js';
import {effectiveEstopInputs} from './sandbox/SafetyTests/src/estop-native-pairs.js';
import {ObservedSamples} from './sandbox/SafetyTests/src/observed-samples.js';
const base=new URL('./sandbox/',import.meta.url);
const phases=['b_Step1','b_Step2','b_Step3','b_Step4','b_Step5','b_Step6','b_Step12','b_Step_RnD'];
const raw={in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,in_Reset_PB:false,in_Relase_Door_PB:false,in_Door_Monitor:true,in_Safety_Run:false,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,inPLC_BypassC1C2:false,in_LV_C1_FBK:false,in_HV_C2_FBK:false,in_STO_DR1_FBK:true,in_STO_DR2_FBK:true,in_LV_Healthy_FBK:true,in_HV_Healthy_FBK:true,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false};
export function createLifecycleFixture({baseline=false}={}){
 const sourceBase=baseline?new URL('./fixtures/baseline/',import.meta.url):base;
 const salPath=new URL('MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',sourceBase),sgvlPath=new URL('MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',sourceBase);
 const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 const identities={sourceSha256:hash(salPath),sgvlSha256:hash(sgvlPath)};
 if(!baseline&&(identities.sourceSha256!=='f6d4fb7fa4f2ee0d29f19f8e43a87fca657ddf329bab0a7afb54e50b87cd6966'||identities.sgvlSha256!=='ab0f0ef25e29b4bf82722fcefc783daf8b01157c6c6d228f0e6948b4a568452a'))throw Error('Frozen candidate identity mismatch');
 if(baseline&&(identities.sourceSha256!=='0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909'||identities.sgvlSha256!=='06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5'))throw Error('Frozen baseline identity mismatch');
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
 if(baseline)delete signals.mode;
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
 const evaluate=r.evaluate.bind(r);r.evaluate=(b,dt)=>{evaluate(b,dt);if(started&&['//Network3/FBRs3','//Network3/FBRs7','//RndPhysicalCompact/STATE_SU'].includes(b.path))blockEvents.push({timeMs:clock.timeMs+dt,block:b.path,order:b.orderOfExecution,Run:r.get('b_Step3'),RnD:r.get('b_Step_RnD'),SU:r.get('//RndPhysicalCompact/STATE_SU/RsOut')});};
 r.setInputs=inputs=>{if(started){const bad=Object.keys(inputs).filter(k=>!Object.hasOwn(raw,k));if(bad.length)throw Error('Protocol write forbidden: '+bad);protocolWrites.push({timeMs:clock.timeMs+1,inputs});}return nativeSet(inputs);};
 const scan=r.scan.bind(r);r.scan=dt=>{scan(dt);if(started)frames.push({timeMs:clock.timeMs+dt,signals:Object.fromEntries(Object.entries(signals).map(([k,p])=>[k,r.get(p)])),raw:Object.fromEntries(Object.keys(raw).map(k=>[k,r.get(k)]))});return r;};
 // Prepare actual main-EStop Restart with no phase owner. Stable Safe is the
 // single declared initial state; no recognizer state or energy output is seeded.
 clock.sample();clock.advance(10);clock.sample({in_Reset_PB:true});clock.sample({in_Reset_PB:false});
 if(!r.get('b_EStop_Ok'))throw Error('Main Restart failed');
 const initial=all.find(b=>b.outputs.some(p=>p.globals.some(g=>g.resolvedName==='b_Step1')));
 r.memory.set(initial.path,{value:true});r.write(initial.outputs[0],true);
 const initialState={phase:'Safe',writer:initial.path,port:initial.outputs[0].path,id:initial.outputs[0].Id,recognizerMemorySeeded:false};
 started=true;clock.sample();clock.advance(2100);
 const unbound=()=>[...r.assumedUnconnectedPorts].filter(p=>demanded.has(p));
 if(unbound().length)throw Error('Demanded runtime fallback '+unbound());
 const scope={...identities,sourceAudit:m.bindingAudit.status,initialState,network4Boundary:boundary,inputs:cuts,selected:[...selected].map(b=>({path:b.path,order:b.orderOfExecution})).sort((a,b)=>a.order-b.order),limits:['Conditional initialSafe and seven inactive Network4 globals','No BOOT/group lifecycle proof','No phase/owner injection after protocolstart','No healthy Step2-to-Safe endpoint oracle']};
 return{r,clock,frames,blockEvents,scope,protocolWrites,sample:x=>clock.sample(x),advance:x=>clock.advance(x),unbound,get:k=>r.get(signals[k]??k),save:(name,extra={})=>fs.writeFileSync(new URL(name,import.meta.url),JSON.stringify({scope,protocolWrites,frames,blockEvents,unbound:unbound(),...extra},null,2))};
}

