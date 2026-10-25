// E0 stand: kill attribution for SAL mutation runs (scripts/sal-mutation-check.js).
// A mutation is KILLED only by a concrete test that was `ok` on the unmutated copy
// and is `not ok` on the mutant because an ASSERTION failed (code ERR_ASSERTION in
// the test itself or in one of its failing nested subtests), and whose name is in the
// plan's behavioural allowlist; or by a behavioural software-check case PASS -> FAIL
// (observation mismatch). Everything else is reported in its own category and never
// counts as a kill:
//   file-level   module load failure (e.g. test/helpers/v2-structural.js SHA pin),
//                file-level `not ok <file>.test.js` (ERR_TEST_FAILURE, uncaught/async
//                exception), timeout, tests absent because their file failed, and any
//                failing test of a file that also has a file-level failure in that run
//   exception    test body threw a non-assertion error (ERR_TEST_FAILURE testCodeFailure):
//                parse/import/precondition/"Fixture ERROR" errors, not an expectation
//   hook-cancel  hookFailed / cancelledByParent / testTimeoutFailure
//   absent       test no longer reported although its file loaded
//   non-behavioural-assertion  assertion failure of a test outside the allowlist
//   swcheck-*    software-check case not PASS for a non-behavioural reason (BOOT, ERROR,
//                NOT VERIFIED, probe crash, case missing)
import { isTestFilePath } from "./stand-sandbox.js";

export const CATEGORIES = Object.freeze(["behavioural-assertion", "swcheck-behavioural-fail", "non-behavioural-assertion",
  "exception", "hook-cancel", "file-level", "absent", "swcheck-structural", "swcheck-error"]);

const isAssertionLeaf = l => l.failureType === "testCodeFailure" && l.code === "ERR_ASSERTION";

/** Failure class of one top-level result: "assertion" | "exception" | "hook-cancel" | "file-level" | null (not failing). */
export function failureClass(r) {
  if (!r || r.status === "pass" || r.status === "skip") return null;
  if (r.status === "load-fail" || r.status === "file-error" || r.fileLevel || isTestFilePath(r.name ?? "")) return "file-level";
  if (r.status !== "fail") return "file-level";
  if (isAssertionLeaf(r)) return "assertion";
  if (r.failureType === "subtestsFailed") {
    const leaves = (r.leaves ?? []).filter(l => l.failureType !== "subtestsFailed");
    if (leaves.some(isAssertionLeaf)) return "assertion";
    if (leaves.length && leaves.every(l => ["hookFailed", "cancelledByParent", "testTimeoutFailure"].includes(l.failureType))) return "hook-cancel";
    return "exception";
  }
  if (["hookFailed", "cancelledByParent", "testTimeoutFailure"].includes(r.failureType)) return "hook-cancel";
  return "exception";
}

/**
 * Compare a mutant run with the baseline. Indices are resultIndex() maps
 * ("<file> :: <name>[#n]" -> result). Returns { newlyFailing, killedBy, categories, verdict }.
 */
export function attributeKills({ baselineIndex, runIndex, isBehaviouralName, baselineCases = null, runCases = null, isBehaviouralCase = () => true }) {
  const filesWithFileLevel = new Set([...runIndex.values()].filter(r => failureClass(r) === "file-level").map(r => r.file));
  const newly = [];
  const nameOf = key => key.split(" :: ").slice(1).join(" :: ");
  for (const [key, r] of runIndex) {
    const b = baselineIndex.get(key);
    const cls = failureClass(r);
    if (!cls) continue;
    if (cls === "file-level") {
      // Reported even when the key did not exist on baseline (new file-level entry).
      if (b && failureClass(b) === "file-level") continue;
      newly.push({ key, status: r.status, failureType: r.failureType ?? "", code: r.code ?? "", message: r.message ?? "", category: "file-level", behavioural: false });
      continue;
    }
    if (b?.status !== "pass") continue;
    let category;
    if (filesWithFileLevel.has(r.file)) category = "file-level";
    else if (cls === "assertion") category = isBehaviouralName(nameOf(key)) ? "behavioural-assertion" : "non-behavioural-assertion";
    else category = cls;
    newly.push({ key, status: r.status, failureType: r.failureType ?? "", code: r.code ?? "", message: r.message ?? "", category, behavioural: category === "behavioural-assertion" });
  }
  for (const [key, b] of baselineIndex) if (b.status === "pass" && !runIndex.has(key)) {
    const loadFailed = filesWithFileLevel.has(b.file);
    const load = runIndex.get(`${b.file} :: <module load>`);
    newly.push({ key, status: "absent", message: load ? `module load failed: ${load.message}` : loadFailed ? "file-level failure in this run" : "test no longer reported",
      category: loadFailed ? "file-level" : "absent", behavioural: false });
  }
  if (baselineCases && runCases) {
    for (const [id, status] of runCases) {
      const before = baselineCases.get(id);
      if (id === "<cases-probe>" && status !== "PASS" && before !== status) { newly.push({ key: `software-check :: ${id}`, status, message: "cases probe failed", category: "swcheck-error", behavioural: false }); continue; }
      if (before !== "PASS" || status === "PASS") continue;
      const category = status === "FAIL" ? (isBehaviouralCase(id) ? "swcheck-behavioural-fail" : "swcheck-structural") : "swcheck-error";
      newly.push({ key: `software-check :: ${id}`, status, message: "", category, behavioural: category === "swcheck-behavioural-fail" });
    }
    for (const [id, before] of baselineCases) if (before === "PASS" && !runCases.has(id))
      newly.push({ key: `software-check :: ${id}`, status: "absent", message: "case no longer reported (probe aborted?)", category: "swcheck-error", behavioural: false });
  }
  const killedBy = newly.filter(n => n.behavioural).map(n => n.key);
  const categories = Object.fromEntries(CATEGORIES.map(c => [c, newly.filter(n => n.category === c).length]));
  const verdict = killedBy.length ? "KILLED" : newly.length ? "STRUCTURAL-ONLY" : "SURVIVED";
  return { newlyFailing: newly, killedBy, categories, verdict };
}
