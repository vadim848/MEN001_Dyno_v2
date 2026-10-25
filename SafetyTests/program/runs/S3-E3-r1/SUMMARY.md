# S3-E3-r1 (v2-runner) — 2026-10-24

## SHA256
- candidates/E3/native/TwinSafeGroup1.sal: 9ee66e7868547d7d42fb9ed4faf9f69030a2b4e6a5c64b1b0db2787176714d1e
- MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal: 67336d9b42aed3c14925dfbfec3e4e7533c4bf96b0d0183a13cea31ea785dd39

## Commands and exit codes
1. CATALOG_SAL_DIR=candidates/E3/native node --test --test-reporter=tap test/catalog/*.test.js -> all.tap, exit 1
2. node --test --test-reporter=tap test/catalog/*.test.js -> canon-all.tap, exit 1
3. CATALOG_SAL_DIR=candidates/E3/native npm run check:structure -> structure.log, exit 0
4. npm test -> selfchecks.log, exit 1

## Counts (TAP summary)
- all.tap (E3 native): tests 103, pass 65, fail 31, todo 7
- canon-all.tap (canonical): tests 103, pass 57, fail 42, todo 4
- selfchecks.log: tests 53, pass 47, fail 6
- structure.log: structure PASS (native preflight, typed binding, FB<=512, native CRC+validation)

## not ok in all.tap (non-TODO), verbatim: see all.tap lines 'not ok 31'..'not ok 103' (31 lines; list via: grep -E "^\s*not ok" all.tap | grep -v "# TODO")

## ok in canon-all.tap but not ok in all.tap: none (empty set)

## Mutations (all.tap): 14 applied, 14 killed (M-01..M-12, M-B1, M-B2); survivors: none

## selfchecks not ok: #1, #2, #3, #5, #12, #15 (BOOT preflight tests)
