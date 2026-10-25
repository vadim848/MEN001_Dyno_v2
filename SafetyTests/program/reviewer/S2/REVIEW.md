# S2 (E2) end-of-stage review — v2-reviewer, 2026-10-23 (D-COMPACT)

Verdict: **NEEDS CHANGES — tests only.** SAL E2e r2 accepted as is (no code change requested).
Return to: **v2-tester** (2 sub-cases inside existing rows, no new catalog row, no Vadim question), then runner re-run on the same E2e SAL.

## Identity (re-hashed by reviewer)
- E2e SAL 67336d9b42aed3c1…, SGVL 4d68adb3347cdc1a…, diagram 31e516fe1297814a…  (= IMPLEMENTATION r2 / runs/S2-E2e-r2).
- E2d SAL c2f9ccd7a901e40f… (frozen, git clean). F1 canonical SAL 04b45456ae1c64fc… (git clean, untouched).
- `CATALOG_SAL_DIR=candidates/E2e/native npm run check:structure` re-run: PASS (239 FB / 2022 ports / 79 vars / 304 wires; native preflight, binding audit, FB<=512, native CRC+validation). Log: structure.log.

## 1. Diff E2d -> E2e (parsed graph, diff.mjs / diff.out.txt, diff2.out.txt)
- +9 FB exactly as PLAN.md + PLAN_ADD_D04.md: N1/FBK_OFF, N1/EXIT_FBK_OK, N8/FBOrS5, N11/WIN_C1_IN, RPC/SG_S12_SCOPE, RPC/SG_SCOPE, SR/HLT_DESC_SET, SR/HLT_MEM, SR/HLT_LV_SRC. None removed.
- Exactly 6 changed existing ports: FBEstop1.EStopIn5 (Both Deactivated -> Single-Channel 1, wire EXIT_FBK_OK), FBOrS12Reset.OrIn3 (+G b_Step2_Set_2), N8/FBAnd1.AndIn1 (G b_Step5 -> wire FBOrS5), WIN_C1.TonIn (wire FBAnd1 -> WIN_C1_IN), STATE_SG.Reset (V linkSafeRndScope -> wire SG_SCOPE, inverted contact kept), HLT_LV.AndIn1 (V in_LV_Faulty_FBK -> wire HLT_LV_SRC). Contact polarities match the plan.
- No parameter change on any existing block (timers untouched); variables 79 = 79 (names/aliases equal); global execution order of all 230 old blocks preserved; new blocks placed where planned (FBOrS5 71 < N8/FBAnd1 72; EXIT_FBK_OK 32 < FBEstop1 33; WIN_C1_IN 109 < WIN_C1 110, after FBRs1 18; SG_SCOPE 169 < STATE_SG 170). All new wires intra-network; no new Symbols. No unrelated edits found.
- F1 -> E2e (bounded): 0 parameter changes on common blocks; new timers only WIN_C1/WIN_C2 0.5 s (E2a..E2d, вопрос 68); D-ARCH-POL renames keep variable Id and alias (4/4). Full F1 -> E2d logic was not re-reviewed here (earlier E2a..E2d cycles); catalog results are the evidence for it.

## 2. Correctness of each fix (decisions; reviewer model probes probe*.mjs / *.out.txt — model evidence, not hardware)
- L3 (Q-T3-1/Q-ARCH-01): Step5 OR Step5_Set read in the same scan; only makes HVD/C2 earlier, never later. OK.
- E2-02 (Q-RC-16 «А», E2-Q1 race, D-08): HLT_MEM latched only by Faulty ∧ linkRunDownOwner ∧ ¬SI2_CH8, reset by b_Step1. Probe: LV pulse 1/2/50 scans returning before C2_FBK OFF -> R&D then Safe (without memory: stays R&D = the defect). Memory is cleared after Safe and after Emergency->Restart->Safe (clean BOTH reaches R&D). Not stuck: every Emergency exit goes to Safe (Step1). OK.
- Emergency exit with FBK ON (SPEC §12 feedback OFF, EMG6-01, V14-Q6): FBK ON during whole press, FBK going ON while green held and released with FBK ON -> stays Emergency; no deferred exit after FBK OFF; new press -> Safe; spurious C2_FBK in R&D does not create Emergency (EOk term). Staying in Emergency while a FBK stays ON (welded contactor) is exactly SPEC §12; acceptable.
- S4(a) (вопрос 68 «Б», RND-CONF-T): window started by request ∧ out_LV_C1 command. OK, timer unchanged.
- D-04 (V14-Q13; Q-RC-08 not widened): SG scope widened only by linkRndGatePermit ∧ b_Step12; Step12 reset by b_Step2_Set_2. Probe: green 0.45 s in S12 -> no abort; 0.55 s -> C1 OFF at +503, Safe, LV normal later does not resume; 0 two-stage scans. BOTH's own green does not abort (K-01/K-07/U-01 pass).
- New hazards: none found (no energy path added, no protection removed, no two main states in any probe or catalog scenario, all new terms only remove energy or block exit).

