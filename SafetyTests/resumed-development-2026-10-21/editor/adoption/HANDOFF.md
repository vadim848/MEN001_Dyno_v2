# Controlled canonical P0 adoption — editor freeze

Transferred reviewed resource-only P0 into canonical v2. **All writes stopped**; independent canonical rerun and transfer review are next. No F1 implementation started.

Root confirmed the declared exact allowlist before writes: three canonical native files, final migration eight modified files plus four additions, and this adoption evidence directory. Existing five proof scripts and architect ledger were verified against FINAL_MIGRATION hashes read-only, never overwritten. Frozen candidate/baseline/reports were not changed.

`TRANSFER.json` records every exact before/staged/after SHA and six proof dependency hashes. Three native files copied byte-for-byte:

- SAL34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b
- SGVL517fdadd913007aa2690f1402676583ad16141c9ae64cb986554c87c10f22635
- diagram7b5eb79439011cdf9a3206aa815dec4349a35cf8155bfac7492b7ffd75e578ce

Eight reviewed test modifications and four fixture/control additions copied exactly after before/after hash checks. Only the reviewed wrapper technical path adjustment changes a staged hash: `test/helpers/v2-structural.js` now resolves checker via `fileURLToPath(new URL('../../resumed-development-2026-10-21/tester/p0/check-source-pair.mjs', import.meta.url))`. Staged291b9df6… becomes canonical7d5e27cf23413eaf01e01af2e3989f1e6c734567ec34cf07610512b22579697c. No oracle or proof changes.

## Editor selfchecks

- Before any parser selection, whole-source native preflight PASS on both original canonical and accepted candidate. After transfer:14 Networks/241FB/2066ports/75Symbols/306wires/0cross, typed SAL/SGVL binding PASS206refs.
- Hash copy proof covers all15 selected target files and source provenance; final native/wrapper hashes rechecked after execution.
- Canonical scoped tests: **98/98 PASS**, exit0 (`SCOPED_TESTS.log`): current-door-interlock, current-mentee-set-permit, current-unlock-estop-permit, current-native-structure and boot-preflight. Includes BOOT missing-writer/filtered-model/namespace/metadata/native-attribute negatives; no functionalBOOTPASS is inferred.
- Canonical actual parsed-model mutation negatives: **6/6 PASS**, exit0 (`MUTATION_TESTS.log`). These execute the portable checker dependency and reject modified candidate parsed structures.
- No CRC changes or native resave during adoption: exact reviewed native bytes retain established candidate CRC evidence. No full IDE/Target/ADS/hardware claim.

`adopt-p0.mjs` is a one-time fail-closed transfer script: it requires original59bf/c31e/449ea and exact reviewed before hashes, and refuses repeat adoption onto changed state. Do not run it again after adoption.

This selfcheck is not independent canonical acceptance or a complete software run. Existing Run command defects, normal-stop ordering failures, conditional StateConflict and BOOT/group NV remain. Tester should perform next canonical full run; reviewer should verify exact transfer/path-only delta. F1 requires separate tester RED readiness and root stage handoff.
