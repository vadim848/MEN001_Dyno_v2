import {inspectNativeSalStructure} from '../src/sal-native-structure.js';
import { SAL_NATIVE_PAIR_CONTRACT } from "../src/estop-native-pairs.js";
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseSalFile } from "../src/sal-parser.js";
import { resolveSignalNames } from "../src/signal-names.js";
import { candidateButtonCoverChecks } from "../src/candidate-button-cover.js";
import { currentCodeChecks } from "../src/current-code-checks.js";
import { referenceBehavior } from "../src/reference-behavior.js";
import { SAL_CLOCK_CONTRACT } from "../src/sal-runtime.js";
import { preflightWorkingProgram } from "../src/boot-preflight.js";
import { pinnedReferenceSalPath } from "../src/pinned-sources.js";
import { DEFAULT_CASE_BASELINE, loadCaseBaseline, diffCaseIds, formatCaseIdDiff, DEFAULT_TEST_BASELINE, loadTestBaseline, topLevelTests, diffStageTests, formatStageTestDiff, loadExpectedDeltas, reconcileDeltas, formatDeltaReconciliation, applyDeclaredReplacements, formatDeclaredReplacements } from "../src/case-id-diff.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const sal = path.resolve(root, "../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal");
const nativeStructure = {generatedAt:new Date().toISOString(),source:sal,sha256:crypto.createHash('sha256').update(fs.readFileSync(sal)).digest('hex'),...inspectNativeSalStructure(fs.readFileSync(sal,'utf8'))};
fs.writeFileSync(path.join(root,'SAL_NATIVE_STRUCTURE_RESULTS.json'),JSON.stringify(nativeStructure)+'\n');
if(nativeStructure.status!=='PASS'){console.error('Native SAL preflight rejected source SHA256 '+nativeStructure.sha256+' before parsing/execution. SOFTWARE_CHECK_RESULTS may be from an earlier run.\n'+nativeStructure.errors.join('\n'));process.exit(3);}
const model = parseSalFile(sal);
// D-ARCH-POL-RENAME: the actual names of the four renamed variables are selected from this SAL; ERROR if unresolvable.
const signalNames = resolveSignalNames(model);
if (signalNames.error) { console.error(`Signal name resolution failed: ${signalNames.error}`); process.exit(3); }
console.log(`signal names: ${signalNames.generations.join(",") || "none declared"} (${signalNames.rows.map(r => r.actual ?? r.legacy + "|" + r.renamed + ":UNDECLARED").join(", ")})`);
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
  const stage = { name, files: groups[name], status, counts, tests: topLevelTests(result.stdout ?? "") };
  if (stage.status !== "PASS") stage.diagnostics = { stdout: result.stdout, stderr: result.stderr, error: result.error?.message };
  stages.push(stage);
  console.log(`${name}: ${stage.status} ${JSON.stringify(counts)}`);
}
// Keep physical validation outside this scope; software coverage gaps stay visible.
const requirements = candidateButtonCoverChecks(model).map(row => ({ ...row,
  ...(row.id === "ACC-C02-F" ? { reason: "Full-phase coverage of both InterLock NC energy guards and separate DoorMonitor solenoid reactions remains incomplete; no locked-feedback gate is required" } : {}),
  ...(row.id === "ACC-C01-E" ? { reason: "Software coverage of all transition phases and fault/button combinations remains incomplete" } : {}) }));
