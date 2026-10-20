# Результаты программных проверок

Дата: 2026-10-20T07:28:49.233Z
SAL SHA256: 72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e

Clock: observed-fixed-scan-v1; first observed edge age0; fixed scan per scenario. Generic runFor durations describe scheduled scan advance, not an implicit event timestamp.

Аппаратная конфигурация принята как исходное условие. Файлы проекта не изменяются этим запуском.

- harness: PASS; 189/189, ошибок 0, пропусков 0.
- historical: PASS; 75/75, ошибок 0, пропусков 0.
- current: FAIL; 436/438, ошибок 2, пропусков 0.
- Текущий код: {"PASS":200,"FAIL":1,"NOT VERIFIED":7,"ERROR":0}.

PASS относится только к указанному компоненту/сценарию. Прототипы и исторические воспроизведения не являются приёмкой текущего SAL.

Reference: https://github.com/vadim848/MEN001_Dyno.git, Prodoction, 4495a1f6049f6a58ebfd436761faa84d17c8d643.

Сохраняется проверенный контракт EStop компонента; R&D задаётся требованиями v2, а не reference.
Контрпримеры PRIORITY условны: фазы установлены тестом, Network4 исключён, fallback FALSE/TRUE указан в ID. Число FAIL не равно числу независимых доказанных дефектов системы.
BUTTON/STATE проверяют границу отдельной ветви: внутренний запрос вверх не равен фактическому включению энергии; upstream/downstream разрешения требуют отдельных проверок.

## Найденные несоответствия

- STATE:conflicting-set-requests: {"label":"conflicting requests cannot report simultaneous Safe and Run","actual":true,"expected":false}.

## Пробелы и ошибки

- ACC-B01: Complete recognizer/reset ownership is not yet bound across Safe/R&D/Run
- ACC-C02-F: Full-phase coverage of both InterLock NC energy guards and separate DoorMonitor solenoid reactions remains incomplete; no locked-feedback gate is required
- ACC-C01-E: Software coverage of all transition phases and fault/button combinations remains incomplete
- LATE:NO-FAULT: Network12 component has no bound complete group/fault observation; absence of a parsed Error is not proof of no fault
- LATE:NO-ROLLBACK: Single request producer is observable, but accepted transition/event ownership and downstream rollback are not bound in this component; no fake latched marker used
- BOOT:UNSUPPORTED_UNBOUND_PROGRAM_INPUT: Network4 has eight unbound DECOUPLE inputs and seven used phase writers; native unbound values are not established
- BOOT:UNSUPPORTED_GROUP_LIFECYCLE: RunStop/ErrAck are declared and bound, but the adapter has no group lifecycle/memory/error engine; requested Run and main EStop Restart do not establish group RUN/ErrAck
- UNSUPPORTED_UNBOUND_PROGRAM_INPUT: Network4 has eight unbound DECOUPLE inputs and seven used phase writers; native unbound values are not established
- UNSUPPORTED_GROUP_LIFECYCLE: RunStop/ErrAck are declared and bound, but the adapter has no group lifecycle/memory/error engine; requested Run and main EStop Restart do not establish group RUN/ErrAck
- Full upstream transition permission/completion coverage incomplete
- Full-phase coverage of two InterLock NC energy guards and separate DoorMonitor solenoid conditions remains incomplete; no separate locked-feedback gate required
- Energy completion/timeout behavior requires explicit software expectations where not specified

Подробные наблюдения, исходные условия и допущения: SOFTWARE_CHECK_RESULTS.json.
