# Resumed full development: requirements handoff

Root handoff amendment2026-10-21: Vadim explicitly confirmed the corrected
PLC rule: actual Fault and physical pressed buttons matter; illumination or
blinking is NOT an independent request guard. All blinking-boundary pending
phrases below are superseded by this answer and newest SCENARIO_DECISIONS.
Do not ask this question again or add an illumination input. User also
reconfirmed continuation of the full workflow in the typed async reply.

2026-10-21. Scope frozen for architect/tester from Vadim's explicit latest typed/voice resumption relayed by root. Earlier intermediate functional STOP and inventory-only scope are superseded. No SAL, SGVL, PLC, runtime or tests edited by this role. Owned outputs: this document and newest section of SCENARIO_DECISIONS.md.

## Source and retained behavior

Read exact reference before current source: `C:/Users/user/source/repos/MEN001_Dyno/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`, SHA256 `efddc60b1263144ae73b3d5184158100ec09c4de739dc8919309ef7b1b0dc334`, matching user-confirmed Prodoction4495a1f. Fresh native-structure preflight PASS,10Networks/112blocks. No checkout switch or repository mutation. Reference N4 likewise has eight unsourced Decouple inputs; this is not a newly introduced v2 binding loss.

Current canonical SAL SHA256 `59bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33`; paired SGVL `c31e129072e2837234e376e51038ff988a92373cbfea97b383fbf23536c7946b`. Fresh full native-structure preflight PASS then typed binding PASS,14Networks/254blocks; N4 input sources remain unresolved. Last accepted canonical source contains LV completion plus subsequent project-load/network-symbol/native-safe-input repairs. Do not overwrite those repairs with old b7096/4eb26 or P0 files.

Read latest decisions1–15/Niv cancellation, full acceptance41, WORK_STATUS unfinished LV254/P0/STOPv2 handoffs, RESOURCE_EQUIVALENCE_P0 plan/test reviews, P0 build/exact-proof artifacts, USER_STOP_SEQUENCE_HANDOFF, NEXT_ACCEPTANCE_SCENARIO_AUDIT, BOOT_SOFTWARE_MODEL_PLAN/NETWORK4 semantics and reference phase mapping. Their historical pending/review statuses must be reconciled by source hash, not copied as current conclusions.

Retain original sequence actions except approved R&D insertion/stop-continuation changes: LV/C1 and battery/BMS actions, HV/C2 source preparation and feedback, safety/connector/externalNC permissions, drive SS1/STO control, discharge before C2OFF, output grant/reset and original legitimate Step2 startup. Reference lacks the newly named R&D pause but retains the underlying actions. New R&D behavior is normative requirements, not inferred solely by copying reference.

## Current accepted decisions — do not ask again

