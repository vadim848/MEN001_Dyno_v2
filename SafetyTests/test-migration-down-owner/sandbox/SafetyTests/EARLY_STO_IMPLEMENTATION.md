# Early physical R&D STO implementation

2026-10-19. Reviewed red checkpoint2ddafef; implementing EARLY_STO_ORDER_REVIEW_PLAN minimal old-order package and the reviewed fixture clarification. Historical three-input/tail relocation alternatives in EARLY_STO_PROGRAM_PLAN were not used.

## Actual program change

Two native safeAnd blocks FBAndSto1SetPermit/FBAndSto2SetPermit inserted immediately before old STO RS3/4. Four active inputs each: full existing per-drive Set OR; current FBAndLvCurrentPermit; inverted raw Mentee through proper existing SAL alias target usages; previous actual Network1/FBAnd1 PLC permission. Other four inputs inactive. Existing OR8/10 spare OrIn3 now receives direct accepted physical STATE_SU/RsOut. Both original OR→RS Set edges are replaced with OR→guard→RS. Existing ordinary and late completion writers remain, all passing the same guards.

Native255 blocks: guard1=10, RS3=11, guard2=12, RS4=13. All253 old blocks remain in the same relative order (old<10 unchanged, old10→11, allold>10→old+2). There is no tail relocation. Old Reset/confirmation/discharge/ResetPB and PLCstatus fanout remain. All original parameter and native port attributes are preserved except activation/direct contact of the two approved free OR inputs. SGVL and runtime are byte-identical; original main EStop and hardware alias descriptors unchanged. Exactly two extra logical Mentee consumers; no hardware mapping change.

Physical accepted SU appears after early OR/RS in scanN. OR captures retainedSU atN+1, guard/RS consume it atN+2. Both STO outputs TRUE mean torque permission. No C2/HV Healthy wait was added; later Run confirmation still requires original0.1s TON and feedback. These are software scan observations, not a physical zero-time claim.

## Native identity and preservation proof

Source-bound one-shot scripts/implement-early-sto.js creates deterministic GUIDs and performs full structural audit before writing. EARLY_STO_NATIVE_MANIFEST.json records source/result/SGVL SHA, deterministic namespace/IDs and exact order mapping. Source byte SHA is checked against immutable red baseline; normalized Git blob SHA is separately recorded because Git checkout line endings differ. Original CRC metadata is retained and not claimed regenerated.

Four new executable native tests verify all253 original IDs/orders, contiguous255 budget, every old parameter/native port attribute, unchanged SGVL bytes, exactfour contacts/bindings and complete canonical edge delta (remove2/add10), unique actual GUIDs and deterministic manifest. Full source binding audit always precedes graph selection.

Old metadata assertions updated only for255count/+2orders, two Mentee fanouts and added previous-PLC consumers. Existing qualitative transition/fault/hold expectations remain. SAL-INPUT02 producer-deletion mutation now expects missing OR8 at its actual new direct consumer AndSto1SetPermit/AndIn1 instead of the removed old RS3Set direct path; it still requires the same missing-port-producer and source identity.

## Functional evidence

Reviewed88 tests unchanged byte-for-byte:88PASS, formerly32PASS/56FAIL. Sixteen physical cases cover both button orders, HVHealthyFALSE/TRUE with C2FALSE,1/2/5/10ms grids and actual SU→N+2 outputs. Thirty-two old-producer first-fault and eight PLCpulse/recovery cases repaired. All healthy/manualRestart/already-latched/Reset/Setcollision/timed feedback controls retained. Exact100ms completion timer and downstream confirmation/dischargeReset/ResetPB controls still PASS.

Completion-only legacy producer suites use the reviewed two consumer-specific FALSE boundaries for parallel early SU inputs after original full audit/closure. Actual edges now exist and are identity-checked, and their read counts are recorded. GenuineSU and all oldcompletion producers stay real; no request/aggregate/RS seed. Uncut physicalN+2/laterfeedback and ordinary/Reset tests provide separate integrated evidence.

Eight Step1/Step4/Resetcollision waveforms are byte-identical to red baseline frame spans. Default69 physical tests remain69PASS and their complete case/traces identical to acceptedR3. R3pairs86+physical69+PLC48:203PASS; oldguard group112PASS; newnative4+compact5PASS. Current expanded closure measures165 (previous163), automatically including both guards; count is a measurement, not fixed future oracle.

The first full run had413/413 current and75/75 historical PASS; harness177/178 exposed only the stale direct-consumer mutation address above. That was corrected with a targeted7/7PASS. Two indentation-only blank lines left by deleted edges were then cleared (no functional change), manifest updated and final full report regenerated with fresh88/69 evidence on final SHA. No source changes beyond the approved graph/order delta and those two whitespace lines.

## Limits

This is scoped software acceptance, not complete BOOT/Network3 reachability or PLC-only launch policy. Explicit phase cuts, given raw inputs and component isolation are recorded. Existing no-EDM/nativeError adapter/group lifecycle limitations remain; no hardware/nativeBuild/Verify/CRC/deploy claim. Current mandatory coverage gaps and remaining Network3 conflict are reported separately, not hidden by green test stages. Final source/model/artifact metadata, case-ID delta and full counts follow below.

## Final matching evidence / writer stop

Final SAL SHA256 0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909. SGVL 06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5; runtime 14d50f182e42c7aea814eb0c221fbeadbc9becf20f7ac575d263b8cb4f14698e. Immutable reviewed88 test SHA 23555484aa1661b99f29ae741d7759a9df315cfc0f61b42ed53614cd8f6f5873; immutable red baseline SHA 83309c46691694b10346bf386bdb99b75ab4cb98a7294e5304345950926b646b.

Final full package: harness 178/178 PASS; historical 75/75 PASS; current 413/413 PASS. Software cases {"PASS":201,"FAIL":1,"NOT VERIFIED":5,"ERROR":0}, status delta versus2ddafef []. Standalone {"PASS":47,"FAIL":0,"NOT VERIFIED":5}. Exit1 reflects the preserved STATE:conflicting-set-requests case; five previous NOT VERIFIED gaps remain. The56 repaired earlySTO suite cases are separately identified and do not erase those broader gaps.

EARLY_STO_CURRENT_RESULTS.json contains fresh final-source88 waveforms/checks, all56 FAIL→PASS IDs, exact8 preserved Reset waveform identities, fresh default69 identity, current scopes/read-boundary ledger, source/model/test/manifest/report hashes and full per-ID status delta. All88 acceptance oracles are unchanged. Editor ALL WRITES STOP; independent implementation review pending.
