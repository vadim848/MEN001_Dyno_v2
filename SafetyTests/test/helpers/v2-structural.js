// Reviewed composition: original0fc→59bf accepted baseline controls + exact59bf→P0 native delta (on frozen fixtures/resumed-p0-canonical)
// + exact P0→F1 native delta against the frozen F1 plan (stand checker scripts/f1-delta-check.mjs, output to os.tmpdir).
// now is the fresh ACTUAL source under test. No candidate source/parsed graph is masked or substituted.
//
// S2 identity split (tester, 2026-10-21): this module NO LONGER asserts source identity at load time, so behavioural
// tests of the importing files execute on any source (canonical F1, SAL mutants in the stand sandbox, candidates
// via E2_SOURCE_ROOT). All former load-time identity assertions (fixture SHAs, canonical F1 SAL/SGVL SHA, 59bf→P0
// proof check-source-pair.mjs, P0→F1 proof scripts/f1-delta-check.mjs) live in test/current-v2-identity.test.js.
// The structural wrappers below (orders/wires/.../addedNative) remain F1-identity-bound STRUCTURAL checks: each call
// asserts the source under test is exactly canonical F1 and its parsed model is unmodified; they are called only from
// structural tests (names outside the pilot behavioural allowlist) and from the identity test.
// E2_SOURCE_ROOT (same semantics as helpers/e2-lifecycle.js A7): root containing MEN001_Dyno/Safety_Dyno.
import * as baseline from './p0-accepted-baseline-controls.js';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
import {parseSalFile} from '../../src/sal-parser.js';
export const sourceRoot=process.env.E2_SOURCE_ROOT?pathToFileURL(path.resolve(process.env.E2_SOURCE_ROOT)+'/'):new URL('../../../',import.meta.url);
export const projectUrl=new URL('MEN001_Dyno/Safety_Dyno/',sourceRoot);
export const salUrl=new URL('TwinSafeGroup1/TwinSafeGroup1.sal',projectUrl),gvlUrl=new URL('GVLs/GVL1.sgvl',projectUrl),diagramUrl=new URL('TwinSafeGroup1/TwinSafeGroup1.sal.diagram',projectUrl);
export const F1_SHA256=Object.freeze({sal:'04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3',sgvl:'dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104'});
export const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sal=salUrl,gvl=gvlUrl;
/** Explicit fail-closed binding audit for the source under test. On canonical (and in the stand sandbox) this is
 *  identical to parseSalFile's "auto" mode (same SAL path, same SGVL); for E2_SOURCE_ROOT it keeps the audit on. */
export const parseOptions=Object.freeze({bindingMode:'current',sgvlPath:gvl});
export const now=parseSalFile(sal,{bindingMode:'current',sgvlPath:gvl});
const digest=()=>crypto.createHash('sha256').update(JSON.stringify(now)).digest('hex'),verifiedParsedDigest=digest();
/** Structural F1 identity pin (former load-time + per-call assertion). Throws AssertionError on any non-F1 source. */
export function actualCandidate(){assert.equal(sha(sal),F1_SHA256.sal,'F1 identity pin (structural): SAL is not canonical F1');assert.equal(sha(gvl),F1_SHA256.sgvl,'F1 identity pin (structural): SGVL is not canonical F1');assert.equal(digest(),verifiedParsedDigest,'Actual candidate model mutation must be rejected');}
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
