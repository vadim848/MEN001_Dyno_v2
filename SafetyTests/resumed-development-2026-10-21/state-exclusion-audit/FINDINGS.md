# Safe/Armed: source audit and next independent gate

2026-10-21. Coordinator exploratory audit; no implementation or independent
acceptance. Emergency versus TransitionFault is deliberately undecided.
The full workflow remains requested. Specialist service usage limit stopped
analyst/architect/tester/reviewer continuation; no candidate promotion occurred.

## Established source facts

Reference was read first, then current whole SAL/SGVL preflight and typed
binding audit passed. Exact identities and full Network3 graph are retained in
SOURCE_TRACE.json. Canonical SAL59bf4ec1…/SGVLc31e1290… remain unchanged.

Safe in the failing check means `b_Step1`, actually written by native
Network3/FBRs1.RsOut (order20). Armed/Run means `b_Step3`, actually written
by Network3/FBRs3.RsOut (order48). They are state memories, not feedback
measurements. `out_Step1` and `out_Step3` are published by FBDecouple2
channels1/3 (order102); `out_Safety_Armed` is published by FBDecouple1
channel1 (order52), sourced from Run. The adapter tests both state memories;
it does not synthesize Safe as absence of Armed.

All Set sources and their direct producers are listed with full port paths,
IDs, polarities and execution order in SOURCE_TRACE.json. Safe Set OR2
accepts b_Step1_Set, startup fallback And1, b_Step1_Set_2/3 and
b_Step2_Set_2. Run Set OR6 accepts b_Step3_Set_3 and b_Step3_Set_2.
The startup fallback checks absence of other phase memories. Other Safe Set
routes do not share that same gate. Network4 supplies b_Step1_Set from
DecOut6/unsourced DecIn6; its native/default value is unestablished.
Run's _2 producer is Network12/FBDecouple2.DecOut3, fed by FBAnd6;
_3 is Network5/FBAnd5. These are actual program writers, not PLC state flags.

Safe Reset OR1 includes b_Step1_Reset, Step2 Set OR4, Step12 and RnD.
Run Reset OR5 includes b_Step3_Reset, Step4 and b_Step12_Set_2.
There is no unconditional direct Safe/Run cross-reset or shared exclusive
state storage at this latch boundary. Reset-dominant RS behavior alone
does not establish mutual exclusion between two different RS instances.
Upstream conditions and the history of intermediate states therefore matter.
This is a statement about the graph, not proof of a reachable violation.

## What STATE FAIL actually proves

`SafetyTests/src/current-code-checks.js` constructs only Network3, cuts all
upstream producers, forces in_Safety_Run=FALSE/EStopOK=FALSE/FalseInput=FALSE,
and injects b_Step1_Set=TRUE plus b_Step3_Set_2=TRUE. `audit.mjs` repeats that
exact class of conditional conflict: both state memories and both published
Safe/Armed outputs stay TRUE over five scans, with either fallback assumption.
The real Set producers have been removed from this test. Thus this FAIL is
evidence of response to contradictory internal requests, NOT a legal-input
reachability trace. It must not be reported as a proven operational defect.

## Additional conditional paths actually executed

COMPONENT_PATHS.json records three fresh paths on canonical code:
normal Safe→RnD→Run→down; EStop during launch and restoration; Healthy loss
at Run. There were respectively15014/12409/16513 observed scan frames.
No simultaneous Safe+Run was observed in those frames or the recorded
FBRs1/FBRs3 publications. Initial Safe is explicitly seeded once; seven
Network4 writers are held inactive, as disclosed by the existing fixture.
After protocol start the fixture accepts only declared raw inputs and real
phase producers execute. This is stronger than conflicting-Set injection
but is still neither full startup reachability nor an exhaustive proof.
No conclusion is drawn about all exported-output timing, all resets or all
simultaneous event combinations from these three traces.

COMPETING_PATHS.json additionally explores accepted physical down followed by
PLC11 while green remains pressed, then feedback changes after0/20/600ms.
All three runs use actual phase producers after the same declared initialSafe
boundary. No Safe+Run overlap was observed. Opposing up/down requests are
recorded separately and do not by themselves prove conflicting state memories.
The latest requirement says PLC must reject requests while a button is held;
that known current defect remains independent of the mutual-exclusion claim.

