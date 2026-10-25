import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const safety = path.join(repo, "MEN001_Dyno", "Safety_Dyno");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(safety);
const project = files.find(f => f.endsWith(".splcproj"));
const sal = files.find(f => f.endsWith(".sal"));
const aliases = files.filter(f => f.endsWith(".sds"));
const allText = files.filter(f => /\.(sal|sds|sgvl|splcproj)$/.test(f)).map(f => fs.readFileSync(f, "utf8")).join("\n");
const missingRestore = [...allText.matchAll(/RestoreInfo[^>]*(?:NotFound|not found)/gi)].length;

const requiredTerms = [
  "Healthy", "DisCharge", "DoorMonitor", "SolenoidMonitor", "STO", "C2_FBK", "Safety_Step"
];

const report = {
  generatedAt: new Date().toISOString(),
  safetyProject: path.relative(repo, project),
  targetSystem: fs.readFileSync(project, "utf8").match(/<TargetSystem>(.*?)<\/TargetSystem>/)?.[1] ?? null,
  salFile: path.relative(repo, sal),
  aliasCount: aliases.length,
  missingRestoreReferences: missingRestore,
  requiredTermEvidence: Object.fromEntries(requiredTerms.map(term => [term, allText.toLowerCase().includes(term.toLowerCase())])),
  limitations: [
    "Presence of a term does not prove correct runtime behavior.",
    "TwinSAFE execution semantics and CRC must be verified by Beckhoff tooling.",
    "Physical timing and feedback polarity require hardware validation."
  ]
};

console.log(JSON.stringify(report, null, 2));
if (!project || !sal || aliases.length === 0) process.exitCode = 2;
