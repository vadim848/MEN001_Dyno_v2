Срез / роль / дата: E1-f1-adopt (перенос MU24-различителя в регресс; приведение тестов к Q-MU06-01/02) / v2-tester / 2026-10-21, HEAD ea6b52d (рабочее дерево, без коммита)

Источник (canonical F1, sha256 сверены в прогоне): SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104 diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603
Стенд не менялся: src/sal-parser.js fbf239e4…aa195c, src/sal-runtime.js 14d50f18…f14698e. SCENARIO_DECISIONS.md f76f0c1d…e755af7 (рабочая копия; Q-MU06-01 «Б», Q-MU06-02 «А», пп. 9/11).

Сделано:
1. Новый регресс test/current-btn-release-after-permit.test.js (be894d0f…2d97f8), 16 тестов, префикс BTN-RELEASE-AFTER-PERMIT. Перенос repro/mu24-reachable-kill.test.mjs без изменения логики/оракула: те же 2×2×2×2 случая, тот же протокол (Safe; удержание green/blue 100 мс; IL1 или IL2 FALSE 300 мс; восстановление 700 мс; отпускание 1999/2001 мс; BOTH 1100 мс → out_LV_C1/b_Step12, BLUE 700 мс → out_Door_Unlock_Solonoeid), те же утверждения и ссылки на SCENARIO_DECISIONS пп. 9/11. Убраны только абсолютный путь и MUT.
   Общий helper test/helpers/full-program-source.js (038d17ed…e414950a):
   - пути canonical через import.meta.url;
   - FULL_PROGRAM_RAW — тот же набор входов, что в repro и rnd-down-source;
   - createFullProgram(): полный SAL, audit PASS, 242 блока, скан 1 мс; assert, что in_False не задаётся протоколом и что задаются только объявленные raw-входы;
   - declareSafe(): Restart-импульс + запись памяти владельца b_Step1 + 2100 мс, дословно шаги repro.
   Существующие хелперы не подошли: createRndDownFixture берёт подграф по сигналам и отрезает Network4. Это другая модель, и логика теста изменилась бы.
   Группа: scripts/software-check.js относит файл к current (имя current-*, без baselineSalPath). Подтверждено счётом current 461 = 445 + 16.
2. Мутант MU24 на новом файле. Механизм только в моей папке: preload mu24-preload.mjs ставит //RndPhysicalCompact/GATE_016 AndIn4 = Deactivated в модели каждого SalRuntime до первого скана. Модель парсится заново в каждом тесте; мутация применена 16 раз. Результат: 8 FAIL / 8 PASS, падают ровно случаи 1999 мс, как в E1-f1-reclass.
3. current-plc-pulse-set-permit.test.js:59-66 → сценарий «constant-FALSE False operand is neutral; PLC alone drives producer, latched EStop needs manual Restart». Те же 4 теста (LV/HV × 1/10 мс), имя изменено. in_False больше не задаётся.
   Сохранены проверки:
   - PLC fault блокирует первоначальный Set;
   - восстановление raw не заменяет ручной Restart (b_EStop_Ok FALSE);
   - удержание Restart high не принимается как Restart;
   - Restart по спаду — положительно;
   - Set после Restart.
   Добавлены:
   - Set не появляется за весь интервал защёлки;
   - PLC fault сам по себе даёт producer FALSE;
   - после восстановления PLC producer TRUE: операнд False нейтрален;
   - in_False — объявленная raw-граница //Network1/FBAnd1/AndIn2, все её потребители в срезе = FALSE;
   - in_False = FALSE в каждом кадре.
   Потеряна только проверка «in_False=TRUE блокирует Restart»: по Q-MU06-01 TRUE вне объёма, как аварийный вход не трактовать. Компонентная таблица PLCPULSE existing PLCproducer PLC×False (строки 69-71) не тронута.
4. current-door-interlock.test.js:52-57 → «DOOR06 existing emergency/connector guards still prevent new HV; constant-FALSE False operand neutral».
   - Из списка аварийных guards убран in_False_SI2_CH8.
   - Оставлены in_ES_NC_1, in_ES_NC_2, in_LV/HV_Connector_Interlock, in_Estop_PLC, b_EStop_Ok по обоим маршрутам (physical, existing-PLC-levels).
   - Добавлен парный позитивный контроль: при здоровых guards и in_False = FALSE (проверено чтением) HV появляется по обоим маршрутам. Раньше его не было, и проверка hv=false могла пройти даже при неработающей цепи.
   DOOR06 component …/False{true} (26-30) и таблицы трёх unlock consumers (59-73) не тронуты.
