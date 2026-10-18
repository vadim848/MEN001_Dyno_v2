# Native timer/startup and signal bindings — 2026-10-18

> Исторический проект привязок. Действующий объём: AGENTS.md и
> WORK_STATUS_AND_PLAN.md. Аппаратная конфигурация принята как исходное условие;
> физическая трассировка и аппаратные gates ниже не блокируют программные
> проверки. Сначала изучать reference (REFERENCE_BEHAVIOR.md).

This is an evidence/binding design, not a deployable SAL change.
Generate source metadata with `npm run audit:bindings -- --write`:
`SIGNAL_BINDINGS.json` covers 64 SAL variables and 52 SDS descriptors.

## Target constraints established

The project's `Safety_Dyno.splcproj` selects **EL6900**.
[Beckhoff TwinSAFE Logic FB documentation](https://download.beckhoff.com/download/document/automation/twinsafe/twinsafe-logic-fb_en.pdf),
section 4.12, describes TON as an on-delay canceled by loss of its enabling
input, with 0.1 s minimum configuration units for the basic implementation.
The finer timebase extensions and TON2 are not available for EL6900. Section
3.1 distinguishes requested RUN from group state qualified by connection/error
conditions. These statements constrain design; they do not verify this project.

The proposed 0.5/1/2 s settings fit the basic configuration grid. Adding 1 ms to
encode the inclusive chord boundary is not a valid supported-target solution.
No project migration to another controller is proposed.

## Qualification producers and scheduling

Host continuity/order experiment is now recorded in `TIMER_CONTINUITY_REPORT.md`.
It validates first-sample inclusion and continuity with explicit snapshots;
it does not close the native inclusive-window or startup evidence gaps.

| Fact | Proposed TON input (from one common state snapshot) | Delay / reset |
|---|---|---|
| ReleaseDone | WaitRelease AND both OFF AND NOT Inhibit | Preliminary 2 s; any press/inhibit clears |
| SingleDone | (Armed AND exactly one raw button) OR matching single Candidate; AND NOT Inhibit | Preliminary 1 s; second button/primary loss/inhibit clears |
| BothDone | (Armed AND both) OR (Candidate AND both AND chord accepted) OR (TwoAttempt AND both); AND NOT Inhibit | Preliminary 2 s; either lost/inhibit clears |
| ChordExpired | Armed first-single sample OR single Candidate | Preliminary 0.5 s; leaving candidate clears; does not itself prove inclusive acceptance |

Raw/snapshot facts execute before qualification inputs; TONs then execute before
next-state equations. Input continuity across Armed -> Candidate and Candidate
-> TwoAttempt must avoid a one-scan false gap that restarts qualification.
Pulse terms are computed before ownership writes; final permission uses the
new owner status. All numbers above remain preliminary specification values.

### Inclusive chord boundary is still open

Candidate alternatives are (a) a sampled previous-expiry snapshot, or (b) an
explicitly reviewed editor-native timing construction. Neither is accepted yet.
Previous-expiry logic can shift acceptance by a scan if the TON start/read order
is wrong. Require editor/native-runtime traces for second-button visibility at
490/500/510 ms and the target's actual cycle/jitter. Host tests do not establish
exact physical simultaneity. Preserve the specification rule; do not silently
round its window or use an unsupported millisecond setting.

## Initialization proposal and required proof

1. Gate all commands/access until the real TwinSAFE group is running and the
   recognizer is explicitly in WaitRelease. A PLC-requested RunStop bit is not
   group-ready evidence.
2. Initialize recognizer ownership to WaitRelease and normal request memories
   to idle, with emergency handling retaining the required startup safety
   policy. Never initialize the machine directly into R&D/Run.
3. Require a new full release interval; held buttons cannot authorize action.
4. On group STOP/error/restart, suppress outputs and prove how timers/memories
   restart. Do not assume host constructor defaults equal native memory behavior.
5. Keep group ERR_ACK, FB E-Stop Restart and machine Emergency recovery distinct.

Explicit initializer/qualified-group-run encoding, memory behavior on restart
and safe constant sources still require editor/Verify and runtime evidence.
No unconnected TRUE input or normal PLC bit is approved as an initializer.

## Physical source evidence

| Proposed semantic input | Current source evidence | Polarity / proof / owner |
|---|---|---|
| GreenRaw | `in_Reset_PB`, SDS62/channel5, SafetyAliasDevice/FSoE | Electrical polarity unverified; recognizer reads; same raw button also feeds existing FB Restart |
| BlueRaw | `in_Relase_Door_PB`, SDS62/channel7, SafetyAliasDevice/FSoE | Electrical polarity unverified; recognizer reads |
| Door closed/locked | A14 EL1859 channel 2 -> `GVL_Safety.DoorMonitorFromPLC` -> MAIN assignment -> `stTwinSAFE_OUT.DoorMonitor` -> Standard In Var 16 -> `in_Door_Monitor`, SDS16/channel1, **StandardAliasDevice** | Physical project channel traced; contact meaning/polarity and independent safe closed AND locked proof remain unresolved |
| Solenoid monitor | A14 EL1859 channel 1 -> `GVL_Safety.SolonoidStatus`; separately `stTwinSAFE_OUT.SolenoedMonitor` -> Standard In Var 15 / SDS15 StandardAliasDevice | No assignment between these PLC fields found in saved source; no distinct matching SAL variable found. Mapping alone does not establish feedback delivery |
| Unlock command | `out_Door_Unlock_Solonoeid`, SDS51/channel1, writer Network1/FBRs6 | Command, not feedback; final permission will own it after review |
| Main E-Stop | `in_ES_NC_1/2`, SDS62/channels1/3 | Channel configuration/discrepancy and raw polarity require runtime review |
| External interlock | `in_InterLock_NC_1/2`, SDS62/channels9/11 | Both must feed reviewed Emergency semantics across modes |
| Connector contacts | LV SDS61/channel9; HV SDS61/channel11 | Safe exception versus post-Safe emergency handled by mode logic |
| Healthy | LV SDS61/channel7; HV SDS61/channel3 | Raw polarity/behavior in discharge unresolved |
| Contactor feedback | LV C1 SDS61/channel13; HV C2 SDS61/channel15 | Physical ON/OFF meaning and qualification unresolved |
| Drive feedback | `in_STO_DR1_FBK` SDS71/channel1; DR2 SDS72/channel1 | Request-versus-achieved-safe-state semantics unresolved |
| Requested group run | `in_Safety_Run`, SDS50/channel1, StandardAliasDevice -> `//RunStop` | Request, not actual qualified RUN status |
| Group error ack | `GroupPort_ErrAck`, SDS1/channel1 -> `//ErrAck`, StandardAliasDevice | Group acknowledgement, not proof of safe machine recovery |

Alias transport/type and raw channel numbers are evidence only. Even a
SafetyAliasDevice does not establish field wiring, polarity or the safe
meaning of its signal. No StandardAliasDevice is silently promoted to safe
closed/locked or energy proof.

## Core/owner boundary binding table

### PLC trace evidence (2026-10-18)

- `MEN001_Dyno/MEN001_Dyno.tsproj:13130–13132` binds the two physical
  inputs to Machine Side A10 / A14 D-I/O (EL1859), channels 2 and 1 respectively.
- `PLC_Dyno/GVLs/GVL_Safety.TcGVL:9–10` declares both as mapped PLC inputs.
- `PLC_Dyno/POUs/MAIN.TcPOU:27` copies only DoorMonitor into the TwinSAFE
  output structure. Repository-wide searches of saved source found
  SolonoidStatus only in the declaration, mapping and visualization; the
  SolenoedMonitor field has a declaration, a mapping and an LED read, but no
  assignment. Online forcing or external symbol writes are not excluded by
  this static finding.
- `MEN001_Dyno.tsproj:13191,13199` maps the structure fields to standard
  variables 16 and 15. Both SDS descriptors explicitly use StandardAliasDevice.
- No separately named HV-safe/discharge-complete producer was found in saved
  PLC/SAL source. Existing HV Healthy, C2 and drive feedback require their own
  physical semantics; none is substituted as safe-energy proof by this audit.

Required field clarification: what do A14 channels 1/2 mean electrically when
the lid is open, closed-unlocked and closed-locked; what approved feedback or
validated timing procedure establishes safe HV and motion before access?
Do not repair the missing copy blindly: an assignment would change delivered
data without establishing its meaning or its use in the actual safety logic.

| Boundary group | Producer / owner | Completion or validity condition | Current state |
|---|---|---|---|
| off/both/greenOnly/blueOnly | Recognizer raw-input logic | Same sampled physical buttons | Mappable Boolean logic |
| candidate/primaryLost | Recognizer snapshot logic | One-hot recognizer state | Mappable Boolean logic |
| releaseDone/singleDone/bothDone | Native qualification TONs | Continuity/reset contract above | Timing/runtime proof pending |
| within | Native chord qualifier | Inclusive first-press rule | Native boundary unresolved |
| inhibit | Reviewed emergency/state/access supervisor | Validated group/state plus all applicable fault sources | Composite binding unresolved |
| ModeSafe/ModeRnD/ModeRun | Semantic mode controller, not direct HMI | Provisional Step1/R&D/Step3 mapping plus real feedback | Mapping/completion not accepted |
| StepUp/StepDown | Shared recognizer pulses | Fresh qualified attempt | Conceptually tested; native producer incomplete |
| AllowUp/AllowDown | Mode/interlock controller | Actual applicable interlocks and feedback at acceptance | Composite proof pending |
| Emergency/Fault/InvalidState | Common priority supervisor | Covers independent protective paths and group/state diagnostics | Not merely NOT EStop OK; mapping pending |
| Complete.SafeToRnD | LV sequencer | Approved LV sequence/feedback and HV-safe condition | Not bound |
| Complete.RnDToRun | HV/drive sequencer | Approved C2/Healthy/drive readiness, cover closed/locked | Not bound |
| Complete.RunToRnD | Stop/discharge sequencer | Approved SS1/coast, HV-safe completion, C2 OFF | Not bound |
| Complete.RnDToSafe | LV shutdown sequencer | Approved LV/battery/BMS removal and OFF feedback | Not bound |
| Timeout.* (four routes) | Qualified per-route deadline TONs | Approved times and explicit completion arbitration | No approved deadlines/bindings |
| ManualRecovery | Physical recovery procedure plus edge detector | Fresh authorized manual event | Not raw held Reset or group ERR_ACK |
| HazardRemoved | Energy/motion removal supervisor | Safe feedback and completed required waits | Not bound |
| SafeEnergyForAccess | Safety-qualified access supervisor | Safe motion/HV and relevant actual feedback | **Missing physical/procedure proof** |

## Next action and gate

Build a non-deployed native-style timer producer experiment for continuity and
ordering, keeping the inclusive-window alternatives explicit. Review the actual
PLC/wiring origin of DoorMonitor and available lock/HV-safe proof. The remaining
runtime facts cannot be established by additional host tests alone. Candidate
SAL assembly must not replace unresolved proof inputs with constants.
# Исторический проект привязок

Действующий объём изменён 2026-10-18: AGENTS.md и WORK_STATUS_AND_PLAN.md.
Аппаратная конфигурация принята как исходное условие; физическая трассировка
и аппаратные gates ниже не продолжаются и не блокируют программные проверки.
Сначала искать существующее поведение в reference (REFERENCE_BEHAVIOR.md).

