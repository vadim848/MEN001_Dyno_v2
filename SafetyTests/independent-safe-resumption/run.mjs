// Read-only candidate execution. Writes evidence only beside this script.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parseSalFile} from '../src/sal-parser.js';
const base=new URL('./',import.meta.url);
const candidate=new URL('../candidates/safe-resumption/',base);
const sal=new URL('TwinSafeGroup1.sal',candidate),sgvl=new URL('GVL1.sgvl',candidate);
const helper=new URL('sandbox/SafetyTests/test/helpers/safe-run-source.js',base);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const expected=process.argv.slice(2);
if(expected.length!==3||expected.some(x=>! /^[a-f0-9]{64}$/.test(x)))throw Error('Usage: node run.mjs frozenSALsha frozenSGVLsha frozenHELPERsha');
const files=[sal,sgvl,helper],actual=files.map(hash);
assert.deepEqual(actual,expected,'Candidate/helper identity differs from editor freeze');
const model=parseSalFile(sal,{bindingMode:'current',sgvlPath:sgvl});
assert.equal(model.bindingAudit.status,'PASS');
assert.equal(model.networks.flatMap(n=>n.blocks).length,255,'Revised255 required');
const {createSafeRunFixture}=await import(helper.href);
const results=[];
const off={in_Reset_PB:false,in_Relase_Door_PB:false};
const blue='in_Relase_Door_PB',green='in_Reset_PB';
const energy=['safeUp','safeTransition'];
const all=[...energy,'safeBlue','rndBlue','unlock'];
const has=(x,keys,start,end=Infinity)=>x.frames.some(f=>f.timeMs>=start&&f.timeMs<end&&keys.some(k=>f.signals[k]));
function run(name,body){let x;try{x=createSafeRunFixture('Safe',{scanMs:1});body(x);assert.deepEqual(x.unbound(),[]);results.push({name,status:'PASS',scope:x.scope,frames:x.frames,q500Internal:x.q500Internal,ledger:x.ledger()});}catch(e){results.push({name,status:x?'FAIL':'INFRASTRUCTURE ERROR',error:String(e.stack),scope:x?.scope,frames:x?.frames,q500Internal:x?.q500Internal,ledger:x?.ledger()});}}
run('blue499 interrupted; fresh blue500 positive',x=>{
 let t=x.sample({[blue]:true});x.advance(499);assert.equal(has(x,all,t),false);
 x.sample(off);x.advance(2100);t=x.sample({[blue]:true});x.advance(499);assert.equal(has(x,all,t),false);
 x.advance(30);assert.equal(x.get('unlock'),true);
});
for(const first of [blue,green])for(const delta of [249,250,251])run(`Safe ${first} second at ${delta}`,x=>{
 const second=first===blue?green:blue,t=x.sample({[first]:true});
 const t2=x.edgeAfter(t,delta,{[second]:true});x.advance(999);
 assert.equal(has(x,all,t,t2+1000),false,'No single/Unlock or early BOTH from attempt');
 x.advance(40);
 if(delta<=250)assert.equal(has(x,energy,t2+1000),true,'Healthy valid chord must launch');
 else assert.equal(has(x,all,t),false,'Late second cannot legalize by holding');
});
for(const first of [blue,green])run(`Single500 priority ${first}`,x=>{
 const t=x.sample({[first]:true}),second=first===blue?green:blue;
 x.edgeAfter(t,500,{[second]:true});
 const qualifier=first===blue?'BLUE':'GREEN';
 const internal={qualifier:x.r.get(`//RndPhysicalCompact/${qualifier}/TonOut`),consumed:x.r.get('//RndPhysicalCompact/STATE_C/RsOut'),chord:x.r.get('//RndPhysicalCompact/STATE_T/RsOut')};
 x.q500Internal={timeMs:x.clock.timeMs,...internal};
 assert.deepEqual(internal,{qualifier:true,consumed:true,chord:false},'At500 single qualification/consumption wins without chord conversion');
 x.advance(1100);
 assert.equal(has(x,energy,t),false,'Single attempt cannot retroactively become chord');
 assert.equal(x.get('unlock'),false,'Green suppresses held Unlock');
});
for(const [input,value]of [['in_ES_NC_1',false],['in_ES_NC_2',false],['in_InterLock_NC_1',false],['in_InterLock_NC_2',false],['in_Estop_PLC',true],['in_Mentee_EStop',true]])run(`Safe blue veto ${input}`,x=>{
 const t=x.sample({[blue]:true});x.advance(400);x.sample({[input]:value});x.advance(700);
 assert.equal(has(x,all,t),false,'Fault before qualification must not produce command/grant');
});
assert.deepEqual(files.map(hash),expected,'Candidate mutated during independent run');
const report={date:'2026-10-20',status:results.every(r=>r.status==='PASS')?'PASS':'FAIL',identities:{sal:actual[0],sgvl:actual[1],helper:actual[2]},counts:Object.fromEntries(['PASS','FAIL','INFRASTRUCTURE ERROR'].map(s=>[s,results.filter(r=>r.status===s).length])),limits:['Reviewed shared software runtime; no native execution','Typed phase boundary excludes Network3/4 lifecycle','Additional PLAN.md gaps remain NOT VERIFIED','No full Run BOTH or pending endpoints selected'],results};
fs.writeFileSync(new URL('results.json',base),JSON.stringify(report,null,2));
console.log(JSON.stringify({status:report.status,counts:report.counts}));
process.exitCode=report.status==='PASS'?0:1;
