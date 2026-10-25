// E0 stand: SAL mutation testing. Applies each mutation of a plan to a COPY of
// the canonical SAL inside an isolated sandbox (no .git, no sibling repo),
// runs the plan's detector test files there and reports, per mutation:
//   KILLED            >=1 behavioural test (plan allowlist) ok on baseline newly fails by an ASSERTION
//                     (ERR_ASSERTION), in a file with no file-level failure in that run; or a non-BOOT
//                     software-check case PASS -> FAIL. Rule and categories: src/sal-mutation-kill.js
//   STRUCTURAL-ONLY   only non-kill categories: module load / SHA pin / file-level ERR_TEST_FAILURE /
//                     timeout (file-level), non-assertion exceptions, hook/cancel, absent tests,
//                     non-behavioural assertions, software-check BOOT/ERROR -> NOT a G3 kill
//   SURVIVED          no newly failing test
//   INVALID           mutation could not be applied/verified, or sandbox infrastructure failed
//   NOT-RUN           the plan flags the mutation operatorAvailable:false AND the stand has no such
//                     operator: nothing applied, no detector run; neither KILLED nor SURVIVED, listed
//                     separately (manual G3 procedure: program/stand/E2-runner-ops/HANDOFF.md)
// The canonical SAL/SGVL/diagram are never written. Baseline failures (tests
// already failing on the unmutated copy) are excluded from detection.
//
// Usage: node scripts/sal-mutation-check.js [--plan <json>] [--out <dir>] [--only ID,ID]
//            [--patch <staged patch dir>]... [--with-software-check (behavioural cases via scripts/stand-cases-probe.js)] [--concurrency N]
//            [--validate-only]  (dry run: plan validation + baseline detector run, no mutation applied)
//            [--source-root <dir>]  (E2a-rename: run the plan against a candidate, e.g. candidates/E2a/native:
//            its TwinSafeGroup1.sal, TwinSafeGroup1.sal.diagram and GVL1.sgvl are placed on the canonical
//            paths of the SANDBOX only; all three must exist; the working tree is not touched)
// Plan validation (src/sal-mutation-plan.js): every testFiles entry must be an exact existing
// file in the sandbox test/ (wildcards, comments, duplicates and missing files are errors), and
// every behaviouralTests pattern must select >=1 test reported by the baseline detector run.
// Plan operators: an op the stand does not implement is NOT-RUN only when the plan flags it
// operatorAvailable:false; an unflagged unknown op is a plan error (exit 2). A flag false on an op the
// stand does implement is reported as stale and the mutation IS run (availability is the stand's fact).
// --validate-only also dry-applies every runnable mutation (apply + parsed-delta + binding check, no
// tests): a mutation that cannot be applied to this source is a plan error (exit 2), listed.
// Exit: 0 all KILLED (or --validate-only OK); 1 any SURVIVED / STRUCTURAL-ONLY / INVALID;
//       4 every executed mutation KILLED but >=1 NOT-RUN (incomplete, not a pass); 2 invalid plan; 3 infrastructure/baseline error.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { createSandbox, runTestFiles, resultIndex, standRoot, CANONICAL } from "../src/stand-sandbox.js";
import { applyMutation, verifyMutation, operatorNames } from "../src/sal-mutations.js";
import { attributeKills, CATEGORIES } from "../src/sal-mutation-kill.js";
import { resolvePlanTestFiles, compileBehaviouralPatterns, behaviouralPatternCoverage } from "../src/sal-mutation-plan.js";

