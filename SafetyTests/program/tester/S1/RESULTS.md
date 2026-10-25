# S1 catalog results (v2-tester, 2026-10-23)

Tests: `SafetyTests/test/catalog/*.test.js` (88 catalog rows + 12 mutations + header), helper `test/helpers/catalog-program.js`.
Oracle: SCENARIO_CATALOG.md rows + decisions in the source column (grep SCENARIO_DECISIONS by ID). Not derived from implementation.

## Targets

| Label | Dir | SAL SHA256 | SGVL SHA256 | FB | Status mode |
|---|---|---|---|---|---|
| F1 (canonical) | MEN001_Dyno/Safety_Dyno/TwinSafeGroup1 (+ ../GVLs/GVL1.sgvl) | 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 | dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104 | 242 | derived D2-A |
| E2d v7.7 | SafetyTests/candidates/E2d/native | c2f9ccd7a901e40f1ad5a3db780898c32b19180d6993528ce34afaffdb903689 | d845bd26331cfb166e13094c2a4c9cf9918252bb2cb34b6644acccc4c4564433 | 230 | derived D2-A |

## Reproduce (from SafetyTests/)

```
node --test test/catalog/*.test.js                                                     # F1, all stages  -> f1-all.tap
CATALOG_SAL_DIR=candidates/E2d/native node --test test/catalog/*.test.js               # E2d, all stages -> e2d-all.tap
CATALOG_SAL_DIR=candidates/E2d/native CATALOG_STAGES=E2 node --test test/catalog/*.test.js   # -> e2d-E2.tap
node program/tester/S1/summarize.mjs F1=program/tester/S1/f1-all.tap E2d=program/tester/S1/e2d-all.tap
```
Note: a directory argument (`node --test test/catalog/`) fails on Node 22 / Windows; use the glob (STAND_REQUESTS SR-1).

## Summary

- Rows per stage: E2 41, E3 13, E4 18, E5 5, E6 8, E7 3 (= 88; the catalog footer says 100 - see QUESTIONS S1-Q6); M 12.
- F1, all stages: 5 PASS (B-01, C-08, C-10, K-02, K-03), 83 FAIL, mutations 12 N/A (killing scenario fails on base).
  Main F1 cause: R&D never confirmed with raw LV FALSE (D-ARCH-POL defect N11/FBAnd4, fixed in E2) -> every R&D/Run precondition fails;
  plus invariant Step1+Step12 in one scan at Safe->R&D (K-01), cover in Safe/R&D, E-06, etc. Expected honest baseline.
- E2d, CATALOG_STAGES=E2: 37 PASS, 1 FAIL (D-04), 3 TODO (NV parts), mutations 11 killed, M-12 skipped (D-02 is E3).
- E2d, all stages: 42 rows PASS + 11 mutations killed, 43 FAIL (D-04 + E3/E4/E5/E6 rows not implemented), 3 TODO, M-12 N/A.
  E3 rows passing already on E2d: D-07, E-07. E7 rows passing on E2d: B-01, B-02, B-03.

### E2 FAIL on E2d
- D-04 (V14-Q13): Safe->R&D with LV Faulty held, new qualified green 0.55 s after a 2.1 s pause: no abort (C1 stays ON, no C1 OFF at +500),
  and the transition resumes to R&D when LV becomes normal. Stage of D-04: QUESTIONS S1-Q4.

### TODO / NOT VERIFIED on E2d (never counted as PASS)
- K-11: Config sub-case (no Config state before E4).
- H-05: SafetyFault part (no SafetyFault symbol before E5); R&D->Safe part PASS.
- E-08: reaction to an injected conflict not provocable with real inputs; per-scan invariant PASS over a full lifecycle.
- M-12: NOT ASSESSABLE (D-02 fails on base; DOWN-order guard exists only from E3).

### Mutations on E2d (killed by)
M-01 E-01, M-02 E-02, M-03 C-02 (via Emergency/stays-R&D checks), M-04 C-04, M-05 C-09, M-06 U-03, M-07 U-03 (precondition: C2 ON in R&D),
M-08 K-11 (Run sub-case), M-09 E-04, M-10 U-04 (precondition: Run at boot), M-11 H-01. Survivors: none. Locators are E2d paths,
checked against their expected source; see mutations.test.js (first attempt M-03/M-04 survived because the cover guard has
additional terms GATE_SPOIL_R and Network6/HEALTHY_OK; locators extended).
Coverage note: removing only the C2_FBK term of the Run confirmation is not detected by U-04 (FBK arrives 20 ms after C2 ON);
it is covered by W-02 (E6).

