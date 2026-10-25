# Reaction deadlines: bounded requirements handoff

2026-10-21. Analyst source-first clarification, not implementation approval of a complete failure policy. Only this document and a stale pending sentence in SCENARIO_DECISIONS were edited. F1 remains its reviewed button/owner scope; no SAL/runtime/test edits or existing timer changes.

## Authoritative new answer and scope

Vadim answered the previously addressed missing-confirmation question: **«реакция контакторов 0,5 сек to ON & OFF, а Healty 30 sec»**. Root recorded the direct answer at SCENARIO_DECISIONS top. Therefore:

| Expected confirmation in the discussed sequence | Maximum response interval now specified |
|---|---:|
| C1 commanded ON → C1 feedback ON | 500 ms |
| C1 commanded OFF → C1 feedback OFF | 500 ms |
| C2 commanded ON → C2 feedback ON | 500 ms |
| C2 commanded OFF → C2 feedback OFF | 500 ms |
| LV Healthy readiness confirmation during accepted LV startup | 30 s; origin below remains unresolved |
| HV Healthy readiness confirmation during accepted HV startup | 30 s; origin below remains unresolved |

These values replace unspecified/draft reaction watchdog values in this exact context. Do not ask their numbers again. Do not apply500ms to C3/battery/BMS/STO unless separately specified. Do not turn30s into a grace period for Healthy loss during established Run or SS1: approved HealthyLostDuringSS1 still selects STO immediately and retains full5s coast.

Existing single500/BOTH1000/window250/release2000, SS1=2s, coast=5s, success dischargehold and startup qualification delays are different timers/conditions. The numeric reply does not authorize retiming them, choosing a new discharge-failure timeout, or changing any hardware/group/target parameter.

## Exact source read and observed predicates

Read exact reference first, native-structure preflight before parse, then current accepted canonical P0 (not obsolete254).

- Reference SAL at confirmed Prodoction4495a1f: SHA256 `efddc60b1263144ae73b3d5184158100ec09c4de739dc8919309ef7b1b0dc334`; native-structure PASS.
- Current P0 SAL SHA256 `34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b`; pairedSGVL `517fdadd913007aa2690f1402676583ad16141c9ae64cb986554c87c10f22635`; native-structure and whole typed binding PASS. No canonical file altered.

Both source versions use actual output writers `Network1/FBRs1.RsOut → out_LV_C1` and `Network1/FBRs2.RsOut → out_HV_C2`. Given input confirmations are `in_LV_C1_FBK` and `in_HV_C2_FBK`. Acceptance/proposal globals upstream can remain active while final permission/reset prevents actual output change; they are not interchangeable with the commanded output.

Relevant existing P0 sequence facts:

| Source path | Current semantics / timing | Why it does not define new watchdog |
|---|---|---|
| `Network11/FBAnd1 → FBTon1 → FBAnd4` | Step12 starts0.1s qualification; And4 requires C1FBKTRUE and rawLVHealthyTRUE | Successful completion conjunction. No independent missing-confirmation fault timer or30s Healthy origin. |
| `Network12/FBAnd4 → FBTon3 → FBAnd6` | Accepted R&D up/permissions requestC2;0.1s qualification; And6 requires C2FBKTRUE and inverted rawHVHealthy | Run confirmation, separate from approved earlySTO. No500ms or30s watchdog. |
| Original `Network5/FBAnd1 → FBTon1 → FBAnd2 → FBTon2 → FBAnd3` | 0.1s then both contactorFBKTRUE;5.0s successhold; then inverted rawLV/HVHealthy | Retained source startup sequence, not an approved5s faultdeadline. Waiting for feedback before a successhold does not prove30s must start at feedback. |
| `Network12/FBAnd15`, `Network6/FBAnd18`, `Network8/FBAnd3` | LV/C2 OFF confirmation consumers during different down paths | Confirmation gates; do not by themselves define failure output retention/reset. |
| `Network8/FBTon1/FBTon2` | Both1s, with an OR between them including discharge-command echo | Successhold route; cannot rename either a reaction watchdog or assume serial2s in every history. |

Raw Healthy contact predicates differ by current source path (LV readiness direct inNetwork11, inverse in originalNetwork5; HV inverse atNetwork12 confirmation). Track actual given program values and effective consumer polarity. This numeric decision does not resolve that existing software-predicate discrepancy, invert mappings, or authorize physical-origin investigation. Architect must reconcile specific sequence predicates to agreed meaning using reference/current source; if semantic reaction genuinely remains ambiguous, return that precise case to analyst rather than normalize by variable name.

## What is already sufficiently defined for preparation

