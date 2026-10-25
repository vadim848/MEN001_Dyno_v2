Срез / роль / дата: E1-f1-reclass (MU06, MU24 после Q-MU06-01 «Б» / Q-MU06-02 «А») / v2-tester / 2026-10-21, HEAD ea6b52d

Источник (canonical, MEN001_Dyno/Safety_Dyno, sha256 сверены): SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104 diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603
Стенд: src/sal-parser.js fbf239e4…c195c, src/sal-runtime.js 14d50f18…4698e (не изменялись). SCENARIO_DECISIONS.md 42aaf5db…62e4.

Сделано:
- MU06: добавлено основание «константа» (Q-MU06-01 Б): NOT in_False ≡ TRUE = нейтральный элемент AND в FBAnd24 → мутант совпадает с F1 в каждом скане без GRP-2. Исполненная таблица истинности на распарсенном canonical-блоке: 4/4 строк при in_False=FALSE совпадают.
- MU24: не эквивалентен. Импульс in_False больше не используется (вне домена входов). Найден другой достижимый различитель на полной программе (242 блока), in_False всегда FALSE: Safe, кнопка (зелёная или синяя) удерживается через открытие/закрытие крышки (IL1 или IL2 = FALSE 300 мс; Safe и b_EStop_Ok сохраняются), затем отпускается; новая попытка через 1999 мс отпускания: F1 отвергает, MU24 принимает (BOTH → out_LV_C1/b_Step12; BLUE → out_Door_Unlock_Solonoeid). Через 2001 мс принимают оба (позитивный контроль). Оракул — SCENARIO_DECISIONS пп. 9 и 11 (2 с непрерывного отпускания обеих кнопок перед новой попыткой; пока кнопка удерживается, пауза не отсчитывается).
- Поиск различителя в контекстах Safe и R&D (по 162 случая), Run — по репро ревьюера.
- Список действующих тестов с in_False=TRUE (ниже), тесты не правил.

Файлы (только SafetyTests/program/tester/E1-f1-reclass/):
 MUTATION_RECLASS.json; HANDOFF.md;
 repro/mu24-reachable-kill.test.mjs c733e0e0…e601; repro/mu24-reachable-kill.F1.tap 6dd3076c…272c; repro/mu24-reachable-kill.MU24.tap 3a339d19…d7bd;
 repro/safe-held-across.mjs 77a595cc…bc74; repro/safe-held-across.Safe.txt 3915101a…1ed03; repro/safe-held-across.RnD.txt 8410482f…f66d;
 repro/mu06-constant-check.mjs 461f205d…b250; repro/mu06-constant-check.txt 93b89ead…43da; repro/dump-net.mjs 7c9003d5…e601 (выгрузка сети, вспомогательный).

ID матрицы и их новый статус: статусы ID не меняются (G3-переклассификация мутантов, не G4).

Предложение для TRACE_MATRIX gates['E1-f1'].mutations (вносит ведущий):
 "mutations": {
  "total": 26,
  "killedByRequirement": 23,
  "killedByRequirementNote": "MU24 added: reachable requirement-based kill on full canonical program (Safe, button held across IL1/IL2 open-close, re-press after 1999 ms release rejected; SCENARIO_DECISIONS items 9/11), program/tester/E1-f1-reclass/repro/mu24-reachable-kill.test.mjs; not yet in the regression suite (adopt into SafetyTests/test/); re-evaluate when V14-Q7 changes the Safe permit",
  "equivalentByProof": [
   "MU06 (in_False_SI2_CH8 constant FALSE per Q-MU06-01 B: NOT in_False is the AND-neutral operand; GRP-2 no longer needed)",
   "MU10 (re-evaluate after E2)"
  ],
  "open": [
   "MU11 KILLABLE only by E2 oracle; scenario relies on Run-down branch defective per E3 -> re-evaluate after E3"
  ]
 }
 и в G3 заменить «strict mutation criterion NOT met» на «strict mutation criterion met with documented exceptions: MU06/MU10 equivalent-by-proof, MU11 OPEN (E2/E3)» — по усмотрению ведущего; MU11 по-прежнему не убит.

Команды воспроизведения (из SafetyTests/program/tester/E1-f1-reclass/repro):
 node --test mu24-reachable-kill.test.mjs                → 16/16 pass (F1)
 MUT=MU24 node --test mu24-reachable-kill.test.mjs       → 8/16 fail, exit 1
 node mu06-constant-check.mjs                            → differing 0 (in_False=FALSE)
 node safe-held-across.mjs Safe   (≈10 мин)              → safe-held-across.Safe.txt
 node safe-held-across.mjs RnD    (≈30 мин)              → safe-held-across.RnD.txt
Полный регресс в этом шаге не перезапускался: SAL/SGVL/diagram и тесты не менялись.

