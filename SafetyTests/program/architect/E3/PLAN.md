# E3 (S3) — STOP v2 plan on canonical E2 → candidate `candidates/E3/native`

Role: v2-architect, 2026-10-23 (D-COMPACT, D-AUTO-PROCEED). Machine-readable delta: `PLAN.json`. Questions: `QUESTIONS.md`.
Source (read-only): canonical `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal` `67336d9b42aed3c1…` (239 FB),
`GVLs/GVL1.sgvl` `4d68adb3347cdc1a…`. All names below were checked on the parsed canonical graph (full `//Network/Block/Port`
paths; `V:` = SAL variable, `G:` = SGVL global, `W:` = intra-network wire, `!` = inverted contact "Make Contact (NO)").
Model: `model/` (stand runtime + catalog libraries, in-memory edit of canonical). This is model evidence only, not native CRC.

## 1. Root causes in canonical E2 (verified)
- Run→R&D: `N6/RUN_DOWN_OWNER → FBOr5 → FBDecouple2` sends STO reset, HV Discharge set and C2 reset in one scan (STO a+6, DIS a+5, C2 a+6).
  The SS1 output `out_SS1_DRx` = `out_Step3 ∧ ¬legacy` stays TRUE (no SS1) until R&D arrival.
- Healthy loss in Run: `N6/HEALTHY_OK` (¬LVF ∧ ¬HVF ∧ cover) → `FBAnd9` → `FBOrStep4` → Step4 = Emergency chain (H-02/H-03 EMG).
- StartingRun (`recRndC_SU`): the release filter is blocked (`GATE_008.AndIn4`, `GATE_014.AndIn4` = ¬SU), so a new green never
  qualifies; no abort path exists; LV loss gives Emergency/Run instead of abort (D-09).

## 2. Design: one descent sequencer in Network6 (+20 FB) and an SU reset term in RndPhysicalCompact (+1 FB)
Run descent (normal or protective):
- `RD_HLOSS` Or(V:in_LV_Faulty_FBK, V:in_HV_Faulty_FBK).
- `RD_PROT_SET` And(W:N6/FBAnd1.AndOut [b_Step3], W:RD_HLOSS, !W:RD_STO.RsOut) — Healthy loss in Run or in SS1 (before STO).
- `RD_RESET` Or(W:N6/FBAnd18.AndOut [b_Step12_Set_2], G:b_Step1) — common reset: arrival in R&D, or Safe after Restart.
- `RD_PROT` Rs(Reset W:RD_RESET, Set W:RD_PROT_SET) — protective descent memory.
- `RD_SEQ` Rs(Reset W:RD_RESET, Set W:N6/FBOr5.OrOut). `FBOr5.OrIn3` := W:RD_PROT (new). FBOr5 now feeds only RD_SEQ.
- `RD_T_SS1` Ton **2 s** (TonIn W:RD_SEQ). `RD_STO_TRIG` Or(W:RD_T_SS1, W:RD_PROT). `RD_STO` Rs(Reset W:RD_RESET, Set W:RD_STO_TRIG).
- `RD_T_COAST` Ton **5 s** (TonIn W:RD_STO). `RD_DIS` And(W:RD_SEQ, W:RD_T_COAST) — the M-12 guard (AndIn2).
StartingRun abort:
- `SU_ABORT_CAUSE` Or(V:linkRndGreenQualified, V:in_LV_Faulty_FBK). `SU_ABORT_SET` And(G:recRndC_SU, W:SU_ABORT_CAUSE).
- `SU_ABORT_END` And(W:DN_T_HOLD.TonOut, !V:out_HV_C2, !V:in_HV_C2_FBK) (= TD-14 R_end). `SU_ABORT_RESET` Or(W:SU_ABORT_END, G:b_Step1).
- `SU_ABORT` Rs(Reset W:SU_ABORT_RESET, Set W:SU_ABORT_SET) → **new Symbol `linkAbortActive`** (SAL variable, pattern of linkRunDownOwner).
Common actuator phase:
- `DN_STO` Or(W:RD_STO, W:SU_ABORT) → `N6/FBDecouple2.DecIn1`, `.DecIn2` (b_Reset_STO_DR2_4 / DR1_4).
- `DN_DIS` Or(W:RD_DIS, W:SU_ABORT) → `FBDecouple2.DecIn3` (b_Set_HV_Discharge_Request_3); `DN_T_HOLD` Ton **1 s** (TonIn W:DN_DIS).
- `DN_C2` And(W:DN_DIS, W:DN_T_HOLD) → `FBDecouple2.DecIn4` (b_Reset_HV_C2_4) — M-12 guard (AndIn2). Existing `FBTon1` 0.2 s → `FBAnd18`
  (¬C2_FBK ∧ Step3) → b_Step12_Set_2 → R&D unchanged.
