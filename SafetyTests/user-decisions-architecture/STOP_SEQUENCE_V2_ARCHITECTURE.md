# Stop sequence v2: source mapping and staged native design

2026-10-20. Architecture working handoff. P0 through P0f form an exact staged 241-block equivalence proposal ready for independent review; full sequence allocation is projected255, not an executable graph. Full stop implementation is NOT READY. This is not a claim that the complete design fits 255, nor a claim of impossibility. No SAL, SGVL, tests, runtime, hardware or old frozen plan changed.

## Source and authority

Latest USER_STOP_SEQUENCE_HANDOFF.md and top of SCENARIO_DECISIONS.md supersede old pending HV success/SS1/coast/abort-SS1 questions. SAFETY_STATE_MACHINE_SPEC.md §§8–10,13 still define sequence and priority. Read current frozen LV pair directly with complete current-binding audit PASS: SAL b7096fa3cf7349ea0be08f347180deb071a0f6b75612c4e5c8a7f45cf0557161, SGVL 4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5, 254 blocks. Root owns base acceptance/promotion. Reference4495a1f was previously read directly; no cancelled reference call repeated. DISCHARGE_PROGRAM_CONTRACT and RUN_DOWN_SEQUENCE_SCENARIO_AUDIT contain historical pending statements superseded by the latest answers.

The sibling RUN_STARTINGRUN_ARCHITECTURE/count JSON remain frozen historical designs. Their normal-stop OR5→simultaneous STO/discharge/C2 fanout is not approved as the new complete sequence. Their recognizer and cancel-owner reasoning can be reviewed independently; do not build that plan as the new stop candidate.

## Exact native source mapping

STOP_SEQUENCE_V2_COUNTED_PLAN.json.sourceLedger records IDs, current orders, every active input contact, canonical source/target, exact ordinary-global IDs, direct variable/alias consumers and timing-parameter GUID/value for N6/7/8. It is a source ledger, not a fabricated executable stop manifest.

| Current block | Native order | Actual consequence |
|---|---:|---|
| N6 And2 |53|Run-qualified !And9 requests Step4 through Decouple1 at62; Step4RS65|
| N6 And9 / And10 |94/95|And9 checks original PLC/EStop/Mentee/extNC/connectors and inverted raw LV/HVHealthy; earlier And2 sees previous And9 result|
| N7 And1 / Decouple1 |66/67|Step4&&!False; LV-discharge and battery/BMS resets; also starts TON1 through DecOut1|
| N7 TON1 |101|2s; output directly writes b_Reset_LV_C1_2 AND feeds And2/And3 at69/70 on their next evaluation|
| N7 And2 |69|Step4 qualifier && !rawHVHealthy && TON1.Done; Decouple2 at71 starts both5s clocks|
| N7 And3 |70|Step4 qualifier && rawHVHealthy && TON1.Done; Decouple3 at107 bypasses5s into STO reset ORs|
| N7 TON2 / TON3 |105/106|5s each; output to per-drive STO-reset OR1/2 at72/73|
| N7 And6/7/8 |74/75/76|STO reset requests AND actual STO feedback, then Step5Set|
| N8 And1 / Decouple1 |80/81|Step5&&!False; output3 requests HV discharge and enables TON1|
| N8 TON1 / And2 / OR1 / TON2 |82/83/84/85|1s; command-echo AND Step5 can bypass first timer; OR then second1s; second Done directly resets C2|
| N8 And3 |87|TON2.Done && !C2FBK && Step5 qualifier writes Step6Set|
| N6 OR5 / Decouple2 |213/206|Later OR5 consumed next scan by earlier Decouple2; parallel STO1/2 reset, discharge request and C2 reset|
| N6 TON1 / And18 |208/207|0.2s AFTER C2 reset request, plus !C2FBK, requests Step12; not a discharge hold|

Direct raw healthy polarity in the Run-ready guard is FALSE for both Healthy inputs; a name alone is not the mapping. Native Break Contact (NC) is the direct Boolean contact and Make Contact (NO) is inverted in this source/runtime. No physical origin is inferred.

Continuous TRUE native TON enable accumulates to its retained parameter; FALSE resets elapsed/Done. Existing N7 live-Healthy enable can therefore lose elapsed on restoration. The OR echo bypass in N8 means its two1s clocks are not a guaranteed serial2s delay. Preserve the existing two alternatives and test initial discharge-latch TRUE/FALSE; do not invent a total delay.

