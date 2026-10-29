# TMR-1 tester report (v2-tester, 2026-10-28)

Oracle source: SCENARIO_DECISIONS "## TMR-1", TMR-1-Q1 = A (Vadim 2026-10-28): RD_T_COAST 5->2 s (normal + protective descent),
DN_T_HOLD 1->5 s (normal descent + StartingRun abort), RELEASE p.9 filter 2->1 s; SS1 2 s, single 0.5 s, both 1 s, chord 250 ms,
emergency chain, watchdogs unchanged. Values are hard-coded from the requirement in `test/catalog/lib/timers.js` (not read from SAL).
Editor files (`program/editor/TMR-1/**`) not read except the SHA line relayed by the lead.

## SALs
- canonical `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal` sha256 53e9a6d8220c3407002a2ade8d9292d9c11e13270b9307f0cbb3e0d65a6b8fbb (old timers)
- candidate `candidates/TMR-1/native/TwinSafeGroup1.sal` sha256 3511b31b12f8770fa67b41267412f7241b1ba033c744e293a91effe2311e1743

## Oracle changes (owned files)
- `test/catalog/lib/timers.js` (new): T_SS1 2000, T_COAST 2000, T_HOLD 5000, T_REL 1000.
- d.js: D-01/D-05 discharge a+4000 (was 7000); new `holdCheck` C2 OFF = Discharge+5000+-50 (D-01, D-03, also used by H/P/W);
  D-03 Unlock-during-abort branch now mandatory (abort 5 s > filter 1 s + 0.6 s; was silently skipped).
- h.js: H-02/H-03/H-06 discharge ev+2000 (was 5000) + hold check; H-07 a+4000 (blip at a+3000 still between STO a+2000 and DIS a+4000).
- p.js: P-03 a+4000 + hold; P-04 hold.
- k.js: K-08 pauses 900 (reject) / 1100, 1500 (accept) (was 1500/2500). q-500 (500 ms) dropped: stand precondition (first BOTH's R&D
  not yet confirmed at release+0.5 s), q-100 is the tighter negative. K-09 BOTH at release+1100 (permit-restart would need +1800).
- g.js: B-02 pauses 500, 900 (reject) / 1100, 1500 (accept) + precondition "Safe reached before the planned press".
- w.js: W-06 TD-E5-2 sub-case: press ~0.7 s after release -> not acknowledged, 1.1 s -> acknowledged (was <2 s / 2.1 s);
  W-02 wait 6.5 s + new hold check (abort C2 OFF = Discharge+5000); `rndWithFault` waits 500+T_HOLD+1000 (W-07/W-08 precondition).
- vis-filter.test.js: P9 = 1000 (requirement); env `VIS_FILTER_SAL_DIR` runs subtests 1-8 on that SAL (upload);
  derived windows moved (mid P9-500, early press P9-500, accept P9+500, 4b window [P9, P9+1000));
  mutant A: base RELEASE -> 1.5 s, expects model countdown stays P9 and diverged at release+1200.
- Generous fixed waits (helper `x.wait(2100)` after transitions etc.) left unchanged: >= new filter, not weakening.

## Results
| Run | SAL | Result | Log |
|---|---|---|---|
| catalog (final oracle) | candidate 3511b31b | PASS 138 tests, 137 pass, 0 fail, 1 todo (E-08 standing NV) | program/tester/TMR-1/catalog-candidate2.{txt,tap} |
| catalog (final oracle) | canonical 53e9a6d8 | FAIL 117 pass / 14 fail / 7 todo — expected RED, all 14 are old-timer values | program/tester/TMR-1/catalog-canonical2.{txt,tap} |
| vis-filter (filter + English) | candidate | 12/13 subtests pass; FAIL subtest 6 mutant A | program/tester/TMR-1/vis-filter-candidate.log |
| visualizer full suite | canonical | 55 tests: 42 pass / 13 fail. vis-filter subtests 1-10 FAIL (canonical RELEASE 2 s, expected RED); vis-regress "stand paths unchanged (git)" FAIL (my uncommitted catalog edits) and "check:software == baseline" FAIL (exit 1: catalog RED on canonical with new oracle) — both expected consequences, not visualizer defects; exam==TAP (VIS-1/5, display-only a/b) PASS | program/tester/TMR-1/vis-full-canonical.log |

Canonical RED (measured old values, confirms the oracle measures the right moments): discharge a+7005 / ev+5002, C2 OFF Discharge+1000/1001,
filter accept only after 2 s (B-02, K-08, K-09, W-06), D-03/W-02 abort ended before release+1.1 s. Todo 7 on canonical = E-08 + 6 mutation
rows NOT ASSESSABLE because their killing scenario fails on unmutated canonical; on candidate todo = 1 (E-08 only).

Editor's earlier candidate run (12 fail / 6 todo) was against the partly updated oracle; W-02/W-07/W-08 failed because stand waits
were sized for the old 1 s hold (abort C2 OFF now at u+5500) — fixed in the stand, not a SAL defect.