| Topic | Frozen expected behavior | Source |
|---|---|---|
| Normal singles | Green500 continuous lowers exactly one energy step; blue500 requests held Unlock only Safe/R&D. Green raw FBRestart is separate. | Latest Vadim1,2,5,12; D-TIMING |
| BOTH | Second<=250 inclusive, symmetric order; continuous BOTH1000 from second; one step Safe→R&D or R&D→Run, never two from same hold. | Vadim3,4,6; D-CHORD250 |
| Cleanup/invalidattempt | BothOFF2000 before new attempt; entry-held/premature attempts rejected; failed chord never degrades to single. Late second before single acceptance invalidates attempt without fault. | Vadim7–11; BTN001–008 |
| Late second after acceptance | No rollback/interruption/new operation from original attempt; exact500 single priority; green still removes Unlock. | D-LATE-SECOND/D-Q500 |
| BOTH in Run | Ignore; later releasing one cannot produce single; require fresh cleanup/gesture. | Vadim10/D-RUN-BOTH-IGNORE |
| Launch torque/confirmation | Accepted R&D launch releases torque permission without waiting for C2/HVHealthy. Run confirmation remains separate and requires original confirmations. | D-STO-LAUNCH |
| Fresh StartingRun down | After accepted launch and full neutral, new green500 aborts unfinished start. STO→immediate discharge→existing dischargehold→C2OFF→C2FBKOFF→R&D; no SS1/no5s coast. AlreadyOFF feedback cannot skip required actions. Late launch feedback cannot revive cancelled up. | D-STARTINGRUN-GREEN-DOWN + D-STARTINGRUN-NO-COAST |
| Normal Run down | SS1 enabled, retain source/C2 through2s normal wait, then required dischargehold before C2OFF, feedbackOFF before R&D. Keep LV for R&D; do not copy protective total-LV removal. | D-RUN-STOP-WAITS/USER_STOP_SEQUENCE_HANDOFF |
| Healthy lost in SS1 | Immediate STO, retained selected coast/fault, full5s from actual coast stage; raw restoration cannot revert SS1 or shorten wait. Then discharge/C2OFF/FBKOFF before R&D. | SPEC9/EMG008–009; latest stop decisions |
| HV success | Existing timed discharge hold then C2OFF/FBKOFF sufficient in specified normal/abort cases. No extra physicalHVSafe input required. | D-HV-TIMED-COMPLETE |
| LV down completion | Ordered LV loads/battery/BMS shutdown, LV commandOFF then LVFBKFALSE suffices for Safe. Preserve accepted no-reenergy owner and fresh next cycle. | D-LV-OFF-COMPLETE; bounded LV acceptance |
| Door/guards | DoorMonitor only existing solenoid role, not energy gate; both InterLockNC required for up; separate ESNC. Safe/R&D may remain open without fault. | D-DOOR-INTERLOCK; Niv cancellation |
| HealthyLost acknowledgment | In defined completed-stop/R&D/Healthy-restored context, change of either button acknowledges immediately. Held unchanged input is not new edge. Does not clear unfinished stop or redefine groupErrAck. | D-HEALTHY-FAULT-RESET-EDGE |
| Failed-up SafetyFault acknowledgment | After failed Safe→R&D or R&D→Run rolled back with SafetyFault: new PRESS of either button acknowledges immediately, no hold/release wait. Consume attempt; bothOFF2000 then new normal gesture. | Latest Vadim13 confirmed continuation choice |
| Independent PLC request — QP answered | StableR&D, newPLC up/down alone is sufficient without physical gesture, all existing guards retained. Both physical buttons must beOFF. If either is pressed ignore the request; releasing later cannot execute stale heldcode without a new request. | Latest direct Vadim answer and immediate refinement2026-10-21, relayed by root |

Cancellation of Niv proposals remains effective despite resumption. Do not implement short normal Reset, changed door semantics, physical-only scope or proposed release-only down arbitration.

## Full acceptance target: all41 IDs, not only existing visible red tests

