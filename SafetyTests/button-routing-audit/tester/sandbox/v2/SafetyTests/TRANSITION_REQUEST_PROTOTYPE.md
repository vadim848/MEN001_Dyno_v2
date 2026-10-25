# Accepted transition ownership prototype — 2026-10-18

Implementation: `src/transition-request-prototype.js`.
Tests: `test/transition-request-prototype.test.js` (OWNER01–06).
This is an isolated host prototype, not live SAL or a contactor sequencer.

## Interface and state

| Input/output | Contract |
|---|---|
| `mode` | Explicit semantic steady/source mode Safe/R&D/Run; caller owns authoritative state validation |
| `stepUp`, `stepDown` | Recognizer command pulses; owner additionally consumes only a new rising edge |
| `allowUp`, `allowDown` | Explicit current acceptance guards; missing/false rejects the request |
| `completion[route]` | Independently established sequencer completion; no default TRUE, no inferred elapsed-time completion |
| `emergency`, `fault`, `invalidState` | Override normal completion and commands; latch Emergency ownership |
| `hazardRemoved`, `manualRecoveryPulse` | Both required for emergency recovery; fresh manual edge after proof is available |
| `request` | Sustained normal route only while Active; NULL in Emergency/Idle |
| `requestEmergency` | Sustained emergency-removal request; interrupted normal route is diagnostic only |
| `completed` | One-sample completion event naming target; does not drive or fabricate the physical mode |
| `inhibitRecognizer` | TRUE while Active or Emergency; also inhibits cover permission in the integrated contract |

Routes: SafeToRnD, RnDToRun, RunToRnD, RnDToSafe. Run/Safe have no further
up/down route respectively. Simultaneous commands prefer down, including guard
rejection: a rejected down request cannot fall through into upward acceptance.

## Ownership rules

1. Accept only in Idle, with valid source mode, a fresh command edge and
   explicit guard. A completion signal already HIGH at acceptance is rejected.
2. Retain the route after the pulse ends or buttons release. Ignore new commands
   during the transition; do not overwrite a pending route with another target.
3. Finish only on that route's explicit completion. There is no automatic
   timeout success or synthetic feedback. Source-mode changes do not by
   themselves establish completion.
4. Emergency/fault wins over simultaneous normal completion. Suppress the
   normal route output and retain only diagnostic interrupted-route identity;
   request emergency removal. Releasing/restoring inputs does not cancel it.
5. Recover only after hazard-removal proof and a fresh manual recovery edge,
   with current fault inputs clear. Emit a Safe recovery event. An acknowledgement
   held before proof becomes available does not later become valid by itself.
6. Optional route deadlines are illustrative configuration only. A supplied
   timeout escalates to Emergency; valid completion at the same sample boundary
   wins unless an emergency/fault is present. This deadline arbitration is a
   proposed prototype policy requiring review. No physical times were approved.

## Verified scenarios

OWNER01 retains one-sample down through release and competing commands until
completion. OWNER02 rejects held retrigger and stale completion. OWNER03 checks
fault-over-completion priority and manual recovery gating. OWNER04 checks guard
and down priority. OWNER05 checks illustrative timeout/boundary arbitration.
OWNER06 connects the command recognizer to this owner: a qualified single
command retains R&D-down for subsequent blue hold with no unlock/new command.

## Integration boundary and next work

The prototype does not implement SS1, STO/coast, LV/HV discharge, feedback
qualification or emergency output ordering. Normal route suppression does not
mean immediately opening C2: emergency ownership must select the approved
energy-removal sequencer. Completion/guards may not be sourced from raw HMI
mode bits or assumed safe-HV constants.

Production/reference repository and working v2 SAL remain untouched. Candidate
SAL acceptance is still 2 PASS / 14 FAIL / 3 NOT VERIFIED; these prototype tests
do not change it. Existing model mutation score does not cover this new owner.

Next map recognizer state memory, accepted-request memory, pulse generation and
explicit startup to supported native TwinSAFE blocks in a non-deployed design.
Keep inclusive chord encoding, safe-access proof, EDM and Network4 unresolved
until editor/runtime evidence establishes them. Review the native interface and
block execution schedule before integrating any energy-command path.
