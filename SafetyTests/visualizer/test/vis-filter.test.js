// VIS-3: button-filter readiness indicator (display only) + English UI.
// Oracle sources (NOT the implementation):
//  - SCENARIO_DECISIONS "## VIS-3": VIS-3-Q1 = В (after each press: countdown per catalog p.9 "both released continuously" - 1 s since TMR-1-Q1 (was 2 s),
//    button inactive, then "ready"; next to it the SAL's own readiness flag if found/mapped, else "not checked"; mark "diverged" on
//    mismatch; display only, no influence on SAL/exam). VIS-3-Q2 (UI + HTML report in English; SAL signal names not translated).
//  - Catalog K-08 (Safe: BOTH, release; new BOTH before the filter -> not accepted, after -> accepted; source p.9).
//  - TMR-1-Q1 (Vadim 2026-10-28): RELEASE filter 2 s -> 1 s. P9 below is the REQUIREMENT value, not read from the SAL.
//    Env VIS_FILTER_SAL_DIR=<dir with TwinSafeGroup1.sal [+ GVL1.sgvl or ../GVLs/GVL1.sgvl]>: run subtests 1-8 on that SAL
//    (uploaded as a target) instead of "canonical". Canonical before transfer has RELEASE 2 s -> expected RED.
//  - VIS3_PLAN §2/§3/§5 for the API surface and the comparison scope: compared only in status SAFE / RND; tolerance 1 scan
//    (A-VIS3-2, lead assumption); RELEASE block //RndPhysicalCompact/RELEASE (safeTon) = SAL flag; constant P9 = p.9 (1000 ms, TMR-1-Q1).
// Assumptions (recorded, see program/tester/VIS3_TEST_REPORT.md):
//  - T1: a scan = 1 ms virtual; "release" = first scan on which both in_Reset_PB and in_Relase_Door_PB are FALSE.
//  - T2: inputs set while paused apply from the next scan (VIS-Q3); a press of N ms = N scans with the input TRUE.
//  - T3: VIS-3-Q3 (Vadim 2026-10-28) withdraws A-VIS3-1: buttons are never blocked; a press during the countdown reaches the SAL
//    input and resets the countdown, every release restarts it from zero. Big-button path = POST /api/manual/inputs (what the page
//    sends per VIS-2; momentary = true on press, false on release). DOM "not disabled" checked only by a static heuristic: NV in a browser.
//  - T4: plant=true (catalog plant: FBK / heartbeat auto) as in the other manual tests.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { startServer, filesOf, canonText, runExam, catalogTap, parseTap, sha, CANON_SAL, VIS, SCRATCH, CANON_SAL_SHA } from "./_lib.mjs";

const G = "in_Reset_PB", B = "in_Relase_Door_PB", P9 = 1000, CYR = /\p{Script=Cyrillic}/u;
const CANON_SHA = CANON_SAL_SHA;   // baseline after TMR-1 Verify 1912ad8 (was 53e9a6d8...8fbb, then 3511b31b...1743)

function api(c) {
  const cmd = async b => { const r = await c("POST", "/api/manual/cmd", b); assert.equal(r.status, 200, r.text); return r.json; };
  const set = async v => { const r = await c("POST", "/api/manual/inputs", v); assert.equal(r.status, 200, r.text); return r; };
  const st = async () => (await c("GET", "/api/manual/state")).json;
  const start = async (target, table) => { const r = await c("POST", "/api/manual/start", { target, table, plant: true }); assert.equal(r.status, 200, r.text); return r.json; };
  // press names for ms scans; returns {p: first pressed scan, r: first released scan, held, rel}
  const press = async (names, ms) => {
    await set(Object.fromEntries(names.map(n => [n, true])));
    const held = await cmd({ cmd: "step" }); const p = held.t;
    let last = held; if (ms > 1) last = await cmd({ cmd: "advance", ms: ms - 1 });
    await set(Object.fromEntries(names.map(n => [n, false])));
    const rel = await cmd({ cmd: "step" });
    return { p, r: rel.t, held, last, rel };
  };
  // from the current time, go to tgt-k and then step scan by scan to tgt+k; returns the per-scan samples
  const around = async (tgt, k = 3) => {
    const s0 = await st(); const out = [];
    if (tgt - k - s0.t > 0) out.push(await cmd({ cmd: "advance", ms: tgt - k - s0.t }));
    while (out.length === 0 || out.at(-1).t < tgt + k) out.push(await cmd({ cmd: "step" }));
    return out;
  };
  // boot (catalog rule: group start = EMG; Restart by green -> SAFE), then wait until the p.9 countdown is complete
  const boot = async () => {
    await cmd({ cmd: "advance", ms: 10 }); await press([G], 100);
    const s = await cmd({ cmd: "advance", ms: 2500 });
    assert.deepEqual(s.status, ["SAFE"], "boot: Restart by green -> SAFE"); assert.equal(s.filter.modelReady, true, "boot: filter ready");
    return s;
  };
  return { cmd, set, st, start, press, around, boot };
}
const firstTrue = (xs, f) => xs.find(f)?.t ?? null;

