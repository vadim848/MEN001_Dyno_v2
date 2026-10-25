// E2-R1 S15 (stand): software-check cases are generated from the source (e.g. one
// TIMER case per safeTon). When a source change removes blocks, cases vanish and the
// totals shrink silently. This module compares the case IDs of a run with a pinned
// baseline so that vanished/new cases and status changes are reported explicitly.
// It never changes a case status and never decides acceptance.
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const DEFAULT_CASE_BASELINE = fileURLToPath(new URL("../fixtures/case-baselines/F1-04b45456.cases.json", import.meta.url));

export function loadCaseBaseline(file = DEFAULT_CASE_BASELINE) {
  const bytes = fs.readFileSync(file);
  const baseline = JSON.parse(bytes.toString("utf8"));
  if (baseline.version !== "case-id-baseline-v1" || !Array.isArray(baseline.cases)) throw new Error(`Unsupported case baseline ${file}`);
  const ids = baseline.cases.map(c => c.id);
  if (new Set(ids).size !== ids.length) throw new Error(`Duplicate case IDs in baseline ${file}`);
  return { ...baseline, file, fileSha256: crypto.createHash("sha256").update(bytes).digest("hex") };
}

export function diffCaseIds(baseline, cases) {
  const ids = cases.map(c => c.id);
  const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  const now = new Map(cases.map(c => [c.id, c.status]));
  const before = new Map(baseline.cases.map(c => [c.id, c.status]));
  const missing = baseline.cases.filter(c => !now.has(c.id)).map(c => ({ id: c.id, baselineStatus: c.status }));
  const added = cases.filter(c => !before.has(c.id)).map(c => ({ id: c.id, status: c.status }));
  const statusChanged = cases.filter(c => before.has(c.id) && before.get(c.id) !== c.status)
    .map(c => ({ id: c.id, from: before.get(c.id), to: c.status }));
  return {
    baseline: { file: baseline.file, fileSha256: baseline.fileSha256, salSha256: baseline.source?.salSha256, label: baseline.label },
    counts: { baseline: before.size, current: now.size, missing: missing.length, added: added.length, statusChanged: statusChanged.length, duplicates: duplicates.length },
    missing, added, statusChanged, duplicates,
    note: "Missing = case ID present in the pinned baseline but not generated for this source. It is neither PASS nor FAIL; it must be explained (planned removal or stand defect)."
  };
}

export function formatCaseIdDiff(diff) {
  const lines = [`Baseline: ${diff.baseline.label ?? ""} SAL ${diff.baseline.salSha256} (${diff.baseline.fileSha256.slice(0, 12)}); ` +
    `cases ${diff.counts.baseline} -> ${diff.counts.current}; missing ${diff.counts.missing}, new ${diff.counts.added}, status changed ${diff.counts.statusChanged}, duplicate IDs ${diff.counts.duplicates}.`];
  for (const m of diff.missing) lines.push(`- MISSING ${m.id} (baseline ${m.baselineStatus})`);
  for (const a of diff.added) lines.push(`- NEW ${a.id} (${a.status})`);
  for (const s of diff.statusChanged) lines.push(`- CHANGED ${s.id}: ${s.from} -> ${s.to}`);
  for (const d of diff.duplicates) lines.push(`- DUPLICATE ID ${d}`);
  return lines;
}

// Same principle for node:test results per stage: tests generated from the source
// (e.g. one OBS-TON test per safeTon) or test files that crash at load disappear
// from the totals. Names are top-level TAP entries; duplicates are kept as a multiset.
export const DEFAULT_TEST_BASELINE = fileURLToPath(new URL("../fixtures/case-baselines/F1-04b45456.tests.json", import.meta.url));

