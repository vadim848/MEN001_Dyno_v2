# Результаты программных проверок

Дата: 2026-10-22T14:19:05.893Z
SAL SHA256: 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3

Clock: observed-fixed-scan-v1; first observed edge age0; fixed scan per scenario. Generic runFor durations describe scheduled scan advance, not an implicit event timestamp.

Аппаратная конфигурация принята как исходное условие. Файлы проекта не изменяются этим запуском.

- harness: PASS; 284/284, ошибок 0, пропусков 0.
- historical: PASS; 75/75, ошибок 0, пропусков 0.
- current: FAIL; 598/1638, ошибок 969, пропусков 0.
- Текущий код: {"PASS":199,"FAIL":1,"NOT VERIFIED":7,"ERROR":0,"NOT APPLICABLE":0}.

## Сверка ID кейсов с базой (исчезнувшие/новые/изменившие статус)

Baseline: canonical F1 (checkpoint 0391fae) SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 (93aa3d81774d); cases 207 -> 207; missing 0, new 0, status changed 0, duplicate IDs 0.

## Сверка имён тестов по стадиям с базой (исчезнувшие тесты)

Baseline: canonical F1 (checkpoint 0391fae) SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 (f75461bb30fb).
- harness: tests 228 -> 284; missing 1, new 57, status changed 0.
  - MISSING S14: unwritten observed phase Symbol makes STATE and PRIORITY cases ERROR, not PASS
- historical: tests 75 -> 75; missing 0, new 0, status changed 0.
- current: tests 845 -> 1638; missing 33, new 826, status changed 7.
  - MISSING E2a RUN-CONF natural: C2_FBK ON one scan after the command, HV healthy: no Run <= u+99, Run at k+101, not at k+99
  - MISSING E2a RUN-CONF C2_FBK delayed 400 ms (HV healthy): no Run while C2_FBK OFF; then Run at k+101, not at k+99
  - MISSING E2a RUN-CONF drives STO FBK pinned to "STO active" (in_STO_DRx_FBK TRUE): Run still confirmed at k+101 (RC-4: STO FBK not required)
  - MISSING E2a RUN-CONF RC-6 HV Faulty TRUE for 1 scan at k+50 (before Run): count restarts - no Run <= (k+51)+99, Run at (k+51)+101, no Emergency (Q-RC-RUNCONF-01 "В")
  - MISSING E2a RUN-CONF RC-7 (FBK-03) C2_FBK FALSE 1 scan at t_f+1 with the C2 command kept, before Run: Emergency (rule L1 vs in_Estop_PLC), Run never, Restart -> only Safe
  - MISSING E2a RUN-CONF RC-7 (FBK-03) C2_FBK FALSE 1 scan at t_f+50 with the C2 command kept, before Run: Emergency (rule L1 vs in_Estop_PLC), Run never, Restart -> only Safe
  - MISSING E2b EMG4-03 boundary: LV connector FALSE in u-1 (one scan before Safe->R&D acceptance) -> EMG-003: UP rejected, no Emergency
  - MISSING E2b EMG4-03 boundary: HV connector FALSE in u-1 (one scan before Safe->R&D acceptance) -> EMG-003: UP rejected, no Emergency
  - MISSING E2d IL-02 boundary NC1 FALSE in N=u-1 (UP qualifies in N+1): UP rejected - no C2 ON / STO release, R&D and LV kept, no Emergency; not executed after the cover closes
  - MISSING E2d IL-02/IL-05a boundary N=c=u (NC1 FALSE in the UP acceptance scan): normative disjunction - (i) UP rejected, R&D, no Emergency, or (ii) Emergency by rule L with EMGREF-RUN; never Run
  - MISSING E2d IL-02/IL-05a boundary N=c=u (both FALSE in the UP acceptance scan): normative disjunction - (i) UP rejected, R&D, no Emergency, or (ii) Emergency by rule L with EMGREF-RUN; never Run
  - MISSING E2b IL-05b boundary: NC1 FALSE in t_a-1 (before the down is accepted) -> IL-03 Emergency (rule L vs in_Estop_PLC), no normal R&D, Restart -> only Safe
  - MISSING E2b IL-05d(1) StartingRun (HV Faulty TRUE holds it) aborted by green 600 ms, NC1 FALSE 100 ms after the abort -> Emergency (rule L vs in_Estop_PLC in the same phase), Restart -> only Safe
  - MISSING E2c STP-I green 600 ms pressed during the abort (c=u+50, press c+10): not executed - C1 not dropped before C2_FBK OFF
  - MISSING EARLYSTO physical green/HVHealthyfalse early N+2 fixed1
  - MISSING EARLYSTO physical green/HVHealthytrue early N+2 fixed1
  - MISSING EARLYSTO physical blue/HVHealthyfalse early N+2 fixed1
  - MISSING EARLYSTO physical blue/HVHealthytrue early N+2 fixed1
  - MISSING EARLYSTO physical green/HVHealthyfalse early N+2 fixed2
  - MISSING EARLYSTO physical green/HVHealthytrue early N+2 fixed2
  - MISSING EARLYSTO physical blue/HVHealthyfalse early N+2 fixed2
  - MISSING EARLYSTO physical blue/HVHealthytrue early N+2 fixed2
  - MISSING EARLYSTO physical green/HVHealthyfalse early N+2 fixed5
  - MISSING EARLYSTO physical green/HVHealthytrue early N+2 fixed5
  - MISSING EARLYSTO physical blue/HVHealthyfalse early N+2 fixed5
  - MISSING EARLYSTO physical blue/HVHealthytrue early N+2 fixed5
  - MISSING EARLYSTO physical green/HVHealthyfalse early N+2 fixed10
  - MISSING EARLYSTO physical green/HVHealthytrue early N+2 fixed10
  - MISSING EARLYSTO physical blue/HVHealthyfalse early N+2 fixed10
  - MISSING EARLYSTO physical blue/HVHealthytrue early N+2 fixed10
  - MISSING B1 V2 physical aliases and required wires preserved through exact logical consumer delta
  - MISSING B1 LV254 SGVL declarations and all source indices unchanged through exact composed target delta
  - MISSING PLC V2 native producer96, preserved contacts and exact whole graph fanout

