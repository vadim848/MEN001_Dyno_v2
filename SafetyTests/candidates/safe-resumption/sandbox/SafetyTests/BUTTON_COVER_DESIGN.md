# Button and cover correction design — proposal, 2026-10-18

Conceptual prototype now available: `BUTTON_COVER_PROTOTYPE.md` and exported
JSON next-state graph. Native TwinSAFE timer/initialization mapping remains open.

Scope: v2 only. No changes to live SAL, project mappings, reference repository
or PLC are included. This design uses existing specification requirements;
inhibit/recovery details marked proposed require implementation review.

## Command recognizer interface

| Signal | Meaning / ownership |
|---|---|
| `GreenRaw`, `BlueRaw` | Existing physical reset/release input bindings; do not replace with PLC mode bits |
| `RecognizerInhibit` | Semantic Emergency/fault, invalid state ownership or transition active; not merely `NOT b_EStop_Ok` |
| `StepDownPulse` | One recognizer scan; mode controller owns transition completion |
| `StepUpPulse` | One recognizer scan; mode controller rechecks all interlocks/feedback at acceptance |
| `BlueQualifiedHeld` | Qualified blue remains physically held and green remains OFF |
| `RecognizerFault` | Invalid recognizer ownership; command outputs FALSE |

The recognizer is shared across Safe/R&D/Run. It cannot restart on each mode
change or store one attempt per mode. PLC mode requests remain a distinct
reviewed interface and must not bypass interlocks or generate raw button state.

Proposed inhibit policy: immediately suppress all three command outputs, clear
an incomplete attempt and enter WaitRelease. Do not count neutral qualification
while inhibited. When inhibition clears, require the complete release filter.
Thus a blue button held across a fault cannot resume unlock on recovery.
This policy does not reset Emergency or interrupt accepted energy removal.

## States and transition rules

Use seven explicit states, not the existing independent button TON branches.
Proposed block implementation: seven reset-dominant RS ownership latches,
combinational next-state logic, TON qualifications and one snapshot layer.

| Current state | Condition, in priority order | Next state / output |
|---|---|---|
| Any | Inhibit or invalid ownership | WaitRelease; no command |
| WaitRelease | Both OFF continuously T_RELEASE_FILTER | Armed |
| WaitRelease | Any button ON | Remain; clear release timer |
| Armed | Both ON in the same sample | TwoAttempt; begin simultaneous hold |
| Armed | Only green / only blue | GreenCandidate / BlueCandidate |
| GreenCandidate / BlueCandidate | Primary lost | WaitRelease if both OFF, otherwise Locked |
| Candidate | Second arrives with first-press age <= T_CHORD_WINDOW | TwoAttempt; never return to a single candidate |
| Candidate | Second arrives after the window | Locked; no new command |
| GreenCandidate | Green alone stable T_SINGLE | Locked; emit StepDownPulse once |
| BlueCandidate | Blue alone stable T_SINGLE | BlueActive; BlueQualifiedHeld TRUE |
| TwoAttempt | Both ON continuously T_BOTH | Locked; emit StepUpPulse once |
| TwoAttempt | Exactly one ON | Stay TwoAttempt; reset simultaneous-hold timer |
| TwoAttempt | Both OFF | WaitRelease |
| BlueActive | Blue ON and green OFF | Stay; qualified held output TRUE |
| BlueActive | Green ON or blue OFF | Locked, or WaitRelease if both OFF; output immediately FALSE |
| Locked | Both OFF | WaitRelease; start a new full release interval |
| Locked | Any ON | Stay; no command |

Preliminary values remain release 2 s, single 1 s, both 2 s, chord 0.5 s.
Exact 490/500/510 ms behavior must follow the specification's inclusive
`<=` rule. A Boolean `NOT TON(0.5 s)` alone cannot establish that equality
case. The TwinSAFE timer representation and sample resolution must be verified
before choosing its block-level boundary encoding. Do not silently change the
window to make the diagram convenient.

## Proposed execution layers

1. Read raw inputs and snapshot recognizer state outputs before writing any
   ownership latch. A first DECOUPLE layer provides previous-state signals.
2. Evaluate inhibit, one-hot validity and qualification timer inputs using
   those snapshots. Reset relevant timers when their conditions are lost.
3. Compute all next-state conditions and accepted-command pulse terms from
   the same snapshot. Fault/inhibit overrides all lower-priority transitions.
