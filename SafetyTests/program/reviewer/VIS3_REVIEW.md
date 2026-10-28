# VIS-3 review (2026-10-28, D-COMPACT, single short review)

Verdict: **ACCEPT-WITH-NOTES** (bounded: model-only trainer; DOM behaviour in a browser NV; no hardware/Verify claim).

Source: HEAD edbe4f90725f689325373f914e9a811d882c183b + uncommitted `git diff HEAD -- SafetyTests/visualizer` (22 files, +253/-174) + new test/vis-filter.test.js.
Canonical SAL/SGVL untouched (tester: SAL 53e9a6d8..., SGVL 8a3d452c...; vis-filter test 9). Requirements: SCENARIO_DECISIONS "## VIS-3" Q1=В, Q2, Q3. Plan: architect/VIS3_PLAN.md.

## Checks
- Display only: filter state computed in manual.js `filterScan()` after `x.step()`, reads `x.r` only, no writes to SAL/inputs/queue; exposed as `state.filter`. Exam runs in workers; tester display-only (a)/(b) = stand TAP. OK.
- No button blocking (Q3): app.js `applyFilter` only toggles CSS class `cnt`; the only `b.disabled` is pre-existing VIS-2 "inputs unmapped" (line ~231). Q1 "кнопка неактивна" superseded by Q3. OK.
- Countdown: model time `x.t`, `FILTER_MS = 2000` (p.9, not 3 s); any of in_Reset_PB/in_Relase_Door_PB pressed -> `fRelT=null`; first released scan -> `fRelT=t`; ready at `t-fRelT>=2000`. Press resets, each release restarts from 0. Matches Q3. Test 4b asserts 2000 scans at x2.
- Divergence/NOT CHECKED: compared only if SAL flag found and status exactly SAFE or RND; diverged = mismatch on >=2 consecutive compared scans (A-VIS3-2); sticky lastDivergedT cleared on press. Block missing -> sal.found=false "NOT CHECKED"; buttons unmapped -> available=false. Matches plan §3.
- server.js `exit`->`close`: failure detection preserved (still fails on non-zero code or no result; signal kill => code null and no result => fail). `close` fires after IPC/stdio drain, so it removes the race only. Pre-existing at VIS-2 HEAD per tester repro. OK.
- English: strings translated in UI/report/server/mapping/target/catalog/svg/trace; SAL signal names, block paths untranslated; status token "НЕ ПРОВЕРЕНО" -> "NOT CHECKED" consistently (catalog.js + server totals). OK.
- README: Node 22+, no deps (package.json has none), `npm run visualizer`, 127.0.0.1:8642 / VIS_PORT, model disclaimer: accurate.
- Tests: oracle from p.9/K-08/Q3 (not editor NOTES); forbidden/early press (K-08 at +1500 rejected, +2500 accepted), mid-countdown presses, EMG/boot not compared, mutants A/B, unmapped. Tester: 55/55, check:software PASS 138/137/0/1, self 53/53. Mutants M1-M7 killed (on pre-Q3 manual.js; not rerun after Q3 — Q3 change is in app.js/UI, filterScan semantics same).

## Blocking items
None.

## Notes (non-blocking)
1. `_lib.mjs` retries once on transport "fetch failed", including non-idempotent POSTs (exam start, manual inputs). If the server had processed the first request, a double-apply could mask/alter a result. Low risk (HTTP statuses not retried); tester -> consider restricting the retry to GET in a later cycle.
2. vis-filter test 4/4b: x10 window check and edge-after-speed check fall back to `t.diagnostic` under load; only x2 is asserted. Not a hidden PASS but weaker than its title — keep reported as such.
3. Plan §5 item 2 says "compared=true" for R&D->Run, contradicting §3 (RUN not compared). Tester used §3 (correct). Architect -> fix §5 text.
4. Q2 "report in English": report chrome is English, but catalog check messages from the stand (oracle texts) may remain Russian; tester excluded "stand-provided strings" from the Cyrillic check. Acceptable (oracle texts not rewritten), but say so to Vadim/Niv.
5. README clone instructions reference `Safety-Develop_2_Cloud`; true only after PUSH-1 carries VIS-3.
6. Browser DOM behaviour (buttons enabled, bar, chip) only statically checked: NV until Vadim/Niv looks at the UI.
