# S6 last-cycle semantics (stand-engineer, canonical E6v, SAL sha256 92093190...)

Probe: `program/stand/S6/last-cycle-probe.mjs` (output `last-cycle-probe.out.txt`). Run: `node program/stand/S6/last-cycle-probe.mjs`.

## Simulator code
- `src/sal-runtime.js:151-154` `scan()` (executionOrder "global", default): all blocks of all networks sorted by native
  `orderOfExecution`, evaluated sequentially. (`legacy-network` mode, :157-159, is non-default, not used by the checks.)
- `write()` :~80-90 stores the output into `values` immediately: port path, `var:<name>` for outputVariables/globals, and
  wired targets. `readRaw()` :~58-75 reads from `values` at the moment the consumer runs. Hence a consumer ordered BEFORE
  its producer sees whatever the previous scan left in `values` (previous-scan value); ordered AFTER sees the same-scan value.
- Applies equally to (a) wiredLink (`port.sources[0]` -> `values[port path]`) and (b) Variable/Symbol (`port.globals` /
  `variableTargets` -> `values["var:<name>"]`): same store, same timing.
- Never-written value before scan 1: `get()` returns false (Boolean(undefined)) -> initial last-cycle value is FALSE.
  (`unconnectedInput=true` applies only to ports with no source/global/target.)

## Evidence
- Static: parsed 72 WiredLink + 22 Variable warnings from VERIFY_RESULT_3.md (one Variable line not matched by the regex; 94 of 95).
  For 94/94 consumer.orderOfExecution < producer.orderOfExecution in the parsed canonical model (blocks matched by
  `instanceName`, which is what Verify prints; `name` is not unique across networks).
- Dynamic (producer output forced to toggle each scan; 19999 scans; consumer read vs producer value of previous/current scan):
  | kind | producer (ord) -> consumer (ord) | read==prev-scan | read==current-scan when changed |
  | WiredLink | FBAnd72.AndOut(317) -> FBOr46.OrIn2(315) | 19999/19999 | 0 / 13333 changes |
  | WiredLink | CFG_EX.RsOut(147) -> FBOr10.OrIn2(51) | 19999/19999 | 0 / 13333 |
  | Variable linkHltLvLost | HLT_LV.AndOut(275) -> GATE_030.OrIn6(241) | 19999/19999 | 0 / 13333 |
  | Variable linkWdCfgFail | WD_FAIL_ANY.OrOut(208) -> CFG_EX_OR.OrIn2(146) | 19999/19999 | 0 / 13333 |
  | Variable linkAbortActive | SU_ABORT.RsOut(261) -> FBAndNotRunSu.AndIn3(97) | 19999/19999 | 0 / 13333 |
  The producer is forced because with random held inputs these deep producers stayed constant; the probe tests the
  scheduling semantics, not the logic values.

## Inputs vs outputs
- `setInputs()` writes `var:<name>` before `scan()`; inputs (alias/process image) are constant for the whole scan: sampled
  once per scan at the start, never changed mid-scan. Outputs/internal values are written at FB evaluation time (immediate).
- Not proven by this stand: that TwinSAFE samples the process image exactly once at cycle start and writes outputs at cycle
  end (documented TwinSAFE behaviour, no repo source cited here) -> NV for physical output timing; irrelevant to the order warnings.

## Gaps
- No port kind found that the simulator reads same-scan but TwinSAFE reads last-cycle, within the model's supported FBs
  (And/Or/Rs/Ton/Decouple/Estop): all go through the same `values` store and the single sort by orderOfExecution.
- Residual (NV): (1) `readRaw` uses only `sources[0]`; (2) Verify reports order warnings only for the 95 cases; the
  simulator's equivalence for UNWARNED links (producer earlier) is same-scan in both; (3) native semantics of safeEstop
  outputs/Error/EDM ordering and the 1 unparsed Variable warning not individually probed.
