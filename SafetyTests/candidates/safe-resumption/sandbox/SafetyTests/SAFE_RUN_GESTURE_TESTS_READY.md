# Safe/Run bounded known-gesture RED package — TESTS READY

2026-10-20. Implements only the first bounded package approved in SAFE_RUN_GESTURE_TEST_PLAN.md / SAFE_RUN_GESTURE_PLAN_REVIEW.md. Native candidate remains HOLD. No SAL, SGVL, runtime, old test/oracle, native manifest or accepted software/candidate report was changed. No full pipeline ran during this red stage.

## Targeted result

node --test test/current-safe-run-gestures.test.js: **15 tests /8PASS /7FAIL /0ERROR /0skip**. Fourteen actual SAL component cases give7PASS/7FAIL; one observer meta testPASS is counted separately, not functional SAL acceptance. Actual assertion failures remain red; no expected-failure green wrapper or missing-module baseline.

| Failing case family | Cases | Actual source evidence |
|---|---|---|
| SR-SB-QUAL |1| Safe blue producer and sole final Unlock rise on the first blue sample, before500ms |
| SR-SC-VALID-green/blue |2| Full valid250ms chord can also emit Safe blue authorization; blue-first also exposes early Unlock. Correct Step12 positive still works after fullBOTH |
| SR-SC-LATE-green/blue |2| Second300ms before single qualification still permits Step12/Transition1 after prolongedBOTH; invalid attempt also exposes Safe blue producer |
| SR-RG-INVALID firstgreen/blue, remain-green |2| Failedshortchord degrades into physical normaldown and four removal/discharge requests while green remains held |

Passing controls: Safe connector-absent access, Door reset, green suppressing Unlock, And3-notready/release/no-delayed-launch preservation, healthyRun green500/fanout, both remaining-blue failedchord variants and the observer meta control. Fresh recovery positives pass within the red cases too. These cases are scoped controls; theirPASS does not close complete BTN/CVR/Run stopping requirements or cancel the timing/chord failures.

## Requirements trace by stable family

- SR-SB-QUAL: BTN-004,CVR-001/002; access control also EMG-003; Door/green controls preserve CVR-001/002/006 source roles.
- SR-SC-VALID: BTN-005/006/007 with original Safe guards and SPEC§15 physical advancement.
- SR-SC-LATE: BTN-005/008,D-LATE-SECOND; recovery uses BTN-001 release preparation.
- SR-SC-GUARD-PRESERVE: original Safe And3/TON3 non-queued launch behavior and preservation hierarchy; qualification is not accepted energylaunch.
- SR-RG-QUAL: BTN-003, SPEC§15 known normalgreen request; SR-RG-INVALID: BTN-007 plus BTN-001 recovery. Downstream QD completion is not claimed.

## Actual fixture and source ownership

Fresh full SAL/explicit SGVL audit precedes dynamic dependency selection. Both modes currently measure170actualblocks with0unresolved demanded inputs, shared effective ESTOP pair resolution and per-demanded-output DECOUPLE input traversal. Every root resolves a genuine output/alias/global writer; no basename-only acceptance. All parallel physical/PLC producers and actual grant/energy/STO/discharge/status consumers in the selected cone execute. PLC00 branches are checked inactive. Current count170 is scope evidence, not a future fixed oracle.

Typed Network3 phase cuts have genuine SGVL IDs and excluded writer paths. Network4/group ownership is not executed under fallback. No command/acceptance/grant/latch/energy output or timer memory is seeded. Main EStop uses genuine Restart high/fall. Run setup drives ordinaryStep2 real producers until actual LV/HV/STO1/STO2 areTRUE, then records explicit Step3 boundary; Safe prepares native guard readiness with C1/C2feedbackOFF and STOfeedbackTRUE. Actual FBRs9 provides ResetPB_LockFALSE without a lock cut. All raw feedback values are software inputs, not hardware validation.

Non-demanded DECOUPLE outputs are explicitly listed, including live globals outside this narrow cone. Generic runtime reads of such formal channels are recorded in allUnboundReadPorts; they are not represented as native-unused or provenFALSE. unresolvedDemanded stays0. Network3/N4/fullBOOTripple effects and undefined Q* endpoints remain outside proof.

## Continuous observation and causal timing

All samples from first mode-entry and first gesture edge are retained, including setup and recovery. Interval negative checks observe any pulse throughout; every first press/release sample participates. The meta test catches an interior1ms pulse after endpointFALSE; its reported status/counts now derive actual try/catch outcome, including failure rather than a hardcodedPASS.

Measured1ms current-source chronology:

| Surface | Offset from observed event |
|---|---|
| Safe blue producer and final Unlock |0 from firstblue (the qualification counterexample) |
| Safe BOTH input actually consumed by earlyTON3 |second+1 |
| Safe TON3/And4/Step12Set/Transition1 |second+1001 with readyguards |
| Run rawgreenTON2 and And24 |firstgreen+500 |
| Run physical Or5 input source (And23) |firstgreen+501 |
| Run downstream four requests |firstgreen+503 |

500/1000 remain normative minima; these later offsets are measured old-source propagation, not new policy. Positive checks permit qualification at the threshold and then the known current consumption transfers, without waiving any early pulse. Future graph migration must document changed native producer/order traces; no arbitrary grace or invented accepted-event latch is supplied.

Guard-preservation control: real STO1feedbackFALSE holds And3FALSE while validBOTH qualifies the existing TON3. Both release and actual TON reset precede restoring feedback readiness. No delayed Step12/Transition1 occurs from that unaccepted qualification; a fresh ready-guard chord succeeds. This is separate from single/chord acceptance and protects the original no-queue behavior.

## Evidence / scope / handoff

SAFE_RUN_GESTURE_RED_BASELINE.json (850958bytes) records all14SAL cases, per-check outcomes, every input/owner cut, selected block/port IDs/orders, actual input consumption, signal rises, setup and scenario waveforms losslessly compressed as equal-frame start/end/samplecount spans. Complete raw/model/helper/test/requirement/plan hashes are embedded.

SAL SHA256 0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909; SGVL 06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5; runtime 14d50f182e42c7aea814eb0c221fbeadbc9becf20f7ac575d263b8cb4f14698e. Test SHA256 bf340d13dcefcda1a3d3fd9934f2c8a9312b5f6e80eba4f54017812bfd39a626; helper SHA256 cbbe88e02bdfc806190e22b5d7ad754beda5893be8a6bcd0a11c9cd86c556171; baseline SHA256 a913bb8924ced1697a30321937c08f181e6f1f6e6b9d3a9a0b7f70939c0a11fd.

Fixed owner/constant feedback recovery proves request availability, not actual fullstate Run re-entry or normalstop completion. No group no-fault claim follows from adapterErrorFALSE. QR/QT/QP/QF/QD, heldentry/rearm/grid/piano backlog, fullBOOT/Network4 and complete rollback remain excluded rather than falselyPASS. No new native graph, source fix, build, push or deploy.

Only4newfiles: test/helpers/safe-run-source.js, test/current-safe-run-gestures.test.js, SAFE_RUN_GESTURE_RED_BASELINE.json, SAFE_RUN_GESTURE_TESTS_READY.md. Editor ALL WRITES STOP pending independent test review and checkpoint.
