import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
const base=new URL('./',import.meta.url),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const results=JSON.parse(fs.readFileSync(new URL('RESULTS.json',base))),cases=[];
for(const row of results.rows){
 assert.equal(row.status,'PASS','Nonpassing case cannot be silently packaged as accepted');
 const gz=fs.readFileSync(new URL(row.evidence,base)),raw=gunzipSync(gz),e=JSON.parse(raw);
 assert.equal(sha(gz),row.compressedSha256);assert.equal(sha(raw),row.rawSha256);assert.equal(raw.length,row.rawBytes);assert.equal(gz.length,row.compressedBytes);assert.equal(e.frames.length,row.scans);
 assert.equal(e.frames[0].timeMs,0,'Observe from very first setup scan');
 assert.deepEqual(e.ledger.unresolvedDemanded,[]);
 assert.equal(e.scope.selected.every(b=>Boolean(b.id)),true,'Every executed block has a real native ID');
 const scope={sourceSha256:e.scope.sourceSha256,sgvlSha256:e.scope.sgvlSha256,sourceAudit:e.scope.sourceAudit,blocks:e.scope.selected.length,scans:e.frames.length,outsideDemandUnconnectedReads:e.ledger.outsideDemandUnconnectedReads.length,excludedDecoupleChannels:e.scope.excludedDecoupleChannels.length,network4BoundaryCount:e.scope.network4Boundary.length};
 let event;
 if(row.metadata.input){
  const {input,bad,hold}=row.metadata,first=e.frames.findIndex(f=>f.raw[input]===bad),restore=e.frames.findIndex((f,i)=>i>first&&f.raw[input]!==bad);
  assert.ok(first>0&&restore>first);assert.equal(restore-first,hold,'Actual observed fault duration matches named span');
  const before=e.frames[first-1],fault=e.frames[first],restored=e.frames[restore];
  event={beforeFault:before.timeMs,firstFault:fault.timeMs,firstRestoration:restored.timeMs,actualFaultScans:restore-first,beforeSignals:before.signals,firstFaultSignals:fault.signals,restoredSignals:restored.signals,firstFaultNativeConsumers:e.blockEvents.filter(x=>x.timeMs===fault.timeMs)};
  if(row.name.startsWith('A1'))assert.equal(e.frames.slice(first).every(f=>f.raw.in_Relase_Door_PB&&!f.raw.in_Reset_PB),true,'A1 blue remains held');
  else assert.equal(e.frames.slice(first).every(f=>!f.raw.in_Reset_PB),true,'A2 releases green while bad and never rearms Restart');
  const control=results.rows.find(c=>c.name===row.metadata.control);assert.equal(control?.status,'PASS','Paired healthy availability control exists');
 }
 cases.push({name:row.name,status:row.status,requirements:row.metadata.requirements.map(id=>id.replace(/^(EMG|CVR)(\d)/,'$1-$2')),recordedRequirementAliases:row.metadata.requirements,scope,event,evidence:row.evidence,rawSha256:row.rawSha256,compressedSha256:row.compressedSha256});
}
for(const [name,hash]of Object.entries(results.identities))assert.equal(sha(fs.readFileSync(new URL(name,base))),hash,'Frozen executed code identity matches '+name);
fs.writeFileSync(new URL('VERIFIED_REPORT.json',base),JSON.stringify({status:'PASS integrity and observer chronology',counts:results.counts,cases,limits:results.limits},null,2));
const files=['PLAN.md','fixture.mjs','run.mjs','inspect-source.mjs','source-inventory.json','RESULTS.json','verify.mjs','VERIFIED_REPORT.json','REPORT.md',...results.rows.map(r=>r.evidence)].filter(name=>fs.existsSync(new URL(name,base)));
fs.writeFileSync(new URL('PACKAGE_IDENTITY.json',base),JSON.stringify({status:'READY for independent result review; no source repair',files:files.map(name=>{const bytes=fs.readFileSync(new URL(name,base));return{path:name,bytes:bytes.length,sha256:sha(bytes)};}),excluded:['diagnostic-001 initial metadata-light run, retained locally'],runtime:results.identities},null,2));
console.log({cases:cases.length,integrity:'PASS',observer:'continuous from sample0',source:cases[0].scope.sourceSha256});
