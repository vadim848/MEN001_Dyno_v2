# E3 implementation (PLAN E3 md 117d6b4e, json 3af9069b) - editor self-check, not tester PASS

Base: canonical E2 SAL 67336d9b42aed3c1..., SGVL 4d68adb3347cdc1a..., diagram 31e516fe1297814a... (verified, copy in source/).
Build: `node tools/make-e3.mjs source staged` (reads PLAN.json, hash-checked) + `tools/native-save-e3.ps1` (native writers, CRC regenerated, never edited) -> candidates/E3/native.

## Output (candidates/E3/native)
- SAL     9ee66e7868547d7d42fb9ed4faf9f69030a2b4e6a5c64b1b0db2787176714d1e
- SGVL    72eade07b554a7b463676d5bb0d7b52bdebf734b875e293b6a84a3ac608d85b2
- diagram 9fe9aa7eb8f93068710044c986148fb423df26ab58181a3f6847e1a4cccd0af5

## Inventory (canonical E2 -> E3)
FB 239 -> 260 (limit 512); ports 2022 -> 2166; wires 304 -> 335 (+37, -6); SAL variables 79 -> 81 (+linkAbortActive 1 source/5 targets, +linkDescActive 1/2); SGVL symbols 63 (same Ids); 14 networks; 0 inter-network wires; orders contiguous 1..260 (21 new before RndPhysicalCompact/STATE_SU).
New timers: RD_T_SS1 2 s, RD_T_COAST 5 s, DN_T_HOLD 1 s. No existing timer changed. No hardware/group/target/alias/mapping change.

## Plan conformity / deviations
- All 21 blocks and 18 port modifications exactly as PLAN.json (from-state asserted against canonical).
- Plan text says "-4 wires"; actual -6: also the 2 wires SNAP_0.DecOut7 -> GATE_008/GATE_014.AndIn4 (deactivated by plan row; DecOut7 left unconnected as planned). Not a deviation of logic.
- STATE_SU.Reset contact NO -> NC (direct wire from SU_RESET, which carries the inversion; as the architect's model).
- native-save label self-check: 2 entries HEALTHY_OK/AndIn1,AndIn2 removed (ports deactivated by plan).
- FBDecouple2.DecIn1..4 have no contact; unchanged.

## Self-checks (editor, not tester PASS)
- Native save: Load ok; fresh reload (NATIVE_FRESH_RELOAD.log) nativeCrcValid=True, SGVL FileCrcMismatch=False, 14/81/260/2166/63.
- `CATALOG_SAL_DIR=candidates/E3/native npm run check:structure`: PASS (STRUCTURE_CHECK.log).
- `CATALOG_STAGES=E2,E3 npm run check:catalog`: PASS tests 103 pass 62 fail 0 skipped 34 todo 7 (CATALOG_E2E3.log/.tap); todo = known NV (SafetyFault E5, Config E4, E-08). D-03 and M-12 pass (one earlier full run showed M-12 FAIL while the tester was editing tests; not reproducible, rerun and isolated run pass).
- Mutants (MUTANTS.log, tools/mutants.mjs): HLT_LV.AndIn5 off -> D-09 killed; SG_OWNER_SET.AndIn3 off -> D-03 killed; M-12 ops -> D-02 killed.
- Not run: check:software (tester scope). Canonical untouched. No git commit.