- `DN_ACTIVE` Or(W:RD_SEQ, W:SU_ABORT) → **new Symbol `linkDescActive`**.
- Removed: 4 wires `FBOr5.OrOut → FBDecouple2.DecIn1..4`.
- `RndPhysicalCompact/SU_RESET` Or(!V:linkSafeRndScope, V:linkAbortActive) → `STATE_SU.Reset` (direct; replaces the inverted
  linkSafeRndScope usage on STATE_SU.Reset). SU ends in the abort scan and cannot re-latch during the abort (not resumed).

## 3. Changes to existing ports
| Port | Before | After | Reason |
|---|---|---|---|
| N6/FBOr5.OrIn3 | Deactivated | W:RD_PROT | protective descent uses the same sequencer |
| N6/RUN_DOWN_RESET.OrIn4 | Deactivated | W:RD_PROT | normal descent becomes protective: cover loss → Emergency (Q-RC-17(3) with Q-RC-15); green ignored |
| N6/HEALTHY_OK.AndIn1/AndIn2 | !in_LV/HV_Faulty_FBK | Deactivated | Healthy loss in Run no longer Step4 (Q-RC-02); AndIn3 cover kept (M-04 locator) |
| N6/FBDecouple2.DecIn1..4 | W:FBOr5 | W:DN_STO ×2, W:DN_DIS, W:DN_C2 | timed order |
| N1/FBAnd2.AndIn4 | Deactivated | !V:linkDescActive | SS1 requested (out_SS1 FALSE) from descent start (E2-Q1 "SS1 2 s") |
| N1/FBAndNotRunSu.AndIn3 | Deactivated | !V:linkAbortActive | cover loss in abort → Emergency (Q-RC-17(1)) |
| RPC/GATE_008.AndIn4, GATE_014.AndIn4 | !SNAP_0.DecOut7 (SU) | Deactivated | release filter runs in SU → new green after clearance (D-STARTINGRUN-GREEN-DOWN); SNAP_0.DecOut7 left unconnected |
| RPC/STATE_SU.Reset | !V:linkSafeRndScope | W:SU_RESET | abort ends SU |
| SafeResumption/SG_OWNER_SET.AndIn3 | Deactivated | !V:linkAbortActive | green-abort is not R&D→Safe (Q-RC-08) |
| SafeResumption/HLT_LV.AndIn5 | Deactivated | !V:linkAbortActive | chained R&D→Safe only after abort end (Q-ARCH-03) |
| SafeResumption/HLT_DESC_SET.AndIn2 | V:linkRunDownOwner | V:linkDescActive | LV memory also in protective descent and abort (Q-RC-16) |
| N12/FBAnd2.AndIn5 / AndIn6 | Deactivated | !G:recRndC_SU / !V:linkAbortActive | keep Unlock impossible in StartingRun/abort (now reachable via filter); see Q-E3-1 |

## 4. Order of execution, budget, native rules
- 21 new FB contiguous **immediately before `RndPhysicalCompact/STATE_SU`** (canonical 162), in this order: RD_HLOSS, RD_PROT_SET,
  RD_RESET, RD_PROT, RD_SEQ, RD_T_SS1, RD_STO_TRIG, RD_STO, RD_T_COAST, RD_DIS, SU_ABORT_CAUSE, SU_ABORT_SET, SU_ABORT_END,
  SU_ABORT_RESET, SU_ABORT, DN_STO, DN_DIS, DN_T_HOLD, DN_C2, DN_ACTIVE, SU_RESET → orders 162..182; STATE_SU 183; rest +21, contiguous 1..260.
  Reason: SU_ABORT must be current before STATE_SU, SG_OWNER_SET, HLT_LV (else one scan SG set). Backward reads (previous scan,
  like the existing FBOr5←RUN_DOWN_OWNER): RD_PROT_SET←RD_STO, RD_SEQ←FBOr5, RD_RESET←FBAnd18, SU_ABORT_END←DN_T_HOLD.
- FB 239 → **260** (limit 512). Wires: +37 intra-network, −4. Symbols: +2 SAL variables (linkAbortActive: 1 source, 5 targets;
  linkDescActive: 1 source, 2 targets); linkRunDownOwner keeps 1 consumer (FBOrIlRunOk.OrIn3). Usage deltas on existing:
  in_LV_Faulty_FBK +2/−1, in_HV_Faulty_FBK +1/−1, linkRndGreenQualified +1, linkSafeRndScope moved (STATE_SU→SU_RESET),
  out_HV_C2 +1, in_HV_C2_FBK +1, G:recRndC_SU +2, G:b_Step1 +2. No SGVL change, no new globals.
