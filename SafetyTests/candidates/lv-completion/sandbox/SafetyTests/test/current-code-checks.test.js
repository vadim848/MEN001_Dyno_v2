import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../src/sal-parser.js";
import { currentCodeChecks } from "../src/current-code-checks.js";

const file = fileURLToPath(new URL("../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal", import.meta.url));
test("Software package executes working SAL components and preserves explicit assumptions", () => {
  const model = parseSalFile(file);
  const rows = currentCodeChecks(model);
  assert.equal(rows.filter(r => r.status === "ERROR").length, 0);
  const timers = rows.filter(r => r.id.startsWith("TIMER:"));
  assert.equal(timers.length, model.networks.flatMap(n => n.blocks).filter(b => b.functionName === "safeTon").length);
  assert.ok(timers.length > 0);
  assert.ok(timers.every(r => r.observations.length === 6));
  assert.ok(rows.some(r => r.id === "ESTOP:restart-fault-recovery"));
  assert.ok(rows.some(r => r.id === "BUTTON:held-chord-at-start"));
  const phase = rows.find(r => r.id === "PRIORITY:Step12:NC1:fallback=false");
  assert.ok(phase.trace.limitations.length > 0);
  assert.equal(phase.trace.unconnectedInput, false);
});
test("Missing SAL bindings produce ERROR rather than acceptance success", () => {
  const rows = currentCodeChecks({ networks: [], variables: [] });
  assert.equal(rows.find(r => r.id === "STATE:Safe-RnD-Run").status, "ERROR");
  assert.equal(rows.find(r => r.id === "ESTOP:restart-fault-recovery").status, "ERROR");
});
