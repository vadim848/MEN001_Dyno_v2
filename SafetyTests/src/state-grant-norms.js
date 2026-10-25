// STATE case norms per declared source lineage (stand E2-stand-g3, 2026-10-23).
//
// The STATE cases check Network3 state ownership: after each internal grant exactly the target phase is
// active (the previous one is reset), and conflicting Safe/Run requests do not latch both. The norm is
// unchanged; what differs between lineages is WHICH grant realises a transition (PLAN mechanism.grants):
//  - F1   : the original injection points (kept byte-for-byte: rows on F1 are identical to before);
//  - R1   : Network4/Network5 removed (Q-ARCH-06 A) -> b_Step1_Set, b_Step3_Set_3, b_Step1_Set_2 no longer
//           exist; none->S1 is g1 (Network3/FBAnd1, present since F1), Run entry g4 (b_Step3_Set_2),
//           Safe request g5 (b_Step2_Set_2); b_Step12_Set_2 still sets Step12 (F1 FBOr16); no S6->S1 grant;
//  - E2a  : PLAN v7.7 mechanism.grants g1..g9 (g6 b_Step12_Set_2: S3->SR), no g10 (E2b);
//  - E2b  : + g10 Network3/G10_EXIT (S6->S1) and FBAndBootFbkOff in g1 (slices[E2b].newBlocks).
// The lineage is the declared identity of the source (src/declared-sources.js), never inferred from the
// wiring under test: a mutant that rewires a grant is judged against its base norm.
//
// A step is { label, inject, target } or { label, target, notApplicable } (grant absent in this lineage by
// plan). Internal ANDs (g1, g10) are exercised by driving exactly their permission inputs for one pulse;
// `context` holds every other Network3 input read from outside at its idle/permissive value; `idle`
// lists the other grant Symbols, held FALSE ("no request"). Any other outside input is an ERROR.
const F1_STEPS = {
  "Safe-RnD-Run": [["b_Step1_Set", "b_Step1"], ["b_Step12_Set", "b_Step12"], ["b_Step_RnD_Set", "b_Step_RnD"], ["b_Step3_Set_2", "b_Step3"]],
  "Run-RnD": [["b_Step3_Set_2", "b_Step3"], ["b_Step12_Set_2", "b_Step12"], ["b_Step_RnD_Set", "b_Step_RnD"]],
  "RnD-Safe": [["b_Step_RnD_Set", "b_Step_RnD"], ["b_Step2_Set_2", "b_Step1"]],
  "Emergency-removal": [["b_Step3_Set_3", "b_Step3"], ["b_Step4_Set", "b_Step4"], ["b_Step5_Set", "b_Step5"], ["b_Step6_Set", "b_Step6"], ["b_Step1_Set_2", "b_Step1"]]
};

const sym = (name, target) => ({ label: name, inject: { [name]: true }, target });
const G = {
  g1: { label: "g1 Network3/FBAnd1 none->S1 (permission pulse in_Safety_Run, b_EStop_Ok)", inject: { in_Safety_Run: true, b_EStop_Ok: true }, target: "Step1" },
  g2: sym("b_Step12_Set", "Step12"), g3: sym("b_Step_RnD_Set", "Step_RnD"), g4: sym("b_Step3_Set_2", "Step3"),
  g5: sym("b_Step2_Set_2", "Step1"), g6E2: sym("b_Step12_Set_2", "Step_RnD"), g6R1: sym("b_Step12_Set_2", "Step12"),
  g7: sym("b_Step4_Set", "Step4"), g8: sym("b_Step5_Set", "Step5"), g9: sym("b_Step6_Set", "Step6"),
  g10: { label: "g10 Network3/G10_EXIT S6->S1 (permission pulse b_EStop_Ok)", inject: { b_EStop_Ok: true }, target: "Step1" }
};
const noExit = lineage => ({ label: "S6->S1 exit grant", target: "Step1",
  notApplicable: `no declared S6->S1 grant in lineage ${lineage}: F1 b_Step1_Set_2 was removed with Network5 (Q-ARCH-06 A, slices[R1]); g10 Network3/G10_EXIT is introduced by slices[E2b].newBlocks` });
const GRANT_SYMBOLS = ["b_Step12_Set", "b_Step_RnD_Set", "b_Step3_Set_2", "b_Step2_Set_2", "b_Step12_Set_2", "b_Step4_Set", "b_Step5_Set", "b_Step6_Set"];
const BASE_CONTEXT = { in_Safety_Run: false, b_EStop_Ok: false, in_False_SI2_CH8: false };

function e2Norm(lineage, { g6, exit, context }) {
  return {
    lineage, context, idle: GRANT_SYMBOLS,
    journeys: {
      "Safe-RnD-Run": [G.g1, G.g2, G.g3, G.g4],
      "Run-RnD": [G.g4, g6, G.g3],
      "RnD-Safe": [G.g3, G.g5],
      "Emergency-removal": [G.g4, G.g7, G.g8, G.g9, exit]
    },
    // Plan arbitration "g4 vs g5 by C2_FBK level" is upstream; at the Network3 latch boundary the case
    // keeps the F1 premise: a Safe request and a Run request at once must not latch both.
    conflicting: { label: "g5 b_Step2_Set_2 + g4 b_Step3_Set_2 at once", inject: { b_Step2_Set_2: true, b_Step3_Set_2: true } }
  };
}

export const STATE_NORMS = Object.freeze({
  F1: { lineage: "F1", legacy: true, steps: F1_STEPS, conflicting: ["b_Step1_Set", "b_Step3_Set_2"] },
  R1: e2Norm("R1", { g6: G.g6R1, exit: noExit("R1"), context: BASE_CONTEXT }),
  E2a: e2Norm("E2a", { g6: G.g6E2, exit: noExit("E2a"), context: BASE_CONTEXT }),
  // G10_EXIT/FBAndBootFbkOff permissions other than the pulsed one: no Restart held, recognizer idle,
  // no feedback, no contactor command (slices[E2b].newBlocks).
  E2b: e2Norm("E2b", { g6: G.g6E2, exit: G.g10, context: { ...BASE_CONTEXT, in_Reset_PB: false, recRndC_PrevG: true,
    in_LV_C1_FBK: false, in_HV_C2_FBK: false, out_LV_C1: false, out_HV_C2: false } })
});

export class GrantNotApplicable extends Error {
  constructor(lineage, steps) {
    super(`GRANT_NOT_APPLICABLE: ${steps.map(s => `${s.label} -> ${s.target}: ${s.notApplicable}`).join("; ")}. Executed steps are reported; the journey is not complete, so the case is not PASS.`);
    this.code = "GRANT_NOT_APPLICABLE";
    this.lineage = lineage;
    this.grants = steps.map(s => ({ label: s.label, target: s.target, reason: s.notApplicable }));
  }
}
