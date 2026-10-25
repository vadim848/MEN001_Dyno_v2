# S3 (E3, STOP v2) end-of-stage review — v2-reviewer, 2026-10-24 (D-COMPACT)

Verdict: **NEEDS CHANGES — tests only.** SAL E3 `9ee66e78…` is accepted as it is. No code change is requested.
Return to: **v2-tester** (5 sub-cases inside existing rows; no new catalog row; no question for Vadim). Then the runner re-runs on the same SAL.
After that, a lead check is enough (no new review pass), as in S2.
Limits: this is software-model and offline native evidence only. It is not Verify/Build/Target, and it says nothing about hardware safety.

## Identity (re-hashed by the reviewer)
- Candidate `candidates/E3/native`: SAL 9ee66e7868547d7d…, SGVL 72eade07b554a7b4…, diagram 9fe9aa7eb8f93068… (= IMPLEMENTATION.md, runs/S3-E3-r1).
- Base: canonical SAL 67336d9b42aed3c1… (git clean, untouched). PLAN.md 117d6b4e…, PLAN.json 3af9069b… (= the hashes the editor quotes).
- `CATALOG_SAL_DIR=candidates/E3/native npm run check:structure` re-run: **PASS** (14 networks / 260 FB / 2166 ports / 81 vars / 335 wires; native preflight with singleton usages, no inter-network wiredLink, typed binding, FB<=512, native CRC+validation). Log: `structure.log`.

## 1. Diff canonical E2 -> E3 vs plan (`diff.mjs` / `diff.out.txt`, parsed graph)
- **+21 FB, 0 removed.** Names, types, contacts and sources match PLAN §2 and PLAN.json exactly. Diagram: +5 And, +9 Or, +4 Rs, +3 Ton shapes (=21).
- **18 changed existing ports.** Each one matches a PLAN §3 row. There are no other port, parameter, function or alias changes, and variable Ids are equal.
  - STATE_SU.Reset changed NO->NC because the inversion now sits in SU_RESET.OrIn1 (NO on linkSafeRndScope). Net polarity is unchanged and correct.
- **Wires: -6, not -4.** The 2 extra wires are SNAP_0.DecOut7 -> GATE_008/014.AndIn4, which fall away because those ports are deactivated by a plan row. This is a counting error in the plan text, not a logic deviation. DecOut7 is left dangling, and native validation accepts it.
- **Timers.** New: RD_T_SS1 2 s, RD_T_COAST 5 s, DN_T_HOLD 1 s. **No existing timer parameter changed.**
- **Order.** The global execution order of all 239 old blocks is preserved. Orders run contiguous 1..260, and the 21 new FB sit at 162..182, immediately before STATE_SU (183).
- **Symbols.** +2 SAL variables:
  - linkAbortActive: 1 source, 5 targets.
  - linkDescActive: 1 source, 2 targets.
  - Usage deltas on existing variables match PLAN §4; linkRunDownOwner is down to 1 consumer.
  - 0 inter-network wires.
- **SGVL.** Only +4 FbPortUsage entries (recRndC_SU +2, b_Step1 +2) and the file CRC changed. No declaration changed ("no SGVL change" in the plan means no declarations).
- No hardware, group, target, alias or mapping change, and no unrelated edits.

## 2. Correctness per decision (reviewer probes `probe.mjs` / `probe.out.txt`; model, ±1 scan)
- **Run->R&D (E2-Q1, D-RUN-STOP-WAITS):**
  - Times from a: SS1 requested +5, STO +2006, DIS +7005, C2 OFF +8006, FBK OFF +8027, R&D +8206. The order is strict.
  - Green held for 12 s ends in R&D with C1 ON (one attempt = one step).
  - Two consecutive Run->R&D->Run cycles give identical times, so there is no stale latch. OK.
- **StartingRun abort (V14-Q12, D-STARTINGRUN-ABORT/NO-COAST, GREEN-DOWN):**
  - STO and DIS at +3, C2 OFF +1003, R_end +1024. There is no SS1 or coast, and no resume. The run ends in R&D with C1 ON.
  - Green held 3 s: still R&D (no chained R&D->Safe).
  - Green before clearance: ignored.
  - A new BOTH after the pause gives Run (not stuck).
