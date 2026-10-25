# Independent tester — final intermediate-review handoff

2026-10-20. Status: PASS for the scoped three software-input diagnostic repair and behavior preservation, with known functional gaps and target checks retained. Functional development remains paused. Tester wrote only this directory; no canonical source/test/report transfer, equipment, settings, download or push.

## Frozen handoff

ACCEPTANCE_MANIFEST.json contains exact SHA256 for three native artifacts, all9proposal files and all26unchanged current src files(25original core plus the native-structure preflight added during the preceding repair). Each proposal byte equals the independently executed migrated snapshot.

- SAL:59bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33; native CRC3035115343.
- SGVL:c31e129072e2837234e376e51038ff988a92373cbfea97b383fbf23536c7946b.
- Diagram:449ea8ca664ff18078154cc91ccc40f575e20e3be5a4cfecf68cd3265d8c8bfc.

The reference was read first via git show4495a1f6049f6a58ebfd436761faa84d17c8d643, without checkout/write. The immutable prior accepted v2 source pair is committed under network-symbol-repair/editor/native-reviewed-output, SHA49ae801d.../b10bd941.... Baseline native-structure preflight PASS14Networks/254FB/2172I/Oports/75Symbols/319localwires/0cross-network wires preceded graph analysis. Whole SAL/SGVL typed binding audit PASS. All6PLCstop consumers and exact alias/source identity are recorded in SOURCE_CONSUMERS.json.

## Actual native rule and CRC gates

NATIVE_BASELINE_RULE.json reproduces precisely the3screenshot later-input source-rule violations. NATIVE_CANDIDATE_RULE.json shows0. Both invoke the installed actual VerifierHSafetyPLC unsafe-source predicate on the actual native-loaded existing StandardAliasDevice IO(SafetyType=Standard), retaining unchanged source SDS SHA90d5132726bc9408f6cc7f716723b005c37aa3d698e216b33f59e5a151e69f02. All6consumers are resolved by exact native variable GUID on the complete native-loaded SAL; the documented and independently inspected native-IL ObjectIndex8 first-AND-input exception is applied. All3original consumers remain valid; all3new consumers are now first-slot, Activated and retain the PLC source/contact term. Native filter3 on a later input still violates the restriction:3/3negative controls. Required missing/deactivated guards reject.

This bounded check executes the actual native source predicate plus native-model slot/index rule. It does NOT invoke the entire VerifyFbAnd/project compiler. Bare SAL native loading lacks the external project alias-device resolver, so the exact program XML source identity is pinned separately to the actual native-loaded SDS. No source reclassification, intermediate block or hardware investigation/change.

NATIVE_CANDIDATE_CRC.json independently fresh-loads SAL+diagram: stored CRC valid, zero serialization/native designer errors, complete counts and28visible correct Symbol decorators(original24retargeted by explicit ledger plus4affected targets). NATIVE_CANDIDATE_SGVL_CRC.json independently fresh-loads all85definitions with FileCrcMismatch=false. Native all-category designer validation returns FALSE because81previous-cycle warnings remain; this return/warnings are retained. Valid stored CRC alone never establishes safe-input/compiler acceptance.

Fresh corrupted candidate copies independently reject for each artifact: NATIVE_NEGATIVE_SAL_CRC.json(nativeCrcValid=false), NATIVE_NEGATIVE_DIAGRAM_CRC.json(nativeCrcValid=false), NATIVE_NEGATIVE_SGVL_CRC.json(FileCrcMismatch=true). No stored CRC was patched. Originals unchanged by all reader runs.

## Exact preservation and prevention checks

CANDIDATE_EXACT_DIFF.json: entire SAL/SGVL AST equals the frozen baseline after inverse of ONLY3specified complete source/contact permutations and exact1SGVLtarget ModelElementId transfer under preserved FbPortUsage e5dd53d4-fd9b-45d1-94c6-6dccd8fd4671. Only native root CRC attributes are excluded. Every other alias source/usage identity, wrapper, Symbol, mapping, port attribute,85SGVLdefinition and parameter remains exact. Old NETWORK_SYMBOL_REPAIR_LAYER is unchanged.

CANDIDATE_EQUIVALENCE.json: full preflight/typed audit first; exact FB IDs/types/orders and native slot metadata; every source binding outside6slots; exact signed term multisets and416truth rows(32UnlockHold/256LvCurrentPermit/128GATE_001). CANDIDATE_RUNTIME_TRANSITIONS.json executes unchanged SalRuntime on actual parsed baseline/candidate conjunctions for60PLC loss/recovery, independent/coincident guard-loss and restoration samples, including safe-EStop/green-button and connector/interlock guards. All outputs match baseline AND independently expected conjunction values, with zero assumed unconnected input ports. Excluded producer boundary values are explicit existing bound sources; no actual parsed .sources rewrite or fabricated binding.

MUTATION_RESULTS.json:14/14unauthorized mutants reject explicit exact-diff assertions(exit1 with written FAIL evidence, never harness-crash acceptance):3contact-only changes,3disabled PLCguards,3filter changes,3source-only swaps, changed underlying source identity and unrelated SGVLdefinition.

