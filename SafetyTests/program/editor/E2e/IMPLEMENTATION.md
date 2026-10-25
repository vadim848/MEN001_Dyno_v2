# E2e implementation (PLAN E2-S2, PLAN.md acdb9819, PLAN.json 966827ee) - editor self-check, not tester PASS

Source: candidates/E2d/native (frozen) SAL c2f9ccd7, SGVL d845bd26, diagram 8797b832 (copy in source/). Build: tools/make-e2e.mjs (textual staging) + tools/native-save.ps1 (native writers, CRC regenerated, never hand-edited).

## Output (candidates/E2e/native)
- SAL     325e3c4c2656ee4b6bd6b4206fb6104b8f0f06c258cda131b367e59b9b478e6e (Crc=3689031944)
- SGVL    0083ec7653f70f2d0bd2915698a8b6047738d3769bbb70d2ddb5a2a76ef4c52f
- diagram abfad8f8376464cd234a7784fe3eec52a068b100036f97b60f5616e3dd2a709f

## Changes (all wires intra-network; new blocks appended in their network, order renumbered contiguously)
- L3 Network8: +FBOrS5 safeOr (OrIn1=b_Step5, OrIn2=b_Step5_Set, SGVL, NC); wire FBOrS5.OrOut -> FBAnd1.AndIn1 (SGVL b_Step5 ref removed from FBAnd1.AndIn1). Order just before N8/FBAnd1.
- E2-02 SafeResumption: +HLT_DESC_SET safeAnd (AndIn1 in_LV_Faulty_FBK NC, AndIn2 linkRunDownOwner NC, AndIn3 in_False_SI2_CH8 NO; SAL vars), +HLT_MEM safeRs (Set=wire HLT_DESC_SET.AndOut, Reset=SGVL b_Step1), +HLT_LV_SRC safeOr (OrIn1 in_LV_Faulty_FBK, OrIn2=wire HLT_MEM.RsOut); HLT_LV.AndIn1 now wire HLT_LV_SRC.OrOut (var usage of in_LV_Faulty_FBK moved). Order: DESC_SET, MEM, LV_SRC, HLT_LV.
- Emergency exit Network1: +FBK_OFF safeAnd (in_LV_C1_FBK NO, in_HV_C2_FBK NO), +EXIT_FBK_OK safeOr (OrIn1 SGVL b_EStop_Ok, OrIn2 wire FBK_OFF.AndOut); wire EXIT_FBK_OK.OrOut -> FBEstop1.EStopIn5 (channelInterface "Single-Channel 1 Activated", deactivate1 NC). Order just before FBEstop1.
- S4(a) Network11: +WIN_C1_IN safeAnd (AndIn1=wire N11/FBAnd1.AndOut, AndIn2 SAL var out_LV_C1); removed wire FBAnd1 -> WIN_C1.TonIn, added WIN_C1_IN.AndOut -> WIN_C1.TonIn. Order after FBAnd1, before WIN_C1.

## Inventory (E2d -> E2e)
FB 230->237 (limit 512), ports 1947->2004, wires 295->302 (+8 -1), SAL variables 79, SGVL symbols 63 (same Ids), 0 inter-network wires, no new Symbols/variables. SGVL target usages: +b_Step5_Set, +b_Step1, +b_EStop_Ok, b_Step5 moved from N8/FBAnd1.AndIn1 to FBOrS5.OrIn1. SAL var target usages +7 / -1 as planned.

## Self-checks
- Native save: Load failed=False; fresh reload (NATIVE_FRESH_RELOAD.log) nativeCrcValid=True, SGVL FileCrcMismatch=False, 237/2004/79/63.
- `CATALOG_SAL_DIR=candidates/E2e/native npm run check:structure`: PASS (preflight, typed binding audit, FB<=512, native CRC+validation); STRUCTURE_CHECK.log.
- Not run: check:software / e2-delta / model probes (tester scope; canonical untouched).

## Notes
- Tool-only edit: native-save.ps1 label self-check entry HLT_LV/AndIn1 (expected label in_LV_Faulty_FBK) removed, since that port is now wired (no variable label by design).
- E2d and canonical untouched. No deviations from plan. No git commit or remote publish.

## r1 -> r2 (PLAN_ADD_D04.md ea6b43e9, +2 FB, 237 -> 239)
r1 (PLAN.md fixes only), saved in r1/: SAL 325e3c4c2656ee4b6bd6b4206fb6104b8f0f06c258cda131b367e59b9b478e6e, SGVL 0083ec7653f70f2d0bd2915698a8b6047738d3769bbb70d2ddb5a2a76ef4c52f, diagram abfad8f8376464cd234a7784fe3eec52a068b100036f97b60f5616e3dd2a709f. Reproduce: `node tools/make-e2e.mjs source staged` + native-save.ps1.
r2 build: `node tools/make-e2e-r2.mjs r1 staged-r2` + tools/native-save-r2.ps1 (EXP 239/2022) -> candidates/E2e/native.
- NEW RndPhysicalCompact/SG_S12_SCOPE safeAnd (linkRndGatePermit var NC, SGVL b_Step12 NC); NEW SG_SCOPE safeOr (linkSafeRndScope var NC, wire SG_S12_SCOPE.AndOut); STATE_SG.Reset := wire SG_SCOPE.OrOut (Make Contact NO kept); Network3/FBOrS12Reset.OrIn3 := SGVL b_Step2_Set_2 (Activated, NC). Order: both before STATE_SG.
- r2 SAL 67336d9b42aed3c14925dfbfec3e4e7533c4bf96b0d0183a13cea31ea785dd39 (Crc 2839727504), SGVL 4d68adb3347cdc1adbd464aa3f5f2b755f9fda498e6d788b7bdf0e7f04247c01, diagram 31e516fe1297814a3e6a7f5b35fd43c6799494a067042ccdb015899d93f42bbc.
- FB 239, ports 2022, wires 304, vars 79, symbols 63; fresh reload nativeCrcValid=True, SGVL CRC ok; check:structure PASS (STRUCTURE_CHECK_r2.log).
- check:catalog (CATALOG_STAGES=E2): PASS tests 101 pass 50 fail 0 skipped 48 todo 3 (CATALOG_E2_r2.log).
- Self-check mutants (scratch only): drop item 4 -> catalog FAIL 1 (D-04); drop item 3 -> catalog FAIL 1 (D-04). E-08 did not flag mutant "drop item 4" in this catalog run.
Note: STAGING.json now describes r2 staging.