// Edge check per p.9: ready exactly at release+P9 (+-1 scan), not before; consistency elapsed = t - relT; progress.
function checkEdge(samples, r, { sal = true, label }) {
  const em = firstTrue(samples, s => s.filter.modelReady), es = firstTrue(samples, s => s.filter.sal?.value === true);
  assert.ok(em !== null && Math.abs(em - (r + P9)) <= 1, `${label}: model ready at release+${em - r}, expected ${P9} +-1 scan [VIS-3-Q1, p.9]`);
  for (const s of samples) {
    assert.equal(s.filter.presetMs, P9, `${label}: countdown length is P9 ms (p.9, TMR-1-Q1; VIS-3-Q3 "not 3 s")`);
    if (s.t < r + P9 - 1) assert.equal(s.filter.modelReady, false, `${label}: not ready at release+${s.t - r}`);
    if (s.t > r + P9 + 1) assert.equal(s.filter.modelReady, true, `${label}: ready at release+${s.t - r}`);
    assert.equal(s.filter.elapsed, s.t - s.filter.relT, `${label}: elapsed = t - relT (model time)`);
    assert.ok(Math.abs(s.filter.progress - Math.min(1, s.filter.elapsed / P9)) < 1e-6, `${label}: progress`);
  }
  if (sal) assert.ok(es !== null && Math.abs(es - (r + P9)) <= 1, `${label}: SAL RELEASE flag at release+${es - r}, expected ${P9} +-1 scan [plan §1]`);
  return { em, es };
}

