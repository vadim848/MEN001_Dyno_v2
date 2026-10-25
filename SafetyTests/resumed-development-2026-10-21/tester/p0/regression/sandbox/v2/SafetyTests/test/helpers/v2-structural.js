// Reviewed composition: original0fc→59bf accepted baseline controls + exact59bf→P0 native delta.
// now is the fresh ACTUAL candidate. No candidate source/parsed graph is masked or substituted.
import * as baseline from './p0-accepted-baseline-controls.js';
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {parseSalFile} from '../../src/sal-parser.js';
const sal=new URL('../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url),gvl=new URL('../../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',import.meta.url),f=new URL('../../fixtures/p0-repaired-baseline/',import.meta.url);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(sha(sal),'34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b');assert.equal(sha(gvl),'517fdadd913007aa2690f1402676583ad16141c9ae64cb986554c87c10f22635');
const proof=spawnSync(process.execPath,["C:\\Users\\user\\source\\repos\\MEN001_Dyno_v2\\SafetyTests\\resumed-development-2026-10-21\\tester\\p0\\check-source-pair.mjs",...['TwinSafeGroup1.sal','GVL1.sgvl'].map(x=>fileURLToPath(new URL(x,f))),fileURLToPath(sal),fileURLToPath(gvl),fileURLToPath(new URL('TwinSafeGroup1.sal.diagram',f)),fileURLToPath(new URL('../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal.diagram',import.meta.url))],{encoding:'utf8'});
assert.equal(proof.status,0,'Exact candidate P0 native delta proof: '+proof.stdout+proof.stderr);
export const now=parseSalFile(sal,{bindingMode:'current',sgvlPath:gvl});
const digest=()=>crypto.createHash('sha256').update(JSON.stringify(now)).digest('hex'),verifiedParsedDigest=digest();
function actualCandidate(){assert.equal(sha(sal),'34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b');assert.equal(sha(gvl),'517fdadd913007aa2690f1402676583ad16141c9ae64cb986554c87c10f22635');assert.equal(digest(),verifiedParsedDigest,'Actual candidate model mutation must be rejected');}
export const baselineXml=baseline.baselineXml,baselineGvl=baseline.baselineGvl;
export function orders(...args){actualCandidate();return baseline.orders(...args);}
export function wires(...args){actualCandidate();return baseline.wires(...args);}
export function aliases(...args){actualCandidate();return baseline.aliases(...args);}
export function sgvl(...args){actualCandidate();return baseline.sgvl(...args);}
export function ports(...args){actualCandidate();return baseline.ports(...args);}
export function timers(...args){actualCandidate();return baseline.timers(...args);}
export function early(...args){actualCandidate();return baseline.early(...args);}
export function energy(...args){actualCandidate();return baseline.energy(...args);}
export function final(...args){actualCandidate();return baseline.final(...args);}
export function plc(...args){actualCandidate();return baseline.plc(...args);}
export function door(...args){actualCandidate();return baseline.door(...args);}
export function addedNative(...args){actualCandidate();return baseline.addedNative(...args);}
