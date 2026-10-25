# Isolated LV254 full-suite migration result

SAL b7096fa3cf7349ea0be08f347180deb071a0f6b75612c4e5c8a7f45cf0557161; SGVL 4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5.
Input manifest 9aba6efcea99eaa19251baeacbfe4e722b7f7516fbb0a74ffb7bf145914c8254: 295 files, unchanged=true, child exit=1.

harness: PASS, 189/189 PASS, 0 FAIL, 0 skip.
historical: PASS, 74/75 PASS, 0 FAIL, 1 skip.
current: FAIL, 436/438 PASS, 2 FAIL, 0 skip.

Discovery 438/438; four approved official replacement cases, no missing-owner placeholder. Case summary {"PASS":199,"FAIL":1,"NOT VERIFIED":8,"ERROR":0}.
Whole-source binding PASS; protected seven core implementations unchanged. BOOT NOT VERIFIED, functionalBootPass=0, execution.performed=false.

current: not ok 391 - SR-RG-INVALID-green-remain-green failed chord cannot degrade
current: not ok 393 - SR-RG-INVALID-blue-remain-green failed chord cannot degrade

ACC-B01: NOT VERIFIED Complete recognizer/reset ownership is not yet bound across Safe/R&D/Run
ACC-C02-F: NOT VERIFIED Full-phase coverage of both InterLock NC energy guards and separate DoorMonitor solenoid reactions remains incomplete; no locked-feedback gate is required
ACC-C01-E: NOT VERIFIED Software coverage of all transition phases and fault/button combinations remains incomplete
LATE:NO-FAULT: NOT VERIFIED Network12 component has no bound complete group/fault observation; absence of a parsed Error is not proof of no fault
LATE:NO-ROLLBACK: NOT VERIFIED Single request producer is observable, but accepted transition/event ownership and downstream rollback are not bound in this component; no fake latched marker used
STATE:conflicting-set-requests: FAIL {"label":"conflicting requests cannot report simultaneous Safe and Run","actual":true,"expected":false}
REF:existing-EStop: NOT VERIFIED Reference source unavailable; other software checks continue
BOOT:UNSUPPORTED_UNBOUND_PROGRAM_INPUT: NOT VERIFIED Network4 has eight unbound DECOUPLE inputs and seven used phase writers; native unbound values are not established
BOOT:UNSUPPORTED_GROUP_LIFECYCLE: NOT VERIFIED RunStop/ErrAck are declared and bound, but the adapter has no group lifecycle/memory/error engine; requested Run and main EStop Restart do not establish group RUN/ErrAck

Initial diagnostic RED run-001 is unchanged. Isolated reference unavailable remains disclosed skip/NV; no access bypass or substitute source. Current tests always parse the fresh candidate; expected graph is explicit historical0fc→72→LV254 composition. Latest separate Run/StartingRun/SS1/HV requirements are not implemented by this LV migration. No hardware/native Build/Verify/CRC/deployment claim.
