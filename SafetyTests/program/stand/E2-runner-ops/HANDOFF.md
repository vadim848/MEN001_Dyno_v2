# E2-runner-ops — handoff (v2-stand-engineer)

Срез / роль / дата: E2, план мутаций v5 (operatorAvailable:false) + робастные пробы G-1…G-4 (PLAN v5 A4-3, §6) / v2-stand-engineer / 2026-10-22

Источник: canonical F1, только чтение, не менялся: SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3, SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104, diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603.
Пробы дополнительно запускались только на чтение на кандидате E2a: `candidates/E2a/native` SAL 5648e31c…4e08010 и `program/editor/E2a/staged` SAL 84bec17e…0258aa.

## Сделано

### 1. Раннер `scripts/sal-mutation-check.js`: категория NOT-RUN
- Если оператор мутации не реализован в `src/sal-mutations.js` и в плане стоит `operatorAvailable:false`, вердикт NOT-RUN («operator unavailable»). Мутация не применяется, детекторы не запускаются. Это ни KILLED, ни SURVIVED.
- В отчёте JSON: `summary["NOT-RUN"]`, `notRun[]`, `staleOperatorFlags[]`. В MD — отдельная строка «NOT-RUN (operator unavailable; neither KILLED nor SURVIVED): N - ids» и отдельная таблица. В таблицу вердиктов NOT-RUN не попадает. В консоли — отдельная итоговая строка.
- Коды выхода:
  - 0 — все KILLED;
  - 1 — есть SURVIVED, STRUCTURAL-ONLY или INVALID. Это приоритетнее NOT-RUN, NOT-RUN его не маскирует;
  - **4 (новый)** — все выполненные мутации KILLED, но есть NOT-RUN. Прогон неполный, это не PASS;
  - 2 — невалидный план; 3 — инфраструктура.
- Неизвестный оператор без флага `operatorAvailable:false` — ошибка плана, exit 2. Опечатка не превращается в NOT-RUN. Дубликат id мутации — тоже exit 2.
- Флаг `operatorAvailable:false` у оператора, который стенд реализует, считается устаревшим: WARNING, мутация выполняется. Доступность оператора — факт стенда.
- `--validate-only`:
  - перечисляет NOT-RUN (`NOT-RUN (operator unavailable) <id> …`, в JSON `notRun`) и устаревшие флаги;
  - **новое:** пробно применяет каждую выполнимую мутацию к источнику (apply, точная дельта разбора, проверка привязок SAL/SGVL) без запуска тестов. Мутация, которую нельзя применить, даёт `CANNOT-APPLY …` и exit 2: в прогоне она была бы INVALID. Раньше такой план проходил как VALID. Это ужесточение gate.
- Проверка мутанта (`verifyMutation(..., { sgvlXml })`): если исходник проходит `validateSalBindings`, мутант тоже обязан её пройти. Иначе INVALID: на таком мутанте все current-тесты только падали бы при загрузке.
- Оформление: значение-объект (`{moveAfter:…}`) печатается как JSON, а не `[object Object]`.

### 2. Операторы swap-order, deactivate-input-pair, rewire — реализованы
Все три оценены как надёжно реализуемые и реализованы в `src/sal-mutations.js`. Для каждого действует та же проверка повторным разбором, что для старых операторов: «изменено ровно заявленное». В план-форме ничего менять не нужно.
- **swap-order**, `value` — ровно одно из полей:
  - `moveAfter` / `moveBefore` (форма плана). Блок X ставится сразу после или перед якорем. Значения orderOfExecution переназначаются по позициям из того же мультимножества, поэтому нумерация остаётся без пропусков и повторов. Относительный порядок всех прочих блоков сохраняется. Правятся только блоки, у которых значение изменилось; при перемещении через N блоков это N+1 атрибут.
  - `swapWith` — обмен значений ровно двух блоков.
  - Проверка: изменились только строки `#block` перемещённых блоков и только поле order, с ожидаемыми значениями. Глобальная последовательность после разбора совпадает с заявленной.
  - Отказы: no-op (блок уже стоит в нужной позиции), неизвестный блок или якорь, неоднозначное `value`, повторяющиеся orderOfExecution.
  - Семантическое основание — FB_SEMANTICS GRP-1: исполнение идёт в порядке глобального orderOfExecution (DOC §3.1).
