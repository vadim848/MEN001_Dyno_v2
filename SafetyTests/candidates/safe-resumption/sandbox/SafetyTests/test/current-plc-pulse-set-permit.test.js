import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseSalFile} from '../src/sal-parser.js';
import {SalRuntime} from '../src/sal-runtime.js';
import {effectiveEstopInputs} from '../src/estop-native-pairs.js';
const model=parseSalFile(new URL('../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url));
assert.equal(model.bindingAudit.status,'PASS','full actual SAL/SGVL audit precedes all cuts');
const all=model.networks.flatMap(n=>n.blocks),get=p=>{const b=all.find(b=>b.path===p);if(!b)throw Error('Missing real block '+p);return b;};
const ports=new Map(all.flatMap(b=>[...b.inputs,...b.outputs]).map(p=>[p.path,p]));
const rawHealthy={in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Estop_PLC:false,in_False_SI2_CH8:false,in_Mentee_EStop:false,in_Reset_PB:false};
const globals={b_Step12:false,b_Step2:false,b_Set_LV_C1:false,b_Set_LV_C1_1:false,b_Set_HV_C2:false,b_Set_HV_C2_1:false};
const cutPorts={'//Network1/FBOr11/OrOut':false,'//Network1/FBOr16/OrOut':false,'//Network1/FBAnd4/AndOut':false,'//Network1/FBAnd5/AndOut':false,'//Network1/FBAnd6/AndOut':false};
function fixture(domain,route,dt){
 const rs=get(`//Network1/FBRs${domain==='LV'?1:2}`),aggregate=get(`//Network1/FBOr${domain==='LV'?17:18}`),gate=get(`//Network1/FBAnd${domain==='LV'?'Lv':'Hv'}SetPermit`);
 const producers=route==='legacy'?[get('//Network5/FBAnd1'),get('//Network5/FBDecouple1')]:[get(domain==='LV'?'//Network11/FBAnd1':'//Network1/FBAnd6')];
 const selected=[get('//Network1/FBAnd1'),get('//Network1/FBEstop1'),get('//Network1/FBAndLvCurrentPermit'),gate,rs,aggregate,...producers];
 const writers=new Set(selected.flatMap(b=>b.outputs.map(p=>p.path))),globalWriters=new Set(selected.flatMap(b=>b.outputs.flatMap(p=>p.globals.map(g=>g.resolvedName))));
 const boundaries=[],demanded=new Set();
 for(const b of selected){const inputs=b.functionName==='safeEstop'?[b.inputs.find(p=>p.name==='Restart'),...effectiveEstopInputs(b).map(p=>p.port)]:b.functionName==='safeDecouple'?b.inputs.slice(0,2):b.inputs.filter(p=>!['Deactivated','Both Deactivated'].includes(p.channelInterface));
  for(const p of inputs){demanded.add(p.path);const alias=model.variables.find(v=>v.targetPorts.includes(p.path));
   if(alias){if(alias.sourcePorts.some(source=>writers.has(source)))continue; // Actual selected output alias, including HV retry feedback, is not a raw boundary.
    if(!Object.hasOwn(rawHealthy,alias.name))throw Error('Undeclared raw boundary '+alias.name);boundaries.push({consumer:p.path,kind:'given program input',name:alias.name,id:alias.id,initialValue:rawHealthy[alias.name]});}
   else if(p.sources.length){for(const source of p.sources)if(!writers.has(source)){if(!Object.hasOwn(cutPorts,source)||!ports.has(source))throw Error('Undeclared source cut '+source);boundaries.push({consumer:p.path,kind:'excluded real producer',name:source,id:ports.get(source).Id,initialValue:cutPorts[source],reason:source.includes('FBOr11')||source.includes('FBOr16')?'Reset aggregation FALSE isolates new Set; not full emergency Reset policy':'explicit upstream/other-route boundary'});}}
   else if(p.globals.length){for(const g of p.globals)if(!globalWriters.has(g.resolvedName)){if(!Object.hasOwn(globals,g.resolvedName))throw Error('Undeclared global cut '+g.resolvedName);boundaries.push({consumer:p.path,kind:'typed state/other request boundary',name:g.resolvedName,id:g.variableId,initialValue:globals[g.resolvedName],reason:'State ownership or excluded alternative producer, not phase reachability'});}}
   else throw Error('Unbound demanded input '+p.path);
  }
 }
 const r=new SalRuntime({...model,networks:[{blocks:selected}]},{scanMs:dt,unconnectedInput:false});r.setInputs({...rawHealthy,...globals});for(const [path,value]of Object.entries(cutPorts))if(!writers.has(path))r.values.set(path,value);
 const frames=[];let time=-dt;const output=domain==='LV'?'out_LV_C1':'out_HV_C2';
 const snap=label=>{const frame={timeMs:time,label,output:r.get(output),aggregate:r.get(aggregate.outputs[0].path),EStopOK:r.get('b_EStop_Ok'),PLCproducer:r.get('//Network1/FBAnd1/AndOut'),common:r.get('//Network1/FBAndLvCurrentPermit/AndOut'),set:r.get(gate.outputs[0].path),raw:{PLC:r.get('in_Estop_PLC'),FalseInput:r.get('in_False_SI2_CH8'),Restart:r.get('in_Reset_PB'),Step12:r.get('b_Step12'),Step2:r.get('b_Step2'),HVretrySource:r.get('//Network1/FBAnd4/AndOut'),ResetSource:r.get(rs.inputs.find(p=>p.name==='Reset').sources[0])}};frames.push(frame);return frame;};
 const sample=(inputs,label='scan')=>{if(inputs)r.setInputs(inputs);r.scan(dt);time+=dt;return snap(label);};
 for(let i=0;i<3;i++)sample(undefined,'startup healthy without Restart');
 sample({in_Reset_PB:true},'Restart high');sample({in_Reset_PB:false},'Restart falling');
 if(!r.get('b_EStop_Ok'))throw Error('Actual main Restart preparation failed');
 const enable=()=>{if(route==='legacy')r.setInputs({b_Step2:true});else if(domain==='LV')r.setInputs({b_Step12:true});else r.values.set('//Network1/FBAnd4/AndOut',true);};
 enable();let budget=20;while(!r.get(aggregate.outputs[0].path)&&budget-->0)sample(undefined,'real producer builds aggregate');
 if(!r.get(aggregate.outputs[0].path)||r.get(output))throw Error('Need real aggregateTRUE/outputFALSE prehistory');
 const prehistory={...frames.at(-1),label:'prehistory aggregateTRUE/outputFALSE',boundaryValues:boundaries.map(b=>({name:b.name,consumer:b.consumer,id:b.id,actualValue:r.get(b.name)}))};
 const scope={domain,route,scanMs:dt,selected:selected.map(b=>({path:b.path,order:b.orderOfExecution})),boundaries,limit:'Actual producers/main EStop/Set boundary; explicit phase/upstream and ResetFALSE cuts, not BOOT/full emergency sequence'};
 return {r,frames,prehistory,scope,sample,snap,output:()=>r.get(output),advance:(n,label)=>{for(let i=0;i<n;i++)sample(undefined,label);},unbound:()=>[...r.assumedUnconnectedPorts].filter(p=>demanded.has(p))};
}
const evidence=[],producerTruth=[];
function scenario(domain,route,dt,name,body){test(`PLCPULSE ${domain}/${route}/fixed${dt} ${name}`,()=>{const x=fixture(domain,route,dt),checks=[];const e=(label,actual,expected)=>checks.push({label,actual,expected});e('real pending aggregate before first Set',x.prehistory.aggregate,true);e('initial output still FALSE',x.prehistory.output,false);e('actual manual EStop positive',x.prehistory.EStopOK,true);body(x,e);e('no unknown demanded input fallback',x.unbound(),[]);const failed=checks.filter(c=>JSON.stringify(c.actual)!==JSON.stringify(c.expected));evidence.push({domain,route,scanMs:dt,name,status:failed.length?'FAIL':'PASS',scope:x.scope,prehistory:x.prehistory,checks,frames:x.frames});assert.deepEqual(failed,[],JSON.stringify(failed));});}
after(()=>{if(process.env.MEN001_PLC_EVIDENCE_PATH)fs.writeFileSync(process.env.MEN001_PLC_EVIDENCE_PATH,JSON.stringify({cases:evidence,producerTruth}));});
function healthy(x,e){x.sample({in_Estop_PLC:false},'paired healthy first pending consumption');e('identical healthy background genuinely Sets',x.output(),true);}
function pulse(x,e){const start=x.frames.length;const fault=x.sample({in_Estop_PLC:true},'one-sample raw PLC fault');e('old EStop permission really stale during first fault',fault.EStopOK,true);e('actual PLC producer now FALSE',fault.PLCproducer,false);e('fault sample cannot create new Set',fault.output,false);const restore=x.sample({in_Estop_PLC:false},'first raw recovery without Restart');e('first raw recovery cannot create new Set',restore.output,false);e('main EStop sees prior producer fault on recovery',restore.EStopOK,false);x.advance(5,'later healthy raw without Restart');e('output never TRUE during entire fault/recovery interval',x.frames.slice(start).some(f=>f.output),false);}
function heldAndRestart(x,e){const mark=x.frames.length;x.sample({in_Estop_PLC:true},'fault start');x.advance(3,'fault held');x.sample({in_Estop_PLC:false},'later raw restoration');x.advance(3,'no Restart');e('held fault/restoration never creates Set',x.frames.slice(mark).some(f=>f.output),false);e('raw healthy still has latched EStop inhibit',x.r.get('b_EStop_Ok'),false);x.sample({in_Reset_PB:true},'manual Restart high');e('Restart high is not accepted Restart',x.r.get('b_EStop_Ok'),false);e('no Set while Restart held high',x.output(),false);x.sample({in_Reset_PB:false},'manual Restart falling accepted');e('real manual Restart succeeds',x.r.get('b_EStop_Ok'),true);e('early Set latch still saw prior EStop FALSE on this sample',x.output(),false);x.advance(2,'healthy new pending Set after accepted Restart');e('authorized real Set positive after Restart',x.output(),true);}
for(const domain of ['LV','HV'])for(const dt of [1,2,5,10]){
 scenario(domain,'primary',dt,'paired healthy positive',healthy);
 scenario(domain,'primary',dt,'one-sample PLC pulse and first/later raw recovery',pulse);
 scenario(domain,'primary',dt,'held fault later recovery then real manual Restart positive',heldAndRestart);
 scenario(domain,'primary',dt,'already latched output receives no forced Reset from Set gate',(x,e)=>{healthy(x,e);const mark=x.frames.length;x.sample({in_Estop_PLC:true},'latched fault');x.sample({in_Estop_PLC:false},'latched raw restoration');x.advance(5,'latched without Restart');e('ResetFALSE boundary preserves already latched output',x.frames.slice(mark).every(f=>f.output),true);});
}
for(const domain of ['LV','HV'])for(const dt of [1,10]){
 scenario(domain,'legacy',dt,'independent actual Network5 paired healthy',healthy);
 scenario(domain,'legacy',dt,'independent actual Network5 PLC pulse/recovery',pulse);
 scenario(domain,'primary',dt,'False operand retains its actual EStop producer/manual Restart role',(x,e)=>{
  // The same pending request is protected initially by raw PLC; no immediate raw-False energy ban is invented.
  // The Set gap itself is covered by the PLC pulse pairs, not this operand test.
  const f=x.sample({in_Estop_PLC:true,in_False_SI2_CH8:true},'PLC blocks initial Set while False operand asserts');e('fault sample output remainsFALSE',f.output,false);x.advance(3,'producer FALSE due existing operands');
  x.sample({in_Estop_PLC:false},'PLC healthy but False still asserted');e('existing producer staysFALSE with only False asserted',x.r.get('//Network1/FBAnd1/AndOut'),false);
  x.sample({in_Reset_PB:true},'Restart high while False asserted');x.sample({in_Reset_PB:false},'Restart falling while False asserted');e('False operand still prevents accepted Restart',x.r.get('b_EStop_Ok'),false);
  x.sample({in_False_SI2_CH8:false},'False operand restored');x.advance(2,'raw healthy no Restart');e('restoration does not substitute for manual Restart',x.r.get('b_EStop_Ok'),false);
  x.sample({in_Reset_PB:true},'new healthy Restart high');x.sample({in_Reset_PB:false},'new healthy Restart falling');e('healthy manual Restart positive',x.r.get('b_EStop_Ok'),true);x.advance(2,'post Restart real Set');e('healthy Set positive after accepted Restart',x.output(),true);
 });
}
for(const plc of [false,true])for(const falseInput of [false,true])test(`PLCPULSE existing PLCproducer actual role PLC${plc}/False${falseInput}`,()=>{
 const p=get('//Network1/FBAnd1'),r=new SalRuntime({...model,networks:[{blocks:[p]}]},{unconnectedInput:false});r.setInputs({in_Estop_PLC:plc,in_False_SI2_CH8:falseInput}).scan();const actual=r.get(p.outputs[0].path),expected=!plc&&!falseInput;producerTruth.push({plc,falseInput,actual,expected,status:actual===expected?'PASS':'FAIL'});assert.equal(actual,expected);
});
