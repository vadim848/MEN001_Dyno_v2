# Concrete correction groups — proposal, 2026-10-18

> Implementation proposal; local SAL corrections are authorized under WORKFLOW.md.
> Follow ../AGENTS.md and ../WORK_STATUS_AND_PLAN.md;
> physical bindings/configuration are accepted conditions, outside this scope.

Button/cover detail: `BUTTON_COVER_DESIGN.md` specifies shared ownership,
transition rules, block seams, final permission gating and integration limits.
In particular recognizer pulses require latched transition ownership; they
cannot replace sustained stop levels directly.

Working repository only: `MEN001_Dyno_v2`; reference `MEN001_Dyno/Prodoction`
is read-only. No TwinSAFE source changes are included in this proposal.

Baseline SAL CRC: `872783435`.
SHA256: `B1FA361F5647EBA2A5BB8436E4853D8773BA7F6B0ACBF1E7F96C519196251DAA`.
The embedded CRC is recorded evidence, not a recalculated Beckhoff validation.

This refines `V2_CHANGE_PLAN.md`; its six functional groups stay in that order.
The preparation below is a prerequisite for those groups, not an approval to
deploy or a substitute for missing physical design facts.

| Group | Proposed scope | Acceptance / exit evidence |
|---|---|---|
| Preparation | Inspect Network4 used unconnected channels, Network6 DecIn5, E-Stop channel/EDM configuration and editor execution order; snapshot baseline SAL/tests under v2 before edits | Resolve supported runtime inputs; maintain reference SHA/CRC; no assumed constant silently establishes acceptance |
| 1 Buttons | Replace separate Safe Network2 / R&D Network12 / Run Network6 gesture qualification with one command-recognizer contract; retain downstream safety checks | B01–B15 against real modified SAL including release/chord boundaries; no failed chord becomes single; times still preliminary until confirmed |
| 2 Cover | Network1 unlock latch and Network2/12 command writers; one qualified held-blue policy plus energy/phase inhibition | C01–C10; EMG-007 with blue held across every fault and transition; closed/locked feedback independently required |
| 3 States | Network3 ownership plus Network5/9/11/12 handoffs; separate Step2 entry reasons; define accepted down-transition ownership; inhibit energy increase in faulty phases | D/E/H, EMG-001–006/011–012; R&D down never energizes HV; Safe only after feedback; emergency recovery cannot restore Run |
| 4 SS1/Healthy/STO | Network6 normal-return path and Network7 stop path plus Network1 SS1/STO consumers; common explicit stop/coast sequence | F01–F08, G01–G03, EMG-008/009; immediate fault selection; selected coast branch cannot change on recovery; physical polarity/times resolved first |
| 5 Discharge/C2 | Network6 direct C2 reset path, Network8 timed removal and Network11 return qualification; approved completion input/procedure and feedback timeouts | G04–G10, EMG-010; retain source/C2 until approved completion; missing feedback cannot produce R&D/Safe; requires discharge-policy decision |
| 6 Emergency/interlocks | Consolidate applicable emergency priority across Step1/R&D/Step12/Step2/Step3/stop phases; preserve existing independent NC2/Mentee paths until reviewed | EMG-001–012 phase traces plus A/P scenarios; connector exception only in Safe; no new-energy command under applicable fault; runtime channel validation |

## Baseline versus acceptance tests

Many current tests deliberately assert defective baseline behavior. Before
modifying SAL, retain a pinned baseline fixture inside v2 with its hash and
explicit test binding. Keep those reproduction tests on the fixture; run
required-behavior tests against the candidate SAL. Do not “fix” the harness by
changing expected results to match a candidate without requirement evidence.
The production reference repository must not become the mutable fixture.

Each group needs a readable candidate diff, structural/input audit, meaningful
positive/negative acceptance scenarios and model mutation checks. Beckhoff
Verify/Build, CRC review and then online/hardware validation are separate exits.
No branch switch, PLC download or hardware mapping change has been performed.

## What can proceed now

Complete IDs for remaining specification families and missing acceptance
scenarios; prepare pinned baseline fixture/test bindings; refine the state and
command interface design. Physical-order and safe-HV decisions must remain
pending until supported by wiring/runtime evidence and approved parameters.
