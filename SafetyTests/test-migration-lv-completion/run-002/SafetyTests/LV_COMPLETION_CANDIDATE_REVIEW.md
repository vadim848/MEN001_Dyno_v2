# Independent candidate review: LV254

2026-10-20. **Structural design implementation ACCEPT; functional verdict PENDING independent tester FINAL. Working-source promotion is not yet approved.** Narrow LV completion only; Run/StartingRun255 design is excluded.

Candidate SAL SHA256 `b7096fa3cf7349ea0be08f347180deb071a0f6b75612c4e5c8a7f45cf0557161`; SGVL `4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5`. Reviewed actual candidate XML, build/structural scripts, frozen editor package, approved LV254 manifest and independent LV test script/fixture plan. Independently verified all17 FROZEN_RESULTS file hashes, matching full SAL/SGVL binding audit PASS,254 blocks,343 canonical edges and exact approved manifest execution orders.

## Actual implementation

All retained timer/parameter objects equal the baseline. Existing alias IDs/names/hardware alias values are unchanged. Root source metadata and inspected group attributes are unchanged; complete SGVL declarations and other semantic content, excluding the explicitly changed usage indices, compare equal. No new block/port/global identities were introduced. New relationship GUIDs implement the approved wire/alias/global usages with mandatory wrappers.

Independently compared every retained input object with actual baseline72f/de0f. Exactly ten inputs changed, all approved: Safe OR2 input5; retired Step2 OR4 input2; obsolete owner consumer N5And1 input4; And15 inputs3–8; SG.Reset. No unexpected retained input edit was detected. Retained block function types and parameters match. The approved routing removes the normal-down Step2 Set consumer together with the obsolete owner, rather than removing its veto alone. All eight positive bindings and two deactivations are represented in the audited source.

Moved completion And15 follows actual LV/HV output RS and current permit, and precedes Safe aggregate/RS. Actual commandOFF, LVFBKOFF, preserved HVOFF/C2OFF prerequisites, current ES/external/connectors/PLC permit, direct Mentee and False exclusion are explicit. It consumes actual producer outputs, not seeded aliases. Main-EStop evaluation still follows Safe RS; current raw fault guards are therefore necessary and present.

SG.Reset now reads inverted actual RND_SCOPE (E AND Rnd), retaining fault reset and clearing ownership after real Rnd exit despite Safe|Rnd MODE continuity. SG Set and its !Safe qualifier remain. Original battery/BMS/discharge/ResetLV/Transition2 fanouts and normal original-start Step2 energy path remain. No Run branch logic change is part of this candidate.

## Functional evidence gate still outstanding

Editor selfchecks/regressions are useful supporting evidence, not the independent tester substitute. The independent run must finish its frozen package before final functional verdict. Its reviewed current script separately exercises feedback-laterOFF/alreadyOFF healthy Safe/reentry, first-eligible fault and Rnd-cleared/Safe-notpublished fault gap, all six explicit raw faults including NC1, and original Step2 with generic dischargeFALSE/TRUE. Raw green releases while faulted before restoration; external faults are not assigned NC2 latch semantics. Candidate integrity and phase/N4 assumptions must remain reported.

Promotion still requires independent final package identities, actual no-Step2/no-LV-HV-replay traces, actual Safe→freshRnd cycle and unchanged Rnd/earlySTO/A1A2 regressions. Existing known Run failures remain open. No timeout/HV completion endpoint, fullBOOT/group/hardware or native Verify/Build/CRC acceptance is claimed.

Only this review file was written; candidate and working sources/tests were not changed or regenerated.
