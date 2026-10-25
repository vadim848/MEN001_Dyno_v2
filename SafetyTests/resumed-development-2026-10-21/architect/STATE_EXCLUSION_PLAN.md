# Safe / Armed exclusion — independent audit execution plan

READY for independent testing/review, not source repair. Frozen source is adoptedP0 SAL34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b /SGVL517fdadd913007aa2690f1402676583ad16141c9ae64cb986554c87c10f22635. Exactreference4495a1f read first; nativepreflight PASS14networks/241FB/2066ports/75Symbols/306wires/0cross-network, then fulltypedbindingsPASS. Analyst source is `state-exclusion-audit/ANALYST.md`; do not choose Emergency/TransitionFault recovery or require an enum.

Machine handoff `STATE_EXCLUSION_PLAN.json` contains all241native block definitions/IDs/orders/ports/parameters, all75localvariables/alias/group endpoints,206ordinaryglobalrefs,306canonical edges, exactNetwork3Set/Reset source list and identity-based backwards closure. This prevents a basename-only or arbitrarily convenient Network3 slice from becoming a reachability proof.

## Causal cone and limits

Primary backward cone of actual FBRs1.RsOut(Safe) and FBRs3.RsOut(Run):176blocks,737typed port/global/variable nodes,21givenraw input boundaries and7unknown N4live inputs. DECOUPLE dependence is channel-by-channel; source graph follows validated GUIDs and effectiveEStop pairs. Allactive group and feedback obligations remain explicit.

Unknowns are exactly N4 DecIn1–7 for this owner invariant. Do not replace by implicitFALSE/TRUE or supply their globalwriter outputs after entry. A declared component can explicitly assume their inactive outputs as a typed boundary, as analyst allows, but result is conditional preservation from that boundary. N6Decouple2.DecIn5 liveorphan is outside this primary owner cone under the actual dependency graph; it still affects Transitionstatus and must be represented if consequence/status observation expands the cone. Its absence from the primary invariant cone does not establish wholeBOOT or resolve that orphan.

The existing generic runtime eagerly evaluates every DECOUPLE channel and defaults unbound reads; independent fixture must evaluate demanded channels using proved one-to-one mapping or classify unused reads explicitly. Any UNKNOWN demanded by the owner/consequence claim is ERROR/NV or an explicit nondeterministic boundary, never hidden fallback. Extend the closure for exported status/actualenergy/Unlock observations; do not claim those consequences from only176owner-cone blocks if their additional producers were not included.

## Why same-scan feedback algebra does not settle exclusion

P0 order: Runconfirm And6#169 -> RunSet2 publisher Decouple2#170; RnDreset OR13#171/RS7#172 reacts in the same scan. RunRS3#48 consumes that publication nextscan. LVdown SafeSet2 And15#18 reads previous downDecouple1#189 but current C1/C2commands and feedback. SafeRS1#20 executes before RunRS3#48; status outputs publish again at#52/#96. OldRunSet can therefore outlive the currentRnD/feedback predicate.

Proof must show for every actual safe-entry producer that pendingRunSet/oldRunQ cannot survive into that SafeRS update, or produce an actual witness otherwise. Include fallbackSafe, N4 requests, Step6return, originalStep2return/Runconfirm, LVdowncompletion and RunresetStep4/Step12. Do not replace these with independently chosen booleans or presume C2commandOFF cannot coexist with a retained previousRunSet.

## Highest-value independent reproduction first

Root executed `state-exclusion-audit/bypass-family.mjs` on adoptedP0. Report `BYPASS_FAMILY.json` is coordinator exploratory evidence, not independent acceptance. Paired bypassFALSE gives nooverlap; bypassTRUE firstend-scanSafe+Run at16338ms under initialSafe/seveninactiveN4, zero demanded fallback. Freeze independent source/helper/rawhistory hashes and reproduce before any repair inference.

Protocol, all rawinputs after declaredinitialSafe:

1. Real EStopRestart and physicalBOTH Safe→Step12→RnD; release both2100ms. Set existing PLCmode10 while stableRnD.
2. Real green500 acceptsSG/down; keep C2FBKON to prevent Safecompletion; observe actual C1commandOFF. Rootmarks green5329ms, PLCchange5832ms.
3. PLC11 while heldgreen starts current up route despite newest requiredignore policy. C2FBKTRUE/HVHealthyTRUE holdsRunconfirmation pending. This rejected-by-spec external stimulus remains valid test input; do not exclude it to prove current source.
4. At actual HVcommandON, assert inPLC_BypassC1C2TRUE; root5836ms. Actual Network1/FBTon1(enableFBAnd4) runs existing10s, then FBAnd8/outHVC2→FBOr16→FBRs2Reset. This can cycle commandON/OFF through source latency. Do not seed timer/output or reinterpret10s as faultwatchdog.
5. After10500ms, set HVHealthyFALSE and LVHealthyFALSE (root16337ms); currentN12And6 permitsRunconfirmation. Wait actual confirmRun TRUE, not a seededrequest.
6. Next rawsample C2FBKFALSE/C1FBKFALSE(root16338ms). Actual downSet18 and staleRunSet170 allow both state memories to be observed. Observe every state writer and intermediate consumer; reproduce paired bypassFALSE control identically.

