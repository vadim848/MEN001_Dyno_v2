// E2 stand (G1 review C3): the SAL mutation runner must refuse a plan whose
// detector selection is not real instead of silently dropping entries.
//  (1) a testFiles entry that is a wildcard/comment string or a missing file -> exit 2, listed;
//  (2) a behaviouralTests pattern that selects no test of testFiles on the baseline run -> exit 2, listed.
// The existing E0 pilot plan must keep resolving to exactly the same 17 files.
// Reads the canonical SAL only inside a sandbox copy (scripts/sal-mutation-check.js); never writes it.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolvePlanTestFiles, compileBehaviouralPatterns, behaviouralPatternCoverage } from "../../src/sal-mutation-plan.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const testDir = path.join(root, "test");
const runner = path.join(root, "scripts", "sal-mutation-check.js");

test("STAND-MUTPLAN testFiles: wildcard, comment, path, duplicate and missing entries are errors, none dropped silently", () => {
  const { files, errors } = resolvePlanTestFiles([
    "stand-fb-semantics.test.js",
    "current-e2a-*.test.js (v2-tester, G1)",
    "current-e2z-*.test.js",
    "current-e2z-does-not-exist.test.js",
    "helpers/e2-lifecycle.js",
    "../test/stand-fb-semantics.test.js",
    "stand-fb-semantics.test.js"
  ], testDir);
  assert.deepEqual(files, ["stand-fb-semantics.test.js"]);
  assert.equal(errors.length, 6, errors.join("\n"));
  assert.match(errors[0], /current-e2a-\*\.test\.js \(v2-tester, G1\).*wildcard/);
  assert.match(errors[1], /current-e2z-\*\.test\.js.*wildcard/);
  assert.match(errors[2], /current-e2z-does-not-exist\.test\.js.*file not found/);
  assert.match(errors[3], /helpers\/e2-lifecycle\.js.*not an exact file name/);
  assert.match(errors[4], /not an exact file name/);
  assert.match(errors[5], /duplicate/);
  assert.match(resolvePlanTestFiles([], testDir).errors[0], /non-empty/);
  assert.match(resolvePlanTestFiles(undefined, testDir).errors[0], /non-empty/);
});

test("STAND-MUTPLAN behaviouralTests: invalid/empty lists are errors; a pattern selecting no reported test is unmatched", () => {
  assert.match(compileBehaviouralPatterns([]).errors[0], /non-empty/);
  assert.match(compileBehaviouralPatterns(["^E2[a-d "]).errors[0], /invalid regular expression/);
  const { patterns, errors } = compileBehaviouralPatterns(["^E2[a-d] ", "^E2b ", "^SR-"]);
  assert.deepEqual(errors, []);
  const keys = ["current-e2a-status.test.js :: E2a status after R&D", "current-e2a-status.test.js :: E2d IL-01 cover open#2",
    "x.test.js :: SR-01 safe run", "current-e2b-interlock-run.test.js :: <module load>"];
  const cov = behaviouralPatternCoverage(patterns, keys);
  assert.deepEqual(cov.matches, { "^E2[a-d] ": 2, "^E2b ": 0, "^SR-": 1 });
  assert.deepEqual(cov.unmatched, ["^E2b "]);
  // module-load placeholders never count as a match (a load failure is not a test)
  assert.deepEqual(behaviouralPatternCoverage(compileBehaviouralPatterns(["load"]).patterns, keys.slice(3)).unmatched, ["load"]);
});

test("STAND-MUTPLAN the E0 pilot plan resolves to exactly the files the previous existsSync filter kept (all 17, none dropped)", () => {
  const plan = JSON.parse(fs.readFileSync(path.join(root, "program/stand/E0-stand/sal-mutation-plan.pilot.json"), "utf8"));
  const previous = plan.testFiles.filter(f => fs.existsSync(path.join(testDir, f)));
  const { files, errors } = resolvePlanTestFiles(plan.testFiles, testDir);
  assert.deepEqual(errors, []);
  assert.deepEqual(files, previous);
  assert.equal(files.length, 17);
  assert.deepEqual(compileBehaviouralPatterns(plan.behaviouralTests).errors, []);
});

function runCli(name, plan, extra = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `men001-mutplan-${name}-`));
  const planPath = path.join(dir, "plan.json");
  fs.writeFileSync(planPath, JSON.stringify(plan));
  const r = spawnSync(process.execPath, [runner, "--plan", planPath, "--out", path.join(dir, "out"), "--concurrency", "1", ...extra],
    { cwd: root, encoding: "utf8", env: { ...process.env, NODE_OPTIONS: "" }, timeout: 300000 });
  return { ...r, dir };
}
const basePlan = { version: "sal-mutation-plan-v1", testFiles: ["stand-fb-semantics.test.js"], behaviouralTests: ["^FB-AND "], mutations: [] };

test("STAND-MUTPLAN runner: a missing/wildcard testFiles entry stops the run with exit 2 and lists every offender", { timeout: 300000 }, () => {
  const r = runCli("files", { ...basePlan, testFiles: ["stand-fb-semantics.test.js", "current-e2a-*.test.js (v2-tester, G1)", "current-e2z-missing.test.js"] }, ["--validate-only"]);
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /Invalid mutation plan .*\(2 error\(s\)\); nothing was run/);
  assert.match(r.stderr, /current-e2a-\*\.test\.js \(v2-tester, G1\)/);
  assert.match(r.stderr, /current-e2z-missing\.test\.js.*file not found/);
  assert.ok(!fs.existsSync(path.join(r.dir, "out", "sal-mutation-report.json")));
  fs.rmSync(r.dir, { recursive: true, force: true });
});

test("STAND-MUTPLAN runner: a behaviouralTests pattern matching no baseline test of testFiles stops the run with exit 2", { timeout: 300000 }, () => {
  const r = runCli("rx", { ...basePlan, behaviouralTests: ["^FB-AND ", "^E2b "] });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /behaviouralTests pattern\(s\) select no test of testFiles/);
  assert.match(r.stderr, /"\^E2b "/);
  assert.doesNotMatch(r.stderr, /"\^FB-AND "/);
  assert.ok(!fs.existsSync(path.join(r.dir, "out", "sal-mutation-report.json")));
  fs.rmSync(r.dir, { recursive: true, force: true });
});

test("STAND-MUTPLAN runner: a valid plan passes --validate-only (exit 0) and records per-pattern match counts", { timeout: 300000 }, () => {
  const r = runCli("ok", basePlan, ["--validate-only"]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const v = JSON.parse(fs.readFileSync(path.join(r.dir, "out", "sal-mutation-plan-validation.json"), "utf8"));
  assert.equal(v.status, "VALID");
  assert.ok(v.testFiles["stand-fb-semantics.test.js"] > 0);
  assert.ok(v.behaviouralPatternMatches["^FB-AND "] >= 1);
  assert.equal(v.behaviouralPatternPassingMatches["^FB-AND "], v.behaviouralPatternMatches["^FB-AND "]);
  assert.doesNotMatch(r.stderr, /WARNING/);
  assert.ok(!fs.existsSync(path.join(r.dir, "out", "sandbox")));
  fs.rmSync(r.dir, { recursive: true, force: true });
});