## Coexisting sequence obligations

Healthy normal stop: accepted fresh Run green500 owns down; assert SS1 on both drives, retain source/C2 and LV for the pause; existing2s clock from actual SS1 enable; then STO and required feedback; discharge with source/C2 retained; own existing discharge hold; C2 OFF command; actual C2FBK OFF; only then Step12/LV retained confirmation→RnD. Old0.2s is not a substitute for either2s or discharge hold.

Healthy loss while SS1: current raw predicate selects immediate STO and latched HealthyLostDuringSS1, starts existing5s coast from selected STO phase; restored Healthy cannot reset/restart/shorten this owner or reselect SS1. SPEC§9 explicitly permits completion to RnD only after coast→discharge→C2OFF/FBKOFF, with fault retained. Consequently the existing Step4 path may not bypass that order for this cause. This does NOT independently assert LV retention on every fault. Other protective causes remain higher priority and their original full-removal actions must be mapped individually, including coincident causes; do not disable the original protective path wholesale.

Source issue is exact: N6 And2 runs before And9. A raw Healthy fault detected at And9 can initiate Step4 on the next scan even if raw Healthy has already restored. Any new priority classifier must preserve detection of other protective faults while maintaining the selected coast/fault owner. A trace with arbitrary Step4/Run/RnD flags is not proof of reachability or exclusivity. Test real producer closure and a separate explicit conflicting-flag component.

StartingRun abort: actual accepted SU/STO released, Run unconfirmed; full neutral2000 then newgreen500. Capture a distinct down owner BEFORE current HVSet/RunConfirm consumers, inhibit both immediately, remove pending SU, and prevent same/next-scan late feedback from reviving it. No SS1 and no energizing C2 merely to copy established Run. STO→immediate discharge with existing hold→C2OFF→FBKOFF→RnD; alreadyOFF feedback cannot skip the hold. An original late-second remains the original accepted launch, not an abort. LATEST D-STARTINGRUN-NO-COAST closes that question: user says “Сразу Discharge, затем выдержка разряда и C2 OFF”. No5s coast is added to this abort, and no2s SS1 is used. Original actual STO feedback remains before Step5; then discharge starts through native program order, with the original hold before C2OFF. The Run Healthy-loss branch still requires its full5s.

## Why direct timer sharing is not yet executable

1. ORing normalSS1 into N7TON1 enable immediately adds its direct LV-reset writer after2s, violating healthy normal LV retention. A separate protective-qualified LV reset writer is required, preserving original writer ownership/order and native SGVL usage. Timer-ID retention alone does not prove this.
2. ORing new coast into N7TON2/3 enable changes STO-reset OR1/2 consumers. New normal discharge eligibility must not take the existing rawHealthy bypass; old protective downstream actions must remain reason-qualified. A clock already elapsed for another owner cannot complete a fresh stop.
3. ORing normal discharge into N8 Step5 qualifier advances original Step6/Safe and can consume another owner's alreadyelapsed clock. Normal completion must be owner-qualified to RnD, protective completion separately to Step6, with explicit overlap/handoff/reset proof. No assumed onehot cut.
4. Retained Healthy fault needs a real reset policy; new RnD completion must not clear the fault as an incidental owner reset. Timeout command/reset details are separate and must not be silently borrowed from success.

## P0 exact native resource step

JSON.phase0 is independently reviewable and preserves all behavior. From254 retire only GATE_027 and GATE_028; add0; final252. Three free slots remain. Keep RunTON2 and every timing parameter unchanged at this stage.

Let S=current G005.SingleEnable, G=G025.FallG, B=G026.FallB. Replace S&&(G||B) with (S&&G)||(S&&B). Activate G025.AndIn3 and G026.AndIn3 from G005; route G025 to G029.OrIn5 and G026 to free G029.OrIn4; remove old intermediate wiring and retired usage wrappers. Exact port GUIDs and complete retained252-row ordered native manifest are in JSON.phase0. Distribution is equivalent for all8 Boolean tuples, without assumptions about phase/owner flags. G005 precedes both falls and G029, no intervening write; outputs have only the stated consumers and no global/direct alias export. No duplicated wiredLink pair.

