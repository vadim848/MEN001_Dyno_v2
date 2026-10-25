// Source-aware signal name map (E2a-rename stand slice).
//
// D-ARCH-POL-RENAME (Vadim, SCENARIO_DECISIONS.md) renames four SAL variables
// without changing their Id, alias device channel or RAW value:
//   in_LV_Healthy_FBK -> in_LV_Faulty_FBK,  in_HV_Healthy_FBK -> in_HV_Faulty_FBK,
//   outPLC_LV_Healthy -> outPLC_LV_Faulty,  outPLC_HV_Healthy -> outPLC_HV_Faulty.
// The stand drives the same raw channel on every source. The actual name is chosen
// from the declared SAL variables of the given model; there is no default:
//   only legacy declared   -> legacy name (F1, R1, historical fixtures)
//   only renamed declared  -> renamed name (E2a and later)
//   both / neither declared -> ERROR (SignalNameError)
//   legacy and renamed generations mixed among the four -> ERROR
//
// POLARITY IS NOT CHANGED. A raw value stays the raw value. Per D-ARCH-POL the raw
// meaning is the same on every source: raw FALSE = power supply healthy, raw TRUE =
// loss/fault. A fixture value written as "in_HV_Healthy_FBK: true" therefore was
// already raw TRUE = FAULT on F1; it maps to "in_HV_Faulty_FBK: true" (same raw, same
// meaning), never to "in_HV_Faulty_FBK: false". Stand fixtures use the R0 nominal raw FALSE
// (healthy) since lead decision 2026-10-22, written with the renamed keys and mapped per source.

export const SIGNAL_RENAMES = Object.freeze([
  Object.freeze({ role: "LV_PS_FBK", legacy: "in_LV_Healthy_FBK", renamed: "in_LV_Faulty_FBK", direction: "input" }),
  Object.freeze({ role: "HV_PS_FBK", legacy: "in_HV_Healthy_FBK", renamed: "in_HV_Faulty_FBK", direction: "input" }),
  Object.freeze({ role: "LV_PS_STATUS_PLC", legacy: "outPLC_LV_Healthy", renamed: "outPLC_LV_Faulty", direction: "output" }),
  Object.freeze({ role: "HV_PS_STATUS_PLC", legacy: "outPLC_HV_Healthy", renamed: "outPLC_HV_Faulty", direction: "output" })
]);
export const RENAME_DECISION = "D-ARCH-POL-RENAME (SCENARIO_DECISIONS.md); polarity D-ARCH-POL: raw FALSE = healthy, raw TRUE = fault";

export class SignalNameError extends Error {
  constructor(message) { super(message); this.name = "SignalNameError"; this.code = "SIGNAL_NAME_UNRESOLVED"; }
}

const byLegacy = new Map(SIGNAL_RENAMES.map(r => [r.legacy, r]));
const byRenamed = new Map(SIGNAL_RENAMES.map(r => [r.renamed, r]));
const cache = new WeakMap();

/** Resolution of all four roles against the declared SAL variables of `model`. */
export function resolveSignalNames(model) {
  if (!model || !Array.isArray(model.variables)) throw new SignalNameError("Signal name resolution requires a parsed SAL model with variables");
  if (cache.has(model)) return cache.get(model);
  const declared = new Set(model.variables.map(v => v.name));
  const rows = SIGNAL_RENAMES.map(r => {
    const legacy = declared.has(r.legacy), renamed = declared.has(r.renamed);
    return { ...r, legacyDeclared: legacy, renamedDeclared: renamed,
      generation: legacy && renamed ? "BOTH" : legacy ? "legacy" : renamed ? "renamed" : "NONE",
      actual: legacy && !renamed ? r.legacy : renamed && !legacy ? r.renamed : null };
  });
  const both = rows.filter(r => r.generation === "BOTH");
  const generations = [...new Set(rows.filter(r => r.actual).map(r => r.generation))];
  const result = Object.freeze({ rows, generations, decision: RENAME_DECISION,
    error: both.length ? `Both legacy and renamed SAL variables declared: ${both.map(r => `${r.legacy}/${r.renamed}`).join(", ")}` :
      generations.length > 1 ? `Mixed rename generations in one SAL: ${rows.filter(r => r.actual).map(r => r.actual).join(", ")}` : null });
  cache.set(model, result);
  return result;
}

/**
 * Actual SAL name for a signal given by role, legacy name or renamed name.
 * Throws SignalNameError when the model declares neither or both, or mixes generations.
 */
export function signalName(model, key) {
  const row = SIGNAL_RENAMES.find(r => r.role === key) ?? byLegacy.get(key) ?? byRenamed.get(key);
  if (!row) throw new SignalNameError(`Unknown renamed signal key ${key}`);
  const res = resolveSignalNames(model);
  if (res.error) throw new SignalNameError(res.error);
  const r = res.rows.find(x => x.role === row.role);
  if (!r.actual) throw new SignalNameError(`Neither ${row.legacy} nor ${row.renamed} is declared in the SAL under test (${RENAME_DECISION})`);
  return r.actual;
}

/**
 * Translate an input/expectation object whose keys may use either name of a renamed
 * signal into the actual names of `model`. Values are copied unchanged (raw, no polarity
 * conversion). Keys that are not renamed signals pass through untouched.
 */
export function withActualNames(model, values) {
  const out = {};
  for (const [key, value] of Object.entries(values)) {
    const actual = byLegacy.has(key) || byRenamed.has(key) ? signalName(model, key) : key;
    if (Object.hasOwn(out, actual)) throw new SignalNameError(`Signal ${actual} given twice (${key})`);
    out[actual] = value;
  }
  return out;
}
