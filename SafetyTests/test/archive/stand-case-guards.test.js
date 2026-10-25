// E2-R1 S14/S15 (stand): software-check cases whose injection/observation point is
// absent from the source must be ERROR with a reason (never a silent PASS/FAIL), and
// cases that vanish with a source change must be listed against a pinned baseline.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../../src/sal-parser.js";
import { currentCodeChecks } from "../../src/current-code-checks.js";
import { DEFAULT_CASE_BASELINE, loadCaseBaseline, diffCaseIds, formatCaseIdDiff, DEFAULT_TEST_BASELINE, loadTestBaseline, topLevelTests, diffStageTests, formatStageTestDiff } from "../../src/case-id-diff.js";

// Stand self-test on a pinned F1 copy (SHA-checked), independent of later canonical changes.
const pinned = name => fileURLToPath(new URL(`../fixtures/stand-f1-04b45456/${name}`, import.meta.url));
const sal = pinned("TwinSafeGroup1.sal"), sgvl = pinned("GVL1.sgvl");
const sha = f => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
assert.equal(sha(sal), "04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3");
assert.equal(sha(sgvl), "dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104");
const f1 = () => parseSalFile(sal, { bindingMode: "current", sgvlPath: sgvl });
const name = g => g.resolvedName ?? g.lastKnownPath?.split(".").at(-1);
function without(model, symbol, side) {
  const copy = structuredClone(model);
  for (const n of copy.networks) for (const b of n.blocks) for (const p of b[side]) p.globals = p.globals.filter(g => name(g) !== symbol);
  return copy;
}
const byId = rows => new Map(rows.map(r => [r.id, r]));

test("S14: unread injected Symbol makes STATE cases ERROR with the missing binding", () => {
  const rows = byId(currentCodeChecks(without(f1(), "b_Step1_Set", "inputs")));
  for (const id of ["STATE:Safe-RnD-Run", "STATE:conflicting-set-requests"]) {
    assert.equal(rows.get(id).status, "ERROR", id);
    assert.match(rows.get(id).error, /INJECTION_POINT_MISSING in Network3: no active consumer for injected b_Step1_Set/);
  }
  // Cases that do not inject the Symbol are still evaluated.
  assert.notEqual(rows.get("STATE:Run-RnD").status, "ERROR");
});

// E2-R1-stand-2 (lead decision 1) supersedes the earlier "unwritten observed phase Symbol
// -> ERROR" rule: the phase is observed at its state RS output, the Symbol is optional.
test("S14/D1: removed phase Symbol is observed at its state RS output, not turned into ERROR or vacuous PASS", () => {
  const rows = currentCodeChecks(without(f1(), "b_Step6", "outputs"));
  const base = new Map(currentCodeChecks(f1()).map(r => [r.id, r.status]));
  for (const r of rows.filter(r => r.id.startsWith("STATE:") || r.id.startsWith("PRIORITY:Step6:")))
    assert.equal(r.status, base.get(r.id), `${r.id}: ${r.error ?? ""}`);
  const step6 = rows.filter(r => r.id.startsWith("PRIORITY:Step6:"));
  assert.equal(step6.length, 16);
  assert.ok(step6.every(r => JSON.stringify(r.trace.initial.steps) === '["Step6"]'), "Step6 is seeded and observed through //Network3/FBRs6/RsOut");
});

test("S14: pinned F1 has every STATE/PRIORITY injection and observation point", () => {
  const rows = currentCodeChecks(f1());
  assert.deepEqual(rows.filter(r => /INJECTION_POINT_MISSING/.test(r.error ?? "")).map(r => r.id), []);
});

test("S15: pinned case baseline loads and reports vanished, new and changed IDs", () => {
  const baseline = loadCaseBaseline(DEFAULT_CASE_BASELINE);
  assert.match(baseline.source.salSha256, /^[0-9a-f]{64}$/);
  assert.ok(baseline.cases.some(c => c.id === "TIMER://Network5/FBTon1"));
  const same = diffCaseIds(baseline, baseline.cases);
  assert.deepEqual([same.counts.missing, same.counts.added, same.counts.statusChanged], [0, 0, 0]);
  const cases = baseline.cases.filter(c => !c.id.startsWith("TIMER://Network5/"))
    .map(c => c.id === "STATE:Run-RnD" ? { ...c, status: "ERROR" } : c).concat([{ id: "NEW:case", status: "PASS" }]);
  const diff = diffCaseIds(baseline, cases);
  assert.deepEqual(diff.missing.map(m => m.id), ["TIMER://Network5/FBTon1", "TIMER://Network5/FBTon2", "TIMER://Network5/FBTon3", "TIMER://Network5/FBTon4"]);
  assert.deepEqual(diff.added, [{ id: "NEW:case", status: "PASS" }]);
  assert.deepEqual(diff.statusChanged, [{ id: "STATE:Run-RnD", from: "PASS", to: "ERROR" }]);
  assert.ok(formatCaseIdDiff(diff).some(l => l === "- MISSING TIMER://Network5/FBTon1 (baseline PASS)"));
  assert.equal(diffCaseIds(baseline, [...cases, { id: "NEW:case", status: "FAIL" }]).counts.duplicates, 1);
});

test("S15: per-stage test names vanished from the pinned baseline are listed (multiset, load crash visible)", () => {
  const baseline = loadTestBaseline(DEFAULT_TEST_BASELINE);
  assert.ok(baseline.stages.harness.some(t => t.name.startsWith("OBS-TON //Network5/FBTon1 ")));
  const stage = name => ({ name, tests: baseline.stages[name] });
  const same = diffStageTests(baseline, ["harness", "historical", "current"].map(stage));
  assert.ok(Object.values(same.stages).every(s => s.counts.missing === 0 && s.counts.added === 0 && s.counts.statusChanged === 0));
  const tap = ["TAP version 13", "ok 1 - kept", "    not ok 1 - nested is ignored", "not ok 2 - flipped", "ok 3 - skipped # SKIP reason", "ok 4 - dup", "ok 5 - dup"].join("\n");
  assert.deepEqual(topLevelTests(tap), [{ name: "kept", status: "pass" }, { name: "flipped", status: "fail" }, { name: "skipped", status: "skip" }, { name: "dup", status: "pass" }, { name: "dup", status: "pass" }]);
  const synthetic = { ...baseline, stages: { harness: [{ name: "kept", status: "pass" }, { name: "flipped", status: "pass" }, { name: "gone", status: "pass" }, { name: "dup", status: "pass" }, { name: "dup", status: "pass" }, { name: "dup", status: "pass" }] } };
  const d = diffStageTests(synthetic, [{ name: "harness", tests: topLevelTests(tap) }]).stages.harness;
  assert.deepEqual(d.missing.sort(), ["dup", "gone"]);
  assert.deepEqual(d.added, ["skipped"]);
  assert.deepEqual(d.statusChanged, [{ name: "flipped", from: "pass", to: "fail" }]);
  assert.ok(formatStageTestDiff(diffStageTests(synthetic, [{ name: "harness", tests: topLevelTests(tap) }])).includes("  - MISSING gone"));
});
