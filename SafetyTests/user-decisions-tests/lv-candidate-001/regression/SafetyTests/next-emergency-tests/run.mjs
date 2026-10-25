import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createEmergencyFixture} from './fixture.mjs';
const base=new URL('./',import.meta.url),off={in_Reset_PB:false,in_Relase_Door_PB:false},both={in_Reset_PB:true,in_Relase_Door_PB:true};
const domains={LV:{out:'lv',aggregate:'lvProposal',gate:'lvPermittedSet',rs:'//Network1/FBRs1'},HV:{out:'hv',aggregate:'hvProposal',gate:'hvPermittedSet',rs:'//Network1/FBRs2'},STO1:{out:'sto1',aggregate:'sto1Proposal',gate:'sto1PermittedSet',rs:'//Network1/FBRs3'},STO2:{out:'sto2',aggregate:'sto2Proposal',gate:'sto2PermittedSet',rs:'//Network1/FBRs4'}};
const faults=[['NC2','in_ES_NC_2',false],['Mentee','in_Mentee_EStop',true]],rows=[];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const ids=Object.fromEntries(['fixture.mjs','../src/sal-runtime.js','../src/sal-parser.js','../src/sal-binding-validator.js','../src/estop-native-pairs.js','../src/observed-samples.js','run.mjs'].map(name=>[name,hash(fs.readFileSync(new URL(name,base)))]));
function wait(x,p,label,budget=2200){const end=x.clock.timeMs+budget;while(!p()&&x.clock.timeMs<end)x.sample();if(!p())throw Error('Fixture unavailable: '+label+' (technical observation budget, not normative timeout)');}
function rnd(x){x.sample(both);wait(x,()=>x.get('lv'),'actual Safe LV');x.sample({in_LV_C1_FBK:true});wait(x,()=>x.get('b_Step_RnD'),'actual RnD');x.sample(off);x.advance(2100);assert.equal(x.get('SU'),false);}
function preparedAccess(mode){const x=createEmergencyFixture();if(mode==='RnD')rnd(x);x.sample({in_Relase_Door_PB:true});wait(x,()=>x.get('unlock'),'actual blue/grant/final Unlock');assert.equal(x.get('estop'),true);return x;}
function pending(route,domain){const x=createEmergencyFixture(route==='Step2'?{initialPhase:'b_Step2',prepareNeutralMs:0}:{});
 if(route==='RnD')rnd(x);if(route!=='Step2')x.sample(both);
 const d=domains[domain];wait(x,()=>x.get(d.aggregate)&&!x.get(d.out),'pending '+route+'/'+domain);
 if(route==='RnD')assert.equal(x.get('SU'),true,'Actual accepted physical RnD owner');
 if(route==='Step2')assert.equal(x.get('down'),false,'Original-start has no accepted RnD down request; retired-owner migration checked structurally');
 assert.equal(x.get('estop'),true);return x;
}
function save(name,x,metadata,status,error){
 assert.deepEqual(x.unbound(),[],'No unresolved demanded inputs');
 for(let n=1;n<x.frames.length;n++)assert.equal(x.frames[n].timeMs-x.frames[n-1].timeMs,1,'Observer records every fixed scan');
 const evidence={name,status,metadata,error,scope:x.scope,identities:ids,ledger:x.ledger(),protocolWrites:x.protocolWrites,frames:x.frames,blockEvents:x.blockEvents};
 const raw=Buffer.from(JSON.stringify(evidence)),gz=gzipSync(raw);const filename=name+'.json.gz';fs.writeFileSync(new URL(filename,base),gz);
 return{evidence:filename,rawSha256:hash(raw),compressedSha256:hash(gz),compressedBytes:gz.length,rawBytes:raw.length,scans:x.frames.length,sourceSha256:x.scope.sourceSha256,sgvlSha256:x.scope.sgvlSha256};
}
function run(name,prepare,body,metadata){let x,ready=false;try{x=prepare();ready=true;body(x);const identity=save(name,x,metadata,'PASS');rows.push({name,status:'PASS',metadata,...identity});}catch(e){const status=ready?'FAIL':'FIXTURE ERROR';let identity;if(x)identity=save(name,x,metadata,status,String(e.stack));rows.push({name,status,error:String(e.stack),metadata,...identity});}console.log(name,rows.at(-1).status);}
for(const mode of ['Safe','RnD']){
 run(`A1-${mode}-healthy`,()=>preparedAccess(mode),x=>{x.advance(220);assert.equal(x.get('unlock'),true);},{requirements:['EMG001','EMG005','EMG007','CVR001','CVR002'],control:true,mode});
 for(const [fault,input,bad]of faults)for(const hold of [1,10])run(`A1-${mode}-${fault}-${hold}scan`,()=>preparedAccess(mode),x=>{
  const t=x.sample({[input]:bad});x.advance(hold-1);x.sample({[input]:!bad});x.advance(200);
  const faultFrames=x.frames.filter(f=>f.timeMs>=t);assert.equal(faultFrames.every(f=>!f.signals.estop&&!f.signals.unlock),true,'First fault and restoration without Restart suppress final access');
  assert.equal(faultFrames.every(f=>f.raw.in_Reset_PB===false&&f.raw.in_Relase_Door_PB===true),true,'Blue held; no green/manual Restart');
 },{requirements:['EMG001','EMG005','EMG007','CVR001','CVR002'],mode,input,bad,hold,control:`A1-${mode}-healthy`});
}
for(const [route,domain]of [['Safe','LV'],['RnD','HV'],['RnD','STO1'],['RnD','STO2'],['Step2','LV'],['Step2','HV']]){
 const d=domains[domain],control=`A2-${route}-${domain}-healthy`;
 run(control,()=>pending(route,domain),x=>{const t=x.sample(off);wait(x,()=>x.get(d.out),'healthy actual consumption',20);const event=x.blockEvents.find(f=>f.timeMs>=t&&f.block===d.rs&&f.inputs.Set);assert.ok(event,'Real native RS Set consumed');assert.equal(x.get(d.out),true);},{requirements:['EMG001','EMG005','EMG011'],route,domain,control:true});
 for(const [fault,input,bad]of faults)for(const hold of [1,10])run(`A2-${route}-${domain}-${fault}-${hold}scan`,()=>pending(route,domain),x=>{
  const initial=Object.fromEntries(Object.values(domains).map(k=>[k.out,x.get(k.out)]));
  // Release both on the first fault sample. Green is FALSE while still faulted,
  // including a one-sample pulse; raw restoration cannot arm Restart on release.
  const t=x.sample({...off,[input]:bad});x.advance(hold-1);x.sample({[input]:!bad});x.advance(200);
  const frames=x.frames.filter(f=>f.timeMs>=t);
  assert.equal(frames.every(f=>!f.signals.estop),true,'Raw restoration cannot undo actual EStop memory');
  assert.equal(frames.every(f=>!f.raw.in_Reset_PB),true,'No hidden manual Restart after fault');
  assert.equal(frames.some(f=>Object.values(domains).some(k=>f.signals[k.gate])),false,'All four real current Set guards inhibit');
  assert.equal(frames.some(f=>Object.values(domains).some(k=>!initial[k.out]&&f.signals[k.out])),false,'No new output/torque-permission rise; retained preexisting outputs are separate');
  assert.equal(x.blockEvents.filter(f=>f.timeMs>=t&&Object.values(domains).some(k=>k.rs===f.block)).some(f=>f.inputs.Set),false,'Actual RS native Set input stays false');
 },{requirements:['EMG001','EMG005','EMG011'],route,domain,input,bad,hold,control});
}
const report={status:rows.every(r=>r.status==='PASS')?'PASS':'FAIL',phase:'Independent bounded A1/A2 execution; acceptance requires reviewer',identities:ids,counts:Object.fromEntries(['PASS','FAIL','FIXTURE ERROR'].map(s=>[s,rows.filter(r=>r.status===s).length])),rows,limits:['No A3 external-interlock test','No emergency completion/destination oracle','ActualN3 producers with declared initial component and seven inactiveN4 cuts','No native/hardware/BOOT validation']};
fs.writeFileSync(new URL('RESULTS.json',base),JSON.stringify(report,null,2));console.log(report.counts);process.exitCode=report.status==='PASS'?0:1;
