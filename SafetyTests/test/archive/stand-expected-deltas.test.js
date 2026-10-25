// E2-R1-stand-2 (lead decision 2): MISSING cases/tests and NOT APPLICABLE cases need an
// APPROVED expected-deltas file of the source SAL; a DRAFT or a file bound to other
// baselines explains nothing. NEW/CHANGED stay report-only.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DEFAULT_CASE_BASELINE, DEFAULT_TEST_BASELINE, loadCaseBaseline, loadTestBaseline, diffCaseIds, diffStageTests,
  loadExpectedDeltas, reconcileDeltas, formatDeltaReconciliation, EXPECTED_DELTAS_DIR } from "../../src/case-id-diff.js";

const cb = loadCaseBaseline(DEFAULT_CASE_BASELINE), tb = loadTestBaseline(DEFAULT_TEST_BASELINE);
const SHA = "a".repeat(64);
const cases = cb.cases.filter(c => c.id !== "TIMER://Network5/FBTon1")
  .map(c => c.id === "PRIORITY:Step2:NC1:fallback=false" ? { ...c, status: "NOT APPLICABLE" } : c)
  .concat([{ id: "NEW:x", status: "PASS" }]);
const gone = tb.stages.harness.find(t => t.name.startsWith("OBS-TON //Network5/FBTon1 fixed1")).name;
const stages = ["harness", "historical", "current"].map(name => ({ name, tests: tb.stages[name].filter(t => t.name !== gone) }));
const diffs = () => ({ caseIdDiff: diffCaseIds(cb, cases), stageTestDiff: diffStageTests(tb, stages), cases });
const file = (approval, extra = {}) => ({ version: "expected-deltas-v1", source: { salSha256: SHA },
  baseline: { casesFileSha256: cb.fileSha256, testsFileSha256: tb.fileSha256 }, approval,
  cases: [{ kind: "case-missing", id: "TIMER://Network5/FBTon1", reason: "removed" },
    { kind: "case-not-applicable", id: "PRIORITY:Step2:NC1:fallback=false", reason: "removed phase" }],
  tests: { harness: [{ name: gone, reason: "removed timer" }] }, ...extra });
function write(obj) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "exp-deltas-")), f = path.join(dir, "d.json");
  fs.writeFileSync(f, JSON.stringify(obj)); return f;
}

test("D2: without an expected-deltas file every MISSING / NOT APPLICABLE is UNEXPLAINED; NEW/CHANGED are not deltas", () => {
  const rec = reconcileDeltas({ ...diffs(), expected: null });
  assert.equal(rec.ok, false);
  assert.deepEqual(rec.items.map(i => [i.kind, i.id, i.explanation]), [
    ["case-missing", "TIMER://Network5/FBTon1", "UNEXPLAINED"],
    ["case-not-applicable", "PRIORITY:Step2:NC1:fallback=false", "UNEXPLAINED"],
    ["test-missing", gone, "UNEXPLAINED"]]);
  assert.equal(loadExpectedDeltas(SHA), null, "no file for an unknown SAL");
});

test("D2: a DRAFT explains nothing for the exit; an APPROVED file bound to this SAL and baselines does", () => {
  const draft = reconcileDeltas({ ...diffs(), expected: loadExpectedDeltas(SHA, write(file({ status: "DRAFT" }))) });
  assert.equal(draft.ok, false);
  assert.ok(draft.items.every(i => i.explanation === "DRAFT-ONLY (not approved)"));
  const noBy = reconcileDeltas({ ...diffs(), expected: loadExpectedDeltas(SHA, write(file({ status: "APPROVED" }))) });
  assert.equal(noBy.ok, false, "APPROVED without approver is not an approval");
  const ok = reconcileDeltas({ ...diffs(), expected: loadExpectedDeltas(SHA, write(file({ status: "APPROVED", by: "lead", date: "2026-10-21" }))) });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.counts, { deltas: 3, explained: 3, unexplained: 0, stale: 0 });
  assert.ok(formatDeltaReconciliation(ok).some(l => l.startsWith("- EXPLAINED case-missing TIMER://Network5/FBTon1: removed")));
});

