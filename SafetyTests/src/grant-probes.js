// E2 stand (PLAN v5 addendum A4-3, section 6): robust probes G-1..G-4 on the
// grants of the stage ring. NOT an oracle and NOT E2-01: a probe injects a pair
// of grant Symbols for exactly one scan into the isolated ring network and
// reports which stage RS outputs are set afterwards, for every seeded stage,
// every value combination of the ring's other external Symbols and both
// unconnected-input assumptions. The verdict is AS-CONSTRUCTED / DEVIATES from
// the architect's constructive expectation, never PASS/FAIL.
//
// Guarantees (no silent defaults):
//  - every injected grant must have an active consumer in the selection,
//    otherwise the probe is ERROR INJECTION_POINT_MISSING (not evaluated);
//  - every external Symbol read by the selection is set explicitly on every
//    scan: grants to FALSE (except the injected pair during the injection
//    scan), all others swept over FALSE/TRUE (or the caller's values);
//    a Symbol that is read but neither a grant nor given -> ERROR UNDEFINED_INPUT;
//  - stages are observed at the state RS outputs (resolvePhaseObservers) and
//    a present phase Symbol must agree with its RS (PHASE_SYMBOL_DIVERGES).
import { SalRuntime } from "./sal-runtime.js";
import { resolvePhaseObservers, activePhases } from "./emergency-phase-matrix.js";

export const PROBE_SOURCE = "program/architect/E2-status/PLAN.md section 6 (v5): robust probes on ring grants, not oracle E2-01";
export const GRANT_PROBES = Object.freeze([
  { id: "G-1", inject: ["b_Step2_Set_2", "b_Step4_Set"], expect: { stages: ["Step4"] }, construction: "S4 only (g7 in Reset of S1 and SR)", normativeSeeds: ["Step_RnD"] },
  { id: "G-2", inject: ["b_Step3_Set_2", "b_Step4_Set"], expect: { stages: ["Step4"] }, construction: "S4 only", normativeSeeds: ["Step_RnD"] },
  { id: "G-3", inject: ["b_Step12_Set_2", "b_Step4_Set"], expect: { stages: ["Step4"] }, construction: "S4 only", normativeSeeds: ["Step3"] },
  { id: "G-4", inject: ["b_Step12_Set", "b_Step3_Set_2"], expect: { count: 2 }, construction: "two stages expected: different sources, grant binding violated; shows the limit of the ring, not a defect", normativeSeeds: [] }
]);
// Normative initial stages (architect PLAN.md v6 §9 table, relayed by lead 2026-10-22): G-1/G-2 from SR (Step_RnD) -> only S4;
// G-3 from S3 -> only S4; G-4 is the ring limit (two stages), no normative seed given. Every other seed is OBSERVATION:
// reported, but not part of the probe's normative verdict.
export const NORMATIVE_SEEDS_SOURCE = "program/architect/E2-status/PLAN.md (v6) §9 «Пробы стенда G-1…G-4 — где ожидание нормативно», relayed by lead 2026-10-22";
// Stage-set requests b_Step<stage>_Set[_n] (incl. b_Step_RnD_Set); resets b_Step<n>_Reset are NOT grants.
export const isGrant = name => /^b_Step\w*_Set(_\d+)?$/.test(name);

const symbolOf = g => g.resolvedName ?? g.lastKnownPath?.split(".").at(-1);
const active = p => !["Deactivated", "Both Deactivated"].includes(p.channelInterface);

/** External Symbols read by active inputs of `blocks` and not written inside them; unconnected active inputs. */
export function ringInterface(model, blocks) {
  const written = new Set(blocks.flatMap(b => b.outputs.flatMap(p => p.globals.map(symbolOf))));
  const ports = new Set(blocks.flatMap(b => [...b.inputs, ...b.outputs].map(p => p.path)));
  const varTargets = new Map(model.variables.flatMap(v => v.targetPorts.map(t => [t, v.name])));
  const reads = new Map(), unconnected = [];
  for (const b of blocks) for (const p of b.inputs.filter(active)) {
    const names = [...p.globals.map(symbolOf), ...(varTargets.has(p.path) ? [varTargets.get(p.path)] : [])];
    const internalWire = p.sources.some(s => ports.has(s));
    const externalWire = p.sources.filter(s => !ports.has(s));
    if (externalWire.length) throw new Error(`RING_NOT_ISOLABLE: ${p.path} is wired to ${externalWire.join(", ")} outside the selection`);
    for (const n of names) if (!written.has(n)) { if (!reads.has(n)) reads.set(n, []); reads.get(n).push(p.path); }
    if (!names.length && !internalWire) unconnected.push(p.path);
  }
  return { reads, unconnected };
}

function* combinations(names, values) {
  if (!names.length) { yield {}; return; }
  const [first, ...rest] = names;
  for (const v of values[first]) for (const tail of combinations(rest, values)) yield { [first]: v, ...tail };
}

/**
 * Run the probes on `network` (default Network3) of a parsed model.
 * options.env: { Symbol: boolean | boolean[] } for non-grant external Symbols;
 *   default sweeps each over [false, true] (at most options.maxSweep = 6 Symbols).
 * Returns { scope, interface, rows, summary }.
 */
