# Состав изменений: текущий снимок

Дата UTC: 2026-10-19T14:52:33.166Z. Сравнение с переносным checkpoint 4bb8703. HEAD: c69bc32.

Всего 218 файлов: +41687/−389 текстовых строк. Включены коммиты после checkpoint, рабочий diff и относящиеся untracked-файлы. Этот отчёт и посторонние UpgradeLog3/4.htm исключены из подсчёта. Бинарные файлы учитываются отдельно; строки JSON зависят от форматирования.

Это учёт объёма, не приёмка. Реализация03B находится на HOLD по R3 native EStop pair semantics. Текущие результаты стенда не доказывают корректность ещё не исправленной pair-модели. Только v2 изменяется; reference не редактируется.

## По типу содержимого

| Состав | Файлов | Добавлено | Удалено | Бинарных |
|---|---:|---:|---:|---:|
| Документация | 111 | 9140 | 38 | 0 |
| Программа SAL/SGVL | 2 | 912 | 322 | 0 |
| JSON: результаты и планы | 21 | 14547 | 1 | 0 |
| Архив checkpoint | 5 | 353 | 0 | 1 |
| Неизменяемый исходный снимок | 2 | 12619 | 0 | 0 |
| Код программного стенда и скрипты | 36 | 1823 | 18 | 0 |
| Тесты и их helpers | 41 | 2293 | 10 | 0 |

SAL — XML-представление блоков, портов и связей; число строк не равно числу исполняемых команд. Рабочая программа содержит253 функциональных блока против209 в последнем принятом checkpoint c69bc32. Новые44 блока относятся к распознаванию физических R&D жестов; три прежних TON перенесены с сохранением идентичностей и значений. В пакете03B в SGVL добавлено десять программных переменных. Параметры прежних таймеров и hardware mappings не менялись этим пакетом.

## Полный список