test("VIS-3 filter readiness (manual mode API)", { timeout: 20 * 60 * 1000 }, async t => {
  const srv = await startServer(); const c = srv.call; const A = api(c);
  const canon = canonText(); const SD = process.env.VIS_FILTER_SAL_DIR;
  const sdSgvl = SD && [path.join(SD, "GVL1.sgvl"), path.join(SD, "..", "GVLs", "GVL1.sgvl")].find(p => fs.existsSync(p));
  const sal = SD ? fs.readFileSync(path.join(SD, "TwinSafeGroup1.sal"), "utf8") : canon.sal, sgvl = SD && sdSgvl ? fs.readFileSync(sdSgvl, "utf8") : canon.sgvl;
  let TGT = null; const startT = () => TGT ? A.start(TGT.id, TGT.auto) : A.start("canonical");
  t.diagnostic(`filter SAL: ${SD ? path.join(SD, "TwinSafeGroup1.sal") : "canonical"} sha256 ${sha(Buffer.from(sal))} sgvl ${SD ? (sdSgvl ?? "canonical") : "canonical"}`);
  try {
    const upload = async s => { const r = await c("POST", "/api/target", { files: filesOf({ sal: s, sgvl }) }); assert.equal(r.status, 200, r.text);
      assert.equal(r.json.parseError ?? null, null, "copy parses"); const mp = await c("GET", "/api/mapping?target=" + r.json.targetId);
      return { id: r.json.targetId, auto: Object.fromEntries(mp.json.rows.filter(x => x.loaded).map(x => [x.our, x.loaded])) }; };
    if (SD) TGT = await upload(sal);
    await t.test("1 Safe: green 100 ms -> ready at release+P9 (1000) +-1; SAL flag same; never diverged", async () => {
      await startT(); await A.boot();
      const pr = await A.press([G], 100);
      assert.equal(pr.held.filter.pressed, true, "pressed shown while held"); assert.equal(pr.held.filter.modelReady, false, "not ready while held");
      assert.equal(pr.last.filter.modelReady, false, "not ready at end of hold");
      assert.equal(pr.rel.filter.pressed, false); assert.equal(pr.rel.filter.relT, pr.r, "countdown starts at the first released scan");
      const mid = await A.cmd({ cmd: "advance", ms: P9 - 500 });
      assert.equal(mid.filter.modelReady, false, `release+${P9 - 500}: not ready [K-08]`); assert.equal(mid.filter.compared, true, "SAFE: compared");
      const sm = await A.around(pr.r + P9);
      checkEdge(sm, pr.r, { label: "green" });
      for (const s of [mid, ...sm]) { assert.equal(s.filter.diverged, false, "never diverged on canonical"); assert.equal(s.filter.lastDivergedT, null, "no divergence recorded (sticky witness)"); }
      assert.deepEqual(sm.at(-1).status, ["SAFE"]);
    });

    await t.test("1b blue alone also restarts the countdown (p.9: BOTH buttons released), mid-countdown press", async () => {
      await startT(); await A.boot();
      const p1 = await A.press([G], 100); await A.cmd({ cmd: "advance", ms: P9 / 2 });
      const p2 = await A.press([B], 300);
      assert.equal(p2.held.filter.pressed, true, "blue counts as pressed"); assert.equal(p2.held.filter.modelReady, false);
      assert.equal(p2.rel.filter.relT, p2.r, "countdown restarted at blue release");
      const x = await A.cmd({ cmd: "advance", ms: p1.r + P9 + 100 - p2.r });
      assert.equal(x.filter.modelReady, false, "old countdown (from the green release) must not complete");
      const sm = await A.around(p2.r + P9); checkEdge(sm, p2.r, { label: "blue" });
      assert.ok(sm.every(s => !s.filter.diverged && s.filter.lastDivergedT === null), "no divergence");
    });

    await t.test("2 BOTH Safe->R&D and R&D->Run: same timing; compared only in SAFE/RND; no divergence", async () => {
      await startT(); await A.boot();
      const p1 = await A.press([G, B], 1200);
      const s1 = await A.cmd({ cmd: "advance", ms: 1000 }); assert.deepEqual(s1.status, ["RND"], "BOTH in Safe -> R&D (reference flow)");
      assert.equal(s1.filter.compared, true, "RND: compared"); assert.equal(s1.filter.notComparedReason, null);
      const a1 = await A.around(p1.r + P9); checkEdge(a1, p1.r, { label: "BOTH Safe->R&D" });
      assert.ok(a1.every(s => s.filter.compared && !s.filter.diverged && s.filter.lastDivergedT === null), "RND: compared, no divergence");
      await A.cmd({ cmd: "advance", ms: 300 });
      const p2 = await A.press([G, B], 1200);
      const s2 = await A.cmd({ cmd: "advance", ms: 1000 }); assert.deepEqual(s2.status, ["RUN"], "BOTH in R&D -> Run");
      // plan §3: RUN is outside the comparison scope (K-10: BOTH ignored in Run) -> not compared, never diverged
      assert.equal(s2.filter.compared, false, "RUN: not compared [plan §3]"); assert.match(s2.filter.notComparedReason ?? "", /RUN/);
      const a2 = await A.around(p2.r + P9); checkEdge(a2, p2.r, { label: "BOTH R&D->Run" });
      assert.ok(a2.every(s => !s.filter.compared && !s.filter.diverged), "RUN: not compared, not diverged");
    });

    await t.test("3 K-08 early press at release+P9-500 via raw input: accepted by API, rejected by SAL, countdown restarts", async () => {
      await startT(); await A.boot();
      const p1 = await A.press([G], 100);
      const m = await A.cmd({ cmd: "advance", ms: P9 - 501 }); assert.equal(m.t, p1.r + P9 - 501); assert.equal(m.filter.modelReady, false);
      // press during the countdown: accepted (VIS-3-Q3: buttons never blocked)
      const p2 = await A.press([G, B], 1200);
      assert.equal(p2.held.filter.pressed, true); assert.equal(p2.held.filter.modelReady, false);
      assert.equal(p2.rel.filter.relT, p2.r, "countdown restarted at the new release");
      assert.equal(p2.rel.filter.elapsed, 0, "elapsed restarts from 0");
      const s = await A.cmd({ cmd: "advance", ms: 600 });
      assert.deepEqual(s.status, ["SAFE"], "K-08: BOTH 0.5 s after release is not accepted (stays SAFE) [p.9, TMR-1-Q1]");
      assert.equal(s.filter.modelReady, false, "not ready 600 ms after the new release (old countdown would have expired)");
      const a = await A.around(p2.r + P9); checkEdge(a, p2.r, { label: "after early press" });
      assert.ok(a.every(x => !x.filter.diverged) && a.at(-1).filter.lastDivergedT === null, "SAL agrees with the restarted countdown");
      await A.cmd({ cmd: "advance", ms: 500 - 3 });   // now release+P9+500
      await A.press([G, B], 1200); const s3 = await A.cmd({ cmd: "advance", ms: 500 });
      assert.deepEqual(s3.status, ["RND"], "K-08: BOTH P9+500 ms after release is accepted [p.9, TMR-1-Q1]");
    });

    await t.test("3b VIS-3-Q3: green / blue / Both pressed during the countdown are accepted (reach the SAL input) and every release restarts from zero", async () => {
      await startT(); await A.boot();
      const inp = (s, n) => s.inputs.find(x => x.name === n)?.value;
      let pr = await A.press([G], 100);
      for (const names of [[G], [B], [G, B], [G]]) {
        await A.cmd({ cmd: "advance", ms: P9 / 2 });   // mid-countdown
        const before = await A.st(); assert.equal(before.filter.modelReady, false, "countdown running");
        const q = await A.press(names, 200);
        for (const n of names) assert.equal(inp(q.held, n), true, `${names}: ${n} applied to the SAL input during the countdown`);
        for (const n of [G, B].filter(x => !names.includes(x))) assert.equal(inp(q.held, n), false);
        assert.equal(q.held.filter.pressed, true); assert.equal(q.held.filter.modelReady, false, "not ready while pressed");
        assert.equal(q.rel.filter.relT, q.r, `${names}: release restarts the countdown`); assert.equal(q.rel.filter.elapsed, 0, "from zero");
        assert.equal(q.rel.filter.progress, 0);
        assert.ok(q.r > pr.r + P9 / 2, "new release later than the previous one"); pr = q;
      }
      const sm = await A.around(pr.r + P9); checkEdge(sm, pr.r, { label: "after repeated presses" });
      assert.ok(sm.every(s => !s.filter.diverged && s.filter.lastDivergedT === null), "SAL agrees (its own pause also restarted)");
    });

    await t.test("4b countdown length P9 ms model time while running at speed > 1 (VIS-3-Q3 'not 3 s')", async () => {
      await startT(); await A.boot();
      for (const sp of [2, 10]) {
        const q = await A.press([G], 100);
        await A.cmd({ cmd: "speed", speed: sp }); await A.cmd({ cmd: "run" });
        const obs = []; const w0 = Date.now();
        while (Date.now() - w0 < 8000) { const s = (await c("GET", "/api/manual/state?since=999999999")).json; obs.push(s); if (s.t - q.r > P9 + 1500) break; await new Promise(r => setTimeout(r, 10)); }
        const end = await A.cmd({ cmd: "pause" }); obs.push(end); await A.cmd({ cmd: "speed", speed: 1 });
        for (const s of obs) {
          if (s.filter.relT !== q.r) continue;   // only observations of this countdown
          assert.equal(s.filter.elapsed, s.t - q.r, `x${sp}: elapsed = model scans since release`);
          assert.equal(s.filter.modelReady, s.t - q.r >= P9, `x${sp}: at release+${s.t - q.r} ready must be ${s.t - q.r >= P9}`);
        }
        const win = obs.filter(s => s.filter.relT === q.r && s.t - q.r >= P9 && s.t - q.r < P9 + 1000);
        t.diagnostic(`x${sp}: ${obs.length} observations, ${win.length} in [P9,P9+1000) after release`);
        if (!win.length) { // load: no poll landed in the window -> check the window on pause
          assert.ok(end.t - q.r >= P9, "ran past the countdown"); t.diagnostic(`x${sp}: window check by observations NOT possible under load`);
        } else assert.ok(win.every(s => s.filter.modelReady), `x${sp}: ready within [P9,P9+1000) ms (not a longer countdown)`);
      }
    });

    await t.test("4 countdown is model time: frozen while paused, independent of speed", async () => {
      await startT(); await A.boot();
      const p = await A.press([G], 100);
      const a = await A.st(); await new Promise(r => setTimeout(r, 400)); const b = await A.st();
      assert.equal(b.t, a.t, "paused: t frozen"); assert.equal(b.filter.elapsed, a.filter.elapsed, "paused: elapsed frozen"); assert.equal(b.filter.modelReady, false);
      for (const sp of [10, 0.1]) {
        await A.cmd({ cmd: "speed", speed: sp }); await A.cmd({ cmd: "run" }); await new Promise(r => setTimeout(r, sp === 10 ? 80 : 400));
        const x = await A.cmd({ cmd: "pause" });
        assert.equal(x.filter.elapsed, x.t - p.r, `x${sp}: elapsed = scans since release`); assert.equal(x.filter.modelReady, x.t - p.r >= P9, `x${sp}: ready iff scans >= P9`);
        assert.equal(x.filter.pressed, false);
      }
      await A.cmd({ cmd: "speed", speed: 1 });
      // wall-clock run segments may overshoot under machine load (catch-up); the edge check needs t still before the edge
      const now = (await A.st()).t;
      if (now < p.r + P9 - 5) { const sm = await A.around(p.r + P9); checkEdge(sm, p.r, { label: "after speed changes" }); }
      else t.diagnostic(`run segments reached release+${now - p.r} (load): edge-after-speed check skipped; invariants above asserted`);
      // advance P9 from a fresh release -> ready
      const q = await A.press([G], 50); const y = await A.cmd({ cmd: "advance", ms: P9 });
      assert.equal(y.t, q.r + P9); assert.equal(y.filter.modelReady, true, "advance P9 -> ready");
    });

    await t.test("5 EMG: not compared, never diverged; Restart to SAFE: no divergence beyond 1 scan", async () => {
      await startT(); await A.boot();
      await A.set({ in_ES_NC_1: false, in_ES_NC_2: false });
      const e = await A.cmd({ cmd: "advance", ms: 300 });
      assert.ok(e.status.includes("EMG"), "EStop pair -> EMG: " + e.status);
      assert.equal(e.filter.compared, false); assert.equal(e.filter.diverged, false); assert.ok(e.filter.notComparedReason, "reason shown");
      await A.set({ in_ES_NC_1: true, in_ES_NC_2: true }); await A.cmd({ cmd: "advance", ms: 300 });
      const pr = await A.press([G], 100);
      // scan by scan through the EMG -> SAFE transition and the whole countdown
      let run = 0, maxRun = 0, comparedScans = 0; const samples = [];
      for (let k = 0; k < P9 + 300; k++) {
        const s = await A.cmd({ cmd: "step" }); samples.push(s);
        if (!["SAFE", "RND"].some(x => s.status.length === 1 && s.status[0] === x)) assert.equal(s.filter.compared, false, `status ${s.status}: not compared`);
        if (s.filter.compared) { comparedScans++; if (s.filter.modelReady !== s.filter.sal.value) run++; else run = 0; maxRun = Math.max(maxRun, run); }
        assert.equal(s.filter.diverged, false, `t=${s.t}: no divergence on canonical`);
      }
      t.diagnostic(`EMG->SAFE: compared scans ${comparedScans}, max consecutive mismatch ${maxRun}`);
      assert.ok(comparedScans > P9 - 50, "SAFE reached and compared"); assert.ok(maxRun <= 1, "mismatch at most 1 scan [A-VIS3-2]");
      assert.equal(samples.at(-1).filter.lastDivergedT, null);
      checkEdge(samples.filter(s => Math.abs(s.t - (pr.r + P9)) <= 3), pr.r, { label: "after Restart" });
    });

    await t.test("5b group start (boot EMG -> Restart -> SAFE): countdown scan by scan, no divergence beyond 1 scan", async () => {
      await startT(); await A.cmd({ cmd: "advance", ms: 10 });
      const pr = await A.press([G], 100);
      let run = 0, maxRun = 0, mism = 0; const samples = [];
      for (let k = 0; k < P9 + 200; k++) {
        const s = await A.cmd({ cmd: "step" }); samples.push(s);
        if (s.filter.compared) { if (s.filter.modelReady !== s.filter.sal.value) { run++; mism++; } else run = 0; maxRun = Math.max(maxRun, run); }
        assert.equal(s.filter.diverged, false, `t=${s.t}: no divergence on canonical boot`);
        assert.equal(s.filter.lastDivergedT, null, `t=${s.t}: nothing recorded`);
      }
      t.diagnostic(`boot: mismatching compared scans ${mism}, max consecutive ${maxRun}`);
      assert.ok(maxRun <= 1, "mismatch at most 1 scan [A-VIS3-2]"); assert.deepEqual(samples.at(-1).status, ["SAFE"]);
      checkEdge(samples.filter(s => Math.abs(s.t - (pr.r + P9)) <= 3), pr.r, { label: "boot" });
    });

    await t.test("6 mutant A (RELEASE preset -> 1.5 s): SAL later than p.9 (1 s): diverged true in SAFE, lastDivergedT sticky until next press", async () => {
      const i = sal.indexOf('name="RELEASE" instanceName="RELEASE"'); const end = sal.indexOf("</fBTon>", i);
      const m0 = /timing="([0-9.]+)"/.exec(sal.slice(i, end)); assert.ok(i > 0 && m0, "RELEASE Delay Time inside its block");
      t.diagnostic(`base RELEASE timing=${m0[1]} s (requirement TMR-1-Q1: 1 s)`);
      const j = i + m0.index;
      const T = await upload(sal.slice(0, j) + 'timing="1.5"' + sal.slice(j + m0[0].length));
      await A.start(T.id, T.auto); await A.boot();
      const pr = await A.press([G], 100);
      assert.equal(pr.held.filter.lastDivergedT, null, "lastDivergedT cleared on the next press");
      assert.equal(pr.held.filter.sal.found, true); assert.equal(pr.held.filter.sal.presetMs, 1500, "preset of the loaded SAL shown");
      const d = await A.cmd({ cmd: "advance", ms: P9 + 200 });
      assert.deepEqual(d.status, ["SAFE"]); assert.equal(d.filter.compared, true);
      assert.equal(d.filter.presetMs, P9, "model countdown stays p.9 = 1 s (requirement), not the mutated SAL preset [VIS-3-Q1, TMR-1-Q1]");
      assert.equal(d.filter.modelReady, true, `p.9 ready at release+${P9 + 200}`); assert.equal(d.filter.sal.value, false, "mutated SAL flag (1.5 s) not yet ready");
      assert.equal(d.filter.diverged, true, "diverged [VIS-3-Q1]"); assert.ok(d.filter.lastDivergedT !== null && d.filter.lastDivergedT > pr.r, "lastDivergedT set");
      const e = await A.cmd({ cmd: "advance", ms: 400 });
      assert.equal(e.filter.sal.value, true, "SAL flag ready at release+1600"); assert.equal(e.filter.diverged, false, "agreement again after release+1500");
      assert.ok(e.filter.lastDivergedT !== null && e.filter.lastDivergedT >= d.filter.lastDivergedT && e.filter.lastDivergedT <= pr.r + 1500 + 1, "lastDivergedT sticky: " + e.filter.lastDivergedT);
      const n = await A.press([G], 20);
      assert.equal(n.held.filter.lastDivergedT, null, "sticky mark cleared by the next press");
    });

    await t.test("7 mutant B (RELEASE block renamed): SAL flag NOT CHECKED, never diverged, countdown still shown", async () => {
      const m = sal.replaceAll('name="RELEASE" instanceName="RELEASE"', 'name="RELEASX" instanceName="RELEASX"').replaceAll("//RndPhysicalCompact/RELEASE/", "//RndPhysicalCompact/RELEASX/");
      assert.ok(!m.includes("//RndPhysicalCompact/RELEASE/") && m.includes("RELEASX"));
      const T = await upload(m);
      await A.start(T.id, T.auto); await A.boot();
      const pr = await A.press([G], 100);
      const sm = [pr.rel, ...(await A.around(pr.r + P9))];
      checkEdge(sm, pr.r, { sal: false, label: "mutant B" });
      for (const s of sm) {
        assert.equal(s.filter.available, true, "countdown available");
        assert.equal(s.filter.sal.found, false, "SAL flag not found"); assert.match(s.filter.sal.reason ?? "", /NOT CHECKED/, "NOT CHECKED token");
        assert.equal(s.filter.compared, false); assert.equal(s.filter.diverged, false); assert.equal(s.filter.lastDivergedT, null);
      }
    });

    await t.test("8 mapping: in_Reset_PB / in_Relase_Door_PB unmapped -> filter unavailable, not checked; mapped -> available", async () => {
      for (const [nm, to] of [[G, "X_Green"], [B, "X_Blue"]]) {
        const rx = new RegExp(`(<variable Id="[^"]+" name=")${nm}(")`, "g"); assert.equal([...sal.matchAll(rx)].length, 1);
        const T = await upload(sal.replace(rx, `$1${to}$2`)); assert.equal(T.auto[nm], undefined, nm + " not auto-mapped");
        const s0 = await A.start(T.id, T.auto); const s = await A.cmd({ cmd: "advance", ms: 2500 });
        for (const x of [s0, s]) {
          assert.equal(x.filter.available, false, nm + " unmapped -> available=false"); assert.match(x.filter.reason ?? "", /not checked/i);
          assert.equal(x.filter.compared, false); assert.equal(x.filter.diverged, false); assert.equal(x.filter.modelReady, false, "no 'ready' claimed");
        }
        await A.start(T.id, { ...T.auto, [nm]: to }); const y = await A.boot();
        assert.equal(y.filter.available, true, "mapped -> available"); assert.equal(y.filter.sal.found, true, "same structure -> SAL flag found (plan §3)");
        assert.equal(y.filter.diverged, false);
      }
    });

    await t.test("9 canonical SAL untouched by mutants", () => assert.equal(sha(fs.readFileSync(CANON_SAL)), CANON_SHA));
  } finally { srv.stop(); }
});

