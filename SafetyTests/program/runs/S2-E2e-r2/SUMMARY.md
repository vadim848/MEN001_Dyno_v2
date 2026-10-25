# S2-E2e-r2 (v2-runner)

SHA256 candidates/E2e/native/TwinSafeGroup1.sal: 67336d9b42aed3c14925dfbfec3e4e7533c4bf96b0d0183a13cea31ea785dd39 (matches expected)

## Commands (cwd SafetyTests)
1. CATALOG_SAL_DIR=candidates/E2e/native CATALOG_STAGES=E2 node --test --test-reporter=tap test/catalog/*.test.js > program/runs/S2-E2e-r2/e2.tap  -> exit 0 (e2.exit)
2. CATALOG_SAL_DIR=candidates/E2e/native node --test ... > all.tap  -> exit 1 (all.exit)
3. CATALOG_SAL_DIR=candidates/E2e/native npm run check:structure > structure.log  -> exit 0 (structure.exit)
4. npm test > selfchecks.log  -> exit 0

## Counts (TAP summary)
| run | tests | pass | fail | skipped | todo |
|---|---|---|---|---|---|
| e2 (E2 stage) | 101 | 50 | 0 | 48 | 3 |
| all | 101 | 55 | 42 | 0 | 4 |
| r1 all (ref) | 101 | 54 | 43 | 0 | 4 |
| selfchecks | 53 | 53 | 0 | 0 | 0 |
structure: PASS (native preflight, typed binding audit, FB count<=512, native CRC + native validation)

## [M] mutation tests (all stage)
Passed (killed): M-01..M-12 (12/12 ok); M-12 carries '# TODO NOT ASSESSABLE'. Skipped: none in all stage (48 skipped only in E2 stage run).

## not ok in all stage (verbatim)
not ok 9 - [E3] C-06 normal Run->R&D (in SS1): NC1 FALSE -> descent continues to R&D
not ok 10 - [E3] C-07 abort StartingRun / protective descent: NC1 FALSE -> Emergency
not ok 14 - [E3] D-01 Run: green 0.5 s -> STO at 2 s; HV discharge command at 7 s; hold; C2 OFF; R&D after C2_FBK OFF
not ok 15 - [E3] D-02 Run->R&D: strict order STO < Discharge < C2 OFF, nothing simultaneous
not ok 16 - [E3] D-03 StartingRun: green 0.5 s -> abort: STO + Discharge at once, hold, C2 OFF, R&D; no SS1/coast
not ok 18 - [E3] D-05 Run->R&D in SS1: green again -> ignored
not ok 22 - [E3] D-09 StartingRun: LV Healthy lost -> abort to R&D, then R&D->Safe
not ok 31 - [E6] E-09 Run: C2_FBK lost after the 500 ms window with command ON -> Emergency
not ok 32 - [E6] E-10 Run->R&D: C2_FBK ON > 500 ms after C2 OFF command -> Emergency
not ok 33 - [E4] G-01 Safe, cover closed: Bypass edge -> Config: C1+C2 ON, STO held, Unlock forbidden
not ok 34 - [E4] G-02 R&D / Safe with open cover / Bypass held from before -> Bypass ignored
not ok 35 - [E4] G-03 Config: any buttons / PLC commands ignored; no 10 s timer
not ok 36 - [E4] G-04 Config: Bypass removed -> Discharge -> hold -> C1/C2 OFF -> Safe
not ok 37 - [E4] G-05 Config / Config exit: NC1 / EStop / connector -> Emergency
not ok 38 - [E4] G-06 Config: Healthy lost -> ignored
not ok 39 - [E6] G-07 entering Config: C2_FBK not ON within 500 ms -> rollback to Safe; SafetyFault
not ok 41 - [E3] H-02 Run: HV Faulty TRUE -> immediate STO, coast 5 s, Discharge, C2 OFF, R&D; SafetyFault
not ok 42 - [E3] H-03 Run: LV Faulty TRUE -> as H-02, then R&D->Safe; SafetyFault
not ok 45 - [E3] H-06 Run->R&D in SS1: LV Faulty TRUE -> immediate STO; then R&D->Safe; SafetyFault
not ok 46 - [E3] H-07 Run->R&D after STO: LV Faulty TRUE then back -> stop unchanged; R&D->Safe anyway
not ok 71 - [E4] P-01 Safe: edge CMD_SAFE_TO_R&D -> as BOTH (cover may be open)
not ok 72 - [E4] P-02 R&D, cover open: edge CMD_R&D_TO_RUN -> not executed
not ok 73 - [E4] P-03 Run: edge CMD_RUN_TO_R&D -> as green (D-01)
not ok 74 - [E4] P-04 StartingRun: edge CMD_RUN_TO_R&D -> abort (as D-03)
not ok 75 - [E4] P-05 Safe->R&D: edge CMD_R&D_TO_SAFE -> abort to Safe
not ok 76 - [E4] P-06 Safe->R&D: CMD_R&D_TO_RUN held until R&D -> not executed (new edge needed)
not ok 77 - [E4] P-07 R&D: two commands TRUE (incl. different edges) -> error, none executed; cleared after all FALSE 1 s
not ok 78 - [E4] P-08 any state with PLC error: CMD_TRIGGER_EMERGENCY -> Emergency
not ok 79 - [E4] P-09 R&D, green pressed 200 ms: command edge -> ignored and not deferred
not ok 80 - [E4] P-10 PLC error active: BOTH by buttons -> executed
not ok 81 - [E4] P-11 any state: heartbeat stopped 3 s -> Emergency
not ok 82 - [E4] P-12 STS_COVER_LOCKED = NC1&NC2; outPLC_RnD TRUE in StartingRun/abort, FALSE in Safe->R&D
not ok 92 - [E6] W-01 Safe->R&D: C1_FBK not ON within 500 ms -> rollback to Safe; SafetyFault
not ok 93 - [E6] W-02 StartingRun: C2_FBK not ON within 500 ms -> abort to R&D; SafetyFault
not ok 94 - [E6] W-03 StartingRun: HV normal not confirmed for 30 s (blinking) -> rollback to R&D at 30 s; SafetyFault
not ok 95 - [E6] W-04 Safe->R&D: LV normal not confirmed for 30 s -> rollback to Safe; SafetyFault
not ok 96 - [E6] W-05 StartingRun: abort, then the 500 ms window expires without FBK -> SafetyFault anyway
not ok 97 - [E5] W-06 Safe with SafetyFault: BOTH only acknowledges; new BOTH after 2 s -> step up
not ok 98 - [E5] W-07 R&D with SafetyFault: green 0.5 s -> acknowledges and descends to Safe
not ok 99 - [E5] W-08 R&D with SafetyFault: PLC command -> does not acknowledge
not ok 100 - [E5] W-09 Safe: C1_FBK ON without command -> SafetyFault; step up forbidden until FBK OFF; press while FBK ON does not acknowledge
not ok 101 - [E5] W-10 any error -> one PLC Fault bit = PLC command error OR SafetyFault

## Diff vs r1 (passed in r1, not in r2): none
Passed in r2, not in r1: [E2] D-04 Safe->R&D (C1 ON): green 0.5 s -> abort to Safe: C1 OFF, C1_FBK OFF

## Passing test IDs, all stage (ok; # TODO annotations kept)
[E7] B-01 group start -> Emergency; no energy
[E7] B-02 start with buttons pressed: release, then BOTH -> step up only after 2 s pause
[E7] B-03 restart from Run / transition: Restart -> only Safe, Run not restored
[E2] C-01 Safe, cover open: BOTH -> Safe->R&D executes
[E2] C-02 R&D, cover open: BOTH -> no R&D->Run, no fault
[E2] C-03 Safe / R&D: NC1 FALSE -> not Emergency; R&D->Run forbidden
[E2] C-04 Run: NC2 FALSE -> Emergency
[E2] C-05 StartingRun: NC1 FALSE -> Emergency
[E2] C-08 Safe: LV connector FALSE, then BOTH -> no step up, no fault
[E2] C-09 R&D / Run: HV connector FALSE -> Emergency
[E2] C-10 Safe: Door_Monitor FALSE, blue 0.6 s -> no Unlock
[E2] D-04 Safe->R&D (C1 ON): green 0.5 s -> abort to Safe: C1 OFF, C1_FBK OFF
[E2] D-06 R&D: green 0.5 s -> C1 OFF; Safe after C1_FBK OFF
[E3] D-07 Run->R&D: HV discharge held as a level until the next accepted HV step up
[E2] D-08 Run->R&D waiting C2 OFF: LV lost, C2_FBK OFF 2 scans later -> exactly R&D, then chained R&D->Safe
[E2] E-01 Run: EStop NC1 -> Emergency; STO, C2 OFF, C1 OFF by the emergency chain
[E2] E-02 R&D: in_Estop_PLC -> Emergency; C3/BMS OFF + LV discharge at once, C1 OFF after 2 s
[E2] E-03 Safe->R&D (C1 ON, not confirmed): Mentee -> Emergency; lift stopped, C1 OFF after 2 s
[E2] E-04 Emergency by PLC: cause removed, green -> only Safe
[E2] E-05 Emergency, cause still active, green -> stays Emergency
[E2] E-06 group start with C1_FBK ON: Restart -> not Safe
[E3] E-07 normal Run->R&D, EStop at t+1 s: each step (STO, Discharge, C2 OFF) not later than normal
[E2] E-08 no two main states at once / none -> Emergency (invariant over a full lifecycle) # TODO NOT VERIFIED: reaction "two/none main states -> Emergency" cannot be provoked through real inputs (catalog rule 1); covered only by the per-scan invariant
[E2] H-01 raw in_LV_Faulty_FBK FALSE = normal, TRUE = loss (same everywhere)
[E2] H-04 R&D: HV Faulty TRUE / FALSE -> ignored
[E2] H-05 R&D: LV Faulty TRUE -> R&D->Safe; SafetyFault # TODO NOT VERIFIED: SafetyFault HealthyLost [Q-RC-11]: SafetyFault not observable on target (no symbol; introduced in E5)
[HDR] catalog target identity
[E2] K-01 Safe: BOTH (second after 200 ms), hold 1 s -> Safe->R&D starts
[E2] K-02 Safe: second button after 300 ms -> no step up, no fault
[E2] K-03 Safe: BOTH, release one after 0.8 s -> nothing (no single, no step up)
[E2] K-04 R&D: green 0.4 s -> nothing; green 0.6 s -> R&D->Safe
[E2] K-05 R&D: green, blue exactly 500 ms later -> only down, no step up
[E2] K-06 R&D: green, blue 300 ms later (before acceptance) -> nothing, no fault
[E2] K-07 BOTH held without release -> exactly one step up
[E2] K-08 Safe: BOTH, release; new BOTH 1.5 s / 2.5 s after release -> 1.5 no, 2.5 yes
[E2] K-09 Safe: permit lost 300 ms with buttons released, BOTH 2.1 s after release -> accepted
[E2] K-10 Run: BOTH -> ignored
[E2] K-11 blue 0.6 s: Unlock in Safe and R&D (cover closed / open); not in Run/Config/Emergency # TODO NOT VERIFIED: Config sub-case: Config state not published by target (introduced in E4)
[M] M-01 EStop NC1/NC2 condition removed (all consumers read OK) (killing scenario E-01)
[M] M-02 in_Estop_PLC condition removed (all consumers read FALSE) (killing scenario E-02)
[M] M-03 NC1&NC2 removed from the HV step up (recognizer, spoil, C2/STO set permits) (killing scenario C-02)
[M] M-04 cover (NC) removed from the Run guards (emergency and Run hold) (killing scenario C-04)
[M] M-05 LV/HV connector condition removed (all consumers read OK) (killing scenario C-09)
[M] M-06 STO released without an accepted step up (lift term removed from STO set) (killing scenario U-03)
[M] M-07 C2 ON without an accepted step up (lift term removed from C2 set) (killing scenario U-03)
[M] M-08 Unlock stage term removed (Unlock no longer restricted to Safe/R&D) (killing scenario K-11)
[M] M-09 emergency no longer clears Run / R&D (Restart not only into Safe) (killing scenario E-04)
[M] M-10 Run confirmation without the C2 window and C2_FBK (killing scenario U-04)
[M] M-11 LV Faulty polarity inverted at every guard consumer (killing scenario H-01)
[M] M-12 DOWN order STO<Discharge<C2 OFF removed (killing scenario D-02) # TODO NOT ASSESSABLE: killing scenario D-02 FAILs on the unmutated target (2 check(s))
[E2] U-01 Safe: BOTH; C1_FBK after 50 ms -> R&D not before C1 command + 500 + 100 ms
[E2] U-02 Safe: BOTH -> LV discharge removed at acceptance
[E2] U-03 R&D: BOTH -> at acceptance C2 ON, STO released, HV discharge removed
[E2] U-04 StartingRun: C2_FBK + HV normal -> Run not before command + 600 ms
[E2] U-05 StartingRun: HV normal drops 30 ms after the window -> 100 ms count restarts, no emergency
[E2] U-06 Safe: LV Faulty before the gesture, BOTH -> Safe->R&D starts
[E2] U-07 BOTH started during Safe->R&D / StartingRun is not executed after arrival
[E2] U-08 R&D: legacy PLC (1,1) -> no R&D->Run
[E2] U-09 Safe: connector lost between first and second button -> gesture rejected
