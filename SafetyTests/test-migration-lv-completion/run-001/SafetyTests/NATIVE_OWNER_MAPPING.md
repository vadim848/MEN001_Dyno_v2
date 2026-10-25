# Native-style transition owner — isolated plan, 2026-10-18

Generate: `npm run design:owner -- --write` -> `NATIVE_OWNER_PLAN.json`.
Implementation: `src/native-owner-plan.js`; tests: NOWNER01–05.

## Structure

- One eight-channel DECOUPLE snapshot: four normal-route memories, Emergency,
  previous-up/down/manual-ack bits.
- 56 AND/OR gates with inverted contacts where required; each has 2–8 inputs.
- Eight reset-dominant RS memories committed after next-state computation.
- Output gates execute after memory commit. The 65 relative positions include
  snapshot, Boolean gates, memory writes and final normal-request gates.
- Twenty explicit Boolean external inputs include semantic mode flags,
  commands, acceptance guards, fault/proof signals, route completion and
  route-timeout indications. No timeout duration is encoded or approved here.

This is a connection plan in native block vocabulary, not importable SAL.
It has no project aliases, certified target resource allocation or CRC.

## Ownership / priority

Route acceptance uses the old Idle snapshot, fresh command edge, matching
mode, explicit guard, non-stale completion and no emergency takeover. Down
blocks simultaneous up, including cases where no down route is available.
Retained route memories survive the command ending until matching completion
or emergency takeover.

Emergency takeover suppresses all normal route outputs, clears normal active
memories and latches Emergency. The interrupted-route diagnostic/phase context
required by the energy sequencer is not retained by this core and must be
provided separately before integration. Clearing the normal request must not
be interpreted as immediate C2 opening.

Recovery requires an old Emergency memory, hazard-removal proof and fresh
manual edge with current emergency conditions clear. Acknowledge held before
proof cannot become accepted merely because proof later arrives. Mode or
owner-memory conflicts also latch Emergency and suppress normal requests.

Timeout indications require the old route memory and absent valid completion.
Completion at the same sample as timeout wins for that route unless an actual
fault/emergency overrides it. This remains the proposed prototype arbitration
policy, not a confirmed physical timing requirement.

## Verification

The independent plan evaluator strictly resolves every input/reference, snapshots
memory, executes ordered gates/RS and reads final outputs. Host memory starts
explicitly FALSE; native startup encoding remains unresolved.

- NOWNER01: four routes retain pulses through release and complete against the
  host prototype's outputs.
- NOWNER02: 1000 deterministic mixed command/guard/completion/fault/recovery
  samples compare active requests, accepted/completed events, busy and Emergency.
- NOWNER03: explicit timeout-versus-completion arbitration.
- NOWNER04: corrupted ownership, missing-input rejection and native fan-in.
- NOWNER05: deterministic fault-over-completion and fresh manual recovery.

Diagnostic strings, interrupted-route storage, native timing and complete
hardware behavior are outside the comparison. Existing model mutation score
does not certify this plan. No outputs or working SAL are connected or changed.

## Next integration step

Host integration is now exercised in `INTEGRATED_CONTROL_REPORT.md`; native
timers/startup and physical bindings remain unresolved.

Connect the conceptual recognizer and this owner in a single non-deployed
contract harness. Check command pulses, busy feedback, mode changes and cover
inhibition at one common sample boundary. Keep timer/startup/native-boundary
producers explicit; do not replace them with assumed safe constants. Review
how interrupted sequence context is retained before selecting an emergency
energy-removal path. Native editor Verify/Build/CRC and capacity checks remain
required before any actual SAL integration.
