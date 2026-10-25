# E4 (S4) — PLC interface v1.4, Config, heartbeat, legacy removal: plan on canonical E3 → `candidates/E4/native`

Role: v2-architect, 2026-10-24 (D-COMPACT, D-AUTO-PROCEED). Exact delta (generated from the model): `PLAN.json`. Questions: `QUESTIONS.md`
(Q-E4-1…5, the plan implements the recommendations). Source (read-only): canonical SAL `9ee66e7868547d7d…` (260 FB), SGVL `72eade07b554a7b4…`.
Notation as E3: `V:` SAL variable (Symbol), `G:` SGVL global, `W:` intra-network wire, `!` = inverted contact. Model: `model/` (in-memory edit of
canonical + catalog stand); model evidence only, not native CRC.

## 1. Interface (v1.4 §7/§8, вопрос 77) — re-use first
PLC → TwinSAFE (all BIT, standard alias devices in `PLC_IO`; existing process-image entries "Standard In Var N" re-used, no new input bit):
| v1.4 signal | SAL variable (new unless noted) | alias / SDSID | today |
|---|---|---|---|
| CMD_SAFE_TO_R&D | `CMD_SAFE_TO_RND` | 94 (was `IN_BIT_RnD_Mode`, rename) | legacy bit 1 |
| CMD_R&D_TO_RUN | `CMD_RND_TO_RUN` | 97 (was `IN_BIT_RnD_Mode_2`, rename) | legacy bit 2 |
| CMD_RUN_TO_R&D | `CMD_RUN_TO_RND` | 63 (`IN_Bypass1`, unused, unlinked) | — |
| CMD_R&D_TO_SAFE | `CMD_RND_TO_SAFE` | 64 (`IN_Bypass2`, unused, unlinked) | — |
| CMD_TRIGGER_EMERGENCY | `in_Estop_PLC` (unchanged, Q-E4-5) | 54, PLC `EstopPLC` | already FBEstop1 ch.3, latching |
| Bypass → Config | `inPLC_BypassC1C2` (unchanged) | 99, PLC `Bypass_C1C2` | 10 s auto-off (removed) |
| Heartbeat (0.5 s toggle) | `in_PLC_Heartbeat` | 48 (`IN_BIT_InitSystem`, unused; only a stale UnrestoredVarLink) | — |
Removed SAL variables: `inPLC_RnD_Mode`, `inPLC_RnD_Mode_2` (their sds 94/97 usages move to the CMD variables; editor may rename the variable).

TwinSAFE → PLC (Q-E4-1 A): `STS_SAFE`, `STS_RND`, `STS_RUN`, `STS_EMG`, `STS_CFG` (one-hot, Emergency = complement), `STS_COVER_LOCKED`
(= linkCoverClosed = NC1∧NC2∧¬False, V14-Q5), `STS_FAULT` (Q-RC-13). Carriers: sds 2 (`Safety_Step`, unused) and sds 14
(`OUT_BIT_MotoCoolingEnable`, unused) + **5 new Out alias devices** (proposed SDSID 100–104). Kept unchanged: outPLC_RnD (вопрос 78:
= b_Step_RnD, TRUE in StartingRun/abort, FALSE in Safe→R&D — model P-12 PASS), out_Step*, out_EStop_Ok_Plc, outPLC_*_Faulty, outPLC_* status.

## 2. Logic (all in SAL; FB 260 → 297)
**Legacy out (вопрос 77, −9 FB):** delete N1/FBAnd10, FBAnd12; N2/FBAnd61, FBAnd81, FBAnd11, FBAnd91; N6/FBAnd15, FBAnd16, FBAnd17.
Deactivate N1/FBAnd2.AndIn2/3 (SS1 in Run = out_Step3 ∧ ¬linkDescActive, identical to code 00), N2/FBOr1.OrIn2, N6/FBOr5.OrIn2. U-08 becomes vacuous (input gone).
**Bypass 10 s timer out (V14-Q17, −1 FB):** delete N1/FBTon1.

