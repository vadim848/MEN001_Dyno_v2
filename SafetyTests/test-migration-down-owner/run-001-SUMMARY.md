# Independent isolated full-suite migration result

Snapshot: run-001; SAL 72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e; SGVL de0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56.
Input manifest SHA256: 5625dba72f4248f87d2227d93cfb737de3adcf80502027dc9f1d51c1337f718b. 280 inputs; unchanged=true. Child exit=1.

harness: PASS, 189/189 PASS, 0 FAIL, 0 skipped.
historical: PASS, 74/75 PASS, 0 FAIL, 1 skipped.
current: FAIL, 436/438 PASS, 2 FAIL, 0 skipped.

Case summary: {"PASS":199,"FAIL":1,"NOT VERIFIED":8,"ERROR":0}.
Whole-source binding audit: PASS; BOOT NOT VERIFIED, functionalBootPass=0, execution.performed=false.

current: not ok 391 - SR-RG-INVALID-green-remain-green failed chord cannot degrade
current: not ok 393 - SR-RG-INVALID-blue-remain-green failed chord cannot degrade

ACC-B01: NOT VERIFIED Complete recognizer/reset ownership is not yet bound across Safe/R&D/Run
ACC-C02-F: NOT VERIFIED Full-phase coverage of both InterLock NC energy guards and separate DoorMonitor solenoid reactions remains incomplete; no locked-feedback gate is required
ACC-C01-E: NOT VERIFIED Software coverage of all transition phases and fault/button combinations remains incomplete
LATE:NO-FAULT: NOT VERIFIED Network12 component has no bound complete group/fault observation; absence of a parsed Error is not proof of no fault
LATE:NO-ROLLBACK: NOT VERIFIED Single request producer is observable, but accepted transition/event ownership and downstream rollback are not bound in this component; no fake latched marker used
STATE:conflicting-set-requests: FAIL undefined
REF:existing-EStop: NOT VERIFIED Reference source unavailable; other software checks continue
BOOT:UNSUPPORTED_UNBOUND_PROGRAM_INPUT: NOT VERIFIED Network4 has eight unbound DECOUPLE inputs and seven used phase writers; native unbound values are not established
BOOT:UNSUPPORTED_GROUP_LIFECYCLE: NOT VERIFIED RunStop/ErrAck are declared and bound, but the adapter has no group lifecycle/memory/error engine; requested Run and main EStop Restart do not establish group RUN/ErrAck

Known Run/STATE conflicts remain visible. Reference unavailable stays NOT VERIFIED; no substitute source. This is isolated software evidence, not final project acceptance, hardware validation or deployment.
