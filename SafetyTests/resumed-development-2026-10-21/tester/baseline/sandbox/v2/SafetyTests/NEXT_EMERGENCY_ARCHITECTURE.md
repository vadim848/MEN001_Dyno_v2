# A1–A3 emergency test architecture

2026-10-20. **READY for independent test preparation and review; no SAL patch.**
Working SAL SHA256 `72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e`;
SGVL `de0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56`.
Read NEXT_ACCEPTANCE_SCENARIO_AUDIT, current requirements/accepted decisions,
EMERGENCY_REQUIREMENTS and the already source-read reference phase ledger.
Reference4495a1f preserves original power-on/removal and feedback operations;
R&D-specific gestures, stop/resume and early STO are approved additions.
Historical phase orders in those documents are not the current order oracle.

## Scope and independent handoff

First package A1/A2: independently NC2 and Mentee; first-fault and restoration
without Restart; Safe/RnD access and declared pending-energy phases. A3 adds
each External InterLock NC independently, including real Run protective-entry
and bounded stopping observations. All are known no-up/access/recovery
requirements; no QR/QT/PLC-acceptance or discharge-completion answer is needed.
No test may infer a selected Emergency/TransitionFault endpoint from a name.

The independent tester authors actual checks and evidence, not assertions copied
from these implementation details. The reviewer assesses oracle and closure.
The editor changes SAL only after a new behavioral RED with source evidence.
This architecture supplies technical fixtures and chronology, not a PASS report.

## Mandatory whole-source and native-pair preflight

Read fresh actual SAL and explicit matching SGVL; run full structural audit
before selecting any dependency cone. Record both raw SHA256, actual path,
native block/port/global IDs, native order and canonical wire edges. Require
every demanded producer; a missing producer is fixture ERROR, not FALSE.
Resolve aliases by exact IDs, global references through matching declarations
and usages, and native relationships through required wrappers. Record runtime,
parser, effective-pair resolver and fixed-clock contract identities.

Main EStop is `//Network1/FBEstop1`, current order23. Its effective input pairs:

| Given program input | Variable ID | Actual native port ID | Master and effective polarity |
| --- | --- | --- | --- |
| ES_NC2 | 6abcf415-f5bc-4413-9556-e13ee4e3ca62 | 470fa800-78f9-45e2-b894-d6754da63de8 | EStopIn2, master EStopIn1, Single-Channel Both Activated, master.deactivate2=Break Contact NC: TRUE healthy |
| Mentee_EStop | 7345d0ae-6720-47d8-b710-bb0b8c2dd55f | dc5dad60-817c-4326-80e9-b363772b37d1 | EStopIn4, master EStopIn3, Single-Channel Both Activated, master.deactivate2=Make Contact NO: FALSE healthy |
| External InterLockNC1 | 6ea0bd28-86ec-4253-af16-e7671d60bf50 | current-permit AndIn4 a895c77e-2cfa-4ae2-8c00-956b8fe95f08 | Direct TRUE healthy; separate from ES_NC1 |
| External InterLockNC2 | 7609638c-62cd-4d5e-a440-a3e26594ec02 | current-permit AndIn5 90afa8dd-4551-43ce-8ede-570abe26ef42 | Direct TRUE healthy; separate from ES_NC2 |

EStopIn1 is direct ES_NC1. EStopIn3 reads the real PLC/False producer
Network1/And1; that producer executes96 and equals !PLCstop && !False.
The slave ports' own `Both Deactivated` attributes do **not** deactivate
their master-enabled channels. Use effectiveEstopInputs with actual bound-port
validation, including both master channels; never filter only Activated ports.
Do not replace the producer by healthy TRUE to make the first-fault test pass.
Two-channel discrepancy, EDM/group lifecycle and physical input origin remain
outside this accepted partial adapter contract.

## Exact observation and ordered fault contract

Use fixed1ms samples for the primary first-fault cases, every scan recorded
from initial setup/entry through fault and restoration. A held fault may be
observed for ten or more scans as a technical trace span; it is not a new
timeout. Add one-observed-sample faults. Off-grid events are rejected by the
clock contract, not rounded. Record the healthy control and event run separately.

