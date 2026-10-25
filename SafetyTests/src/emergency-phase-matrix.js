import { SalRuntime } from "./sal-runtime.js";

export const phaseNames = ["Step1", "Step_RnD", "Step12", "Step2", "Step3", "Step4", "Step5", "Step6"];
// E2-R1-stand-2 (lead decision 1): the source of truth for a phase is the output
// of its state RS block in Network3, not the Symbol b_<phase>. The anchor paths are
// the RS blocks that write GVL1.b_<phase> in canonical F1 (04b45456) and in the
// historical fixture v2-4bb8703; resolvePhaseObservers re-checks this on every source:
// - anchor present: observe anchor RsOut; if a Symbol b_<phase> is written by any
//   safeRs it must be exactly this anchor (otherwise ERROR, mapping changed) and at
//   every observation Symbol == RS output (otherwise ERROR);
// - anchor absent and no safeRs writes b_<phase>: NOT APPLICABLE (structurally
//   removed), reported explicitly, never PASS;
// - anchor absent but b_<phase> written elsewhere, or Network3 absent: ERROR.
export const PHASE_RS = Object.freeze({ Step1: "//Network3/FBRs1", Step2: "//Network3/FBRs2", Step3: "//Network3/FBRs3",
  Step4: "//Network3/FBRs4", Step5: "//Network3/FBRs5", Step6: "//Network3/FBRs6", Step_RnD: "//Network3/FBRs7", Step12: "//Network3/FBRs8" });

export class PhaseNotApplicable extends Error {
  constructor(phase, anchor) {
    super(`PHASE_NOT_APPLICABLE: phase ${phase} is structurally removed from this source (state RS ${anchor} absent, no safeRs writes GVL1.b_${phase}); the case is not evaluated (no PASS/FAIL).`);
    this.code = "PHASE_NOT_APPLICABLE";
    this.phase = phase;
    this.anchor = anchor;
  }
}

const writesPhaseSymbol = (b, phase) => b.outputs.some(o => o.globals.some(g => g.lastKnownPath === `GVL1.b_${phase}`));

/** Resolve the observation/seed point of every phase in the given networks (default: all). */
export function resolvePhaseObservers(model, networks = model.networks) {
  if (!networks.some(n => n.name === "Network3")) throw new Error("PHASE_OBSERVER_MISSING: Network3 (phase state RS blocks) absent; phases cannot be observed");
  const blocks = networks.flatMap(n => n.blocks);
  const observers = [], notApplicable = [];
  for (const phase of phaseNames) {
    const anchor = PHASE_RS[phase];
    const block = blocks.find(b => b.path === anchor);
    const symbolWriters = blocks.filter(b => b.functionName === "safeRs" && writesPhaseSymbol(b, phase)).map(b => b.path);
    if (!block) {
      if (symbolWriters.length) throw new Error(`PHASE_OBSERVER_MISMATCH: ${anchor} absent but GVL1.b_${phase} is written by ${symbolWriters.join(", ")}; the anchor map must be re-established, not guessed`);
      notApplicable.push({ phase, anchor, reason: "structurally removed: state RS block absent and no safeRs writes the phase Symbol" });
      continue;
    }
    const out = block.outputs.find(o => o.name === "RsOut");
    if (block.functionName !== "safeRs" || !out) throw new Error(`PHASE_OBSERVER_MISMATCH: ${anchor} is ${block.functionName}, not a safeRs with RsOut`);
    if (symbolWriters.some(p => p !== anchor)) throw new Error(`PHASE_OBSERVER_MISMATCH: GVL1.b_${phase} written by ${symbolWriters.join(", ")}, expected only ${anchor}`);
    observers.push({ phase, anchor, out: out.path, symbol: symbolWriters.length ? `b_${phase}` : null });
  }
  if (!observers.length) throw new Error("PHASE_OBSERVER_MISSING: no phase state RS block present in Network3");
  return { observers, notApplicable, applicable: observers.map(o => o.phase) };
}

/** Active phases read from the RS outputs; a present Symbol must agree with its RS output. */
export function activePhases(r, resolved) {
  return resolved.observers.filter(o => {
    const value = r.get(o.out);
    if (o.symbol && r.get(o.symbol) !== value) throw new Error(`PHASE_SYMBOL_DIVERGES: ${o.symbol}=${r.get(o.symbol)} but ${o.out}=${value}`);
    return value;
  }).map(o => o.phase);
}

