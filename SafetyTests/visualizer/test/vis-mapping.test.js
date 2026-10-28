// VIS item 4: renamed signals / name mapping. Oracle: VIS-Q5 (auto-match of identical names; unmapped => NOT CHECKED, never FAIL;
// table saved/loaded; no polarity inversion — polarity mismatch gives honest FAIL), VIS_PLAN §2 (mapping API), §5, §8.4/8.5.
// Reference statuses = the canonical SAL evaluated on the same scenario subset (item 1 separately ties canonical to the TAP).
// Assumption: subset runs use the exam worker IPC protocol {target, table, ids} (plan §1); the HTTP exam has no subset option.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { startServer, filesOf, canonText, workerSubset, SCRATCH } from "./_lib.mjs";
import { storeUpload, canonicalTarget } from "../target.js";

const NC = "Break Contact (NC)", NO = "Make Contact (NO)";
const renameVar = (sal, from, to) => { const a = `<variable Id="`; const rx = new RegExp(`(<variable Id="[^"]+" name=")${from}(")`, "g");
  const n = [...sal.matchAll(rx)].length; assert.equal(n, 1, `one declaration of ${from}`); void a; return sal.replace(rx, `$1${to}$2`); };
// consumer in-port monikers of a variable (its targetUsages)
function consumers(sal, name) {
  const i = sal.indexOf(` name="${name}" isLocal=`); const e = sal.indexOf("</variable>", i);
  const tu = sal.slice(sal.indexOf("<targetUsages>", i), e);
  return [...tu.matchAll(/<inPortMoniker name="([^"]+)"/g)].map(m => m[1]);
}
// flip contact type (NO<->NC) on every consumer port that has one => inverted polarity of that input
function invertConsumers(sal, name) {
  let flipped = 0;
  for (const mon of consumers(sal, name)) {
    const [, net, blk, port] = mon.match(/^\/\/([^/]+)\/([^/]+)\/([^/]+)$/);
    const ns = sal.indexOf(`<Network Id=`); assert.ok(ns > 0);
    const nrx = new RegExp(`<Network Id="[^"]+" name="${net}"`); const nm = nrx.exec(sal); assert.ok(nm, net);
    const nEnd = sal.indexOf("</Network>", nm.index);
    const bi = sal.indexOf(` name="${blk}" instanceName="`, nm.index); assert.ok(bi > 0 && bi < nEnd, mon);
    const prx = new RegExp(`<inPort Id="[^"]+" name="${port}"[^>]*>`, "g"); prx.lastIndex = bi; const pm = prx.exec(sal); assert.ok(pm && pm.index < nEnd, mon);
    const tag = pm[0]; let nt = tag;
    if (tag.includes(`deactivate1="${NO}"`)) nt = tag.replace(NO, NC); else if (tag.includes(`deactivate1="${NC}"`)) nt = tag.replace(NC, NO); else continue;
    sal = sal.slice(0, pm.index) + nt + sal.slice(pm.index + tag.length); flipped++;
  }
  assert.ok(flipped > 0, "at least one consumer port inverted for " + name);
  return sal;
}
const byId = r => Object.fromEntries(r.rows.map(x => [x.id, x.status]));
const IDS = ["E-02", "K-04", "K-11", "E-01", "E-08"];