5. Чувствительность новых проверок нейтральности. Preload false-nonneutral-preload.mjs переключает контакт порта in_False с NO на NC, чтобы FALSE стал блокирующим:
   - PORT=//Network1/FBAnd1/AndIn2 → PLC-сценарий 4/4 FAIL;
   - PORT=//Network12/FBAnd16/AndIn2 → DOOR06-guards 1/1 FAIL.
   Оба утверждения эту подмену убивают.
6. sal-safe-exit-baseline.test.js (V2-EXIT01/02, не моё владение) — только предложение, в файл не применено. Патч sal-safe-exit-baseline.V2-EXIT01-02.patch (git apply --check проходит), полная версия файла — sal-safe-exit-baseline.proposed.test.js.txt.
   - EXIT01: только in_False=FALSE × EStop{F,T}. b_Step1_Set_3 = FALSE (отключённая ветвь N5/FBAnd7 не даёт выхода); b_Set_LV_C1/b_Set_HV_C2 = EStopOK.
   - EXIT02: Step6 удерживается; ещё через 1000 мс при константе FALSE b_Step1_Set_2 = FALSE, Step6 = TRUE, out_Step1 = FALSE. Шага с in_False = TRUE нет.
   Прогон предложения: копия временно лежала как test/current-zztmp-*, после прогона удалена. 5/5 PASS на закреплённом baseline (это исторический тест, не canonical). Число тестов не меняется, меняются имена EXIT01/02.

ID матрицы и их новый статус: статусы ID не меняю (это не G4). Для gates['E1-f1'].mutations (вносит ведущий):
- «MU24 kill pending adoption into test/» → регресс-тест есть: test/current-btn-release-after-permit.test.js, 8 FAIL на MU24.
- «Tests contradicting Q-MU06-01/02» → plc-pulse и door-interlock приведены; sal-safe-exit-baseline V2-EXIT01/02 ждёт владельца, патч готов.

Команды воспроизведения (из C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests):
 node --test test/current-btn-release-after-permit.test.js   → 16/16 PASS (btn-release.F1.tap)
 node --import file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/tester/E1-f1-adopt/mu24-preload.mjs --test --test-reporter=tap test/current-btn-release-after-permit.test.js   → 8 FAIL, exit 1 (btn-release.MU24.tap)
 node --import file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/tester/E1-f1-adopt/false-nonneutral-preload.mjs --test --test-reporter=tap --test-name-pattern="constant-FALSE False operand is neutral" test/current-plc-pulse-set-permit.test.js   → 4/4 FAIL (plc-false-nonneutral.tap)
 PORT=//Network12/FBAnd16/AndIn2 node --import file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/tester/E1-f1-adopt/false-nonneutral-preload.mjs --test --test-reporter=tap --test-name-pattern="constant-FALSE False operand neutral" test/current-door-interlock.test.js   → 1/1 FAIL (door-false-nonneutral.tap)
 npm run check:software   → check-software.out
 Поштучное сравнение:
 - current-before.tap: HEAD-версии двух правленых файлов временно положены как test/current-zzbefore-* (после прогона удалены), остальные 17 файлов как есть;
 - current-after.tap: текущее состояние;
 - списки имён: names-before.txt / names-after.txt.

