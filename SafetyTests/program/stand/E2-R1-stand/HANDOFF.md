# Handoff — E2-R1-stand (S1, S14, S15)

Срез / роль / дата: E2-R1-stand / v2-stand-engineer / 2026-10-21

Источник:
- canonical F1: SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3, SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104, diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603 (не менялся)
- кандидат R1 (native, `candidates/E2-R1/native/`, только чтение): SAL ca841a01fe44f776a5868968fde70cce728657aaf411d6b8bfa6689cfadc7bb3, SGVL 4f205138337ea3de3660d5ef2d8978db438e3e8d19f2e9dd393ec7a5816cdb36, diagram b82aa41a6ee065267852d78ccaff961714eca1e8e8c006f087de715fb2a137b6

## Сделано

### S1. Пустая самозакрытая сеть `<Network …/>`
- `src/sal-parser.js`: `elements()` читает обе формы: `<tag …>body</tag>` и `<tag …/>` (пустое тело, `selfClosing:true`); функция экспортирована для теста. Дополнительный guard: если тело Network содержит ещё один `<Network`, парсер бросает `Malformed SAL: Network X contains a nested <Network>` — никакого тихого слияния сетей.
- `src/sal-mutations.js` `locateBlock()`: тот же дефект в regex сети (мутационный фреймворк на native-кандидате) — исправлен; блок в пустой сети не находится («found 0»), следующая сеть не поглощается.
- Прочие читатели: `sal-native-structure.js`, `boot-source-inventory.js`, `sal-binding-validator.js` используют токенизатор с поддержкой `/>` — дефекта нет. В кандидате R1 самозакрытые только 3 Network (N4/N5/N9); `variable`/`fB*`/контейнеры блоков самозакрытыми не встречаются. `scripts/implement-early-sto.js` (исторический одноразовый скрипт реализации, в рантайме тестов не используется) содержит такой же regex — не трогал.
- F1 эквивалентность: модель `parseSalFile(F1)` до/после побайтно идентична (JSON без пути файла, sha256 2a31c0663a045e449072bd39528065c30aa48864630d14204d3429ef8d363300, 14 сетей / 242 FB / 75 переменных). Плюс тест сверяет новый `elements()` с прежним regex на F1 (атрибуты и тела всех 14 сетей).
- R1: прежний regex — 11 сетей (`Network4:36 (swallows Network5+Network6)`, `Network9:2 (swallows Network10)`); после исправления — **14 сетей**: N4:0, N5:0, N6:36, N9:0, N10:2; итого 215 FB, 1832 порта, 75 переменных; binding audit PASS, 163 global refs, 277 wires — совпадает с inventory редактора. `check:software` на кандидате больше не падает в physical-rnd-source (`//Network4/FBDecouple2/DecIn6`), доходит до полного отчёта.

### S14. Инъекция в удалённые Symbols (`src/current-code-checks.js`)
- Перед исполнением кейса проверяется: у каждого инжектируемого имени есть активный потребитель (input-порт с global/variable) в исполняемых сетях, у каждого наблюдаемого — производитель. Иначе кейс = **ERROR** `INJECTION_POINT_MISSING …` с перечнем имён («case premise does not exist in this source; it is not evaluated (no PASS/FAIL)»). Применено к STATE:* (инъекция команд + наблюдение 8 фаз `b_<phase>`), STATE:conflicting-set-requests и PRIORITY:* (засев фазы через safeRs, пишущий `GVL1.b_<phase>`; потребитель входа события; производители out_HV_C2/out_LV_C1/out_Door_Unlock_Solonoeid/b_EStop_Ok).
- На F1 результаты currentCodeChecks побайтно те же (152 кейса, PASS 151 / FAIL 1).
- На R1: **FAIL→PASS `STATE:conflicting-set-requests` из регресса редактора — ложный** (инжектируемый `b_Step1_Set` никем не читается, конфликт не создаётся); теперь ERROR. Также ложными были PASS→FAIL STATE:Safe-RnD-Run/Emergency-removal (нет потребителей `b_Step1_Set`, `b_Step3_Set_3`, `b_Step1_Set_2`).
- **Новая находка (не было в таблице S1–S15):** на R1 32 кейса PRIORITY:Step2:* и PRIORITY:Step6:* оставались PASS, хотя фаза не засевалась (FBRs2 удалён планом; у FBRs6 снят Symbol `b_Step6`, C-R1-2а) — вакуумные PASS. Теперь ERROR. STATE:Run-RnD/RnD-Safe на R1 тоже не могли наблюдать S2/S6 → ERROR.

