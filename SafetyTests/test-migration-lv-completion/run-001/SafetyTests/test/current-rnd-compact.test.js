import * as V2 from './helpers/v2-structural.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {parseSalFile} from '../src/sal-parser.js';
import {readBindingXml} from '../src/sal-binding-validator.js';
import {compact,removeCompactGvl,afterEarlyStoOrder} from './helpers/compact-expectations.js';
const sf=new URL('../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url);
const model=parseSalFile(sf),all=model.networks.flatMap(n=>n.blocks),get=path=>all.find(b=>b.path===path);
const gvl=fs.readFileSync(new URL('../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',import.meta.url),'utf8');
const walk=n=>[n,...n.children.flatMap(walk)];
test("RNDCOMPACT V2 exact255 order manifest and native primitive templates",()=>{
 // Approved baseline+explicit v2 delta; no source masking.
 V2.orders(); V2.ports();


});
test("RNDCOMPACT V2 retained native ports and eight approved primitive additions",()=>{
 // Approved baseline+explicit v2 delta; no source masking.
 V2.ports();


});
test("RNDCOMPACT V2 exact canonical graph delta and retained early STO integration",()=>{
 // Approved baseline+explicit v2 delta; no source masking.
 V2.wires(); V2.early();


});
test("RNDCOMPACT V2 sole Safe TON3 retirement; all retained timer values and identities exact",()=>{
 // Approved baseline+explicit v2 delta; no source masking.
 V2.timers();


});
test("RNDCOMPACT V2 all SGVL declarations and source indices exact; only eleven target changes",()=>{
 // Approved baseline+explicit v2 delta; no source masking.
 V2.sgvl();


});