Required P0 review: full native binding audit; canonical edge diff exactly these replacements; all retained parameter GUID/values byte-preserved; all order-relative retained pairs preserved by monotonic rerank; independent tests across release edges, both simultaneous falls, invalid/accepted attempts, Safe guards, RnD69/earlySTO88, LV completion/noautoenergy and emergency40. This is an optimization prerequisite, not stop acceptance.

## Following phases and concrete remaining technical work

P1 recognizer/cancel: old arithmetic254-3+4=255 includes P0 plus retirement of duplicate rawRun500 timer. Prove shared GREEN500/current single permission/rearm, fresh whileSU held, RunBOTH ignore, accepted-event irreversibility, exact native consumer ordering and launch-cancel priority. Retiring RunTON2 requires timing equivalence, not a claim that its slot is needed. Replacing its event must preserve original permission behavior, including lock/False and PLC route independently. Until a compliant stop receiver exists, accepted abort must not be wired to old simultaneous fanout and presented as complete.

P2 resource synthesis now has a projected255 allocation after the independently reviewable structural stages below; it still needs an exact stop graph/manifest within255. Remaining work is concrete: reason-qualified shared2s/5s enables plus isolated original LV/STO writers; latched fault/coast owner; own discharge-start/hold/completion, critical-protective precedence and independent normal/protective completion; fresh-cycle timer reset without arbitrary onehot assumption. JSON.nextPhases records P2.count=null deliberately. P0 through P0f's13 retirements give structural241 before new behavior. The subsequent255 stop allocation remains provisional; deliberate fault-reset closure still needs its approved predicate and possibly an additional proven saving. Candidate Decouple or duplicate-clock retirements require all direct alias/global/diagnostic consumers and ordered output proof before counting savings. Same-value clocks are not equivalent under arbitrary retained elapsed states.

Independent regression must observe from first sample actual SS1/STO outputs, all Reset/Set writers and contactor RS outputs, timer enable/elapsed/Done, discharge command, C2 feedback, LV, phase owners and sole Unlock. Required traces: healthy Run normal2s; fault before/on/after2s with restore before5s; overlapping emergency; discharge initiallylatched/unlatched and enable interruptions; C2ON held/OFF early; StartingRun C2ON/OFF abort and late confirmation same/next scan; no fresh request after completion. Preserve sevenN4 cuts and initial phase as component limitations; no BOOT/group/native/hardware claim.

Current deliverable is source analysis plus P0 review package. Full stop and P1 are technical HOLD, not READY and not an executable editor instruction. Root may review P0 independently while full synthesis continues; user decisions already closed are not reopened.

## Actual SS1 program edge and timer-origin proof

Source equations (exact alias/GUID consumers added to JSON.sourceLedger): DR1 OR13 = out_Step2 OR (out_Step3 AND N1And12 AND N1And10); DR2 OR12 = out_Step2 OR (out_Step3 AND N1And11 AND N1And9). Established Run holds both output bits TRUE. Original protective Run exit withdraws the Run term and settled Step2FALSE yields outputFALSE. Therefore the required normal SS1 application is withdrawal of these Run-permit bits, not adding a TRUE request on the existing OR. This is source program polarity; no electrical origin/hardware validation claim. Historical sal-rundown-outputs V2-OUT01 observes the defective physical-green stop retaining armedTRUE, corroborating the source equation but not replacing requirements. SPEC8 requires actual SS1 application.

N3 RunRS48 updates out_Step3 export through Decouple1 at52. N1 SS1 ORs run108/109, before Run-qualified And2/3 at210/211. Thus those output ORs consume the previous scan's Run-qualifier values. If a new normal owner inhibits And2/3 at scan k, actual outputFALSE first appears at OR execution in scan k+1, assuming Step2 exportFALSE and no other active source. An owner captured after210/211 first inhibits them next scan and actual SS1 appears one further scan later. These are native causal orders, not an allowed grace period. Do not backdate the2s clock to request acceptance.

The healthy-normal2s enable must be reason-qualified and observe both actual SS1 outputFALSE after108/109; if either remainsTRUE because of another real producer, no elapsed normalSS1 is credited. Place its timer-enable evaluation and timer after both output writers, then preserve original protective TON1 consumer latency or explicitly review any changed order. Current TON1 at101 cannot observe this scan's SS1 outputs at108/109. Directly moving TON1 and adding normal enable still requires isolating its LVreset writer as described above.

