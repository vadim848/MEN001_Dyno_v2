# F1 editor handoff — frozen isolated candidate

Implemented the exact frozen F1_RUN_RECOGNIZER_PLAN.json b52f6b0e440a09ce138ad91e633b2fcd78f431d246a4dbdabc083809a0a08b60, after accepted canonicalP0 and independent F1 RED-readiness gates. **All editor/candidate writes stopped** for independent testing and review. Canonical remains accepted P0; no F1 promotion or shared test/runtime edits.

## Frozen files and scope

`SafetyTests/candidates/resumed-f1/native/`:

| File | SHA256 |
|---|---|
| TwinSafeGroup1.sal | 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 |
| GVL1.sgvl | dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104 |
| TwinSafeGroup1.sal.diagram | de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603 |

Exact copies in `SafetyTests/candidates/resumed-f1/project/MEN001_Dyno/Safety_Dyno/{TwinSafeGroup1,GVLs}` provide test-root layout. Set MEN001_F1_ROOT to absolute `.../candidates/resumed-f1/project`. PROVENANCE.json records actual test/helper/runtime/build hashes and asserts project copies byte-equal to frozen native files.

P0 baseline34b5b850…/517fdadd…/7b5eb794… hash-checked before edits. Reference4495a1f6049f6a58ebfd436761faa84d17c8d643 read directly without checkout/config writes; existing sequence is preserved except approved F1 routing.

## Exact implementation

- Shared MODE includes real b_Step3. Retired duplicate raw Run0.5s TON only; retained GREEN500/BOTH1000/WINDOW250/RELEASE2000 clocks/parameters unchanged.
- And24 consumes existing linkRndGreenQualified. And23 raw-blue inverted veto deactivated with contact attribute removed exactly as plan; existing Run/lock guards retained.
- Actual reset-dominant RUN_DOWN_OWNER captures existing And23; real RUN_DOWN_RESET OR reads b_Step_RnD_Set, b_Step4_Set, inverted linkRndGatePermit. Owner output replaces the old And23→OR5 direct route. Existing PLC OR5.OrIn2 unchanged.
- Three new global references/SGVL consumers and two local Symbol consumers use exact plan identities. Removed two old physical alias readers; no new aliases, hardware sources or group/target settings.
- New block/port/reference/wire IDs are frozen manifest IDs. Only unspecified relationship/usage wrapper IDs are allocated with reproducible SHA-derived unique GUIDs; the frozen plan is not regenerated.
- XML edits local to exact IDs/relationships; all original75 complete Symbol wrappers and76 nonprogram records preserved under only approved two-reader removal/two-reader addition. All85 SGVL declarations and existing usages preserved except three new program consumer records.
- Native API generated two new block shapes,12 new port shapes and three added wire presentations. Retired TON shape,its2ports/parameter and two old wire connectors removed. All2340 retained original bounds exact;14 new shapes present,2354 total bounds. Existing shape/block/port geometry was not laid out again.

## Selfchecks and reproduction

```
pwsh -NoProfile -File SafetyTests/resumed-development-2026-10-21/editor/f1/build-f1.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File SafetyTests/resumed-development-2026-10-21/editor/f1/native-f1.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File SafetyTests/resumed-development-2026-10-21/editor/f1/native-f1.ps1 -Reload
node SafetyTests/resumed-development-2026-10-21/editor/f1/check-f1.mjs
```

Final selfchecks PASS:

- Native full preflight before functional parsing:14 Networks/242FB/2076ports/75Symbols/307wires/0cross. Typed binding PASS209 global refs.
- Exact planned canonical edge set/order, new block/port IDs, two retained contact deltas,6750 retained attributes/identities, complete75 Symbol wrapper trees,76 nonprogram usage records and85 SGVL declarations/usages checked.
- Native initial save succeeded first attempt without loss. Fresh separate-process SAL/diagram CRC valid, SGVL FileCrcMismatchFALSE,242FB2076ports75Symbols85GVL,2340 retainedbounds within1e-9. Staged stored CRCs are intentionally stale before native save; delivered native files only are CRC evidence.
- Actual installed unsafe-source predicate/safe-input-slot subrule PASS for six in_Estop_PLC consumers in firstAND slot. No standard-to-safe retyping, filter laundering or guard removal. NATIVE_SOURCE_RULE.json/log.
- Current tester-owned qualification runner executed as editor selfcheck with output overridden to editor/f1/QUALIFICATION.json: **16PASS/0FAIL/0ERROR**, including actual SetTRUE+ResetTRUE reset-dominance coincidence,500/600 latebutton,1999/continuous2000 release,999/1000 ignoredBOTH and real LockSet3 producer.
- Actual writer lifecycle runner output overridden to editor/f1/LIFECYCLE.json: **2PASS/0FAIL/0ERROR**. InitialSafe/seveninactiveN4 boundary retained; initiating heldBOTH does not degrade on Run entry, real acceptedDown→Step12→RnD does not cascade from heldgreen. No ownerReset/phase override after entry.

Test outputs are editor selfchecks; independent tester still must freeze/reexecute complete acceptance matrix, pendingq+1 real-phase handoff, originalRun20, preservation/regression and independent native checks. Shared count/CRC/layer migration is not authorized here and was not changed.

## Limits / next gate

This slice corrects Run physical recognition and accepted-down owner only. Original normal-stop simultaneous fanout/2sSS1 ordering remains a known F2 failure; no positive F2 claim. StartingRun abort,newPLC event/noqueue,SafetyFault/watchdogs/ack,state conflicts and BOOT/group behavior remain later work. Newly approved C1/C2 ON/OFF500ms and Healthy30s failure-watchdog requirements were not implemented or used as timer changes in F1.

No manual CRC modification, whole IDE/Target/ADS validation, hardware/group/target/settings edits, equipment/download or push. New native CRC and subrule PASS are separate from those results. All3 canonical hashes rechecked unchanged34b5/517f/7b5 at freeze. Candidate source may proceed only after independent test/review; editor selfchecks do not approve promotion.
