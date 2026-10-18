import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../src/sal-parser.js";
import { candidateButtonCoverChecks } from "../src/candidate-button-cover.js";
const sal = fileURLToPath(new URL("../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal", import.meta.url));
const model = parseSalFile(sal);
const cases = candidateButtonCoverChecks(model);
const report = { source: "working v2 SAL, not pinned fixture", crc: model.crc,
  sha256: crypto.createHash("sha256").update(fs.readFileSync(sal)).digest("hex"),
  scope: "Selected block chains with external mode preconditions; timing values preliminary; PASS applies only to sampled scenario, not entire requirement or hardware",
  summary: Object.fromEntries(["PASS", "FAIL", "NOT VERIFIED"].map(s => [s, cases.filter(c => c.status === s).length])), cases };
if (process.argv.includes("--write")) fs.writeFileSync(new URL("../CANDIDATE_ACCEPTANCE.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
for (const c of cases) console.log(`${c.status}: ${c.id} [${c.requirements.join(", ")}] ${c.firstViolation ? JSON.stringify(c.firstViolation) : c.reason ?? c.title}`);
console.log(JSON.stringify(report.summary));
if (cases.some(c => c.status === "FAIL")) process.exitCode = 1;
else if (cases.some(c => c.status === "NOT VERIFIED")) process.exitCode = 2;
