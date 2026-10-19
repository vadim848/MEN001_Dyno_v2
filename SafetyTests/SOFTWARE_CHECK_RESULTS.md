# Результаты программных проверок

Дата: 2026-10-18T21:40:47.250Z
SAL SHA256: 1fe206892664e46f8a8aa974c78d90eff2764cf0a664355b740974a9042fbfc9

Аппаратная конфигурация принята как исходное условие. Файлы проекта не изменяются этим запуском.

- harness: PASS; 73/73, ошибок 0, пропусков 0.
- historical: PASS; 75/75, ошибок 0, пропусков 0.
- current: PASS; 29/29, ошибок 0, пропусков 0.
- Текущий код: {"PASS":154,"FAIL":47,"NOT VERIFIED":5,"ERROR":0}.

PASS относится только к указанному компоненту/сценарию. Прототипы и исторические воспроизведения не являются приёмкой текущего SAL.

Reference: https://github.com/vadim848/MEN001_Dyno.git, Prodoction, 4495a1f6049f6a58ebfd436761faa84d17c8d643.

Сохраняется проверенный контракт EStop компонента; R&D задаётся требованиями v2, а не reference.
Контрпримеры PRIORITY условны: фазы установлены тестом, Network4 исключён, fallback FALSE/TRUE указан в ID. Число FAIL не равно числу независимых доказанных дефектов системы.
BUTTON/STATE проверяют границу отдельной ветви: внутренний запрос вверх не равен фактическому включению энергии; upstream/downstream разрешения требуют отдельных проверок.

## Найденные несоответствия

- ACC-B01-R: {"signal":"b_Set_Door_Unlock_1","expected":false,"actual":true,"checkpoint":"second hold after only 100 ms neutral"}.
- ACC-B03-LATE: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1000 ms of both held"}.
- ACC-B03-490: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1000 ms of both held"}.
- ACC-B03-500: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1000 ms of both held"}.
- ACC-B03-510: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1000 ms of both held"}.
- ACC-B03-LATE-BLUE: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1000 ms of both held"}.
- ACC-B03-490-BLUE: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1000 ms of both held"}.
- ACC-B03-500-BLUE: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1000 ms of both held"}.
- ACC-B03-510-BLUE: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1000 ms of both held"}.
- ACC-B03-B: {"signal":"b_Set_Door_Unlock_1","expected":false,"actual":true,"checkpoint":"remaining button held 1200 ms"}.
- ACC-B03-G: {"signal":"b_Set_Transition_2","expected":false,"actual":true,"checkpoint":"remaining button held 1200 ms"}.
- ACC-C01-E-Step1: {"signal":"out_Door_Unlock_Solonoeid","expected":false,"actual":true,"checkpoint":"blue held during NC1 fault"}.
- ACC-C01-E-Step_RnD: {"signal":"out_Door_Unlock_Solonoeid","expected":false,"actual":true,"checkpoint":"blue held during NC1 fault"}.
- EXACT:CHORD:GREEN:251: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1000 ms since second press"}.
- EXACT:CHORD:GREEN:500: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1000 ms since second press"}.
- EXACT:CHORD:GREEN:510: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1000 ms since second press"}.
- LATE:BEFORE:GREEN:300: {"signal":"any StepUp","expected":false,"actual":true,"checkpoint":"late second before qualification cancels attempt"}.
- LATE:AFTER:GREEN:600: {"signal":"any retrospective StepUp","expected":false,"actual":true,"checkpoint":"already qualified single cannot become another command"}.
- REARM:GREEN:SHORT-NEUTRAL: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"no new chord during entire 1100 ms after incomplete neutral filter"}.
- REPEAT:GREEN:NO-SECOND-UP: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"no second request in entire 1100 ms until both released and full filter"}.
- EXACT:CHORD:BLUE:251: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1000 ms since second press"}.
- EXACT:CHORD:BLUE:500: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1000 ms since second press"}.
- EXACT:CHORD:BLUE:510: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"1000 ms since second press"}.
- LATE:BEFORE:BLUE:300: {"signal":"any StepUp","expected":false,"actual":true,"checkpoint":"late second before qualification cancels attempt"}.
- LATE:AFTER:BLUE:600: {"signal":"any retrospective StepUp","expected":false,"actual":true,"checkpoint":"already qualified single cannot become another command"}.
- REARM:BLUE:SHORT-NEUTRAL: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"no new chord during entire 1100 ms after incomplete neutral filter"}.
- REPEAT:BLUE:NO-SECOND-UP: {"signal":"b_Set_Transition_3","expected":false,"actual":true,"checkpoint":"no second request in entire 1100 ms until both released and full filter"}.
- BUTTON:open-cover-chord: {"label":"no up without valid cover/release attempt","actual":true,"expected":false}.
- BUTTON:held-blue-at-start: {"label":"no unlock without valid release attempt","actual":true,"expected":false}.
- BUTTON:held-chord-at-start: {"label":"no up without valid cover/release attempt","actual":true,"expected":false}.
- STATE:conflicting-set-requests: {"label":"conflicting requests cannot report simultaneous Safe and Run","actual":true,"expected":false}.
- PRIORITY:Step12:Mentee:fallback=false: {"label":"no new LV command during fault","actual":true,"expected":false}.
- PRIORITY:Step12:Mentee:fallback=true: {"label":"no new LV command during fault","actual":true,"expected":false}.
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

## Пробелы и ошибки

- ACC-B01: Complete recognizer/reset ownership is not yet bound across Safe/R&D/Run
- ACC-C02-F: Preservation of existing DoorMonitor conditions and cover reactions not fully covered; no new separate locked-feedback guard is required
- ACC-C01-E: Software coverage of all transition phases and fault/button combinations remains incomplete
- LATE:NO-FAULT: Network12 component has no bound complete group/fault observation; absence of a parsed Error is not proof of no fault
- LATE:NO-ROLLBACK: Single request producer is observable, but accepted transition/event ownership and downstream rollback are not bound in this component; no fake latched marker used
- Full group startup/restart and Network4 semantics not modeled
- Full upstream transition permission/completion coverage incomplete
- Distinct locked-feedback software binding requires agreed program contract
- Energy completion/timeout behavior requires explicit software expectations where not specified

Подробные наблюдения, исходные условия и допущения: SOFTWARE_CHECK_RESULTS.json.
