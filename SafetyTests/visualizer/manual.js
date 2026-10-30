// VIS manual mode (VIS-Q3): one runtime x=P.create() (catalog plant A2, scan 1 ms), virtual clock t = scans executed.
// run/pause, 1-scan step, advance N ms, speed x0.1..x10; inputs are queued and applied at the start of the next scan.
// Timeline = change-encoded ring buffer of the last 120 s of virtual time. No session recording.
import { OUT } from "../test/helpers/catalog-program.js";
import { LedPanel } from "./led.js";

export const FBK = ["in_LV_C1_FBK", "in_HV_C2_FBK", "in_STO_DR1_FBK", "in_STO_DR2_FBK"];
export const CONSTANT_INPUTS = ["in_Safety_Run", "in_False_SI2_CH8"];
const RING_MS = 120000, MAX_PER_TICK = 2000, MAX_ADVANCE = 120000;
// VIS-3: button-filter readiness (p.9: both buttons released continuously 1000 ms of model time, requirement constant per TMR-1, NOT taken from the SAL); SAL flag = RELEASE safeTon TonOut
export const FILTER_MS = 1000, FILTER_BTNS = ["in_Reset_PB", "in_Relase_Door_PB"], SAL_FLAG_PATH = "//RndPhysicalCompact/RELEASE";
const DERIVED = ["STO", "fault", "plcFault", "cover"];
let session = null;

class Session {
  constructor(P, { plant, inputNames, unmapped }) {
    this.P = P; this.x = P.create(); this.running = false; this.speed = 1; this.accum = 0; this.lag = false; this.err = null;
    this.queue = {}; this.cur = new Map(); this.changes = []; this.base = new Map(); this.plant = true;
    this.unmapped = new Set(unmapped);
    this.allInputs = inputNames;
    this.inputNames = inputNames.filter(n => !this.unmapped.has(n));
    this.timers = P.blocks.filter(b => b.functionName === "safeTon").map(b => ({ path: b.path, preset: Number(b.parameters.find(p => p.timing)?.timing ?? 0) * 1000 }));
    const rb = P.blocks.find(b => b.path === SAL_FLAG_PATH && b.functionName === "safeTon");
    this.flagBlk = rb ? { path: rb.path, presetMs: Number(rb.parameters.find(p => p.timing)?.timing ?? 0) * 1000 } : null;
    this.filterMs = FILTER_MS; // requirement constant (p.9 / TMR-1); SAL preset is shown separately in sal.presetMs
    this.fAvail = FILTER_BTNS.every(n => this.inputNames.includes(n));
    this.fRelT = this.x.t + 1; this.fPressed = false; this.fStreak = 0; this.fDiv = false; this.fLastDivT = null; this.fReady = false; this.fSal = null; this.fCompared = false;
    this.led = new LedPanel(P); // VIS-LED: display only, replica reset = new session
    this.setPlant(plant); this.record(true);
    this.lastWall = Date.now(); this.iv = setInterval(() => this.tick(), 20);
  }
  setPlant(on) {
    this.plant = !!on;
    if (!on) for (const n of FBK) this.x.hold[n] = this.x.r.get(n); else for (const n of FBK) delete this.x.hold[n];
  }
  record(initial = false) {
    const x = this.x, s = x.log.at(-1), t = x.t; const set = (n, v) => { if (this.cur.get(n) !== v) { this.cur.set(n, v); this.changes.push({ t, n, v }); } };
    for (const n of this.inputNames) set("in:" + n, x.r.get(n));
    if (s) { for (const k of OUT) set(k, !!s[k]); for (const k of DERIVED) set(k, s[k] === undefined ? false : !!s[k]); set("st", s.st.join("+")); set("stg", s.stg); }
    else { for (const k of OUT) set(k, !!x.r.get(k)); set("st", x.status().join("+")); set("stg", x.stages().join("+")); }
    const lim = t - RING_MS; let i = 0; while (i < this.changes.length && this.changes[i].t < lim) { this.base.set(this.changes[i].n, this.changes[i].v); i++; }
    if (i) this.changes.splice(0, i);
  }
  scan1() {
    const q = this.queue; this.queue = {};
    if (Object.keys(q).length) { try { this.x.set(q); } catch (e) { this.err = String(e.message); } }
    this.x.step({}, 1); this.led.scan(this.x.r); this.filterScan(); this.record();
  }
  // per scan, from the inputs the SAL actually used (applied values), in model time x.t
  filterScan() {
    if (!this.fAvail) return;
    const x = this.x, t = x.t, pressed = FILTER_BTNS.some(n => !!x.r.get(n));
    if (pressed) { this.fRelT = null; this.fLastDivT = null; this.fStreak = 0; this.fDiv = false; }
    else if (this.fRelT === null) this.fRelT = t;
    this.fPressed = pressed;
    this.fReady = !pressed && this.fRelT !== null && t - this.fRelT >= this.filterMs;
    this.fSal = this.flagBlk ? !!x.r.get(this.flagBlk.path + "/TonOut") : null;
    const st = x.status(); this.fCompared = this.fSal !== null && st.length === 1 && (st[0] === "SAFE" || st[0] === "RND");
    if (this.fCompared && this.fReady !== this.fSal) { this.fStreak++; } else this.fStreak = 0;
    this.fDiv = this.fStreak >= 2; if (this.fDiv) this.fLastDivT = t;
  }
  filterState() {
    const x = this.x, t = x.t;
    if (!this.fAvail) return { available: false, reason: "in_Reset_PB / in_Relase_Door_PB not mapped: not checked", presetMs: this.filterMs, relT: null, elapsed: 0, progress: 0, modelReady: false, pressed: false, sal: null, compared: false, diverged: false, lastDivergedT: null };
    const elapsed = this.fRelT === null ? 0 : Math.max(0, t - this.fRelT), st = x.status().join("+");
    const m = this.flagBlk ? x.r.memory.get(this.flagBlk.path) : null;
    const sal = this.flagBlk ? { found: true, path: this.flagBlk.path, presetMs: this.flagBlk.presetMs, value: !!this.fSal, elapsed: m?.elapsedMs ?? 0 }
      : { found: false, path: SAL_FLAG_PATH, presetMs: null, value: null, elapsed: 0, reason: "NOT CHECKED: block " + SAL_FLAG_PATH + " (safeTon) not found in the loaded SAL" };
    return { available: true, reason: null, presetMs: this.filterMs, relT: this.fRelT, elapsed, progress: Math.min(1, elapsed / this.filterMs), modelReady: this.fReady, pressed: this.fPressed, sal,
      compared: this.fCompared, notComparedReason: this.fCompared ? null : (this.flagBlk ? "not compared (status " + st + ")" : "SAL flag not checked"), diverged: this.fDiv, lastDivergedT: this.fLastDivT };
  }
  advance(n) { for (let i = 0; i < n; i++) this.scan1(); this.trim(); }
  trim() { const x = this.x; if (x.log.length > 4000) x.log.splice(0, x.log.length - 2000); for (const h of [x.hist.c1, x.hist.c2]) if (h.length > 400) h.splice(0, h.length - 200); }
  tick() {
    const now = Date.now(), dt = now - this.lastWall; this.lastWall = now;
    if (!this.running) return;
    this.accum += dt * this.speed; let n = Math.floor(this.accum); this.accum -= n;
    if (n > MAX_PER_TICK) { n = MAX_PER_TICK; this.accum = 0; this.lag = true; } else this.lag = false;
    this.advance(n);
  }
  state(since = -1) {
    const x = this.x, s = x.log.at(-1) ?? {};
    const rows = this.allInputs.map(n => ({ name: n, value: x.r.get(n), unmapped: this.unmapped.has(n), constant: CONSTANT_INPUTS.includes(n),
      held: Object.hasOwn(x.hold, n) ? x.hold[n] : null, fbk: FBK.includes(n) }));
    const timers = this.timers.map(tm => { const m = x.r.memory.get(tm.path); return { path: tm.path, elapsed: m?.elapsedMs ?? 0, preset: tm.preset, active: !!m?.previousEnabled }; })
      .filter(tm => tm.active || tm.elapsed > 0);
    const outputs = {}; for (const k of OUT) outputs[k] = !!x.r.get(k);
    return { t: x.t, running: this.running, speed: this.speed, lag: this.lag, plant: this.plant, error: this.err, status: x.status(), stages: x.stages(),
      fault: x.faultName ? x.r.get(x.faultName) : null, plcFault: x.plcFaultName ? x.r.get(x.plcFaultName) : null, cover: x.coverName ? x.r.get(x.coverName) : null,
      sto: s.STO ?? null, filter: this.filterState(), led: this.led.state(), outputs, inputs: rows, pending: { ...this.queue }, timers,
      since, ringMs: RING_MS, base: since < 0 ? Object.fromEntries(this.base) : undefined, changes: this.changes.filter(c => c.t > since) };
  }
  stop() { clearInterval(this.iv); }
}

