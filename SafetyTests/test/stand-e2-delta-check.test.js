// Stand self-test of scripts/e2-delta-check.mjs (D2, reviewer G1 v7): the exact delta proof must PASS on the
// pinned planned pair E2a-core (5648e31c) -> E2a-RC (5733552a) with the pinned PLAN v7.2 (5198d426), and must FAIL
// for every injected deviation of the candidate (contact, alias, SGVL usage, wire, order, PLC consumer) and of the
// plan (missing item, uninterpretable item, wrong stated count). Fixtures: fixtures/stand-e2-delta/ (README).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadSal, sha256 } from '../src/native-delta-model.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fx = path.join(root, 'fixtures', 'stand-e2-delta');
const BASE = path.join(fx, 'E2a-core-5648e31c'), CAND = path.join(fx, 'E2a-RC-5733552a'), PLAN = path.join(fx, 'PLAN.v7.2-5198d426.json');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'stand-e2-delta-'));
let n = 0;

function run({ plan = PLAN, base = BASE, cand = CAND } = {}) {
  const out = path.join(tmp, `r${n++}.json`);
  const r = spawnSync(process.execPath, ['scripts/e2-delta-check.mjs', '--plan', plan, '--out', out, '--pair', 'E2a-RC', base, cand], { cwd: root, encoding: 'utf8' });
  const rep = JSON.parse(fs.readFileSync(out, 'utf8'));
  return { code: r.status, rep, pair: rep.pairs[0], failed: rep.pairs[0].checks.filter(c => c.status === 'FAIL').map(c => c.group) };
}
function mutant(name, file, edit) {
  const dir = path.join(tmp, name); fs.mkdirSync(dir);
  for (const f of fs.readdirSync(CAND)) fs.copyFileSync(path.join(CAND, f), path.join(dir, f));
  const p = path.join(dir, file), before = fs.readFileSync(p, 'utf8'), after = edit(before);
  assert.notEqual(after, before, `${name}: mutation applied`);
  fs.writeFileSync(p, after); return dir;
}
function planMutant(name, edit) { const p = JSON.parse(fs.readFileSync(PLAN, 'utf8')); edit(p); const f = path.join(tmp, name + '.json'); fs.writeFileSync(f, JSON.stringify(p)); return f; }
const once = (text, from, to) => { const parts = text.split(from); assert.equal(parts.length, 2, `exactly one occurrence of ${from}`); return parts.join(to); };
const cand = loadSal(CAND);
const portId = p => cand.portByPath.get(p).attr.Id;

test('D2/E2-delta: pinned fixtures are the planned sources', () => {
  assert.equal(sha256(path.join(BASE, 'TwinSafeGroup1.sal')), '5648e31cec9fea6d82ed2392a4be21a26c599eb4872969f5adab2ef3b87fd40b');
  assert.equal(sha256(path.join(CAND, 'TwinSafeGroup1.sal')), '5733552a150bfd33df4211da8f97a8fc993ff990ad52c90a8d7758d950660f3f');
  assert.equal(sha256(PLAN), '5198d426fb1e2ea3e983bb3694cc7a4b8a98ea938ab9947fc649dd125852f5c3');
});

test('D2/E2-delta: E2a-core -> E2a-RC on PLAN v7.2 is PASS with every plan item applied; variables 75 with 2 SGVL Symbols deleted', () => {
  const r = run();
  assert.equal(r.code, 0, JSON.stringify(r.pair.failed));
  assert.equal(r.pair.status, 'PASS');
  assert.ok(r.pair.planItems.length >= 14 && r.pair.planItems.every(i => i.status === 'APPLIED'));
  assert.deepEqual([r.pair.counts.candidate.salVars, r.pair.counts.candidate.sgvlSymbols, r.pair.counts.base.sgvlSymbols, r.pair.counts.candidate.fb, r.pair.counts.candidate.ports], [75, 63, 65, 217, 1836]);
  for (const g of ['aliases', 'wires', 'sgvl', 'plc', 'counts', 'ledger', 'order', 'identity', 'diagram']) assert.ok(r.pair.checks.some(c => c.group === g && c.status === 'PASS'), g);
  // the usage ledger names its explanation for every difference
  assert.ok(r.pair.ledger.length > 0 && r.pair.ledger.every(l => l.explainedBy));
  assert.ok(r.pair.ledger.some(l => l.t === 'sgvl-removed' && l.name === 'b_Reset_HV_Discharg_Req2' && /Symbol deletion/.test(l.explainedBy)));
});

