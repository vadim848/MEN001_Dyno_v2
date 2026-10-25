# Official LV lifecycle test proposal

PLAN/PROPOSAL READY for review; not yet canonical or accepted execution.
Revision2 addresses LV_OFFICIAL_TEST_PROPOSAL_REVIEW CHANGES REQUIRED.
Only this new directory is writable by tester_decisions. Frozen RED and
lv-candidate-001 cfd851 package remain immutable. Intended targets after approval:
test/current-rnd-down-no-reenergy.test.js and test/helpers/rnd-down-source.js.

Replace obsolete owner-specific four tests with two actual healthy LV feedback
histories and two preserved ordinary Step2 controls. Both healthy histories
execute actual Safe→Rnd→accepteddown→LV commandOFF→actual Safe→neutral/full fresh
BOTH→actual Rnd. FeedbackON rejection and actual commandOFF before Safe are
explicit. NoStep2/no LVHV proposals/Set/OFF→ON replay spans actual accepted SG
through Safe/SGclear/reentry preparation, ending before new accepted gesture.
The retired owner is absent, never supplied FALSE. Exact prior RED remains in
the frozen baseline, not erased to gain acceptance.

Helper fresh-parses canonical SAL+SGVL with no source override/environment
substitution, full typed binding audit before dependency closure. Only declared
initial Safe/ordinary Step2 plus seven inactive N4 boundary values are seeded;
after protocol start raw inputs only. All demanded producers execute in native
order, native RS consumedSet/Reset values are observed passively, demanded
fallback must be empty. Optional ENV controls evidence output only.

Before any TODO selection, assert actual native consumedSetTRUE/ResetFALSE
publishes its RS output at that evaluation, and actual ResetTRUE wins. Observe
Safe, energy and startup/Rnd phase RS consumers; an actual response violation
is FAIL, never downgraded to TODO. Do not equate And15 eligibility with Safe:
actual Safe Reset still has its native dominance. NOT VERIFIED diagnostics
retain the last eligible Set/Reset/output and actual completion consumer.
No-OFF→ON compares the first accepted-SG frame with its immediate prior
continuous sample, and every subsequent frame. Native LV/HV consumed Set is
asserted FALSE throughout the no-replay interval, not merely passively logged.

Finite observation exhaustion for eventual Safe or reentry marks test TODO
NOT VERIFIED, preserving an acceptance gap; it does not assert an invented
physical deadline. Preparation failures are explicitly fixture ERROR. Failures
of forbidden replay/earlySafe/timing guards remain actual assertion failures.
No full BOOT/group/native/hardware or Run/StartingRun/HV contract claim.

Migration agent performs isolated exact254 candidate composition and full
canonical regression after review. This author does not modify working tests,
runtime, source, or duplicate structural migration. Functional proposal run is
NOT RUN before root's review gate/exact-source handoff.
