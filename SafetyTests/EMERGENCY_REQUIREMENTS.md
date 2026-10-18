# Emergency requirement bindings — 2026-10-18

IDs below reference section 19 of `../SAFETY_STATE_MACHINE_SPEC.md`.
`Bxx/Cxx/...` remain scenario IDs, not interchangeable requirement IDs.
Evidence statuses do not represent hardware acceptance.

| Requirement | Actual SAL evidence | Result and missing positive/negative coverage |
|---|---|---|
| EMG-001 | ESTOP01–04, CHAIN01–04, PHASE01; phase JSON | Partial mismatch candidates in R&D/Step12/Step2; no complete phase acceptance |
| EMG-002 | CHAIN09–10, phase JSON | Run stop/recovery observed; non-Run reaction incomplete |
| EMG-003 | Connector static/100 ms subset; phase Step1 observations | Upward blocking with a fresh full gesture after recovery not yet bound end-to-end |
| EMG-004 | CHAIN07–08; PHASE02, phase JSON | Run reaction observed; Step2 HV enable alongside connector loss is a mismatch candidate |
| EMG-005 | CHAIN02/05–10 | Early Run stop persists; recovery late in discharge and non-Run phases needs full sequences |
| EMG-006 | ESTOP03, CHAIN02 | No immediate auto-Run observed; manual post-discharge return to Safe unverified/Step6 gate unresolved |
| EMG-007 | CHAIN01/04–10, phase JSON | Unlock OFF in tested traces with blue OFF; missing adversarial blue-held/fault/recovery phase cases |
| EMG-008 | ENERGY02, CHAIN11 | Current raw-input branch waits for 2 s gate; electrical fault polarity remains open |
| EMG-009 | CHAIN12 | Live raw-Healthy branch selection confirmed; validated coast/fault-latch acceptance pending |
| EMG-010 | ENERGY04–05, DOWN01/03, OUT01/03, CHAIN04 | C2 removal timer-driven, no distinct safe-HV feedback; approved completion policy missing |
| EMG-011 | PHASE02–03, RNDSAFE05 | Step2/Step12 command inhibition candidates; full causal/reachability and runtime validation pending |
| EMG-012 | STATE01–04, legacy RNDSAFE02 | Settled ownership only; no arbitrary-conflict/fault-handler coverage; legacy handoff artifact is not a current defect |

## Expected reaction by semantic phase

SAL names are provisional bindings, not approved physical modes.

| Semantic phase / SAL candidate | Physical/external Emergency | Connector loss | Recovery and completion |
|---|---|---|---|
| Safe / Step1 | Enter/retain Emergency procedure; no energy increase | Block upward command without fault | Fresh gesture for connector recovery; manual Emergency recovery only |
| R&D / Step_RnD | Emergency; inhibit higher energy; remove existing energy by approved procedure | Emergency | Recovery cannot cancel sequence; confirm removal before Safe |
| StartingR&D / Step12 | Abort energy increase into Emergency procedure | Emergency once Safe has been left | Do not complete R&D solely because feedback later arrives |
| Shared Step2 | Determine its entry reason before assigning semantic phase; inhibit upward action on applicable fault | Emergency after Safe exit | May not treat every Step2 as normal energization or normal shutdown |
| Run / Step3 | Emergency energy removal with required SS1/STO selection | Emergency | Do not auto-return Run |
| Stopping / Step4 | Preserve/strengthen emergency handling without skipping required motion wait | Emergency remains latched | Healthy restoration must not undo selected coast branch |
| Discharge/disconnect / Step5 | Continue approved removal; cover locked | Emergency remains latched | Require approved safe-HV condition and C2 OFF feedback |
| Terminal removal / Step6 | Retain Emergency until recovery conditions | Emergency remains latched | Confirm all energy removed and manual acknowledgement before Safe |

No table cell means “drop every contactor immediately.” Controlled braking and
discharge require the agreed energy sequence. Exact emergency LV/HV ordering,
raw polarity, safe feedback and validated times remain open physical decisions.

## Test contract before implementation

For each ID add at least one required-behavior scenario and one rejection/fault
scenario, with explicit inputs, phase, output sequence, time bounds and completion
feedback. Add both fault-held and fault-restored traces at phase boundaries.
Model passes and baseline-discrepancy reproductions must remain distinct from
acceptance against the modified SAL. This file explicitly records missing
coverage rather than claiming the existing test count fulfills the contract.
