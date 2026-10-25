# S6 Q-S6-2 review (E6w) - ACCEPT WITH NOTES
SHA: base E6v SAL 92093190 (= git 0c1800e canonical), E6w SAL 9e5bfb15, SGVL 8a3d452c, diagram ccd67dee.
Diff (sal.diff.txt, attr-normalized): only FBEstop1.Restart usage of in_Reset_PB removed; added Q62_RST (safeAnd, AndIn1 V:in_Reset_PB NC, AndIn2 W:Q62_BLK.RsOut NO, In3..8 Deactivated), Q62_BLK (safeRs, Reset V:in_Reset_PB NO, Set G:b_EStop_Ok NC), 2 local Network1 wires (->FBEstop1.Restart, ->Q62_RST.AndIn2); root Crc; orders renumbered 1..346, relative order of 344 old FB identical (Q62_RST 42, FBEstop1 43, Q62_BLK 44). Nothing else. = plan.
SGVL: +1 FbPortUsage (Q62_BLK.Set) in b_EStop_Ok + regenerated Crc; symbols/declarations unchanged. Required by SAL G: ref; acceptable (plan's "byte-identical" was a plan inconsistency).
check:structure on E6w re-run: PASS (preflight, typed bindings, input rule 0 errors, FB 346<=512, native CRC) - structure.out.txt.
Semantics vs Q-S6-2 A: held-from-Safe press blocked (BLK set with b_EStop_Ok=1); press in Emergency unchanged; boot (b_EStop_Ok=0) counts; FBEstop1 EStopIn untouched -> entry unaffected. Backward read BLK->RST feeds only Restart: harmless.
Tests: E-05 sub-case oracle from decision (two triggers, then positive new press). e6w-final-all.tap 132/0/1 todo, B-02/S1-Q3/S1-Q7/E-04 included.
Note 1: M62-6 survival acceptable (1-scan, below catalog resolution). Tester RESULTS wording "would accept the Restart Q-S6-2 forbids" looks reversed: by scan analysis mutant (stale b_EStop_Ok=1 on onset scan) BLOCKS a press starting exactly on the onset scan, which design counts; no probe evidence either way (q62-M62-6.out only "SURVIVED"). Tester to correct/probe; non-blocking.
Note 2: PLAN_Q62.md PROBES_PLACEHOLDER unfilled (architect outage) - architect to fill or mark NV.
Limits: software/model only; no hardware/IDE Verify/target claim.
