import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { parseSalFile } from "../src/sal-parser.js";
import { auditAssumptions } from "../src/sal-assumptions.js";

const model = parseSalFile(fileURLToPath(new URL("../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal", import.meta.url)));
const report = auditAssumptions(model);
if (process.argv.includes("--write")) {
  fs.writeFileSync(new URL("../SAL_INPUT_INVENTORY.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
}
console.log(JSON.stringify({ ...report.summary, executionOrder: report.executionOrder,
  unresolvedUsedOutputs: report.unresolved.filter(x => x.usedOutputs.length) }, null, 2));
// Findings are an inventory, not acceptance: no zero-exit PASS interpretation.