- **deactivate-input-pair**, `port: "A+B"`: два разных входа одного safeAnd/safeOr переводятся Activated → Deactivated.
  - Проверка: ровно две строки портов, у каждой изменилось только channelInterface.
  - Отказы: не пара; вход не Activated; не AND/OR (семантика NV); не осталось ни одного активного входа (семантика NV).
- **rewire**, `value.source = //Net/Block/OutPort`: вход, привязанный ровно одним wiredLink на стороне выхода (нативная сериализация), переподключается к другому outPort **той же сети**.
  - Старый wiredLink удаляется; опустевший `<targetFunctionBlockPorts>` удаляется вместе с ним. Новый wiredLink получает детерминированный Id (sha256 от id мутации, источника и цели).
  - Поддерживаются оба вида outPort источника: самозакрывающийся и с существующими целями.
  - Проверка: изменены ровно 3 порта. У цели изменился только sources ([старый] → [новый]). Старый источник потерял только эту цель, новый получил только её. Привязки SAL/SGVL PASS.
  - Отказы:
    - межсетевой источник (нужен Symbol и правка usage в SGVL);
    - вход привязан Symbol или alias;
    - на входе нет провода;
    - wire на стороне входа;
    - вход питается собственным выходом блока;
    - no-op.

Пробное применение (`--validate-only`, копии планов E2a/E2b/E2c с sourceSha256 = F1, логи `validate-only-E2*-on-F1.log`):
- на canonical F1 большинство мутаций — CANNOT-APPLY: блоков HEALTHY_OK, WIN_C2, G10_EXIT, HLT_LV, FBOrIlRunOk и т. п. в F1 нет, план нацелен на кандидатов срезов. Ожидаемо;
- применились и прошли проверку на F1: M-E2a-17, M-E2b-31, M-E2b-32, M-E2b-35;
- на кандидате E2a (5648e31c) скриптом проверены M-E2a-17, M-E2b-31, M-E2b-35, а также pair и rewire на N12/FBAnd6: OK, привязки PASS;
- M-E2a-21 на F1 и на E2a — no-op: FBAnd6 уже стоит сразу после FBTon3. Мутация осмысленна только на кандидате E2a-RC, где порядок обратный.

### 3. Робастные пробы G-1…G-4 (PLAN v5 §6)
Поддержка в стенде нужна: прежние STATE-кейсы инжектировали удалённые в R1 Symbols. Реализована минимально и **вне check:software**: число кейсов не меняется, это не oracle.
- `src/grant-probes.js`, `scripts/grant-probes.js`, `npm run probe:grants [-- --sal F --sgvl F --env JSON --out DIR]`.
- Изолированная сеть Network3. Пара грантов подаётся ровно на 1 скан, затем 5 тихих сканов. Стадии наблюдаются на выходах RS (`resolvePhaseObservers`); расхождение Symbol и RS — ERROR.
- Перебор:
  - каждая засеянная одиночная стадия и вариант «none»;
  - все комбинации внешних Symbols кольца, не являющихся грантами (FALSE/TRUE; больше 6 — нужен явный `--env`);
  - оба допущения для неподключённых входов.
- Без тихих умолчаний:
  - гранты (`b_Step*_Set[_n]`) явно FALSE вне скана инъекции;
  - прочие читаемые Symbols задаются явно, иначе `UNDEFINED_INPUT`;
  - у инжектируемого имени нет потребителя — `INJECTION_POINT_MISSING` (ERROR, проба не оценивается).
