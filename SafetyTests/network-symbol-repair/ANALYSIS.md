# Cross-network symbol repair — requirements and scenario analysis

Date: 2026-10-20. Role: independent requirements/scenario analyst. Scope: the user's latest request is to repair **all graphical links between networks by using symbols**, run the workflow through completion, and perform **no further functional software development**. This overrides resumption of P0/STOPv2 or other functional iterations. This analysis edits no implementation or tests.

## Sources and exact baseline

Read AGENTS.md, WORKFLOW.md, WORK_STATUS_AND_PLAN.md, project-load-repair/HANDOFF.md and ARCHITECTURE.md, the working project inclusion file, and exact reference SAL/SGVL before analysing v2. Reference HEAD read successfully: 4495a1f6049f6a58ebfd436761faa84d17c8d643. No reference writes.

Active inclusion root: MEN001_Dyno/MEN001_Dyno.tsproj -> Safety_Dyno/Safety_Dyno.splcproj. The latter includes exactly one SAL and one SGVL:

- MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal, SHA256 ffd6c64e567131cb4fd5c4dd58816e0e5e8bb4f60777142d7959d9cc591ef0d1.
- MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl, SHA256 4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5.
- Dependent presentation: MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal.diagram; previous handoff records SHA256 17ebe04ad3ab1d43a77676e69cebc443b6dbf7cf6c09e394f2a0e84a04458699. It contains only Network1–12 lanes while SAL has 14 networks. This is an independently observed presentation gap; causation of the native CRC warning is not established.

Working SAL: 14 networks, 343 canonical wire edges, 24 cross-network edges, 319 local edges. Canonical pairs are resolved from the owning port's exact network/block/port ancestry and exact opposite moniker, independent of which end serializes the wiredLink. Never count only one traversal direction or resolve by block basename.

Reference: C:/Users/user/source/repos/MEN001_Dyno/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal, SHA256 efddc60b1263144ae73b3d5184158100ec09c4de739dc8919309ef7b1b0dc334: 10 networks, 122 canonical wire edges, **zero** cross-network graphical links. Reference SGVL uses named variables, SourceUsages/TargetUsages and port IDs; reference SAL uses fbPortGlobalVariableReference inside its required relationship wrapper. This demonstrates the requested established symbol mechanism. It does not authorize replacing current v2 behavior with reference behavior.

Only project-included active sources are repair targets. SafetyTests fixtures, sandboxes, archived candidates and baseline evidence are not active projects and must remain immutable unless explicitly assigned for new isolated evidence. A recursive scan must distinguish these from active inclusions.

## Exhaustive 24-case baseline

Each line is source -> target, and each must retain its signal dependency after conversion:

```text
//Network1/FBAndLvCurrentPermit/AndOut -> //Network12/FBAnd15/AndIn6
//Network1/FBAndLvCurrentPermit/AndOut -> //SafeResumption/SAFE_UP_SCOPE/AndIn3
//Network1/FBRs1/RsOut -> //Network12/FBAnd15/AndIn3
//Network1/FBRs2/RsOut -> //Network12/FBAnd15/AndIn4
//Network2/FBAnd4/AndOut -> //SafeResumption/SAFE_ACCEPTED_UP/Set
//RndPhysicalCompact/BOTH/TonOut -> //Network2/FBAnd4/AndIn1
//RndPhysicalCompact/GATE_001/AndOut -> //SafeResumption/RND_SCOPE/AndIn1
//RndPhysicalCompact/GATE_001/AndOut -> //SafeResumption/SAFE_UP_SCOPE/AndIn1
//RndPhysicalCompact/GREEN/TonOut -> //SafeResumption/SG_OWNER_SET/AndIn1
//RndPhysicalCompact/STATE_BA/RsOut -> //Network12/FBAnd2/AndIn2
//RndPhysicalCompact/STATE_BA/RsOut -> //Network2/FBAnd7/AndIn2
//RndPhysicalCompact/STATE_SG/RsOut -> //Network12/FBOr2/OrIn1
//RndPhysicalCompact/STATE_SU/RsOut -> //Network1/FBOr10/OrIn3
//RndPhysicalCompact/STATE_SU/RsOut -> //Network1/FBOr8/OrIn3
//RndPhysicalCompact/STATE_SU/RsOut -> //Network12/FBOr1/OrIn1
//SafeResumption/CONNECTOR_SCOPE/OrOut -> //RndPhysicalCompact/GATE_001/AndIn7
//SafeResumption/MODE/OrOut -> //RndPhysicalCompact/GATE_001/AndIn1
//SafeResumption/RND_SCOPE/AndOut -> //RndPhysicalCompact/GATE_020/AndIn5
//SafeResumption/RND_SCOPE/AndOut -> //RndPhysicalCompact/STATE_SG/Reset
//SafeResumption/RND_SCOPE/AndOut -> //RndPhysicalCompact/STATE_SU/Reset
//SafeResumption/SAFE_ACCEPTED_UP/RsOut -> //Network2/FBOr1/OrIn1
//SafeResumption/SAFE_ACCEPTED_UP/RsOut -> //RndPhysicalCompact/GATE_030/OrIn4
//SafeResumption/SAFE_UP_SCOPE/AndOut -> //Network2/FBAnd4/AndIn3
//SafeResumption/SG_OWNER_SET/AndOut -> //RndPhysicalCompact/STATE_SG/Set
```

