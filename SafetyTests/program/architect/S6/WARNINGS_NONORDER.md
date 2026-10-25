# S6 Verify attempt 4 - non-order warnings classification

Input: program/lead/S6/VERIFY_RESULT_4.md (rows 59-66), canonical E6w SAL sha256 9e5bfb15fc39fdac... (commit bc498de).
Compared: F1 fixture fixtures/stand-f1-04b45456/TwinSafeGroup1.sal (04b45456ae1c64fc...), reference 4495a1f TwinSafeGroup1.sal (git show).
Method: alias connection = `twinSAFEGroupAliasPort ... sdsId="<SDSID>"` in SAL; SDSID from each .sds. Control: IN_BIT_DoorMonitor (SDSID 16) has 1 port in ref/F1/E6w.

## 1. "Alias Device X is not connected to the application" (6)

| Alias device | SDSID | ref ports | F1 ports | E6w ports | .sds vs ref |
|---|---|---|---|---|---|
| PLC_IO/IN_BIT_SolenoidMonitor | 15 | 0 | 0 | 0 | identical (CRLF only) |
| PLC_IO/in_False | 59 | 0 | 0 | 0 | identical (CRLF only) |
| PLC_IO/SimuTest/in_DisCharge_Cmd | 79 | 0 | 0 | 0 | identical (CRLF only) |
| PLC_IO/SimuTest/in_HV_Inhibit_Cmd | 80 | 0 | 0 | 0 | identical (CRLF only) |
| PLC_IO/SimuTest/in_LV_Inhibit_Cmd | 81 | 0 | 0 | 0 | identical (CRLF only) |
| Safety_Step | 2 | 0 | 0 | 0 | identical (CRLF only) |

Classification: PRE-EXISTING in reference 4495a1f and F1. Not introduced by E2-E6w (no E4 legacy removal / freed alias involved).
Note: SAL variable `in_False_SI2_CH8` is a safe-input (SI2 CH8) variable, not the in_False alias device.
Action: NONE. Alias device config is out of scope (AGENTS.md); these are not part of the V14-Q2 PLC exchange, so deletion is not proposed. Informational warning, accept as baseline.

## 2. "'Safe Inputs After Disc Error' of WINDOW / FBEstop1 is always true in this selected target system logic" (2)

- `safeInputsAfterDiscError` is an attribute (configuration parameter) of the safeEstop FB instance, not logic/wiring.
- Values: ref FBEstop1 = "false" (WINDOW absent in ref); F1 FBEstop1 = "false", WINDOW (safeEstop) = "false"; E6w FBEstop1 = "false", WINDOW = "false". Unchanged F1 -> E6w (only orderOfExecution differs: 24->43, 128->175).
- Meaning: the selected target logic treats the parameter as always true regardless of the configured "false" -> informational.
- Origin: FBEstop1 pre-existing in ref; WINDOW pre-existing in F1 (added before F1, not in ref). Not introduced by E2-E6w.
- Action: NONE. Do not change the FB parameter (FB/target config, outside slice scope); if a decision on the effective value is wanted it is a Vadim/engineer question, not an editor change.

## Summary
All 8 non-order warnings are pre-existing baseline (6 since reference, FBEstop1 since reference, WINDOW since F1); none require action in S6.
