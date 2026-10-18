import { ButtonRecognizer } from "./button-recognizer.js";

export const Mode = Object.freeze({
  EMERGENCY: "Emergency",
  SAFE: "Safe",
  STARTING_RND: "StartingRnD",
  RND: "R&D",
  STARTING_RUN: "StartingRun",
  RUN: "Run",
  STOPPING_SS1: "StoppingSS1",
  STO_COAST: "STOCoastWait",
  DISCHARGING: "HVDischarging",
  DISCONNECTING: "HVDisconnecting",
  STOPPING_SAFE: "StoppingToSafe",
  EMERGENCY_COAST: "EmergencySTOCoastWait",
  EMERGENCY_DISCHARGING: "EmergencyHVDischarging",
  EMERGENCY_DISCONNECTING: "EmergencyHVDisconnecting",
  FAULT: "TransitionFault"
});

export const defaultInputs = () => ({
  green: false,
  blue: false,
  eStopOk: true,
  coverClosed: true,
  coverLocked: true,
  lvConnectorInterlock: true,
  hvConnectorInterlock: true,
  externalInterlockCh1: true,
  externalInterlockCh2: true,
  lvFeedback: false,
  c2Feedback: false,
  healthy: false,
  dischargeComplete: false,
  criticalFault: false
});

export class SafetyModel {
  constructor(config = {}) {
    this.cfg = {
      ss1Ms: config.ss1Ms ?? 3000,
      normalStopWaitMs: config.normalStopWaitMs ?? 1000,
      stoCoastMs: config.stoCoastMs ?? 5000,
      lvOnTimeoutMs: config.lvOnTimeoutMs ?? 5000,
      c2OnTimeoutMs: config.c2OnTimeoutMs ?? 5000,
      dischargeTimeoutMs: config.dischargeTimeoutMs ?? 10000,
      c2OffTimeoutMs: config.c2OffTimeoutMs ?? 5000,
      lvOffTimeoutMs: config.lvOffTimeoutMs ?? 5000,
      ...config
    };
    this.buttons = new ButtonRecognizer(config.buttons);
    this.mode = Mode.SAFE;
    this.phaseMs = 0;
    this.fault = null;
    this.faultOutputs = {};
    this.outputs = {};
  }

  tick(dt, input) {
    const i = { ...defaultInputs(), ...input };
    const gesture = this.buttons.tick(dt, i.green, i.blue);
    this.phaseMs += dt;

    const emergencySequence = [Mode.EMERGENCY, Mode.EMERGENCY_COAST, Mode.EMERGENCY_DISCHARGING, Mode.EMERGENCY_DISCONNECTING];
    const coverHazardModes = [Mode.STARTING_RUN, Mode.RUN, Mode.STOPPING_SS1, Mode.STO_COAST, Mode.DISCHARGING, Mode.DISCONNECTING];
    const connectorLost = !i.lvConnectorInterlock || !i.hvConnectorInterlock;
    const externalEmergencyLost = !i.externalInterlockCh1 || !i.externalInterlockCh2;
    if (externalEmergencyLost && !emergencySequence.includes(this.mode)) {
      this.requestEmergency("external_emergency_interlock_lost");
    } else if (connectorLost && this.mode !== Mode.SAFE && !emergencySequence.includes(this.mode)) {
      this.requestEmergency("power_connector_interlock_lost");
    } else if ((!i.coverClosed || !i.coverLocked) && coverHazardModes.includes(this.mode)) {
      this.requestEmergency("cover_interlock_lost_hazardous");
    } else if ((!i.eStopOk || i.criticalFault) && !emergencySequence.includes(this.mode)) {
      this.requestEmergency();
    }

    switch (this.mode) {
      case Mode.SAFE:
        if (gesture.stepUp && i.coverClosed && i.coverLocked &&
            i.lvConnectorInterlock && i.hvConnectorInterlock && !i.criticalFault) {
          this.enter(Mode.STARTING_RND);
        }
        break;
      case Mode.STARTING_RND:
        if (!i.coverClosed || !i.coverLocked) this.enter(Mode.FAULT, "cover_interlock_lost");
        else if (i.lvFeedback) this.enter(Mode.RND);
        else if (this.phaseMs >= this.cfg.lvOnTimeoutMs) this.enter(Mode.FAULT, "lv_on_timeout");
        break;
      case Mode.RND:
        if (gesture.stepDown) this.enter(Mode.STOPPING_SAFE);
        else if (gesture.stepUp && i.coverClosed && i.coverLocked && i.healthy) this.enter(Mode.STARTING_RUN);
        break;
      case Mode.STARTING_RUN:
        if (!i.coverClosed || !i.coverLocked || !i.healthy) this.enter(Mode.FAULT, "run_interlock_lost");
        else if (i.c2Feedback) this.enter(Mode.RUN);
        else if (this.phaseMs >= this.cfg.c2OnTimeoutMs) this.enter(Mode.FAULT, "c2_on_timeout");
        break;
      case Mode.RUN:
        if (gesture.stepDown) this.enter(Mode.STOPPING_SS1);
        break;
      case Mode.STOPPING_SS1:
        if (!i.healthy) this.enter(Mode.STO_COAST);
        else if (this.phaseMs >= this.cfg.ss1Ms + this.cfg.normalStopWaitMs) this.enter(Mode.DISCHARGING);
        break;
      case Mode.STO_COAST:
        if (this.phaseMs >= this.cfg.stoCoastMs) this.enter(Mode.DISCHARGING);
        break;
      case Mode.DISCHARGING:
        if (i.dischargeComplete) this.enter(Mode.DISCONNECTING);
        else if (this.phaseMs >= this.cfg.dischargeTimeoutMs) {
          this.enter(Mode.FAULT, "discharge_timeout", { c2Command: true, discharge: true, sto: true });
        }
        break;
      case Mode.DISCONNECTING:
        if (!i.c2Feedback) this.enter(Mode.RND);
        else if (this.phaseMs >= this.cfg.c2OffTimeoutMs) this.enter(Mode.FAULT, "c2_off_timeout");
        break;
      case Mode.STOPPING_SAFE:
        if (!i.lvFeedback) this.enter(Mode.SAFE);
        else if (this.phaseMs >= this.cfg.lvOffTimeoutMs) this.enter(Mode.FAULT, "lv_off_timeout");
        break;
      case Mode.EMERGENCY_COAST:
        if (this.phaseMs >= this.cfg.stoCoastMs) this.enter(Mode.EMERGENCY_DISCHARGING);
        break;
      case Mode.EMERGENCY_DISCHARGING:
        if (i.dischargeComplete) this.enter(Mode.EMERGENCY_DISCONNECTING);
        break;
      case Mode.EMERGENCY_DISCONNECTING:
        if (!i.c2Feedback) this.enter(Mode.EMERGENCY);
        break;
      case Mode.EMERGENCY:
      case Mode.FAULT:
        break;
    }

    this.outputs = this.computeOutputs(i, gesture);
    this.assertInvariants(i);
    return this.snapshot(gesture);
  }

