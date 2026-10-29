# TMR-1 review (v2-reviewer, 2026-10-28, D-COMPACT, no new checks/mutants)

Requirement: SCENARIO_DECISIONS "## TMR-1", TMR-1-Q1 = А (RD_T_COAST 5->2, DN_T_HOLD 1->5, RELEASE 2->1; RD_T_SS1 2; nothing else).
HEAD c24c5e0, uncommitted working tree.

## Verdict: ACCEPT-WITH-NOTES (bounded)
Bounds: program/stand level only. Native CRC NV (stale by design, Vadim Verify). No hardware/target claim. Canonical not yet transferred.

## 1. Candidate SAL vs canonical - OK
- canonical MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal sha256 53e9a6d8...b8fbb; candidate candidates/TMR-1/native/TwinSafeGroup1.sal 3511b31b...1743. Both 1735359 bytes.
- `cmp -l` = exactly 3 differing bytes, all `timing` of parameterPort "Delay Time (s)":
  RD_T_COAST (port 9e61ac3c) 5->2; DN_T_HOLD (port aeb14c5a) 1->5; RELEASE (fBTon bbcefd6f, port 2747d120) 2->1.
- RD_T_SS1 timing="2" unchanged. Same length + 3 bytes => Symbols/blocks/ports/wires/orders/usages unchanged by construction.
- .diagram byte-identical to canonical; GVL1.sgvl byte-identical to MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl.

## 2. Catalog oracles - OK
- timers.js constants come from the requirement text, not the SAL (2000/2000/5000/1000).
- Boundaries moved with the requirement, ±50 ms kept: D-01/D-05/H-07/P-03 a+4000, H-02/H-03/H-06 ev+2000; new holdCheck C2 OFF = Discharge+5000 (D-01, D-03, H-02/03, P-03, P-04, W-02) - adds coverage of DN_T_HOLD that was previously order-only.
- D-03 Unlock-during-abort branch now mandatory (explicit `live` assertion) - strengthening.
- K-08: 1500/2500 -> 900 (reject) / 1100, 1500 (accept). Dropped 500 ms case justified (stand precondition: first BOTH's R&D not confirmed at release+0.5 s); 900 is the tighter negative. Acceptable. B-02 keeps 500/900/1100/1500 + explicit precondition.
- K-09 at release+1100 still discriminates "pause counted by buttons" vs restart at permit return (+1800). W-06 TD-E5-2 sub-case 0.7 s reject / 1.1 s accept.
- No weakening found. Canonical run RED 14/138 exactly on timer-driven rows (B-02, D-01/03/05, H-02/03/06/07, K-08/09, P-03/04, W-02, W-06) with measured old values - confirms oracles measure the right moments.

## 3. Trainer - OK
- manual.js: FILTER_MS = 1000 requirement constant, `filterMs` not taken from SAL; SAL preset shown separately (`sal.presetMs`); mismatch -> diverged (VIS-3-Q1). README consistent.
- vis-filter subtest 6 asserts presetMs stays P9 under RELEASE 1.5 s mutant and diverged is raised. Re-run on candidate after the manual.js fix: 14/14 pass (program/tester/TMR-1/vis-filter-candidate-lead.log, 23:35).

## 4. SCENARIO_CATALOG.md - OK
K-08, K-09, D-01, H-02, W-06, B-02 and header (button 0,5/1 s, filter 1 s) updated consistently with code.

## Blocking
None.

## Notes (non-blocking)
N1. TMR1_TEST_REPORT.md (23:09:24) still lists "FAIL vis-filter subtest 6"; manual.js was fixed 23:09:48 and the passing re-run was produced by the lead (log in tester folder), not by the tester. Tester should amend the report / confirm independently.
N2. Mutant A now checks only "SAL slower than p.9" (1.5 s > 1 s). The safety-relevant "SAL filter too short" direction (e.g. RELEASE 0.5 s) is no longer exercised (old mutant 1.5 < 2 covered it). Code comparison is symmetric; recommend adding a shorter-preset mutant later.
N3. Catalog rows D-03, P-03, P-04, W-02 do not state the 5 s hold numerically; tests carry holdCheck. Optional text alignment.
N4. W-06 main / W-09 positive BOTH at 2.1 s is far above the 1 s filter (not a boundary); boundary covered by K-08/B-02/TD-E5-2. OK.
N5. Residual old values, not reviewed/not oracles: src/button-recognizer.js (releaseMs/bothMs default 2000; used by src/safety-model.js prototype, candidate/mutation scripts), src/physical-rnd-source.js (reads SAL), scripts/derive-compact-release-fix.js (historical plan), test/helpers/e2-emergency.js (T_DIS 1000/coast 5000, test/archive only). Must not be cited as SAL evidence; update only if those stands are re-activated.
N6. Native structure-check counts (346/105/2800/466) are editor self-check; independently implied here by the 3-byte diff. CRC NV.

## State before transfer - acceptable, explained
check:software catalog section, vis-regress ("stand paths unchanged", "check:software == baseline") and vis-filter on canonical are RED because canonical still has the old timers and the oracle is new. Expected; not a defect.

## Must re-run after the coordinator transfers the candidate to canonical
1. Verify sha256 canonical == 3511b31b...; diagram/sgvl unchanged.
2. `npm run check:structure` (preflight/native rule PASS, CRC FAIL until Vadim Verify).
3. `npm run check:catalog` -> expect 137/138 + E-08 todo.
4. `npm run check:software` and rebaseline; then `node --test "visualizer/test/*.test.js"` incl. vis-regress and vis-filter on canonical (all green).
5. After Vadim's Verify: native CRC PASS with Symbols/blocks/ports counts preserved.