## 3. Test adequacy for the E2 gate
- E2 rows: oracles trace to catalog + decisions (checked D-04, D-08, E-04..E-08, H-05, U-01); not implementation-derived. Results 50 pass / 0 fail / 3 todo reproduced by runner; 42 all-stage FAILs are E3..E6 rows only (verified list). 3 todo legit and not counted as PASS: K-11 Config (E4), H-05 SafetyFault (E5), E-08 injected conflict not reachable through real inputs.
- L3 +2 scans and u1+599 not reproduced at ±50 ms: acceptable under D-COMPACT rule 3 ("скан в скан не проверяем"); no new row proposed. Confirmed: reviewer mutants dropping FBOrS5.OrIn2 / WIN_C1_IN.AndIn2 survive E-01 / U-01, K-01 — expected.
- **B1 (finding, return to tester): the E2-02 fix is guarded by no catalog test.** Mutant "HLT_LV_SRC.OrIn2 deactivated" (memory removed) passes D-08 and H-05: D-08 keeps LV lost as a level (x.step(..,2) does not release it), H-07 (E3) blips LV only after arrival. Q-RC-16 explicitly applies to the E2-Q1 race ("Действует для: … гонки E2-Q1"), so D-08 must get the sub-case "LV lost then returned before C2_FBK OFF -> R&D, then R&D->Safe". Existing decision; no new row.
- **B2 (finding, return to tester): the Emergency-exit-with-FBK fix is guarded by no catalog test.** Mutant "FBK_OFF unlinked" passes E-04/E-05/E-06: the E-05 FBK sub-case enters Emergency from R&D, where the Step6->Step1 chain already blocks on C1_FBK; the defect path is Emergency entered from Safe (Step1 latched): mutant -> EOk TRUE, status SAFE with C1_FBK ON. E-05 (SPEC §12 feedback OFF, EMG6-01) needs sub-cases "Emergency from Safe, C1_FBK (and C2_FBK) ON at Restart" and "FBK goes ON while green held, released with FBK ON". Existing decisions; no new row.
- E-08 invariant: sound for "two stages" (ns>1 over all stage RS, evaluated in every scenario incl. forks). Reviewer mutant "drop FBOrS12Reset.OrIn3" fails D-04 by the invariant itself (Step1+Step12, 3527 scans); E-08's own lifecycle simply does not traverse the S12 abort. Editor's observation explained, not a defect.
- N1 (note, tester): under D2-A status (no published STS_*) the "none main state" half of the invariant is vacuous — EMG is the complement, so "EOk TRUE ∧ no main stage" (e.g. mutant above: EOk TRUE, only Step6) is reported as EMG. Acceptable until E2/E4 publishes STS_*; record as a stand limit in RESULTS.
- N2 (note, tester): c.fault() decides NV vs FAIL by the row's stage; SafetyFault parts of E2/E3 rows (H-05, H-02/03/06/07) stay NV forever if the E5 symbol is not resolved by name. At S5 set CATALOG_SAFETYFAULT_SYMBOL and make absence FAIL for all rows.
- M: 11 killed, M-12 not assessable (DOWN-order guard is E3) — legit.

## 4. Team decisions in the package
- S1-Q1 (W-05 abort via PLC edge): test-design choice for an E6 row; does not change Q-V7-03 semantics. No conflict. Not yet recorded in SCENARIO_DECISIONS (lead).
- S1-Q2 analyst (b): discharge requests FALSE after boot = reference 4495a1f + TD-01/Q-V7-01 "held from issue". Correct; no Vadim question needed.
- S1-Q3 (Restart before chain end stays Emergency, press lost): stricter than SPEC §12, adds no energy, consistent with no deferred execution (Q-RC-08 style). No conflict; availability consequence — mention to Vadim in the stage report (REC-ACCEPTED style), record it.
- S1-Q4 (D-04 = E2): Vadim-approved catalog (D-COMPACT, later) places D-04 in E2; PLC part stays E4 (P-05). No conflict; SOFTWARE_ACCEPTANCE_SCOPE PLC-006 stage text should be aligned.
- S1-Q5 (SafetyFault NV until E5): consistent with catalog stage columns (W rows E5); see N2.
- S1-Q6 (88 vs 100): already corrected in the catalog footer.

## Pending before transfer
1. Tester: B1, B2 sub-cases; demonstrate they FAIL on E2d and on the two reviewer mutants, PASS on E2e.
2. Runner: re-run E2 stage + M on E2e r2 (same SHA). If green, no further review pass is needed for these test-only additions (lead check suffices).
Limits: software model only; not native Verify/Build/Target, not hardware safety.
