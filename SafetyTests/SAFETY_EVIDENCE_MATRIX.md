# Safety evidence and input bindings — 2026-10-18

> Current acceptance: SOFTWARE_ACCEPTANCE_SCOPE.md lists all 41 mandatory
> software IDs, current coverage and remaining candidate checks. Current
> results: SOFTWARE_CHECK_RESULTS.md/.json; decisions: SCENARIO_DECISIONS.md.
> Hardware configuration is accepted. Physical/native validation is outside
> this task, never a gate for software checks. Sections below the current
> synchronization note retain historical observations, not the current plan.

## Current synchronization — 2026-10-18

Latest accepted refresh2026-10-19:03B and scopedR3 accepted, see
ITERATION_03B_REVIEW.md and03B_R3_REVIEW.md. SAL
`a50e24af66c755f00001e3bd2eed70ba4d30526df8dfa427b5d37bc6dcebb413`, SGVL
`06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5`.
Saved178/75/272 test suites PASS;201PASS/1FAIL/5NV cases, no new run here.
Actual physical R&D timing/late/rearm recognizer now covered in145-block
branch with26 given inputs and typed Network3 ownership cuts. R3 uses native
first-only WINDOW and effective master pair selection/inversion for four
EStop pairs; demanded NC2/Mentee bindings are checked. Error remains a host
stub, not native/group nofault proof. Safe/Run, fullreachability/group lifecycle,
complete emergency owner and accepted-transition rollback remain open.

All41 mandatory IDs remain; models/prototypes do not close full requirements.
Older snapshots below are historical and superseded by this accepted source.
One-sample PLCstop/raw restore LV/HV new-Set gap remains an explicit scoped
follow-up (PLC_PULSE_SET_REQUIREMENTS.md), not closed by03B or normal guard
truth tables. EarlySTO/full original sequence and PLC request/conflict/
transition-down/discharge behavior questions remain separate unfinished work.

Coverage refresh2026-10-19: reviewed04/03C/06/05 and accepted07r2 are reflected
in SOFTWARE_ACCEPTANCE_SCOPE.md. Latest saved source SALbf110ab452a5d9d3fcafd1acc5ab657b993e3e2828f384a63c1491c57b2cdcc6,
SGVL508610b92e60ae602a75952113b34f7a8bd9c3f283fbb93dfa45b6a532f0a3ba.
Reported174/75/112 test suites PASS;172PASS/29FAIL/5NV scenarios. No new run
by this documentation update. All41 mandatory IDs remain, not whole-system PASS.

| Accepted packet | Current actual-code evidence | Still open |
|---|---|---|
| 04/05 LV/HV | Shared nine current permissions; actual producers/aggregate/Set gate/RS, paired firstfault controls | STO/other raises, complete emergency owner/recovery |
| 03C clock | observed-fixed-scan-v1 boundaries/first observed age0 |03B recognizer not implemented; no BTN acceptance from prototypes/clock alone |
| 06 Door | Real R&D energy producer uses BOTH InterLockNC instead of Door; three Door unlock consumers preserved | Full external launch and all phase/route acceptance |
| 07r2 Unlock | Final writer uses latched EStopOK plus current PLCstop; Safe/R&D NC1/PLC firstscan and no-reopen after restore | NC2/Mentee, all transition phases/energy completion, full EMG-007 |

Source reviews: ITERATION_04_REVIEW.md, ITERATION_03C_REVIEW.md,
ITERATION_06_REVIEW.md, ITERATION_05_REVIEW.md, ITERATION_07_REVIEW.md.
There is no CVR-007 ID; emergency cover scope is EMG-007 plus CVR-001/002.
Historical evidence below and prototype PASS never close current requirements.

Latest2026-10-19 D-DOOR-INTERLOCK after engineer Niv supersedes retained
Door energy guard: PLC DoorMonitor only serves existing solenoid grant/reset.
Energy advance checks BOTH in_InterLock_NC_1/2 (not ES_NC1/2). DoorFALSE with
bothInterLockTRUE must not block advance if other permissions hold; either
InterLockFALSE blocks regardlessDoor. DOOR_INTERLOCK_REQUIREMENT.md inventories
all actual consumers/IDs and acceptance matrix. Earlier D-DOOR-CURRENT notes
below are historical in energy-guard scope. Other protections/03C remain.

