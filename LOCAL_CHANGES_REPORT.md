# Отчёт о локальных изменениях — 2026-10-18

Сравнение: рабочая папка MEN001_Dyno_v2 против HEAD `4bb8703`, ветка `Safety-Develop_2`. Включены изменённые отслеживаемые и новые неотслеживаемые файлы. Staged/committed изменений этот отчёт не создаёт.

Снимок сделан **до создания самого LOCAL_CHANGES_REPORT.md**; файл отчёта не включён в нижеследующие числа.

## Что означает объём около 33 тысяч строк

- Всего: **86 файлов, +33 124 / −21 строк**.
- Копия SAL и сформированные JSON: **28 431 строк (85.8%)**.
- JavaScript-модули и скрипты: **+804 / −12 строк**; тесты: **+1196 / −7 строк**. Это добавления/удаления по diff, не оценка сложности.
- Два UpgradeLog были обнаружены в рабочей папке и не создавались агентом: +543 строки. Без них: **84 файла, +32 581 / −21 строк**.

Крупнейший файл — baseline SAL (+12 605 строк). Это байтовая копия исходной safety-логики. Второй — EMERGENCY_PHASE_MATRIX.json (+9 078 строк), подробная наблюдательная матрица. Эти два файла дают 65.5% общего числа добавленных строк.

## Сводка по категориям

| Категория | Файлов | Добавлено | Удалено |
|---|---:|---:|---:|
| Копия baseline SAL | 1 | 12 605 | 0 |
| Сформированные JSON | 9 | 15 826 | 0 |
| JavaScript-модули | 13 | 698 | 9 |
| Скрипты запуска и отчётов | 9 | 106 | 3 |
| Тесты | 23 | 1 196 | 7 |
| Документация | 28 | 2 141 | 1 |
| Конфигурация | 1 | 9 | 1 |
| Существовавшие журналы обновления | 2 | 543 | 0 |

## Изменения существовавшего кода

Основные изменения движка — общий порядок блоков, частичное уточнение Restart/off-delay E-Stop, явные допущения входов и отказ при неподдерживаемом EDM. Парсер сохраняет групповые RunStop/ErrAck. Mutation runner больше не считает ошибки загрузки SAL обнаруженными дефектами модели. Четыре старых baseline-теста перепривязаны к фиксированной копии.

## Что не изменено и что не является исправленной safety-логикой

`git diff --name-only HEAD -- MEN001_Dyno` пуст: рабочие TwinCAT/TwinSAFE файлы и mappings не менялись. Рабочий SAL и fixture имеют один SHA256: `B1FA361F5647EBA2A5BB8436E4853D8773BA7F6B0ACBF1E7F96C519196251DAA`. Во втором репозитории агент изменений не делал. Прототипы и блоковые планы исполняются в хостовом стенде, не в PLC. Новый коммит/push не выполнен.

153/153 регрессионных теста и 5/5 мутаций не означают приёмку SAL: отдельный текущий отчёт содержит 14 FAIL / 2 PASS / 3 NOT VERIFIED.

## Полный список файлов

В таблицах статус «Новый» означает untracked относительно HEAD, а не факт изменения рабочего PLC-кода.

### Копия baseline SAL

| Файл | Статус | + / − | Назначение |
|---|---|---:|---|
| `SafetyTests/fixtures/v2-4bb8703/TwinSafeGroup1.sal` | Новый | 12605 / 0 | Точная копия исходного SAL, а не новая логика. Нужна историческим тестам дефектов. |

### Сформированные JSON

| Файл | Статус | + / − | Назначение |
|---|---|---:|---|
| `SafetyTests/BUTTON_COVER_PROTOTYPE_GRAPH.json` | Новый | 218 / 0 | Концептуальные выражения следующего состояния распознавателя. |
| `SafetyTests/CANDIDATE_ACCEPTANCE.json` | Новый | 1542 / 0 | Приёмочные результаты текущего SAL, наблюдения и первые нарушения. |
| `SafetyTests/EMERGENCY_PHASE_MATRIX.json` | Новый | 9078 / 0 | Подробные снимки 144 наблюдательных случаев; главный источник строк среди JSON. |
| `SafetyTests/INTEGRATED_CONTROL_TRACE.json` | Новый | 154 / 0 | Изменения состояний на примерной хостовой временной шкале. |
| `SafetyTests/NATIVE_OWNER_PLAN.json` | Новый | 1363 / 0 | Сформированный план 65 блоковых позиций; не импортируемый/проверенный SAL. |
| `SafetyTests/NATIVE_RECOGNIZER_PLAN.json` | Новый | 786 / 0 | Сформированный план ядра распознавателя с незакрытыми границами. |
| `SafetyTests/SAL_INPUT_INVENTORY.json` | Новый | 1171 / 0 | Полный структурный перечень входов/связей и допущений. |
| `SafetyTests/SIGNAL_BINDINGS.json` | Новый | 1485 / 0 | 64 переменные SAL с SDS-источниками, читателями/писателями и неизвестными полярностями. |
| `SafetyTests/TIMER_CONTINUITY_EXPERIMENT.json` | Новый | 29 / 0 | Сравнение корректного и ошибочных порядков/входов TON. |

