Срез / роль / дата: E1-f1-adopt (перенос MU24-различителя в регресс; приведение тестов к Q-MU06-01/02) / v2-reviewer / 2026-10-21, HEAD ea6b52d, незакоммиченное рабочее дерево

Источник: SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104 diagram de02bbff… (взят из handoff тестировщика, сам не пересчитывал).
Пересчитаны ревьюером: src/sal-parser.js fbf239e4…aa195c, src/sal-runtime.js 14d50f18…f14698e (стенд не менялся). Новые файлы: test/current-btn-release-after-permit.test.js be894d0f…2d97f8, test/helpers/full-program-source.js 038d17ed…e414950a. Всё совпадает с handoff.
SCENARIO_DECISIONS.md сейчас 3c00f2f9…6ff1, в handoff f76f0c1d…. Файл изменён в 20:19, после handoff (20:17). В `git diff HEAD` только новые записи Q-RC-01..05. Q-MU06-01/02 и пп. 9/11 те же, что в HEAD, поэтому на эти оракулы изменение не влияет.

## Вердикты

Итог: ACCEPT bounded.

### 1. current-btn-release-after-permit.test.js + helpers/full-program-source.js: ACCEPT

Оракул:
- Ожидания выведены из SCENARIO_DECISIONS п. 9: 2 с непрерывного отпускания обеих кнопок перед новой попыткой; пока кнопка удерживается, отсчёт не идёт. Также п. 11.
- Протокол: кнопка удерживается до отпускания, новая попытка через 1999 мс после отпускания должна быть отвергнута. Это прямо следует из п. 9, от поведения F1 не выведено.
- Позитивный контроль 2001 мс корректен: BOTH в Safe → out_LV_C1/b_Step12, BLUE в Safe → Unlock (существующая роль).
- Граница q=2000 мс не утверждается (A3) — это честно.

Независимый контроль ревьюера (`reviewer-il-control.mjs`). Тот же протокол без эпизода IL на F1 тоже отвергает 1999 и принимает 2001 (8/8). Значит, оракул не опирается на артефакт IL-эпизода. На MU24 без IL-эпизода различий нет, с IL-эпизодом 1999 принимается. Получается, IL-эпизод — именно то условие, которое делает мутант наблюдаемым. Это нарушение п. 9, а не произвольная инъекция.

Тест не зависит от открытого Q-REL-AFTER-PERMIT. Кнопка удерживается до отпускания, отсчёт от отпускания требуется п. 9 при любом ответе.

Перезапуск ревьюером на мутанте (`reviewer-mu24-rerun.tap`):
- F1: 16/16 PASS.
- MU24: 8 FAIL / 8 PASS, exit 1, preload применён к 16 runtime.
- Падают ровно случаи 1999 мс: not ok 1, 3, 5, 7, 9, 11, 13, 15.
- Сообщение: `out_LV_C1: release filter 2 s of both buttons (SCENARIO_DECISIONS item 9/11)  true !== false`.

Сверка с repro: логика и оракул те же. Отличаются имя/префикс, импорт helper и добавленный в helper assert `bindingAudit.status==='PASS'`; это усиление. Helper запрещает задавать in_False и необъявленные входы.

Допущения A1–A4 приемлемы:
- A1 (Safe через запись памяти владельца b_Step1) — объявленная инъекция начального состояния, за достижимость не выдаётся.
- A2–A4 — соглашения стенда, задокументированы в шапке файла.

Замечания, не блокирующие:
- 1a. Имя префикса BTN-RELEASE-AFTER-PERMIT легко спутать с открытым Q-REL-AFTER-PERMIT, хотя сценарий другой: кнопка удерживается через эпизод крышки. Рекомендация тестировщику при следующей правке: одна строка комментария «не кодирует Q-REL-AFTER-PERMIT».
- 1b. Покрыт только Safe и только IL1/IL2. R&D/Run не покрыты (в R&D различитель найден, но не принят в оракул из-за пересмотра E2/V14). Различитель исчезнет, если V14-Q7 выведет IL из разрешения Safe (GATE_001) — тогда MU24 переоценить.
- 1c. «Отвергнута» проверяется только в окне попытки (1100/700 мс), а не «никогда при продолжении удержания». Для п. 9 этого достаточно.

### 2. current-plc-pulse-set-permit.test.js (4 теста) и current-door-interlock.test.js (DOOR06): ACCEPT

Потеряно только поведение при in_False=TRUE. Построчная сверка старого PLCPULSE-сценария:
- Сохранены, с заменой в каждом пункте источника отказа «PLC+False» на «PLC»:
  - блокировка первоначального Set;
  - «восстановление raw не заменяет ручной Restart»;
  - Restart по спаду → Set.
- Удалены только TRUE-проверки, вне объёма по Q-MU06-01:
  - «producer FALSE при одном False»;
  - «False мешает принять Restart».
- Добавлены:
  - нет Set за всю защёлку;
  - PLC fault сам даёт producer FALSE;
  - Restart high не принят;
  - нейтральность False при FALSE;
  - in_False — объявленная raw-граница FBAnd1/AndIn2, FALSE в каждом кадре.

Аварийные guards не ослаблены:
- Список DOOR06 тот же, минус in_False: ES_NC_1/2, LV/HV connector, Estop_PLC, b_EStop_Ok × 2 маршрута.
- PLC-сценарии pulse/heldAndRestart/latched не тронуты.
- in_Mentee_EStop не было ни в DOOR06, ни в PLCPULSE-сценарии ни до, ни после правки, так что ослабления нет. Mentee покрывается в своих файлах, в этом срезе не переоценивался.

