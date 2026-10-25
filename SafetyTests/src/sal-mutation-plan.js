// E2 stand (G1 review C3): strict validation of a SAL mutation plan's detector
// selection. A plan entry that names no real test file, or a behavioural
// pattern that selects no test, must stop the run instead of being dropped
// silently (a silently dropped detector makes every survivor/kill verdict
// meaningless for the slice it was meant to cover).
//
// Policy (deliberately strict, no glob support): testFiles lists EXACT file
// names inside SafetyTests/test. Wildcards are rejected rather than expanded so
// that a mutation report always names the same detector set that the plan
// author reviewed.
import fs from "node:fs";
import path from "node:path";

const EXACT_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.test\.js$/;
const GLOB_CHARS = /[*?[\]{}]/;

/**
 * Resolve plan.testFiles against `testDir`.
 * Returns { files, errors }; files keeps the plan order; errors is a list of
 * human-readable reasons naming each offending entry. Never drops an entry silently.
 */
export function resolvePlanTestFiles(testFiles, testDir) {
  const errors = [];
  if (!Array.isArray(testFiles) || testFiles.length === 0) return { files: [], errors: ["testFiles must be a non-empty array of exact test file names"] };
  const files = [];
  const seen = new Set();
  for (const entry of testFiles) {
    const shown = JSON.stringify(entry);
    if (typeof entry !== "string") { errors.push(`testFiles ${shown}: not a string`); continue; }
    if (GLOB_CHARS.test(entry)) { errors.push(`testFiles ${shown}: wildcard/pattern is not supported, list exact file names`); continue; }
    if (!EXACT_NAME.test(entry)) { errors.push(`testFiles ${shown}: not an exact file name of the form <name>.test.js inside test/ (no paths, spaces or comments)`); continue; }
    if (seen.has(entry)) { errors.push(`testFiles ${shown}: duplicate entry`); continue; }
    seen.add(entry);
    const full = path.join(testDir, entry);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) { errors.push(`testFiles ${shown}: file not found in ${testDir}`); continue; }
    files.push(entry);
  }
  return { files, errors };
}

/** Compile plan.behaviouralTests. Returns { patterns: [{source, rx}], errors }. */
export function compileBehaviouralPatterns(list) {
  if (!Array.isArray(list) || list.length === 0) return { patterns: [], errors: ["behaviouralTests must be a non-empty array of regular expressions (without it no mutation can ever be KILLED)"] };
  const patterns = [];
  const errors = [];
  for (const source of list) {
    if (typeof source !== "string") { errors.push(`behaviouralTests ${JSON.stringify(source)}: not a string`); continue; }
    try { patterns.push({ source, rx: new RegExp(source) }); }
    catch (error) { errors.push(`behaviouralTests ${JSON.stringify(source)}: invalid regular expression (${error.message})`); }
  }
  return { patterns, errors };
}

/** Test name of a resultIndex key "<file> :: <name>[#n]" (same convention as the runner's isBehavioural). */
export const testNameOfKey = key => key.split(" :: ").slice(1).join(" :: ");

/**
 * Count, per behavioural pattern, the reported tests (any status, module-load
 * placeholders excluded) of the detector files it selects. Returns
 * { matches: {source: count}, unmatched: [source] }.
 */
export function behaviouralPatternCoverage(patterns, resultKeys) {
  const names = [...resultKeys].filter(k => !k.endsWith(" :: <module load>")).map(testNameOfKey);
  const matches = Object.fromEntries(patterns.map(p => [p.source, names.filter(n => p.rx.test(n)).length]));
  return { matches, unmatched: patterns.filter(p => matches[p.source] === 0).map(p => p.source) };
}
