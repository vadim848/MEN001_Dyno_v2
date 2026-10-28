// VIS-2 manual-mode buttons. Oracle: VIS-2 (paired buttons: both lines in ONE scan — ES_NC_1+2, InterLock_NC_1+2, STO FBK DR1+DR2;
// operator Reset (green) / Unlock (blue); b_EStop_Ok untouched), VIS-Q3 (inputs changed on pause are applied from the next scan).
// Assumption: a pair is sent as one POST /api/manual/inputs call (what the page does); «Обе» = Reset+Unlock in one call.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { startServer, VIS } from "./_lib.mjs";

const PAIRS = [["in_ES_NC_1", "in_ES_NC_2"], ["in_InterLock_NC_1", "in_InterLock_NC_2"], ["in_STO_DR1_FBK", "in_STO_DR2_FBK"], ["in_Reset_PB", "in_Relase_Door_PB"]];
const val = (st, n) => st.inputs.find(r => r.name === n)?.value;

test("VIS-2 buttons (manual mode API)", { timeout: 5 * 60 * 1000 }, async t => {
  const srv = await startServer(); const c = srv.call;
  const cmd = b => c("POST", "/api/manual/cmd", b).then(r => r.json);
  const st = () => c("GET", "/api/manual/state").then(r => r.json);
  try {
    assert.equal((await c("POST", "/api/manual/start", { target: "canonical", plant: true })).status, 200);
    await cmd({ cmd: "advance", ms: 50 });
    for (const [a, b] of PAIRS) await t.test(`pair ${a}+${b}: both lines change in the same scan; paused -> next scan`, async () => {
      for (const target of [!val(await st(), a), val(await st(), a)]) {
        const s0 = await st();
        const r = await c("POST", "/api/manual/inputs", { [a]: target, [b]: target }); assert.equal(r.status, 200, r.text);
        const s1 = await st();
        assert.equal(s1.t, s0.t, "paused");
        assert.deepEqual([val(s1, a), val(s1, b)], [val(s0, a), val(s0, b)], "VIS-Q3: not applied before the next scan (paused)");
        const s2 = await cmd({ cmd: "step" });
        assert.deepEqual([val(s2, a), val(s2, b)], [target, target], "both applied on the next scan");
        const ch = (await c("GET", `/api/manual/state?since=${s0.t}`)).json.changes.filter(x => x.n === "in:" + a || x.n === "in:" + b);
        const ta = ch.filter(x => x.n === "in:" + a).map(x => x.t), tb = ch.filter(x => x.n === "in:" + b).map(x => x.t);
        assert.deepEqual(ta, tb, `timeline: ${a} and ${b} changed at the same scans (${ta} / ${tb})`);
        await cmd({ cmd: "advance", ms: 20 });
      }
      if (a.includes("FBK")) { await c("POST", "/api/manual/hold", { [a]: null, [b]: null }); await cmd({ cmd: "step" }); }
    });
    await t.test("momentary Reset: held across advance N, released on release", async () => {
      await c("POST", "/api/manual/inputs", { in_Reset_PB: true }); await cmd({ cmd: "step" });
      const s = await cmd({ cmd: "advance", ms: 300 }); assert.equal(val(s, "in_Reset_PB"), true, "still pressed after advance");
      await c("POST", "/api/manual/inputs", { in_Reset_PB: false }); const r = await cmd({ cmd: "step" }); assert.equal(val(r, "in_Reset_PB"), false);
    });
    await t.test("invalid name in a multi-signal request -> nothing applied", async () => {
      const s0 = await st();
      for (const bad of [{ in_ES_NC_1: false, NO_SUCH: true }, { in_ES_NC_1: false, b_EStop_Ok: false }, { in_ES_NC_1: false, in_Safety_Run: false }]) {
        assert.notEqual((await c("POST", "/api/manual/inputs", bad)).status, 200, JSON.stringify(bad));
        assert.equal((await st()).pending.in_ES_NC_1, undefined, "nothing queued");
      }
      const s1 = await cmd({ cmd: "step" }); assert.equal(val(s1, "in_ES_NC_1"), val(s0, "in_ES_NC_1"), "not applied");
    });
    await t.test("b_EStop_Ok not writable (inputs / hold)", async () => {
      assert.notEqual((await c("POST", "/api/manual/inputs", { b_EStop_Ok: true })).status, 200);
      assert.notEqual((await c("POST", "/api/manual/hold", { b_EStop_Ok: true })).status, 200);
    });
  } finally { srv.stop(); }
});

test("VIS-2 static: buttons and the pair \"split\" mark on the page (English per VIS-3-Q2)", () => {
  const h = fs.readFileSync(path.join(VIS, "app/index.html"), "utf8") + fs.readFileSync(path.join(VIS, "app/app.js"), "utf8");
  for (const s of ["Emergency stop", "STO FBK", "Reset", "Unlock", "Both", '"split"', "in_InterLock_NC_1", "in_InterLock_NC_2", "in_ES_NC_1", "in_ES_NC_2"]) assert.ok(h.includes(s), s);
  assert.match(h, /"Cover"/, "cover button");
  assert.ok(!/sig:\s*\[[^\]]*b_EStop_Ok/.test(h), "b_EStop_Ok not a button signal");
});