- **Healthy loss (Q-RC-02/15/09/16, Q-ARCH-03):**
  - HV loss in Run: STO +3, DIS +5002, C2 +6003, R&D, no Emergency. Green during the descent is ignored (Q-RC-08).
  - LV loss in SS1: STO +54 from the loss, then NC1 lost -> Emergency (Q-RC-17(3)).
  - LV 200 ms blip after STO, then NC1 lost: the normal stop is unchanged, no Emergency, R&D then Safe (Q-RC-09, Q-RC-16, Q-RC-03 b1).
  - LV 200 ms blip in Run (protective) and in StartingRun: abort/descent, then Safe. In StartingRun, C1 OFF +1026 comes after R_end +1024.
  - Green and LV loss together in StartingRun: abort, then Safe.
- **Emergency during a descent (Q-T3-1):**
  - EStop at a+1000/3000/6500/7300/7900 s: STO, DIS and C2 OFF happen at exactly the normal times. The sequencer is not reset by Emergency, so no step comes later than normal.
  - Emergency during the abort (+200) and during the protective descent (+3 s): no step later than without it.
  - Restart -> Safe resets the sequencer (b_Step1). After that, BOTH, BOTH -> Run, and the next descent has normal times. **No stuck states.**
- **Release filter now runs in StartingRun (GATE_008/014, Q-E3-1):**
  - K-07, K-10, K-11 and U-07 PASS.
  - BOTH in StartingRun after clearance: no extra step and no Unlock. Run follows when HV is confirmed, and the next descent is normal.
  - Blue in StartingRun: no Unlock. Blue in R&D after the abort ends: Unlock is given (Q-ARCH-10).
- **New hazards:** none found. All new terms either remove energy (STO, discharge, C2 OFF) or block an exit or Unlock. The only removed path is Healthy loss -> Emergency in Run, and Q-RC-02 requires that removal. Probes and catalog show 0 violations of the "one main state" invariant.

## 3. Test adequacy
- **Run results reproduced from runs/S3-E3-r1:**
  - E3 rows: 12 PASS with 0 FAIL. D-07 and E-07 pass on canonical too: canonical already met them because it issued all steps in the same scan.
  - All 31 all-stage FAILs are E4/E5/E6 rows (E-09, E-10, G-*, P-*, W-*).
  - The canonical->E3 regression set is empty.
  - M: 14/14 killed, and M-12 is now assessable.
- **The 7 todos are legitimate:** E-08 (injected conflict, not reachable), K-11 Config (E4), H-05 and the SafetyFault parts of H-02/03/06/07 (E5).
- **The test changes are decision-derived and stricter, not weaker:**
  - D-03 uses R_end per TD-14 and adds "R&D with C1 ON throughout", plus "no Unlock in StartingRun" per Q-E3-1.
  - D-09 adds "C1 ON until R_end".
  - The "no Unlock during the abort" check is skipped only when it is not reachable by buttons: the abort lasts about 1 s, shorter than the 2 s release pause. It is not counted as PASS, and the reviewer agrees this is legitimate.
