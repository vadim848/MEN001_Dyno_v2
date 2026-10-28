// VIS model loader: same path as test/helpers/catalog-program.js program(), plus the name mapping (VIS-Q5).
import fs from "node:fs";
import { parseSalFile } from "../src/sal-parser.js";
import { assertNativeSalStructure } from "../src/sal-native-structure.js";
import { programFromModel } from "../test/helpers/catalog-program.js";
import { applyMapping } from "./mapping.js";

// Parse (no execution). Throws on native preflight / binding audit failure, like program().
export function parseTarget(t) {
  assertNativeSalStructure(fs.readFileSync(t.sal, "utf8"));
  const m = parseSalFile(t.sal, { bindingMode: "current", sgvlPath: t.sgvl });
  if (m.bindingAudit.status !== "PASS") throw new Error("whole SAL/SGVL binding audit before execution: " + JSON.stringify(m.bindingAudit.errors.slice(0, 5)));
  return m;
}
export function identityOf(t) { return { dir: t.dir, sal: t.sal, sgvl: t.sgvl, salSha256: t.salSha256, sgvlSha256: t.sgvlSha256 }; }
// table: {our: loaded} or null (identity). Returns {P, m}.
export function loadProgram(t, table) {
  const m = parseTarget(t);
  if (table) applyMapping(m, table);
  return { P: programFromModel(m, identityOf(t)), m };
}
