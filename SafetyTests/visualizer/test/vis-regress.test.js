// VIS item 2: the visualizer does not change the stand / catalog / canonical program (VIS-Q1: "стенд и каталог не менять").
// Oracle: lead baseline Q-C3-1 after Vadim's IDE Verify (commit a505e73): canonical SAL SHA256 1d046f43...525d
// (full value in _lib.mjs CANON_SAL_SHA); check:software SUMMARY catalog=PASS {157 tests, 156 pass, 0 fail, 1 todo; +section N n-c3bms 19 rows}
// structure=PASS (native CRC included) self=PASS {53 tests, 53 pass}, exit 0. A stale native CRC must FAIL this test.
// (Superseded: TMR-1 Verify 1912ad8 f81b1a5e...44f4, catalog 138/137/0/1; TMR-1 transfer 3511b31b...1743 with stale CRC; VIS-3 baseline 53e9a6d8...8fbb; VIS/VIS-2 133/132/1, 9e5bfb15...762d.)
// git: no working-tree change under stand / canonical paths.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sh, sha, CANON_SAL, REPO, ST, CANON_SAL_SHA } from "./_lib.mjs";

const STAND = ["MEN001_Dyno", "SafetyTests/src", "SafetyTests/scripts", "SafetyTests/test", "SafetyTests/SCENARIO_CATALOG.md"];

test("VIS-2 canonical SAL and stand paths unchanged (git)", async () => {
  const s = sha(fs.readFileSync(CANON_SAL));
  assert.equal(s, CANON_SAL_SHA, "canonical SAL SHA256 = baseline");
  const g = await sh("git", ["status", "--porcelain", "--", ...STAND], { cwd: REPO });
  assert.equal(g.code, 0, g.out); assert.equal(g.out.trim(), "", "stand/canonical paths have working-tree changes:\n" + g.out);
  const d = await sh("git", ["diff", "--stat", "HEAD", "--", ...STAND], { cwd: REPO });
  assert.equal(d.out.trim(), "");
});

test("VIS-2 npm run check:software result == baseline", { timeout: 40 * 60 * 1000, skip: process.env.VIS_SKIP_SOFTWARE === "1" ? "VIS_SKIP_SOFTWARE=1" : false }, async t => {
  const env = { ...process.env }; for (const k of Object.keys(env)) if (/^CATALOG_|^STRUCT|^NODE_TEST/.test(k)) delete env[k];
  const r = await sh(process.execPath, ["scripts/software-check.js"], { cwd: ST, env });
  const sum = r.out.split(/\r?\n/).filter(l => /SUMMARY/i.test(l)).join("\n");
  t.diagnostic(sum);
  assert.equal(r.code, 0, "exit code 0 as baseline");
  assert.match(sum, /catalog=PASS/); assert.match(sum, /structure=PASS/); assert.match(sum, /self=PASS/);
  const cat = r.out.match(/^catalog: (\w+) (\{.*?\})/m); assert.ok(cat, "catalog line"); t.diagnostic(cat[0]);
  assert.equal(cat[1], "PASS"); const n = JSON.parse(cat[2]);
  assert.deepEqual({ tests: n.tests, pass: n.pass, fail: n.fail, todo: n.todo }, { tests: 157, pass: 156, fail: 0, todo: 1 }, "baseline counts");
  const self = r.out.match(/^stand self-checks \(\d+ files\): (\w+) (\{.*?\})/m); assert.ok(self, "self-check line"); t.diagnostic(self[0]);
  assert.equal(self[1], "PASS"); const m = JSON.parse(self[2]);
  assert.deepEqual({ tests: m.tests, pass: m.pass, fail: m.fail }, { tests: 53, pass: 53, fail: 0 }, "self-check baseline counts");
});
