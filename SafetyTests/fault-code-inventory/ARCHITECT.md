# Fault / stop-reason inventory — architecture, 2026-10-21

## Outcome and counting convention

Across the presently named requirement/source categories, this inventory contains **17 grouped candidate reason families /24 optional detail labels**:15 application families with22 details, plus2 abstract SPEC reasons (driver critical fault and watchdog) that have no corresponding application input. This is a reproducible diagnostic grouping, not17/24 implemented or fully specified fault detectors. Detail labels distinguish EStop/external-interlock channels and actuator feedback direction/drive. Native group diagnostic categories remain a separate layer and are not silently added to those totals.

All labels below are provisional semantic inventory IDs, not approved PLC numeric assignments, new requirements, or implemented behavior. Normal stops and inhibited commands are not faults. A cause may be relevant in several states without needing another code in every state. The broad transition-failure fallback is used only when no more specific diagnosed cause exists; it must not be counted as a second root fault for the same incident.

## Evidence and priority of sources

1. Exact reference read using `git -c safe.directory=C:/Users/user/source/repos/MEN001_Dyno -C C:/Users/user/source/repos/MEN001_Dyno show 4495a1f6049f6a58ebfd436761faa84d17c8d643:MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`. This is a process-local read exception, no repository/config mutation. UTF8 git-blob SHA256: `c5f0c0cea479f65e3a11fbe9cf2520a2b54d2cbf85602fd7a2cbab8e27132153`; source CRC197137056 is only a stored reference field. Original Network6 guard loss leads Step4; Network7/8/9 perform removal. Original feedback checks are gates, not automatically typed watchdog faults.
2. Current `SafetyTests/SCENARIO_DECISIONS.md` first130 lines: Niv proposals canceled; Vadim confirmations1–13, including 500ms singles,250ms/1s chord, one step/attempt,2s release, Armed BOTH ignored, invalid attempts nofault, EStop FB Restart separate from application SafetyFault acknowledgement. Older proposed shortReset/physical-only/door rules have no authority.
3. `SAFETY_STATE_MACHINE_SPEC.md` §§5.1–14,19–20; `SafetyTests/SOFTWARE_ACCEPTANCE_SCOPE.md`; `SafetyTests/DISCHARGE_PROGRAM_CONTRACT.md`; newer stop-success/reset decisions override historical abstract HVSafe/completion requirements in their exact context. The agreed existing dischargehold then C2OFF/C2FBKOFF is sufficient; do not invent an added HVSafe input or timer.
4. Current SAL `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`, SHA256 `59bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33`; SGVL `MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl`, previously audited SHA256 `c31e129072e2837234e376e51038ff988a92373cbfea97b383fbf23536c7946b` (verifier independently rechecks).
5. Fresh native-serialization preflight PASS before tracing:14Networks/254blocks/2172ports/75Symbols/319wiredLinks/0cross-network wires. Singleton usage wrappers checked. Full typed SAL/SGVL bindings PASS. These are structural software checks, not native CRC/target/hardware validation.

## Detection vocabulary

**G** = actual input/guard exists, but independent per-cause latched Fault/code detection is not established. **R** = requirement exists, but corresponding discriminating failure detector or latch is absent/not proved. Existing TON success/hold qualification is not a timeout detector. Exact source anchors below use network/block/port paths, resolved through full typed bindings. STOP describes approved required reaction only; source reachability/full completion is not claimed.

Reset shorthand: **E** = SPEC§12 manual recovery in Safe after cause removed/energies removed; real FBEstop1.Restart uses press+release green and is not group ErrAck or a general application-fault reset. **U** = latest Vadim point13: after failed Safe->RnD or RnD->Armed has returned with SafetyFault, any button PRESS immediately acknowledges; consume attempt, bothOFF2s before new action. **H** = D-HEALTHY-FAULT-RESET-EDGE narrow completed HealthyLost stop scenario, any button edge; cause still active/stop incomplete response not specified. **P** = retention/reset contract pending. These are not one universal reset rule.

## Grouped application families — exactly15 rows

