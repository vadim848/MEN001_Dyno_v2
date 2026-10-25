# Iteration 03B — integrated physical R&D recognizer

2026-10-19. Software implementation prepared for independent review. No commit/push/deployment by the editor. Final generated result references are recorded below after the final run.

## Source and precise scope

Accepted pre03B checkpoint: c69bc32. Input SAL SHA256 bf110ab452a5d9d3fcafd1acc5ab657b993e3e2828f384a63c1491c57b2cdcc6; SGVL508610b92e60ae602a75952113b34f7a8bd9c3f283fbb93dfa45b6a532f0a3ba.

Final SAL SHA256 a45f129ebdc8e60602465381fd7a0579c8c9c18a84c9ae9a6abdb45cb462e51a; SGVL06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5.

Implemented reviewed253-block graph plus the architect's derived R1 package03B_COMPACT_RELEASE_FIX_PLAN.json (SHA256 a69d75e5676bbefcae3e53a5ef47a19f34e736a94fe775d1196f9ef5d465c01d). Existing209 blocks become253:47 graph blocks, three moved original TON, net44 additions. Existing block relative order follows the exact approved sequence; final Unlock gate209→253. Existing TON block/port/parameter GUIDs and values500/500/1000 survive the move; release2000 and isolated internal ESTOP250 implement the approved software timings. Current TON count21. No original timer value, main EStop configuration, physical alias/channel descriptor, hardware/group parameter, or runtime clock was changed.

Only program usage indices are added to SGVL: ten ordinary software state variables, plus one genuine b_Step_RnD input usage. Original declarations/values/configuration and every other index are compared with checkpoint source. Recorded CRCs872783435/1640101759 remain stale; no regeneration or native Verify/Build is claimed.

## Program changes and structural proof

New RndPhysicalCompact graph owns physical gesture recognition. Actual SG/SU/BA feed old Network12 OR2/OR1/And2 inputs respectively; existing shared HV fanout, completion chain, PLC branch inputs and outputs remain. Three old TON incoming physical connections are replaced by actual graph enables; old physical TON alias usages are removed, remaining outgoing references are remapped to the moved native ports. Canonical wires are serialized once per edge. All new inputs use complete native alias usage chains or real SGVL GUID references with relationship wrappers and matching usage indices.

Whole-source B1 audit runs before every functional cut. New structural tests compare all47 actual graph blocks against reviewed native IDs, typed sources, explicit contact polarity, parameters, complete sequence, canonical edges, moved identities, exact software variable indices and original timer preservation. Existing01/02/B1/04/05/06/07 tests retain their truth tables and source-binding constraints; metadata comparisons allow only approved relocation/order/fanout/global changes. Existing three Door solenoid consumers are preserved apart from execution order; energy And16 keeps both NC inputs. Mentee Set guards and final five-input emergency Unlock guard remain.

WINDOW provisionally uses the existing serialized ESTOP enum spelling suggested by the architect (native pair-resolution semantics are still under review): EStopIn1 Single-Channel Both Activated with direct contacts/discrepancy0; remaining safety channels Both Deactivated; EDM ports plain/unbound as in the original native pattern. Generic AND Activated/Deactivated shorthand in design JSON is not copied into native ESTOP enum fields. It has no main Restart/ErrAck or machine output binding.

Initial serialization audit caught incomplete alias wrappers and two obsolete physical TON alias drivers; these were corrected before execution. The final audit has zero errors. The one-shot serializer refuses source outside the exact pre03B SHA, rather than overwriting a later implementation.

## First iteration and R1 repair

The unchanged accepted61-case red package first produced59PASS/2FAIL on the integrated graph. All33 old failures were fixed; two old positive fresh-single controls exposed preparation occurring after release2000: FullReset cleared P/A at2000, Restart rose2001, Ready/A became available2002. The editor returned the issue to the architect instead of adding timing allowance.

Approved R1 changes only four logical connections/activation: P.Set=ReleaseEnable, P.Reset=!ReleaseEnable, A.Reset=!E, and an activated existing GATE016 input4=ReleaseDone. Orders, block count and all timer values stay unchanged. Helper preparation now occurs inside the neutral interval. Added actual counterexamples cover accepted blue→full2000→first2001→fresh chord249/250/251 in both orders, plus early1999 singles. Original61 plus these8 controls pass69/69. Evidence records release1999/2000/first2001 and native helper/state observations. Original red baseline03B_RED_BASELINE.json remains historical and unchanged.

## Actual-source scope and timing migration

Shared src/physical-rnd-source.js constructs a demanded dependency closure from typed actual request/output writers, after full SAL/SGVL audit:145 blocks at each fixed1/2/5/10ms grid,26 explicitly valued external inputs, no unresolved demanded inputs. It uses real main Restart and real LV setup, with explicit typed Network3 phase ownership boundaries. This proves the physical branch and real LV/HV/Unlock consumers in that phase, not complete R&D reachability or full-cycle ownership. Candidate/current Network12-only selections now include the actual new producers/dependencies. No missing-producer TRUE fallback or missing-module NOT VERIFIED substitutes for execution.