Новый позитивный контроль DOOR06 корректен: тот же runEnergy при здоровых guards, in_False читается как FALSE, hv=TRUE по обоим маршрутам. Его чувствительность подтверждена: probe NO→NC на //Network12/FBAnd16/AndIn2 даёт FAIL именно на позитивном контроле, 1/1.

Пробы нейтральности перезапущены ревьюером:
- PLC 4/4 FAIL;
- DOOR06 1/1 FAIL;
- без мутанта оба файла 84/84 PASS.

Неточность handoff (без последствий): «раньше позитивного контроля не было». Тот же hv=TRUE при Door/NC1/NC2=true уже утверждается в параметрическом тесте «DOOR06 actual HV chain …/DoorTrue/NC1true/NC2true». Новый контроль — полезная пара внутри теста, но новым покрытием не является.

Компонентные таблицы с TRUE-строками сознательно оставлены (door 26-30, 59-73; plc 69-71). Это структурные таблицы AND, требования ими не задаются. Ведущему при желании пометить их «структурные, TRUE вне объёма Q-MU06-01». Не блокирует.

### 3. Патч sal-safe-exit-baseline.V2-EXIT01-02.patch: ACCEPT WITH CONDITIONS

Технически корректен:
- `git apply --check` проходит.
- Предложенный файл на baseline: 5/5 PASS (tap тестировщика). Сам ревьюер его не запускал, в test/ ничего не клал.
- Новые утверждения — допустимая по Q-MU06-02 структурная проверка «при FALSE ветвь не даёт выхода».
- Проба NO→NC на эти ветви для патча не выполнялась. Это недоказанная чувствительность, но тривиальная.

Условия:
- 3a. Владелец test/sal-safe-exit-baseline.test.js по README не v2-tester (это не current-*). Ведущий назначает владельца и применяет патч.
- 3b. Это историческое воспроизведение закреплённого baseline (baselineSalPath), а не canonical F1. Q-MU06-02 говорит «тесты на срабатывание не нужны», но не запрещает их, так что патч необязателен. Обе альтернативы допустимы, выбор за ведущим:
  - применить патч;
  - оставить TRUE-ветки, переименовав их в «историческое структурное наблюдение baseline, TRUE вне объёма». Удаление TRUE-строк теряет историческое свидетельство того, что ветви N5/FBAnd7 и N9/FBAnd1 неинвертированы.
- 3c. После применения прогнать `npm run check:software` и подтвердить historical 75/75, где изменились только 2 имени (EXIT01/02). Сумма SAL-кейсов не должна измениться.

### 4. Прогон тестировщика: ACCEPT (выборочно)

Проверено ревьюером:
- SHA стенда и новых файлов.
- Новый файл 16/16 на F1, 8 FAIL на MU24.
- Два правленых файла 84/84.
- Пробы 4/4 и 1/1 FAIL.
- SOFTWARE_CHECK_RESULTS.json (рабочее дерево) против HEAD: 207 кейсов, 0 различий статусов. Summary {"PASS":199,"FAIL":1,"NOT VERIFIED":7,"ERROR":0}.
- Не PASS дословно: STATE:conflicting-set-requests FAIL; ACC-B01, ACC-C02-F, ACC-C01-E, LATE:NO-FAULT, LATE:NO-ROLLBACK, BOOT:UNSUPPORTED_UNBOUND_PROGRAM_INPUT, BOOT:UNSUPPORTED_GROUP_LIFECYCLE — NV.
- current-after.tap: 461 записей, 0 not ok.
- names-before/after: 16 добавлено, 5 переименовано. Совпадает с handoff, исчезнувших нет.
- Генерируемые отчёты, перезаписанные прогоном, отличаются от HEAD только так:
  - generatedAt;
  - current 445→461;
  - список файлов current.
  BOOT_PREFLIGHT_RESULTS и SAL_NATIVE_STRUCTURE_RESULTS идентичны HEAD, кроме generatedAt.

Не проверено ревьюером: полный `npm run check:software` сам не перезапускал, чтобы не перезаписывать отчёты вне reviewer/. Harness 209/209 и historical 75/75 приняты по отчёту из рабочего дерева.

## Пределы доказательства

Офлайн-модель стенда, срезы с объявленными границами (PLCPULSE/DOOR06), A1 — инъекция начального Safe. Не IDE Verify/Build/CRC, не Target, не hardware safety. Зелёные тесты не закрывают ID: STATE:conflicting-set-requests FAIL и 7 NV остаются открытыми.

## Команды воспроизведения (из SafetyTests)

- `node --test test/current-btn-release-after-permit.test.js`
- `node --import file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/tester/E1-f1-adopt/mu24-preload.mjs --test --test-reporter=tap test/current-btn-release-after-permit.test.js` → 8 FAIL
- `node program/reviewer/E1-f1-adopt/reviewer-il-control.mjs F1` и `… MU24`
- `node --test test/current-plc-pulse-set-permit.test.js test/current-door-interlock.test.js` → 84/84
- пробы false-nonneutral-preload.mjs: команды из handoff тестировщика

## Что передать следующему

- Ведущему:
  - обновить TRACE_MATRIX gates['E1-f1'].mutations: MU24 убит регрессом test/current-btn-release-after-permit.test.js; plc-pulse/door-interlock приведены к Q-MU06;
  - назначить владельца для патча sal-safe-exit-baseline (условия 3a–3c);
  - решить судьбу перезаписанных генерируемых отчётов: изменились только метаданные и счётчики.
- Тестировщику (не срочно): замечание 1a; при V14-Q7 переоценить MU24 (1b).
- Аналитику: Q-REL-AFTER-PERMIT остаётся открытым, этот срез его не закрывает.
