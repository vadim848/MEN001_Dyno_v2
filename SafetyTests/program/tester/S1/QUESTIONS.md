# S1 open questions (v2-tester -> lead; 2026-10-23)

S1-Q1 (W-05, Q-V7-03) - abort by a qualified green inside the 500 ms C2 window is unreachable: BOTH is accepted while held,
the 2 s release pause (p.9) + 0.5 s green cannot fit before the window expires.
 Options: (a) abort by PLC CMD_RUN_TO_R&D edge (E4) inside the window; (b) abort by LV Healthy loss (non-discriminating:
 HealthyLost sets SafetyFault itself); (c) reword the row. Recommendation: (a). Test uses (a) and is marked TODO until confirmed.

S1-Q2 (U-02/U-03 precondition) - after group start -> Restart -> Safe (no previous descent) E2d has LV and HV discharge
requests FALSE in Safe / R&D. Is the request required ON in Safe (LV) and R&D (HV) right after boot?
 Options: (a) yes, active whenever the contactor is off (also after boot); (b) only after a descent (E2d behaviour).
 Recommendation: analyst checks reference 4495a1f first; if undetermined -> Vadim (it is a protection question).
 Tests are NOT blocked: U-02/U-03 build the precondition through a real descent (R&D->Safe / Run->R&D).

S1-Q3 (E-04/E-05/B-03) - Restart pressed after energy is removed but before the emergency chain completed
(E2d, R&D Emergency: C1 OFF at +2 s, chain Step4->5->6 ends ~+8 s; Restart at +2.5 s keeps Emergency and the press is lost).
 Options: (a) acceptable: Emergency until the chain completes, a new press is needed; (b) Restart must work as soon as SPEC §12
 conditions hold. Recommendation: (a) (conservative, no energy added). Tests restart >= 15 s after the event (assumption A11).

S1-Q4 (D-04, lead) - catalog stage E2 vs SOFTWARE_ACCEPTANCE_SCOPE PLC-006 (V14-Q13 assigned to E3/E4). E2d does not abort
Safe->R&D by green. Test keeps the catalog stage E2 -> FAIL on E2d. Confirm stage (S2 scope) or move the row.

S1-Q5 (lead) - SafetyFault parts of E2/E3 rows (H-02/03/05/06/07) are reported NOT VERIFIED while the target has no SafetyFault
symbol; from E5 rows absence is FAIL. Confirm the policy and give the E5 symbol names (or set CATALOG_SAFETYFAULT_SYMBOL /
CATALOG_FAULT_SYMBOL) when E5 starts.

S1-Q6 (lead) - the catalog tables contain 88 rows (K11 C10 E10 U9 D9 H7 W10 P12 G7 B3), the footer says 100.

Recorded assumptions (no question): U-09 uses connectors as the Safe permit (V14-Q7: cover is not a Safe->R&D permit) and the cover
for R&D (K-1); E-01 C1 OFF at 2 s from Q-ARCH-01 "as in Run"; E-05 adds the sub-case "C1_FBK still ON" (SPEC §12 feedback OFF).

S1-Q7 [CLOSED: (a) REC-ACCEPTED, lead 2026-10-23] (E-05 B2b, SPEC §12 / EMG6-01 / p.12) - Emergency, green pressed, a feedback goes ON while green is held, green released
with FBK ON (stays Emergency). When the FBK later goes OFF with no new press: may Emergency be left (deferred exit), or is a new
green press+release required? Decisions name only "green press+release resets FBEstop1" (p.12) and SPEC §12 conditions; no rule
on deferral. Options: (a) new press required (no deferred exit); (b) deferred exit allowed. Recommendation: (a) (no hidden
deferred action, analogous to V14-Q11/Q14). E2e observed: stays Emergency. Sub-assertion is TODO until answered.