**PLC command cluster, Network1, inserted after N1/FBDecouple2 (32 FB):**
- Steady states (V14-Q11/Q-RC-04): `PS_SAFE`=b_Step1∧EOk; `PS_RND`=linkSafeRndScope∧EOk∧¬recRndC_SU∧¬linkAbortActive∧¬recRndC_SG;
  `PS_RUN`=b_Step3∧EOk∧¬linkDescActive; `PS_ANY`=Or. Config and all transitions are not steady.
- Conflict (V14-Q8, Q-RC-04, Q-RC-18a; Bypass counts): `PC_TWO` = ≥2 of {4 CMD, Bypass} (8 FB: PC_O2, PC_A2, PC_A3, PC_O3, PC_A4, PC_O4, PC_A5, PC_TWO).
  `PE_SET`=PC_TWO∧PS_ANY; `PE_ALLF`=all 5 FALSE; `PE_T_CLR` Ton **1 s** (V14-Q10, approved new timer); `PE_ERR` Rs(Reset PE_T_CLR, Set PE_SET).
  PE_ERR is evaluated before the accepts in the same scan → none executed (separate ¬TWO term proved redundant, mutant survived; removed).
- Common gate `PK_OK` = ¬in_Reset_PB ∧ ¬in_Relase_Door_PB ∧ ¬PE_ERR (V14-Q14 any button → edge ignored, not deferred; PLC error → commands ignored).
  CMD_TRIGGER_EMERGENCY is not gated (V14-Q9). Buttons are not gated by PE_ERR (Q-RC-18b).
- Edge: `PK_PREV` safeDecouple (DecIn1..5 = the 5 commands), last block of the cluster; accepts read `!PK_PREV.DecOutN` = value of the previous scan.
- Accepts (one-scan pulses, all latched downstream by existing RS):
  `PA_S2R`=CMD1∧edge∧PS_SAFE∧PK_OK → **V:linkPlcAccS2R** → new `N2/S2R_REQ` Or(linkRndBothQualified, linkPlcAccS2R) → N2/FBAnd4.AndIn1
  (same ReadyForStep2 + linkSafeUpScope guards as BOTH; cover not required, V14-Q7).
  `PA_R2RUN`=CMD2∧edge∧PS_RND∧PK_OK∧linkCoverClosed∧¬in_HV_C2_FBK → **V:linkPlcAccR2Run** → new `RPC/SU_SET` Or(GATE_020, linkPlcAccR2Run) → STATE_SU.Set
  (StartingRun exactly as BOTH: C2 ON, STO released at acceptance, D-STO-LAUNCH).
  `PA_RUN2R_T`=CMD3∧edge∧PK_OK → **V:linkPlcAbortSu** → N6/SU_ABORT_CAUSE.OrIn3 (SU_ABORT_SET adds recRndC_SU: V14-Q12 abort).
  `PA_RUN2R`=PA_RUN2R_T∧PS_RUN → **V:linkPlcAccRun2R** → new `N6/RUN_DOWN_REQ` Or(FBAnd24, linkPlcAccRun2R) → N6/FBAnd23.AndIn1 (RUN_DOWN_OWNER: same
  STOP v2 sequence as green, V14-Q3; repeated command in SS1 ignored like D-05; cover loss in it as Q-RC-03 b1).
  `PA_R2S_ST`=CMD4∧edge∧PS_RND∧PK_OK; `PA_R2S_AB`=CMD4∧edge∧b_Step12∧PK_OK (V14-Q13); `PA_R2S` Or → **V:linkPlcAccR2S** → RPC/GATE_SG_SET.OrIn3
  (STATE_SG, scope-reset as green). PLC DOWN in other transitions ignored (Q-RC-08).
  `PA_CFG`=Bypass∧edge∧PS_SAFE∧PK_OK∧linkSafeUpScope∧linkCoverClosed∧out_ReadyForStep2 → **V:linkCfgAccept** (V14-Q16, Q-RC-05 a/b; BOTH has priority
  because a pressed button blocks the edge, Q-ARCH-08). SafetyFault term is E5.
