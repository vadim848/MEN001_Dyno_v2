// E2 stand (E2-runner-ops): structural mutation operators swap-order,
// deactivate-input-pair and rewire change exactly the declared thing (proved
// on the re-parsed model, plus SAL/SGVL binding validation) and refuse
// ambiguous/unsupported targets. The runner reports plan mutations whose
// operator the stand lacks as NOT-RUN (neither KILLED nor SURVIVED, exit 4).
// Operator tests read the frozen F1 copy fixtures/stand-f1-04b45456 (SHA-pinned), not the
// canonical SAL: E2 slices (e.g. E2a-RC rewiring FBTon3 -> FBAnd6.AndIn1) change canonical/candidate
// graphs and must not turn an operator self-test into a PASS->FAIL. Same graph, same assertions.
// The runner tests below run on the sandboxed canonical source (their verdicts do not depend on it).
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { applyMutation, verifyMutation, listBlocks, operatorNames } from "../../src/sal-mutations.js";
import { parseSalFile } from "../../src/sal-parser.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const F1_SAL_SHA = "04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3";
const F1_SGVL_SHA = "dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104";
const salPath = fileURLToPath(new URL("../../fixtures/stand-f1-04b45456/TwinSafeGroup1.sal", import.meta.url));
const sgvlPath = fileURLToPath(new URL("../../fixtures/stand-f1-04b45456/GVL1.sgvl", import.meta.url));
const salBytes = fs.readFileSync(salPath), sgvlBytes = fs.readFileSync(sgvlPath);
const sha256 = b => crypto.createHash("sha256").update(b).digest("hex");
const xml = salBytes.toString("utf8");
const sgvlXml = sgvlBytes.toString("utf8");