| ID | Distinct cause / fault scenario | Requirement / source | Actual detection vs missing | Fault memory/reset known | Established consequence and limits |
|---|---|---|---|---|---|
| F01 | Physical EStop channel opened, either in_ES_NC_1/2 | EMG001; SPEC§§3,13; Vadim point12 | G: Network1/FBEstop1 effective paired EStop inputs; Network6/FBAnd10; current permit guard | E; b_EStop_Ok and Restart exist, no per-cause encoded latch | Emergency from all modes; blocks new rises. No new per-channel native discrepancy policy asserted. |
| F02 | PLC emergency request in_Estop_PLC | Original Network1/FBAnd1->FBEstop1, Network6/FBAnd10; SPEC§14 CMD_EMERGENCY | G: raw PLC signal and gates, not a distinct application Fault latch | E for resulting emergency; release of PLC request cannot clear emergency memory by itself | Protective stop cause, not necessarily a broken component; do not call every operator emergency a hardware failure. |
| F03 | Mentee emergency request in_Mentee_EStop | Original Network6/FBAnd10; current SetPermit guards; EMG001/011 preserving original stop reasons | G: stop/permission source exists; not same identity as PLC EStop | E if Emergency; no distinct per-cause latch shown | Protective stop path; current Run guard loss enters Step4. Detailed all-phase completion not proven. |
| F04 | External Emergency Interlock channel1 or2 lost | SPEC§5.1, EMG002/005 | G: Network1/FBAndLvCurrentPermit.AndIn4/5; Network6/FBAnd9.AndIn2/3; recognizer GATE001; RnD guard FBAnd16 | E; do not autounlatch merely from restored contact | Emergency by approved policy, not DoorMonitor or EStopNC; preserve ongoing stop on restoration. |
| F05 | LV connector interlock lost after leaving Safe | EMG003/004 | G: in_LV_Connector_Interlock in Network6/FBAnd9.AndIn4/current permit | E after genuine emergency; Safe absent = nofault | After Safe an emergency. In Safe only inhibits up; that normal inhibition must not assert this Fault. |
| F06 | HV connector interlock lost after leaving Safe | EMG003/004 | G: in_HV_Connector_Interlock in Network6/FBAnd9.AndIn5/current permit | Same context rule as F05 | Same protective policy, distinct LV/HV connector diagnosis. |
| F07 | LV domain Healthy unavailable/lost when required after accepted energization / while energized | SPEC§§6–7/13, MOD001/002/008; original Network6 guard | G: in_LV_Healthy_FBK. Network11/FBAnd4 uses TRUE, Network6/FBAnd9 and original start Network5 use inverted raw value; no universal polarity should be invented | U for described rolled-back up failure, otherwise P/E by actual emergency context | Refuse completion/up or protective stop as applicable. Notready before accepted attempt is not automatically fault; exact qualification/deadline absent. Raw polarity/phase interpretation remains a source-level gap. |
| F08 | HV source Healthy unavailable/lost outside SS1, including failed StartingRun / Run | SPEC§§7,13, MOD002/008; current Network12/FBAnd6, Network6/FBAnd9 | G/R: raw in_HV_Healthy_FBK gate exists; phase-specific failure/timeout latch not found | U for rolled-back up failure; other context P/E | Run not declared before valid confirmations; active source failure selects protective response. Do not use as second fault for ordinary healthy-state changes during discharge. |
| F09 | HV Healthy lost specifically during SS1: HealthyLostDuringSS1 | SPEC§9, EMG008/009; latest full5s coast retained | R: Network7 has Healthy-dependent branches; independent phase-specific sticky fault/coast owner not established | Explicit latched fault until conscious reset; H applies in its narrow completed-stop context | Immediate STO, full5s coast, dischargehold, C2OFF/FBKOFF before RnD. This is distinct from F08 because reaction and retained diagnosis are explicitly different. Current implementation not accepted. |
| F10 | C1/LV contactor command-feedback inconsistent or missing during required on/off confirmation | SPEC§§6,11–13, MOD001/005/008, STP005 | G/R: in_LV_C1_FBK gates Network11/FBAnd4 (ON), Network2/FBAnd2 and Network12/FBAnd15 (OFF). No approved new timeout/set-specific fault detector | U if failed upward transition; off/critical contexts P/E | Do not declare RnD before ON; do not declare Safe before OFF. Critical feedback loss has highest protective priority. Deadline to convert waiting into fault pending. |
| F11 | C2/HV contactor command-feedback inconsistent or missing on/off confirmation | SPEC§§7–10, MOD002/008, STP004 | G/R: Network12/FBAnd6 ON; Network6/FBAnd18 and Network8/FBAnd3 OFF. Gates exist, timeout latch not shown | U for rolled-back up; OFF failure P | Do not declare Run before ON confirmations or RnD before OFF. Opening command and proven opening differ; no new forced C2 procedure invented. |
| F12 | Required STO feedback not consistent with commanded safety state, either drive/direction | SPEC§13 critical safety feedback; MOD008; original Network2/5/7 consumers | G/R: in_STO_DR1_FBK/2 required TRUE for safety confirmation in Network2/FBAnd3 and Network7/FBAnd6/7, FALSE for run confirmation in Network5/FBAnd5; no per-drive/direction fault latch/deadline proved | P/E; U only if part of described rolled-back up failure | Prevent completion/raise when required safety confirmation missing; preserve critical safety priority. This inventory does not add a requirement to wait for STO FB before early launch torque release. |
| F13 | HV discharge failure / completion timeout | SPEC§10/STP003/EMG010; updated success contract in DISCHARGE_PROGRAM_CONTRACT | R: successhold existing; no independent discharge fault/completion input or fault-watchdog found. out_HV_Discharge_Request is command feedback, not measured completion | Required latched fault, automatic continuation prohibited; exact failure/reset procedure P | TransitionFault, UnlockFALSE. Do not invent timeout number or forced source/C2 behavior; accepted successhold is not this failure detector. |
| F14 | Invalid application state ownership: multiple stable modes, or no permissible mode outside allowed transition/start context | SPEC§§13–14, EMG012, MOD006 | R: separate Network3 state RS memories; no demonstrated StateConflict detector/latch | P; Q-FAULT-DESTINATION remains Emergency vs TransitionFault | Safe error / prohibit unsafe progress; exact target and acknowledgement unresolved. Concurrent requests alone are not a new fault type unless they produce this required condition. |
| F15 | Failed accepted Safe->RnD or RnD->Armed transition returning with SafetyFault, root cause otherwise unclassified | Latest Vadim point13; SPEC§§6–7 confirmation/timeout requirements | R: current source has no SafetyFault named variable/output or generic rollback-fault latch; no claim both rollbacks implemented | U precisely defined for this described result, not group ErrAck | Return to prior safe stage with reported fault is the described context. F15 is generic fallback/summary; identified F04/F07/F08/F10/F11/F12 cause should not be counted as an additional independent failure. |

