# Состав изменений — 2026-10-19

База: commit `4bb8703`. Включены текущие tracked и новые файлы проекта. Посторонние UpgradeLog3/4 исключены. Сам этот отчёт не включён в снимок. Число строк diff не равно числу строк нового управляющего кода.

| Категория | Файлов | Добавлено | Удалено |
|---|---:|---:|---:|
| Документация и правила | 56 | 5022 | 33 |
| Рабочая TwinSAFE логика и связи | 2 | 439 | 209 |
| JSON отчёты, инвентари, планы | 13 | 14535 | 1 |
| Бинарный архив checkpoint | 1 | 0 | 0 |
| Копия исходного SAL | 1 | 12605 | 0 |
| Модули стенда и скрипты | 28 | 1327 | 15 |
| Тесты JavaScript | 30 | 1581 | 9 |

Всего **131 файлов, +35509 / −267 строк**. ZIP в строки не входит.

Первоначальные примерно 33 тысячи строк разобраны в LOCAL_CHANGES_REPORT.md: +33124 с посторонними UpgradeLog, +32581 без них. Это исторический снимок; его утверждение об отсутствии правок рабочего SAL больше не описывает текущее состояние.

Основной объём: копия исходного SAL — 12605 строк; EMERGENCY_PHASE_MATRIX.json — 9078 строк наблюдений. Это не новая PLC-логика. Прочие JSON содержат инвентари, планы и результаты.

Рабочий SAL: удержание Unlock при синей без зелёной; запрет нового включения LV при текущем нарушении разрешений; исправление сериализации программных связей. SGVL: индекс использования программной переменной. Сдвиги execution order тоже учитываются текстовым diff. Аппаратные каналы и конфигурация не менялись.

JavaScript: стенд исполнения SAL, проверка структуры связей, генераторы отчётов и прототипы. Тесты разделяют историческое поведение и текущую логику. Прототип не равен внедрённому PLC-коду. Документация: требования, сценарии, планы, ревью, handoff и checkpoints.

Последний пакет: 73/73 проверки стенда, 75/75 исторических, 29/29 текущего кода; сценарная приёмка 154 PASS / 47 FAIL / 5 NOT VERIFIED. B1/R2 прошли независимое ревью. Проект в целом ещё не принят.

## Полный список файлов

Пути относительно корня репозитория; new означает неотслеживаемый файл на момент снимка.

