// E2-R1-stand-2 (lead decision 1): phases are observed at the output of their state
// RS block (//Network3/FBRs<k>/RsOut), not through Symbols b_<phase>. A phase whose
// RS block is absent is NOT APPLICABLE (explicit, never PASS); an inconsistent
// anchor/Symbol is ERROR. Stand self-test on the pinned F1 copy plus in-memory variants.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../../src/sal-parser.js";
import { SalRuntime } from "../../src/sal-runtime.js";
import { currentCodeChecks } from "../../src/current-code-checks.js";
import { PHASE_RS, phaseNames, resolvePhaseObservers, activePhases, runPhaseCase, runPhaseMatrix, emergencyEvents, PhaseNotApplicable } from "../../src/emergency-phase-matrix.js";

const pinned = name => fileURLToPath(new URL(`../fixtures/stand-f1-04b45456/${name}`, import.meta.url));
const sal = pinned("TwinSafeGroup1.sal"), sgvl = pinned("GVL1.sgvl");
assert.equal(crypto.createHash("sha256").update(fs.readFileSync(sal)).digest("hex"), "04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3");
const f1 = () => parseSalFile(sal, { bindingMode: "current", sgvlPath: sgvl });
const nc1 = emergencyEvents.find(e => e[0] === "NC1");
function withoutBlock(model, path) {
  const copy = structuredClone(model);
  for (const n of copy.networks) n.blocks = n.blocks.filter(b => b.path !== path);
  return copy;
}
const rsOut = (model, path) => model.networks.flatMap(n => n.blocks).find(b => b.path === path).outputs.find(o => o.name === "RsOut");

test("D1: on F1 every phase anchor is the only safeRs writing GVL1.b_<phase>", () => {
  const r = resolvePhaseObservers(f1());
  assert.deepEqual(r.notApplicable, []);
  assert.deepEqual(r.observers.map(o => [o.phase, o.anchor, o.out, o.symbol]),
    phaseNames.map(p => [p, PHASE_RS[p], `${PHASE_RS[p]}/RsOut`, `b_${p}`]));
});

test("D1: removed state RS block -> NOT APPLICABLE for that phase only, never PASS", () => {
  const model = withoutBlock(f1(), "//Network3/FBRs2");
  const r = resolvePhaseObservers(model);
  assert.deepEqual(r.notApplicable.map(x => x.phase), ["Step2"]);
  assert.throws(() => runPhaseCase(model, "Step2", nc1, false), e => e instanceof PhaseNotApplicable && e.anchor === "//Network3/FBRs2");
  const rows = currentCodeChecks(model);
  const step2 = rows.filter(x => x.id.startsWith("PRIORITY:Step2:"));
  assert.equal(step2.length, 16);
  assert.ok(step2.every(x => x.status === "NOT APPLICABLE" && /PHASE_NOT_APPLICABLE: phase Step2 is structurally removed/.test(x.reason)));
  assert.ok(rows.filter(x => x.id.startsWith("PRIORITY:Step3:")).every(x => x.status !== "NOT APPLICABLE"));
  // STATE cases stay evaluated and carry the removed phase explicitly.
  const state = rows.find(x => x.id === "STATE:Run-RnD");
  assert.notEqual(state.status, "NOT APPLICABLE");
  assert.deepEqual(state.phasesNotApplicable?.map(p => p.phase), ["Step2"]);
  const matrix = runPhaseMatrix(model).filter(x => x.phase === "Step2");
  assert.equal(matrix.length, emergencyEvents.length * 2);
  assert.ok(matrix.every(x => x.status === "NOT APPLICABLE" && !x.observed));
});

test("D1: Symbol on a different RS than the anchor, or a missing Network3, is ERROR (not NOT APPLICABLE)", () => {
  const moved = f1();
  const a = rsOut(moved, "//Network3/FBRs6"), b = rsOut(moved, "//Network3/FBRs5");
  b.globals.push(...a.globals.splice(0));
  assert.throws(() => resolvePhaseObservers(moved), /PHASE_OBSERVER_MISMATCH: GVL1\.b_Step6 written by \/\/Network3\/FBRs5/);
  const rows = currentCodeChecks(moved);
  assert.ok(rows.filter(x => x.id.startsWith("PRIORITY:") || x.id.startsWith("STATE:")).every(x => x.status === "ERROR"));
  const gone = withoutBlock(f1(), "//Network3/FBRs6");
  rsOut(gone, "//Network3/FBRs5").globals.push({ lastKnownPath: "GVL1.b_Step6", resolvedName: "b_Step6" });
  assert.throws(() => resolvePhaseObservers(gone), /PHASE_OBSERVER_MISMATCH: \/\/Network3\/FBRs6 absent but GVL1\.b_Step6/);
  const none = f1(); none.networks = none.networks.filter(n => n.name !== "Network3");
  assert.throws(() => resolvePhaseObservers(none), /PHASE_OBSERVER_MISSING/);
  assert.ok(currentCodeChecks(none).filter(x => x.id.startsWith("PRIORITY:")).every(x => x.status === "ERROR"));
});

test("D1: a present Symbol that diverges from its RS output is ERROR at observation", () => {
  const model = f1();
  const n3 = model.networks.find(n => n.name === "Network3");
  const resolved = resolvePhaseObservers(model, [n3]);
  const r = new SalRuntime({ ...model, networks: [n3] });
  r.values.set("//Network3/FBRs1/RsOut", true); r.setInputs({ b_Step1: true });
  assert.deepEqual(activePhases(r, resolved), ["Step1"]);
  r.setInputs({ b_Step1: false });
  assert.throws(() => activePhases(r, resolved), /PHASE_SYMBOL_DIVERGES: b_Step1=false but \/\/Network3\/FBRs1\/RsOut=true/);
});