test("D2: binding — other SAL throws, other baseline ignores the file, empty reason throws, stale is reported", () => {
  assert.throws(() => loadExpectedDeltas("b".repeat(64), write(file({ status: "APPROVED", by: "lead" }))), /is for SAL a{64}, run is b{64}/);
  assert.throws(() => loadExpectedDeltas(SHA, write(file({ status: "APPROVED", by: "lead" }, { cases: [{ kind: "case-missing", id: "X", reason: " " }] }))), /non-empty reason/);
  const other = file({ status: "APPROVED", by: "lead" }, { baseline: { casesFileSha256: "0", testsFileSha256: tb.fileSha256 } });
  const mism = reconcileDeltas({ ...diffs(), expected: loadExpectedDeltas(SHA, write(other)) });
  assert.equal(mism.baselineMismatch, true); assert.equal(mism.ok, false);
  const extra = file({ status: "APPROVED", by: "lead" });
  extra.cases.push({ kind: "case-missing", id: "TIMER://Network5/FBTon9", reason: "expected" });
  extra.tests.harness.push({ name: gone, reason: "second copy", count: 1 });
  const st = reconcileDeltas({ ...diffs(), expected: loadExpectedDeltas(SHA, write(extra)) });
  assert.equal(st.ok, true);
  assert.deepEqual(st.stale, [{ kind: "case-missing", id: "TIMER://Network5/FBTon9" }, { kind: "test-missing", stage: "harness", id: gone }]);
});

