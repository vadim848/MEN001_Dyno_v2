# Independent baseline L/R/T, 2026-10-20

Execution completed; no child process or approval pending. **8 PASS / 12 FAIL /
2 NOT VERIFIED / 0 ERROR** across 22 diagnostic cases. This is not full software
acceptance and does not replace existing canonical regressions.

Exact current SAL72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e,
SGVLde0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56.
Whole binding audit PASS before each fixture, zero demanded fallback. Current
native IDs/orders/ports/pairs are in source-inventory.json; direct original
reference N5/N6/N7 evidence is reference-operations.json. Runtime/parser/binding/
clock/pair SHA256 are in the baseline archive. No source/runtime changes.

| Group | Result | Actual observation |
|---|---|---|
| L later feedbackOFF / alreadyOFF | 2 NOT VERIFIED | Actual Safe→RnD→accepted green→LV commandOFF→feedbackFALSE reaches Step2, owner remainsTRUE, no reenergization. Healthy Safe/newcycle not observed in diagnostic2500ms; no physical deadline invented. |
| R valid BOTH 0/249/250, both first orders, then retaingreen | 6 FAIL | BOTH itself does not stop; releasing blue and holding green produces actual normal Run-down and all four downstream requests from the same consumed attempt. |
| R same combinations then retainblue | 6 PASS | No unwanted command; complete neutral and fresh green500 produces actual Run-down positive. |
| R late300 then retaingreen / retainblue, both first orders | 2 FAIL / 2 PASS | Retained green wrongly becomes single; retained blue does not. |
| R short failed chord→green, either first | 2 FAIL | Existing short-chord failures reproduced honestly, oracle unchanged. |
| T C2OFF / C2ON with Healthy unconfirmed | 2 FAIL | Actual accepted launch and early STO remain unconfirmed through full cleanup; freshgreen500 does not initiate normal-stop requests. Later confirmation enters Run. |

T actual source chronology for BOTH contexts: new launch gesture5319,
accepted real SU6319, freshgreen8423 after full cleanup, qualification8923,
normal-stop fanout absent through8943; later C2TRUE/HVHealthyFALSE given8944,
Run confirmation occurs in following observed samples. No SU/SG/Run/output
seeding after initial declared Safe boundary. The later-feedback failure means
the required fresh abort was not executed; it does not assert that an actual
abort owner had previously been accepted. Full HV shutdown completion remains
NOT VERIFIED under its separately unresolved contract.

Exact post-probe chronology: confirmation8944, Run8945, normalRunStop8946.
SG/down never qualified during the pending StartingRun freshgreen interval;
the old Run route acts only AFTER late feedback creates Run, with green still
held. Thus a late eventual stop does not satisfy the requested StartingRun abort.

L additional source proof candidate: l-completion-ledger.json contains real
SafeSet consumers and last healthy scan8324. Step2TRUE, ownerTRUE, LV/HVFALSE,
SafeSetOrFALSE, every SafeSet producerFALSE. Actual Safe writer is
N3/FBRs1.Set←N3/FBOr2; its only sources are b_Step1_Set (declared inactive N4),
N3/FBAnd1 (blocked by !Step2), b_Step1_Set_2 (declared inactive N4), and
b_Step1_Set_3←N5/FBAnd7 (Step2 && FalseInput && !EStop). Healthy FalseInputFALSE
and EStopTRUE cannot satisfy the last route. FeedbackFALSE has no new healthy
completion path in this observed ledger. Architect/reviewer should assess the
stable absent-path proof independently; this test report retains NOT VERIFIED
instead of turning budget exhaustion into FAIL. N4/group limitations are explicit.

Reproduce from repository root:

```
node SafetyTests/user-decisions-tests/inspect-source.mjs
node SafetyTests/user-decisions-tests/run-baseline.mjs
node SafetyTests/user-decisions-tests/startingrun-baseline.mjs
node SafetyTests/user-decisions-tests/l-completion-ledger.mjs
node SafetyTests/user-decisions-tests/pack-results.mjs
```

Scripts are diagnostic collectors; exit0 is not acceptance PASS. Read SUMMARY
statuses. Both large archives are lossless gzip with verified raw/compressed
SHA256 in SUMMARY.json; they preserve continuous samples/owner evaluation and
explicit protocol writes. None of the 12 FAIL is hidden by compression.
The additive lifecycle-source fixture is local to this directory; normal
owners and consumers execute from actual source. Conditional initial Safe and
Run component boundaries do not establish full BOOT/group reachability.

Pending before implementation acceptance: independent baseline source review,
reviewed design, additional T rejection/emergency controls and whole regression.
No hardware/native verification, CRC calculation, deployment or push performed.