const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const planPath = path.resolve(opt("--plan") ?? path.join(standRoot, "program/stand/E0-stand/sal-mutation-plan.pilot.json"));
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const only = opt("--only")?.split(",");
const out = path.resolve(opt("--out") ?? fs.mkdtempSync(path.join(os.tmpdir(), "men001-salmut-")));
const concurrency = Number(opt("--concurrency") ?? 4);
const validateOnly = args.includes("--validate-only");
const withSoftwareCheck = args.includes("--with-software-check") || plan.withSoftwareCheck === true;
const patches = args.flatMap((a, i) => a === "--patch" ? [path.resolve(args[i + 1])] : []);
const sourceRoot = opt("--source-root") ? path.resolve(opt("--source-root")) : null;
const SOURCE_ROOT_FILES = { [CANONICAL.sal]: "TwinSafeGroup1.sal", [CANONICAL.diagram]: "TwinSafeGroup1.sal.diagram", [CANONICAL.sgvl]: "GVL1.sgvl" };
function sourceRootOverlays(dir) {
  if (!dir) return {};
  const missing = Object.values(SOURCE_ROOT_FILES).filter(f => !fs.existsSync(path.join(dir, f)));
  if (missing.length) { console.error(`--source-root ${dir}: missing ${missing.join(", ")}; all of SAL, diagram and GVL1.sgvl are required`); process.exit(3); }
  return Object.fromEntries(Object.entries(SOURCE_ROOT_FILES).map(([to, f]) => [to, { from: path.join(dir, f) }]));
}
const sha = b => crypto.createHash("sha256").update(b).digest("hex");

function overlaysFrom(dir) {
  const overlays = {};
  const walk = (base, prefix) => { if (!fs.existsSync(base)) return;
    for (const e of fs.readdirSync(base, { withFileTypes: true })) {
      const full = path.join(base, e.name);
      if (e.isDirectory()) walk(full, `${prefix}/${e.name}`); else overlays[`${prefix}/${e.name}`] = { from: full };
    } };
  walk(path.join(dir, "files"), "SafetyTests"); walk(path.join(dir, "fixtures"), "SafetyTests/fixtures");
  return overlays;
}

fs.mkdirSync(out, { recursive: true });
const patchOverlays = Object.assign({}, ...patches.map(overlaysFrom));
const box = createSandbox({ dest: path.join(out, "sandbox"), overlays: { ...patchOverlays, ...sourceRootOverlays(sourceRoot) } });
if (sourceRoot) for (const [to, f] of Object.entries(SOURCE_ROOT_FILES))
  if (box.sha(to) !== sha(fs.readFileSync(path.join(sourceRoot, f)))) { console.error(`--source-root copy mismatch for ${f}`); process.exit(3); }
if (sourceRoot) console.log(`source root: ${sourceRoot} -> sandbox canonical paths (SAL ${box.sha(CANONICAL.sal)})`);
const salFile = path.join(box.root, CANONICAL.sal);
const sgvlFile = path.join(box.root, CANONICAL.sgvl);
const sgvlBytes = fs.readFileSync(sgvlFile), sgvlSha = sha(sgvlBytes);
const sgvlXml = sgvlBytes.toString("utf8");
const originalBytes = fs.readFileSync(salFile);
const original = originalBytes.toString("utf8");
const sourceSha = sha(originalBytes);
const resolved = resolvePlanTestFiles(plan.testFiles, path.join(box.standRoot, "test"));
const compiled = compileBehaviouralPatterns(plan.behaviouralTests);
const planErrors = [...resolved.errors, ...compiled.errors];
if (!Array.isArray(plan.mutations)) planErrors.push("mutations must be an array");
// Operator availability (E2-runner-ops): NOT-RUN is an explicit plan statement, never a fallback for a typo.
const known = new Set(operatorNames());
const notRun = [], staleFlags = [];
for (const m of Array.isArray(plan.mutations) ? plan.mutations : []) {
  if (!known.has(m.op)) {
    if (m.operatorAvailable === false) notRun.push({ id: m.id, op: m.op, block: m.block, port: m.port, value: m.value, reason: `operator unavailable: ${m.op} is not implemented by src/sal-mutations.js` });
    else planErrors.push(`mutation ${m.id}: unknown operator ${JSON.stringify(m.op)} (not flagged operatorAvailable:false)`);
  } else if (m.operatorAvailable === false) staleFlags.push(m.id);
}
const ids = (Array.isArray(plan.mutations) ? plan.mutations : []).map(m => m.id);
for (const id of new Set(ids.filter((x, i) => ids.indexOf(x) !== i))) planErrors.push(`duplicate mutation id ${id}`);
if (planErrors.length) {
  console.error(`Invalid mutation plan ${planPath} (${planErrors.length} error(s)); nothing was run:`);
  for (const e of planErrors) console.error(`  ${e}`);
  process.exit(2);
}
if (plan.sourceSha256 && plan.sourceSha256 !== sourceSha) {
  console.error(`Plan targets SAL ${plan.sourceSha256}, sandbox has ${sourceSha}; refusing to run a stale plan.`);
  process.exit(3);
}
for (const id of staleFlags) console.warn(`WARNING mutation ${id}: plan flags operatorAvailable:false but the stand implements this operator; it is run`);
const fmtValue = v => v === undefined || v === null || v === "" ? "" : "=" + (typeof v === "object" ? JSON.stringify(v) : v);
const behavioural = compiled.patterns.map(p => p.rx);
const isBehaviouralCase = id => !(plan.structuralSoftwareCheckCases ?? ["^BOOT:"]).some(s => new RegExp(s).test(id));
const env = { GIT_CEILING_DIRECTORIES: path.dirname(box.root), GIT_DIR: path.join(box.root, ".git-absent") };

