# SAL mutation report

Plan: program/stand/E0-pilot-F1/sal-mutation-plan.pilot-f1.json (sha256 83f7a34fdc9591b060d9f02b56875ca50da0b9b1838f54de5d0ff849a22dc3ae)
SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3
SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104
diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603
Summary: {"KILLED":2,"STRUCTURAL-ONLY":7,"SURVIVED":0,"INVALID":0}; baseline detector tests 508 (0 not passing on unmutated copy)
Non-kill categories over all mutations: {"behavioural-assertion":8,"swcheck-behavioural-fail":0,"non-behavioural-assertion":38,"exception":0,"hook-cancel":0,"file-level":0,"absent":0,"swcheck-structural":0,"swcheck-error":0}

Kill rule: KILLED only by (a) a concrete test ok on baseline and not ok on the mutant with an assertion failure (ERR_ASSERTION in the test or a failing nested subtest), in a file without file-level failure in that run, name in behaviouralTests; or (b) a non-BOOT software-check case PASS -> FAIL. Load/SHA pin/file-level ERR_TEST_FAILURE/timeout, non-assertion exceptions, hook/cancel, absent tests never kill (src/sal-mutation-kill.js).

| ID | guard | mutation | verdict | behavioural killers (count / first) | load/SHA/file-level ERROR | exception (non-assert) | hook/cancel | absent | non-behavioural assert | software-check structural/error |
|---|---|---|---|---|---|---|---|---|---|---|
| IL-01 | InterLock | deactivate-input //Network12/FBAnd16/AndIn1 | KILLED | 4 / current-door-interlock.test.js :: DOOR06 component Doorfalse/NC1false/NC2true/Falsefalse | 0 | 0 | 0 | 0 | 5 | 0 |
| IL-02 | InterLock | deactivate-input //Network12/FBAnd16/AndIn3 | KILLED | 4 / current-door-interlock.test.js :: DOOR06 component Doorfalse/NC1true/NC2false/Falsefalse | 0 | 0 | 0 | 0 | 5 | 0 |
| IL-04 | InterLock | deactivate-input //Network2/FBAnd1/AndIn5 | STRUCTURAL-ONLY | 0 | 0 | 0 | 0 | 0 | 4 | 0 |
| IL-05 | InterLock | deactivate-input //Network2/FBAnd1/AndIn6 | STRUCTURAL-ONLY | 0 | 0 | 0 | 0 | 0 | 4 | 0 |
| IL-06 | InterLock | deactivate-input //Network6/FBAnd9/AndIn2 | STRUCTURAL-ONLY | 0 | 0 | 0 | 0 | 0 | 4 | 0 |
| IL-07 | InterLock | deactivate-input //RndPhysicalCompact/GATE_001/AndIn5 | STRUCTURAL-ONLY | 0 | 0 | 0 | 0 | 0 | 4 | 0 |
| ES-06 | EStop | deactivate-input //Network3/FBAnd1/AndIn2 | STRUCTURAL-ONLY | 0 | 0 | 0 | 0 | 0 | 4 | 0 |
| ES-07 | EStop | deactivate-input //Network5/FBAnd1/AndIn3 | STRUCTURAL-ONLY | 0 | 0 | 0 | 0 | 0 | 4 | 0 |
| UL-05 | Unlock | deactivate-input //Network12/FBAnd2/AndIn3 | STRUCTURAL-ONLY | 0 | 0 | 0 | 0 | 0 | 4 | 0 |

- Kills are judged only by the plan's behavioural allowlist and assertion failures; STRUCTURAL-ONLY is not a kill for G3
- Mutations are SAL attribute faults (guard term removed, polarity, channel mode, timing); they are a fault model, not native-valid edits
- Simulator semantics limits apply (program/stand/FB_SEMANTICS.md); an equivalent mutant can survive legitimately and must be argued, not assumed