// ---------------- English (VIS-3-Q2) ----------------
const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");

test("VIS-3-Q2 English: page/app/server messages without Cyrillic; NOT CHECKED token; filter UI present", async t => {
  const html = fs.readFileSync(path.join(VIS, "app/index.html"), "utf8"), app = fs.readFileSync(path.join(VIS, "app/app.js"), "utf8");
  assert.match(html, /<html[^>]*lang="en"/);
  for (const [n, s] of [["app/index.html", html], ["app/app.js", app]]) {
    const bad = s.split(/\n/).map((l, i) => [i + 1, l]).filter(([, l]) => CYR.test(l));
    assert.deepEqual(bad.map(([i, l]) => `${n}:${i} ${l.trim().slice(0, 100)}`), [], "no Cyrillic in UI file");
  }
  // user-visible strings of server-side modules (comments excluded)
  for (const f of ["server.js", "manual.js", "mapping.js", "target.js", "catalog.js", "svg.js", "trace.js", "exam-worker.js", "report.js"]) {
    const s = stripComments(fs.readFileSync(path.join(VIS, f), "utf8"));
    const bad = s.split(/\n/).filter(l => CYR.test(l)).map(l => l.trim().slice(0, 100));
    assert.deepEqual(bad, [], f + ": Cyrillic string literals");
  }
  assert.ok((app + fs.readFileSync(path.join(VIS, "catalog.js"), "utf8")).includes("NOT CHECKED"), "status token NOT CHECKED");
  assert.ok(!(app + fs.readFileSync(path.join(VIS, "catalog.js"), "utf8")).includes("НЕ ПРОВЕРЕНО"), "old token gone");
  assert.match(html, /id="mFilter"/, "#mFilter summary line");
  // VIS-3-Q3 (withdraws A-VIS3-1): big buttons are never blocked by the countdown. Static heuristic only (no browser):
  // no app.js line ties `.disabled` to the filter (modelReady / wait / filter).
  const blk = app.split(/\n/).map((l, i) => [i + 1, l]).filter(([, l]) => /\.disabled\s*=/.test(l) && /modelReady|wait|\bfilter\b|\bf\.\w+/.test(l));
  assert.deepEqual(blk.map(([i, l]) => `app.js:${i} ${l.trim().slice(0, 140)}`), [], "VIS-3-Q3: button disabled state must not depend on the filter countdown");
  t.diagnostic("VIS-3-Q3 'buttons never blocked' checked statically (heuristic) + via the API (subtest 3b); DOM behaviour in a browser NOT VERIFIED");

  const srv = await startServer(); const c = srv.call;
  try {
    const msgs = [];
    const probe = async (m, p, b) => { const r = await c(m, p, b); assert.notEqual(r.status, 200, `${m} ${p} must fail`); msgs.push([`${m} ${p}`, r.json?.error ?? r.text]); };
    await probe("POST", "/api/manual/cmd", { cmd: "step" });                      // no session
    await probe("POST", "/api/manual/start", { target: "no-such-target" });
    await probe("GET", "/api/exam/no-such");
    await probe("GET", "/api/no-such");
    await probe("POST", "/api/target", { files: [{ name: "x.sal", base64: Buffer.from("<not xml").toString("base64") }] });
    assert.equal((await c("POST", "/api/manual/start", { target: "canonical", plant: true })).status, 200);
    await probe("POST", "/api/manual/cmd", { cmd: "speed", speed: 11 });
    await probe("POST", "/api/manual/cmd", { cmd: "advance", ms: 0 });
    await probe("POST", "/api/manual/cmd", { cmd: "bogus" });
    await probe("POST", "/api/manual/inputs", { NO_SUCH: true });
    await probe("POST", "/api/manual/inputs", { in_Safety_Run: false });
    await probe("POST", "/api/manual/hold", { b_EStop_Ok: true });
    const tg = (await c("POST", "/api/target/canonical")).json.targetId;
    await probe("PUT", "/api/mapping", { target: tg, table: { in_Reset_PB: "!in_Reset_PB" } });
    for (const [w, e] of msgs) { t.diagnostic(`${w}: ${e}`); assert.ok(e, w + ": has a message"); assert.doesNotMatch(String(e), CYR, `${w}: English message`); }
    const st = (await c("GET", "/api/manual/state")).json;
    const fstr = JSON.stringify(st.filter); assert.doesNotMatch(fstr, CYR, "filter texts English");
  } finally { srv.stop(); }
});

