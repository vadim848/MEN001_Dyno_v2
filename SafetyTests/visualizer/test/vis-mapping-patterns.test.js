// VIS review B1 follow-up. Oracle: VIS-Q5 — a scenario that uses a signal not mapped to the loaded SAL is NOT CHECKED
// (never PASS/FAIL), unaffected scenarios = canonical, after mapping = canonical; mapping is 1:1 by meaning (kind input/output
// must agree — an input mapped onto an output is not a valid correspondence); VIS_PLAN §0 localhost only (foreign Host/Origin -> 403).
// Affected sets: (a) CMD_SAFE_TO_RND is the stimulus of P-01 (catalog title "edge CMD_SAFE_TO_R&D"); K-04/K-11/E-01/E-08 are
// button/EStop scenarios without that command. (b) heartbeat is driven by the catalog plant in every scenario (plan §6 "heartbeat
// 500 ms auto"), (c) SafetyFault and (d) out_LV_C1 are observed on every scan (plan §5 note: snapshot reads all outputs/fault)
// => whole subset NOT CHECKED. Assumption: subset runs via exam-worker IPC (HTTP exam has no subset option).
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { startServer, filesOf, canonText, workerSubset } from "./_lib.mjs";
import { storeUpload, canonicalTarget } from "../target.js";

const renameVar = (sal, from, to) => { const rx = new RegExp(`(<variable Id="[^"]+" name=")${from}(")`, "g");
  assert.equal([...sal.matchAll(rx)].length, 1, `one declaration of ${from}`); return sal.replace(rx, `$1${to}$2`); };
const byId = r => Object.fromEntries(r.rows.map(x => [x.id, x.status]));
const IDS = ["P-01", "K-04", "K-11", "E-01", "E-08"];
const CASES = [
  { our: "CMD_SAFE_TO_RND", to: "X_CMD_S2R", affected: ["P-01"] },
  { our: "in_PLC_Heartbeat", to: "X_HB", affected: IDS },
  { our: "linkSafetyFault", to: "X_SF", affected: IDS },
  { our: "out_LV_C1", to: "X_C1", affected: IDS },
];
const raw = (port, headers) => new Promise((res, rej) => { const r = http.request({ host: "127.0.0.1", port, path: "/api/info", headers }, x => { x.resume(); res(x.statusCode); }); r.on("error", rej); r.end(); });

test("VIS-4b pattern-resolved / output signals renamed; kind check; Host/Origin", { timeout: 40 * 60 * 1000 }, async t => {
  const { sal, sgvl } = canonText();
  const srv = await startServer();
  const ref = byId(await workerSubset(canonicalTarget(), null, IDS));
  assert.ok(!Object.values(ref).includes("NOT CHECKED"));
  const upload = async s => { const files = filesOf({ sal: s, sgvl }); const r = await srv.call("POST", "/api/target", { files }); assert.equal(r.status, 200, r.text);
    assert.equal(r.json.parseError ?? null, null, "copy parses"); return { id: r.json.targetId, rec: storeUpload(files) }; };
  const autoOf = async id => { const mp = await srv.call("GET", "/api/mapping?target=" + id); assert.equal(mp.status, 200, mp.text); return mp.json; };
  try {
    for (const C of CASES) await t.test(`${C.our} -> ${C.to}`, async () => {
      const T = await upload(renameVar(sal, C.our, C.to));
      const mp = await autoOf(T.id);
      const row = mp.rows.find(r => r.our === C.our); assert.ok(row, C.our + " is an 'our' name"); assert.equal(row.loaded, null, "not auto-mapped");
      const auto = Object.fromEntries(mp.rows.filter(r => r.loaded).map(r => [r.our, r.loaded]));
      const s = byId(await workerSubset(T.rec, auto, IDS));
      for (const id of IDS) {
        if (C.affected.includes(id)) assert.equal(s[id], "NOT CHECKED", `${id} uses unmapped ${C.our} => NOT CHECKED (got ${s[id]})`);
        else assert.equal(s[id], ref[id], `${id} does not use ${C.our} => == canonical`);
      }
      const table = { ...auto, [C.our]: C.to };
      const pu = await srv.call("PUT", "/api/mapping", { target: T.id, table }); assert.equal(pu.status, 200, pu.text);
      assert.deepEqual(byId(await workerSubset(T.rec, table, IDS)), ref, "after mapping == canonical");
    });
    await t.test("kind mismatch (input <-> output) rejected", async () => {
      const T = await upload(renameVar(renameVar(sal, "in_Reset_PB", "X_Green"), "out_LV_C1", "X_C1"));
      const auto = Object.fromEntries((await autoOf(T.id)).rows.filter(r => r.loaded).map(r => [r.our, r.loaded]));
      const bad = await srv.call("PUT", "/api/mapping", { target: T.id, table: { ...auto, in_Reset_PB: "X_C1", out_LV_C1: "X_Green" } });
      assert.notEqual(bad.status, 200, "input mapped to an output must be rejected");
      const ex = await srv.call("POST", "/api/exam", { target: T.id, table: { ...auto, in_Reset_PB: "X_C1", out_LV_C1: "X_Green" } });
      assert.notEqual(ex.status, 200, "exam refuses kind mismatch");
      const ok = await srv.call("PUT", "/api/mapping", { target: T.id, table: { ...auto, in_Reset_PB: "X_Green", out_LV_C1: "X_C1" } });
      assert.equal(ok.status, 200, ok.text);
    });
    await t.test("foreign Host / Origin -> 403; local accepted", async () => {
      assert.equal(await raw(srv.port, { host: `127.0.0.1:${srv.port}` }), 200);
      assert.equal(await raw(srv.port, { host: `localhost:${srv.port}` }), 200);
      assert.equal(await raw(srv.port, { host: `evil.example:${srv.port}` }), 403, "DNS-rebinding Host");
      assert.equal(await raw(srv.port, { host: `127.0.0.1:${srv.port}`, origin: "http://evil.example" }), 403, "foreign Origin");
      assert.equal(await raw(srv.port, { host: `127.0.0.1:${srv.port}`, origin: `http://127.0.0.1:${srv.port + 1}` }), 403, "other local port Origin");
    });
  } finally { srv.stop(); }
});
