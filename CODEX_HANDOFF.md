# Codex handoff

**Действующий объём:** AGENTS.md и WORK_STATUS_AND_PLAN.md. Только программные
проверки; hardware принято как исходное условие. Reference проверен чтением Git:
MEN001_Dyno / Prodoction / 4495a1f6049f6a58ebfd436761faa84d17c8d643, origin
https://github.com/vadim848/MEN001_Dyno.git. Сначала искать ответы в reference;
новое поведение R&D брать из требований v2. Самостоятельно продолжать анализ,
планирование, тесты и реальные локальные изменения программной логики по
WORKFLOW.md с архитектором, редактором и независимым ревьюером. Прежнее
ограничение «только тесты» снято пользователем; аппаратные границы сохраняются.
Запуск: `cd SafetyTests; npm run check:software`. Прежние аппаратные gates
ниже сохраняются как история и не блокируют это задание.

**Latest status and next-step order:** read `WORK_STATUS_AND_PLAN.md` first.
Historical entries below preserve earlier checkpoints and superseded findings.

Earlier local checkpoint2026-10-19: `218dde5`, unaccepted03B integration plus
independently reviewed R3 red tests (86 tests,56PASS/30FAIL). Native pair
activation/contact semantics were confirmed from the local SDK; the old host
model incorrectly filtered each slave's own fields. That checkpoint precedes
the R3 first-only WINDOW and shared runtime/dependency-closure pair resolver repair.
Read SafetyTests/03B_NATIVE_PAIR_FIX_PLAN.md,03B_NATIVE_PAIR_PLAN_REVIEW.md and
03B_R3_TEST_REVIEW.md before resuming. No whole-project acceptance or push.
After that checkpoint R3 and whole03B were independently ACCEPTED within their
component scope. Accepted source is a50e24af66c755f00001e3bd2eed70ba4d30526df8dfa427b5d37bc6dcebb413;
SGVL06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5.
Current accepted work is checkpointed at b5692c3:178/75/272 tests PASS,
201PASS/1FAIL/5NV. See03B_R3_REVIEW.md and R3_CURRENT_RESULTS.json for current
evidence; old integration results retain their old-model limitation. Keep red
baselines intact. b5692c3 also includes reviewed PLC pulse LV/HV red tests:
48 tests36PASS/12FAIL. That follow-up is now independently accepted:48/48 PASS,
source dd9fd938fd5493795a7eea7b29cb027d7e994e2a55e2ad02d2ca66cb4beb6923;
178/75/321 test stages PASS,201/1/5 cases. It adds only two existing AndIn4
bindings. See PLC_PULSE_IMPLEMENTATION_REVIEW.md and PLC_PULSE_CURRENT_RESULTS.json.
Next is earlySTO fixture-plan review and real red tests; no full41 acceptance.

Emergency checkpoint created on 2026-10-18 before moving to another workstation.

## Repository state

- Repository: `vadim848/MEN001_Dyno_v2`
- Working branch: `Safety-Develop_2`
- Base commit before this checkpoint: `77546cb` (`Stas Updates after inegration - not operational.`)
- Primary TwinCAT solution: `MEN001_Dyno.sln`

## Work completed in this checkpoint

- Added the safety state-machine specification: `SAFETY_STATE_MACHINE_SPEC.md`.
- Added the safety verification plan: `SAFETY_TEST_PLAN.md`.
- Added the JavaScript safety-analysis and regression-test harness under `SafetyTests/`.
- Added baseline findings and the proposed V2 change plan.
- Added detailed safety scenarios for normal operation, emergency behavior,
  interlocks, feedback timeouts, cover handling, and mutation testing.
- Preserved the working Draw.io diagram at
  `SafetyTests/docs/Safety Flow Chart testing.drawio`.
- Preserved the current local modification to
  `MEN001_Dyno/MEN001_Dyno.tsproj`, including TwinCAT project variants and
  mapping changes. Review this hardware/project-generated diff before deploying
  to a real PLC.

## Resume instructions