PLC request policy update2026-10-19: actual v2 MAIN act_LogicMap emits held
codes10/11/00, while Network12 merges PLC paths with button paths. Reference
MAIN has no corresponding R&D action. SPEC§14 requires a new event/handshake,
but independent PLC acceptance without physical gesture remains Q-PLC-REQUEST
in SCENARIO_DECISIONS. No held-level bypass or invented handshake acceptance
is permitted. Only that dependent policy waits; B1/HV work continues.

Update2026-10-19: targeted read-only declarations/program mappings trace is
LOCK_FEEDBACK_SOFTWARE_TRACE.md. Separate SolonoidStatus input and mapped
SolenoedMonitor field exist in reference/v2, but no copy or SAL SDS15 consumer
was found. Locked meaning/polarity/qualification is not established. Latest
conditional D-LOCK-CHECK was superseded by D-DOOR-CURRENT: preserve ordinary
digital DoorMonitor via PLC and original program permissions now. Separate
locked feedback is deferred until engineer discussion/new user decision;
Q-LOCK-CONTRACT does not block workflow or form mandatory NV. Do not remove
existing EStop/interlocks or claim DoorMonitor is safe/closedANDlocked proof.
Existing conditions still require actual-code checks. Binding repair B1 is
independent and remains. No hardware facts or safe status are inferred.

The full original working sequence is the foundation of v2. R&D adds a stable
intermediate stop/continuation; it does not authorize a redesign. Match reference
phases by code rather than searching only for the new name. Intentional changes
and preserved behavior must be traced separately.

- D-TIMING: user approved single blue/green0.5s, both1s; configured SAL timers
  remain unchanged. Historical prototype1/2s is not the current oracle.
- D-STO-LAUNCH: accepted R&D→Run launch releases STO without waiting for
  C2/HV Healthy feedback. Run confirmation remains separate; EStop/interlocks
  and other launch permissions remain. SPEC§7 and FULL_NORMAL_CYCLE now agree.
- Iteration01 covers hold/green exclusion, not the entire cover/recognizer ID.
  Iteration02 targets new LV request permission, not emergency completion.
- Latest D-CHORD250: second-button delta<=250ms accepts chord, both held
  continuously1s from the second button. Test before/exactly/after250ms for
  both first-button orders. SINGLE500ms remains. Changing this software
  window is explicitly approved; no silent quantization/rounding is allowed.
  D-Q500 remains closed and does not allow chord500ms or retrospective StepUp
  after single. Green still suppresses Unlock; no same-scan pulse duration
  is prescribed. Old inclusive500ms chord evidence is historical.
- D-LATE-SECOND: late second (>250ms) before single acceptance ignores the
  entire attempt without fault. After single acceptance (including500ms
  priority), preserve accepted command/started transition, no rollback or
  interruption due to that button, no new command before bothOFF+filter.
  Green still removes Unlock as output hold. Six symmetric before/at/after
  single scenarios are listed in SCENARIO_DECISIONS; actual SAL coverage pending.
- Technical scoped assumptions may be explicit; unknown expected behavior may
  not. Test actual SAL; models and pinned reproductions remain separate.

Source precedence within the scenario: latest explicit user decision, approved
intentional requirement change, preserved reference behavior, then preliminary
historical material. Remaining contradictions go to the user. Current software
variables/wires may change by plan; hardware/group configuration, mappings,
physical timing and specified timer values may not.

## Historical structural snapshot and evidence

This is a scenario-family matrix, not the final per-requirement traceability
matrix. Emergency IDs EMG-001–012 now appear in specification section 19;
`EMERGENCY_REQUIREMENTS.md` binds them to evidence and gaps. Remaining families
are assigned group IDs in specification section 20; atomic per-feedback
coverage is incomplete. Scenario IDs come from `../SAFETY_TEST_PLAN.md`.
A passing regression can preserve
a known discrepancy. No row represents completed hardware validation.

