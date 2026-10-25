# Independent project-load repair software verification

2026-10-20. Frozen candidate SAL `ffd6c64e567131cb4fd5c4dd58816e0e5e8bb4f60777142d7959d9cc591ef0d1`; SGVL `4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5`. Baseline SAL `b7096fa3cf7349ea0be08f347180deb071a0f6b75612c4e5c8a7f45cf0557161` frozen in `baseline/`. No canonical source, runtime, test or project configuration was written by this tester.

## Independent structural and meaning checks

`node SafetyTests/project-load-repair/tester/verify.mjs SafetyTests/project-load-repair/editor/candidate/TwinSafeGroup1.sal SafetyTests/project-load-repair/editor/candidate/GVL1.sgvl`

PASS. Independently reconstructed the expected full candidate file by removing exactly143 attribute tokens from the baseline using approved exact port IDs, attribute names and old values. All remaining bytes, including whitespace, match. Entire parsed graph equals that expected layer; only relocated model file path differs. All254 blocks,2172 ports,22 parameter records, orders, IDs, relationship wrappers, canonical edges, alias/global references, root metadata and SGVL are protected. Fresh whole-source binding audit PASS and identical to baseline.

All782 participating ordinary input ports have identical Boolean interpretation for both raw levels (1564 comparisons). Five effective EStop channels retain the same master, physical logical input identity, activation, contact and inversion. Inactive fields are not treated as active inputs. Exact full graph comparison protects every active contact, main NC2/Mentee paths and WINDOW producer/restart/250ms parameter. Current-mode native metadata predicates find143 disallowed contact attributes before and zero after; the exact reference SAL `efddc60b1263144ae73b3d5184158100ec09c4de739dc8919309ef7b1b0dc334` also has zero. These predicates are a targeted comparison with installed native metadata, not a replacement native loader.

`node SafetyTests/project-load-repair/tester/mutation-check.mjs`

PASS: four altered candidates rejected: removal of active NC, NC-to-NO polarity change, WINDOW250→251, and unrelated whitespace. See `INDEPENDENT_RESULTS.json` and `MUTATION_RESULTS.json`.

## Whole software package and strict migration

Unmodified tests against the actual candidate were run first in `sandbox/v2/SafetyTests` with `npm run check:software`. They intentionally reject changed source fingerprints: harness184/189 (five BOOT inventory-coverage rejections), historical75/75, current352/362 (eight module fingerprint rejections plus the two known Run failures). Cases:200PASS/1FAIL/5NOT VERIFIED/1ERROR. `BOOT:SOURCE_REJECTED` explicitly reports the old trusted native inventory mismatch. This result remains in `UNMIGRATED_SOFTWARE_CHECK_RESULTS.json`; it is not presented as a functional regression or hidden.

`prepare-migration.mjs` creates the separate `proposal/` without editing canonical tests. The candidate-specific helper pins the actual fresh SAL hash and applies only exact expected-port removals with old-value assertions and count118 for retained baseline ports. Remaining25 new-port removals are covered by the143 full-file proof. The BOOT manifest removes exactly143 matching native input attributes with assertions, updates only SAL raw/normalized hashes and provenance, and retains every other inventory field and unsupported category. `MIGRATION.json` records before/after digests. The actual parsed model is never masked; runtime/parser/oracles are unchanged. Independent reviewer acceptance remains required for adoption.

Migrated full check completed with direct command `node scripts/software-check.js` from `tester/sandbox/v2/SafetyTests` (equivalent package entrypoint); exit1 is retained for known failures. Harness189/189 PASS; historical75/75 PASS; current436/438, exactly the baseline two Run failures `SR-RG-INVALID-green-remain-green` and `SR-RG-INVALID-blue-remain-green`. Cases200PASS/1FAIL/7NOT VERIFIED/0ERROR. The remaining case FAIL is `STATE:conflicting-set-requests`, the existing conditional state conflict; no new reachability claim is made. BOOT again retains its two unsupported categories and zero functional acceptance. Full results: `MIGRATED_SOFTWARE_CHECK_RESULTS.json`, `MIGRATED_BOOT_PREFLIGHT_RESULTS.json`; console log `sandbox/migrated-full.log`, captured exit `sandbox/migrated-exit.txt`. The whole package includes actual current WINDOW/native-pair, gesture boundary/late-second/release, RnD, early-STO, emergency, LV and Safe regressions. No new software failures or removed mandatory gaps were found.

Independent reviewer marked the narrow fixture migration READY. `SANDBOX_INPUT_DIFF.json` compares101 source/test/script/manifest inputs and confirms only the approved structural helper and BOOT manifest differ from canonical; the new exact layer file is separately supplied. No parser/runtime changes. Canonical adoption requires the candidate SAL plus `SafetyTests/test/helpers/v2-structural.js`, `SafetyTests/BOOT_PREFLIGHT_SOURCE_MANIFEST.json` and new `SafetyTests/PROJECT_LOAD_REPAIR_LAYER.json`; that handoff belongs to the lead/editor, not this tester.

## Limits

This verifies serialization-only preservation under the existing software adapters and their documented phase/component coverage. Existing Run failures, conditional state conflict and mandatory gaps remain open. It does not establish full BOOT execution, hardware safety, native Build/Verify/CRC, controller operation or deployment. Actual TwinSAFE project/SAL opening belongs to the editor's separate evidence; this report does not claim native opening success.
