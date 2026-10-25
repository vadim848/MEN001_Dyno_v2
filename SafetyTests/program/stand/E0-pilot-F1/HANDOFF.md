# E0-pilot-F1 — handoff (v2-stand-engineer)

Срез / роль / дата: E0, перепрогон пилота мутаций (InterLock/EStop/Unlock) на canonical F1 + правило kill раннера (дополнение ведущего) / v2-stand-engineer / 2026-10-21

Источник: SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104 diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603 (canonical F1, только чтение; не менялся). Те же SHA записаны раннером в `sal-mutation-report.json` и изолированной проверкой.

Исторический отчёт P0 `program/stand/E0-stand/sal-mutation-report.json` (10:46, SAL 34b5b850…) не перезаписан.

## Сделано

1. **План F1** `sal-mutation-plan.pilot-f1.json` (sha256 83f7a34f…c3ae) — копия пилота E0 (3da26e6b…bd34). Изменены `sourceSha256` (F1), `status`, добавлены `derivedFrom` и `f1Remap`. Мутации, testFiles и behaviouralTests не менялись.
   - Пересопоставление проверено по разбору моделей (src/sal-parser.js). P0 взят как `git show 0391fae~1` (sha 34b5b850…), F1 — canonical. Для каждого из 25 портов сравнивались все атрибуты (Id, channelInterface, deactivate1/2, filter, wire, global refs) и связанная alias-переменная. **Все 25 совпадают**, поэтому все применимы как есть: ни одна мутация не пересопоставлена и не помечена неприменимой.
   - Изменения F1 (полный diff моделей) затрагивают только Network6 и SafeResumption:
     - удалён FBTon2;
     - добавлены RUN_DOWN_OWNER (safeRs) и RUN_DOWN_RESET (safeOr);
     - у FBAnd23 вход AndIn3 деактивирован, выход AndOut переключён на RUN_DOWN_OWNER/Set;
     - FBAnd24/AndIn3 теперь берётся от linkRndGreenQualified;
     - FBOr5/OrIn1 теперь от RUN_DOWN_OWNER/RsOut;
     - SafeResumption/MODE/OrIn3 активирован (b_Step3);
     - кроме того, у ~45 блоков orderOfExecution сдвинут на ±1.

     Ни один из изменённых блоков не входит в пилот. **В пилоте нет мутаций по блокам, изменённым в F1** (Run-down owner): это должен покрыть план G3 архитектора.
2. **Правило kill раннера (дополнение ведущего)** — исправлено и закреплено тестом:
   - новый `src/sal-mutation-kill.js` (5d23bca5…): `failureClass`, `attributeKills`;
   - `scripts/sal-mutation-check.js` (f57f0192…) вызывает `attributeKills`. В отчёт добавлены `row.categories` и `killRule`, в md — отдельные столбцы по категориям;
   - `src/stand-sandbox.js` (fe03adf4…):
     - `parseTap` разбирает YAML (failureType, code, error, в том числе `|-`) и вложенные провалы (`leaves`);
     - `runTestFiles` распознаёт файловые провалы: `not ok <file>.test.js`, комментарий node о uncaught/async после тестов, timeout, а также 0 TAP при ненулевом exit (теперь это load-fail);
     - `resultIndex` добавляет ключи `<async-error>` и `<timeout>` со статусом `file-error`.
3. **Stand-тест** `test/stand-sal-mutation-kill.test.js` (7cf08bab…, 3 теста). Запускает настоящие дочерние `node --test` на синтетических файлах во временной папке. Allowlist в тесте совпадает с любым именем, включая пути файлов. Проверяется:
   - KILLED дают только два assertion-провала;
   - не дают kill: load-fail с SHA-assert при загрузке, файловый uncaught, assert в файле с файловой ошибкой, исключение не-assert (ERR_TEST_FAILURE), провал before-хука;
   - software-check: падение probe, BOOT, ERROR и пропавшие случаи не дают kill.

   **Тест поймал реальную дыру.** Если тест в файле уже упал, node сообщает об uncaught/async-ошибке после тестов только комментарием `# Error: A resource generated asynchronous activity…`, без записи `not ok <file>`. Раньше такой файл засчитывал assert-провал как kill (первый прогон теста: лишний killer `k-filelevel`). Исправлено детектором `<async-error>`.

## Правило KILLED (ответ ведущему, со ссылками на строки)