  enter(mode, fault = null, faultOutputs = {}) {
    this.mode = mode;
    this.phaseMs = 0;
    if (fault) {
      this.fault = fault;
      this.faultOutputs = { ...faultOutputs };
    }
  }

  requestEmergency(cause = null) {
    const hvMayBeEnergized = [
      Mode.STARTING_RUN,
      Mode.RUN,
      Mode.STOPPING_SS1,
      Mode.STO_COAST,
      Mode.EMERGENCY_COAST
    ].includes(this.mode);
    const dischargeInProgress = this.mode === Mode.DISCHARGING ||
      (this.mode === Mode.FAULT && this.faultOutputs.discharge === true);

    if (hvMayBeEnergized) this.enter(Mode.EMERGENCY_COAST, cause);
    else if (dischargeInProgress) this.enter(Mode.EMERGENCY_DISCHARGING, cause);
    else if (this.mode === Mode.DISCONNECTING) this.enter(Mode.EMERGENCY_DISCONNECTING, cause);
    else this.enter(Mode.EMERGENCY, cause);
  }

  computeOutputs(i, gesture) {
    const runEnergy = [
      Mode.STARTING_RUN, Mode.RUN, Mode.STOPPING_SS1, Mode.STO_COAST, Mode.DISCHARGING,
      Mode.EMERGENCY_COAST, Mode.EMERGENCY_DISCHARGING
    ].includes(this.mode);
    const lvOn = ![Mode.SAFE, Mode.EMERGENCY, Mode.FAULT, Mode.STOPPING_SAFE].includes(this.mode);
    const outputs = {
      lvCommand: lvOn,
      c2Command: runEnergy,
      ss1: this.mode === Mode.STOPPING_SS1,
      sto: ![Mode.STARTING_RUN, Mode.RUN, Mode.STOPPING_SS1].includes(this.mode),
      discharge: [Mode.DISCHARGING, Mode.EMERGENCY_DISCHARGING].includes(this.mode),
      unlockCover: [Mode.SAFE, Mode.RND].includes(this.mode) && gesture.unlock,
      stepUpPulse: gesture.stepUp,
      stepDownPulse: gesture.stepDown
    };
    return this.mode === Mode.FAULT ? { ...outputs, ...this.faultOutputs, unlockCover: false } : outputs;
  }

  assertInvariants(i) {
    const o = this.outputs;
    if (o.unlockCover && ![Mode.SAFE, Mode.RND].includes(this.mode)) throw new Error("INV_UNLOCK_MODE");
    if (o.unlockCover && o.stepUpPulse) throw new Error("INV_UNLOCK_STEPUP");
    if (o.discharge && !o.c2Command) throw new Error("INV_DISCHARGE_REQUIRES_C2");
    if (this.mode === Mode.RND && i.c2Feedback) throw new Error("INV_RND_REQUIRES_C2_OFF");
    if (this.mode === Mode.RUN && (!i.coverClosed || !i.coverLocked)) throw new Error("INV_RUN_COVER");
  }

  snapshot(gesture) {
    return { mode: this.mode, phaseMs: this.phaseMs, fault: this.fault, gesture, outputs: { ...this.outputs } };
  }
}
