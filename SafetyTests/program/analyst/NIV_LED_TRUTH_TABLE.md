# NIV-GAPS LED truth table — `act_LED_Control` after Q-LED-1..4, 3a

Scope: PLC `MEN001_Dyno/PLC_Dyno/POUs/MAIN.TcPOU`, action `act_LED_Control` (lines 97-153 at HEAD 0293e21).
Normative source: `SafetyTests/SCENARIO_DECISIONS.md` section "NIV-GAPS" (Vadim 2026-10-29): Q-LED-1=Б, Q-LED-2=А, Q-LED-3=Б, Q-LED-3a=А, Q-LED-4=А.
"Current code" = action at HEAD 0293e21 (source for rows marked *unchanged*).

Notation: IN = `GVL_Safety.stTwinSAFE_IN`, OUT = `GVL_Safety.stTwinSAFE_OUT`, DM = OUT.DoorMonitor (TRUE = lid closed),
SOL = OUT.SolenoedMonitor, TS = IN.TransitionStep. BLINK = `bPulse`. FP = new 200 ms fault pulse.
`bPulse` toggles every `t_BlinkTime` (ON phase = OFF phase = t_BlinkTime, full period 2*t_BlinkTime; per current TON pair).
`bPulse` is shared by red, green and blue BLINK, so `t_BlinkTime` applies to all three.
HOLD = no branch matches, output keeps its previous value (existing IF without ELSE).

## 1. Blink period selector (Q-LED-1)

| ID | Condition | t_BlinkTime | Source |
|---|---|---|---|
| LED-T1 | IN.Speps.step2 = TRUE | 0.5 s | current code, unchanged |
| LED-T2 | TS AND NOT step1 | 0.5 s | Q-LED-1 |
| LED-T3 | TS AND step1 AND NOT step2 (Safe after R&D->Safe, TS still TRUE) | 1.5 s (was 0.5 s) | Q-LED-1 |
| LED-T4 | NOT step2 AND NOT TS | 1.5 s | current code, unchanged |

## 2. Red LED (Q-LED-4) — not affected by STS_FAULT

| ID | EStop_Ok | EStop_Status | RedLED | Source |
|---|---|---|---|---|
| LED-R1 | TRUE | TRUE | OFF | unchanged |
| LED-R2 | FALSE | TRUE | BLINK (bPulse, rate per LED-T*) | unchanged |
| LED-R3 | FALSE | FALSE | ON | unchanged |
| LED-R4 | TRUE | FALSE | ON (was HOLD) | Q-LED-4 (final ELSE) |
| LED-R5 | any, STS_FAULT TRUE | | same as R1..R4 | Q-LED-2 ("красный — по своей логике") |

## 3. Green LED (Q-LED-1), STS_FAULT = FALSE

Evaluation order as in current code; only TS is replaced by (TS AND NOT step1).

| ID | Inputs | GreenLED | t_BlinkTime | Source |
|---|---|---|---|---|
| LED-G1 | Power-up Safe: step1, EStop_Ok, DM, TS=FALSE | BLINK | 1.5 s | unchanged |
| LED-G2 | Safe after R&D->Safe: step1, EStop_Ok, DM, TS=TRUE | BLINK | 1.5 s (was 0.5) | Q-LED-1 |
| LED-G3 | Safe->R&D transition: TS=TRUE, step1=FALSE | BLINK | 0.5 s | Q-LED-1 (unchanged effect) |
| LED-G4 | R&D->Run transition: TS=TRUE, step1=FALSE | BLINK | 0.5 s | Q-LED-1 (unchanged effect) |
| LED-G5 | Run->R&D transition: TS=TRUE, step1=FALSE | BLINK | 0.5 s | Q-LED-1 (unchanged effect) |
| LED-G6 | blink cond FALSE AND (Safety_Armed OR stepRnD OR step2) | ON | per T* | unchanged |
| LED-G7 | blink/ON cond FALSE AND (step4 OR step5 OR step6 OR NOT DM) | OFF | per T* | unchanged |
| LED-G8 | none of G1..G7 | HOLD | — | unchanged (no ELSE) |
| LED-G9 | step1, TS=TRUE, (NOT EStop_Ok OR NOT DM), not Armed/RnD/step2 | G7 OFF if NOT DM, else HOLD (was BLINK via TS) | 1.5 s | consequence of Q-LED-1, see A2 |

Blink condition after Q-LED-1: `(step1 AND EStop_Ok AND DM) OR (TS AND NOT step1)`.

## 4. Blue LED (Q-LED-3 + 3a), STS_FAULT = FALSE

Replaces the whole current blue IF (incl. v2 inverted R&D logic 0feedf8/77546cb).