test("STAND-MUTOPS operator fixture is the frozen F1 pair (SHA-pinned, independent of canonical/candidate)", () => {
  assert.equal(sha256(salBytes), F1_SAL_SHA);
  assert.equal(sha256(sgvlBytes), F1_SGVL_SHA);
});
const sequence = x => [...listBlocks(x)].sort((a, b) => a.order - b.order).map(b => b.path);
function parse(text) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "men001-mutops-"));
  try { fs.writeFileSync(path.join(dir, "m.sal"), text); return parseSalFile(path.join(dir, "m.sal"), { bindingMode: "fixture" }); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
const port = (model, p) => model.networks.flatMap(n => n.blocks).flatMap(b => [...b.inputs, ...b.outputs]).find(x => x.path === p);

test("STAND-MUTOPS operator registry includes the three structural operators", () => {
  for (const op of ["swap-order", "deactivate-input-pair", "rewire"]) assert.ok(operatorNames().includes(op), op);
});

test("STAND-MUTOPS swap-order moveAfter: X directly after anchor, every other block keeps its relative order, value multiset kept", () => {
  const m = { id: "T-MOVE", op: "swap-order", block: "//Network1/FBAnd1", value: { moveAfter: "//Network1/FBEstop1" } };
  const { xml: mutant, change } = applyMutation(xml, m);
  const before = sequence(xml), after = sequence(mutant);
  assert.notEqual(before.indexOf(m.block), before.indexOf(m.value.moveAfter) + 1, "precondition: not already directly after");
  assert.equal(after.indexOf(m.block), after.indexOf(m.value.moveAfter) + 1);
  assert.deepEqual(after.filter(p => p !== m.block), before.filter(p => p !== m.block));
  assert.deepEqual(listBlocks(mutant).map(b => b.order).sort((a, b) => a - b), listBlocks(xml).map(b => b.order).sort((a, b) => a - b));
  const v = verifyMutation(xml, mutant, change, { sgvlXml });
  assert.equal(v.bindingValidation, "PASS");
  assert.equal(v.movedBlocks, change.moved.length);
  assert.equal(applyMutation(xml, m).xml, mutant, "deterministic");
  // moveBefore mirrors it
  const back = applyMutation(xml, { op: "swap-order", block: "//Network1/FBEstop1", value: { moveBefore: "//Network1/FBAnd1" } });
  const seq2 = sequence(back.xml);
  assert.equal(seq2.indexOf("//Network1/FBEstop1") + 1, seq2.indexOf("//Network1/FBAnd1"));
  assert.ok(verifyMutation(xml, back.xml, back.change));
});

test("STAND-MUTOPS swap-order swapWith exchanges exactly two orderOfExecution values", () => {
  const { xml: mutant, change } = applyMutation(xml, { op: "swap-order", block: "//Network1/FBAnd1", value: { swapWith: "//Network1/FBEstop1" } });
  assert.equal(change.moved.length, 2);
  const [a, b] = change.moved;
  assert.equal(a.before, b.after); assert.equal(a.after, b.before);
  assert.deepEqual(verifyMutation(xml, mutant, change).parsedDelta, ["//Network1/FBAnd1#block", "//Network1/FBEstop1#block"]);
});

test("STAND-MUTOPS swap-order refuses no-op, unknown blocks, ambiguous value and duplicate orders", () => {
  const seq = sequence(xml);
  const [first, second] = seq;
  assert.throws(() => applyMutation(xml, { op: "swap-order", block: second, value: { moveAfter: first } }), /no-op/);
  assert.throws(() => applyMutation(xml, { op: "swap-order", block: "//Network1/NoSuch", value: { moveAfter: first } }), /not found/);
  assert.throws(() => applyMutation(xml, { op: "swap-order", block: first, value: { moveAfter: "//Network1/NoSuch" } }), /not found/);
  assert.throws(() => applyMutation(xml, { op: "swap-order", block: first, value: { moveAfter: second, swapWith: second } }), /exactly one of/);
  assert.throws(() => applyMutation(xml, { op: "swap-order", block: first, value: { moveAfter: first } }), /same/);
  const firstOrder = listBlocks(xml).find(b => b.path === first).order, secondOrder = listBlocks(xml).find(b => b.path === second).order;
  const dup = xml.replace(`orderOfExecution="${secondOrder}"`, `orderOfExecution="${firstOrder}"`);
  assert.throws(() => applyMutation(dup, { op: "swap-order", block: first, value: { swapWith: seq.at(-1) } }), /not unique/);
});

test("STAND-MUTOPS deactivate-input-pair changes exactly two channelInterface attributes of one AND", () => {
  const m = { op: "deactivate-input-pair", block: "//Network12/FBAnd6", port: "AndIn1+AndIn2" };
  const { xml: mutant, change } = applyMutation(xml, m);
  const v = verifyMutation(xml, mutant, change, { sgvlXml });
  assert.deepEqual(v.parsedDelta, ["//Network12/FBAnd6/AndIn1", "//Network12/FBAnd6/AndIn2"]);
  assert.equal(v.bindingValidation, "PASS");
  assert.throws(() => applyMutation(xml, { ...m, port: "AndIn1" }), /two distinct/);
  assert.throws(() => applyMutation(xml, { ...m, port: "AndIn1+AndIn1" }), /two distinct/);
  assert.throws(() => applyMutation(xml, { ...m, port: "AndIn1+AndIn8" }), /not Activated/);
  assert.throws(() => applyMutation(xml, { ...m, block: "//Network12/FBTon3", port: "TonIn+TonIn2" }), /only for safeAnd\/safeOr/);
  // FBAnd8 has exactly two active inputs: an AND without any active input has no defined semantics here
  assert.throws(() => applyMutation(xml, { ...m, block: "//Network12/FBAnd8", port: "AndIn1+AndIn2" }), /without any active input/);
});

test("STAND-MUTOPS rewire re-feeds one input from another outPort of the same network, nothing else changes", () => {
  for (const [source, emptiedOld] of [["//Network12/FBAnd16/AndOut", true], ["//Network12/FBDecouple2/DecOut6", true]]) {
    const m = { id: "T-RW", op: "rewire", block: "//Network12/FBAnd6", port: "AndIn1", value: { source } };
    const { xml: mutant, change } = applyMutation(xml, m);
    assert.equal(change.before, "//Network12/FBTon3/TonOut");
    const v = verifyMutation(xml, mutant, change, { sgvlXml });
    assert.deepEqual(v.parsedDelta, ["//Network12/FBAnd6/AndIn1", "//Network12/FBTon3/TonOut", source].sort());
    assert.equal(v.bindingValidation, "PASS");
    const model = parse(mutant);
    assert.deepEqual(port(model, "//Network12/FBAnd6/AndIn1").sources, [source]);
    assert.ok(port(model, source).targets.includes("//Network12/FBAnd6/AndIn1"));
    assert.equal(port(model, "//Network12/FBTon3/TonOut").targets.length, 0);
    if (emptiedOld) assert.equal(mutant.split(change.wireId).length, 2, "exactly one new wiredLink");
    assert.equal(applyMutation(xml, m).xml, mutant, "deterministic wire Id and text");
  }
});

test("STAND-MUTOPS rewire refuses cross-network, Symbol/alias-bound, unconnected, self-feed and no-op targets", () => {
  const rw = (block, p, source) => applyMutation(xml, { op: "rewire", block, port: p, value: { source } });
  assert.throws(() => rw("//Network12/FBAnd6", "AndIn1", "//Network1/FBAnd1/AndOut"), /cross-network/);
  assert.throws(() => rw("//Network12/FBAnd1", "AndIn1", "//Network12/FBAnd16/AndOut"), /bound by a Symbol/);
  assert.throws(() => rw("//Network12/FBAnd6", "AndIn2", "//Network12/FBAnd16/AndOut"), /exactly one wiredLink/);
  assert.throws(() => rw("//Network12/FBAnd6", "AndIn1", "//Network12/FBAnd6/AndOut"), /own input/);
  assert.throws(() => rw("//Network12/FBAnd6", "AndIn1", "//Network12/FBTon3/TonOut"), /no-op/);
  assert.throws(() => applyMutation(xml, { op: "rewire", block: "//Network12/FBAnd6", port: "AndIn1" }), /value\.source/);
});

test("STAND-MUTOPS verification rejects an undeclared extra change for every structural kind", () => {
  const extra = x => applyMutation(x, { op: "deactivate-input", block: "//Network12/FBAnd16", port: "AndIn1" }).xml;
  for (const m of [
    { op: "swap-order", block: "//Network1/FBAnd1", value: { swapWith: "//Network1/FBEstop1" } },
    { op: "deactivate-input-pair", block: "//Network12/FBAnd6", port: "AndIn1+AndIn2" },
    { op: "rewire", block: "//Network12/FBAnd6", port: "AndIn1", value: { source: "//Network12/FBDecouple2/DecOut6" } }
  ]) {
    const { xml: mutant, change } = applyMutation(xml, m);
    assert.throws(() => verifyMutation(xml, extra(mutant), change), /Parsed delta mismatch/, m.op);
  }
  // a declared order that is not the parsed one is rejected as well
  const { xml: mutant, change } = applyMutation(xml, { op: "swap-order", block: "//Network1/FBAnd1", value: { moveAfter: "//Network1/FBEstop1" } });
  assert.throws(() => verifyMutation(xml, mutant, { ...change, sequenceAfter: sequence(xml) }), /sequence differs/);
});

test("STAND-MUTOPS binding validation: a mutant that breaks SAL/SGVL bindings is refused when the source passes", () => {
  const { xml: mutant, change } = applyMutation(xml, { op: "deactivate-input", block: "//Network12/FBAnd16", port: "AndIn1" });
  const broken = mutant.replace(/(<fbPortGlobalVariableReference\b[^>]*variableId=")[^"]+"/, "$1" + "00000000-0000-0000-0000-000000000000\"");
  assert.notEqual(broken, mutant);
  assert.throws(() => verifyMutation(xml, broken, change, { sgvlXml }), /binding validation|Parsed delta mismatch/);
});

// ---------- runner: NOT-RUN category ----------
const runner = path.join(root, "scripts", "sal-mutation-check.js");
function runCli(name, plan, extra = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `men001-mutops-${name}-`));
  const planPath = path.join(dir, "plan.json");
  fs.writeFileSync(planPath, JSON.stringify(plan));
  const r = spawnSync(process.execPath, [runner, "--plan", planPath, "--out", path.join(dir, "out"), "--concurrency", "1", ...extra],
    { cwd: root, encoding: "utf8", env: { ...process.env, NODE_OPTIONS: "" }, timeout: 300000 });
  return { ...r, dir };
}
const basePlan = { version: "sal-mutation-plan-v1", testFiles: ["stand-fb-semantics.test.js"], behaviouralTests: ["^FB-AND "] };
const notRunMutation = { id: "T-NR", guard: "Order", op: "no-such-operator", block: "//Network1/FBAnd1", port: "", operatorAvailable: false, value: { moveAfter: "//Network1/FBEstop1" } };

