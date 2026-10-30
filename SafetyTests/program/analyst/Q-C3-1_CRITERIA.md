# Q-C3-1 — C3/BMS switch ON only on a new command (acceptance criteria)

Date: 2026-10-29. Analyst. Process D-COMPACT (catalog format, ±50 ms, real inputs only).
Decision: SCENARIO_DECISIONS.md NIV-GAPS / **Q-C3-1 = Б** (Вадим 2026-10-29); DIGEST line Q-C3-1.
Niv gap #1 (PDF p.2–4, acceptance items 1–5). Related: Q-ARCH-01 (Emergency: C3/BMS OFF at once), catalog E-02/E-11/E-12.

## 1. Facts from canonical SAL (MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal, Network6; runtime polarity: "Make Contact (NO)" = negated)

- C3 `out_C3_BatRelay` = Network6/FBRs1.RsOut; BMS `out_RBM_Bat` = FBRs2.RsOut. RS is **reset-dominant** (sal-runtime safeRs).
- Gate G = `b_Step3 OR b_Step_RnD` (FBAnd1/FBAnd11 → FBOr1); `in_False_SI2_CH8` negated (always-FALSE tech input, Q-MU06-01).
- C3 Set = G AND `in_C3_Manual_Set` (FBAnd4/FBAnd8). BMS Set = (b_Step3 AND `in_RBM_Manual_Set`) OR (b_Step_RnD AND `in_RBM_Manual_Set`) (FBAnd6/FBAnd14 → FBOr4). Level-sensitive today.
- C3 Reset (FBOr3) = (b_Step3 AND `in_C3_Manual_Reset`) OR (b_Step_RnD AND `in_C3_Manual_Reset`) OR `b_C3_BetReset` (Network7 DecOut3, level while b_Step4 = Emergency chain) OR `b_C3_BetReset_2` (Network12 DecOut2 from `recRndC_SG`, level during R&D→Safe). BMS symmetric (FBOr2: `in_RBM_Manual_Reset`, `b_RBN_Bat_Reset`, `b_RBN_Bat_Reset_2`).
- Manual off input exists: `in_C3_Manual_Reset` / `in_RBM_Manual_Reset`. PLC (MAIN.TcPOU l.64–78) drives Set/Reset complementary from HMI toggle `BatRelay_CMD` / `BatBMS_Cmd`: CMD ON ⇒ Set=T, Reset=F; CMD OFF ⇒ Set=F, Reset=T. PLC unchanged (Q-C3-1).
- Gate continuity: b_Step_RnD set by `b_Step_RnD_Set` (R&D confirm, Network11) and `b_Step12_Set_2` (end Run→R&D); reset by `b_Step3_Set_2` (start StartingRun) which sets b_Step3 in the same scan; Run→R&D runs inside b_Step3. ⇒ G is TRUE continuously over R&D, R&D→Run/StartingRun, Run, Run→R&D. G is FALSE in Safe, Safe→R&D (`b_Step12`), Config, Emergency. During R&D→Safe G may still be TRUE but reset (recRndC_SG level) dominates.

## 2. Criteria

Notation: "cmd ON" = Set=T, Reset=F; "cmd OFF" = Set=F, Reset=T (PLC pairs). "New command" = FALSE→TRUE of Set while G=TRUE. "Held" = Set already TRUE when G becomes TRUE.