| Current evaluation | Required observation and consequence |
| --- | --- |
| Current energy permit2 | Reads current ES_NC2 and both ExternalNC directly; their FALSE suppresses current permit even though prior EStopOK might still be TRUE |
| LV/HV SetPermit3/5, STO SetPermit10/12 | Each reads current inverted Mentee directly; Mentee TRUE blocks the first Set before main EStop23 updates. Observe both gate output and actual RS Set input |
| Actual energy RS4/6/11/13 | Record Set and Reset separately plus actual output/torque-permission rises. A prior latched contactor retained during controlled stopping is not a new Set |
| Main EStop23 | NC2 FALSE or Mentee TRUE clears actual EStopOK on that scan; raw restore with green FALSE cannot enable it without Restart |
| Real PLC producer96 | Kept in closure even for non-PLC fault. Its late evaluation must not be used to claim a same-scan PLC EStop response |
| Recognizer E125 and owner states | Observe E, SU/SG/BA/C/T/P as actual diagnostics, not invented accepted-event flags. Fault must not generate a fresh physical acceptance |
| Sole Unlock writer255 | Reads real grant latch, raw blue, !raw green, updated EStopOK, !current PLCstop. For A1 NC2/Mentee Unlock must be FALSE at the first fault sample and stay FALSE after restoration without reset |

Main EStop/Set gate/outward-output/native-input observations are all required.
A missing upstream request alone does not prove the output was inhibited.
Do not invent a generic latency allowance. If the actual first fault output
violates a normative lower bound, retain the sample and report RED.

## A1: actual Unlock before fault, independently Safe and RnD

Healthy given background: both ES NC and both External NC TRUE, connectors
TRUE, Mentee FALSE, PLCstop/False FALSE, Door TRUE. Use existing audited
createSafeRunFixture(Safe) or physicalRndSource for the actual qualified blue
path, including SafeResumption and RndPhysicalCompact producers. Their typed
Network3 phase cuts must remain explicit; these are component access checks,
not full BOOT/reachability. Independent actual-N3 predecessor variants may
extend coverage without replacing those declared cuts by default values.

Perform actual main Restart while no command is armed, release green, satisfy
full existing neutral filter, then fresh blue500. Establish actual grant and
final Unlock TRUE; blue stays held and green stays FALSE throughout fault and
restore. For each mode independently run NC2→FALSE and Mentee→TRUE, each
one-sample and held. Restore only the named raw input; no green event, new
gesture, phase write or manual latch/output reset. Observe first fault,
first restoration and later restored-without-Restart scans continuously.
EStopOK and Unlock remain FALSE after restore. Include an identically prepared
no-fault control showing availability; failed setup is ERROR, not SAL RED.

Observe existing Door reset writers too: N2 And8, N12 And11/And17, grant reset
OR3, grant set OR4, RS6 and final hold255. Preserve raw green as Restart;
do not replace it by qualified StepDown. Neither connectors nor ExternalNC
are newly added to the final hold gate by this test architecture.

## A2: pending real energy, faults before next actual consumption

Prepare a no-fault twin for every domain/route. Stop at an observed frame
where its **actual aggregate is TRUE and actual relevant output still FALSE**.
Apply the raw fault before the next fixed scan. Never seed the aggregate,
SU, grant, accepted owner, output or Set/Reset port to construct that frame.

| Declared phase/entry | Actual producers and observation boundary | Scope |
| --- | --- | --- |
| Safe up→Step12 LV | Actual qualified Safe BOTH, old And3 readiness, Safe accepted owner/OR1, actual Step12; Network11 And1/SetLV_1→OR17(223)→LV SetPermit3/RS4 | Prefer actual-N3 Safe predecessor with seven enumerated inactive N4 outputs; alternatively declared Step12 owner cut, clearly component coverage |
| RnD accepted BOTH/StartingRun HV | Fresh RnD neutral/valid BOTH→retained FinishUp/GATE020→SU→N12 OR1/Decouple3/And4→SetHV_1→OR18(224)→HV SetPermit5/RS6 | Actual SU and HV producer; keep C2 FBK OFF so Run confirmation is not fabricated |
| RnD accepted BOTH/StartingRun STO1 and STO2 | Same actual SU directly into N1 OR8/OR10 input3; observe each real OR output TRUE before respective SetPermit10/12 and RS11/13 consumes next scan | Separate domain cases if needed; HV may already be on. Early STO does not wait for C2/Healthy; fault gating remains mandatory |
| Original Step2 ordinary power-on LV/HV | Declared original-start Step2 owner, down request absent and actual new down-owner FALSE via its real producer. N5 And1→Decouple1 SetLV/SetHV→OR17/18→SetPermit/RS | This is original-start component coverage, not RnD-down Step2. Include current down-owner closure; never force its output FALSE |

