Срез / роль / дата: E1-f1-adopt2 (перенос тестов-убийц MU05/MU07 в регресс; замечания 1–3 аудита E1-kill-audit) / v2-tester / 2026-10-21, HEAD b580920 (рабочее дерево, без коммита)

Источник (canonical F1, sha256 сверены): SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104 diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603
Стенд не менялся: src/sal-parser.js fbf239e4…aa195c, src/sal-runtime.js 14d50f18…f14698e. make-mutants.mjs a3fa0fa5…10dc. MUTATION_RESULTS.json (v1) aeb9cb24…c44b — не изменён.

## Сделано

1. Новый регресс `test/current-f1-lock-and-q500.test.js` (sha256 1f6850c3…6fde381f), 9 тестов, группа current в check:software.
   - Фикстура: копия `program/tester/E1-f1/runners/run-source.js` без изменений логики. Изменено только: пути к canonical через import.meta.url (без env-override MEN001_F1_ROOT), убран compressFrames (нужен только для отчёта). v2-structural.js и SHA-пины не используются.
   - Обёртка: семантика раннера сохранена. Вычисляются все проверки; тест падает, если хоть одна не совпала. Добавлена завершающая проверка раннера «all demanded inputs resolved». Исключение фикстуры = FAIL теста.
   - Дословно перенесены: `F1-real-lock-producer-rejects-green-and-doesnotqueue` (убийца MU05), `F1-green-qualified-lateblue{500,600}-cannot-cancel` (500 — убийца MU07; 600 из того же цикла). Также из того же файла раннера перенесены симметричные `F1-blue-qualified-lategreen{500,600}-cannot-become-down` (blue-first по D-Q500). Сверх двух запрошенных — это расширение.
2. Соседи 499/501 выводятся из требований, поэтому добавлены:
   - `F1-green-qualified-lateblue501-cannot-cancel`: D-LATE-SECOND «после acceptance» (single квалифицирована на 500). Oracle тот же, что у 500/600: down не отменяется, один подъём, нет up/unlock.
   - `F1-green-lateblue499-before-single-no-command`: D-LATE-SECOND «до acceptance» (>250 мс, single 0,5 с ещё не набрана). Нет down/up/unlock ни при удержании, ни после отпускания, ни после очистки. Позитивный контроль: после обоих OFF + 2110 мс новая green500 даёт down (тот же интервал, что в lock-тесте; новое значение фильтра не вводится).
   - `F1-blue-qualified-lategreen{499,501}-cannot-become-down`: симметрия blue-first, тот же oracle, что у 500/600.
   - Источники: SCENARIO_DECISIONS D-Q500, D-LATE-SECOND (таблица Green/Blue t300/t500/t600), D-STARTINGRUN-GREEN-DOWN (D-LATE-SECOND в силе в Run), D-RUN-BOTH-IGNORE.
3. `program/tester/E1-f1/MUTATION_RESULTS.v2.json` (d961c4c3…698b7c), рядом с v1. Генератор: `program/tester/E1-f1-adopt2/make-mutation-results-v2.mjs`. Вердикты и счёт 23/26 не менялись, добавлены только аннотации.
   - Поле killers для MU22/MU25/MU26 заполнено фактическими shared-тестами (файл + имя) из архивных `results/mutants/<ID>/shared.tap`. Добавлен killersByFile. Для MU26 пин R3PAIR помечен counted:false.
     - MU22: early-sto 52, rnd-physical-integration 28, safe-run-gestures 5, rnd-down-no-reenergy 2.
     - MU25: rnd-physical-integration 22, safe-run-gestures 2, rnd-down-no-reenergy 2.
     - MU26: rnd-physical-integration 12, safe-run-gestures 2 (+1 R3PAIR, не засчитан).
   - Единицы (поле units). **Поправка к замечанию 2 аудита:** battery.fails и battery.errors оба считают СЛУЧАИ (cases) раннеров, а не проверки. Сумма по 5 раннерам: qualification 16 + Run20 20 + lifecycle 2 + phase-exit 3 + gaps 17 = 58 случаев. Для всех 26 мутантов пересчитано по TOTAL-строкам архивных логов: 0 расхождений (MU01: 9+19+0+0+15 = 43 FAIL). Аудитор сравнил 43 только с 16 случаями qualification. Единицы не смешаны.
   - MU07: shaDeterministic:false. addSymbolReader использует crypto.randomUUID. Мой прогон дал 7bb3f6c7…, v1 — 3d60771f…. Воспроизводимо только поведение. Структурный дифф мутанта: `MU07-vs-F1.diff` (порт And23.AndIn3 + обёртка symbol reader; меняются только 3 UUID).
   - MU05/MU07: добавлены regressionKillers (новый файл) и аннотации MU22/MU25/MU26 по аудиту.

## ID матрицы и их новый статус

Новых статусов ID нет. Факт для gates.E1-f1.mutations: аннотацию «MU05/MU07 … adopt into SafetyTests/test pending» можно заменить на «adopted: test/current-f1-lock-and-q500.test.js». MU07 теперь убивается двумя тестами регресса (delta 500 и 501), а не только ровно 500.

## Команды воспроизведения

Пути относительно SafetyTests. S — scratchpad.
- `node --test --test-reporter=tap test/current-f1-lock-and-q500.test.js`
- `node program/tester/E1-f1/make-mutants.mjs candidates/resumed-f1/native $S/mut`
- Прогон на мутанте MUxx:
  - `cp -r src package.json $S/mut/MUxx/SafetyTests/`
  - `cp test/current-f1-lock-and-q500.test.js $S/mut/MUxx/SafetyTests/test/`
  - `cd $S/mut/MUxx/SafetyTests && node --test --test-reporter=tap test/current-f1-lock-and-q500.test.js`
  - Тест читает `../../MEN001_Dyno` относительно своего файла, то есть SAL мутанта. Для F1 то же самое делается с копией candidates/resumed-f1/native.