## Объяснение дельт (MISSING / NOT APPLICABLE) файлом ожидаемых дельт

Expected deltas: C:\Users\user\source\repos\MEN001_Dyno_v2\SafetyTests\fixtures\case-baselines\expected-deltas\04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3.json (f3a077670391), approval APPROVED by lead (main session).
Deltas 34: explained 34, unexplained 0, stale expectations 0.
- EXPLAINED test-missing [harness] S14: unwritten observed phase Symbol makes STATE and PRIORITY cases ERROR, not PASS: Stand self-test (test/stand-case-guards.test.js) renamed to 'S14/D1: removed phase Symbol is observed at its state RS output, not turned into ERROR or vacuous PASS': lead decision 1 (E2-R1-stand-2) replaces the Symbol observation rule it asserted. Not a SAL/requirement test.
- EXPLAINED test-missing [current] E2a RUN-CONF natural: C2_FBK ON one scan after the command, HV healthy: no Run <= u+99, Run at k+101, not at k+99: Renamed to 'E2a RUN-CONF RC-5 (i) natural: …: no Run <= u+599, Run at u+601 …': oracle replaced by CRITERIA_DELTA v7 §4.1 (Q-V4-01 'Б', question 68 'Б': FBK window 500 ms + 100 ms). Test file current-e2a-run-conf.test.js (G1 v5).
- EXPLAINED test-missing [current] E2a RUN-CONF C2_FBK delayed 400 ms (HV healthy): no Run while C2_FBK OFF; then Run at k+101, not at k+99: Renamed to 'E2a RUN-CONF RC-5 (iii) C2_FBK delayed 400 ms (ON from u+400): no Run <= u+599, Run at u+601 …' (v7 §4.1: K = u+500).
- EXPLAINED test-missing [current] E2a RUN-CONF drives STO FBK pinned to "STO active" (in_STO_DRx_FBK TRUE): Run still confirmed at k+101 (RC-4: STO FBK not required): Renamed to 'E2a RUN-CONF RC-4 … Run at K+101 = u+601 …' (v7 §4.1 RC-4).
- EXPLAINED test-missing [current] E2a RUN-CONF RC-6 HV Faulty TRUE for 1 scan at k+50 (before Run): count restarts - no Run <= (k+51)+99, Run at (k+51)+101, no Emergency (Q-RC-RUNCONF-01 "В"): v7 §4.1 RC-6: k+50 = u+51 now lies inside the 500 ms window (count not affected, Run u+601) - renamed 'E2a RUN-CONF RC-6 (v7) HV Faulty TRUE 1 scan at u+51 (inside the window) …'; the after-window case is the new 'u+550' test.
- EXPLAINED test-missing [current] E2a RUN-CONF RC-7 (FBK-03) C2_FBK FALSE 1 scan at t_f+1 with the C2 command kept, before Run: Emergency (rule L1 vs in_Estop_PLC), Run never, Restart -> only Safe: Oracle inverted by Q-V4-01 'Б' (v7 §4.1 RC-7): a drop inside the window is not an emergency - renamed 'E2a RUN-CONF RC-7 (v7) C2_FBK FALSE 1 scan at t_f+1 inside the 500 ms window …: not an emergency, no rollback, Run at u+601'.
- EXPLAINED test-missing [current] E2a RUN-CONF RC-7 (FBK-03) C2_FBK FALSE 1 scan at t_f+50 with the C2 command kept, before Run: Emergency (rule L1 vs in_Estop_PLC), Run never, Restart -> only Safe: As t_f+1: renamed '… at t_f+50 inside the 500 ms window …: not an emergency …'; Emergency now at u+502/u+550/u+599 (new tests).
- EXPLAINED test-missing [current] E2b EMG4-03 boundary: LV connector FALSE in u-1 (one scan before Safe->R&D acceptance) -> EMG-003: UP rejected, no Emergency: TD-08 (analyst E2b-dev §1.4): boundary moved to A-1 (A = first b_Step12 or C1 ON scan); renamed 'E2b EMG4-03 boundary: LV connector FALSE in A-1 (one scan before the first Safe->R&D acceptance sign, TD-08) -> EMG-003: UP rejected, no S12, no Emergency' (stricter). PASS on F1.
- EXPLAINED test-missing [current] E2b EMG4-03 boundary: HV connector FALSE in u-1 (one scan before Safe->R&D acceptance) -> EMG-003: UP rejected, no Emergency: TD-08: as the LV row; renamed '… HV connector FALSE in A-1 …'. PASS on F1.
- EXPLAINED test-missing [current] E2d IL-02 boundary NC1 FALSE in N=u-1 (UP qualifies in N+1): UP rejected - no C2 ON / STO release, R&D and LV kept, no Emergency; not executed after the cover closes: TD-08 (analyst E2b-dev §1.3/§1.5): refusal boundary moved to c=A-1; renamed 'E2d IL-02 boundary NC1 FALSE in c=A-1 (A = first acceptance sign, TD-08): …'. Oracle unchanged; F1 coverage FAIL before and after.
- EXPLAINED test-missing [current] E2d IL-02/IL-05a boundary N=c=u (NC1 FALSE in the UP acceptance scan): normative disjunction - (i) UP rejected, R&D, no Emergency, or (ii) Emergency by rule L with EMGREF-RUN; never Run: TD-08 (analyst E2b-dev §1.3): the disjunction moved to c=A; renamed 'E2d IL-02/IL-05a boundary c=A (NC1 FALSE in the first acceptance-sign scan, TD-08): …'. Logic unchanged; F1 coverage FAIL before and after.
- EXPLAINED test-missing [current] E2d IL-02/IL-05a boundary N=c=u (both FALSE in the UP acceptance scan): normative disjunction - (i) UP rejected, R&D, no Emergency, or (ii) Emergency by rule L with EMGREF-RUN; never Run: TD-08: as the NC1 row; renamed '… c=A (both FALSE …)'.
- EXPLAINED test-missing [current] E2b IL-05b boundary: NC1 FALSE in t_a-1 (before the down is accepted) -> IL-03 Emergency (rule L vs in_Estop_PLC), no normal R&D, Restart -> only Safe: TEAM-DEFAULT TD-09 (analyst E2-v73-q §1.3): t_a = linkRunDownOwner; renamed 'E2b IL-05b boundary: NC1 FALSE in t_a-1 (t_a = linkRunDownOwner, TD-09; before the down is accepted) -> IL-03 Emergency (rule L vs in_Estop_PLC), no normal R&D, Restart -> only Safe' (+ NC2, both rows). Oracle unchanged; on F1 FAIL (Run unreachable; without the marker the test is ERROR by TD-09) before and after.
- EXPLAINED test-missing [current] E2b IL-05d(1) StartingRun (HV Faulty TRUE holds it) aborted by green 600 ms, NC1 FALSE 100 ms after the abort -> Emergency (rule L vs in_Estop_PLC in the same phase), Restart -> only Safe: Review G1 v7 N17 / analyst E2-G1-v7-q §1/§4: the abort green 200 ms after the BOTH release is invalid (full 2 s clearing required); stimulus pause 2100 ms, renamed 'E2b IL-05d(1) StartingRun (HV Faulty TRUE holds it) aborted by green 600 ms after a 2100 ms full clearing, NC1 FALSE 100 ms after the abort -> Emergency (rule L vs in_Estop_PLC in the same phase), Restart -> only Safe'. Oracle unchanged; F1 coverage FAIL before and after.
- EXPLAINED test-missing [current] E2c STP-I green 600 ms pressed during the abort (c=u+50, press c+10): not executed - C1 not dropped before C2_FBK OFF: Review G1 v7 N17 / analyst E2-G1-v7-q §4: rename only - the stimulus is the BOTH remainder, not a fresh green; new name 'E2c STP-I BOTH remainder during the abort (c=u+50): blue released at c+10, green kept from the BOTH gesture (not a fresh green) -> not executed - C1 not dropped before C2_FBK OFF'. Stimulus/oracle unchanged; F1 coverage FAIL before and after.
- EXPLAINED test-missing [current] EARLYSTO physical green/HVHealthyfalse early N+2 fixed1: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical green/HVHealthyfalse early N+2 DIS-HOLD fixed1' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical green/HVHealthytrue early N+2 fixed1: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical green/HVHealthytrue early N+2 DIS-HOLD fixed1' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical blue/HVHealthyfalse early N+2 fixed1: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical blue/HVHealthyfalse early N+2 DIS-HOLD fixed1' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical blue/HVHealthytrue early N+2 fixed1: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical blue/HVHealthytrue early N+2 DIS-HOLD fixed1' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical green/HVHealthyfalse early N+2 fixed2: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical green/HVHealthyfalse early N+2 DIS-HOLD fixed2' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical green/HVHealthytrue early N+2 fixed2: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical green/HVHealthytrue early N+2 DIS-HOLD fixed2' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical blue/HVHealthyfalse early N+2 fixed2: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical blue/HVHealthyfalse early N+2 DIS-HOLD fixed2' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical blue/HVHealthytrue early N+2 fixed2: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical blue/HVHealthytrue early N+2 DIS-HOLD fixed2' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical green/HVHealthyfalse early N+2 fixed5: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical green/HVHealthyfalse early N+2 DIS-HOLD fixed5' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical green/HVHealthytrue early N+2 fixed5: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical green/HVHealthytrue early N+2 DIS-HOLD fixed5' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical blue/HVHealthyfalse early N+2 fixed5: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical blue/HVHealthyfalse early N+2 DIS-HOLD fixed5' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical blue/HVHealthytrue early N+2 fixed5: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical blue/HVHealthytrue early N+2 DIS-HOLD fixed5' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical green/HVHealthyfalse early N+2 fixed10: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical green/HVHealthyfalse early N+2 DIS-HOLD fixed10' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical green/HVHealthytrue early N+2 fixed10: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical green/HVHealthytrue early N+2 DIS-HOLD fixed10' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical blue/HVHealthyfalse early N+2 fixed10: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical blue/HVHealthyfalse early N+2 DIS-HOLD fixed10' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] EARLYSTO physical blue/HVHealthytrue early N+2 fixed10: pass → заменён проверкой DIS-HOLD-HV (вопрос 73 «А»), новый тест на F1 fail. Renamed to 'EARLYSTO physical blue/HVHealthytrue early N+2 DIS-HOLD fixed10' (R6-5; Q-V7-01 «Г»; tester HANDOFF_v6, reviewer G1 v6 §3).
- EXPLAINED test-missing [current] B1 V2 physical aliases and required wires preserved through exact logical consumer delta: F1-identity-only test (V2.aliases/V2.wires assert the canonical F1 SHA) moved verbatim to test/current-v2-identity.test.js as 'V2ID moved from B1 "V2 physical aliases and required wires preserved through exact logical consumer delta"' (S2 identity split, lead 2026-10-22, stand expected-deltas-F1-v3 §5). Passes on F1 under the new name.
- EXPLAINED test-missing [current] B1 LV254 SGVL declarations and all source indices unchanged through exact composed target delta: F1-identity-only test (V2.sgvl) moved verbatim to current-v2-identity.test.js as 'V2ID moved from B1 "LV254 SGVL declarations and all source indices unchanged through exact composed target delta"' (S2 split). Passes on F1.
- EXPLAINED test-missing [current] PLC V2 native producer96, preserved contacts and exact whole graph fanout: F1-identity-only test (V2.plc) moved verbatim to current-v2-identity.test.js as 'V2ID moved from "PLC V2 native producer96, preserved contacts and exact whole graph fanout"' (S2 split). Passes on F1.