| ID | State / inputs | BlueLED | Source |
|---|---|---|---|
| LED-B1 | STS_RUN | OFF | Q-LED-3 |
| LED-B2 | STS_CFG | OFF | Q-LED-3 |
| LED-B3 | STS_EMG | OFF | Q-LED-3 |
| LED-B4 | Safe->R&D: STS_SAFE AND NOT step1 (any DM/SOL) | OFF | Q-LED-3a |
| LED-B5 | STS_SAFE AND step1, DM=TRUE, SOL=FALSE | BLINK (bPulse) | Q-LED-3 |
| LED-B6 | STS_SAFE AND step1, DM=FALSE (any SOL) | ON | Q-LED-3 |
| LED-B7 | STS_SAFE AND step1, SOL=TRUE (any DM) | ON | Q-LED-3 |
| LED-B8 | STS_RND, DM=TRUE, SOL=FALSE | BLINK (bPulse) | Q-LED-3 |
| LED-B9 | STS_RND, DM=FALSE (any SOL) | ON | Q-LED-3 |
| LED-B10 | STS_RND, SOL=TRUE (any DM) | ON | Q-LED-3 |
| LED-B11 | no STS_SAFE/RND/RUN/CFG/EMG bit TRUE | OFF | Q-LED-3b = А (Vadim 2026-10-29) |
| LED-B12 | >1 of STS_SAFE/RND/RUN/CFG/EMG TRUE | undecided, implementation-defined priority; natural reading: any of RUN/CFG/EMG -> OFF wins ("Unlock запрещён") | not decided |

Blue BLINK rate follows LED-T*: e.g. Safe idle 1.5 s; R&D idle 1.5 s.

## 5. Fault override (Q-LED-2)

| ID | Condition | Green | Blue | Red | Source |
|---|---|---|---|---|---|
| LED-F1 | STS_FAULT TRUE, any state (Safe/R&D/Run/Cfg/transition) | FP | NOT FP | per LED-R* | Q-LED-2 |
| LED-F2 | STS_FAULT TRUE AND STS_EMG TRUE | FP | NOT FP (overrides B3 OFF) | per LED-R* | Q-LED-2 ("включая Emergency") |
| LED-F3 | STS_FAULT TRUE, no STS bit (B11 case) | FP | NOT FP | per LED-R* | Q-LED-2 (all states) |
| LED-F4 | FP generator: each phase 200 ms; Green and Blue never equal while fault | — | — | — | Q-LED-2 |
| LED-F5 | STS_FAULT TRUE->FALSE | next scan: normal G*/B* indication | | | Q-LED-2 |
| LED-F6 | STS_FAULT from SafetyFault or V14-Q8 command conflict | identical (no cause distinction) | | | Q-LED-2 |

## 6. Acceptance criteria (independent tester)

1. Each row LED-R1..R5, LED-G1..G9, LED-B1..B10, LED-F1..F6, LED-T1..T4 has a test with explicit IN/OUT bits and expected output; BLINK checked as toggling with phase = expected t_BlinkTime (+-1 PLC cycle).
2. Boundaries: t_BlinkTime switch on the scan TS rises with step1 FALSE (0.5) vs step1 TRUE (1.5); FP phase 200 ms (check at 199/200/201 ms granularity of the task cycle).
3. Forbidden: blue ON/BLINK in RUN/CFG/EMG with STS_FAULT=FALSE; blue lit in Safe->R&D (B4); green fast blink (0.5 s) in Safe with step1 TRUE and step2 FALSE; red HOLD for Ok=TRUE/Status=FALSE; red changed by STS_FAULT; green==blue during fault.
4. LED-B11 asserted OFF (Q-LED-3b = А); LED-B12 not asserted as oracle (report observed priority only).
5. Unchanged rows (R1-R3, G1, G6-G8, T1, T4) must match current code at 0293e21.

## 7. Additional ambiguities (for lead / Vadim)

- A1 closed: Q-LED-3b = А (Vadim 2026-10-29), no STS bit -> blue OFF (LED-B11).
- A2 (new, minor): LED-G9. In Safe with step1 and TS TRUE but lid open or EStop not Ok, old code blinked green via TS; after Q-LED-1 it falls to OFF (lid open) or HOLD. Literal application of Q-LED-1; confirm acceptable or treat as implied by "как после первого включения".
- A3 (new): blue Safe/R&D classification uses STS bits while Safe->R&D uses `NOT step1`. A state with STS_SAFE, step1 FALSE and TS FALSE (if reachable, e.g. R&D->Safe descent ending) is shown OFF by B4. Reachability not analysed here.
- A4 (new, minor): Q-LED-2 says "период переключения 200 мс"; interpreted as each phase 200 ms (toggle every 200 ms, full cycle 400 ms), by analogy with bPulse (phase = t_BlinkTime).
- A5 (info): G8 HOLD and shared bPulse rate for red/blue are existing behaviour, not changed by decisions.
