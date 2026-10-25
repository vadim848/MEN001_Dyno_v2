# SAL mutation report

Plan: program/stand/E0-stand/sal-mutation-plan.pilot.json (sha256 3da26e6b759371921da7ed9eada498f41bdde8065924a11cbe2060239056bd34)
SAL 34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b
SGVL 517fdadd913007aa2690f1402676583ad16141c9ae64cb986554c87c10f22635
diagram 7b5eb79439011cdf9a3206aa815dec4349a35cf8155bfac7492b7ffd75e578ce
Summary: {"KILLED":16,"STRUCTURAL-ONLY":9,"SURVIVED":0,"INVALID":0}; baseline detector tests 512 (2 not passing on unmutated copy)

| ID | guard | mutation | verdict | behavioural killers (count / first) | structural/load-only |
|---|---|---|---|---|---|
| IL-01 | InterLock | deactivate-input //Network12/FBAnd16/AndIn1 | STRUCTURAL-ONLY | 0 | 49 |
| IL-02 | InterLock | deactivate-input //Network12/FBAnd16/AndIn3 | STRUCTURAL-ONLY | 0 | 49 |
| IL-03 | InterLock | invert-contact //Network12/FBAnd16/AndIn1 | KILLED | 69 / current-early-sto.test.js :: EARLYSTO physical green/HVHealthyfalse early N+2 fixed1 | 49 |
| IL-04 | InterLock | deactivate-input //Network2/FBAnd1/AndIn5 | STRUCTURAL-ONLY | 0 | 49 |
| IL-05 | InterLock | deactivate-input //Network2/FBAnd1/AndIn6 | STRUCTURAL-ONLY | 0 | 49 |
| IL-06 | InterLock | deactivate-input //Network6/FBAnd9/AndIn2 | STRUCTURAL-ONLY | 0 | 49 |
| IL-07 | InterLock | deactivate-input //RndPhysicalCompact/GATE_001/AndIn5 | STRUCTURAL-ONLY | 0 | 49 |
| IL-08 | InterLock | deactivate-input //Network1/FBAndLvCurrentPermit/AndIn4 | KILLED | 11 / current-early-sto.test.js :: EARLYSTO drive1/ordinary first fault in_InterLock_NC_1 fixed10 | 49 |
| ES-01 | EStop | set-channel-mode //Network1/FBEstop1/EStopIn1=Single-Channel 1 Activated | KILLED | 4 / current-estop-native-pairs.test.js :: R3PAIR actual main in_ES_NC_2 single-sample fault/recovery requires new manual Restart | 49 |
| ES-02 | EStop | set-channel-mode //Network1/FBEstop1/EStopIn1=Single-Channel 2 Activated | KILLED | 27 / current-rnd-physical-integration.test.js :: RNDPHYS safety inhibit in_ES_NC_1 blocks new physical request fixed1 | 49 |
| ES-03 | EStop | set-channel-mode //Network1/FBEstop1/EStopIn3=Single-Channel 1 Activated | KILLED | 5 / current-estop-native-pairs.test.js :: R3PAIR actual main in_Mentee_EStop single-sample fault/recovery requires new manual Restart | 49 |
| ES-04 | EStop | deactivate-input //Network1/FBAndUnlockHold/AndIn4 | KILLED | 11 / current-rnd-physical-integration.test.js :: RNDPHYS qualified blue plus in_ES_NC_1 raw restoration never unlocks without Restart fixed1 | 50 |
| ES-05 | EStop | deactivate-input //Network1/FBAndUnlockHold/AndIn1 | KILLED | 6 / current-rnd-physical-integration.test.js :: RNDPHYS qualified blue plus in_Estop_PLC raw restoration never unlocks without Restart fixed1 | 51 |
| ES-06 | EStop | deactivate-input //Network3/FBAnd1/AndIn2 | STRUCTURAL-ONLY | 0 | 49 |
| ES-07 | EStop | deactivate-input //Network5/FBAnd1/AndIn3 | STRUCTURAL-ONLY | 0 | 49 |
| ES-08 | EStop | deactivate-input //RndPhysicalCompact/GATE_001/AndIn3 | KILLED | 4 / current-rnd-physical-integration.test.js :: RNDPHYS safety inhibit in_ES_NC_1 blocks new physical request fixed1 | 49 |
| ES-09 | EStop | deactivate-input //Network1/FBAndLvCurrentPermit/AndIn8 | KILLED | 26 / current-early-sto.test.js :: EARLYSTO drive1/ordinary single-sample PLC pulse and raw restore fixed1 | 49 |
| ES-10 | EStop | deactivate-input //Network1/FBAndHvSetPermit/AndIn3 | KILLED | 2 / current-mentee-set-permit.test.js :: MENTEE05 paired HV/legacy-Network5/Menteetrue: first scan after stale request | 50 |
| UL-01 | Unlock | deactivate-input //Network1/FBAndUnlockHold/AndIn2 | KILLED | 1 / current-unlock-estop-permit.test.js :: UNLOCK07 component bluefalse/greenfalse/EStoptrue/PLCfalse | 50 |
| UL-02 | Unlock | invert-contact //Network1/FBAndUnlockHold/AndIn2 | KILLED | 33 / current-rnd-physical-integration.test.js :: RNDPHYS green full release permits a fresh single after blue cycle fixed1 | 49 |
| UL-03 | Unlock | deactivate-input //Network1/FBAndUnlockHold/AndIn3 | KILLED | 1 / current-unlock-estop-permit.test.js :: UNLOCK07 component bluetrue/greentrue/EStoptrue/PLCfalse | 50 |
| UL-04 | Unlock | deactivate-input //Network1/FBAndUnlockHold/AndIn5 | KILLED | 35 / current-rnd-physical-integration.test.js :: RNDPHYS green primary swap without sampled both-off fixed1 | 50 |
| UL-05 | Unlock | deactivate-input //Network12/FBAnd2/AndIn3 | STRUCTURAL-ONLY | 0 | 49 |
| UL-06 | Unlock | deactivate-input //Network2/FBAnd8/AndIn1 | KILLED | 10 / current-safe-run-gestures.test.js :: SR-SB-QUAL fresh Safe blue minimum500 and actual grant | 49 |
| UL-07 | Unlock | deactivate-input //Network2/FBAnd7/AndIn2 | KILLED | 5 / current-safe-run-gestures.test.js :: SR-SB-QUAL fresh Safe blue minimum500 and actual grant | 49 |

- Kills are judged only by the plan's behavioural allowlist; STRUCTURAL-ONLY is not a kill for G3
- Mutations are SAL attribute faults (guard term removed, polarity, channel mode, timing); they are a fault model, not native-valid edits
- Simulator semantics limits apply (program/stand/FB_SEMANTICS.md); an equivalent mutant can survive legitimately and must be argued, not assumed
