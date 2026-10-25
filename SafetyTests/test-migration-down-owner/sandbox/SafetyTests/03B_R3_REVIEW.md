# Independent implementation review — 03B R3

2026-10-19. **FINAL ACCEPT — scoped R3 software repair.**
No implementation/test changes by reviewer. Compare checkpoint218dde5.

Core inspected: the only SAL change is WINDOW.EStopIn1 master enum from
`Single-Channel Both Activated` to `Single-Channel 1 Activated`. Main EStop,
SGVL, block order/count, all bindings and timers are unchanged by R3. Derived
executable plan, generator and native metadata expectation agree with this
first-only mode. SAL SHA256
`a50e24af66c755f00001e3bd2eed70ba4d30526df8dfa427b5d37bc6dcebb413`.

`estop-native-pairs.js` selects all four pairs by native objectIndex8/9,
10/11,12/13,14/15. Master mode selects channels and master contact1/contact2
selects polarity; slave own metadata cannot override either. Runtime calls
readRaw once then applies effective inversion once. Both-deactivated selects
none; unknown modes, unsupported Two-Channel and missing active connections
throw. No dummy input or universal connected-port fallback was added.

The same resolver is called by actual physical dependency closure, including
binding checks. NC2 and Mentee now appear as real typed demanded inputs and
their removal fails before first scan. Generic active-port filtering is no
longer used for ESTOP execution or that closure.

Independent executions completed:

- R3 native-pair package **86/86 PASS**, zero skips (red baseline56/30).
- Observed-clock package **105/105 PASS**, zero skips; unchanged time oracles
  exercise actual TONs and causal helper ordering on fixed grids.
- Additional independent activation/contact probe over all four pairs and
  first/second/both modes **12/12 PASS**.
- Historical structural/emergency-chain package **21/21 PASS**, zero skips.
  Read the two EStop expectation corrections: NC2/Mentee now drop main output
  according to SDK master activation; Step4 and safety-armed assertions remain.
- Actual physical69 plus native structural5 **74/74 PASS**, zero skips, on
  the corrected native-pair adapter and first-only source.

Static graph and structural inventory also use the resolver. Their correction
adds NC2/Mentee causal edges and reports five actual effective safety channels:
four main channels with NC2 direct/Mentee inverted from their masters, plus
the first-only helper. These are dependency/inventory observations, not Boolean
proof or EDM/group support claims.

Read migrations: partial current/historical EStop setup now explicitly gives
healthy MenteeFALSE; reference profile maps effective master polarity rather
than each slave's own field. Clock fixtures use exact first-only native enum.
These are justified precondition/adapter corrections, not new user policy or
changed qualitative expected behavior. Contract/version and resolver/closure
hashes are included in new generated reports.

Editor final STOP confirmed. Current companion `R3_CURRENT_RESULTS.json`
SHA256 `bd83253f9f624739bf0f10e4dabd9133fc98a85f8327885c4dd46e4de58c4d7e`
was read; all recorded source/model/artifact hashes and embedded69/86 evidence
hashes were independently checked with zero mismatches. SGVL SHA256 remains
`06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5`.
The current companion supersedes the historical pre-R3 acceptance artifact
for current-source evidence; that historical HOLD artifact was not rewritten.

Final reported stages178 harness /75 historical /272 current all pass.
Functional201 PASS /1 FAIL /5 NV /0 ERROR; standalone47/0/5. Reviewer separately
compared each functional case ID/status against218dde5: no status delta.
Read32 NC2/Mentee behavioral trace corrections and92 fallback-count metadata
changes; the former match the SDK evidence and do not represent32 new source
repairs. The69 physical traces are fresh on corrected runtime, with145 selected
blocks and113 boundary records per fixed grid. No false-green Error proof.

R3 finding is closed. Whole03B can be accepted for its defined physical
recognizer/software scope, together with the original independent review
and this repair review. EDM/groupError/native lifecycle limitations and the
separate LV/HV PLC pulse recovery follow-up remain. Existing internal
conflicting-set FAIL and five NV items prevent complete project acceptance.
Native Build/Verify/CRC/hardware validation were not performed or required.

Reviewer writes STOP; no remaining substantive finding in this package.
