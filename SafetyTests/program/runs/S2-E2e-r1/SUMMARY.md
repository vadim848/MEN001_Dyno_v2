# S2-E2e-r1 summary

SAL: candidates/E2e/native/TwinSafeGroup1.sal
SHA256: 325e3c4c2656ee4b6bd6b4206fb6104b8f0f06c258cda131b367e59b9b478e6e

## Runs (TAP "# tests/pass/fail/skipped/todo" summary lines)
| run | command file | exit | tests | pass | fail | skip | todo |
|---|---|---|---|---|---|---|---|
| E2 only (CATALOG_STAGES=E2) | e2.tap | 1 | 101 | 49 | 1 | 48 | 3 |
| all catalog | all.tap | 1 | 101 | 54 | 43 | 0 | 4 |
| check:structure | structure.log | 0 | - | - | - | - | - |

Exit codes: e2.exit, all.exit, structure.exit.

## Failing (not ok) tests
E2 run:
- 17 - [E2] D-04 Safe->R&D (C1 ON): green 0.5 s -> abort to Safe: C1 OFF, C1_FBK OFF

All run (43), by ID:
E3: C-06, C-07, D-01, D-02, D-03, D-05, D-09, H-02, H-03, H-06, H-07
E2: D-04
E6: E-09, E-10, G-07, W-01, W-02, W-03, W-04, W-05
E4: G-01, G-02, G-03, G-04, G-05, G-06, P-01 .. P-12 (P-01..P-12)
E5: W-06, W-07, W-08, W-09, W-10

Full verbatim lines: program/runs/S2-E2e-r1/e2.tap and all.tap (grep "^\s*not ok ").

## Structure (check:structure, exit 0)
networks=14 blocks=237 ports=2004 symbols=79 wires=302
PASS: native preflight; typed binding audit; FB count <= 512; native CRC + native validation.

## Notes
- summarize.mjs failed (expects a different invocation; TypeError on undefined path). Counts taken from TAP "# " summary lines (grep-based ok/not ok counts over-count nested subtests, so not used).
