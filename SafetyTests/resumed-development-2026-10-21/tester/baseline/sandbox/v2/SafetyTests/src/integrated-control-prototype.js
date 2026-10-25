import { ButtonCoverPrototype } from "./button-cover-prototype.js";
import { NativeOwnerPlanRuntime, ownerRoutes } from "./native-owner-plan.js";

// Isolated contract composition: conceptual recognizer + native-style owner.
// External proof inputs are not a simulated or approved machine sequencer.
export class IntegratedControlPrototype {
  constructor() {
    this.buttons = new ButtonCoverPrototype();
    this.owner = new NativeOwnerPlanRuntime();
    this.timeMs = 0;
    this.interruptedContext = null;
    this.lastRecoveredContext = null;
  }
  tick(dt, i) {
    if (!Number.isFinite(dt) || dt <= 0 || dt > 10) throw new Error("Integrated prototype requires 1–10 ms samples");
    this.timeMs += dt;
    const previousRoutes = ownerRoutes.filter(r => this.owner.memory.get(`State.${r}`));
    const previousEmergency = this.owner.memory.get("State.Emergency");
    const previousBusy = previousEmergency || previousRoutes.length > 0;
    const buttons = this.buttons.tick(dt, { green: !!i.green, blue: !!i.blue, mode: i.mode,
      emergency: !!i.emergency || previousEmergency, fault: !!i.fault || !!i.invalidState,
      transition: previousBusy || !!i.transition, safeEnergyForAccess: i.safeEnergyForAccess === true });
    const inputs = Object.fromEntries(this.owner.plan.externalInputs.map(n => [n, false]));
    Object.assign(inputs, { ModeSafe: i.mode === "Safe", ModeRnD: i.mode === "R&D", ModeRun: i.mode === "Run",
      StepUp: buttons.stepUp, StepDown: buttons.stepDown, ManualRecovery: i.manualRecoveryPulse === true,
      AllowUp: i.allowUp === true, AllowDown: i.allowDown === true, Emergency: i.emergency === true,
      Fault: i.fault === true, InvalidState: i.invalidState === true || buttons.recognizerFault,
      HazardRemoved: i.hazardRemoved === true });
    for (const route of ownerRoutes) {
      inputs[`Complete.${route}`] = i.completion?.[route] === true;
      inputs[`Timeout.${route}`] = i.timeout?.[route] === true;
    }
    const owner = this.owner.scan(inputs);
    if (owner.emergency && !this.interruptedContext) {
      this.interruptedContext = {
        timeMs: this.timeMs, sourceMode: i.mode ?? null, routes: [...previousRoutes],
        // Diagnostic data only; missing proof remains missing, never assumed safe.
        energyContext: i.energyContext === undefined ? null : structuredClone(i.energyContext)
      };
    }
    if (owner.recovery) {
      this.lastRecoveredContext = this.interruptedContext;
      this.interruptedContext = null;
    }
    // Final same-frame gate uses the NEW owner state, not only the old busy bit.
    const unlock = buttons.unlock && !owner.busy && !owner.emergency && !i.emergency && !i.fault &&
      !i.invalidState && !i.transition && i.safeEnergyForAccess === true &&
      ["Safe", "R&D"].includes(i.mode) && i.blue === true && !i.green;
    return { timeMs: this.timeMs, buttons, owner, unlock,
      interruptedContext: this.interruptedContext ? structuredClone(this.interruptedContext) : null,
      recoveryTarget: owner.recovery ? "Safe" : null };
  }
}