## Acceptance invariants and scenarios

1. Exhaustive active-source scan reports zero graphical wire edges crossing networks; same-network wiring remains canonical with one wiredLink per port pair and no dangling endpoints. Check links serialized from either endpoint. All 24 original dependencies must remain represented through symbols, including fanout and links back into earlier networks.
2. Resolve symbols by actual variable IDs and exact native port IDs, with correct SAL DSL relationship wrappers and full SGVL SourceUsages/TargetUsages correspondence. No basename-only resolution, duplicate drivers, accidental many-source variables, dangling usages or missing exports. Audit the entire active SAL/SGVL before extracting any behavioral subgraph.
3. Collapse each variable's unique source and consumers to an effective directed port-edge graph. Candidate effective graph must equal baseline effective graph, preserving every previous alias/global binding as well as all 24 converted dependencies and all 319 local wires. New symbol names/IDs are implementation choices; connectivity and single-source semantics are requirements.
4. Existing FB identity, type, count (254), block order, network membership/order, active port settings/contact polarity, port identity, filters, timer values/start/reset logic, FB parameters, outputs, group lifecycle settings and external alias mappings must remain unchanged. New execution blocks, altered guards, changed timing or new functional behavior are outside scope. Removing the previously repaired invalid contact attributes again or restoring them is not part of this task.
5. Before/after executions on matched input histories must preserve observable outputs and internal FB state at the same scan boundaries. Cover FALSE/TRUE propagation for each converted source, multi-consumer fanout, forward/reverse execution dependencies, latched Set/Reset and timer outputs. Initial state and input histories come from baseline and approved requirements; any unknown scenario remains unknown, not a new oracle.
6. Preserve all existing mandatory regression assertions. Current canonical handoff result is 189/189 harness, 75/75 historical, 436/438 current; 200 PASS/1 conditional STATE FAIL/7 NOT VERIFIED/0 ERROR. These known functional gaps remain disclosed. The current request does not authorize fixing them. Structural serialization and frozen-source fingerprint expectations may require reviewed migration; do not replace semantic expectations with candidate-derived ones or edit immutable evidence.
7. CRC acceptance is a separate native observation from connectivity repair. The user's report says the workspace loads but CRC fails; the prior handoff recorded a diagram CRC warning after native loading. Do not claim the 24 edges caused that failure solely from coexistence. Record exact native messages and exact files/hashes before and after any authorized offline native check/save. Never manually fabricate CRC fields, bypass validation, download, deploy or operate equipment. Full CRC success requires an actual native result; a software graph PASS cannot establish it.
8. Presentation acceptance should show all current networks and symbol references without cross-network graphical wires, stale/dangling graphical connector artifacts, or missing relevant networks. Diagram regeneration/saving must retain the logic invariants above; copying the reference diagram is not acceptable.

No new functional ambiguity was identified that blocks the mechanical dependency-preserving repair. Implementation architecture and native checksum procedure belong to the architect/editor. Native/hardware safety, deployment, push and unrelated P0/STOPv2 development remain excluded. All final claims must distinguish source/static proof, software regression, native project opening and native CRC verification.

## Inspection limits

Inventory used PowerShell XML DOM, namespace-independent local element names, full owner ancestry and exact endpoint monikers. An initial scratch output used the wrong owner ancestor (outPorts instead of FB); it was corrected before this recorded inventory. Reference had a harmless empty-array diagnostic in source-count formatting; edge inventory and zero cross-network count were still computed. No acceptance assertion or source was changed by either diagnostic. Python WindowsApps launcher is unavailable; inspection continued using PowerShell XML APIs. Independent tester must reproduce the inventory with its own implementation and validate every exact endpoint against the model namespace.

## Lead scope clarification and architect handoff

Lead confirms the latest user request authorizes the diagnosed **offline native CRC repair/check** workflow and supersedes the historical handoff's earlier exclusion of native CRC. It does not authorize controller access, hardware changes, deployment or unrelated functional development. Native CRC remains a separately required observation, and zero cross-network wires alone cannot prove its success.

Architect independently confirms 24 cross-network dependencies from 16 distinct writers, reference zero, and native network-GUID equality validation. A SAL-internal ordinary symbol with native source/target relationship wrappers is also an acceptable implementation if it matches reference serialization, unique-source semantics and exact effective connectivity; SGVL storage is not itself mandatory for each new symbol. Existing SGVL symbols and usage metadata must remain consistent. This clarifies acceptance without prescribing the technical allocation between SAL symbols and SGVL variables.