Baseline binding update: twelve reproduction suites now read the pinned
checkpoint fixture rather than the working SAL. Their evidence remains
historical. Audit scripts inspect the candidate; acceptance is tracked in
`ACCEPTANCE_BACKLOG.md`, not inferred from a green baseline suite.

## Reproducible input inventory

Run `npm run audit:inputs`; add `-- --write` to regenerate
`SAL_INPUT_INVENTORY.json`. The JSON includes every declared external alias
input, raw channel identifiers, consumers and unresolved input references.

Current full SAL inventory:

- 27 external alias inputs; electrical polarity and runtime levels unverified.
- 205 execution numbers spanning 1–205 with no duplicates.
- 145 unconnected non-deactivated input ports, including unused Decouple lanes.
- 10 of these belong to channels/blocks with used outputs: Network4 DecIn1–7,
  Network6/FBDecouple2/DecIn5, and Network1/FBEstop1 EDM1/EDM2.
- No explicit reference to a missing producer in the complete parsed SAL.

These counts are structural findings, not a verdict. Unused Decouple lanes do
not by themselves indicate an error. E-Stop EDM activation/configuration needs
separate semantic review. For non-Decouple blocks the affected-output list is
conservative; it does not prove that every port controls every output.

Partial-network tests omit producers deliberately and seed selected states.
Their external global preconditions must not be confused with complete SAL
bindings. The inventory distinguishes missing producers from unconnected
ports. Three tests prove detection of the known transition gap, a removed
wired producer and an omitted global producer.

## Evidence matrix

| Scenario family | Model evidence | Actual SAL evidence | Status / remaining dependency |
|---|---|---|---|
| B01–B15 buttons | Independent recognizer tests | Network12 button tests; real 0.5/0.5/1 s timers and failed-chord degradation | Known mismatch; full Safe/R&D recognizer acceptance incomplete |
| C01–C10 cover | Model cover scenarios | Safe/R&D latch tests, unlock/upward conflict reproduction | Known mismatch; physical lock polarity and full phase matrix unresolved |
| D/E upward modes | Model feedback/state tests | Network3 latch mapping plus partial Network12 feedback paths | Partial; no full-project commissioning or wiring proof |
| F/G Run-down | Model SS1/coast/discharge tests | DOWN01–04 and OUT01–04 bind selected Network1/3/6/11 chains | C2 command removal lacks completion gate in tested chain; SS1 meaning/polarity and competing paths unresolved |
| H R&D -> Safe | Model normal/timeout tests | EXIT01–05, RNDSAFE01–05, global-order audit | Selected global-order chain can reach Step2 and raise LV/HV commands; legacy lost-handoff result is withdrawn |
| A05/A06 emergency | Model phase scenarios | ESTOP01–05, CHAIN01–12, PHASE01–03 and 144 observational phase/control cases | Non-Run reaction differs from Step3; see EMERGENCY_PHASE_REPORT.md. Network4 excluded, no-EDM assumed, seeded states |
| Power/external interlocks | Model P01–P04 | Static paths, connector subset, CHAIN07–10, observational eight-step phase matrix | Run stop persists; seeded Step2 connector-loss trace does not inhibit HV. Runtime confirmation pending |
| Restart / state conflicts | Model and selected latch tests | Seeded ownership checks only | Full TwinSAFE initialization not established |
| Adapter semantics | Model mutations 5/5 | Global order, RS truth/state tests, unconnected-input sensitivity | Global ordering corrected; constants, group state, E-Stop and timing still partial |

## Historical next decisions — superseded, not current execution instructions

1. Review E-Stop EDM configuration and restart semantics from the existing SAL
   before extending emergency execution. Do not infer active monitoring from
   the inventory alone.
2. Resolve Network4's unconnected used channels and Network6 transition-status
   channel in TwinSAFE editor/Verify or authoritative project export.
3. Establish raw levels for SDS62/channel15, Healthy and AX5805 feedback.
4. Expand emergency/interlock traces only with explicit scope and established
   preconditions, then assign individual requirement IDs and complete coverage.

Those old physical/native dependencies do not block current software checks.
Current work follows SOFTWARE_ACCEPTANCE_SCOPE.md and the approved workflow;
adapter coverage limitations remain visible and require software evidence.
