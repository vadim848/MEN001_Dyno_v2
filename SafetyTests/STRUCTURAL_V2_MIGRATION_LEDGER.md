# Structural V2 migration ledger

2026-10-20. Read-only architecture audit; only this ledger is written. This is an authorized-delta specification for independent test migration, not an instruction to refresh expectations until green. The 17 entries classified oldstructural in v2/migration-map.json are covered below; functional closure/CVR/PLC tests remain owned by the independent tester.

## Exact file identities

| Pair | SAL raw SHA256 | SGVL raw SHA256 |
| --- | --- | --- |
| Current production / migration baseline | 0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909 | 06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5 |
| Frozen isolated V2 under candidates/down-episode-owner/v2 | 72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e | de0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56 |

Production is still 0fc397/06010c; 72f42/de0fa is the isolated candidate, not a deployed or promoted working SAL. Git checkpoint7e81d0a stores LF blobs whose raw hashes differ from the CRLF working baseline; do not mislabel newline-only differences as native edits. Parser/runtime were not modified by this audit.

## Whole-source invariants and inventory deltas

| Quantity | 0fc397 | 72f42 | Reason |
| --- | --- | --- | --- |
| Native FBs | 255 | 255 | 255 - 8 approved retirements + 8 native additions |
| Networks | 13 | 14 | One ordinary SafeResumption software network added |
| Native input/output ports | 2180 | 2175 | Different primitive mix; audit every actual ID and wrapper |
| Canonical wire edges | 338 | 342 | 20 removed / 24 added, listed below |
| Global FB references | 196 | 201 | Program usage changes, not declarations |
| Global writers | 85 | 85 | No new global writer/declaration |
| Outward aliased outputs | 37 | 37 | Hardware aliases/mappings unchanged |
| Stateful FBs | 52 | 53 | Two RS added, one obsolete TON retired |
| safeTon | 21 | 20 | Retire old Safe TON3; reuse existing qualified BOTH TON |
| Parameter ports | 23 | 22 | Only retired Safe TON3 parameter disappears |
| Global declarations | 85 | 85 | IDs/names/types unchanged |
| Alias target usages | 183 | 178 | Explicit logical consumers change; physical alias descriptors unchanged |
| Full SAL/SGVL binding audit | PASS | PASS | Fresh explicit matching pair, not copied PASS |


## Approved native retire/add manifest

Authority: SAFE_RUN_GESTURE_COUNTED_PLAN.json.downEpisodeOwnerCandidateV2, version down-episode-owner-v2-demorgan. The following GUID differences were read from actual whole XML, not inferred by basename.

| Retired path | Native ID | Old order |
| --- | --- | --- |
| //Network2/FBTon3 | 2adeda32-5d9f-46c9-ac21-2db052de0682 | 26 |
| //Network2/FBAnd10 | bb0dcd4b-fc2d-42eb-b3e6-452cd3114a69 | 238 |
| //Network12/FBAnd5 | 7e67f81c-ad73-4ddc-8541-97d0b9370257 | 175 |
| //Network12/FBAnd7 | 8a0162c0-f4a4-45d7-93f9-55a36d165586 | 179 |
| //Network12/FBAnd18 | 6052e4b6-edc7-4cae-b3eb-2dd48994ef78 | 251 |
| //RndPhysicalCompact/GATE_017 | 8594090d-b2f3-e5ca-e63c-5c151b0899e1 | 144 |
| //RndPhysicalCompact/GATE_018 | ec60c4da-7708-9113-5509-8633e88c8718 | 145 |
| //RndPhysicalCompact/GATE_019 | 20ba4b86-c431-ece6-76e2-35e69a09b1a5 | 146 |

Retire reasons: N12 And5/7 are pure terminals and And18 feeds only those; N2 And10/TON3 are replaced by qualified Safe BOTH with retained And3 readiness; FinishG/B are redundant current-TON guards; GATE019 is the sole inverted OR consumer folded by De Morgan. GATE020 FinishUp is retained, scoped to RND_SCOPE and consumed in the same scan by CSet. Run TON2/And23/And24 remain.

