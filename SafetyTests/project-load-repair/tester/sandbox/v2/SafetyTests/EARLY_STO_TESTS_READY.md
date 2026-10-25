# Early STO red tests — READY for independent test review

2026-10-19, after checkpoint a9f809b. Tests-only stage; actual SAL253, SGVL and runtime remain unchanged. No full software report was overwritten. Implementation is not authorized by this report.

## Results

Target: node --test test/current-early-sto.test.js (SafetyTests cwd): **88 tests,32PASS,56FAIL,0skip,0infrastructure errors**. These are real failing acceptance assertions on existing APIs, not missing implementation imports or expected-failure tests marked green.

-16 uncut physical scenarios fail both STO outputs at accepted-SU N+2: both button orders, raw HVHealthyFALSE/TRUE with C2FALSE, fixed1/2/5/10ms. Real recognizer SU is observed through SGVL, never seeded. Whole interval before acceptance/N+1/N+2 and later feedback is monitored; other ordinary/late Set producers are inactive before feedback. PLC indication follows actual Network10 output copies. The existing completion TON qualifies at exactly100ms from its real input; confirmation/dischargeReset/ResetPB remainFALSE until later C2TRUE/invertedHealthy, then old fanout enables both outputs.
-32 old-route first-fault cases fail: perdrive ordinary Network5 and late Network12completion, eight raw permissions (ESNC1/2, ExternalInterLockNC1/2, bothconnectors, PLCstop and Mentee). Every pair establishes a real pending SetORTRUE/RSFALSE, and each has an identical healthy positive.
-8 old-route one-sample PLC pulse/recovery cases fail: perdrive/bothroutes on1/10ms. Every sample through recovery is checked; late main EStop memory is observed off rather than treating raw restore as Restart.

32PASS include the two fixture contracts, four healthy pending Set positives, four actual latched controls, eight physical-fault controls, two physical-pulse controls, four actual manual-Restart positives, four Step4 timed Reset controls, two real Reset/Set collisions and two Step1 feedback-dependent Reset controls. Qualitative oracles were not relaxed to erase failures.

## Shared observation extension

Only optional additive observedSignals was added to physicalRndSource. Existing keys cannot be rebound; unknown names cannot become invented inputs. Demand roots, frames, get, previous/current values and rise counts all use the same merged map. Additional roots observe real STO1/2, real PLCstatus1/2, acceptedSU, completion flags and all existing Set/Reset request globals.

Default69 regressions: **69/69PASS**. Their complete case observations/transitions/rises/timings equal accepted R3 physicalDetails.cases byte-for-byte (SHA256 0a48467429553fd86a579afa575955bbec790d83e91924fc71e2e11f96a12a53). Original69 tests were not edited. The new empty-option/default contract also deep-compares fixture scope, frames, transitions and rise counts.

Whole SAL/SGVL binding audit precedes union dependency closure; shared effective EStop pair resolver is reused. Expanded scope currently measures163blocks on each grid (not a fixed future oracle), with no demanded unknown inputs. Complete original Set/Reset aggregates, RS, Network5timers/ordinary writers, Network7timed Reset, Network2Reset, main EStop/PLCproducer and Network10status are included. Typed Network3 phase cuts and raw values are recorded.

## Reviewed completion isolation and future compatibility

Review found that an uncut future-correct early SU would enable STO before old completion could establish pendingORTRUE/RSFALSE. The architect clarification and independent technical review therefore authorize exactly two consumer-specific FALSE boundaries **only for completion Setguard families**: STATE_SU/RsOut→Network1/FBOr8/OrIn3 and→FBOr10/OrIn3. The wrapper is installed after full uncut audit/closure, checks exact canonical producer/consumer identities and native contact, and overrides only those consumers via fixture-local readRaw. It does not mutate SAL, graph, runtime source, whole SU, oldcompletion writers, aggregate or RS memory.

On this baseline the two new edges are absent/inactive: evidence records edgeAbsentInBaselineTRUE, actual typed source/target IDs and zero overridden reads, rather than inventing bindings. After implementation an edge must actually exist with exactly the approved source and direct activation before the boundary can apply. All completion healthy/fault/pulse/manualRestart/latched pairs use the same boundaries. Pending waits for both genuine lateproducerTRUE and actual SetORTRUE with RSFALSE.

Physical N+2 and later completion remain uncut. Ordinary routes, Step4/Step1 Reset and collision controls remain uncut. Deliberate simultaneous Step2/Step4 phase cuts in collision tests expose Reset dominance; they do not claim full sequencer reachability. No Reset/Set global, latch or acceptance is seeded.

## Evidence and limits

EARLY_STO_RED_BASELINE.json contains case checks, event timestamps, all source orders/dependency scopes, actual raw/program snapshots, and full waveforms encoded as lossless consecutive identical-frame spans (start/end/samplecount). Interval checks execute on every original scan, including first events, not only endpoints. Source SHA256 dd9fd938fd5493795a7eea7b29cb027d7e994e2a55e2ad02d2ca66cb4beb6923; SGVL 06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5; runtime 14d50f182e42c7aea814eb0c221fbeadbc9becf20f7ac575d263b8cb4f14698e. Helper/test/requirements hashes are included in JSON.

Clock contract observed-fixed-scan-v1 and native-estop-pairs-v1 unchanged. Explicit ownership/raw boundary scenarios do not prove full BOOT/phase reachability, PLC-only launch policy, Network4/group lifecycle or native Error semantics. Physical precision, Build/Verify/CRC and deployment remain outside scope. Original source/model/acceptance reports were not rewritten; no new source fix/push/deploy performed. Editor ALL WRITES STOP pending independent review/checkpoint.
