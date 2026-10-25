# Isolated button/cover prototype — 2026-10-18

Implementation: `src/button-cover-prototype.js`.
Readable graph: `BUTTON_COVER_PROTOTYPE_GRAPH.json`.
Contract tests: `test/button-cover-prototype.test.js` (PROTO01–07).

The prototype does not import or drive the working SAL. It evaluates an
AND/OR/NOT next-state graph from a snapshot of seven Boolean state memories,
then commits all next-state values. Host-side millisecond accumulators model
qualification timers and the inclusive chord comparison. These are not native
TwinSAFE blocks or an exported/verified SAL graph.

Input defaults deny physical access: `safeEnergyForAccess` is FALSE unless
explicitly supplied. Semantic Emergency/fault/transition conditions are external
preconditions, not reconstructed from unvalidated electrical signals.

## Checked contract

- Held inputs at startup and interrupted release qualification issue no command.
- Green produces one pulse per attempt; 100 ms release cannot re-arm.
- Chord arrival at 490/500 ms permits a qualified command; 510 ms rejects it.
- Losing one chord button never creates a single command; a full new both-held
  interval is required after restoration.
- Held-blue access stops on release or fault. Fault recovery with blue held
  cannot resume unlock without a new full release/qualification cycle.
- Mode change, transition and loss of energy-access proof remove permission;
  restoring permission while holding blue does not re-enable it.
- Corrupted/conflicting state ownership inhibits outputs and returns to release
  qualification with a fault indication.

The last two recovery policies refine the proposed design; they are prototype
choices requiring integration review, not new approved physical procedures.

## Remaining boundary

Samples in the contract tests are 10 ms; prototype accepts 1–10 ms samples.
The chord-age convention uses the accumulated first-button interval at the
sample where the second button becomes visible. Real sampling uncertainty and
native inclusive timer encoding remain unresolved.

This validates selected conceptual contract cases only. It does not prove
TwinSAFE startup, native block equivalence, group behavior, accepted transition
request ownership, energy sequencing, diagnostics or hardware safety. Existing
model mutation score does not constitute mutation coverage of this prototype.

The current SAL still has its independent acceptance FAIL results. Prototype
passes must not replace or relabel candidate acceptance outcomes.

## Next deliverable

Request-owner prototype is now implemented separately; see
`TRANSITION_REQUEST_PROTOTYPE.md` for sustained request and emergency ownership
contracts. Native block mapping and physical completion bindings remain next.

Design and test an accepted-transition request owner: a one-scan recognizer
command must survive button release until feedback completion or approved
fault/abort handling. Then map graph operations/timer boundaries and explicit
initialization to supported TwinSAFE blocks in a non-deployed candidate.
Physical access proof and emergency bindings remain prerequisites for live use.