No phase onehot premise is used: an overlapping Step2 can hold its independent OR inputsTRUE. The output-qualified start rule prevents a false completed SS1 while such a conflict exists; the complete conflict/emergency handler remains a separate requirement. Existing SS1 bit changes from PLC mode or another protective input must retain their reason-specific order.

## Structural stages P0b–P0e: exact budget242 before new behavior

JSON.phase0Extensions contains native IDs/port IDs, ordinary-global and alias-reader changes, original writer windows, counts and combined241-row retained manifest including P0f. These are proposed independent transformations, not production changes or an accepted migration.

- P0b252→251: STATE_P Reset=!G008,Set=G008 is a level copy for either priorRSvalue. Move sole recRndC_P writer to G008; SNAP0 at120 is the only reader, before old161/new135 writers. Keep the existing ordinary-global initial value unchanged.
- P0c251→249: same level identity for PrevG/B. Use existing N6Decouple2 unused6/7, rawG/B into their paired outputs writing the existing globals; readers SNAP1 input1/2 at121 precede old170/171 and new206. No same-SNAP self-global feedback or channel ordering premise. Existing raw button program inputs have no program writer. Both channels' resetTime/maxDeviation0 and no master/pair/guard field; do not change the other channels.
- P0d249→244: bypass N3 OR8/10/12 single inputs and OR14/15 duplicate RndSet input. Writer windows62→64→65,76→78→79,87→89→90 and119→183→184/185→187 have no intervening global writer. All consumers are after the original OR, including first scan, so no previous-scan delay is lost. Original global source and RS reset dominance remain.
- P0e244→242: merge (Reset1&&STOfbk1)&&(Reset2&&STOfbk2) into existing N7And8's4inputs. Both original OR writers precede all old/new consumers, raw feedback has no program writer, and removed And6/7 have no alias/global export. Arbitrary Boolean16/16 identity; no phase assumption.