Every sample from entry/first edge through recovery is observed. Traces retain actual raw inputs, request/output transitions and native FinishUp/Green/Blue signals. Counts distinguish native FinishUp qualification/Set events from retained b_Set_Transition_3 levels; neither is called a full accepted launch. The observer timestamp origin follows the existing observed-fixed-scan-v1 contract, including direct r.scan callers; the runtime itself is unchanged.

| Program observation, ms from observed edge | Old source | Integrated source |
|---|---:|---:|
| Green/Blue TON minimum |500|500|
| Green Down request |501|500|
| Blue request |501|500|
| Visible blue Unlock, healthy grant |502|501|
| Both Up, from second observed button |1000|1000|
| Physical HV request/actual HV |1001/1002|1001/1002|

No command before499/full BOTH999 remains required. FALSE at500 was never a normative requirement; old501/502 consumer lag is source ordering. Single TON qualification is observed over the whole interval before its consumed reset, rather than falsely requiring its current level to remain TRUE at late510. Green-at500 output overlap pulse is not invented.

R2 review corrected report labels to the actual native FinishUp path. It also exposed an old REARM positive that merely read retained Up TRUE while SU still owned RnD: full neutral alone does not end busy ownership. The test now observes no new FinishUp throughout that interval and checks retained Up separately; an explicit injected owner exit/reentry followed by complete release supplies the fresh positive. This is a corrected ownership oracle, not a graph change or a claim of reachable full-cycle completion. Fresh qualification remains1000 and all prohibited-interval observations remain scan-by-scan.

The first full run exposed two instrumentation/migration errors: a historical metatest could not locate a renamed /TonOut observation, and the shared trace recorder was one sample ahead of the existing t0 convention. Real mapped observation paths and the original recorder origin were restored. A later intermediate run caught the R2 busy-owner positive. None of these failures was hidden or fixed by weakening SAL requirements.

## Limits retained

safeEstop.Error is always FALSE in the current adapter. Recorded helper Error observations are explicitly labeled stub observations; they do not prove native helper/group no-fault behavior. Structural enum/port evidence is separate. Five NOT VERIFIED cases remain for cross-mode recognizer ownership, full-phase Door/NC coverage, emergency combinations, group/fault observation and accepted-transition rollback. The scoped Network3 conflicting-set-request FAIL remains visible. Full startup/Network4/group lifecycle, full reachability, PLC handshake policy, earliest STO timing and full emergency destination are not closed by this package. Native/hardware validation remains outside scope, not a hidden software gate.

No pending PLC pulse/early-STO work is implemented. Reference and historical fixtures/snapshots are unchanged. Rules/spec/status are owned by the coordinator, not edited here.

## Final checks and handoff — NOT ACCEPTED, native enum semantic HOLD

Final full check:software: harness178/178 PASS, historical75/75 PASS, current186/186 PASS. Both new current-rnd test files are explicitly present in stages.current.files; no accidental historical classification. Software cases: **201PASS / 1FAIL / 5NOT VERIFIED / 0ERROR**, versus checkpoint172/29/5/0. Exactly28 same-ID FAIL→PASS changes are listed in03B_INTEGRATED_ACCEPTANCE.json; no PASS→FAIL. Three timer rows move from Network12 to their retained native graph TON identities; one new RELEASE timer row adds PASS. The original61 actual-source cases all pass, including all28 old positives and33old failures;8additional R1 controls also pass.

Standalone candidate: **47PASS / 0FAIL / 5NOT VERIFIED**; regenerated CANDIDATE_ACCEPTANCE.json has matching SAL/SGVL hashes. Model mutation regression5/5 detected (model/harness evidence, not native graph acceptance). Nativegraph structural5/5, pre-existing scoped regressions111/111. Diff whitespace check clean after removing only the14 whitespace-only lines introduced by deleted relationships.

Residual FAIL: STATE:conflicting-set-requests observes simultaneous Safe/Run from directly injected conflicting internal Network3 requests. It already failed before03B, remains visible and is outside this physical recognizer correction. All five existing NOT VERIFIED IDs remain: ACC-B01, ACC-C02-F, ACC-C01-E, LATE:NO-FAULT, LATE:NO-ROLLBACK. No assertion of complete41-requirement acceptance is made. Nonzero package exit is expected for that residual FAIL/NV.

Evidence: SOFTWARE_CHECK_RESULTS.json/.md, CANDIDATE_ACCEPTANCE.json, and03B_INTEGRATED_ACCEPTANCE.json. The latter records final source/helper/test/plan SHAs, all69 actual traces, selected145-block scopes and111typedboundaryrecords per grid, original61 pre/post results and every case status change. Runtime SHA remains00995464bde46a5b87298fd30fd9008c63cfefa2b58be1356fe647dcfd4c489c.

Editor writes STOP for independent whole03B review. No commit/push.

Independent review HOLD after final runs: SDK ActivatedBoth (Single-Channel Both Activated) versus Activated1/Activated2 pair resolution is not yet proven for the internal WINDOW. The single-input host adapter can conceal a native pair mismatch. Counts above remain valid adapter/structure observations and do not close this question. Architect investigates the SDK; no speculative SAL patch or acceptance claim is made. Source remains a45f129e…/06010caf…. Editor STOP.
