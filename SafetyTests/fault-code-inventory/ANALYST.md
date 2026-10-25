# Application fault inventory: independent requirements analysis

2026-10-21. Scope: enumerate/count existing required fault meanings only. Future independent Fault + binary PLC diagnostics is an idea for Vadim's later decision. This inventory approves no new fault class, detector, code assignment, priority, timer, recovery or implementation. No source/tests/hardware/shared documentation edited.

## Sources and supersession

Read latest SCENARIO_DECISIONS.md top, WORK_STATUS_AND_PLAN, SAFETY_STATE_MACHINE_SPEC.md, SOFTWARE_ACCEPTANCE_SCOPE, EMERGENCY_REQUIREMENTS, feedback-timeout draft, Healthy fault reset audit and reference behavior. Directly parsed reference SAL first, then working SAL with whole-source typed binding validation. SHA256: reference `efddc60b1263144ae73b3d5184158100ec09c4de739dc8919309ef7b1b0dc334`; working `59bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33`. Reference path is confirmed `C:/Users/user/source/repos/MEN001_Dyno/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal` (Prodoction4495a1f); no fresh git branch claim or checkout modification.

All Niv behavioral proposals were cancelled by Vadim. Short Reset, changed door policy and physical-only scope are NOT current requirements. Latest Vadim confirmations restore/confirm single500, inclusive chord250/BOTH1000, one step per attempt, release2000 and Armed BOTH ignore. Point11 explicitly confirms invalid late attempt causes NO fault. Point12 confirms existing green→EStop FB Restart role only; it did not independently approve a new whole Emergency→Safe procedure. Point13 confirms immediate any-button PRESS acknowledgment of Safety Fault after failed upward transition and rollback; that acknowledgment consumes the attempt, then bothOFF2000 and a new gesture are required. Do not conflate with HealthyLost edge-reset context or group ErrAck.

Latest D-HV-TIMED-COMPLETE supersedes mandatory separate physical HV_Safe feedback in the applicable normal stop/StartingRun-abort contexts: existing discharge hold then C2feedbackOFF is sufficient. D-RUN-STOP-WAITS confirms SS1=2s, coast=5s; abort has no SS1/coast. None of these decisions approves the draft 5s/10s fault deadlines in FEEDBACK_TIMEOUTS.md.

## Finite catalogue and defensible count

Count reasons by meaningful cause, not every combination of simultaneous inputs, channels, mode and history. The following **11 analytical umbrella families** summarize existing required behavior and/or explicit existing stop-source wiring. They are an alternative coarse requirements grouping, **not the architect's proposed code count** and not a complete final numerical catalogue: driver fault/watchdog named by the SPEC diagram must additionally remain visible below. A single family can require multiple detectors or phase-specific reactions.

| Family | Reason | Exact existing basis | Qualification/limit |
|---|---|---|---|
| R01 | Physical EStop requested | SPEC§§2–3,13; EMG-001; `in_ES_NC_1/2` → main EStop component | Two channels form one physical-stop family at this level. Channel disagreement would be separate diagnostic detail, not another stop command by default. |
| R02 | External emergency interlock interrupted | SPEC§5.1; EMG-002/005; `in_InterLock_NC_1/2` | Preserve both channels, restoration cannot cancel started emergency. Grouped here, not two arbitrary error codes. |
| R03 | LV connector interlock lost after Safe exit | SPEC§5.1; EMG-003/004; `in_LV_Connector_Interlock` | Missing in Safe is no-fault inhibition, not this reason. |
| R04 | HV connector interlock lost after Safe exit | Same requirements; `in_HV_Connector_Interlock` | Separate actionable source from LV connector. |
| R05 | Mentee protective stop | Existing reference/current `in_Mentee_EStop` and source guards, included in approved EStop/other-permission preservation | Existing stop request source, not a newly invented transition fault. Separate application code has not been approved. |
| R06 | PLC protective stop | Existing reference/current `in_Estop_PLC`; PLC_PULSE_SET_REQUIREMENTS; EMG-005/006/011 | Distinct from independent PLC normal mode requests; restoration alone is not acknowledgment. |
| R07 | Healthy lost during SS1 | SPEC§9 named `HealthyLostDuringSS1`; EMG-008/009 | Latch persists through raw restoration; approved complete-stop/Healthy-restored acknowledgment has its own edge context. |
| R08 | Safe→R&D startup fails to obtain required LV confirmations | SPEC§6 steps3–7, MOD-001; latest Vadim point13 failed-upward SafetyFault | Required startup failure family. Exact detector deadline/source partition is not fully approved or implemented. |
| R09 | R&D→Run startup fails to obtain required C2/HV confirmations | SPEC§7 steps3–6, MOD-002; latest Vadim point13 | Separate Run confirmation from early STO release. Failed startup is not automatic Run; exact failure subreason/rollback coverage remains open. |
| R10 | HV discharge failed/timed out | SPEC§10, STP-003 (`TransitionFault`, no automatic continuation) | Fault existence required; exact timeout/C2/discharge retention and acknowledgment policy remain partly pending. Latest timed success criterion does not supply a failure timeout. |
| R11 | Invalid/conflicting state ownership | SPEC§§13–14, EMG-012 | Required safe fault. Exact Emergency vs TransitionFault destination and reset remain Q-FAULT-DESTINATION, not chosen here. Legal transition phases must not be mistaken for no-main-state fault. |

