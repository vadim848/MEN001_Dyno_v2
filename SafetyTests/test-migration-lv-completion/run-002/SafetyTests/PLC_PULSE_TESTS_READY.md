# PLC pulse LV/HV Set — red tests ready

2026-10-19. **READY for independent test review; editor STOP.** Tests-only stage on accepted R3 working source. No SAL/SGVL/runtime/old oracle edits, no PLC guard implementation and no early-STO change.

## Reproduction and result

From repository root: node --test SafetyTests/test/current-plc-pulse-set-permit.test.js

**48tests:36PASS /12FAIL /0skipped**, expected nonzero exit. PLC_PULSE_RED_BASELINE.json records all48 results:44 continuously observed actual chain cases plus4 direct actual-producer truth-table cases. There are no infrastructure/missing-producer failures in this baseline. Source/test/requirement hashes and every frame/prehistory/explicit boundary are recorded. Test SHA2566a3929a9af9e3529ce3ef03026d92ef3753d379ff2f365609bce2bc5925f1133.

Unchanged SAL a50e24af66c755f00001e3bd2eed70ba4d30526df8dfa427b5d37bc6dcebb413; SGVL06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5. Runtime14d50f182e42c7aea814eb0c221fbeadbc9becf20f7ac575d263b8cb4f14698e; native-estop-pairs-v1 and observed-fixed-scan-v1 remain unchanged. Previous R3 reports/red baseline were not overwritten. No full package rerun is appropriate for this deliberately red-only checkpoint.

## Requirements and actual source boundaries

Read PLC_PULSE_SET_REQUIREMENTS.md, PLC_PULSE_SET_GUARD_REVIEW.md and PLC_PULSE_AND_STO_PLAN_REVIEW.md. SPEC EMG005/006/011 requires that raw restoration not cancel fault/restart memory or create new energy. No new user policy or physical time is inferred.

The full current SAL/SGVL namespace/relationship audit passes before every selection. Selected blocks retain real global execution orders: CurrentPermit2, LVSet3/LVRS4, HVSet5/HVRS6, mainEStop21 and actual PLCproducer95. Aggregate/producer order is copied from the source, never artificially rearranged.

- LV primary: real Network11/FBAnd1 with typed b_Step12 state boundary → real OR17/SetPermit/RS.
- HV primary: real Network1/FBAnd6 retry producer with explicit upstream FBAnd4/AndOut boundary → real OR18/SetPermit/RS. Its out_HV_C2 contact is actual selected RS feedback, never an injected healthy raw input.
- Independent legacy routes: real Network5/FBAnd1→FBDecouple1 native LV/HV request outputs, with explicit b_Step2 ownership boundary. They produce the required pending aggregates without invented feedback preconditions. Unused Decouple channels are outside the command dependency; no demanded input uses fallback.

All raw main/permission inputs are explicitly supplied healthy, including NC2TRUE/MenteeFALSE/FalseinputFALSE. EStopOK is established by genuine ResetPB high→falling, not a seeded memory/global. The fixture then enables only the declared route and stops at aggregateTRUE/outputFALSE; failure to reach that checkpoint is a setup error, not an accepted counterexample. Healthy/fault pairs have identical preparation until the single raw PLC sample.

Excluded Reset aggregate output sources are explicitly FALSE. This isolates absence of new Set and Set-only preservation of already latched output; it does not require a full emergency Reset sequence to remain FALSE. Other route/global inputs are typed, recorded explicit cuts. Scope is a component chain with phase/upstream ownership injection, not BOOT/full phase reachability or an accepted launch.

The boundary ledger distinguishes initialValue from actual sampled values. Every prehistory includes actual typed boundary values; all frames include Step12, Step2, HVretrySource and ResetSource. Thus HVAnd4 FALSE→TRUE route activation and LV/legacy phase enabling are visible rather than hidden in a purported constant. Reviewer clarification changes only evidence, not test expectations or source.

## Positive/negative coverage

Primary LV/HV run on fixed1/2/5/10ms grids:

- Eight paired healthy controls genuinely create Set from pending aggregate with initially FALSE output:PASS.
- Eight one-sample PLC pulse/recovery cases: fault sample staysFALSE while mainEStop is still staleTRUE; first raw recovery wrongly sets outputTRUE before mainEStop dropsFALSE. All eight are actual behavioralFAIL; every later sample is also observed, excluding a hidden transient.
- Eight held-fault/later-restoration/manual-Restart cases:PASS. Raw restoration and Restart high cannot enable; real Restart falling succeeds, then the real producer/gate/latch creates outputTRUE. This prevents an always-disabled guard from passing.
- Eight already-latched cases:PASS, using a real previous Set rather than seeded latch memory. Output remainsTRUE when only Set permission changes and the explicit Reset boundary isFALSE.

Additional legacy LV/HV on1/10ms:four healthyPASS controls and four pulse/recoveryFAIL cases reproduce the same gap through independent native producer outputs.

False operand:four actual chain casesPASS preserve its existing producer/EStop/manual-Restart role; four direct actual PLCproducer truth-table casesPASS prove !PLCstop AND !FalseInput. The chain test uses PLC to block the initial pending Set while False is asserted, then exercises False independently while PLC is restored. It does not invent an immediate raw-False energy ban: the reviewed fourth-input correction alone cannot claim that, because CurrentPermit has no raw-False input.

## Handoff limits

All12FAIL are the first-raw-recovery new-Set counterexample on real producers, not missing bindings or an already enabled output. The suite records real output/aggregate/current gate/EStop/PLCproducer/raw observations on every scan from startup. No observed output is replaced by a planned-state flag or prototype.

Adapter no-EDM/group lifecycle/physical accuracy limits remain. This does not prove full emergency ownership or close PLC-only command policy, early STO or the remaining Network3 conflict/coverage gaps. Existing nine-permission/first-fault/Door/Mentee/Unlock regressions remain untouched. Independent test review and local checkpoint must precede the small two-wire/unused-port source fix. No program repair, commit/push/deploy/native build was performed in this stage. Editor STOP.