- `node program/tester/E1-f1-adopt2/make-mutation-results-v2.mjs program/tester/E1-f1 program/tester/E1-f1-adopt2 program/tester/E1-f1/MUTATION_RESULTS.v2.json`
- `npm run check:software`
- Разбивка current: `node --test <current без e2>` и `node --test <current-e2*>`. Список файлов: `current-files.txt`.

## Результаты

Новый файл (taps: F1.tap, MU05.tap, MU07.tap, MU19.tap, MU20.tap, MU26.tap; sha SAL — mutant-sal-sha256.txt):

| Источник | lateblue500 | lateblue600 | lategreen500/600 | lock | lateblue501 | lateblue499 | lategreen499/501 |
|---|---|---|---|---|---|---|---|
| F1 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| MU05 | PASS | PASS | PASS | **FAIL** | PASS | PASS | PASS |
| MU07 | **FAIL** | PASS | PASS | PASS | **FAIL** | PASS | PASS |
| MU19 (GREEN 0.4) | PASS | PASS | PASS | PASS | PASS | **FAIL** | PASS |
| MU20 (GREEN 0.6) | **FAIL** | PASS | PASS | **FAIL** | **FAIL** | **FAIL** | PASS |
| MU26 (WINDOW 300) | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

Дословно:
- `not ok 5 - F1-real-lock-producer-rejects-green-and-doesnotqueue` (MU05): «qualifiedgreen while actuallockTRUE cannot own physicaldown» a=true; «clearinglock never queues oldgreen authorization» a=true.
- `not ok 1 - F1-green-qualified-lateblue500-cannot-cancel`, `not ok 6 - F1-green-qualified-lateblue501-cannot-cancel` (MU07): «acceptedgreen survives lateblue…» a=false; «only one physical down rise» 0≠1.
- `not ok 7 - F1-green-lateblue499-before-single-no-command` (MU19): no down while both held a=true (запрещённый переход).
- MU20 на 499 падает только по позитивному контролю (504 мс < 0.6 с), это liveness.

MU19/MU20/MU26 прогнаны только для оценки чувствительности новых соседей; в счёт E1 не входят. Соседи 499/501 blue-first не убили ни одного из прогнанных мутантов, их ценность в покрытии требования.

check:software (`check-software.out`; файлы SOFTWARE_CHECK_RESULTS.* перезаписаны этим запуском):
- harness: PASS 218/218.
- historical: PASS 75/75.
- current: FAIL 503/844, fail 339.
- current SAL: {"PASS":199,"FAIL":1,"NOT VERIFIED":7,"ERROR":0}, без изменений.
- Разбивка (`current-split-summary.txt`):
  - current без e2: 470/470 PASS. Это прежние 461 + 9 новых.
  - current-e2* (18 файлов другого тестировщика, RED ожидаем): 33/374 PASS, 339 fail.
  - Все 339 FAIL группы current приходятся на E2-файлы.
- Harness 218, а не 209 — изменения других ролей в рабочем дереве, не мои.

## Допущения и пределы доказательства

- A1–A5 перенесены из раннера без изменений:
  - A1: срез Network3 (b_Step* задаются), Network4/group не исполняется.
  - A2: Run готовится через ordinary Step2, затем b_Step3.
  - A3: скан 1 мс.
  - A4: lock-тест подаёт inPLC_RnD_Mode/_2 и in_HV_C2_FBK как заданные программные входы, чтобы дойти до реального PLC-stop производителя Lock. Сам Lock не задаётся.
  - A5: отсутствие fault в этом конусе не наблюдается; «без fault» из D-LATE-SECOND не проверено.
- Позитивный контроль 499 использует 2110 мс нейтрали, как lock-тест раннера. Точная граница фильтра 2000 здесь не проверяется: она есть в других тестах.
- Только офлайн-модель стенда, не IDE/native CRC/Target/hardware.
- Поведенческие мутанты строятся правкой XML. CRC не пересчитывается.
- D-PHYSICAL-SHORT-RESET-DOWN делает green500-таблицы историческими для Armed/R&D. Мои тесты — Run (D-STARTINGRUN-GREEN-DOWN сохраняет D-LATE-SECOND в Run). Если аналитик сочтёт, что открытая граница точки acceptance короткого Reset распространяется и на Run, oracle 499/501 нужно пересмотреть.
- Фикстура продублирована внутри теста, потому что запись в test/helpers этим поручением не разрешена. Исходник в runners остаётся.

## Вопросы аналитику/Вадиму

Нет. Справочно, к аналитику: подтвердить, что D-PHYSICAL-SHORT-RESET-DOWN (точка acceptance короткого Reset) не относится к Run→R&D green500.

## Что передать следующему и кому

- Ведущему:
  - заменить аннотацию «adopt pending» для MU05/MU07 в TRACE_MATRIX;
  - отметить, что замечание аудита 2 (единицы) неверно: оба поля в случаях, 26/26 сверено;
  - regression: current без e2 = 470/470.
- Ревьюеру: проверить перенос — дифф фикстуры с runners/run-source.js (только пути и compressFrames) — и вывод соседей 499/501 из D-LATE-SECOND.
- Замечание 5 аудита (MU22 не показывает защитную роль NOT T) не закрыто. Нужен тест на запрещённый переход для GATE_005.AndIn2. Это отдельная задача тестировщику/архитектору.
