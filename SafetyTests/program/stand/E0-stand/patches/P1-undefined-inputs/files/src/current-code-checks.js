import { physicalRndSource } from "./physical-rnd-source.js";
import { SalRuntime as StrictSalRuntime, ledgerSnapshot, undefinedReadsSince } from "./sal-runtime.js";
// E0-stand P1: these legacy component checks cut producers (e.g. Network4) and
// historically read them as FALSE. They run in explicit record mode: every such
// read is attached to the row as undefinedInputs (assumption registry), not hidden.
class SalRuntime extends StrictSalRuntime { constructor(model, options = {}) { super(model, { undefinedInputs: "record", ...options }); } }
import { phaseNames, emergencyEvents, runPhaseCase } from "./emergency-phase-matrix.js";

// These checks execute blocks parsed from the working SAL, not the prototypes.
// Component checks deliberately cut upstream producers; scope is recorded.
export function currentCodeChecks(model) {
  const rows = [];
  function check(id, scope, scenario) {
    const observations = [];
    const expect = (label, actual, expected) => observations.push({ label, actual, expected });
    const snapshot = ledgerSnapshot();
    const registry = () => { const u = undefinedReadsSince(snapshot); return u.length ? { undefinedInputs: u } : {}; };
    try {
      const evidence = scenario(expect) ?? {};
      const violations = observations.filter(o => o.actual !== o.expected);
      rows.push({ id, scope, status: violations.length ? "FAIL" : "PASS", observations, ...evidence, ...registry() });
    } catch (error) {
      rows.push({ id, scope, status: "ERROR", error: error.message, ...registry() });
    }
  }
  function isolate(network, names) {
    const n = model.networks.find(n => n.name === network);
    if (!n || names.some(name => !n.blocks.some(b => b.name === name))) throw new Error(`Missing binding: ${network}/${names}`);
    return { ...model, networks: [{ ...n, blocks: n.blocks.filter(b => names.includes(b.name)) }] };
  }
  const blocks = model.networks.flatMap(n => n.blocks);
  for (const block of blocks.filter(b => b.functionName === "safeTon")) {
    check(`TIMER:${block.path}`, "Working SAL TON component, configured time; scan=10ms", e => {
      const delayMs = Number(block.parameters.find(p => p.timing)?.timing) * 1000;
      if (!Number.isFinite(delayMs) || delayMs <= 0) throw new Error("Missing/unsupported TON value");
      const r = new SalRuntime({ ...model, networks: [{ blocks: [block] }] });
      const input = block.inputs[0];
      const drive = value => {
        // Explicit port injection with contact polarity respected, no upstream logic.
        const raw = input.deactivate1 === "Make Contact (NO)" ? !value : value;
        r.values.set(input.path, raw);
        for (const source of input.sources) r.values.set(source, raw);
        for (const global of input.globals) r.setInputs({ [global.lastKnownPath.split(".").at(-1)]: raw });
        const variable = r.variableTargets.get(input.path);
        if (variable) r.setInputs({ [variable]: raw });
      };
      const out = () => r.get(block.outputs[0].path);
      drive(true);
      r.scan(); // Register observed edge age0, separately from elapsed interval.
      const before = Math.max(0, Math.ceil(delayMs / 10) * 10 - 10);
      if (before) r.runFor(before);
      e("before configured threshold", out(), false);
      drive(false); r.scan(); e("interruption resets", out(), false);
      drive(true);
      r.scan(); // New observed edge after interruption.
      if (before) r.runFor(before);
      e("full interval required after interruption", out(), false);
      r.scan(); e("at first scan reaching threshold", out(), true);
      r.runFor(30); e("held input retains output", out(), true);
      drive(false); r.scan(); e("release removes output", out(), false);
      return { delayMs, assumedUnconnectedPorts: [...r.assumedUnconnectedPorts], unsupported: [...r.unsupported] };
    });
  }
  const paths = [
    ["Safe-RnD-Run", [["b_Step1_Set", "b_Step1"], ["b_Step12_Set", "b_Step12"], ["b_Step_RnD_Set", "b_Step_RnD"], ["b_Step3_Set_2", "b_Step3"]]],
    ["Run-RnD", [["b_Step3_Set_2", "b_Step3"], ["b_Step12_Set_2", "b_Step12"], ["b_Step_RnD_Set", "b_Step_RnD"]]],
    ["RnD-Safe", [["b_Step_RnD_Set", "b_Step_RnD"], ["b_Step2_Set_2", "b_Step1"]]],
    ["Emergency-removal", [["b_Step3_Set_3", "b_Step3"], ["b_Step4_Set", "b_Step4"], ["b_Step5_Set", "b_Step5"], ["b_Step6_Set", "b_Step6"], ["b_Step1_Set_2", "b_Step1"]]]
  ];
  for (const [name, inputs, expectedUp, expectedUnlock] of [
    ["open-cover-chord", { in_Door_Monitor: false, in_Reset_PB: true, in_Relase_Door_PB: true }, false, false], // Held-at-start rejection; Door alone is no longer an energy prohibition.
    ["held-blue-at-start", { in_Door_Monitor: true, in_Reset_PB: false, in_Relase_Door_PB: true }, false, false],
    ["held-chord-at-start", { in_Door_Monitor: true, in_Reset_PB: true, in_Relase_Door_PB: true }, false, false]
  ]) check(`BUTTON:${name}`, "Working Network12 R&D branch; startup means first sample of this branch, not full group restart", e => {
    const n = model.networks.find(n => n.name === "Network12");
    if (!n) throw new Error("Missing Network12");
    const integrated=model.networks.some(n=>n.name==="RndPhysicalCompact");
    const actual=integrated?physicalRndSource(model,10,{entryButtons:inputs}):null;
    const r = actual?.r ?? new SalRuntime({ ...model, networks: [n] }).setInputs({ b_Step_RnD: true, b_ResetPB_Lock: false,
      in_False_SI2_CH8: false, inPLC_RnD_Mode: false, inPLC_RnD_Mode_2: false,
      in_InterLock_NC_1:true,in_InterLock_NC_2:true,
      in_HV_C2_FBK: false, in_HV_Healthy_FBK: true, ...inputs });
    r.runFor(2500);
    e("no up without a new released/armed attempt; DoorMonitor is not an energy guard", r.get("b_Set_Transition_3"), expectedUp);
    e("no unlock without valid release attempt", r.get("b_Set_Door_Unlock_1"), expectedUnlock);
    return { selectedScope:actual?.scope, assumedUnconnectedPorts: [...r.assumedUnconnectedPorts], limitations: [...r.limitations] };
  });
  for (const [name, commands] of paths) check(`STATE:${name}`, "Network3 state ownership only; internal set requests injected, not upstream permission acceptance", e => {
    const n = model.networks.find(n => n.name === "Network3");
    if (!n) throw new Error("Missing Network3");
    const r = new SalRuntime({ ...model, networks: [n] }).setInputs({ in_Safety_Run: false, b_EStop_Ok: false, in_False_SI2_CH8: false });
    for (const [command, state] of commands) {
      r.runFor(50, { [command]: true }); r.runFor(50, { [command]: false });
      e(command, phaseNames.filter(p => r.get(`b_${p}`)).join(","), state.slice(2));
    }
  });
  check("STATE:conflicting-set-requests", "Network3 internal conflicting requests; tests latch boundary only", e => {
    const n = model.networks.find(n => n.name === "Network3");
    if (!n) throw new Error("Missing Network3");
    const r = new SalRuntime({ ...model, networks: [n] }).setInputs({ in_Safety_Run: false, b_EStop_Ok: false,
      in_False_SI2_CH8: false, b_Step1_Set: true, b_Step3_Set_2: true });
    r.runFor(50);
    const active = phaseNames.filter(p => r.get(`b_${p}`));
    e("conflicting requests cannot report simultaneous Safe and Run", active.includes("Step1") && active.includes("Step3"), false);
    return { active, note: "A pass does not prove every conflicting request reaches Emergency; fault destination needs separate binding" };
  });
  check("ESTOP:restart-fault-recovery", "Working Network1 FBAnd1 + FBEstop1, no EDM/group lifecycle", e => {
    const r = new SalRuntime(isolate("Network1", ["FBAnd1", "FBEstop1"]));
    r.setInputs({ in_Reset_PB: false, in_ES_NC_1: true, in_ES_NC_2: true, in_Mentee_EStop:false, in_Estop_PLC: false, in_False_SI2_CH8: false }).runFor(100);
    e("healthy input alone cannot restart", r.get("b_EStop_Ok"), false);
    r.runFor(100, { in_Reset_PB: true }); e("held reset cannot restart", r.get("b_EStop_Ok"), false);
    r.runFor(10, { in_Reset_PB: false }); e("fresh reset falling edge", r.get("b_EStop_Ok"), true);
    r.runFor(10, { in_ES_NC_1: false }); e("fault wins", r.get("b_EStop_Ok"), false);
    r.runFor(500, { in_ES_NC_1: true }); e("restoration cannot auto-restart", r.get("b_EStop_Ok"), false);
    r.runFor(100, { in_Reset_PB: true }); r.runFor(10, { in_Reset_PB: false });
    e("new manual reset restores", r.get("b_EStop_Ok"), true);
    return { limitations: [...r.limitations], assumedUnconnectedPorts: [...r.assumedUnconnectedPorts] };
  });
  for (const phase of phaseNames) for (const event of emergencyEvents.filter(e => e[0] !== "control")) {
    if (phase === "Step1" && event[0].endsWith("Connector")) continue; // Safe connector loss is a permission, not emergency.
    for (const assumption of [false, true]) check(`PRIORITY:${phase}:${event[0]}:fallback=${assumption}`,
      "Working SAL except Network4; seeded state and fixed feedback; first 100ms sampled", e => {
        const trace = runPhaseCase(model, phase, event, assumption);
        e("no new HV command during fault", trace.observed.hvRiseDuringFault, false);
        e("no new LV command during fault", trace.observed.lvRiseDuringFault, false);
        e("no unlock during fault", trace.observed.unlockDuringFault, false);
        // No arbitrary emergency completion time or inferred polarity is imposed.
        if (["NC1", "PLC"].includes(event[0])) {
          e("EStop output removed", trace.fault100ms.signals.b_EStop_Ok, false);
          e("restoration without reset cannot enable", trace.restored500ms.signals.b_EStop_Ok, false);
        }
        return { trace };
      });
  }
  return rows;
}
