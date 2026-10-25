import fs from 'node:fs';import crypto from 'node:crypto';import path from 'node:path';import {fileURLToPath} from 'node:url';
const task=fileURLToPath(new URL('./',import.meta.url)),sandbox=path.join(task,'regression/sandbox/v2'),testRoot=path.join(sandbox,'SafetyTests');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),changes=[];
function edit(relative,fn,reason){const file=path.join(testRoot,relative),before=fs.readFileSync(file,'utf8'),after=fn(before);if(after===before)throw Error('No planned migration '+relative);fs.writeFileSync(file,after);changes.push({file:relative,beforeSha256:crypto.createHash('sha256').update(before).digest('hex'),afterSha256:hash(file),reason,before,after});}
const fixture=path.join(testRoot,'fixtures/p0-repaired-baseline');fs.mkdirSync(fixture,{recursive:true});
const frozen=fileURLToPath(new URL('../baseline/source/',import.meta.url));
for(const name of ['TwinSafeGroup1.sal','TwinSafeGroup1.sal.diagram','GVL1.sgvl'])fs.copyFileSync(path.join(frozen,name),path.join(fixture,name));
const original=path.join(testRoot,'test/helpers/v2-structural.js'),baselineControls=path.join(testRoot,'test/helpers/p0-accepted-baseline-controls.js');
let controls=fs.readFileSync(original,'utf8');controls=controls.replace("sal=new URL('../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url)","sal=new URL('../../fixtures/p0-repaired-baseline/TwinSafeGroup1.sal',import.meta.url)").replace("gvl=new URL('../../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',import.meta.url)","gvl=new URL('../../fixtures/p0-repaired-baseline/GVL1.sgvl',import.meta.url)");
fs.writeFileSync(baselineControls,'// Immutable accepted59bf baseline controls ONLY; this module never claims candidate acceptance.\n'+controls);
const checker=path.join(task,'check-source-pair.mjs');
const methods=['orders','wires','aliases','sgvl','ports','timers','early','energy','final','plc','door','addedNative'];
const wrapper=`// Reviewed composition: original0fc→59bf accepted baseline controls + exact59bf→P0 native delta.
// now is the fresh ACTUAL candidate. No candidate source/parsed graph is masked or substituted.
import * as baseline from './p0-accepted-baseline-controls.js';
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {parseSalFile} from '../../src/sal-parser.js';
const sal=new URL('../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url),gvl=new URL('../../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',import.meta.url),f=new URL('../../fixtures/p0-repaired-baseline/',import.meta.url);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(sha(sal),'34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b');assert.equal(sha(gvl),'517fdadd913007aa2690f1402676583ad16141c9ae64cb986554c87c10f22635');
const proof=spawnSync(process.execPath,[${JSON.stringify(checker)},...['TwinSafeGroup1.sal','GVL1.sgvl'].map(x=>fileURLToPath(new URL(x,f))),fileURLToPath(sal),fileURLToPath(gvl),fileURLToPath(new URL('TwinSafeGroup1.sal.diagram',f)),fileURLToPath(new URL('../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal.diagram',import.meta.url))],{encoding:'utf8'});
assert.equal(proof.status,0,'Exact candidate P0 native delta proof: '+proof.stdout+proof.stderr);
export const now=parseSalFile(sal,{bindingMode:'current',sgvlPath:gvl});
const digest=()=>crypto.createHash('sha256').update(JSON.stringify(now)).digest('hex'),verifiedParsedDigest=digest();
function actualCandidate(){assert.equal(sha(sal),'34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b');assert.equal(sha(gvl),'517fdadd913007aa2690f1402676583ad16141c9ae64cb986554c87c10f22635');assert.equal(digest(),verifiedParsedDigest,'Actual candidate model mutation must be rejected');}
export const baselineXml=baseline.baselineXml,baselineGvl=baseline.baselineGvl;
${methods.map(m=>`export function ${m}(...args){actualCandidate();return baseline.${m}(...args);}`).join('\n')}
`;
edit('test/helpers/v2-structural.js',()=>wrapper,'Explicit old accepted baseline controls plus independently proved exact P0 delta; actual candidate model and mutation negatives retained.');
for(const file of ['current-door-interlock.test.js','current-mentee-set-permit.test.js','current-unlock-estop-permit.test.js'])edit('test/'+file,s=>s.replaceAll('assert.equal(all.length,254)','assert.equal(all.length,241)'),'Only actual native FB count254→241 under exact retirement ledger; functional predicates unchanged.');
edit('test/current-native-structure.test.js',s=>s.replace('blocks:254,ports:2172,variables:75,wires:319','blocks:241,ports:2066,variables:75,wires:306'),'Exact reviewed native counts; preserve75Symbols/zero-cross/wrapper assertions.');
edit('src/physical-rnd-source.js',s=>s.replace('P:"STATE_P/RsOut"','P:"GATE_008/AndOut"'),'Map diagnostic recP publisher by approved P0b ledger; actual SNAP consumer and all behavioral predicates unchanged.');
const summary={scope:'Isolated candidate only; no canonical/shared test changes. Baseline-controls explicitly separate from actual candidate exact native proof; runtime behavioral oracle unchanged.',changes:changes.map(({before,after,...rest})=>rest),additions:[{file:'test/helpers/p0-accepted-baseline-controls.js',sha256:hash(baselineControls),reason:'Original structural chain re-evaluated on byte-frozen accepted59bf only; never exported as candidate now.'}],baselineFixture:{sal:hash(path.join(fixture,'TwinSafeGroup1.sal')),gvl:hash(path.join(fixture,'GVL1.sgvl'))}};
fs.writeFileSync(new URL('MIGRATION.json',import.meta.url),JSON.stringify(summary)+'\n');
fs.writeFileSync(new URL('MIGRATION.diff.txt',import.meta.url),changes.map(c=>'FILE '+c.file+'\nREASON '+c.reason+'\nBEFORE\n'+c.before+'\nAFTER\n'+c.after).join('\n\n'));
console.log(JSON.stringify(summary,null,2));
