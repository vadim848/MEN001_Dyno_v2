# Run-down / StartingRun abort: scenario audit

Superseding answers2026-10-20: нижние вопросы1/2/3 заменены прямыми
D-HV-TIMED-COMPLETE,D-RUN-STOP-WAITS,D-STARTINGRUN-ABORT-SEQUENCE.
HVexistinghold→C2OFF→C2FBKOFF; SS1=2с,STO/coast=5с; abortбезSS1,
STO→Discharge&delay→C2, без energizingcancelledlaunch. READY requirement
handoff USER_STOP_SEQUENCE_HANDOFF.md. Не повторять answered вопросы;
N6simultaneousfanout sourcegap остаётся coverage/implementation obligation,
не автоматически approvedstop. LVboundedaccepted неpromoted.

2026-10-20. Analyst, source-first read-only audit. **READY for known
qualification/cancel-owner checks; full shutdown acceptance remains HOLD on
unresolved HV completion and source-mapped waiting semantics.** No code/test
or other document modified. Latest user answers LV completion, Run BOTH ignore
and StartingRun fresh-green abort are answered, not questions to repeat.

Read current Network6 Decouple2/And18 directly via exact SAL parser; read
user-decisions-architecture/RUN_STARTINGRUN_ARCHITECTURE.md and its LVcandidate
base identity b7096fa…/4eb2639…; read SPEC8–10, latest user handoff and
DISCHARGE_PROGRAM_CONTRACT. Reference removal sequence was previously read
directly and traced in that contract/REFERENCE_PHASE_MAPPING. No cancelled
reference access repeated. Source observations below are not a new functional
execution or hardware assertion.

## What the sources actually establish

Reference Run protection routes Step4→Step5→Step6→Safe, with LV/battery/BMS
removal, existing 2s before Healthy-selected STO paths, existing delayed5s or
immediate STO path, STO feedback before Step5, timed HV discharge/C2OFF and
C2OFF feedback. Original Green does not implement new normal Run→RnD.
Normal RnD pause intentionally retains LV, so copying complete protective
Step4 removal is not an approved equivalent normal stop.

Current normal N6/OR5→Decouple2 has one common source for ResetSTO2_4,
ResetSTO1_4, SetHVDischargeRequest3 and ResetHVC2_4. Current Decouple2 order207
writes all four in its execution; DecOut4 also drives TON0.2, then And18
order208 requires TON output and inverted C2 feedback to request Step12.
Actual IDs distinguish DecOut3 017ebfaa-212b-4694-9a18-58d34250a932 from
DecOut4 a8f703e4-f0f5-4b92-ae84-917fc658bc97. Later Step12 confirms RnD
using LV feedback/Healthy. This route has no separate SS1/coast/HV-completion
gate. Discharge command is not separate completed-discharge feedback.

New counted abort plan routes ABORT_OWNER into existing normal OR5 and keeps
this fanout. Thus it can implement requested abort invocation/cancellation but
does not itself establish compliance of the inherited downstream sequence with
SPEC8–10. The direct user wording "прервать запуск и выполнить сценарий
Run→R&D" does not explicitly approve a new interpretation of simultaneous C2
drop, nor does it waive previously agreed stopping requirements. Conversely it
does not independently specify a new C2 delay. Earlier analyst shorthand
"not immediate C2" is justified only by existing SPEC8–10 ordering, not by
claiming that phrase was a new direct user instruction.

## Already normative: test without a new decision

- Fresh Run green500 and fresh StartingRun green500 after full neutral2000
  must initiate normal down; StartingRun initial context is accepted launch
  with STO released and Run confirmation pending. No owner/Run flag injection
  substitutes for that provenance. Short/held/invalid chord must not qualify.
- Run BOTH ignore and irreversibility/rearm rules remain. StartingRun abort
  is a new attempt; late second of the original launch must not cancel it.
- Accepted abort must cancel old launch ownership and prevent late C2/Healthy
  confirmation from reviving the cancelled upward transition. Actual normal
  stop routing and immediate guard/consumer chronology can be observed without
  pretending that reaching OR5 proves safe completed shutdown.
