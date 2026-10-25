# Candidate acceptance backlog — 2026-10-18

> Current scope: software only; hardware is an accepted input condition.
> See ../AGENTS.md, REFERENCE_BEHAVIOR.md and SOFTWARE_CHECK_RESULTS.md.
> Physical source/validation questions below no longer block code checks.

Spec sections 19–20 now assign 41 stable requirement-group IDs: 12 EMG and
29 BTN/CVR/MOD/STP/BOOT. These identify existing rules; they do not resolve
open wiring/timing decisions or complete per-feedback atomic requirements.

## Explicit test binding

- `fixtures/v2-4bb8703/TwinSafeGroup1.sal`: historical byte-pinned baseline,
  checked by `src/baseline-fixture.js`. Twelve reproduction suites now import
  this fixture, including chain/phase/state/energy/cover/button results.
- Working SAL: conformance, assumptions, runtime and semantics suites and all
  audit scripts still inspect `MEN001_Dyno/Safety_Dyno/...` in v2.
- The independent model/recognizer suites remain executable specification aids.
- Candidate required-behavior acceptance is **not complete**. Neither the
  full green suite nor observational audit commands imply candidate acceptance.

Before implementation, use separate candidate-bound scenarios with explicit
requirement IDs. Never overwrite the fixture or relabel a baseline-discrepancy
assertion as acceptance. Historical reports refer to the pinned checkpoint;
regenerate audit artifacts to inspect a changed candidate.

## Concrete positive / rejection scenario pairs still to bind

| Planned pair | Requirements | Required-behavior scenario | Rejection/fault scenario |
|---|---|---|---|
| ACC-B01 | BTN-001/002, BOOT-002 | Complete neutral filter, then fresh input | Input just before filter end, held indefinitely: no command |
| ACC-B02 | BTN-003/004/008 | One qualified single-button command | T_SINGLE minus one tick / continued hold: early or repeated command forbidden |
| ACC-B03 | BTN-005/006/007 | In-window chord and full stable T_BOTH | Each button flickers/leaves; remaining button cannot become single; late chord rejected |
| ACC-C01 | CVR-001/002/003 | Qualified held blue in Safe/R&D; indefinite open allowed | Release, green press, Run or transition removes/inhibits unlock |
| ACC-C02 | CVR-004/005/006 | Closed and locked before a fresh upward gesture | Open/unlocked or unlock-active: no rise; locked loss with energy: emergency |
| ACC-M01 | MOD-001/002/008 | Upward phases complete only after all actual feedback | Missing/stuck feedback or each interlock loss: no higher mode |
| ACC-M02 | MOD-003/004/007 | Fresh request accepted only in eligible steady phase | Held PLC request / next command during transition cannot add energy |
| ACC-M03 | MOD-005/006, STP-005, EMG-012 | R&D down removes LV then reaches Safe | No HV re-energization; missing LV OFF cannot reach Safe; conflicting states fault |
| ACC-S01 | STP-001/002, EMG-008/009 | Normal SS1 then discharge with C2 retained | Healthy loss at each timer boundary chooses latched full coast; recovery cannot change branch |
| ACC-S02 | STP-003/004, EMG-010 | Approved completion and C2 OFF permit R&D | Missing completion/feedback/timeouts retain lock, prohibit R&D and latch fault |
| ACC-E01 | EMG-001/002/004/005/007/011 | Every applicable fault starts removal in each semantic phase | Fault during energization inhibits rise; restored input cannot abort removal; blue held cannot unlock |
| ACC-E02 | EMG-003/006, BOOT-001 | Safe connector recovery plus fresh gesture; manual emergency recovery into Safe | Missing connector blocks without fault in Safe; PLC/held Reset/boot cannot restore Run |

These are planned acceptance cases, not already passing tests. Expand each
pair across relevant raw inputs and boundaries; final TwinSAFE Verify/Build,
CRC and hardware validation remain separate mandatory evidence.

## Immediate next task

Initial implementation is now available: `CANDIDATE_ACCEPTANCE_REPORT.md` and
`npm run acceptance:candidate -- --write` execute sixteen scoped button/cover
cases plus three explicit unverified areas. Expanded result: 2 PASS, 14 FAIL,
3 NOT VERIFIED. The full pairs above remain incomplete.

Implement candidate-bound command/cover acceptance scenarios with status
reporting that distinguishes known baseline FAIL, NOT VERIFIED and PASS.
Start with bounded button timing/re-arm cases using already implemented SAL
semantics. Do not run all acceptance checks as if the unchanged baseline were
expected to pass. Energy-order acceptance needs the open physical decisions.
