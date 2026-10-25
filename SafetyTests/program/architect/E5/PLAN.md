# E5/E6 (S5) — SafetyFault, contactor watchdog 500 ms, Healthy 30 s: plan on E4 final → `candidates/E5/native`

Role: v2-architect, 2026-10-24 (D-COMPACT, D-AUTO-PROCEED). Exact delta (generated from the model): `PLAN.json`. Questions/TD: `QUESTIONS.md`.
Base (read-only): `candidates/E4/native` SAL `4ee8d3d96da1a1b9…` (297 FB), SGVL `98a0d10f4dfe9a98…`. Notation as E4 (`V:` Symbol, `G:` SGVL global,
`W:` intra-network wire, `!` inverted contact). Model: `model/e5.mjs` (in-memory edit + catalog stand) — model evidence, not native CRC.
E7 (BOOT): B-01…B-03 PASS on E4 and on the model — **no E7 change**.

## 1. Contactor watchdogs (E6-Q1, Q-V4-01, Q-RC-19, Q-V4-02), RndPhysicalCompact, after GATE_012 (before RELEASE)
Per contactor X = C1 (`out_LV_C1`/`in_LV_C1_FBK`), C2 (`out_HV_C2`/`in_HV_C2_FBK`), generic (any stage, incl. Config), 10 FB each:
- `WDX_WIN` Ton **0.5 s**(cmd) — window from command ON.
- `WDX_FAIL` Rs(Reset !cmd, Set `WDX_FAIL_SET`=WIN∧¬FBK∧¬WDX_OK[prev scan]) — rise failure at window end (level until cmd OFF).
- `WDX_OK` Rs(Reset !cmd, Set `WDX_OK_SET`=WIN∧FBK∧¬FAIL) — FBK confirmed at window end. `WDX_LOSS`=OK∧¬FBK → Emergency (Q-RC-19).
- `WDX_SEEN` Rs(Reset !FBK, Set `WDX_SEEN_SET`=cmd∧FBK); `WDX_OFF` Ton **0.5 s**(`WDX_OFF_IN`=¬cmd∧SEEN) → Emergency (OFF failure, E6-Q1, S4-F3a).
- Spontaneous FBK (Q-V4-02): `WDC1_SPONT`=¬C1∧C1_FBK∧¬SEEN1∧b_Step1∧EOk; `WDC2_SPONT`=¬C2∧C2_FBK∧¬SEEN2∧(`WDC2_SCOPE`=Step1∨Step_RnD)∧EOk → SafetyFault.
- Healthy 30 s (Q-CA1-01, 66(b)): `WDH1_LAT` Rs(Reset !b_Step12, Set C1_FBK), `WDH1_T` Ton **30 s**; `WDH2_LAT` Rs(Reset !recRndC_SU, Set C2_FBK), `WDH2_T` Ton **30 s**.
- Ors: `WD_ROLL_S12`=FAIL1∨WDH1_T; `WD_ROLL_SU`=FAIL2∨WDH2_T → **V:linkWdRollSu**; `WD_FAIL_ANY`=FAIL1∨FAIL2 → **V:linkWdCfgFail**;
  `WD_EMG`=LOSS1∨LOSS2∨OFF1∨OFF2 → **V:linkWdEmg**.
Consumers: **Emergency** N1/FBAnd1.AndIn5 := !V:linkWdEmg (same path as cover loss: FBEstop1.EStopIn3 + set permits; latching, Restart only in Safe).
**Rollback Safe→R&D** (W-01, W-04): RPC/GATE_SG_SET.OrIn4 := W:WD_ROLL_S12 (= existing abort Safe→R&D, STATE_SG: C1 OFF at once, Safe after FBK OFF).
**Rollback StartingRun** (W-02, W-03, W-05): N6/SU_ABORT_CAUSE.OrIn4 := V:linkWdRollSu (= existing abort: STO+Discharge, 1 s hold, C2 OFF, R&D).
**Rollback Config** (G-07, Q-RC-06): new N1/`CFG_EX_OR` Or(CFG_EX_SET, V:linkWdCfgFail) → N1/CFG_EX.Set (= existing Config exit; Healthy 30 s not in Config).