// ---------------- display only: canonical exam unaffected by manual activity ----------------
// (a) session RUNNING (x10) during the exam: the exam must still complete with the stand's statuses (VIS-3-Q1 "на экзамен не влияет").
test("VIS-3 display-only (a): canonical exam completes and == stand TAP while a manual session is running", { timeout: 45 * 60 * 1000 }, async () => {
  const srv = await startServer(); const c = srv.call; const A = api(c);
  try {
    const tapP = catalogTap();
    await A.start("canonical"); await A.boot(); await A.press([G, B], 1200);
    await A.cmd({ cmd: "speed", speed: 10 }); await A.cmd({ cmd: "run" });
    const tg = (await c("POST", "/api/target/canonical")).json;
    const ex = await runExam(c, tg.targetId);   // throws "exam error: ..." if the exam aborts
    const after = await A.cmd({ cmd: "pause" }); assert.ok(after.t > 5000, "manual session kept running: t=" + after.t);
    const ref = parseTap(await tapP); const got = Object.fromEntries(ex.result.catalog.scenarios.map(s => [s.id, s.status]));
    const diff = [...ref].filter(([k]) => !k.startsWith("M:") && k !== "HDR").filter(([k, v]) => got[k] !== v).map(([k, v]) => `${k}: exam ${got[k]} tap ${v}`);
    assert.deepEqual(diff, [], "per-ID status == stand TAP with a running manual session");
  } finally { srv.stop(); }
});

