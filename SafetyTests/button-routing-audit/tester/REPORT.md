# Independent button-routing verification, 2026-10-20

Current SAL SHA256 `59bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33`; SGVL `c31e129072e2837234e376e51038ff988a92373cbfea97b383fbf23536c7946b`.
Reference read only: `../MEN001_Dyno`, HEAD `4495a1f6049f6a58ebfd436761faa84d17c8d643`. Reviewed original SAL beginning, REFERENCE_PHASE_MAPPING, AGENTS, WORKFLOW, SCENARIO_DECISIONS, SOFTWARE_ACCEPTANCE_SCOPE and USER_DECISIONS_2026_10_20_HANDOFF before execution. User-approved 500ms single/250ms inclusive chord/1000ms BOTH and full-release attempt ownership are the oracle, not implementation behavior.

## Results

- Full native-serialization software preflight PASS: 14 networks,254 blocks,2172 ports,75 Symbols,319 canonical wires,0 cross-network graphical wires. Full SAL/SGVL binding PASS:206 global references. This is not native CRC or IDE/Target PASS.
- Isolated `npm run check:software`: exit1; harness189/189 PASS, historical75/75 PASS, current443/445 PASS with2 FAIL; separate scenario report200PASS/1FAIL/7NOT VERIFIED/0ERROR. Remaining scenario FAIL is `STATE:conflicting-set-requests` and is conditional phase-boundary evidence.
- Fresh targeted current-source execution:84 tests,82PASS/2FAIL/0ERROR. RnD actual gesture component69/69 PASS. SafeRun13/15 PASS. Passing component cases cover both button orders at249/250/251ms and multiple fixed scan intervals, single500, late300/500/600, held-entry, short/full release, failed chord and no simultaneous up/down/blue/Unlock from qualified chord in tested RnD scope.
- Two additional independent current-source Run valid-chord probes FAIL, and one PLC opposition witness is CONDITIONAL_CONFLICT. See `targeted-routing-results.json`.

## Exact counterexamples

1. Run established by declared Step3 owner cut after real Step2 output preparation; PLC00 and all declared permits healthy. Green first t7417; blue t7517; release blue at7918 after400ms BOTH, retaining green. No neutral/full-filter cycle. Actual physical Run-down authorization rises at7918, and ResetSTO1/2, HV discharge request and ResetHV rise7920. Blue-first equivalent: physical down8018, fanout8020. This violates irreversible invalid-chord attempt ownership: short chord must not degrade into a single. The branch still times raw green through Network6/FBTon2→FBAnd24→FBAnd23→FBOr5.
2. Run fresh simultaneous BOTH held1100ms then blue released while green held: physical down rises immediately at release8518. With green-first delta250ms, release8768 gives the same result. User-approved Run policy says valid BOTH is ignored and release to one held button cannot become a single from the same attempt.
3. CONDITIONAL PLC interaction: stable RnD phase boundary, physical green accepted at500ms with PLC00; leave C1 feedbackTRUE. Set both PLC mode bitsTRUE at2619. Up and down requests bothTRUE at2620; by2629 actual HVrequest/HV outputTRUE while LV reset/discharge requestsTRUE and LV outputFALSE. SG remainsTRUE, not a new physical up gesture. Standalone PLC acceptance/handshake policy QP is unresolved: this is an executable software conflict under declared inputs, not proof that real PLC protocol produces this sequence or complete group reachability. Exact internal chain supplied by architect and independently executed; no assumed PLC oracle made normative.

## Reproduction

From repository root:

```powershell
$env:MEN001_SAFE_RUN_EVIDENCE_PATH = "$PWD/SafetyTests/button-routing-audit/tester/safe-run-evidence.json"
$env:MEN001_RND_EVIDENCE_PATH = "$PWD/SafetyTests/button-routing-audit/tester/rnd-evidence.json"
node --test --test-reporter=tap SafetyTests/test/current-safe-run-gestures.test.js SafetyTests/test/current-rnd-physical-integration.test.js
node SafetyTests/button-routing-audit/tester/targeted-routing.mjs
```

Full baseline was run from `tester/sandbox/v2/SafetyTests` with `npm run check:software`; current src/scripts/test/fixtures and top-level SafetyTests documents were copied unchanged, plus current Safety_Dyno and the read-only original Safety_Dyno at expected relative paths. All generated canonical-style reports are inside that sandbox. Root canonical reports were not overwritten. Full log is `baseline.log`, targeted log `targeted.log`; detailed original per-scan evidence is losslessly compressed by the existing fixture.

## Limits / NOT VERIFIED

All dynamic evidence is actual SAL component execution with explicit Network3 phase cuts. Network4/group lifecycle, full BOOT, all cross-mode reachability, PLC protocol arbitration, all emergency phase combinations and complete transition completion remain NOT VERIFIED. No cuts are reported as proven phase reachability. Native Error is a host stub; not a group no-fault proof. Actual component output changes are distinguished above from full-machine physical behavior. Source, timers, runtime, shared test files and canonical reports were not changed. No hardware, download, Target settings or push.