| Added path | Native ID | New order |
| --- | --- | --- |
| //SafeResumption/MODE | e5158806-2aed-4caa-8442-066af83d2440 | 122 |
| //SafeResumption/CONNECTORS | 7b354725-d880-4e61-be0e-0bdb2125ad8d | 123 |
| //SafeResumption/CONNECTOR_SCOPE | 5391df7b-9663-4ee5-83c4-a4bbdb771d6e | 124 |
| //SafeResumption/RND_SCOPE | 4ffc6b9c-3792-4e1d-a93c-f5c09271a86d | 126 |
| //SafeResumption/SAFE_UP_SCOPE | d056cd37-9d13-4df7-bbdf-43fcb2946cc3 | 127 |
| //SafeResumption/SG_OWNER_SET | 1beefe3c-7f20-4b80-aeec-e2c919526b87 | 166 |
| //SafeResumption/SAFE_ACCEPTED_UP | 1026d20d-506a-455b-b77a-02abfe82eb1d | 145 |
| //SafeResumption/RND_DOWN_STEP2_OWNER | 8e0c7ae7-10dd-48f6-9ead-cff78d3f1886 | 26 |


The dedicated episode RS evaluates after actual Step2 RS22 and before N5 power qualifier27. It sets from the prior-late actual RnD down request, resets when actual Step2 is FALSE, and blocks N5 And1 via its free input4. It neither reuses LV discharge as an owner nor chooses discharge completion. The original SG_OWNER_SET and SG reset remain unchanged.

## Exact migration of the 17 historical structural tests

| Map row | Original test location | Old assertion | V2 invariant and reason |
| --- | --- | --- | --- |
| 35 | current-door-interlock.test.js:58 | Byte-equality of three Door consumers after order masking | Keep their native port attributes, logical inputs and component truth tables; compare parsed/canonical relationships, not historical whitespace serialization. No Door energy guard is reintroduced. |
| 37 | current-early-sto-bindings.test.js:15 | Every earlier253 block present, fixed +2 order rule, byte-identical06010 SGVL | Layer early-STO invariant over approved8/8 delta: 247 retained native blocks, contiguous1..255, only And4 changes relative place. STO SetPermits/RS remain10/11 and12/13; SGVL logical delta is enumerated below. |
| 38 | current-early-sto-bindings.test.js:25 | Prior edge set plus only two replaced STO Set edges | STO edges/contact polarities remain exact; permit additional explicit V2 wire delta20remove/24add. Reject every unlisted edge or duplicate. |
| 39 | current-early-sto-bindings.test.js:42 | All historical port attributes except two OR inputs unchanged | Retired ports are absent by manifest; retained attributes differ only at listed V2 mutable inputs. Keep all unaffected IDs/attributes and early-STO OR3 direct SU inputs. |
| 40 | current-early-sto-bindings.test.js:47 | Whole current SHA and all new IDs equal old early-STO manifest | Old deterministic manifest remains historical evidence; validate those retained IDs and actual source-bound V2 artifact IDs/hashes separately. Do not rewrite the historical evidence to impersonate V2. |
| 215 | current-hv-set-permit.test.js:19 | Permit/gate/RS/aggregate orders [2,5,6,222] | [2,5,6,224]; sole canonical HV Set path, original aggregate inputs and four active native guard inputs remain unchanged. |
| 218 | current-hv-set-permit.test.js:65 | SGVL differs from old B1 only by07 usage plus compact variables | Retain historical delta then apply exactly the five-variable V2 target-usage delta below; declarations/source usages unchanged. |
| 234 | current-native-bindings.test.js:22 | Historical alias consumer list plus fixed additions/count36 | Layer exact V2 alias additions/removals below onto old contract; physical alias descriptors and source mappings unchanged. Native canonical required wires still required. |
| 252 | current-native-bindings.test.js:117 | Removing compact+two07 usages reproduces c024651 SGVL | Preserve historical assertion on its historical pair; for V2 remove only the explicitly authorized target-usage delta before comparing. No declaration/type/source-writer relaxation. |
| 253 | current-native-bindings.test.js:127 | PLC producer at97 with exact5-way fanout | Producer96, same five consumers and four native guard inputs; no policy change. |
| 302 | current-rnd-compact.test.js:12 | 47-block compact network and old optimized order sequence | 44 retained compact FBs; merge approved manifest then check exact255 order, type/ID and full binding audit. No arbitrary blanket order refresh. |
| 303 | current-rnd-compact.test.js:17 | Every original compact node/port/binding present | G17/G18/G19 absent by approved retirement; all retained IDs and unchanged parameters survive. Check explicit mutable bindings below, all other port attributes exact. |
| 304 | current-rnd-compact.test.js:38 | Original compact canonical graph/integration edges all remain | Apply exact20/24 whole-source delta; And3 remains in Safe And4, FinishUp same-scan CSet retained; direct SU-to-both-early-STO OR3 retained. Reject new bypass/duplicate driver. |
| 305 | current-rnd-compact.test.js:42 | All old parameter identities and TON count21 | 20 TON; retire only N2TON3 parameter0ea18d96-558a-4426-b35c-818e6751fd11 (1.0s). Every other timer parameter ID/value unchanged; BOTH remains1.0, singles0.5, window0.25, release2.0. |
| 306 | current-rnd-compact.test.js:49 | Ten compact globals exact source/target indices; prior SGVL unchanged | Ten compact variable declarations and usages actually remain unchanged; other prior SGVL gets only five-variable target delta. Source usage indices unchanged. |
| 391 | current-step12-lv-permit.test.js:17 | LV aggregate order221 | 223; [permit,set,RS]=[2,3,4] unchanged; original three aggregate sources/sole Set path remain. |
| 423 | current-unlock-hold.test.js:25 | Final hold255 plus old expectedOrder for every old block | Final hold255 and native IDs/sole writer remain; skip only approved retired IDs, compare all retained orders against V2 manifest, permit only declared And4 relative move. Separate raw-blue behavioral oracle belongs to requirement migration, not this structural row. |