### JavaScript-модули

| Файл | Статус | + / − | Назначение |
|---|---|---:|---|
| `SafetyTests/src/baseline-fixture.js` | Новый | 11 / 0 | Путь закреплённого baseline и проверка его SHA256. |
| `SafetyTests/src/button-cover-prototype.js` | Новый | 64 / 0 | Изолированный концептуальный распознаватель и разрешение крышки. |
| `SafetyTests/src/candidate-button-cover.js` | Новый | 128 / 0 | Приёмочные сценарии кнопок/крышки с PASS/FAIL/NOT VERIFIED для текущего SAL. |
| `SafetyTests/src/emergency-phase-matrix.js` | Новый | 63 / 0 | Наблюдательная матрица 8 состояний × 9 событий/контролей × 2 допущения. |
| `SafetyTests/src/integrated-control-prototype.js` | Новый | 53 / 0 | Совместный хостовый контракт кнопок, владельца перехода и разрешения крышки. |
| `SafetyTests/src/native-owner-plan.js` | Новый | 86 / 0 | План памяти переходов в блоковой форме и его строгий хостовый evaluator. |
| `SafetyTests/src/native-recognizer-plan.js` | Новый | 40 / 0 | Перевод логических выражений распознавателя в план AND/OR/RS. |
| `SafetyTests/src/sal-assumptions.js` | Новый | 63 / 0 | Инвентаризация неподключённых входов и отсутствующих производителей сигналов. |
| `SafetyTests/src/sal-parser.js` | Изменён | 2 / 1 | Сохранение связей переменных с групповыми портами RunStop/ErrAck. |
| `SafetyTests/src/sal-runtime.js` | Изменён | 31 / 8 | Общий порядок исполнения; явные допущения; исправление Restart/off-delay E-Stop; отказ при неподдерживаемом EDM. |
| `SafetyTests/src/signal-bindings.js` | Новый | 35 / 0 | Связи SAL с SDS, типами alias и групповыми портами. |
| `SafetyTests/src/timer-producer-experiment.js` | Новый | 65 / 0 | Синтетический эксперимент непрерывности TON и порядка блоков. |
| `SafetyTests/src/transition-request-prototype.js` | Новый | 57 / 0 | Изолированная память запроса перехода и аварийного приоритета. |

### Скрипты запуска и отчётов

| Файл | Статус | + / − | Назначение |
|---|---|---:|---|
| `SafetyTests/scripts/candidate-acceptance.js` | Новый | 17 / 0 | Приёмочный отчёт текущего SAL; ненулевой exit при FAIL/неполноте. |
| `SafetyTests/scripts/emergency-phase-report.js` | Новый | 11 / 0 | Перегенерация наблюдательной матрицы состояний/аварий. |
| `SafetyTests/scripts/integrated-control-report.js` | Новый | 27 / 0 | Пример общей временной шкалы изолированного прототипа. |
| `SafetyTests/scripts/mutation-check.js` | Изменён | 6 / 3 | Мутации запускают тесты модели; ошибки инфраструктуры не считаются найденными дефектами; нормализация CRLF. |
| `SafetyTests/scripts/native-owner-report.js` | Новый | 7 / 0 | Перегенерация блокового плана владельца переходов. |
| `SafetyTests/scripts/native-recognizer-report.js` | Новый | 6 / 0 | Перегенерация блокового плана распознавателя. |
| `SafetyTests/scripts/sal-assumptions-report.js` | Новый | 13 / 0 | Отчёт допущений и неподключённых входов текущего SAL. |
| `SafetyTests/scripts/signal-bindings-report.js` | Новый | 12 / 0 | Отчёт по источникам SAL/SDS текущего проекта. |
| `SafetyTests/scripts/timer-producer-report.js` | Новый | 7 / 0 | Отчёт эксперимента непрерывности таймеров. |

### Тесты

