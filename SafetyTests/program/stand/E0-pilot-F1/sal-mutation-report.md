# SAL mutation report

Plan: program/stand/E0-pilot-F1/sal-mutation-plan.pilot-f1.json (sha256 83f7a34fdc9591b060d9f02b56875ca50da0b9b1838f54de5d0ff849a22dc3ae)
SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3
SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104
diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603
Summary: {"KILLED":16,"STRUCTURAL-ONLY":9,"SURVIVED":0,"INVALID":0}; baseline detector tests 508 (0 not passing on unmutated copy)
Non-kill categories over all mutations: {"behavioural-assertion":221,"swcheck-behavioural-fail":34,"non-behavioural-assertion":7,"exception":0,"hook-cancel":0,"file-level":1325,"absent":0,"swcheck-structural":0,"swcheck-error":0}

Kill rule: KILLED only by (a) a concrete test ok on baseline and not ok on the mutant with an assertion failure (ERR_ASSERTION in the test or a failing nested subtest), in a file without file-level failure in that run, name in behaviouralTests; or (b) a non-BOOT software-check case PASS -> FAIL. Load/SHA pin/file-level ERR_TEST_FAILURE/timeout, non-assertion exceptions, hook/cancel, absent tests never kill (src/sal-mutation-kill.js).