CANDIDATE_DIAGRAM_STRUCTURE.json: all14Networks/254FBs/2194port+parameter shapes/319canonical wire connectors resolve exact monikers and endpoints. CANDIDATE_DIAGRAM_EXACT.json and native geometry evidence independently verify all2463same-ID shape bounds exactly equal baseline, all2463nonzero(maxDelta0). Serialized derived bounds may be omitted by the native writer; no zero fallback is accepted. All319connector routes are compared:318unchanged apart from numeric formatting(maxDelta1.07e-14, limit1e-10); exactly1planned connector target changes to AndIn5. Its final4point approach Y shifts50.945→52.025 to the center of the existing fifth-port native bounds; allx and first14points remain. Every other diagram AST field/model moniker/shape/route marker remains exact.

## Full software regression and adapter history

The isolated baseline full run used unchanged source/test files and exited1 honestly:189/189harness,75/75historical,440/442current,200PASS/1conditionalFAIL/7NOTVERIFIED/0ERROR. BASELINE_SOFTWARE_WITNESS.json commits all208case statuses and SHA256 for every selected observation/state/failure/assumption array; the local raw report SHA is retained.

The candidate with UNMODIFIED tests was executed first and rejected stale source fingerprints/port-position fixtures: harness183/189, historical75/75,current354/366; BOOT source-coverage ERROR,207cases. CANDIDATE_UNMODIFIED_COMPARISON.json retains every failure; none hidden or treated as functional acceptance. First targeted adapter run was80/81 because the B1wire test still selected old slot0; MIGRATION_TARGETED.log retains it. Corrected selection uses exact AndIn5name/GUID and exact .sources==[edge.from] for both serialized wire forms. Targeted corrected run81/81.

The9file proposal contains only expected-representation/CRC provenance adapters and3new portable eligibility/prevention tests. BOOTinventory is constructed from DETACHED frozen baseline AST plus ONLY approved3pair/1SGVLledger and independently verified native CRCs, then compared against full candidate inventory. It is not a filtered/masked candidate-derived expectation. CRC test retains old history and asserts current predecessorCRC equals immutable old afterCRC before asserting new nativeCRC. No runtime/parser/core changes.

Final independently executed full proposal run:189/189harness,75/75historical,443/445current(only3newPASS), expected exit1. FINAL_REGRESSION_COMPARISON.json confirms EXACT same2old Run-gesture failures, all208case statuses, all203observation arrays and remaining state/failure/assumption data. Cases remain200PASS/1conditionalFAIL/7NOTVERIFIED/0ERROR. Full final report SHA32f193112d4f57eddf0b100932e36ebe40b85d90b2ef23a29b63fb698d610cfc.

## Reproduction

From repository root:

- node SafetyTests/safe-input-validation-repair/tester/exact-diff.mjs CANDIDATE_SAL CANDIDATE_SGVL RESULT_NAME.json
- node SafetyTests/safe-input-validation-repair/tester/equivalence.mjs CANDIDATE_SAL CANDIDATE_SGVL RESULT_NAME.json
- node SafetyTests/safe-input-validation-repair/tester/runtime-transitions.mjs CANDIDATE_SAL CANDIDATE_SGVL
- powershell -NoProfile -STA -Command "& ([scriptblock]::Create([IO.File]::ReadAllText('SafetyTests/safe-input-validation-repair/tester/native-source-rule.ps1'))) -SalPath 'CANDIDATE_SAL' -SgvlPath 'CANDIDATE_SGVL' -ResultPath 'RESULT_JSON'"
- node SafetyTests/safe-input-validation-repair/tester/snapshot-run.mjs NEW_RUN_NAME CANDIDATE_SAL CANDIDATE_SGVL SafetyTests/safe-input-validation-repair/tester/proposal
- node SafetyTests/safe-input-validation-repair/tester/compare-final-software.mjs PATH_TO_NEW_RUN_SOFTWARE_CHECK_RESULTS.json RESULT_NAME.json

The two screenshot target-unreachable/ADS7diagnostics remain unresolved environment conditions. Full IDE Verify/Build, whole target-project CRC, target reachability and hardware validation are NOT VERIFIED. No claim of clearing all5IDEerrors. Final functional development/P0/STOPv2 remains paused.

Tester writes frozen for reviewer and lead transfer. Exact3native artifacts+9proposal files are ready for independent review; canonical transfer belongs to editor/lead.

## Independent canonical adoption complete

CANONICAL_ADOPTION.json: PASS after editor transfer. All12actual destination hashes equal the reviewed native+proposal package; all26current srcfiles unchanged. The127project-file inventory(125current transfer inventory plus the unchanged solution and drive-manager project checked against frozen prior evidence) changes ONLY the3approved SAL/SGVL/diagram paths.

Fresh actual canonical native readers pass SAL+diagram CRC/counts/28labels/all2463nonzero geometry identities; SGVL85definitions/FileCrcMismatch=false. Canonical native source predicate+slot rule has0errors with given Standard source unchanged. Native81warnings/FALSE designer-validation return retained. Canonical full report SHAedcae40251523bbeaf4f5bf152ecf06d1d8a5833b8722d9e06a26ddddd00b1d1; CANONICAL_SOFTWARE_COMPARISON.json confirms exact stage/counts and all208statuses/203observations/state/failure/assumption data against the reviewed candidate. Same189/189,75/75,443/445 and200PASS/1conditionalFAIL/7NOTVERIFIED/0ERROR, expected exit1. No canonical write by tester.

All tester writes are now frozen. Scoped intermediate-review package complete; target/ADS/whole-project IDE validation limitations above remain.