## Assumptions (stand conventions, not oracle)
A1 in_Safety_Run TRUE; in_False_SI2_CH8 FALSE constant. A2 plant: C1/C2_FBK follow commands after 20 ms (per test override, U-01 50 ms,
D-06 300 ms); STO_FBK = NOT STO one scan later. A3 raw Faulty FALSE = healthy (D-ARCH-POL), names per source. A4 1 ms scan.
A5 status: published STS_* if all four exist, else D2-A over Network3 stage RS outputs + b_EStop_Ok (both targets: D2-A).
A6 SafetyFault/Fault by symbol; absent -> NV in E2/E3 rows, FAIL in E5/E6 rows. A7 E4 symbols by name pattern (CATALOG_SYM_<KIND>);
absent -> FAIL "NOT IMPLEMENTED". A8 heartbeat (if declared) toggled every 500 ms. A9 invariant: <=1 stage RS and exactly one status per scan.
A10 bounds where the catalog gives no time: emergency chain completion 30 s; H-05 Safe within 3 s; W-09 SafetyFault within 1 s.
A11 Restart is issued >= 15 s after the emergency event with energy removed (chain end not observable at outputs; QUESTIONS S1-Q3).
Timing: acceptance moments +-50 ms (rule 3); button boundaries as "no at -50 / yes at +50" via the 0.4/0.6 s, 200/300 ms, 1.5/2.5 s rows.
Steady states are produced only by real gestures from the standard start (group start -> Emergency -> green -> Safe; BOTH -> R&D; BOTH -> Run).

## Per-ID table (F1 vs E2d, all stages)

