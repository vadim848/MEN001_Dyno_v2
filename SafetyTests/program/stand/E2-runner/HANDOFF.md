# E2-runner — handoff (v2-stand-engineer)

Срез / роль / дата: E2, условие C3 ревью G1 (program/reviewer/E2-G1/G1_REVIEW.md §7) — раннер мутаций / v2-stand-engineer / 2026-10-21

Источник: SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104 diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603 (canonical F1, только чтение; не менялся)

## Сделано

1. `src/sal-mutation-plan.js` (новый, sha256 e991ae25…): строгая проверка выбора детекторов.
   - testFiles: каждый элемент — точное имя `<name>.test.js` в `test/`. Шаблоны (`* ? [ ] { }`),
     комментарии/пробелы, пути, дубликаты, отсутствующий файл, пустой список дают ошибку.
     Glob сознательно не поддерживается: отчёт мутаций должен называть тот же набор
     детекторов, который проверял автор плана. Молчаливого отбрасывания больше нет.
   - behaviouralTests: пустой список и некорректный regex дают ошибку. Шаблон, не выбравший
     ни одного теста из testFiles в baseline-прогоне на немутированной копии, тоже ошибка.
     Плейсхолдер `<module load>` совпадением не считается.
2. `scripts/sal-mutation-check.js` (sha256 c0901835…):
   - вместо `plan.testFiles.filter(fs.existsSync)` вызывается `resolvePlanTestFiles`. Все ошибки плана
     перечисляются разом, после чего exit 2: «Invalid mutation plan …; nothing was run». Мутации и
     baseline при этом не запускаются. Проверка выполняется до проверки sourceSha256 и на test/ песочницы,
     поэтому учитывает и тесты, добавленные через `--patch`.
   - после baseline: если есть шаблоны без совпадений, exit 2 со списком.
   - WARNING (не ошибка): шаблон выбирает только тесты, которые не проходят на немутированной копии.
     На этом источнике такой шаблон ничего убить не может. Сейчас так у E2-тестов на canonical: там они RED.
   - новый `--validate-only` (dry-run): валидация, baseline, отчёт `sal-mutation-plan-validation.json`
     (число тестов на файл, совпадения по каждому шаблону — всего и среди PASS). Мутации не применяются. Exit 0.
   - в отчёт мутаций добавлены `detectors.resolvedTestFiles`, `behaviouralPatternMatches`,
     `behaviouralPatternPassingMatches`. Коды выхода: 0 / 1 / **2 = невалидный план** / 3 = инфраструктура.
3. `src/stand-sandbox.js` (sha256 ff368b3f…). Два исправления песочницы, найдены при сравнении «до»:
   - **CLOSURE без `resumed-development-2026-10-21/architect/F1_RUN_RECOGNIZER_PLAN.json`.** После
     переноса F1 (0391fae) его читает `test/helpers/v2-structural.js` → `scripts/f1-delta-check.mjs`.
     В песочнице 4 детектора пилота (current-door-interlock, -hv-set-permit, -step12-lv-permit,
     -unlock-hold) падали при загрузке. **До исправления раннер мутаций на текущем canonical не работал
     вовсе: exit 3 на baseline с любым планом.** Файл добавлен в CLOSURE.files. Туда же добавлен
     `program/stand/E0-stand/sal-mutation-plan.pilot.json`: это план раннера по умолчанию, его читает новый stand-тест.
   - `runTestFiles` убирает из окружения дочернего процесса `NODE_TEST_CONTEXT`. Если раннер вызван
     изнутри `node --test`, дочерний `node --test` иначе отчитывается родителю, а не в TAP, и даёт
     0 разобранных тестов. Новая проверка шаблонов это ловит; раньше такой прогон молча считался пустым.
     Семантику симулятора и тестов требований изменение не затрагивает.
4. `test/stand-sal-mutation-plan.test.js` (новый, 6 тестов, группа harness):
   - юнит: шаблон/комментарий/путь/дубликат/отсутствующий файл → ошибки, ни один не отброшен молча;
   - юнит: шаблон behaviouralTests без совпадений → unmatched, `<module load>` не считается;
   - пилот E0 разрешается ровно в те же 17 файлов, что и прежний фильтр existsSync;
   - CLI: несуществующий файл и шаблон в testFiles → exit 2 с перечнем, отчёт не создаётся;
   - CLI: regex без совпадений → exit 2, в перечне только он;
   - CLI: валидный план `--validate-only` → exit 0, отчёт с числом совпадений, без WARNING.

## ID матрицы и их новый статус

Не меняются: изменён только инструмент стенда. Для G3 изменение — предусловие, но не kill-доказательство.

## Команды воспроизведения

```
cd SafetyTests
node --test test/stand-sal-mutation-plan.test.js
node scripts/sal-mutation-check.js --plan program/architect/E2-status/MUTATION_PLAN_E2a.json --validate-only
node scripts/sal-mutation-check.js --plan <план с sourceSha256 = canonical> --validate-only   # dry-run
npm run check:software
node scripts/stand-isolated-check.js --out <каталог вне репозитория>
```

## Результаты

**Регресс check:software**
- до: harness 209/209, historical 75/75, current 592 (466 pass / 126 fail), current SAL PASS 199 / FAIL 1 / NV 7.
- после: harness **215/215** (+6 — мои stand-тесты), historical 75/75, current SAL без изменений (199/1/7).
- current после: 733 (479/254), на финальном прогоне 784 (483/299). Это не мой эффект: во время
  работы тестировщик добавлял и правил файлы `test/current-e2*` (мтаймы 21:38–21:46, 13+ файлов, `helpers/e2-emergency.js`).
