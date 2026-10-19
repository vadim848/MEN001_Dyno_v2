# Результаты программных проверок

Дата: 2026-10-19T14:43:28.068Z
SAL SHA256: a45f129ebdc8e60602465381fd7a0579c8c9c18a84c9ae9a6abdb45cb462e51a

Clock: observed-fixed-scan-v1; first observed edge age0; fixed scan per scenario. Generic runFor durations describe scheduled scan advance, not an implicit event timestamp.

Аппаратная конфигурация принята как исходное условие. Файлы проекта не изменяются этим запуском.

- harness: PASS; 178/178, ошибок 0, пропусков 0.
- historical: PASS; 75/75, ошибок 0, пропусков 0.
- current: PASS; 186/186, ошибок 0, пропусков 0.
- Текущий код: {"PASS":201,"FAIL":1,"NOT VERIFIED":5,"ERROR":0}.

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
- Full group startup/restart and Network4 semantics not modeled
- Full upstream transition permission/completion coverage incomplete
- Full-phase coverage of two InterLock NC energy guards and separate DoorMonitor solenoid conditions remains incomplete; no separate locked-feedback gate required
- Energy completion/timeout behavior requires explicit software expectations where not specified

Подробные наблюдения, исходные условия и допущения: SOFTWARE_CHECK_RESULTS.json.