| ID | Stage | F1 | E2d | Title |
|---|---|---|---|---|
| B-01 | E7 | PASS | PASS | group start -> Emergency; no energy |
| B-02 | E7 | FAIL | PASS | start with buttons pressed: release, then BOTH -> step up only after 2 s pause |
| B-03 | E7 | FAIL | PASS | restart from Run / transition: Restart -> only Safe, Run not restored |
| C-01 | E2 | FAIL | PASS | Safe, cover open: BOTH -> Safe->R&D executes |
| C-02 | E2 | FAIL | PASS | R&D, cover open: BOTH -> no R&D->Run, no fault |
| C-03 | E2 | FAIL | PASS | Safe / R&D: NC1 FALSE -> not Emergency; R&D->Run forbidden |
| C-04 | E2 | FAIL | PASS | Run: NC2 FALSE -> Emergency |
| C-05 | E2 | FAIL | PASS | StartingRun: NC1 FALSE -> Emergency |
| C-06 | E3 | FAIL | FAIL | normal Run->R&D (in SS1): NC1 FALSE -> descent continues to R&D |
| C-07 | E3 | FAIL | FAIL | abort StartingRun / protective descent: NC1 FALSE -> Emergency |
| C-08 | E2 | PASS | PASS | Safe: LV connector FALSE, then BOTH -> no step up, no fault |
| C-09 | E2 | FAIL | PASS | R&D / Run: HV connector FALSE -> Emergency |
| C-10 | E2 | PASS | PASS | Safe: Door_Monitor FALSE, blue 0.6 s -> no Unlock |
| D-01 | E3 | FAIL | FAIL | Run: green 0.5 s -> STO at 2 s; HV discharge command at 7 s; hold; C2 OFF; R&D after C2_FB |
| D-02 | E3 | FAIL | FAIL | Run->R&D: strict order STO < Discharge < C2 OFF, nothing simultaneous |
| D-03 | E3 | FAIL | FAIL | StartingRun: green 0.5 s -> abort: STO + Discharge at once, hold, C2 OFF, R&D; no SS1/coas |
| D-04 | E2 | FAIL | FAIL | Safe->R&D (C1 ON): green 0.5 s -> abort to Safe: C1 OFF, C1_FBK OFF |
| D-05 | E3 | FAIL | FAIL | Run->R&D in SS1: green again -> ignored |
| D-06 | E2 | FAIL | PASS | R&D: green 0.5 s -> C1 OFF; Safe after C1_FBK OFF |
| D-07 | E3 | FAIL | PASS | Run->R&D: HV discharge held as a level until the next accepted HV step up |
| D-08 | E2 | FAIL | PASS | Run->R&D waiting C2 OFF: LV lost, C2_FBK OFF 2 scans later -> exactly R&D, then chained R& |
| D-09 | E3 | FAIL | FAIL | StartingRun: LV Healthy lost -> abort to R&D, then R&D->Safe |
| E-01 | E2 | FAIL | PASS | Run: EStop NC1 -> Emergency; STO, C2 OFF, C1 OFF by the emergency chain |
| E-02 | E2 | FAIL | PASS | R&D: in_Estop_PLC -> Emergency; C3/BMS OFF + LV discharge at once, C1 OFF after 2 s |
| E-03 | E2 | FAIL | PASS | Safe->R&D (C1 ON, not confirmed): Mentee -> Emergency; lift stopped, C1 OFF after 2 s |
| E-04 | E2 | FAIL | PASS | Emergency by PLC: cause removed, green -> only Safe |
| E-05 | E2 | FAIL | PASS | Emergency, cause still active, green -> stays Emergency |
| E-06 | E2 | FAIL | PASS | group start with C1_FBK ON: Restart -> not Safe |
| E-07 | E3 | FAIL | PASS | normal Run->R&D, EStop at t+1 s: each step (STO, Discharge, C2 OFF) not later than normal |
| E-08 | E2 | FAIL | TODO | no two main states at once / none -> Emergency (invariant over a full lifecycle) |
| E-09 | E6 | FAIL | FAIL | Run: C2_FBK lost after the 500 ms window with command ON -> Emergency |
| E-10 | E6 | FAIL | FAIL | Run->R&D: C2_FBK ON > 500 ms after C2 OFF command -> Emergency |
| G-01 | E4 | FAIL | FAIL | Safe, cover closed: Bypass edge -> Config: C1+C2 ON, STO held, Unlock forbidden |
| G-02 | E4 | FAIL | FAIL | R&D / Safe with open cover / Bypass held from before -> Bypass ignored |
| G-03 | E4 | FAIL | FAIL | Config: any buttons / PLC commands ignored; no 10 s timer |
| G-04 | E4 | FAIL | FAIL | Config: Bypass removed -> Discharge -> hold -> C1/C2 OFF -> Safe |
| G-05 | E4 | FAIL | FAIL | Config / Config exit: NC1 / EStop / connector -> Emergency |
| G-06 | E4 | FAIL | FAIL | Config: Healthy lost -> ignored |
| G-07 | E6 | FAIL | FAIL | entering Config: C2_FBK not ON within 500 ms -> rollback to Safe; SafetyFault |
| H-01 | E2 | FAIL | PASS | raw in_LV_Faulty_FBK FALSE = normal, TRUE = loss (same everywhere) |
| H-02 | E3 | FAIL | FAIL | Run: HV Faulty TRUE -> immediate STO, coast 5 s, Discharge, C2 OFF, R&D; SafetyFault |
| H-03 | E3 | FAIL | FAIL | Run: LV Faulty TRUE -> as H-02, then R&D->Safe; SafetyFault |
| H-04 | E2 | FAIL | PASS | R&D: HV Faulty TRUE / FALSE -> ignored |
| H-05 | E2 | FAIL | TODO | R&D: LV Faulty TRUE -> R&D->Safe; SafetyFault |
| H-06 | E3 | FAIL | FAIL | Run->R&D in SS1: LV Faulty TRUE -> immediate STO; then R&D->Safe; SafetyFault |
| H-07 | E3 | FAIL | FAIL | Run->R&D after STO: LV Faulty TRUE then back -> stop unchanged; R&D->Safe anyway |
| catalog | HDR | PASS | PASS | target identity |
| K-01 | E2 | FAIL | PASS | Safe: BOTH (second after 200 ms), hold 1 s -> Safe->R&D starts |
| K-02 | E2 | PASS | PASS | Safe: second button after 300 ms -> no step up, no fault |
| K-03 | E2 | PASS | PASS | Safe: BOTH, release one after 0.8 s -> nothing (no single, no step up) |
| K-04 | E2 | FAIL | PASS | R&D: green 0.4 s -> nothing; green 0.6 s -> R&D->Safe |
| K-05 | E2 | FAIL | PASS | R&D: green, blue exactly 500 ms later -> only down, no step up |
| K-06 | E2 | FAIL | PASS | R&D: green, blue 300 ms later (before acceptance) -> nothing, no fault |
| K-07 | E2 | FAIL | PASS | BOTH held without release -> exactly one step up |
| K-08 | E2 | FAIL | PASS | Safe: BOTH, release; new BOTH 1.5 s / 2.5 s after release -> 1.5 no, 2.5 yes |
| K-09 | E2 | FAIL | PASS | Safe: permit lost 300 ms with buttons released, BOTH 2.1 s after release -> accepted |
| K-10 | E2 | FAIL | PASS | Run: BOTH -> ignored |
| K-11 | E2 | FAIL | TODO | blue 0.6 s: Unlock in Safe and R&D (cover closed / open); not in Run/Config/Emergency |
| M-01 | M | N/A | PASS | EStop NC1/NC2 condition removed (all consumers read OK) (killing scenario E-01) |
| M-02 | M | N/A | PASS | in_Estop_PLC condition removed (all consumers read FALSE) (killing scenario E-02) |
| M-03 | M | N/A | PASS | NC1&NC2 removed from the HV step up (recognizer, spoil, C2/STO set permits) (killing scena |
| M-04 | M | N/A | PASS | cover (NC) removed from the Run guards (emergency and Run hold) (killing scenario C-04) |
| M-05 | M | N/A | PASS | LV/HV connector condition removed (all consumers read OK) (killing scenario C-09) |
| M-06 | M | N/A | PASS | STO released without an accepted step up (lift term removed from STO set) (killing scenari |
| M-07 | M | N/A | PASS | C2 ON without an accepted step up (lift term removed from C2 set) (killing scenario U-03) |
| M-08 | M | N/A | PASS | Unlock stage term removed (Unlock no longer restricted to Safe/R&D) (killing scenario K-11 |
| M-09 | M | N/A | PASS | emergency no longer clears Run / R&D (Restart not only into Safe) (killing scenario E-04) |
| M-10 | M | N/A | PASS | Run confirmation without the C2 window and C2_FBK (killing scenario U-04) |
| M-11 | M | N/A | PASS | LV Faulty polarity inverted at every guard consumer (killing scenario H-01) |
| M-12 | M | N/A | N/A | DOWN order STO<Discharge<C2 OFF removed (killing scenario D-02) |
| P-01 | E4 | FAIL | FAIL | Safe: edge CMD_SAFE_TO_R&D -> as BOTH (cover may be open) |
| P-02 | E4 | FAIL | FAIL | R&D, cover open: edge CMD_R&D_TO_RUN -> not executed |
| P-03 | E4 | FAIL | FAIL | Run: edge CMD_RUN_TO_R&D -> as green (D-01) |
| P-04 | E4 | FAIL | FAIL | StartingRun: edge CMD_RUN_TO_R&D -> abort (as D-03) |
| P-05 | E4 | FAIL | FAIL | Safe->R&D: edge CMD_R&D_TO_SAFE -> abort to Safe |
| P-06 | E4 | FAIL | FAIL | Safe->R&D: CMD_R&D_TO_RUN held until R&D -> not executed (new edge needed) |
| P-07 | E4 | FAIL | FAIL | R&D: two commands TRUE (incl. different edges) -> error, none executed; cleared after all  |
| P-08 | E4 | FAIL | FAIL | any state with PLC error: CMD_TRIGGER_EMERGENCY -> Emergency |
| P-09 | E4 | FAIL | FAIL | R&D, green pressed 200 ms: command edge -> ignored and not deferred |
| P-10 | E4 | FAIL | FAIL | PLC error active: BOTH by buttons -> executed |
| P-11 | E4 | FAIL | FAIL | any state: heartbeat stopped 3 s -> Emergency |
| P-12 | E4 | FAIL | FAIL | STS_COVER_LOCKED = NC1&NC2; outPLC_RnD TRUE in StartingRun/abort, FALSE in Safe->R&D |
| U-01 | E2 | FAIL | PASS | Safe: BOTH; C1_FBK after 50 ms -> R&D not before C1 command + 500 + 100 ms |
| U-02 | E2 | FAIL | PASS | Safe: BOTH -> LV discharge removed at acceptance |
| U-03 | E2 | FAIL | PASS | R&D: BOTH -> at acceptance C2 ON, STO released, HV discharge removed |
| U-04 | E2 | FAIL | PASS | StartingRun: C2_FBK + HV normal -> Run not before command + 600 ms |
| U-05 | E2 | FAIL | PASS | StartingRun: HV normal drops 30 ms after the window -> 100 ms count restarts, no emergency |
| U-06 | E2 | FAIL | PASS | Safe: LV Faulty before the gesture, BOTH -> Safe->R&D starts |
| U-07 | E2 | FAIL | PASS | BOTH started during Safe->R&D / StartingRun is not executed after arrival |
| U-08 | E2 | FAIL | PASS | R&D: legacy PLC (1,1) -> no R&D->Run |
| U-09 | E2 | FAIL | PASS | Safe: connector lost between first and second button -> gesture rejected |
| W-01 | E6 | FAIL | FAIL | Safe->R&D: C1_FBK not ON within 500 ms -> rollback to Safe; SafetyFault |
| W-02 | E6 | FAIL | FAIL | StartingRun: C2_FBK not ON within 500 ms -> abort to R&D; SafetyFault |
| W-03 | E6 | FAIL | FAIL | StartingRun: HV normal not confirmed for 30 s (blinking) -> rollback to R&D at 30 s; Safet |
| W-04 | E6 | FAIL | FAIL | Safe->R&D: LV normal not confirmed for 30 s -> rollback to Safe; SafetyFault |
| W-05 | E6 | FAIL | FAIL | StartingRun: abort, then the 500 ms window expires without FBK -> SafetyFault anyway |
| W-06 | E5 | FAIL | FAIL | Safe with SafetyFault: BOTH only acknowledges; new BOTH after 2 s -> step up |
| W-07 | E5 | FAIL | FAIL | R&D with SafetyFault: green 0.5 s -> acknowledges and descends to Safe |
| W-08 | E5 | FAIL | FAIL | R&D with SafetyFault: PLC command -> does not acknowledge |
| W-09 | E5 | FAIL | FAIL | Safe: C1_FBK ON without command -> SafetyFault; step up forbidden until FBK OFF; press whi |
| W-10 | E5 | FAIL | FAIL | any error -> one PLC Fault bit = PLC command error OR SafetyFault |

F1: {"PASS":6,"FAIL":83,"N/A":12}

E2d: {"PASS":54,"FAIL":43,"TODO":3,"N/A":1}

## S2 review additions (B1, B2) - 2026-10-23

- D-08 + sub-case B1 (Q-RC-16, E2-Q1 race): at the C2 OFF command, C2_FBK held ON, LV Faulty TRUE 2 ms then FALSE, then C2_FBK OFF
  -> R&D, then chained R&D->Safe. E-05 + sub-cases B2 (SPEC §12, EMG6-01): Emergency entered from Safe (in_Estop_PLC), then
  (a) C1_FBK / C2_FBK ON at Restart -> status never Safe; (b) FBK goes ON while green is held, released with FBK ON -> stays Emergency.
  "Exit after FBK OFF without a new press" is TODO (QUESTIONS S1-Q7; E2e observed: stays Emergency).
- E2d c2f9ccd7 (e2d-B1B2.tap): D-08 FAIL (B1: status stays R&D, no chained R&D->Safe), E-05 FAIL (B2 a+b, C1 and C2).
- Mutations M-B1 (deactivate //SafeResumption/HLT_LV_SRC/OrIn2) and M-B2 (unlink in_LV_C1_FBK/in_HV_C2_FBK from //Network1/FBK_OFF/*),
  added to mutations.test.js: both killed on E2e (by D-08 B1, E-05 B2).
- E2e 67336d9b42aed3c14925dfbfec3e4e7533c4bf96b0d0183a13cea31ea785dd39 (SGVL 4d68adb3...), CATALOG_STAGES=E2 (e2e-E2.tap):
  41 E2 rows: 37 PASS + 4 TODO (E-05 S1-Q7 part, E-08, H-05 SafetyFault, K-11 Config), 0 FAIL; mutations 13/13 killed (M-12 skipped, E3).
  Command: `CATALOG_SAL_DIR=candidates/E2e/native CATALOG_STAGES=E2 node --test test/catalog/*.test.js`
- summarize.mjs: accepts `label=file.tap` or a plain path; usage/missing-file errors instead of TypeError.

## Final E2e run (2026-10-23, after S1-Q7 REC-ACCEPTED)
- E-05 B2b "no deferred exit after FBK OFF without a new press" is now normative (source REC-ACCEPTED (тестировщик, S1-Q7)).
- E2e 67336d9b…, CATALOG_STAGES=E2 (e2e-final-E2.tap): 38 E2 rows PASS, 3 TODO (E-08, H-05, K-11), 0 FAIL; mutations 13 killed.
- E2e all stages (e2e-final-all.tap): 57 pass (incl. header + 13 mutations), 42 FAIL (E3/E4/E5/E6 rows), 3 TODO, M-12 N/A.
  Versus program/runs/S2-E2e-r2/all.tap: same status for every catalog row; only M-B1 and M-B2 added (both killed).
- E2d (e2d-B1B2.tap): D-08 and E-05 still FAIL.

## S3 (E3) test changes - 2026-10-24
- D-03: abort end per TD-14 (R_end = C2 OFF & C2_FBK OFF & STO; REC-ACCEPTED D-03 oracle) instead of first R&D status; added
  "ends in R&D with C1 ON, main state R&D throughout" (V14-Q12) and "blue 0.6 s in StartingRun: no Unlock" (Q-E3-1).
  "No Unlock during the abort" (Q-E3-1) is checked only if the abort outlasts the 2 s release pause + 0.6 s; on E3 the abort
  (~1 s hold, A-E3-1) is shorter, so that part is not reachable by buttons (not counted, no NV).
- D-09: R_end includes STO; added "C1 stays ON until the abort ends" (Q-ARCH-03, TD-14).
- M-12 locator (E3): deactivate //Network6/RD_DIS/AndIn2 (RD_T_COAST) + //Network6/DN_C2/AndIn2 (DN_T_HOLD).
- canonical E2 67336d9b, CATALOG_STAGES=E2,E3 (canon-E2E3.tap): all E2 rows PASS (3 TODO), 11 E3 rows FAIL (C-06, C-07, D-01,
  D-02, D-03, D-05, D-09, H-02, H-03, H-06, H-07), D-07/E-07 PASS; M-12 N/A.
- E3 candidate 9ee66e78…, CATALOG_STAGES=E2,E3 (e3-E2E3.tap): 0 FAIL; TODO = E-08, K-11, H-05 + SafetyFault parts of H-02/03/06/07
  (no SafetyFault symbol before E5); 14/14 mutations killed incl. M-12.

## S3 review additions T1..T5 - 2026-10-24
- T1 D-01 SS1 requested at a+-50 before STO (A12: out_SS1_DRx FALSE = SS1 requested); T2 H-03 LV 200 ms in Run -> Safe (Q-RC-16);
  T3 C-07 LV lost in SS1 then NC1 -> Emergency (Q-RC-15, Q-RC-17(3)); T4 H-07 LV blip after STO then NC1 -> no Emergency, Safe
  (Q-RC-09, Q-RC-03 b1, Q-RC-16); T5 E-07 after Emergency in descent: Restart -> Safe, BOTH -> R&D, BOTH -> Run.
- Mutations M-T1..M-T5 (reviewer probe3 locators) in mutations.test.js: all killed on E3 9ee66e78.
- E3 final: e3-final-E2E3.tap 0 FAIL, 7 TODO, 19/19 mutations killed; e3-final-all.tap 31 FAIL (E4/E5/E6 rows only), 7 TODO.

## S4 (E4) test changes - 2026-10-24
- Bindings (env-overridable): CMD_SAFE_TO_RND / CMD_RND_TO_RUN / CMD_RUN_TO_RND / CMD_RND_TO_SAFE, in_PLC_Heartbeat, inPLC_BypassC1C2,
  CMD_TRIGGER_EMERGENCY -> in_Estop_PLC when no dedicated symbol (Q-E4-5 A, pending Vadim), STS_SAFE/RND/RUN/EMG/CFG (published mode),
  STS_COVER_LOCKED, STS_FAULT (PLC Fault bit, Q-E4-1 A pending Vadim). STS_FAULT is no longer read as SafetyFault (S1-Q5): SafetyFault
  parts stay NOT VERIFIED until E5; W-10 checks Fault = PLC error OR SafetyFault.
- Heartbeat plant toggles every 500 ms when the target declares it; P-11 measured from the last level change, 3000+-50 ms (Q-E4-4 A).
- New sub-cases: P-04 abort edge with another command TRUE executed / ignored while PLC error active (Q-E4-2 A); P-05 CMD_R&D_TO_SAFE in
  steady R&D = normal step down; P-06 CMD_R&D_TO_RUN edge during Safe->R&D and R&D->Safe ignored, not deferred (V14-Q11, Q-RC-08);
  G-01 Config entry resets both discharge requests, G-04 HV discharge at exit start and LV discharge with C1 OFF (Q-E4-3 A).
- canonical E3 9ee66e78, all stages (canon-e3-all.tap): 70 pass (incl. 19 [M]), 31 FAIL = E4/E5/E6 rows only, 7 TODO - unchanged vs e3-final-all.
- candidates/E4/native: not present at the time of this run.

## S4 review F2 additions - 2026-10-24
- G-05: Config + EStop: LV discharge at once, C1 OFF at 2000+-50, all energy removed, then Restart -> only Safe (Q-ARCH-01, EMG6-01).
  G-02: Bypass edge refused with green / blue pressed, PLC error active, LV connector lost (Q-RC-05 b, V14-Q14).
  P-05: CMD_R&D_TO_SAFE ignored in StartingRun (Q-RC-08 2). P-06: held SAFE_TO_RND / RND_TO_SAFE / RUN_TO_RND never executed (V14-Q11).
  P-09: edge during a pressed button ignored for all four commands incl. both aborts (V14-Q14, Q-E4-2 A). P-07: Bypass TRUE keeps the
  PLC error; cleared 1 s after Bypass FALSE (Q-RC-18a, V14-Q10).
- [M] M-P1, M-P4..M-P13 (11, reviewer locators): all killed on E4 4ee8d3d9. Not added: PA_CFG.AndIn5 (linkSafeUpScope) and
  PA_CFG.AndIn7 (out_ReadyForStep2) survive: with real inputs every loss of their terms either also clears the Safe status (EStop,
  in_Estop_PLC, connector via another term) or is not a decision-backed Config condition (STO feedback); no oracle without invention.
- E4 all stages (e4-final-all.tap, CATALOG_SYM_TRIGGER_EMG=in_Estop_PLC): 100 pass (incl. 30 [M] killed, M-12 killed), 13 FAIL = E5/E6
  rows only, 6 TODO (E-08, SafetyFault parts H-02/03/05/06/07). canonical E3 (canon-e3-final.tap): 70 pass / 31 FAIL / 18 TODO - catalog
  rows unchanged vs canon-e3-all; new [M] N/A there (killing scenarios fail on E3).

## S5 (E5/E6) test changes - 2026-10-24
- SafetyFault = linkSafetyFault (pattern /safety_?fault/i or CATALOG_SAFETYFAULT_SYMBOL); absent -> NV in E2/E3/E4 rows, FAIL in E5/E6 rows.
- Fixed: W-03/W-04 tf taken after the plant FBK arrives; G-07 oracle = normal Config exit (HV discharge at C2 ON+500, hold, C2 OFF, Safe,
  SafetyFault; Q-RC-06, TD-E5-6). Q-E4-5 comment updated (answered A).
- New sub-cases: W-06 blue only acks, no Unlock (Q-E5-1); ack needs 2 s release (TD-E5-2); Restart does not ack (TD-E5-3); Config refused
  while SafetyFault (Q-RC-05b). W-05 abort Safe->R&D before expiry -> no SafetyFault (TD-E5-1). W-09 C2_FBK spontaneous in R&D (TD-E5-4).
  E-09 C1_FBK loss in R&D; E-10 C1 OFF failure in R&D->Safe and Config exit with C2_FBK stuck ON (E6-Q1, S4-F3a; moved from G-04 because
  it is E6 behaviour). D-09 LV loss in StartingRun sets SafetyFault (NV until E5).
- canonical E4 4ee8d3d9 (canon-e4-all.tap, before moving the stuck-FBK case): 98 pass / 14 FAIL / 7 TODO; the only non-E5/E6 FAIL was that
  G-04 sub-case, now in E-10 (G-04 PASS, E-10 FAIL as E6). D-09 TODO (SafetyFault NV). candidates/E5/native not present yet.

## E5 final - 2026-10-24
- E-10 C1 case fixed (FBK pinned ON before the OFF command, measured from the actual C1 fall; E6-Q1, TD-E5-4) + Q-V4-02 counterpart
  (C1_FBK rising in steady Safe -> SafetyFault, no Emergency). D-09 SafetyFault checked before the abort reaches R&D (discriminates
  from the R&D LV-loss cause). Mutations: a missing guard with NOT VERIFIED base parts is NOT ASSESSABLE (todo), otherwise FAIL.
- [M] M-S1..M-S6 (E5 plan §6 survivors: WD_EMG.OrIn1/OrIn3, SF_SET.OrIn4/OrIn6, PA_CFG.AndIn8, SF_ACK.AndIn2): all killed on E5.
- E5 4c4be64b (first final run): 123 pass (36 [M] killed), 0 FAIL, 2 TODO (E-08 reaction, W-05 S1-Q1) - superseded below.
- canonical E4 (canon-e4-final.tap): 99 pass / 13 FAIL (E5/E6 rows only) / 13 TODO; no E2-E4 regression.
- Update (W-05 normative after S1-Q1 A / D-S2-ACCEPT; S5 review N1: G-07 C1 sub-case + [M] M-S7 WD_FAIL_ANY.OrIn1):
  E5 4c4be64b e5-final-all.tap = 125 pass (37 [M] killed), 0 FAIL, 1 TODO (E-08 reaction not provocable by real inputs).

## S6 - gate mutations M1..M8 on E6v 92093190 (2026-10-24; s6-gate.mjs, outputs s6-gate-*.out)
| M | Mutation | Input-rule check | Catalog |
|---|---|---|---|
| M1 | S6_G_R2RUN.AndIn1 deactivated | 1 error | KILLED (W-08; also P rows) -> [M] M-G1 |
| M2 | S6_G_HB.AndIn1 inverted | 0 | SURVIVED - equivalent: inverted heartbeat still changes level every 0.5 s (Q-E4-4 A is level-change based) |
| M3 | S6_TRUE as safeAnd (FALSE) | 0 | KILLED (W-10, all gated commands dead); not added ([M] op for function change not cheap) |
| M4 | S6_TRUE.OrIn2 NC (OR(x,x)=NC1) | 0 | SURVIVED - commands masked only while in_ES_NC_1 FALSE = Emergency, where transition commands have no effect; no real-input oracle |
| M5 | S6_G_* moved after PK_PREV | 0 | KILLED (W-10, edge timing); not added (order op not cheap) |
| M6 | HB_LO.AndIn2 inverted | 0 | KILLED (P-11) -> [M] M-G6 |
| M7 | HEALTHY_OK.AndIn4 inverted | 0 | KILLED (P-03 precondition: Run not held) -> [M] M-G7 |
| M8 | PK_PREV.DecIn4 <- V:CMD_RND_TO_SAFE | 1 error | caught by the input-rule check only (behaviour identical) |
M-G1/M-G6/M-G7 have since:'S6' - NOT ASSESSABLE (todo) on targets without the S6 gates (canonical E5).

## Q-S6-2 - E6w 9e5bfb15 (2026-10-25; q62-gate.mjs, outputs q62-*.out)
- E-05 sub-case (Q-S6-2 A, Vadim): green held from Safe, 1-scan EStop NC1 / in_Estop_PLC pulse -> Emergency; release -> stays Emergency;
  new press+release after the chain -> Safe. Canonical E6v 92093190: FAIL (canon-e6v-qs62.tap 126/1/2); E6w: PASS.
- Gate mutations: M62-1 (Restart <- in_Reset_PB) KILLED E-05; M62-2 KILLED E-05; M62-3 KILLED (boot Restart lost); M62-4 KILLED E-05;
  M62-5 KILLED E-05; M62-7 (Q62_RST after FBEstop1) KILLED (boot Restart lost); M62-6 (Q62_BLK before FBEstop1, reads b_EStop_Ok one
  scan stale) SURVIVED - corrected (reviewer S6Q62 Note 1): the stale EStop OK=1 BLOCKS a green press that starts exactly on the
  Emergency-onset scan (the design counts it as a press in Emergency). Stricter than the design by one scan, never accepts a Restart
  Q-S6-2 forbids; scan-exact, outside the catalog +-50 ms rule; acceptable (conservative).
- [M] M-Q2..M-Q5 added (since S6-Q62). e6w-final-all.tap: 132 pass (44 [M] killed incl. M-B2), 0 FAIL, 1 TODO (E-08).
