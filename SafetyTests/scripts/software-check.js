import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseSalFile } from "../src/sal-parser.js";
import { candidateButtonCoverChecks } from "../src/candidate-button-cover.js";
import { currentCodeChecks } from "../src/current-code-checks.js";
import { referenceBehavior } from "../src/reference-behavior.js";
import { SAL_CLOCK_CONTRACT } from "../src/sal-runtime.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const sal = path.resolve(root, "../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal");
const model = parseSalFile(sal);
const groups = { harness: [], historical: [], current: [], excluded: [] };
for (const file of fs.readdirSync(path.join(root, "test")).filter(f => f.endsWith(".test.js")).sort()) {
  const source = fs.readFileSync(path.join(root, "test", file), "utf8");
  // Hardware alias assertions remain available separately, outside this package.
  const group = ["sal-conformance.test.js", "signal-bindings.test.js"].includes(file) ? "excluded" :
    source.includes("baselineSalPath") ? "historical" :
    file.startsWith("current-") && file !== "current-code-checks.test.js" ? "current" : "harness";
  groups[group].push(file);
}
const stages = [];
for (const name of ["harness", "historical", "current"]) {
  const result = spawnSync(process.execPath, ["--test", "--test-reporter=tap", ...groups[name].map(f => `test/${f}`)],
    { cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  const counts = Object.fromEntries(["tests", "pass", "fail", "skipped"].map(k =>
    [k, Number(result.stdout?.match(new RegExp(`^# ${k} (\\d+)`, "m"))?.[1] ?? 0)]));
  const status = result.status === 0 && counts.tests > 0 ? "PASS" :
    name === "current" && counts.fail > 0 ? "FAIL" : "ERROR";
  const stage = { name, files: groups[name], status, counts };
  if (stage.status !== "PASS") stage.diagnostics = { stdout: result.stdout, stderr: result.stderr, error: result.error?.message };
  stages.push(stage);
  console.log(`${name}: ${stage.status} ${JSON.stringify(counts)}`);
}
// Keep physical validation outside this scope; software coverage gaps stay visible.
const requirements = candidateButtonCoverChecks(model).map(row => ({ ...row,
  ...(row.id === "ACC-C02-F" ? { reason: "Full-phase coverage of both InterLock NC energy guards and separate DoorMonitor solenoid reactions remains incomplete; no locked-feedback gate is required" } : {}),
  ...(row.id === "ACC-C01-E" ? { reason: "Software coverage of all transition phases and fault/button combinations remains incomplete" } : {}) }));
const reference = referenceBehavior(path.resolve(root, "../../MEN001_Dyno/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal"), model);
const cases = [...requirements, ...currentCodeChecks(model), ...reference.cases];
const summary = Object.fromEntries(["PASS", "FAIL", "NOT VERIFIED", "ERROR"].map(s => [s, cases.filter(c => c.status === s).length]));
const report = { generatedAt: new Date().toISOString(), source: path.relative(path.resolve(root, ".."), sal).replaceAll("\\", "/"),
  clockContract:SAL_CLOCK_CONTRACT,
  modelSourceSha256:Object.fromEntries(["src/sal-runtime.js","src/observed-samples.js","src/sal-parser.js"].map(file=>
    [file,crypto.createHash("sha256").update(fs.readFileSync(path.join(root,file))).digest("hex")])),
  sgvlSha256:crypto.createHash("sha256").update(fs.readFileSync(path.resolve(root,"../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl"))).digest("hex"),
  bindingAudit: { status:model.bindingAudit.status, errors:model.bindingAudit.errors,
    globalReferences:model.bindingAudit.globalRefs.length, canonicalWires:model.bindingAudit.edges.length,
    scope:"Full working SAL + GVL1 namespace/relationship validation before any component selection; software structural evidence only" },
  sha256: crypto.createHash("sha256").update(fs.readFileSync(sal)).digest("hex"),
  crcRecordedInSource: model.crc, hardwareConfiguration: "accepted existing system; not tested or modified",
  scope: "Software only; partial SAL adapter, selected chains/components and seeded phases. No hardware safety claim.",
  timingPolicy: "User approved single 0.5s / both 1s; chord delta <=250ms symmetrically, both time starts at second press. Only this window change is authorized. At 500ms the single already wins; no retrospective StepUp or invented visible unlock pulse.",
  stages, excluded: groups.excluded, reference, summary, cases,
  gaps: ["Full group startup/restart and Network4 semantics not modeled", "Full upstream transition permission/completion coverage incomplete",
    "Full-phase coverage of two InterLock NC energy guards and separate DoorMonitor solenoid conditions remains incomplete; no separate locked-feedback gate required", "Energy completion/timeout behavior requires explicit software expectations where not specified"] };
fs.writeFileSync(path.join(root, "SOFTWARE_CHECK_RESULTS.json"), JSON.stringify(report) + "\n");
const lines = ["# Результаты программных проверок", "", `Дата: ${report.generatedAt}`, `SAL SHA256: ${report.sha256}`, "",
  `Clock: ${report.clockContract.version}; first observed edge age0; fixed scan per scenario. Generic runFor durations describe scheduled scan advance, not an implicit event timestamp.`, "",
  "Аппаратная конфигурация принята как исходное условие. Файлы проекта не изменяются этим запуском.", "",
  ...stages.map(s => `- ${s.name}: ${s.status}; ${s.counts.pass}/${s.counts.tests}, ошибок ${s.counts.fail}, пропусков ${s.counts.skipped}.`),
  `- Текущий код: ${JSON.stringify(summary)}.`, "",
  "PASS относится только к указанному компоненту/сценарию. Прототипы и исторические воспроизведения не являются приёмкой текущего SAL.", "",
  `Reference: ${reference.repository}, ${reference.branch}, ${reference.commit}.`, "",
  "Сохраняется проверенный контракт EStop компонента; R&D задаётся требованиями v2, а не reference.",
  "Контрпримеры PRIORITY условны: фазы установлены тестом, Network4 исключён, fallback FALSE/TRUE указан в ID. Число FAIL не равно числу независимых доказанных дефектов системы.",
  "BUTTON/STATE проверяют границу отдельной ветви: внутренний запрос вверх не равен фактическому включению энергии; upstream/downstream разрешения требуют отдельных проверок.", "",
  "## Найденные несоответствия", "", ...cases.filter(c => c.status === "FAIL").map(c => {
    const first = c.firstViolation ?? c.observations?.find(o => o.actual !== o.expected);
    return `- ${c.id}: ${JSON.stringify(first)}.`;
  }), "", "## Пробелы и ошибки", "",
  ...cases.filter(c => ["ERROR", "NOT VERIFIED"].includes(c.status)).map(c => `- ${c.id}: ${c.error ?? c.reason}`),
  ...report.gaps.map(g => `- ${g}`), "", "Подробные наблюдения, исходные условия и допущения: SOFTWARE_CHECK_RESULTS.json.", ""];
fs.writeFileSync(path.join(root, "SOFTWARE_CHECK_RESULTS.md"), lines.join("\n"));
console.log(`current SAL: ${JSON.stringify(summary)}`);
console.log("Reports: SOFTWARE_CHECK_RESULTS.md / .json");
process.exitCode = stages.some(s => s.status === "ERROR") || summary.ERROR ? 3 :
  summary.FAIL || stages.some(s => s.status === "FAIL") ? 1 : summary["NOT VERIFIED"] ? 2 : 0;
