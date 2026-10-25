# E2-S2 addendum — D-04 (V14-Q13): green 0.5 s aborts Safe→R&D

Applies on top of PLAN.md (E2e = E2d v7.7 + 4 fixes). PLAN.md is not changed. Test: `test/catalog/lib/d.js` D-04.
Scope: button path only. The PLC CMD_R&D_TO_SAFE part stays in E4.

## Root cause (verified on the parsed E2d graph)
- The R&D→Safe action is `RndPhysicalCompact/STATE_SG` (`recRndC_SG`), which drives `Network12/FBOr2`, then
  `FBDecouple1` (C1 reset, LV discharge, C3/RBM reset), then `N12/FBAnd15` = `b_Step2_Set_2`, then Step1 Set.
- `STATE_SG.Reset` is the inverted `linkSafeRndScope` (= `SafeResumption/RND_SCOPE` = `linkRndGatePermit` ∧ `b_Step_RnD`).
  In S12 (Safe→R&D, `b_Step12`) the scope is FALSE, so the reset dominates and SG cannot latch. The qualified green
  (`linkRndGreenQualified`↑ at press+500, and SG_OWNER_SET = green ∧ ¬b_Step1 is TRUE) is lost. Model on v7.7/E2e:
  C1 stays ON, and R&D is reached when LV becomes normal (resume = FAIL).
- Second gap: `Network3/FBRs8` (Step12) is reset only by `FBOrS12Reset` = `b_Step_RnD_Set` ∨ `b_Step4_Set`.
  With SG fixed alone, `b_Step2_Set_2` sets Step1 while Step12 is still held → S1+S12 (two stages, E2 violation;
  reproduced).

## Change (+2 FB, 237 → 239)
1. NEW `RndPhysicalCompact/SG_S12_SCOPE` safeAnd: AndIn1 = SAL var `linkRndGatePermit` (direct), AndIn2 = SGVL `b_Step12` (direct).
2. NEW `RndPhysicalCompact/SG_SCOPE` safeOr: OrIn1 = SAL var `linkSafeRndScope` (direct), OrIn2 = wire `SG_S12_SCOPE.AndOut`.
3. `STATE_SG.Reset`: replace the usage of `linkSafeRndScope` with wire `SG_SCOPE.OrOut`. Keep the inverted contact
   (Make Contact (NO)). `STATE_SU` and `GATE_020` keep `linkSafeRndScope` (R&D→Run is not widened).
4. `Network3/FBOrS12Reset.OrIn3`: from Deactivated to Activated, direct, SGVL `b_Step2_Set_2` (existing global with
   +1 consumer). Step12 ends in the same scan as the Step1 Set. A conflict with `b_Step_RnD_Set` is impossible:
   `b_Step2_Set_2` needs C1 and C1_FBK OFF, while confirmation needs C1_FBK ON.
- Order: 1 and 2 immediately before STATE_SG (order 162; RND_SCOPE 115 and head b_Step12 are earlier).
- Wires: +2, intra-network. No new Symbols or SAL vars; no timers changed; no hardware/group/target change.

## Interactions (model)
- **D-04:** C1 OFF at press+502, C1_FBK OFF +503, Safe +504, Step12 cleared in the same scan. LV normal later does not resume. With C1_FBK lagging 300 ms and LV becoming normal at +520: Safe at +804, no R&D. This needs the PLAN.md S4(a) fix (WIN_C1_IN gated by `out_LV_C1`); do not apply D-04 on E2d.
- **Q-RC-08:** only S12 is added to the SG scope. Run, StartingRun and Run→R&D (b_Step3) keep their existing DOWN handling (D-03/D-05 are E3, unchanged).
- **D-LATE-SECOND:** green, then blue at +300 → no down, no fault; the transition continues.
- **Q-500:** blue at exactly +500 → the single down wins (abort).
- **p.9 release pause:** green 1.5 s after the BOTH release is ignored (existing filter, unchanged); at 2.1 s and 2.5 s it aborts.
- **Blue in S12:** no down.
- **Emergency in S12:** unchanged (permit FALSE → SG scope FALSE).
- **Full cycle:** Safe→R&D→Run→R&D→HLT→Safe→R&D→Safe→Emergency/Restart: 0 differing scans versus PLAN.md E2e.
- **Two stages:** 0 scans with two stages in all probes.

## Must PASS / guards
- Must PASS: D-04, D-06, K-04, K-05, K-06, K-08, U-06, U-07, E-08 (invariant).
- Catalog M is unchanged. Self-check mutants for the editor:
  - drop item 4 → S1+S12 (E-08);
  - drop item 3 → D-04 resumes into R&D.
