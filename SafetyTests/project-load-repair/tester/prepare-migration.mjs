import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../../..'),src=path.join(root,'SafetyTests');
const proposal=path.join(import.meta.dirname,'proposal');fs.mkdirSync(proposal,{recursive:true});
const plan=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'../architect/MINIMAL_LOAD_REPAIR_PLAN.json')));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const candidate=fs.readFileSync(path.join(import.meta.dirname,'../editor/candidate/TwinSafeGroup1.sal'));
assert.equal(hash(candidate),'ffd6c64e567131cb4fd5c4dd58816e0e5e8bb4f60777142d7959d9cc591ef0d1');
const manifest=JSON.parse(fs.readFileSync(path.join(src,'BOOT_PREFLIGHT_SOURCE_MANIFEST.json')));
const originalManifest=structuredClone(manifest);let count=0;
for(const r of plan.exactRemovals){const ports=manifest.inventory.blocks.flatMap(b=>b.inputs).filter(p=>p.attributes.Id===r.portId);assert.equal(ports.length,1);assert.equal(ports[0].attributes[r.attribute],r.value);delete ports[0].attributes[r.attribute];count++;}
assert.equal(count,143);
manifest.acceptedCheckpoint='Project-load serialization-only143-attribute candidate ffd6c64e; preserves LV254 checkpoint e5baabd behavior. Zero functional BOOT acceptance. Independent native opening remains separate.';
manifest.rawLocalEvidenceSha256.sal=hash(candidate);manifest.normalizedSha256.sal=hash(candidate.toString('utf8').replaceAll('\r\n','\n'));
fs.writeFileSync(path.join(proposal,'BOOT_PREFLIGHT_SOURCE_MANIFEST.json'),JSON.stringify(manifest)+'\n');
// Only retained expected port metadata is modified; actual now graph is never masked.
let helper=fs.readFileSync(path.join(src,'test/helpers/v2-structural.js'),'utf8');
assert.equal(helper.split('b7096fa3cf7349ea0be08f347180deb071a0f6b75612c4e5c8a7f45cf0557161').length,2);
helper=helper.replace('b7096fa3cf7349ea0be08f347180deb071a0f6b75612c4e5c8a7f45cf0557161',hash(candidate));
const insertion="const loadRepair=JSON.parse(fs.readFileSync(new URL('PROJECT_LOAD_REPAIR_LAYER.json',root)));assert.equal(loadRepair.exactRemovals.length,143);let retainedRemovalChecks=0;function repairExpected(p){for(const r of loadRepair.exactRemovals.filter(r=>r.portId===p.Id)){assert.equal(p[r.attribute],r.value,p.Id+'/'+r.attribute+' exact expected old value');delete p[r.attribute];retainedRemovalChecks++;}return p;}\n";
helper=helper.replace('export function ports(){',insertion+'export function ports(){');
assert.equal(helper.split('assert.deepEqual(strip(q),expected,p.path);').length,2);
helper=helper.replace('assert.deepEqual(strip(q),expected,p.path);','assert.deepEqual(strip(q),repairExpected(expected),p.path);');
// Count only retained baseline ports (new25 ports are covered by exact full-file proof).
helper=helper.replace('export function ports(){addedNative();','export function ports(){retainedRemovalChecks=0;addedNative();');
helper=helper.replace("}}}const nodes=p=>walk(readBindingXml", "}}}assert.equal(retainedRemovalChecks,118,'all retained expected-only attribute removals');const nodes=p=>walk(readBindingXml");
fs.writeFileSync(path.join(proposal,'v2-structural.js'),helper);
fs.writeFileSync(path.join(proposal,'PROJECT_LOAD_REPAIR_LAYER.json'),JSON.stringify(plan)+'\n');
fs.writeFileSync(path.join(proposal,'MIGRATION.json'),JSON.stringify({sourceHelperSha256:hash(fs.readFileSync(path.join(src,'test/helpers/v2-structural.js'))),proposalHelperSha256:hash(helper),sourceManifestSha256:hash(fs.readFileSync(path.join(src,'BOOT_PREFLIGHT_SOURCE_MANIFEST.json'))),proposalManifestSha256:hash(JSON.stringify(manifest)+'\n'),manifestAttributeRemovals:count,retainedExpectedAttributeRemovals:118,newPortRemovalsCoveredByFullFileExactDelta:25,originalManifestProvenance:originalManifest.acceptedCheckpoint},null,2)+'\n');
console.log('Proposal prepared; not applied.');