- Вердикт: AS-CONSTRUCTED или DEVIATES относительно ожидания архитектора по построению; PASS/FAIL не выдаётся. Exit скрипта: 0 / 1 (есть DEVIATES) / 3 (ERROR).

Результаты (каталоги `probes-E2a-candidate/`, `probes-F1/`). A — AS-CONSTRUCTED, D — DEVIATES, по засеянной стадии:

| проба | E2a-кандидат 5648e31c (staged 84bec17e — те же счёты) |
|---|---|
| G-1 S2_2+S4 → «S4 только» | A: none, S1, SR, S3, S4, S6; **D: S12 → {S12,S4}, S5 → {S4,S5}** |
| G-2 S3_2+S4 | A: none, S1, SR, S3, S4; **D: S12, S5, S6 (вторая стадия сохраняется)** |
| G-3 S12_2+S4 | как G-2 |
| G-4 S12+S3_2 → «две стадии» | A: none, S1, SR, S12, S3; D: S4, S5, S6 → три стадии |

От окружения (b_EStop_Ok, in_Safety_Run, in_False_SI2_CH8) и от допущения для неподключённых входов результат на E2a не зависит: по 16 строк на каждую комбинацию проба/засев. На F1 (старый механизм статусов, кольца нет) пробы в основном DEVIATES. Это справка, а не дефект: §6 относится к кольцу R1/E2.

## ID матрицы и их новый статус
Не меняются: изменены только инструменты стенда. Пробы — не oracle E2-01.

## Команды воспроизведения (из `SafetyTests/`)
```
node --test test/stand-sal-mutation-ops.test.js test/stand-grant-probes.test.js test/stand-sal-mutations.test.js test/stand-sal-mutation-plan.test.js test/stand-sal-mutation-kill.test.js
node scripts/sal-mutation-check.js --plan <план с sourceSha256 = SAL источника> --validate-only
node scripts/sal-mutation-check.js --plan <план> [--only ID,...]
npm run probe:grants -- --sal candidates/E2a/native/TwinSafeGroup1.sal --sgvl candidates/E2a/native/GVL1.sgvl --out <dir>
npm run probe:grants -- --env '{"b_EStop_Ok":[false,true],"in_False_SI2_CH8":[false,true],"in_Safety_Run":[false,true],"b_Step1_Reset":false,"b_Step2_Reset":false,"b_Step3_Reset":false,"b_Step4_Reset":false,"b_Step5_Reset":false,"b_Step6_Reset":false}' --out <dir>
```
Регресс: изолированные копии в scratchpad `ops/`.
- before — `createSandbox` из рабочего дерева до моих правок; его нетронутая копия снята до прогона.
- after — та же нетронутая копия, на которую наложены только мои 7 файлов. Поэтому параллельные правки current-* тестировщика в сравнение не попали.

## Результаты
- Регресс `check:software` на F1, без .git (`f1-before-check.log`, `f1-after-check.log`):

| | harness | historical | current | SAL cases | exit |
|---|---|---|---|---|---|
| до | PASS 236/236 | PASS 75/75 | FAIL 533/942 (399 fail) | PASS 199, FAIL 1, NV 7, ERROR 0, N/A 0 | 4 |
| после | PASS 255/255 | PASS 75/75 | FAIL 533/942 (399 fail) | PASS 199, FAIL 1, NV 7, ERROR 0, N/A 0 | 4 |

  - Разница только +19 harness-тестов: мои 13 STAND-MUTOPS и 6 STAND-GPROBE, все pass. Ни один тест не пропал и не сменил статус.
  - 207 кейсов идентичны по полному JSON.
  - Exit 4 до и после — по одной причине: 6 необъяснённых MISSING `E2a RUN-CONF …` в current. Это переименования или правки тестировщика в `current-e2a-run-conf.test.js`, не мой эффект.