## 2. SafetyFault (66(a), Q-ARCH-05/Q-RC-11, E6-Q2, Q-RC-07, Q-V7-04, Q-RC-13), RPC, same cluster
- `SF_HL_SU`=recRndC_SU∧in_LV_Faulty_FBK (Q-ARCH-03). N6/RD_PROT_SET.AndOut → new **V:linkHltRunLost** (HealthyLost Run/SS1, Q-RC-02/15).
- `SF_SET` Or(WD_ROLL_S12, WD_ROLL_SU, WDC1_SPONT, WDC2_SPONT, V:linkHltRunLost, SF_HL_SU, V:linkHltLvLost [R&D LV + after-STO memory, Q-RC-16]).
- `SF_ACK`=¬GATE_002 (a button pressed) ∧ RELEASE[prev scan: both OFF ≥ 2 s] ∧ ¬SF_SET (no active cause, Q-V7-04) ∧ SF[prev].
- `SF` Rs(Reset SF_ACK, Set SF_SET) → **V:linkSafetyFault** (single memory). PLC never acknowledges (no PLC input in SF_ACK).
- After RELEASE: `SF_ACKC` Rs(Reset RELEASE, Set SF_ACK) (attempt consumed until both OFF 2 s); `SF_UPBLK`=SF∨ACKC → **V:linkUpBlock**.
- UP blocked (buttons and PLC): N2/FBAnd4.AndIn4 := !V:linkUpBlock (Safe→R&D, BOTH+PLC); new RPC/`SU_SET_G` And(SU_SET, !SF_UPBLK) → STATE_SU.Set
  (R&D→Run, BOTH+PLC); N1/PA_CFG.AndIn8 := !V:linkUpBlock (Config entry, Q-RC-07b). DOWN untouched: green-down acks and descends (Q-RC-07a);
  PLC R&D→Safe descends without ack.
- STS_FAULT: N1/PF_OR.OrIn2 := V:linkSafetyFault (reserved in E4) → STS_FAULT = PE_ERR ∨ SafetyFault (Q-RC-13).
- Stand symbol: `CATALOG_SAFETYFAULT_SYMBOL=linkSafetyFault` (also unique by pattern). No new PLC output (п.14–15: no codes/blink).

## 3. Budget, order, native rules, timers
- FB 297 → **336** (+39, −0; limit 512). Model ports 2467 → 2597. SAL variables 99 → **105** (+6 internal Symbols: linkWdRollSu, linkWdCfgFail,
  linkWdEmg, linkHltRunLost, linkSafetyFault, linkUpBlock). SGVL unchanged. No alias devices / mappings / tsproj / PLC change.
- Order (global; fractional in PLAN.json, editor renumbers 1..336): cluster WD*/SF_HL_SU/SF_SET/SF_ACK/SF after RPC/GATE_012 (170) and before RELEASE (171);
  SF_ACKC, SF_UPBLK after RELEASE, before N2/S2R_REQ (175); SU_SET_G between SU_SET and STATE_SU; CFG_EX_OR between CFG_EX_SET and CFG_EX.
  Intended previous-scan reads: SF_ACK ← RELEASE, SF; WDX_FAIL_SET ← WDX_OK; N1/FBAnd1, PA_CFG, PF_OR, CFG_EX_OR ← cluster Symbols (1 scan).
- Rules: inter-network only via the 6 Symbols + existing linkHltLvLost/globals; wires only inside RPC/N1; one wiredLink per port pair; singleton usage
  wrappers; new GUIDs; diagram shapes for 39 FB; unused inputs Deactivated; no other name may match /safety_?fault/i. Native CRC by the offline tool only.
- Timers: existing unchanged (RELEASE 2 s reused for the ack pause); new 0.5 s ×4 and 30 s ×2 exactly from E6 decisions.

## 4. Invariants kept (evidence)
Exclusive main state: rollbacks reuse existing aborts (STATE_SG, SU_ABORT, CFG_EX) — no new stage writer; R&D confirmation cannot race a rollback
because the rollback drops C1 in ~2 scans (WIN_C1 input falls) and StartingRun confirmation needs SU (reset by abort). Model: 0 invariant violations
(A9) in all 88 rows. Reference sequences untouched (no edits in N3/N7/N8/N11/N12 stage logic). Emergency priority unchanged (FBEstop1 path).