1. Clone the repository and check out `Safety-Develop_2`.
2. Read this file, `SAFETY_STATE_MACHINE_SPEC.md`, `SAFETY_TEST_PLAN.md`,
   `SafetyTests/V2_BASELINE_REPORT.md`, and `SafetyTests/V2_CHANGE_PLAN.md`.
3. In `SafetyTests`, run `npm test` (or inspect `package.json` for the exact
   scripts) before changing the safety implementation.
4. Treat generated TwinCAT files and real-machine mapping changes cautiously;
   confirm them in TwinCAT and against the physical safety wiring.

## Resume verification — 2026-10-18

- Local HEAD: `4bb8703`, branch `Safety-Develop_2`.
- The emergency test originally depended on a sibling checkout missing on this
  workstation. Only the original-versus-v2 comparison now explicitly skips when
  that source is absent: 68 passed, 1 skipped, 0 failed.
- Mutation checks now run model/button tests without unrelated SAL file loads,
  normalize CRLF mutation anchors, and detect all 5 injected defects.
- XML/SAL audits completed: no missing restore references; 12 networks,
  205 blocks, 64 variables, SAL CRC `872783435`.
- No TwinSAFE source or hardware mappings changed during resume verification.
- `UpgradeLog3.htm` was already untracked on this workstation and was left alone.
- After the sibling `MEN001_Dyno` source was added, corrected its SAL path for
  this directory layout. Full regression: 69 passed, 0 skipped, 0 failed.
  The E-Stop input-assignment comparison with that source now passes;
  mutation checks still detect 5/5 defects.

## Reference boundary and next analysis — 2026-10-18

- User confirmed that `MEN001_Dyno` is reference-only; all edits belong in v2.
  Its observed reference branch is `Prodoction`, commit `4495a1f`.
- Read `SafetyTests/V2_STATE_MAPPING.md` for the refined state map and four
  isolated Network3 regression checks. Step12 and Step2 have shared roles.
- Continue by binding the separate Network6 return-to-R&D energy-removal
  path, then resolve Step2 exit and Network9's `in_False_SI2_CH8` gate.
- Current regression: 73 passed, 0 skipped, 0 failed; mutation score 5/5.

## Network6 continuation — 2026-10-18

- Read `SafetyTests/V2_RUN_TO_RND_REPORT.md`; four tests execute Network6.
- The green and PLC-mode paths raise STO reset, HV discharge and C2 reset
  requests together. The 0.2 s/C2 OFF gate controls Step12 entry, not delayed
  C2 reset after discharge completion. Final physical outputs remain unverified.
- Next bind request consumers in Network1 and handoffs in Network3/11.
  Inspect unconnected FBDecouple2/DecIn5 before interpreting transition status.
- Regression after this step: 77 passed, 0 failed, 0 skipped; mutations 5/5.

## Network6 output-chain continuation — 2026-10-18

- Added four checks in `SafetyTests/test/sal-rundown-outputs.test.js`; read the
  appended output-chain section of `SafetyTests/V2_RUN_TO_RND_REPORT.md`.
- In the selected Networks1/3/6/11 chain, C2/STO command bits drop and discharge
  latches ON; early green release can strand Step3/Armed even after C2 feedback
  goes OFF. Held green permits Step12 and later R&D with LV qualification.
- Green and PLC-mode paths differ in SS1 bit behavior. This is partial SAL
  execution with seeded armed memories, not full-project/hardware validation.
- Next: Network5 Step2 exit and Network9 Step6 exit, then competing emergency
  paths. Validate global execution order, constants and physical polarity.
- Current regression: 81 passed, 0 failed, 0 skipped; mutations 5/5.

## Step2 / Step6 continuation — 2026-10-18

- Read `SafetyTests/V2_SAFE_EXIT_REPORT.md`; added EXIT01–05 in
  `test/sal-safe-exit-baseline.test.js`.
- `in_False_SI2_CH8` is SDS62/channel15, not a proved software constant.
  Both tested Step1-return gates require it TRUE. With it FALSE, Step2 can
  generate LV/HV set requests when EStop OK is TRUE; Step6 exit is blocked.
- Next bind Network12's R&D down command through Network3/5/1, then inspect
  competing Network4 emergency and Network6/7/8 removal requests.
