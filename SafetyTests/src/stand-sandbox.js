// E0 stand: isolated copy of the executable test closure (no .git, no sibling
// reference repository). Used by the SAL mutation runner and by the
// reproducibility check. Read-only with respect to the working tree: it only
// copies FROM the repository INTO a caller-supplied destination outside it.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
export const standRoot = path.join(repoRoot, "SafetyTests");
export const CANONICAL = Object.freeze({
  sal: "MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal",
  sgvl: "MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl",
  diagram: "MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal.diagram"
});

// Closure measured by tracing every fs/import/child-process access of the
// complete test/*.test.js suite (E0-stand/TRACE_CLOSURE.md). Root-level JSON
// and Markdown of SafetyTests are copied wholesale (small, read by tests and
// software-check). Large historical evidence folders are deliberately absent:
// a test that silently needs them must fail in the sandbox, not pass.
export const CLOSURE = Object.freeze({
  directories: [
    "SafetyTests/src", "SafetyTests/test", "SafetyTests/scripts", "SafetyTests/fixtures",
    "MEN001_Dyno/Safety_Dyno/TwinSafeGroup1", "MEN001_Dyno/Safety_Dyno/GVLs"
  ],
  files: [
    "SafetyTests/package.json",
    "SafetyTests/resumed-development-2026-10-21/architect/P0_REBASE_LEDGER.json",
    // read by test/helpers/v2-structural.js -> scripts/f1-delta-check.mjs since the F1 transfer (0391fae)
    "SafetyTests/resumed-development-2026-10-21/architect/F1_RUN_RECOGNIZER_PLAN.json",
    "SafetyTests/resumed-development-2026-10-21/tester/p0/check-source-pair.mjs",
    // default plan of scripts/sal-mutation-check.js, read by test/stand-sal-mutation-plan.test.js
    "SafetyTests/program/stand/E0-stand/sal-mutation-plan.pilot.json",
    // read by test/stand-expected-deltas.test.js (D2, m-10: F1 approved current renames listed in m-8)
    "SafetyTests/program/tester/E2-G1/HANDOFF_v5.md",
    // read by test/stand-expected-deltas.test.js (D1, reviewer G1 v6 §2: 16 EARLYSTO renames from the HANDOFF_v6 fragment)
    "SafetyTests/program/tester/E2-G1/HANDOFF_v6.md",
    // read by test/stand-expected-deltas.test.js (D-v7, reviewer G1 v7 §3: 3 V2ID moves from the HANDOFF_v7 fragment)
    "SafetyTests/program/tester/E2-G1/HANDOFF_v7.md"
  ],
  rootGlobs: [/\.json$/i, /\.md$/i]
});

export const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

function copyTree(from, to, skip) {
  fs.cpSync(from, to, { recursive: true, filter: source => !skip(source) });
}

/**
 * Create an isolated copy. Options:
 *  dest      absolute directory (must not exist or be empty; must be outside repoRoot)
 *  overlays  { "<repo-relative path>": Buffer|string|{ from: absolutePath } } written after copying
 *  removes   [repo-relative paths] deleted after copying (e.g. to prove absence of a dependency)
 */