## Объявленные замены кейсов (A4-3; только из утверждённого файла дельт)

Declared replacements: none for this SAL.

## NOT APPLICABLE (структурно удалённые фазы или утверждённая замена; не PASS)


PASS относится только к указанному компоненту/сценарию. Прототипы и исторические воспроизведения не являются приёмкой текущего SAL.

Reference: https://github.com/vadim848/MEN001_Dyno.git, Prodoction, 4495a1f6049f6a58ebfd436761faa84d17c8d643.

Сохраняется проверенный контракт EStop компонента; R&D задаётся требованиями v2, а не reference.
Контрпримеры PRIORITY условны: фазы установлены тестом, Network4 исключён, fallback FALSE/TRUE указан в ID. Число FAIL не равно числу независимых доказанных дефектов системы.
BUTTON/STATE проверяют границу отдельной ветви: внутренний запрос вверх не равен фактическому включению энергии; upstream/downstream разрешения требуют отдельных проверок.

## Найденные несоответствия

- STATE:conflicting-set-requests: {"label":"conflicting requests cannot report simultaneous Safe and Run","actual":true,"expected":false}.

## Пробелы и ошибки

- ACC-B01: Complete recognizer/reset ownership is not yet bound across Safe/R&D/Run
- ACC-C02-F: Full-phase coverage of both InterLock NC energy guards and separate DoorMonitor solenoid reactions remains incomplete; no locked-feedback gate is required
- ACC-C01-E: Software coverage of all transition phases and fault/button combinations remains incomplete
- LATE:NO-FAULT: Network12 component has no bound complete group/fault observation; absence of a parsed Error is not proof of no fault
- LATE:NO-ROLLBACK: Single request producer is observable, but accepted transition/event ownership and downstream rollback are not bound in this component; no fake latched marker used
- BOOT:UNSUPPORTED_UNBOUND_PROGRAM_INPUT: Network4 has eight unbound DECOUPLE inputs and seven used phase writers; native unbound values are not established
- BOOT:UNSUPPORTED_GROUP_LIFECYCLE: RunStop/ErrAck are declared and bound, but the adapter has no group lifecycle/memory/error engine; requested Run and main EStop Restart do not establish group RUN/ErrAck
- UNSUPPORTED_UNBOUND_PROGRAM_INPUT: Network4 has eight unbound DECOUPLE inputs and seven used phase writers; native unbound values are not established
- UNSUPPORTED_GROUP_LIFECYCLE: RunStop/ErrAck are declared and bound, but the adapter has no group lifecycle/memory/error engine; requested Run and main EStop Restart do not establish group RUN/ErrAck
- Full upstream transition permission/completion coverage incomplete
- Full-phase coverage of two InterLock NC energy guards and separate DoorMonitor solenoid conditions remains incomplete; no separate locked-feedback gate required
- Energy completion/timeout behavior requires explicit software expectations where not specified

Подробные наблюдения, исходные условия и допущения: SOFTWARE_CHECK_RESULTS.json.
