# E6w (Q-S6-2 A) implementation - editor self-check, not tester PASS
Plan: architect/S6 PLAN_Q62.md 62d75339, PLAN_Q62.json 04a43fdf (hash-checked in tools/make-e6w.mjs). Base: candidates/E6v/native (SAL 92093190, SGVL 27864ca3, diagram 1b3f3468; copy in source/).
Build: `node tools/make-e6w.mjs source staged` + `tools/native-save-e6w.ps1` (native writers regenerate CRC) -> native/ = candidates/E6w/native. Canonical untouched, no commit.
## Output (candidates/E6w/native)
- SAL 9e5bfb15fc39fdacdbc0f926123f333d665ec5ceb5d7da78605f81980b67762d
- SGVL 8a3d452c3d671bae6e003896543aaa2378c4da7a9ec1285ff8479d118a632ff9 (see deviation)
- diagram ccd67deecb8557c0a28f5592578aebac7eb1d0e41c1f6b7475626f551405486c
## Inventory (E6v -> E6w)
networks 14; FB 344 -> 346; SAL variables 105; SGVL symbols 63 (0 added/removed); ports 2788 -> 2800; orders contiguous 1..346; local wires +2 (Network1), 0 inter-network. Q62_RST (safeAnd, order 42), Q62_BLK (safeRs, order 44 after FBEstop1 43). FBEstop1.Restart -> Q62_RST.AndOut (port has no contact attr, so none set). No timers/hardware/group/target change.
## Self-checks
- NATIVE_FRESH_RELOAD.log: nativeCrcValid=True, SGVL FileCrcMismatch=False, 14/105/346/2800/63, 28 label checks.
- STRUCTURE_CHECK.log: PASS incl. preflight, input rule 0 errors, CRC.
- catalog-all.tap (TRIGGER_EMG=in_Estop_PLC, SAFETYFAULT=linkSafetyFault): 129 tests, 128 pass, 0 fail, 1 todo.
- Not run: check:software.
## Deviation
Plan says GVL1.sgvl byte-identical, but also b_EStop_Ok consumer +1 via G: symbol (Q62_BLK.Set). SGVL records every symbol consumer, so one FbPortUsage (port dd395746... = Q62_BLK.Set) was added to b_EStop_Ok TargetUsages (diff: +1 FbPortUsage, regenerated Crc). Symbols/declarations/sources unchanged. Needed for SAL/SGVL consistency; architect to confirm.