4. Commit ownership RS latches together in the following configured global
   order region. For each state use mutually exclusive Set/Reset expressions;
   reset dominance must not consume a valid short command.
5. Emit pulse/qualified-held outputs with final raw-button and fault gates.
   Map command acceptance to the mode controller; never drive contactors here.

This ordering avoids the earlier mixed-old/new-state handoff artifact. At
startup WaitRelease must be initialized explicitly in the verified TwinSAFE
design; do not interpret an unconnected input as an initialization constant.
Zero active states before initialization is distinct from a valid armed state;
multiple active states must inhibit commands and raise a diagnosable fault.

## Cover permission and final output

Proposed semantic expression:

```text
CoverAccessAllowed =
    (ModeSafe OR ModeRnD)
    AND NOT TransitionActive
    AND NOT EmergencyLatched
    AND NOT SafetyFault
    AND SafeEnergyForAccess

UnlockCover = BlueQualifiedHeld
              AND BlueRaw AND NOT GreenRaw
              AND CoverAccessAllowed
```

`SafeEnergyForAccess` is an independently established safety condition: HV safe,
motion safe, contactors and completed removal consistent with the mode. It
must not be fabricated from a timer or a mode bit. Its physical binding is
currently unresolved. The expression is therefore a design contract, not a
deployable new Boolean wired to an assumed TRUE constant.

Do not include closed/locked feedback as a required condition for **maintaining**
an otherwise permitted held-blue unlock: the cover must be allowed to open.
Closed AND locked feedback belongs to the **upward acceptance** interlock.
An open cover in Safe/R&D after blue release is not a timeout/fault.

Proposed output ownership: replace the set/reset unlock writers with one final
qualified permission path at the existing solenoid alias. If an RS is retained
for tool constraints, it may not preserve unlock after BlueRaw drops or an
inhibit rises; prove the output falls in the permitted scan budget.

EmergencyLatched must combine applicable fault sources across all modes,
including independent NC2/Mentee/connector/external paths. FBEstop's
`b_EStop_Ok` alone misses several confirmed protective inputs. State-specific
connector handling retains the Safe/no-fault exception for upward inhibition.

## Exact legacy seams for replacement

| Area | Existing blocks/writers | Intended connection |
|---|---|---|
| Safe buttons | Network2/FBAnd10, FBTon3, FBAnd4, FBOr1 physical button branch | Consume qualified StepUpPulse plus Safe prerequisites; retain separate PLC path for review |
| R&D buttons | Network12/FBAnd5, FBTon1; FBAnd7, FBTon4; FBAnd2, FBTon2 | Consume shared up/down/blue-held outputs; preserve downstream feedback and mode gates |
| Run green | Network6/FBTon2, FBAnd24, FBAnd23 | Consume StepDownPulse into a latched stop-request owner, not the current level-driven removal fanout |
| Safe unlock | Network2/FBAnd7, FBAnd8 -> unlock globals | Remove direct/latching raw-blue ownership |
| R&D unlock | Network12/FBAnd2, FBAnd3 and monitor gates | Replace with common qualified cover permission |
| Solenoid owner | Network1/FBOr3, FBOr4, FBRs6 | Single final qualified permission; no competing legacy writers |

The new **pulse** cannot replace an old sustained Run-down level by itself:
Network6 currently needs the level to retain its timer/Step12 request. Similarly
R&D down must retain transition ownership through feedback. The integration
must introduce accepted-request ownership or wait for the state-controller
correction group. Do not create a command pulse that strands an existing path.

## Review and implementation exits

- Run recognizer contract and cover permission cases on a non-deployed candidate
  fixture before integrating with energy sequencing.
- Prove one command per attempt, exact window handling, flicker behavior and
  full release qualification; test startup, fault and mode-change hold cases.
- Add final-output blue-held fault tests for all semantic modes/transitions,
  keeping physical access proof explicit.
- Before live SAL integration: resolve startup/constant encoding and timer
  boundary behavior, latch accepted transition requests and establish safe
  energy/access bindings. Preserve the byte-pinned baseline.
- Then review the candidate diff, Verify/Build/CRC and runtime evidence.

Immediate next deliverable: an isolated, non-deployed block-graph prototype of
the recognizer plus permission gates, with explicit unsupported boundaries and
contract results. It must not be claimed equivalent to the full TwinSAFE runtime.
