# E4 (S4) — architect questions (2026-10-24)

The plan implements the recommendation of each item (team default per D-TEAM-DEFAULTS, to be reviewed by Vadim via the lead).
Items Q-E4-1 and Q-E4-5 change the PLC interface, so D-TEAM-DEFAULTS asks for Vadim's confirmation before transfer to canonical.

## Q-E4-1 — Status publication to the PLC (interface)
Catalog rule 4 observes "statuses for the PLC (Safe/R&D/Run/Emergency/Config, Fault, STS_COVER_LOCKED)". Today the PLC only gets the stage
bits (step1..6, stepRnD, Step12, EStop_Ok). Config has no carrier.
- **A (recommended):** 7 dedicated status outputs: STS_SAFE, STS_RND, STS_RUN, STS_EMG, STS_CFG (one-hot decoder, Emergency = complement,
  Q-RC-10), STS_COVER_LOCKED, STS_FAULT. Existing step outputs (out_Step*, outPLC_RnD, out_EStop_Ok_Plc) stay unchanged for MAIN/Visualization.
- B: only STS_CFG, STS_COVER_LOCKED, STS_FAULT are new; the PLC derives Safe/R&D/Run/Emergency from the step bits (the catalog stand
  cannot observe Config then: G rows need published STS_*).
- C: re-use out_Step4/5/6 for statuses (breaks the PLC meaning of Speps.step4..6).

## Q-E4-2 — PLC abort commands in a transition together with another command / with an active PLC error
V14-Q12 (CMD_RUN_TO_R&D in StartingRun) and V14-Q13 (CMD_R&D_TO_SAFE in Safe→R&D) are accepted in transitions. Q-RC-04: in transitions two
TRUE commands set no error. Undefined: is the abort edge executed when another command is TRUE at the same time, or while a PLC error
(latched earlier in a steady state) is still active?
- **A (recommended):** abort edge executed even with another command TRUE (down = safe direction, no error in transitions);
  ignored while the PLC error is active (one rule: "PLC error → all transition commands ignored", V14-Q8/Q10); ignored while a button is pressed (V14-Q14).
- B: abort also ignored when another command is TRUE (V14-Q8 "none executed" extended to transitions).
- C: abort executed always (also with PLC error).

## Q-E4-3 — Discharge requests at Config entry / exit
V14-Q18 lists only "HV Discharge → hold → C2/C1 OFF". Before entry, out_LV/HV_Discharge_Request may be TRUE in Safe (after R&D→Safe /
Run→R&D, Q-V7-01 level). Config switches C1+C2 ON.
- **A (recommended, analogy TD-01/Q-V7-01/R&D→Safe):** Config entry resets both discharge requests (as the up-steps do); exit sets HV Discharge at
  exit start (V14-Q18) and LV Discharge together with C1 OFF (as R&D→Safe); both requests then stay as levels in Safe.
- B: discharge requests untouched at entry; exit sets HV Discharge only (literal V14-Q18).

## Q-E4-4 — Heartbeat timeout reference point (V14-Q20)
- **A (recommended):** Emergency when the heartbeat level has not changed for 3 s (two Ton 3 s on TRUE and FALSE level). With a 0.5 s toggle
  this is 2.5…3.0 s after the first missed toggle. Before the first PLC toggle after group start the same rule applies (group starts in
  Emergency anyway; Restart possible only while the 3 s have not elapsed, afterwards Emergency again until toggling starts).
- B: 3 s counted from the first missed toggle (= 3.5 s without level change; needs a 3.5 s timer — not an approved value).
Catalog P-11 currently measures from the stop moment (lower bound ev+2950); under A the oracle must use the last level change.

## Q-E4-5 — Carrier of CMD_TRIGGER_EMERGENCY (interface naming)
v1.4 §8 allows aligning names with the existing convention. **A (recommended):** existing `in_Estop_PLC` (alias sds 54, PLC `stTwinSAFE_OUT.EstopPLC`)
is CMD_TRIGGER_EMERGENCY; no rename, no config change (V14-Q9 already met: FBEstop1 channel 3, latching, physical recovery).
B: rename the SAL variable / PLC field to CMD_TRIGGER_EMERGENCY (PLC + Visualization + tsproj link change, stand RAW0 change).
