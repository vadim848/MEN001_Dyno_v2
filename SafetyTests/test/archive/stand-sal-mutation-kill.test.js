// E0 stand: kill attribution of the SAL mutation runner (src/sal-mutation-kill.js).
// A mutation may be KILLED only by an assertion failure (ERR_ASSERTION) of a concrete
// test that was ok on baseline, in a file without a file-level failure, whose name is in
// the behavioural allowlist. Module load failures (e.g. the SHA pin of
// test/helpers/v2-structural.js), file-level `not ok <file>.test.js` (ERR_TEST_FAILURE),
// non-assertion exceptions, hook failures/cancels and absent tests must never kill, even
// with an allowlist that matches every name. Uses real `node --test` child processes on
// synthetic test files in a temporary directory outside the repository.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runTestFiles, resultIndex, parseTap } from "../../src/stand-sandbox.js";
import { attributeKills, failureClass } from "../../src/sal-mutation-kill.js";

const FILES = {
  // mutant: one behavioural assertion fails -> the only legitimate kill source
  "k-assert.test.js": `import test from "node:test"; import assert from "node:assert/strict";
const m = process.env.STAND_MUTANT === "1";
test("BEH assert target", () => { assert.equal(m ? 1 : 0, 0); });
test("BEH assert untouched", () => {});`,
  // mutant: module throws at import like the v2-structural SHA pin
  "k-load.test.js": `import test from "node:test"; import assert from "node:assert/strict";
assert.equal(process.env.STAND_MUTANT === "1" ? "deadbeef" : "04b4", "04b4", "SAL sha256 pin");
test("BEH load a", () => {}); test("BEH load b", () => {});`,
  // mutant: an assertion fails AND an uncaught async error makes a file-level not ok
  "k-filelevel.test.js": `import test from "node:test"; import assert from "node:assert/strict";
const m = process.env.STAND_MUTANT === "1";
test("BEH filelevel assert", () => { assert.equal(m ? 1 : 0, 0); });
if (m) setTimeout(() => { throw new Error("late uncaught"); }, 20);`,
  // mutant: test body throws a non-assertion error (parse/precondition)
  "k-exception.test.js": `import test from "node:test";
test("BEH exception", () => { if (process.env.STAND_MUTANT === "1") throw new Error("Fixture ERROR: SHA mismatch"); });`,
  // mutant: describe-level before hook fails; and a describe whose inner test asserts
  "k-hook.test.js": `import { describe, before, test } from "node:test"; import assert from "node:assert/strict";
const m = process.env.STAND_MUTANT === "1";
describe("BEH hook suite", () => { before(() => { if (m) throw new Error("hook"); }); test("inner ok", () => {}); });
describe("BEH nested assert suite", () => { test("inner", () => { assert.ok(!m); }); });`
};
const files = Object.keys(FILES);

function standDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "men001-stand-kill-"));
  fs.mkdirSync(path.join(dir, "test"));
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type: "module" }));
  for (const [name, text] of Object.entries(FILES)) fs.writeFileSync(path.join(dir, "test", name), text);
  return dir;
}

