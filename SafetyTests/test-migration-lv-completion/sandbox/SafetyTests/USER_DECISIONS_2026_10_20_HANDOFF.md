# Analyst → architect: three user decisions

Status follow-up2026-10-20: separate newdecision baseline reports8PASS/12FAIL/
2NV/0ERROR on unchanged72f42d…/de0fa…; USER_DECISIONS_BASELINE_REVIEW accepts
the bounded RED test package. Implementation acceptance remains pending.
This is not an implementation acceptance. LV normalcompletion is ANSWERED,
implementation pending. Accepted independent A1/A2 emergency40PASS package
does not test these new command endpoints; do not use it to close them.

2026-10-20. **READY requirements/test-criteria handoff**, not SAL implementation
approval. Source inspected before criteria: confirmed reference original Step2
start/Run path (earlier direct read and REFERENCE_PHASE_MAPPING), current source
72f42d…/de0fa… and down-owner architecture, DISCHARGE_PROGRAM_CONTRACT.
SCENARIO_DECISIONS records the latest direct user answers relayed by root.
Only requirements are changed here; native code, timer parameters and tests
remain for separate architect/editor/independent tester/reviewer stages.

## 1. RnD→Safe LV completion

Initial stable RnD, HV already discharged/C2OFF, healthy applicable permissions;
full neutral2000, new green alone500. Execute existing agreed LV shutdown order.
After LV commandOFF, `in_LV_C1_FBK=FALSE` is sufficient completion evidence for
LV discharge and transition to Safe. No new completion input, wait or timer.
Actual command-off and feedback-off are distinct observations; feedbackFALSE
already present at down entry must not skip required command-off sequence.

Required positives: feedback goes OFF after actual shutdown; feedback already
OFF when the shutdown sequence reaches its completion check. Both may complete
Safe under all other agreed prerequisites, through real writers. Negatives:
feedback remainsON → no Safe completion; healthy raw restoration/SG clearing/
elapsed time alone → no LV/HV reenergization; repeated held green → no new
attempt. Observe Safe/RnD/Step2 owners, LV/HV commands, down owner and real
consumers continuously. After actual Safe, full neutral and new correct BOTH
with original guards must permit next Safe→RnD; do not seed Safe to prove cycle.
Pair with legitimate original Step2-start preservation controls. Existing no-up
fix is not permission to retain Step2 forever now that completion is defined.

## 2. Valid BOTH in Run is ignored

Initial established Run, healthy conditions, no PLC-triggering route, bothOFF
full2000; both orders second249/250 and simultaneous; both held continuous1000
from second. No normal down, up, Unlock, energy-step change or fault due solely
to this gesture. Maintain Run unless an independently valid protective event
occurs. Continue holding beyond threshold; release either one and hold the
other beyond500: still no single from that attempt. BothOFF/full filter then
fresh green500 remains the normal Run-down positive. Include >250-before-single
late and short failed-chord negatives under unchanged shared button rules.
Ignore is an endpoint policy, not removal of irreversible chord/rearm rules.

## 3. New green in StartingRun aborts through Run→RnD

Initial real accepted RnD launch with torque permission released by accepted
early-STO route; actual Run confirmation not yet complete. Release both and
complete2000ms neutral; still in StartingRun, press green alone500.
Before500 no new accepted down; at qualification initiate interruption of launch
and the agreed Run→RnD shutdown sequence. Observe accepted launch, STO command,
real stop/down owner and all downstream command/phase writers. Do not substitute
seeding Run or SG for evidence of acceptance from StartingRun.

Required rejection controls: held green without full cleanup, <500 single,
invalid chord→green, repeated hold must not qualify a new down. Late second
of the original accepted launch must not abort it; this decision concerns a
fresh post-cleanup attempt only. Emergency on the same handling interval keeps
its defined priority. Launch feedback arriving after abort acceptance must not
restore the cancelled launch or create an automatic upward step; a later start
requires a new accepted request. No new native scan delay or physical time is
specified. Existing normal SS1/STO/coast/discharge and feedback order applies;
do not interpret abort as immediate contactor drop or immediate RnD.

Qualification and known initial abort/owner/no-rollback checks are READY. Full
normal shutdown completion still depends on the separately open HV completion/
timeout contract; this new decision does not answer it. StartingRun must remain
unconfirmed long enough for cleanup/newgreen in the fixture via explicitly
declared permitted feedback conditions, not arbitrary owner writes. If there
are materially different source contexts before C2ON/Healthy confirmation,
test each against the same requested normal shutdown semantics; return any
unresolved source/requirement conflict to analyst rather than inventing bypass.

## Preserved limits and acceptance gates

Single500, chord<=250, both1000 and release2000 remain unchanged. Unlock and
DoorMonitor roles, both ExternalNC, EStop, Mentee, PLCstop and connector guards
remain. Standalone PLC QP, invalid-state destination and HV completion/recovery
policy remain pending; no new question is asked here. Latest answers supersede
older pending QR/QT/LV statements only in stated contexts. Full source binding
audit before subgraph and actual ordered writer evidence remain mandatory.
Architect defines counted native design; independent tester prepares honest
baseline RED/positive controls before editor implementation and independent
review. All other mandatory FAIL/NOT VERIFIED remain visible.
