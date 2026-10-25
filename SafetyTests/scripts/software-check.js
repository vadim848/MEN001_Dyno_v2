// S1: check:software = catalog + ONE structural check + kept stand self-checks. Exit != 0 on any FAIL.
// (Legacy case-baseline / expected-deltas gating: scripts/archive/software-check-legacy.js.)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { structureCheck, printStructure } from "./structure-check.js";
import { catalogCheck } from "./catalog-check.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = catalogCheck();
const structure = structureCheck(); printStructure(structure);
const files = fs.readdirSync(path.join(root, "test")).filter(f => f.endsWith(".test.js")).sort().map(f => "test/" + f);
const p = spawnSync(process.execPath, ["--test", "--test-reporter=tap", ...files], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const c = Object.fromEntries(["tests", "pass", "fail", "skipped"].map(k => [k, Number(p.stdout?.match(new RegExp(`^# ${k} ([0-9]+)`, "m"))?.[1] ?? 0)]));
const self = { status: p.status === 0 && c.tests > 0 && c.fail === 0 ? "PASS" : "FAIL", counts: c, files };
console.log(`stand self-checks (${files.length} files): ${self.status} ${JSON.stringify(c)}`);
if (self.status !== "PASS" && c.tests === 0) console.log("  self-check runner: " + (p.error?.message ?? "") + (p.stderr ?? "").slice(0, 400));
for (const m of (p.stdout ?? "").matchAll(/^not ok \d+ - (.*)$/gm)) console.log("  FAIL " + m[1]);
const all = { catalog, structure: { status: structure.status }, self };
console.log(`SUMMARY catalog=${catalog.status} structure=${structure.status} self=${self.status}`);
if (process.env.SOFTWARE_CHECK_OUT) fs.writeFileSync(process.env.SOFTWARE_CHECK_OUT, JSON.stringify({ ...all, structure }, null, 1));
process.exitCode = structure.status === "ERROR" ? 3 : [catalog.status, structure.status, self.status].every(s => s === "PASS") ? 0 : 1;
