// VIS-LED (Vadim 2026-10-29): display-only dashboard LEDs (Red/Green/Blue) in manual mode.
// PLC LED logic replica (act_LED_Control), not PLC execution. Never changes the SAL run.
import { createLedControl, LED_INPUT_KEYS } from "../test/independent/act-led-control.mjs";

// Q-LED-5 (Vadim, final): SolenoedMonitor is legacy, not written by the PLC -> constant FALSE.
export const SOLENOID_MONITOR_CONST = false;
export const SOLENOID_CAPTION = "SolenoedMonitor: FALSE (legacy, not written by PLC)";
export const LED_CAPTION = "PLC LED logic replica (act_LED_Control), not PLC execution";

// Bindings = SAL variable whose aliasDeviceIoUsage sdsId equals the tsproj "Standard Out/In Var N" linked to the ST_TwinSAFE_IN/OUT field.
// LED input -> SAL name (alias device in Alias Devices/PLC_IO, ST_TwinSAFE_IN field). null = resolved by function below.
const NAMES = { EStop_Ok: "out_EStop_Ok_Plc", EStop_Status: "out_EStop_Status", TransitionStep: "out_TransitionStep", Safety_Armed: "out_Safety_Armed",
  step1: "out_Step1", step2: "out_Step2", step4: "out_Step4", step5: "out_Step5", step6: "out_Step6",
  STS_SAFE: "STS_SAFE", STS_RND: "STS_RND", STS_RUN: "STS_RUN", STS_EMG: "STS_EMG", DoorMonitor: "in_Door_Monitor" };

export function resolveLedInputs(P) {
  const map = {}; const missing = [];
  const has = n => n && P.names.has(n);
  for (const [k, n] of Object.entries(NAMES)) { if (has(n)) map[k] = n; else missing.push(k); }
  const cfg = P.sym("CFG"); if (has(cfg)) map.STS_CFG = cfg; else missing.push("STS_CFG");
  const flt = has("STS_FAULT") ? "STS_FAULT" : P.sym("FAULT"); if (has(flt)) map.STS_FAULT = flt; else missing.push("STS_FAULT");
  // stepRnD: Speps.stepRnD = Standard Out Var 95 -> SAL variable with aliasDeviceIoUsage sdsId=95 = outPLC_RnD
  if (has("outPLC_RnD")) map.stepRnD = "outPLC_RnD"; else missing.push("stepRnD");
  return { map, missing };
}

export class LedPanel {
  constructor(P) {
    const r = resolveLedInputs(P); this.map = r.map; this.missing = r.missing;
    this.rep = createLedControl({ variant: "new" }); this.inp = {}; this.out = this.rep.scan({}, 0); this.n = 0; this.cache = null; this.cacheN = -1;
  }
  scan(rt) { // after each SAL scan, dt = 1 ms
    const i = {}; for (const k of LED_INPUT_KEYS) i[k] = false;
    for (const [k, n] of Object.entries(this.map)) i[k] = !!rt.get(n);
    i.SolenoedMonitor = SOLENOID_MONITOR_CONST;
    this.inp = i; this.out = this.rep.scan(i, 1); this.n++;
  }
  // classification by probing the same inputs with the pulse generators forced to both phases (dt 0, only when polled)
  state() {
    if (this.cacheN === this.n && this.cache) return this.cache;
    const probe = (bPulse, bFaultPulse) => createLedControl({ variant: "new", initial: { bPulse, bFaultPulse } }).scan(this.inp, 0);
    const p0 = probe(false, false), p1 = probe(true, false), f1 = probe(false, true);
    const o = this.out, slow = o.t_BlinkTimeMs >= 1000;
    const mode = (key, cur) => {
      if (this.inp.STS_FAULT && (p0[key] !== f1[key])) return "fault";
      if (p0[key] !== p1[key]) return slow ? "blink-slow" : "blink-fast";
      return cur ? "on" : "off";
    };
    const L = { red: [o.RedLED, "RedLED"], green: [o.GreenLED, "GreenLED"], blue: [o.BlueLED, "BlueLED"] };
    const leds = {}; for (const [k, [v, key]] of Object.entries(L)) leds[k] = { on: !!v, mode: mode(key, v) };
    this.cache = { leds, tBlinkMs: o.t_BlinkTimeMs, faultInput: !!this.inp.STS_FAULT, caption: LED_CAPTION, solenoid: SOLENOID_CAPTION,
      notMapped: this.missing, bindings: { ...this.map } };
    this.cacheN = this.n; return this.cache;
  }
}
