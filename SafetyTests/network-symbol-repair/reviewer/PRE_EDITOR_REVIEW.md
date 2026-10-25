# Independent pre-editor review

2026-10-20. Role: independent reviewer. Scope: replace all active cross-network graphical wires with native symbols, preserve behavior, repair/check offline native presentation/CRC, no functional development.

## Decision

Architecture ACCEPTED. Implementation may follow ARCHITECTURE.md and architect/SYMBOL_PLAN.json after the lead confirms the test preparation item below is complete and records the honest baseline/checkpoint. No source edits were performed by this reviewer.

Reference read first: exact approved commit 4495a1f6049f6a58ebfd436761faa84d17c8d643 SAL, including its native SAL variables and port global reference wrappers. Then read WORKFLOW.md, ANALYSIS.md, actual current SAL/diagram, architecture inventory, native metadata/IL, test source and baseline test results.

Input SAL SHA256 ffd6c64e567131cb4fd5c4dd58816e0e5e8bb4f60777142d7959d9cc591ef0d1; SGVL SHA256 4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5.

## Findings

The manifest covers the complete 24 edges from 16 writers, preserving fanout. Reusing two existing SAL symbols and three existing SGVL symbols avoids competing input bindings; eleven new ordinary SAL symbols use the reference-native relationship chain and isLocal=false. No new hardware aliases, FBs, altered conditions, port polarity, timers, order, or network placement are authorized. Existing external exports/usages must remain immutable except the six exact new global consumers and two exact new SAL consumers.

Both native order validators emit LogWarning for backward dependencies; the Variable diagnostic explicitly describes the previous update cycle. The three backward edges therefore must retain their order and dependency, with no added delay/reordering. This is native metadata/validator evidence plus software runtime reasoning, not compiled runtime or hardware proof. It does not alone establish CRC acceptance.

The independent verifier checks full typed namespaces/wrappers/IDs, exact usage indices, single writers, canonical wire pairs, exact normalized endpoint graph equivalence, and canonical full-tree preservation. Its baseline correctly reports zero-cross-wire FAIL and unbridged FAIL while structural/equivalence checks pass. The independent scan-transfer test covers all 65,536 combinations of 16 writers under both fallback values and compares raw/contact reads on all 24 consumers at the unchanged execution positions. This is transfer-operator evidence; the unchanged full regression remains required for latches/timers/whole-sequence coverage.

Pre-editor test preparation item: at review time verify.mjs still stripped only new global-reference and alias usage nodes, so all eleven planned new safetyApplicationHasVariables wrappers would fail its full-tree invariant. Tester has been asked to allow only architecture-authorized new SAL variables, explicitly check 75 total SAL variables / unchanged SGVL variable count, exact one-source new aliases and name uniqueness, and preserve every original subtree. This is a representation-aware test completion, not permission to weaken semantic expectations. Lead must confirm completion before source edits.

Current diagram has only twelve lanes; no removed wire ID is present there. The architecture correctly treats fourteen-network native regeneration/save and exact CRC observation as separate required repair phases. A graph PASS cannot close native CRC. Do not synthesize or bypass checksum attributes. Review native-produced source changes against the same logical invariants before transfer.

Final review remains OPEN until the exact candidate, independent full results, native messages/hashes and relevant diff are available. Existing functional FAIL/NOT VERIFIED remain disclosed and must not be fixed in this scope.