R05/R06 are existing source-identifiable protective requests, while R08–R11 include required behaviors lacking complete current detectors. No reported total should imply all are currently implemented or independently observable as application faults. R08/R09 are umbrella/fallback meanings: **do not assign an additional independent active root cause called generic upward SafetyFault when the same failed transition is already explained by a named C1/C2/Healthy subreason**. A fallback code is meaningful only for genuinely unclassified startup failure; otherwise it doublecounts the event.

## Granularity expansion: why 4 bits may become tight

The same existing requirements can reasonably need more actionable detail, but the following are **proposed splits/candidate detector categories only**, not newly approved codes:

| Candidate detail | Counting effect relative to11 | Source and gap |
|---|---:|---|
| Split R08 into C1-ON feedback missing vs LV readiness/Healthy confirmation missing | +1 | SPEC§6 individual confirmations; actual named inputs `in_LV_C1_FBK`, `in_LV_Healthy_FBK`; exact timeout classification pending. |
| Split R09 into C2-ON feedback missing vs HV Healthy confirmation missing | +1 | SPEC§7; `in_HV_C2_FBK`, `in_HV_Healthy_FBK`; same qualification. |
| LV commanded OFF but LV feedback does not become OFF | +1 | SPEC§11 steps2–6, approved D-LV-OFF-COMPLETE; completion criterion approved, exact timed-fault detector not approved. |
| C2 commanded OFF but C2 feedback does not become OFF | +1 | SPEC§8 steps10–12, §10; actual input exists; deadline and recovery pending. |
| Driver1 STO feedback disagrees with expected commanded phase | +1 | SPEC§13 critical safety feedback; `in_STO_DR1_FBK` exists. Meaning of expected levels, phase grace and fault deadline require complete source mapping. |
| Driver2 same STO feedback disagreement | +1 | Same with `in_STO_DR2_FBK`; separate actionable drive. |

These six detailed distinctions add six buckets to the11 umbrellas under this illustrative grouping. **This alternative11→17 arithmetic is not the architect's15-family/22-detail base catalogue.** Those use a different partition, with Healthy and feedback failures separated and unknown-cause startup failure retained only as fallback. No final total is approved by Vadim merely because it was listed. Splitting every ON/OFF direction, phase or channel creates a different total and must be explicitly chosen, not disguised as discovery of more independent faults.

Other named/plausible areas must remain a separate unresolved list:

