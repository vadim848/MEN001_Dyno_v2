# Candidate button/cover acceptance — 2026-10-18

> This is the earlier focused report. The current software-only package is
> `npm run check:software`; see SOFTWARE_CHECK_RESULTS.md. Physical validation
> is outside scope; remaining software coverage gaps are reported separately.

Run `npm run acceptance:candidate -- --write` to regenerate
`CANDIDATE_ACCEPTANCE.json`. This command reads the **working SAL**, not the
pinned fixture. Its SHA256/embedded CRC and each first violated observation
are recorded. The unchanged candidate currently produces **2 PASS, 14 FAIL,
3 NOT VERIFIED**. Exit 1 means failures; exit 2 means incomplete verification
without failures. A zero exit requires every reported scenario PASS.

| Case | Requirement | Current result |
|---|---|---|
| ACC-B02-G | BTN-003 | FAIL: down request already TRUE at 900 ms |
| ACC-B02-B | BTN-004 | FAIL: blue unlock request already TRUE at 900 ms |
| ACC-B03-T | BTN-006 | FAIL: upward request already TRUE at 1900 ms |
| ACC-B03-B/G | BTN-007 | FAIL: failed chord becomes a remaining single-button command |
| ACC-C01-S | CVR-001/002 | FAIL: Safe unlock still TRUE at 50 ms after release |
| ACC-C01-R | CVR-001 | PASS only for sampled R&D release with locked monitor retained |
| ACC-C02-X | CVR-005 | FAIL: unlock and upward request coexist after open/reclose/chord |
| ACC-B01 | BTN-001/002, BOOT-002 | NOT VERIFIED: full recognizer/initialization ownership not bound |
| ACC-C02-F | CVR-004/006 | NOT VERIFIED: separate physical feedback/energy interpretation incomplete |
| ACC-C01-E | EMG-007 | NOT VERIFIED: remaining phases/sources and physical polarity |

## Expanded cases

- ACC-B01-R: FAIL: a 100 ms neutral interval in the bound R&D branch allows
  another blue command without the required 2 s release qualification.
- ACC-B03-IN/EDGE/LATE: FAIL for second-button arrival at 490/500/510 ms;
  upward request is already TRUE at 1900 ms of both held. With corrected
  timers in a cloned model, the 490/500 ms samples pass but 510 ms still
  produces a forbidden request after 2100 ms. Timer-only changes are insufficient.
- ACC-B03-FLICKER: FAIL: upward request appears before the full renewed 2 s
  stable interval after a 50 ms single-button loss.
- ACC-C01-E-Step1 / Step_RnD: FAIL: held-blue unlock remains TRUE during
  NC1 loss and restoration without Reset.
- ACC-C01-E-Step3: PASS only for the sampled seeded Run/NC1 trace: unlock OFF.

## Scope

These checks execute selected Network12 button and Network1/2/12 cover chains,
with externally supplied R&D/Safe and feedback preconditions. Timing thresholds
use the preliminary specification values (1 s singles, 2 s both). They sample
early and qualified checkpoints, not every boundary or every scan. Exact edge
timing, re-arm, full-project states, physical polarity, group lifecycle and
hardware behavior remain outside this first report. PASS applies to the named
sampled scenario only, not the entire cited requirement.

Emergency additions execute all networks except unresolved Network4, with
seeded phase/energy/E-Stop memories, fixed feedback and raw Healthy FALSE.
No-EDM and group-lifecycle limitations are recorded per case. These are not
power-up/reachability or physical-unlock validation traces.

The reporter records missing explicit selected-block bindings as NOT VERIFIED.
Renamed/restructured candidate logic requires reviewed binding updates, not
default-FALSE assumptions or relaxed expected behavior. Recorded unconnected
fallback ports remain assumptions and must be reviewed before acceptance.

## Reporter verification

Five regression tests verify that the historical defect fixture produces
failure, a blue-timer-only correction in a cloned model changes the blue
timing outcome to PASS, and a missing Safe cover network yields NOT VERIFIED.
Additional checks distinguish timer correction from late-chord rejection and
retain the no-EDM limitation in emergency results.
The actual candidate report intentionally fails; these reporter tests passing
do not make the candidate conformant.

## Next

Refine the button/cover implementation design against these cases, including
global emergency inhibition and command-recognizer ownership across modes.
Remaining full phase/source coverage stays explicit. Retain baseline unchanged.