test("STAND-KILL only assertion failures of allowlisted baseline-passing tests kill; load/SHA/file-level/exception/hook never do", async () => {
  const dir = standDir();
  try {
    const baseline = resultIndex(await runTestFiles(dir, files, { env: { STAND_MUTANT: "0" } }));
    assert.ok([...baseline.values()].every(r => r.status === "pass"), JSON.stringify([...baseline]));
    const run = resultIndex(await runTestFiles(dir, files, { env: { STAND_MUTANT: "1" } }));
    // allowlist that matches EVERY name, including file paths and placeholders
    const k = attributeKills({ baselineIndex: baseline, runIndex: run, isBehaviouralName: () => true });
    const cat = key => k.newlyFailing.filter(n => n.key.startsWith(key)).map(n => n.category);

    assert.deepEqual(k.killedBy.sort(), ["k-assert.test.js :: BEH assert target", "k-hook.test.js :: BEH nested assert suite"]);
    assert.equal(k.verdict, "KILLED");
    // module load failure (SHA pin): load-fail entry + both tests absent, all file-level
    assert.equal(run.get("k-load.test.js :: <module load>")?.status, "load-fail");
    assert.deepEqual(cat("k-load.test.js"), ["file-level", "file-level", "file-level"]);
    // file-level not ok after tests: the failing assertion in the same file is demoted
    assert.ok([...run.keys()].some(key => key.startsWith("k-filelevel.test.js :: ") && run.get(key).fileLevel));
    assert.ok(cat("k-filelevel.test.js").length >= 2 && cat("k-filelevel.test.js").every(c => c === "file-level"), JSON.stringify(cat("k-filelevel.test.js")));
    // non-assertion exception and hook failure
    assert.deepEqual(cat("k-exception.test.js"), ["exception"]);
    assert.equal(run.get("k-exception.test.js :: BEH exception").code, "ERR_TEST_FAILURE");
    assert.deepEqual(cat("k-hook.test.js :: BEH hook suite"), ["hook-cancel"]);
    assert.equal(k.categories["file-level"], 5);

    // Without the two genuine assertion kills the same run is STRUCTURAL-ONLY, never KILLED.
    const noGenuine = new Map([...run].filter(([key]) => !["k-assert.test.js :: BEH assert target", "k-hook.test.js :: BEH nested assert suite"].includes(key)));
    const k2 = attributeKills({ baselineIndex: baseline, runIndex: noGenuine, isBehaviouralName: () => true });
    assert.deepEqual(k2.killedBy, []);
    assert.equal(k2.verdict, "STRUCTURAL-ONLY");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("STAND-KILL software-check: behavioural FAIL kills; BOOT, ERROR, probe crash and missing cases do not", () => {
  const empty = new Map();
  const base = new Map([["ACC-1", "PASS"], ["BOOT:x", "PASS"], ["CUR-2", "PASS"], ["CUR-3", "PASS"]]);
  const run = new Map([["ACC-1", "FAIL"], ["BOOT:x", "FAIL"], ["CUR-2", "ERROR"]]);
  const k = attributeKills({ baselineIndex: empty, runIndex: empty, isBehaviouralName: () => true, baselineCases: base, runCases: run, isBehaviouralCase: id => !/^BOOT:/.test(id) });
  assert.deepEqual(k.killedBy, ["software-check :: ACC-1"]);
  assert.deepEqual(k.newlyFailing.map(n => [n.key, n.category]), [
    ["software-check :: ACC-1", "swcheck-behavioural-fail"], ["software-check :: BOOT:x", "swcheck-structural"],
    ["software-check :: CUR-2", "swcheck-error"], ["software-check :: CUR-3", "swcheck-error"]]);
  const crash = attributeKills({ baselineIndex: empty, runIndex: empty, isBehaviouralName: () => true, baselineCases: base, runCases: new Map([["<cases-probe>", "ERROR"]]) });
  assert.deepEqual(crash.killedBy, []);
  assert.equal(crash.verdict, "STRUCTURAL-ONLY");
  assert.equal(crash.categories["swcheck-error"], 5);
});

test("STAND-KILL TAP parser keeps failureType/code and nested leaves; file path entries are file-level", () => {
  const tap = parseTap([
    "TAP version 13",
    "# Subtest: s", "    # Subtest: inner", "    not ok 1 - inner", "      ---", "      failureType: 'testCodeFailure'", "      error: |-", "        Expected values to be strictly equal", "      code: 'ERR_ASSERTION'", "      ...",
    "not ok 1 - s", "  ---", "  failureType: 'subtestsFailed'", "  error: '1 subtest failed'", "  code: 'ERR_TEST_FAILURE'", "  ...",
    "not ok 2 - test\\\\a.test.js", "  ---", "  failureType: 'testCodeFailure'", "  error: 'test failed'", "  code: 'ERR_TEST_FAILURE'", "  ...",
    "# tests 2", "# pass 0", "# fail 2"].join("\n"));
  assert.equal(tap.results.length, 2);
  assert.equal(tap.results[0].failureType, "subtestsFailed");
  assert.deepEqual(tap.results[0].leaves.map(l => [l.name, l.code, l.message]), [["inner", "ERR_ASSERTION", "Expected values to be strictly equal"]]);
  assert.equal(failureClass({ ...tap.results[0], file: "a" }), "assertion");
  assert.equal(failureClass({ ...tap.results[1], file: "a" }), "file-level");
  assert.equal(failureClass({ status: "fail", failureType: "testCodeFailure", code: "ERR_TEST_FAILURE", name: "t" }), "exception");
  assert.equal(failureClass({ status: "load-fail" }), "file-level");
});
