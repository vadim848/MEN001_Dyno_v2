import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root=process.env.MEN001_F1_ROOT?pathToFileURL(path.resolve(process.env.MEN001_F1_ROOT)+'/'):new URL('../../../../../',import.meta.url);
const {createSafeRunFixture,compressFrames}=await import('./run-source.js');
const {inspectNativeSalStructure}=await import('../../../../src/sal-native-structure.js');
const sal=new URL('MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',root),sgvl=new URL('MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',root);
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const native=inspectNativeSalStructure(fs.readFileSync(sal,'utf8'));if(native.status!=='PASS')throw Error(JSON.stringify(native));
const down=['runPhysical','runResetSto1','runResetSto2','runDischarge','runResetHv'];
const forbidden=[...down,'safeUp','safeTransition','safeBlue','rndBlue','unlock'];
const off={in_Reset_PB:false,in_Relase_Door_PB:false},both={in_Reset_PB:true,in_Relase_Door_PB:true};
const single=key=>key==='green'?{in_Reset_PB:true}:{in_Relase_Door_PB:true};
const rows=[];
function scenario(id,body){let x;const checks=[],marks={};const e=(label,actual,expected)=>checks.push({label,actual,expected});try{
 x=createSafeRunFixture('Run');body(x,e,marks);e('zero unresolved demanded inputs',x.unbound(),[]);
 const violated=checks.filter(c=>JSON.stringify(c.actual)!==JSON.stringify(c.expected));
 rows.push({id,status:violated.length?'FAIL':'PASS',marks,checks,firstViolations:violated,scope:x.scope,rises:x.rises,frameSpans:compressFrames(x.frames)});
 }catch(error){rows.push({id,status:'ERROR',error:error.stack,checks,marks,scope:x?.scope});}console.log(id,rows.at(-1).status);}
const any=(x,from,keys=forbidden)=>x.frames.some(f=>f.timeMs>=from&&keys.some(k=>f.signals[k]));
function freshGreen(x,e,marks){x.sample(off);x.advance(2100);marks.fresh=x.sample({in_Reset_PB:true});x.advance(499);e('freshgreen no down before500',any(x,marks.fresh,down),false);x.sample();x.advance(4);e('freshgreen qualified physical down availability',x.get('runPhysical'),true);}
for(const first of ['green','blue'])for(const delta of [0,250,251,300])for(const remain of ['green','blue'])scenario(`Run-BOTH-${first}-delta${delta}-retain${remain}`,(x,e,m)=>{
 m.first=x.sample(delta===0?both:single(first));m.second=delta===0?m.first:x.edgeAfter(m.first,delta,both);
 x.advance(1100);e('BOTH or invalid late attempt creates no command',any(x,m.first),false);
 m.release=x.sample(remain==='green'?{in_Relase_Door_PB:false}:{in_Reset_PB:false});x.advance(700);
 e('same attempt cannot degrade to single',any(x,m.first),false);freshGreen(x,e,m);
});
for(const first of ['green','blue'])scenario(`Run-short-BOTH-${first}-retain-green`,(x,e,m)=>{
 m.first=x.sample(single(first));m.second=x.edgeAfter(m.first,100,both);x.advance(100);m.release=x.sample({in_Relase_Door_PB:false});x.advance(1200);
 e('failed chord cannot become green500',any(x,m.first),false);freshGreen(x,e,m);
});
for(const first of ['green','blue'])scenario(`Run-single-${first}-minimum500-and-one-attempt`,(x,e,m)=>{
 m.first=x.sample(single(first));x.advance(499);e('no command before500',any(x,m.first),false);x.sample();x.advance(4);
 e('green accepted or blueignored by mode',x.get('runPhysical'),first==='green');x.advance(1100);
 e('at most one physicaldown rise during held single',x.rises.runPhysical,first==='green'?1:0);
 if(first==='blue')e('Armedblue never unlock',any(x,m.first,['safeBlue','rndBlue','unlock']),false);
});
const report={sourceSha256:hash(sal),sgvlSha256:hash(sgvl),native,oracle:'Latest Vadim confirmations1–11 / USER_DECISIONS_2026_10_20_HANDOFF RunBOTHignore. No implementation-derived expectations.',counts:Object.fromEntries(['PASS','FAIL','ERROR'].map(s=>[s,rows.filter(c=>c.status===s).length])),cases:rows,limits:['Actual SAL command cone; explicit Network3 Step3 owner boundary. Not full Run reachability or stopping completion.','Freshgreen tests assert physical command availability only, not legacy simultaneous fanout as normative stopping sequence.']};
fs.writeFileSync(process.env.MEN001_F1_RUN_OUTPUT??new URL('run-gesture-red-results.json',import.meta.url),JSON.stringify(report)+'\n');
console.log('TOTAL',JSON.stringify(report.counts));process.exitCode=report.counts.ERROR?3:report.counts.FAIL?1:0;