Exact polarity: N12And6 HVHealthy input is inverted; TRUE blocks confirmation, FALSE permits. Current rawC2ON for confirming thenOFF onfollowing scan is allowed adversarial feedback history; code must retain ownership discipline. Existing source does not require actualC2commandON in the Runconfirmation expression. The bypass path supplies actual commandOFF through real request/RS producers; do not assert physical contactor failure or fullhardware reachability from this software witness.

Independent tester should extend +/-nearestscan around169/170→18/20/48, bypass10sdone-1/equality/+1, and actualC2reset phases. Rootexactoffset is a reproducible witness, not an assumption about physical time. If independent preparation differs, preserve it as fixture/preparationNV, diagnose by exactsource/producer events, never seed the final state.

## Instrumentation / evidence classification

At each actualRS update record nativeID/order, effectiveSet/Reset, oldQ/newQ, counterpart state, source/globalpublication ID+age and rawsample. Track actualstatuswrites outStep1/outStep3/outSafetyArmed and each mode/energy/Unlock reader. Keep firstoverlap even when latercleared. Four separate results: endscan overlap; within-scan owner overlap; publishedstatus overlap; actualcommand/permission/output effects. A within-scan overlap consumed by no actualreader differs operationally from persistent stable overlap, but neither may be erased by endscan-only logging.

Expected counterexample classification: **CONDITIONAL_REACHABLE_OVERLAP from declaredvalidSafe boundary under actual producers**, if independently reproduced with no demandedunknown. It is stronger than arbitrarySet injection and weaker than fullnativeBOOT reachability. No recovery destination/enum or hardwarehazard claim follows. Baseline STATE directinjection remains robustness evidence, not this witness.

## Bounded exhaustive suffix search

After actualrealprefixes, snapshot states immediately before/on/after each producerboundary and native timerthreshold; include pendingRunSet/RnDreset, firstRun, olddownrequest and bypass10s resetpipeline. Snapshot complete values, RS/EStop/timer memories and previous publications. No postentry phase/request/clock injection.

JSON defines6 alphabet families: CTRL4(all16controlvectors,horizon8),FB6(all64feedbackvectors,horizon4),CRITICAL5(all32vectors,horizon3),CONNECTOR3(all8,horizon4),BYPASS6(all64,horizon5),COLLISION6(all64,horizon4). Rawvalues stable within each1ms observed scan. Other rawinputs are fixed explicit seedlevels per family, making each proof conditional on that subset, not a jointallinput theorem. Include failed/rejected physical/PLC requests, simultaneousfault/feedback and rawrestoration; do not restrict to successfully accepted commands.

Budget50000distinctstates/1000000transitions perseed/family bounds execution. Only processing every reachable successor to the declared horizon earns EXHAUSTED-with-no-overlap. Hitting any cap is UNEXHAUSTED/NV, not PASS. A verified installedSMT solver may encode the same ordered native transition system jointly instead; no solveravailability or proof is assumed. State hashing includes all relevant timer/RS/EStop memories and stale publications, never onlySafe/Run. Elapsed saturation is allowed only after proving identical future branch behavior, includingWINDOW equality250.

A bounded result cannot establish universalexclusion or groupstartup by a large casecount. A true induction needs justifiedbase and every actualproducer/order case. WholeBOOT retainsN4/groupRunStop/ErrAck memory gaps until authoritative program/default/lifecycle evidence or a separately approved source repair resolves them.

## Detector calibration and handoff

Calibrate instrumentation with unchanged old contradictorySet robustness case, without editing currentSAL or making it the operatingreachability oracle; ensure within-scan and endscan detectors see known overlap. Pair genuine nominalcycle/return positives to detect fixtures that merely disable all progress. Verify exactcanonicalhashes before/after allruns. Independent tester owns scripts/results; reviewer assesses producerclosure, boundaries, realwritertrace, counterexample and any subsequentrepair scope. No sourcechanges are authorized by this plan alone.
