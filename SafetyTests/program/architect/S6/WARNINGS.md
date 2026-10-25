# S6 close-out: 95 Verify "value from last update cycle" warnings (architect)

Input: program/lead/S6/VERIFY_RESULT_3.md (Vadim xlsx, canonical E6v, commit 0c1800e).
Canonical SAL 92093190...69ef, SGVL 27864ca3...5db1 (= candidates/E6v/native). Reference 4495a1f (git show, SAL c5f0c0ce...),
F1 fixture stand-f1-04b45456. Machine-readable: WARNINGS.json (per warning: producer/consumer FB.port, net, order, status,
first stage, plan block, safety path, extra delay, analysis, verdict). Tools: warn/map.mjs, dump.mjs, probe.mjs, targeted.mjs, classify.mjs.

## Mapping
- 95/95 mapped on canonical by FB instanceName (Verify uses instanceName, not SAL name): 72 WiredLink, 22 Variable,
  1 GVL (recRndC_L STATE_L.RsOut -> SNAP_0.DecIn4). Model backward wire+Symbol reads = 94 = Verify 94 (no extra, no missing).
  (Model also has 71 backward GVL-global reads; Verify reports only 1 of them - noted, not analysed further.)
- Stand semantics (program/stand/S6/LAST_CYCLE_SEMANTICS.md): consumer before producer reads previous-scan value -> all 88
  catalog scenarios already ran with these lags. Stand scanMs = 1 -> 1 scan = 1 ms on the stand; native EL6910 cycle time
  is not known here, so delays are stated in scans.

## Classification (matched by instanceName key AND by block Id, so E2a renames do not fake NEW)
- PRE-EXISTING 53: 20 in reference 4495a1f and F1, 33 in F1 only. ACCEPT (unchanged previous-scan reads; includes the
  reference output-stage pattern: FBRs1/2/3/4 resets, FBAnd37 -> FBEstop1.EStopIn3 and -> Set permits).
- NEW 42: E2a 3, E2b 3, E2c 1, E3 5, E4 19, E5 10, E6v 1 (HEALTHY_OK.AndIn4 = duplicate of AndIn3, zero delta).

## NEW on safety paths (all 42 reach STO/C1/C2/Emergency via the state machine); worst case and race analysis
| group | warnings | extra delay | wrong-state analysis |
|---|---|---|---|
| A PLC edge (E4) PK_PREV.DecOut1..5 -> PA_* | 6 | 0 (intentional) | edge memory: PA = CMD(k) AND NOT CMD(k-1); same-scan read would kill the edge. Do NOT reorder. |
| B Config (E4/E5) linkCfgAccept x4, linkCfgDone x2, CFG_EX/CFG_OFF -> discharge set, linkSafeUpScope, linkUpBlock, linkWdCfgFail | 11 | +1 | every consumer of a 1-scan pulse reads it in the same scan k+1 (Step1 reset + STATE_CFG set together; STATE_CFG reset + Step1 set together). Keep these consumers together: partial reorder would create a 0/2-state scan. UpBlock: SF and CFG edge in the same scan -> CFG accepted == legal order "CFG then fault 1 scan later". |
| C Run-down Network6 (E2a/E2b/E3/E4) | 11 | +1 (RD_SEQ start +2 incl. pre-existing) | RD_PROT_SET is a self-terminating 1-scan pulse by design; completion reset (FBAnd66 -> RD_RESET) keeps STO request 1 scan longer (conservative); owner/abort/descent permits lag only into conservative or OR-redundant directions; SS1_DR2 drop 1 scan after descent (DR1 same lag, pre-existing). |
| D EStop/Healthy (E2a/E2b/E4/E6v) | 5 | +1 / 0 | Emergency itself unchanged: FBEstop1 reads in_ES_NC_1/2 directly (EMG in scan 0). Only the Step4 request via FBAnd35/FBAnd12 follows 1 scan later, EMG already latched. G10_EXIT -> FBOr2 sets Step1 and resets FBRs17 in one scan. |
| E SafetyFault/watchdog (E5) | 8 | +1 / 0 | SF_ACK reads RELEASE(k-1) and SF(k-1) intentionally (first pressed scan after full release filter; NOT SF_SET same-scan). WDCx OK/FAIL decided in one scan by FBK (exclusive). linkWdEmg: WD loss -> EMG in 2 scans (1 NEW + 1 pre-existing FBAnd37 -> FBEstop1). |
| F R&D LV Healthy loss (E2c) HLT_LV -> GATE_030 | 1 | +1 | STATE_SG same scan, STATE_C (gesture-consume latch, not a main state) next scan; they coexist by design. |

Key property: a previous-scan read is a unit delay; a pulse is never lost (value persists until the producer re-writes),
so risk exists only at reconvergence of a delayed and an undelayed copy of one event. Every such point was reviewed above.

## Probes (stand semantics, canonical E6v)
- targeted.mjs (targeted.out.json; latency = scans after the input-change scan): WD C1/C2 FBK loss (level and 1-scan
  glitch) -> WD_EMG +0, EMG +2, glitch latched; Run HV/LV faulty 1-scan pulse -> RD_PROT_SET true 1 scan -> SafetyFault
  latched +1; R&D LV faulty pulse -> STATE_SG +0, STATE_C +1, SF +1, ends in Safe; EStop NC1 in Run -> EMG +0.
- probe.mjs (probe.<T>.out.json): 8 situations (Safe->R&D BOTH/PLC, R&D->Run BOTH, Run->R&D green/PLC, R&D->Safe PLC,
  steady R&D, steady Run) x 8 disturbances (EStop NC1, EStop PLC, Mentee EStop, InterLock NC1, LV/HV faulty, C1/C2 FBK loss)
  x level/1-scan pulse, injected at every scan e-1..e+1 around every stage/status/C1/C2/STO/discharge change of the
  undisturbed run (<=40 offsets): 2944 runs, all injected.
- Result: no "exactly one main state" violation, no C1/C2 rise or STO release after an Emergency-type event, Emergency
  latency physical/Mentee EStop +0, PLC EStop +1 (pre-existing FBAnd37 -> FBEstop1), Step4 entry <=+3.
- Out-of-scope observation (not ordering-related, identical in F1): Safe, green held, 1-scan EStop pulse, green release ->
  safeEstop Restart -> Safe (120/120 pulse runs of Safe->R&D BOTH). Same in F1 -> pre-existing Restart wiring/stand model; no energy, never R&D. For lead/analyst only if relevant.

## Verdict
95/95 ACCEPT (87 ACCEPT, 8 ACCEPT-intentional: PK_PREV x6, SF_ACK x2). No FIX, FB delta 0, no timer/hardware change.
Do not "fix" the intentional ones (would break edge detection) and do not reorder single consumers of linkCfgAccept/linkCfgDone.
Limits: stand model only (scanMs 1, catalog plant); native cycle time and native safeEstop/TON semantics not validated.
