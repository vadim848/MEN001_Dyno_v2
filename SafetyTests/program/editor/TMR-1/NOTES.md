# TMR-1 editor notes (TMR-1-Q1 = A)
Candidate: SafetyTests/candidates/TMR-1/native (canonical copy, SAL base 53e9a6d8...b8fbb verified before copy; GVL1.sgvl byte-identical to EMG-OFF/canonical).
Edited (only `timing` of parameterPort "Delay Time (s)", safeTon, names unique, 1 each):
- RD_T_COAST  //Network6/RD_T_COAST, line 8320: 5 -> 2
- DN_T_HOLD   //Network6/DN_T_HOLD,  line 8685: 1 -> 5
- RELEASE     //RndPhysicalCompact/RELEASE, line 11861: 2 -> 1
RD_T_SS1 untouched (2). Number format kept (integer string).
Diff proof: `diff canonical candidate` = exactly 3 changed lines (8320, 8685, 11861), differing only in timing="N". Byte-exact edit (BOM, CRLF kept; done with node, not sed).
Diagram: TwinSafeGroup1.sal.diagram has no timing attribute; byte-identical to canonical (unchanged).
SHA256: SAL 3511b31b12f8770fa67b41267412f7241b1ba033c744e293a91effe2311e1743; diagram e9ec3e92c3e03b7c84d1c6cb144b8f3741544e7cc4a86c417959d4b164a901ec; sgvl 8a3d452c3d671bae6e003896543aaa2378c4da7a9ec1285ff8479d118a632ff9.
CRC: NOT valid (recorded 4151414716 stale) -> to be recomputed by Vadim via Verify in the IDE. Not touched by hand.
Trainer (corrected per lead): manual.js filterMs = FILTER_MS = 1000 (requirement p.9 / TMR-1), NOT the SAL preset; SAL preset shown separately (sal.presetMs). README updated. Display-only.
Self-check (CATALOG_SAL_DIR=candidate):
- structure-check: preflight, typed binding, native input rule, FB<=512 PASS (blocks 346, symbols 105, ports 2800, wires 466 unchanged); native CRC FAIL (expected, stale).
- check:catalog (log catalog.log): 138 tests, 120 pass, 12 fail, 6 todo. Failing (old timer oracles, expected; tester to update; baseline known-FAIL overlap not separated by me):
  E7 B-02, E3 D-01, D-05, H-02, H-03, H-06, H-07, E2 K-08, E4 P-03, E6 W-02, E5 W-07, W-08.
  (Not all are necessarily timer-driven: D-05, W-02, W-07, W-08 may be pre-existing known FAILs; compare with canonical run.)