| Requirement IDs | Positive/rejection criteria for closure on actual current candidate |
|---|---|
| EMG001–002 | Every valid stable/transition phase: physical EStop, each externalNC and applicable original protective source begin required removal and inhibit new energy. Paired healthy producer must first work. |
| EMG003–004 | Missing each connector in Safe blocks up without fault and preserves allowed blue access; restoration alone cannot queue up. After real Safe exit, each connector loss is Emergency, including startup/stopping/discharge. |
| EMG005–006 | Restored protective input cannot cancel latched removal or auto-R&D/Run. Proper manual recovery only to Safe after required energies-off confirmation. MainFB Restart versus groupErrAck versus applicationack observed separately. |
| EMG007 | Sole Unlock FALSE throughout Run, Emergency, all transitions and incomplete energy removal, including adversarial held blue/fault restore; legitimate access positive retained. |
| EMG008–010 | Real normal stop and Healthy-loss branch, first-handled STO, retained full coast, discharge before C2OFF and feedbackOFF before R&D; explicit failure branch remains unaccepted until missing policy resolved. |
| EMG011 | Every real LV/HV/torque producer and actual final Set/output: one-scan fault and raw restore cannot create new permitted energy rises. Existing latched contactor retention during orderly stopping is not a new-rise violation. |
| EMG012 | One-hot/invalid-state detector handles true bad ownership; legitimate startup/allowed transition gap distinguished. Exact fault destination pending only for that endpoint. |
| BTN001–008 | All stable modes plus transitions/entry/cross-mode histories: held entry, incomplete2000,499/500,249/250/251,999/1000 from second, flicker/piano, late300/500/600 both orders, no repeated or degraded commands. Observe attempt acceptance and retained owner separately. |
| CVR001–003 | Sole qualified held-blue output, immediate release/green suppression, no grant from mode alone, valid access in Safe/R&D and indefinite open nofault/no close timer. |
| CVR004–006 | Each up route: DoorFALSE/TRUE with bothNCtrue positive, eitherNCfalse negative independentDoor; no actual simultaneous Unlock+energyraise; all three original Door solenoid consumers retained, no fabricated locked-feedback gate. |
| MOD001–002 | Actual normal Safe→R&D→Run: original LV/battery/BMS/HV actions and confirmations, accepted launch→earlySTO, independent Run confirmation/failure; no seeded request as sole reachability proof. |
| MOD003–004 | One fresh operation per attempt across mode boundaries; no queued/repeated up in transitions. Fresh StartingRun green uses approved abort. PLC newrequest alone accepted in stableRnD only bothbuttonsOFF; heldlevel cannot repeat and a request ignored while pressed cannot later execute merely on release. Lamp-blinking boundary separately pending. |
| MOD005–006 | Real R&Ddown→orderedLVoff→FBKOFF→Safe→freshnextup with no renewed energy; genuine phase writers and one-hot ownership/reset exercised, conflict injection clearly conditional until reachability established. |
| MOD007–008 | Actual request permission path and each contradictory/missing confirmation block inappropriate progress; paired positives prove no permanent disable. New independentPLC positive/pressedignore/release-noqueue cases required; only blinking boundary and timeout qualification gaps remain. |
| STP001–002 | Normal SS1/requiredwait then discharge, C2 retained until ordered hold. Same source actions preserved, no simultaneous oldN6 fanout falsely accepted as new sequence. |
| STP003–004 | Timeout/failure fault, noauto continue/Unlock; full permitted successhold/C2OFF/FBKOFF before R&D. Failure command/reset/deadline questions block only unsupported failure endpoint. |
| STP005 | LV command/orderedshutdown and actual FBKOFF before Safe, with heldfeedbackON negative and alreadyOFF positive that cannot skip mandatory off actions. |
| BOOT001–002 | Whole-program startup/restart from priorRun/transition cannot autoRun; entry-held buttons require neutral2000/newgesture. Run request≠groupRUN, FBRestart≠ErrAck. Unknown N4 values cannot be manufactured by fallback. |

Confirmed fault acknowledgment/consume rules above are additional mandatory scenario criteria even if not yet represented by a separate stable41 ID. Include fault reset versus normal command overlap, late second of ack attempt, held ack, premature neutral, fresh postcleanup positive and fault-cause/stop-not-complete negatives only where the policy is defined.

## Staging and technical handoff

1. Freeze exact canonical source/SGVL/parser/runtime/test/requirements identities; independent full run with honest known FAIL/NV. Native-structure wrappers/counts/no-crossNetworkwire and typed binding audit precede graph cuts. Preserve source/source-type consumer slot corrections and native layout integrity.
2. Rebase resource-P0 plan onto this canonical source. Old P0 plan targets LVb7096/4eb26, removes13blocks to241, preserves timing/initialdata and has a past serialization-wrapper failure. Current directory now contains EXACT_PROOF PASS, but that is old-source evidence, not fresh reviewed canonical adoption. Recheck complete aliases/export/group/nonprogram wrappers, all75Symbols/current source types and all surviving ports/parameters. Paired actual semantic-reader traces under explicit stable-within-scan inputs; no end-of-scan publication equivalence substitute, no native sampling claim. P0 is resource equivalence only, not stop implementation.
3. Architect resolves counted coexistence/resource/ownership before functional editor handoff. Old STOPv2 had Step5-reset-Step4 protective-takeover issue and handoff producing256blocks; not accepted solution. Freeing resource is justified technical preparation, not permission to alter accepted behavior. Timer identities/values retained; original normal/protective/abort ownership distinguished.
4. Close Run raw-green recognizer bypass and full owner lifecycle with actual request/event/reset/phase/output evidence. Run invalidchord red cases remain real failures, not tests to weaken. Preserve Safe/R&D69/earlySTO88/LV16/emergency40 and originalStep2 controls while adding Run qualification/cleanup/one-step/ArmedBOTHignore cases. Can proceed independently of the remaining PLC-lamp-blinking boundary and external diagnostic presentation.
5. Implement known normalSTOP/Healthy-coast/StartingRunabort requirements and internal confirmedFault/reset behavior in reviewed counted stages, retaining fresh-command ownership across transitions. Stop completion/rollback tests must use real writers. New faults do not erase unfinished stopping merely because acknowledgment was pressed.
6. Resolve whole group/N4 adapter gaps as software semantics, using vendor/SDK evidence and bounded technical experiments. Existing file-only capability preflight returns two honest unsupported reasons; it is not wholeBOOT proof. New group envelope must distinguish numericstate/BOOL, RunStop, error supplied boundary and ErrAck0→1→0 with supported memory semantics. Unknown unboundDecouple behavior cannot be assumedTRUE/FALSE or removed merely to obtain green. If authoritative semantics remain unavailable, ask exact program-intent scenario after technical investigation; independent modules continue.
7. State-conflict implementation must detect actual invalid ownership and prohibit unsafe progress; exact destination/recovery question below remains. Conditional injected Set test is not proof of legal-input reachability, but cannot be dropped. Integrate full real cycles/fault recovery, all41 trace mapping, independent tester and reviewer, then exact canonical adoption/regression.

