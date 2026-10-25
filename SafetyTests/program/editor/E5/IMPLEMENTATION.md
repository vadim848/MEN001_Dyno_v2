# E5/E6 implementation (editor self-check, not tester PASS)

Plan: architect/E5 PLAN.md 0b597289, PLAN.json 59ff05a3 (hash-checked in tools/make-e5.mjs) + Q-E5-1 "A" (team decision).
Base: canonical E4 SAL 4ee8d3d9, SGVL 98a0d10f, diagram 98faaead (verified in source/). Build: `node tools/make-e5.mjs source staged` + `tools/native-save-e5.ps1` (native writers, CRC regenerated, never edited) -> native/ and candidates/E5/native.

## Output (candidates/E5/native)
- SAL     4c4be64b7e52862e14d1d8037ca496486cb69299596cb63c6d0b0f0ee9ce7cde
- SGVL    27864ca301abf9c651527c66ff15194ef802a9016e344f02ec3e6b1681995db1
- diagram 7ad25ee83e15fd7a3b9eef4e55cb8db56eb06922c0382e28d722902f899eafb4

## Inventory (E4 -> E5)
networks 14; FB 297 -> 337 (+40: 39 plan + BA_SET_G; limit 512); SAL variables 99 -> 105 (6 new link* Symbols); SGVL symbols 63 (same; +8 FbPortUsage target usages for G: inputs, as in E3/E4); native ports 2467 -> 2725; orders contiguous 1..337; 0 inter-network wires; wires +58 / -3 (STATE_SU.Set, CFG_EX.Set, STATE_BA.Set re-sourced).
Timers: new 0.5 s x4 (WDC1/2_WIN, WDC1/2_OFF), 30 s x2 (WDH1/2_T); existing unchanged.

## Q-E5-1 A (beyond PLAN.json, +1 FB)
New RPC/BA_SET_G And(BLUE/TonOut, !linkUpBlock) -> STATE_BA.Set (after BLUE in order). linkUpBlock = SF or ack-consumed attempt.

## Self-checks
- Native fresh reload (NATIVE_FRESH_RELOAD.log): nativeCrcValid=True, SGVL FileCrcMismatch=False, 14/105/337/2725/63; 28 label checks.
- `CATALOG_SAL_DIR=candidates/E5/native npm run check:structure`: PASS (STRUCTURE_CHECK.log).
- Catalog (CATALOG_E5.log, TRIGGER_EMG=in_Estop_PLC, SAFETYFAULT=linkSafetyFault): tests 119, pass 116, fail 1, todo 2. Fail: E-10 (R&D->Safe, C1_FBK stuck ON, expects Emergency at C1 OFF+500). The architect model (e5.mjs, without BA_SET_G) fails the same current E-10 test (run5.mjs e5 E-10), so it is a test/stand change by the tester, not a native deviation. W-03/W-04/G-07 pass now.
- Not run: check:software, mutants.
## Deviations
None from the plan except the planned Q-E5-1 A block. Canonical untouched, no commit.