- Новые stand-тесты: 19/19 pass. Существующие stand-sal-mutations 7/7, stand-sal-mutation-plan 6/6, stand-sal-mutation-kill — pass.
- Чувствительность: новые тесты на прежних src/scripts падают при загрузке (нет экспортов `listBlocks`, `operatorNames`, `grant-probes.js`). Тесты раннера проверяют коды выхода 4 и 2, которых раньше не было.
- Изменённые файлы (sha256):
  - src/sal-mutations.js cac87ef2…;
  - src/grant-probes.js (новый) 288ffa79…;
  - scripts/sal-mutation-check.js 89687324…;
  - scripts/grant-probes.js (новый) 306bed0b…;
  - package.json b5833fa2… (+`probe:grants`);
  - test/stand-sal-mutation-ops.test.js (новый) 0dd0396b…;
  - test/stand-grant-probes.test.js (новый) e0db1982….

## Допущения и пределы доказательства
- Мутанты — модель неисправностей SAL, а не нативно сохранённые правки: CRC не пересчитывается, diagram не обновляется. Для rewire нативная раскладка wiredLink (Id, место в XML) не воспроизведена 1:1. Разбор и `validateSalBindings` её принимают, IDE — не проверялось.
- swap-order меняет только orderOfExecution. Межсетевое перемещение (M-E2b-31/32) допустимо в модели «глобальный порядок» (GRP-1). Нативная реализуемость такого порядка в редакторе не проверялась.
- Пробы: изолированная Network3, засев напрямую в RS (без утверждения о достижимости). Взаимоисключение производителей грантов и привязка грантов к источникам **не** проверяются, на это прямо указывает §6.
- Ручная процедура G3 для мутаций, которые остаются NOT-RUN или CANNOT-APPLY по пределам операторов. Сейчас в планах v5 таких нет: M-E2a-26 — rewire внутри Network12. Порядок для будущих межсетевых rewire или иных операторов:
  1. Редактор в копии кандидата делает правку в нативном редакторе (Symbol + usage), сохраняет и фиксирует SHA мутанта.
  2. Мутант кладётся на путь canonical в изолированной копии (`createSandbox` с overlays на MEN001_Dyno/…).
  3. Прогоняются те же testFiles плана; kill-правило — `src/sal-mutation-kill.js`, сравнение с baseline той же копии.
  4. Ревьюер проверяет дельту native-структуры (ровно заявленная связь) и KILLED, с приложением TAP.

## Вопросы аналитику/Вадиму
Нет. Вопрос архитектору (через ведущего) — ниже.

## Что передать следующему и кому
- **Архитектору:**
  - снять `operatorAvailable:false` у M-E2a-17/21/26, M-E2b-31..35, M-E2c-06, M-E3-12: операторы реализованы, раннер их выполняет и выдаёт WARNING о флаге;
  - M-E2a-21 (`moveAfter FBTon3`) на текущих источниках — no-op; на кандидате E2a-RC проверить `--validate-only`;
  - §6: в таблице проб не задана исходная стадия. На E2a «S4 только» (G-1…G-3) не выполняется из S12 и S5 (G-1), а также S12, S5, S6 (G-2/G-3): вторая стадия сохраняется. G-4 из S4/S5/S6 даёт три стадии. Нужно указать, из каких стадий ожидание по построению нормативно для пробы, либо принять наблюдение как предел. Дефектом это не объявляю.
- **Ведущему / G3:**
  - новый exit 4 раннера означает «есть NOT-RUN», это не PASS;
  - `--validate-only` теперь падает (exit 2) на мутациях, которые не применяются к источнику. Перед G3 прогнать на кандидате каждого среза;
  - check:software не затронут.
- **Тестировщику:** существующие тесты не затронуты. Новые — только `test/stand-sal-mutation-ops.test.js` и `test/stand-grant-probes.test.js`.
- **IDE-verify (параллельный инженер):** не пересекались. Мои записи — только src/sal-mutations.js, src/grant-probes.js, scripts/sal-mutation-check.js, scripts/grant-probes.js, package.json, два stand-теста и эта папка.