- Изолирующее доказательство: 20 не-E2 файлов current (кроме code-checks) после изменений дают **461 / 461 pass / 0 fail**.
  Это совпадает с «до»: 592 − 131 E2 = 461, 466 pass = 461 + 5 E2 PASS, как показывает `^E2a` passing = 5.
  Мои изменения касаются только stand-sandbox и раннера; тесты требований их не импортируют.

**Пилот E0, до/после**
- Пилот как есть (sourceSha256 = P0 34b5b850…): до и после exit 3, «refusing to run a stale plan».
  Поведение не изменилось; план устарел после F1.
- Копия пилота с sourceSha256 = canonical F1, `--only NONE` (только baseline):
  - до (старый код, прежняя песочница): exit 3, baseline load-fail в 4 файлах (F1_RUN_RECOGNIZER_PLAN.json);
  - старый скрипт с исправленной песочницей против нового: отчёты **идентичны** по planSha, source, testFiles,
    behaviouralTests, baseline (508 тестов, 0 not passing), summary и results. Новый `--validate-only`:
    VALID, 17 файлов, все 14 шаблонов совпали (DOOR06 33, EARLYSTO 86, R3PAIR 86, … SAL-SEM02 1).
- Одна реальная мутация пилота (IL-01, FBAnd16/AndIn1, новый код): STRUCTURAL-ONLY, 49 тестов absent.
  Это совпадает с E0-отчётом (IL-01 тоже был STRUCTURAL-ONLY).

**Планы E2 архитектора как есть**
- MUTATION_PLAN_E2a/b/c/d.json: каждый → exit 2, `testFiles "current-e2X-*.test.js (v2-tester, G1)": wildcard/pattern is not supported, list exact file names`.
- С 4 точными именами (current-e2a-race, -e2a-rnd-cover-healthy, -e2a-status, -e2b-interlock-run; состав на момент проверки)
  и sourceSha = canonical: VALID, 21 файл, 639 тестов baseline, 126 не проходят. Совпадения своего шаблона:
  `^E2a ` 88 (5 PASS); `^E2b ` 12, `^E2c ` 10, `^E2d ` 21 (0 PASS) → WARNING «cannot kill any mutation of this source».
  На canonical это ожидаемо; на кандидате G3 WARNING должен исчезнуть.

**Изолированная копия** (stand-isolated-check, без .git и соседнего репозитория): loadFail 0.
- Первый прогон: единственная isolated-only разница не из E2 — мой тест 3 (pilot plan не в closure). Исправлено
  добавлением в CLOSURE. Повторно в песочнице: stand-sal-mutation-plan 6/6, stand-sal-mutations 7/7,
  stand-no-runtime-git 3/3, stand-fb-semantics 14/14, 4 файла v2-structural 36+4+3+6 PASS.
- Прочие разницы (5) — `current-e2b-cover-transitions`, `current-e2c-stp-i`: файлы появились во время прогона (working=fail, isolated=absent).
- Полный повторный stand-isolated-check после этого исправления не выполнялся: тестировщик продолжал менять current-e2*.

## Допущения и пределы доказательства

- Шаблон с совпадениями только среди baseline-FAIL — WARNING, а не ошибка: на canonical E2-тесты RED по
  построению, а план предназначен для кандидата. Ведущему/ревьюеру G3: в прогоне на кандидате WARNING
  по behaviouralTests не допускать.
- Совпадение шаблона проверяется по именам, которые реально сообщил baseline-прогон. Тест, падающий при
  загрузке модуля, совпадением не считается: план с таким детектором и так останавливается (exit 3, baseline load-fail).
- **Для тестировщика/ревьюера, не исправлялось (вне моих путей):** `test/helpers/v2-structural.js` закрепляет
  sha256 canonical SAL при загрузке модуля. Поэтому все тесты 8 файлов, которые его импортируют, на любом
  SAL-мутанте становятся absent / STRUCTURAL-ONLY и не могут дать KILLED: current-door-interlock, current-hv-set-permit,
  current-step12-lv-permit, current-unlock-hold, current-early-sto-bindings, current-native-bindings, current-rnd-compact,
  current-v2-migration-negatives. Шаблоны `^DOOR06…`, `^(HV|LV) current SAL`, `^UNLOCK07…` в планах E2 из этих
  файлов не убивают. `helpers/e2-lifecycle.js` SHA не закрепляет, E2-тесты могут убивать.

## Вопросы аналитику/Вадиму

Нет.

## Что передать следующему и кому

- **Архитектору (C3):** в MUTATION_PLAN_E2a–d заменить строку-шаблон точными именами файлов. Новые файлы
  тестировщика (`current-e2a-emg-*`, `-run-conf`, `-sweep-estop`, `current-e2b-sweep-connector`, `-cover-transitions`,
  `current-e2c-hlt03`, `-stp-i`) включать поимённо. sourceSha256 «TBD» перед прогоном заменить SHA кандидата,
  иначе exit 3 (stale plan). Перед G3 проверить план через `--validate-only` на кандидате.
- **Тестировщику (через ведущего):** закрепление SHA в v2-structural.js (см. выше). Если эти детекторы должны
  убивать мутации, проверку идентичности надо вынести из загрузки модуля. Ни один существующий тест не затронут:
  новый тест — только `test/stand-sal-mutation-plan.test.js`.
- **Ведущему:** раннер мутаций до этого среза был неработоспособен на canonical F1 (CLOSURE). Отчёт E0
  `program/stand/E0-stand/sal-mutation-report.json` относится к P0 (34b5b850…), а не к F1.
