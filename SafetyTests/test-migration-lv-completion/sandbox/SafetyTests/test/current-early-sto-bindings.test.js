import * as V2 from './helpers/v2-structural.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseSalFile} from '../src/sal-parser.js';
import {readBindingXml,validateSalBindings} from '../src/sal-binding-validator.js';
const source='MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',sgvl='MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl';
const file=new URL('../../'+source,import.meta.url),gvl=fs.readFileSync(new URL('../../'+sgvl,import.meta.url),'utf8'),xml=fs.readFileSync(file,'utf8');
const old=execFileSync('git',['show','2ddafef:'+source],{encoding:'utf8',maxBuffer:4*1024*1024});
const model=parseSalFile(file),all=model.networks.flatMap(n=>n.blocks),get=path=>all.find(b=>b.path===path);
const walk=n=>[n,...n.children.flatMap(walk)],before=walk(readBindingXml(old)),now=walk(readBindingXml(xml));
const manifest=JSON.parse(fs.readFileSync(new URL('../EARLY_STO_NATIVE_MANIFEST.json',import.meta.url)));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
test("EARLYSTO composed LV254 exact manifest,247 historical native survivors, reviewed relative moves and SGVL delta",()=>{
 // Approved baseline+explicit v2 delta; no source masking.
 V2.orders(); V2.timers(); V2.sgvl(); V2.early();


});
test("EARLYSTO composed LV254 critical STO contacts and explicit canonical graph layers",()=>{
 // Approved baseline+explicit v2 delta; no source masking.
 V2.wires(); V2.early();


});
test("EARLYSTO composed LV254 retained native port identities with only approved contact changes",()=>{
 // Approved baseline+explicit v2 delta; no source masking.
 V2.ports(); V2.early();


});
test("EARLYSTO historical deterministic manifest remains exact; LV254 identities source bound separately",()=>{
 // Approved baseline+explicit v2 delta; no source masking.
 V2.ports(); V2.orders();

 const red=JSON.parse(fs.readFileSync(new URL('../EARLY_STO_RED_BASELINE.json',import.meta.url)));
 assert.equal(manifest.sourceSha256,red.sha256[source]);assert.equal(manifest.sourceNormalizedSha256,sha(old.replaceAll('\r\n','\n')));assert.equal(manifest.resultSha256,sha(V2.baselineXml));assert.equal(manifest.sgvlSha256,sha(V2.baselineGvl));
 const ids=[...V2.baselineXml.matchAll(/\bId="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 const oldIds=new Set([...old.matchAll(/\bId="([^"]+)"/g)].map(m=>m[1]));
 const newIds=ids.filter(id=>!oldIds.has(id));assert.deepEqual([...newIds].sort(),Object.values(manifest.ids).sort());
 for(const [key,value] of Object.entries(manifest.ids)){const h=sha(manifest.guidNamespace+key),expected=`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;assert.equal(value,expected);}

});
