import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseSalFile} from '../src/sal-parser.js';
import {SalRuntime} from '../src/sal-runtime.js';
import {physicalRndSource} from '../src/physical-rnd-source.js';
const model=parseSalFile(new URL('../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url));
const all=model.networks.flatMap(n=>n.blocks),main=all.find(b=>b.path==='//Network1/FBEstop1'),window=all.find(b=>b.path==='//RndPhysicalCompact/WINDOW');
const results=[];
function scenario(name,body){test(`R3PAIR ${name}`,()=>{const checks=[];const e=(label,actual,expected)=>checks.push({label,actual,expected});body(e);const failed=checks.filter(c=>JSON.stringify(c.actual)!==JSON.stringify(c.expected));results.push({name,status:failed.length?'FAIL':'PASS',checks});assert.deepEqual(failed,[],JSON.stringify(failed));});}
after(()=>{if(process.env.MEN001_R3_EVIDENCE_PATH)fs.writeFileSync(process.env.MEN001_R3_EVIDENCE_PATH,JSON.stringify(results));});
const modes={first:'Single-Channel 1 Activated',second:'Single-Channel 2 Activated',both:'Single-Channel Both Activated',none:'Both Deactivated'};
const direct='Break Contact (NC)',inverted='Make Contact (NO)';
// Explicit raw-source component cut, using current native port/objectIndex metadata.
// Expected effective channels come from SDK ReloadCurrentState, not this adapter.
function component(mode,{contact1=direct,contact2=direct,slaveOwn=direct,slaveMode='Both Deactivated',unbound=[]}={}){
 const block=structuredClone(main);block.path='//R3/ESTOP';block.orderOfExecution=1;
 for(const p of [...block.inputs,...block.outputs]){p.path=`${block.path}/${p.name}`;p.sources=[];p.targets=[];p.globals=[];}
 for(const p of block.inputs.filter(p=>p.name.startsWith('EStopIn'))){p.channelInterface='Both Deactivated';p.deactivate1=direct;p.deactivate2=direct;}
 const first=block.inputs.find(p=>p.name==='EStopIn1'),second=block.inputs.find(p=>p.name==='EStopIn2');
 first.channelInterface=mode;first.deactivate1=contact1;first.deactivate2=contact2;second.channelInterface=slaveMode;second.deactivate1=slaveOwn;
 for(const name of ['Restart','EStopIn1','EStopIn2'])if(!unbound.includes(name))block.inputs.find(p=>p.name===name).sources=[`//R3/raw/${name}`];
 const r=new SalRuntime({networks:[{blocks:[block]}],variables:[],bindingMode:'explicit-test-injection'},{scanMs:1,unconnectedInput:false});
 const drive=values=>{for(const [name,value]of Object.entries(values))r.values.set(`//R3/raw/${name}`,value);r.scan();};
 return {r,block,drive,out:()=>r.get(`${block.path}/EStopOut`)};
}
for(const [modeName,mode]of Object.entries(modes))for(const inv1 of [false,true])for(const inv2 of [false,true])for(const raw1 of [false,true])for(const raw2 of [false,true]){
 scenario(`${modeName} masterContacts${Number(inv1)}${Number(inv2)} raw${Number(raw1)}${Number(raw2)} slaveOwnIgnored`,e=>{
  const x=component(mode,{contact1:inv1?inverted:direct,contact2:inv2?inverted:direct,slaveOwn:inv2?direct:inverted});
  const a=raw1!==inv1,b=raw2!==inv2;
  const expected={first:a,second:b,both:a&&b,none:true}[modeName];
  x.drive({Restart:false,EStopIn1:raw1,EStopIn2:raw2});e('healthy/raw values alone cannot auto-start',x.out(),false);
  x.drive({Restart:true});e('held manual Restart cannot enable',x.out(),false);
  x.drive({Restart:false});e('native pair/master polarity governs fresh Restart',x.out(),expected);
 });
}
scenario('inactive master ignores independently activated slave own field',e=>{const x=component(modes.none,{slaveMode:'Single-Channel Both Activated'});x.drive({Restart:true,EStopIn1:false,EStopIn2:false});x.drive({Restart:false});e('master inactive means neither safety channel participates',x.out(),true);});
scenario('first-only ignores unbound inactive second channel',e=>{const x=component(modes.first,{unbound:['EStopIn2']});x.drive({Restart:true,EStopIn1:true});x.drive({Restart:false});e('first-only positive without dummy second source',x.out(),true);});
scenario('second-only ignores unbound inactive first channel',e=>{const x=component(modes.second,{unbound:['EStopIn1']});x.drive({Restart:true,EStopIn2:true});x.drive({Restart:false});e('second-only positive without dummy first source',x.out(),true);});
for(const [name,mode,unbound]of [['both active slave missing',modes.both,['EStopIn2']],['first active master missing',modes.first,['EStopIn1']],['second active slave missing',modes.second,['EStopIn2']],['generic AND enum unsupported','Activated',[]],['unknown pair enum unsupported','Unexpected Native Mode',[]],['two-channel discrepancy lifecycle unsupported','Two-Channel',[]]])scenario(name,e=>{
 let error=null;try{const x=component(mode,{unbound});x.drive({Restart:true,EStopIn1:true,EStopIn2:true});}catch(caught){error=caught;}
 e('unsupported/unbound effective active pair must reject before Boolean fallback',Boolean(error),true);
 if(error)e('failure states the native support/binding reason',/active|bound|connect|source|unsupported|channel|mode/i.test(error.message),true);
});
scenario('actual WINDOW master is exact first-only; remaining metadata is genuinely unbound',e=>{
 const first=window.inputs.find(p=>p.name==='EStopIn1');e('actual serialized master mode',first.channelInterface,modes.first);
 e('actual sole safety source',first.sources,['//RndPhysicalCompact/GATE_002/AndOut']);e('actual Restart source',window.inputs.find(p=>p.name==='Restart').sources,['//RndPhysicalCompact/GATE_007/AndOut']);
 e('actual configured delay remains250',window.parameters.find(p=>p.timing).timing,'250');
 for(const p of window.inputs.filter(p=>/^EStopIn[2-8]$|^EDM/.test(p.name))){e(`${p.name} no direct source`,p.sources,[]);e(`${p.name} no global source`,p.globals,[]);e(`${p.name} no alias source`,model.variables.some(v=>v.targetPorts.includes(p.path)),false);}
});
scenario('actual WINDOW Both-mode mutation plus unbound slave is rejected, not treated as first-only',e=>{
 const mutated=structuredClone(window);mutated.inputs.find(p=>p.name==='EStopIn1').channelInterface=modes.both;
 let error=null;try{const r=new SalRuntime({...model,networks:[{blocks:[mutated]}]},{scanMs:1,unconnectedInput:false});r.values.set('//RndPhysicalCompact/GATE_002/AndOut',true);r.values.set('//RndPhysicalCompact/GATE_007/AndOut',true);r.scan();}catch(caught){error=caught;}
 e('actual helper effective active unbound channel is rejected',Boolean(error),true);
});
scenario('intended first-only helper control uses existing off and Restart sources with no added slave',e=>{
 const w=structuredClone(window);w.inputs.find(p=>p.name==='EStopIn1').channelInterface=modes.first;
 const r=new SalRuntime({...model,networks:[{blocks:[w]}]},{scanMs:1,unconnectedInput:false});r.values.set('//RndPhysicalCompact/GATE_002/AndOut',true);r.values.set('//RndPhysicalCompact/GATE_007/AndOut',true);r.scan();
 e('internal Restart high alone does not enable',r.get(w.path+'/EStopOut'),false);r.values.set('//RndPhysicalCompact/GATE_007/AndOut',false);r.scan();
 e('first-only helper manual preparation positive',r.get(w.path+'/EStopOut'),true);
});
function actualMain(){
 const producer=all.find(b=>b.path==='//Network1/FBAnd1');
 const r=new SalRuntime({...model,networks:[{blocks:[producer,main]}]},{scanMs:1,unconnectedInput:false});
 r.setInputs({in_ES_NC_1:true,in_ES_NC_2:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,in_Reset_PB:false});
 r.scan().scan();return r;
}
const enabled=r=>r.get('b_EStop_Ok');
function manual(r){r.setInputs({in_Reset_PB:true}).scan();r.setInputs({in_Reset_PB:false}).scan();}
for(const [input,bad]of [['in_ES_NC_2',false],['in_Mentee_EStop',true]])scenario(`actual main ${input} single-sample fault/recovery requires new manual Restart`,e=>{
 const r=actualMain();e('healthy alone stays disabled',enabled(r),false);manual(r);e('paired healthy actual source positive',enabled(r),true);
 r.setInputs({[input]:bad}).scan();e('effective slave fault drops main output in current scan',enabled(r),false);
 r.setInputs({[input]:!bad}).scan();e('raw restoration cannot undo fault memory',enabled(r),false);
 r.runFor(10);e('restored raw inputs still require manual Restart',enabled(r),false);manual(r);e('fresh actual manual Restart positive',enabled(r),true);
});
for(const [input,bad]of [['in_ES_NC_2',false],['in_Mentee_EStop',true]])scenario(`actual main ${input} bad input and held Restart at entry`,e=>{
 const r=actualMain();r.setInputs({[input]:bad,in_Reset_PB:true}).scan().runFor(10);e('held Restart never enables',enabled(r),false);
 r.setInputs({in_Reset_PB:false}).scan();e('Restart falling while slave fault present cannot enable',enabled(r),false);
 r.setInputs({[input]:!bad}).scan();e('raw healthy restoration alone cannot enable',enabled(r),false);manual(r);e('new healthy manual restart succeeds',enabled(r),true);
});
scenario('actual PLC producer95/main ESTOP21 first-fault latency is preserved',e=>{
 const r=actualMain();manual(r);e('actual main healthy positive',enabled(r),true);r.setInputs({in_Estop_PLC:true}).scan();e('first PLC fault sample retains already computed producer',enabled(r),true);
 r.setInputs({in_Estop_PLC:false}).scan();e('next sample sees prior PLC fault producer and drops',enabled(r),false);r.scan();e('raw PLC restoration does not auto-restart',enabled(r),false);manual(r);e('new manual restart restores',enabled(r),true);
});
for(const [name,port]of [['in_ES_NC_2','EStopIn2'],['in_Mentee_EStop','EStopIn4']])scenario(`shared closure demands actual main slave ${name} despite own inactive field`,e=>{
 const x=physicalRndSource(model,1),path=`//Network1/FBEstop1/${port}`,alias=model.variables.find(v=>v.name===name);
 e('actual typed slave binding exists before any cut',alias.targetPorts.includes(path),true);
 e('effective slave is part of demanded command inputs',x.scope.demandedInputs.includes(path),true);
 e('explicit input boundary retains actual alias ID and consumer',x.scope.boundaries.some(b=>b.name===name&&b.id===alias.id&&b.consumer===path),true);
});
for(const [name,port]of [['in_ES_NC_2','EStopIn2'],['in_Mentee_EStop','EStopIn4']])scenario(`missing main effective slave binding ${name} fails before first execution`,e=>{
 const mutated=({...model,networks:structuredClone(model.networks),variables:structuredClone(model.variables)}),alias=mutated.variables.find(v=>v.name===name),path=`//Network1/FBEstop1/${port}`;
 alias.targetPorts=alias.targetPorts.filter(p=>p!==path); // Explicit in-memory missing-source seam after original full-source audit.
 const scan=SalRuntime.prototype.scan;let scans=0,error=null;SalRuntime.prototype.scan=function(...args){scans++;return scan.apply(this,args);};
 try{physicalRndSource(mutated,1);}catch(caught){error=caught;}finally{SalRuntime.prototype.scan=scan;}
 e('closure rejects missing effective active source before any scan',scans,0);e('missing-source failure is explicit',Boolean(error),true);
});
scenario('closure already rejects a missing helper master source as a paired negative control',e=>{
 const mutated=({...model,networks:structuredClone(model.networks),variables:structuredClone(model.variables)}),w=mutated.networks.flatMap(n=>n.blocks).find(b=>b.path===window.path);w.inputs.find(p=>p.name==='EStopIn1').sources=[];
 let error=null;try{physicalRndSource(mutated,1);}catch(caught){error=caught;}e('missing master demanded source is rejected',Boolean(error),true);
});
