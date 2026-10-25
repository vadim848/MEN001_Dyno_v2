# Analyst handoff — safe-input validation repair

2026-10-20. Owner: independent requirements/scenario analyst. Scope: resolve the three program input-validation errors in the supplied screenshot while preserving current software behavior. Functional development remains paused. No source/test changes made by this role.

## Sources and mandatory preflight

Read exact reference first through `git show 4495a1f6049f6a58ebfd436761faa84d17c8d643:MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`, then its SGVL; no reference checkout switch/write. Reference does not contain WORKFLOW.md. Read v2 WORKFLOW.md, approved SCENARIO_DECISIONS.md and previous network-symbol-repair/HANDOFF.md. The current narrow stop overrides earlier functional plans; newer stop/abort decisions are not implementation authority for this cycle.

Before v2 graph selection, invoked existing `inspectNativeSalStructure` on the entire active SAL: PASS, zero errors; 14 Networks, 254 blocks, 2172 I/O ports, 75 Symbols, 319 wires and zero graphical cross-network wires. Invoked `validateSalBindings` on the entire SAL/SGVL pair: PASS, zero errors. These are structural software results, not native CRC/compiler acceptance.

Analyzed actual working files:

- SAL `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`, SHA256 `49ae801d5f6ade77c310859f4efafba92946628a8a6fa7ed268c71b12dc162d5`.
- SGVL `MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl`, SHA256 `b10bd9412aade7734aa9d8db1419f9ce3a5a848bb7855a406e8ddca5588f796d`.

## Five screenshot errors and scope

1. Safety_Dyno target system is not reachable; reload/enable devices/check properties suggested by IDE.
2. Target machine could not be found, AdsErrorCode 7 / 0x7.
3. FBAndUnlockHold / AndIn5 can only be connected to safe inputs.
4. FBAndLvCurrentPermit / AndIn8 can only be connected to safe inputs.
5. GATE_001 / AndIn4 can only be connected to safe inputs.

Errors 1/2 are environment/target availability diagnostics. Screenshot establishes neither their physical cause nor a software solution. Record separately as unresolved target-dependent checks. Do not change target configuration, hardware mappings, device enable states, group parameters or contact controller. Local offline native validation may separate these from program checks. Clearing three software errors does not establish that all five IDE errors or full project CRC pass.

Errors 3/4/5 are exact program consumer eligibility failures. They all use the same ordinary program alias `in_Estop_PLC`, native variable GUID `6d615846-7050-4fe7-9d46-85e8b6460f93`. Existing alias source-usage GUID `4bd84bb0-b59a-49b0-9553-77765ae0d129`, sdsId 54, channelId 1, functionId 1131179973 are identity facts from the program binding only. No physical-origin investigation performed or needed.

| Exact consumer | Port GUID | Current filter/contact | Execution order |
|---|---|---|---|
| //Network1/FBAndUnlockHold/AndIn5 | 3f513b29-6b63-4f75-926e-811ca7650568 | 2 / Make Contact (NO) | 254 |
| //Network1/FBAndLvCurrentPermit/AndIn8 | 75f42369-fbd7-49b1-a11b-18df643208ea | 2 / Make Contact (NO) | 2 |
| //RndPhysicalCompact/GATE_001/AndIn4 | 5ee6aed8-eb13-5af9-5850-d5064f5b2468 | 2 / Make Contact (NO) | 125 |

The same source has exactly three reference consumers, all retained unchanged in v2:

- //Network1/FBAnd1/AndIn1, GUID 7895f9be-f26b-4b51-8824-6775d5347b80.
- //Network2/FBAnd5/AndIn1, GUID 878b391e-f4ce-4cb6-8bbc-3e0ae0da16f5.
- //Network6/FBAnd10/AndIn1, GUID 13860376-b591-4ca6-bc20-efc1c7e20930.

All three original consumers have filter=3, channelInterface=Activated, deactivate1=Make Contact (NO), portDataType=1. The three failing added consumers have filter=2 with the same other listed contact/type attributes. This is evidence for investigating native input eligibility metadata, not permission to relabel an unsafe source as safe or to add an intermediate block to hide its provenance. Architecture must establish the installed native meaning of filter flags and confirm that any change is software acceptance metadata, with no timer/filter-time or logical change.

## Preserved behavior and acceptance scenarios

The existing runtime interprets Make Contact (NO) as negated input, supported by reference consumer pattern and the existing button-source convention. Preserve serialized contact settings exactly. `in_Estop_PLC=TRUE` therefore blocks each of these conjunctions; FALSE merely satisfies this one term and cannot override another failed permission. This is a program truth-value assertion, not hardware polarity validation.

FBAndUnlockHold has five active terms: FBRs6/RsOut, in_Relase_Door_PB, NOT in_Reset_PB, GVL1.b_EStop_Ok (GUID 98ab783a-9ee4-42cd-8375-54abc169e250), NOT in_Estop_PLC. Its output drives out_Door_Unlock_Solonoeid. Keep all terms, including the independent safe EStop term and green-button restriction; preserve order 254 and preceding latch behavior. DoorMonitor's existing upstream unlock role must remain unchanged.

FBAndLvCurrentPermit has eight active terms: GVL1.b_EStop_Ok, both in_ES_NC channels, both in_InterLock_NC channels, in_LV_Connector_Interlock, in_HV_Connector_Interlock, NOT in_Estop_PLC. Output remains connected to existing LV/HV/STO set-permit inputs and linkLvCurrentPermit Symbol readers. Keep the distinct ES and InterLock pairs, order 2 and Symbol scan behavior.