test("STAND-MUTOPS runner --validate-only lists NOT-RUN mutations and dry-applies the runnable ones (exit 0)", { timeout: 300000 }, () => {
  const r = runCli("val", { ...basePlan, mutations: [notRunMutation, { id: "T-SW", op: "swap-order", block: "//Network1/FBAnd1", operatorAvailable: false, value: { swapWith: "//Network1/FBEstop1" } }] }, ["--validate-only"]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /NOT-RUN \(operator unavailable\) T-NR no-such-operator/);
  assert.match(r.stdout, /1 NOT-RUN: operator unavailable/);
  assert.match(r.stderr, /WARNING mutation T-SW: plan flags operatorAvailable:false but the stand implements this operator/);
  const v = JSON.parse(fs.readFileSync(path.join(r.dir, "out", "sal-mutation-plan-validation.json"), "utf8"));
  assert.deepEqual(v.notRun.map(n => n.id), ["T-NR"]);
  assert.deepEqual(v.staleOperatorFlags, ["T-SW"]);
  assert.deepEqual(v.applyCheck.map(a => [a.id, a.status]), [["T-SW", "APPLIES"]]);
  fs.rmSync(r.dir, { recursive: true, force: true });
});

test("STAND-MUTOPS runner: only NOT-RUN mutations -> exit 4, NOT-RUN row and separate line, never KILLED/SURVIVED", { timeout: 300000 }, () => {
  const r = runCli("nr", { ...basePlan, mutations: [notRunMutation] });
  assert.equal(r.status, 4, r.stdout + r.stderr);
  const rep = JSON.parse(fs.readFileSync(path.join(r.dir, "out", "sal-mutation-report.json"), "utf8"));
  assert.deepEqual(rep.summary, { KILLED: 0, "STRUCTURAL-ONLY": 0, SURVIVED: 0, INVALID: 0, "NOT-RUN": 1 });
  assert.equal(rep.results[0].verdict, "NOT-RUN");
  assert.equal(rep.results[0].newlyFailing, undefined, "no detector run attributed to a NOT-RUN mutation");
  assert.match(rep.results[0].reason, /operator unavailable/);
  const md = fs.readFileSync(path.join(r.dir, "out", "sal-mutation-report.md"), "utf8");
  assert.match(md, /NOT-RUN \(operator unavailable; neither KILLED nor SURVIVED\): 1 - T-NR/);
  fs.rmSync(r.dir, { recursive: true, force: true });
});

