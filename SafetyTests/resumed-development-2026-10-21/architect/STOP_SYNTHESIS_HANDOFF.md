# STOP synthesis continuation / next handoff — 2026-10-21

This is a bounded technical continuation, NOT an executable fullSTOP plan. F1 exact242-block plan is READY for review and can proceed independently; source/candidate remains untouched by architect. Additional10-block resource plan is exact source-ledger proposal and has independent native cardinality evidence, but still requires its own paired semantic/native acceptance. Do not call its231 count accepted until that gate passes.

## Concrete resource budget layers

- Native P0 frozen241; F1 physicalrecognizer+acceptedRunDown owner242 (=241-rawRunTON+OR+RS).
- Additional resource10 transforms applied by a separately rebased ledger would make P0231, or F1232. It must preserve current F1 owner bindings when rebased; both standalone full order/edge manifests cannot be overlaid.
- The previous15-block STOPallocation was incomplete: StartingRun ABORT_CAPTURE is not represented in its named15 list, and Step5/Step4 critical takeover needs real lifetime memory, not a lone one-scan handoff gate. Do not pretend reserved15 already proves fit.
- A conservative known-path synthesis needs19 explicitly named native primitives below; two are the F1 resetOR/RunDownRS already present. Thus potential knownSTOP layer=231-1+19=249 orF1232+17=249. This is a budget, not a graph acceptance or a complete Fault/PLC/StateConflict budget.
- Immediate anybutton-edge acknowledgement, PLCevent gating, upwardfailure fault/rollback and StateConflict still require their exact distinct primitives. NativeXOR availability/type contract and reuse of spare Decouple snapshots may reduce count, but are not silently counted as free. More savings can be independently considered if necessary; all10 current proposals preserve actual reader sample age, not guessed whole-scan timing.

## Known-path primitive allocation — exactly19, no hidden capture gate

1 LAUNCH_EXIT AND;2 ABORT_CAPTURE AND;3 ABORT_OWNER RS;4 NORMAL_LV_DOWN AND;5 NORMAL_STOP_OWNER RS (F1 RUN_DOWN_OWNER);6 HEALTHY_FAULT_MEMORY RS;7 HEALTHY_FAULT_CAPTURE AND;8 SS1_ACTUAL_ENABLE AND;9 SHARED_2S_ENABLE OR;10 PROTECTIVE_LV_RESET AND;11 SHARED_5S_ENABLE OR;12 NORMAL_2S_READY AND;13 HV_HEALTHY_CLASSIFIER OR;14 ACTUAL_STO_COAST_ENABLE AND;15 OWNER_RESET OR (F1 RUN_DOWN_RESET);16 COAST_PHASE RS;17 CRITICAL_SCOPE OR;18 CRITICAL_TAKEOVER RS;19 STEP4_AUTO_RESET AND.

The names state exact purpose, not yet native ordered GUID graph. Existing AND/OR spare slots can extend qualifiers, but any needed additional Boolean expression exceeding available slots must be counted explicitly. New ordinary globals/Symbols do not consume FBslots but do require native usages/source compatibility/geometry.

## Step5 resets Step4 — exact reason the old solution fails

Original Step4RS Reset OR includes Step5 and therefore prevents a newly requested critical Step4 from being sustained while Step5 is already active. A single `Step5&&!criticalRequest` gate is insufficient: Run may be reset by Step4 nextscan, dropping the original Run-qualified criticalRequest, and then Step5 erases Step4 before its2s LV-removal path can complete. Critical provenance must survive this native request withdrawal.

Proposed technical direction for proof: CRITICAL_TAKEOVER nativeRS captures actual criticalRequest and remains until genuine safe completion; Step4's automaticStep5Reset becomes Step5&&!criticalTakeover. Existing resetOR also needs actualSafe terminal reset, otherwise after Kclears and Step5 has dropped, Step4 can remain latched. Normal owner clears on Kcapture; normalStep12completion is explicitly blocked whileK, so a critical takeover cannot end in normalRnD merely because C2feedback is alreadyOFF. Protective Step6/Safe completion remains separate. COAST_PHASE stays latched through takeover until real coast/STOcompletion; a higher critical cause must not reactivate rawHealthy bypass and cut an already selected5s coast.

A critical monitor limited only to nativeRun flag is insufficient after accepting down/clearing Run. CRITICAL_SCOPE must include active normal/abort/protective owners. Extending the original Run guard wholesale into StartingRun is also unsafe as a software interpretation: unconfirmed HV Healthy is expected while starting, not automatically the old Run protective fault. Partition establishedRun safety-health checks from acceptedStartingRun/abort permissions without weakening EStop,NC/connectors/Mentee/PLC. Current source has different rawLVHealthy polarity in PreRnD vsRun guard; preserve exact given-input branch predicates and do not infer a universal polarity from its name. This scope/ordering classification is still a technical synthesis obligation.

## Actual outputs and timing origins

