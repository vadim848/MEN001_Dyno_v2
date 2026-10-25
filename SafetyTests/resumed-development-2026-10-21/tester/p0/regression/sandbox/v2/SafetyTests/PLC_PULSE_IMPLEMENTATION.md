# PLC pulse Set guard implementation

2026-10-19. Implementation of reviewed PLC_PULSE_SET_REQUIREMENTS / GUARD_REVIEW / PLC_PULSE_AND_STO_PLAN_REVIEW, after checkpoint b5692c3.

## Actual source change

Two canonical output-side wiredLink records extend existing Network1/FBAnd1/AndOut (order95) fanout to existing LV/HV SetPermit AndIn4 (orders3/5). Both previously inactive ports become Activated with direct Break Contact (NC). Original main EStop consumer remains. Source now has253 blocks; no order, timer, Reset path, original request producer, main EStop metadata, alias mapping or SGVL change. No runtime/model change. Early STO is not implemented.

Current rawPLC guard blocks fault sample N. The previous real PLC producer FALSE blocks first recovery N+1 before main EStop executes; later EStop memory requires actual manual Restart. This does not add a current raw-False input or claim immediate first-sample protection for arbitrary FalseInput changes.

## Verification and fixture migration

The reviewed 48 tests are unchanged byte-for-byte. All48 pass (previous36PASS/12FAIL). Actual LV Step12 / HV retry and independent legacy producers establish pending aggregateTRUE/outputFALSE, observe all scans on1/2/5/10ms grids, pulse/recovery, held fault, new accepted Restart and already-latched output. False operand truth-table and actual EStop/restart role remain checked. Immutable PLC_PULSE_RED_BASELINE.json is preserved.

Old LV/HV/Mentee/Door component fixtures explicitly provide healthy TRUE at excluded Network1/FBAnd1/AndOut. They do not include main EStop/PLC producer and previously did not demand this new input. These cuts preserve their original first-fault/permission/Door/Mentee questions; the unchanged 48-test suite executes the actual producer dynamically. All original assertions remain, with native active-port arrays updated from three to four. Native audit additionally asserts exact producer fanout (main EStop plus both gates), canonical edge uniqueness, four active inputs/direct contact, and253 blocks.

Targeted groups:106/106PASS (48 PLC plus previous guards/Door/Mentee),180/180PASS (R3 pairs86, physical69, compact5 and native binding20). Whole-source binding audit precedes all source cuts. Final pipeline and matching source/model hashes follow in current companion.

## Limits

Explicit state/upstream/ResetFALSE cuts are recorded per scenario, including actual prehistory route values. This is component acceptance, not full BOOT/emergency owner reachability. No forced Reset is introduced. Existing adapter/nativeError/group lifecycle limits remain; native build, hardware validation, CRC regeneration and deploy are outside this stage. Source CRC metadata is retained, not represented as freshly verified.

## Final evidence and handoff

Source SHA256 dd9fd938fd5493795a7eea7b29cb027d7e994e2a55e2ad02d2ca66cb4beb6923; SGVL 06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5; runtime 14d50f182e42c7aea814eb0c221fbeadbc9becf20f7ac575d263b8cb4f14698e. Clock observed-fixed-scan-v1 and native-estop-pairs-v1 unchanged. Immutable red baseline SHA256 bfeec22aa33a4824001e147dfb2fe9755df29db77a5b039efae17362a2894ae4.

Full software: {"PASS":201,"FAIL":1,"NOT VERIFIED":5,"ERROR":0}; stages harness 178/178 PASS, historical 75/75 PASS, current 321/321 PASS. Standalone {"PASS":47,"FAIL":0,"NOT VERIFIED":5}. Existing full-software per-ID status delta: []. The 12 repaired outcomes are additional unchanged pulse-suite cases; they do not erase the remaining Network3 conflict or five coverage gaps.

PLC_PULSE_CURRENT_RESULTS.json records all48 outcomes, exact12 FAIL-to-PASS IDs, real scan traces/boundaries, source/model/test hashes and matching final report artifact hashes. Existing48 test source SHA is unchanged. No new native/hardware claim. Editor ALL WRITES STOP; independent implementation review pending.