export function runGrantProbes(model, { probes = GRANT_PROBES, network = "Network3", env, maxSweep = 6, settleScans = 5 } = {}) {
  const n = model.networks.find(x => x.name === network);
  if (!n) throw new Error(`PROBE_SCOPE_MISSING: ${network} absent`);
  const selected = { ...model, networks: [n] };
  const phases = resolvePhaseObservers(model, [n]);
  const iface = ringInterface(model, n.blocks);
  const external = [...iface.reads.keys()].sort();
  const grants = external.filter(isGrant);
  const others = external.filter(x => !isGrant(x));
  const values = {};
  for (const name of others) {
    const given = env?.[name];
    if (given === undefined && env) throw new Error(`UNDEFINED_INPUT: ${name} is read by ${iface.reads.get(name).join(", ")} but not given in env`);
    values[name] = given === undefined ? [false, true] : [given].flat().map(Boolean);
  }
  if (!env && others.length > maxSweep) throw new Error(`PROBE_SWEEP_TOO_LARGE: ${others.length} non-grant external Symbols (${others.join(", ")}); give env explicitly`);
  const rows = [];
  const seeds = [null, ...phases.observers.map(o => o.phase)];
  for (const probe of probes) {
    const missing = probe.inject.filter(name => !grants.includes(name));
    if (missing.length) {
      rows.push({ probe: probe.id, status: "ERROR", error: `INJECTION_POINT_MISSING: no active consumer in ${network} for ${missing.join(", ")}; the probe premise does not exist in this source (not evaluated)` });
      continue;
    }
    for (const combo of combinations(others, values)) for (const seed of seeds) for (const assumption of [false, true]) {
      const row = { probe: probe.id, inject: probe.inject, seed: seed ?? "none", env: combo, unconnectedInput: assumption,
        role: (probe.normativeSeeds ?? []).includes(seed) ? "NORMATIVE" : "OBSERVATION" };
      try {
        const r = new SalRuntime(selected, { unconnectedInput: assumption });
        const quiet = Object.fromEntries(grants.map(g => [g, false]));
        r.setInputs({ ...quiet, ...combo });
        for (const o of phases.observers) {
          const value = o.phase === seed;
          r.memory.set(o.anchor, { value });
          r.write(selected.networks[0].blocks.find(b => b.path === o.anchor).outputs.find(p => p.name === "RsOut"), value);
        }
        r.scan();
        row.preState = activePhases(r, phases);
        row.seedHeld = JSON.stringify(row.preState) === JSON.stringify(seed ? [seed] : []);
        r.setInputs(Object.fromEntries(probe.inject.map(g => [g, true]))).scan();
        row.afterInjection = activePhases(r, phases);
        r.setInputs(quiet);
        for (let i = 0; i < settleScans; i++) r.scan();
        row.settled = activePhases(r, phases);
        const ok = s => probe.expect.stages ? JSON.stringify(s) === JSON.stringify(probe.expect.stages) : s.length === probe.expect.count;
        row.status = ok(row.afterInjection) && ok(row.settled) ? "AS-CONSTRUCTED" : "DEVIATES";
        row.assumedUnconnectedPorts = [...r.assumedUnconnectedPorts];
      } catch (error) { row.status = "ERROR"; row.error = error.message; }
      rows.push(row);
    }
  }
  const summary = Object.fromEntries(probes.map(p => {
    const mine = rows.filter(r => r.probe === p.id);
    return [p.id, Object.fromEntries(["AS-CONSTRUCTED", "DEVIATES", "ERROR"].map(s => [s, mine.filter(r => r.status === s).length]))];
  }));
  // A normative seed without a state RS observer cannot be evaluated: NORMATIVE ERROR (not silently observation-only).
  const normativeSeedsMissing = probes.filter(p => !rows.some(r => r.probe === p.id && r.status === "ERROR" && !r.env))
    .flatMap(p => (p.normativeSeeds ?? []).filter(x => !seeds.includes(x)).map(seed => ({ probe: p.id, seed,
      error: `NORMATIVE_SEED_MISSING: stage ${seed} has no state RS observer in this source; the normative verdict of ${p.id} is not evaluated` })));
  const byRole = role => Object.fromEntries(probes.map(p => {
    const mine = rows.filter(r => r.probe === p.id && (r.role === role || (role === "NORMATIVE" && !r.role)));
    const counts = Object.fromEntries(["AS-CONSTRUCTED", "DEVIATES", "ERROR"].map(s => [s, mine.filter(r => r.status === s).length]));
    if (role === "NORMATIVE") counts.ERROR += normativeSeedsMissing.filter(m => m.probe === p.id).length;
    return [p.id, counts];
  }));
  return { source: PROBE_SOURCE, normativeSeedsSource: NORMATIVE_SEEDS_SOURCE, scope: `${network} isolated; grants injected for exactly 1 scan, then ${settleScans} quiet scans; stages observed at state RS outputs`,
    interface: { grants, sweptSymbols: values, unconnectedActiveInputs: iface.unconnected, phasesNotApplicable: phases.notApplicable },
    probes, rows, summary, normativeSummary: byRole("NORMATIVE"), normativeSeedsMissing, observationSummary: byRole("OBSERVATION"),
    limits: ["Robust probe, not an oracle (PLAN v5 section 6): the verdict compares with the architect's constructive expectation only",
      "Isolated ring network: upstream grant producers, their mutual exclusion and the binding of grants to sources are NOT exercised",
      "Seeds are single stages set directly at the RS outputs (no reachability claim); seedHeld=false marks a seed the ring itself changed before injection",
      "Unconnected active inputs follow the runtime assumption, both values reported",
      "Only NORMATIVE rows (normativeSeeds per probe) carry the probe verdict; OBSERVATION rows (other seeds) are reported, not judged. G-4 has no normative seed (ring limit)"] };
}
