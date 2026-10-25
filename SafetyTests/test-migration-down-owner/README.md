# Independent down-owner full-suite migration

The isolated reviewed migration is complete. Production was not changed by this package. Frozen candidate SAL72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e / SGVLde0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56 remains subject to the root review/promotion gate.

Authoritative final evidence:

- run-001-SUMMARY.md and run-001-summary.json:189/189 harnessPASS;74/75 historicalPASS+1skip;436/438 currentPASS,2knownRunFAIL. Case summary199PASS/1knownSTATEFAIL/8NOTVERIFIED/0ERROR. No full-project green acceptance claimed.
- run-001-inputs.json:280 pinned copied input files; SHA2565625dba72f4248f87d2227d93cfb737de3adcf80502027dc9f1d51c1337f718b.
- run-001-integrity.json: all280 inputs unchanged before/after. Only three generated root reports excluded from the inventory comparison. Child exit1 is the honest retained defects, not a test infrastructure error.
- run-001-transfer-manifest.json:24 explicit allowed file changes with old/new raw SHA256 and frozen source paths. No copying was performed by the manifest generator; runtime/parser/native-pair/clock/binding-validator implementations must remain unchanged.

The four independent primary down/no-reenergization regression scenarios use canonical fresh copied working files; no archive-source substitution. Six additional negative mutation controls reject unapproved wire/nativeID/contact/timer/order/alias changes. Historical early-STO manifest checks remain on the immutable historical baseline. Native whole-source relationships are audited before any component closure.

BOOT remains NOT VERIFIED for Network4/group lifecycle; functionalBootPass0, no group/BOOT execution or phase seeding in capability preflight. Other requirement gaps and missing reference source remain explicit in the summary. Native Build/Verify/CRC recalculation, hardware safety and deployment are outside this package.

Reproduction of a new prepared snapshot: node prepare-all.mjs; node integrate-official.mjs; node snapshot-full.mjs run-002. The snapshot label must be new, reviewed official file hashes must match, and a prepared input tree must not be edited during execution. prepare-all performs no full child run. The final run-001 tree is retained unchanged for review; its only generated outputs are listed by the input manifest.

Initial/second/third diagnostic results are historical migration evidence, not final acceptance. The initial harness277 count included pre-existing triage copies, removed by resetting top-level test inventory to production. The third run is explicitly diagnostic because a separate observer diagnostic edited its parent copy after the child imported modules. Final run-001 resolves these process defects through a separate complete input snapshot and SHA verification.
