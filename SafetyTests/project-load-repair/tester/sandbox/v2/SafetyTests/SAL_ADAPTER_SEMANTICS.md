# Adapter semantics audit — 2026-10-18

Continuation: `ESTOP_SEMANTICS_REPORT.md` corrects E-Stop restart to release
qualification and its delayed output to off-delay. No-EDM remains an explicit
assumption; active/connected EDM is rejected. Earlier E-Stop behavior is obsolete.

## Authoritative reference

[Beckhoff TwinSAFE Logic FB documentation, version 4.3.0](https://download.beckhoff.com/download/document/automation/twinsafe/twinsafe-logic-fb_en.pdf):

- Section 3.1, printed page 18: block execution follows the configured order
  shown in the project tree and on each block, with consecutive numbering.
  We interpret the SAL `orderOfExecution` field as that group-wide numbering.
- Section 4.10.1, printed page 89: RS is reset-dominant; both inputs FALSE
  preserve the output. The adapter's Boolean RS rule agrees.
- Section 4.6.1, printed page 65: DECOUPLE transfers corresponding channels;
  used inputs and outputs must have their corresponding partner connected.
  This does not establish a universal TRUE value for an unconnected input.

## Changes to the adapter

- Default `executionOrder: "global"` sorts all blocks in the supplied group
  by their SAL execution number, across network boundaries.
- `executionOrder: "legacy-network"` preserves the previous behavior for
  explicit historical comparisons only.
- `unconnectedInput` exposes the existing fallback assumption, default TRUE
  for compatibility. `assumedUnconnectedPorts` records each fallback used.
  TRUE is **not** a verified Beckhoff constant; FALSE can be selected for
  sensitivity checks. This option also affects uninitialized incoming links.
- Three `sal-semantics` tests check global traversal, actual RS truth/state
  behavior and Network4 sensitivity to unconnected-input assumptions.

## Reclassification of previous findings

The lost R&D -> Step2 handoff in `V2_RND_TO_SAFE_REPORT.md` is withdrawn as
a current-order finding. It remains explicitly reproduced by RNDSAFE02 using
legacy order. RNDSAFE05 uses global order and reaches Step2, then raises LV/HV
output commands. This is still a selected-network trace with seeded R&D and
externally supplied EStop OK, not a full-project/hardware conclusion.

All other existing dynamic tests pass with global order. Their qualitative
assertions survive this correction; older exact timing statements are historical
unless the current test asserts them. In particular the Run-down output test
still checks a 0–20 ms adapter interval from discharge command to C2 OFF.

Network4 remains unvalidated: its used outputs have no explicit corresponding
input drivers in the SAL. Including it with assumed TRUE/FALSE produces
different state requests. Do not treat either assumption as a verified runtime
configuration. Inspect in TwinSAFE Verify/Build and online values.

## Remaining limits / next work

- Confirm SAL numbering against this project's TwinSAFE editor/build output.
- Resolve unconnected channels and raw input polarity using project/runtime
  evidence; no single assumed constant may establish safety acceptance.
- E-Stop implementation remains partial (restart/EDM, group lifecycle and
  faults); no certification or full-runtime equivalence is claimed.
- Next add an input/link assumption inventory and binding matrix, then extend
  emergency/Healthy-loss tests only where execution inputs are established.

Validation: 94 tests pass, none skipped; model mutations detected 5/5.
