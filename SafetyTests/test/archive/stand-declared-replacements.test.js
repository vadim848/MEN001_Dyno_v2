// E2a-rename stand slice, item 5 (A4-3): STATE cases replaced by E2-01/02/03 on R1/E2a are
// declared in the source's expected-deltas file. Only an APPROVED declaration bound to the
// same baselines turns them into NOT APPLICABLE; the executed verdict is retained; a DRAFT
// changes nothing.
import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CASE_BASELINE, DEFAULT_TEST_BASELINE, loadCaseBaseline, loadTestBaseline, diffCaseIds, diffStageTests,
  reconcileDeltas, applyDeclaredReplacements, formatDeclaredReplacements, loadExpectedDeltas } from "../../src/case-id-diff.js";

const cb = loadCaseBaseline(DEFAULT_CASE_BASELINE), tb = loadTestBaseline(DEFAULT_TEST_BASELINE);
const bound = { casesFileSha256: cb.fileSha256, testsFileSha256: tb.fileSha256 };
const STATE4 = ["STATE:Safe-RnD-Run", "STATE:Run-RnD", "STATE:Emergency-removal", "STATE:conflicting-set-requests"];
const executed = () => cb.cases.map(c => c.id === "STATE:Run-RnD" ? { ...c, status: "FAIL", firstViolation: { signal: "x", expected: true, actual: false } } :
  c.id === "STATE:Emergency-removal" ? { ...c, status: "ERROR", error: "INJECTION_POINT_MISSING" } : { ...c });
const decl = (approval, extra = {}) => ({ file: "mem.json", approval, baseline: { ...bound }, tests: {}, ...extra,
  cases: STATE4.map(id => ({ kind: "case-not-applicable", id, reason: "replaced", replacedBy: ["E2-01", "E2-02", "E2-03"], decision: "A4-3" })) });

test("A4-3: a DRAFT declaration changes no status; it is reported as proposed", () => {
  const cases = executed(), before = JSON.stringify(cases);
  const r = applyDeclaredReplacements(cases, decl({ status: "DRAFT" }), bound);
  assert.equal(JSON.stringify(cases), before);
  assert.deepEqual(r.applied, []);
  assert.deepEqual(r.proposed.map(p => [p.id, p.executedStatus]), STATE4.map(id => [id, cases.find(c => c.id === id).status]));
  assert.ok(formatDeclaredReplacements(r).some(l => l.startsWith("- PROPOSED STATE:Run-RnD: stays FAIL")));
  const rec = reconcileDeltas({ caseIdDiff: diffCaseIds(cb, cases), stageTestDiff: diffStageTests(tb, ["harness", "historical", "current"].map(name => ({ name, tests: tb.stages[name] }))), cases, expected: decl({ status: "DRAFT" }) });
  assert.deepEqual(rec.stale, [], "a generated, not-yet-applied replacement is listed as proposed, not as a stale expectation");
});

test("A4-3: an APPROVED declaration yields NOT APPLICABLE with the executed verdict retained and is EXPLAINED", () => {
  const cases = executed();
  const expected = decl({ status: "APPROVED", by: "lead", date: "2026-10-22" });
  const r = applyDeclaredReplacements(cases, expected, bound);
  assert.deepEqual(r.applied.map(a => a.id), STATE4);
  const run = cases.find(c => c.id === "STATE:Run-RnD");
  assert.equal(run.status, "NOT APPLICABLE");
  assert.deepEqual(run.executed, { status: "FAIL", firstViolation: { signal: "x", expected: true, actual: false } });
  assert.match(run.reason, /^Replaced by E2-01, E2-02, E2-03 \(A4-3\)/);
  assert.equal(cases.find(c => c.id === "STATE:Emergency-removal").executed.error, "INJECTION_POINT_MISSING");
  assert.ok(!cases.some(c => c.status === "NOT APPLICABLE" && !STATE4.includes(c.id)), "nothing else touched");
  const rec = reconcileDeltas({ caseIdDiff: diffCaseIds(cb, cases), stageTestDiff: diffStageTests(tb, ["harness", "historical", "current"].map(name => ({ name, tests: tb.stages[name] }))), cases, expected });
  assert.deepEqual(rec.items.map(i => [i.id, i.explanation]), STATE4.map(id => [id, "EXPLAINED"]));
  assert.equal(rec.ok, true);
});

test("A4-3: baseline mismatch ignores the declaration; malformed declarations throw; absent cases are listed", () => {
  const cases = executed(), before = JSON.stringify(cases);
  const mism = applyDeclaredReplacements(cases, decl({ status: "APPROVED", by: "lead" }, { baseline: { casesFileSha256: "0", testsFileSha256: tb.fileSha256 } }), bound);
  assert.equal(mism.baselineMismatch, true); assert.equal(JSON.stringify(cases), before);
  const bad = decl({ status: "APPROVED", by: "lead" }); bad.cases[0].replacedBy = [];
  assert.throws(() => applyDeclaredReplacements(executed(), bad, bound), /replacedBy must be a non-empty list/);
  const noDec = decl({ status: "APPROVED", by: "lead" }); delete noDec.cases[1].decision;
  assert.throws(() => applyDeclaredReplacements(executed(), noDec, bound), /needs the replacing decision/);
  const r = applyDeclaredReplacements(executed().filter(c => c.id !== "STATE:Run-RnD"), decl({ status: "APPROVED", by: "lead" }), bound);
  assert.deepEqual(r.absent, ["STATE:Run-RnD"]);
  assert.deepEqual(applyDeclaredReplacements(executed(), null, bound).applied, []);
});

// Lead 2026-10-22: on R1 STATE:Run-RnD executes PASS and is NOT replaced (3 entries); E2a replaces all 4.
// Both stay DRAFT until G3/G4 of the slice after test migration.
test("A4-3: committed drafts declare the STATE replacements (R1: 3 without Run-RnD, E2a: 4) and stay DRAFT", () => {
  for (const [sha, ids] of [["ca841a01fe44f776a5868968fde70cce728657aaf411d6b8bfa6689cfadc7bb3", STATE4.filter(id => id !== "STATE:Run-RnD")],
    ["5648e31cec9fea6d82ed2392a4be21a26c599eb4872969f5adab2ef3b87fd40b", STATE4]]) {
    const d = loadExpectedDeltas(sha);
    assert.ok(d, sha);
    assert.equal(d.approval.status, "DRAFT", sha);
    const rep = d.cases.filter(c => c.replacedBy);
    assert.deepEqual(rep.map(c => c.id).sort(), [...ids].sort(), sha);
    for (const c of rep) { assert.equal(c.kind, "case-not-applicable"); assert.deepEqual(c.replacedBy, ["E2-01", "E2-02", "E2-03"]); assert.match(c.decision, /A4-3/); }
  }
});