Результаты:
 F1: 16 PASS / 0 FAIL. MU24 (дословно not ok):
  not ok 1 - MU24-REACH Safe green held across in_InterLock_NC_1 open/close, release, BOTH after 1999 ms neutral -> rejected
  not ok 3 - MU24-REACH Safe green held across in_InterLock_NC_1 open/close, release, BLUE after 1999 ms neutral -> rejected
  not ok 5 - MU24-REACH Safe blue held across in_InterLock_NC_1 open/close, release, BOTH after 1999 ms neutral -> rejected
  not ok 7 - MU24-REACH Safe blue held across in_InterLock_NC_1 open/close, release, BLUE after 1999 ms neutral -> rejected
  not ok 9 - MU24-REACH Safe green held across in_InterLock_NC_2 open/close, release, BOTH after 1999 ms neutral -> rejected
  not ok 11 - MU24-REACH Safe green held across in_InterLock_NC_2 open/close, release, BLUE after 1999 ms neutral -> rejected
  not ok 13 - MU24-REACH Safe blue held across in_InterLock_NC_2 open/close, release, BOTH after 1999 ms neutral -> rejected
  not ok 15 - MU24-REACH Safe blue held across in_InterLock_NC_2 open/close, release, BLUE after 1999 ms neutral -> rejected
 Поиск: Safe 28 DIFF / 162; R&D 24 DIFF / 162 (все — повторная BLUE → Unlock); LV/HV connector в Safe и повтор GREEN в Safe — без различий.
 Выжившие мутации среза: нет новых; MU11 остаётся OPEN (E2/E3), MU06/MU10 — эквивалентны по доказательству.

Действующие тесты с in_False_SI2_CH8 = TRUE (для ведущего; не правил). Решение: TRUE вне объёма, не аварийный вход (Q-MU06-01); срабатывание трёх отключённых ветвей не проверять (Q-MU06-02):
 1. test/current-plc-pulse-set-permit.test.js:59-66 «False operand retains its actual EStop producer/manual Restart role» — in_False=TRUE как аварийный источник EStop, блокирующий Restart. Противоречит «как аварийный вход не трактовать» и «проверки при TRUE вне объёма».
 2. test/current-door-interlock.test.js:52-57 «DOOR06 existing emergency/connector/False guards still prevent new HV» — in_False в списке аварийных guards (fault=TRUE). Противоречит тому же.
 3. test/sal-safe-exit-baseline.test.js V2-EXIT01 (строки ~25-34, ветка constant=true: b_Step1_Set_3 при TRUE) и V2-EXIT02 (строки ~37-47: Step6 выходит при in_False=TRUE) — утверждают срабатывание отключённых N5/FBAnd7 и N9/FBAnd1 при TRUE. Противоречит Q-MU06-02 («тесты на их срабатывание не нужны»); допустима замена на структурную проверку отсутствия влияния при FALSE.
 4. Компонентные таблицы истинности, включающие строки TRUE (не противоречат по смыслу, но строки TRUE вне объёма): current-door-interlock.test.js:26-30 (DOOR06 component …/False{true}), :64-71 (три unlock consumer, qualifier true); current-plc-pulse-set-permit.test.js:69-71 (PLCproducer PLC×False).
 Не противоречат: sal-assumptions.test.js:14 и sal-safe-exit-baseline V2-EXIT05 (структура alias/канала); прочие действующие тесты/хелперы/src задают in_False=false; sweep'ы по healthy (hv-set-permit, mentee-set-permit, step12-lv-permit) in_False не содержат. Копии в sandbox/candidates/backups — исторические, не действующие.

Допущения и пределы доказательства:
- A1 Исходный Safe — запись b_Step1 в память FBRs до протокола (соглашение стенда/ревьюера), не моделированный boot группы. A2 b_EStop_Ok инициализируется одним импульсом Reset_PB. A3 Скан 1 мс; ровно q=2000 мс не утверждается, только 1999/2001. A4 in_False никогда не задаётся (assert в хелпере).
- R&D- и Emergency-различители (повторная синяя → Unlock в R&D; зелёная как FBEstop Restart, п. 12) найдены, но в оракул не приняты: реакция R&D на потерю крышки/коннектора и Unlock в R&D пересматриваются (E2/V14), трактовка «новой попытки» после Restart интерпретативна.
- Офлайн-модель стенда; не IDE Verify/Build, не Target, не hardware.
- Зависимость: при реализации V14-Q7 (Safe→R&D при открытой крышке) IL может уйти из разрешения Safe (GATE_001) → различитель исчезнет, MU24 переоценить.

Вопросы аналитику/Вадиму:
- Q-REL-AFTER-PERMIT: Исходно Safe, обе кнопки отпущены > 2 с, крышка закрыта. События: крышка открыта (IL1 FALSE) 300 мс и закрыта; кнопки всё время отпущены (итого ≈2,1 с непрерывного отпускания); через ≈1,7 с после закрытия — BOTH 1 с. F1 отвергает (2 с отпускания отсчитываются заново после восстановления разрешения), MU24 принимает. Требование (п. 9) говорит о 2 с отпускания кнопок, о перезапуске отсчёта после восстановления крышки — нет. Какая реакция требуется? Не блокирует: в убивающий тест этот случай не включён.

Что передать следующему и кому:
- Ведущему: внести предложение в TRACE_MATRIX; решить, кому и куда перенести mu24-reachable-kill.test.mjs в SafetyTests/test/ (регресс); список тестов с in_False=TRUE — на решение (правка/исключение/перевод в структурные) владельцу тестов.
- Аналитику (через ведущего): Q-REL-AFTER-PERMIT.
- Архитектору E2/V14: при изменении разрешения Safe (V14-Q7) — запрос переоценки MU24; удаление отключённых ветвей (Q-MU06-02) затронет FBAnd24/GATE_001 — переоценить MU06.