export function startSession(P, opts) { session?.stop(); session = new Session(P, opts); return session.state(-1); }
export function stopSession() { session?.stop(); session = null; }
const need = () => { if (!session) throw new Error("manual session not started"); return session; };
export function command({ cmd, ms, speed, on }) {
  const s = need(); s.err = null;
  if (speed !== undefined) { const v = Number(speed); if (!(v >= 0.1 && v <= 10)) throw new Error("speed 0.1..10"); s.speed = v; }
  if (cmd === "run") { s.running = true; s.lastWall = Date.now(); }
  else if (cmd === "pause") s.running = false;
  else if (cmd === "step") { s.running = false; s.advance(1); }
  else if (cmd === "advance") { const n = Math.floor(Number(ms)); if (!(n >= 1 && n <= MAX_ADVANCE)) throw new Error(`ms: 1...${MAX_ADVANCE}`); s.running = false; s.advance(n); }
  else if (cmd === "plant") s.setPlant(!!on);
  else if (cmd !== undefined && cmd !== "speed") throw new Error("unknown command: " + cmd);
  return s.state(-1);
}
export function setInputs(values) {
  const s = need(); s.err = null;
  // validate everything first so a multi-signal request (button pair) is applied all-or-nothing, in one scan
  for (const n of Object.keys(values)) {
    if (!s.inputNames.includes(n)) throw new Error(s.unmapped.has(n) ? `input "${n}" is not mapped - unavailable` : `unknown input: ${n}`);
    if (CONSTANT_INPUTS.includes(n)) throw new Error(`input "${n}" is a stand constant`);
  }
  for (const [n, v] of Object.entries(values)) { if (FBK.includes(n)) s.x.hold[n] = !!v; else s.queue[n] = !!v; }
  return { pending: { ...s.queue } };
}
export function hold(values) {
  const s = need();
  for (const [n, v] of Object.entries(values)) {
    if (!s.inputNames.includes(n) || CONSTANT_INPUTS.includes(n)) throw new Error(`cannot hold: ${n}`);
    if (v === null) delete s.x.hold[n]; else s.x.hold[n] = !!v;
  }
  return { hold: { ...s.x.hold } };
}
export const getState = since => need().state(Number.isFinite(since) ? since : -1);
export const hasSession = () => !!session;