Результаты:
 check:software: exit 1 — из-за SAL FAIL, как и раньше.
 - harness: PASS 209/209;
 - historical: PASS 75/75;
 - current: PASS 461/461 (= 445 + 16);
 - current SAL {"PASS":199,"FAIL":1,"NOT VERIFIED":7,"ERROR":0}.
 Статусы SAL-кейсов поштучно совпадают с HEAD SOFTWARE_CHECK_RESULTS.json, 0 различий. Не PASS:
 - FAIL: STATE:conflicting-set-requests;
 - NV: ACC-B01, ACC-C02-F, ACC-C01-E, LATE:NO-FAULT, LATE:NO-ROLLBACK, BOOT:UNSUPPORTED_UNBOUND_PROGRAM_INPUT, BOOT:UNSUPPORTED_GROUP_LIFECYCLE.
 Дословно not ok в регрессе: нет (0 not ok в harness/historical/current).
 Дословно not ok на мутанте MU24 (btn-release.MU24.tap):
  not ok 1 - BTN-RELEASE-AFTER-PERMIT Safe green held across in_InterLock_NC_1 open/close, release, BOTH after 1999 ms neutral -> rejected
  not ok 3 - BTN-RELEASE-AFTER-PERMIT Safe green held across in_InterLock_NC_1 open/close, release, BLUE after 1999 ms neutral -> rejected
  not ok 5 - BTN-RELEASE-AFTER-PERMIT Safe blue held across in_InterLock_NC_1 open/close, release, BOTH after 1999 ms neutral -> rejected
  not ok 7 - BTN-RELEASE-AFTER-PERMIT Safe blue held across in_InterLock_NC_1 open/close, release, BLUE after 1999 ms neutral -> rejected
  not ok 9 - BTN-RELEASE-AFTER-PERMIT Safe green held across in_InterLock_NC_2 open/close, release, BOTH after 1999 ms neutral -> rejected
  not ok 11 - BTN-RELEASE-AFTER-PERMIT Safe green held across in_InterLock_NC_2 open/close, release, BLUE after 1999 ms neutral -> rejected
  not ok 13 - BTN-RELEASE-AFTER-PERMIT Safe blue held across in_InterLock_NC_2 open/close, release, BOTH after 1999 ms neutral -> rejected
  not ok 15 - BTN-RELEASE-AFTER-PERMIT Safe blue held across in_InterLock_NC_2 open/close, release, BLUE after 1999 ms neutral -> rejected
 Поштучная разница current (445 → 461):
 - Добавлено 16 BTN-RELEASE-AFTER-PERMIT … (новый файл, п. 1).
 - Переименован и изменён 1 тест: «DOOR06 existing emergency/connector/False guards still prevent new HV» → «DOOR06 existing emergency/connector guards still prevent new HV; constant-FALSE False operand neutral». in_False убран из аварийных guards по Q-MU06-01, добавлен позитивный контроль.
 - Переименованы и изменены 4 теста: «PLCPULSE {LV,HV}/primary/fixed{1,10} False operand retains its actual EStop producer/manual Restart role» → «… constant-FALSE False operand is neutral; PLC alone drives producer, latched EStop needs manual Restart». Роль in_False=TRUE как аварийного источника удалена по Q-MU06-01; проверки PLC/защёлки/Restart/Set сохранены.
 Тестов, исчезнувших без замены, нет; остальные 440 имён совпадают.

git diff --stat (SafetyTests/test, отслеживаемые):
 SafetyTests/test/current-door-interlock.test.js    | 12 ++++++++++--
 .../test/current-plc-pulse-set-permit.test.js      | 22 +++++++++++++---------
 2 files changed, 23 insertions(+), 11 deletions(-)
 Новые (untracked): SafetyTests/test/current-btn-release-after-permit.test.js, SafetyTests/test/helpers/full-program-source.js, SafetyTests/program/tester/E1-f1-adopt/*.
 Побочный эффект `npm run check:software` вне моих путей. Скрипт перезаписал генерируемые отчёты SafetyTests/SOFTWARE_CHECK_RESULTS.json, SOFTWARE_CHECK_RESULTS.md, BOOT_PREFLIGHT_RESULTS.json, SAL_NATIVE_STRUCTURE_RESULTS.json. Вручную я их не правил и не откатывал; оставить или откатить решает ведущий.

Допущения и пределы доказательства:
- A1: исходный Safe задаётся записью памяти владельца b_Step1 до протокола (соглашение стенда); boot группы не моделируется.
- A2: b_EStop_Ok устанавливается одним импульсом Reset_PB.
- A3: скан 1 мс; точное q=2000 мс не утверждается, только 1999/2001.
- A4: in_False_SI2_CH8 никогда не задаётся протоколом (assert в helper).
- PLCPULSE/DOOR06 — срезы с явными границами, как и раньше: отрезанные Reset-агрегации FBOr11/FBOr16 = FALSE, граница PLCproducer FBAnd1 = TRUE в DOOR06 runEnergy, глобалы фаз заданы тестом. Это допущения стенда, а не полный жизненный цикл.
- Нейтральность in_False проверена поведенчески при FALSE на canonical. При TRUE не проверялась: по решению это вне объёма. Компонентные строки с TRUE оставлены как были, по поручению.
- Preload-мутации меняют распарсенную модель в памяти; SAL на диске не тронут.
- Офлайн-модель стенда; это не IDE Verify/Build/CRC, не Target и не hardware.
- MU24-различитель работает, пока IL входит в разрешение Safe (GATE_001). После V14-Q7 его нужно переоценить (см. E1-f1-reclass).

Вопросы аналитику/Вадиму: новых нет. Q-REL-AFTER-PERMIT из E1-f1-reclass остаётся открытым; в регресс этот случай не включён.

Что передать следующему и кому:
- Ревьюеру: проверить, что оракулы трёх правок выведены из требований (SCENARIO_DECISIONS пп. 9/11, Q-MU06-01/02), и что из plc-pulse/door-interlock не потеряно ничего, кроме поведения при in_False=TRUE.
- Владельцу test/sal-safe-exit-baseline.test.js (через ведущего): применить или отклонить sal-safe-exit-baseline.V2-EXIT01-02.patch.
- Ведущему: обновить TRACE_MATRIX gates['E1-f1'] (MU24 в регрессе; два из трёх противоречащих файлов приведены); решить судьбу перезаписанных генерируемых отчётов.