- SS1 withdrawal must be visible on both real out_SS1 outputs; 2s starts after those actual producer effects, not greenqualification. Native order puts current outputORs before their Runqualified drivers, so preserve the causal one-scan stages.
- NormalRun down preserves LV/source/C2 through SS1 and existing dischargehold before C2OFF. Current realhistory tester proves oldreceiver violates this (HVoff~4ms); that FAIL remains afterF1 untilF2.
- HealthyLoss duringSS1 immediately raisesSTO; COAST_PHASE and retainedFAULT are distinct. Full5s starts from actualSTO effects; restore cannot restart/shorten it. Clear only activecoast at real motion/STOfbk handoff, not retainedFAULT.
- StartingRun freshgreen: capture before currentHVSet/RunConfirm; suppress resurrection from latefeedback. NoSS1/no5scoast; STO then dischargehold thenC2OFF/FBKOFF. Old0.2s is postC2request qualification, not dischargehold.
- Existing1s/1s discharge timers have command-echo ORbypass; preserve each existing enable/reset/Done, not an invented combined2s timeout. Old discharge initiallylatchedTRUE/FALSE histories must both be tested.

## Required acknowledgement/event work not hidden in19

HealthyLost completed-stop reset: any change of either button, including simultaneous changes, needs true edge detection against previous raw levels. XOR of all four levels is insufficient because simultaneous changes cancel parity. UpwardSafetyFault ack: press-only of either button in described rolled-back context; the attempt is consumed until bothOFF2s. This must not overwrite native FBRestart press/release or groupErrAck.

Current2bitPLC requests are pure levels. A technical event proposal must sample raw code independently of phase/guards and consume ignored changes, preventing buttonrelease/guardrestore/modeentry from reinterpreting a held level. Same-code reissue is unobservable with existing two bits unless PLC changes code or an explicit future strobe/handshake is approved. Existing MAIN and SAL Armed-down encodings differ in historical comments/implementation; do not treat a code as free neutral without full producer/consumer mapping. Lamp state is definitively not a gate. Current Fault and physicalbuttons are the relevant acceptance guards; no lamp input or new I/O mapping.

## Program-only BOOT repairs separated from resource equivalence

N4 has no legitimate program producer for7used phase-command outputs. Reference has same source gap; deleting it is not equivalence to unknown nativeunbound behavior. An explicit no-request program producer is possible: existing safeinput x and its complement in one nativeAND create FALSE under the per-scan softwareinput contract, then feed the existing7channels via exactSymbols/nativebindings. That is a deliberate deterministic source repair grounded in startupSafe/noautoRun, not inferred originalunboundFALSE. Root/analyst must approve its intent trace and tests; no hardwareorigin investigation. Multiplewriter nativecapacity could instead replace the Decouple by a deterministic producer if all7source refs/type behavior are independently verified.

N6Decouple2.DecIn5 is independently live-unsourced, driving b_Set_Transition_4. Repair must bind it to the actual accepted Run-down transition event/owner, not copy a hostFALSE/default or omit itsusage in serializer. P0 intentionally preserves both gaps for identity proof. Fixing these orphans does not prove groupRUN/STOP/ErrAck memory semantics; group lifecycle adapter evidence remains separate.

## Minimum genuine failure questions for analyst/root

These are scenarios still lacking an approved failure contract after reading exact reference, current source, SPEC and latest success decisions; they do not block known success/gesture/stop paths.

1. **Accepted upward transition never confirms:** fromSafe an accepted newup commandsC1 but C1FBK neverON or requiredLVHealthy neverarrives; fromRnD acceptedup commandsC2/earlySTO but C2FBK orHVHealthy neverconfirms. Which existing approved deadline turns waiting into SafetyFault/rollback? Current0.1s/5s nativeTONs are successqualification/hold, not a demonstrated failure-watchdog, and provisional FEEDBACK_TIMEOUTS numbers cannot be adopted. If deadlines differ per confirmation, identify that distinction. Do not ask again about500ms/1s/window250/release2s.
2. **HV disconnect never confirms after successful hold:** Run/StartingRun stop has completed required dischargehold and issuedC2OFF, but C2FBK remainsON indefinitely. What approved failuredeadline and outputretention/reset behavior applies? Existing0.2s plusOFFfeedback only delays success; it is not a proven maximum wait. RnD/Unlock remain forbidden; exact fault/deliberate retry behavior is unassigned.
3. **Discharge failure distinct from success:** accepted existinghold+FBKOFF is sufficient success perVadim. There is no independent DischargeComplete/fault input in the present interface. STP003 still asks for a failuretimeout, so identify which present program condition constitutes failure before/after the hold and its approved failure action; do not invent a new sensor or physicalHVSafe requirement.

StateConflict Emergency-vs-TransitionFault question is already pending; no destination selected here. Root's state-exclusion source audit should first distinguish true legal-input reachability from injected requests/unknownorphans; an enum answer does not substitute for preventing invalid owners.

## Immediate sequencing handoff

Finish P0 independent equivalence/regression/review, then editor may build exactF1242 only after its independent READYgate; preserve knownstopFAIL. In parallel/nextslot, reviewer/tester can validate the resource10 ledger and paired native graph. Architect resumes full19primitive order/criticalscope/coast/reset synthesis on the accepted exact base, adding allack/PLC/state primitives to the manifest before a fullSTOP editor handoff. This document intentionally does not claim complete<=255 execution graph or all41 closure while those concrete obligations remain.