export function createSandbox({ dest, overlays = {}, removes = [] } = {}) {
  if (!dest || !path.isAbsolute(dest)) throw new Error("Sandbox destination must be an absolute path");
  const resolved = path.resolve(dest);
  const rel = path.relative(repoRoot, resolved);
  if (!rel.startsWith("..") && !path.isAbsolute(rel)) throw new Error("Sandbox must be outside the repository");
  if (fs.existsSync(resolved) && fs.readdirSync(resolved).length) throw new Error(`Sandbox destination not empty: ${resolved}`);
  fs.mkdirSync(resolved, { recursive: true });
  const skip = source => /(^|[\\/])(\.git|node_modules)([\\/]|$)/.test(source);
  for (const dir of CLOSURE.directories) copyTree(path.join(repoRoot, dir), path.join(resolved, dir), skip);
  for (const file of CLOSURE.files) {
    fs.mkdirSync(path.dirname(path.join(resolved, file)), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, file), path.join(resolved, file));
  }
  for (const name of fs.readdirSync(standRoot)) {
    const full = path.join(standRoot, name);
    if (fs.statSync(full).isFile() && CLOSURE.rootGlobs.some(rx => rx.test(name)))
      fs.copyFileSync(full, path.join(resolved, "SafetyTests", name));
  }
  for (const [file, content] of Object.entries(overlays)) {
    const target = path.join(resolved, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (content && typeof content === "object" && !Buffer.isBuffer(content) && content.from) fs.copyFileSync(content.from, target);
    else fs.writeFileSync(target, content);
  }
  for (const file of removes) fs.rmSync(path.join(resolved, file), { recursive: true, force: true });
  if (fs.existsSync(path.join(resolved, ".git"))) throw new Error("Sandbox unexpectedly contains .git");
  return {
    root: resolved,
    standRoot: path.join(resolved, "SafetyTests"),
    sha: file => sha256(fs.readFileSync(path.join(resolved, file)))
  };
}

/** Test files grouped exactly like scripts/software-check.js (excluded group kept separate). */
export function suiteFiles(standDir) {
  return fs.readdirSync(path.join(standDir, "test")).filter(f => f.endsWith(".test.js")).sort();
}

/**
 * Parse node --test TAP into top-level results plus totals. Names are top-level subtests.
 * Each failing result carries the YAML diagnostics of its own line (failureType, code,
 * message) and `leaves`: the failing nested subtests reported (indented) before it, so
 * that a kill can be attributed to an assertion and not to a hook, cancel or exception.
 */
export function parseTap(stdout) {
  const results = [];
  const lines = stdout.split(/\r?\n/);
  const unquote = s => s.trim().replace(/^'(.*)'$/s, "$1");
  function diagnostics(i, indent) {
    const d = { failureType: "", code: "", message: "" };
    for (let j = i + 1; j < Math.min(lines.length, i + 60); j += 1) {
      if (/^\s*(not ok|ok) \d+ - /.test(lines[j]) || new RegExp(`^ {${indent + 2}}\\.\\.\\.$`).test(lines[j])) break;
      const kv = lines[j].match(new RegExp(`^ {${indent + 2}}(failureType|code|error): ?(.*)$`));
      if (!kv) continue;
      if (kv[1] === "error") {
        const block = /^[|>][-+]?$/.test(kv[2].trim());
        d.message = (block ? (lines[j + 1] ?? "").trim() : unquote(kv[2])).slice(0, 300);
      } else d[kv[1]] = unquote(kv[2]);
    }
    return d;
  }
  let leaves = [];
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^( *)(not ok|ok) \d+ - (.*?)(?: # (SKIP|TODO).*)?$/);
    if (!m) continue;
    const indent = m[1].length;
    const status = m[4] === "SKIP" ? "skip" : m[2] === "ok" ? "pass" : "fail";
    const d = status === "fail" ? diagnostics(i, indent) : { failureType: "", code: "", message: "" };
    if (indent > 0) { if (status === "fail") leaves.push({ name: m[3], depth: indent / 4, ...d }); continue; }
    results.push({ name: m[3], status, message: d.message, failureType: d.failureType, code: d.code, leaves: status === "fail" ? leaves : [] });
    leaves = [];
  }
  const count = key => Number(stdout.match(new RegExp(`^# ${key} (\\d+)`, "m"))?.[1] ?? 0);
  return { results, totals: { tests: count("tests"), pass: count("pass"), fail: count("fail"), skipped: count("skipped") } };
}

/** True for a node --test entry name that is a test file path (file-level entry, not a test). */
export const isTestFilePath = name => /\.test\.js$/.test(String(name).replace(/\\/g, "/"));

const withoutTestContext = e => { const { NODE_TEST_CONTEXT, ...rest } = e; return rest; };

