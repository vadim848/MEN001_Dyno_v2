# Pinned planned pair for the E2 delta-proof self-test (stand D2, 2026-10-22)

Frozen byte copies used only by `test/stand-e2-delta-check.test.js` to verify
`scripts/e2-delta-check.mjs` itself (PASS on the planned pair, FAIL on injected
candidate/plan deviations). Not a source for requirement tests. Do not refresh to
match changed candidates or a newer plan.

- E2a-core-5648e31c/ = candidates/E2a/native (editor E2a-core)
  - TwinSafeGroup1.sal          5648e31cec9fea6d82ed2392a4be21a26c599eb4872969f5adab2ef3b87fd40b
  - GVL1.sgvl                   e60698840e556dbd6d838958eadb8545735a81aaff8efbfceabc3613a4e08010
  - TwinSafeGroup1.sal.diagram  27d7f20d890d48fc175fbd25af21a5b0c874ce4cf248b37ac73df26fe0624785
- E2a-RC-5733552a/ = candidates/E2a-RC/native (editor E2a-RC)
  - TwinSafeGroup1.sal          5733552a150bfd33df4211da8f97a8fc993ff990ad52c90a8d7758d950660f3f
  - GVL1.sgvl                   253de7f39f2c4af83fa8642445a885d18ecfcdccec46fcbf96612d88a810b669
  - TwinSafeGroup1.sal.diagram  5fa942384352033814f2d51bf8c4a847098d6a3322d4b733995de64b7b759bb2
- PLAN.v7.2-5198d426.json = program/architect/E2-status/PLAN.v7_2.json
  (sha256 5198d426fb1e2ea3e983bb3694cc7a4b8a98ea938ab9947fc649dd125852f5c3)