- CR-1 (Q-C3-1): C3 (BMS) goes ON only on a Set edge FALSE→TRUE that occurs while G=TRUE and no reset is active; ON within 50 ms of the edge (no timer on the path).
- CR-2 (Q-C3-1): a Set held TRUE from before G became TRUE (after Emergency, R&D→Safe, edge in Safe/Config/Safe→R&D, group start) never switches ON — not on R&D entry, not later in R&D, not in StartingRun/Run — until Set goes FALSE and then TRUE again with G=TRUE.
- CR-3 (unchanged): once ON, C3/BMS stay ON through R&D→Run→R&D (no drop at any transition scan).
- CR-4 (unchanged, Q-ARCH-01): Emergency (from R&D, Run, or any LV-on stage) ⇒ C3/BMS OFF within 50 ms; Set edges during Emergency chain/Emergency do not switch ON.
- CR-5 (unchanged): R&D→Safe ⇒ C3/BMS OFF at start of R&D→Safe (within 50 ms of down acceptance); Set edges during R&D→Safe do not switch ON (reset-dominant).
- CR-6 (unchanged): in Safe (and Config) cmd ON does not switch ON.
- CR-7 (unchanged): cmd OFF in R&D/Run ⇒ that output OFF within 50 ms.
- CR-8: C3 and BMS are independent: edge memory, Set, Reset and outputs of one do not affect the other.
- Forbidden: ON from a held command; ON at the R&D-confirm scan from a held command; ON at the scan Reset falls while Set stays TRUE; any C3/BMS change in the other channel; drop of C3/BMS during R&D↔Run.
- Invariant (catalog rule 5): exactly one main state in all rows.

## 3. Scenario rows (catalog format)

Start of every row: catalog rule 2 (group start → Emergency → green Restart → Safe), normal permits. "≥3 s OFF" = observed OFF for ≥3 s after the named moment (Niv item 2) and still OFF at end of window.

