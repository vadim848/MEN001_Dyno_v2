# Safety evidence and input bindings — 2026-10-18

> Scope update: hardware configuration is accepted, not investigated.
> Physical evidence gates below are historical. Current software evidence:
> SOFTWARE_CHECK_RESULTS.md / .json; rules: ../AGENTS.md.

This is a scenario-family matrix, not the final per-requirement traceability
matrix. Emergency IDs EMG-001–012 now appear in specification section 19;
`EMERGENCY_REQUIREMENTS.md` binds them to evidence and gaps. Remaining families
are assigned group IDs in specification section 20; atomic per-feedback
coverage is incomplete. Scenario IDs come from `../SAFETY_TEST_PLAN.md`.
A passing regression can preserve
a known discrepancy. No row represents completed hardware validation.

Baseline binding update: twelve reproduction suites now read the pinned
checkpoint fixture rather than the working SAL. Their evidence remains
historical. Audit scripts inspect the candidate; acceptance is tracked in
`ACCEPTANCE_BACKLOG.md`, not inferred from a green baseline suite.

## Reproducible input inventory

Run `npm run audit:inputs`; add `-- --write` to regenerate
`SAL_INPUT_INVENTORY.json`. The JSON includes every declared external alias
input, raw channel identifiers, consumers and unresolved input references.

Current full SAL inventory:

- 27 external alias inputs; electrical polarity and runtime levels unverified.
- 205 execution numbers spanning 1–205 with no duplicates.
- 145 unconnected non-deactivated input ports, including unused Decouple lanes.
- 10 of these belong to channels/blocks with used outputs: Network4 DecIn1–7,
  Network6/FBDecouple2/DecIn5, and Network1/FBEstop1 EDM1/EDM2.
- No explicit reference to a missing producer in the complete parsed SAL.

These counts are structural findings, not a verdict. Unused Decouple lanes do
not by themselves indicate an error. E-Stop EDM activation/configuration needs
separate semantic review. For non-Decouple blocks the affected-output list is
conservative; it does not prove that every port controls every output.

Partial-network tests omit producers deliberately and seed selected states.
Their external global preconditions must not be confused with complete SAL
bindings. The inventory distinguishes missing producers from unconnected
ports. Three tests prove detection of the known transition gap, a removed
wired producer and an omitted global producer.

## Evidence matrix

| Scenario family | Model evidence | Actual SAL evidence | Status / remaining dependency |
|---|---|---|---|
| B01–B15 buttons | Independent recognizer tests | Network12 button tests; real 0.5/0.5/1 s timers and failed-chord degradation | Known mismatch; full Safe/R&D recognizer acceptance incomplete |
| C01–C10 cover | Model cover scenarios | Safe/R&D latch tests, unlock/upward conflict reproduction | Known mismatch; physical lock polarity and full phase matrix unresolved |
| D/E upward modes | Model feedback/state tests | Network3 latch mapping plus partial Network12 feedback paths | Partial; no full-project commissioning or wiring proof |
| F/G Run-down | Model SS1/coast/discharge tests | DOWN01–04 and OUT01–04 bind selected Network1/3/6/11 chains | C2 command removal lacks completion gate in tested chain; SS1 meaning/polarity and competing paths unresolved |
| H R&D -> Safe | Model normal/timeout tests | EXIT01–05, RNDSAFE01–05, global-order audit | Selected global-order chain can reach Step2 and raise LV/HV commands; legacy lost-handoff result is withdrawn |
| A05/A06 emergency | Model phase scenarios | ESTOP01–05, CHAIN01–12, PHASE01–03 and 144 observational phase/control cases | Non-Run reaction differs from Step3; see EMERGENCY_PHASE_REPORT.md. Network4 excluded, no-EDM assumed, seeded states |
| Power/external interlocks | Model P01–P04 | Static paths, connector subset, CHAIN07–10, observational eight-step phase matrix | Run stop persists; seeded Step2 connector-loss trace does not inhibit HV. Runtime confirmation pending |
| Restart / state conflicts | Model and selected latch tests | Seeded ownership checks only | Full TwinSAFE initialization not established |
| Adapter semantics | Model mutations 5/5 | Global order, RS truth/state tests, unconnected-input sensitivity | Global ordering corrected; constants, group state, E-Stop and timing still partial |

## Next decisions and work

1. Review E-Stop EDM configuration and restart semantics from the existing SAL
   before extending emergency execution. Do not infer active monitoring from
   the inventory alone.
2. Resolve Network4's unconnected used channels and Network6 transition-status
   channel in TwinSAFE editor/Verify or authoritative project export.
3. Establish raw levels for SDS62/channel15, Healthy and AX5805 feedback.
4. Expand emergency/interlock traces only with explicit scope and established
   preconditions, then assign individual requirement IDs and complete coverage.

Until those runtime facts are established, independent model tests and structural
analysis can continue; full-project adapter results remain non-acceptance evidence.
