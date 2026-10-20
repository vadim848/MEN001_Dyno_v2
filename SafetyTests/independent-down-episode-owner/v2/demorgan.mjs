import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseSalFile} from './sandbox/SafetyTests/src/sal-parser.js';
import {SalRuntime} from './sandbox/SafetyTests/src/sal-runtime.js';
import {ObservedSamples} from './sandbox/SafetyTests/src/observed-samples.js';
const root=new URL('./',import.meta.url),R='//RndPhysicalCompact/';
function fixture(source){
 const b=new URL('fixtures/'+source+'/MEN001_Dyno/Safety_Dyno/',root),m=parseSalFile(new URL('TwinSafeGroup1/TwinSafeGroup1.sal',b),{bindingMode:'current',sgvlPath:new URL('GVLs/GVL1.sgvl',b)});
 assert.equal(m.bindingAudit.status,'PASS');const all=m.networks.flatMap(n=>n.blocks),selected=all.filter(b=>['GREEN','BLUE','GATE_019','GATE_023'].some(n=>b.path===R+n));
 const gate=selected.find(b=>b.path===R+'GATE_023'),tons=selected.filter(b=>b.functionName==='safeTon');
 if(source==='candidate')assert.equal(all.flatMap(b=>[...b.inputs,...b.outputs]).some(p=>[p.path,...p.sources,...p.targets].some(x=>x.includes('/GATE_019/'))),false,'No retired G19 port/wire remains in audited source');
 assert.ok(tons.every(b=>b.orderOfExecution<gate.orderOfExecution));
 const r=new SalRuntime({...m,networks:m.networks.map(n=>({...n,blocks:n.blocks.filter(b=>selected.includes(b))})).filter(n=>n.blocks.length)},{scanMs:1,unconnectedInput:false});
 const targets=new Map(m.variables.flatMap(v=>v.targetPorts.map(p=>[p,v.name])));
 const setBoundary=(p,value)=>{if(p.sources.length){for(const s of p.sources)r.values.set(s,value);}else if(p.globals.length)r.setInputs({[p.globals[0].resolvedName]:value});else if(targets.has(p.path))r.setInputs({[targets.get(p.path)]:value});else throw Error('Unbound boundary '+p.path);};
 // Other G23 native conjuncts are typed TRUE component preconditions. Only
 // retired OR criterion and its two TON replacements are compared here.
 const excluded=new Set([R+'GREEN/TonOut',R+'BLUE/TonOut',R+'GATE_019/OrOut']);
 for(const p of gate.inputs.filter(p=>p.channelInterface==='Activated'))if(!p.sources.some(s=>excluded.has(s)))setBoundary(p,p.deactivate1!=='Make Contact (NO)');
 const clock=new ObservedSamples(r,1),frames=[];
 return{sample(green,blue){for(const ton of tons)setBoundary(ton.inputs[0],ton.path.endsWith('/GREEN')?green:blue);clock.sample();const f={timeMs:clock.timeMs,green:r.get(R+'GREEN/TonOut'),blue:r.get(R+'BLUE/TonOut'),out:r.get(R+'GATE_023/AndOut')};frames.push(f);return f;},frames,ledger:{source,blocks:selected.map(b=>({path:b.path,order:b.orderOfExecution})),gateInputs:gate.inputs.filter(p=>p.channelInterface==='Activated'),boundary:'Only actual TON input producer outputs and other G23 conjuncts are typed component boundaries, not source assertions about reachability'}};
}
const old=fixture('prior'),now=fixture('candidate'),observed=new Set();
// Exact fixed-scan chronology includes qualification at500, independent TON
// resets and requalification; compare every scan, not just boolean algebra.
for(const [green,blue,duration]of [[false,false,2],[true,false,502],[false,false,2],[false,true,502],[true,true,502],[true,false,2],[false,false,2]])for(let n=0;n<duration;n++){
 const a=old.sample(green,blue),b=now.sample(green,blue);assert.deepEqual(b,a,'Actual native TON/G23 chronology must match');observed.add(Number(b.green)+','+Number(b.blue));assert.equal(b.out,!(b.green||b.blue));
}
assert.equal(observed.size,4,'All four TON output combinations observed');
fs.writeFileSync(new URL('demorgan-results.json',root),JSON.stringify({status:'PASS',observed:[...observed],old:old.ledger,current:now.ledger,frames:now.frames,limits:['Pure native source subgraph with explicit producer boundaries','Not full recognizer/state reachability']},null,2));console.log('PASS actual TON/G23 per-scan equivalence, all4combinations, noG19refs');
