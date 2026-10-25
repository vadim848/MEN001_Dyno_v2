# Remaining mandatory scenario audit

## Status follow-up — 2026-10-20

A1/A2 independent execution review ACCEPT40PASS/0FAIL/0fixtureERROR:
NEXT_EMERGENCY_EXECUTION_REVIEW.md and next-emergency-tests REPORT/RESULTS/
VERIFIED_REPORT.json/PACKAGE_IDENTITY. Source remains72f42d…/de0fa… .
A1 supplies Safe/RnD NC2/Mentee heldblue firstfault and200ms restorewithoutRestart
evidence; A2 supplies real pendingSet/nativeRS controls for Safe-Step12LV,
RnD HV/STO1/STO2 and originalStep2 LV/HV. One/ten fault scans, healthycontrols,
actualproducer/SetReset/continuousconsumer provenance reviewed. This is bounded
component coverage with initialSafe/originalStep2 and7N4cuts; not wholeEMG,
all41,BOOT,fullrecovery or A3. Next independent A priority is A3 externalNC,
then connector/phase/Healthy coverage, retaining unanswered endpoint limits.

The B table below retains the original audit snapshot: **QR, stated QT and LV
completion are now ANSWERED**, superseded by D-RUN-BOTH-IGNORE,
D-STARTINGRUN-GREEN-DOWN,D-LV-OFF-COMPLETE in SCENARIO_DECISIONS and
USER_DECISIONS_2026_10_20_HANDOFF. Implementations/coverage still pending;
these are no longer user-decision blockers. Newdecision baseline reported
8PASS/12FAIL/2NV/0ERROR on unchangedsource; USER_DECISIONS_BASELINE_REVIEW
accepts this bounded RED evidence separately from A1/A2. Implementation remains
pending. QP/conflictdestination/HVcompletion and other undefined
transition contexts remain separate. Do not repeat answered questions.

2026-10-20. Analyst, read-only source/test inspection; no new test execution.
Working SAL SHA256 `72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e`;
SGVL `de0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56`.
SOFTWARE_ACCEPTANCE_SCOPE.md and SAFETY_EVIDENCE_MATRIX.md retain older
0fc397/RED snapshot counts; do not treat those counts as this source's result.
Coordinator reports current189/75/436-of438, cases200PASS/1FAIL/7NV; those
numbers were not rerun by this audit and do not close all41 requirements.

Sources read: current acceptance/evidence matrices, SCENARIO_DECISIONS.md,
EMERGENCY_REQUIREMENTS.md, historical EMERGENCY_PHASE_REPORT.md, SPEC§§3.1,
5/5.1,6–13, DOOR_INTERLOCK_REQUIREMENT.md, BOOT_SOFTWARE_MODEL_PLAN.md;
current unlock/early-STO tests and actual current source identity. Reference
Network2 readiness/start and original Step2 power-on route were read earlier
directly; REFERENCE_PHASE_MAPPING.md/DOOR trace bind the retained operations.
No cancelled reference command was repeated. Reference commit4495a1f is the
user-confirmed baseline; this audit does not claim a new checkout HEAD check.

Fresh current parser inspection: full bindingAudit PASS. Main EStop order23,
final Unlock writer255; ES_NC2 resolves to EStopIn2 (master pair1), Mentee to
EStopIn4 (master pair3), plus current explicit Mentee LV/HV/STO Set gates.
Both ExternalNC resolve separately into current permit, Safe guard, RnD
InterLock guard and recognizer E. Current N5/And1 order27 has inverted
RND_DOWN_STEP2_OWNER on input4, rather than the rejected blanket discharge
veto. These are direct current source observations, not new behavior tests.

## A. Known behavior: independent checks can proceed now

Priority next package: NC2/Mentee first-fault, no-reopen and new-energy inhibit,
then external interlocks/connectors and phase-entry coverage. These are new
scenario preparations, not claims that the existing tests omit every example.
Use whole-source identity/binding audit before cuts and effective master-pair
contact resolution, as accepted R3 requires. Native own-slave `Both Deactivated`
does not imply the effective second channel is inactive.

Common raw healthy background: ES_NC1/2 TRUE; External InterLockNC1/2 TRUE;
Mentee_EStop FALSE; PLCstop FALSE; connectors TRUE except the named event;
FalseInput FALSE. Door and feedback values are declared per actual producer
positive. PLC code is explicitly non-triggering for the tested branch. PLC00
is not automatically non-triggering for every branch: document actual disabled
consumer/condition and retain demanded writers. A fault-free paired run must
first prove the actual observed producer/output is available. Never infer an
output command from the absence of an upstream request alone.

