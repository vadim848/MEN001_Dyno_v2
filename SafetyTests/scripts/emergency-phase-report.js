import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../src/sal-parser.js";
import { runPhaseMatrix } from "../src/emergency-phase-matrix.js";
const model = parseSalFile(fileURLToPath(new URL("../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal", import.meta.url)));
const rows = runPhaseMatrix(model);
const report = { crc: model.crc, scope: "Network4 excluded; seeded phases; partial no-EDM; raw Healthy FALSE; fixed feedback; observational, not acceptance", rows };
if (process.argv.includes("--write")) fs.writeFileSync(new URL("../EMERGENCY_PHASE_MATRIX.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
// Structurally removed phases are explicit NOT APPLICABLE rows (no trace), never silently dropped.
const notApplicable = rows.filter(r => r.status === "NOT APPLICABLE");
const traced = rows.filter(r => r.status !== "NOT APPLICABLE");
const flagged = traced.filter(r => r.event !== "control" && r.observed.hvRiseDuringFault);
console.log(JSON.stringify({ cases: rows.length, notApplicable: [...new Set(notApplicable.map(r => r.phase))].map(p => ({ phase: p, rows: notApplicable.filter(r => r.phase === p).length, reason: notApplicable.find(r => r.phase === p).reason })), hvRiseDuringFault: flagged.map(r => ({ phase:r.phase, event:r.event, assumption:r.unconnectedInput })),
  nc1Summary: traced.filter(r => r.event === "NC1" && !r.unconnectedInput).map(r => ({ phase:r.phase, at100ms:r.fault100ms.steps, estopOk:r.fault100ms.signals.b_EStop_Ok })) }, null, 2));