export const emergencyEvents = [
  ["control", null, false, false],
  ["NC1", "in_ES_NC_1", false, true], ["PLC", "in_Estop_PLC", true, false],
  ["NC2", "in_ES_NC_2", false, true], ["Mentee", "in_Mentee_EStop", true, false],
  ["LVConnector", "in_LV_Connector_Interlock", false, true],
  ["HVConnector", "in_HV_Connector_Interlock", false, true],
  ["ExternalNC1", "in_InterLock_NC_1", false, true],
  ["ExternalNC2", "in_InterLock_NC_2", false, true]
];
const signals = ["b_EStop_Ok", "out_LV_C1", "out_HV_C2", "STO_DR1", "STO_DR2",
  "out_SS1_DR1", "out_SS1_DR2", "out_HV_Discharge_Request", "out_Door_Unlock_Solonoeid"];
function snapshot(r, resolved) {
  return { steps: activePhases(r, resolved),
    signals: Object.fromEntries(signals.map(n => [n, r.get(n)])) };
}

export function runPhaseCase(model, phase, event, assumption) {
  const selected = { ...model, networks: model.networks.filter(n => n.name !== "Network4") };
  const resolved = resolvePhaseObservers(model, selected.networks);
  const seed = resolved.observers.find(o => o.phase === phase);
  if (!seed) {
    const removed = resolved.notApplicable.find(x => x.phase === phase);
    if (removed) throw new PhaseNotApplicable(phase, removed.anchor);
    throw new Error(`Unknown phase ${phase}`);
  }
  const r = new SalRuntime(selected, { unconnectedInput: assumption });
  const hv = ["Step3", "Step4", "Step5"].includes(phase);
  const lv = !["Step1", "Step12", "Step6"].includes(phase);
  r.setInputs(Object.fromEntries(model.variables.filter(v => !v.sourcePorts.length).map(v => [v.name, false])));
  r.setInputs({ in_ES_NC_1: true, in_ES_NC_2: true, in_InterLock_NC_1: true,
    in_InterLock_NC_2: true, in_LV_Connector_Interlock: true, in_HV_Connector_Interlock: true,
    in_Door_Monitor: true, in_LV_C1_FBK: lv, in_HV_C2_FBK: hv });
  r.runFor(200);
  // Establish an explicit phase at event time; no reachability claim.
  // The phase is seeded through its state RS block (anchor), not through the Symbol.
  for (const b of selected.networks.flatMap(n => n.blocks).filter(b => b.functionName === "safeRs")) {
    const value = (b.path === "//Network1/FBRs1" && lv) ||
      (b.path === "//Network1/FBRs2" && hv) ||
      (["//Network1/FBRs3", "//Network1/FBRs4"].includes(b.path) && phase === "Step3") ||
      b.path === seed.anchor;
    r.memory.set(b.path, { value }); r.write(b.outputs[0], value);
  }
  const b = selected.networks.flatMap(n => n.blocks).find(b => b.functionName === "safeEstop");
  r.memory.set(b.path, { enabled: true, restartArmed: false, delayed: true, offElapsedMs: 0 });
  r.write(b.outputs.find(p => p.name === "EStopOut"), true);
  const initial = snapshot(r, resolved);
  const [name, input, failed, restored] = event;
  if (input) r.setInputs({ [input]: failed });
  const observed = { hvRiseDuringFault: false, lvRiseDuringFault: false, unlockDuringFault: false, stateConflictDuringFault: false };
  for (let i = 0; i < 10; i++) {
    r.scan();
    observed.hvRiseDuringFault ||= !initial.signals.out_HV_C2 && r.get("out_HV_C2");
    observed.lvRiseDuringFault ||= !initial.signals.out_LV_C1 && r.get("out_LV_C1");
    observed.unlockDuringFault ||= r.get("out_Door_Unlock_Solonoeid");
    observed.stateConflictDuringFault ||= activePhases(r, resolved).length !== 1;
  }
  const fault100ms = snapshot(r, resolved);
  if (input) r.setInputs({ [input]: restored });
  r.runFor(500);
  return { phase, event: name, unconnectedInput: assumption, initial, fault100ms,
    restored500ms: snapshot(r, resolved), observed,
    // Only reported when a phase is structurally removed; F1 traces are unchanged.
    ...(resolved.notApplicable.length ? { phasesNotApplicable: resolved.notApplicable } : {}),
    limitations: [...r.limitations], fallbackPortCount: r.assumedUnconnectedPorts.size };
}

/** Rows for every phase/event/assumption; a structurally removed phase yields explicit NOT APPLICABLE rows. */
export function runPhaseMatrix(model) {
  return phaseNames.flatMap(p => emergencyEvents.flatMap(e =>
    [false, true].map(a => {
      try { return runPhaseCase(model, p, e, a); } catch (error) {
        if (error instanceof PhaseNotApplicable) return { phase: p, event: e[0], unconnectedInput: a, status: "NOT APPLICABLE", reason: error.message };
        throw error;
      }
    })));
}