**Было** (до правки; номера строк по версии c0901835… из handoff E2-runner, строки 127–142):
- kill засчитывался, если `r.status === "fail" && isBehavioural(key)` для ключа, который на baseline был `pass` (стр. 130).
- load-fail (`<module load>`) не мог дать kill. На baseline файл с load-fail останавливает прогон с exit 3. На мутанте ключа `<module load>` нет в baseline, и цикл стр. 128–131 его пропускает. Тесты такого файла становятся `absent` с `behavioural:false` (стр. 132–135).
- Дыры:
  - (a) исключение не-assert в теле теста (ERR_TEST_FAILURE testCodeFailure: parse, precondition, «Fixture ERROR», SHA-assert внутри теста) считалось kill;
  - (b) провал хука/отмена — тоже kill;
  - (c) файловая ошибка при наличии упавшего assert-теста не обнаруживалась;
  - (d) новый файловый `not ok <file>` (ключа нет в baseline) терялся молча;
  - (e) падение cases-probe и пропавшие случаи software-check терялись молча.

**Стало** (`src/sal-mutation-kill.js`):
- `failureClass` — стр. 27–40;
- `attributeKills` — стр. 46–88;
- выбор вердикта — стр. 86;
- вызов в раннере — `scripts/sal-mutation-check.js` стр. 131–136 (импорт — стр. 29).

Kill засчитывается только при одном из двух условий:
- конкретный тест был `ok` на baseline, на мутанте `not ok`, и причина — ERR_ASSERTION (в самом тесте или во вложенном упавшем subtest); имя теста в behaviouralTests; в этом прогоне у его файла нет файловой ошибки;
- либо случай software-check, не BOOT, перешёл из PASS в FAIL (несовпадение наблюдения; исключения там дают ERROR, src/current-code-checks.js:16–17).

Остальное раскладывается по отдельным категориям и kill не даёт:

| Категория | Что входит |
|---|---|
| file-level | load-fail, в том числе SHA-pin v2-structural (он сам ERR_ASSERTION при загрузке, поэтому одного «ERR_ASSERTION» недостаточно); `not ok <file>.test.js`; `<async-error>`; `<timeout>`; absent-тесты такого файла; провалы тестов в файле с файловой ошибкой |
| exception | — |
| hook-cancel | — |
| absent | — |
| non-behavioural-assertion | — |
| swcheck-structural | — |
| swcheck-error | — |

## P0-отчёт: могли ли KILLED быть засчитаны из-за load/SHA

**Нет, таких нет.** Доказательство (скрипт аудита по `E0-stand/sal-mutation-report.json`):
- 250 behavioural-записей: 216 тестов со статусом `fail` и 34 случая software-check `FAIL`. Подозрительных (статус не fail/FAIL, имя — путь файла или `<…>`, файл из импортёров v2-structural, BOOT) — **0**.
- Все 1225 записей `absent` относятся только к четырём файлам v2-structural (door-interlock, hv-set-permit, step12-lv-permit, unlock-hold). Ни одна не behavioural.
- Записей `load-fail` в newlyFailing нет.
- Файлы-киллеры не импортируют v2-structural:
  - early-sto, estop-native-pairs, mentee-set-permit, plc-pulse-set-permit, rnd-physical-integration, safe-run-gestures, unlock-estop-permit;
  - их helpers не проверяют SHA через assert: safe-run-source только записывает hash в evidence, в after-хуке и только при env.
- Binding-аудит `parseSalFile` (current) проходит на всех 25 мутантах и P0, и F1. Значит, ошибка разбора или привязок не могла уронить тест.

Предел доказательства: в P0-отчёте не сохранены failureType/code. Разделить P0-killers на assertion и исключение по самим данным P0 нельзя. Косвенно: на F1 порты те же, а для всех 16 KILLED число kill по старому правилу (fail + allowlist) **равно** числу по новому правилу (только ERR_ASSERTION). Категорий exception и hook-cancel на F1 — 0.

## Сравнение P0 → F1

Перед F1 правило kill ужесточено. Число kill по старому и новому правилу на F1 совпадает по каждой строке.

