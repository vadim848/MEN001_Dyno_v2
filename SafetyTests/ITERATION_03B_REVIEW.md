# Independent review — iteration 03B

2026-10-19. Reviewer only; implementation and tests were not edited.

## Verdict

**HOLD — not accepted yet.** Host functional and structural checks below pass,
but the internal WINDOW ESTOP activates an unintended unbound second input.
This is a program serialization/model agreement question, not a requirement
to perform native Build/Verify or hardware validation.

Reviewed source: SAL SHA256
`a45f129ebdc8e60602465381fd7a0579c8c9c18a84c9ae9a6abdb45cb462e51a`;
SGVL `06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5`.
Comparison checkpoint: `c69bc32`; current design is optimized253 plus
`03B_COMPACT_RELEASE_FIX_PLAN.json`, not historical254/netnew45 proposals.

## Open finding R3 — native helper channel semantics

WINDOW.EStopIn1 serializes `Single-Channel Both Activated`, while EStopIn2
is `Both Deactivated` and has no producer. SDK enum inspection distinguishes
Activated1=`Single-Channel 1 Activated`, Activated2=`Single-Channel 2 Activated`,
and ActivatedBoth=`Single-Channel Both Activated`. The host adapter treats
only the individually active first port as demanded, so green host tests
alone cannot establish how the native pair resolver interprets this mixture.

Independent SDK IL replay now confirms the defect: `InPort.GetCoPartner`
maps FBEstopBase paired object indices8/9; `GetMaster` returns the first port
for the second. `TwoChannelInPortSettings.ReloadCurrentState` RVA207072,
IL0067–0080 assigns activationState1 for `Single-Channel Both Activated`
regardless of whether the current port is master or slave. The slave's own
`Both Deactivated` field therefore does not suppress its effective activation.
IL00BE–0138 distinguishes master/slave for `Single-Channel 1 Activated`.
Reproduction: `scripts/read-sdk-il.ps1` with Type InPort/GetCoPartner and
TwoChannelInPortSettings/ReloadCurrentState; installed SALDesigner.dll is
read as metadata only. No project was loaded or built.

Required closure: approved exact one-channel native serialization, explicit
structural expectations, and meaningful paired-activation regression so the
host/source audit cannot again accept ActivatedBoth plus an unbound slave.
Then rerun affected actual tests. No dummy TRUE second input, main EStop
change or approved timing change is justified. Architect prepares the repair;
editor remains stopped and explicitly marks this package unaccepted.

## Checks completed

- Independently executed actual69 physical integration plus5 native graph
  tests: **74/74 PASS**, zero skips. A previous run overlapped editor changes;
  the stable repeat completed successfully. Independent design R1 replay was
  48/48 PASS, separately identified as design evidence.
- Read full actual SAL/SGVL bindings, graph serialization, dynamic dependency
  closure, modified candidate/current adapters and source metadata tests.
  Audit precedes cuts; demanded unknown sources fail closed. Runtime/parser
  and clock implementation are unchanged from the checkpoint.
- Confirmed253 blocks, unique native IDs and execution sequence, canonical
  edges once per pair, exact graph integrations, ten software globals with
  matching indices. Existing block attributes differ only by approved order
  shifts and names of three moved TONs; original port/parameter attributes
  remain unchanged. Original timer identities/values and SGVL declarations
  survive the explicit approved changes. Existing Door, Mentee and five-input
  emergency Unlock protections remain.
- Actual tests cover symmetric249/250/251 and nearest fixed grids, single
  500, BOTH1000, late300/500/600, piano/flicker, held entry/reentry, retained
  requests, inhibit controls, actual LV/HV/Unlock consumers, release1999/2000
  and fresh firstpress2001. R1 prepares P/A within the existing release
  interval rather than extending it; fresh249/250 chords after blue are tested.
- Full reported package:178 harness /75 historical /186 current tests pass;
  functional201 PASS /1 FAIL /5 NOT VERIFIED /0 ERROR; standalone47/0/5.
  These aggregate counts were read from editor artifacts, not independently
  reproduced by a second full pipeline. Actual74 checks above were reproduced.

## Review corrections closed

R1 release preparation was returned to architecture after fresh attempts
failed. Four logical changes preserve orders/count/times; both old positives
and new distinguishing controls pass.

R2 originally mislabeled internal FinishUp observations as downstream
`b_Set_Transition_3`, then incorrectly expected a new FinishUp after neutral
while retained SU still owned RnD. Current code separates retained request
from native Set qualification, requires no new event throughout busy neutral,
and supplies an explicitly injected phase exit/reentry plus full filter for
the fresh positive. This resolves the counterexample without changing SAL.
Mapped TON qualification is observed before consumed reset and is not called
an accepted output/transition event.

## Limits and remaining work

The145-block branch uses26 given inputs and typed Network3 ownership cuts;
it does not prove full lifecycle reachability or PLC handshake policy.
`safeEstop.Error` is a host stub observation, not proof of native/group
no-fault behavior. Current reports state this explicitly. No physical timing,
native Verify/Build, CRC regeneration or hardware safety is claimed.

The existing conflicting internal Network3 set-requests FAIL and five NV
items remain visible. Complete emergency destinations, cross-mode ownership,
accepted-transition rollback and earliest STO work remain separate. The
independently reproduced LV/HV one-sample PLC fault/recovery Set gap is an
existing scoped follow-up, not closed by this recognizer or represented as
a new03B regression. The41-requirement project is not fully accepted.

Shared R&D permit is assessed against approved EMG002/004/007 requirements,
as adjudicated by the analyst. Old fault-permissive singles are not positive
preservation oracles; Safe connector-absence access is a separate scope.

Reviewer writes STOP pending R3 evidence or a revised implementation.
