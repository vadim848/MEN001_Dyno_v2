# 03B R3 implementation — native pair semantics

2026-10-19. Baseline checkpoint218dde5 preserved the unaccepted03B source and reviewed86-case red suite. This report separates the one-enum program repair from corrected host modeling. Independent final acceptance remains pending.

## Program repair R3A

Working SAL changes exactly one existing WINDOW/EStopIn1 attribute: Single-Channel Both Activated → Single-Channel 1 Activated. Main FBEstop1 and every legacy SAL block/port, physical mapping, SGVL, timer, execution order and block count253 remain unchanged. Source first-only helper has its existing off/Restart sources, unbound inactive slave/other channels, and unchanged250ms. Derived executable03B_COMPACT_RELEASE_FIX_PLAN.json, serializer and native structural assertion now express that exact mode. Historical optimized/baseline plans and R3_RED_BASELINE.json remain unchanged.

## Shared adapter/analysis repair R3B

New src/estop-native-pairs.js exports one effectiveEstopInputs resolver and native-estop-pairs-v1 metadata. SDK objectIndex pairs8/9,10/11,12/13,14/15 resolve from their master enum. Each selected port carries its effective master contact1/2; slave own activation/contact never overrides it. Single1/Single2/Both/none are supported exactly; generic/unknown modes, unsupported Two-Channel discrepancy and unbound effective-active channels fail explicitly. No dummy raw value is inserted.

SalRuntime separates raw acquisition from ordinary per-port contact handling. safeEstop resolves before reading active safety sources and applies master inversion exactly once. Other function blocks retain their old read behavior. The existing observed-fixed-scan-v1 clock, manual Restart and delay algorithms are unchanged. Explicit port-only injections remain confined to the declared component test-injection mode; actual current aliases/globals/wires require real bindings.

The same resolver drives physicalRndSource demanded dependencies, buildDependencyGraph static causal edges and auditAssumptions effective input inventory. The latter reports real master/contact/port records. This prevents runtime-correct but structurally hidden NC2/Mentee cuts. Whole SAL/SGVL binding audit still precedes actual branch selection. Active missing-source mutations reject before scan0. External inputs remain explicit; no new phase cuts or healthy TRUE fallback was added.

The main source already declares masterBoth for NC1/NC2 and for PLCguard/Mentee. Thus NC2FALSE or MenteeTRUE now drops host b_EStop_Ok in its existing current scan; raw recovery alone does not restart. This is corrected modeling of unchanged legacy SAL, not a new main program guard or a hardware polarity change. PLC producer95/EStop21 latency is preserved, and the separate short PLC pulse LV/HV Set gap is not fixed here.

## Necessary expectation/fixture migrations

- Current partial main EStop checks and pinned EStop component readiness now explicitly supply healthy raw MenteeFALSE along with NC2TRUE. The ordinary Safe07 partial fixture does the same.
- Clock test ESTOP clones now use exact native first-only/BothDeactivated pair modes instead of generic AND Activated/Deactivated strings. All105 edge-relative timing expectations remain unchanged.
- Reference profile drives effective active channels using master contact polarity. In particular healthy logical Mentee channel requires rawFALSE, not an own-slave-field inversion. The reference source is read-only and unchanged.
- Historical CHAIN05/06 previously asserted b_EStop_OkTRUE because NC2/Mentee own fields said BothDeactivated. SDK proves their effective channels active; those two expectations now require FALSE. Their Run removal/Step4/output/recovery requirements remain unchanged. Four connector/external cases still expect EStopOKTRUE while their other emergency chain acts.
- Historical EMG03/04 still assert the original own-slave serialized field is BothDeactivated, but now require the real effective causal path to b_EStop_Ok. The same shared resolver supplies graph edges. Fixtures/SHA snapshots were not rewritten.

First full run identified exactly the two CHAIN old-model contradictions (73/75 historical, all178 harness and272 current tests green). They were resolved from the reviewed SDK contract. During adding the static graph hook, a missing local declaration caused a targeted ReferenceError; it was corrected before final testing, rather than accepted as a semantic red result. Inventory's own-field filter was then corrected and its existing input audit assertion strengthened for NC2/Mentee master/contact metadata (3/3 targeted). Final full package is rerun only after those stable fixes.

## Coverage and limits

Reviewed red86 tests are unchanged. All86 now pass: 64 native-mode/polarity/raw matrix cases, ignored slave-own fields, inactive-unbound positives, active-unbound/unknown/TwoChannel negatives, explicit Both-mode helper mutation, actual helper first-only metadata, genuine main healthy/fault/manual-reset traces and shared-closure typed/missing-input cases. Physical69 and native graph5 also pass. safeEstop.Error remains a FALSE stub; no native/group no-fault, EDM, TwoChannel discrepancy or lifecycle proof is inferred. SDK software semantics/source correction is distinct from native Build/Verify/CRC or hardware validation, which remain outside scope.

No PLC pulse Set repair, early STO, new timer value, hardware/group configuration or main SAL rewrite is included. Final model hashes and per-ID/trace deltas are recorded in the current companion report. Old03B/R3 red reports remain historical evidence; no broad41-requirement completion claim is made.

## Final source, results and STOP

SAL SHA256 a50e24af66c755f00001e3bd2eed70ba4d30526df8dfa427b5d37bc6dcebb413; SGVL 06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5 (unchanged). Runtime 14d50f182e42c7aea814eb0c221fbeadbc9becf20f7ac575d263b8cb4f14698e; shared resolver 18bcb570739e5a20abd45fc831deae612e52d74d2590191fe4eeda3eed5d6ec8; source closure c61da0522212366af503c6938c3ad189d08ee3c02390989c1ac2777102970012. Full current source/model/derived-plan hashes and actual69 traces with their new demanded NC2/Mentee boundaries are stored in R3_CURRENT_RESULTS.json. Old03B_INTEGRATED_ACCEPTANCE.json remains an explicitly older pre-R3 source/model artifact; it is not reused as new-source evidence.

Final full package: **harness178/178 PASS; historical75/75 PASS; current272/272 PASS**, with both R3 and physical/native current test files in the current stage. Software cases remain **201PASS /1FAIL /5NOT VERIFIED /0ERROR**; standalone47PASS/0FAIL/5NV with matching source/runtime/closure/resolver hashes. No case-status changes from218dde5. R3 reviewed red suite56PASS/30FAIL→86PASS/0FAIL; all original positives preserved. Actual physical69 and native5 pass. Source binding audit0errors and diff whitespace check clean.

There are32 existing phase-case behavioral trace corrections: raw NC2/Mentee fault and raw restoration now retain EStopFALSE according to the SDK while unchanged case requirements still pass. Another92 traces change fallback-count metadata only because plain no-EDM ports no longer get needlessly read as Boolean fallback inputs. Every changed case ID and old/new EStop/fallback observation is in the companion JSON. These are host-model corrections, not proof of32 new SAL fixes or reduced system fault count.

Residual FAIL remains STATE:conflicting-set-requests at an explicitly injected Network3 latch boundary. Existing five NV IDs remain unchanged. Nonzero package exit is expected for that residual scope; green test stages do not mean complete SAL/41-requirement acceptance. Future pulse/earlySTO/hardware work is not implemented. R3_RED_BASELINE.json and source fixtures/reference are unchanged.

Editor STOP for independent review. No further tests without new failure/change; no commit/push/deploy.
