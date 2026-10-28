// VIS item 6: manual mode. Oracle: VIS-Q3 (pause, 1-scan step, advance N ms, speed x0.1..x10, inputs changed on pause applied
// from the next scan), VIS_PLAN §6 (scan = 1 ms virtual), D-TIMING (single blue 0,5 s continuous), Q-ARCH-04 (Unlock in Safe on
// qualified blue), catalog boot rule (group start = Emergency, Restart by green -> Safe; catalog-program.js boot()).
// Timing assertion: Unlock rises at press+500 ms; tolerance +-1 scan relative to the timer expiry is checked on the
// TON elapsed/preset view; the output edge is checked against the catalog window +-50 ms (K-11 TOL).
import test from "node:test";
import assert from "node:assert/strict";
import { startServer } from "./_lib.mjs";

const UNL = "out_Door_Unlock_Solonoeid", BLUE = "in_Relase_Door_PB", GREEN = "in_Reset_PB";
const inp = (st, n) => st.inputs.find(r => r.name === n)?.value;

test("VIS-6 manual mode", { timeout: 10 * 60 * 1000 }, async t => {
  const srv = await startServer(); const c = srv.call;
  const cmd = async b => { const r = await c("POST", "/api/manual/cmd", b); return r; };
  try {
    const s0 = await c("POST", "/api/manual/start", { target: "canonical", plant: true });
    assert.equal(s0.status, 200, s0.text); assert.equal(s0.json.running, false, "starts paused");
    const t0 = s0.json.t;
    await t.test("step = +1 scan (1 ms), advance N = +N ms, pause kept", async () => {
      const a = (await cmd({ cmd: "step" })).json; assert.equal(a.t, t0 + 1); assert.equal(a.running, false);
      const b = (await cmd({ cmd: "advance", ms: 9 })).json; assert.equal(b.t, t0 + 10); assert.equal(b.running, false);
      assert.ok(b.status.includes("EMG"), "group start is Emergency (catalog rule 2): " + b.status);
    });
    await t.test("input set on pause is queued; applied from the next scan only", async () => {
      const before = (await c("GET", "/api/manual/state")).json;
      const q = await c("POST", "/api/manual/inputs", { [GREEN]: true }); assert.equal(q.status, 200, q.text);
      const mid = (await c("GET", "/api/manual/state")).json;
      assert.equal(mid.t, before.t, "no time passes on pause"); assert.equal(inp(mid, GREEN), false, "not applied while paused");
      assert.equal(mid.pending[GREEN], true, "shown as pending");
      const nx = (await cmd({ cmd: "step" })).json; assert.equal(nx.t, before.t + 1); assert.equal(inp(nx, GREEN), true, "applied on the next scan");
      await cmd({ cmd: "advance", ms: 99 }); await c("POST", "/api/manual/inputs", { [GREEN]: false });
      const r = (await cmd({ cmd: "advance", ms: 1000 })).json;
      assert.deepEqual(r.status, ["SAFE"], "Restart by green -> Safe: " + r.status);
      await cmd({ cmd: "advance", ms: 2100 });
    });
    await t.test("single blue 0.5 s: Unlock at press+500 (+-50 catalog), TON preset 500 expires at +500 +-1 scan", async () => {
      const st = (await c("GET", "/api/manual/state")).json; assert.equal(st.outputs[UNL], false);
      await c("POST", "/api/manual/inputs", { [BLUE]: true });
      const p = (await cmd({ cmd: "step" })).json.t;   // first scan with blue = press time
      const b4 = (await cmd({ cmd: "advance", ms: 400 })).json;
      assert.equal(b4.outputs[UNL], false, "no Unlock at press+400");
      const tm = b4.timers.find(x => x.preset === 500 && x.active);
      assert.ok(tm, "an active 500 ms TON is visible: " + JSON.stringify(b4.timers));
      assert.ok(Math.abs(tm.elapsed - (b4.t - p)) <= 1, `TON elapsed ${tm.elapsed} vs press+${b4.t - p} (+-1 scan)`);
      let on = null, s;
      for (let k = 0; k < 160 && on === null; k++) { s = (await cmd({ cmd: "step" })).json; if (s.outputs[UNL]) on = s.t; }
      assert.ok(on !== null, "Unlock rose");
      const dt = on - p; t.diagnostic(`Unlock at press+${dt} ms`);
      assert.ok(dt > 450 && dt <= 550, `Unlock at press+${dt}, expected 500+-50 [D-TIMING, K-11]`);
      assert.ok(Math.abs(dt - 500) <= 2, `Unlock at press+${dt}: expected timer expiry 500 +-1 scan (+1 scan output propagation)`);
      await c("POST", "/api/manual/inputs", { [BLUE]: false }); await cmd({ cmd: "advance", ms: 100 });
    });
    await t.test("speed limits 0.1..10 enforced; real-time run advances ~ wall*speed", async () => {
      for (const v of [0.09, 0, -1, 10.5, 11, "x"]) { const r = await cmd({ cmd: "speed", speed: v }); assert.notEqual(r.status, 200, "reject speed " + v);
        assert.ok(r.json?.error, "error message for speed " + v); assert.doesNotMatch(r.json.error, /\p{Script=Cyrillic}/u, "English message (VIS-3-Q2): " + r.json.error); }
      for (const v of [0.1, 10, 1]) { const r = await cmd({ cmd: "speed", speed: v }); assert.equal(r.status, 200, "accept " + v); assert.equal(r.json.speed, v); }
      await cmd({ speed: 10 }); const a = (await cmd({ cmd: "run" })).json.t; const w0 = Date.now();
      await new Promise(r => setTimeout(r, 600));
      const b = (await cmd({ cmd: "pause" })).json; const w = Date.now() - w0; const adv = b.t - a;
      assert.equal(b.running, false);
      t.diagnostic(`x10: advanced ${adv} ms virtual in ${w} ms wall (ratio ${(adv / w).toFixed(2)}), lag=${b.lag}`);
      assert.ok(adv < w * 10 * 1.5, `x10: must not exceed speed: ${adv} in ${w}`);
      // VIS-Q3 x10: either achieved (>=50%) or the shortfall is shown (plan §6 "lag shown"); silent slowdown = defect
      assert.ok(adv > w * 10 * 0.5 || b.lag === true, `x10 not achieved (${adv} virtual / ${w} wall) and lag not reported`);
      await cmd({ speed: 0.1 }); const a2 = (await cmd({ cmd: "run" })).json.t; const w1 = Date.now();
      await new Promise(r => setTimeout(r, 1000));
      const b2 = (await cmd({ cmd: "pause" })).json; const adv2 = b2.t - a2; const ww = Date.now() - w1;
      assert.ok(adv2 >= ww * 0.1 * 0.5 && adv2 <= ww * 0.1 * 1.5 + 2, `x0.1: advanced ${adv2} ms virtual in ${ww} ms wall`);
      const p1 = (await c("GET", "/api/manual/state")).json.t; await new Promise(r => setTimeout(r, 200));
      assert.equal((await c("GET", "/api/manual/state")).json.t, p1, "paused: no virtual time passes");
    });
    await t.test("constant inputs cannot be driven", async () => {
      assert.notEqual((await c("POST", "/api/manual/inputs", { in_Safety_Run: false })).status, 200);
    });
    await t.test("server bound to 127.0.0.1 only", async () => {
      assert.equal(srv.server.address().address, "127.0.0.1");
      const os = await import("node:os");
      const ext = Object.values(os.networkInterfaces()).flat().find(i => i && i.family === "IPv4" && !i.internal);
      if (!ext) { t.diagnostic("no external IPv4 interface: external-connect probe NOT VERIFIED"); return; }
      let ok = false; try { await fetch(`http://${ext.address}:${srv.port}/api/info`, { signal: AbortSignal.timeout(3000) }); ok = true; } catch { /* refused = expected */ }
      assert.equal(ok, false, `reachable on ${ext.address}`);
    });
  } finally { srv.stop(); }
});
