# Timer continuity and order experiment — 2026-10-18

Generate: `npm run design:timers -- --write` ->
`TIMER_CONTINUITY_EXPERIMENT.json`.
Implementation: `src/timer-producer-experiment.js`; TIMER01–03 tests.

## Fixture

A synthetic safeAND/safeOR/safeTON model executes through `SalRuntime` with
global configured block order, explicit raw/snapshot inputs and no unconnected
fallback ports. TON parameters use 1/2 s, compatible with the proposed basic
configuration grid. State snapshots are supplied by the test: no native state
feedback, group startup, target binary or hardware time is modeled.

The both-button branch requires explicit `WithinProof`. Its value is a test
precondition, not a solved chord-window implementation. No working SAL, reference
repository or deployment alias is used or changed.

## Results

| Variant | SingleDone at 990 ms | 1000 ms | 1010 ms |
|---|---|---|---|
| First sample included, gates before TON | FALSE | TRUE | TRUE |
| Armed first sample omitted | FALSE | FALSE | TRUE |
| TON before current input gates | FALSE | FALSE | TRUE |

TIMER01 proves these order/continuity differences in the host model. It does
not establish an actual 10 ms delay on the physical EL6900.

TIMER02 switches Candidate -> TwoAttempt while both inputs stay held and
checks the uninterrupted 2 s qualification. Losing either relevant input
clears the TON; restored buttons must complete another full 2 s interval.
TIMER03 interrupts a nearly complete release qualification with Inhibit:
qualification resets and another complete neutral interval is required. A new
button press also clears it.

## Design consequence

Native input enables must cover the first accepted sample as well as the next
state, and remain continuous across ownership changes. Compute these enables
before TON execution, then next-state/pulse logic and memory writes. Moving
TON earlier or dropping Armed from its enable changes the contract by a sample.

These experiments strengthen the proposed schedule but leave the inclusive
500 ms boundary, real cycle/jitter, startup/reset constants and group behavior
open. Host passes cannot replace TwinSAFE editor/Verify/runtime evidence.

## Next

Trace DoorMonitor/lock and available energy-safe sources through the existing
PLC/project mappings, extending the binding table with file/port evidence.
Then review which native boundary producers can be assembled without assumed
proof inputs; leave unresolved physical/timer bindings explicitly unconnected
in the non-deployed design. Do not change candidate SAL until those integration
conditions are established.
