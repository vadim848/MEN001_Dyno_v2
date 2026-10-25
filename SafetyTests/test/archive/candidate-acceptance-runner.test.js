import test from "node:test";
import assert from "node:assert/strict";
import { baselineSalPath } from "../../src/baseline-fixture.js";
import { parseSalFile } from "../../src/sal-parser.js";
import { candidateButtonCoverChecks } from "../../src/candidate-button-cover.js";
const baseline = parseSalFile(baselineSalPath);

test("ACCEPT-RUN01 historical defect fixture produces failures, not acceptance passes", () => {
  const rows = candidateButtonCoverChecks(baseline);
  assert.equal(rows.find(r => r.id === "ACC-B02-B").status, "PASS");
  assert.equal(rows.find(r => r.id === "ACC-C01-S").status, "FAIL");
  assert.equal(rows.find(r => r.id === "ACC-C01-R").status, "PASS");
  assert.equal(rows.find(r => r.id === "ACC-B01").status, "NOT VERIFIED");
});

test("ACCEPT-RUN02 changing approved blue 0.5s to 1s fails timing acceptance", () => {
  const corrected = structuredClone(baseline);
  const timer = corrected.networks.find(n => n.name === "Network12").blocks.find(b => b.name === "FBTon2");
  timer.parameters.find(p => p.timing).timing = "1";
  assert.equal(candidateButtonCoverChecks(corrected).find(r => r.id === "ACC-B02-B").status, "FAIL");
});

test("ACCEPT-RUN03 missing cover binding is NOT VERIFIED, not a successful default FALSE", () => {
  const incomplete = { ...baseline, networks: baseline.networks.filter(n => n.name !== "Network2") };
  assert.equal(candidateButtonCoverChecks(incomplete).find(r => r.id === "ACC-C01-S").status, "NOT VERIFIED");
});

test("ACCEPT-RUN04 approved timings do not satisfy the independent late-chord rule", () => {
  const rows = candidateButtonCoverChecks(baseline);
  assert.equal(rows.find(r => r.id === "ACC-B03-IN").status, "PASS");
  assert.equal(rows.find(r => r.id === "ACC-B03-EDGE").status, "PASS");
  const late = rows.find(r => r.id === "ACC-B03-LATE");
  assert.equal(late.status, "FAIL");
  assert.equal(late.firstViolation.checkpoint, "1000 ms of both held");
});

test("ACCEPT-RUN06 CHORD250 oracle covers both orders and preserves qualification/output distinction", () => {
  const rows = candidateButtonCoverChecks(baseline);
  for (const suffix of ["", "-BLUE"]) {
    for (const boundary of ["IN", "EDGE", "LATE", "490", "500", "510"]) {
      const row = rows.find(r => r.id === `ACC-B03-${boundary}${suffix}`);
      assert.ok(row);
      const qualification = row.observations.find(o => o.signal.endsWith("/TonOut"));
      assert.equal(qualification.expected, ["500", "510"].includes(boundary));
      const up = row.observations.find(o => o.checkpoint === "1000 ms of both held");
      assert.equal(up.expected, ["IN", "EDGE"].includes(boundary));
      assert.equal(up.actual, true); // The historical defect is exposed, not accepted.
      assert.ok(row.observations.some(o => o.signal === "unlock while green present" && !o.expected));
    }
  }
});

test("ACCEPT-RUN05 seeded emergency cover results retain the no-EDM limitation", () => {
  const rows = candidateButtonCoverChecks(baseline);
  const safe = rows.find(r => r.id === "ACC-C01-E-Step1");
  assert.equal(safe.status, "FAIL");
  assert.ok(safe.limitations.some(x => x.includes("no-EDM assumption")));
  assert.equal(rows.find(r => r.id === "ACC-C01-E-Step3").status, "PASS");
});
