# Scenario review: bounded Safe|RnD resumption

2026-10-20. Analyst handoff. **READY for isolated candidate construction and
technical replay; NOT production SAL READY or functional acceptance.**

Read AGENTS.md, WORKFLOW.md, WORK_STATUS_AND_PLAN.md, SCENARIO_DECISIONS.md,
SAFE_RUN_GESTURE_SOURCE_REVIEW.md, test requirements and independent plan review,
and revised SAFE_RUN_RESUMPTION_ARCHITECTURE.md (255-node correction).
Directly read reference Network2 And3/TON3/And4 and its native relationships:
original feedback readiness is ANDed with current physical qualification before
the energy request. Reference has no added RnD recognizer. Reference identity
is the user-confirmed Prodoction4495a1f; fresh git HEAD verification was denied
by sandbox and its escalation was cancelled, so no fresh HEAD assertion is made.
Current SAL SHA256 observed: 0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909.

## B2: permitted partial boundary

The revised Safe|RnD-only scope is scenario-compatible in principle. Retaining
the complete current Run physical branch (TON2, And24, And23, raw button inputs,
consumers and chronology) avoids introducing the rejected shared recognizer's
new consume/ignore behavior for qualified BOTH in Run. MODE excludes stable
Run. Run invalid-short-chord failures remain mandatory known failures, not
waived tests. This is a partial improvement, not acceptance of current Run.

QT is not resolved: StartingRun must retain its existing RnD request owner
interval and SG/SU behavior, including both early-STO fanouts, until actual RnD
exit. An early Run latch rise is not authorization to clear SU. QP remains
unresolved: preserving PLC branch text alone is insufficient if shared owners,
guards or execution ordering alter its behavior. Actual source diff and normal
owner overlap replay must establish the claimed unchanged boundary.

No new user question arises from the bounded split itself. Existing QR/QT/QP
questions in SCENARIO_DECISIONS.md remain pending. The split must not introduce
their answers through owner resets, new routing or retained pending requests.
If replay exposes such a change, dependent implementation returns HOLD rather
than treating missing endpoint assertions as neutrality.

## B1: known scenario acceptance criteria

- Stable Safe, all relevant permissions except original And3 readiness true:
  qualify valid BOTH, release before And3 becomes ready, wait until old/current
  BOTH timer clears, then restore readiness. No delayed physical Step12 request
  may arise from that unaccepted attempt. Fresh correctly armed gesture with
  readiness present is a required positive control.
- Same initial unready guard, but retain BOTH continuously after qualification:
  readiness may enable the original physical request while still held. Do not
  incorrectly consume the attempt merely because BOTH timed out before And3.
- Preserve the original feedback/permission chain and actual And4 conjunction;
  Safe accepted-owner Set must follow that conjunction, not bare timer expiry.
  Its lifetime after acceptance requires ordered technical evidence.
- Safe green single stays Safe; raw main-EStop Restart remains separate.
  After complete neutral release/filter a new blue500 gesture must be available.
- Safe connector absence alone does not prohibit qualified blue access under
  existing Door/grant conditions and does prohibit new energy advance. This is
  not permission to bypass external InterLock/EStop/PLC Stop/Mentee guards.
- Valid Safe BOTH window is <=250ms, continuous both1000ms from second input;
  single500ms, existing neutral release2000ms. No timer changes are authorized
  by this resumption. Existing late-second, no chord-to-single and held-entry
  requirements remain unchanged.

## Owner and verification limits

Replay must cover Safe->RnD, RnD->Step2->Safe and RnD/Run overlap with actual
phase writers and unseeded recognizer state. A MODE OR is not proof of a neutral
scan. Conditional Network4 inactive boundaries must be enumerated; they do not
prove BOOT/group lifecycle or hardware behavior. Preserve retained native
relative order except the explicitly justified Safe And4 move. Restore original
FinishUp sample chronology via retained scoped FinishUp as revised architecture
requires; one output edge cannot replace the accepted internal-sample oracle.

Required technical gate remains independent review of full SAL/SGVL bindings,
RnD69/earlySTO88 regressions, paired B1 cases, first fault/restart/rearm and
listed normal owner lifecycle traces. EStop first fault must suppress commands;
restoring an input without permitted Restart is not automatic acceptance.
Do not infer a complete emergency endpoint from that bounded recognizer check.
All known FAIL and mandatory NOT VERIFIED stay visible. No source/test changes
were made by this analyst review; questions and technical design remain separate.