This is **15 semantic families**, not15 simultaneously distinguishable signals in the present application. F07/F08/F10–F13 need detection qualification or context definition; F14/F15 need actual owner/fault implementation before coding. Current raw input observability does not prove root cause: commandOFF+feedbackON may mean delay, feedback fault or contactor failure; diagnose software mismatch, never assert welded contactor as proven physical cause.

## Optional detail granularity — exactly22 labels

The following is a partition of the15 families, not22 newly required behaviors. It provides actionable capacity comparison without allocating numeric codes:

| Family | Optional distinguishable semantic labels | Count |
|---|---|---:|
| F01 | physical EStopNC1; physical EStopNC2 | 2 |
| F02 | PLC emergency request | 1 |
| F03 | Mentee emergency request | 1 |
| F04 | external interlockNC1; external interlockNC2 | 2 |
| F05 | LV connector loss outside Safe | 1 |
| F06 | HV connector loss outside Safe | 1 |
| F07 | LV Healthy fault when required | 1 |
| F08 | HV Healthy fault outside SS1 | 1 |
| F09 | HealthyLostDuringSS1 | 1 |
| F10 | C1 ON not confirmed; C1 OFF not confirmed | 2 |
| F11 | C2 ON not confirmed; C2 OFF not confirmed | 2 |
| F12 | STO1 active not confirmed; STO2 active not confirmed; STO1 released inconsistent; STO2 released inconsistent | 4 |
| F13 | discharge failure/timeout | 1 |
| F14 | invalid state ownership | 1 |
| F15 | unclassified failed-up transition SafetyFault fallback | 1 |
| Total | 2+1+1+2+1+1+1+1+1+2+2+4+1+1+1 | **22** |

No extra codes for every state or every channel combination. Both EStop channels false are two active detailed conditions, not a third invented diagnosis. A single-code interface would need a selection rule. Do not split a timer expiry and the same missing feedback into two independent faults without a distinct diagnosis. If generic F15 is merely an aggregate display status rather than a fallback reason, removing its reason label gives14 grouped/21 detailed; this is an unresolved interface-granularity choice, not a change to required SafetyFault acknowledgement.

## Additional named requirements and native diagnostics — separate counts