| Файл | + | − | Состав | Состояние |
|---|---:|---:|---|---|
| [AGENTS.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/AGENTS.md>) | 132 | 0 | Документация | tracked |
| [CHANGES_REPORT_2026-10-19.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/CHANGES_REPORT_2026-10-19.md>) | 163 | 0 | Документация | tracked |
| [CODEX_HANDOFF.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/CODEX_HANDOFF.md>) | 336 | 0 | Документация | tracked |
| [LOCAL_CHANGES_REPORT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/LOCAL_CHANGES_REPORT.md>) | 173 | 0 | Документация | tracked |
| [MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl](<C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl>) | 29 | 1 | Программа SAL/SGVL | tracked |
| [MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal](<C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal>) | 883 | 321 | Программа SAL/SGVL | tracked |
| [SAFETY_STATE_MACHINE_SPEC.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SAFETY_STATE_MACHINE_SPEC.md>) | 200 | 34 | Документация | tracked |
| [SAFETY_TEST_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SAFETY_TEST_PLAN.md>) | 6 | 0 | Документация | tracked |
| [SafetyTests/03B_COMPACT_NETLIST_PLAN.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_COMPACT_NETLIST_PLAN.json>) | 1 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/03B_COMPACT_NETLIST_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_COMPACT_NETLIST_PLAN.md>) | 148 | 0 | Документация | tracked |
| [SafetyTests/03B_COMPACT_OPTIMIZATION_PROOF.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_COMPACT_OPTIMIZATION_PROOF.md>) | 37 | 0 | Документация | tracked |
| [SafetyTests/03B_COMPACT_OPTIMIZED_PLAN.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_COMPACT_OPTIMIZED_PLAN.json>) | 1 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/03B_COMPACT_PLAN_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_COMPACT_PLAN_REVIEW.md>) | 75 | 0 | Документация | tracked |
| [SafetyTests/03B_COMPACT_RELEASE_FIX_PLAN.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_COMPACT_RELEASE_FIX_PLAN.json>) | 1 | 0 | JSON: результаты и планы | untracked |
| [SafetyTests/03B_GESTURE_PERMISSION_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_GESTURE_PERMISSION_REVIEW.md>) | 25 | 0 | Документация | tracked |
| [SafetyTests/03B_GESTURE_REQUIREMENT_DECISION.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_GESTURE_REQUIREMENT_DECISION.md>) | 85 | 0 | Документация | tracked |
| [SafetyTests/03B_INTEGRATED_ACCEPTANCE.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_INTEGRATED_ACCEPTANCE.json>) | 1 | 0 | JSON: результаты и планы | untracked |
| [SafetyTests/03B_INTEGRATION_ACCEPTANCE_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_INTEGRATION_ACCEPTANCE_PLAN.md>) | 119 | 0 | Документация | tracked |
| [SafetyTests/03B_NATIVE_PAIR_FIX_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_NATIVE_PAIR_FIX_PLAN.md>) | 75 | 0 | Документация | untracked |
| [SafetyTests/03B_NATIVE_PAIR_PLAN_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_NATIVE_PAIR_PLAN_REVIEW.md>) | 53 | 0 | Документация | untracked |
| [SafetyTests/03B_NETLIST_PLAN.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_NETLIST_PLAN.json>) | 1 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/03B_NETLIST_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_NETLIST_PLAN.md>) | 70 | 0 | Документация | tracked |
| [SafetyTests/03B_OPTIMIZATION_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_OPTIMIZATION_REVIEW.md>) | 71 | 0 | Документация | tracked |
| [SafetyTests/03B_PLAN_PERMISSION_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_PLAN_PERMISSION_REVIEW.md>) | 95 | 0 | Документация | tracked |
| [SafetyTests/03B_RED_BASELINE.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_RED_BASELINE.json>) | 1 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/03B_RELEASE_FIX_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_RELEASE_FIX_REVIEW.md>) | 54 | 0 | Документация | untracked |
| [SafetyTests/03B_RELEASE_PREPARATION_FIX.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03B_RELEASE_PREPARATION_FIX.md>) | 39 | 0 | Документация | untracked |
| [SafetyTests/03C_CLOCK_RED_BASELINE.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/03C_CLOCK_RED_BASELINE.json>) | 112 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/05_MENTEE_RED_BASELINE.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/05_MENTEE_RED_BASELINE.json>) | 37 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/06_DOOR_RED_BASELINE.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/06_DOOR_RED_BASELINE.json>) | 49 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/07_UNLOCK_RED_BASELINE.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/07_UNLOCK_RED_BASELINE.json>) | 47 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/ACCEPTANCE_BACKLOG.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ACCEPTANCE_BACKLOG.md>) | 59 | 0 | Документация | tracked |
| [SafetyTests/B1_IMPLEMENTATION.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/B1_IMPLEMENTATION.md>) | 99 | 0 | Документация | tracked |
| [SafetyTests/BUTTON_COVER_DESIGN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/BUTTON_COVER_DESIGN.md>) | 154 | 0 | Документация | tracked |
| [SafetyTests/BUTTON_COVER_PROTOTYPE_GRAPH.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/BUTTON_COVER_PROTOTYPE_GRAPH.json>) | 218 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/BUTTON_COVER_PROTOTYPE.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/BUTTON_COVER_PROTOTYPE.md>) | 59 | 0 | Документация | tracked |
| [SafetyTests/CANDIDATE_ACCEPTANCE_REPORT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/CANDIDATE_ACCEPTANCE_REPORT.md>) | 75 | 0 | Документация | tracked |
| [SafetyTests/CANDIDATE_ACCEPTANCE.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/CANDIDATE_ACCEPTANCE.json>) | 1 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/checkpoints/workflow-2026-10-18/baseline-results.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/checkpoints/workflow-2026-10-18/baseline-results.json>) | 1 | 0 | Архив checkpoint | tracked |
| [SafetyTests/checkpoints/workflow-2026-10-18/baseline-results.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/checkpoints/workflow-2026-10-18/baseline-results.md>) | 95 | 0 | Архив checkpoint | tracked |
| [SafetyTests/checkpoints/workflow-2026-10-18/baseline-sources.zip](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/checkpoints/workflow-2026-10-18/baseline-sources.zip>) | binary | binary | Архив checkpoint | tracked |
| [SafetyTests/checkpoints/workflow-2026-10-18/manifest.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/checkpoints/workflow-2026-10-18/manifest.json>) | 238 | 0 | Архив checkpoint | tracked |
| [SafetyTests/checkpoints/workflow-2026-10-18/README.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/checkpoints/workflow-2026-10-18/README.md>) | 19 | 0 | Архив checkpoint | tracked |
| [SafetyTests/CONSISTENCY_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/CONSISTENCY_REVIEW.md>) | 81 | 0 | Документация | tracked |
| [SafetyTests/DEAD_LOGIC_AUDIT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/DEAD_LOGIC_AUDIT.md>) | 28 | 0 | Документация | tracked |
| [SafetyTests/DISCHARGE_PROGRAM_CONTRACT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/DISCHARGE_PROGRAM_CONTRACT.md>) | 155 | 0 | Документация | tracked |
| [SafetyTests/DOOR_INTERLOCK_REQUIREMENT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/DOOR_INTERLOCK_REQUIREMENT.md>) | 76 | 0 | Документация | tracked |
| [SafetyTests/EARLY_STO_ORDER_REVIEW_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/EARLY_STO_ORDER_REVIEW_PLAN.md>) | 36 | 0 | Документация | untracked |
| [SafetyTests/EARLY_STO_PROGRAM_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/EARLY_STO_PROGRAM_PLAN.md>) | 86 | 0 | Документация | tracked |
| [SafetyTests/EMERGENCY_CHAIN_REPORT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/EMERGENCY_CHAIN_REPORT.md>) | 78 | 0 | Документация | tracked |
| [SafetyTests/EMERGENCY_PHASE_MATRIX.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/EMERGENCY_PHASE_MATRIX.json>) | 9078 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/EMERGENCY_PHASE_REPORT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/EMERGENCY_PHASE_REPORT.md>) | 56 | 0 | Документация | tracked |
| [SafetyTests/EMERGENCY_REQUIREMENTS.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/EMERGENCY_REQUIREMENTS.md>) | 48 | 0 | Документация | tracked |
| [SafetyTests/ESTOP_SEMANTICS_REPORT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ESTOP_SEMANTICS_REPORT.md>) | 58 | 0 | Документация | tracked |
| [SafetyTests/fixtures/v2-4bb8703/README.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/fixtures/v2-4bb8703/README.md>) | 14 | 0 | Неизменяемый исходный снимок | tracked |
| [SafetyTests/fixtures/v2-4bb8703/TwinSafeGroup1.sal](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/fixtures/v2-4bb8703/TwinSafeGroup1.sal>) | 12605 | 0 | Неизменяемый исходный снимок | tracked |
| [SafetyTests/INTEGRATED_CONTROL_REPORT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/INTEGRATED_CONTROL_REPORT.md>) | 47 | 0 | Документация | tracked |
| [SafetyTests/INTEGRATED_CONTROL_TRACE.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/INTEGRATED_CONTROL_TRACE.json>) | 154 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/ITERATION_01_IMPLEMENTATION.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_01_IMPLEMENTATION.md>) | 75 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_01_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_01_PLAN.md>) | 99 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_01_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_01_REVIEW.md>) | 81 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_02_IMPLEMENTATION.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_02_IMPLEMENTATION.md>) | 73 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_02_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_02_PLAN.md>) | 82 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_02_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_02_REVIEW.md>) | 70 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_03_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03_PLAN.md>) | 140 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_03A_IMPLEMENTATION.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03A_IMPLEMENTATION.md>) | 62 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_03A_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03A_REVIEW.md>) | 67 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_03B_IMPLEMENTATION.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03B_IMPLEMENTATION.md>) | 70 | 0 | Документация | untracked |
| [SafetyTests/ITERATION_03B_PHYSICAL_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03B_PHYSICAL_PLAN.md>) | 213 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_03B_PLAN_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03B_PLAN_REVIEW.md>) | 94 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_03B_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03B_REVIEW.md>) | 106 | 0 | Документация | untracked |
| [SafetyTests/ITERATION_03B_TEST_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03B_TEST_REVIEW.md>) | 63 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_03B_TESTS_READY.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03B_TESTS_READY.md>) | 47 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_03C_IMPLEMENTATION.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03C_IMPLEMENTATION.md>) | 74 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_03C_PLAN_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03C_PLAN_REVIEW.md>) | 55 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_03C_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03C_REVIEW.md>) | 57 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_03C_TEST_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03C_TEST_REVIEW.md>) | 45 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_03C_TESTS_READY.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03C_TESTS_READY.md>) | 42 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_03C_TIMER_CLOCK_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_03C_TIMER_CLOCK_PLAN.md>) | 98 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_04_IMPLEMENTATION.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_04_IMPLEMENTATION.md>) | 59 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_04_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_04_PLAN.md>) | 71 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_04_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_04_REVIEW.md>) | 53 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_05_IMPLEMENTATION.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_05_IMPLEMENTATION.md>) | 55 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_05_PLAN_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_05_PLAN_REVIEW.md>) | 46 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_05_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_05_PLAN.md>) | 56 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_05_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_05_REVIEW.md>) | 52 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_05_TEST_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_05_TEST_REVIEW.md>) | 31 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_05_TESTS_READY.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_05_TESTS_READY.md>) | 36 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_06_IMPLEMENTATION.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_06_IMPLEMENTATION.md>) | 77 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_06_PLAN_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_06_PLAN_REVIEW.md>) | 47 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_06_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_06_PLAN.md>) | 64 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_06_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_06_REVIEW.md>) | 57 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_06_TEST_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_06_TEST_REVIEW.md>) | 34 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_06_TESTS_READY.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_06_TESTS_READY.md>) | 38 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_07_IMPLEMENTATION.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_07_IMPLEMENTATION.md>) | 73 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_07_PLAN_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_07_PLAN_REVIEW.md>) | 70 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_07_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_07_PLAN.md>) | 91 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_07_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_07_REVIEW.md>) | 61 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_07_TEST_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_07_TEST_REVIEW.md>) | 36 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_07_TESTS_READY.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_07_TESTS_READY.md>) | 38 | 0 | Документация | tracked |
| [SafetyTests/ITERATION_BINDING_REPAIR_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/ITERATION_BINDING_REPAIR_PLAN.md>) | 171 | 0 | Документация | tracked |
| [SafetyTests/LOCK_FEEDBACK_SOFTWARE_TRACE.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/LOCK_FEEDBACK_SOFTWARE_TRACE.md>) | 58 | 0 | Документация | tracked |
| [SafetyTests/MENTEE_PROGRAM_CONTRACT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/MENTEE_PROGRAM_CONTRACT.md>) | 102 | 0 | Документация | tracked |
| [SafetyTests/NATIVE_BINDING_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/NATIVE_BINDING_REVIEW.md>) | 144 | 0 | Документация | tracked |
| [SafetyTests/NATIVE_BLOCK_MAPPING.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/NATIVE_BLOCK_MAPPING.md>) | 109 | 0 | Документация | tracked |
| [SafetyTests/NATIVE_OWNER_MAPPING.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/NATIVE_OWNER_MAPPING.md>) | 74 | 0 | Документация | tracked |
| [SafetyTests/NATIVE_OWNER_PLAN.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/NATIVE_OWNER_PLAN.json>) | 1363 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/NATIVE_RECOGNIZER_PLAN.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/NATIVE_RECOGNIZER_PLAN.json>) | 786 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/NATIVE_TIMERS_STARTUP_BINDINGS.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/NATIVE_TIMERS_STARTUP_BINDINGS.md>) | 152 | 0 | Документация | tracked |
| [SafetyTests/NETWORK4_SOFTWARE_SEMANTICS.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/NETWORK4_SOFTWARE_SEMANTICS.md>) | 52 | 0 | Документация | tracked |
| [SafetyTests/NEXT_REQUIREMENTS_WORKLIST.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/NEXT_REQUIREMENTS_WORKLIST.md>) | 126 | 0 | Документация | untracked |
| [SafetyTests/OPEN_SCENARIO_SOURCE_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/OPEN_SCENARIO_SOURCE_REVIEW.md>) | 118 | 0 | Документация | tracked |
| [SafetyTests/package.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/package.json>) | 10 | 1 | JSON: результаты и планы | tracked |
| [SafetyTests/PLC_PULSE_SET_GUARD_REVIEW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/PLC_PULSE_SET_GUARD_REVIEW.md>) | 27 | 0 | Документация | untracked |
| [SafetyTests/PLC_PULSE_SET_REQUIREMENTS.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/PLC_PULSE_SET_REQUIREMENTS.md>) | 91 | 0 | Документация | untracked |
| [SafetyTests/Q500_ORACLE_IMPLEMENTATION.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/Q500_ORACLE_IMPLEMENTATION.md>) | 42 | 0 | Документация | tracked |
| [SafetyTests/README.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/README.md>) | 101 | 0 | Документация | tracked |
| [SafetyTests/REFERENCE_BEHAVIOR.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/REFERENCE_BEHAVIOR.md>) | 42 | 0 | Документация | tracked |
| [SafetyTests/REFERENCE_PHASE_MAPPING.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/REFERENCE_PHASE_MAPPING.md>) | 57 | 0 | Документация | tracked |
| [SafetyTests/SAFETY_EVIDENCE_MATRIX.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/SAFETY_EVIDENCE_MATRIX.md>) | 159 | 0 | Документация | tracked |
| [SafetyTests/SAL_ADAPTER_SEMANTICS.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/SAL_ADAPTER_SEMANTICS.md>) | 61 | 0 | Документация | tracked |
| [SafetyTests/SAL_INPUT_INVENTORY.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/SAL_INPUT_INVENTORY.json>) | 1171 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/SCENARIO_DECISIONS.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/SCENARIO_DECISIONS.md>) | 319 | 0 | Документация | tracked |
| [SafetyTests/scenarios/FULL_NORMAL_CYCLE.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scenarios/FULL_NORMAL_CYCLE.md>) | 31 | 3 | Документация | tracked |
| [SafetyTests/scripts/candidate-acceptance.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/candidate-acceptance.js>) | 22 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/scripts/check-compact-plan.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/check-compact-plan.js>) | 136 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/scripts/derive-compact-release-fix.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/derive-compact-release-fix.js>) | 19 | 0 | Код программного стенда и скрипты | untracked |
| [SafetyTests/scripts/emergency-phase-report.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/emergency-phase-report.js>) | 11 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/scripts/implement-rnd-compact.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/implement-rnd-compact.js>) | 46 | 0 | Код программного стенда и скрипты | untracked |
| [SafetyTests/scripts/integrated-control-report.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/integrated-control-report.js>) | 27 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/scripts/mutation-check.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/mutation-check.js>) | 6 | 3 | Код программного стенда и скрипты | tracked |
| [SafetyTests/scripts/native-owner-report.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/native-owner-report.js>) | 7 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/scripts/native-recognizer-report.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/native-recognizer-report.js>) | 6 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/scripts/optimize-compact-plan.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/optimize-compact-plan.js>) | 67 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/scripts/probe-plc-pulse-set.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/probe-plc-pulse-set.js>) | 39 | 0 | Код программного стенда и скрипты | untracked |
| [SafetyTests/scripts/read-sdk-il.ps1](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/read-sdk-il.ps1>) | 15 | 0 | Код программного стенда и скрипты | untracked |
| [SafetyTests/scripts/sal-assumptions-report.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/sal-assumptions-report.js>) | 13 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/scripts/signal-bindings-report.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/signal-bindings-report.js>) | 12 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/scripts/software-check.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/software-check.js>) | 80 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/scripts/timer-producer-report.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/scripts/timer-producer-report.js>) | 7 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/SIGNAL_BINDINGS.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/SIGNAL_BINDINGS.json>) | 1485 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/SOFTWARE_ACCEPTANCE_SCOPE.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/SOFTWARE_ACCEPTANCE_SCOPE.md>) | 110 | 0 | Документация | tracked |
| [SafetyTests/SOFTWARE_CHECK_RESULTS.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/SOFTWARE_CHECK_RESULTS.json>) | 1 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/SOFTWARE_CHECK_RESULTS.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/SOFTWARE_CHECK_RESULTS.md>) | 39 | 0 | Документация | tracked |
| [SafetyTests/src/baseline-fixture.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/baseline-fixture.js>) | 11 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/button-cover-prototype.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/button-cover-prototype.js>) | 64 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/candidate-button-cover.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/candidate-button-cover.js>) | 164 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/current-code-checks.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/current-code-checks.js>) | 130 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/current-gesture-boundaries.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/current-gesture-boundaries.js>) | 117 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/emergency-phase-matrix.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/emergency-phase-matrix.js>) | 63 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/integrated-control-prototype.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/integrated-control-prototype.js>) | 53 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/native-owner-plan.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/native-owner-plan.js>) | 86 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/native-recognizer-plan.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/native-recognizer-plan.js>) | 40 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/observed-samples.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/observed-samples.js>) | 24 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/physical-rnd-source.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/physical-rnd-source.js>) | 87 | 0 | Код программного стенда и скрипты | untracked |
| [SafetyTests/src/reference-behavior.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/reference-behavior.js>) | 51 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/sal-assumptions.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-assumptions.js>) | 63 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/sal-binding-validator.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-binding-validator.js>) | 117 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/sal-parser.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js>) | 28 | 3 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/sal-runtime.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-runtime.js>) | 45 | 12 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/scan-observer.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/scan-observer.js>) | 10 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/signal-bindings.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/signal-bindings.js>) | 35 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/timer-producer-experiment.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/timer-producer-experiment.js>) | 65 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/src/transition-request-prototype.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/transition-request-prototype.js>) | 57 | 0 | Код программного стенда и скрипты | tracked |
| [SafetyTests/test/baseline-fixture.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/baseline-fixture.test.js>) | 12 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/button-cover-prototype.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/button-cover-prototype.test.js>) | 62 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/candidate-acceptance-runner.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/candidate-acceptance-runner.test.js>) | 59 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/current-code-checks.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/current-code-checks.test.js>) | 26 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/current-door-interlock.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/current-door-interlock.test.js>) | 78 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/current-estop-native-pairs.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/current-estop-native-pairs.test.js>) | 90 | 0 | Тесты и их helpers | untracked |
| [SafetyTests/test/current-hv-set-permit.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/current-hv-set-permit.test.js>) | 72 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/current-mentee-set-permit.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/current-mentee-set-permit.test.js>) | 68 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/current-native-bindings.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/current-native-bindings.test.js>) | 123 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/current-rnd-compact.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/current-rnd-compact.test.js>) | 56 | 0 | Тесты и их helpers | untracked |
| [SafetyTests/test/current-rnd-physical-integration.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/current-rnd-physical-integration.test.js>) | 164 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/current-step12-lv-permit.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/current-step12-lv-permit.test.js>) | 59 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/current-timer-one-ms.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/current-timer-one-ms.test.js>) | 24 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/current-unlock-estop-permit.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/current-unlock-estop-permit.test.js>) | 66 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/current-unlock-hold.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/current-unlock-hold.test.js>) | 118 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/helpers/compact-expectations.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/compact-expectations.js>) | 10 | 0 | Тесты и их helpers | untracked |
| [SafetyTests/test/helpers/observed-samples.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/observed-samples.js>) | 2 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/helpers/physical-rnd-source.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/physical-rnd-source.js>) | 2 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/integrated-control-prototype.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/integrated-control-prototype.test.js>) | 63 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/native-owner-plan.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/native-owner-plan.test.js>) | 81 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/native-recognizer-plan.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/native-recognizer-plan.test.js>) | 34 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-assumptions.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-assumptions.test.js>) | 32 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-button-baseline.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-button-baseline.test.js>) | 10 | 1 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-cover-baseline.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-cover-baseline.test.js>) | 3 | 1 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-emergency-baseline.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-emergency-baseline.test.js>) | 9 | 4 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-emergency-chain.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-emergency-chain.test.js>) | 143 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-emergency-phases.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-emergency-phases.test.js>) | 36 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-energy-baseline.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-energy-baseline.test.js>) | 3 | 1 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-estop-runtime.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-estop-runtime.test.js>) | 70 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-rnd-safe-outputs.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-rnd-safe-outputs.test.js>) | 101 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-rundown-baseline.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-rundown-baseline.test.js>) | 70 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-rundown-outputs.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-rundown-outputs.test.js>) | 107 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-runtime.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-runtime.test.js>) | 12 | 3 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-safe-exit-baseline.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-safe-exit-baseline.test.js>) | 78 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-semantics.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-semantics.test.js>) | 50 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/sal-state-baseline.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/sal-state-baseline.test.js>) | 61 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/scan-observer.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/scan-observer.test.js>) | 21 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/signal-bindings.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/signal-bindings.test.js>) | 25 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/timer-observed-clock.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/timer-observed-clock.test.js>) | 85 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/timer-producer-experiment.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/timer-producer-experiment.test.js>) | 30 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/test/transition-request-prototype.test.js](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/transition-request-prototype.test.js>) | 78 | 0 | Тесты и их helpers | tracked |
| [SafetyTests/TIMER_CONTINUITY_EXPERIMENT.json](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/TIMER_CONTINUITY_EXPERIMENT.json>) | 29 | 0 | JSON: результаты и планы | tracked |
| [SafetyTests/TIMER_CONTINUITY_REPORT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/TIMER_CONTINUITY_REPORT.md>) | 55 | 0 | Документация | tracked |
| [SafetyTests/TRANSITION_REQUEST_PROTOTYPE.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/TRANSITION_REQUEST_PROTOTYPE.md>) | 71 | 0 | Документация | tracked |
| [SafetyTests/UNLOCK_EMERGENCY_CONTRACT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/UNLOCK_EMERGENCY_CONTRACT.md>) | 95 | 0 | Документация | tracked |
| [SafetyTests/V2_BASELINE_REPORT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/V2_BASELINE_REPORT.md>) | 40 | 1 | Документация | tracked |
| [SafetyTests/V2_CHANGE_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/V2_CHANGE_PLAN.md>) | 8 | 0 | Документация | tracked |
| [SafetyTests/V2_IMPLEMENTATION_GROUPS.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/V2_IMPLEMENTATION_GROUPS.md>) | 52 | 0 | Документация | tracked |
| [SafetyTests/V2_RND_TO_SAFE_REPORT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/V2_RND_TO_SAFE_REPORT.md>) | 67 | 0 | Документация | tracked |
| [SafetyTests/V2_RUN_TO_RND_REPORT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/V2_RUN_TO_RND_REPORT.md>) | 114 | 0 | Документация | tracked |
| [SafetyTests/V2_SAFE_EXIT_REPORT.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/V2_SAFE_EXIT_REPORT.md>) | 68 | 0 | Документация | tracked |
| [SafetyTests/V2_STATE_MAPPING.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/V2_STATE_MAPPING.md>) | 85 | 0 | Документация | tracked |
| [WORK_STATUS_AND_PLAN.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/WORK_STATUS_AND_PLAN.md>) | 174 | 0 | Документация | tracked |
| [WORKFLOW.md](<C:/Users/user/source/repos/MEN001_Dyno_v2/WORKFLOW.md>) | 117 | 0 | Документация | tracked |

tracked означает файл, уже известный Git; изменения могут быть как в локальных коммитах, так и в рабочей папке. untracked ещё не включён в commit. Исторические отчёты сохранены; актуальная приёмка/план — WORK_STATUS_AND_PLAN.md.
