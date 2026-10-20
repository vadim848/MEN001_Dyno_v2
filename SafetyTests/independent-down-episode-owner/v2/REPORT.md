# Independent bounded owner-candidate v2

2026-10-20. SAL72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e /
SGVLde0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56.
The v1 package and previous RED checkpoint remain unchanged.

PASS evidence:

- Actual Safe→Step12→RnD→accepted green→LVoff→feedbackoff→Step2 route captures
  the down owner on its very first Step2 scan, before N5 power-on evaluation.
  Owner persists when SG/down request clears and buttons release. No renewed
  permitted LV/HV Set or LV/HV output occurs in2500ms. Immutable baseline and
  priorSafe255 each retain2501 renewed-energy samples as EXPECTED RED controls.
- InitialStep2 with generic LV-discharge latch TRUE and RnD-down absent preserves
  original ordinary power-on requests, permits and LV/HV outputs on all three
  source pairs. Owner remains FALSE. This typed initial component precondition
  proves compatibility in that state, not reachable BOOT.
- Given FalseInputTRUE + ESNC1FALSE executes the existing fault branch through
  actual N5/N3 writers. Actual Step2 exit clears owner before N5; actual Restart,
  neutral release and fresh Safe→RnD→green recapture owner in a second episode.
  This is an explicit fault-branch reset/availability component proof. It does
  not resolve normal shutdown-to-Safe or a complete emergency endpoint.
- SG availability under explicit simultaneousSafe/RnD phase boundaries exactly
  matches priorSafe255 for healthy qualification, ESNC1 and InterLockNC2 loss.
  Actual Network3 is excluded only for this separate producer-availability probe;
  no global onehot or conflict reachability claim is used.
- DeMorgan equivalence executes actual native GREEN/BLUE TONs, old G19 and old/new
  G23 with original port polarities and execution order. Every scan matches across
  qualification, loss and requalification; all four TON output combinations are
  observed. Other G23 conjuncts are explicit TRUE component boundaries, not a
  full-state proof. Audited source contains no remaining G19 ports/wires.
- The unchanged fifteen Safe boundary/emergency checks pass on this exact v2
  pair:499/500ms single, symmetric249/250/251ms chord,500ms single-priority using
  actual qualification/consumption (no invented visible impulse), and six vetoes.

Raw unchanged RnD69/69 and earlySTO88/88 independent replay PASS, recorded in
regression-results.json. No FinishUp or assertion remapping is used. The separate
test-migration agent owns broader full-suite migration; these checks do not claim
full accepted SAL coverage. Existing two Run failures, pending PLC policies and
healthy RnD-down completion remain visible in the project.

Fixtures record full source audits, seven explicit inactive Network4 IDs, actual
program-input changes, each scan and intra-scan owner/gate events. Lifecycle
protocols prohibit phase/owner writes after declared initial state. Shared runtime
is copied unchanged, so this is independent test design/execution on the software
adapter, not independent native semantics or physical validation.

Reproduce in order: prepare.mjs; run.mjs; reentry.mjs; conflict.mjs; demorgan.mjs;
regression.mjs; safe-boundaries.mjs with SAL/SGVL hashes above and generated helper
SHA1807af203e6737a614ce883c0384d7d55f7374c80f32f78ccb856dd9fe536aed;
pack.mjs; package.mjs. Lossless gzip and trace-index preserve all samples and verify
raw/decompressed byte counts and SHA256. Sandbox and large raw copies stay local.
