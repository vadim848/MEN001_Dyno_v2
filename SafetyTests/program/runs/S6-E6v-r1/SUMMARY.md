# S6-E6v-r1 summary (v2-runner)

SHA256
- candidates/E6v/native/TwinSafeGroup1.sal = 9209319039fc555e77e5dfc626deafd507a14058cfd96847f0eb29dccb3469ef
- MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal (canonical E5) = 4c4be64b7e52862e14d1d8037ca496486cb69299596cb63c6d0b0f0ee9ce7cde

Catalog tests (node --test, TAP)
| run | file | tests | pass | fail | todo | exit | M rows (not ok) |
| E6v (CATALOG_SAL_DIR=candidates/E6v/native) | e6v-all.tap | 129 | 128 | 0 | 1 | 0 | 40 (0) |
| canonical E5 (no CATALOG_SAL_DIR) | canon-e5-all.tap | 129 | 125 | 0 | 4 | 0 | 40 (0) |
- E6v TODO: [E2] E-08 (NOT VERIFIED)
- canonical TODO: [E2] E-08; [M] M-G1, M-G6, M-G7 (NOT ASSESSABLE: guard introduced in candidate)

Structure (npm run check:structure)
- E6v: exit 0, structure PASS; native input rule PASS (0 errors); log structure-e6v.log
- canonical: exit 1, structure FAIL; native input rule FAIL with 18 errors (16 safe-input-only, 2 min-2-active-inputs: Network1/HB_LO, Network6/HEALTHY_OK); log structure-canon.log

Self-checks (npm test): exit 0, 53 tests, 53 pass, 0 fail, 0 todo; log selfchecks.log
