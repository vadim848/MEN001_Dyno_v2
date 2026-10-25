// S1: scenario catalog run. Env pass-through: CATALOG_SAL_DIR, CATALOG_STAGES. Exit 1 on any FAIL or 0 tests.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { targetPaths } from "./structure-check.js";
import crypto from "node:crypto";

const root = fileURLToPath(new URL("../", import.meta.url));
export function catalogCheck() {
  const t = targetPaths();
  const header = { target: t.dir, salSha256: fs.existsSync(t.sal) ? crypto.createHash("sha256").update(fs.readFileSync(t.sal)).digest("hex") : null, stages: process.env.CATALOG_STAGES || "all" };
  const dir = path.join(root, "test/catalog");
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(".test.js")).sort().map(f => path.join("test/catalog", f)) : [];
  console.log(`catalog target: ${header.target}\ncatalog SAL SHA256: ${header.salSha256}\ncatalog stages: ${header.stages}`);
  if (!files.length) { console.log("catalog: 0 tests -> FAIL (no test/catalog/*.test.js)"); return { ...header, status: "FAIL", counts: { tests: 0 }, files }; }
  const p = spawnSync(process.execPath, ["--test", "--test-reporter=tap", ...files], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: process.env });
  const out = p.stdout ?? "";
  const counts = Object.fromEntries(["tests", "pass", "fail", "skipped", "todo"].map(k => [k, Number(out.match(new RegExp(`^# ${k} ([0-9]+)`, "m"))?.[1] ?? 0)]));
  if (process.env.CATALOG_TAP_OUT) fs.writeFileSync(process.env.CATALOG_TAP_OUT, out);
  const failed = [...out.matchAll(/^not ok \d+ - (.*?)(?: # .*)?$/gm)].map(m => m[1]);
  const status = counts.tests === 0 ? "FAIL" : counts.fail > 0 || p.status !== 0 ? "FAIL" : "PASS";
  console.log(`catalog: ${status} ${JSON.stringify(counts)} (skipped = other stages / not run, not pass)`);
  for (const n of failed.slice(0, 200)) console.log(`  FAIL ${n}`);
  if (status === "FAIL" && counts.tests === 0) console.log("  catalog produced 0 tests: " + (p.stderr || "").slice(0, 300));
  return { ...header, status, counts, failed, files };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = catalogCheck().status === "PASS" ? 0 : 1;