- **Driver fault and watchdog:** SPEC diagram explicitly names both as Run→Emergency triggers (§4 lines with driver fault/watchdog), but the current/reference declared-input inventory does not expose dedicated corresponding application inputs. These are **two existing requirement/interface gaps**, not merely optional new requirements. An inventory claiming all current required causes must retain both, while clearly marking missing detector/source binding. Do not infer from STO feedback that it is a general driver diagnostic or invent watchdog timeout. If omitted from a main numeric table, add them as +2 unresolved required categories.
- **Healthy loss outside SS1:** LV/HV inputs exist, §7 requires LV healthy and §13 covers critical feedback, but a generic fault classification across all stable/transition phases and its reset is not fully defined. Do not duplicate R07 or R08/R09 automatically. If separately specified, this could require one or more further reasons.
- **`in_False_SI2_CH8`:** used as a real guard operand; its name is not proof of constantFALSE or a particular hardware fault. No approved independent fault identity follows solely from its use.
- **Native FB/group/communication diagnostics:** current SAL exposes `Network1/FBEstop1/Error` and `RndPhysicalCompact/WINDOW/Error`, both without outgoing wires/globals; reference has only the main EStop Error. These are native diagnostics, not demonstrated application fault memories. Group/error/watchdog/ADS messages are not automatically one shared application reason; decide their future interface separately. Target/ADS7 and project validation errors are commissioning/tool results, not runtime operation reasons.
- **C3/battery/BMS feedback:** SPEC§6/§11 requires ordered actions, but no separate corresponding confirmation input found in the current declared-input inventory. Do not fabricate individually diagnosable faults from command names alone.

## Explicit exclusions: code0 can coexist with an inhibited operation

- Invalid short/late (>250ms before single500) or failed BOTH attempt: ignore, no fault, require cleanup. SPEC§3.1/BTN-008 and latest Vadim point11.
- A held-at-entry input or incomplete neutral filter: not a newly accepted command, not automatically a fault. Latest confirmations1–11.
- BOTH in Armed: ignored, no fault by itself. Latest point10.
- Open lid indefinitely in Safe/R&D: normal, no timeout/fault. SPEC§5/CVR-003. DoorMonitor only existing solenoid role; cancelled Niv door rules do not apply.
- Connector absent in Safe: prevents energy advance without fault; restored input requires new gesture. EMG-003.
- Upward request made without necessary readiness/interlocks: lack of acceptance alone is an inhibition. Distinguish accepted-start confirmation failure from simply declining an invalid request.
- Normal green down, new accepted StartingRun abort and completion waiting while within the allowed sequence are operations, not faults.
- Startup awaiting permitted manual EStop Restart or post-fault acknowledgment is a status/recovery stage, not another primary reason.

## Recovery and multiple reasons are separate dimensions

Emergency and TransitionFault are reaction/status categories, not sufficient unique diagnoses. Example: connector loss triggers Emergency; failed discharge can trigger TransitionFault. Counting both a cause and its resulting state as two independent primary reasons overcounts.

Latest point13 SafetyFault acknowledgment: any-button PRESS immediately resets the described completed-rollback startup fault; same attempt cannot become up/down, bothOFF2000 then new gesture. This is not a new error reason and not permission to reset an active cause or group ErrAck. D-HEALTHY-FAULT-RESET-EDGE is narrower/different: in its completed HealthyLost context, a change of either button can acknowledge; unchanged held level cannot. Main EStop Restart remains raw green press/release according to FB semantics. One universal reset rule must not be invented.

No choice has yet been approved between first fault, highest safety priority, most recent fault, retained first cause plus secondary list, or numeric precedence for simultaneous faults. SPEC§13 action priorities do not define diagnostic code priority. A future single binary number cannot encode all simultaneous combinations uniquely without an explicit policy; enumerate reasons and keep that policy pending.

## Handoff conclusion

After reading the completed ARCHITECT.md, the main reporting denominator is **15 application families /22 optional channel-direction details**. The two named but unbound driver-fault and watchdog categories add **+2 to each denominator**, giving **17 grouped families /24 detailed labels across all named requirement/source categories**. These are provisional inventory meanings, not proof of15/17/22/24 implemented detectors or codes. My alternative11→17 umbrella analysis above is expressly not the architect's main partition. Unknown-cause failed-upward SafetyFault is a fallback only, never an additional root cause when a specific reason is known; treating it solely as status would remove one label from either main denominator.

Four bits provide15 nonzero values; five bits31. The15-family application base fits four bits exactly with no spare;22 application details do not. Including both named interface gaps gives17families/24details, both beyond four-bit capacity and within five-bit capacity. This is arithmetic/capacity only, not a decision to implement. Keep normal inhibits excluded, avoid generic-upward-fallback doublecounting, and preserve detector/timeout/source and multi-fault arbitration gaps. No operational policy needs to be guessed merely to list the fault families.
