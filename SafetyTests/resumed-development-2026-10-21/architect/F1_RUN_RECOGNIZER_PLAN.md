# F1 Run shared-recognizer / accepted-down-owner handoff

FROZEN plan for independent review. Base exact isolated native P0 SAL34b5b850... /SGVL517fdadd... /diagram7b5eb794.... File: F1_RUN_RECOGNIZER_PLAN.json. No candidate built. Generator is a construction aid; rerunning allocates new object IDs and invalidates this frozen plan/review. Do not rerun during review.

## Bounded behavior and242-block count

P0241 minus duplicate rawRunTON1 plus one native8inputOR and one nativeRS =242. Data ports2066-2+9+3=2076; globals206+3=209; variables75 unchanged; wires306-2+3=307. All retained native IDs/orders/parameter values and current source-slot repairs remain except explicit full-ordered manifest/new bindings. Removed duplicateRunTON0.5 is replaced by already existing GREEN0.5, not retimed.

- MODE includes real Run. Shared GREEN/BOTH now recognize Run attempts under same current EStop/NC/connectors/PLC gating and release2s. Existing RND_SCOPE and STATE_SG/SU reset scopes do not change. InRun, GATE020.AndIn5=linkSafeRndScope isFALSE, so a BOTH does not finish into SU or GATE030 C through that path. Irreversible capturedT owns the ignored BOTH attempt until full release2s and prevents degradation to either single; C need not becomeTRUE. SU also remains reset by its RnD-only scope.
- And24 input3 consumes linkRndGreenQualified, not rawRunTON. !ResetLock and !False stay. And23 retains Run qualifier and And24 output; old raw !Blue input3 is deactivated because shared recognizer decides late-second arbitration. Otherwise blue arriving exactly500 would cancel an already qualified green command contrary to D-Q500/D-LATE-SECOND.
- RUN_DOWN_OWNER is reset-dominant nativeRS; Set=And23Out, Reset=bStepRndSet ORbStep4Set OR!linkRndGatePermit. Owner holds the accepted request through release/late second until actual terminal handoff or stronger protective event; physical input OR5.OrIn1 reads owner. PLC OrIn2 unchanged.
- ResetOR and owner are inserted directly after retained And24 in the exact manifest; existing And23 remains earlier. Thus new Set uses actual And23 and its original previous-And24 chronology, not an assumed same-scan combinational feedback.

## Exact consumed-value chronology and Q500

Let scanq be first GREEN500-qualified scan. Shared GREEN producesTRUE before late And24. And23 executes earlier than And24 and therefore consumes previous And24; its qualification first appears scanq+1 if Run still active. New ownerSet after And24 consumes that actual And23 publication. OR5 runs before both, so consumes owner onq+2; the earlier Decouple receives OR5 onq+3 and actual actuator RS consumes according to original ordering. This is source causality, not permitted physical delay or a new timer.

At secondbutton500, GREEN can qualify inq and C consumes attempt. Rawblue suppression is removed only from And23, so qualified event reaches owner even when blue is nowON. Late second251..499 produces no GREENqualification and no owner; valid BOTH followed by partial release produces no single. Blue added after already accepted event cannot reset owner. Current safety permission loss or actual protectiveStep4 request resets owner with priority; those cases are not late-second rollback.

If lock isTRUE atq, And24FALSE, event C is consumed and no request is queued until lock later clears. If Run exits before And23 sees its pending qualified value, Run qualifierFALSE rejects it; no stale request transfers into RnD. These ordered cases need explicit tester traces.

Owner Reset must use real bStepRndSet/N11 completion and bStep4Set sources. A fixture must not seed either to FALSE or override current owner. Initial Run positive may use declared component entry only; integrate actual Safe→RnD→Run and complete/down→RnD→newcycle as independent lifecycle tests. In actual stable Run before freshgreen, N11 completion isFALSE because Step12 isFALSE; prove real producer closure, not a guessed state.

## Required checks before promotion

1. Real cleanRun single499/500 positive; valid ArmedBOTH ignored; bothorders250; late251/300/499; failedchord11→10 /11→01 held; onebuttonrelease/repress without2s; premature neutral held. Observe sharedGREEN, C/A/T/L, actual And24/And23 ownerSet/Reset/Q and true actuatorrequests.
2. Existing accepted single at500/late600 not canceled by secondbutton; exactly one down per attempt; hold/release through Run→Step12→RnD must not produce RnD→Safe. Old initiating BOTH held through real Run entry never turns into down, up or Unlock. After bothOFF2s a genuinely freshgreen works.
3. LockTRUE rejection, rawguardfalse, criticalcoincidence Set/Reset priority, rawrestore withoutmanualRestart, accepted owner cannot reappear onrestoration. Native source permissions preserved, paired controls to prove no permanent disable.
4. Existing RnD69/earlySTO88/Safe15/LV/emergency source suites and independentP0 semantic behavior. Structural migrations only exact oldRunTON retirement/new nativegate and owner ledger; same functional expectations unchanged.
5. Native source rule, exactgraph/usage indices, all76nonprogram records/85GVL declarations/current75Symbols, retainedgeometry and independent freshCRC nativecounts. New owner/reset data/port shapes created through nativeAPI. No rawwriter or port-type promotion.

**Known limitations explicitly retained:** old immediate STO/discharge/C2 fanout violates required normal2sSS1 and remains FAIL until F2. F1 deliberately changes command qualification/lifetime only and is not normalstop acceptance. StartingRunfreshgreenabort, PLCnewrequest, internalSafetyFaultack, StateConflict and BOOT remain separate stages. Existing fixed2ms fanout assertion is historical/legacy scope, not the future normative stop oracle. Never report this stage as all41 complete.

Reviewer clarification: Run ignoredBOTH is held by T, not necessarily C; no JSON graph change was required. The frozen JSON hash remains b52f6b0e440a09ce138ad91e633b2fcd78f431d246a4dbdabc083809a0a08b60.

