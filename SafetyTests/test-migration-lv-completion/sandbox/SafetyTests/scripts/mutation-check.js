import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const mutations = [
  {
    id: "M01",
    name: "C2 opens before discharge is complete",
    file: "src/safety-model.js",
    from: "Mode.STARTING_RUN, Mode.RUN, Mode.STOPPING_SS1, Mode.STO_COAST, Mode.DISCHARGING,",
    to: "Mode.STARTING_RUN, Mode.RUN, Mode.STOPPING_SS1, Mode.STO_COAST,"
  },
  {
    id: "M02",
    name: "Healthy loss during SS1 is ignored",
    file: "src/safety-model.js",
    from: "if (!i.healthy) this.enter(Mode.STO_COAST);",
    to: "if (!i.healthy) { /* MUTANT: ignored */ }"
  },
  {
    id: "M03",
    name: "Safe can rise with an open and unlocked cover",
    file: "src/safety-model.js",
    from: "if (gesture.stepUp && i.coverClosed && i.coverLocked &&\n            i.lvConnectorInterlock && i.hvConnectorInterlock && !i.criticalFault) {",
    to: "if (gesture.stepUp && i.lvConnectorInterlock && i.hvConnectorInterlock && !i.criticalFault) {"
  },
  {
    id: "M04",
    name: "Two-button attempt degrades into a single blue command",
    file: "src/button-recognizer.js",
    from: "// It can never degrade into a single-button command.\n        this.elapsed = 0;",
    to: "// MUTANT: incorrectly downgrade to a remaining single button.\n        this.state = blue ? ButtonState.BLUE : ButtonState.GREEN;\n        this.elapsed = 0;"
  },
  {
    id: "M05",
    name: "Run is entered without C2 ON feedback",
    file: "src/safety-model.js",
    from: "else if (i.c2Feedback) this.enter(Mode.RUN);",
    to: "else if (true) this.enter(Mode.RUN);"
  }
];

function runTests(cwd) {
  return spawnSync(process.execPath, ["--test", "test/button-recognizer.test.js", "test/safety-model.test.js"], { cwd, encoding: "utf8" });
}

const baseline = runTests(root);
if (baseline.status !== 0) {
  console.error("Baseline tests are not green; mutation result would be invalid.");
  console.error(baseline.stdout);
  console.error(baseline.stderr);
  process.exit(2);
}

const results = [];
for (const mutation of mutations) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), `men001-${mutation.id}-`));
  try {
    fs.cpSync(path.join(root, "src"), path.join(temp, "src"), { recursive: true });
    fs.cpSync(path.join(root, "test"), path.join(temp, "test"), { recursive: true });
    fs.copyFileSync(path.join(root, "package.json"), path.join(temp, "package.json"));

    const target = path.join(temp, mutation.file);
    const original = fs.readFileSync(target, "utf8").replace(/\r\n/g, "\n");
    if (!original.includes(mutation.from)) throw new Error(`${mutation.id}: mutation anchor not found`);
    fs.writeFileSync(target, original.replace(mutation.from, mutation.to));

    const testRun = runTests(temp);
    const failedTests = [...testRun.stdout.matchAll(/^not ok \d+ - (.+)$/gm)].map(match => match[1]);
    if (testRun.error || testRun.status === null || /ERR_MODULE_NOT_FOUND|ENOENT|SyntaxError/.test(testRun.stderr)) {
      throw new Error(`${mutation.id}: test infrastructure failed: ${testRun.error?.message ?? testRun.stderr}`);
    }
    const detected = testRun.status !== 0 && failedTests.length > 0;
    results.push({ id: mutation.id, name: mutation.name, detected, failedTests });
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

for (const result of results) {
  console.log(`${result.detected ? "DETECTED" : "SURVIVED"} ${result.id}: ${result.name}`);
  if (result.failedTests.length) console.log(`  failing tests: ${result.failedTests.join("; ")}`);
}

const survived = results.filter(result => !result.detected);
console.log(`\nMutation score: ${results.length - survived.length}/${results.length} detected`);
if (survived.length) process.exitCode = 1;