const candidateMutants = [
  ['contact flipped on an untouched input', 'TwinSafeGroup1.sal', t => t.replace(new RegExp(`(<inPort Id="${portId('//Network7/FBAnd8/AndIn5')}"[^>]*deactivate1=")Break Contact \\(NC\\)`), '$1Make Contact (NO)'), ['ports', 'ledger']],
  ['physical alias channel changed', 'TwinSafeGroup1.sal', t => once(t, 'sdsId="62" channelId="1" functionId="1610678529"', 'sdsId="62" channelId="2" functionId="1610678529"'), ['aliases']],
  ['SGVL consumer usage dropped', 'GVL1.sgvl', t => { const v = t.indexOf('<Name>b_EStop_Ok</Name>'); const s = t.indexOf('<TargetUsages>', v), u = t.indexOf('<FbPortUsage', s), e = t.indexOf('</FbPortUsage>', u) + '</FbPortUsage>'.length; return t.slice(0, u) + t.slice(e); }, ['sgvl', 'ledger']],
  ['wire retargeted', 'TwinSafeGroup1.sal', t => once(t, '<inPortMoniker name="//Network12/FBDecouple2/DecIn4" />', '<inPortMoniker name="//Network12/FBDecouple2/DecIn3" />'), ['wires']],
  ['two retained blocks swapped in execution order', 'TwinSafeGroup1.sal', t => { const a = cand.blockByPath.get('//Network7/FBAnd8').attr, b = [...cand.blocks.values()].find(x => +x.attr.orderOfExecution === +a.orderOfExecution + 1).attr;
    return t.replace(`Id="${a.Id}"`, '@@A').replace(`Id="${b.Id}"`, '@@B').replace(/@@A([^>]*?)orderOfExecution="\d+"/, `Id="${a.Id}"$1orderOfExecution="${b.orderOfExecution}"`).replace(/@@B([^>]*?)orderOfExecution="\d+"/, `Id="${b.Id}"$1orderOfExecution="${a.orderOfExecution}"`); }, ['order']],
  ['PLC consumer moved to another input', 'TwinSafeGroup1.sal', t => { const v = [...cand.variables.values()].find(x => x.name === 'inPLC_RnD_Mode'), u = v.use.target.find(x => x.kind === 'port'); const i = t.indexOf(`Id="${u.usageId}"`), j = t.indexOf(`name="${u.port}"`, i);
    const other = cand.blockByPath.get(cand.portByPath.get(u.port).blockPath).ports.find(p => p.kind === 'inPort' && p.path !== u.port && p.attr.channelInterface === 'Deactivated').path;
    return t.slice(0, j) + `name="${other}"` + t.slice(j + `name="${u.port}"`.length); }, ['plc', 'symbols']],
];
for (const [name, file, edit, groups] of candidateMutants) test(`D2/E2-delta: candidate mutant "${name}" is FAIL`, () => {
  const r = run({ cand: mutant(name.replace(/\W+/g, '-'), file, edit) });
  assert.equal(r.code, 1); assert.equal(r.pair.status, 'FAIL');
  for (const g of groups) assert.ok(r.failed.includes(g), `${name}: FAIL in group ${g}; failed groups ${r.failed}`);
});

