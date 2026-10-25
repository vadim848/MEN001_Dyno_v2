# Network Symbols and native CRC repair — final handoff

2026-10-20. Scoped repair APPROVED and transferred to the active v2 project.
Functional development remains paused. No push, controller operation, download,
hardware/group setting change or new control behavior was performed.

## Delivered changes

- All 24 graphical cross-network wires now use native Symbols: 11 new ordinary
  SAL Symbols, two existing SAL Symbols and three existing SGVL Symbols reused.
- All 319 local wires and 471 effective dependencies remain exact. All 254 FBs,
  2172 input/output ports, orders, contacts, timers, parameters and mappings remain.
- Ten preexisting Symbols contained repeated native-singleton usage collections.
  Consolidation preserves every actual usage record and retires exactly 54
  redundant container IDs. Native loading now retains all 75 Symbols.
- Native-generated diagram contains 14 Networks, 254 FB shapes, 2194 port shapes
  including 22 parameters, and 319 local connectors. All 24 converted Symbol
  decorators have correct text and native visibility=True.
- Mandatory native-structure preflight now precedes parse/execution in
  `cd SafetyTests; npm run check:software`. Ten narrowly reviewed test/preflight
  adapters preserve the old functional oracles and add four prevention checks.
  Parser/runtime and all 25 original core files are unchanged.

## Exact active source

| Artifact | SHA256 | Native stored CRC |
|---|---|---|
| TwinSafeGroup1.sal | 49ae801d5f6ade77c310859f4efafba92946628a8a6fa7ed268c71b12dc162d5 | 83968247 |
| GVL1.sgvl | b10bd9412aade7734aa9d8db1419f9ce3a5a848bb7855a406e8ddca5588f796d | 4004627699 |
| TwinSafeGroup1.sal.diagram | 2df1fd71d0d58c78101342550930edec122414ce55d21e45beca17417a413d81 | 2610141148 |

CRCs were produced only by installed TwinSAFE native writers. Independent fresh
native readers accepted all three actual canonical files, retained all counts,
and rejected separate corrupted copies of each file. No recorded CRC was patched.
Native all-category validation reports zero errors and 81 prior-cycle warnings;
its False return because of warnings is retained, and order was not changed to
silence warnings.

## Independent acceptance and canonical transfer

Final independent regression: 189/189 harness, 75/75 historical, 440/442 current
(the original 438 checks plus four new PASS). Cases: 200 PASS, one existing
conditional STATE FAIL, seven NOT VERIFIED, zero ERROR. The same two existing
Run gesture test failures remain. All 208 case statuses and 203 observation arrays
match baseline; no unrelated functional defect was fixed or hidden. Actual final
source transfer comparisons: 6,291,552 PASS. Earlier failed migration/native
attempts remain recorded in tester/REPORT.md and run history.

Independent reviewer approved exactly three native artifacts plus ten adapters:
reviewer/FINAL_REVIEW.md. editor/PROMOTION_RESULTS.json records exact-byte transfer;
tester/CANONICAL_ADOPTION_RESULTS.json independently confirms all 13 hashes,
25 unchanged core files, only the three allowed changes among 127 project files,
full typed/native structure and diagram checks, native CRCs and Symbol labels
on the actual working files. Git attributes preserve exact reviewed bytes.
The initial requirements/red-test checkpoint is 4d32e10.

Working canonical full-suite repeat: PASS preservation, expected exit 1; 189/189, 75/75, 440/442 and 200 PASS/1 FAIL/7 NOT VERIFIED/0 ERROR. All 208 cases and observations exactly match the reviewed independent run. Evidence: editor/CANONICAL_REGRESSION_COMPARISON.json and CANONICAL_EXIT_SUMMARY.json. All specialist writes stopped after acceptance; no further development is active.

## Limits and stop point

This closes the scoped local Symbol/serialization/diagram and stored-file CRC
repair. It does not claim GUI Verify/Build, compiler acceptance, CRC of the entire
splcproj/controller, hardware validation or deployment. Final IDE visual capture
was unavailable because the computer-use capture helper twice hung; native
presentation objects, coverage and visible Symbol decorators were verified.

P0/STOPv2, new functions and unrelated existing FAIL/NOT VERIFIED work stay paused
until a separate user decision. No background continuation of that work is active.

Primary evidence: ANALYSIS.md; ARCHITECTURE.md; editor/NATIVE_HANDOFF.md;
tester/REPORT.md; tester/NATIVE_ACCEPTANCE_RESULTS.json;
tester/FINAL_SOFTWARE_SUMMARY.json; reviewer/FINAL_REVIEW.md.
