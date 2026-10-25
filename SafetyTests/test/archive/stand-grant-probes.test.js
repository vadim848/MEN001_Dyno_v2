// E2 stand (PLAN v5 A4-3 / section 6): robust grant probes G-1..G-4.
// The probe mechanism is checked on a synthetic two-stage ring (fixture model,
// not SAL) and run read-only on the canonical SAL: injection is exactly one
// scan, no read Symbol is left at a silent default, a missing injection point
// is ERROR, and the verdict is AS-CONSTRUCTED / DEVIATES, never PASS/FAIL.
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { runGrantProbes, GRANT_PROBES, isGrant, ringInterface } from "../../src/grant-probes.js";
import { parseSalFile } from "../../src/sal-parser.js";

const g = name => ({ resolvedName: name, lastKnownPath: `GVL1.${name}` });
const inp = (path, name, extra = {}) => ({ name, path: `${path}/${name}`, channelInterface: "Activated", deactivate1: "Break Contact (NC)", sources: [], targets: [], globals: [], ...extra });
const out = (path, name, extra = {}) => ({ name, path: `${path}/${name}`, sources: [], targets: [], globals: [], ...extra });
function rs(name, order, set, reset, phase) {
  const p = `//Network3/${name}`;
  return { type: "fBRs", name, functionName: "safeRs", orderOfExecution: order, path: p, parameters: [],
    inputs: [inp(p, "Reset", reset), inp(p, "Set", set)], outputs: [out(p, "RsOut", { globals: [g(`b_${phase}`)] })] };
}
function or(name, order, ins, target) {
  const p = `//Network3/${name}`;
  return { type: "fBOr", name, functionName: "safeOr", orderOfExecution: order, path: p, parameters: [],
    inputs: ins.map((s, i) => inp(p, `OrIn${i + 1}`, { globals: [g(s)] })), outputs: [out(p, "OrOut", { targets: [target] })] };
}
// Safe (FBRs1) set by b_Step2_Set_2, reset by OR(b_Step4_Set, withS4Reset ? - : none); Run-down (FBRs4) set by b_Step4_Set.
function ring({ g7ResetsSafe = true } = {}) {
  const blocks = [
    or("FBOr1", 1, g7ResetsSafe ? ["b_Step4_Set", "b_Step12_Set"] : ["b_Step12_Set"], "//Network3/FBRs1/Reset"),
    rs("FBRs1", 2, { globals: [g("b_Step2_Set_2")] }, { sources: ["//Network3/FBOr1/OrOut"] }, "Step1"),
    rs("FBRs4", 3, { globals: [g("b_Step4_Set")] }, { globals: [g("b_Step5_Set")] }, "Step4")
  ];
  return { bindingMode: "fixture", variables: [], networks: [{ name: "Network3", blocks }] };
}
const G1 = [GRANT_PROBES[0]];

test("STAND-GPROBE grant names: stage-set requests only, resets are not grants", () => {
  for (const n of ["b_Step4_Set", "b_Step2_Set_2", "b_Step_RnD_Set", "b_Step12_Set_2"]) assert.ok(isGrant(n), n);
  for (const n of ["b_Step1_Reset", "b_EStop_Ok", "in_Safety_Run", "b_Step4"]) assert.ok(!isGrant(n), n);
  assert.deepEqual(GRANT_PROBES.map(p => p.id), ["G-1", "G-2", "G-3", "G-4"]);
});

test("STAND-GPROBE G-1 on a ring whose g7 resets Safe: S4 only after the 1-scan injection, from every seed", () => {
  const r = runGrantProbes(ring(), { probes: G1 });
  assert.equal(r.rows.length, 3 * 2, "seeds none/Step1/Step4 x both unconnected-input assumptions");
  for (const row of r.rows) {
    assert.equal(row.status, "AS-CONSTRUCTED", JSON.stringify(row));
    assert.deepEqual(row.afterInjection, ["Step4"]);
    assert.deepEqual(row.settled, ["Step4"]);
  }
  assert.deepEqual(r.interface.grants, ["b_Step12_Set", "b_Step2_Set_2", "b_Step4_Set", "b_Step5_Set"]);
  assert.ok(r.interface.phasesNotApplicable.length >= 6, "absent stages are listed, not silently ignored");
  assert.ok(!JSON.stringify(r).includes("\"PASS\""), "a probe never reports PASS");
});

test("STAND-GPROBE the same probe DEVIATES when g7 does not reset Safe (two stages), it is not hidden", () => {
  const r = runGrantProbes(ring({ g7ResetsSafe: false }), { probes: G1 });
  assert.ok(r.rows.every(x => x.status === "DEVIATES"), JSON.stringify(r.summary));
  assert.deepEqual(r.rows[0].settled, ["Step1", "Step4"]);
  assert.deepEqual(r.summary["G-1"], { "AS-CONSTRUCTED": 0, DEVIATES: 6, ERROR: 0 });
});