- SPEC8: stopping phase, LV retained for RnD pause, SS1 on both drives,
  source/C2 retained during regenerative braking, continuous Healthy monitoring,
  then discharge before C2 removal, C2OFF feedback before completed RnD.
- SPEC9: Healthy loss during SS1 selects STO/coast and fault; restored Healthy
  must not undo selection or shorten the existing required wait. No Unlock or
  completed RnD while wait/discharge pending. These qualitative requirements
  do not authorize new numerical timer settings or equate raw TRUE to healthy.
- SPEC10: timeout→latched TransitionFault, UnlockFALSE, no automatic continue;
  C2FBKON prohibits completed RnD. Missing success/failure input mapping cannot
  be replaced by LV Healthy, discharge-command echo or an arbitrary deadline.

Original command/Reset routes and timer settings are to be preserved except
approved behavior changes. Implementing agreed stop ordering may require new
software routing/gates; it is authorized intent, not permission to remove the
protective full-removal path, invent times or change group/hardware parameters.
Keep inherited downstream discrepancies explicit if accepting a narrower
recognizer/abort-owner iteration. No full STP/EMG completion PASS from that.

## Genuine remaining behavioral questions for root

Do not ask answered LV/QR/QT again. The following are targeted remaining
program-contract questions, not hardware validation gates:

1. **HV success:** normal Run→RnD (or accepted StartingRun abort) has reached
   discharge, source/C2 still connected, discharge command asserted, existing
   code's discharge hold elapsed. Is that existing timed sequence sufficient
   to permit C2OFF and then require C2FBKOFF, or must it await another already
   available program indication? If another indication, which input/value
   change constitutes success? No new timer value is requested. The LV_C1FBK
   answer applies to LV→Safe and does not answer this HV question.
2. **Waiting selection/source contract:** after normal down is accepted while
   torque was permitted, which EXISTING timer or existing program feedback
   marks end of normal SS1 wait, and which marks end of STO coast after Healthy
   loss? The preserved protective sequence has 2s and Healthy-selected5s paths,
   while normal N6 has no such wait; none may be silently named T_SS1_Normal
   or T_STO_Coast. Raw input values/contact logic are source facts; their
   agreed good/bad Healthy meaning and intended existing wait association need
   explicit program-contract evidence if not already documented. No physical
   time recalculation or target precision investigation is requested.
3. **StartingRun-specific unavailable-source case, only if reached:** accepted
   launch/STO released, full neutral/newgreen accepted while C2 stillOFF or
   Healthy not confirmed. Normal down is required, but source is not yet in
   the assumed connected/healthy Run condition. Should stopping wait for the
   same existing SS1/coast path under its actual Healthy value, and is discharge
   still requested with C2OFF, or is an existing alternate shutdown branch
   intended? This asks the missing output sequence under specified inputs,
   not whether to abort. Never energize a cancelled launch solely to imitate
   a fully established Run without an explicit agreed reason.

HV no-success/timeout output retention C2/discharge and permitted manual reset
remain the separately recorded Q-COMPLETION question. Fault/Unlock/no-auto
requirements are already known; only unspecified command/reset details need an
answer. Root should consolidate overlapping pending questions rather than
re-ask identical ones. If existing approved source mapping resolves item2 or
item3, record that evidence and ask only the remaining unresolved reaction.

## Independent progress and proof limits

Proceed with Run attempt qualification, ignore endpoint, StartingRun cleanup,
newgreen acceptance, actual cancel-owner/fanout, late-feedback no-revival,
fault priority, old RnD/earlySTO and source-preservation regressions. Record
N6 simultaneous fanout as existing behavior, not a newly approved stop oracle.
Use conditional exact Network4 cuts when required, full audit before closure,
all-producer/native Reset/Set observations and continuous first-sample traces.
Capture C2OFF-before-success or absent required wait as a known requirement
gap/conditional FAIL where prerequisites are established; unknown completion
values/unsupported adapters are NOT VERIFIED, never invented FAIL/PASS.

No new physical timing, mappings, native Verify/Build, equipment or hardware
feedback-origin work is requested. Missing software contract blocks only its
dependent completion implementation/acceptance; independent work continues.
ALL WRITES STOP after this audit.
