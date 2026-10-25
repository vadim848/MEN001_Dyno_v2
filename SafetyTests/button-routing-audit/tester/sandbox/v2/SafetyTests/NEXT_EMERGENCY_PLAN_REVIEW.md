# Independent A1/A2 plan review

2026-10-20. Verdict: **READY for independent A1/A2 test implementation and execution**. This is a plan gate, not behavioral acceptance or permission to edit SAL.

Reviewed AGENTS.md, WORKFLOW.md, NEXT_EMERGENCY_ARCHITECTURE.md, next-emergency-tests/PLAN.md and its inspect-source.mjs, source inventory and EMERGENCY_REQUIREMENTS.md. Independently parsed the actual working pair with explicit matching SGVL and obtained whole-source binding audit PASS:

- SAL SHA256 `72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e`.
- SGVL SHA256 `de0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56`.

Read the reference SAL at the user-confirmed reference path, selecting Network1/2/5 original consumers without modifying it. Original EStop master pairs and contact attributes agree with the architecture: enabled NC1/NC2 pair and PLC-derived/Mentee pair, with Mentee inverted. Reference execution orders differ from current, as the architecture expressly states; reference order18/92 must not replace current23/96. The original Step2 power-on producer is preserved as a separate entry reason, not evidence that R&D-down should reenergize.

## Why the bounded gate passes

A1 requires a successfully generated real blue grant and final Unlock before injection, continuous first-fault observation and raw restoration without green Restart. NC2/Mentee are actual effective main-EStop channels, not the separate external interlocks. Current main EStop executes23, before sole final Unlock writer255, so first-fault final inhibition is an appropriate software-scan requirement. The plan does not infer immediate removal of all energy outputs or grant-latch state from final Unlock alone.

A2 requires an actual pending aggregate and a healthy paired positive before injecting the fault. The current early guards and actual RS consumers are correctly identified: permit2; LV3/4, HV5/6, STO10/11 and12/13. NC2 reaches current permit directly; Mentee reaches the four Set gates directly before EStop23. This explicitly tests the stale-prior-EStop hazard rather than merely retesting the native truth table. Existing reset writers and retained outputs remain observable. No output/accepted-owner/aggregate seeds may substitute for the positive producer path.

For A2 only, the architecture's release-while-faulted protocol correctly avoids accidental green Restart: release both and observe green FALSE while fault remains active, then restore only the fault input. A held green recovery and subsequent release is a different recovery protocol and cannot support the no-Restart assertion. A1 instead retains blue TRUE and green FALSE throughout fault and restoration; dropping blue would independently suppress final Unlock and mask the tested gate. Root relayed the tester's confirmation that the A1 implementation preserves these held raw values on every frame.

Typed Network3 phase cuts and enumerated inactive Network4 boundaries are admissible component fixtures only. Whole-source audit precedes cuts; demanded unresolved inputs are fixture ERROR. They confer no BOOT, hardware or full-system reachability claim. Missing positives or inability to find a pending frame are NOT VERIFIED/fixture ERROR, not PASS or a proven SAL defect.

## Execution conditions and limits

1. Implement A1 and A2 first. Record exact per-route/domain matrix and report unavailable routes individually; do not silently collapse HV/STO or ordinary/down-origin Step2.
2. Start fixed1ms recording before preparation; retain first fault, first restoration, actual Set/Reset inputs and output rises. Ten held scans are an observation span, not a newly approved timing requirement.
3. Freeze fresh source/runtime/parser/native-pair/clock identities in execution evidence. The 29-block static inventory alone is not full producer closure or behavioral proof.
4. A3 is not included in this READY verdict. ExternalNC does not imply main EStop FALSE. Review the implemented actual protective-owner closure and chronology separately before accepting its persistence claims.
5. Latest user answers now resolve LV completion (`LV_C1_FBK=FALSE` sufficient), Run BOTH (ignore), and fresh StartingRun green (abort using Run→R&D sequence). Statements in the plan/architecture calling those questions pending are stale documentation, not blockers or alternative oracle. They do not alter the narrow NC2/Mentee first-fault criteria; root/analyst should update their scenario records in their owned files.

No tests were run here, no behavioral PASS is claimed, and no working code, runtime, source inventory or other writer's file was changed. Remaining mandatory acceptance gaps and current known failures remain open.
