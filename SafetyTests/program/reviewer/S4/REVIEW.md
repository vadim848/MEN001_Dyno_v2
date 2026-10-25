# S4 (E4) end-of-stage review — v2-reviewer, 2026-10-24

Verdict: **NEEDS CHANGES (bounded)** — SAL/SGVL candidate conforms to the plan and decisions (no SAL change requested);
changes needed in the PLC MAIN mapping (config/**) and in the test catalog (sufficiency). Model evidence only; no native/IDE/hardware claim.

## Inputs verified (SHA256)
- PLAN.md 276ac70c… OK. Candidate SAL candidates/E4/native 4ee8d3d9… OK (297 FB). Base canonical E3 SAL 9ee66e78… OK.
- Runs program/runs/S4-E4-r1: 89 pass / 13 fail (all E5/E6 rows) / 6 todo; 0 regressions vs canonical; 19/19 [M]; structure PASS; npm test 53/53. Not re-run.

## (1) SAL diff vs plan (diff.mjs -> diff.out.txt, order.mjs)
- 260 -> 297 FB; 10 removed exactly as plan (N1 FBTon1/FBAnd10/12, N2 FBAnd61/81/91/11, N6 FBAnd15/16/17); 47 added; 24 port changes + DecOut5 -> STS_COVER_LOCKED; all match PLAN §2.
- Relative exec order of the 250 surviving blocks preserved; orders contiguous; 0 inter-network wires; new links only via Symbols.
- No PARAM change on existing blocks; only new timers PE_T_CLR 1 s, HB_T_HI/LO 3 s, CFG_T_HOLD 1 s; FBTon1 10 s deleted (V14-Q17).
- SGVL: only CRC + FbPortUsage −3 (deleted blocks) / +17 (globals read by new blocks, count matches). Variables: +18, 2 legacy renamed in place (alias 94/97 kept).
- Accept paths are fed into the existing BOTH/green guard chains (N2/FBAnd4, SU_SET->STATE_SU, N6/FBAnd23, GATE_SG_SET); PLC R&D->Run path replicates GATE_020 non-gesture guards (scope, cover, ¬recRndC_SG, ¬C2_FBK) + EOk.
- Same-scan consistency checked: linkCfgAccept read next scan by N3/FBOr1 (ord 2) and STATE_CFG (ord 17); linkCfgDone by N3/FBOr2 (ord 1) and CFG_RST (16) -> Step1/Config switch in one scan (no two-main-state window).

## (2) Logic per decisions (probe.mjs/probe2-4.mjs; model evidence)
Conforms: edge-only from steady states (V14-Q11), conflicts incl. Bypass -> error, none executed, clear after all FALSE 1 s (P4: Safe Bypass+S2R -> no C1, Fault, cleared at 1.1 s);
TRIGGER_EMERGENCY ungated; pressed button -> edge ignored and not deferred (also in StartingRun abort, P1); PLC error does not gate buttons;
aborts in transitions (P-04/P-05); Q-RC-08: R2S edge in StartingRun ignored (P3); Config entry/exit/Emergency, Healthy ignored, no 10 s timer;
Q-ARCH-08 BOTH vs Bypass: BOTH wins (P8); no error from two commands in Config (P5); heartbeat 3 s from last level change (Run: EMG at stop+2672);
STS one-hot + EMG complement; STS_COVER_LOCKED = linkCoverClosed; outPLC_RnD unchanged (P-12); legacy removed, U-08 vacuous.
No protection removed except the approved 10 s timer and the legacy mode bits (вопрос 77). New energy path = Config only (C1+C2, STO held).

## Findings (ranked)
**F1 — Medium — PLC MAIN act_LogicMap (-> architect P3 / editor; Vadim if PLC command semantics must be decided).**
New mapping clears all CMD_* and then sets exactly one per `n_SafeSate` case, every scan. `n_SafeSate` (INT, default 0) is written by no POU/Visualization;
0 = `enum_RnD_2_Safe` -> **CMD_RND_TO_SAFE is permanently TRUE from PLC start** (legacy mapped case 0 to (0,0) = idle). Consequences on the candidate SAL
(probe P7): any Bypass TRUE in steady Safe -> PLC error, Config never entered, and the error **can never clear** (all-FALSE impossible) -> STS_FAULT stuck.
Plan P3 said "at most one TRUE". Needs an idle (all FALSE) state / command release after execution; not a SAL change.

**F2 — Medium — test sufficiency (-> tester; sub-cases of existing decisions, no new decision needed).** Own mutants (mut.mjs -> mut.all.txt): 17 killed, 26 survived on E4 rows. Safety-relevant survivors:
- `N6/STAGE_LVON.OrIn3`: Emergency from Config does not remove energy (C1/C2 still ON 10 s after EStop, probe4) — no row checks energy-off for Emergency in Config (G-05 checks status only).
- `N3/CFG_RST.OrIn2`: STATE_CFG not reset by Emergency -> after Restart two main states (8606 invariant scans, probe4) — no row restarts after Config Emergency.
- `PA_CFG.AndIn4` (Bypass during button / PLC error; Q-ARCH-08, Q-RC-05b), `PA_CFG.AndIn5/AndIn7` (same up permissions), `N3/FBAnd2.AndIn5`.
- Held-command / button guards outside R&D->Run: `PA_S2R.AndIn2/AndIn4`, `PA_RUN2R_T.AndIn2`, `PA_R2S_ST/AB.AndIn2`, `PK_OK.AndIn2` (blue button), `PE_ALLF.AndIn5` (Bypass in the clear condition).
- Architect's pair: `PA_R2RUN.AndIn3` now KILLED (P-06 new sub-cases); `PA_R2S_AB.AndIn3` still SURVIVES (also PA_R2S_ST.AndIn3; probably masked downstream).
- Weaker: CFG_DONE.AndIn4/5 (symmetric plant delays), FBOr5.OrIn1, PA_R2RUN.AndIn6, PS_RND.AndIn3/4, PS_RUN.AndIn3, DEC_CFG.AndIn2 (some may be equivalent).
- "Abort ignored while a button is pressed in StartingRun": uncovered by the catalog; candidate behaves per Q-E4-2 A (probe P1).
Oracles of the S4 test edits are from decisions (V14-Q11/Q-RC-08, Q-E4-2/3/4 A); P-11 bound now two-sided ±50 ms from last level change (OK). TODO rows legit (SafetyFault NV until E5, E-08 question).

**F3 — Low/Medium — open behaviour (-> analyst/Vadim).**
(a) Config exit with C1/C2_FBK stuck ON: stays in Config indefinitely with contactors commanded OFF, no Emergency/SafetyFault (probe P6). Q-RC-06 covers entry only, Q-RC-19 loss without OFF command. Needs a decision (E6).
(b) Q-E4-2 A team default ignores a *safe-direction* PLC abort while a PLC error is active (buttons still work). Present to Vadim with Q-E4-1/5.
(c) Info: Emergency in Config uses the existing Emergency chain (C1 OFF +2 s, HV discharge +7 s, C2 OFF +8 s, same as Run) — consistent with V14-Q19 "как в любом состоянии".

**F4 — Low — documentation/stand.** Deviations recorded (sds 14 + 100–105, sds 2 UINT left; port count model vs native). Stand fallback TRIGGER_EMG -> in_Estop_PLC and STS_FAULT as PLC Fault are team defaults pending Vadim (Q-E4-1/5) — revisit on answer.

## (3) Config files
- Re-used carriers unused in canonical PLC: no POU/DUT/Visualization reference to MotoCooling, InitSystem, Bypass1/2; tsproj had no links to Out Var 14 / In Var 63/64; In Var 48 only a stale UnrestoredVarLink (`InitSysytem`, RestoreInfo ANotFound) left untouched.
- tsproj (text diff): ST_TwinSAFE_OUT 120->144 bit (+3 BOOL at 120/128/136), ST_TwinSAFE_IN 200->256 (+7 at 200..248) consistent; StandardInputs PDO +6 BIT Out Var 100–105 (Sub 0x1b–0x20 after 0x1a), padding ARRAY[0..6]->[0..0] with the existing GUID pattern: total 16+31+1 = 48 bit unchanged -> SM sizes unchanged; links: 7 STS_*, 4 CMD_*, Heartbeat; old Set_RnD_Mode links replaced. Structurally consistent.
- New sds 100–105 identical to sds 98 except SDSID/CRC; splcproj Includes/NextSdsId consistent; Project Crc not recomputed.
- MAIN heartbeat: two TON 500 ms toggle, written every cycle — fine. CMD mapping: see F1.
- Only V14-Q2-permitted objects touched (alias devices, splcproj, tsproj PLC-exchange PDO/links, DUTs, MAIN); TargetSystemConfig, safe I/O, group parameters untouched; no physical rewiring implied.

## (5) Team decisions
Q-E4-3 A and Q-E4-4 A are consistent with V14-Q18 / V14-Q20 text ("нет смены уровня 3 с"). Q-E4-2 A consistent with Q-RC-04 for "other command TRUE"; the PLC-error part see F3b. Q-E4-1/Q-E4-5 change the interface -> Vadim before canonical transfer.

## Only TwinCAT IDE / Verify (S6) can confirm
SAL+diagram open/Verify/Build in the IDE (offline native CRC only so far); splcproj Project Crc; new alias devices 100–105 accepted and mapped by the IDE;
tsproj DataType regeneration after PLC compile, PDO/padding/link restore, stale InitSysytem link; TargetSystemConfig/process-image consistency; PLC build of MAIN/DUTs;
heartbeat timing on the real task; ADS7/Target errors; any hardware behaviour (out of scope).

## Return list
- editor/architect: F1 (MAIN idle state). tester: F2 rows (Config Emergency energy-off + restart, Q-ARCH-08, Q-RC-05b, held/button guards in Safe/StartingRun, blue button, Bypass in clear). analyst/Vadim: F3a, F3b, Q-E4-1/5.
- SAL candidate: no change requested.
Files: diff.mjs/diff.out.txt, order.mjs, blk.mjs, mut.mjs/mut.all.txt, probe*.mjs/probe*.out.txt in this folder.
