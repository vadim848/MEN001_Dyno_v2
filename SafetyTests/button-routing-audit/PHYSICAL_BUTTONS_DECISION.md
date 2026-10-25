# CANCELLED proposals from Niv — historical record only

Vadim explicitly cancelled all behavioral changes proposed by Niv on 2026-10-20.
This entire document is retained as proposal history, not approved requirements,
an implementation plan or a test oracle. The earlier designation as a decision
was incorrect. Pre-existing Vadim-approved requirements remain authoritative;
matching statements here do not revoke those earlier requirements. The proposed
short-Reset/release arbitration question is closed by cancellation, not answered.
No SAL/SGVL or tests were changed for these proposals. Future behavioral changes
require agreement with Vadim. See the controlling cancellation at the start of
SCENARIO_DECISIONS.md. All supersession claims below are inactive.

2026-10-20. Analyst handoff after Niv's new direct Hebrew instruction, relayed by root. This records requirements, not implemented behavior. Only this document and the newest appended section of SCENARIO_DECISIONS.md were edited.

Read current SCENARIO_DECISIONS, prior gesture criteria, reference phase mapping and DOOR_INTERLOCK_REQUIREMENT before this reconciliation. Earlier actual-source/reference reads are recorded in ANALYST.md (current SAL59bf4ec1… / SGVLc31e1290…; confirmed reference SALefddc60b…). No hardware inference or source changes.

## Mode and operation matrix

| Initial stable mode | Physical operation | Required result | Preserved qualification / limit |
|---|---|---|---|
| Safe | valid BOTH | Raise one step to R&D through LV preparation | Second<=250ms; continuous both1000 from second; actual guards/feedback. Open lid must not veto this transition. |
| R&D | valid BOTH | Raise one step to Armed through accepted launch/confirmation | Same BOTH timing; lid must be closed. Exact closure program signal unresolved. Existing early-STO decision is preserved unless explicitly revised. |
| Armed | valid BOTH | No upward mode beyond Armed | Previous D-RUN-BOTH-IGNORE remains compatible. No chord-to-single degradation. |
| Armed | short Reset | Lower one step to R&D | Short Reset acceptance event is pending; do not silently require500ms or invent another threshold. Ordered energy-down actions remain required. |
| R&D | short Reset | Lower one step to Safe | Same acceptance gap; ordered LV shutdown and approved LVfeedbackOFF completion remain. |
| Safe | short Reset | No lower energy mode; raw EStop Restart retains its role | New statement does not create a lower mode or remove emergency acknowledgment. No normal energy-up from single Reset. |
| Safe or R&D | qualified blue alone | Unlock may be requested under existing solenoid conditions | Existing blue500, held-blue/green suppression and permissions retained where compatible. Scope permission does not force outputTRUE. |
| Armed | blue alone | No Unlock | No new single-blue operation defined. |
| Armed | EStop or safety circuit interruption | Gradual downward protective sequence | Protective event priority retained; do not equate normal short Reset with all EStop classes. No new times assigned. |
| R&D or Armed | existing C3/BMS command | Mode permits operation | Does not mean automatic activation on entry or removal of command/feedback guards. |

PLC mode requests are deferred from the present physical-operation focus. Keep their existing paths visible and preserve them; do not treat this deferral as deletion authorization or an answer approving current independent level acceptance.

## What this replaces

- Normal down in stable R&D/Armed no longer has a confirmed mandatory green500 requirement: latest user explicitly says short Reset. Exact acceptance is still missing.
- Original single-green energy-up is not a valid current operation. Reference still explains preserved low-level sequence but does not override the new physical step policy.
- Earlier blanket DoorMonitor-only-for-solenoid/no-door-energy-guard policy is superseded functionally for R&D→Armed by the explicit closed-lid requirement. This does not by itself identify which existing input proves closed or authorize hardware/locked-feedback redesign.
- The prior 500ms Reset equality/late-second oracle cannot be copied unchanged to short-Reset normal down. Blue timing and common no-duplicate/rearm invariants remain unless their precise conflict needs clarification.
- Prior accepted StartingRun abort/fault sequencing applies in its stated transition context. New stable-mode wording does not answer all transitional Reset cases or change abort acceptance to short automatically.

## Missing acceptance contract; ask only concrete questions

1. **Primary question pending:** root refined the initial PRESS/RELEASE question to: accept down only on Reset RELEASE, and only if blue did not participate in the same attempt? This is a proposed arbitration for the user's choice, not an approved implementation. Until answered, dependent implementation and exact tests remain on hold. Immediate PRESS acceptance can conflict with green-first BOTH before blue arrives within250ms; RELEASE alone also does not establish failed-chord behavior. Do not invent a priority or a timer to resolve either.
2. Door source reconciliation remains technical analysis first. The current actual NC1/NC2 consumers are respectively `Network2/FBAnd1/AndIn5,6`, `Network6/FBAnd9/AndIn2,3`, `Network1/FBAndLvCurrentPermit/AndIn4,5`, `Network12/FBAnd16/AndIn1,3` and `RndPhysicalCompact/GATE_001/AndIn5,6`. These are existing program gates, not a physical wiring conclusion. If the allowed open-lid Safe→R&D scenario cannot be specified from available program semantics, ask only the expected given NC1/NC2 values and confirm transition acceptance for that combination. Do not infer those values from lid position or remove all safety guards.
3. The new R&D→Armed closed-lid condition supersedes the old functional exclusion of a lid energy guard, but exact existing input assignment still needs source reconciliation. Ask for the intended existing program closure signal only if that remains ambiguous after available code/requirements study. No new hardware investigation, input, safe classification or locked proof is implied.

Avoid asking user again about answered BOTH250/1000, Run BOTH ignore, approved downward endpoints or chosen HV/abort timings. Do not require a locked proof merely because lid usually locks mechanically.

## Consequences for current verification

Current gesture audit is a snapshot against pre-message rules, not acceptance of this new operation contract. Its Run raw-green/chord degradation evidence remains relevant to unique routing; green500 positive tests become historical/regression observations wherever latest short-Reset policy supersedes them. No test oracle may be silently edited to green PASS. Label changed requirements and preserve original evidence.

After acceptance is defined, architect must map each attempt → one operation event → one retained owner → ordered actions, including real mode writers and output consumers. Include paired positives and forbidden histories: green-first BOTH, blue-first BOTH, short single, held Reset, failed chord then one released, repeated hold, entry-held inputs, neutral cleanup, accepted operation crossing a mode boundary, simultaneous protective event, and door conditions by transition. One operation can fan out to coordinated outputs; multiple consumers alone do not prove duplication.

No implementation readiness or all-clear is asserted. Native/target/hardware operation, downloads and push remain outside authorization.
