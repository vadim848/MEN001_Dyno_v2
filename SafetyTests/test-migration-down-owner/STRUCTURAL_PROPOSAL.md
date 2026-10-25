# Structural migration proposal — independent review pending

Authority: frozen exact ledger SHA256 in structural-spec.json and downEpisodeOwnerCandidateV2 plan. Baseline uses immutable independent-safe-resumption/fixtures/baseline, copied into this package and verified raw0fc397/06010c before projection. Candidate raw72f42/de0fa is checked before every migrated test import.

Seventeen stale structural tests now call specialised assertions, not a common unconditional pass. Existing Door truth tables remain. Historical early-STO deterministic GUID/manifest assertions still run against the frozen historical baseline. No historical manifest is rewritten. The explicit delta helper checks:

- Exact255 ordered native blocks,247retained,8retired/8new GUIDs, only And4 relative move.
- All retained native port metadata:8ports activated,9attribute changes. Every other port attribute exact; new native primitive templates/ports/contact polarity checked.
- Canonical full graph equals338 old edges minus20 plus24 exactly; no unlisted bypass or duplicate.
- Fifteen alias target-consumer changes; all physical descriptors and output sources exact.
- Eleven SGVL target-usage changes; all85declaration identities/types/source usages unchanged.
- Only retiredN2TON3 loses its parameter; all retained timer identities/values exact,20TON/22parameters.
- Retained critical early-STO/LV/HV/finalHold/PLC/Door invariants separately checked.

Target structural+functional files78/78PASS. Additional BOOT/negative target21/21PASS: all15 existing BOOT rejection/capability checks retained, only stateful count52→53; six independent mutation controls reject unexpected wire, nativeID, contact inversion, timer removal, owner ordering and output alias changes.

BOOT manifest proposal refreshes complete inventoried XML after delta checks, source/runtimes pinned. Expected outcome remains two NOT VERIFIED, functionalBootPass0 and execution.performed=false. It grants no BOOT/group/Network4 capability. Production manifest/runtime/source unchanged.

Implementation files: structural-helper.js, structural-spec.json, apply-structural-proposal.mjs, structural-proposal-edits.json, boot-manifest-proposal.json, boot-test-proposal.json. Functional observer migration is separate. Full immutable snapshot run remains pending independent review and final input pinning; earlier full runs remain RED/diagnostic, not acceptance.
