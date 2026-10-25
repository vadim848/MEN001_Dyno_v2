# Stop sequence: analyst → architecture

## Latest superseding answer/status

D-STARTINGRUN-NO-COAST: незавершённый StartingRun abort — STO→сразуDischarge
→existingdischargehold→C2OFF→C2FBKOFF; ниSS1, ни5с coast передdischarge.
Немедленно — actualprogramorder. Нижние рассуждения о pending5s/relevantwaits
дляabort исторические и superseded. HealthyLossduringRunSS1 full5s unchanged.
Independent criteria: verify noSS1/no5s prerequisite, actualSTObeforedischarge,
noC2OFFbeforehold, C2FBKON noRnD, noenergizingcancelledlaunch C2ON/OFF cases.
LV_WORKING_TRANSFER_REVIEW now ACCEPT exactworkingLV254/boundedcanonical;
older finalreviewPENDING statements below superseded.295input proof describes
completed run; laterstatusdoc changes are expected doc-only deltas, not replay.

Status-only follow-up2026-10-20: LV254 is now actualworking b7096fa3…/4eb26392…,
normalSafecompletion and real freshnewcycle implemented in bounded scope;
core LV16/Safe15/RnD69/earlySTO88/emergency40/SG3 retained. Actualcanonical
189/75/436of438,200casePASS/1STATEFAIL/7NV0ERROR,295inputs unchanged.
FINAL_WORKING_EVIDENCE records21file wholeaudit/13structuralPASS. Postworking
review now ACCEPTS bounded working LV after independent actual-run review,
not whole41/BOOT/
nativeacceptance. Older unpromotedLV status below is superseded. Run/StartingRun
fullv2 and exact5s abort relevance choice still pending; no normativechange here.

2026-10-20. **READY requirements handoff; ALL WRITES STOP.** No code/tests
changed. Read latest root-recorded user answers and source contracts; reference
and current removal routes were read previously directly. Native source:
N7TON1=2s precedes LVreset/Healthy-selected5s paths; N8discharge has two1s
TONs and OR from discharge-command echo; currentN6 simultaneously requests
STO/discharge/C2reset then0.2s+C2FBKOFF beforeStep12. These are source facts,
not proof of compliant normalstop. Keep exact timer IDs/values and inspect
actual enable/hold/reset/consumers before assigning their new sequence role.

## Known normal Run→RnD contract

Freshgreen500 under existing attempt/permissions initiates normalstop. LV
remains for RnDpause. SS1 wait completes by existing2s timer. Required stop/
wait then discharge with connected source/C2 retained, existing dischargehold,
then C2OFFcommand and C2FBKOFF beforeRnD. Separate HVcompletioninput is not
required. Existing simultaneousN6fanout does not satisfy this ordering merely
because it is old code. Normalpause must not copy protectiveStep4 LVremoval.

Healthy loss duringSS1 selects STO/coast and retained fault; existing5s timer
completes coastwait. Healthyrestoration does not revert or shorten selected
wait. No completedRnD/Unlock before required wait/discharge/feedback.

## Known StartingRun abort contract

Actual acceptedlaunch/STOreleased, Rununconfirmed; bothOFFfull2000 then new
green500 aborts. NoSS1: user explicitly states motors notactive. Execute
STO→Discharge&existingdelay→C2OFF→C2FBKOFF→RnD; do notenergize cancelled
launch. Test both C2alreadyON and C2stillOFF/Healthyunconfirmed. AlreadyOFF
feedback cannot skip preceding required abort/STO/dischargehold. Late feedback
cannot revive up; laterstart requires fresh acceptedrequest. Originalattempt
late-second does notabort; this is a freshpostcleanup command.

Relevantwaits mapping: user identified STO/coast5s; do not replace it with
SS1timer2s onabort or waive it by assuming nomotion. Equally do not add serial5s
to every normalpath without tracing its actual STO/coaststage. Architect must
state which existing5s enable/reset applies to abort and normalfault branch,
using source conditions. If two behaviorallydifferent applications remain
after that mapping, isolate their competing traces for analyst; invent no time
and continue independent qualification/cancelowner. No answered question is
reopened; newphysical timing/hardwarevalidation is not required here.

## Independent criteria

- Observe actualowner/phase, SS1/STO commands, timerenable/elapsed/done,
  discharge,C2command/feedback,LVcommand,soleUnlock fromfirstsample.
- Healthy normalpositive: full2s from actualSS1enablededge, then required
  dischargeorder/C2FBKOFF. No invented totaldeadline or gracewindow.
- Healthy-loss/restore before5s: retaincoast/fault, noearlycompletion or revert;
  rawpolarity fromactualcontacts, notname-based electrical inference.
- Discharge initiallylatched/unlatched, both N8ORenable alternatives and input
  interruptions: currentTONreset semantics. ORbypass means two1s timers are not
  guaranteed2s total. NoC2OFFbefore requiredhold; noRnDwithC2FBKON.
- StartingRun freshgreen<500/500, nofullcleanup, invalidchord, lateoriginal
  attempt, C2ON/OFF cases; latefeedbacksame/nextscan cannot revivecancelled up.
- Preserve RunBOTHignore, RnD69/earlySTO88,Safe qualification,LVdownowner,
  legitimateoriginalStep2startup and protective fullremoval controls.

Timeout→latchedTransitionFault/UnlockFALSE/noautocontinue alreadyagreed;
successhold is not automatically watchdog. ExactC2/discharge failure retention
and manualreset remain separate if unanswered. No newfeedback/timeoutnumber.
Fullbindingaudit beforecuts, demandedinputs resolved, nativeorderedSet/Reset
and continuoussamples. SevenN4cuts/initialphase remain componentlimits, not
BOOT/group proof. Latestanswers close HVsuccess/SS1coastnumbers/abortSS1need;
LVcompletion remains LVoff+LVFBKFALSE. LV isolatedboundedacceptance notpromoted,
fullmigrationpending. Architecture/editor/tester/reviewer gates remain.
