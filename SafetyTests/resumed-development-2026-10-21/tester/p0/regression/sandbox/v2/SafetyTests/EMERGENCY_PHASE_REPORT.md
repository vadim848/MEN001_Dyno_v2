# Emergency phase matrix — 2026-10-18

Generate: `npm run audit:phases -- --write` in SafetyTests.
Machine-readable evidence: `EMERGENCY_PHASE_MATRIX.json`.

## Scope

144 observational cases: eight seeded SAL steps × nine event/control traces ×
two fallback assumptions. Events are NC1, PLC, NC2, Mentee, LV/HV connectors,
external NC1/NC2; a no-fault control is included. Each case observes 100 ms
after the event and 500 ms after restoration, with no Reset gesture.

All networks except unresolved Network4 execute. The no-EDM assumption,
partial group semantics and seeded-start boundary remain. Healthy and
SDS62/channel15 raw levels stay FALSE. Feedback is held at explicit seeded
values rather than simulated contactor dynamics. These cases are not 144
acceptance passes and do not prove reachability of every seeded condition.

| Seeded step | NC1 loss, 100 ms | HV connector loss, 100 ms | Command observation |
|---|---|---|---|
| Step1 | Step1, EStop OK FALSE | Step1, EStop OK TRUE | LV/HV remain OFF |
| R&D | R&D, EStop OK FALSE | R&D, EStop OK TRUE | LV stays ON, HV OFF |
| Step12 | Step12, EStop OK FALSE | Step12, EStop OK TRUE | LV rises from seeded OFF; HV OFF |
| Step2 | Step2, EStop OK FALSE | Step2, EStop OK TRUE | HV stays OFF for NC1; rises for HV connector loss |
| Step3 | Step4, EStop OK FALSE | Step4, EStop OK TRUE | Stop state selected; LV/HV initially retained |
| Step4 | Step4 | Step4 | LV/HV retained in early observation window |
| Step5 | Step5 | Step5 | LV/HV retained in early discharge window |
| Step6 | Step6 | Step6 | LV/HV OFF; Safe not reached |

The listed step ownership remains at the 500 ms restoration checkpoint.
The JSON records the other events, all observed output bits and both fallback
assumptions. Three regression tests preserve significant findings:
PHASE01 non-Run NC1 behavior, PHASE02 Step2 HV enable alongside connector
loss/control, PHASE03 Step12 LV enable alongside NC1 loss.

## Meaning of findings

The matrix flags energy-command rises occurring during the fault window, not
caused by the event. Step2's no-fault control also raises HV. The issue to
investigate is whether the protective event should inhibit or abort that
energization. Likewise Step12's no-fault control raises LV.

The existing independent Run protection must not be assumed to cover other
states: R&D/Step12/Step2 do not reproduce the Step3 -> Step4 reaction in these
traces. This is a specification discrepancy candidate requiring TwinSAFE
editor/runtime confirmation, not a physical machine verdict.

## Next

1. Assign stable requirement IDs to emergency/interlock behavior in each phase
   and bind these observations to the required reaction, including expected
   command inhibition and feedback completion.
2. Review exact state gating for R&D, Step12 and Step2 and draft the smallest
   correction groups for v2; do not edit the production reference repository.
3. Resolve Network4, EDM configuration and physical polarity before accepting
   complete runtime behavior or finalizing energy-removal implementation.