For declared Step2 initialization use an explicit initial component phase only;
no phase/owner writes after protocol start. If new owner cannot be prepared
through its actual reset with that initial phase, return fixture ERROR. Existing
audited producer closures may be reused after reading their exact current
scope. Adding a network by basename alone does not establish demanded closure.

At each pending frame test NC2 and Mentee independently, one-sample and held;
paired no-fault run must consume the real request/produce the expected new
Set/output. Assert no new permitted Set or torque-permission rise on fault,
including all four native guards, with true no-new-rise controls for outputs
already latched. Preserve the original reset/removal writers; do not overwrite
their values to isolate a convenient Set truth table.

**Restore without accidental Restart:** BOTH includes raw green. While the
fault is still active, release both buttons and record at least one scan with
raw green FALSE. Then restore only the fault input with green remaining FALSE.
Otherwise a held green after raw recovery can arm the actual manual Restart,
and its later release becomes a different recovery protocol. Record this
distinction; do not label that release history “no Restart”. After the clean
restore keep no new commands. Actual EStopOK remains FALSE for NC2/Mentee;
no new energy acceptance/rise follows raw restoration. Completion mode and
controlled stopping retention are not selected by these assertions.

## A3: ExternalNC is a distinct source path, not a main-EStop alias

Either ExternalNC FALSE blocks current permit2 and recognizer E125 directly.
It is not an effective main EStop input. Do **not** assert EStopOK must fall
or require this event to use the NC2 latch path. Known Emergency/no-new-up
requirements still apply: report absent emergency producers or failure to
persist handling as actual gaps/RED with exact scope, not as a passing EStop
truth table. Restoration cannot count as a fresh accepted upward command.

Prepare Safe, RnD, Step12, original-start Step2, Run and bounded stopping
contexts separately. State each entry reason; never call any Step2 shutdown
merely because it followed a green. For pending energy use the A2 exact-frame
method with ExternalNC1/2 independently. For Safe/RnD access retain actual
grant/output observations and applicable Emergency/Unlock requirements;
do not turn an absent Emergency latch into a fixture-supplied one.

In Run the preserved protective path is N6 And1(51)→And2(53) with inverted
N6 And9, then Decouple1(62)→Step4_Set and actual N3 Step4 RS65. And9(94)
requires current ExternalNC1/2, connectors, !LVHealthy, !HVHealthy and previous
And10; And10(95)=!PLCstop && ES_NC2 && !Mentee && ES_NC1. Literal Run-good
Healthy background is therefore both raw Healthy FALSE, unlike Safe/RnD setup.
Do not start a purported healthy Run trace with Healthy TRUE and hide an
already active Step4 protective request.

For a new ExternalNC fault, And9 sees it at94 after And2 has executed53.
The next scan's And2/Decouple1 can produce Step4 even if the raw input has
already restored. Record this exact consumer chronology; there is no invented
physical grace period. Actual Step4 RS must retain handling after the pulse
and restore, until its real later reset source acts. Main EStop may remain
TRUE. A forced phase cut on Step4 cannot prove this persistence: use actual
N3 writers with the explicitly enumerated inactive N4 boundary for this variant.

Follow bounded original Network7/8 removal writers only as far as the existing
input/feedback history supports. Do not choose a new coast latch, Healthy
restoration policy, discharge completion, final Safe/TransitionFault or new
timer. Source-known new-energy inhibition and started protective-owner retention
can be checked independently of those later endpoint decisions.

## Evidence, errors and acceptance boundary

Each case records requirement IDs, source hashes, raw healthy/fault values,
initial phase/reason, all typed cuts (port/global IDs), actual producer graph,
effective pair contacts, fixed scan timestamps, before/after fault samples,
Set/Reset/input/output traces, rises and positive control. Start observation
before entry/press; no dropped threshold or restore frame. Demand zero
unresolved inputs in the observation/command cone. Separate outside-cone
unobserved DECOUPLE channels rather than calling them native FALSE or dead.

An external-input branch that cannot be prepared is NOT VERIFIED/fixture ERROR,
not SKIP-as-PASS or a source defect. A known output violation after successful
preparation is FAIL. Historical reproductions and current behavioral cases stay
separate. No numeric total closes an entire ID or all41 requirements by itself.
Reviewer gate precedes source repair/acceptance. Full N4/group BOOT, invalid-mode
destination, manual emergency completion and pending QR/QT/PLC/LV/HV decisions
remain explicitly open; they do not block these independent first-fault checks.

Only this architecture file was written. No tests, parser/runtime, working SAL,
hardware configuration, native Build/Verify/CRC or deployment were changed.