## Exact selected execution orders

| Retained path | Old | V2 |
| --- | --- | --- |
| //Network1/FBRs1 | 4 | 4 |
| //Network1/FBRs2 | 6 | 6 |
| //Network1/FBAnd1 | 97 | 96 |
| //Network1/FBOr17 | 221 | 223 |
| //Network1/FBOr18 | 222 | 224 |
| //Network1/FBAndUnlockHold | 255 | 255 |
| //Network1/FBAndLvCurrentPermit | 2 | 2 |
| //Network1/FBAndHvSetPermit | 5 | 5 |
| //Network2/FBAnd4 | 27 | 144 |
| //Network5/FBAnd1 | 28 | 27 |
| //Network11/FBAnd1 | 117 | 116 |
| //Network11/FBAnd4 | 119 | 118 |
| //RndPhysicalCompact/GATE_001 | 123 | 125 |
| //RndPhysicalCompact/GATE_023 | 149 | 152 |
| //RndPhysicalCompact/STATE_SU | 164 | 168 |

All 247 retained blocks preserve relative order except existing Safe And4 moved behind current BOTH and before Safe accepted owner/CSet. This is not a global fixed offset: insertions and retirements occur at several positions. Use the complete reviewed ordered manifest, retaining actual native GUID identity.

## SGVL target-usage delta (no declarations/source usages changed)

| Variable | Operation | Port | Actual port ID |
| --- | --- | --- | --- |
| b_Step2 | ADD | //SafeResumption/RND_DOWN_STEP2_OWNER/Reset | bad967c7-3245-45a0-a682-4a8088005ec4 |
| b_Step1 | ADD | //SafeResumption/MODE/OrIn1 | fc505831-3181-45ef-b8d9-75e4ba664724 |
| b_Step1 | ADD | //SafeResumption/CONNECTOR_SCOPE/OrIn1 | 2a00190a-807e-44bd-859f-d46c3f363372 |
| b_Step1 | ADD | //SafeResumption/SAFE_UP_SCOPE/AndIn2 | 9956d688-96f7-4b87-9693-13901e85a893 |
| b_Step1 | ADD | //SafeResumption/SG_OWNER_SET/AndIn2 | 554673b6-c334-4fb5-88de-de20c1c016b8 |
| b_Step1 | REMOVE | //Network2/FBAnd10/AndIn1 | 0dc3f3f0-ff0d-43d0-b48c-63a885fc5839 |
| b_EStop_Ok | ADD | //RndPhysicalCompact/GATE_001/AndIn3 | a0f614e5-eceb-0f4a-b30d-decfe7b8738c |
| b_Step_RnD | ADD | //SafeResumption/MODE/OrIn2 | 10b63501-9011-40f2-afe6-55809eb6b2ca |
| b_Step_RnD | ADD | //SafeResumption/RND_SCOPE/AndIn2 | 36c52a3e-d7e9-489c-8afc-42469bb6698c |
| b_Step_RnD | REMOVE | //RndPhysicalCompact/GATE_001/AndIn1 | d67690a6-7037-1fa6-4c0b-5dc60799e6b9 |
| b_ResetPB_Lock | REMOVE | //Network12/FBAnd18/AndIn1 | c33db48f-bfbb-425f-94ee-5148292da0c4 |

