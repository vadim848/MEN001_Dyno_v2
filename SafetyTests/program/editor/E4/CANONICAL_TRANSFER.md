# E4 → canonical (coordinator, 2026-10-24, D-AUTO-PROCEED; Q-E4-1/Q-E4-5/F3b = А)

- Before: canonical E3 SAL 9ee66e78…; after: SAL 4ee8d3d9…, SGVL 98a0d10f…, diagram 98faaead… (byte-exact from candidates/E4/native).
- Config per candidates/E4/config/MANIFEST.md (91842057…): 17 targets, base SHA and new SHA verified; 6 .sds renames via git mv, 6 new .sds, splcproj, tsproj, ST_TwinSAFE_IN/OUT, MAIN.
- check:structure PASS (14 networks, 297 FB, 99 symbols, native CRC + validation).
- check:catalog (all stages, CATALOG_SYM_TRIGGER_EMG=in_Estop_PLC): 119 tests, 100 pass, 13 fail (E5/E6 rows only), 6 todo — same as candidate. TAP: program/tester/S1/canonical-e4.tap.
- npm test: 53/53.
- Open for S6 (IDE): splcproj Project Crc and tsproj hand edits not verified by TwinCAT; PLC request source for CMD_* not connected; MAIN heartbeat 0.5 s required.
