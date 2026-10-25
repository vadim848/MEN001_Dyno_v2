# Independent BYPASS-family continuation

2026-10-21. Independent tester; write ownership restricted to this `tester/` directory. No SAL/SGVL, recovery policy, production runtime or requirement oracle changed.

The restored execution runs `node SafetyTests/resumed-development-2026-10-21/state-exclusion-audit/tester/bypass-boundaries.mjs` from repository root. It imports the independently instrumented prefix, extends the existing paired BYPASS protocol to 16 raw-input histories and stores compact ordered producer transitions in `BYPASS_BOUNDARIES.json`. This is deterministic scenario execution, **not** the architect's bounded exhaustive suffix search. No EXHAUSTED or universal PASS is claimed.

## Source and method

Canonical SAL SHA256 `34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b`; SGVL `517fdadd913007aa2690f1402676583ad16141c9ae64cb986554c87c10f22635`. The independent prefix performs full-source native-structure and typed-binding preflight before execution and asserts the frozen canonical SAL. Exact reference SAL is also preflighted (`efddc60b1263144ae73b3d5184158100ec09c4de739dc8919309ef7b1b0dc334`). Runtime/helper/parser/clock and source file hashes are included in the result.

The selected 202-block causal closure extends actual state writers to status, energy and Unlock producers. DECOUPLE dependency follows matching input/output channel; unknown reads outside demanded channels are not proof of whole-source support. Every demanded input must be resolved; each scenario asserts zero demanded fallback and zero runtime unsupported blocks. Preparation actually exercises main EStop Restart, then explicitly declares initial Safe. Seven Network4 writer outputs are explicitly inactive component boundaries. After entry, only enumerated raw inputs change; no phase, request, output, RS or timer memory is injected.

This proves or refutes preservation **from that declared component boundary only**. Group startup, native initial Safe reachability, Network4 lifecycle, unmodeled group discrepancy/EDM, full emergency-owner handling and all-input-history exclusion remain NOT VERIFIED. Shared production runtime/clock semantics remain a common model dependency, despite independent instrumentation and protocol variants.

## Frozen existing witness and causal interpretation

Existing `INDEPENDENT_REPRODUCE.json` SHA256 `cddd1c1540e529c4d3d6b7ec8aa1997b203c4dfbe2938f21075669bb52104ed2` contains independently instrumented 2,923,950 block evaluations per paired history. FALSE stream SHA256 `bc1320a750d8ea12e20f071220d636103ffdbdf203197bdc7142b648b6398f9a`; TRUE stream `605b6182179042947532c7e5d1478db97440b2b2312420207072004fa1a55cc1`.

At 16337 ms, actual Network12/FBAnd6 order169 and FBDecouple2 order170 publish RunSet after the earlier state writers have run. At 16338, SafeRS order20 reads SetTRUE/ResetFALSE and sets Safe; RunRS order48 then reads retained RunSet TRUE/ResetFALSE and sets Run. First within-scan overlap occurs at RunRS, and the end scan also has both memories TRUE. At 16339 both actual memories remain TRUE with SetFALSE/ResetFALSE: this is not solely an erased unpublished transient. Exported outStep1/outStep3/Armed are all TRUE at the first end-scan overlap. Observed LV/HV commands are FALSE, both STO commands FALSE, Unlock FALSE; these are software output facts, not a hardware safety judgment.

Actual bypass timer first becomes TRUE at15836, reset request publishes15837 and actual HV RS becomesFALSE15838; later command cycling is retained in ordered evidence. The test does not seed that timer or reinterpret its existing10s setting as a new watchdog. PLC11 while green is held is an admissible adversarial program stimulus whose required response is rejection, not an input history to silently exclude.

**Classification: CONDITIONAL_REACHABLE_OVERLAP under actual producers from declaredSafe+7inactiveN4.** This is stronger than the old direct contradictory-Set robustness cut and weaker than fullBOOT reachability. It does not select Emergency versus TransitionFault or authorize a repair.

## Boundary matrix

The continuation pairs bypassFALSE/TRUE at post-bypass delays9998/9999/10000/10001ms, plus10500ms with confirmation-to-feedbackOFF offsets0/1/2scans and feedback-heldON control. Measured producer transitions determine actual timer/reset timing; these raw delays are not substituted for the observed timer origin.

Completed exit0:16/16 preparations and demanded-resolution assertions pass; **3/16 histories violate exclusion**,13 show no overlap within their explicitly finite observed suffix. All8 bypassFALSE controls show no overlap. BypassTRUE gives overlap at delay10000 (first15838),10001 (first15839),10500/offset0 (first16338). TRUE delay9998/9999,10500/offset1/offset2 and feedback-heldON show none. Each overlap includes both actual memories and published statuses; all3 show the same first-overlap output tuple described above. The closest reset-scan counterexample therefore reproduces the broader witness without requiring the arbitrary10500 offset.

`BYPASS_BOUNDARIES.json` SHA256 `349c73ff91392186471324aa5f3f20461d6178d042a1f4533c461b0bc7a5fdc1`; runner SHA256 `4e3931464f3562205719eb0761b4eb1b06d663d687216bd5f932b27bd51285db`; fixture `e6d26071e6b1390f5ebbc9c2ff9bfecc9cf0b47ca98973aa463065387c4836c4`; independent instrumentation `1f6d2cc4416c701e3a647296bbd1f887d67281f036fca0fbd21a4e59782c8cf0`. Canonical SAL/SGVL hashes after the run equal the frozen pair. A local manifest freezes the evidence and all source-model modules, enabling later detection of dependency drift.

Handoff to architect/reviewer: actual-source preservation of exclusion is **FAIL within this declared component scope**. Assess causal rejection/ownership repair separately; do not infer destination/reset from this witness. WholeBOOT, universal exclusion, full formal scenario matrix, solver/bounded exhaustive suffix search and all emergency recovery remain NOT VERIFIED. No native CRC, IDE/Target/ADS, hardware validation, download or push performed.