export function topLevelTests(tapStdout = "") {
  const out = [];
  for (const line of tapStdout.split(/\r?\n/)) {
    const m = line.match(/^(not ok|ok) \d+ - (.*?)(?: # (SKIP|TODO)\b.*)?$/);
    if (m) out.push({ name: m[2], status: m[3] === "SKIP" ? "skip" : m[3] === "TODO" ? "todo" : m[1] === "ok" ? "pass" : "fail" });
  }
  return out;
}

export function loadTestBaseline(file = DEFAULT_TEST_BASELINE) {
  const bytes = fs.readFileSync(file);
  const baseline = JSON.parse(bytes.toString("utf8"));
  if (baseline.version !== "stage-test-baseline-v1" || typeof baseline.stages !== "object") throw new Error(`Unsupported test baseline ${file}`);
  return { ...baseline, file, fileSha256: crypto.createHash("sha256").update(bytes).digest("hex") };
}

export function diffStageTests(baseline, stages) {
  const count = list => list.reduce((m, t) => m.set(t.name, (m.get(t.name) ?? 0) + 1), new Map());
  const result = { baseline: { file: baseline.file, fileSha256: baseline.fileSha256, salSha256: baseline.source?.salSha256, label: baseline.label }, stages: {},
    note: "Missing = top-level test present in the pinned baseline run but absent now (removed, renamed, not generated, or file failed to load). Informational; it does not change any status." };
  for (const stage of stages) {
    const before = baseline.stages[stage.name] ?? [], now = stage.tests ?? [];
    const b = count(before), n = count(now);
    const missing = [...b].flatMap(([name, k]) => Array(Math.max(0, k - (n.get(name) ?? 0))).fill(name));
    const added = [...n].flatMap(([name, k]) => Array(Math.max(0, k - (b.get(name) ?? 0))).fill(name));
    const unique = (list, k) => new Map(list.filter(t => k.get(t.name) === 1).map(t => [t.name, t.status]));
    const ub = unique(before, b), un = unique(now, n);
    const statusChanged = [...un].filter(([name, s]) => ub.has(name) && ub.get(name) !== s).map(([name, s]) => ({ name, from: ub.get(name), to: s }));
    result.stages[stage.name] = { counts: { baseline: before.length, current: now.length, missing: missing.length, added: added.length, statusChanged: statusChanged.length }, missing, added, statusChanged };
  }
  return result;
}

export function formatStageTestDiff(diff) {
  const lines = [`Baseline: ${diff.baseline.label ?? ""} SAL ${diff.baseline.salSha256} (${diff.baseline.fileSha256.slice(0, 12)}).`];
  for (const [name, s] of Object.entries(diff.stages)) {
    lines.push(`- ${name}: tests ${s.counts.baseline} -> ${s.counts.current}; missing ${s.counts.missing}, new ${s.counts.added}, status changed ${s.counts.statusChanged}.`);
    for (const m of s.missing) lines.push(`  - MISSING ${m}`);
  }
  return lines;
}

// E2-R1-stand-2 (lead decision 2): a MISSING case, a MISSING top-level test or a
// NOT APPLICABLE case (structurally removed phase) must be explained by an
// expected-deltas file of the candidate source; otherwise software-check exits != 0.
// The file is proposed by the architect/editor and approved by the lead
// (approval.status === "APPROVED"); a DRAFT explains nothing for the exit code,
// it is only shown next to each delta. NEW and CHANGED remain report-only.
// Lookup: SAL_EXPECTED_DELTAS=<file>, else expected-deltas/<SAL sha256>.json.
export const EXPECTED_DELTAS_DIR = fileURLToPath(new URL("../fixtures/case-baselines/expected-deltas/", import.meta.url));

export function loadExpectedDeltas(salSha256, file = undefined) {
  const chosen = file ?? `${EXPECTED_DELTAS_DIR}${salSha256}.json`;
  if (!fs.existsSync(chosen)) {
    if (file) throw new Error(`Expected-deltas file not found: ${file}`);
    return null;
  }
  const bytes = fs.readFileSync(chosen);
  const d = JSON.parse(bytes.toString("utf8"));
  if (d.version !== "expected-deltas-v1") throw new Error(`Unsupported expected-deltas ${chosen}`);
  if (d.source?.salSha256 !== salSha256) throw new Error(`Expected-deltas ${chosen} is for SAL ${d.source?.salSha256}, run is ${salSha256}`);
  if (!Array.isArray(d.cases) || typeof d.tests !== "object" || d.tests === null) throw new Error(`Malformed expected-deltas ${chosen}`);
  for (const e of [...d.cases, ...Object.values(d.tests).flat()]) if (!e || typeof e.reason !== "string" || !e.reason.trim()) throw new Error(`Expected-deltas ${chosen}: every entry needs a non-empty reason`);
  return { ...d, file: chosen, fileSha256: crypto.createHash("sha256").update(bytes).digest("hex") };
}

export function reconcileDeltas({ caseIdDiff, stageTestDiff, cases, expected }) {
  const approved = expected?.approval?.status === "APPROVED" && Boolean(expected?.approval?.by);
  const baselineMismatch = expected && (
    expected.baseline?.casesFileSha256 !== caseIdDiff.baseline.fileSha256 ||
    expected.baseline?.testsFileSha256 !== stageTestDiff.baseline.fileSha256);
  const usable = expected && !baselineMismatch;
  const caseEntry = (kind, id) => usable ? expected.cases.find(e => e.kind === kind && e.id === id) : undefined;
  const items = [
    ...caseIdDiff.missing.map(m => ({ kind: "case-missing", id: m.id, baselineStatus: m.baselineStatus })),
    ...cases.filter(c => c.status === "NOT APPLICABLE").map(c => ({ kind: "case-not-applicable", id: c.id }))
  ].map(item => ({ ...item, expected: caseEntry(item.kind, item.id) ?? null }));
  const usedTests = new Map();
  for (const [stage, d] of Object.entries(stageTestDiff.stages)) for (const name of d.missing) {
    const pool = usable ? (expected.tests[stage] ?? []).filter(e => e.name === name) : [];
    const k = `${stage}\u0000${name}`, used = usedTests.get(k) ?? 0;
    const entry = pool.flatMap(e => Array(e.count ?? 1).fill(e))[used] ?? null;
    if (entry) usedTests.set(k, used + 1);
    items.push({ kind: "test-missing", stage, id: name, expected: entry });
  }
  for (const item of items) item.explanation = !item.expected ? "UNEXPLAINED" : approved ? "EXPLAINED" : "DRAFT-ONLY (not approved)";
  const stale = usable ? [
    // A declared replacement (replacedBy) whose case was generated is reported under declaredReplacements, not as stale.
    ...expected.cases.filter(e => !items.some(i => i.kind === e.kind && i.id === e.id) && !(e.replacedBy && cases.some(c => c.id === e.id))).map(e => ({ kind: e.kind, id: e.id })),
    ...Object.entries(expected.tests).flatMap(([stage, list]) => [...new Set(list.map(e => e.name))].flatMap(name => {
      const want = list.filter(e => e.name === name).reduce((k, e) => k + (e.count ?? 1), 0);
      return Array(Math.max(0, want - (usedTests.get(`${stage}\u0000${name}`) ?? 0))).fill(null).map(() => ({ kind: "test-missing", stage, id: name }));
    }))
  ] : [];
  const unexplained = items.filter(i => i.explanation !== "EXPLAINED");
  return {
    file: expected?.file ?? null, fileSha256: expected?.fileSha256 ?? null,
    approval: expected ? (approved ? { status: "APPROVED", by: expected.approval.by, date: expected.approval.date ?? null } : { status: expected.approval?.status ?? "DRAFT", note: "not approved: explains nothing for the exit code" }) : null,
    baselineMismatch: Boolean(baselineMismatch),
    counts: { deltas: items.length, explained: items.length - unexplained.length, unexplained: unexplained.length, stale: stale.length },
    items, stale, ok: unexplained.length === 0,
    note: "Deltas requiring explanation: MISSING cases, MISSING tests, NOT APPLICABLE cases. Only an APPROVED expected-deltas file bound to this SAL and to the same baseline files explains them. Stale = expected but not observed (informational)."
  };
}

export function formatDeltaReconciliation(rec) {
  const lines = [rec.file ? `Expected deltas: ${rec.file} (${rec.fileSha256.slice(0, 12)}), approval ${rec.approval.status}${rec.approval.by ? ` by ${rec.approval.by}` : ""}${rec.baselineMismatch ? "; BASELINE MISMATCH, file ignored" : ""}.` :
    "Expected deltas: none for this SAL.", `Deltas ${rec.counts.deltas}: explained ${rec.counts.explained}, unexplained ${rec.counts.unexplained}, stale expectations ${rec.counts.stale}.`];
  for (const i of rec.items) lines.push(`- ${i.explanation} ${i.kind}${i.stage ? ` [${i.stage}]` : ""} ${i.id}${i.expected ? `: ${i.expected.reason}` : ""}`);
  for (const s of rec.stale) lines.push(`- STALE expectation ${s.kind}${s.stage ? ` [${s.stage}]` : ""} ${s.id} (expected, not observed)`);
  return lines;
}

// E2a-rename stand slice (A4-3): a case that the architect/analyst REPLACED by other
// criteria on a given source is declared in that source's expected-deltas file as
//   { kind: "case-not-applicable", id, reason, replacedBy: [criteria IDs], decision }.
// Only an APPROVED file bound to the same baselines turns the executed case into
// NOT APPLICABLE; the executed verdict is kept in `executed` (never discarded).
// A DRAFT changes nothing: the case keeps its executed status and the declaration
// is listed as "proposed" in the report. Without a declaration nothing happens.
export function applyDeclaredReplacements(cases, expected, { casesFileSha256, testsFileSha256 } = {}) {
  const entries = (expected?.cases ?? []).filter(e => e.kind === "case-not-applicable" && e.replacedBy !== undefined);
  for (const e of entries) {
    if (!Array.isArray(e.replacedBy) || !e.replacedBy.length || e.replacedBy.some(x => typeof x !== "string" || !x.trim()))
      throw new Error(`Expected-deltas ${expected.file}: ${e.id} replacedBy must be a non-empty list of criteria IDs`);
    if (typeof e.decision !== "string" || !e.decision.trim()) throw new Error(`Expected-deltas ${expected.file}: ${e.id} needs the replacing decision`);
  }
  const approved = expected?.approval?.status === "APPROVED" && Boolean(expected?.approval?.by);
  const baselineMismatch = Boolean(expected) && (expected.baseline?.casesFileSha256 !== casesFileSha256 || expected.baseline?.testsFileSha256 !== testsFileSha256);
  const applied = [], proposed = [], absent = [];
  for (const e of entries) {
    const i = cases.findIndex(c => c.id === e.id);
    if (i < 0) { absent.push(e.id); continue; }
    const c = cases[i];
    const executed = { status: c.status, ...(c.firstViolation ? { firstViolation: c.firstViolation } : {}), ...(c.error ? { error: c.error } : {}), ...(c.reason ? { reason: c.reason } : {}) };
    if (approved && !baselineMismatch) {
      cases[i] = { id: c.id, requirements: c.requirements, title: c.title, status: "NOT APPLICABLE",
        reason: `Replaced by ${e.replacedBy.join(", ")} (${e.decision}): ${e.reason}`, replacedBy: e.replacedBy, decision: e.decision,
        declaredIn: expected.file, executed };
      applied.push({ id: c.id, executedStatus: c.status, replacedBy: e.replacedBy, decision: e.decision });
    } else proposed.push({ id: c.id, executedStatus: c.status, replacedBy: e.replacedBy, decision: e.decision,
      why: baselineMismatch ? "baseline mismatch: file ignored" : "not approved: case keeps its executed status" });
  }
  return { file: expected?.file ?? null, approved, baselineMismatch, applied, proposed, absent,
    note: "Declared replacements (expected-deltas kind case-not-applicable with replacedBy). Applied only from an APPROVED file; executed verdict retained." };
}

export function formatDeclaredReplacements(r) {
  if (!r.file || !(r.applied.length + r.proposed.length + r.absent.length)) return ["Declared replacements: none for this SAL."];
  return [`Declared replacements from ${r.file}: applied ${r.applied.length}, proposed only ${r.proposed.length}, case absent ${r.absent.length}.`,
    ...r.applied.map(a => `- APPLIED ${a.id}: executed ${a.executedStatus} -> NOT APPLICABLE; replaced by ${a.replacedBy.join(", ")} (${a.decision})`),
    ...r.proposed.map(p => `- PROPOSED ${p.id}: stays ${p.executedStatus} (${p.why}); would be replaced by ${p.replacedBy.join(", ")} (${p.decision})`),
    ...r.absent.map(id => `- ABSENT ${id}: declared but not generated for this SAL`)];
}
