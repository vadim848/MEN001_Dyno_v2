// E0 stand: the SAL mutation operators change exactly one declared attribute
// (proved on the parsed model) and refuse ambiguous/unsupported targets.
// Reads the canonical SAL read-only; never writes it.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyMutation, verifyMutation, locateBlock } from "../../src/sal-mutations.js";
import { createSandbox, parseTap, repoRoot } from "../../src/stand-sandbox.js";

const salPath = fileURLToPath(new URL("../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal", import.meta.url));
const xml = fs.readFileSync(salPath, "utf8");

const cases = [
  { op: "deactivate-input", block: "//Network12/FBAnd16", port: "AndIn1", attr: "channelInterface", after: "Deactivated" },
  { op: "invert-contact", block: "//Network12/FBAnd16", port: "AndIn2", attr: "deactivate1", after: "Break Contact (NC)" },
  { op: "set-channel-mode", block: "//Network1/FBEstop1", port: "EStopIn1", value: "Single-Channel 1 Activated", attr: "channelInterface", after: "Single-Channel 1 Activated" },
  { op: "set-parameter", block: "//Network1/FBEstop1", port: "Delay Time (ms)", value: "1000", attr: "timing", after: "1000" }
];
for (const c of cases) test(`STAND-MUT ${c.op} changes exactly ${c.block}/${c.port}.${c.attr}`, () => {
  const { xml: mutant, change } = applyMutation(xml, c);
  assert.equal(change.attr, c.attr);
  assert.equal(change.after, c.after);
  assert.notEqual(mutant, xml);
  assert.ok(verifyMutation(xml, mutant, change));
});

test("STAND-MUT refuses unsupported or ambiguous targets instead of guessing", () => {
  assert.throws(() => applyMutation(xml, { op: "deactivate-input", block: "//Network1/FBRs6", port: "Set" }), /only for safeAnd\/safeOr/);
  assert.throws(() => applyMutation(xml, { op: "deactivate-input", block: "//Network12/FBAnd16", port: "AndIn8" }), /not Activated/);
  assert.throws(() => applyMutation(xml, { op: "set-channel-mode", block: "//Network1/FBEstop1", port: "EStopIn1", value: "Single-Channel Both Activated" }), /no-op/);
  assert.throws(() => applyMutation(xml, { op: "invert-contact", block: "//NoSuchNetwork/FBAnd1", port: "AndIn1" }), /exactly one match/);
  assert.throws(() => applyMutation(xml, { op: "rewrite", block: "//Network12/FBAnd16", port: "AndIn1" }), /Unknown mutation operator/);
  assert.throws(() => locateBlock(xml, "Network12/FBAnd16"), /Block path/);
});

test("STAND-MUT verification rejects a mutant with an undeclared second change", () => {
  const { xml: once, change } = applyMutation(xml, cases[0]);
  const { xml: twice } = applyMutation(once, { op: "deactivate-input", block: "//Network12/FBAnd16", port: "AndIn3" });
  assert.throws(() => verifyMutation(xml, twice, change), /Parsed delta mismatch/);
});

test("STAND-SANDBOX refuses destinations inside the repository and parses node TAP load failures", () => {
  assert.throws(() => createSandbox({ dest: path.join(repoRoot, "SafetyTests", "never-created-sandbox") }), /outside the repository/);
  const tap = parseTap("TAP version 13\nnot ok 1 - test\\\\a.test.js\n  ---\n  error: 'test failed'\n  ...\n1..1\n# tests 1\n# pass 0\n# fail 1\n");
  assert.deepEqual(tap.totals, { tests: 1, pass: 0, fail: 1, skipped: 0 });
  assert.equal(tap.results[0].status, "fail");
});
