# Proposed paired helper contract

Design only; behavioral execution NOT RUN. Implementation follows plan review
and exact candidate handoff, under this directory's single writer.

`createPair({baselineSal,baselineSgvl,candidateSal,candidateSgvl,expectedHashes,
planHash,initialComponent,observedSemanticKeys})` reads both pairs independently,
asserts whole-source audit and exact structural ledger before any selection,
then builds matching demanded closures using real typed global/alias IDs,
native paired Decouple channels and effective EStop input pairs. Paths are
explicit arguments; no environment substitution or source rewrite. Initial
cuts are recorded separately from raw protocol writes.

`pair.sample(rawWrites)` accepts given raw input aliases only, applies the same
write to both runtimes, runs the same fixed scan, and joins evaluation samples
by scan index plus stable semantic key. It verifies source hashes before/after.
Both runtimes keep original native relative order; comparisons do not reorder
execution. `advance(ms)` records every scan and requires an exact grid multiple.
Retired blocks are not executed, stubbed or added back to the candidate.

Before and after actual retained block evaluation, passive hooks record:

- Native block/port IDs/order and effective consumed input values;
- Native RS Set/Reset and immediate RsOut (reset dominance enforced locally);
- Native TON input/output and available state/accumulation/reset evidence;
- Real SNAP0/SNAP1 consumed recP/recPrev values;
- Relevant phase, shutdown, energy proposal/permission/RS/output and outward
  values continuously, plus existing globals after complete publication.

A semantic map explicitly distinguishes unchanged reader IDs, merged aggregate
result, replaced relay consumer and relocated global publisher. It maps old
recP publisher to G008 and old recPrev publishers to N6Decouple2 channels6/7
only as post-publication observations. SNAP reader comparison is primary.
No comparison requires a deleted port or an unused old slot to have a value.

Evidence includes input/phase-cut ledger, all four source hashes, plan/runtime/
parser/native-pair/clock identities, full audits and selected native definitions,
first divergence, continuous source-aligned samples, excluded channels and
status per scenario. Local causal assertions prevent downgrading an actual
native consumer response violation to NOT VERIFIED. Sparse/packed archives
must roundtrip losslessly; first mismatching sample cannot be hidden by final
output equality. Initial-state probing is labeled component algebra/equivalence,
not proof of whole startup or a normative oracle for invalid states.
