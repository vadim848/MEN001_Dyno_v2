# Integrated command/ownership/access contract — 2026-10-18

Implementation: `src/integrated-control-prototype.js`; COMBINED01–05 tests.
Example timeline: `INTEGRATED_CONTROL_TRACE.json`, regenerated with
`npm run design:integrated -- --write`.

## Common sample order

1. Snapshot native owner route/Emergency memories and busy state.
2. Advance conceptual recognizer using old busy/Emergency and current faults.
3. Send pulses and explicit semantic guards/proofs to the native-style owner;
   evaluate its ordered blocks and commit memories.
4. Freeze interrupted route and caller-supplied energy context on Emergency.
5. Gate final unlock with the **new** owner busy/Emergency state, current
   faults, raw buttons, mode and explicit safe-access proof.

Completion does not automatically update mode. Safe recovery is an event for
the caller, not proof that the machine is Safe. Semantic modes/proofs must
eventually be qualified by the real safety sequencer, not HMI-only status.

## Checked contracts

| Test | Result in isolated composition |
|---|---|
| COMBINED01 | Down pulse retains R&D-down after release; blue held during transition cannot unlock or issue a new command |
| COMBINED02 | Completion/mode change with blue held cannot reopen; fresh full release/qualification permits access |
| COMBINED03 | Fault removes qualified unlock in the same host sample; restoration/manual recovery cannot resume held-blue access |
| COMBINED04 | Interrupted upward route is diagnostic only; cloned energy context stays frozen despite caller changes |
| COMBINED05 | Emergency beats simultaneous completion; false acceptance guard rejects a recognizer pulse |

The example JSON records changed frames on a 10 ms grid. Hazard-removal proof
is explicitly supplied for the example recovery. It is not TwinSAFE online data.

## Limits and next work

Host timers and initialization feed a native-style owner plan evaluator. This
is not native verified TwinSAFE, candidate SAL execution or a physical output
path. No LV/HV/STO/discharge sequencer is implemented here. Frozen energy
context is diagnostic, not a safe-energy proof or certified phase memory.

Candidate acceptance remains 2 PASS / 14 FAIL / 3 NOT VERIFIED. Model mutation
score does not cover integrated/native equivalence. Production reference and
working SAL remain unchanged.

Next close native timer boundary/continuity and initialization encoding, and
prepare a producer/polarity/owner/completion binding table. Resolve editor and
hardware evidence before assembling candidate SAL or an energy-removal path.
