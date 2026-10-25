# 03B R3 — native pair red tests ready

2026-10-19. **READY for independent test review; editor STOP.** This stage adds executable tests and a red baseline only. No SAL/SGVL/runtime/shared closure/derived plan/generator or existing acceptance oracle was changed.

## Reproduction and result

From repository root: node --test SafetyTests/test/current-estop-native-pairs.test.js

**86 tests:56PASS /30FAIL /0skipped**, expected nonzero exit. R3_RED_BASELINE.json stores compact per-case expected/actual observations, source/test/plan SHA256 and SDK identities. All86 cases were recorded: no missing-module/API/import errors or unrecorded execution failures form this baseline. Tests call the existing SalRuntime and physicalRndSource APIs; no future resolver module is imported.

Unchanged SAL SHA256 a45f129ebdc8e60602465381fd7a0579c8c9c18a84c9ae9a6abdb45cb462e51a; SGVL06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5. Runtime SHA00995464bde46a5b87298fd30fd9008c63cfefa2b58be1356fe647dcfd4c489c. Clock observed-fixed-scan-v1,1ms steps for component traces; no firmware/physical timing claim. Previous03B178/75/186 all-green test stages and201/1/5 software-case report remain historical pre-R3-model observations, not proof against this newly established native-pair oracle. They were not regenerated/overwritten by this red-only stage.

## Approved primary-source oracle

Read03B_NATIVE_PAIR_FIX_PLAN.md and03B_NATIVE_PAIR_PLAN_REVIEW.md. SDK paths: C:/Program Files (x86)/Beckhoff/TwinCAT/3.1/Components/Safety/1.4.16/v170/SALDesigner.dll andSALDesignerControl.dll. Their exact paths/hashes and method/RVA/IL references are in the plan; file hashes independently recorded in the baseline:

- SALDesigner A0860695D503EB1E81BF07E5810BDB72CF8F3E76C1FCAFD79AF2CA7CC919481C.
- SALDesignerControl A4E62E496DF3F2C2CFCCD8B3D1EAD8B750582D1E4E1C35DD6DFC06DA2585295F.

InPort.GetCoPartner pairs objectIndex8/9,10/11,12/13,14/15. TwoChannelInPortSettings.ReloadCurrentState makes the master enum authoritative: Single-Channel1/2/Both Activated selects first/second/both channels; BothDeactivated selects neither. Slave effective polarity comes from master.Deactivate2, independently of slave's own enum/contact. Two-Channel discrepancy lifecycle is unsupported in this partial adapter and must reject; generic AND Activated and unknown modes must reject. Effective active unbound channels must fail closed, not use a Boolean default. Publisher connectivity masking means this suite does NOT assert what native hardware reads for an unbound declared channel or a specific native diagnostic/group reaction.

## Tests and meaningful red/positive controls

1.64 component matrix cases cover four pair modes×four master contact1/contact2 combinations×four raw input pairs. The own slave contact is deliberately opposite to master contact2, while its own mode is inactive. SDK expectations distinguish raw source selection from one effective inversion. Matrix:52PASS/12FAIL; first-only/none healthy and unsafe controls prevent an always-disabled or always-enabled implementation passing.
2. Slave-own active with master inactive must not activate the slave; inactive unbound channel must be ignored in exact first-only/second-only modes. First-only unbound-slave positive passes; second-only unbound-master and the slave-own field case fail under the old per-port filter.
3. Six negative controls require explicit failure for effective active missing master/slave sources, unsupported generic/unknown enums and Two-Channel. All six FAIL because current API silently executes instead of rejecting. They do not expect a missing function or an import failure.
4. Actual current WINDOW metadata must be exact first-only; current serialized Both mode FAILS. A separate explicit clone of the actual WINDOW is mutated to masterBoth while retaining its unbound slave and other native metadata; that mutation must reject despite slave ownBothDeactivated: currently FAIL. It remains a negative control after the working source becomes first-only. Intended first-only metadata is exercised as an explicit in-memory one-enum control using the real off/Restart sources, with no dummy slave; that positive passes.
5. Four actual main EStop traces use genuine unchanged FBAnd1 producer+FBEstop1 component cuts after full-source parse/audit. NC2FALSE and MenteeTRUE must inhibit on the first sample, retain fault memory after a one-sample pulse/raw restoration, and require a new manual Restart. Held Restart at bad-input entry cannot enable. Each trace includes healthy/manual-restart positives; all four FAIL on observed behavior, not infrastructure. PLCproducer95/EStop21 first-sample stale-producer/next-sample fault behavior is separately preserved as a PASS control. Main SAL is unchanged.
6. Shared physical source closure must demand mainEStopIn2/4 and retain the real NC2/Mentee alias IDs/consumer boundaries despite ownBothDeactivated. Both metadata cases FAIL. In-memory mutation removes only each main-slave usage while retaining the alias and its other consumers: current closure wrongly executes2116 scans instead of rejecting before scan0; both FAIL. A missing helper master source already rejects, giving a PASS negative control. Mutations are deliberately applied after an original whole-source parse/audit and do not claim serialized mutation namespace validation.

## Scope and next handoff

Component matrix uses explicit raw-source boundaries with actual native port/objectIndex metadata; it is an adapter contract, not a hardware simulator. The main branch tests do not depend on running the defective WINDOW. Closure tests intentionally exercise that current helper and reveal own-field exclusion; the later tiny first-only source fix and shared effective-pair runtime/closure repair must be reviewed together. No safeEstop.Error/group lifecycle/discrepancy/EDM/physical proof is inferred from ErrorFALSE or from these source-level tests. Existing R&D reachability/PLC policy/early-STO limits remain.

Next step requires independent red-test review and a local checkpoint before implementation authorization. Then apply only approved WINDOW enum repair plus one shared effective-pair resolver for runtime and source closure, migrate demonstrably wrong host-only expectations without changing original main SAL, and rerun targeted/full software suites with honest case deltas. No implementation performed in this stage; no commit/push/deploy/build.

Independent test-review correction: the Both/unbound negative now explicitly clones the actual WINDOW and sets masterBoth. It no longer relies on the source remaining defective. The separate exact first-only source assertion is unchanged. Regenerated86-case baseline remains56PASS/30FAIL; test SHA256 e78f76484500f450d6e95d3d56ea0f1213f98fdd1b43ae54b58dec374386b121. No program/adapter changes. Editor STOP.
