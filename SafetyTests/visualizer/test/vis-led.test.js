// VIS-LED independent test (tester). Oracle: SCENARIO_DECISIONS.md "NIV-GAPS" (VIS-LED, Q-LED-1..4, 3a, 3b, Q-LED-5),
// program/analyst/NIV_LED_TRUTH_TABLE.md (row IDs LED-*). Bindings oracle: tsproj Mappings (ST_TwinSAFE_IN/OUT field ->
// "Standard Out/In Var N") joined with the SAL variable whose aliasDeviceIoUsage sdsId = N (Standard Out = SAL target usage,
// Standard In = SAL source usage). Expected LED modes are taken from the truth table, not from led.js.
// Assumptions (test-injected): synthetic SAL values are fed to LedPanel via a Map in place of the runtime (only get() used
// as the read interface of the manual session); 1 SAL scan = 1 ms (VIS_PLAN §6).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REPO, CANON_SAL, startServer } from "./_lib.mjs";
import { canonicalTarget } from "../target.js";
import { loadProgram } from "../model.js";
import { LedPanel } from "../led.js";
import { createLedControl } from "../../test/independent/act-led-control.mjs";

const TSPROJ = path.join(REPO, "MEN001_Dyno", "MEN001_Dyno.tsproj");
// tsproj field -> LED input key of act_LED_Control (PLC reads GVL_Safety.stTwinSAFE_IN / writes stTwinSAFE_OUT)
const IN_FIELDS = { EStop_Ok: "EStop_Ok", EStop_Status: "EStop_Status", TransitionStep: "TransitionStep", Safety_Armed: "Safety_Armed",
  "Speps^step1": "step1", "Speps^step2": "step2", "Speps^step4": "step4", "Speps^step5": "step5", "Speps^step6": "step6", "Speps^stepRnD": "stepRnD",
  STS_SAFE: "STS_SAFE", STS_RND: "STS_RND", STS_RUN: "STS_RUN", STS_CFG: "STS_CFG", STS_EMG: "STS_EMG", STS_FAULT: "STS_FAULT" };
// Lead's expected list (cross-check of the derivation below)
const LEAD = { EStop_Ok: ["out_EStop_Ok_Plc", 77], EStop_Status: ["out_EStop_Status", 78], TransitionStep: ["out_TransitionStep", 98],
  Safety_Armed: ["out_Safety_Armed", 53], step1: ["out_Step1", 65], step2: ["out_Step2", 66], step4: ["out_Step4", 68], step5: ["out_Step5", 69],
  step6: ["out_Step6", 70], stepRnD: ["outPLC_RnD", 95], STS_SAFE: [null, 14], STS_RND: [null, 100], STS_RUN: [null, 101], STS_EMG: [null, 102],
  STS_CFG: [null, 103], STS_FAULT: [null, 105], DoorMonitor: ["in_Door_Monitor", 16] };