| Next scenario | Initial state and raw sequence | Known oracle and source | Limit |
|---|---|---|---|
| A1 NC2/Mentee access fault | Independently Safe and stable RnD, actual fresh blue500 has produced Unlock; keep blue held. NC2→FALSE or Mentee→TRUE, each separately, one observed sample and held variant; restore without green/Restart | Sole Unlock FALSE from fault handling; remains FALSE after raw restoration without permitted reset. Actual main-EStop latch and current final writer observed. SPEC§5/12, EMG001/005/007, CVR001/002; current UNLOCK07 already supplies NC1/PLC controls | Do not claim external InterLock or connector loss must act through this same EStop latch. No arbitrary native latency allowance; derive order and expose first violating sample |
| A2 NC2/Mentee pending energy | Safe up/Step12 LV request; RnD accepted BOTH/StartingRun; original Step2 ordinary producer, each with explicit owner boundary or actual reachable predecessor. Establish pending real Set, apply fault before consumption; then restore raw input without Restart | No new permitted LV/HV Set or torque permission while fault active; raw restoration alone must not restart accepted energy. Observe both drive Set/Reset and physical output writers. SPEC§§6/7/12/13, EMG001/005/011; earlySTO preserves all-source per-drive guards | Retained contactors during controlled stopping are not a new Set violation; compare actual rises, not universal all-outputs-OFF assumption. Seeded owner tests are component coverage |
| A3 any ExternalNC channel | Safe, RnD, Step12, Step2 with entry reason, Run and stopping/discharge contexts; independently NC1 or NC2→FALSE, hold then restore with no new command | Any channel is Emergency, prohibits new advance; restoration does not cancel started emergency. SPEC§5.1, EMG002/005/011. Observe actual emergency producers and persistent sequence | Exact emergency final completion may remain unverified; do not replace with EStopOK-only assertion if source emergency has another owner |
| A4 connector Safe | Stable Safe, each/ both connectors absent, fresh valid blue: access positive under existing Door conditions; fresh valid BOTH rejected without fault. Restore connectors while buttons remain from rejected attempt; then full release/new valid BOTH positive | Absence alone no fault/access veto, no queued advance after restoration; new gesture required. SPEC§5.1/6, EMG003, CVR004 | Preserve original readiness And3 and continuous observer; no delayed request queue; current Safe package controls should be extended, not counted as full-ID closure |
| A5 connector after Safe | Step12/RnD/StartingRun/Run/stopping/discharge owner, independently remove either connector, restore without new command | Emergency event, no new upward energy, no cancellation through restoration. SPEC§5.1, EMG004/005/011 | Must prove Safe has actually been left for reachability claim; phase cuts remain declared component cases. Controlled SS1/discharge retention is permitted |
| A6 transitions and access exclusion | Accepted Safe up, RnD up, Run down, and RnD down; continuously blue held or attempted after fresh neutral, with both Door values | Unlock FALSE in Run/all transition phases, during HV or unfinished discharge; no simultaneous actual energy advance and Unlock. SPEC§5 items3/9/10, CVR001/005, EMG007 | StartingRun fresh-green command endpoint excluded (QT); held blue perturbation does not select it. Do not seed Unlock latch as sole positive evidence |
| A7 Healthy loss in SS1 | Real or declared stopping owner with source-mapped Healthy-good; change to Healthy-bad, restore before configured coast expires | Select STO/coast immediately at program handling, retain fault/coast selection despite Healthy restoration; no RnD/Unlock before required existing wait. SPEC§9, EMG008/009 | Determine raw contact polarity/current timer condition from SAL and preserved reference; use existing values, no new numerical physical wait. Discharge-after-coast policy/completion excluded where not specified |
| A8 accepted down no reenergization | Actual Safe→RnD; fresh green500; LV commandOFF, LVFBKOFF, actual Step2/RnDexit; buttonsOFF, no new request | No renewed permitted LV/HV Set/command; current down-owner mitigation must survive fault/restore and entry-source controls. SPEC§11, MOD005, STP005, no-reenergization RED contract | Do not assert completed Safe or Run. Preserve legitimate original Step2 start with its discharge memory and independent freshSafe BOTH positives |
| A9 new Up during transitions | Already accepted transition, full neutral then a new valid BOTH where endpoint is a known non-Run transition | No second upward acceptance or energy-step skip. SPEC§15/MOD004; BTN ownership rules | Do not include valid BOTH in stable Run (QR), or infer all down-command policies |
| A10 cover open duration | Stable Safe/RnD, Door state consistent with source reset, hold open and issue permitted neutral/irrelevant commands without energy-up acceptance | No invented cover-close timeout/fault/automatic close; existing solenoid role retained. SPEC§5/CVR003 | A long finite trace proves only the observed interval; source audit required for absence of a timeout. Do not demand UnlockTRUE against existing Door reset |

Recovery must be split: A1/A2 restoration WITHOUT reset has a known no-auto
oracle. A full manual recovery positive needs all energies-off feedback and
permitted manual procedure, only Safe (SPEC§12/EMG006). If conditional actual
fault-component exit/Restart/reentry is executable, retain it as bounded
component positive; do not declare full emergency/group startup or normal
LV-discharge completion from that trace. Main Restart is raw green, distinct
from accepted normal StepDown; test setup must not inadvertently reset a fault.

