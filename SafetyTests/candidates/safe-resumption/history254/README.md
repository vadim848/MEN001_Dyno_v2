# Isolated Safe|RnD candidate — HOLD

Production SAL/SGVL, runtime and tests have not been edited by this candidate.
Source SHA256 is bound in `binding-audit.json`; the candidate native GUIDs are
fresh on each build. CRC metadata is retained and is not declared recalculated.

Reproduce from repository root:

```powershell
node SafetyTests/candidates/safe-resumption/build.mjs
node SafetyTests/candidates/safe-resumption/invariants.mjs
node SafetyTests/candidates/safe-resumption/replay.mjs
node SafetyTests/candidates/safe-resumption/handoff.mjs
node SafetyTests/candidates/safe-resumption/gaps.mjs
```

The replay copies the unchanged source harness and tests into `sandbox` and
substitutes candidate SAL/SGVL at their expected paths. No production parser or
oracle is changed. A second RnD replay explicitly redirects retired internal
FinishUp/Green/Blue observation paths to proposed TON replacements; original
raw logs are preserved. The handoff helper only redirects retired Safe timer
observation paths. These are technical candidate harness adaptations, not
approved new behavior.

Observed results:

| Check | Result |
| --- | --- |
| Full native binding audit | PASS, 0 errors |
| Capacity/order/retained parameters/Run bindings | PASS, 254 blocks |
| Original earlySTO behavioral suite | 88 PASS |
| Original RnD behavioral suite, raw observation | 67 PASS / 2 FAIL |
| RnD with mapped native TON observations | 67 PASS / 2 FAIL |
| B1 ready while held / ready after release | 2 PASS |
| Existing Safe/Run suite, candidate observation paths | 13 PASS / 2 FAIL |
| Independent Safe gap checks | 3 PASS |

The two Run failures are the intentionally retained invalid-short-chord cases.
The two RnD failures remain material: fixed1 short-neutral scenarios in both
orders count two BOTH.TonOut TRUE samples against the unchanged expected single native
FinishUp acceptance. Actual accepted up/HV request has only one rise. Raw
retired-GATE observation instead sees zero. Thus simple replacement observation
does not establish FinishUp equivalence. Architect was asked to investigate;
the editor has not altered the graph or weakened the oracle in response.

The three independent checks establish, within the same Network3 component
boundary: Safe green followed by full release then blue availability; absent
connectors permit blue access while blocking a qualified energy chord; first
EStop removes the grant and a real main EStop restart plus full release restores
fresh blue availability. `gaps.log` records the executable results.

Actual phase-writer handoffs with unseeded owner state remain to be established.
Infrastructure investigation found all Network3 function types supported, but
Network4 has eight unbound DECOUPLE inputs and seven used phase writers; the
adapter also lacks group lifecycle semantics (`src/boot-preflight.js:47–60`).
Excluding Network4 or defaulting its inputs would be an additional explicit
component boundary, not proof of full lifecycle. No such execution is claimed.
Existing fixture cuts Network3;
its passing B1 and behavioral results do not prove lifecycle reachability.
Direct read of confirmed sibling reference was denied by the environment;
this construction uses current source and the architect's reference ledger.
No SAL handoff, native Verify/Build/CRC, hardware validation or deployment.