Retained native port IDs are reused; new clone port IDs above are frozen to the candidate artifact. Eight target usages added and three removed (net+5); names/types/declaration IDs and every source-usage list remain unchanged.

## Alias logical consumer delta

| Given program alias | Operation | Consumer |
| --- | --- | --- |
| in_LV_Connector_Interlock | ADD | //SafeResumption/CONNECTORS/AndIn1 |
| in_HV_Connector_Interlock | ADD | //SafeResumption/CONNECTORS/AndIn2 |
| in_InterLock_NC_1 | ADD | //RndPhysicalCompact/GATE_001/AndIn5 |
| in_InterLock_NC_2 | ADD | //RndPhysicalCompact/GATE_001/AndIn6 |
| in_Mentee_EStop | REMOVE | //RndPhysicalCompact/GATE_001/AndIn4 |
| in_Reset_PB | REMOVE | //Network12/FBAnd5/AndIn2 |
| in_Reset_PB | REMOVE | //Network2/FBAnd10/AndIn2 |
| in_Reset_PB | REMOVE | //RndPhysicalCompact/GATE_017/AndIn3 |
| in_Relase_Door_PB | REMOVE | //Network2/FBAnd7/AndIn2 |
| in_Relase_Door_PB | REMOVE | //Network12/FBAnd5/AndIn3 |
| in_Relase_Door_PB | REMOVE | //Network12/FBAnd7/AndIn3 |
| in_Relase_Door_PB | REMOVE | //Network2/FBAnd10/AndIn3 |
| in_Relase_Door_PB | REMOVE | //RndPhysicalCompact/GATE_018/AndIn3 |
| in_False_SI2_CH8 | REMOVE | //Network12/FBAnd18/AndIn2 |
| in_Estop_PLC | ADD | //RndPhysicalCompact/GATE_001/AndIn4 |

The deleted explicit Mentee consumer at compact E is redundant only because real paired main EStop23 evaluates it before E125; all actual Mentee Set guards remain. Green/raw Restart and Unlock hold/reset consumers are retained.

## Full canonical edge delta