- Rules: inter-network only via Symbols/globals; one wiredLink per port pair; singleton usage wrappers; new GUIDs; diagram shapes
  for 21 FB; unused inputs of new And/Or Deactivated; no alias/mapping/group/target/hardware change; native CRC by offline tool only.
- Timers: no existing timer changed. New instances: 2 s and 5 s = D-RUN-STOP-WAITS (SS1 2 s, STO/coast 5 s); 1 s = existing
  discharge hold (D-HV-TIMED-COMPLETE): effective hold of the reference Step5 chain `Network8/FBTon2` 1 s (C2 OFF = DIS + ~1 s,
  canonical E-01 HVD 7009 / C2 8010). Network7/8 timers stay owned by the Emergency chain Step4/5/6 (not shared: stage ownership, E2).

## 5. Behaviour (model, times from acceptance a / event ev)
- Run→R&D: SS1 +5, STO +2006, DIS +7005, C2 OFF +8006, FBK OFF +8027, R&D +8206. Repeated green at a+2.6/4/7.3 s: ignored.
- Green abort in SU (after clearance): STO +3, DIS +3, C2 OFF +1003, R_end +1024, stays R&D, C1 ON, no SG, no resume; new BOTH → Run.
- LV loss in SU (blip 200 ms): abort as above, C1 OFF +1026, Safe +1048 (memory). Green before clearance in SU: ignored.
- HV loss in Run: STO +3, DIS +5002, C2 +6003, R&D +6203; green during it ignored. LV in SS1 at a+500: STO a+554, then NC1 → EMG.
  LV blip after STO + NC1 lost: normal descent unchanged, R&D then Safe, no EMG (Q-RC-09, Q-RC-03 b1).
- Emergency during abort (+200) / protective (+3 s) / normal SS1 (E-07): STO/DIS/C2 not later than normal (sequencer is not reset
  by Emergency; reset only at R&D arrival / Safe). Legacy (0,1) uses the same timed sequence (V14-Q3; legacy removal is E4).
- Blue / BOTH in SU after clearance: no Unlock, no step. Invariant "one main state": 0 violations in all probes.

## 6. Catalog results (model; `model/e3.E2E3.out.txt`)
- E3: PASS C-06, C-07, D-01, D-02, D-05, D-07, D-09, E-07, H-02, H-03, H-06, H-07 (SafetyFault parts NV, E5). **D-03 FAIL = test defect**:
  `downTrace.RND` takes the first R&D-status scan, but StartingRun and its abort are main state R&D (TD-14), so `RND>=FBK` can never hold.
  Use R_end (R&D ∧ ¬out_HV_C2 ∧ ¬C2_FBK) as D-09 does; on the model R_end +1024 = FBK OFF +1024 → PASS. Tester to fix (no weakening).
- E2: 41/41 PASS (unchanged vs canonical).
- M-12 locator: deactivate `//Network6/RD_DIS/AndIn2` (from `RD_T_COAST/TonOut`) and `//Network6/DN_C2/AndIn2` (from `DN_T_HOLD/TonOut`)
  → D-02 FAIL (killed). M-04 still killed by C-04 (HEALTHY_OK.AndIn3 kept).
- Uncovered guards (catalog gap, report to tester): `HLT_LV.AndIn5` removed → C1 OFF at abort +3 (D-09 still PASS);
  `SG_OWNER_SET.AndIn3` removed → green abort ends in Safe (D-03 only fails on the defective check). Suggest D-09 "C1 OFF only after
  R_end" and D-03 "ends R&D with C1 ON". Editor self-check mutants: both of these + M-12.

## 7. Out of scope / risks
- SafetyFault (HealthyLost) not built (E5); E6 watchdog aborts (W-02/W-03/W-05) can later set SU_ABORT — not now. No PLC mechanism (E4).
- E2 risk: release filter now runs in SU (K-07/U-07 PASS); SS1 output now drops at descent start (drive-visible, intended by E2-Q1).
- Editor scope: write `candidates/E3/**`, `program/editor/E3/**` only. Self-check: native preflight + CRC + FB 260; E2+E3 catalog with
  `CATALOG_SAL_DIR=candidates/E3/native CATALOG_STAGES=E2,E3`; M-12 kill; times of section 5 within ±50 ms.