test("VIS-4 renamed signals and mapping", { timeout: 40 * 60 * 1000 }, async t => {
  const { sal, sgvl } = canonText();
  const srv = await startServer();
  const ref = byId(await workerSubset(canonicalTarget(), null, IDS));
  fs.writeFileSync(path.join(SCRATCH, "map-ref.json"), JSON.stringify(ref));
  assert.ok(!Object.values(ref).includes("NOT CHECKED"));
  const upload = async s => { const files = filesOf({ sal: s, sgvl }); const r = await srv.call("POST", "/api/target", { files }); assert.equal(r.status, 200, r.text);
    assert.equal(r.json.parseError ?? null, null, "copy parses"); return { id: r.json.targetId, rec: storeUpload(files) }; };
  try {
    await t.test("R1 in_C3_Manual_Set -> X_C3_Set: unmapped scenarios NOT CHECKED, rest == canonical; mapped == canonical", async () => {
      const T = await upload(renameVar(sal, "in_C3_Manual_Set", "X_C3_Set"));
      assert.equal(T.rec.id, T.id);
      const mp = await srv.call("GET", "/api/mapping?target=" + T.id);
      const row = mp.json.rows.find(r => r.our === "in_C3_Manual_Set");
      assert.equal(row.loaded, null, "renamed signal not auto-mapped"); assert.equal(row.auto, false);
      assert.ok(mp.json.loadedNames.includes("X_C3_Set"), "renamed name offered as candidate");
      assert.equal(mp.json.rows.find(r => r.our === "in_Reset_PB").loaded, "in_Reset_PB", "identical names auto-matched");
      for (const r of mp.json.rows) assert.deepEqual(Object.keys(r).sort(), ["auto", "kind", "loaded", "our"], "no polarity field in mapping rows");
      const auto = Object.fromEntries(mp.json.rows.filter(r => r.loaded).map(r => [r.our, r.loaded]));
      const pu = await srv.call("PUT", "/api/mapping", { target: T.id, table: auto });
      assert.equal(pu.status, 200, pu.text); assert.ok(pu.json.unmapped.includes("in_C3_Manual_Set"));
      const a = await workerSubset(T.rec, auto, IDS); const s = byId(a);
      assert.equal(s["E-02"], "NOT CHECKED", "E-02 drives in_C3_Manual_Set => NOT CHECKED [VIS-Q5]");
      assert.ok(a.rows.find(r => r.id === "E-02").touchedUnmapped.includes("in_C3_Manual_Set"));
      for (const id of IDS.filter(i => i !== "E-02")) assert.equal(s[id], ref[id], id + " unaffected by the unmapped signal");
      // save / load round trip (browser file format of plan §5)
      const table = { ...auto, in_C3_Manual_Set: "X_C3_Set" };
      const file = JSON.stringify({ format: "vis-mapping-1", table }, null, 1); const loaded = JSON.parse(file).table;
      const pu2 = await srv.call("PUT", "/api/mapping", { target: T.id, table: loaded });
      assert.equal(pu2.status, 200, pu2.text); assert.ok(!pu2.json.unmapped.includes("in_C3_Manual_Set"));
      assert.deepEqual(byId(await workerSubset(T.rec, loaded, IDS)), ref, "after mapping: results == canonical");
    });
    await t.test("R2 in_Reset_PB -> X_Green: never FAIL while unmapped; mapped == canonical", async () => {
      const T = await upload(renameVar(sal, "in_Reset_PB", "X_Green"));
      const mp = await srv.call("GET", "/api/mapping?target=" + T.id);
      const auto = Object.fromEntries(mp.json.rows.filter(r => r.loaded).map(r => [r.our, r.loaded]));
      assert.equal(auto.in_Reset_PB, undefined);
      const s = byId(await workerSubset(T.rec, auto, IDS));
      for (const id of IDS) assert.equal(s[id], "NOT CHECKED", `${id}: boot/green use in_Reset_PB => NOT CHECKED, not FAIL`);
      const table = { ...auto, in_Reset_PB: "X_Green" };
      assert.deepEqual(byId(await workerSubset(T.rec, table, IDS)), ref);
    });
    await t.test("mapping rejects polarity / non-1:1 / unknown entries", async () => {
      const T = await upload(renameVar(sal, "in_Reset_PB", "X_Green"));
      const mp = await srv.call("GET", "/api/mapping?target=" + T.id);
      const auto = Object.fromEntries(mp.json.rows.filter(r => r.loaded).map(r => [r.our, r.loaded]));
      for (const bad of [{ loaded: "X_Green", invert: true }, "!X_Green", "NOT X_Green", "-X_Green"]) {
        const r = await srv.call("PUT", "/api/mapping", { target: T.id, table: { ...auto, in_Reset_PB: bad } });
        assert.notEqual(r.status, 200, "must reject " + JSON.stringify(bad));
      }
      const dup = await srv.call("PUT", "/api/mapping", { target: T.id, table: { ...auto, in_Reset_PB: "in_Relase_Door_PB" } });
      assert.notEqual(dup.status, 200, "1:1: loaded signal mapped twice must be rejected");
      const ex = await srv.call("POST", "/api/exam", { target: T.id, table: { ...auto, in_Reset_PB: { loaded: "X_Green", invert: true } } });
      assert.notEqual(ex.status, 200, "exam refuses an inversion entry");
    });
    await t.test("R3 inverted polarity (X_Blue_NC, contact type flipped) mapped by name => honest FAIL, not NOT CHECKED", async () => {
      const s0 = invertConsumers(renameVar(sal, "in_Relase_Door_PB", "X_Blue_NC"), "X_Blue_NC");
      const T = await upload(s0);
      const mp = await srv.call("GET", "/api/mapping?target=" + T.id);
      const table = { ...Object.fromEntries(mp.json.rows.filter(r => r.loaded).map(r => [r.our, r.loaded])), in_Relase_Door_PB: "X_Blue_NC" };
      const pu = await srv.call("PUT", "/api/mapping", { target: T.id, table }); assert.equal(pu.status, 200, pu.text); assert.deepEqual(pu.json.unmapped, []);
      const s = byId(await workerSubset(T.rec, table, ["K-11"]));
      assert.equal(s["K-11"], "FAIL", "inverted blue: K-11 must FAIL honestly");
    });
  } finally { srv.stop(); }
});