| Файл | Статус | + / − | Назначение |
|---|---|---:|---|
| `SafetyTests/test/baseline-fixture.test.js` | Новый | 12 / 0 | Целостность fixture и обнаружение изменённых байтов. |
| `SafetyTests/test/button-cover-prototype.test.js` | Новый | 62 / 0 | Контракт концептуального распознавателя/крышки. |
| `SafetyTests/test/candidate-acceptance-runner.test.js` | Новый | 48 / 0 | Корректность классификации приёмочного отчётчика и его чувствительность. |
| `SafetyTests/test/integrated-control-prototype.test.js` | Новый | 63 / 0 | Совместный контракт кнопки → переход → запрет доступа. |
| `SafetyTests/test/native-owner-plan.test.js` | Новый | 81 / 0 | Сравнение блокового плана с прототипом и аварийные приоритеты. |
| `SafetyTests/test/native-recognizer-plan.test.js` | Новый | 34 / 0 | Логический перевод 14 336 комбинаций и проверка порядка/входов. |
| `SafetyTests/test/sal-assumptions.test.js` | Новый | 32 / 0 | Выявление известных разрывов и искусственно удалённых производителей. |
| `SafetyTests/test/sal-button-baseline.test.js` | Изменён | 3 / 1 | Явная перепривязка исторических проверок кнопок к fixture. |
| `SafetyTests/test/sal-cover-baseline.test.js` | Изменён | 3 / 1 | Явная перепривязка исторических проверок крышки к fixture. |
| `SafetyTests/test/sal-emergency-baseline.test.js` | Изменён | 9 / 4 | Переносимый путь исходника, явный пропуск при его отсутствии, привязка v2 к fixture. |
| `SafetyTests/test/sal-emergency-chain.test.js` | Новый | 143 / 0 | Исторические аварийные цепи и Healthy на закреплённом SAL. |
| `SafetyTests/test/sal-emergency-phases.test.js` | Новый | 36 / 0 | Исторические различия реакции по состояниям SAL. |
| `SafetyTests/test/sal-energy-baseline.test.js` | Изменён | 3 / 1 | Явная перепривязка исторических энергетических проверок к fixture. |
| `SafetyTests/test/sal-estop-runtime.test.js` | Новый | 70 / 0 | Restart/off-delay в ограниченной модели E-Stop. |
| `SafetyTests/test/sal-rnd-safe-outputs.test.js` | Новый | 101 / 0 | Историческая цепь R&D → Safe и влияние порядка исполнения. |
| `SafetyTests/test/sal-rundown-baseline.test.js` | Новый | 70 / 0 | Исторические запросы Run → R&D в Network6. |
| `SafetyTests/test/sal-rundown-outputs.test.js` | Новый | 107 / 0 | Историческое прохождение запросов до выходных битов. |
| `SafetyTests/test/sal-safe-exit-baseline.test.js` | Новый | 78 / 0 | Исторические условия выхода Step2/Step6. |
| `SafetyTests/test/sal-semantics.test.js` | Новый | 47 / 0 | Порядок исполнения, RS и чувствительность к допущениям. |
| `SafetyTests/test/sal-state-baseline.test.js` | Новый | 61 / 0 | Историческая передача владения состояниями Network3. |
| `SafetyTests/test/signal-bindings.test.js` | Новый | 25 / 0 | Отличие standard/FSoE alias и сохранение групповых портов. |
| `SafetyTests/test/timer-producer-experiment.test.js` | Новый | 30 / 0 | Непрерывность TON, сброс и ошибки порядка. |
| `SafetyTests/test/transition-request-prototype.test.js` | Новый | 78 / 0 | Удержание короткого запроса, завершение и ручное восстановление. |

### Документация

