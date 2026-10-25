// E0 stand: reproducibility check. Copies the executable closure into a
// directory WITHOUT .git and WITHOUT the sibling reference repository, runs
// every test/*.test.js file and scripts/software-check.js there, and compares
// per-test results with the same files executed in the working tree.
//
// Usage: node scripts/stand-isolated-check.js --out <dir> [--patch <dir>]... [--skip-working] [--keep]
//   --patch <dir>  overlay a staged patch: <dir>/files/** onto SafetyTests/**,
//                  <dir>/fixtures/** onto SafetyTests/fixtures/** (repeatable)
//   --out <dir>    absolute directory OUTSIDE the repository for sandbox + report
// Exit: 0 = no isolated-only differences; 1 = differences; 3 = infrastructure error.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createSandbox, runTestFiles, resultIndex, standRoot, suiteFiles, CANONICAL } from "../src/stand-sandbox.js";

const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const patches = args.flatMap((a, i) => a === "--patch" ? [path.resolve(args[i + 1])] : []);
const out = path.resolve(opt("--out") ?? fs.mkdtempSync(path.join(os.tmpdir(), "men001-isolated-")));
const sandboxDir = path.join(out, "sandbox");

function overlaysFrom(dir) {
  const overlays = {};
  const walk = (base, prefix) => {
    if (!fs.existsSync(base)) return;
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      const full = path.join(base, entry.name);
      if (entry.isDirectory()) walk(full, `${prefix}/${entry.name}`);
      else overlays[`${prefix}/${entry.name}`] = { from: full };
    }
  };
  walk(path.join(dir, "files"), "SafetyTests");
  walk(path.join(dir, "fixtures"), "SafetyTests/fixtures");
  return overlays;
}

const overlays = Object.assign({}, ...patches.map(overlaysFrom));
const box = createSandbox({ dest: sandboxDir, overlays });
const files = suiteFiles(box.standRoot);
const report = { generatedAt: new Date().toISOString(), sandbox: box.root, patches, overlays: Object.keys(overlays),
  gitPresent: fs.existsSync(path.join(box.root, ".git")),
  siblingReferencePresent: fs.existsSync(path.resolve(box.root, "../MEN001_Dyno/MEN001_Dyno")),
  source: Object.fromEntries(Object.entries(CANONICAL).map(([k, f]) => [k, box.sha(f)])) };

// Make the absence of git observable: a test that shells out to git must fail,
// not pick up an enclosing repository. GIT_CEILING_DIRECTORIES stops discovery above the sandbox.
const isolatedEnv = { GIT_CEILING_DIRECTORIES: path.dirname(box.root), GIT_DIR: path.join(box.root, ".git-absent") };

const isolated = await runTestFiles(box.standRoot, files, { env: isolatedEnv });
const working = args.includes("--skip-working") ? null : await runTestFiles(standRoot, files.filter(f => fs.existsSync(path.join(standRoot, "test", f))));
const iIdx = resultIndex(isolated), wIdx = working ? resultIndex(working) : new Map();
const differences = [];
for (const key of new Set([...iIdx.keys(), ...wIdx.keys()])) {
  const a = wIdx.get(key)?.status ?? "absent", b = iIdx.get(key)?.status ?? "absent";
  if (working && a !== b) differences.push({ key, working: a, isolated: b, message: iIdx.get(key)?.message ?? "" });
}
const sum = idx => ({ tests: idx.size, pass: [...idx.values()].filter(r => r.status === "pass").length,
  fail: [...idx.values()].filter(r => r.status === "fail").length, loadFail: [...idx.values()].filter(r => r.status === "load-fail").length,
  skip: [...idx.values()].filter(r => r.status === "skip").length });
report.isolatedTotals = sum(iIdx);
report.workingTotals = working ? sum(wIdx) : null;
report.isolatedNotPassing = [...iIdx.entries()].filter(([, r]) => r.status !== "pass").map(([key, r]) => ({ key, status: r.status, message: r.message }));
report.differences = differences;

// The sandbox copies root JSON from the working tree: delete generated results so a crash cannot be
// mistaken for a fresh report.
for (const generated of ["SOFTWARE_CHECK_RESULTS.json", "SOFTWARE_CHECK_RESULTS.md", "BOOT_PREFLIGHT_RESULTS.json", "SAL_NATIVE_STRUCTURE_RESULTS.json"])
  fs.rmSync(path.join(box.standRoot, generated), { force: true });
const sc = spawnSync(process.execPath, ["scripts/software-check.js"], { cwd: box.standRoot, encoding: "utf8", env: { ...process.env, ...isolatedEnv }, maxBuffer: 64 * 1024 * 1024 });
let scReport = null;
try { scReport = JSON.parse(fs.readFileSync(path.join(box.standRoot, "SOFTWARE_CHECK_RESULTS.json"), "utf8")); } catch { /* reported below */ }
report.softwareCheck = { exitCode: sc.status, stdout: sc.stdout.slice(-3000), stderr: sc.stderr.slice(-3000),
  summary: scReport?.summary ?? null, stages: scReport?.stages?.map(s => ({ name: s.name, status: s.status, counts: s.counts })) ?? null,
  notPass: scReport?.cases?.filter(c => c.status !== "PASS").map(c => ({ id: c.id, status: c.status, reason: c.reason ?? c.error ?? "" })) ?? null };

fs.writeFileSync(path.join(out, "isolated-check.json"), JSON.stringify(report, null, 1) + "\n");
console.log(`sandbox: ${box.root} (git: ${report.gitPresent}, sibling reference: ${report.siblingReferencePresent})`);
console.log(`isolated: ${JSON.stringify(report.isolatedTotals)}`);
if (working) console.log(`working:  ${JSON.stringify(report.workingTotals)}`);
for (const d of differences) console.log(`DIFF ${d.key}: working=${d.working} isolated=${d.isolated} ${d.message}`);
console.log(`software-check (isolated): exit ${sc.status} ${JSON.stringify(report.softwareCheck.summary)}`);
for (const c of report.softwareCheck.notPass ?? []) console.log(`  ${c.status} ${c.id}: ${String(c.reason).slice(0, 160)}`);
console.log(`report: ${path.join(out, "isolated-check.json")}`);
if (!args.includes("--keep")) { /* sandbox retained for inspection only with --keep */ fs.rmSync(sandboxDir, { recursive: true, force: true }); }
process.exitCode = differences.length ? 1 : 0;
