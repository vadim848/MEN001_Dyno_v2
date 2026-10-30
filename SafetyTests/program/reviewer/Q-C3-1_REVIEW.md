# Q-C3-1 review (D-COMPACT, final short review)

Date 2026-10-29. Reviewer. Verdict: **ACCEPT-WITH-NOTES** (bounded: software-model logic and structure only).

## SHA (verified)
- canonical SAL f81b1a5e...4544f4, diagram aaf08b15...5dc9, GVL1.sgvl 8a3d452c...2ff9
- candidate SAL 8712802a...66070, diagram 5c5be224...c646, SGVL 996b75a6...7f4c (match editor SELFCHECK)

## (2) Delta vs plan (own run: program/reviewer/q-c3-1-delta.mjs, src/native-delta-diff.mjs)
- block-added 8 (C3_ARM_SET/CONS/RST/ARM, BMS_*; ooe 347-354), wire-added 19 (all //Network6), gref-added 4, sgvl-usage-added 4 (target side, 4 *_BetReset/*_Bat_Reset* vars), port-attr 6 (FBAnd4.AndIn3, FBAnd6.AndIn3, FBAnd14.AndIn4 Deactivated->Activated NC). ooe changes of existing blocks 0. No removals, no sgvl-decl, no root/non-program/alias change. Matches PLAN sec.3-5 exactly.
- Contacts as planned: ARM_SET.AndIn2 NO, ARM_RST.OrIn1 NO, rest NC. NO on AND inputs has 169 precedents in canonical.
- Diagram: additions only (8 block shapes, 19 wiredLinkConnector, 0 removed lines).
- Editor structure: preflight/typed binding/input rule/FB<=512 PASS, crossNetworkWires 0, 485 canonical wires, 105 symbols; native CRC FAIL stale (calc 1391782965 vs rec 2244300000), validationErrors [] (99 warnings, not compared to canonical by me).

## (1) Logic
- Monotonic argument: ARM is only an extra AND term in the FBRs Set path; FBRs resets unchanged. By induction candidate output <= canonical output on every trace. So CR-3..CR-7 (OFF on Emergency/R&D->Safe/manual off, no ON in Safe/Config) cannot regress; no new ON is possible.
- Liveness: ARM = RS(Set = G AND NOT S, Reset = NOT G OR auto OR auto_2 OR (S AND R)). Set-path blocks (63/66/299) read prev-scan G, S, ARM; ARM(k-1) at the edge scan holds the earlier TRUE (Set term false, reset false) -> fires. PLC swap (S F->T, R T->F same scan): S AND R = 0 -> fires (OK). Gate opens with S held: Set term 0, ARM was reset by NOT G -> never fires (OK). Edge in the same scan as G rise -> no fire (conservative; boundary C3-10b/C3-11 +-50 ms).
- C3-19 (S rises with R active, then R falls): CONS consumes arm -> no ON. Consistent with literal "по переходу FALSE->TRUE".
- Note L1: a one-scan G dip inside R&D/Run would reset ARM; an edge exactly in that scan would be lost (fail-safe, availability only). Analyst states G continuous; not tested at scan level.

## (3) Tests (test/catalog/n-c3bms.test.js, 19 rows)
- Derived from decision/criteria; real program inputs; PLC complementary pairs; oracles from Q-C3-1/Q-ARCH-01 not from code. Canonical RED: 11 fail (C3-02/03/04/07/09/10/13/14/15/17/19), 8 pass (unchanged behaviour) - consistent with the decision.
- Gaps (non-blocking, add if cheap): T1 new edge in StartingRun and during Run->R&D (ON expected per team default); T2 cmd ON in Config (no ON; follows from monotonicity only if canonical never ONs in Config - untested); T3 armed in R&D (cmd OFF) -> R&D->Run -> edge in Run (C3-08 may already be this, verify origin).
- Candidate run and G3 mutations (MQ1-13, equivalence of MQ5/MQ7/MQ9) not yet seen: pending tester.

## (4) Team recommendations
- C3-10 (edge during Safe->R&D -> no ON): consistent with "данной в R&D/Run" (status still Safe, G closed). OK.
- C3-19 optional: consistent with literal edge reading; not a PLC case. OK as optional; do not count its FAIL/PASS as gate.
- ON in StartingRun/Run->R&D: G continuous, consistent with "в R&D/Run" (Run cycle).

## Limits / not claimed
- No native CRC/IDE Verify PASS (Vadim), no hardware safety, no Target/ADS. Acceptance conditional on tester candidate run 19/19 (C3-19 optional) + no regressions in check:software + G3 mutation report.
