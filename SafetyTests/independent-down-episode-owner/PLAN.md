# Independent incremental test plan: down-episode owner

2026-10-20. Preparation only; frozen candidate identity required before execution.
All writes belong to this directory. The accepted RED checkpoint103a2bd and
independent-safe-resumption package remain immutable.

Sources: user rules, SPEC11 as traced in SCENARIO_DECISIONS, reviewed
downEpisodeOwnerCandidate manifest, and current resumption architecture. Reference
commit4495a1f remains confirmed identity; no new physical or PLC policy is inferred.

1. Repeat the same conditional initialSafe→valid BOTH→actualStep12→LV output→given
   LV feedback→actualRnD→full neutral→green500→SG/LVoff→givenLVfeedbackOFF→actual
   Step2/RnDexit protocol on immutable production baseline, priorSafe255 and new
   candidate. Observe raw proposal, permitted Set, RS outputs separately. After
   accepted shutdown, no renewed permittedSet/RS output is allowed. Previous two
   sources must retain RED and candidate must remove this counterexample.
2. Observe new owner execution after actual Step2 RS and before N5And1, including
   the very first Step2 scan. Owner remains TRUE while Step2 remains TRUE even
   when SG/downrequest clears and buttons release. No phase/owner injection after
   the declared initial state. Seven actual Network4 IDs remain an explicit
   inactive conditional boundary, not a BOOT/group claim.
3. Positive initialStep2 component: generic LV-discharge latch TRUE, RnD-down
   request absent, owner initially zero. The existing ordinary N5 power-on path
   must remain available; compare old and new source rather than treating generic
   discharge as RnD origin. Declared initial latches/phase are component
   preconditions, not reachable BOOT evidence. No owner or phase edits thereafter.
4. Actual Step2 exit must clear owner before N5 can act on any future episode.
   Obtain a source-backed input protocol from architecture; do not fabricate PLC
   endpoints, discharge completion or phase injection to force this positive.
5. SG optimization boundary: separately evaluate actual simultaneous Safe/RnD
   producer availability using declared state-conflict component boundaries.
   Old !Safe Set and new !RND_SCOPE Reset differ there. Record their conditions
   and emergency suppression; never assume global onehot. An unexplained changed
   conflict reaction returns HOLD rather than a made-up normative oracle.
6. Fresh Safe blue/chord availability and Safe green/full-neutral/blue remain
   positive controls. Reuse unchanged RnD69/earlySTO88 software assertions against
   isolated source copies, with only genuinely retired Green/Blue observation
   bindings documented. FinishUp is retained and must not be remapped. Existing
   two Run RED and healthy shutdown-to-Safe coverage gaps remain visible.

Evidence records frozen SAL/SGVL, exact fixture code SHA, actual dependency
closure, every scan and ordered owner execution, asserted inputs and source IDs.
No changes to runtime, source, existing assertions or old evidence are allowed.
Infrastructure/observation gaps differ from behavioral FAIL. Reviewer independently
evaluates oracle, implementation and test sufficiency. Native/hardware validation
and unknown complete endpoints are outside these tests.