## FAIL to the lead (not weakened)
- **vis-filter subtest 6 (mutant A)**: `filter.presetMs` = 1500 for a SAL with RELEASE 1.5 s (`1500 !== 1000`). manual.js now mirrors
  the SAL RELEASE preset, so the p.9 model countdown follows a wrong SAL timer and "diverged" can never flag a RELEASE timing
  deviation. Conflicts with VIS-3-Q1 (countdown per p.9 + SAL flag, "разошлись" on mismatch). Question for analyst/lead: should the
  model countdown be the requirement constant (1 s) or the loaded SAL preset? Until decided: FAIL.

## NV / not claimed
- Native CRC of the candidate: not recomputed (expected FAIL/stale; Vadim Verify in IDE) — NV, not PASS.
- check:software runs on canonical (old timers) -> its catalog section will be RED with the new oracle until transfer.
- No mutation sweep (D-COMPACT). Config exit/rollback hold (G-04/G-07) kept as order-only: TMR-1 does not name it.

## For the lead (files not owned)
- `program/lead/SCENARIO_CATALOG.md` rows: K-08 (1,5/2,5 с), K-09 (2,1 с), D-01 (Discharge в 7 с), H-02 (выбег 5 с), W-06 (после 2 с),
  B-02 (2 с паузы), header line 11 (кнопки 0,5/1/2 с).
- `test/helpers/e2-emergency.js` T_DIS=1000 / coast 5000 — used only by `test/archive/**` (historical), left unchanged.
- `src/button-recognizer.js`, `src/physical-rnd-source.js`, `scripts/derive-compact-release-fix.js` reference RELEASE (not reviewed, not owned).

## Reproduce
```
cd SafetyTests
CATALOG_SAL_DIR=candidates/TMR-1/native node scripts/catalog-check.js
node scripts/catalog-check.js                       # canonical, expected RED
VIS_FILTER_SAL_DIR=candidates/TMR-1/native node --test --test-name-pattern="filter readiness|English" visualizer/test/vis-filter.test.js
node --test "visualizer/test/*.test.js"             # canonical
```

## Update 2026-10-29 — after transfer (canonical = 3511b31b..., commit ff76e11)
N1 (review): vis-filter on candidate (`VIS_FILTER_SAL_DIR=candidates/TMR-1/native`) is now 14/14 (13 filter subtests incl. mutant A
+ English) after the manual.js fix — confirmed: program/tester/TMR-1/vis-filter-candidate2.log. The mutant A FAIL above is resolved.

Full visualizer suite on canonical, first run (old baselines): 48/55, 7 FAIL — same set as the lead's. Classification: all are
expected consequences of TMR-1 (baselines), no test-logic issue, no visualizer defect:
- #3 VIS-1/5 exam vs check:structure: asserted structure PASS; now FAIL by stale native CRC only (exam == check:structure check list).
- #5 VIS-3 filter readiness, subtest 9: hard-coded canonical SHA 53e9a6d8 (pre-transfer); all timing subtests PASS (no old-timer leftover,
  not load-related, not default-path related). That is why it was 14/14 on the candidate run and FAIL on canonical after transfer.
- #8 display-only (b): `R.structure.status === "PASS"`; per-ID statuses == TAP passed.
- #12 VIS-2 git/SHA: SAL SHA baseline 53e9a6d8.
- #13 VIS-2 check:software: exit 0 / structure=PASS baseline; now exit 1 by stale CRC (catalog PASS 137/138, self 53/53).
Baseline updates (visualizer/test only): `_lib.mjs` CANON_SAL_SHA = 3511b31b...1743, STALE_CRC {calculated 2244300000, recorded
"4151414716"}, `onlyStaleCrcProblems()` — structure FAIL with exactly one non-PASS check = native CRC (FAIL, crcValid false, no validation
errors, these exact CRC values); every other check must be PASS. Used in vis-exam-canonical, vis-filter (#9 SHA, display-only b),
vis-regress (exit 1, structure lines parsed). Catalog/self counts unchanged. After Vadim's Verify the SHA/CRC change -> re-baseline.
Rerun: 55/55 PASS (program/tester/TMR-1/vis-full-canonical3.log). Native CRC remains NV/expected FAIL, not a pass.

## Update 2026-10-29 — after Vadim's IDE Verify (canonical SAL f81b1a5e565dc5d9c5893dff9b2f7c25f27712c45be442905e3f6835706544f4, HEAD 1912ad8)
SHA verified by sha256sum. Stale-CRC allowance removed: `_lib.mjs` STALE_CRC / onlyStaleCrcProblems deleted, CANON_SAL_SHA = f81b1a5e...;
strict `structure.status === "PASS"` restored in vis-exam-canonical (reference + exam), vis-filter display-only (b); vis-regress back to
exit 0 + structure=PASS (a stale CRC fails again). vis-filter #9 uses the new SHA.
- `npm run check:software`: exit 0, SUMMARY catalog=PASS {138/137/0/1 todo} structure=PASS self=PASS {53/53}
  (program/tester/TMR-1/check-software-verified.log).
- Full visualizer suite: 52/55 tests pass; 3 FAIL = vis-exam-canonical timed out at its 40 min limit under load (parent timeout ->
  3 subtests "could not be started", no assertion failed). Rerun alone: 4/4 PASS in 22 min (vis-exam-canonical-verified.log).
  All other files PASS, incl. VIS-2 SAL/git + check:software == baseline (vis-full-verified.log). Net: 55/55 assertions PASS.