test("STAND-MUTOPS runner: NOT-RUN does not mask a SURVIVED mutation (exit 1) and an unflagged unknown operator is a plan error (exit 2)", { timeout: 300000 }, () => {
  const r = runCli("mix", { ...basePlan, mutations: [notRunMutation, { id: "T-SW", op: "swap-order", block: "//Network1/FBAnd1", value: { swapWith: "//Network1/FBEstop1" } }] });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  const rep = JSON.parse(fs.readFileSync(path.join(r.dir, "out", "sal-mutation-report.json"), "utf8"));
  assert.equal(rep.summary["NOT-RUN"], 1);
  assert.equal(rep.results.find(x => x.id === "T-SW").verdict, "SURVIVED", "FB unit tests do not read the SAL: the order mutant survives");
  assert.equal(rep.results.find(x => x.id === "T-SW").verification.bindingValidation, "PASS");
  fs.rmSync(r.dir, { recursive: true, force: true });
  const bad = runCli("unk", { ...basePlan, mutations: [{ ...notRunMutation, operatorAvailable: undefined }] }, ["--validate-only"]);
  assert.equal(bad.status, 2, bad.stdout + bad.stderr);
  assert.match(bad.stderr, /unknown operator "no-such-operator" \(not flagged operatorAvailable:false\)/);
  fs.rmSync(bad.dir, { recursive: true, force: true });
});

test("STAND-MUTOPS runner --validate-only: a runnable mutation that cannot be applied to this source is a plan error (exit 2)", { timeout: 300000 }, () => {
  const r = runCli("cannot", { ...basePlan, mutations: [{ id: "T-ABSENT", op: "swap-order", block: "//Network3/G10_EXIT_ABSENT", value: { moveAfter: "//Network6/FBDecouple2" } }] }, ["--validate-only"]);
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /CANNOT-APPLY T-ABSENT swap-order: swap-order: block \/\/Network3\/G10_EXIT_ABSENT not found/);
  fs.rmSync(r.dir, { recursive: true, force: true });
});