- Current regression: 86 passed, 0 failed, 0 skipped; mutations 5/5.

## Linked R&D down path — 2026-10-18

- Added RNDSAFE01–04; read `SafetyTests/V2_RND_TO_SAFE_REPORT.md`.
- The linked Network12 button route produces a short Step2 request. Current
  adapter execution produces simultaneous Step2 Set/Reset and then no active
  step. Earlier EXIT03 holds an internal request and does not prove button-
  triggered re-energization. Preserve this scope distinction.
- Network4 display name is `Network4ToBeDeleted`, with no explicit input
  drivers; its emergency role and unconnected-port semantics are unverified.
- Next priority: audit adapter execution ordering, constants/initialization
  and RS semantics before expanding full-project or emergency runtime claims.
- Current regression: 90 passed, 0 failed, 0 skipped; mutations 5/5.

## Adapter audit — 2026-10-18

- Read `SafetyTests/SAL_ADAPTER_SEMANTICS.md` first for latest classifications.
- Corrected default execution to global SAL `orderOfExecution`; legacy-network
  mode is explicit. RS reset dominance agrees with Beckhoff's TwinSAFE manual.
- Retracted lost R&D->Step2 handoff as a corrected-order finding: legacy mode
  reproduces it, global mode reaches Step2 and raises LV/HV output commands in
  the selected chain. No full-project/hardware conclusion follows.
- Exposed and recorded unconnected-input assumptions; Network4 is sensitive
  to them and cannot yet be treated as validated runtime logic.
- Regression: 94 passed, 0 failed/skipped; model mutations 5/5.
- Next inventory input/link assumptions, update binding matrix, and extend
  emergency/Healthy tests only on established inputs. No TwinSAFE edits yet.

## Input inventory and evidence matrix — 2026-10-18

- Read `SafetyTests/SAFETY_EVIDENCE_MATRIX.md` and generated
  `SafetyTests/SAL_INPUT_INVENTORY.json`. Regenerate with
  `npm run audit:inputs -- --write` in SafetyTests.
- Full SAL: 27 external aliases; 145 unconnected non-deactivated ports,
  including unused lanes; 10 associated with used outputs. These are seven
  Network4 channels, Network6 transition-status input and two E-Stop EDM ports.
  EDM configuration must be interpreted before labeling them defects.
- No missing explicit producers; execution numbers 1–205 without duplicates.
- Added three inventory tests including injected missing-producer detection.
- Next review actual EDM/restart configuration, then extend emergency traces
  with explicit inputs. Physical channel levels and unused-port semantics
  remain unresolved; the matrix is family-level, not complete requirement IDs.
- Current regression: 97 passed, 0 failed/skipped; mutations 5/5.

## E-Stop semantic correction — 2026-10-18

- Read `SafetyTests/ESTOP_SEMANTICS_REPORT.md`.
- Corrected the partial adapter: Restart enables on release, not held HIGH;
  the configured 100 ms delays switch-off, not switch-on. Added ESTOP01–05.
- No-EDM remains assumed because parsed SAL does not establish activation.
  Active/connected EDM is explicitly rejected; group lifecycle/discrepancy
  semantics remain unimplemented. Delayed output has no explicit SAL consumer.
- Next trace EStopOut loss through selected consumers with explicit scope;
  no complete-project/hardware validation is implied.
- Current regression: 102 passed, 0 failed/skipped; mutations 5/5.

## Emergency chain continuation — 2026-10-18

- Read `SafetyTests/EMERGENCY_CHAIN_REPORT.md`; added CHAIN01–04.
- All networks except unresolved Network4 execute, with seeded armed/E-Stop
  memories and no-EDM assumption. NC1 and PLC emergency clear EStop OK and
  enter Step4. NC1 restoration alone does not restore Run.
- Staged STO/C2 feedback advances through discharge to Step6; time-driven
  C2 removal and blocked Safe return remain reproduced gaps.
- Next test NC2/Mentee and connector/external interlocks, then Healthy loss
  and recovery, separating FBEstop inputs from independent protective paths.
- Current regression: 106 passed, 0 failed/skipped; mutations 5/5.

## Additional emergency inputs — 2026-10-18

