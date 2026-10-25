# Independent execution review: A1/A2

2026-10-20. **ACCEPT the bounded A1/A2 evidence: 40 PASS, 0 FAIL, 0 fixture errors.** No source repair is proposed by this package. A3 and whole-project acceptance are excluded.

Reviewed PLAN, fixture.mjs, run.mjs, verify.mjs, REPORT, RESULTS, VERIFIED_REPORT.json and PACKAGE_IDENTITY. Read actual fixture closure traversal, native-pair resolution, raw-input protocol guard, per-evaluation native Set/Reset capture and continuous fixed-scan observer. Independently verified all 49 package entries and all 40 lossless archives with readonly checks; no package file was regenerated or rewritten.

- RESULTS SHA256 `a75018be60a84d3c11b51964a550dc26a8456e98c4850edaa18cb84f79dcc78d`.
- PACKAGE_IDENTITY SHA256 `17586a13af78793896f746f30918e48d25bc0b8c0f4de19d91d72ed033bb9fc3`.
- Working source pair: SAL `72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e`, SGVL `de0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56`; independently whole-source audited PASS during this review cycle. Frozen executed runtime/parser/binding/native-pair/clock/script identities match present files.

## Findings

**A1:** two actual fresh-blue availability controls and eight NC2/Mentee fault cases cover Safe/RnD and one/ten fault scans. Independently checked real final Unlock TRUE immediately before each injected fault. Blue stays TRUE and green FALSE on every fault/restoration frame, so button release does not mask final inhibition. Actual EStop and final Unlock are FALSE from the first fault sample through clean restoration and the recorded 200ms restored observation. This is bounded observation, not unlimited recovery acceptance.

**A2:** six route/domain healthy controls and 24 fault cases cover Safe-Step12 LV, accepted RnD HV/STO1/STO2 and declared original-start Step2 LV/HV. Independently checked each archived pre-fault frame has actual relevant aggregate TRUE with relevant output FALSE. Paired healthy control consumes actual native RS Set and raises that output. Both fault and healthy runs release buttons at the next consumption sample; therefore release alone is not the explanation for inhibition. All four real Set guards and native RS Set inputs remain FALSE after fault; no previously OFF energy/torque output rises. Already latched outputs are explicitly distinguished from new rises.

A2 releases both on the fault sample, with green FALSE before restoration, preventing an accidental manual Restart. A1 retains held blue instead. Independently checked actual one/ten-scan fault durations, paired control references, first observation at time0 and exact continuous1ms records. No generic delay allowance or all-contactors-immediatelyOFF oracle was introduced.

Closure begins from a fresh full SAL/SGVL audit and traverses exact sources, resolved globals and enabled native EStop pairs. Missing demanded bindings throw; the archives report no unresolved demanded runtime reads. Outside-cone DECOUPLE channels and unconnected reads are separately inventoried. Original PLC/False producer and original reset writers remain present. Actual Set/Reset observations complement end-of-scan output checks.

## Limits retained

Initial Safe or ordinary Step2 is explicitly a component boundary, initialized before the protocol. Later RnD/Step12 paths use actual Network3 predecessors and given feedback; no phase/owner/output injection occurs after protocol start. Seven exact inactive Network4 output/global boundaries remain assumptions. This does not prove full BOOT/group reachability, unsupported native lifecycle semantics or hardware safety. Step2 controls cover ordinary startup, not every shutdown origin.

The package adds first-fault/final-consumer and clean-restoration evidence for the listed EMG/CVR requirements; it does not close those entire requirement families. A3 external interlocks, emergency destination/completion, newer LV/Run/StartingRun decisions, existing Run gesture failures and other mandatory gaps stay open. Acceptance here is source-bound evidence acceptance, not broad software or deployment approval.

Only this review file was written. Independent verification consumed the archived execution evidence; it did not rerun a mutating package generator or alter tests/source.
