// E0 stand: computes only the software-check behavioural CASES (requirements,
// current-code checks, reference EStop comparison) for the SAL at the standard
// path, without re-running the test stages and without writing any report.
// Prints {"cases":[{id,status}]} on stdout. Used by sal-mutation-check.js.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../src/sal-parser.js";
import { candidateButtonCoverChecks } from "../src/candidate-button-cover.js";
import { currentCodeChecks } from "../src/current-code-checks.js";
import { referenceBehavior } from "../src/reference-behavior.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const sal = path.resolve(root, "../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal");
const cases = [];
try {
  const model = parseSalFile(sal);
  cases.push(...candidateButtonCoverChecks(model), ...currentCodeChecks(model));
  // Reference comparison only when the frozen reference copy exists (P2); never the sibling repo.
  const pinned = path.join(root, "fixtures/pinned/MANIFEST.json");
  if (fs.existsSync(pinned)) {
    const { pinnedReferenceSalPath } = await import("../src/pinned-sources.js");
    cases.push(...referenceBehavior(pinnedReferenceSalPath(), model).cases);
  }
} catch (error) {
  cases.push({ id: "<cases-probe>", status: "ERROR", error: error.message });
}
process.stdout.write(JSON.stringify({ cases: cases.map(c => ({ id: c.id, status: c.status })) }));