- Added CHAIN05–12 in the same emergency-chain test file; updated
  `SafetyTests/EMERGENCY_CHAIN_REPORT.md` and evidence matrix.
- NC2/Mentee and connector/external contacts start Step4 while EStop OK stays
  TRUE. Their direct FBEstop port gaps do not mean absent overall protection.
  Restoration does not cancel the tested stop step (both fallback assumptions).
- Raw HV Healthy TRUE takes the 2 s gated branch; returning FALSE after 100 ms
  changes to the longer branch. Electrical Healthy polarity remains unverified.
- Next extend to non-Run/transition phases and complete individual requirement
  IDs/coverage. No TwinSAFE implementation edits or hardware validation yet.
- Current regression: 114 passed, 0 failed/skipped; mutations 5/5.

## Non-Run phase matrix — 2026-10-18

- Read `SafetyTests/EMERGENCY_PHASE_REPORT.md`; regenerate JSON using
  `npm run audit:phases -- --write`. 144 observational cases, not acceptance
  passes: eight seeded steps, eight events plus control, two assumptions.
- Added PHASE01–03. NC1 clears EStop OK without clearing R&D/Step12/Step2
  ownership in the observed windows. Step12 can raise LV during NC1 loss;
  Step2 can raise HV despite connector loss. Controls also energize: these
  findings concern missing inhibition, not fault-caused energization.
- Next assign emergency/interlock requirement IDs per phase and map expected
  reactions, then draft correction groups. Network4/EDM/polarity remain open.
- Current regression: 117 passed, 0 failed/skipped; mutations 5/5.

## Requirement IDs and correction groups — 2026-10-18

- Specification section 19 assigns EMG-001–012 to existing emergency rules;
  no new physical times/polarities or procedures were approved.
- Read `SafetyTests/EMERGENCY_REQUIREMENTS.md` for per-ID evidence, missing
  positive/negative coverage and semantic-phase expectations.
- Read `SafetyTests/V2_IMPLEMENTATION_GROUPS.md` for concrete network scopes,
  acceptance exits and baseline/candidate separation, refining the original
  six-group change plan without changing their order.
- Baseline SAL SHA256 is recorded there. Next complete remaining requirement
  IDs and acceptance scenarios, then prepare a pinned v2 baseline fixture and
  test bindings before any TwinSAFE implementation change.

## Pinned baseline and remaining requirement groups — 2026-10-18

- Added exact byte fixture `SafetyTests/fixtures/v2-4bb8703/TwinSafeGroup1.sal`
  and hash-verifying `src/baseline-fixture.js`. Twelve historical reproduction
  suites explicitly import it. BASELINE01 rejects modified bytes.
- Working SAL audits/conformance/assumptions/runtime-semantic checks remain
  candidate-bound. A green full suite is not candidate acceptance.
- Specification section 20 adds 29 BTN/CVR/MOD/STP/BOOT IDs (41 group IDs total
  including emergency). Atomic per-feedback coverage remains incomplete.
- Read `SafetyTests/ACCEPTANCE_BACKLOG.md` for positive/rejection pairs and
  binding rules. Next implement candidate button/cover acceptance reporting
  with known baseline failures explicit; no TwinSAFE source changes yet.
- Regression after rebinding: 118 passed, 0 failed/skipped; mutations 5/5.

## Candidate button/cover acceptance — 2026-10-18

- Run `npm run acceptance:candidate -- --write`; this reads working SAL.
  Read `SafetyTests/CANDIDATE_ACCEPTANCE_REPORT.md` and JSON for scenario
  bindings, first violations and limits. Current: 1 PASS, 7 FAIL, 3 NOT VERIFIED.
- Nonzero exit is intentional for actual candidate failures. Missing bindings
  are unverified, not passes. Three reporter regressions verify classification
  and sensitivity to a cloned-model timer correction.
- Next expand candidate re-arm/chord boundaries and blue-held emergency cases;
  then refine button/cover implementation design. Baseline remains pinned.
- Regression: 121 passed, 0 failed/skipped; model mutations 5/5.

## Candidate re-arm/chord/emergency cover extension — 2026-10-18

