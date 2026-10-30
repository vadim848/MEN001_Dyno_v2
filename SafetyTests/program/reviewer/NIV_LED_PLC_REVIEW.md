# NIV-GAPS LED PLC review (Q-LED-1..4, 3a, 3b) — 2026-10-29

Object: uncommitted `MEN001_Dyno/PLC_Dyno/POUs/MAIN.TcPOU`, WC SHA256 f8ac897c346e1602ea467efe00a8f8550ee000ed62fdd69db3b0571798292754 (verified) vs HEAD 0293e21.
Normative: SCENARIO_DECISIONS.md NIV-GAPS (lines 2152-2163). Criteria: program/analyst/NIV_LED_TRUTH_TABLE.md. Tests: test/independent/act-led-control.{mjs,test.js}.
Mode: D-COMPACT, one pass, no mutation sweep.

## Verdict: ACCEPT WITH NOTES (program/text level only; not PLC Build, not runtime, not hardware)

## 1. Decisions vs diff
- Q-LED-4: red last ELSIF -> ELSE (MAIN.TcPOU:111). Other 3 combos unchanged. OK.
- Q-LED-1: `TransitionStep AND NOT Speps.step1` in green blink cond (:130) and t_BlinkTime selector (:142). OK, both places.
- Q-LED-3/3a/3b: blue IF (:117-127). OFF if RUN/CFG/EMG or NOT((SAFE AND step1) OR RND) -> covers 3a (SAFE, step1 FALSE) and 3b (no STS bit). ON if NOT DM OR SOL; else bPulse. Matches. NOT applies to the parenthesised expr; precedence correct.
- Q-LED-2: separate 200 ms TON pair + bFaultPulse modelled on bPulse (:154-157), override after all normal logic (:158-161), red not touched. OK.
- Nothing extra found. B12 (several STS bits): code gives RUN/CFG/EMG priority -> OFF; consistent with "Unlock запрещён", not a decided oracle.

## 2. Scope / bytes
- `git diff`: only VAR block (+3 decl + comment, :15-19) and act_LED_Control body. MAIN body, act_LogicMap, GUIDs, XML untouched.
- BOM EF BB BF kept; CRLF consistent (254 CR / 254 LF, ls-files i/lf w/crlf as other POUs); trailing `</TcPlcObject>` without final newline as before.
- No other writer of GVL_IO.Red/Green/BlueLED; act_LED_Control called once (MAIN.TcPOU:82), so the intermediate green/blue write before fault override is not visible on outputs.

## 3. ST syntax sanity (TwinCAT 3)
- IF/ELSIF/ELSE/END_IF balanced; semicolons present; `T#200MS` valid; TON call form identical to existing Pulse_*_TON; multi-line conditions fine.
- Identifiers exist: ST_TwinSAFE_IN.STS_SAFE/RND/RUN/EMG/CFG/FAULT, TransitionStep, EStop_Ok/Status; ST_Safety_Speps.step1; ST_TwinSAFE_OUT.DoorMonitor/SolenoedMonitor.
- Not proven: actual TwinCAT Build (Vadim's step).

## 4. Tests
- Run: `node --test test/independent/act-led-control.test.js` -> 46/46 pass.
- Guard extracts act_LED_Control CDATA from WC file and from 0293e21 and compares to TRANSCRIBED_ST (normalised) -> ST text is bound. JS scan bodies are a hand transcription; their equivalence to TRANSCRIBED_ST is checked by review only (I compared line by line: match, incl. ST order and pre-update bPulse semantics).
- Oracle: test rows are LED-R/G/B/F/T IDs from the truth table, with forbidden cases (blue in RUN/CFG/EMG, B4, fast green in Safe with step1, red HOLD, red changed by fault, green==blue), boundaries (TS rising scan; FP 199/200/201 ms at 1 ms cycle), contrast tests on original. B11 asserted, B12 observation only. Sufficient for these decisions.

## Findings
- N1 (low, analyst/Vadim): fault release in green HOLD states (G8/G9-HOLD, e.g. step1 AND NOT EStop_Ok AND DM, no Armed/RnD/step2). After STS_FAULT -> FALSE green keeps the last bFaultPulse value (random ON/OFF) because the green IF has no ELSE. F5 tests only non-HOLD states. Consequence of existing HOLD + new override; Q-LED-2 says "далее обычная индикация", HOLD is technically "normal". Not a blocker; record as known effect or ask Vadim.
- N2 (info): LED-G9 (A2) and B4-state reachability (A3) remain analyst notes; implementation follows literal decisions.
- N3 (info, known limit): SolenoedMonitor has no writer in PLC code -> "solenoid on" ON branch (B7/B10) never fires in real PLC; question with Vadim. Tests exercise it as an input only.
- N4 (info, known limit): replica != PLC execution; TON model is IEC-style approximation; Build/runtime and LED hardware not validated.
- N5 (info): A4 interpretation "200 ms per phase" (400 ms cycle) is by analogy with bPulse; matches Q-LED-2 wording "период переключения".

## Return
None blocking. N1 -> analyst (optional question to Vadim). Build -> Vadim.