// (b) manual activity before the exam, session paused during it; plus report chrome English.
test("VIS-3 display-only (b): canonical exam per-ID statuses == stand TAP after manual activity; report chrome English", { timeout: 45 * 60 * 1000 }, async t => {
  const srv = await startServer(); const c = srv.call; const A = api(c);
  try {
    const tapP = catalogTap();
    await A.start("canonical"); await A.boot(); await A.press([G, B], 1200);
    await A.cmd({ cmd: "advance", ms: 3000 }); await A.press([G], 100); await A.cmd({ cmd: "advance", ms: 500 });   // countdown mid-way, paused
    const tg = (await c("POST", "/api/target/canonical")).json;
    const ex = await runExam(c, tg.targetId);
    const R = ex.result; const ref = parseTap(await tapP);
    const exp = [...ref].filter(([k]) => !k.startsWith("M:") && k !== "HDR");
    assert.ok(exp.length >= 80);
    const got = Object.fromEntries(R.catalog.scenarios.map(s => [s.id, s.status]));
    assert.deepEqual(Object.keys(got).sort(), exp.map(([k]) => k).sort(), "same ID set as the stand TAP");
    const diff = exp.filter(([k, v]) => got[k] !== v).map(([k, v]) => `${k}: exam ${got[k]} tap ${v}`);
    assert.deepEqual(diff, [], "per-ID status == stand TAP with manual activity (display only, VIS-3-Q1)");
    assert.equal(R.structure.status, "PASS");
    const prev = path.join(SCRATCH, "exam-canon.json");   // written by vis-exam-canonical (no manual activity), if it ran
    if (fs.existsSync(prev)) { const P = JSON.parse(fs.readFileSync(prev, "utf8")); assert.deepEqual(got, Object.fromEntries(P.catalog.scenarios.map(s => [s.id, s.status])), "== exam without manual activity"); }
    else t.diagnostic("exam-canon.json absent: comparison to the no-activity exam is via the same stand TAP only");

    // report chrome English: remove stand-provided strings (scenario data from the exam result) and SAL names, then no Cyrillic
    const h = (await c("GET", `/api/exam/${ex.id}/report.html`)).text; fs.writeFileSync(path.join(SCRATCH, "report-vis3.html"), h);
    assert.match(h, /<html[^>]*lang="en"/); assert.doesNotMatch(h, /<script\b|<link\b|url\(|@import/i, "standalone");
    assert.doesNotMatch(h, /\b(src|href)\s*=\s*["']?(https?:|\/\/|file:|\/)/i, "no external refs");
    const unesc = s => s.replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
    let txt = unesc(h);
    const standStrings = []; (function walk(v) { if (typeof v === "string") { if (CYR.test(v)) standStrings.push(v); } else if (v && typeof v === "object") Object.values(v).forEach(walk); })(R);
    for (const s of standStrings.sort((a, b) => b.length - a.length)) txt = txt.split(s).join(" ");
    const left = [...txt.matchAll(/[^\n<>]{0,40}\p{Script=Cyrillic}[^\n<>]{0,40}/gu)].map(m => m[0].trim());
    t.diagnostic(`stand-provided Cyrillic strings removed: ${standStrings.length}`);
    assert.deepEqual(left, [], "report chrome has no Cyrillic outside stand-provided data");
  } finally { srv.stop(); }
});