- `PF_OR` Or(PE_ERR, OrIn2 **Deactivated — reserved for E5 SafetyFault**) → **V:STS_FAULT** (Q-RC-13; E5 only connects OrIn2).
**Config (V14-Q16…Q19, Q-RC-03 b2, Q-RC-05):** main state = new `N3/STATE_CFG` Rs(Set V:linkCfgAccept, Reset `N3/CFG_RST` Or(V:linkCfgDone, G:b_Step4_Set))
→ V:linkCfgActive, inserted after N3/FBRs6. Exclusivity by construction (E2): N3/FBOr1.OrIn1 (Step1 reset) = V:linkCfgAccept and N3/FBOr2.OrIn1 (Step1 set) =
V:linkCfgDone — Step1 and Config switch in the same scan from the same Symbol; N3/FBAnd2.AndIn5 = !STATE_CFG (boot path cannot set Step1 in Config).
Contactors: N1/FBAnd4.AndIn1 := V:linkCfgActive, AndIn5 := !CFG_EX (existing FBAnd5/6 → FBOr17/18 → Lv/HvSetPermit → C1+C2 ON). STO untouched (held),
Unlock impossible (Unlock sets need Step1/Step_RnD), buttons/PLC ignored (no steady state; GATE_001 off), Healthy not consumed.
Exit (N1, after PA_CFG): `CFG_EX_SET`=linkCfgActive∧¬Bypass; `CFG_EX` Rs(Reset !linkCfgActive, Set CFG_EX_SET) → N1/FBOr6.OrIn2 (HV Discharge set);
`CFG_T_HOLD` Ton **1 s** (existing discharge-hold value, as E3 DN_T_HOLD); `CFG_OFF`=CFG_EX∧hold → N1/FBAnd7.AndIn1, FBAnd8.AndIn1 (C1 and C2 OFF together,
allowed by V14-Q18) and N1/FBOr2.OrIn3 (LV Discharge set, Q-E4-3 A); `CFG_DONE`=CFG_OFF∧¬C1∧¬C2∧¬C1_FBK∧¬C2_FBK → V:linkCfgDone → Safe.
Entry resets discharge requests (Q-E4-3 A): N1/FBOr1.OrIn1 (LV) and N1/FBOr5.OrIn1 (HV) := V:linkCfgAccept.
Emergency in Config/exit: N1/FBAndNotRunSu.AndIn4 := !V:linkCfgActive (cover loss → FBAnd1 → FBEstop1 ch.3); connectors via linkSafeConnectorScope
(Step1 off); EStop/Mentee/PLC as everywhere; N6/STAGE_LVON.OrIn3 := V:linkCfgActive → Step4 chain removes energy, STATE_CFG reset by b_Step4_Set.
G-07 rollback (Q-RC-06) is E6: it will add a second Set term to CFG_EX (Or).
**Heartbeat (V14-Q20, Q-E4-4 A), N1 before FBEstop1 (4 FB):** `HB_LO`=!in_PLC_Heartbeat; `HB_T_HI` Ton **3 s**(hb); `HB_T_LO` Ton **3 s**(HB_LO);
`HB_OK`=!HB_T_HI∧!HB_T_LO → FBEstop1.EStopIn7 with pair-4 master "Single-Channel 1 Activated", NC (no change to pairs 1–3). Latching, physical recovery (V14-Q6).
**Status decoder, Network3, last 6 FB of the scan (after FBEstop1 and all stages):** DEC_S Or(b_Step1, b_Step12); DEC_SAFE=DEC_S∧EOk → STS_SAFE;
DEC_RND=b_Step_RnD∧EOk → STS_RND (StartingRun/abort = R&D, TD-14); DEC_RUN=b_Step3∧EOk → STS_RUN; DEC_CFG=STATE_CFG∧EOk → STS_CFG;
DEC_EMG=¬all four → STS_EMG (Q-RC-10). `STS_COVER_LOCKED` = N10/FBDecouple2.DecIn5 := V:linkCoverClosed, DecOut5 → variable (0 FB).

## 3. Budget, order, native rules, timers
- FB 260 → **297** (+47 −10; limit 512). Model ports 2166 → 2264. SAL variables 81 → 99 (+5 inputs, +7 outputs, +8 internal Symbols
  linkPlcAccS2R/R2Run/AbortSu/AccRun2R/AccR2S, linkCfgAccept/Done/Active; −2 legacy). SGVL unchanged (no new globals). Usages: PLAN.json.
