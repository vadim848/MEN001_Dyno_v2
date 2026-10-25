# E5/E6 — open questions and technical decisions (architect, 2026-10-24)

## Q-E5-1 — blue press while SafetyFault is active (Unlock)
Initial state: Safe (or R&D), SafetyFault active, no active cause, both buttons released > 2 s, cover in any state.
Event: blue pressed 0.6 s. E6-Q2: «Нажатие любой физической кнопки … квитирует SafetyFault и потребляет попытку — само ничего не запускает»;
the only exception is green-down (Q-RC-07). Unlock is not a stage command, so it is unclear whether «ничего не запускает» covers it.
- А — blue only acknowledges, Unlock is NOT issued for this attempt (literal E6-Q2; +1 FB: STATE_BA.Set gated by !linkUpBlock).
- Б — blue acknowledges AND Unlock works as usual (Unlock is not «запуск»).
- В — blue does not acknowledge (only green/BOTH do).
Recommendation: **А** (literal E6-Q2, conservative). Plan state: Unlock path unchanged (= Б today) until the answer; ack works for blue.

## Technical decisions (TD, to the lead for the summary; not oracles)
- TD-E5-1 (Q-V7-03 scope): the 500 ms rise window runs on the continuous command ON. If the command is removed before expiry
  (abort Safe→R&D drops C1 at once) no rise failure is recorded; in a StartingRun abort C2 stays ON ≥ 1 s (hold), so the window
  expires and SafetyFault is set (W-05).
- TD-E5-2 (E6-Q2 «новая попытка»): a press acknowledges only as the first press after both buttons released 2 s (existing RELEASE);
  a press inside a running/pre-fault attempt does not acknowledge. Acknowledge is a one-scan pulse.
- TD-E5-3: in Emergency the button engine is disabled (GATE_001), so the Restart press does not acknowledge; SafetyFault survives
  Emergency→Safe and is acknowledged there (PLC keeps seeing STS_FAULT).
- TD-E5-4 (Q-V4-02 vs E6-Q1): FBK ON with command OFF is an OFF failure (Emergency at 500 ms) only if FBK has stayed ON since a
  commanded ON; FBK rising without a command is Q-V4-02 SafetyFault, only in steady Safe (C1, C2) and R&D (C2) with EStop OK
  (no reaction elsewhere, e.g. C2 FBK during Safe→R&D — up is blocked by existing ¬FBK guards).
- TD-E5-5 (Q-CA1-01/66(b)): 30 s counted from the first FBK ON inside Safe→R&D (Step12) / StartingRun (latched; dither does not restart).
- TD-E5-6 (Q-RC-06): Config rollback = existing Config exit sequence (HV Discharge at window end, 1 s hold, C1/C2 OFF, Safe).
