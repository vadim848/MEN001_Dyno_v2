import { effectiveEstopInputs } from "./estop-native-pairs.js";
import fs from "node:fs";
import crypto from "node:crypto";
import { parseSalFile } from "./sal-parser.js";
import { SalRuntime } from "./sal-runtime.js";

export const referenceIdentity = {
  repository: "https://github.com/vadim848/MEN001_Dyno.git", branch: "Prodoction",
  commit: "4495a1f6049f6a58ebfd436761faa84d17c8d643",
  salSha256: "efddc60b1263144ae73b3d5184158100ec09c4de739dc8919309ef7b1b0dc334"
};
function profile(model) {
  const block = model.networks.flatMap(n => n.blocks).find(b => b.functionName === "safeEstop");
  if (!block) throw new Error("Reference comparison: missing EStop block");
  const r = new SalRuntime({ ...model, networks: [{ blocks: [block] }] });
  function drive(name, logical) {
    const port = block.inputs.find(p => p.name === name);
    const effective=effectiveEstopInputs(block).find(p=>p.port.path===port.path);
    const invert=effective?.inverted ?? port.deactivate1 === "Make Contact (NO)";
    const raw = invert ? !logical : logical;
    r.values.set(port.path, raw);
    for (const source of port.sources) r.values.set(source, raw);
    for (const global of port.globals) r.setInputs({ [global.lastKnownPath.split(".").at(-1)]: raw });
    const variable = r.variableTargets.get(port.path);
    if (variable) r.setInputs({ [variable]: raw });
  }
  for (const {port} of effectiveEstopInputs(block)) drive(port.name,true);
  drive("Restart", false);
  const values = [];
  const snap = label => values.push({ label, enabled: r.get(`${block.path}/EStopOut`) });
  r.runFor(100); snap("healthy without reset");
  drive("Restart", true); r.runFor(100); snap("held reset");
  drive("Restart", false); r.scan(); snap("reset released");
  drive("EStopIn1", false); r.scan(); snap("fault");
  drive("EStopIn1", true); r.runFor(500); snap("restored without reset");
  drive("Restart", true); r.scan(); drive("Restart", false); r.scan(); snap("fresh reset");
  return { values, limitations: [...r.limitations] };
}
export function referenceBehavior(file, candidate) {
  if (!fs.existsSync(file)) return { ...referenceIdentity, available: false, cases: [{
    id: "REF:existing-EStop", status: "NOT VERIFIED", reason: "Reference source unavailable; other software checks continue" }] };
  const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  if (hash !== referenceIdentity.salSha256) return { ...referenceIdentity, actualSha256: hash, cases: [{
    id: "REF:identity", status: "ERROR", error: "Reference SAL changed from verified checkpoint; expected behavior must be reviewed" }] };
  const reference = parseSalFile(file);
  const existing = profile(reference), current = profile(candidate);
  const observations = existing.values.map((v, i) => ({ label: v.label, expected: v.enabled, actual: current.values[i].enabled }));
  return { ...referenceIdentity, available: true, actualSha256: hash,
    preserved: "EStop component reset/fault/recovery contract; other existing behavior not yet exhaustively compared",
    intentionalChange: "Reference has no R&D/Step12 exports; v2 adds intermediate R&D ownership and separate upward/downward transitions. Requirements for that feature come from SAFETY_STATE_MACHINE_SPEC.md.",
    cases: [{ id: "REF:existing-EStop", scope: "Actual reference and v2 EStop components; logical ports injected, no upstream/group claim",
      status: observations.some(o => o.actual !== o.expected) ? "FAIL" : "PASS", observations,
      referenceLimitations: existing.limitations, candidateLimitations: current.limitations }] };
}