| Файл | + | − | Статус |
|---|---:|---:|---|
| AGENTS.md | 130 | 0 | tracked |
| CODEX_HANDOFF.md | 336 | 0 | tracked |
| LOCAL_CHANGES_REPORT.md | 173 | 0 | tracked |
| MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl | 3 | 0 | tracked |
| MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal | 436 | 209 | tracked |
| SAFETY_STATE_MACHINE_SPEC.md | 177 | 29 | tracked |
| SAFETY_TEST_PLAN.md | 6 | 0 | tracked |
| SafetyTests/ACCEPTANCE_BACKLOG.md | 59 | 0 | tracked |
| SafetyTests/B1_IMPLEMENTATION.md | 99 | 0 | new |
| SafetyTests/BUTTON_COVER_DESIGN.md | 154 | 0 | tracked |
| SafetyTests/BUTTON_COVER_PROTOTYPE_GRAPH.json | 218 | 0 | tracked |
| SafetyTests/BUTTON_COVER_PROTOTYPE.md | 59 | 0 | tracked |
| SafetyTests/CANDIDATE_ACCEPTANCE_REPORT.md | 75 | 0 | tracked |
| SafetyTests/CANDIDATE_ACCEPTANCE.json | 1 | 0 | tracked |
| SafetyTests/checkpoints/workflow-2026-10-18/baseline-results.json | 1 | 0 | tracked |
| SafetyTests/checkpoints/workflow-2026-10-18/baseline-results.md | 95 | 0 | tracked |
| SafetyTests/checkpoints/workflow-2026-10-18/baseline-sources.zip | 0 | 0 | binary |
| SafetyTests/checkpoints/workflow-2026-10-18/manifest.json | 238 | 0 | tracked |
| SafetyTests/checkpoints/workflow-2026-10-18/README.md | 19 | 0 | tracked |
| SafetyTests/CONSISTENCY_REVIEW.md | 81 | 0 | tracked |
| SafetyTests/EMERGENCY_CHAIN_REPORT.md | 78 | 0 | tracked |
| SafetyTests/EMERGENCY_PHASE_MATRIX.json | 9078 | 0 | tracked |
| SafetyTests/EMERGENCY_PHASE_REPORT.md | 56 | 0 | tracked |
| SafetyTests/EMERGENCY_REQUIREMENTS.md | 48 | 0 | tracked |
| SafetyTests/ESTOP_SEMANTICS_REPORT.md | 58 | 0 | tracked |
| SafetyTests/fixtures/v2-4bb8703/README.md | 14 | 0 | tracked |
| SafetyTests/fixtures/v2-4bb8703/TwinSafeGroup1.sal | 12605 | 0 | tracked |
| SafetyTests/INTEGRATED_CONTROL_REPORT.md | 47 | 0 | tracked |
| SafetyTests/INTEGRATED_CONTROL_TRACE.json | 154 | 0 | tracked |
| SafetyTests/ITERATION_01_IMPLEMENTATION.md | 75 | 0 | tracked |
| SafetyTests/ITERATION_01_PLAN.md | 99 | 0 | tracked |
| SafetyTests/ITERATION_01_REVIEW.md | 81 | 0 | tracked |
| SafetyTests/ITERATION_02_IMPLEMENTATION.md | 73 | 0 | tracked |
| SafetyTests/ITERATION_02_PLAN.md | 82 | 0 | tracked |
| SafetyTests/ITERATION_02_REVIEW.md | 70 | 0 | tracked |
| SafetyTests/ITERATION_03_PLAN.md | 140 | 0 | new |
| SafetyTests/ITERATION_03A_IMPLEMENTATION.md | 62 | 0 | new |
| SafetyTests/ITERATION_03A_REVIEW.md | 67 | 0 | new |
| SafetyTests/ITERATION_04_PLAN.md | 71 | 0 | new |
| SafetyTests/ITERATION_BINDING_REPAIR_PLAN.md | 171 | 0 | new |
| SafetyTests/LOCK_FEEDBACK_SOFTWARE_TRACE.md | 58 | 0 | new |
| SafetyTests/NATIVE_BINDING_REVIEW.md | 144 | 0 | new |
| SafetyTests/NATIVE_BLOCK_MAPPING.md | 109 | 0 | tracked |
| SafetyTests/NATIVE_OWNER_MAPPING.md | 74 | 0 | tracked |
| SafetyTests/NATIVE_OWNER_PLAN.json | 1363 | 0 | tracked |
| SafetyTests/NATIVE_RECOGNIZER_PLAN.json | 786 | 0 | tracked |
| SafetyTests/NATIVE_TIMERS_STARTUP_BINDINGS.md | 152 | 0 | tracked |
| SafetyTests/package.json | 10 | 1 | tracked |
| SafetyTests/Q500_ORACLE_IMPLEMENTATION.md | 42 | 0 | tracked |
| SafetyTests/README.md | 99 | 0 | tracked |
| SafetyTests/REFERENCE_BEHAVIOR.md | 42 | 0 | tracked |
| SafetyTests/REFERENCE_PHASE_MAPPING.md | 57 | 0 | new |
| SafetyTests/SAFETY_EVIDENCE_MATRIX.md | 133 | 0 | tracked |
| SafetyTests/SAL_ADAPTER_SEMANTICS.md | 61 | 0 | tracked |
| SafetyTests/SAL_INPUT_INVENTORY.json | 1171 | 0 | tracked |
| SafetyTests/SCENARIO_DECISIONS.md | 302 | 0 | tracked |
| SafetyTests/scenarios/FULL_NORMAL_CYCLE.md | 30 | 3 | tracked |
| SafetyTests/scripts/candidate-acceptance.js | 17 | 0 | tracked |
| SafetyTests/scripts/emergency-phase-report.js | 11 | 0 | tracked |
| SafetyTests/scripts/integrated-control-report.js | 27 | 0 | tracked |
| SafetyTests/scripts/mutation-check.js | 6 | 3 | tracked |
| SafetyTests/scripts/native-owner-report.js | 7 | 0 | tracked |
| SafetyTests/scripts/native-recognizer-report.js | 6 | 0 | tracked |
| SafetyTests/scripts/sal-assumptions-report.js | 13 | 0 | tracked |
| SafetyTests/scripts/signal-bindings-report.js | 12 | 0 | tracked |
| SafetyTests/scripts/software-check.js | 74 | 0 | tracked |
| SafetyTests/scripts/timer-producer-report.js | 7 | 0 | tracked |
| SafetyTests/SIGNAL_BINDINGS.json | 1485 | 0 | tracked |
| SafetyTests/SOFTWARE_ACCEPTANCE_SCOPE.md | 90 | 0 | tracked |
| SafetyTests/SOFTWARE_CHECK_RESULTS.json | 1 | 0 | tracked |
| SafetyTests/SOFTWARE_CHECK_RESULTS.md | 83 | 0 | tracked |
| SafetyTests/src/baseline-fixture.js | 11 | 0 | tracked |
| SafetyTests/src/button-cover-prototype.js | 64 | 0 | tracked |
| SafetyTests/src/candidate-button-cover.js | 152 | 0 | tracked |
| SafetyTests/src/current-code-checks.js | 124 | 0 | tracked |
| SafetyTests/src/current-gesture-boundaries.js | 91 | 0 | new |
| SafetyTests/src/emergency-phase-matrix.js | 63 | 0 | tracked |
| SafetyTests/src/integrated-control-prototype.js | 53 | 0 | tracked |
| SafetyTests/src/native-owner-plan.js | 86 | 0 | tracked |
| SafetyTests/src/native-recognizer-plan.js | 40 | 0 | tracked |
| SafetyTests/src/reference-behavior.js | 51 | 0 | tracked |
| SafetyTests/src/sal-assumptions.js | 63 | 0 | tracked |
| SafetyTests/src/sal-binding-validator.js | 117 | 0 | new |
| SafetyTests/src/sal-parser.js | 28 | 3 | tracked |
| SafetyTests/src/sal-runtime.js | 37 | 9 | tracked |
| SafetyTests/src/scan-observer.js | 10 | 0 | new |
| SafetyTests/src/signal-bindings.js | 35 | 0 | tracked |
| SafetyTests/src/timer-producer-experiment.js | 65 | 0 | tracked |
| SafetyTests/src/transition-request-prototype.js | 57 | 0 | tracked |
| SafetyTests/test/baseline-fixture.test.js | 12 | 0 | tracked |
| SafetyTests/test/button-cover-prototype.test.js | 62 | 0 | tracked |
| SafetyTests/test/candidate-acceptance-runner.test.js | 59 | 0 | tracked |
| SafetyTests/test/current-code-checks.test.js | 26 | 0 | tracked |
| SafetyTests/test/current-native-bindings.test.js | 119 | 0 | new |
| SafetyTests/test/current-step12-lv-permit.test.js | 58 | 0 | tracked |
| SafetyTests/test/current-timer-one-ms.test.js | 24 | 0 | new |
| SafetyTests/test/current-unlock-hold.test.js | 109 | 0 | tracked |
| SafetyTests/test/integrated-control-prototype.test.js | 63 | 0 | tracked |
| SafetyTests/test/native-owner-plan.test.js | 81 | 0 | tracked |
| SafetyTests/test/native-recognizer-plan.test.js | 34 | 0 | tracked |
| SafetyTests/test/sal-assumptions.test.js | 32 | 0 | tracked |
| SafetyTests/test/sal-button-baseline.test.js | 6 | 1 | tracked |
| SafetyTests/test/sal-cover-baseline.test.js | 3 | 1 | tracked |
| SafetyTests/test/sal-emergency-baseline.test.js | 9 | 4 | tracked |
| SafetyTests/test/sal-emergency-chain.test.js | 143 | 0 | tracked |
| SafetyTests/test/sal-emergency-phases.test.js | 36 | 0 | tracked |
| SafetyTests/test/sal-energy-baseline.test.js | 3 | 1 | tracked |
| SafetyTests/test/sal-estop-runtime.test.js | 70 | 0 | tracked |
| SafetyTests/test/sal-rnd-safe-outputs.test.js | 101 | 0 | tracked |
| SafetyTests/test/sal-rundown-baseline.test.js | 70 | 0 | tracked |
| SafetyTests/test/sal-rundown-outputs.test.js | 107 | 0 | tracked |
| SafetyTests/test/sal-runtime.test.js | 11 | 2 | tracked |
| SafetyTests/test/sal-safe-exit-baseline.test.js | 78 | 0 | tracked |
| SafetyTests/test/sal-semantics.test.js | 50 | 0 | tracked |
| SafetyTests/test/sal-state-baseline.test.js | 61 | 0 | tracked |
| SafetyTests/test/scan-observer.test.js | 21 | 0 | new |
| SafetyTests/test/signal-bindings.test.js | 25 | 0 | tracked |
| SafetyTests/test/timer-producer-experiment.test.js | 30 | 0 | tracked |
| SafetyTests/test/transition-request-prototype.test.js | 78 | 0 | tracked |
| SafetyTests/TIMER_CONTINUITY_EXPERIMENT.json | 29 | 0 | tracked |
| SafetyTests/TIMER_CONTINUITY_REPORT.md | 55 | 0 | tracked |
| SafetyTests/TRANSITION_REQUEST_PROTOTYPE.md | 71 | 0 | tracked |
| SafetyTests/V2_BASELINE_REPORT.md | 40 | 1 | tracked |
| SafetyTests/V2_CHANGE_PLAN.md | 8 | 0 | tracked |
| SafetyTests/V2_IMPLEMENTATION_GROUPS.md | 52 | 0 | tracked |
| SafetyTests/V2_RND_TO_SAFE_REPORT.md | 67 | 0 | tracked |
| SafetyTests/V2_RUN_TO_RND_REPORT.md | 114 | 0 | tracked |
| SafetyTests/V2_SAFE_EXIT_REPORT.md | 68 | 0 | tracked |
| SafetyTests/V2_STATE_MAPPING.md | 85 | 0 | tracked |
| WORK_STATUS_AND_PLAN.md | 115 | 0 | tracked |
| WORKFLOW.md | 116 | 0 | tracked |
