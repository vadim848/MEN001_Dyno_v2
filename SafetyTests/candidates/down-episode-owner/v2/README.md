# Down episode owner v2 DeMorgan — isolated candidate

Plan: JSON.downEpisodeOwnerCandidateV2, planVersion down-episode-owner-v2-demorgan. Production SAL/SGVL/tests/runtime and earlier64fec/f6d4 frozen artifacts remain untouched.

Frozen SAL SHA25672f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e
Frozen SGVL SHA256de0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56

Whole native bindings PASS;255blocks, exactmanifest/retainedrelativeorder/parameters/PLC/Run branch PASS. Original SG_OWNER_SET and SG.Reset=!E retained exactly. GATE019 OR retired; GATE023 input4=!GreenTON and5=!BlueTON with original nativeportIDs, other inputs unchanged. Exact-proof evaluates both native combinational graphs across32input combinations, verifies single oldG19 consumer, no alias/global outputs, both TON producers before G23, and exact SG Set/Reset bindings for arbitraryphase flags. No onehot assumption. Episodeowner ordering22<26<27 and native bindings verified.

Target replay: raw RnD69PASS, earlySTO88PASS, B1pair2PASS; SafeRun13PASS/2retainedRunFAIL; gap3PASS; no-autoenergy actual-writer conditionaltracePASS (Step2owner captures5823; no LV/HVrequests/permittedSets/outputs through9824). Independenttester owns broader ownerreset/legacy/phase compatibility. No full Safe-return/BOOT/group/native/hardware claims. CRC not declared recalculated. Working SAL handoff remainsHOLD pending full agreed gates.

lifecycle-fixture.mjs is own copy with frozenpair SHA constants changed; independent fixture immutable. Runtime and assertions are unchanged. The component has explicit stableSafeinitialstate,7exact-ID N4FALSE boundaries, no recognizerseed and no poststart phase/owner injection.

migration-map.json provides all29 old64fec full-regression failed assertions, exactlocations,17structural/9missingclosure/1stalerawblue/2Run classification and proposed minimal fixture changes. This classification does not waiveFAIL or establish v2 fullsuitePASS. Original fullRED reports are preserved under safe-resumption; separate independent migration package is required.

Reproduce editor checks using build.mjs, invariants.mjs, replay.mjs, handoff.mjs, gaps.mjs, exact-proof.mjs, no-autoenergy.mjs. Rebuilding creates newGUIDs; do not rebuild this frozen pair during independentreview. Deeper v2relative paths are configured explicitly.