function deriveBindings() {
  const tsp = fs.readFileSync(TSPROJ, "utf8"), sal = fs.readFileSync(CANON_SAL, "utf8");
  const vars = [];
  for (const m of sal.matchAll(/<variable Id="[^"]+" name="([^"]+)"[\s\S]*?<\/variable>/g)) {
    const body = m[0], src = body.split("<targetUsages>")[0], tgt = body.split("<targetUsages>")[1] ?? "";
    const ids = s => [...s.matchAll(/<aliasDeviceIoUsage [^>]*sdsId="(\d+)"/g)].map(a => Number(a[1]));
    vars.push({ name: m[1], src: ids(src), tgt: ids(tgt) });
  }
  const one = (side, n) => { const v = vars.filter(x => x[side].includes(n)); assert.equal(v.length, 1, `exactly one SAL variable with ${side} sdsId=${n}: ${v.map(x => x.name)}`); return v[0].name; };
  const exp = {}, sds = {};
  for (const [f, key] of Object.entries(IN_FIELDS)) {
    const re = new RegExp(`VarA="PlcTask Inputs\\^GVL_Safety\\.stTwinSAFE_IN\\^${f.replace("^", "\\^")}" VarB="StandardInputs\\^Standard Out Var (\\d+)"`);
    const m = tsp.match(re); assert.ok(m, "tsproj link for IN." + f); sds[key] = Number(m[1]); exp[key] = one("tgt", sds[key]);
  }
  const dm = tsp.match(/VarA="PlcTask Outputs\^GVL_Safety\.stTwinSAFE_OUT\^DoorMonitor" VarB="StandardOutputs\^Standard In Var (\d+)"/);
  assert.ok(dm); sds.DoorMonitor = Number(dm[1]); exp.DoorMonitor = one("src", sds.DoorMonitor);
  const sol = tsp.match(/VarA="PlcTask Outputs\^GVL_Safety\.stTwinSAFE_OUT\^SolenoedMonitor" VarB="StandardOutputs\^Standard In Var (\d+)"/);
  const solVar = sol ? vars.find(x => x.src.includes(Number(sol[1])))?.name ?? null : null;
  return { exp, sds, solVar };
}

let P, B;
const load = () => { if (!P) { P = loadProgram(canonicalTarget(), null).P; B = deriveBindings(); } };

// panel fed with synthetic values: led-key inputs mapped through the ORACLE bindings
function feed(panel, inputs, extra = {}) {
  const m = new Map(); for (const [k, n] of Object.entries(B.exp)) m.set(n, !!inputs[k]);
  for (const [n, v] of Object.entries(extra)) m.set(n, v);
  panel.scan(m); return panel.state();
}
const SAFE_IDLE = { STS_SAFE: true, step1: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true };

test("VIS-LED bindings = tsproj Standard Out/In Var N -> SAL aliasDeviceIoUsage sdsId N", () => {
  load();
  for (const [k, [name, n]] of Object.entries(LEAD)) { assert.equal(B.sds[k], n, `sdsId ${k}`); if (name) assert.equal(B.exp[k], name, `SAL var ${k}`); }
  for (const k of ["STS_SAFE", "STS_RND", "STS_RUN", "STS_EMG", "STS_CFG", "STS_FAULT"]) assert.equal(B.exp[k], k, `SAL var for ${k}`);
  const st = new LedPanel(P).state();
  assert.deepEqual(st.bindings, B.exp, "panel bindings == derived oracle (SolenoedMonitor not bound, Q-LED-5)");
  assert.deepEqual(st.notMapped, [], "canonical: no LED input not mapped");
  assert.ok(!("SolenoedMonitor" in st.bindings), "SolenoedMonitor constant FALSE, not bound (Q-LED-5)");
});

test("VIS-LED mode classification per truth table", async t => {
  load();
  const cases = [
    // [ID, inputs, expected {red, green, blue}] (undefined = not asserted)
    ["LED-R1 Ok&Status", { ...SAFE_IDLE }, { red: "off" }],
    ["LED-R2 !Ok&Status blink (T4 slow)", { EStop_Status: true }, { red: "blink-slow" }],
    ["LED-R3 !Ok&!Status", {}, { red: "on" }],
    ["LED-R4 Ok&!Status on (Q-LED-4)", { EStop_Ok: true }, { red: "on" }],
    ["LED-G1/B5 power-up Safe", { ...SAFE_IDLE }, { green: "blink-slow", blue: "blink-slow" }],
    ["LED-G2/T3 Safe after R&D->Safe, TS (Q-LED-1)", { ...SAFE_IDLE, TransitionStep: true }, { green: "blink-slow", blue: "blink-slow" }],
    ["LED-G3/B4 Safe->R&D transition", { STS_SAFE: true, TransitionStep: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true }, { green: "blink-fast", blue: "off" }],
    ["LED-B4 Safe, no step1, lid open", { STS_SAFE: true, TransitionStep: true, EStop_Ok: true, EStop_Status: true }, { blue: "off" }],
    ["LED-G6/B8 R&D idle lid closed", { STS_RND: true, stepRnD: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true }, { red: "off", green: "on", blue: "blink-slow" }],
    ["LED-B9 R&D lid open", { STS_RND: true, stepRnD: true, EStop_Ok: true, EStop_Status: true }, { green: "on", blue: "on" }],
    ["LED-B6 Safe lid open", { STS_SAFE: true, step1: true, EStop_Ok: true, EStop_Status: true }, { blue: "on", green: "off" }],
    ["LED-B1 Run", { STS_RUN: true, step4: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true }, { blue: "off", green: "off" }],
    ["LED-B2 Cfg", { STS_CFG: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true }, { blue: "off" }],
    ["LED-B3 Emg", { STS_EMG: true, DoorMonitor: true }, { blue: "off", red: "on" }],
    ["LED-B11 no STS bit", { step1: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true }, { blue: "off" }],
    ["LED-T1 step2 fast", { STS_RND: true, step2: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true }, { green: "on", blue: "blink-fast" }],
    ["LED-F1 fault Safe idle (red per R1)", { ...SAFE_IDLE, STS_FAULT: true }, { green: "fault", blue: "fault", red: "off" }],
    ["LED-F1 fault, red per R2", { STS_SAFE: true, step1: true, EStop_Status: true, DoorMonitor: true, STS_FAULT: true }, { green: "fault", blue: "fault", red: "blink-slow" }],
    ["LED-F2 fault+Emg", { STS_EMG: true, STS_FAULT: true }, { green: "fault", blue: "fault", red: "on" }],
    ["LED-F3 fault, no STS", { EStop_Ok: true, EStop_Status: true, STS_FAULT: true }, { green: "fault", blue: "fault", red: "off" }],
  ];
  for (const [id, inp, exp] of cases) await t.test(id, () => {
    const p = new LedPanel(P); feed(p, inp); const s = feed(p, inp);
    for (const [led, mode] of Object.entries(exp)) assert.equal(s.leds[led].mode, mode, `${id}: ${led}`);
    assert.equal(s.faultInput, !!inp.STS_FAULT);
  });
  await t.test("Q-LED-5: SolenoedMonitor SAL source (if any) does not light blue in R&D with lid closed", () => {
    const p = new LedPanel(P); const extra = B.solVar ? { [B.solVar]: true } : {};
    t.diagnostic("SolenoedMonitor SAL variable: " + B.solVar);
    const inp = { STS_RND: true, stepRnD: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true };
    feed(p, inp, extra); assert.equal(feed(p, inp, extra).leds.blue.mode, "blink-slow");
  });
});

// lamp stream over time vs replica (same input sequence, dt 1 ms) + timing from the oracle
function stream(inpSeq) {
  load(); const p = new LedPanel(P); const rep = createLedControl({ variant: "new" }); rep.scan({}, 0);
  const out = [];
  for (const inp of inpSeq) { const s = feed(p, inp); const o = rep.scan({ ...inp, SolenoedMonitor: false }, 1);
    out.push({ r: s.leds.red.on, g: s.leds.green.on, b: s.leds.blue.on, o }); }
  return out;
}
const edges = (a, k) => { const e = []; for (let i = 1; i < a.length; i++) if (a[i][k] !== a[i - 1][k]) e.push(i); return e; };

test("VIS-LED lamp values == replica; blink phases per LED-T*/LED-F4", async t => {
  const seq = [...Array(4000).fill(SAFE_IDLE), ...Array(1500).fill({ ...SAFE_IDLE, STS_FAULT: true }),
    ...Array(1000).fill({ STS_SAFE: true, TransitionStep: true, EStop_Ok: true, EStop_Status: true, DoorMonitor: true }),
    ...Array(1000).fill({ EStop_Ok: true })];
  const s = stream(seq);
  await t.test("on/off equals replica on every scan", () => {
    for (let i = 0; i < s.length; i++) assert.deepEqual([s[i].r, s[i].g, s[i].b], [s[i].o.RedLED, s[i].o.GreenLED, s[i].o.BlueLED], "scan " + i);
  });
  await t.test("LED-G1/B5 phase 1500 ms (+-1); green==blue (shared bPulse)", () => {
    const e = edges(s.slice(0, 4000), "g"); assert.ok(e.length >= 2, "green toggles: " + e);
    for (let i = 1; i < e.length; i++) assert.ok(Math.abs(e[i] - e[i - 1] - 1500) <= 1, "phase " + (e[i] - e[i - 1]));
    for (let i = 0; i < 4000; i++) assert.equal(s[i].b, s[i].g, "B5 uses same bPulse, scan " + i);
    for (let i = 0; i < 4000; i++) assert.equal(s[i].r, false, "R1");
  });
  await t.test("LED-F1/F4: fault green != blue every scan, phase 200 ms (+-1), red per R1", () => {
    const f = s.slice(4001, 5500); for (const x of f) { assert.notEqual(x.g, x.b); assert.equal(x.r, false); }
    const e = edges(f, "g"); assert.ok(e.length >= 5);
    for (let i = 1; i < e.length; i++) assert.ok(Math.abs(e[i] - e[i - 1] - 200) <= 1, "fault phase " + (e[i] - e[i - 1]));
  });
  await t.test("LED-G3/B4 after fault cleared (F5): blue off, green phase 500 ms (+-1)", () => {
    const f = s.slice(5501, 6500); for (const x of f) assert.equal(x.b, false);
    const e = edges(f, "g"); assert.ok(e.length >= 1);
    for (let i = 1; i < e.length; i++) assert.ok(Math.abs(e[i] - e[i - 1] - 500) <= 1, "fast phase " + (e[i] - e[i - 1]));
  });
  await t.test("LED-R4 red on steady", () => { for (const x of s.slice(6501)) assert.equal(x.r, true); });
});

test("VIS-LED display only: SAL run identical with and without panel scans", () => {
  load();
  const run = withPanel => {
    const x = P.create(); const p = withPanel ? new LedPanel(P) : null; const snaps = [];
    const plan = t => t === 10 ? { in_Reset_PB: true } : t === 110 ? { in_Reset_PB: false } : t === 2500 ? { in_Relase_Door_PB: true }
      : t === 3200 ? { in_Relase_Door_PB: false } : t === 3500 ? { in_Reset_PB: true } : t === 3600 ? { in_Reset_PB: false } : null;
    for (let t = 0; t < 5000; t++) {
      const q = plan(t); if (q) x.set(q);
      x.step({}, 1); if (p) { p.scan(x.r); p.state(); }
      if (t % 50 === 0 || q) snaps.push(JSON.stringify([x.t, x.status(), [...P.names].map(n => x.r.get(n))]));
    }
    return { snaps, st: x.status(), p };
  };
  const a = run(false), b = run(true);
  assert.equal(b.snaps.length, a.snaps.length);
  for (let i = 0; i < a.snaps.length; i++) assert.equal(b.snaps[i], a.snaps[i], "snapshot " + i);
  assert.deepEqual(b.st, a.st);
  const sts = new Set(a.snaps.map(x => JSON.stringify(JSON.parse(x)[1]))); assert.ok(sts.size >= 2, "non-trivial run (status changes): " + [...sts]);
});

test("VIS-LED manual session (server, canonical): state().led present, captions, no unmapped LED input", async () => {
  const srv = await startServer();
  try {
    const s0 = await srv.call("POST", "/api/manual/start", { target: "canonical", plant: true });
    assert.equal(s0.status, 200, s0.text);
    const s = (await srv.call("POST", "/api/manual/cmd", { cmd: "advance", ms: 20 })).json;
    assert.ok(s.led, "state().led exists");
    assert.match(s.led.caption, /not PLC execution/);
    assert.match(s.led.solenoid, /SolenoedMonitor/); assert.match(s.led.solenoid, /FALSE/);
    assert.deepEqual(s.led.notMapped, [], "no LED inputs reported as not mapped");
    load(); assert.deepEqual(s.led.bindings, B.exp);
    for (const k of ["red", "green", "blue"]) assert.ok(["off", "on", "blink-slow", "blink-fast", "fault"].includes(s.led.leds[k].mode), k);
  } finally { srv.stop(); }
});
