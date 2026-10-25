# S5 (E5/E6) end-of-stage review - v2-reviewer, 2026-10-24

Verdict: **ACCEPT WITH NOTES** (model/program evidence only; no IDE/Target/hardware claim).

## Inputs (SHA256 verified)
Candidate candidates/E5/native SAL 4c4be64b..., SGVL 27864ca3..., diagram 7ad25ee8...; base canonical E4 SAL 4ee8d3d9..., SGVL 98a0d10f... (= candidates/E4).
Tests: e5-final-all.tap 125/124 pass/0 fail/1 todo (E-08), 36 [M] ok; canon-e4-final.tap 13 FAIL = E5/E6 rows only (W-01..W-10, E-09, E-10, G-07).

## (1) Diff vs plan (diff.mjs -> diff.out.txt; blk.mjs)
- 297 -> 337 FB (+40 = 39 plan + BA_SET_G for Q-E5-1 A), 0 removed, no PARAM change on existing blocks; new timers 0.5 s x4 (WDC1/2_WIN, WDC1/2_OFF), 30 s x2 (WDH1/2_T).
- Exec order of old blocks preserved, contiguous; 9 changed ports exactly as PLAN s.1-2 (FBAnd1.AndIn5, PA_CFG.AndIn8, PF_OR.OrIn2, CFG_EX.Set, N2/FBAnd4.AndIn4, SU_ABORT_CAUSE.OrIn4, STATE_SU.Set, STATE_BA.Set, GATE_SG_SET.OrIn4) + RD_PROT_SET.AndOut -> linkHltRunLost.
- SGVL: only CRC + 8 FbPortUsage (globals read by new blocks); declarations unchanged. PLAN says "SGVL unchanged" - wording only, benign.
- Editor structure/native: preflight + typed binding + native CRC PASS; fresh reload 14/105/337/2725/63, SGVL CRC OK.

## (2) Logic (static reading of the candidate)
- UP gates only (N2/FBAnd4, SU_SET_G, PA_CFG, BA_SET_G); no DOWN/Emergency consumer of SF/linkUpBlock. Emergency only gains a trigger (FBAnd1.AndIn5 = !linkWdEmg).
- SF_ACK = press AND RELEASE[prev scan] AND !SF_SET AND SF; no PLC input. SF_UPBLK = SF OR ACKC: no 1-scan gap at ack (SF reset 206, ACKC set 208, OR 209).
- OFF failure (SEEN latch from cmd ON + FBK) -> Emergency, generic incl. Config exit; confirmed loss -> Emergency; rise failure -> existing aborts (STATE_SG scoped, SU_ABORT, CFG_EX reset by !linkCfgActive) + SF.
- No new stuck state found: SF causes are levels that clear after rollback/FBK OFF; no Emergency loop at boot (SEEN/OK need a command ON). No new stage writer.

## (3) Survivors (mut.mjs -> mut.out.txt, run on W-*, E-09/10, G-07, D-09, H-0x)
- Killed: WDC2_SEEN_SET.AndIn1 (W-09), WDC1_SEEN_SET.AndIn1, SF_SET.OrIn1/OrIn2, BA_SET_G.AndIn2, SU_SET_G.AndIn2.
- Survive, acceptable (fail-safe direction or redundant): WDC1/2_SPONT scope (extra SF only), WDC2_FAIL_SET/OK_SET.AndIn3 (extra SF/Emergency), SF_ACK.AndIn3 (redundant: Rs reset-dominant + ACKC).
- **N1 (Low-Med, tester):** WD_FAIL_ANY.OrIn1 survives: C1 rise failure in Config -> Config exit is untested (G-07 covers C2 only). Mutant keeps Config energized with C1 unconfirmed. Add a C1 sub-case to G-07 (Q-RC-06).

## (4) S5-TD vs decisions (to lead -> Vadim for review, not blocking)
- N2: TD-E5-1 - Q-V7-03 names "abort Safe->R&D" as an example; implementation records no fault when C1 drops before 500 ms. Defensible (window never expires), confirm with Vadim.
- N3: Q-E5-1 A also blocks Unlock while a SafetyFault cause is still active (no ack possible), e.g. spontaneous C1/C2_FBK in Safe. Extrapolation, confirm with Vadim.
- N4: TD-E5-4 - FBK ON without a command outside steady Safe/R&D (Emergency, Step12 C2) has no SF reaction; bounded by existing !FBK up guards.
- N5 (bookkeeping, tester): RESULTS.md "E5 final" says 123 pass / 2 TODO; e5-final-all.tap shows 124 / 1 TODO.
