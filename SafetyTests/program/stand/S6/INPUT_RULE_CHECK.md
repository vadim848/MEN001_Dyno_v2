# S6 native input-rule check (stand-engineer)

Code: `src/sal-input-rule.js`, wired into `scripts/structure-check.js` (check "native input rule"), so `check:structure`
and `check:software` fail on it. Alias safety map: `fixtures/alias-safety-map.json` (58 SDS, 51 Standard; built by
`scripts/build-alias-safety-map.mjs` from MEN001_Dyno `Alias Devices`, reference 4c3749d2); live `<SAL dir>/Alias Devices` is preferred when present.

## Rule (from safe-input-validation-repair IL traces: VerifyFbAnd, VerifyPortHasOnlySafeIoMappings)
- (a) In-port fed by a Symbol that is an alias-device IO of a Standard device (`StandardAliasDevice` in SDS) = ERROR
  "InPort X of FB can only be connected to safe inputs". Only AND objectIndex 8 (AndIn1) is exempt (native IL); every
  other FB type/port (Or, Decouple, Ton, Rs, Estop, other AND slots) is checked. FB outputs are safe: no propagation.
  Alias Symbols that also have an FB writer (output symbols read back, e.g. out_Step2) are not input sources.
- (b) safeAnd: fewer than 2 ports with channelInterface=Activated and connected = ERROR. Applied to AND only: safeOr with
  1 connected input exists on canonical (FBOr7/9 etc.) and was NOT reported by Verify, so OR is not checked. Unproven for OR (NV).
- Not covered (NV): Estop/Rs/Ton channel rules, VerificationLevel warning-vs-error switch, meta-ports of user FBs.

## Reproduction on canonical E5 (SAL 4c4be64b)
18/18 exactly as in VERIFY_RESULT_1.md (16 safe-only + HB_LO + HEALTHY_OK), 0 extras. First attempt had 4 false extras
(out_Step2 -> FBOr12/13.OrIn1, FBAnd19.AndIn2, PA_CFG.AndIn7) - removed by the "no FB writer" condition above (verify rule is
derived from the oracle for this point: those symbols are alias outputs; confirm with a later Verify).

## Per stage (errors from the check)
| stage | errors |
|---|---|
| F1 fixture stand-f1-04b45456 | 0 |
| E2e | 0 |
| E3 | 1: HEALTHY_OK (min-2) |
| E4 | 18 (same set as E5) |
| E5 | 18 |
Introduced: HEALTHY_OK at E3; the other 17 at E4 (PLC commands v1.4: CMD_*, inPLC_BypassC1C2, in_PLC_Heartbeat).
