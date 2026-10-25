# Native TwinSAFE block mapping — non-deployed design, 2026-10-18

Continuation: `NATIVE_OWNER_MAPPING.md` and `NATIVE_OWNER_PLAN.json` now provide
an isolated native-style owner graph and comparison tests. Live integration,
physical bindings and native startup/timer encoding remain unverified.

References: [TwinSAFE Logic FB manual](https://download.beckhoff.com/download/document/automation/twinsafe/twinsafe-logic-fb_en.pdf)
sections 3.1, 4.1, 4.6, 4.10 and 4.12; [EL6900 instructions](https://download.beckhoff.com/download/document/automation/twinsafe/el6900en.pdf).
The documented AND permits inverted contacts and requires at least two
connected inputs; RS is reset-dominant. DECOUPLE passes corresponding channels.
Configured global order is significant. These facts support the proposed
mapping, not approval of a generated configuration or resource budget.

## Generated recognizer core

`npm run design:native -- --write` produces `NATIVE_RECOGNIZER_PLAN.json`:

- One DECOUPLE snapshot with seven used state channels.
- 33 AND/OR gates for the next-state equations.
- Seven RS state memories, all committed after the combinational gates.
- 41 relative block positions for **this core only**, excluding boundary
  producers, qualification timers, output gates and request owner.

NOT is encoded as an inverted consumer contact, not a fictitious native NOT
block or a one-input AND. Each generated AND/OR gate has 2–8 connected inputs.
For a state, `Set = NextState`, `Reset = NOT NextState`; contacts make these
mutually exclusive. Snapshot inputs reference the previous state-memory values.
Relative numbering must be inserted into a newly reviewed whole-group order;
it must not be appended without checking the existing 205-block schedule.

NATIVE01 enumerates all 2^11 boundary combinations for each of the seven
one-hot input states (14,336 contexts), comparing lowered contacts with the
conceptual next-state equations. This proves combinational translation for
those contexts, not timing/state-machine equivalence on TwinSAFE. NATIVE02
checks ordering and gate fan-in. Invalid state ownership is an external inhibit
producer to this core and remains a separate mapping responsibility.

## Boundary producers and timer proposals

| Boundary | Proposed producer | Status |
|---|---|---|
| off / both / greenOnly / blueOnly | Raw physical button AND/contact expressions | Boolean mapping available; physical safe input aliases retained |
| candidate / primaryLost | Snapshot state and raw-button AND/OR contacts | Boolean mapping available |
| releaseDone | TON on WaitRelease AND both OFF AND NOT inhibit, preliminary 2 s | Native timing/reset and startup validation required |
| singleDone | TON enabled across Armed first-single sample and matching single Candidate, preliminary 1 s | Preserve continuity at state handoff; verify scan timing |
| bothDone | TON enabled on Armed-both, accepted in-window candidate chord, then TwoAttempt-both, preliminary 2 s | Losing either button resets; verify native timing |
| within | Inclusive first-press age <= preliminary 500 ms | **Unresolved:** do not substitute NOT TON(0.5 s) and silently reject equality |
| inhibit | Fault/emergency/transition, invalid ownership, mode-change and access-loss policy | Proposed semantic composition; physical bindings and diagnostics unresolved |

Every boundary is explicit and unbound in the generated plan. No boundary has
a fabricated TRUE/FALSE default. Timer placement belongs after raw/snapshot
fact producers and before next-state gates. The core's relative orders do not
include those producers and are not ready for direct import.

## Command pulse mapping

Compute pulse terms from the snapshot before committing state memories:

```text
DownPulse = Snapshot.GreenCandidate AND GreenOnly AND SingleDone AND NOT Inhibit
UpPulse   = Snapshot.TwoAttempt AND BothRaw AND BothDone AND NOT Inhibit
```

Next-state Locked consumes that attempt. The following snapshot therefore
cannot emit another pulse. Output fault/raw gates remain after the appropriate
combinational terms. Positive pulse ownership must be proved with native scans;
no pulse is connected directly to a contactor or the old level-driven stop input.

## Accepted-request owner mapping

| Function | Proposed blocks / equations |
|---|---|
| Current ownership snapshot | DECOUPLE channels for four route memories plus Emergency and previous-command bits |
| New command edge | AND(Command, NOT PreviousCommand); explicit RS update for PreviousCommand after edge computation |
| Route acceptance | AND(IdleSnapshot, ModeValid, NewCommand, Guard, NOT StaleCompletion, NOT EmergencyEvent) |
| Route memory | RS Set=accepted route; Reset=matching qualified completion OR emergency takeover; retain otherwise |
| Normal route output | AND(RouteMemory, NOT EmergencyMemory, NOT EmergencyEvent) |
| Emergency memory | Reset-dominant RS with Set=EmergencyEvent AND NOT RecoveryAccepted; Reset=RecoveryAccepted; RecoveryAccepted itself requires NOT EmergencyEvent |
| Recovery acceptance | AND(EmergencySnapshot, HazardRemoved, FreshManualEdge, NOT EmergencyEvent) |
| Normal completion event | AND(RouteSnapshot, MatchingCompletion, NOT EmergencyEvent) |
| Busy/inhibit | OR(any route memory, EmergencyMemory, current EmergencyEvent) |

An isolated owner graph is now emitted separately; its snapshot/commit schedule,
command-edge handling, emergency priority and timeout indication arbitration
have host comparison tests. Native execution and a complete energy sequencer
are not established by that graph. See the continuation report for scope.

Emergency takeover suppresses normal route outputs but must preserve enough
phase/energy context for the emergency sequencer. It does not authorize an
immediate C2 opening. Interrupted-route diagnostic retention is separate from
an active normal command and cannot independently enable energy.

## Cover output mapping

Final AND permission requires qualified blue-held, raw blue, NOT raw green,
eligible steady mode, NOT transition, NOT Emergency/fault and independently
proved safe access energy. Upward acceptance requires distinct closed/locked
feedback. No current input proves all of SafeEnergyForAccess; its connection
remains blocked pending hardware/procedure evidence. The native owner/core
cannot replace that missing physical proof.

## Next

Construct an isolated native-style request-owner graph and verify pulse/memory
handoffs against OWNER scenarios. Separately resolve inclusive timer encoding
and explicit initialization in TwinSAFE editor/export. Only then assemble a
non-deployed candidate and review its supported blocks, capacity, order, Verify/
Build and CRC before any live integration. Existing candidate acceptance and
production reference repository remain unchanged.
