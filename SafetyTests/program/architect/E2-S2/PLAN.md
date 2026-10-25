# E2-S2 — fix plan for 4 defects of E2d v7.7 → candidate E2e

Role: v2-architect, 2026-10-23 (D-COMPACT, D-RESUME-S1S2). Machine-readable delta: `PLAN.json` (same folder).

Source (frozen, read-only): `candidates/E2d/native` — SAL `c2f9ccd7a901e40f…`, SGVL `d845bd26331cfb16…`,
diagram `8797b832fee722dc…`; 230 FB. F1 canonical SAL `04b45456…`. Editor copies to `candidates/E2e/native`
and edits only there. All names below verified on the parsed candidate graph (full `//Network/Block/Port`
paths, SAL variables vs SGVL globals), not by basename. Model probes: scratch harness over
`program/architect/E2-status/repro/cand.mjs` (stand runtime), model evidence only.

## Defect 1 — L3: HVD/C2 OFF in Emergency from Run +2 scans (7010 / 8011; ref 7008 / 8009)
- Cause: E2a-core moved `Network3/FBRs5` (Step5 latch) to the ring head (order 14). Its Set `$b_Step5_Set`
  is produced later by `Network7/FBAnd8` (order 69), so `$b_Step5` appears one scan late; `Network8/FBAnd1.AndIn1`
  (order 70) reads `$b_Step5`. F1 order was N7/FBAnd8 72 → N3/FBRs5 74 → N8/FBAnd1 75 (same scan).
  The remaining common +1 (STO 7007 etc.) is inside the window and is not touched.
- Fix (Network8, +1 FB): NEW `Network8/FBOrS5` safeOr, OrIn1 = SGVL `b_Step5`, OrIn2 = SGVL `b_Step5_Set`
  (both direct). `N8/FBAnd1.AndIn1`: drop global ref `b_Step5`, wire `FBOrS5.OrOut → FBAnd1.AndIn1` (intra-network).
  Order: immediately before N8/FBAnd1. Ring head unchanged (E2 single-owner construction kept).
- Model: HVD 7009, C2 OFF 8010, STO 7007, C1 2005, LVD/SS1 4 — all in [ref, ref+1]. Only earlier, never later.
- Must PASS: E-01, M(EStop→E-01); later E-07 (E3). F1 risk: none — restores F1 HVD/C2 timing.

## Defect 2 — E2-02: LV Healthy recovers during descent (h+1/h+3) → stays in R&D
- Cause: `SafeResumption/HLT_LV` = `in_LV_Faulty_FBK` ∧ ¬`recRndC_SU` ∧ ¬`in_False_SI2_CH8` ∧ `b_Step_RnD` is
  level-only and only in R&D. No memory of a loss during the Run→R&D run-down (Q-RC-16 «А», G3Q-3).
  Model on v7.7: even Faulty TRUE for 100 scans during the wait for C2_FBK OFF ends in steady R&D.
- Fix (SafeResumption, +3 FB), all before `HLT_LV`, in this order:
  - NEW `HLT_DESC_SET` safeAnd: AndIn1 = SAL var `in_LV_Faulty_FBK` (direct), AndIn2 = SAL var `linkRunDownOwner`
    (direct; source `Network6/RUN_DOWN_OWNER`), AndIn3 = `in_False_SI2_CH8` inverted (copy HLT_LV.AndIn3 pattern).
  - NEW `HLT_MEM` safeRs: Set = wire HLT_DESC_SET.AndOut, Reset = SGVL `b_Step1` (direct). Cleared only in Safe.
  - NEW `HLT_LV_SRC` safeOr: OrIn1 = `in_LV_Faulty_FBK`, OrIn2 = wire HLT_MEM.RsOut.
  - `HLT_LV.AndIn1`: remove target usage of `in_LV_Faulty_FBK`, wire `HLT_LV_SRC.OrOut → HLT_LV.AndIn1`.
- Downstream unchanged: `linkHltLvLost` → RndPhysicalCompact/GATE_030 (R&D→Safe) and GATE_SG_SET.
- Model (pulse r = 1/3/100, C2_FBK OFF d = 1..5): R&D@705, then C1 OFF 707, Safe@709; never two stages,
  no Emergency, no C1 OFF before R&D. No loss → R&D kept. After Safe and after Emergency+Restart → Safe,
  a clean BOTH stays in R&D (memory reset works). Sweep of a 1-scan pulse at every scan 597..810
  (descent → arrival@705 → steady R&D): all end in Safe, no gap at the arrival boundary.
- SafetyFault HealthyLost: no symbol exists in E2 (W/E5–E6) → NV, not claimed (A8).
- Must PASS: D-08, H-07 (memory part), H-05, H-01. F1 risk: only adds R&D→Safe after a run-down that saw
  LV loss; scope limited by `linkRunDownOwner` (SU abort/steady-Run loss stay E3: D-09, H-03).

## Defect 3 — exit from Emergency while C1_FBK / C2_FBK ON (+100)
- Cause: `Network1/FBEstop1.Restart` = `in_Reset_PB` directly; FBK checks exist only on the Step1-set paths
  (`Network3/G10_EXIT`, `Network3/FBAndBootFbkOff`). From Safe (Step1 already latched) `b_EStop_Ok` returns on
  the release edge regardless of FBK (model: EOk with FBK ON for 1200 scans).