| Operation | Source port | Target port |
| --- | --- | --- |
| REMOVE | //Network1/FBAndLvCurrentPermit/AndOut | //RndPhysicalCompact/GATE_001/AndIn3 |
| REMOVE | //Network2/FBTon3/TonOut | //Network2/FBAnd4/AndIn1 |
| REMOVE | //Network2/FBAnd4/AndOut | //Network2/FBOr1/OrIn1 |
| REMOVE | //Network2/FBAnd10/AndOut | //Network2/FBTon3/TonIn |
| REMOVE | //Network12/FBAnd1/AndOut | //Network12/FBAnd5/AndIn1 |
| REMOVE | //Network12/FBAnd1/AndOut | //Network12/FBAnd7/AndIn1 |
| REMOVE | //Network12/FBAnd18/AndOut | //Network12/FBAnd5/AndIn4 |
| REMOVE | //Network12/FBAnd18/AndOut | //Network12/FBAnd7/AndIn4 |
| REMOVE | //RndPhysicalCompact/GATE_001/AndOut | //RndPhysicalCompact/STATE_SU/Reset |
| REMOVE | //RndPhysicalCompact/GATE_005/AndOut | //RndPhysicalCompact/GATE_017/AndIn1 |
| REMOVE | //RndPhysicalCompact/GATE_005/AndOut | //RndPhysicalCompact/GATE_018/AndIn1 |
| REMOVE | //RndPhysicalCompact/GREEN/TonOut | //RndPhysicalCompact/GATE_017/AndIn2 |
| REMOVE | //RndPhysicalCompact/BLUE/TonOut | //RndPhysicalCompact/GATE_018/AndIn2 |
| REMOVE | //RndPhysicalCompact/GATE_017/AndOut | //RndPhysicalCompact/GATE_019/OrIn1 |
| REMOVE | //RndPhysicalCompact/GATE_017/AndOut | //RndPhysicalCompact/GATE_030/OrIn1 |
| REMOVE | //RndPhysicalCompact/GATE_017/AndOut | //RndPhysicalCompact/STATE_SG/Set |
| REMOVE | //RndPhysicalCompact/GATE_018/AndOut | //RndPhysicalCompact/GATE_019/OrIn2 |
| REMOVE | //RndPhysicalCompact/GATE_018/AndOut | //RndPhysicalCompact/GATE_030/OrIn2 |
| REMOVE | //RndPhysicalCompact/GATE_018/AndOut | //RndPhysicalCompact/STATE_BA/Set |
| REMOVE | //RndPhysicalCompact/GATE_019/OrOut | //RndPhysicalCompact/GATE_023/AndIn4 |
| ADD | //Network1/FBAndLvCurrentPermit/AndOut | //SafeResumption/SAFE_UP_SCOPE/AndIn3 |
| ADD | //Network2/FBAnd4/AndOut | //SafeResumption/SAFE_ACCEPTED_UP/Set |
| ADD | //Network12/FBDecouple1/DecOut3 | //SafeResumption/RND_DOWN_STEP2_OWNER/Set |
| ADD | //RndPhysicalCompact/GATE_001/AndOut | //SafeResumption/RND_SCOPE/AndIn1 |
| ADD | //RndPhysicalCompact/GATE_001/AndOut | //SafeResumption/SAFE_UP_SCOPE/AndIn1 |
| ADD | //RndPhysicalCompact/GREEN/TonOut | //SafeResumption/SG_OWNER_SET/AndIn1 |
| ADD | //RndPhysicalCompact/GREEN/TonOut | //RndPhysicalCompact/GATE_030/OrIn1 |
| ADD | //RndPhysicalCompact/GREEN/TonOut | //RndPhysicalCompact/GATE_023/AndIn4 |
| ADD | //RndPhysicalCompact/BLUE/TonOut | //RndPhysicalCompact/GATE_030/OrIn2 |
| ADD | //RndPhysicalCompact/BLUE/TonOut | //RndPhysicalCompact/STATE_BA/Set |
| ADD | //RndPhysicalCompact/BLUE/TonOut | //RndPhysicalCompact/GATE_023/AndIn5 |
| ADD | //RndPhysicalCompact/BOTH/TonOut | //Network2/FBAnd4/AndIn1 |
| ADD | //RndPhysicalCompact/STATE_BA/RsOut | //Network2/FBAnd7/AndIn2 |
| ADD | //SafeResumption/MODE/OrOut | //RndPhysicalCompact/GATE_001/AndIn1 |
| ADD | //SafeResumption/CONNECTORS/AndOut | //SafeResumption/CONNECTOR_SCOPE/OrIn2 |
| ADD | //SafeResumption/CONNECTOR_SCOPE/OrOut | //RndPhysicalCompact/GATE_001/AndIn7 |
| ADD | //SafeResumption/RND_SCOPE/AndOut | //RndPhysicalCompact/GATE_020/AndIn5 |
| ADD | //SafeResumption/RND_SCOPE/AndOut | //RndPhysicalCompact/STATE_SU/Reset |
| ADD | //SafeResumption/SAFE_UP_SCOPE/AndOut | //SafeResumption/SAFE_ACCEPTED_UP/Reset |
| ADD | //SafeResumption/SAFE_UP_SCOPE/AndOut | //Network2/FBAnd4/AndIn3 |
| ADD | //SafeResumption/SG_OWNER_SET/AndOut | //RndPhysicalCompact/STATE_SG/Set |
| ADD | //SafeResumption/SAFE_ACCEPTED_UP/RsOut | //RndPhysicalCompact/GATE_030/OrIn4 |
| ADD | //SafeResumption/SAFE_ACCEPTED_UP/RsOut | //Network2/FBOr1/OrIn1 |
| ADD | //SafeResumption/RND_DOWN_STEP2_OWNER/RsOut | //Network5/FBAnd1/AndIn4 |

GATE019 has one inverted consumer: G23 input4. V2 uses !currentGreenTON on input4 and !currentBlueTON on free input5. Both TONs execute before G23; !(G OR B)=!G AND !B for arbitrary values/phase flags. No SG gate/reset optimization or global onehot proof is needed.

## Explicit mutable retained inputs

