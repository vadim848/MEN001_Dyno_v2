# E4 implementation (PLAN.md 276ac70c, PLAN.json 6836c56c) - editor self-check, not tester PASS

Base: canonical E3 SAL 9ee66e78..., SGVL 72eade07..., diagram 9fe9aa7e... (verified; copy in source/).
Build: `node tools/make-e4.mjs source staged` (PLAN.json hash-checked) + `tools/native-save-e4.ps1` (native writers, CRC regenerated, never edited) -> candidates/E4/native.
Config: `tools/make-sds.ps1` (native AliasDevice.ToXml for new sds), `tools/make-config.mjs` -> candidates/E4/config (+ MANIFEST.md, manifest.json). Canonical untouched, no commit.

## Output (candidates/E4/native)
- SAL     4ee8d3d96da1a1b91860131fc4c1b52a017aced44408f07532e960d565307a8f
- SGVL    98a0d10f4dfe9a9898c1acd5f8c5c89ac526e93e3b781bdb44f5f1c6141a9b4c
- diagram 98faaead863194fa1beb87bb3a40e47acd628471e701176976714cd567418380

## Inventory (canonical E3 -> E4)
FB 260 -> 297 (+47 new, -10 deleted; limit 512); networks 14; SAL variables 81 -> 99 (+18 new; 2 legacy renamed in place, see below); SGVL symbols 63 (same Ids); native ports 2166 -> 2467 (plan's model figure 2264 counted only used inputs of new And/Or blocks; native counts all 8); wires 386; orders contiguous 1..297; 0 inter-network wires.
New timers only as planned: PE_T_CLR 1 s, HB_T_HI/HB_T_LO 3 s, CFG_T_HOLD 1 s. Deleted timer: N1/FBTon1 (10 s). No other timer changed.

## Self-checks (editor, not tester PASS)
- Native save: load ok, fresh reload (NATIVE_FRESH_RELOAD.log) nativeCrcValid=True, SGVL FileCrcMismatch=False, 14/99/297/2467/63; 28 label checks (NATIVE_SAVE.log).
- `CATALOG_SAL_DIR=candidates/E4/native npm run check:structure`: PASS (STRUCTURE_CHECK.log; native preflight, typed binding audit, FB<=512, CRC).
- `CATALOG_STAGES=E2,E3,E4 CATALOG_SYM_TRIGGER_EMG=in_Estop_PLC npm run check:catalog`: PASS tests 108, pass 86, fail 0, skipped 16 (E5/E6/E7 rows), todo 6 (E-08, H-02/03/05/06/07 SafetyFault NV, E5). All E4 rows P-01..P-12, G-01..G-06 pass (CATALOG_E2E3E4.tap/.log). Not run: check:software (tester scope).
- Mutants (MUTANTS.log, tools/mutants.mjs): 10/10 killed (PA_R2RUN.AndIn2 P-06, .AndIn5 P-02, PK_OK.AndIn1 P-09, .AndIn3 P-07, FBEstop1.EStopIn7 P-11, FBAndNotRunSu.AndIn4 G-05, PA_CFG.AndIn6/AndIn2 G-02, CFG_OFF.AndIn2 G-04, SU_ABORT_CAUSE.OrIn3 P-04). Known catalog gaps from PLAN section 6 not re-run.

## Plan conformity / deviations
- All 47 blocks, 10 deletions, 24 input modifications (+1 output source DecOut5), 18 new + 2 renamed variables exactly from PLAN.json (insertion by insertAfterCanonical, contiguous renumbering).
- Variables inPLC_RnD_Mode / inPLC_RnD_Mode_2 are renamed in place to CMD_SAFE_TO_RND / CMD_RND_TO_RUN (plan allows): same Id, alias usage sds 94/97 kept, old consumers removed (deleted blocks), new consumers added. Heartbeat (sds 48), CMD_RUN_TO_RND (63), CMD_RND_TO_SAFE (64) are new variables with aliasDeviceIoUsage (functionId 1131179973, as sds 94/97/99). STS_* have aliasDeviceIoUsage targets (functionId 1131179972, as sds 77/98).
- DEVIATION (carrier): sds 2 (Safety_Step) is UINT 16 bit, not BIT. Status carriers: sds 14 (STS_SAFE) + 6 NEW Out alias devices sds 100-105 (STS_RND, STS_RUN, STS_EMG, STS_CFG, STS_COVER_LOCKED, STS_FAULT); plan said sds 2 + 14 + 5 new. NextSdsId 106. Sds 2 left unused/unchanged. The STS_* assignment is a single table (ALIAS_OUT in make-e4.mjs) - easy to change (Q-E4-1).
- DEVIATION (ports): native port count 2467 vs plan 2264 (model undercount, see above).
- EStopIn7: contact "Single-Channel 1 Activated" NC (pair 4 master), as pairs 3; FBEstop1 order 34 -> 40.
- Config files: see candidates/E4/config/MANIFEST.md (splcproj Crc attribute not recomputed; tsproj hand edit mirroring IDE output, not IDE-verified; P2b Healthy->Faulty rename not done).
- PLC MAIN (review F1 fix): act_LogicMap keeps all four CMD_* FALSE (idle) by default; only while new BOOL b_PlcRequestActive is TRUE exactly one CMD_* is TRUE per n_SafeSate case. No PLC source of requests exists (n_SafeSate written nowhere): "request source to be connected by PLC side", listed in MANIFEST.md. SAL/SGVL unchanged.
