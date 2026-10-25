// E0 stand: proves that test/stand-fb-semantics.test.js (Beckhoff-documented
// FB oracle) is discriminating: each semantic fault injected into a temporary
// copy of src/sal-runtime.js must make that test file fail.
// Usage: node scripts/stand-fb-mutation-check.js   Exit 0 = all killed.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mutants = [
  ["NO contact not negated (§4.1.1/§4.2.1/§4.10.2)", 'return port.deactivate1 === "Make Contact (NO)" ? !raw : raw;', "return raw;"],
  ["deactivated AND/OR inputs counted (§4.1.2 'active inputs')", "activePorts(block.inputs).map(port => this.read(port))", "block.inputs.map(port => this.values.has(port.path) ? this.read(port) : true)"],
  ["RS set-dominant (§4.10.1)", "const value = reset ? false : set ? true : previous;", "const value = set ? true : reset ? false : previous;"],
  ["TON keeps elapsed time after input drop (§4.12.1)", "const elapsedMs = enabled ? (previous.previousEnabled ? previous.elapsedMs + dtMs : 0) : 0;", "const elapsedMs = enabled ? previous.elapsedMs + dtMs : previous.elapsedMs;"],
  ["ESTOP enables on Restart level (§4.4.4 falling edge)", "const enabled = safe && (previous.enabled || (previous.restartArmed && !restart));", "const enabled = safe && (previous.enabled || restart);"],
  ["ESTOP automatic restart (§4.4.1)", "const enabled = safe && (previous.enabled || (previous.restartArmed && !restart));", "const enabled = safe;"],
  ["ESTOP EStopDelOut without off-delay (§4.4.1 DELAYOUT)", "const delayed = enabled || (previous.delayed && offElapsedMs < configuredDelay);", "const delayed = enabled;"],
  ["DECOUPLE not one-to-one (§4.6.1)", "block.outputs.forEach((output, index) => this.write(output, this.read(block.inputs[index])));", "block.outputs.forEach((output, index) => this.write(output, this.read(block.inputs[(index + 1) % 8])));"],
  ["execution order reversed (§3.1)", ".sort((a, b) => a.orderOfExecution - b.orderOfExecution);\n      for (const block of ordered) this.evaluate(block, dtMs);\n      return this;", ".sort((a, b) => b.orderOfExecution - a.orderOfExecution);\n      for (const block of ordered) this.evaluate(block, dtMs);\n      return this;"]
];

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "men001-fbmut-"));
let survived = 0;
try {
  fs.cpSync(path.join(root, "src"), path.join(temp, "src"), { recursive: true });
  fs.mkdirSync(path.join(temp, "test"));
  fs.copyFileSync(path.join(root, "test/stand-fb-semantics.test.js"), path.join(temp, "test/stand-fb-semantics.test.js"));
  fs.copyFileSync(path.join(root, "package.json"), path.join(temp, "package.json"));
  const target = path.join(temp, "src/sal-runtime.js");
  const original = fs.readFileSync(target, "utf8").replace(/\r\n/g, "\n");
  const run = () => spawnSync(process.execPath, ["--test", "--test-reporter=tap", "test/stand-fb-semantics.test.js"], { cwd: temp, encoding: "utf8" });
  fs.writeFileSync(target, original);
  const base = run();
  if (base.status !== 0) { console.error("Baseline stand-fb-semantics is not green; result invalid.\n" + base.stdout.slice(-2000)); process.exit(3); }
  for (const [name, from, to] of mutants) {
    if (original.split(from).length !== 2) { console.log(`INVALID   ${name}: anchor not unique/absent`); survived += 1; continue; }
    fs.writeFileSync(target, original.replace(from, to));
    const r = run();
    const fails = Number(r.stdout.match(/^# fail (\d+)/m)?.[1] ?? 0);
    if (fails > 0) console.log(`KILLED    ${name} (${fails} failing)`); else { survived += 1; console.log(`SURVIVED  ${name}`); }
  }
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
console.log(`\n${mutants.length - survived}/${mutants.length} runtime semantic mutants killed`);
process.exitCode = survived ? 1 : 0;