- Order: insertion points = `insertAfterCanonical` in PLAN.json (global order): HB_* after N1/EXIT_FBK_OK (before FBEstop1); cluster after N1/FBDecouple2
  (PK_PREV last); CFG_RST, STATE_CFG after N3/FBRs6; S2R_REQ before N2/FBAnd4; SU_SET before STATE_SU; RUN_DOWN_REQ before N6/FBAnd23; DEC_* last.
  Renumber contiguous 1..297. Backward reads (previous scan, intended): accepts ← PK_PREV; N1/FBOr1/2/5/6 ← linkCfgAccept/CFG_EX/CFG_OFF; N3 ← linkCfgAccept/Done.
- Rules: inter-network only via Symbols; one wiredLink per port pair; singleton usage wrappers; new GUIDs; diagram shapes for 47 FB; unused inputs Deactivated;
  internal names must not match the stand patterns (no other "CMD_*TO*", "heartbeat", "STS_*", "SafetyFault" names). Native CRC by the offline tool only.
- Timers: unchanged existing; removed N1/FBTon1 10 s (V14-Q17); new 1 s PE_T_CLR (V14-Q10), 3 s ×2 (V14-Q20), 1 s CFG_T_HOLD (existing hold value).

## 4. Config changes outside SAL/SGVL (V14-Q2 revised; need lead approval — tsproj is COMMON_DENY)
Editor-writable (`MEN001_Dyno/Safety_Dyno/**`) but listed for approval: (C1) rename alias files sds 94 → `IN_CMD_SAFE_TO_RND.sds`, 97 → `IN_CMD_RND_TO_RUN.sds`,
63 → `IN_CMD_RUN_TO_RND.sds`, 64 → `IN_CMD_RND_TO_SAFE.sds`, 48 → `IN_PLC_Heartbeat.sds`, 2 → `OUT_STS_*`, 14 → `OUT_STS_*` (+ Safety_Dyno.splcproj Include
paths); (C2) 5 new Out alias devices (StandardAliasDevice BIT, SDSID 100–104, CRC by native tool/IDE) + splcproj Includes; (C3) SAL aliasDeviceIoUsage for the 12 interface variables.
Blocked for all agents: (C4) MEN001_Dyno.tsproj — StandardInputs PDO gains 5 entries "Standard Out Var 100–104" (padding ARRAY[0..6] shrinks; normally regenerated by
the IDE), Links: rename `Set_RnD_Mode`→Var 94 and `Set_RnD_Mode2`→Var 97 to the new PLC fields, add links Var 63, 64, 48 and Out Var 2, 14, 100–104.
TargetSystemConfig.xml, safe I/O, group parameters: no change. Physical rewiring: **none** (all signals are PLC process data).

## 5. PLC side (only for exchange consistency; separate items, need grants)
(P1) `ST_TwinSAFE_OUT.TcDUT` (no grant today): remove Set_RnD_Mode/Set_RnD_Mode2; add CMD_SAFE_TO_RND, CMD_RND_TO_RUN, CMD_RUN_TO_RND, CMD_RND_TO_SAFE, Heartbeat.
(P2) `ST_TwinSAFE_IN.TcDUT` (granted): add STS_SAFE, STS_RND, STS_RUN, STS_EMG, STS_CFG, STS_COVER_LOCKED, STS_FAULT. (P2b) Q-ARCH-11 (вопрос 63) is **still open on the PLC side**:
ST_TwinSAFE_IN has LV/HV_Healthy + *_Healthy_Invert, MAIN 1 consumer; rename LV_Healthy→LV_Faulty, *_Healthy_Invert→*_Healthy (:= NOT *_Faulty), MAIN/Visualization by
meaning, plus tsproj links Out Var 89/90 (C4, blocked). Not needed for the E4 SAL logic; can ride with C4.
(P3) `MAIN.TcPOU` (granted): heartbeat toggle every 0.5 s (required, else Emergency 3 s after start); act_LogicMap: replace legacy 2-bit writes by setting at most one
CMD_* TRUE per n_SafeSate case (others FALSE), to avoid the V14-Q8 error. No new PLC mechanism beyond this mapping (E4 decisions). (P4) Visualization: no change.

