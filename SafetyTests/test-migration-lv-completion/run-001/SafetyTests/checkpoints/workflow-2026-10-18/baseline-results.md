# Результаты программных проверок

Дата: 2026-10-18T20:12:37.231Z
SAL SHA256: b1fa361f5647eba2a5bb8436e4853d8773ba7f6b0acbf1e7f96c519196251daa

Аппаратная конфигурация принята как исходное условие. Файлы проекта не изменяются этим запуском.

- harness: PASS; 71/71, ошибок 0, пропусков 0.
- historical: PASS; 74/74, ошибок 0, пропусков 0.
- Текущий код: {"PASS":108,"FAIL":62,"NOT VERIFIED":3,"ERROR":0}.

PASS относится только к указанному компоненту/сценарию. Прототипы и исторические воспроизведения не являются приёмкой текущего SAL.

Reference: https://github.com/vadim848/MEN001_Dyno.git, Prodoction, 4495a1f6049f6a58ebfd436761faa84d17c8d643.

Сохраняется проверенный контракт EStop компонента; R&D задаётся требованиями v2, а не reference.
Контрпримеры PRIORITY условны: фазы установлены тестом, Network4 исключён, fallback FALSE/TRUE указан в ID. Число FAIL не равно числу независимых доказанных дефектов системы.
BUTTON/STATE проверяют границу отдельной ветви: внутренний запрос вверх не равен фактическому включению энергии; upstream/downstream разрешения требуют отдельных проверок.

## Найденные несоответствия

- ACC-B01-R: {"signal":"b_Set_Door_Unlock_1","expected":false,"actual":true,"checkpoint":"second hold after only 100 ms neutral"}.
- ACC-B03-IN: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1900 ms of both held"}.
- ACC-B03-EDGE: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1900 ms of both held"}.
- ACC-B03-LATE: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1900 ms of both held"}.
- ACC-B03-FLICKER: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1900 ms since restored chord"}.
- ACC-B02-G: {"signal":"b_Set_Transition_2","expected":false,"actual":true,"checkpoint":"900 ms"}.
- ACC-B02-B: {"signal":"b_Set_Door_Unlock_1","expected":false,"actual":true,"checkpoint":"900 ms"}.
- ACC-B03-T: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1900 ms"}.
- ACC-B03-B: {"signal":"b_Set_Door_Unlock_1","expected":false,"actual":true,"checkpoint":"remaining button held 1200 ms"}.
- ACC-B03-G: {"signal":"b_Set_Transition_2","expected":false,"actual":true,"checkpoint":"remaining button held 1200 ms"}.
- ACC-C01-S: {"signal":"out_Door_Unlock_Solonoeid","expected":false,"actual":true,"checkpoint":"50 ms after release"}.
- ACC-C02-X: {"signal":"Unlock AND StepUp","expected":false,"actual":true,"checkpoint":"after reclose and qualified chord"}.
- ACC-C01-E-Step1: {"signal":"out_Door_Unlock_Solonoeid","expected":false,"actual":true,"checkpoint":"blue held during NC1 fault"}.
- ACC-C01-E-Step_RnD: {"signal":"out_Door_Unlock_Solonoeid","expected":false,"actual":true,"checkpoint":"blue held during NC1 fault"}.
- BUTTON:open-cover-chord: {"label":"no up without valid cover/release attempt","actual":true,"expected":false}.
- BUTTON:held-blue-at-start: {"label":"no unlock without valid release attempt","actual":true,"expected":false}.
- BUTTON:held-chord-at-start: {"label":"no up without valid cover/release attempt","actual":true,"expected":false}.
- STATE:conflicting-set-requests: {"label":"conflicting requests cannot report simultaneous Safe and Run","actual":true,"expected":false}.
- PRIORITY:Step1:NC1:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step1:PLC:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step1:NC2:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step1:Mentee:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step1:ExternalNC1:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step1:ExternalNC2:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:NC1:fallback=false: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:NC1:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:PLC:fallback=false: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:PLC:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:NC2:fallback=false: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:NC2:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:Mentee:fallback=false: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:Mentee:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:LVConnector:fallback=false: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:LVConnector:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:HVConnector:fallback=false: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:HVConnector:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:ExternalNC1:fallback=false: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:ExternalNC1:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:ExternalNC2:fallback=false: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:ExternalNC2:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step2:PLC:fallback=false: {"label":"no new HV command during fault","actual":true,"expected":false}.
- PRIORITY:Step2:PLC:fallback=true: {"label":"no new HV command during fault","actual":true,"expected":false}.
- PRIORITY:Step2:NC2:fallback=false: {"label":"no new HV command during fault","actual":true,"expected":false}.
- PRIORITY:Step2:NC2:fallback=true: {"label":"no new HV command during fault","actual":true,"expected":false}.
- PRIORITY:Step2:Mentee:fallback=false: {"label":"no new HV command during fault","actual":true,"expected":false}.
- PRIORITY:Step2:Mentee:fallback=true: {"label":"no new HV command during fault","actual":true,"expected":false}.
- PRIORITY:Step2:LVConnector:fallback=false: {"label":"no new HV command during fault","actual":true,"expected":false}.
- PRIORITY:Step2:LVConnector:fallback=true: {"label":"no new HV command during fault","actual":true,"expected":false}.
- PRIORITY:Step2:HVConnector:fallback=false: {"label":"no new HV command during fault","actual":true,"expected":false}.
- PRIORITY:Step2:HVConnector:fallback=true: {"label":"no new HV command during fault","actual":true,"expected":false}.
- PRIORITY:Step2:ExternalNC1:fallback=false: {"label":"no new HV command during fault","actual":true,"expected":false}.
- PRIORITY:Step2:ExternalNC1:fallback=true: {"label":"no new HV command during fault","actual":true,"expected":false}.
- PRIORITY:Step2:ExternalNC2:fallback=false: {"label":"no new HV command during fault","actual":true,"expected":false}.
- PRIORITY:Step2:ExternalNC2:fallback=true: {"label":"no new HV command during fault","actual":true,"expected":false}.
- PRIORITY:Step6:NC1:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step6:PLC:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step6:NC2:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step6:Mentee:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step6:LVConnector:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step6:HVConnector:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step6:ExternalNC1:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step6:ExternalNC2:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.

## Пробелы и ошибки

- ACC-B01: Complete recognizer/reset ownership is not yet bound across Safe/R&D/Run
- ACC-C02-F: Software cover-feedback binding/behavior not yet covered; physical origin is an accepted input condition, not a blocker
- ACC-C01-E: Software coverage of all transition phases and fault/button combinations remains incomplete
- Full group startup/restart and Network4 semantics not modeled
- Full upstream transition permission/completion coverage incomplete
- Distinct locked-feedback software binding requires agreed program contract
- Energy completion/timeout behavior requires explicit software expectations where not specified

Подробные наблюдения, исходные условия и допущения: SOFTWARE_CHECK_RESULTS.json.