- Rejected: STOP_v7.8 candidate `RESTART_OK` (Reset ∧ ¬FBK → Restart). safeEstop restarts on the falling edge,
  so FBK going ON while the button is held creates that edge → exit in a scan with FBK ON (reproduced).
- Fix (Network1, +2 FB), both immediately before FBEstop1 (order 32), so FBK is current-scan:
  - NEW `FBK_OFF` safeAnd: AndIn1 = SAL var `in_LV_C1_FBK` inverted, AndIn2 = SAL var `in_HV_C2_FBK` inverted.
  - NEW `EXIT_FBK_OK` safeOr: OrIn1 = SGVL `b_EStop_Ok` (previous scan), OrIn2 = wire FBK_OFF.AndOut.
  - wire `EXIT_FBK_OK.OrOut → FBEstop1.EStopIn5`. EStopIn5 (objectIndex 12): `channelInterface`
    "Both Deactivated" → "Single-Channel 1 Activated", `deactivate1="Break Contact (NC)"` — exact attribute
    pattern of `RndPhysicalCompact/WINDOW.EStopIn1`. EStopIn6..8, Delay 100 ms, Restart binding unchanged.
- Meaning: while EOk TRUE the term is TRUE (no new Emergency cause in Run/R&D). While in Emergency, FBEstop1
  is "not safe" and cannot arm as long as any FBK is ON.
- Model: FBK ON whole press → Emergency; released before FBK OFF → Emergency kept (no deferred exit);
  held through FBK OFF → exit on release (g+1000 > f), same as base; FBK re-ON while held → Emergency;
  C2 variant same; control (FBK OFF) exit at g+300 as base; R&D-chain Emergency + Restart unchanged.
- Must PASS: E-04, E-05, E-06, M(Restart only in Safe → E-04); EMG-006/MOD-008. F1 risk: none outside
  "Emergency ∧ FBK ON".

## Defect 4 — S4(a): R&D / outPLC_RnD at u1+599 (legacy) / u1+600 (BOTH)
- Cause: `Network11/WIN_C1.TonIn` is wired from `Network11/FBAnd1` (b_Step12 = request), not from the C1
  command; command lags the request by 1 (BOTH) or 2 (legacy) scans. Decision 68 «Б» counts from command C1 ON.
- Fix (Network11, +1 FB): NEW `WIN_C1_IN` safeAnd: AndIn1 = wire N11/FBAnd1.AndOut, AndIn2 = SAL var
  `out_LV_C1` (direct; written by N1/FBRs1 earlier in the scan). Remove wire FBAnd1 → WIN_C1.TonIn, add wire
  WIN_C1_IN.AndOut → WIN_C1.TonIn. Order: after N11/FBAnd1, immediately before WIN_C1. Timer unchanged.
- Model: R&D and outPLC_RnD at u1+601 on both paths; late C1_FBK unchanged; full cycle differs only by
  R&D arrival +1 scan on each Safe→R&D.
- Must PASS: U-01, K-01, U-07; outPLC_RnD per вопрос 78 (FALSE until R&D). F1 risk: none (window is E2-new).

## S4(b) — outPLC_RnD FALSE at A+602 on LV loss in StartingRun: not a defect of this slice
- Candidate makes no abort (Q-ARCH-03 abort = E3, catalog D-09); it confirms Run at A+602 (HV-only Run
  confirmation), so outPLC_RnD FALSE matches the actual stage Run. вопрос 78 requires TRUE during StartingRun
  and its abort; there is no abort here. Closes with E3 (STP-I). Evidence: `E2-status/repro/c11.out.txt`.

## Budget and structure (230 → 237 FB, limit 512)
- +7 FB: FBOrS5, HLT_DESC_SET, HLT_MEM, HLT_LV_SRC, FBK_OFF, EXIT_FBK_OK, WIN_C1_IN. No block removed.
- Wires (all intra-network): +8 (FBOrS5→N8/FBAnd1; HLT_DESC_SET→HLT_MEM→HLT_LV_SRC→HLT_LV; FBK_OFF→EXIT_FBK_OK→
  FBEstop1.EStopIn5; N11/FBAnd1→WIN_C1_IN→WIN_C1), −1 (N11/FBAnd1→WIN_C1.TonIn).
- Usages: SGVL globals +1 consumer `b_Step5_Set`, +1 `b_Step1`, +1 `b_EStop_Ok`; `b_Step5` moved (N8/FBAnd1 →
  FBOrS5). SAL vars: +1 target `out_LV_C1`, `linkRunDownOwner`, `in_LV_C1_FBK`, `in_HV_C2_FBK`;
  `in_LV_Faulty_FBK` moved+1. No new Symbols, no new SAL variables, no alias/mapping/group/target change.
- Rules: no inter-network graphical wiredLink; one wiredLink per port pair; singleton usage wrappers; new
  GUIDs; diagram shapes for 7 FBs; orderOfExecution renumbered contiguously; native CRC via offline tool only.
- Timers: none changed (WIN_C1, FBEstop1 100 ms, N8 Ton1/Ton2 unchanged).

## Editor scope and checks
- Write: `candidates/E2e/**`, `program/editor/E2e/**` only. Do not touch E2d, canonical, PLC, tsproj.
- Self-check before handoff: native preflight + CRC + FB 237; the model points above; full-cycle diff E2d→E2e
  = only R&D arrival +1 scan per Safe→R&D.
- Mutation check (catalog M only, no new plan): E-01, E-04 killers must still kill on E2e.