// Approval states are pinned to the lead's records (2026-10-21): F1 approved (D1 stand
// self-test rename only), R1 not approved. Change only together with a new lead record.
// 2026-10-22: +6 RUN-CONF (G1 v5 §3, m-10) and +16 EARLYSTO (G1 v6 §2, D1) current renames;
// 2026-10-22: +3 V2ID moves (G1 v7 §3, D-v7).
test("D2: committed expected-deltas load, are bound to the pinned baselines; F1 approved by lead, R1 still DRAFT", () => {
  for (const [sha, status] of [["04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3", "APPROVED"], ["ca841a01fe44f776a5868968fde70cce728657aaf411d6b8bfa6689cfadc7bb3", "DRAFT"]]) {
    const d = loadExpectedDeltas(sha);
    assert.ok(d, `${EXPECTED_DELTAS_DIR}${sha}.json`);
    assert.equal(d.baseline.casesFileSha256, cb.fileSha256);
    assert.equal(d.baseline.testsFileSha256, tb.fileSha256);
    assert.equal(d.approval.status, status);
  }
  const f1 = loadExpectedDeltas("04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3");
  assert.equal(f1.approval.by, "lead (main session)");
  assert.deepEqual([f1.cases.length, f1.tests.harness.length, f1.tests.historical.length, f1.tests.current.length], [0, 1, 0, 33]);
  // m-10 (lead, 2026-10-22): the six current entries are exactly the RUN-CONF renames listed in
  // section m-8 of the tester handoff (approved after reviewer G1 v5 §3), in that order, each a
  // real name of the pinned current baseline; statusChanges is not part of schema v1.
  const md = fs.readFileSync(new URL("../program/tester/E2-G1/HANDOFF_v5.md", import.meta.url), "utf8");
  const m8 = md.slice(md.indexOf("## m-8")).match(/```json\n(\[[\s\S]*?\])\n```/);
  assert.ok(m8, "m-8 JSON fragment present in HANDOFF_v5.md");
  const listed = JSON.parse(m8[1]);
  assert.equal(listed.length, 6);
  assert.deepEqual(f1.tests.current.slice(0, 6).map(e => e.name), listed.map(e => e.name));
  // D1 (lead, 2026-10-22, reviewer G1 v6 §2): the next sixteen are the EARLYSTO renames of the
  // HANDOFF_v6 expected-deltas fragment, expanded from its template over first ∈ {green, blue},
  // h ∈ {false, true}, dt ∈ {1, 2, 5, 10} - exact names, each pass on the pinned F1 baseline.
  const md6 = fs.readFileSync(new URL("../program/tester/E2-G1/HANDOFF_v6.md", import.meta.url), "utf8");
  const fr = md6.slice(md6.indexOf("## Фрагмент для expected-deltas F1")).match(/```json\r?\n(\[[\s\S]*?\])\r?\n```/);
  assert.ok(fr, "expected-deltas fragment present in HANDOFF_v6.md");
  const tmpl = JSON.parse(fr[1]);
  assert.equal(tmpl.length, 1);
  assert.equal(tmpl[0].name, "EARLYSTO physical <first>/HVHealthy<h> early N+2 fixed<dt>");
  const expanded = [];
  for (const first of ["green", "blue"]) for (const h of ["false", "true"]) for (const dt of [1, 2, 5, 10])
    expanded.push(tmpl[0].name.replace("<first>", first).replace("<h>", h).replace("<dt>", String(dt)));
  const early = f1.tests.current.slice(6, 22);
  assert.equal(early.length, 16);
  assert.deepEqual(early.map(e => e.name).sort(), expanded.sort());
  for (const e of early) {
    assert.equal(tb.stages.current.find(t => t.name === e.name)?.status, "pass", `pass on pinned F1 baseline: ${e.name}`);
    assert.ok(e.reason.includes("DIS-HOLD-HV") && e.reason.includes("73"), e.name);
  }
  // D-v7 (lead, 2026-10-22, reviewer G1 v7 §3): the last three are the V2ID moves of the
  // HANDOFF_v7 expected-deltas fragment, verbatim (name, reason, proposedBy) and in that order,
  // each pass on the pinned F1 baseline and each naming its V2ID destination.
  const md7 = fs.readFileSync(new URL("../program/tester/E2-G1/HANDOFF_v7.md", import.meta.url), "utf8");
  const fr7 = md7.slice(md7.indexOf("фрагмент expected-deltas F1")).match(/```json\r?\n(\[[\s\S]*?\])\r?\n```/);
  assert.ok(fr7, "expected-deltas fragment present in HANDOFF_v7.md");
  const moves = JSON.parse(fr7[1]);
  assert.deepEqual(moves.map(e => e.name), [
    "B1 V2 physical aliases and required wires preserved through exact logical consumer delta",
    "B1 LV254 SGVL declarations and all source indices unchanged through exact composed target delta",
    "PLC V2 native producer96, preserved contacts and exact whole graph fanout",
  ]);
  assert.deepEqual(f1.tests.current.slice(22, 25), moves);
  for (const e of moves) {
    assert.equal(tb.stages.current.find(t => t.name === e.name)?.status, "pass", `pass on pinned F1 baseline: ${e.name}`);
    assert.ok(e.reason.includes("current-v2-identity.test.js") && e.reason.includes("V2ID moved from"), e.name);
    assert.ok(e.reason.includes(`"${e.name.replace(/^B1 /, "")}"`), `reason names the moved test: ${e.name}`);
  }
  // D-v8 (lead, 2026-10-22, reviewer G1 v8 §2): the last eight are the TD-08/TD-09/N17 renames of the
  // HANDOFF_v8 expected-deltas fragment, verbatim (name, reason, proposedBy) and in that order.
  const md8 = fs.readFileSync(new URL("../program/tester/E2-G1/HANDOFF_v8.md", import.meta.url), "utf8");
  const fr8 = md8.slice(md8.indexOf("фрагмент expected-deltas F1")).match(/```json\r?\n(\[[\s\S]*?\])\r?\n```/);
  assert.ok(fr8, "expected-deltas fragment present in HANDOFF_v8.md");
  const renames8 = JSON.parse(fr8[1]);
  assert.equal(renames8.length, 8);
  assert.deepEqual(f1.tests.current.slice(25), renames8);
  for (const e of f1.tests.current) {
    assert.ok(tb.stages.current.some(t => t.name === e.name), `in pinned current baseline: ${e.name}`);
    assert.ok(e.reason.trim() && e.proposedBy, e.name);
  }
  assert.equal(f1.statusChanges, undefined);
});
