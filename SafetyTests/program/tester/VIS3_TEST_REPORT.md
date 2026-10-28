# VIS-3 tester report (2026-10-28)

Slice/role: VIS-3 (SAL trainer: button-filter readiness + English UI) / independent tester.
Oracle: SCENARIO_DECISIONS "## VIS-3" Q1=В, Q2 (English), Q3 (buttons never blocked; press resets, every release restarts; 2 s not 3 s);
catalog K-08 / p.9; VIS3_PLAN §2/§3/§5 for API surface + comparison scope. Not derived from editor NOTES.

## Source
- HEAD edbe4f9 (+ uncommitted editor VIS-3 working tree). Canonical SAL sha256 53e9a6d8220c3407002a2ade8d9292d9c11e13270b9307f0cbb3e0d65a6b8fbb,
  SGVL 8a3d452c3d671bae6e003896543aaa2378c4da7a9ec1285ff8479d118a632ff9 (unchanged).
- Candidate at final run: manual.js d9233bf9..., app/app.js ebe5c7ac..., server.js f155d2f0... (after editor 'close' fix).

## Reproduce
`cd SafetyTests; node --test "visualizer/test/*.test.js"` -> program/tester/VIS-3/full-run4.log

## Results (full-run4.log)
55 tests, 55 pass, 0 fail, exit 0. Included vis-regress: check:software catalog PASS {138, 137 pass, 0 fail, 1 todo},
structure PASS, self PASS 53/53, exit 0, SAL SHA = baseline. Same counts from a separate check:software run (VIS-3/check-software.log).

## vis-filter.test.js coverage
1 green 100 ms Safe: ready at release+2000 +-1, SAL flag same, never diverged. 1b blue alone restarts countdown.
2 BOTH Safe->R&D, R&D->Run: same timing; compared in SAFE/RND, not in RUN (plan §3; plan §5 item 2 text "compared=true" for Run contradicts §3 — §3 used).
3 K-08: BOTH at release+1500 accepted by API, SAL stays SAFE, countdown restarts; BOTH at +2500 -> RND.
3b Q3: green/blue/Both pressed mid-countdown reach SAL input, each release restarts from 0.
4 paused -> t/elapsed frozen; speed x10/x0.1 invariants; advance 2000 -> ready. 4b running x2 (asserted) / x10: ready iff 2000 scans (not 3 s).
5 EMG: not compared, no divergence; Restart scan-by-scan, max mismatch 0. 5b boot: 1 single-scan mismatch, tolerated (A-VIS3-2).
6 mutant A (RELEASE 1.5 s): diverged true, lastDivergedT sticky, cleared on next press. 7 mutant B (block renamed): sal.found false, NOT CHECKED, countdown kept.
8 in_Reset_PB / in_Relase_Door_PB unmapped -> available false "not checked"; mapped -> found. 9 canonical SAL untouched.
English: no Cyrillic in index.html/app.js, server-module string literals, server error messages, filter texts, report chrome (stand-provided strings excluded); lang="en"; NOT CHECKED token.
Display-only: (a) exam during running manual session == stand TAP; (b) after manual activity == TAP, report English/standalone.
Existing tests updated to English strings (vis-buttons, vis-static [now strict: 0 Cyrillic], vis-exam-canonical, vis-exam-mutants, vis-mapping(-patterns), vis-manual speed msg); vis-regress baseline -> 53e9a6d8 / 138/137/1 + self 53/53.

## Implementation-level mutants (scratch copy of manual.js, run on pre-Q3 manual.js; not rerun after Q3 per D-COMPACT)
M1 FILTER_MS 1990, M2 tolerance removed, M3 lastDivergedT not cleared, M4 RUN compared, M5 blue ignored, M6 never diverged,
M7 compared in any status: all KILLED; M0 unmutated PASS. Details: program/tester/VIS-3/mutations.txt. No survivors.

## Defect found (fixed by editor, verified)
display-only (a) failed: "exam error: worker process exited with code 0" when a manual session runs during an exam (child 'exit' before result IPC).
Pre-existing at HEAD (VIS-2) too (repro in scratch: failed at 104 s vs 11 s with VIS-3). Editor changed to 'close'; full-run4 PASS.

## Assumptions / limits
- Scan = 1 ms model time; big-button path = POST /api/manual/inputs (VIS-2). DOM behaviour (buttons not disabled, bar, chip) only static heuristic: NV in a browser.
- x10 window check fell back to diagnostic under load (polls too sparse); x2 asserted.
- _lib.mjs: one retry on transport-level "fetch failed" only (keep-alive race under parallel load); HTTP statuses never retried.
- vis-filter test 4: edge-after-speed check skipped with diagnostic if wall-clock runs overshoot under load (invariants still asserted).
- Model only; not Verify/TwinCAT/hardware.
