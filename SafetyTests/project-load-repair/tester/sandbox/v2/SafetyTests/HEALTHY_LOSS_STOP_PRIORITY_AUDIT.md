# Healthy loss during normal SS1: priority audit

Latestanswer D-STARTINGRUN-NO-COAST closes the isolatedabortquestion below:
unfinishedStartingRunabort noSS1/no5s coast, STO→immediateprogramDischarge→
existinghold→C2OFF→C2FBKOFF. Earlier competingaborttraces/pendingrelevance are
historicalsuperseded; Healthy-onlyRunSS1 latched5s unchanged. LVworkingbounded
transfer finalACCEPT, notnewRunHealthyfault/reset implementation acceptance.

2026-10-20. Analyst **READY** for the known Healthy-only reaction below.
Only this document written; no code/tests/other requirements changed.
Read SPEC8–10/12–13/EMG008–011, latest direct answers recorded in
SCENARIO_DECISIONS, DISCHARGE_PROGRAM_CONTRACT reference trace and current
N6/N7 native predicates. Fresh current full binding audit PASS. Reference
was previously read directly; no cancelled access repeated. Source preservation
does not override subsequently approved stop behavior.

## Source conflict is real; required Healthy-only behavior is already clear

Initial established Run, healthy applicable interlocks, normal accepted down,
actual StoppingSS1 before its2s completion; HVHealthy changes to its source-
mapped bad value, with NO additional EStop, connector, ExternalNC or LVHealthy
fault. SPEC9 explicitly requires immediate program selection of STO, fault
HealthyLostDuringSS1, STOCoastWait, full5s coast, then discharge with source/C2
connected, existing dischargehold, C2OFF command and C2FBKOFF, then permits
completed RnD with the fault still latched until deliberate reset. Latest
D-HV-TIMED-COMPLETE provides success evidence; no physical discharge-capability
inquiry or new feedback input is a gate for this program scenario.

Thus no new decision is required to choose RnD versus full-removal Safe for
this isolated Healthy-only SS1 event: SPEC9 states RnD. Normal pause retains
LV by SPEC8; implementing SPEC9 through a branch that unconditionally removes
LV/battery/BMS and heads to Safe cannot be claimed equivalent. This conclusion
does not mean every additional emergency must retain LV, and does not erase
the original full-removal operation from its other legitimate causes.

Immediate STO means handling the detected event through actual program order,
without waiting out the residual SS1 2s. The5s coast begins with the selected
STO/coast event, not before STO or from an unrelated earlier Healthy sample.
Healthy restoration cannot revert to SS1, clear fault or reduce the full coast.
No Unlock or completed RnD during coast/discharge/pending C2OFF feedback.
RnD completion is permitted after the specified sequence; it is NOT a reset
of the HealthyLost fault. Do not assert UnlockTRUE or a fresh Run permission
merely because RnD becomes TRUE while fault remains latched.

Current/reference N7TON1=2s (parameter fe29b38d-a1c2-4d62-b861-f4350a7b1bac)
also writes LVreset. N7And2/And3 use that done and opposing rawHealthy branches;
N7TON2/3=5s (f3b9940d-d90d-4369-9d0a-08270dc9f89c,
7f7fa076-8e18-47e0-8be9-e6ed158a1a03) lead to STO requests. This starts the
5s before STO on one source branch and can change on restored Healthy;
it does not implement fault-latched immediateSTO→coast5s. N6 protective
full-removal selection coexists upstream. All active producer/Reset/phase
owners must therefore be considered; changing only a new normal-stop owner
while old N6 still takes Step4 is insufficient proof of the required outcome.
Exact safe implementation/count/serialization is architecture work, not a
reason to reinterpret the normative event or alter existing timer values.

## Concurrent additional faults: distinguish priority from unspecified outputs

If EStop, any ExternalNC channel, or connector loss after Safe occurs during
this stop/coast, Emergency has higher priority (SPEC5.1/12–13, EMG001–005/011).
Healthy fault memory and any required motion wait may not be silently cancelled
by restored inputs or normal RnD completion. Known checks: immediate torque
prohibition as required, no new energy increases, UnlockFALSE, no automatic
return to Run; Emergency does not become ordinary RnD recovery just because
Healthy-only stop had an RnD destination. Controlled source/C2 retention during
required stopping/discharge is distinct from newly energizing a cancelled up.

The latest answers do not specify every contactor priority or final owner when
independent Emergency and Healthy-only stop coexist. Preserve the reference
protective full-removal actions for their remaining causes where compatible
with approved waits/ordering; do not infer universal retain-LV or universal
immediate-all-OFF. Software evidence can establish inhibition/torque/lock/fault
memory now without inventing the unresolved final waveform.

Only if needed for a concrete simultaneous-fault implementation, root may ask:
"Run уже выполняет нормальную SS1 остановку. Потерян HVHealthy, STO уже выбран
и идёт5с выбег; затем отдельно размыкается EStop (либо указанный ExternalNC/
connector). Следует ли после неизменяемого motion/discharge ожидания выполнить
полную аварийную последовательность снятия LV/battery/BMS с ручным возвратом
только в Safe, вместо Healthy-only завершения RnD; какие команды C2/discharge
должны удерживаться до завершения этого ожидания?" Ask only the concrete
remaining conflict after reference comparison, not Healthy-only behavior again.
HV timeout C2/discharge retention/manual reset remains separately pending if
not already answered; success answer does not define that failure procedure.

## Independent acceptance cases

1. Paired normal goodHealthy control establishes SS1timer2s and connected C2;
   inject sole badHealthy before2s, assert actual STO selection without residual
   2s delay, then full5s with no early discharge/C2OFF/RnD/Unlock.
2. Restore Healthy at several coast times, including early and near5s; no
   switchback/restart/shortenedwait, fault remains. Trace actual old/new Reset/
   Set/phase writers and LV/battery/BMS outputs, not just a new logical flag.
3. After coast, assert existing discharge hold; command echo is not elapsedhold.
   C2FBKON prohibits RnD; hold done then C2OFF/FBKOFF permits RnD with fault
   retained. No numerical invented totaldeadline, timeout or extra sensor.
4. Additional Emergency controls separately exercise known priority/inhibition
   without guessing unknown completion waveforms. Raw NC/Mentee/Healthy values
   are given program inputs with source-derived contacts, not hardware studies.

StartingRun abort is a separate scenario: noSS1 per latest user. Its5s question
cannot be answered solely from this Healthy-loss-during-SS1 predicate; architect
provided competing C2OFF/rawHealthyTRUE abort traces (discharge immediately
afterSTO versus after5s). Recorded "relevant waits" and nomotors do not by
themselves select that exact enable. If no other source contract resolves it,
return that isolated choice to root; do not block this fully defined Healthy-
only SS1 work or repeat the already answered timer values/abort necessity.

ALL WRITES STOP. Requirements READY for Healthy-only case; concurrent final
waveform and isolated abort relevance choice have the above explicit limits.
