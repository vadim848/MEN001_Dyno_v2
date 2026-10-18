import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../src/sal-parser.js";
import { auditAssumptions } from "../src/sal-assumptions.js";

const model = parseSalFile(fileURLToPath(new URL("../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal", import.meta.url)));

test("SAL-INPUT01 inventory finds unresolved transition input and physical constant alias", () => {
  const report = auditAssumptions(model);
  const p = report.unresolved.find(x => x.port === "//Network6/FBDecouple2/DecIn5");
  assert.equal(p.reason, "unconnected");
  assert.deepEqual(p.usedOutputs, ["//Network6/FBDecouple2/DecOut5"]);
  assert.equal(report.externalInputs.find(x => x.name === "in_False_SI2_CH8").channelId, "15");
  assert.equal(report.summary.missingProducers, 0);
});

test("SAL-INPUT02 deleting a wired producer is reported rather than becoming an assumed constant", () => {
  const broken = structuredClone(model);
  const n = broken.networks.find(n => n.name === "Network1");
  n.blocks = n.blocks.filter(b => b.name !== "FBOr8");
  const report = auditAssumptions(broken);
  assert.ok(report.unresolved.some(x => x.port === "//Network1/FBRs3/Set" &&
    x.reason === "missing-port-producer" && x.reference === "//Network1/FBOr8/OrOut"));
});

test("SAL-INPUT03 a selected network cannot silently claim omitted global producers", () => {
  const partial = { ...model, networks: model.networks.filter(n => n.name !== "Network11") };
  const report = auditAssumptions(partial);
  assert.ok(report.unresolved.some(x => x.reference === "b_Step_RnD_Set" &&
    x.reason === "missing-variable-producer"));
});