**Contactor reaction is measured against the actual issued ON/OFF command**, not the operator button edge, accepted normal operation, phase entry or intermediate proposal. An output may legally wait behind guards/ordered discharge before the command changes. Starting500ms at the button would charge a contactor for delay before it was commanded. Observe FBRs output publication and the confirmation reader's actual program order under the declared fixed-scan model; hardware zero-time or physical sampling equivalence is not claimed.

The four monitor identities and positive/negative boundary inputs can be prepared independently: commanded output edge, expectedFBK, whether it arrives before/by the500ms bound, and persistent absence after it. A same-level repeated request is not a new command edge and must not silently restart a deadline. When feedback already agrees at command issuance, there is no missing reaction to wait for; preserve any separately required sequence hold/confirmation. If a command is cancelled/reversed by an approved protective/abort sequence, do not keep treating the obsolete direction as a pending operational command; exact phase/failure ownership belongs to architecture.

This defines origin/measurement, not a new generic contactor health monitor for every later spontaneous feedback change. Loss of critical confirmed feedback retains its existing protective priority; do not insert a blanket500ms delay merely by extending the reaction reply beyond the question.

For discrete boundary preparation, retain the existing observed-fixed-scan clock contract, source command timestamp and feedback observation. Distinguish exact500ms feedback present from missing through/afterdeadline; capture effective reader values and first fault-publication timing. Do not invent a grace interval or claim a final fault-output oracle when the failure action is still pending. Same-scan deadline/success ordering must be explicitly stated by the technical design and checked against the maximum-response meaning.

## Healthy origin answered; historical question below superseded

Latest direct Vadim answer2026-10-21: **from confirmed feedbackON** of the
corresponding C1/C2. Healthy startup readiness has a maximum30s from that
confirmation; no extra30s wait if already Healthy. The contactor's own500ms
is measured from the actual ON/OFF output command. All origin-pending
phrases below are historical and must not trigger another user question.
Only the separate failure-output/recovery endpoints remain unresolved.

**Healthy origin is not answered by the numbers or retained source success gates.** The30s could begin when corresponding C1/C2 output command becomesON, or only after its ON feedback is confirmed. These differ even with a permitted0.5s contactor response and neither reference nor current newR&D gates uniquely select the deadline's intended start.

Minimal addressed question for root:

> При принятом включении LV/HV, от какого события считать30с ожидания Healthy: от фактической команды C1/C2 ON или от подтверждения соответствующего контактора feedbackON?

Do not combine that question with already answered values, buttons, door, PLC arbitration or StateConflict destination. ReadyHealthy already present cannot be converted into an unnecessary30s hold; this is a maximum waiting watchdog, not mandatory successful wait.

**Failure output/recovery is a separate residual question.** Numeric500ms/30s does not select which current outputs to retain/remove, rollback ordering or fault acknowledgment while the cause persists. Existing known limits remain: no declaring higher state without required confirmations; no automatic continuation after failure; discharge before C2OFF on specified stop paths; noUnlock until permitted safe completion; safety priority preserved. Latest point13 defines acknowledgment only **after** described failed up has rolled back withSafetyFault: anybuttonPRESS acknowledges, consumes attempt, bothOFF2s/newgesture. It is not a complete rollback procedure or permission to clear an active/incomplete failure.

For a concrete missing-feedback timeout, architect must first map existing approved rollback/removal actions. Only if a choice remains should root ask the exact initialphase/command/feedback event and missing action. Example: actualC2OFF command issued, C2FBK remainsON beyond500ms after required dischargehold — exact C2/discharge retention and permitted manual recovery are still not selected by the numeric reply. Do not ask a generic recovery question or choose Emergency versusTransitionFault during the separate state-exclusion audit.

## Independent criteria handoff and staging

Prepare identified monitors/source-consumption traces and numeric boundary scenarios now, preserving exact commandwriter and program input polarity. Add paired successfully confirmed C1/C2 ON/OFF and LV/HVHealthy examples once the origin is answered; missing-confirmation cases remain honestly partial until full failure action/owner is defined. Probe Healthy beforedeadline/atdeadline/afterdeadline, contactor feedback0/499/500/501ms, commandcancel/reverse, staleheldrequest, alreadymatchingfeedback and actual protective event on same handling interval. These are scenario dimensions, not approved new behavior for unspecified contexts.

No new500ms/30s implementation belongs in narrow F1. Pass this decision to the later reviewed timeout/STOP/fault architecture with resource/native source rules and independent tests/review. The response deadlines are approved; their complete monitor/recovery implementation is not yet fully specified. This clarification does not block independently defined F1/state-exclusion/P0 work and does not alter the selected scope of existing specialists.