| Item | Requirement / actual observability | Counting boundary |
|---|---|---|
| Critical driver fault | SPEC diagram Run->Emergency explicitly names driver fault; current inputs have STO feedback and driver ErrorACK outputs, no dedicated driver-error application input | Named abstract requirement; detector/interface missing. +1 only if a separately available application reason is defined later. ErrorACK output is not error feedback. |
| Watchdog failure | SPEC diagram Run->Emergency names watchdog; no independent application WatchdogFault source/latch found | +1 abstract reason if separately included; do not confuse native runtime watchdog with application transition timeout. |
| Native ModuleFault / FbErr / ComErr / OutErr / OtherErr | SAL declares these5 TwinSAFE group alias ports; no demonstrated application usage/encoding for them. FBEstop.Error outputs are unconnected in current SAL | Native failure categories, not5 implemented application-transition faults. Adding5 future summary labels would yield20 grouped/27 detailed (or22/29 including driver/watchdog), but mapping/overlap not approved. These totals are optional envelope arithmetic, not present fault-count conclusions. |

A runtime/group failure may prevent application execution, so an application-encoded diagnostic cannot be assumed to report that failure reliably. Preserve native diagnostics separately unless a later explicit interface decision says otherwise. No group/target configuration is inspected or changed here.

## Not errors / excluded from fault count

- Normal green down, normal SS1/coast/discharge waits, operator mode requests and accepted StartingRun abort are operational actions; stop reason/state can be shown separately, not a Fault merely because motion stops.
- Safe connector absent, up not permitted before acceptance, held-button startup, incomplete500ms/1s gesture, second button late, piano/repeated/chord abandonment, Armed BOTH ignored: block/ignore per approved rules, nofault. No button-timeout/stuck-button diagnostic newly invented.
- DoorMonitorFALSE is not an energy fault/guard; open cover in Safe/RnD is allowed without timeout/fault. Existing InterLockNC emergency policy is distinct and preserved. Unlock denied in transition/Emergency/Run is normal inhibition.
- C3/battery/BMS sequence confirmation requirements exist abstractly, but current interface has manual Set/Reset and output commands, no dedicated C3/BMS feedback fault signal. Do not invent root-cause codes or new detector inputs. A future independently identifiable failure would refine F10/LV-domain or fallbackF15, subject to explicit scope.
- CRC/IDE validation/safe-input-only rules, Target/ADS connectivity and compile errors are engineering-tool issues outside this operating-fault catalogue.
- Confirmed button-routing implementation defects are audit findings; they are not automatically online diagnostic fault conditions without an approved detector/reaction.

## Capacity and unresolved choices

| Representation | Capacity with0 reserved for no selected fault | Fits current catalogue grouping? |
|---|---:|---|
| 4bit encoded number | 15 nonzero labels | Exactly15 grouped, no spare; cannot distinguish22 detail labels. Grouping must be intentional, not information hidden to force fit. |
| 5bit encoded number | 31 nonzero labels | Fits22 detail labels or24 including separately defined driver/watchdog; optional native-summary envelope up to29 still fits. Not implementation approval. |

An encoded number is not a bitmask:4independent fault bits describe four flags/16combinations, not15 independently identifiable root errors.5independent bits describe five flags, not31 root errors. Simultaneous errors can outnumber the single selected code; retaining all active/latched reasons is separate from choosing which one PLC sees.

Only three decisions are needed to bound a later interface; no answer is required to complete this read-only inventory:

1. Keep compact grouped families or distinguish channel/drive/ON-vs-OFF? Should generic failed-transition SafetyFault be a fallback code or status accompanying a specific reason?
2. Report only application transition/protective causes, or also separately available native group/driver/watchdog categories? Current application cannot silently manufacture missing native/root-cause signals.
3. If causes overlap, should selected code preserve the initiating cause or show highest currently active protective cause? Example: C2ON fails, then EStop is pressed during rollback. Existing control priority mandates emergency behavior, but does not decide diagnostic history selection. No firstfault/highestseverity/latest/bitmask policy is adopted here.

Failure-detection deadlines and unresolved discharge/StateConflict recovery are already requirement gaps; do not propose timer values or broaden reset behavior merely to assign numbers. The future diagnostic channel must observe, not replace, existing protective logic. This document implements nothing and approves no new fault variants.


## Later tentative near-term option — no implementation

Vadim subsequently clarified the future architecture: TwinSAFE would provide only application Fault status to PLC; ordinary PLC logic and normal digital outputs would generate alternating green/blue lamps. The roughly200ms visual interval belongs to the PLC indication proposal, not a SAL timer or a new protective delay. This is a future option, not approval to implement a fault latch, PLC mapping, lamps or timer. A single boolean conveys only whether the chosen application fault aggregate is active, not which inventory reason stopped the system. The requirement inventory remains useful independently of this presentation choice.

Vadim clarified that reset buttons are green/blue; the word red was a slip. This clarification does not merge distinct existing reset contexts or authorize implementation. Exact PLC lamp interval and any later aggregate-Fault contract remain future work; no inventory conclusion depends on lamp timing.