## Required remaining work and proposed verification plan

1. Requirements analyst separates forbidden stable overlap, allowed phase
   gaps and within-scan publication observations; preserve existing user
   invariants without choosing a corrupted-state recovery destination.
2. Architect traces complete producer cones for every Safe/Run Set/Reset,
   including Network4 and original Step2. Establish admissible initialization
   and group boundaries explicitly; unknown unbound values cannot be FALSE
   by convention. Do not treat all independent Set inputs as legal inputs.
3. Independent tester explores actual producer histories from admissible
   startup: every normal up/down edge, reset/restart, early/late feedback,
   EStop/NC/connector loss and restoration, PLC/button concurrency, matching
   scan events. Observe each actual state publication, consumer read and
   exported state/output grant, separately from end-of-scan values.
4. Attempt an induction over the actual ordered transition graph: one valid
   owner initially; accepted events clear the previous owner before any
   conflicting new owner/permission is consumed; stale Set cannot reassert
   during return/reset. Explicitly include previous-scan values and startup.
   A native-compatible gate/owner solution is required only if a reachable
   counterexample or missing invariant proof is established; no enum mandate.
5. Retain conditional bad-request tests as robustness evidence with their
   scope, and add forbidden-transition/positive controls. If a legal-input
   counterexample is found, freeze exact raw-input protocol and hashes,
   obtain reviewed repair plan and rerun independent tests/review before
   any source adoption. New recovery behavior remains a separate decision.

## Subsequent actual-producer candidate on accepted P0

After architect source-cone analysis, `bypass-family.mjs` executed a paired
history on canonical SAL34b5b850…/SGVL517fdadd…. Both runs begin at declared
Safe with the existing seven inactiveN4 boundaries and execute actual phase
writers after entry. Neither injects internal Set/owner/timer values after
entry; zero unresolved demanded inputs were reported.

At5329ms green starts, qualifies500ms and commands down. At5832ms PLC11 is
asserted while green stays pressed, with C2feedbackON and rawHVHealthyTRUE
(Runconfirmation blocked). At5836ms the variant asserts existing Bypass;
the control leaves itFALSE. After10500ms, at16337ms rawHVHealthy and
LVHealthy becomeFALSE; actual Runconfirmation is observed. At16338ms both
LV/C2feedback becomeFALSE. In the BypassTRUE run, both Safe and Run are
observed TRUE at the end of this scan; the FALSE control has no overlap.
The actual existing bypass timer is10s; no timer is injected or changed.
Complete input protocol, phase transitions, exact source identities and
scope are frozen in BYPASS_FAMILY.json. Raw inputs are held stable per scan.

This is a **coordinator-discovered bounded actual-producer counterexample**,
awaiting independent reproduction and ordered output/consumer tracing.
It establishes more than the old contradictorySet injection, but its initial
Safe and N4 boundary still do not prove native full-start reachability.
The PLC request while green is held is a valid external stimulus that must
be rejected under the latest requirement; current acceptance is part of the
candidate defect, not a reason to exclude the stimulus from the audit.

**Current verdict:** the existing STATE FAIL alone does not establish
legal-input reachability. A bounded actual-producer overlap candidate has
now been observed as described above; independent verification remains open.
No state architecture, recovery reaction,
hardware/group configuration or canonical source was changed by this audit.

Reproduce from the repository root with `node SafetyTests/resumed-development-2026-10-21/state-exclusion-audit/audit.mjs`
and `node SafetyTests/resumed-development-2026-10-21/state-exclusion-audit/component-paths.mjs`.
Runtime SHA256:14d50f182e42c7aea814eb0c221fbeadbc9becf20f7ac575d263b8cb4f14698e.
Fixture SHA256:31716e948f78df2e5035189c0907bb20f871ffe2cabce10c8d9d3b499726ce12.
The scripts write only their own JSON evidence; they do not modify SAL,
SGVL, shared tests, runtime or requirement oracles.

Subsequent handoff: controlled resource-only P0 adoption changed canonical
to SAL34b5b850…/SGVL517fdadd…. The recorded exploratory traces above remain
evidence for their explicit old59bf source hashes and are not relabelled as
new canonical runs. Running these scripts again reads the then-current source;
check the recorded identities. The independent next audit must identify its
exact source and preserve these historical results.
