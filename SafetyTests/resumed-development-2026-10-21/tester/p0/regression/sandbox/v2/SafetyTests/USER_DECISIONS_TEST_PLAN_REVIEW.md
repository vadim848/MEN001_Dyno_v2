# Independent review: user-decision baseline test plan

2026-10-20. **READY for independent baseline diagnostic execution of L/R/T** in `user-decisions-tests/`. An implementation architecture is not required to observe the current source against the three approved decisions. This verdict does not approve a SAL design or claim complete software acceptance.

Reviewed current AGENTS/WORKFLOW, USER_DECISIONS_2026_10_20_HANDOFF.md, the latest SCENARIO_DECISIONS entries, user-decisions-tests/PLAN.md, inspect-source.mjs, source-inventory.json and direct reference-operations.json. Latest direct user answers define the oracle: LV feedback FALSE after required LV command-off completes RnD→Safe; valid Run BOTH is ignored; a fresh qualified green in unconfirmed StartingRun initiates the existing Run→RnD stopping sequence. Unanswered HV completion and other scenarios remain independent gaps.

Current baseline pair was independently parsed in this review cycle with full binding audit PASS: SAL `72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e`, SGVL `de0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56`. Earlier direct readonly reference inspection verified the original Step2 startup and effective main EStop pairs; the supplied reference operations preserve the separate original startup/Run-removal technical ledger. The static 127-block inventory is preparation, not a substitute for demanded runtime closure.

## Accepted criteria

- **L:** reach actual RnD from an explicitly declared Safe component boundary, then actual fresh green and LV commandOFF. FeedbackON prevents completion; feedbackFALSE is sufficient under the other stated prerequisites. Test both feedback histories, preserve no-autoenergization, and observe actual Safe plus a new valid reentry. Ordinary Step2 startup controls distinguish an intentional shutdown change from regression of original startup. Do not seed the final Safe phase.
- **R:** conditional established Run may be used when explicitly labeled component coverage. Valid BOTH, both button orders and the inclusive250 boundary must cause no gesture-derived operation. Consuming/rearming the attempt remains governed by already approved common gesture rules. Existing short-chord→single failures must remain FAIL. Fresh green after complete neutral provides an availability positive.
- **T:** construct actual accepted RnD launch and early torque permission; keep Run unconfirmed using declared input histories. A new green after full neutral must initiate the original normal-stop owners/writers, with the existing SS1/STO/coast/discharge ordering. A seeded Run or SU does not prove StartingRun abort. No immediate contactorOFF, immediate RnD, invented completion feedback or new timer is implied. Late launch confirmations must not reverse accepted stopping.

## Mandatory interpretation during execution

1. Rehash and whole-audit the canonical source pair on every run; record native IDs, effective EStop pairs, real Set/Reset and phase/output writer chronology, fixture cuts and runtime/parser/clock identities. Require zero unresolved demanded inputs; expose irrelevant channels separately rather than supplying convenient defaults.
2. A failed preparation, inability to maintain a real unconfirmed StartingRun context, or missing demanded closure is fixture ERROR/NOT VERIFIED, not a demonstrated SAL defect. Do not force owners after protocol start to obtain a desired case.
3. Finite observation-budget exhaustion alone cannot prove an unbounded eventual-Safe requirement false. Report NOT VERIFIED with the last real trace unless an identified source contradiction, forbidden transition/output or causally stable absent completion path justifies FAIL. Likewise use source-derived propagation observations at qualification; do not invent a scan allowance.
4. Normal-stop comparison is a source/causal comparison with a valid healthy control, not permission to turn all current baseline behavior into normative oracle. Preserve approved early-STO and safety-priority requirements, and report any conflict to root/analyst. Complete HV shutdown endpoint stays NOT VERIFIED where its separate contract is open.
5. Emergency coincidence must use the actual protection consumers and separately report covered faults; one successful coincidence does not close the whole emergency matrix. L/R/T totals do not close all mandatory requirements.

The test-plan wording requesting architecture review first is waived only for this approved baseline diagnostic work: current-source observations and requirement-derived rejection controls can proceed now. Exact implementation design/source-edit approval remains a later independent gate. The forthcoming architecture must be checked against these results and preserved reference operations before editor handoff.

Only this review file was written. No baseline behavioral tests or source changes were performed by this reviewer.
