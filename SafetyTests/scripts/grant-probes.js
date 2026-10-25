// E2 stand: robust probes G-1..G-4 on ring grants (PLAN v5 A4-3 / section 6).
// Not an oracle and not part of check:software (its counts are unchanged).
// Usage: node scripts/grant-probes.js [--sal <file> --sgvl <file>] [--network Network3] [--env <json>] [--out <dir>]
//   --env {"Symbol": bool | [bool,...]} for EVERY non-grant external Symbol (then nothing is swept by default;
//   a read Symbol missing from --env is ERROR UNDEFINED_INPUT).
//   default source: canonical SAL/SGVL (read only, current binding audit).
// Exit: 0 every NORMATIVE row AS-CONSTRUCTED; 1 any NORMATIVE DEVIATES; 3 any ERROR (incl. INJECTION_POINT_MISSING,
//   NORMATIVE_SEED_MISSING). OBSERVATION rows (seeds other than the normative ones, lead 2026-10-22) never change the exit.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parseSalFile } from "../src/sal-parser.js";
import { runGrantProbes } from "../src/grant-probes.js";
import { repoRoot, CANONICAL } from "../src/stand-sandbox.js";

const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const sal = path.resolve(opt("--sal") ?? path.join(repoRoot, CANONICAL.sal));
const sgvl = path.resolve(opt("--sgvl") ?? path.join(repoRoot, CANONICAL.sgvl));
const out = opt("--out") && path.resolve(opt("--out"));
const sha = f => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");

let result;
try {
  const model = parseSalFile(sal, { bindingMode: "current", sgvlPath: sgvl });
  result = { generatedAt: new Date().toISOString(), salFile: sal, salSha256: sha(sal), sgvlSha256: sha(sgvl),
    ...runGrantProbes(model, { network: opt("--network") ?? "Network3", env: opt("--env") ? JSON.parse(opt("--env")) : undefined }) };
} catch (error) {
  console.error(`ERROR ${error.message}`);
  process.exit(3);
}
const lines = [`# Grant probes (robust probes, not oracle)`, "", `SAL ${result.salSha256}`, `SGVL ${result.sgvlSha256}`, `Source: ${result.source}`, `Scope: ${result.scope}`,
  `Grants read by the ring: ${result.interface.grants.join(", ")}`, `Swept non-grant Symbols: ${JSON.stringify(result.interface.sweptSymbols)}`,
  `Unconnected active inputs (runtime assumption, both values): ${result.interface.unconnectedActiveInputs.join(", ") || "none"}`, "",
  `Normative seeds: ${result.normativeSeedsSource}`, "",
  "| probe | injected (1 scan) | construction | normative seeds | NORMATIVE A / D / E | OBSERVATION A / D / E |", "|---|---|---|---|---|---|",
  ...result.probes.map(p => { const n = result.normativeSummary[p.id], o = result.observationSummary[p.id];
    return `| ${p.id} | ${p.inject.join(" + ")} | ${p.construction} | ${p.normativeSeeds?.length ? p.normativeSeeds.join(", ") : "none (limit; observation only)"} | ${n["AS-CONSTRUCTED"]} / ${n.DEVIATES} / ${n.ERROR} | ${o["AS-CONSTRUCTED"]} / ${o.DEVIATES} / ${o.ERROR} |`; }), "",
  "A = AS-CONSTRUCTED, D = DEVIATES, E = ERROR. Only NORMATIVE rows carry the verdict; OBSERVATION rows are reported.", "",
  ...result.normativeSeedsMissing.map(m => `- ERROR ${m.probe}: ${m.error}`), "",
  "## DEVIATES / ERROR rows", "", "| probe | role | seed | env | unconnected | pre | after injection | settled | status |", "|---|---|---|---|---|---|---|---|---|",
  ...result.rows.filter(r => r.status !== "AS-CONSTRUCTED").map(r => r.status === "ERROR" && !r.env ? `| ${r.probe} | ${r.role ?? ""} | ${r.seed ?? ""} | | | | | | ERROR ${r.error} |` :
    `| ${r.probe} | ${r.role ?? ""} | ${r.seed} | ${JSON.stringify(r.env)} | ${r.unconnectedInput} | ${r.preState?.join(",") ?? ""}${r.seedHeld === false ? " (seed not held)" : ""} | ${r.afterInjection?.join(",") ?? ""} | ${r.settled?.join(",") ?? ""} | ${r.status}${r.error ? " " + r.error : ""} |`),
  "", ...result.limits.map(l => `- ${l}`), ""];
if (out) {
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "grant-probes.json"), JSON.stringify(result, null, 1) + "\n");
  fs.writeFileSync(path.join(out, "grant-probes.md"), lines.join("\n"));
}
for (const p of result.probes) console.log(`${p.id} ${p.inject.join("+")}: normative(${p.normativeSeeds?.join(",") || "none"}) ${JSON.stringify(result.normativeSummary[p.id])} observation ${JSON.stringify(result.observationSummary[p.id])}`);
const all = result.rows;
for (const m of result.normativeSeedsMissing) console.error(`ERROR ${m.probe} ${m.error}`);
process.exitCode = all.some(r => r.status === "ERROR") || result.normativeSeedsMissing.length ? 3 : all.some(r => r.role === "NORMATIVE" && r.status === "DEVIATES") ? 1 : 0;