async function detectors() {
  const files = resolved.files;
  const index = resultIndex(await runTestFiles(box.standRoot, files, { concurrency, env }));
  let cases = null;
  if (withSoftwareCheck) {
    // Behavioural software-check cases only (the test stages are already covered
    // by the detector files above); computed fresh, nothing read from disk reports.
    const probe = spawnSync(process.execPath, ["scripts/stand-cases-probe.js"], { cwd: box.standRoot, encoding: "utf8", env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024 });
    try { cases = new Map(JSON.parse(probe.stdout).cases.map(c => [c.id, c.status])); }
    catch { cases = new Map([["<cases-probe>", "ERROR"]]); }
  }
  return { index, cases };
}

const started = Date.now();
const baseline = await detectors();
const baselineLoadFailures = [...baseline.index.entries()].filter(([, r]) => r.status === "load-fail");
if (baselineLoadFailures.length) {
  console.error("Baseline detector files fail to load on the UNMUTATED copy; mutation results would be invalid:");
  for (const [k, r] of baselineLoadFailures) console.error(`  ${k}: ${r.message}`);
  process.exit(3);
}
const coverage = behaviouralPatternCoverage(compiled.patterns, baseline.index.keys());
if (coverage.unmatched.length) {
  console.error(`Invalid mutation plan ${planPath}: behaviouralTests pattern(s) select no test of testFiles on the unmutated copy (${baseline.index.size} tests reported); no kill could be attributed to them:`);
  for (const s of coverage.unmatched) console.error(`  ${JSON.stringify(s)}`);
  process.exit(2);
}
// Baseline-failing tests are excluded from kill detection, so a pattern that selects only
// such tests cannot kill on this source. Not an error (E2 tests are RED on canonical and are
// meant to pass on the candidate), but reported so that a run on the candidate is checked.
const passingCoverage = behaviouralPatternCoverage(compiled.patterns, [...baseline.index].filter(([, r]) => r.status === "pass").map(([k]) => k));
for (const s of passingCoverage.unmatched) console.warn(`WARNING behaviouralTests ${JSON.stringify(s)} selects ${coverage.matches[s]} test(s), none passing on the unmutated copy: it cannot kill any mutation of this source`);
if (validateOnly) {
  const applyCheck = plan.mutations.filter(m => known.has(m.op)).map(m => {
    try { const { xml, change, sgvl } = applyMutation(original, m, { sgvlXml }); return { id: m.id, op: m.op, status: "APPLIES", verification: verifyMutation(original, xml, change, { sgvlXml, mutantSgvlXml: sgvl }) }; }
    catch (error) { return { id: m.id, op: m.op, status: "CANNOT-APPLY", error: error.message }; }
  });
  const perFile = Object.fromEntries(resolved.files.map(f => [f, [...baseline.index.values()].filter(r => r.file === f).length]));
  const validation = { generatedAt: new Date().toISOString(), plan: path.relative(standRoot, planPath).replaceAll("\\", "/"), planSha256: sha(fs.readFileSync(planPath)),
    source: { salSha256: sourceSha }, patches, status: "VALID", testFiles: perFile, baselineTests: baseline.index.size,
    baselineNotPassing: [...baseline.index.entries()].filter(([, r]) => r.status !== "pass").map(([k, r]) => ({ key: k, status: r.status })),
    behaviouralPatternMatches: coverage.matches, behaviouralPatternPassingMatches: passingCoverage.matches, mutations: plan.mutations.length,
    notRun, staleOperatorFlags: staleFlags, applyCheck };
  const cannot = applyCheck.filter(a => a.status !== "APPLIES");
  if (cannot.length) validation.status = "INVALID";
  fs.writeFileSync(path.join(out, "sal-mutation-plan-validation.json"), JSON.stringify(validation, null, 1) + "\n");
  fs.rmSync(path.join(out, "sandbox"), { recursive: true, force: true });
  for (const n of notRun) console.log(`NOT-RUN (operator unavailable) ${n.id} ${n.op} ${n.block}${n.port ? "/" + n.port : ""}${fmtValue(n.value)}`);
  for (const a of cannot) console.error(`CANNOT-APPLY ${a.id} ${a.op}: ${a.error}`);
  if (cannot.length) {
    console.error(`Invalid mutation plan ${planPath}: ${cannot.length} mutation(s) cannot be applied to this source (they would be INVALID). report: ${path.join(out, "sal-mutation-plan-validation.json")}`);
    process.exit(2);
  }
  console.log(`VALID plan: ${resolved.files.length} test files, ${baseline.index.size} baseline tests (${validation.baselineNotPassing.length} not passing), ${compiled.patterns.length} behavioural patterns all matched, ${plan.mutations.length} mutations (${applyCheck.length} dry-applied and verified, not run; ${notRun.length} NOT-RUN: operator unavailable). report: ${path.join(out, "sal-mutation-plan-validation.json")}`);
  process.exit(0);
}
const results = [];
for (const mutation of plan.mutations.filter(m => !only || only.includes(m.id))) {
  const row = { id: mutation.id, guard: mutation.guard, op: mutation.op, block: mutation.block, port: mutation.port, value: mutation.value, rationale: mutation.rationale };
  const skipped = notRun.find(n => n.id === mutation.id && n.op === mutation.op);
  if (skipped) {
    row.verdict = "NOT-RUN"; row.reason = skipped.reason; results.push(row);
    console.log(`${"NOT-RUN".padEnd(15)} ${row.id} ${row.op} ${row.block}${row.port ? "/" + row.port : ""}${fmtValue(row.value)}  (${row.reason})`);
    continue;
  }
  try {
    const { xml, change, sgvl } = applyMutation(original, mutation, { sgvlXml });
    row.change = change; row.verification = verifyMutation(original, xml, change, { sgvlXml, mutantSgvlXml: sgvl });
    // rebind-global also mutates the sandbox SGVL (restored with the SAL below).
    if (sgvl !== undefined) { fs.writeFileSync(sgvlFile, sgvl); row.mutantSgvlSha256 = sha(Buffer.from(sgvl, "utf8")); }
    row.mutantSha256 = sha(Buffer.from(xml, "utf8"));
    fs.writeFileSync(salFile, xml);
    const run = await detectors();
    // Kill attribution (src/sal-mutation-kill.js): only an ASSERTION failure of a concrete test that
    // passed on baseline and is in the behavioural allowlist (or a behavioural software-check case
    // PASS -> FAIL) kills. Load/SHA/file-level/exception/hook/absent are separate categories.
    const k = attributeKills({ baselineIndex: baseline.index, runIndex: run.index, isBehaviouralName: name => behavioural.some(rx => rx.test(name)),
      baselineCases: baseline.cases, runCases: run.cases, isBehaviouralCase });
    row.newlyFailing = k.newlyFailing; row.killedBy = k.killedBy; row.categories = k.categories; row.verdict = k.verdict;
  } catch (error) {
    row.verdict = "INVALID"; row.error = error.message;
  } finally {
    fs.writeFileSync(salFile, originalBytes);
    if (sha(fs.readFileSync(salFile)) !== sourceSha) throw new Error("Sandbox SAL restore failed");
    if (sha(fs.readFileSync(sgvlFile)) !== sgvlSha) { fs.writeFileSync(sgvlFile, sgvlBytes); if (sha(fs.readFileSync(sgvlFile)) !== sgvlSha) throw new Error("Sandbox SGVL restore failed"); }
  }
  results.push(row);
  console.log(`${row.verdict.padEnd(15)} ${row.id} ${row.op} ${row.block}${row.port ? "/" + row.port : ""}${fmtValue(row.value)}` +
    (row.killedBy?.length ? `  <- ${row.killedBy.length} behavioural (e.g. ${row.killedBy[0]})` :
      row.newlyFailing?.length ? `  (${row.newlyFailing.length} non-kill: ${Object.entries(row.categories).filter(([, n]) => n).map(([c, n]) => `${c} ${n}`).join(", ")})` : row.error ? `  ${row.error}` : ""));
}

