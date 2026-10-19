import { SalRuntime } from "./sal-runtime.js";
import { currentGestureBoundaryChecks } from "./current-gesture-boundaries.js";
import { ObservedSamples } from "./observed-samples.js";

const ready = { b_Step_RnD: true, b_ResetPB_Lock: false, in_False_SI2_CH8: false,
  in_Door_Monitor: true, inPLC_RnD_Mode: false, inPLC_RnD_Mode_2: false,
  in_HV_C2_FBK: false, in_HV_Healthy_FBK: true, in_Reset_PB: false, in_Relase_Door_PB: false };

export function candidateButtonCoverChecks(model) {
  const results = [];
  // Historical fixture still writes the output directly from RsOut. Current
  // candidate checks must include its final gate; missing gate is a binding gap.
  const legacyWriter = model.variables.find(v => v.name === "out_Door_Unlock_Solonoeid")
    ?.sourcePorts.join() === "//Network1/FBRs6/RsOut";
  const cover = { Network1: ["FBOr3", "FBOr4", "FBRs6", ...(legacyWriter ? [] : ["FBAndUnlockHold"])] };
  function check(id, requirements, title, selection, scenario) {
    const missing = Object.entries(selection).flatMap(([name, names]) => {
      const n = model.networks.find(n => n.name === name);
      return !n ? [name] : names.filter(b => !n.blocks.some(x => x.name === b)).map(b => `${name}/${b}`);
    });
    if (missing.length) {
      results.push({ id, requirements, title, status: "NOT VERIFIED", reason: `Binding missing: ${missing.join(", ")}` });
      return;
    }
    const selected = { ...model, networks: model.networks.filter(n => selection[n.name]).map(n =>
      ({ ...n, blocks: selection[n.name].length ? n.blocks.filter(b => selection[n.name].includes(b.name)) : n.blocks })) };
    const r = new SalRuntime(selected).setInputs(ready);
    const observations = [];
    const expect = (signal, expected, checkpoint, actual = r.get(signal)) => observations.push({ signal, expected, actual, checkpoint });
    scenario(r, expect);
    const firstViolation = observations.find(o => o.actual !== o.expected);
    results.push({ id, requirements, title, status: firstViolation ? "FAIL" : "PASS",
      scope: Object.keys(selection), observations, firstViolation: firstViolation ?? null,
      assumedUnconnectedPorts: [...r.assumedUnconnectedPorts], limitations: [...r.limitations] });
  }
  const rnd = { Network12: [] };
  check("ACC-B01-R", ["BTN-001"], "Short neutral interval cannot re-arm blue in the bound R&D branch", rnd, (r, e) => {
    r.runFor(2100);
    r.runFor(1200, { in_Relase_Door_PB: true });
    e("b_Set_Door_Unlock_1", true, "first qualified hold");
    r.runFor(100, { in_Relase_Door_PB: false });
    r.runFor(1200, { in_Relase_Door_PB: true });
    e("b_Set_Door_Unlock_1", false, "second hold after only 100 ms neutral");
  });
  for (const [first, input, timer] of [["GREEN", "in_Reset_PB", "FBTon4"], ["BLUE", "in_Relase_Door_PB", "FBTon2"]])
    for (const [suffix, stagger] of [["IN", 240], ["EDGE", 250], ["LATE", 260], ["490", 490], ["500", 500], ["510", 510]]) {
    const id = `ACC-B03-${suffix}${first === "BLUE" ? "-BLUE" : ""}`;
    check(id, ["BTN-005", "BTN-006", "BTN-008"], `${first} first; second at ${stagger} ms; chord window inclusive 250 ms`, { ...cover, ...rnd }, (r, e) => {
      // Full neutral interval precedes the attempt. Network12 has no complete
      // Armed state: this is an input precondition, not proof of its recognizer.
      r.runFor(2100);
      const clock=new ObservedSamples(r,10),firstTime=clock.sample({[input]:true});
      clock.observeAfter(firstTime,stagger,{in_Reset_PB:true,in_Relase_Door_PB:true});
      e(`//Network12/${timer}/TonOut`, stagger >= 500, "single TON qualification at second observed sample; not a visible unlock pulse");
      let forbiddenUnlock = false;
      r.setInputs({ in_Reset_PB: true, in_Relase_Door_PB: true });
      for (let i = 0; i < 99; i++) {
        r.scan(); forbiddenUnlock ||= r.get("out_Door_Unlock_Solonoeid");
      }
      e("unlock while green present", false, "every scan after second button", forbiddenUnlock);
      e("b_Set_Transition_3", false, "990 ms of both held");
      r.runFor(10);
      e("b_Set_Transition_3", stagger <= 250, "1000 ms of both held");
      r.runFor(10); e("b_Set_Transition_3", stagger <= 250, "1010 ms of both held");
    });
  }
  check("ACC-B03-FLICKER", ["BTN-006", "BTN-007"], "Chord timer restarts fully after one button flickers", rnd, (r, e) => {
    r.runFor(2100);
    r.setInputs({in_Reset_PB:true,in_Relase_Door_PB:true}).scan().runFor(300);
    r.setInputs({in_Reset_PB:false}).scan().runFor(50);
    r.setInputs({in_Reset_PB:true}).scan().runFor(990);
    e("b_Set_Transition_3", false, "990 ms since restored chord");
    r.runFor(10); e("b_Set_Transition_3", true, "1000 ms since restored chord");
    r.runFor(10); e("b_Set_Transition_3", true, "1010 ms since restored chord");
  });
  check("ACC-B02-G", ["BTN-003"], "Green: TON at 500 ms; downstream down by 510 ms", rnd, (r, e) => {
    r.runFor(2100);
    r.setInputs({in_Reset_PB:true}).scan().runFor(490); e("b_Set_Transition_2", false, "490 ms");
    r.runFor(10); e("//Network12/FBTon4/TonOut", true, "500 ms timer threshold; consumer precedes TON in global scan");
    r.runFor(10); e("b_Set_Transition_2", true, "510 ms");
  });
  check("ACC-B02-B", ["BTN-004"], "Blue: TON at 500 ms; downstream unlock by 510 ms", rnd, (r, e) => {
    r.runFor(2100);
    r.setInputs({in_Relase_Door_PB:true}).scan().runFor(490); e("b_Set_Door_Unlock_1", false, "490 ms");
    r.runFor(10); e("//Network12/FBTon2/TonOut", true, "500 ms timer threshold; consumer precedes TON in global scan");
    r.runFor(10); e("b_Set_Door_Unlock_1", true, "510 ms");
  });
  check("ACC-B03-T", ["BTN-006"], "Both: no up at 990 ms; up at 1000 ms", rnd, (r, e) => {
    r.runFor(2100);
    r.setInputs({in_Reset_PB:true,in_Relase_Door_PB:true}).scan().runFor(990); e("b_Set_Transition_3", false, "990 ms");
    r.runFor(10); e("b_Set_Transition_3", true, "1000 ms");
    r.runFor(10); e("b_Set_Transition_3", true, "1010 ms");
  });
  for (const [suffix, released, signal] of [["B", "in_Reset_PB", "b_Set_Door_Unlock_1"], ["G", "in_Relase_Door_PB", "b_Set_Transition_2"]]) {
    check(`ACC-B03-${suffix}`, ["BTN-007"], "Failed chord must not become a single command", rnd, (r, e) => {
      r.runFor(2100);
      r.runFor(300, { in_Reset_PB: true, in_Relase_Door_PB: true });
      r.runFor(1200, { [released]: false }); e(signal, false, "remaining button held 1200 ms");
    });
  }
  check("ACC-C01-S", ["CVR-001", "CVR-002"], "Safe unlock removed after blue release", {
    ...cover, Network2: ["FBDecouple3", "FBAnd7", "FBAnd8"]
  }, (r, e) => {
    r.runFor(1200, { b_Step_RnD: false, b_Step1: true, in_Relase_Door_PB: true });
    e("out_Door_Unlock_Solonoeid", true, "qualified hold");
    r.runFor(50, { in_Relase_Door_PB: false }); e("out_Door_Unlock_Solonoeid", false, "50 ms after release");
  });
  check("ACC-C01-R", ["CVR-001"], "R&D unlock removed after blue release, locked monitor retained", {
    ...cover, Network12: ["FBAnd1", "FBAnd2", "FBAnd3", "FBTon2", "FBAnd11", "FBAnd17"]
  }, (r, e) => {
    r.runFor(1200, { in_Relase_Door_PB: true }); e("out_Door_Unlock_Solonoeid", true, "qualified hold");
    r.runFor(50, { in_Relase_Door_PB: false }); e("out_Door_Unlock_Solonoeid", false, "50 ms after release");
  });
  check("ACC-C02-X", ["CVR-005"], "Unlock cannot coexist with upward command after open/reclose", { ...cover, ...rnd }, (r, e) => {
    r.runFor(1200, { in_Relase_Door_PB: true });
    r.runFor(50, { in_Door_Monitor: false });
    r.runFor(100, { in_Relase_Door_PB: false });
    r.runFor(2100, { in_Door_Monitor: true, in_Reset_PB: true, in_Relase_Door_PB: true });
    e("Unlock AND StepUp", false, "after reclose and qualified chord",
      r.get("out_Door_Unlock_Solonoeid") && r.get("b_Set_Transition_3"));
  });
  const chain = Object.fromEntries([1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12].map(i => [`Network${i}`, []]));
  for (const phase of ["Step1", "Step_RnD", "Step3"]) {
    check(`ACC-C01-E-${phase}`, ["EMG-001", "EMG-007"], `Blue held across NC1 loss/restoration from ${phase}`, chain, (r, e) => {
      r.setInputs(Object.fromEntries(model.variables.filter(v => !v.sourcePorts.length).map(v => [v.name, false])));
      r.setInputs({ in_ES_NC_1: true, in_ES_NC_2: true, in_InterLock_NC_1: true,
        in_InterLock_NC_2: true, in_LV_Connector_Interlock: true, in_HV_Connector_Interlock: true,
        in_Door_Monitor: true, in_LV_C1_FBK: phase !== "Step1", in_HV_C2_FBK: phase === "Step3" });
      r.runFor(200);
      for (const b of r.model.networks.flatMap(n => n.blocks).filter(b => b.functionName === "safeRs")) {
        const value = b.outputs.some(o => o.globals.some(g => g.lastKnownPath === `GVL1.b_${phase}`)) ||
          (b.path === "//Network1/FBRs1" && phase !== "Step1") ||
          (["//Network1/FBRs2", "//Network1/FBRs3", "//Network1/FBRs4"].includes(b.path) && phase === "Step3");
        r.memory.set(b.path, { value }); r.write(b.outputs[0], value);
      }
      const estop = r.model.networks.flatMap(n => n.blocks).find(b => b.functionName === "safeEstop");
      r.memory.set(estop.path, { enabled: true, restartArmed: false, delayed: true, offElapsedMs: 0 });
      r.write(estop.outputs.find(p => p.name === "EStopOut"), true);
      r.runFor(1200, { in_Relase_Door_PB: true });
      e("out_Door_Unlock_Solonoeid", phase !== "Step3", "blue held before fault");
      r.runFor(100, { in_ES_NC_1: false });
      e("b_EStop_Ok", false, "100 ms after NC1 loss");
      e("out_Door_Unlock_Solonoeid", false, "blue held during NC1 fault");
      r.runFor(500, { in_ES_NC_1: true });
      e("out_Door_Unlock_Solonoeid", false, "blue held after NC1 restored without Reset");
    });
  }
  for (const [id, req, reason] of [
    ["ACC-B01", ["BTN-001", "BTN-002", "BOOT-002"], "Complete recognizer/reset ownership is not yet bound across Safe/R&D/Run"],
    ["ACC-C02-F", ["CVR-004", "CVR-006"], "Preservation of existing DoorMonitor conditions and cover reactions not fully covered; no new separate locked-feedback guard is required"],
    ["ACC-C01-E", ["EMG-007"], "Software coverage of all transition phases and emergency source/button combinations is incomplete"]
  ]) results.push({ id, requirements: req, status: "NOT VERIFIED", reason });
  return [...results, ...currentGestureBoundaryChecks(model)];
}
