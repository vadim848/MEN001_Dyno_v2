// E2a-rename stand slice (lead item 2): sal-mutation-check --source-root <candidate dir> runs a plan
// whose sourceSha256 is the candidate's SAL, in a sandbox whose canonical paths hold the candidate.
// The working tree is never written. Missing candidate files / ambiguous source are infrastructure errors.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const stand = fileURLToPath(new URL("../../", import.meta.url));
const canon = rel => fileURLToPath(new URL(`../../MEN001_Dyno/Safety_Dyno/${rel}`, import.meta.url));
const sha = b => crypto.createHash("sha256").update(b).digest("hex");
const { NODE_TEST_CONTEXT, ...env } = process.env;
const run = args => spawnSync(process.execPath, ["scripts/sal-mutation-check.js", ...args], { cwd: stand, encoding: "utf8", env: { ...env, NODE_OPTIONS: "" }, timeout: 600000 });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stand-source-root-"));
test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
// A "candidate": the canonical triple with one extra trailing newline in the SAL (new SHA, same parse).
const cand = path.join(tmp, "cand");
fs.mkdirSync(cand);
const salBytes = Buffer.concat([fs.readFileSync(canon("TwinSafeGroup1/TwinSafeGroup1.sal")), Buffer.from("\n")]);
fs.writeFileSync(path.join(cand, "TwinSafeGroup1.sal"), salBytes);
fs.copyFileSync(canon("TwinSafeGroup1/TwinSafeGroup1.sal.diagram"), path.join(cand, "TwinSafeGroup1.sal.diagram"));
fs.copyFileSync(canon("GVLs/GVL1.sgvl"), path.join(cand, "GVL1.sgvl"));
const plan = path.join(tmp, "plan.json");
fs.writeFileSync(plan, JSON.stringify({ version: "sal-mutation-plan-v1", sourceSha256: sha(salBytes), testFiles: ["stand-signal-names.test.js"],
  behaviouralTests: ["^RENAME-"], mutations: [] }));

test("SRCROOT-1: a candidate plan is stale on canonical but VALID with --source-root; working tree untouched", () => {
  const before = sha(fs.readFileSync(canon("TwinSafeGroup1/TwinSafeGroup1.sal")));
  const stale = run(["--plan", plan, "--validate-only", "--out", path.join(tmp, "o1")]);
  assert.equal(stale.status, 3, stale.stdout + stale.stderr);
  assert.match(stale.stderr, /refusing to run a stale plan/);
  const ok = run(["--plan", plan, "--validate-only", "--source-root", cand, "--out", path.join(tmp, "o2")]);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, new RegExp(`source root: .* \\(SAL ${sha(salBytes)}\\)`));
  assert.match(ok.stdout, /VALID plan/);
  assert.equal(sha(fs.readFileSync(canon("TwinSafeGroup1/TwinSafeGroup1.sal"))), before);
});

test("SRCROOT-2: a candidate directory without all three files is refused (exit 3)", () => {
  const partial = path.join(tmp, "partial");
  fs.mkdirSync(partial);
  fs.copyFileSync(path.join(cand, "TwinSafeGroup1.sal"), path.join(partial, "TwinSafeGroup1.sal"));
  const r = run(["--plan", plan, "--validate-only", "--source-root", partial, "--out", path.join(tmp, "o3")]);
  assert.equal(r.status, 3);
  assert.match(r.stderr, /missing TwinSafeGroup1\.sal\.diagram, GVL1\.sgvl/);
});