- **Reviewer mutants of the new guards (`probe2.out.*.txt`):**
  - Killed:
    - RD_HLOSS -> H-02/03/06
    - RD_STO_TRIG.OrIn2 -> H-02/03/06
    - RD_DIS / DN_C2 hold -> D-01/02/03, H-*
    - SU_ABORT_CAUSE.OrIn1 -> D-03; SU_ABORT_CAUSE.OrIn2 -> D-09
    - SU_ABORT_END -> D-09
    - SU_RESET -> D-03/09
    - DN_STO -> D-03/09
    - FBAndNotRunSu.AndIn3 -> C-07
    - N12/FBAnd2.AndIn5/6 -> D-03
    - SG_OWNER_SET.AndIn3 -> D-03
    - HLT_LV.AndIn5 -> D-09
  - **Survivors** (each guards behaviour that a decision defines and E3 implements correctly, but no catalog check covers it). `probe3.out.txt` shows each proposed sub-case PASSES on E3 and FAILS on its mutant:
    - **T1 — `N1/FBAnd2.AndIn4` (SS1 request at descent start).** E2-Q1 / D-RUN-STOP-WAITS start the sequence with SS1, but the D-01 oracle checks only STO at 2 s. Mutant: SS1 is never requested and STO still comes at 2 s.
      Add to D-01: "out_SS1_DR1/2 FALSE (SS1 requested) at a±50, before STO". Polarity: FALSE = requested, per the SS1-EMG criterion.
    - **T2 — `HLT_DESC_SET.AndIn2` rewired to linkDescActive (LV memory in the protective descent, Q-RC-16/Q-RC-02).** H-03 holds LV as a level. Mutant: an LV 200 ms blip in Run ends in R&D instead of Safe.
      Add to H-03: "LV lost 200 ms then back -> protective descent, then R&D->Safe". This is the same pattern as S2 B1.
    - **T3 — `RUN_DOWN_RESET.OrIn4` (a normal descent that becomes protective loses the NC tolerance, Q-RC-15 + Q-RC-17(3)).** C-07 only covers the protective descent entered from Run. Mutant: LV lost in SS1, then NC1 lost -> no Emergency.
      Add to C-07 (or H-06): "LV lost in SS1, then NC1 FALSE -> Emergency".
    - **T4 — `RD_PROT_SET.AndIn3` (Healthy loss after STO does not make the descent protective, Q-RC-09 + Q-RC-03 b1).** Mutant: LV blip after STO, then NC1 lost -> Emergency, which is wrong.
      Add to H-07: "after the LV blip, NC1 FALSE -> still no Emergency, R&D then Safe".
    - **T5 (availability) — `RD_RESET.OrIn2`, the sequencer reset at Safe.** Mutant: after an Emergency during a descent, Restart -> Safe, BOTH -> R&D, BOTH -> stays R&D (stuck in "descent").
      Add to E-07: "Restart -> Safe -> BOTH -> R&D -> BOTH -> Run".
    - SU_ABORT_RESET.OrIn2 is redundant in all reachable paths: the abort ends by R_end even during Emergency. No test is needed.

## 4. Team decisions S3-TD
- **Q-E3-1 (no Unlock in StartingRun/abort): no conflict.** Q-ARCH-10 and Q-ARCH-04 grant Unlock in *устойчивом* R&D and Safe. StartingRun and its abort are not steady, even though they sit inside main state R&D (TD-14). The decision keeps E2/F1 behaviour (unreachable there) and adds no energy. After the abort ends, the R&D Unlock rule applies (verified).
- **A-E3-1 (1 s hold before C2 OFF): no conflict.** It equals the effective hold of the reference Network8 chain and canonical E-01 (HVD 7009 -> C2 8010), so D-HV-TIMED-COMPLETE "существующая выдержка" holds. The catalog checks ordering only. If Vadim means 2 s, one parameter changes.
- **D-03 oracle (R_end per TD-14): no conflict.** TD-14 was accepted by Vadim (D-S2-ACCEPT). The oracle got stricter (C1 ON, R&D throughout).
- **Note (lead):** the D-STARTINGRUN-GREEN-DOWN text in SCENARIO_DECISIONS mentions "SS1/STO/discharge … нормальной Run→RnD последовательности" for the green abort. V14-Q12 and D-STARTINGRUN-ABORT/NO-COAST, plus the approved catalog row D-03 ("без SS1 и выбега"), define the abort without SS1 or coast. E3 follows the later decisions. Consider marking that sentence superseded in the digest to avoid future misreading.

## 5. Stand self-checks (runs/S3-E3-r1/selfchecks.log, 6 BOOT FAILs)
**Confirmed: not an E3 issue.**
- `npm test` does not use CATALOG_SAL_DIR and never loads the candidate.
- The BOOT tests asserted inventory of the current canonical (changed at S2).
- The stand fix in progress is test/boot-preflight.test.js (uncommitted), pinned to `fixtures/stand-f1-04b45456`. Re-run now: 15/15 pass.

## Pending before transfer
1. Tester: add T1–T5 as sub-cases of D-01, H-03, C-07/H-06, H-07 and E-07. Show that each PASSES on E3 9ee66e78 and FAILS on the corresponding reviewer mutant (locators in `probe3.mjs`).
2. Runner: re-run the E3 stage and M on the same SAL. If green, a lead check suffices and E3 can be transferred to canonical.
