import { SalRuntime } from "./sal-runtime.js";

export const phaseNames = ["Step1", "Step_RnD", "Step12", "Step2", "Step3", "Step4", "Step5", "Step6"];
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
function snapshot(r) {
  return { steps: phaseNames.filter(p => r.get(`b_${p}`)),
    signals: Object.fromEntries(signals.map(n => [n, r.get(n)])) };
}

export function runPhaseCase(model, phase, event, assumption) {
  const selected = { ...model, networks: model.networks.filter(n => n.name !== "Network4") };
  const r = new SalRuntime(selected, { unconnectedInput: assumption });
  const hv = ["Step3", "Step4", "Step5"].includes(phase);
  const lv = !["Step1", "Step12", "Step6"].includes(phase);
  r.setInputs(Object.fromEntries(model.variables.filter(v => !v.sourcePorts.length).map(v => [v.name, false])));
  r.setInputs({ in_ES_NC_1: true, in_ES_NC_2: true, in_InterLock_NC_1: true,
    in_InterLock_NC_2: true, in_LV_Connector_Interlock: true, in_HV_Connector_Interlock: true,
    in_Door_Monitor: true, in_LV_C1_FBK: lv, in_HV_C2_FBK: hv });
  r.runFor(200);
  // Establish an explicit phase at event time; no reachability claim.
  for (const b of selected.networks.flatMap(n => n.blocks).filter(b => b.functionName === "safeRs")) {
    const value = (b.path === "//Network1/FBRs1" && lv) ||
      (b.path === "//Network1/FBRs2" && hv) ||
      (["//Network1/FBRs3", "//Network1/FBRs4"].includes(b.path) && phase === "Step3") ||
      b.outputs.some(o => o.globals.some(g => g.lastKnownPath === `GVL1.b_${phase}`));
    r.memory.set(b.path, { value }); r.write(b.outputs[0], value);
  }
  const b = selected.networks.flatMap(n => n.blocks).find(b => b.functionName === "safeEstop");
  r.memory.set(b.path, { enabled: true, restartArmed: false, delayed: true, offElapsedMs: 0 });
  r.write(b.outputs.find(p => p.name === "EStopOut"), true);
  const initial = snapshot(r);
  const [name, input, failed, restored] = event;
  if (input) r.setInputs({ [input]: failed });
  const observed = { hvRiseDuringFault: false, lvRiseDuringFault: false, unlockDuringFault: false, stateConflictDuringFault: false };
  for (let i = 0; i < 10; i++) {
    r.scan();
    observed.hvRiseDuringFault ||= !initial.signals.out_HV_C2 && r.get("out_HV_C2");
    observed.lvRiseDuringFault ||= !initial.signals.out_LV_C1 && r.get("out_LV_C1");
    observed.unlockDuringFault ||= r.get("out_Door_Unlock_Solonoeid");
    observed.stateConflictDuringFault ||= phaseNames.filter(p => r.get(`b_${p}`)).length !== 1;
  }
  const fault100ms = snapshot(r);
  if (input) r.setInputs({ [input]: restored });
  r.runFor(500);
  return { phase, event: name, unconnectedInput: assumption, initial, fault100ms,
    restored500ms: snapshot(r), observed,
    limitations: [...r.limitations], fallbackPortCount: r.assumedUnconnectedPorts.size };
}

export function runPhaseMatrix(model) {
  return phaseNames.flatMap(p => emergencyEvents.flatMap(e =>
    [false, true].map(a => runPhaseCase(model, p, e, a))));
}
