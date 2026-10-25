// S2 identity split (tester, 2026-10-21). STRUCTURAL source-identity tests, formerly module-load assertions of
// test/helpers/v2-structural.js (lines 9-14 before the split) plus F1-bound structural assertions moved out of
// behavioural files. Every former assertion is kept verbatim (same expected SHA values, same proof tools/arguments).
// Names start with "V2ID " so that none matches a pilot behavioural allowlist pattern; failures here are identity
// (not behaviour) evidence. The source under test is the helper's (canonical F1, or E2_SOURCE_ROOT); on any other
// source these tests are EXPECTED to fail: a candidate needs its own identity/delta proof.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import * as V2 from '../helpers/v2-structural.js';
import {parseSalFile} from '../../src/sal-parser.js';
import {assertNativeSalStructure} from '../../src/sal-native-structure.js';
import {readBindingXml} from '../../src/sal-binding-validator.js';
import {PLANNED_RETIRED_USAGE_IDS} from '../helpers/native-ledger.js';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const f=new URL('../../fixtures/p0-repaired-baseline/',import.meta.url),p0=new URL('../../fixtures/resumed-p0-canonical/',import.meta.url);

test('V2ID frozen resumed-p0-canonical fixture SAL/SGVL/diagram SHA256',()=>{
  assert.equal(sha(new URL('TwinSafeGroup1.sal',p0)),'34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b');
  assert.equal(sha(new URL('GVL1.sgvl',p0)),'517fdadd913007aa2690f1402676583ad16141c9ae64cb986554c87c10f22635');
  assert.equal(sha(new URL('TwinSafeGroup1.sal.diagram',p0)),'7b5eb79439011cdf9a3206aa815dec4349a35cf8155bfac7492b7ffd75e578ce');
});

test('V2ID source under test is canonical F1 SAL/SGVL SHA256',()=>{
  assert.equal(sha(V2.salUrl),'04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3');
  assert.equal(sha(V2.gvlUrl),'dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104');
  assert.deepEqual({...V2.F1_SHA256},{sal:'04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3',sgvl:'dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104'});
});

test('V2ID exact 59bf->P0 native delta proof (check-source-pair.mjs on frozen fixtures)',()=>{
  const proof=spawnSync(process.execPath,[fileURLToPath(new URL('../resumed-development-2026-10-21/tester/p0/check-source-pair.mjs', import.meta.url)),...['TwinSafeGroup1.sal','GVL1.sgvl'].map(x=>fileURLToPath(new URL(x,f))),fileURLToPath(new URL('TwinSafeGroup1.sal',p0)),fileURLToPath(new URL('GVL1.sgvl',p0)),fileURLToPath(new URL('TwinSafeGroup1.sal.diagram',f)),fileURLToPath(new URL('TwinSafeGroup1.sal.diagram',p0))],{encoding:'utf8'});
  assert.equal(proof.status,0,'Exact candidate P0 native delta proof: '+proof.stdout+proof.stderr);
});

test('V2ID exact P0->F1 native delta proof (scripts/f1-delta-check.mjs, frozen F1 plan)',()=>{
  const f1proof=spawnSync(process.execPath,[fileURLToPath(new URL('../../scripts/f1-delta-check.mjs',import.meta.url)),fileURLToPath(p0),fileURLToPath(V2.projectUrl),fileURLToPath(new URL('../resumed-development-2026-10-21/architect/F1_RUN_RECOGNIZER_PLAN.json',import.meta.url))],{encoding:'utf8'});
  assert.equal(f1proof.status,0,'Exact P0->F1 native delta proof: '+f1proof.stdout+f1proof.stderr);
});

test('V2ID F1 parsed model is unmodified and structural wrappers bind accepted controls to F1',()=>{
  V2.actualCandidate();
  V2.orders();V2.wires();V2.aliases();V2.sgvl();V2.ports();V2.timers();V2.early();V2.energy('HV');V2.energy('LV');V2.final();V2.plc();V2.door();
});

test('V2ID F1 block count 242 (moved from DOOR06 exact alias targets)',()=>{
  assert.equal(parseSalFile(V2.salUrl).networks.flatMap(n=>n.blocks).length,242); // same parse as former DOOR06 model
});

test('V2ID moved from DOOR06 preserve unlock consumers: parsed native semantic preservation V2.door()',()=>{
  V2.door();
});

// ---- G1 v7 (lead 2026-10-22, stand expected-deltas-F1-v3 §5): F1-specific pins moved out of behavioural/grammar files (S2 pattern) ----
test('V2ID moved from B1 "V2 physical aliases and required wires preserved through exact logical consumer delta"',()=>{V2.aliases();V2.wires();});
test('V2ID moved from B1 "LV254 SGVL declarations and all source indices unchanged through exact composed target delta"',()=>{V2.sgvl();});
test('V2ID moved from "PLC V2 native producer96, preserved contacts and exact whole graph fanout"',()=>{V2.plc();});
test('V2ID moved from NATIVE: F1 native counts {networks:14, blocks:242, ports:2076, variables:75, wires:307, crossNetworkWires:0}',()=>{
  assert.deepEqual(assertNativeSalStructure(fs.readFileSync(V2.salUrl,'utf8')).counts,{networks:14,blocks:242,ports:2076,variables:75,wires:307,crossNetworkWires:0});});
test('V2ID moved from NATIVE: every preservedUsageId of the 10-singleton ledger present on F1 except the exactly planned P0c/F1 retirements',()=>{
  const src=fs.readFileSync(V2.salUrl,'utf8'),walk=n=>[n,...n.children.flatMap(walk)],ids=new Set(walk(readBindingXml(src)).filter(n=>n.attr?.Id).map(n=>n.attr.Id));
  const layer=JSON.parse(fs.readFileSync(new URL('../NETWORK_SYMBOL_REPAIR_LAYER.json',import.meta.url))).nativeSingletonConsolidation;
  for(const r of layer.ledger)for(const id of r.preservedUsageIds)assert.equal(ids.has(id),!PLANNED_RETIRED_USAGE_IDS.has(id),'preserved or exactly retired planned (P0c/F1) usage '+id+' ('+r.variable+')');});