const summary = Object.fromEntries(["KILLED", "STRUCTURAL-ONLY", "SURVIVED", "INVALID", "NOT-RUN"].map(v => [v, results.filter(r => r.verdict === v).length]));
const report = { generatedAt: new Date().toISOString(), plan: path.relative(standRoot, planPath).replaceAll("\\", "/"), planSha256: sha(fs.readFileSync(planPath)),
  source: { salSha256: sourceSha, sgvlSha256: box.sha(CANONICAL.sgvl), diagramSha256: box.sha(CANONICAL.diagram), sourceRoot }, patches,
  detectors: { testFiles: plan.testFiles, resolvedTestFiles: resolved.files, behaviouralTests: plan.behaviouralTests, behaviouralPatternMatches: coverage.matches, behaviouralPatternPassingMatches: passingCoverage.matches, softwareCheck: withSoftwareCheck },
  baseline: { tests: baseline.index.size, notPassing: [...baseline.index.entries()].filter(([, r]) => r.status !== "pass").map(([k, r]) => ({ key: k, status: r.status })),
    softwareCheckNotPass: baseline.cases ? [...baseline.cases].filter(([, s]) => s !== "PASS").map(([id, s]) => ({ id, s })) : null },
  durationMs: Date.now() - started, summary, results,
  notRun: results.filter(r => r.verdict === "NOT-RUN").map(r => ({ id: r.id, op: r.op, block: r.block, port: r.port, value: r.value, reason: r.reason })), staleOperatorFlags: staleFlags,
  killRule: "KILLED only by (a) a concrete test ok on baseline and not ok on the mutant with an assertion failure (ERR_ASSERTION in the test or a failing nested subtest), in a file without file-level failure in that run, name in behaviouralTests; or (b) a non-BOOT software-check case PASS -> FAIL. Load/SHA pin/file-level ERR_TEST_FAILURE/timeout, non-assertion exceptions, hook/cancel, absent tests never kill (src/sal-mutation-kill.js).",
  limits: ["Kills are judged only by the plan's behavioural allowlist and assertion failures; STRUCTURAL-ONLY is not a kill for G3",
    "Mutations are SAL faults (guard term removed, polarity, channel mode, timing, execution order, input pair, intra-network rewire); they are a fault model, not native-saved edits (no CRC, diagram not updated)",
    "NOT-RUN mutations (operator unavailable) are neither KILLED nor SURVIVED: their guard has no mutation evidence from this run",
    "Simulator semantics limits apply (program/stand/FB_SEMANTICS.md); an equivalent mutant can survive legitimately and must be argued, not assumed"] };