The DECOUPLE one-to-one channel contract is supported by [Beckhoff TwinSAFE Logic FB,§4.6.1](https://download.beckhoff.com/download/Document/automation/twinsafe/twinsafe-logic-fb_en.pdf): each used input passes to its corresponding output, and the pair must be linked. This supports the proposed6/7 channel reuse; it does not validate group startup or hardware communication. Existing group and hardware mappings stay unchanged. Internal ordinary-global publication moves within the scan; its sole graph reader sees the same previous-scan value. External exported signals and native reset behavior must remain unchanged in independent regressions.

## Shared Step5 design: projected255, still NOT READY

241 structural base including P0f; retirement of RunTON2 only after independent500 equivalence proof gives240; fifteen named native blocks in JSON.sharedSequenceSynthesis yield255. No removal/retiming of N7's2s or either5s clock, N8's1s/1s, or N6's0.2s is assumed for this count. This is feasible allocation, not a full exact execution manifest.

Use actual Step5 as a common HV-discharge phase instead of creating a parallel clock chain. The normal stop owner holds Run-down provenance; normal2sDone enters existing N7 STO-reset OR1/2 free inputs as the completed motion-wait permit. Healthy fault immediately raises STO via free inputs of N1 reset OR7/9, but does not yet enter the N7 wait-completion permit. Healthy fault also inhibits the old N7And3 rawHealthy/2s bypass. Start the5s enable from faultOwner AND both actual STO outputsFALSE, ORed with the retained original protective clock enable, then keep it latched through restoration. Both retained5s Done outputs later allow the original N7OR1/2→mergedAnd8+actualSTOfbk→Step5 handoff. Thus Step5 cannot be credited merely from immediate STO requests.

For abort with the latest NO-COAST decision: immediate STO reset plus abortOwner as the N7 completed-wait permit, with existing actualSTOfbk still required by And8. This starts Step5 discharge through actual program order; alreadyC2OFF feedback cannot bypass N8 hold. Abort never enables the new5s branch.

Native N8 Step5 branch retains request/echo/hold/C2 order. Add !normalStopOwner to the existing Step6-set And3; normal completion instead requires native N6And18's0.2s+C2OFF predicate, normalOwner and actualStep5, then Step12→Rnd. Add actualRnd handoff to Step5 reset. A distinct critical cause selecting Step4 resets the normal/abort owners through a separately counted owner-reset OR, so original protective Step6 completion is not permanently blocked. Healthy-fault memory survives that owner handoff and still prohibits premature motion-wait completion.

The Healthy-only classifier preserves every other N6And9 condition: substitute only the HVHealthy term with (!rawHVHealthy OR normalStopOwner), implemented by the counted classifier OR. During normal SS1, sole HVHealthy loss belongs to the separately captured fault/coast branch; outside that accepted stop, original rawHVHealthy trigger remains. LVHealthy, NCs, connectors, PLC/EStop/Mentee terms remain protective. Capture/phase guards must reject initial conflicting protective phases, rather than assume they cannot coexist. Exact current/previous producer chronology, critical coincidence and state-owner reset still need full proof.

Fault set/hold/noUnlock and RnD completion can be specified independently of its deliberate manual clear. Raw held Green cannot be reused as reset: the initiating down Green may still be ON at fault detection. Existing mainEStop Restart is rawGreen but that is a separate native edge/ack memory; it is not automatically an accepted HealthyFault reset. Root/analyst retains this narrow unanswered reset closure. No automatic clear at RnD completion is proposed.

Next required work: complete exact GUID port bindings/new block IDs/full ordered manifest for the known Run/Healthy/abort paths; current guard and same-scan late-feedback cancellation proof; fresh clock reset induction across actualStep5→Rnd→newCycle; and additional critical-fault causal trace bounded by known priority. All resource claims beyond structural241 remain provisional until those are supplied.

### P0f completes the exact structural base241

Added independently reviewable N7Decouple2 relay bypass242→241. Only channels1/2 are used, both from And2 at69; their only consumers are the two retained5s TON inputs at105/106. No output alias/global export or intervening writer exists. Directly route And2 to both timer inputs, preserving the per-scan value before each timer on first and every scan. Both5s clocks and their state/parameter GUIDs remain; this is not a clock-equivalence retirement. Exact port IDs and updated241-row manifest are in JSON.phase0Extensions.

This supersedes the prior projected255 arithmetic only: structural241 minus separately proved duplicateRunTON2 gives240; fourteen projected new blocks give254, reserving one slot for the eventually approved HealthyFault manual-reset qualifier. It does not close the missing exact execution bindings/order or manual-reset policy. Older242/255 calculations above identify preceding stages, not alternative editor instructions.

## Required correction: retained fault and active coast are separate memories

Reject the earlier single-owner shorthand: a retained fault driving coast-enable forever would hold5sDone and repeatedly assert bStep5Set after completedRnd. Two native RS blocks are required in the current allocation: FAULT_MEMORY retains the diagnostic/Unlock/newRun inhibit until approved deliberate reset; COAST_PHASE retains only the active5s phase.

Capture=normalOwner && !abortOwner && !actualStep5 && !normal2sDone && rawHVHealthyBad && !FAULT_MEMORY. Evaluate current capture before writing either RS. Both Set from this capture; COAST_PHASE Reset comes from actual bStep5Set (N7And8 wait-permit+STOfbk), with native reset dominance. That event exists only after the full motion wait and actual STO feedback. Then COAST_PHASE clears, its clock-enable drops and both5s outputs reset. Step5 stays latched independently until its correct terminal handoff. FAULT_MEMORY stays TRUE.

Only COAST_PHASE inhibits the old N7And3 bypass and enables new5s clock hold; using FAULT_MEMORY here would permanently change future protective reactions after normalRnd completion. COAST_PHASE survives a new critical Step4 event while waiting and clears upon actual shared motion/STOfbk completion, so no assumed normal/protective exclusivity is needed to hold the wait. Exact native ordering must show capture/Set before consumers and completion Reset before no-reentry clock induction; this is still a proof obligation, not functional PASS.

Allocation is now structural241−RunTON2=240 +15 new blocks=255. Earlier14/254 arithmetic is superseded by the additional COAST_PHASE RS. Manual-reset predicate remains the one dependent unknown; no held-Green reset is supplied and no extra reset gate is silently omitted from a claim of executable completeness.