| ID | guard | mutation | verdict | behavioural killers (count / first) | load/SHA/file-level ERROR | exception (non-assert) | hook/cancel | absent | non-behavioural assert | software-check structural/error |
|---|---|---|---|---|---|---|---|---|---|---|
| IL-01 | InterLock | deactivate-input //Network12/FBAnd16/AndIn1 | STRUCTURAL-ONLY | 0 | 53 | 0 | 0 | 0 | 0 | 0 |
| IL-02 | InterLock | deactivate-input //Network12/FBAnd16/AndIn3 | STRUCTURAL-ONLY | 0 | 53 | 0 | 0 | 0 | 0 | 0 |
| IL-03 | InterLock | invert-contact //Network12/FBAnd16/AndIn1 | KILLED | 69 / current-early-sto.test.js :: EARLYSTO physical green/HVHealthyfalse early N+2 fixed1 | 53 | 0 | 0 | 0 | 0 | 0 |
| IL-04 | InterLock | deactivate-input //Network2/FBAnd1/AndIn5 | STRUCTURAL-ONLY | 0 | 53 | 0 | 0 | 0 | 0 | 0 |
| IL-05 | InterLock | deactivate-input //Network2/FBAnd1/AndIn6 | STRUCTURAL-ONLY | 0 | 53 | 0 | 0 | 0 | 0 | 0 |
| IL-06 | InterLock | deactivate-input //Network6/FBAnd9/AndIn2 | STRUCTURAL-ONLY | 0 | 53 | 0 | 0 | 0 | 0 | 0 |
| IL-07 | InterLock | deactivate-input //RndPhysicalCompact/GATE_001/AndIn5 | STRUCTURAL-ONLY | 0 | 53 | 0 | 0 | 0 | 0 | 0 |
| IL-08 | InterLock | deactivate-input //Network1/FBAndLvCurrentPermit/AndIn4 | KILLED | 11 / current-early-sto.test.js :: EARLYSTO drive1/ordinary first fault in_InterLock_NC_1 fixed10 | 53 | 0 | 0 | 0 | 0 | 0 |
| ES-01 | EStop | set-channel-mode //Network1/FBEstop1/EStopIn1=Single-Channel 1 Activated | KILLED | 4 / current-estop-native-pairs.test.js :: R3PAIR actual main in_ES_NC_2 single-sample fault/recovery requires new manual Restart | 53 | 0 | 0 | 0 | 0 | 0 |
| ES-02 | EStop | set-channel-mode //Network1/FBEstop1/EStopIn1=Single-Channel 2 Activated | KILLED | 27 / current-rnd-physical-integration.test.js :: RNDPHYS safety inhibit in_ES_NC_1 blocks new physical request fixed1 | 53 | 0 | 0 | 0 | 0 | 0 |
| ES-03 | EStop | set-channel-mode //Network1/FBEstop1/EStopIn3=Single-Channel 1 Activated | KILLED | 5 / current-estop-native-pairs.test.js :: R3PAIR actual main in_Mentee_EStop single-sample fault/recovery requires new manual Restart | 53 | 0 | 0 | 0 | 0 | 0 |
| ES-04 | EStop | deactivate-input //Network1/FBAndUnlockHold/AndIn4 | KILLED | 11 / current-rnd-physical-integration.test.js :: RNDPHYS qualified blue plus in_ES_NC_1 raw restoration never unlocks without Restart fixed1 | 53 | 0 | 0 | 0 | 1 | 0 |
| ES-05 | EStop | deactivate-input //Network1/FBAndUnlockHold/AndIn1 | KILLED | 6 / current-rnd-physical-integration.test.js :: RNDPHYS qualified blue plus in_Estop_PLC raw restoration never unlocks without Restart fixed1 | 53 | 0 | 0 | 0 | 2 | 0 |
| ES-06 | EStop | deactivate-input //Network3/FBAnd1/AndIn2 | STRUCTURAL-ONLY | 0 | 53 | 0 | 0 | 0 | 0 | 0 |
| ES-07 | EStop | deactivate-input //Network5/FBAnd1/AndIn3 | STRUCTURAL-ONLY | 0 | 53 | 0 | 0 | 0 | 0 | 0 |
| ES-08 | EStop | deactivate-input //RndPhysicalCompact/GATE_001/AndIn3 | KILLED | 4 / current-rnd-physical-integration.test.js :: RNDPHYS safety inhibit in_ES_NC_1 blocks new physical request fixed1 | 53 | 0 | 0 | 0 | 0 | 0 |
| ES-09 | EStop | deactivate-input //Network1/FBAndLvCurrentPermit/AndIn8 | KILLED | 30 / current-early-sto.test.js :: EARLYSTO drive1/ordinary single-sample PLC pulse and raw restore fixed1 | 53 | 0 | 0 | 0 | 0 | 0 |
| ES-10 | EStop | deactivate-input //Network1/FBAndHvSetPermit/AndIn3 | KILLED | 2 / current-mentee-set-permit.test.js :: MENTEE05 paired HV/legacy-Network5/Menteetrue: first scan after stale request | 53 | 0 | 0 | 0 | 1 | 0 |
| UL-01 | Unlock | deactivate-input //Network1/FBAndUnlockHold/AndIn2 | KILLED | 1 / current-unlock-estop-permit.test.js :: UNLOCK07 component bluefalse/greenfalse/EStoptrue/PLCfalse | 53 | 0 | 0 | 0 | 1 | 0 |
| UL-02 | Unlock | invert-contact //Network1/FBAndUnlockHold/AndIn2 | KILLED | 33 / current-rnd-physical-integration.test.js :: RNDPHYS green full release permits a fresh single after blue cycle fixed1 | 53 | 0 | 0 | 0 | 0 | 0 |
| UL-03 | Unlock | deactivate-input //Network1/FBAndUnlockHold/AndIn3 | KILLED | 1 / current-unlock-estop-permit.test.js :: UNLOCK07 component bluetrue/greentrue/EStoptrue/PLCfalse | 53 | 0 | 0 | 0 | 1 | 0 |
| UL-04 | Unlock | deactivate-input //Network1/FBAndUnlockHold/AndIn5 | KILLED | 36 / current-rnd-physical-integration.test.js :: RNDPHYS green primary swap without sampled both-off fixed1 | 53 | 0 | 0 | 0 | 1 | 0 |
| UL-05 | Unlock | deactivate-input //Network12/FBAnd2/AndIn3 | STRUCTURAL-ONLY | 0 | 53 | 0 | 0 | 0 | 0 | 0 |
| UL-06 | Unlock | deactivate-input //Network2/FBAnd8/AndIn1 | KILLED | 10 / current-safe-run-gestures.test.js :: SR-SB-QUAL fresh Safe blue minimum500 and actual grant | 53 | 0 | 0 | 0 | 0 | 0 |
| UL-07 | Unlock | deactivate-input //Network2/FBAnd7/AndIn2 | KILLED | 5 / current-safe-run-gestures.test.js :: SR-SB-QUAL fresh Safe blue minimum500 and actual grant | 53 | 0 | 0 | 0 | 0 | 0 |

- Kills are judged only by the plan's behavioural allowlist and assertion failures; STRUCTURAL-ONLY is not a kill for G3
- Mutations are SAL attribute faults (guard term removed, polarity, channel mode, timing); they are a fault model, not native-valid edits
- Simulator semantics limits apply (program/stand/FB_SEMANTICS.md); an equivalent mutant can survive legitimately and must be argued, not assumed