No parallel writes to same files. Independent tests are not editor selfchecks. Runtime fixture errors corrected with provenance and unchanged behavioral oracle. Historical reproduction and component model results remain separate. Checkpoint approved relevant requirements/tests/baseline without reset/stash history reconstruction; later source changes invalidate exact-hash acceptance and require fresh relevant regression/review.

## Genuine unresolved definitions — hold only dependent endpoints

- **QP is answered, not a blocker:** new independentPLC up/down in stableRnD needs no physicalgesture and preserves original guards, but bothbuttons must beOFF. Eitherpressed ignores the request. Include paired newrequestpositive, eachbuttonpressednegative, heldcode-no-repeat and release-after-ignored-no-queue cases with realPLC writer/actualTwinSAFE request consumers. A genuinely new edge/handshake after release is required. Current persistent MAIN modecode is not itself a complete eventcontract; technical architecture must implement freshrequest semantics without asking the same acceptance question again. **Only remaining clarification:** root asks whether actual lampblinking also blocks while bothphysicalinputsOFF, or user's phrase referred only to pressedbuttons. No invented lampinput/hardware; dependent blinking-specific branch only remains pending.
- **Invalidstate destination/recovery:** known rule rejects simultaneousSafe+Run/invalid state outside allowed startup. Emergency or TransitionFault and which manual recovery? Safety action priority known; cannot choose display/fault destination merely by numeric code convenience.
- **Failure rather than success:** exact existing timeout/deadline and C2/discharge retention/reset for incompleteHVdischarge; startup missingfeedback fault deadlines where no accepted value exists. FEEDBACK_TIMEOUTS draft5s/10s not approved. Existing successhold is not automatically watchdog. Known noauto/Unlockban/fault requirement can be tested independently of missing full failure outputs.
- **Other transitiondown contexts:** fresh StartingRungreen is answered; do not generalize into every still-undefined transitionabort. First map exact context and ask only genuinely different required reaction.
- **External Fault/PLC indication:** latest discussion said futurepossible FaultBOOL generated byTwinSAFE and ordinaryPLC alternatinggreen/blue≈200ms. Earlier explicit inventory-only prohibition is superseded for resumed core development, but tentative aggregation/presentation/timing was not silently confirmed by “include confirmed notes.” Do not implement numericencoder/BOOLmapping/lamps/200ms until explicit inclusion and faultaggregate/reset/indication priority defined. Internal requiredFaultmemories and acknowledgedreset tests proceed independently. No newSAL200ms.

Root can bundle one concise scope clarification on externalFault/lamps if necessary while independent work proceeds. No permission question is needed to perform already resumed core code/test iterations. Do not reopen already answered timing, LV/HVsuccess, RunBOTH or StartingRunabort questions.

## Completion criterion

All prepared required-behavior checks passing is necessary; it is not achieved by deleting failures, accepting known source gaps or relabeling mandatory unsupported scenariosPASS. Final software completion requires all41/current confirmed notes verified on final canonical hashes, preserved reference actions, all substantive independent review findings closed, and honest limited native results kept separate. Equipment/download/hardware/group configuration/push remain unauthorized. TargetADS7 issues cannot be declared fixed by offline softwarePASS; they are neither secretly cleared nor a hidden hardware gate to software repair.