const planMutants = [
  ['planned SGVL deletion missing from the plan', p => { const s = p.slices.find(x => x.id === 'E2a-RC'); s.disHold.changes = s.disHold.changes.filter(c => !/^delete SGVL Symbols/.test(c)); }, ['sgvl', 'ledger']],
  ['planned window wire missing from the plan', p => { const s = p.slices.find(x => x.id === 'E2a-RC'); s.changes = s.changes.filter(c => !/WIN_C1 \(/.test(c)); }, ['wires']],
  ['uninterpretable plan item', p => { p.slices.find(x => x.id === 'E2a-RC').changes.push('frobnicate Network1/FBAnd1 somehow'); }, ['plan']],
  ['plan states 64 SGVL Symbols / 74 variables', p => { const s = p.slices.find(x => x.id === 'E2a-RC'); s.sgvlAfter = 64; s.salVarsAfter = 74; }, ['counts']],
];
for (const [name, edit, groups] of planMutants) test(`D2/E2-delta: plan mutant "${name}" is FAIL`, () => {
  const r = run({ plan: planMutant(name.replace(/\W+/g, '-'), edit) });
  assert.equal(r.code, 1); assert.equal(r.pair.status, 'FAIL');
  for (const g of groups) assert.ok(r.failed.includes(g), `${name}: FAIL in group ${g}; failed groups ${r.failed}`);
});

// Declared candidate SHAs (lead 2026-10-22, PLAN v7.4.1): read only from plan.source - e2aRcCandidate and the
// unambiguous map source.candidates.{slice}; never from addendum*.candidates.
const RC_SHA = '5733552a150bfd33df4211da8f97a8fc993ff990ad52c90a8d7758d950660f3f', WRONG = 'f'.repeat(64);
const inputsCheck = r => r.pair.checks.filter(c => c.group === 'inputs' && /candidate/.test(c.name));
test('D2/E2-delta: source.e2aRcCandidate is read - candidate SHA check PASS instead of NV, wrong SHA FAIL', () => {
  const ok = run({ plan: planMutant('rc-sha', p => { p.source.e2aRcCandidate = `candidates/E2a-RC/native SAL ${RC_SHA}`; }) });
  assert.equal(ok.code, 0); assert.deepEqual(inputsCheck(ok).map(c => c.status), ['PASS']); assert.ok(!ok.pair.nv.some(n => /inputs/.test(n)));
  const bad = run({ plan: planMutant('rc-sha-wrong', p => { p.source.e2aRcCandidate = `candidates/E2a-RC/native SAL ${WRONG}`; }) });
  assert.equal(bad.code, 1); assert.ok(bad.failed.includes('inputs'));
});
test('D2/E2-delta: source.candidates.{slice} is read; addendum*.candidates is ignored; conflicting declarations are refused', () => {
  const viaMap = run({ plan: planMutant('cand-map', p => { p.source.candidates = { 'E2a-RC': WRONG }; }) });
  assert.equal(viaMap.code, 1); assert.ok(viaMap.failed.includes('inputs'));
  const viaAddendum = run({ plan: planMutant('cand-addendum', p => { p.addendum99 = { candidates: { 'E2a-RC': WRONG } }; }) });
  assert.equal(viaAddendum.code, 0); assert.deepEqual(inputsCheck(viaAddendum).map(c => c.status), ['NV']);
  const both = spawnSync(process.execPath, ['scripts/e2-delta-check.mjs', '--plan', planMutant('cand-conflict', p => { p.source.e2aRcCandidate = RC_SHA; p.source.candidates = { 'E2a-RC': WRONG }; }), '--out', path.join(tmp, 'conflict.json'), '--pair', 'E2a-RC', BASE, CAND], { cwd: root, encoding: 'utf8' });
  assert.equal(both.status, 64);
  const unknown = spawnSync(process.execPath, ['scripts/e2-delta-check.mjs', '--plan', planMutant('cand-unknown', p => { p.source.candidates = { E9: RC_SHA }; }), '--out', path.join(tmp, 'unknown.json'), '--pair', 'E2a-RC', BASE, CAND], { cwd: root, encoding: 'utf8' });
  assert.equal(unknown.status, 64);
});

test('D2/E2-delta: the tool refuses to write into role-owned evidence folders', () => {
  const r = spawnSync(process.execPath, ['scripts/e2-delta-check.mjs', '--plan', PLAN, '--out', path.join(root, 'program', 'tester', 'x.json'), '--pair', 'E2a-RC', BASE, CAND], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 64);
});