### S15. Исчезающие кейсы видимы
- `src/case-id-diff.js` + `scripts/software-check.js`: сверка ID кейсов с закреплённой базой `fixtures/case-baselines/F1-04b45456.cases.json` (207 кейсов F1, sha256 93aa3d81774d977ee2421f37cca728f67843f7b9a3d3f5f70f2d1a78341b9d29): MISSING/NEW/CHANGED/дубликаты — в консоль, в `SOFTWARE_CHECK_RESULTS.json` (`caseIdDiff`) и раздел MD. Переопределение: `SAL_CASE_BASELINE=<json>`.
- Расширение по тому же принципу: имена top-level тестов каждой стадии (harness/historical/current) против `fixtures/case-baselines/F1-04b45456.tests.json` (228/75/845, sha256 f75461bb30fb7675b6f38fa95405998709536cb662b2ba062037ee68e29546e0) → `stageTestDiff`; `SAL_TEST_BASELINE` для переопределения. Причина: на R1 из harness тихо исчезают ещё 16 генерируемых тестов `OBS-TON //Network5/FBTon1…4 fixed1/2/5/10` (`test/timer-observed-clock.test.js`), а в current — 84 теста упавших при загрузке 8 файлов (S2).
- Сверка информационная: статусы и код выхода не меняет. Базу не обновлять, чтобы скрыть исчезновение; новая база — отдельный именованный файл.

### Прочее
- `fixtures/stand-f1-04b45456/` — замороженные F1 SAL/SGVL (SHA проверяются в тесте) для stand-самотестов, чтобы они проверяли стенд и не ломались при переносе R1 в canonical.
- Новые stand-тесты: `test/stand-sal-parser-empty-network.test.js` (5), `test/stand-case-guards.test.js` (5). На старом src (только с экспортом `elements`) 6 из них падают (S1 4, S14 2) — тесты чувствительны к дефекту.

## ID матрицы и их новый статус
Не менялись (стенд).

## Команды воспроизведения (из `SafetyTests/`)
```
node --test test/stand-sal-parser-empty-network.test.js test/stand-case-guards.test.js
npm run check:software            # в изолированной копии src/stand-sandbox.js createSandbox (без .git)
```
Изолированные копии: `scratchpad/r1stand/{before,f1final,r1final}` — `createSandbox` из рабочего дерева; R1 — оверлей трёх файлов кандидата на пути canonical. Чтобы до/после сравнивали только мои правки, в f1final/r1final файлы других ролей, изменённые за время работы (`SCENARIO_DECISIONS.md`, `test/current-e2d-unlock-cover.test.js`), возвращены к снимку before. В рабочем дереве `npm run check:software` не запускал (тестировщик параллельно правит current-*, счёт был бы несопоставим, а корневые RESULTS-файлы перезаписались бы).

## Результаты (логи и выдержки — в этой папке)

| Прогон | harness | historical | current | SAL cases | exit |
|---|---|---|---|---|---|
| F1 до (`f1-before-check.log`) | PASS 218/218 | PASS 75/75 | FAIL 503/845 (340 fail) | PASS 199, FAIL 1, NV 7, ERROR 0 | 1 |
| F1 после (`f1-after-check.log`, `f1-after-diffs.json`) | PASS 228/228 (+10 моих stand) | PASS 75/75 | FAIL 503/845 (340 fail) | PASS 199, FAIL 1, NV 7, ERROR 0 | 1 |
| R1 native (`r1-native-check.log`, `r1-native-diffs.json`) | ERROR 204/212 (8 fail) | PASS 75/75 | FAIL 249/769 (520 fail) | PASS 159, FAIL 0, NV 5, ERROR 38 | 3 |