| ID | Исходно | События | Ожидается | Этап | Источник |
|---|---|---|---|---|---|
| C3-01 | R&D, C3+BMS ON (cmd ON given in R&D) | in_Estop_PLC (variant: ES_NC_1 FALSE); cmd stays ON | Emergency; C3 and BMS OFF ≤50 ms; LV discharge at once, C1 OFF 2 s | Q-C3-1 | Niv #1 item 1, Q-ARCH-01 (E-02) |
| C3-02 | after C3-01, cmd C3/BMS held ON | EStop OK, green Restart → Safe, BOTH → R&D | C3/BMS OFF ≥3 s after R&D status and stay OFF (no ON at R&D-confirm scan) | Q-C3-1 | Niv item 2, Q-C3-1 |
| C3-03 | R&D, C3+BMS ON | green 0.6 s (R&D→Safe), cmd held ON; in Safe BOTH → R&D | OFF ≤50 ms after down accepted; OFF in Safe; OFF ≥3 s after R&D status | Q-C3-1 | Niv item 3, Q-C3-1 |
| C3-04 | end of C3-02 (R&D, held ON, outputs OFF) | cmd OFF 200 ms, then cmd ON (both channels) | ON ≤50 ms after the new edge; before the edge OFF | Q-C3-1 | Niv item 4, Q-C3-1 |
| C3-05 | R&D, C3+BMS ON | BOTH → Run (confirmed), stay 2 s, green → Run→R&D → R&D | C3/BMS ON continuously, no OFF scan | Q-C3-1 | Niv item 4 (unchanged), Q-C3-1 |
| C3-06 | Safe, cmd OFF | cmd ON in Safe, hold 3 s | C3/BMS OFF ≥3 s | Q-C3-1 | Niv item 5 (unchanged) |
| C3-07 | end of C3-06 (Safe, cmd ON given in Safe, held) | BOTH → R&D; after 3 s cmd OFF 200 ms → cmd ON | OFF ≥3 s after R&D status; ON ≤50 ms after new edge | Q-C3-1 | Q-C3-1 «данной в R&D/Run» |
| C3-08 | Run (stable), cmd OFF, C3/BMS OFF | cmd ON | ON ≤50 ms | Q-C3-1 | Q-C3-1 «в R&D/Run» |
| C3-09 | end of C3-02 (R&D, held ON, outputs OFF) | BOTH → StartingRun → Run, cmd still held; after 3 s in Run cmd OFF 200 ms → cmd ON | OFF through StartingRun and ≥3 s in Run; ON ≤50 ms after new edge in Run | Q-C3-1 | Q-C3-1 (CR-2) |
| C3-10 | Safe, cmd OFF | BOTH → Safe→R&D; cmd ON at (a) 100 ms after rise accepted, (b) R&D status −50 ms; held | OFF ≥3 s after R&D status (edge was not in R&D) | Q-C3-1 | Q-C3-1 «данной в R&D/Run»; status still Safe (Q-LED-3a context) |
| C3-11 | Safe, cmd OFF | BOTH → R&D; cmd ON at R&D status +50 ms | ON ≤50 ms after edge | Q-C3-1 | Q-C3-1 (boundary pair with C3-10b) |
| C3-12 | R&D, cmd OFF both | C3 cmd ON only; after 1 s BMS cmd ON; after 1 s C3 cmd OFF | C3 ON, BMS OFF; then both ON; then C3 OFF, BMS stays ON | Q-C3-1 | CR-7, CR-8 |
| C3-13 | after C3-01: C3 cmd held ON, BMS cmd OFF in Safe | BOTH → R&D; BMS cmd ON at R&D +1 s | C3 OFF ≥3 s (held); BMS ON ≤50 ms after its edge; C3 unaffected | Q-C3-1 | CR-2, CR-8 |
| C3-14 | R&D, C3+BMS ON | green 0.6 s (R&D→Safe); during R&D→Safe cmd OFF 200 ms → cmd ON; reach Safe; BOTH → R&D (held) | OFF from down acceptance, OFF in Safe, OFF ≥3 s in R&D | Q-C3-1 | CR-5 (reset-dominant, recRndC_SG), CR-2 |
| C3-15 | Run, C3+BMS ON | ES_NC_1 FALSE; in Emergency chain cmd OFF 200 ms → cmd ON; EStop OK, Restart → Safe → BOTH → R&D (held) | OFF ≤50 ms; OFF in Emergency; OFF ≥3 s in R&D | Q-C3-1 | Q-ARCH-01 (CR-4), CR-2 |
| C3-16 | R&D, C3+BMS ON (variant: Run) | cmd OFF | OFF ≤50 ms | Q-C3-1 | reference FBAnd12/FBAnd3 (unchanged manual off) |
| C3-17 | group start with cmd ON from scan 0 | Emergency → Restart → Safe → BOTH → R&D | OFF ≥3 s after R&D status | Q-C3-1 | Q-C3-1 (held through Emergency; catalog rule 2) |
| C3-18 | end of C3-02 path but cmd OFF in Safe before rise | BOTH → R&D (cmd OFF); cmd ON at R&D +1 s | OFF until edge; ON ≤50 ms after edge | Q-C3-1 | Q-C3-1 |
| C3-19 | R&D, C3 OFF; non-PLC combination | Set=T while Reset=T (200 ms), then Reset=F with Set held | OFF throughout and ≥3 s after Reset falls | Q-C3-1 | Q-C3-1 literal (Set fires only on Set FALSE→TRUE); TD-safety; optional (PLC never produces) |

Total: 19 rows. All rows for C3; BMS checked symmetrically in the same run unless the row names one channel (C3-12, C3-13 asymmetric by design).

## 4. Determination notes / recommendations

- C3-10/C3-11: decision says the new command must be given "в R&D/Run"; during Safe→R&D status is still Safe and G=FALSE ⇒ no ON. Determined by text; consistent with safety-first.
- Edges during StartingRun and Run→R&D (not separate rows; G continuous): ON per unchanged gate. Recommendation (D-TEAM-DEFAULTS, analogy with unchanged gate); add as C3-08 variants if the tester wants.
- C3-19: literal reading of the decision; marked optional.
- Mutation suggestion for architect/tester (not analyst zone): "edge detector bypassed (level Set)" is killed by C3-02/C3-17.
- Open questions: none. BLOCKED: none.