fs.writeFileSync(path.join(out, "sal-mutation-report.json"), JSON.stringify(report, null, 1) + "\n");
const md = ["# SAL mutation report", "", `Plan: ${report.plan} (sha256 ${report.planSha256})`, `SAL ${sourceSha}`, `SGVL ${report.source.sgvlSha256}`, `diagram ${report.source.diagramSha256}`,
  `Summary: ${JSON.stringify(summary)}; baseline detector tests ${baseline.index.size} (${report.baseline.notPassing.length} not passing on unmutated copy)`, `Non-kill categories over all mutations: ${JSON.stringify(Object.fromEntries(CATEGORIES.map(c => [c, results.reduce((n, r) => n + (r.categories?.[c] ?? 0), 0)])))}`, "", `Kill rule: ${report.killRule}`, "",
  "| ID | guard | mutation | verdict | behavioural killers (count / first) | load/SHA/file-level ERROR | exception (non-assert) | hook/cancel | absent | non-behavioural assert | software-check structural/error |", "|---|---|---|---|---|---|---|---|---|---|---|",
  ...results.filter(r => r.verdict !== "NOT-RUN").map(r => `| ${r.id} | ${r.guard ?? ""} | ${r.op} ${r.block}${r.port ? "/" + r.port : ""}${fmtValue(r.value).replaceAll("|", "/")} | ${r.verdict}${r.error ? " (" + r.error + ")" : ""} | ${r.killedBy?.length ?? 0}${r.killedBy?.length ? " / " + r.killedBy[0].replaceAll("|", "/") : ""} | ${r.categories?.["file-level"] ?? 0} | ${r.categories?.exception ?? 0} | ${r.categories?.["hook-cancel"] ?? 0} | ${r.categories?.absent ?? 0} | ${r.categories?.["non-behavioural-assertion"] ?? 0} | ${(r.categories?.["swcheck-structural"] ?? 0) + (r.categories?.["swcheck-error"] ?? 0)} |`),
  "", `NOT-RUN (operator unavailable; neither KILLED nor SURVIVED): ${report.notRun.length}${report.notRun.length ? " - " + report.notRun.map(n => n.id).join(", ") : ""}`,
  ...(report.notRun.length ? ["", "| ID | mutation | reason |", "|---|---|---|", ...report.notRun.map(n => `| ${n.id} | ${n.op} ${n.block}${n.port ? "/" + n.port : ""}${fmtValue(n.value).replaceAll("|", "/")} | ${n.reason} |`)] : []),
  "", ...report.limits.map(l => `- ${l}`), ""];
fs.writeFileSync(path.join(out, "sal-mutation-report.md"), md.join("\n"));
fs.rmSync(path.join(out, "sandbox"), { recursive: true, force: true });
const executed = results.filter(r => r.verdict !== "NOT-RUN");
if (summary["NOT-RUN"]) console.log(`NOT-RUN (operator unavailable): ${summary["NOT-RUN"]} - ${results.filter(r => r.verdict === "NOT-RUN").map(r => r.id).join(", ")}`);
console.log(`\n${JSON.stringify(summary)}  report: ${path.join(out, "sal-mutation-report.md")}`);
process.exitCode = !executed.every(r => r.verdict === "KILLED") ? 1 : summary["NOT-RUN"] ? 4 : 0;