- F1 после: current — имена и статусы всех 845 тестов совпадают с до; `cases` в JSON идентичны; сверка с базой — 0 missing/new/changed во всех разделах.
- R1, кейсы vs база: MISSING `TIMER://Network5/FBTon1…4` (PASS), `BOOT:UNSUPPORTED_UNBOUND_PROGRAM_INPUT`, `BOOT:UNSUPPORTED_GROUP_LIFECYCLE` (NV); NEW `BOOT:SOURCE_REJECTED` (ERROR); CHANGED 37: STATE ×5 →ERROR, PRIORITY:Step2 ×16 и Step6 ×16 PASS→ERROR (S14).
- R1, harness not ok дословно: 6× `BOOT …` (S12), `Software package executes working SAL components and preserves explicit assumptions` (test/current-code-checks.test.js, assert 0 ERROR — следствие S14, см. ниже), `SAL-SEM03 unconnected Decouple inputs are reported and sensitive to the chosen assumption` (S13); MISSING 16 OBS-TON.
- R1, current: 84 MISSING, 8 NEW — это 8 файлов, упавших при загрузке (S2), 172 смены статуса — структурные пины S3–S11; поведенческий вердикт R1-01(b) этим прогоном не доказан.

## Затронутые тесты (сообщить тестировщику через ведущего)
- `test/current-code-checks.test.js` «Software package executes…» требует 0 ERROR; на F1 PASS, на R1 FAIL из-за S14 (ERROR вместо прежних ложных PASS/FAIL). Ослаблять нельзя; нужна миграция наблюдения фаз (ниже).
- Остальные структурные пины, только перечень (дело тестировщика): S2 `test/helpers/v2-structural.js` SHA F1 (8 файлов); S3 `test/helpers/full-program-source.js` blockCount=242; S4 `test/helpers/e2-lifecycle.js` STAGES_REQUIRED ∋ `b_Step6`; S5 `current-early-sto` `b_Set_STO_DR1`; S6 `current-plc-pulse-set-permit` Network5; S7 `current-safe-run-gestures`; S8 `current-mentee-set-permit`; S9 `current-rnd-down-no-reenergy`; S10 `current-native-structure`; S11 `current-safe-input-slots`; S12 `boot-preflight.test.js` + `BOOT_PREFLIGHT_SOURCE_MANIFEST.json`; S13 `test/sal-semantics.test.js` SAL-SEM03 (файл в моём владении — мигрирую по решению ведущего: предмет DEC-3 удалён с N4).
- Новое S15b: `test/timer-observed-clock.test.js` — 16 OBS-TON по удалённым таймерам исчезают (ожидаемо по плану, теперь видно в `stageTestDiff`). Владелец файла не указан в моём списке — назначить.

## Допущения и пределы доказательства
- Изменение парсера — формат XML, не семантика FB; на F1 модель побайтно та же. Семантика runtime не менялась.
- S14 проверяет наличие точки инъекции/наблюдения, не правильность выбора; кейсы BUTTON:* и ESTOP:* этой проверкой не охвачены (BUTTON инжектирует имена, часть которых в Network12 не читается и на F1 — включение изменило бы F1).
- Наблюдение фазы только через Symbol `b_<phase>`. Для R1 нужен выбор: Step2 удалён планом (исключить из `phaseNames`?), Step6 наблюдать через `//Network3/FBRs6/RsOut` (C-R1-2а). Не реализовано, чтобы не выдумывать точку наблюдения; до решения STATE/PRIORITY:Step2/Step6 на R1 — ERROR.
- MISSING не влияет на код выхода `check:software`.
- Случайно перезаписал файл чужого агента `scratchpad/mk.mjs` в общем scratchpad (затем перенёс свой в `scratchpad/r1stand/`); содержимое прежнего файла не восстановить.

## Вопросы аналитику/Вадиму
Нет поведенческих вопросов.

## Что передать следующему и кому
- Ведущему/архитектору: решение по наблюдению фаз после R1 (Step2 убрать из матрицы? Step6 через FBRs6.RsOut?) — затем я мигрирую `current-code-checks.js`/`emergency-phase-matrix.js`; решение, должны ли MISSING влиять на код выхода; владелец `timer-observed-clock.test.js` (S15b); разрешение мигрировать SAL-SEM03 (S13).
- Тестировщику: S2–S13 и `current-code-checks.test.js` (выше); повторный R1-01(b) на native SHA ca841a01… теперь возможен (S1 устранён); перед G3 смотреть `caseIdDiff`/`stageTestDiff` в отчёте.
- Ревьюеру: diff `src/sal-parser.js`, `src/sal-mutations.js`, `src/current-code-checks.js`, `src/case-id-diff.js`, `scripts/software-check.js`.
