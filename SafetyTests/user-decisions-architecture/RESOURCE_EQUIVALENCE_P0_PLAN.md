# P0 resource-equivalence plan — frozen handoff

2026-10-20. **READY for independent plan review. ALL WRITES STOP for RESOURCE_EQUIVALENCE_P0_PLAN.md and RESOURCE_EQUIVALENCE_P0_PLAN.json after this handoff.** No SAL/SGVL/test/runtime change or equivalence candidate was produced. Full stop architecture continues separately; these two files are an immutable resource-only proposal.

Base: canonical accepted LV SAL b7096fa3cf7349ea0be08f347180deb071a0f6b75612c4e5c8a7f45cf0557161, SGVL 4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5. Raw source pair is recorded under candidates/lv-completion in JSON.source. Root reports identical canonical working source and checkpoint e5baabd; this proposal does not modify or promote that source.

Whole original binding audit PASS before graph selection. **254−13+0=241 native function blocks**, retained orders monotonically reranked1..241. Fourteen native slots remain to255. No timer/parameter/native stateful duration retired or added. RunTON2 remains in this resource package. New behavior from the user stop decisions is outside this package.

## Authoritative machine handoff

Use JSON.expected.fullOrderedManifest (241 entries, native IDs and all port definitions), expected.canonicalWires, expected.globalRefs and expected.variableAliasManifest. sourceNetworks/sourceVariables/sourceAudit are frozen original evidence. expected fields are the proposed post-change data; retained ports' sources/targets/globals have been rewritten to that expected view, avoiding stale retired paths. Exact new wiredLink IDs are provided once per edge; do not duplicate links at both endpoints.

The edge delta is343→330:21 removals and8 additions. Ordinary-global references remain200→200, with the three writer moves and five replacement readers listed in diff. Four direct input-alias logic-reader moves are listed separately. Alias device/channel/function mappings remain unchanged. Only their program reader-port usage indexes change; hardware origin is not investigated. All ordinary global declarations and initial data remain unchanged.

Every newly activated AND/OR input uses direct Break Contact (NC); do not inherit an unspecified inactive-port contact. Deactivated unused ports remain unchanged. Native usage indexes and DSL relationship wrappers must match the exact reader/writer/edge lists. Retired block/port definitions and their usages are removed; no dangling retired ID is permitted.

## Staged changes and proofs

| Stage | Before→after | Retire | Proof |
|---|---:|---|---|
| P0 |254→252|G027,G028|S&&(FallG OR FallB)=(S&&FallG) OR(S&&FallB); arbitrary8-tuples; writer order unchanged|
| P0b |252→251|STATE_P|Reset=!X,Set=X implies Q=X for either priorRSvalue; move recP writer to G008|
| P0c |251→249|STATE_PrevG,STATE_PrevB|Same level identity; move rawG/B publication to existing Decouple channels6/7|
| P0d |249→244|N3 OR8,OR10,OR12,OR14,OR15|Single-input identity and duplicate OR(X,X), no writer between old/new readers|
| P0e |244→242|N7 And6,And7|Merge two2-input conjunctions into existing And8; arbitrary16-tuples|
| P0f |242→241|N7 Decouple2|Pure identical relay bypass And2→both retained5s timer inputs|

JSON.steps contains exact port/global GUIDs, new writer reference IDs, every consumer window and native binding change. JSON.retired contains all13 native block IDs. No phase onehot assumption appears in these identities. The retained RS blocks retain their native reset dominance.

### Ordered publication and first scan

recP's sole reader SNAP0 input1 runs120, before both old writer STATE_P161 and proposed G008135. recPrevG/B's sole readers SNAP1 inputs1/2 run121, before both old170/171 and new existing N6Decouple2 at206. Raw button input variables have no program writer within the scan. Thus a reader obtains the same previous-scan publication in every scan. In the first scan, it reads the same unchanged existing ordinary-global initial data before either implementation publishes a new value. No assertion that the global must initializeFALSE is needed. Original RS outputs and receiving Decouple outputs retain replacementValue0; no whole-group BOOT conclusion follows.

The new Prev writer uses a different late Decouple, not feedback inside SNAP. It relies on the documented independent channel relation, not assumed JavaScript loop order or same-block input/output commitment. Existing channels1–5 and8 are unchanged. Channels6/7 have no master or shared qualifier; pair the new DecIn6/7 with DecOut6/7 and update both usages.

### Global reader windows

Step4Set: sole writer62→oldOR64→RS65. Step5Set:76→78→79. Step6Set:87→89→90. RndSet:119→OR14183→RS7Set184; OR15185 duplicates the same currentRndSet and feeds RS8Reset187. No producer writes inside any replaced interval. Every consumer is after the old OR in the same scan, so this bypass removes no previous-scan delay, including the first scan. Removing N3OR4 is deliberately outside this proposal: its early Safe-reset consumer would need a different timing proof.

N7OR1/2 writers72/73 precede removedAnd6/7 readers74/75 and retainedAnd8 at76. RawSTO feedback has no program writer, so flattening preserves exactly the four values consumed. N7And2 at69 precedes removed Decouple2 at71 and both retained5s TON calls105/106; relay output has no alias/global export or intermediate reader. Direct bypass preserves both TON enable levels and their own accumulated states. Equal timer settings alone are not used to merge clocks.

### Primary native contract and limits

[Beckhoff TwinSAFE Logic FB,§4.6.1](https://download.beckhoff.com/download/Document/automation/twinsafe/twinsafe-logic-fb_en.pdf) specifies eight corresponding one-to-one DECOUPLE channels and requires both members of each used pair to be linked. This supports independent spare-channel use and simple relay bypass. It does not establish group startup, physical signal origin or hardware communication behavior. Existing group/hardware mappings remain fixed.

No external exported output is removed or remapped: JSON.proofs.outputNoRetirement is empty after checking all direct variable sourcePorts, not just global references. Internal global publication order changes as listed; all actual graph reader values are preserved by their source windows. Every retained native parameter GUID/value is listed in expected.retainedParams.

## Review and candidate gate

Independent reviewer must verify the frozen source hashes, all13 removals, full canonical ports/edges/ordinary-global writer and alias-reader changes, initial-reader proof, each source window and order-preserving rerank. Then an editor may build an isolated pair only on root assignment. Full SAL/SGVL binding/usage/wrapper audit precedes any graph cut or functional execution. No working-source promotion is implied.

The isolated equivalence candidate requires independent paired source traces and the existing complete selected regression package, including firstscan/release/phase handoffs, Safe guards, RnD69/earlySTO88, LV completion/noautoenergy/legacyStep2, emergency40 and canonical full software checks. Structural expectations may migrate only by this exact ledger; functional oracles must not be weakened. All retained timer conditions/hold/reset and native values must remain identical. Failure returns to architecture; editor self-check is not independent acceptance.

SevenN4 cuts/initialphase restrictions remain component limits. Existing stop defects and unanswered fault-reset behavior remain outside P0; green equivalence does not close them. No native Build/CRC/Verify, equipment action, hardware safety or whole-group startup claim is made.