## B. Pending decisions block only dependent endpoints

Existing questions have already been escalated by the coordinator; do not
repeat them here or infer an answer from silence.

| Dependency | Blocked reaction | Known independent portion still testable |
|---|---|---|
| QR / Q-RUN-CHORD | New full valid BOTH in stable Run: ignore/consume versus initiate normal down | Short invalid chord cannot degrade to single; held-entry, green500, release/late/repeat rules. Current two Run FAIL stay explicit |
| QT / Q-TRANSITION-DOWN | Fresh green after full neutral in StartingRun/other upward transition: ignore versus abort-down and its destination | Accepted early-STO ordering, confirmation prerequisites, old owner lifetime; late second of SAME accepted attempt cannot cancel it |
| QP / Q-PLC-REQUEST | New standalone PLC event with physical buttonsOFF; handshake/acceptance and priority | Held level must not create repeated steps; EStop/interlocks always gate raises; preserve original source paths while acceptance policy remains unresolved |
| Q-FAULT-DESTINATION | Exact emergency versus TransitionFault and reset for invalid main-mode combinations | Forbidden ambiguous ownership and no energy increase are known; ordinary transient overlap is not automatically invalid combination |
| LV completion | Which existing program input/timer and conditions prove completed LV discharge before Safe | Safe endpoint/order, LV-off feedback prerequisite, no reenergization and down-owner lifetime already known |
| HV Q-COMPLETION | Exact completion mapping and C2/discharge rejection/recovery procedure | SPEC§10 timeout implies latched TransitionFault, UnlockFALSE, no automatic continuation; no entry RnD with C2FBKON; discharge must precede C2OFF. No invented feedback or timeout number |

Do not treat historical Q-REARM as permission to reopen agreed timings: release
2000ms is retained; changing it is not necessary. Decisions D-CHORD250,
D-Q500, D-LATE-SECOND and D-STO-LAUNCH are closed and apply in context.

## C. Adapter capabilities: documented program semantics, no hardware inquiry

Network4 has eight unbound Decouple inputs and seven used phase globals. Native
SDK evidence in BOOT_SOFTWARE_MODEL_PLAN only proves absent source address copy
for unbound inputs; it does not establish FALSE, group RUN, or a user-defined
start event. Obtain an authoritative SOFTWARE export/installed runtime semantics
or explicit software-contract evidence. Never interpret address zero as BOOL
FALSE by convenience. Unknown behavior is unsupported, not a functional FAIL
and not PASS. Full BOOT001/002 remains mandatory.

Seven inactive Network4 cuts used by prior lifecycle tests are a valid bounded
protocol only: DecOut1..7 -> Step3_Reset,Step4_Reset,Step5_Reset,Step6_Reset,
Step1_Reset,Step1_Set,Step2_Set, each FALSE. IDs and hashes are recorded in
SAFE_RUN_RESUMPTION_SCENARIO_REVIEW.md and independent raw artifacts. They do
not establish whole-source startup or error/reset memory. Group lifecycle/error
and memory persistence semantics need explicit software modeling/evidence;
NativeError FALSE stub is not proof of group fault behavior. No change to group
parameters/mappings, no native Build/Verify or hardware-origin investigation is
required or authorized by this audit.

Existing effective EStop pair resolver and observed-fixed-scan-v1 clock are
accepted tools, but demanded closure/fallback checks still precede each new
suite. Broadened phases may activate previously undemanded ports. Record those
as fixture/capability errors until resolved; do not convert them into input
constants or SAL behavior failures. Fixed component cuts are not full
reachability; add actual predecessor sequences where known.

## Requirement accounting and handoff

A/B/C are overlapping obligations, not a partition that removes requirements.
EMG001–007/011 and CVR001/002/004–006 chiefly advance through A1–6; EMG008/009
through A7; EMG010/STP001–004 span known sequence A checks and B completion;
EMG012/MOD006 span known exclusion and B destination. BTN001–008 span A
cross-mode/rearm plus unresolved QR/QT and full C startup. CVR003 has A10.
MOD001/002/005/008 and STP005 require preserved full feedback/phase sequence,
A8 and completion B; MOD003/007 require both known permissions and PLC B.
MOD004 has A9 plus QT. BOOT001/002 require C and actual recovery sequences.
All41 IDs remain mandatory, including any not fully closed by the next narrow
NC2/Mentee package. Independent tester must bind each executed case to IDs,
source hashes, initial state, exact cuts, raw events, observed outputs and
positive controls; reviewer assesses sufficiency separately from test counts.

No new user scenario question is introduced by this audit. Recommended next
handoff is A1/A2 NC2/Mentee plus explicit component phases and continuous
fault/restore observations, then A3/A4/A5 and A6. Architect identifies real
writers/ordered evidence; independent tester authors normative checks, editor
repairs only verified defects, reviewer accepts bounded results. Source-known
no-up and access checks can proceed while B/C remain unresolved.
