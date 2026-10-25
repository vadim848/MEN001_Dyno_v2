# TwinSAFE v2 — proposed change plan

> Current authorization includes local SAL logic corrections under WORKFLOW.md.
> Follow ../AGENTS.md and ../WORK_STATUS_AND_PLAN.md. Hardware is accepted;
> physical investigation/validation gates below do not block software testing.

Status: proposal only. No TwinSAFE source has been changed.

2026-10-18 refinement: see `V2_IMPLEMENTATION_GROUPS.md` for exact network
scope, prerequisite evidence and baseline-versus-candidate test separation.
`EMERGENCY_REQUIREMENTS.md` binds EMG-001–012 to actual observations and gaps.

## Entry criteria before editing

1. Review and accept the requirement baseline in `SAFETY_STATE_MACHINE_SPEC.md`.
2. Decide whether `in_Mentee_EStop` must be an active emergency input.
3. Confirm the TwinSAFE meaning of `FBEstop1/EStopIn1 = Single-Channel Both Activated`
   and why the separate `in_ES_NC_2` alias is assigned to a deactivated port.
4. Decide the discharge completion policy: certified `HV Safe` feedback or a
   formally validated time-only procedure.
5. Confirm final timer values. Current proposed button values are 1 s single,
   0.5 s chord window, 2 s both, and 2 s neutral release.

## Proposed implementation order

### 1. Button-command state machine

- Add an explicit neutral/re-arm state requiring both buttons released for 2 s.
- Add a 0.5 s chord-formation window.
- Qualify green-only and blue-only for 1 s.
- Latch `TwoButtonsAttempt` when the second button arrives in the chord window.
- Require two continuously stable buttons for 2 s.
- Never degrade a failed/flickering two-button attempt into a single command.
- Require a fresh full release cycle after every accepted or failed attempt.

Acceptance: B01-B15 and the current-v2 regression tests.

### 2. Cover unlock and transition interlock

- Use identical blue-button behavior in Safe and R&D.
- Drive the unlock solenoid only from the qualified blue-held command.
- Remove the current Safe latch-after-release behavior.
- Force unlock OFF before accepting StepUp.
- Require locked feedback before starting an upward transition.
- If an earlier unlock/open action occurred, require a fresh button gesture
  after locked feedback returns.

Acceptance: C01-C10, including the reproduced unlock-plus-StepUp conflict.

### 3. State and transition cleanup

- Preserve one-hot state ownership for Safe, R&D, Run and transition phases.
- Document the final mapping of Step1, Step12, Step_RnD and Step2-Step6.
- Ignore new operator commands throughout every transition phase.
- Prevent automatic state restoration after restart or emergency recovery.

Acceptance: D/E/H suites and full normal-cycle test.

### 4. SS1, Healthy and STO

- Keep the regenerative source and C2 connected during normal SS1.
- Monitor Healthy from the start of SS1.
- On Healthy loss, select STO without waiting for the current common 2 s gate.
- Latch the emergency/coast path; Healthy recovery must not resume SS1 or
  shorten the coast time.
- Keep cover unlock inhibited throughout the sequence.

Acceptance: F01-F08 and G01-G03.

### 5. Discharge and C2

- Start discharge while the source and C2 are still connected.
- Do not open C2 until the approved completion condition is satisfied.
- Require C2 OFF feedback before entering R&D.
- Add explicit timeout/fault behavior for discharge and C2 feedback.

Acceptance: G04-G10. Hardware validation is mandatory.

### 6. Emergency and auxiliary interlocks

- Activate `in_Mentee_EStop` if confirmed as a required emergency source.
- Validate both physical main E-Stop channels in the TwinSAFE editor/runtime.
- Preserve external NC1/NC2 and LV/HV connector protection.
- In Safe, missing connector contacts only block upward movement.
- After leaving Safe, loss of any required connector/external interlock starts
  the approved emergency energy-removal sequence.
- Recovery must not cancel a latched emergency sequence.

Acceptance: A05-A08 and power/external-interlock scenarios.

## Change-control workflow

1. Create a dedicated `codex/...` branch only after explicit approval.
2. Preserve the current v2 SAL and CRC as the baseline.
3. Make one functional group of changes at a time, in the order above.
4. After each group: XML audit, SAL static checks, dynamic scenarios, mutation
   check, TwinCAT/TwinSAFE Verify and Build, then review the diff.
5. Finish with online runtime traces and hardware validation before acceptance.

## Known validation boundary

The independent adapter is suitable for regression and discrepancy detection.
It is not a certified TwinSAFE runtime and cannot validate electrical timing,
actual motor standstill, DC-bus voltage, contactor mechanics or safety integrity
level by itself.