## 5. Model results (`model/e5.all.out.txt`, `model/probe5.out.txt`, `model/mut5.out.txt`; env TRIGGER_EMG=in_Estop_PLC, SAFETYFAULT=linkSafetyFault)
- **85/88 PASS** incl. E-09, E-10, W-01, W-02, W-05…W-10, H-02/03/05/06/07 SafetyFault parts, all E2/E3/E4 rows, B-01…B-03.
- **Stand issues (tester), not design:** W-03/W-04 `PRECONDITION: C*_FBK ON` — `tf=x.first(c*f,u-1)` is taken right after acceptance, before the
  plant delay (20 ms); fails on E4 too. Probe with a 100 ms wait: W-04 C1 OFF at tf+30002, Safe, SF; W-03 abort at tf+30002, never Run, R&D, SF.
  **G-07 oracle** expects C2 OFF at C2 ON+500; Q-RC-06 prescribes «Discharge → выдержка → размыкание C1/C2»: model HV Discharge at +502,
  C1/C2 OFF at +1503 (1 s hold), Safe, SF, STS_FAULT. Oracle should time the rollback start (Discharge), not C2 OFF.
- Probes: welded C1 at R&D→Safe → EMG at C1 OFF+502; Config exit welded C2 → EMG +502 (S4-F3a); confirmed C1 loss in Config / R&D → EMG +3;
  FBK dither 60 ms inside window → R&D, no fault (Q-V4-01); spontaneous C2_FBK in Safe → SF; blue press acks (Unlock still issued, Q-E5-1).

## 6. Mutants (G3 list for the tester; `model/mut5.mjs`)
Killed: GATE_SG_SET.OrIn4 (W-01), SU_ABORT_CAUSE.OrIn4 (W-02), CFG_EX_OR.OrIn2 (G-07), FBAnd1.AndIn5 / WD_EMG.OrIn2 (E-09), WD_EMG.OrIn4 (E-10),
SF_SET.OrIn5 (H-02), .OrIn7 (H-05), .OrIn3 (W-09), SF_ACK.AndIn4 (K-01), SF_ACKC.Set / FBAnd4.AndIn4 (W-06), SU_SET_G.AndIn2 (W-08), PF_OR.OrIn2 (W-10),
timer shifts WDC1_WIN/WDC2_WIN/WDC2_OFF 0.5→0.6 s (W-01/W-02/E-10). WDH1_T/WDH2_T 30→29 s "killed" only by the W-03/W-04 precondition bug.
**Survivors = catalog gaps (no row; new rows only with Vadim's decision):** WD_EMG.OrIn1/OrIn3 (C1 confirmed loss / C1 OFF failure), SF_SET.OrIn4
(spontaneous C2_FBK), SF_SET.OrIn6 (LV loss in StartingRun → SF; D-09 does not check SF), PA_CFG.AndIn8 (Config entry with SF), WDC1/WDC2_SPONT scope,
WDC2_SEEN_SET.AndIn1, WDC2_FAIL_SET.AndIn3 / WDC2_OK_SET.AndIn3 (extra SF besides Emergency not checked), SF_ACK.AndIn2 (ack by a press without
2 s release), SF_ACK.AndIn3 (redundant while causes are levels; kept for pulse causes RD_PROT_SET).

## 7. Editor scope
Write `candidates/E5/**`, `program/editor/E5/**`; base = copy of `candidates/E4/native` (identical bytes to canonical E4). Only SAL + diagram
(SGVL unchanged). Self-check: native preflight + CRC + FB 336; `CATALOG_SAL_DIR=candidates/E5/native CATALOG_SYM_TRIGGER_EMG=in_Estop_PLC
CATALOG_SAFETYFAULT_SYMBOL=linkSafetyFault node --test test/catalog/*.test.js` = section 5 (same 3 stand FAILs until the tester fixes them).
Out of scope: Q-E5-1 (Unlock with SF) until answered, codes/blink (п.14–15), PLC/tsproj, download.
