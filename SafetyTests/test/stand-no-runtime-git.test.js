// E0 stand (P2): the executable suite must not depend on .git or on the
// sibling reference checkout at runtime. Historical/reference sources come
// from SHA-verified copies in fixtures/pinned (src/pinned-sources.js).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pinnedManifest, pinnedGitShow, pinnedReferenceSalPath } from "../src/pinned-sources.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const files = [
  ...fs.readdirSync(path.join(root, "test")).filter(f => f.endsWith(".js")).map(f => `test/${f}`),
  ...fs.readdirSync(path.join(root, "test/helpers")).filter(f => f.endsWith(".js")).map(f => `test/helpers/${f}`),
  ...fs.readdirSync(path.join(root, "src")).filter(f => f.endsWith(".js")).map(f => `src/${f}`),
  "scripts/software-check.js", "scripts/structure-check.js", "scripts/catalog-check.js"
];
const gitCall = /\b(spawnSync|execFileSync|execSync|spawn|exec)\s*\(\s*['"`]git['"`]/;
const sibling = /MEN001_Dyno\/MEN001_Dyno\//;

test("STAND-REPRO suite runtime code never shells out to git", () => {
  const offenders = files.filter(f => f !== "test/stand-no-runtime-git.test.js" && gitCall.test(fs.readFileSync(path.join(root, f), "utf8")));
  assert.deepEqual(offenders, []);
});

test("STAND-REPRO suite runtime code never reads the sibling reference checkout", () => {
  const offenders = files.filter(f => f !== "test/stand-no-runtime-git.test.js" && sibling.test(fs.readFileSync(path.join(root, f), "utf8")));
  assert.deepEqual(offenders, []);
});

test("STAND-REPRO every pinned source verifies its SHA256 and the manifest identity", () => {
  const m = pinnedManifest();
  assert.equal(m.entries.length, 3);
  for (const e of m.entries.filter(x => x.kind === "git-blob")) assert.ok(pinnedGitShow(e.commit.slice(0, 7), e.repoPath).length > 0);
  assert.ok(fs.existsSync(pinnedReferenceSalPath()));
  assert.throws(() => pinnedGitShow("deadbee", "MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal"), /exactly one entry/);
});