| ID | P0 | F1 | killers P0 (тест/sw) | killers F1 (тест/sw) | non-kill на F1 |
|---|---|---|---|---|---|
| IL-01 | STRUCTURAL-ONLY | STRUCTURAL-ONLY | 0/0 | 0/0 | file-level 53 |
| IL-02 | STRUCTURAL-ONLY | STRUCTURAL-ONLY | 0/0 | 0/0 | file-level 53 |
| IL-03 | KILLED | KILLED | 69/0 | 69/0 | file-level 53 |
| IL-04 | STRUCTURAL-ONLY | STRUCTURAL-ONLY | 0/0 | 0/0 | file-level 53 |
| IL-05 | STRUCTURAL-ONLY | STRUCTURAL-ONLY | 0/0 | 0/0 | file-level 53 |
| IL-06 | STRUCTURAL-ONLY | STRUCTURAL-ONLY | 0/0 | 0/0 | file-level 53 |
| IL-07 | STRUCTURAL-ONLY | STRUCTURAL-ONLY | 0/0 | 0/0 | file-level 53 |
| IL-08 | KILLED | KILLED | 7/4 | 7/4 | file-level 53 |
| ES-01 | KILLED | KILLED | 4/0 | 4/0 | file-level 53 |
| ES-02 | KILLED | KILLED | 6/21 | 6/21 | file-level 53 |
| ES-03 | KILLED | KILLED | 5/0 | 5/0 | file-level 53 |
| ES-04 | KILLED | KILLED | 9/2 | 9/2 | non-behav. assert 1, file-level 53 |
| ES-05 | KILLED | KILLED | 6/0 | 6/0 | non-behav. assert 2, file-level 53 |
| ES-06 | STRUCTURAL-ONLY | STRUCTURAL-ONLY | 0/0 | 0/0 | file-level 53 |
| ES-07 | STRUCTURAL-ONLY | STRUCTURAL-ONLY | 0/0 | 0/0 | file-level 53 |
| ES-08 | KILLED | KILLED | 4/0 | 4/0 | file-level 53 |
| ES-09 | KILLED | KILLED | 26/0 | **30**/0 | file-level 53 |
| ES-10 | KILLED | KILLED | 2/0 | 2/0 | non-behav. assert 1, file-level 53 |
| UL-01 | KILLED | KILLED | 1/0 | 1/0 | non-behav. assert 1, file-level 53 |
| UL-02 | KILLED | KILLED | 29/4 | 29/4 | file-level 53 |
| UL-03 | KILLED | KILLED | 1/0 | 1/0 | non-behav. assert 1, file-level 53 |
| UL-04 | KILLED | KILLED | 34/1 | **35**/1 | non-behav. assert 1, file-level 53 |
| UL-05 | STRUCTURAL-ONLY | STRUCTURAL-ONLY | 0/0 | 0/0 | file-level 53 |
| UL-06 | KILLED | KILLED | 8/2 | 8/2 | file-level 53 |
| UL-07 | KILLED | KILLED | 5/0 | 5/0 | file-level 53 |

Итог: P0 {KILLED 16, STRUCTURAL-ONLY 9}, F1 {KILLED 16, STRUCTURAL-ONLY 9, SURVIVED 0, INVALID 0}. Вердикты совпадают по каждой мутации. Множества killers совпадают везде, кроме двух строк, где F1 даёт надмножество P0:
- ES-09 +4: тесты `PLCPULSE LV|HV/primary/fixed1|10 constant-FALSE …`; current-plc-pulse-set-permit.test.js изменён между P0 и F1;
- UL-04 +1: `SR-RG-INVALID-blue-remain-green …`; на P0 этот тест падал на baseline и исключался, на F1 baseline 508/508 pass.

## Зависимость от SHA-pin test/helpers/v2-structural.js

- `file-level 53` в каждой строке = 4 load-fail + 49 absent. Это ровно 4 файла пилота, импортирующие v2-structural: current-door-interlock (DOOR06), current-hv-set-permit и current-step12-lv-permit (`^(HV|LV) current SAL`), current-unlock-hold (UNLOCK07 hold). На любом мутанте они падают при загрузке на `assert.equal(sha(sal), '04b45456…')` (v2-structural.js:9).
- **Все 9 STRUCTURAL-ONLY (IL-01, IL-02, IL-04, IL-05, IL-06, IL-07, ES-06, ES-07, UL-05) целиком зависят от SHA-pin.** Все их провалы — эти 53 file-level. Детекторы без pin такие мутанты не ловят. Для G3 это фактически «не убиты». Убьют ли их тесты DOOR06/HV/LV/UNLOCK07-hold без pin — **не проверено (NV)**.
- 16 KILLED от pin не зависят: киллеры только из файлов без v2-structural, у каждого строки 0 killers из импортёров.
- Остальные 4 импортёра (current-early-sto-bindings, current-native-bindings, current-rnd-compact, current-v2-migration-negatives) в пилот не входят.

