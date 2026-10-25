# Revised255 isolated Safe|RnD candidate — HOLD

Production SAL/SGVL, runtime and tests remain unchanged. Earlier254 artifacts and honest failing logs are preserved in history254. The revised candidate retains native GATE_020 FinishUp, scopes input5 to RND_SCOPE and consumes its current output in CSet. Safe And4 remains on BOTH TON. FinishUp observation is unchanged.

Frozen SHA256:
- SAL: 64fec23446e0c321b7e7a2b864b5f5bcfb440492ea76a26e94b7695205a14560
- SGVL: 1981d66fb889882a75346a58c789a5f03c9b4bd03f68d0fe01022d68c6838476
- Adapted safe-run helper: 4385b79546a8cdf0d76dd633767fd1a957b2b419c384186b69bfad6d15d68c8c

Results on this exact pair:
- Whole native binding audit PASS, zero errors; count255 and exact reviewed manifest order PASS.
- All retained parameters, inPLC aliases, entire Network6 Run graph and retained relative order PASS.
- Original RnD suite with unchanged FinishUp observation:69 PASS.
- Original earlySTO suite:88 PASS.
- Paired B1 while-held/after-release:2 PASS.
- Existing SafeRun suite with explicit retired Safe diagnostic adaptation:13 PASS,2 retained Run invalid-chord FAIL.
- Safe green/fullrelease/blue, absent connector access versus blocked valid energy chord, and EStop restart/release recovery:3 PASS.

Existing component fixtures cut Network3 phase ownership. Independent tester owns conditional phase-writer replay. Full BOOT/Network4/group lifecycle acceptance is not claimed. No Verify/Build/CRC/hardware validation or working SAL handoff. CRC metadata retained, not declared recalculated.

Reproduction from repository root: run build.mjs, invariants.mjs, replay.mjs, handoff.mjs, gaps.mjs from this directory. Build generates fresh GUIDs and a NEW pair: do not rebuild the frozen pair during review. replay copies original harness to sandbox, substitutes candidate files, and preserves raw69/88 logs. Additional replay maps only retired Green/Blue internal observations; FinishUp remains native GATE020. handoff maps retired Safe AND/TON diagnostics to BOTH TON; assertions unchanged.

Direct reference read was denied in this editor environment; escalation prompt was cancelled and has not been retried. Construction uses audited current source plus architect reference ledger; leading agent owns provenance completion.

Full candidate regression (`npm run check:software` in sandbox) is RED, exit3:
- harness189/194,5FAIL; historical74/75,1SKIP; current399/428,29FAIL.
- Case summary196PASS/4FAIL/6NOT VERIFIED/1ERROR.
- Five harness failures concern the source-bound BOOT manifest. The changed native inventory is deliberately rejected by the original trusted manifest. Sandbox reference absent is reported NOT VERIFIED.
- Current failures:17 old structural/order/graph/serialization assertions,2 retained Run failures,9 healthy producer controls with obsolete selected-block closures,1 immediate raw-Safe-blue test. These categories explain test mechanisms; none is silently waived.

Diagnostic fixture follow-up:53 selected assertions PASS in copied tests. DOOR/HV/Mentee fixtures now include actual SafeResumption producers; SafeUnlock prepares through the existing audited dynamic source fixture. Assertions are unchanged; original full RED report is preserved. Edits and limits are recorded in fixture-triage255-edits.json, full original diagnostics in full255-SOFTWARE_CHECK_RESULTS.json. This diagnostic result does not itself update accepted test coverage.

Source trace for closure failure: compact E now reads MODE and CONNECTOR_SCOPE from SafeResumption; scoped FinishUp reads RND_SCOPE; old RnD selected lists contained only Network12/compact plus small N1 subsets, leaving these producers unexecuted. Old SafeUnlock selected only Decouple3/And7/And8 plus six N1 blocks; And7 now reads STATE_BA from the recognizer, absent from that list. CVR line84 expects raw Safe blue to produce Unlock in one scan and explicitly says Safe has no blue TON; this is stale against the agreed500ms Safe qualification and must be migrated explicitly, not treated as a passing check.

No production tests/runtime changed. Candidate pair remains frozen. Conditional lifecycle work is separately assigned; full report remains RED pending accepted test migration and independent review.
