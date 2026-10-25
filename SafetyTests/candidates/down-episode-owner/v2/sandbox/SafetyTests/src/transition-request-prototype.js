// Conceptual request ownership only. No contactor/STO/discharge outputs.
const up = { Safe: "SafeToRnD", "R&D": "RnDToRun" };
const down = { "R&D": "RnDToSafe", Run: "RunToRnD" };
const target = { SafeToRnD: "R&D", RnDToRun: "Run", RnDToSafe: "Safe", RunToRnD: "R&D" };

export class TransitionRequestPrototype {
  constructor({ timeoutMs = {} } = {}) {
    for (const [route, ms] of Object.entries(timeoutMs)) {
      if (!(route in target) || !Number.isFinite(ms) || ms <= 0) throw new Error("Invalid illustrative route timeout");
    }
    this.timeoutMs = { ...timeoutMs };
    this.status = "Idle";
    this.request = null;
    this.elapsed = 0;
    this.reason = null;
    this.previous = { stepUp: false, stepDown: false, manualRecoveryPulse: false };
  }
  tick(dt, i) {
    if (!Number.isFinite(dt) || dt <= 0) throw new Error("Positive finite sample required");
    const edges = Object.fromEntries(Object.keys(this.previous).map(k => [k, Boolean(i[k]) && !this.previous[k]]));
    this.previous = Object.fromEntries(Object.keys(this.previous).map(k => [k, Boolean(i[k])]));
    let accepted = null, completed = null, rejected = null;
    if (i.emergency || i.fault || i.invalidState || !["Safe", "R&D", "Run"].includes(i.mode)) {
      this.status = "Emergency";
      this.reason ??= i.invalidState ? "invalid_state" : "emergency_or_fault";
    } else if (this.status === "Emergency") {
      if (i.hazardRemoved === true && edges.manualRecoveryPulse) {
        completed = { route: "EmergencyRecovery", target: "Safe" };
        this.status = "Idle"; this.request = null; this.elapsed = 0; this.reason = null;
      }
    } else if (this.status === "Active") {
      this.elapsed += dt;
      const done = i.completion?.[this.request] === true;
      if (done) {
        completed = { route: this.request, target: target[this.request] };
        this.status = "Idle"; this.request = null; this.elapsed = 0;
      } else if (this.timeoutMs[this.request] && this.elapsed >= this.timeoutMs[this.request]) {
        this.status = "Emergency"; this.reason = "transition_timeout";
      }
      // No new operator command is consumed while this request owns the cycle.
    } else {
      const route = edges.stepDown ? down[i.mode] : edges.stepUp ? up[i.mode] : null;
      if (route) {
        const allowed = edges.stepDown ? i.allowDown === true : i.allowUp === true;
        if (!allowed) rejected = "acceptance_guard_false";
        else if (i.completion?.[route] === true) rejected = "completion_already_high";
        else {
          accepted = route; this.request = route; this.status = "Active"; this.elapsed = 0;
        }
      }
    }
    return { status: this.status, request: this.status === "Active" ? this.request : null,
      interruptedRequest: this.status === "Emergency" ? this.request : null, accepted, completed, rejected,
      requestEmergency: this.status === "Emergency", reason: this.reason,
      transitionActive: this.status !== "Idle", inhibitRecognizer: this.status !== "Idle" };
  }
}