- Candidate acceptance now reports 2 PASS, 14 FAIL, 3 NOT VERIFIED. Regenerate
  with `npm run acceptance:candidate -- --write` and read the updated report.
- Added short-neutral retry, 490/500/510 ms chord arrival, flicker timing and
  blue-held NC1 loss/recovery from seeded Safe/R&D/Run.
- Safe/R&D unlock remains ON across NC1 event; Run sample stays OFF. Emergency
  cases exclude Network4 and record no-EDM/initial-state assumptions.
- A cloned timer-corrected model passes in-window timing samples but still
  fails late chord: recognizer state/re-arm logic is required, not just timers.
- Next refine button/cover implementation design with global fault inhibition
  and recognizer ownership across modes; full phase/source coverage remains.
- Regression: 123 passed, 0 failed/skipped; model mutations 5/5.

## Button/cover design — 2026-10-18

- Read `SafetyTests/BUTTON_COVER_DESIGN.md`: concrete seven-state recognizer,
  proposed fault inhibition/re-arm, execution layers, final cover permission
  and exact legacy block seams. This is a proposal, not a SAL modification.
- Critical integration condition: new pulses must feed latched transition
  ownership, not replace Network6's sustained stop level directly.
- SafeEnergyForAccess, startup/constant encoding and inclusive chord-boundary
  timer implementation remain unresolved. EStop OK alone is insufficient.
- Next build an isolated non-deployed block-graph prototype and exercise the
  command/permission contract; keep live SAL and production reference untouched.

## Isolated button/cover prototype — 2026-10-18

- Read `SafetyTests/BUTTON_COVER_PROTOTYPE.md`; implementation in
  `src/button-cover-prototype.js`, exported conceptual graph JSON and PROTO01–07.
- Snapshot AND/OR/NOT graph with seven Boolean memories; host accumulators
  implement timings. It is not native SAL or connected to any outputs.
- Checks cover neutral/chord boundaries, failed chord, fault/mode recovery,
  permission loss and state conflicts. Proposed mode/recovery details still
  need integration review. Current SAL acceptance failures remain unchanged.
- Next design accepted-transition request ownership, then map native block
  timers/initialization on a non-deployed candidate. Physical bindings open.
- Regression: 130 passed, 0 failed/skipped; existing model mutations 5/5.

## Accepted transition owner prototype — 2026-10-18

- Read `SafetyTests/TRANSITION_REQUEST_PROTOTYPE.md`; implementation in
  `src/transition-request-prototype.js`, OWNER01–06 tests.
- Normal request persists until explicit route completion. Emergency wins over
  completion, suppresses normal request output and retains emergency ownership.
  Recovery needs hazard proof plus a fresh manual edge. Timeouts are illustrative.
- One integration test connects recognizer pulse to owner and blocks subsequent
  gestures/unlock while pending. No live SAL/physical output changes.
- Next map native TwinSAFE ownership/pulse/startup blocks and execution order
  in a non-deployed design; physical bindings/timing remain unresolved.
- Regression: 136 passed, 0 failed/skipped; existing model mutations 5/5.

## Native block mapping — 2026-10-18

- Read `SafetyTests/NATIVE_BLOCK_MAPPING.md`; generated core plan in
  `NATIVE_RECOGNIZER_PLAN.json`, regenerated with `npm run design:native -- --write`.
- Core: one seven-channel snapshot, 33 Boolean gates, seven RS memories.
  NOT uses inverted contacts, not unsupported NOT/unary-AND blocks.
- NATIVE01 compares 14,336 combinational contexts; NATIVE02 checks schedule
  and fan-in. Timers/boundary producers and owner are excluded from core count.
- Explicit open items: inclusive chord timing, startup, safety/access bindings,
  capacity/Verify and owner graph. No deployable SAL generated.
- Next construct native-style owner graph and verify pulse/memory handoffs;
  resolve timer/startup encoding separately before candidate assembly.
- Regression: 138 passed, 0 failed/skipped; existing model mutations 5/5.

## Native-style request owner — 2026-10-18

- Read `SafetyTests/NATIVE_OWNER_MAPPING.md`; generate plan with
  `npm run design:owner -- --write`.
