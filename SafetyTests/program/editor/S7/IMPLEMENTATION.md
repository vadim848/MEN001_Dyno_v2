# S7 PLC side - implementation (editor self-check, not tester PASS)
Candidate: candidates/S7/config (see MANIFEST.md for SHAs). Base canonical a5a8bd2.

## HMI command one-shot (MAIN.act_LogicMap)
- Visualization buttons = Toggle inputs on MAIN.bHmi_SafeToRnD / bHmi_RnDToRun / bHmi_RunToRnD / bHmi_RnDToSafe. PLC reads and clears each every scan (press = rising event, consumed once).
- Single state nCmdState: 0 idle, 1..4 = pulse on CMD_SAFE_TO_RND / CMD_RND_TO_RUN / CMD_RUN_TO_RND / CMD_RND_TO_SAFE, 9 = dead time. CMD_* are written each scan as (nCmdState=k) -> structurally never two TRUE.
- Pulse: tonCmdPulse 200 ms (+<=1 scan, counted from the scan after the press), then dead time tonCmdGap 200 ms (so a following command has a clean rising edge), then idle. Presses during pulse/dead time are discarded (not queued). Two or more presses in the same scan are all discarded.
- Enable (also lamps bEn_*): SAFE_TO_RND = STS_SAFE; RND_TO_RUN = STS_RND; RUN_TO_RND = STS_RUN; RND_TO_SAFE = STS_RND; all AND NOT Bypass_C1C2 (CMD + Bypass is a TwinSAFE conflict, V14-Q8). STS_FAULT does not gate (TwinSAFE decides). No mid-pulse abort on status change (full 200 ms).
- EstopPLC / BatRelay / BMS / ErrACK / DoorMonitor / heartbeat (0.5 s) untouched. No automatic stop of the process (item 7B).

## Config switch with confirmation
- Two buttons: "Config: request" (bHmi_CfgReq) then "Config: CONFIRM" (bHmi_CfgConfirm) within 5 s (tonCfgConfirm; lamp "Confirm pending").
- Request when Bypass=FALSE: accepted only if STS_SAFE (pending=1 -> Bypass TRUE = Config entry on edge). Request when Bypass=TRUE: always accepted (pending=2 -> Bypass FALSE = exit; also allows clearing Bypass left TRUE after Emergency).
- Applied only if nCmdState=0 (no pulse/dead time) and, for ON, STS_SAFE still true. Request+confirm in same scan -> cancel. Confirm without pending -> ignored. Bypass is a level in stTwinSAFE_OUT.Bypass_C1C2 (no timer; not reset by PLC).
- Order in scan: pulse timers -> consume -> Config -> enables -> command start -> CMD outputs; so Bypass and CMD cannot both become active.

## Indicators (Visualization)
New area below the existing page (y>=1120): left column buttons + enable/Bypass/pending lamps+labels; right column mode lamps STS_SAFE, STS_RND, STS_RUN, STS_EMG, STS_CFG, STS_FAULT, STS_COVER_LOCKED. Existing step/E-stop/status elements kept.

## Healthy -> Faulty (item 6)
ST_TwinSAFE_IN: LV_Faulty/HV_Faulty (linked, raw), LV_Healthy/HV_Healthy (computed in act_LED_Control := NOT *_Faulty, unlinked). tsproj: struct subitem names + 2 links only. Visualization lamps keep showing the "Healthy" (computed) value. Texts unchanged.

## Self-check by reading / risks for IDE build
- No compiler: syntax read manually (BOOL_TO_INT, TON FB calls with named args, IF/ELSIF/END_IF without trailing ; as in file style).
- Risk R1: Visualization 34 new elements are copies; IDE may re-serialize; page size edit (Height 1700) unverified.
- Risk R2: Toggle input writes asynchronously vs PLC cycle: if PLC cleared a flag while visu writes, a press may be lost; double toggle (press while stale TRUE) is guarded by consume-every-scan.
- Risk R3: E_SafetyState.TcTLEO now unused (kept). n_SafeSate/b_PlcRequestActive removed - grep shows no other users (checked MAIN only; Visualization has none).
- Risk R4: tsproj subitem names changed: IDE may report unlinked variables for HV/LV_Healthy (expected: unlinked) - confirm no stale link to old names.
