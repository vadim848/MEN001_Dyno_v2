# Independent review — R3 red tests

2026-10-19. Tests reviewed against SDK pair/master contract and accepted
`03B_NATIVE_PAIR_FIX_PLAN.md`. No implementation changes by reviewer.

Final verdict: **ACCEPT red-test package / READY for honest checkpoint.**
Current implementation remains unaccepted pending R3 repair.

Initial finding R1, now closed: the negative named actual
WINDOW Both/unbound used the actual block unchanged. Once source is repaired
to first-only, that test would require rejection of valid source. It must
clone the actual block and explicitly mutate master mode to Both while
retaining the genuinely unbound slave. The separate exact source-mode test
continues to require first-only. Editor fixed this with explicit
`structuredClone(window)` and `master.channelInterface=modes.both`; reviewer
re-read the exact change. Final test SHA256
`e78f76484500f450d6e95d3d56ea0f1213f98fdd1b43ae54b58dec374386b121`.
The refreshed baseline retains86/56/30/0, as expected on unchanged source.

Independent initial execution reproduced **86 tests:56 PASS /30 FAIL**, zero
skips, exit1. These are meaningful red instrumentation/source-contract cases,
not new functional SAL regressions or native execution results.

The64-row matrix derives first/second/both/no-channel truth tables from
effective master mode and contact1/2, deliberately opposing slave own fields.
Manual Restart positives and disabled-before-restart controls distinguish
activation/polarity from a uniformly FALSE result. Unsupported/unbound tests
require explicit errors, not fabricated inputs.

Actual main tests retain the genuine PLC producer and EStop block from the
audited model, explicitly set healthy raw inputs, exercise NC2/Mentee current
fault and one-sample recovery memory, then require fresh manual Restart.
PLC95/EStop21 latency has its own unchanged-order control. This is a bounded
component cut, not full-cycle reachability or hardware polarity validation.

Closure cases require real typed NC2/Mentee alias IDs and consumer paths;
in-memory missing-binding seams must fail before first scan. Missing helper
master is the paired already-working negative control. Intended first-only
helper uses the actual off/Restart wires without a dummy second source.

No helper/group Error proof is inferred. Full-source before-cut validation,
precise actual mode, runtime/closure consistency and source metadata remain
implementation review requirements after red checkpoint.
