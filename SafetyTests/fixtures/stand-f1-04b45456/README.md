# Pinned canonical F1 for stand self-tests (E2-R1-stand)

Frozen byte copies of canonical F1 (checkpoint 0391fae) used only by stand
self-tests (`test/stand-case-guards.test.js`, `test/stand-sal-parser-empty-network.test.js`)
so that they verify the stand itself and stay valid when canonical changes (E2 R1+).
Not a source for requirement tests. Do not refresh to match a changed canonical.

- TwinSafeGroup1.sal sha256 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3
- GVL1.sgvl          sha256 dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104