/**
 * Run each test file in its own `node --test` process (bounded concurrency) so
 * that every result is attributed to its file and a module-load failure is
 * distinguishable from an assertion failure inside a test.
 */
export async function runTestFiles(standDir, files, { concurrency = 4, env = {}, timeoutMs = 600000 } = {}) {
  const { spawn } = await import("node:child_process");
  const out = new Map();
  const queue = [...files];
  async function worker() {
    while (queue.length) {
      const file = queue.shift();
      const started = Date.now();
      const result = await new Promise(resolve => {
        const child = spawn(process.execPath, ["--test", "--test-reporter=tap", `test/${file}`],
          // NODE_TEST_CONTEXT is removed: when the caller itself runs under `node --test`
          // (stand tests of this runner), an inherited context makes the child report to
          // the parent runner instead of printing TAP, i.e. zero parsed results.
          { cwd: standDir, env: { ...withoutTestContext(process.env), ...env, NODE_OPTIONS: "", SAL_TEST_FILE: file }, windowsHide: true });
        let stdout = "", stderr = "";
        let timedOut = false;
        const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
        child.stdout.on("data", d => { stdout += d; });
        child.stderr.on("data", d => { stderr += d; });
        child.on("close", code => { clearTimeout(timer); resolve({ code, stdout, stderr, timedOut }); });
      });
      const tap = parseTap(result.stdout);
      // A failing top-level entry named after a test file is a FILE-LEVEL failure
      // (import throw, uncaught exception / async activity after the tests): never a
      // test verdict. node --test reports a file that throws at import as a single
      // such entry; treat that (or no TAP at all with a non-zero exit) as LOAD failure.
      for (const r of tap.results) r.fileLevel = r.status === "fail" && isTestFilePath(r.name);
      const fileLevelFailures = tap.results.filter(r => r.fileLevel).map(r => r.name);
      // When a test of the file already failed, node reports an uncaught exception /
      // unhandled rejection after the tests only as a TAP comment, not as a file entry.
      const asyncError = result.stdout.match(/^# Error: (A resource generated asynchronous activity after the test ended[^\n]*|[^\n]*(uncaughtException|unhandledRejection)[^\n]*)$/m);
      if (asyncError) fileLevelFailures.push(`<async-error> ${asyncError[1].slice(0, 200)}`);
      const loadFailure = (tap.results.length === 1 && tap.results[0].fileLevel) ||
        (tap.results.length === 0 && result.code !== 0);
      out.set(file, { file, exitCode: result.code, timedOut: result.timedOut, fileLevelFailures, durationMs: Date.now() - started, loadFailure,
        loadMessage: loadFailure ? (result.stdout.match(/^#\s+(Error|AssertionError|SyntaxError|TypeError)[^\n]*/m)?.[0] ?? tap.results[0]?.message ?? `exit ${result.code}, no TAP results`) : "",
        ...tap, stderr: result.stderr.slice(0, 2000) });
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  return files.map(f => out.get(f));
}

/** Flatten per-file results to "file :: test name#n" keys (n disambiguates repeated names). */
export function resultIndex(fileResults) {
  const index = new Map();
  for (const fr of fileResults) {
    const seen = new Map();
    if (fr.loadFailure) { index.set(`${fr.file} :: <module load>`, { status: "load-fail", message: fr.loadMessage, file: fr.file }); continue; }
    const asyncError = (fr.fileLevelFailures ?? []).find(f => f.startsWith("<async-error>"));
    if (asyncError) index.set(`${fr.file} :: <async-error>`, { status: "file-error", fileLevel: true, message: asyncError, file: fr.file });
    if (fr.timedOut) index.set(`${fr.file} :: <timeout>`, { status: "file-error", fileLevel: true, message: "test file process killed by timeout", file: fr.file });
    for (const r of fr.results) {
      const n = (seen.get(r.name) ?? 0) + 1; seen.set(r.name, n);
      index.set(`${fr.file} :: ${r.name}${n > 1 ? `#${n}` : ""}`, { ...r, file: fr.file });
    }
  }
  return index;
}
