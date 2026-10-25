import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../src/sal-parser.js";
import { runPhaseMatrix } from "../src/emergency-phase-matrix.js";
const model = parseSalFile(fileURLToPath(new URL("../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal", import.meta.url)));
const rows = runPhaseMatrix(model);
const report = { crc: model.crc, scope: "Network4 excluded; seeded phases; partial no-EDM; raw Healthy FALSE; fixed feedback; observational, not acceptance", rows };
if (process.argv.includes("--write")) fs.writeFileSync(new URL("../EMERGENCY_PHASE_MATRIX.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
const flagged = rows.filter(r => r.event !== "control" && r.observed.hvRiseDuringFault);
console.log(JSON.stringify({ cases: rows.length, hvRiseDuringFault: flagged.map(r => ({ phase:r.phase, event:r.event, assumption:r.unconnectedInput })),
  nc1Summary: rows.filter(r => r.event === "NC1" && !r.unconnectedInput).map(r => ({ phase:r.phase, at100ms:r.fault100ms.steps, estopOk:r.fault100ms.signals.b_EStop_Ok })) }, null, 2));