GATE_001 has seven active terms: linkSafeMode, NOT in_False_SI2_CH8, GVL1.b_EStop_Ok, NOT in_Estop_PLC, both in_InterLock_NC channels, linkSafeConnectorScope. Output remains connected to GATE_004/AndIn1, GATE_007/AndIn3, GATE_008/AndIn1, GATE_015/OrIn1 and STATE_A/Reset plus linkRndGatePermit Symbol readers. Preserve order 125, not only the immediate conjunction value.

Independent tester criteria:

1. Before graph selection, full SAL native-structure and typed SAL/SGVL bindings PASS; native readers retain the complete 75 Symbols/254 blocks/2172 ports and zero graphical cross-network wires. Source/target usage singleton wrappers remain valid.
2. Reproduce or directly diagnose each of the three native safe-input errors with exact port GUIDs; after repair native input eligibility checks must accept these ports without new program errors. Full file CRC success alone is insufficient. Preserve failing-before evidence.
3. Reject any removal/disablement/inversion of the PLC stop guard, safe EStop guard, interlock pair, existing wire or Symbol dependency. Preserve all six consumers of the same alias and its source identity. Do not reclassify the source through aliases/SGVL or an intermediate block.
4. Each affected conjunction retains its truth table for every combination of active inputs (32 UnlockHold, 256 LvCurrentPermit, 128 GATE_001 combinations). Specifically, PLC=TRUE forces false even when other terms permit, PLC=FALSE permits only with all other terms satisfied. Each other guard independently blocks with PLC=FALSE. These are component comparisons; do not claim full working-program acceptance from them.
5. On PLC FALSE→TRUE and TRUE→FALSE transitions with relevant inputs/latches held, preserve actual output samples and scan order before/after. Include coincident safe EStop loss and green-button activation for UnlockHold, and individual connector/interlock losses for permit gates. Existing Symbol previous-scan semantics must not be changed to suppress warnings.
6. Structural differential must show no changes to contact polarity, active channels, timers/parameters, block order, alias mappings, SGVL identities or effective dependencies. If a technically necessary metadata field is changed, enumerate its native meaning and prove that neither timing nor function changes.
7. Native-generated CRCs only, with independent fresh reader checks of actual final files and retained full counts. Keep native CRC/readability, program validation, software regression and target-dependent checks as separate outcomes. Never manually patch stored CRC values.
8. Existing software regression statuses and observations must match baseline; unrelated FAIL/NOT VERIFIED remain visible. No attempt to finish P0/STOPv2 or other feature work.

## Ambiguities and limits

No missing behavioral decision identified for preserving these three conjunctions. Choice of valid native input-eligibility setting is an architectural/technical question; do not ask the user to invent a software truth table already explicit in the current graph. If a proposed remedy changes timing, source safety classification or program behavior, stop that remedy and return for scope/behavior clarification. The present source is not a validated executable; preservation checks establish consistency with the frozen source, not safe controller behavior. Environment errors remain honest external limits until a separately authorized/user-run target check is available.

## Architectural clarification — native first-slot restriction

The lead relayed the architect's installed native verifier finding: `HSafetyPLC.VerifyFbAnd` exempts objectIndex=8 / AndIn1 from its safe-only source requirement; other AND input slots require safe sources. This explains why the exact reference's three ordinary PLC consumers are all AndIn1. This is native software validation evidence, not an assertion of source hardware safety. See architecture evidence for the exact verifier trace.

Approved behavioral-preservation strategy: exchange the incoming source AND its associated contact polarity between the first active slot and the offending active slot inside each affected AND. Keep native slot filter/type metadata unchanged. Analyst does not authorize relabeling unsafe signals as safe.

| AND | Move to AndIn1, with Make Contact (NO) | Move from AndIn1 to old PLC slot, with Break Contact (NC) |
|---|---|---|
| FBAndUnlockHold | in_Estop_PLC from AndIn5 | FBRs6/RsOut to AndIn5 |
| FBAndLvCurrentPermit | in_Estop_PLC from AndIn8 | GVL1.b_EStop_Ok to AndIn8 |
| GATE_001 | in_Estop_PLC from AndIn4 | linkSafeMode to AndIn4 |

GATE_001's b_EStop_Ok stays on AndIn3. Do not confuse it with LvCurrentPermit's first input.

All exchanged slots are Activated, maxDeviation=0, resetTime=0, and the three safeAnd blocks have no parameter ports. Their boolean conjunction is unchanged by exchanging these terms; block execution order, source block timing, output endpoints and effective source-to-block dependencies must stay exact. Symbol/SGVL usages and canonical wire endpoints must follow the moved term by actual GUID/path, with valid native wrappers. Slot-specific filter metadata stays on its native slot, not on the moved signal. All source identity, other input contacts and guards remain. This is an ordinary technical representation repair and raises no missing user behavioral decision.

Acceptance criterion 6 above is narrowed accordingly: three intentional contact swaps are expected, each inseparable from the paired source swap. Compare source-plus-contact terms as a multiset per AND rather than requiring contact at the old slot to remain. All non-swapped contacts, active channels, timer/parameter values, block orders, alias source mappings, SGVL variable identities and effective dependencies remain exact. At slot-level, only the architecture-listed incoming references/usages/wires and paired contact values may differ, plus native-regenerated serialization/CRC/diagram artifacts if needed. Truth-table and transition preservation still apply to all source terms. Reject a source-only or contact-only swap, dropped guard, changed filter value, or altered source origin.