## 6. Model results (`model/e4.all.out.txt`, `model/probe4.out.txt`, `model/mut4.out.txt`; env CATALOG_SYM_TRIGGER_EMG=in_Estop_PLC)
- E4: PASS P-01…P-10, P-12, G-01…G-06 (17). **P-11 FAIL = oracle issue**: Emergency at +2779 ms after the stop moment = last level change + 3000 ms
  (Q-E4-4 A); the test lower bound must be measured from the last heartbeat toggle. G-07 is E6 (FAIL, not implemented).
- E2/E3: all rows PASS except H-02/H-03/H-05/H-06/H-07 → **stand fallback issue**: `catalog-program.js` uses `sfSym = SAFETYFAULT ?? FAULT`, so the new
  STS_FAULT (PLC error only until E5) is read as SafetyFault. With STS_FAULT renamed in a scratch variant the 5 rows PASS (NV as on canonical). Tester: no fallback before E5.
- K-11 Config sub-case now executed (no Unlock in Config): PASS. U-08 vacuous PASS. E5/E6 rows FAIL as on canonical (not implemented). E7 B-01…B-03 PASS. Invariant: 0 violations.
- Probes: Config exit HV-Dis +2, C1/C2 OFF +1003, Safe +1025; EStop in Config → EMG, energy off, Restart → Safe only (Bypass still TRUE, no re-entry);
  heartbeat stop in Config → EMG; PLC abort in StartingRun with another command TRUE → abort executed (Q-E4-2 A); PLC Run→R&D + NC1 loss in SS1 → R&D, no EMG.
- Guard mutants (editor self-check): killed — PA_R2RUN.AndIn2 (edge) P-06, .AndIn5 (cover) P-02, PK_OK.AndIn1 (button) P-09, PK_OK.AndIn3 / PE_ERR.Set P-07,
  FBEstop1.EStopIn7 P-11, FBAndNotRunSu.AndIn4 G-05, PA_CFG.AndIn6/AndIn2 G-02, CFG_OFF.AndIn2 G-04, SU_ABORT_CAUSE.OrIn3 P-04.
  **Catalog gaps (survive):** PA_R2RUN.AndIn3 (steady R&D: command edge during R&D→Safe/StartingRun) and PA_R2S_AB.AndIn3 (Step12 scope: CMD_R&D_TO_SAFE edge in
  StartingRun must be ignored, Q-RC-08). Suggest P-06b/P-05b rows only if Vadim adds them (catalog rule: new row only with a decision).

## 7. Names for the tester / stand
Bind: CMD_SAFE_TO_RND, CMD_RND_TO_RUN, CMD_RUN_TO_RND, CMD_RND_TO_SAFE (patterns match), TRIGGER_EMG → `CATALOG_SYM_TRIGGER_EMG=in_Estop_PLC`,
HEARTBEAT → in_PLC_Heartbeat, Bypass inPLC_BypassC1C2, STS_SAFE/STS_RND/STS_RUN/STS_EMG/STS_CFG (published mode A5), STS_COVER_LOCKED, FAULT → STS_FAULT.
Stand fixes needed (tester): SafetyFault fallback (section 6), P-11 reference point; RAW0 keeps inPLC_RnD_Mode* harmlessly (no such variables).

## 8. Editor scope / out of scope
Write `candidates/E4/**`, `program/editor/E4/**`; config items C1–C3 only after the lead's approval (they live in `MEN001_Dyno/Safety_Dyno/**` of the candidate copy).
Self-check: native preflight + CRC + FB 297; `CATALOG_SAL_DIR=candidates/E4/native CATALOG_STAGES=E2,E3,E4 CATALOG_SYM_TRIGGER_EMG=in_Estop_PLC npm run check:catalog`;
results of section 6 within ±50 ms; mutants of section 6. Out of scope: SafetyFault (E5), watchdogs incl. G-07 (E6), BOOT (E7), tsproj/PLC without grants, download.
