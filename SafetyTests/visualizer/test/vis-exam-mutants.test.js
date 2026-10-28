// VIS item 3 + 5 (FAIL part): broken scratch copies of the canonical SAL (canonical file itself untouched).
// M1 behavioural: BLUE single-button timer 0.5 s -> 0.8 s. Oracle: D-TIMING (single blue 0,5 s), Q-ARCH-04/10 (Unlock in Safe/R&D
//   on qualified blue) => catalog K-11 (blue 0.6 s -> Unlock at press+500+-50) must FAIL; divergence point present (VIS-REC-1).
// S1 structural: one graphical wiredLink retargeted to a port in another Network. Oracle: VIS-Q2 (native preflight: inter-network
//   links only via Symbols) => structure FAIL; catalog part still executed and reported separately (VIS-Q2); plan §3: model
//   load failure => every scenario FAIL with that message.
// Report (VIS-Q4): FAIL with messages, divergence and diagram (inline SVG), standalone.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { startServer, runExam, filesOf, canonText, sha, CANON_SAL, CANON_DIR, SCRATCH } from "./_lib.mjs";

export function mutTimer(sal) {
  const i = sal.indexOf('name="BLUE" instanceName="BLUE"'); assert.ok(i > 0, "BLUE timer block");
  const end = sal.indexOf("</fBTon>", i); const j = sal.indexOf('timing="0.5"', i);
  assert.ok(j > i && j < end, "BLUE timing=0.5 inside its block");
  return sal.slice(0, j) + 'timing="0.8"' + sal.slice(j + 'timing="0.5"'.length);
}
export function mutCrossWire(sal) {
  const id = 'wiredLink Id="49e3bdcb-00a2-46a3-ac7f-cddbd2a9f13a"'; const i = sal.indexOf(id); assert.ok(i > 0, "wire locator");
  const from = '<inPortMoniker name="//Network1/FBDecouple2/DecIn1" />'; const j = sal.indexOf(from, i);
  assert.ok(j > i && j - i < 200, "moniker inside the wire");
  return sal.slice(0, j) + '<inPortMoniker name="//Network2/FBDecouple2/DecIn1" />' + sal.slice(j + from.length);
}

test("VIS-3/5 mutated copies", { timeout: 45 * 60 * 1000 }, async t => {
  const canonSha = sha(fs.readFileSync(CANON_SAL));
  const { sal, sgvl } = canonText(); const diagram = fs.readFileSync(path.join(CANON_DIR, "TwinSafeGroup1.sal.diagram"));
  const srv = await startServer();
  try {
    await t.test("S1 structural (graphical inter-network wiredLink): structure FAIL, catalog still run, parts separate", async () => {
      const m = mutCrossWire(sal);
      const up = await srv.call("POST", "/api/target", { files: filesOf({ sal: m, sgvl }) });
      assert.equal(up.status, 200, up.text);
      const ex = await runExam(srv.call, up.json.targetId);
      const R = ex.result; fs.writeFileSync(path.join(SCRATCH, "exam-S1.json"), JSON.stringify(R, null, 1));
      assert.ok(R.structure && R.catalog, "two separate parts");
      assert.notEqual(R.structure.status, "PASS", "structure must not PASS");
      const pre = R.structure.checks.find(c => /preflight/i.test(c.name));
      assert.equal(pre?.status, "FAIL", "native preflight row FAIL");
      assert.match(JSON.stringify(pre.detail), /cross|Network/i);
      assert.ok(R.catalog.scenarios.length >= 80, "catalog part executed for all scenarios");
      assert.equal(R.catalog.totals.fail, R.catalog.totals.total, "load failure => every scenario FAIL (as TAP)");
      assert.ok(R.catalog.scenarios.every(s => s.fails.length > 0), "FAIL rows carry a message");
      assert.ok(!R.catalog.scenarios.some(s => s.status === "PASS"));
      const h = (await srv.call("GET", `/api/exam/${ex.id}/report.html`)).text;
      fs.writeFileSync(path.join(SCRATCH, "report-S1.html"), h);
      assert.ok(h.includes(sha(Buffer.from(m))), "report has the mutant SAL SHA256");
      assert.doesNotMatch(h, /matches the canonical/i, "report must not claim canonical identity");
      assert.match(h, /differs from the canonical/i, "report states the SAL differs from canonical");
    });

    await t.test("M1 behavioural (BLUE 0.5 s -> 0.8 s): K-11 FAIL with divergence + diagram; report", async () => {
      const m = mutTimer(sal); assert.notEqual(sha(Buffer.from(m)), canonSha);
      const up = await srv.call("POST", "/api/target", { files: filesOf({ sal: m, sgvl, diagram }) });
      assert.equal(up.status, 200, up.text); assert.equal(up.json.parseError ?? null, null, "timer mutant parses");
      const ex = await runExam(srv.call, up.json.targetId);
      const R = ex.result; fs.writeFileSync(path.join(SCRATCH, "exam-M1.json"), JSON.stringify(R, null, 1));
      assert.ok(!R.catalog.loadError, "model loaded");
      const k11 = R.catalog.scenarios.find(s => s.id === "K-11");
      assert.equal(k11.status, "FAIL", "K-11 must FAIL on a 0.8 s blue timer [D-TIMING, Q-ARCH-04/10]");
      assert.ok(k11.fails.some(f => /Unlock/.test(f)), "K-11 failing check names Unlock");
      const d = await srv.call("GET", `/api/exam/${ex.id}/scenario/K-11`);
      assert.equal(d.status, 200);
      assert.equal(d.json.divergence?.available, true, "divergence point present: " + JSON.stringify(d.json.divergence));
      assert.ok(Number.isFinite(d.json.divergence.t) && d.json.divergence.signal, "divergence has t and signal");
      assert.ok(d.json.diagram && Object.keys(d.json.diagram.series ?? {}).length, "diagram series present");
      const h = (await srv.call("GET", `/api/exam/${ex.id}/report.html`)).text;
      fs.writeFileSync(path.join(SCRATCH, "report-M1.html"), h);
      assert.doesNotMatch(h, /<script\b|<link\b|url\(|@import/i);
      assert.doesNotMatch(h, /\b(src|href)\s*=\s*["']?(https?:|\/\/|file:|\/)/i);
      assert.ok(h.includes("K-11"), "FAIL id in report");
      for (const s of R.catalog.scenarios.filter(s => s.status === "FAIL")) assert.ok(h.includes(s.id), "every FAIL id in report: " + s.id);
      assert.match(h, /divergence/i, "divergence section");
      assert.match(h, /<svg\b/, "inline SVG diagram");
      assert.ok(h.includes(sha(Buffer.from(m))) && h.includes(sha(Buffer.from(sgvl))), "both SHA256");
      // edited SAL keeps the old recorded CRC => native CRC row FAIL; the catalog part must still execute every scenario (VIS-Q2)
      const crc = R.structure.checks.find(c => /CRC/.test(c.name));
      if (crc && crc.status !== "PASS") { assert.notEqual(R.structure.status, "PASS"); assert.ok(R.catalog.totals.pass > 0, "catalog really executed although structure FAILs"); }
      assert.equal(R.catalog.scenarios.length, R.catalog.totals.total);
      t.diagnostic(`M1 structure=${R.structure.status}; FAIL=${R.catalog.scenarios.filter(s => s.status === "FAIL").map(s => s.id).join(",")}`);
    });
  } finally { srv.stop(); }
});