Actual native port-attribute whitelist has exactly eight retained ports:
N2/And4/AndIn3, N5/And1/AndIn4, compact G001/AndIn5/6/7,
G020/AndIn5, G023/AndIn5 and G030/OrIn4. Only channelInterface and, where
needed, deactivate1 change. Every other retained native port attribute is
byte-value identical. Binding/relationship changes below are checked separately;
they must not authorize additional attribute edits. Every retained parameter
attribute was compared by native Id and is unchanged. sal-runtime.js and
sal-parser.js match checkpoint7e81d0a after CRLF-to-LF normalization.

- //RndPhysicalCompact/GATE_001: AndIn1=//SafeResumption/MODE/OrOut; AndIn2=!in_False_SI2_CH8; AndIn3=b_EStop_Ok; AndIn4=!in_Estop_PLC; AndIn5=in_InterLock_NC_1; AndIn6=in_InterLock_NC_2; AndIn7=//SafeResumption/CONNECTOR_SCOPE/OrOut
- //RndPhysicalCompact/GATE_020: AndIn1=//RndPhysicalCompact/GATE_004/AndOut; AndIn2=//RndPhysicalCompact/SNAP_0/DecOut3; AndIn3=//RndPhysicalCompact/GATE_003/AndOut; AndIn4=//RndPhysicalCompact/BOTH/TonOut; AndIn5=//SafeResumption/RND_SCOPE/AndOut
- //RndPhysicalCompact/GATE_023: AndIn1=//RndPhysicalCompact/GATE_005/AndOut; AndIn2=//RndPhysicalCompact/GATE_003/AndOut; AndIn3=!//RndPhysicalCompact/SNAP_1/DecOut3; AndIn4=!//RndPhysicalCompact/GREEN/TonOut; AndIn5=!//RndPhysicalCompact/BLUE/TonOut
- //RndPhysicalCompact/GATE_030: OrIn1=//RndPhysicalCompact/GREEN/TonOut; OrIn2=//RndPhysicalCompact/BLUE/TonOut; OrIn3=//RndPhysicalCompact/GATE_020/AndOut; OrIn4=//SafeResumption/SAFE_ACCEPTED_UP/RsOut
- //RndPhysicalCompact/STATE_SU: Reset=!//SafeResumption/RND_SCOPE/AndOut; Set=//RndPhysicalCompact/GATE_020/AndOut
- //RndPhysicalCompact/STATE_SG: Reset=!//RndPhysicalCompact/GATE_001/AndOut; Set=//SafeResumption/SG_OWNER_SET/AndOut
- //Network2/FBAnd4: AndIn1=//RndPhysicalCompact/BOTH/TonOut; AndIn2=//Network2/FBAnd3/AndOut; AndIn3=//SafeResumption/SAFE_UP_SCOPE/AndOut
- //Network2/FBOr1: OrIn1=//SafeResumption/SAFE_ACCEPTED_UP/RsOut; OrIn2=//Network2/FBAnd91/AndOut
- //Network2/FBAnd7: AndIn1=//Network2/FBDecouple3/DecOut1; AndIn2=//RndPhysicalCompact/STATE_BA/RsOut
- //Network5/FBAnd1: AndIn1=b_Step2; AndIn2=!in_False_SI2_CH8; AndIn3=b_EStop_Ok; AndIn4=!//SafeResumption/RND_DOWN_STEP2_OWNER/RsOut

## BOOT capability tuple: inventory changes do not add capability

Old inventory tuple (blocks, globalWriters, outwardOutputs, stateful)=(255,85,37,52); V2=(255,85,37,53). Native Network4 still has eight unbound inputs/seven phase writers and unused channel8. RunStop/ErrAck bindings and unmodeled group lifecycle are unchanged. FunctionalBootPass remains0, execution.performed=false, no phase cuts/seeds are performed by preflight.

Observed explicit V2 call against the current old trusted BOOT_PREFLIGHT_SOURCE_MANIFEST returns ERROR/SOURCE_COVERAGE_MISMATCH, functionalBootPass0. This is expected source-identity protection, not a functional BOOT defect or PASS. After independently reviewed exact V2 manifest migration, expected capability result remains NOT VERIFIED with UNSUPPORTED_UNBOUND_PROGRAM_INPUT and UNSUPPORTED_GROUP_LIFECYCLE; neither may become PASS from changed inventory counts. Keep mutation/invalid-input rejection tests and runtime identity check intact.

Do not refresh runtime/parser or infer hardware safety, native Verify/Build/CRC, full BOOT, final Safe completion, or resolution of the retained Run failures. The ledger itself is source analysis; independent migrated tests must be run and reviewed before any acceptance claim.