## ID матрицы и их новый статус

Не меняются. Пилот E0 — проверка фреймворка, не G3-план архитектора. Мутации guard'ов по ID матрицы этим не закрываются.

## Команды воспроизведения

```
cd SafetyTests
node --test test/stand-sal-mutation-kill.test.js test/stand-sal-mutations.test.js test/stand-sal-mutation-plan.test.js
node scripts/sal-mutation-check.js --plan program/stand/E0-pilot-F1/sal-mutation-plan.pilot-f1.json --out <вне репо> --validate-only --with-software-check
node scripts/sal-mutation-check.js --plan program/stand/E0-pilot-F1/sal-mutation-plan.pilot-f1.json --out <вне репо> --with-software-check --concurrency 6
node scripts/stand-isolated-check.js --out <вне репо> --skip-working
```

## Результаты

- `--validate-only`: VALID, 17 файлов, 508 baseline-тестов (0 не проходят), все 14 шаблонов совпали, 25 мутаций (`sal-mutation-plan-validation.json`, 7a205f41…).
- Полный прогон (57 мин, exit 1, потому что есть не-KILLED): {"KILLED":16,"STRUCTURAL-ONLY":9,"SURVIVED":0,"INVALID":0}. Файлы `sal-mutation-report.json` (eca15649…) и `.md` (66caae15…). Software-check baseline: not-PASS 6 — 5 NOT VERIFIED и `FAIL STATE:conflicting-set-requests`, как на P0.
- Stand-тесты: `node --test test/stand-*.test.js` → 33/33 pass, из них 3 новых.
- Регресс изменения stand-sandbox (изолированная копия без .git и соседнего репозитория, весь test/): 1163 теста, pass 818 / fail 345, loadFail 0. Все 345 fail приходятся на RED-тесты E2 (current-e2*), не-E2 провалов 0. Ни одного `<async-error>`, `<timeout>` или ложного load-fail. Software-check изолированно: PASS 199 / FAIL 1 / NV 7 — как в E2-runner «до». Тесты требований и семантику симулятора изменение не затрагивает: меняются только классификация TAP и правило kill.
- Дословно not ok (baseline software-check, не мой эффект): `FAIL STATE:conflicting-set-requests`.

## Допущения и пределы доказательства

- Kill только по ERR_ASSERTION — это ужесточение. Тест, выражающий ожидание через `throw Error` (например, «preparation failed» в plc-pulse, «Fixture ERROR» в rnd-down-no-reenergy), даст категорию exception, а не kill. На F1-пилоте таких 0. Для G3 авторам тестов стоит выражать поведенческие ожидания через assert.
- Детектор `<async-error>` опирается на текст node 22.22 («A resource generated asynchronous activity…», uncaughtException/unhandledRejection). При смене версии node это нужно перепроверить, stand-тест это ловит.
- Изменение стенда: файл без TAP с ненулевым exit теперь load-fail (раньше — молча 0 тестов). В изолированном прогоне таких 0.
- Ограничения семантики симулятора — в FB_SEMANTICS.md. Мутанты — атрибутные ошибки модели, а не нативно валидные правки.

## Вопросы аналитику/Вадиму

Нет.

## Что передать следующему и кому

- **Тестировщику (через ведущего):** SHA-pin при загрузке модуля в `test/helpers/v2-structural.js:9` делает 9 из 25 мутаций пилота неубиваемыми для DOOR06/HV/LV/UNLOCK07-hold. Если эти тесты должны убивать мутации, проверку идентичности нужно вынести из загрузки модуля в отдельный структурный тест. Существующие тесты я не трогал. Новый — только `test/stand-sal-mutation-kill.test.js`.
- **Архитектору (G3):** в пилоте нет мутаций по блокам F1 (FBAnd23, FBAnd24, RUN_DOWN_OWNER, RUN_DOWN_RESET, SafeResumption/MODE/OrIn3), их нужно включить в план среза. Отчёт теперь разделяет категории, kill засчитывается только по assert.
- **Ведущему/ревьюеру:** у 9 STRUCTURAL-ONLY нет behavioural kill. Для G3 не принимать их как убитые.