const reference = referenceBehavior(pinnedReferenceSalPath(), model); // frozen reference copy, no sibling repository at runtime
const bootPreflight = preflightWorkingProgram();
const cases = [...requirements, ...currentCodeChecks(model), ...reference.cases, ...bootPreflight.cases];
// S15: vanished/new case IDs against a pinned baseline are reported, never silently absorbed into smaller totals.
// Override: SAL_CASE_BASELINE=<case-id-baseline-v1 json>.
const caseBaseline = loadCaseBaseline(process.env.SAL_CASE_BASELINE || DEFAULT_CASE_BASELINE);
const testBaseline = loadTestBaseline(process.env.SAL_TEST_BASELINE || DEFAULT_TEST_BASELINE);
// E2-R1-stand-2: MISSING cases/tests and NOT APPLICABLE cases need an APPROVED expected-deltas
// file of this SAL (fixtures/case-baselines/expected-deltas/<sha>.json or SAL_EXPECTED_DELTAS), else exit 4.
const salSha256 = crypto.createHash("sha256").update(fs.readFileSync(sal)).digest("hex");
const expectedDeltas = loadExpectedDeltas(salSha256, process.env.SAL_EXPECTED_DELTAS || undefined);
// E2a-rename (A4-3): cases replaced by other criteria on this SAL become NOT APPLICABLE only via an
// APPROVED declaration; the executed verdict is kept. Applied before the ID diff so the diff shows it.
const declaredReplacements = applyDeclaredReplacements(cases, expectedDeltas, { casesFileSha256: caseBaseline.fileSha256, testsFileSha256: testBaseline.fileSha256 });
const caseIdDiff = diffCaseIds(caseBaseline, cases);
// Same for top-level node:test names per stage. Override: SAL_TEST_BASELINE=<stage-test-baseline-v1 json>.
const stageTestDiff = diffStageTests(testBaseline, stages);
const deltaReconciliation = reconcileDeltas({ caseIdDiff, stageTestDiff, cases, expected: expectedDeltas });
const summary = Object.fromEntries(["PASS", "FAIL", "NOT VERIFIED", "ERROR", "NOT APPLICABLE"].map(s => [s, cases.filter(c => c.status === s).length]));
const report = { nativeStructure, generatedAt: new Date().toISOString(), source: path.relative(path.resolve(root, ".."), sal).replaceAll("\\", "/"),
  clockContract:SAL_CLOCK_CONTRACT,
  nativePairContract:SAL_NATIVE_PAIR_CONTRACT,
  modelSourceSha256:Object.fromEntries(["src/sal-runtime.js","src/observed-samples.js","src/sal-parser.js","src/estop-native-pairs.js","src/physical-rnd-source.js","src/signal-names.js"].map(file=>
    [file,crypto.createHash("sha256").update(fs.readFileSync(path.join(root,file))).digest("hex")])),
  sgvlSha256:crypto.createHash("sha256").update(fs.readFileSync(path.resolve(root,"../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl"))).digest("hex"),
  bindingAudit: { status:model.bindingAudit.status, errors:model.bindingAudit.errors,
    globalReferences:model.bindingAudit.globalRefs.length, canonicalWires:model.bindingAudit.edges.length,
    scope:"Full working SAL + GVL1 namespace/relationship validation before any component selection; software structural evidence only" },
  sha256: crypto.createHash("sha256").update(fs.readFileSync(sal)).digest("hex"),
  crcRecordedInSource: model.crc, hardwareConfiguration: "accepted existing system; not tested or modified",
  scope: "Software only; selected component/phase-cut executions plus separate full-source capability preflight with zero functional BOOT PASS. No hardware safety claim.",
  timingPolicy: "User approved single 0.5s / both 1s; chord delta <=250ms symmetrically, both time starts at second press. Only this window change is authorized. At 500ms the single already wins; no retrospective StepUp or invented visible unlock pulse.",
  signalNames: { generations: signalNames.generations, decision: signalNames.decision, rows: signalNames.rows.map(({ role, legacy, renamed, actual, generation }) => ({ role, legacy, renamed, actual, generation })) },
  stages, excluded: groups.excluded, reference, summary, caseIdDiff, stageTestDiff, deltaReconciliation, declaredReplacements, cases, bootPreflight,
  capabilitySourceSha256:Object.fromEntries(["src/boot-preflight.js","src/boot-source-inventory.js","BOOT_PREFLIGHT_SOURCE_MANIFEST.json"].map(file=>
    [file,crypto.createHash("sha256").update(fs.readFileSync(path.join(root,file))).digest("hex")])),
  gaps: [...bootPreflight.gaps.map(g=>`${g.code}: ${g.reason}`), "Full upstream transition permission/completion coverage incomplete",
    "Full-phase coverage of two InterLock NC energy guards and separate DoorMonitor solenoid conditions remains incomplete; no separate locked-feedback gate required", "Energy completion/timeout behavior requires explicit software expectations where not specified"] };
