// VIS item 1 + 5 (canonical): exam on canonical SAL vs check:catalog TAP / check:structure; saved HTML report.
// Oracle: VIS-Q2 (structure part + all catalog scenarios, no section M), VIS-Q4 (standalone report content),
// VIS_PLAN §3 (TODO/NV is not PASS), §8.1/§8.7. Expected per-ID statuses come from the stand's own TAP run, not from the visualizer.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { startServer, runExam, catalogTap, parseTap, sha, CANON_SAL, CANON_SGVL, ST, SCRATCH, CANON_SAL_SHA } from "./_lib.mjs";

function structureRef() {
  const out = path.join(SCRATCH, "structure-canon.json");
  return new Promise(res => { const env = { ...process.env, STRUCTURE_OUT: out }; delete env.CATALOG_SAL_DIR;
    spawn(process.execPath, ["scripts/structure-check.js"], { cwd: ST, env, stdio: "ignore" }).on("exit", () => res(JSON.parse(fs.readFileSync(out, "utf8")))); });
}

test("VIS-1/5 canonical exam equals check:catalog/check:structure; report standalone", { timeout: 40 * 60 * 1000 }, async t => {
  const srv = await startServer();
  try {
    const tapP = catalogTap(); const strP = structureRef();
    const tg = await srv.call("POST", "/api/target/canonical");
    assert.equal(tg.status, 200);
    assert.equal(tg.json.salSha256, sha(fs.readFileSync(CANON_SAL)), "canonical SAL SHA256");
    assert.equal(tg.json.salSha256, CANON_SAL_SHA, "canonical SAL = baseline Q-C3-1 Verify (a505e73)");
    const ex = await runExam(srv.call, tg.json.targetId);
    const [tap, sref] = await Promise.all([tapP, strP]);
    fs.writeFileSync(path.join(SCRATCH, "exam-canon.json"), JSON.stringify(ex.result, null, 1));
    const R = ex.result;

    await t.test("structure part == check:structure (PASS, same check list)", () => {
      assert.equal(sref.status, "PASS", "reference structure must be PASS on canonical (baseline)");
      assert.equal(R.structure.status, "PASS");
      assert.deepEqual(R.structure.checks.map(c => [c.name, c.status]), sref.checks.map(c => [c.name, c.status]));
    });
    const ref = parseTap(tap);
    await t.test("catalog part: per-ID status == TAP; no section M / HDR; same ID set", () => {
      const expIds = [...ref.keys()].filter(k => !k.startsWith("M:") && k !== "HDR").sort();
      const gotIds = R.catalog.scenarios.map(s => s.id);
      assert.ok(expIds.length >= 80, "TAP parsed: " + expIds.length);
      assert.equal(new Set(gotIds).size, gotIds.length, "duplicate IDs in exam");
      assert.deepEqual([...gotIds].sort(), expIds, "scenario ID set == TAP non-M non-HDR set");
      assert.ok(!gotIds.some(i => /^M-/.test(i)), "no section M in exam (VIS-Q2)");
      const diff = R.catalog.scenarios.filter(s => s.status !== ref.get(s.id)).map(s => `${s.id}: exam ${s.status} tap ${ref.get(s.id)}`);
      assert.deepEqual(diff, [], "per-ID status mismatch");
      const todo = [...ref].filter(([k, v]) => v === "TODO" && !k.startsWith("M:")).map(([k]) => k);
      assert.ok(todo.includes("E-08"), "baseline: E-08 is TODO in TAP");
      const e08 = R.catalog.scenarios.find(s => s.id === "E-08");
      assert.notEqual(e08.status, "PASS", "E-08 (NOT VERIFIED) must not be shown as PASS");
      assert.ok(e08.nv.length > 0, "E-08 carries NOT VERIFIED text");
      const tt = R.catalog.totals;
      assert.equal(tt.total, gotIds.length); assert.equal(tt.pass + tt.fail + tt.todo + tt.notChecked, tt.total);
      assert.equal(tt.notChecked, 0, "canonical: nothing unmapped");
    });
    await t.test("report.html: standalone, SHA256 SAL+SGVL, date, catalog version, totals, mapping table", async () => {
      const r = await srv.call("GET", `/api/exam/${ex.id}/report.html`);
      assert.equal(r.status, 200);
      assert.match(r.headers.get("content-type"), /text\/html/);
      assert.match(r.headers.get("content-disposition") ?? "", /attachment/);
      const h = r.text; fs.writeFileSync(path.join(SCRATCH, "report-canon.html"), h);
      assert.doesNotMatch(h, /<script\b/i, "no scripts"); assert.doesNotMatch(h, /<link\b/i, "no <link>");
      assert.doesNotMatch(h, /\b(src|href)\s*=\s*["']?(https?:|\/\/|file:|\/)/i, "no external src/href");
      assert.doesNotMatch(h, /url\(|@import/i, "no CSS external refs");
      assert.ok(h.includes(sha(fs.readFileSync(CANON_SAL))), "SAL SHA256");
      assert.ok(h.includes(sha(fs.readFileSync(CANON_SGVL))), "SGVL SHA256");
      assert.ok(h.includes(R.catalogVersion), "catalog version");
      assert.ok(h.includes(R.date.slice(0, 10)), "date");
      const tt = R.catalog.totals;
      assert.ok(h.includes(String(tt.total)) && h.includes(String(tt.pass)), "totals");
      // VIS-3-Q2: report in English (replaces VIS-Q6 Russian)
      assert.match(h, /<html[^>]*lang="en"/, "report lang=en");
      assert.match(h, /Part 1/); assert.match(h, /Part 2/);
      assert.match(h, /name mapping/i, "mapping table section");
      for (const n of ["in_Reset_PB", "in_Relase_Door_PB", "out_Door_Unlock_Solonoeid"]) assert.ok(h.includes(n), "mapping table lists " + n);
      assert.match(h, /not Verify\/TwinCAT/); assert.match(h, /not hardware/); assert.match(h, /FBK.{0,20}simplif/i);
      assert.match(h, /SAL SHA256 matches the canonical/i, "canonical identity stated");
    });
  } finally { srv.stop(); }
});