test("STAND-GPROBE injection lasts exactly one scan: a set request held longer is not what is measured", () => {
  // In the synthetic ring Safe would be re-set by a held b_Step2_Set_2 once g7 is gone; one scan only must leave S4.
  const r = runGrantProbes(ring(), { probes: [{ id: "X", inject: ["b_Step2_Set_2"], expect: { stages: ["Step1"] }, construction: "test" }] });
  for (const row of r.rows.filter(x => x.seed !== "Step4")) assert.deepEqual(row.settled, ["Step1"]);
  for (const row of r.rows.filter(x => x.seed === "Step4")) assert.deepEqual(row.settled, ["Step1", "Step4"]);
});

test("STAND-GPROBE missing injection point is ERROR (not evaluated); an unlisted read Symbol is UNDEFINED_INPUT", () => {
  const r = runGrantProbes(ring(), { probes: [GRANT_PROBES[1]] });
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].status, "ERROR");
  assert.match(r.rows[0].error, /INJECTION_POINT_MISSING: no active consumer in Network3 for b_Step3_Set_2/);
  const m = ring();
  m.networks[0].blocks[2].inputs[0] = inp("//Network3/FBRs4", "Reset", { globals: [g("b_EStop_Ok")] });
  assert.throws(() => runGrantProbes(m, { probes: G1, env: { in_Safety_Run: true } }), /UNDEFINED_INPUT: b_EStop_Ok/);
  const swept = runGrantProbes(m, { probes: G1 });
  assert.deepEqual(swept.interface.sweptSymbols, { b_EStop_Ok: [false, true] });
  assert.equal(swept.rows.length, 2 * 3 * 2);
  assert.throws(() => runGrantProbes(m, { probes: G1, maxSweep: 0 }), /PROBE_SWEEP_TOO_LARGE: 1 non-grant external Symbols \(b_EStop_Ok\)/);
});

test("STAND-GPROBE canonical SAL (read only): with every read non-grant Symbol given explicitly, every row is evaluated without ERROR", () => {
  const sal = fileURLToPath(new URL("../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal", import.meta.url));
  const model = parseSalFile(sal);
  assert.equal(model.bindingMode, "current");
  const n3 = model.networks.find(n => n.name === "Network3");
  const env = Object.fromEntries([...ringInterface(model, n3.blocks).reads.keys()].filter(n => !isGrant(n)).map(n => [n, false]));
  assert.ok("b_EStop_Ok" in env);
  const known = runGrantProbes(model, { env: { ...env, b_EStop_Ok: [false, true] } });
  assert.ok(known.rows.every(x => x.status !== "ERROR"), JSON.stringify(known.rows.find(x => x.status === "ERROR")));
  for (const p of GRANT_PROBES) assert.ok(known.rows.some(x => x.probe === p.id && JSON.stringify(x.afterInjection) !== JSON.stringify(x.preState)), `${p.id} injection is observable`);
});

test("STAND-GPROBE normative seeds (PLAN v6 §9): only listed seeds carry the verdict; a missing normative stage is ERROR", () => {
  assert.deepEqual(GRANT_PROBES.map(p => [p.id, p.normativeSeeds]), [["G-1", ["Step_RnD"]], ["G-2", ["Step_RnD"]], ["G-3", ["Step3"]], ["G-4", []]]);
  const missing = runGrantProbes(ring(), { probes: G1 });
  assert.deepEqual(missing.normativeSeedsMissing.map(m => [m.probe, m.seed]), [["G-1", "Step_RnD"]]);
  assert.equal(missing.normativeSummary["G-1"].ERROR, 1);
  assert.ok(missing.rows.every(r => r.role === "OBSERVATION"));
  const probe = [{ ...GRANT_PROBES[0], normativeSeeds: ["Step1"] }];
  const dev = runGrantProbes(ring({ g7ResetsSafe: false }), { probes: probe });
  assert.deepEqual(dev.rows.filter(r => r.role === "NORMATIVE").map(r => r.seed), ["Step1", "Step1"]);
  assert.deepEqual(dev.normativeSummary["G-1"], { "AS-CONSTRUCTED": 0, DEVIATES: 2, ERROR: 0 });
  assert.deepEqual(dev.observationSummary["G-1"], { "AS-CONSTRUCTED": 0, DEVIATES: 4, ERROR: 0 });
  assert.deepEqual(dev.summary["G-1"], { "AS-CONSTRUCTED": 0, DEVIATES: 6, ERROR: 0 }, "all-rows summary unchanged");
  const g4 = runGrantProbes(ring(), { probes: [{ ...GRANT_PROBES[0], id: "G-4x", normativeSeeds: [] }] });
  assert.ok(g4.rows.every(r => r.role === "OBSERVATION") && !g4.normativeSeedsMissing.length);
});