| Файл | Статус | + / − | Назначение |
|---|---|---:|---|
| `CODEX_HANDOFF.md` | Изменён | 317 / 0 | Журнал продолжения работ и переносимый контекст; вырос за счёт последовательных checkpoint-записей. |
| `SAFETY_STATE_MACHINE_SPEC.md` | Изменён | 67 / 0 | Добавлены 41 ID групп требований; аппаратные параметры не утверждались. |
| `SafetyTests/ACCEPTANCE_BACKLOG.md` | Новый | 55 / 0 | Candidate acceptance backlog — 2026-10-18 |
| `SafetyTests/BUTTON_COVER_DESIGN.md` | Новый | 154 / 0 | Button and cover correction design — proposal, 2026-10-18 |
| `SafetyTests/BUTTON_COVER_PROTOTYPE.md` | Новый | 59 / 0 | Isolated button/cover prototype — 2026-10-18 |
| `SafetyTests/CANDIDATE_ACCEPTANCE_REPORT.md` | Новый | 71 / 0 | Candidate button/cover acceptance — 2026-10-18 |
| `SafetyTests/EMERGENCY_CHAIN_REPORT.md` | Новый | 78 / 0 | Emergency chain execution — 2026-10-18 |
| `SafetyTests/EMERGENCY_PHASE_REPORT.md` | Новый | 56 / 0 | Emergency phase matrix — 2026-10-18 |
| `SafetyTests/EMERGENCY_REQUIREMENTS.md` | Новый | 48 / 0 | Emergency requirement bindings — 2026-10-18 |
| `SafetyTests/ESTOP_SEMANTICS_REPORT.md` | Новый | 58 / 0 | E-Stop restart / EDM audit — 2026-10-18 |
| `SafetyTests/fixtures/v2-4bb8703/README.md` | Новый | 14 / 0 | Происхождение fixture, CRC/SHA256 и правила неизменности. |
| `SafetyTests/INTEGRATED_CONTROL_REPORT.md` | Новый | 47 / 0 | Integrated command/ownership/access contract — 2026-10-18 |
| `SafetyTests/NATIVE_BLOCK_MAPPING.md` | Новый | 109 / 0 | Native TwinSAFE block mapping — non-deployed design, 2026-10-18 |
| `SafetyTests/NATIVE_OWNER_MAPPING.md` | Новый | 74 / 0 | Native-style transition owner — isolated plan, 2026-10-18 |
| `SafetyTests/NATIVE_TIMERS_STARTUP_BINDINGS.md` | Новый | 118 / 0 | Native timer/startup and signal bindings — 2026-10-18 |
| `SafetyTests/README.md` | Изменён | 64 / 0 | Команды запуска, статус стенда и границы его доказательств. |
| `SafetyTests/SAFETY_EVIDENCE_MATRIX.md` | Новый | 68 / 0 | Safety evidence and input bindings — 2026-10-18 |
| `SafetyTests/SAL_ADAPTER_SEMANTICS.md` | Новый | 61 / 0 | Adapter semantics audit — 2026-10-18 |
| `SafetyTests/TIMER_CONTINUITY_REPORT.md` | Новый | 55 / 0 | Timer continuity and order experiment — 2026-10-18 |
| `SafetyTests/TRANSITION_REQUEST_PROTOTYPE.md` | Новый | 71 / 0 | Accepted transition ownership prototype — 2026-10-18 |
| `SafetyTests/V2_BASELINE_REPORT.md` | Изменён | 40 / 1 | Уточнение исходных выводов, связей и ограничений исполнения SAL. |
| `SafetyTests/V2_CHANGE_PLAN.md` | Изменён | 4 / 0 | Ссылки на уточнённые группы исправлений и трассировку. |
| `SafetyTests/V2_IMPLEMENTATION_GROUPS.md` | Новый | 48 / 0 | Concrete correction groups — proposal, 2026-10-18 |
| `SafetyTests/V2_RND_TO_SAFE_REPORT.md` | Новый | 67 / 0 | R&D -> Safe linked-path baseline — 2026-10-18 |
| `SafetyTests/V2_RUN_TO_RND_REPORT.md` | Новый | 114 / 0 | Network6 Run -> R&D baseline — 2026-10-18 |
| `SafetyTests/V2_SAFE_EXIT_REPORT.md` | Новый | 68 / 0 | Step2 / Step6 exit baseline — 2026-10-18 |
| `SafetyTests/V2_STATE_MAPPING.md` | Новый | 85 / 0 | V2 state mapping checkpoint — 2026-10-18 |
| `WORK_STATUS_AND_PLAN.md` | Новый | 71 / 0 | Актуальная сводка статуса, критерии приёмки и дальнейший план. |

### Конфигурация

| Файл | Статус | + / − | Назначение |
|---|---|---:|---|
| `SafetyTests/package.json` | Изменён | 9 / 1 | Команды для аудитов, приёмочного отчёта и изолированных проектов схем. |

### Существовавшие журналы обновления

| Файл | Статус | + / − | Назначение |
|---|---|---:|---|
| `UpgradeLog3.htm` | Новый | 275 / 0 | Существовавший журнал обновления среды; не создавался агентом и не относится к новым safety-исправлениям. |
| `UpgradeLog4.htm` | Новый | 268 / 0 | Существовавший журнал обновления среды; не создавался агентом и не относится к новым safety-исправлениям. |

## Оценка структуры изменений

Объём вырос главным образом из-за текстовой копии SAL, развёрнутых JSON-артефактов и последовательного накопления отчётов. Документы частично повторяют статус этапов; актуальная сводка — WORK_STATUS_AND_PLAN.md. Созданный набор прототипов не сокращает автоматически список неисправностей реального SAL.

Для упрощения дальнейшего review разумно разделить сохранение на независимые группы: исправления движка/переносимости; fixture и baseline-тесты; аудиты/приёмочный отчёт; изолированные прототипы; документация; сформированные артефакты. Можно отдельно решить, хранить ли все регенерируемые JSON в Git. Ничего из перечисленного этим отчётом не удалено и не закоммичено.