- 65 relative blocks: one snapshot, 56 gates, eight RS memories. Twenty explicit
  Boolean inputs; no physical aliases or native deadlines/default constants.
- NOWNER01–05 compare all four routes, 1000 mixed samples, timeout arbitration,
  corruption/input rejection and emergency/manual recovery against prototype.
- Native startup, qualified external bindings and interrupted-route/phase
  diagnostic context remain unresolved; normal requests are suppressed on fault.
- Next combine recognizer and owner in one non-deployed contract harness,
  checking busy/cover/mode handoffs before native editor integration.
- Regression: 143 passed, 0 failed/skipped; existing model mutations 5/5.

## Integrated host contract — 2026-10-18

- Read `SafetyTests/INTEGRATED_CONTROL_REPORT.md`, COMBINED01–05 tests and
  generated `INTEGRATED_CONTROL_TRACE.json` (`npm run design:integrated -- --write`).
- Conceptual recognizer + native-style owner share one sample. Final cover gate
  uses NEW owner busy/emergency, preventing same-frame permission leakage.
- Fault context is frozen for diagnostics only; no energy sequencer/proof is
  implemented. Held-blue recovery needs a fresh release and qualification.
- Next resolve native timer/initialization boundaries and prepare the complete
  producer/polarity/owner/completion binding table before candidate assembly.
- Regression: 148 passed, 0 failed/skipped; existing model mutations 5/5.

## Native timer/startup and source bindings — 2026-10-18

- Read `SafetyTests/NATIVE_TIMERS_STARTUP_BINDINGS.md`; regenerate
  `SIGNAL_BINDINGS.json` with `npm run audit:bindings -- --write`.
- SAL parser now retains group-port targets. BIND01/02 verify DoorMonitor
  standard alias versus FSoE button alias, and RunStop/ErrAck distinctions.
- Confirmed target EL6900: basic TON configuration 0.1 s units; TON2/finer
  extensions unavailable. Inclusive 500 ms boundary still needs native evidence.
- DoorMonitor SDS16 is StandardAliasDevice; SDS15 solenoid monitor is also
  standard and lacks a matching established SAL binding. Safe lock proof absent.
- Asked user for DoorMonitor's actual PLC/wiring origin; answer pending.
- Complete table records unresolved guard/completion/access sources. Next
  timer continuity/order experiment; no constants may replace missing proof.
- Regression: 150 passed, 0 failed/skipped; existing model mutations 5/5.

## Timer producer continuity/order experiment — 2026-10-18

- Read `SafetyTests/TIMER_CONTINUITY_REPORT.md`; regenerate JSON using
  `npm run design:timers -- --write`. TIMER01–03 run synthetic native-vocabulary
  gates/TONs through SalRuntime with explicit snapshots and no fallback ports.
- Continuous Armed->Candidate and Candidate->TwoAttempt enables preserve
  qualification. Omitting first sample or ordering TON before gates adds one
  host scan. Inhibit/input loss reset timing. This is not physical target proof.
- Inclusive chord boundary/startup remain open; WithinProof is supplied, not
  derived. DoorMonitor physical-origin question still unanswered.
- Next trace PLC/project sources for DoorMonitor/lock/energy proof, then refine
  the binding table and determine which native producers are actually assemblable.
- Regression: 153 passed, 0 failed/skipped; existing model mutations 5/5.

## Context boundary

Git contains the durable project files and this handoff summary. Codex chat
history, hidden reasoning, and ephemeral agent state are not stored inside the
repository. On a new workstation, give Codex this file as the starting context.
# Действующее уточнение объёма — 2026-10-18

Пользователь поручил ограничить текущую работу проверкой программной логики.
Аппаратная конфигурация считается проверенным исходным условием; физическая
трассировка больше не выполняется и не блокирует работу. Устойчивые инструкции:
AGENTS.md; актуальный план: WORK_STATUS_AND_PLAN.md. Единый запуск из SafetyTests:
`npm run check:software`; результаты SOFTWARE_CHECK_RESULTS.md / .json.
Этот раздел имеет приоритет над историческими аппаратными gates ниже.
