# S4-E4-r1 run summary (v2-runner, 2026-10-24)

Commands (cwd SafetyTests):
1. CATALOG_SAL_DIR=candidates/E4/native CATALOG_SYM_TRIGGER_EMG=in_Estop_PLC node --test --test-reporter=tap test/catalog/*.test.js > all.tap  (exit 1)
2. CATALOG_SYM_TRIGGER_EMG=in_Estop_PLC node --test --test-reporter=tap test/catalog/*.test.js > canon-all.tap  (canonical E3, exit 1)
3. CATALOG_SAL_DIR=candidates/E4/native npm run check:structure > structure.log  (exit 0)
4. npm test > selfchecks.log  (exit 0)

SHA256:
- candidates/E4/native/TwinSafeGroup1.sal = 4ee8d3d96da1a1b91860131fc4c1b52a017aced44408f07532e960d565307a8f (expected match)
- MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal = 9ee66e7868547d7d42fb9ed4faf9f69030a2b4e6a5c64b1b0db2787176714d1e (expected match)

Counts (TAP):
- all.tap: tests 108, pass 89, fail 13, todo 6, skipped 0, cancelled 0
- canon-all.tap: tests 108, pass 70, fail 31, todo 7, skipped 0, cancelled 0
- selfchecks.log: tests 53, pass 53, fail 0
- structure.log: all structure checks PASS (native preflight, typed binding audit, FB count <= 512, native CRC + native validation); overall PASS

## not ok in all.tap (excluding TODO), verbatim
not ok 31 - [E6] E-09 Run: C2_FBK lost after the 500 ms window with command ON -> Emergency
not ok 32 - [E6] E-10 Run->R&D: C2_FBK ON > 500 ms after C2 OFF command -> Emergency
not ok 39 - [E6] G-07 entering Config: C2_FBK not ON within 500 ms -> rollback to Safe; SafetyFault
not ok 99 - [E6] W-01 Safe->R&D: C1_FBK not ON within 500 ms -> rollback to Safe; SafetyFault
not ok 100 - [E6] W-02 StartingRun: C2_FBK not ON within 500 ms -> abort to R&D; SafetyFault
not ok 101 - [E6] W-03 StartingRun: HV normal not confirmed for 30 s (blinking) -> rollback to R&D at 30 s; SafetyFault
not ok 102 - [E6] W-04 Safe->R&D: LV normal not confirmed for 30 s -> rollback to Safe; SafetyFault
not ok 103 - [E6] W-05 StartingRun: abort, then the 500 ms window expires without FBK -> SafetyFault anyway
not ok 104 - [E5] W-06 Safe with SafetyFault: BOTH only acknowledges; new BOTH after 2 s -> step up
not ok 105 - [E5] W-07 R&D with SafetyFault: green 0.5 s -> acknowledges and descends to Safe
not ok 106 - [E5] W-08 R&D with SafetyFault: PLC command -> does not acknowledge
not ok 107 - [E5] W-09 Safe: C1_FBK ON without command -> SafetyFault; step up forbidden until FBK OFF; press while FBK ON does not acknowledge
not ok 108 - [E5] W-10 any error -> one PLC Fault bit = PLC command error OR SafetyFault

## Tests ok in canon-all.tap but not ok in all.tap
Count: 0 (empty set)

## [M] rows
- all.tap: 19 [M] rows, all ok (M-01..M-12, M-B1, M-B2, M-T1..M-T5)
- canon-all.tap: 19 [M] rows, all ok

## Notes
- not-ok counts: all.tap 13 unique names; canon-all.tap 31 not ok lines (vs 31 fail counted by TAP).
