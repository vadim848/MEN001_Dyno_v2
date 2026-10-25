# S7 PLC-side code review (v2-reviewer, 2026-10-25)
Candidate: SafetyTests/candidates/S7/config (MANIFEST SHAs verified: MAIN d46ca5d5a779, DUT 9a7cb47a4481, tsproj f6d44505a932, TcVIS a0b8479496a2; bases match working canonical = HEAD 72e96a7; a5a8bd2..HEAD touches only Safety_Dyno.splcproj CRC). BOM/CRLF preserved (all lines CRLF).
Verdict: ACCEPT WITH NOTES (code review only; PLC Build 0 errors in IDE still required per 9A; no hardware claim).

Scope: only MAIN.TcPOU, ST_TwinSAFE_IN.TcDUT, Visualization.TcVIS, tsproj (4 DataType SubItem <Name> + 2 PlcTask Inputs links, VarB Out Var 89/90 unchanged). No Safety_Dyno/alias/target/hardware change. Heartbeat, EstopPLC, ErrACK etc. untouched (diff).
Rename (Q-ARCH-11 rev. B): LV/HV_Faulty linked raw (offs 152/160), LV/HV_Healthy := NOT *_Faulty (168/176, unlinked). Consumers: MAIN 2 lines, Visu 2 lamps -> polarity preserved. No residual old names in PLC_Dyno/tsproj; no other POU/GVL consumers.
ST logic: single nCmdState -> CMD_k := (nCmdState=k), never two TRUE; pulse 200 ms (+<=1 scan), gap 200 ms FALSE (clean edge for V14-Q11); enables per STS_* AND NOT Bypass; Bypass change only when nCmdState=0 and blocks presses in same scan -> CMD+Bypass (V14-Q8) not producible by PLC; Config ON only from STS_SAFE (checked at request and confirm), OFF always; no auto stop (7B); presses during pulse discarded (consistent with V14-Q14 "not deferred").
Compile risks: low (BOOL_TO_INT, TON named args, IF without trailing ';' as file style; writes to unlinked members of %I struct as before). No unused vars. E_SafetyState now unused (warning-free, kept).
TcVIS: XML parses; 34 new elements GenElemInst_125..158 (LastUsedIdForIdentifier=158), VisualElementId 160..193, 34 new unique identification GUIDs, no dup ids; all bindings resolve (MAIN.bHmi_*/bEn_*/bCfgPending, STS_*, Bypass_C1C2). Buttons use same Visu_ToggleInput pattern as existing buttons.

Findings (ranked):
N1 (minor, fix or IDE): last row Y=1670/1674 + h 70/62 = 1740 > new page Height 1700 -> 'Cover locked' row clipped. Raise Height (~1760) or move row. Background rectangle GenElemInst_95 stays 1280x1100 (new area outside it, cosmetic).
N2 (Vadim, decision 2): buttons not greyed ("Deactivate inputs" not set); PLC gating + enable lamps is functionally equivalent. Vadim to accept or set in IDE.
N3 (Vadim, decision 3): Config switch = request + CONFIRM button within 5 s instead of dialog; semantics match (level Bypass, edge entry). Confirm at offline HMI check.
N4 (design note): Toggle input + PLC clear-every-scan can lose a press if visu toggles a stale TRUE (never a spurious command). Alternative Tap + R_TRIG; optional.
N5 (IDE-only): new elements have empty LMGuids; IDE may regenerate VisualElementId/LM entries; rendering, page size, Toggle behaviour, tsproj mapping reload (no orphans) only confirmable in IDE.
Q3 (gap 200 ms, discard) and Q4 (STS_FAULT not gating) acceptable, follow from V14-Q11/Q14 and TwinSAFE ownership.