fs.writeFileSync(path.join(root, "SOFTWARE_CHECK_RESULTS.json"), JSON.stringify(report) + "\n");
fs.writeFileSync(path.join(root, "BOOT_PREFLIGHT_RESULTS.json"), JSON.stringify(bootPreflight) + "\n");
const lines = ["# Результаты программных проверок", "", `Дата: ${report.generatedAt}`, `SAL SHA256: ${report.sha256}`, "",
  `Clock: ${report.clockContract.version}; first observed edge age0; fixed scan per scenario. Generic runFor durations describe scheduled scan advance, not an implicit event timestamp.`, "",
  "Аппаратная конфигурация принята как исходное условие. Файлы проекта не изменяются этим запуском.", "",
  ...stages.map(s => `- ${s.name}: ${s.status}; ${s.counts.pass}/${s.counts.tests}, ошибок ${s.counts.fail}, пропусков ${s.counts.skipped}.`),
  `- Текущий код: ${JSON.stringify(summary)}.`, "",
  "## Сверка ID кейсов с базой (исчезнувшие/новые/изменившие статус)", "", ...formatCaseIdDiff(caseIdDiff), "",
  "## Сверка имён тестов по стадиям с базой (исчезнувшие тесты)", "", ...formatStageTestDiff(stageTestDiff), "",
  "## Объяснение дельт (MISSING / NOT APPLICABLE) файлом ожидаемых дельт", "", ...formatDeltaReconciliation(deltaReconciliation), "",
  "## Объявленные замены кейсов (A4-3; только из утверждённого файла дельт)", "", ...formatDeclaredReplacements(declaredReplacements), "",
  "## NOT APPLICABLE (структурно удалённые фазы или утверждённая замена; не PASS)", "",
  ...cases.filter(c => c.status === "NOT APPLICABLE").map(c => `- ${c.id}: ${c.reason}`),
  ...[...new Map(cases.flatMap(c => c.phasesNotApplicable ?? c.trace?.phasesNotApplicable ?? []).map(p => [p.phase, p])).values()]
    .map(p => `- фаза ${p.phase} (${p.anchor}): ${p.reason}; не наблюдается ни в одном кейсе этого источника`), "",
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
console.log(`case IDs vs baseline: ${JSON.stringify(caseIdDiff.counts)}`);
for (const m of caseIdDiff.missing) console.log(`  MISSING ${m.id} (baseline ${m.baselineStatus})`);
for (const a of caseIdDiff.added) console.log(`  NEW ${a.id} (${a.status})`);
for (const [name, d] of Object.entries(stageTestDiff.stages)) console.log(`tests ${name} vs baseline: ${JSON.stringify(d.counts)}`);
console.log(`expected deltas: ${deltaReconciliation.file ?? "none"} ${JSON.stringify(deltaReconciliation.counts)}${deltaReconciliation.approval ? " approval " + deltaReconciliation.approval.status : ""}`);
for (const l of formatDeclaredReplacements(declaredReplacements)) console.log(l);
for (const i of deltaReconciliation.items.filter(i => i.explanation !== "EXPLAINED")) console.log(`  ${i.explanation} ${i.kind}${i.stage ? " [" + i.stage + "]" : ""} ${i.id}`);
console.log("Reports: SOFTWARE_CHECK_RESULTS.md / .json");
// Exit: 3 ERROR; 4 unexplained MISSING / NOT APPLICABLE (evidence set incomplete); 1 FAIL; 2 NOT VERIFIED; 0.
process.exitCode = stages.some(s => s.status === "ERROR") || summary.ERROR ? 3 : !deltaReconciliation.ok ? 4 :
  summary.FAIL || stages.some(s => s.status === "FAIL") ? 1 : summary["NOT VERIFIED"] ? 2 : 0;
