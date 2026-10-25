# Handoff — E2-R1-stand-2 (решения ведущего 1–4: наблюдение фаз, ожидаемые дельты, S15b, S13)

Срез / роль / дата: E2-R1-stand-2 / v2-stand-engineer / 2026-10-21

Источник:
- canonical F1 (не менялся): SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3, SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104, diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603
- кандидат R1 (только чтение, `candidates/E2-R1/native/`): SAL ca841a01fe44f776a5868968fde70cce728657aaf411d6b8bfa6689cfadc7bb3, SGVL 4f205138337ea3de3660d5ef2d8978db438e3e8d19f2e9dd393ec7a5816cdb36, diagram b82aa41a6ee065267852d78ccaff961714eca1e8e8c006f087de715fb2a137b6

## Сделано

### 1. Наблюдение фаз через выход RS стадии
- `src/emergency-phase-matrix.js`: `PHASE_RS` (Step1..Step6, Step_RnD, Step12 → `//Network3/FBRs1..8`). `resolvePhaseObservers()` заново проверяет привязку на каждом источнике:
  - якорь есть → наблюдение и засев через `<якорь>/RsOut`; если Symbol `b_<phase>` пишет любой safeRs, это должен быть только якорь, иначе ERROR `PHASE_OBSERVER_MISMATCH`. При каждом наблюдении проверяется, что Symbol равен выходу RS, иначе ERROR `PHASE_SYMBOL_DIVERGES`;
  - якоря нет и `b_<phase>` никто не пишет → **NOT APPLICABLE** (`PhaseNotApplicable`, «structurally removed»);
  - якоря нет, а Symbol пишет другой блок, нет Network3 или нет ни одного якоря → ERROR.
  - `runPhaseCase` засевает и наблюдает через якорь. `runPhaseMatrix` для удалённой фазы выдаёт явные строки `status:"NOT APPLICABLE"` без trace.
- `src/current-code-checks.js`: STATE/PRIORITY переведены на `resolvePhaseObservers` и `activePhases`. Новый статус кейса — `NOT APPLICABLE` (с `reason`, `phase`, `anchor`). Кейсы STATE, у которых часть фаз удалена, исполняются и несут `phasesNotApplicable`. Требование «производитель наблюдаемого Symbol b_<phase>» (S14) заменено этим механизмом. Проверка потребителя для инжектируемых имён сохранена.
- `scripts/emergency-phase-report.js` перечисляет NOT APPLICABLE фазы отдельно.
- `scripts/software-check.js`: в `summary` добавлен ключ `NOT APPLICABLE`. В MD появился раздел «NOT APPLICABLE (структурно удалённые фазы; не PASS)» с перечнем кейсов и фаз.
- Эквивалентность на F1: `currentCodeChecks` на закреплённом F1 до и после побайтно одинаков (152 кейса, sha256 JSON ab20df4a…). `runPhaseMatrix` до и после одинаков на F1 (24594e9e…) и на исторической фикстуре v2-4bb8703 (740a0941…), её использует `sal-emergency-phases.test.js`.

### 2. MISSING и код выхода
- `src/case-id-diff.js`: `loadExpectedDeltas` и `reconcileDeltas`. Объяснения требуют три вида дельт: MISSING-кейс, MISSING top-level тест по стадиям и кейс NOT APPLICABLE. Файл: `fixtures/case-baselines/expected-deltas/<SAL sha256>.json` или `SAL_EXPECTED_DELTAS=<файл>`.
  - Файл привязан к SHA SAL (несовпадение → исключение, exit 3) и к SHA обоих базовых файлов (несовпадение → файл игнорируется, `baselineMismatch`).
  - У каждой записи обязателен непустой `reason`.
  - Объясняет только `approval.status === "APPROVED"` с непустым `approval.by`. DRAFT показывается как «DRAFT-ONLY (not approved)» и на код выхода не влияет.
  - Записи, которые ожидались, но не наблюдались, выводятся как STALE (только отчёт).
- Код выхода `check:software`: 3 — ERROR; **4 — есть необъяснённые MISSING/NOT APPLICABLE**; 1 — FAIL; 2 — NV; 0. NEW и CHANGED по-прежнему только в отчёте.
- Черновики (status DRAFT, «черновик, не утверждён»):
  - `expected-deltas/ca841a01….json` (R1): 4 × TIMER://Network5/FBTon1..4; 2 BOOT-кейса с пометкой «не плановое удаление, следствие S12 manifest, решить ведущему»; 16 × PRIORITY:Step2:* (NOT APPLICABLE); 16 OBS-TON //Network5/FBTon1..4 × fixed1/2/5/10; переименованный stand-тест (п. ниже). 84 MISSING current-* (8 файлов падают при загрузке, S2) **намеренно не включены**: это пробел миграции тестов, а не плановое удаление.
  - `expected-deltas/04b45456….json` (F1): одна запись — переименованный stand-тест.

### 3. S15b (`test/timer-observed-clock.test.js`)
Файл не менял. OBS-TON по-прежнему генерируются по safeTon источника. Удалённые таймеры видны как MISSING в `stageTestDiff`, требуют утверждённой записи в expected-deltas (в черновике R1 16 записей), иначе exit 4/3.

### 4. S13 SAL-SEM03
Имя теста сохранено. Тест больше не зависит от Network4: берётся клон реального safeDecouple источника, отвязанный от проводки, DecIn7 не подключён, DecIn1 подаётся явно. Проверяется: выход DecOut7 = допущению (FALSE/TRUE), порт попадает в `assumedUnconnectedPorts`, подключённый вход от допущения не зависит и в реестр не попадает. PASS на F1 и R1 (на R1 до изменения был FAIL).

### Stand-тесты
- Новые: `test/stand-phase-observers.test.js` (4: D1 F1-якоря; удалённый FBRs2 → NOT APPLICABLE только Step2 и не PASS; Symbol на чужом RS, нет якоря при наличии Symbol, нет Network3 → ERROR; расхождение Symbol и RS → ERROR) и `test/stand-expected-deltas.test.js` (4).
- `test/stand-case-guards.test.js`: тест «S14: unwritten observed phase Symbol makes STATE and PRIORITY cases ERROR, not PASS» **переименован** в «S14/D1: removed phase Symbol is observed at its state RS output, not turned into ERROR or vacuous PASS». Решение 1 отменяет правило, которое он утверждал: при снятом `b_Step6` статусы STATE/PRIORITY:Step6 должны совпадать с F1, а Step6 наблюдаться через FBRs6.RsOut.
- Чувствительность: на прежнем src (новые тесты в копии before) не проходят S14/D1, а оба новых файла падают при загрузке (нет экспортов). Остальные 7 проходят.

## ID матрицы и их новый статус
Не менялись (стенд).

## Команды воспроизведения (из `SafetyTests/`)
```
node --test test/stand-phase-observers.test.js test/stand-expected-deltas.test.js test/stand-case-guards.test.js test/sal-semantics.test.js
npm run check:software                     # в изолированной копии (createSandbox, без .git)
SAL_EXPECTED_DELTAS=<file> npm run check:software
npm run audit:phases
```
Изолированные копии: scratchpad `e2r1s2/{before,f1after,r1before,r1after}`. before — `createSandbox` из рабочего дерева. r1before — копия before с тремя файлами кандидата R1 на путях canonical (SHA проверены). *after — копия соответствующего before с наложением только моих 11 файлов (ниже). Поэтому параллельные правки current-* тестировщика в сравнение не попали.

## Результаты (логи и диффы — в этой папке)

| Прогон | harness | historical | current | SAL cases | exit |
|---|---|---|---|---|---|
| F1 до (`f1-before-check.log`) | PASS 228/228 | PASS 75/75 | FAIL 503/850 (345 fail) | PASS 199, FAIL 1, NV 7, ERROR 0 | 1 |
| F1 после (`f1-after-check.log`, `f1-diffs.json`) | PASS 236/236 | PASS 75/75 | FAIL 503/850 (345 fail) | PASS 199, FAIL 1, NV 7, ERROR 0, N/A 0 | **4** |
| R1 до (`r1-before-check.log`) | ERROR 204/212 | PASS 75/75 | FAIL 249/774 | PASS 159, NV 5, ERROR 38 | 3 |
| R1 после (`r1-after-check.log`, `r1-diffs.json`) | ERROR 213/220 | PASS 75/75 | FAIL 249/774 | PASS 177, NV 5, ERROR 4, N/A 16 | 3 |

- **F1:** все 207 кейсов идентичны по ID, статусу и полному содержимому JSON. current — те же имена и статусы, historical тоже. harness: −1 (переименованный тест), +9 новых stand-тестов, все PASS. **Exit 1→4** — единственная причина: MISSING переименованного stand-теста, черновик F1 не утверждён. Офлайн-симуляция утверждения (`approval` подменён меткой «SIMULATION-ONLY», не ведущий) на тех же результатах даёт exit 1, то есть прежний.
- **R1 после относительно R1 до:**
  - кейсы: STATE:Run-RnD и STATE:RnD-Safe ERROR→PASS (Step6 через FBRs6.RsOut, Step2 = NOT APPLICABLE, отражено в `phasesNotApplicable`); PRIORITY:Step6 ×16 ERROR→PASS; PRIORITY:Step2 ×16 ERROR→NOT APPLICABLE. Остались ERROR: STATE:Safe-RnD-Run, STATE:Emergency-removal, STATE:conflicting-set-requests (INJECTION_POINT_MISSING: `b_Step1_Set`, `b_Step3_Set_3`, `b_Step1_Set_2` в R1 никто не читает) и BOOT:SOURCE_REJECTED;
  - harness: SAL-SEM03 FAIL→PASS.
- R1, сверка дельт: 123 дельты, все не объяснены (черновик). При симулированном утверждении остаются 84 UNEXPLAINED current-* (S2) и exit 3 (ERROR).
- R1, harness not ok дословно (7): `BOOT preflight owns fresh full-source parsing, all native inventory and exact two unsupported categories`; `BOOT Network4 lists eight unbound native inputs, seven precise phase writers/readers, unused channel8`; `BOOT declared RunStop/ErrAck are typed connections, not inferred group RUN or main Restart`; `BOOT accepts matching relocated file pairs, portable LF/CRLF without dropping any source attributes`; `BOOT file mutation rejected: alter full-source metadata revision`; `BOOT rejects an unsupported adapter revision rather than inventing group capability` (S12); `Software package executes working SAL components and preserves explicit assumptions` (current-code-checks.test.js, 0 ERROR; теперь из-за 3 STATE ERROR выше).

Изменённые мной файлы (sha256):
- src/emergency-phase-matrix.js 0ca25ab6…; src/current-code-checks.js 249b1851…; src/case-id-diff.js ccd92deb…
- scripts/software-check.js 50ccf840…; scripts/emergency-phase-report.js d3da1aff…
- test/sal-semantics.test.js b4a90539…; test/stand-case-guards.test.js db9bac46…; test/stand-phase-observers.test.js e95833c6…; test/stand-expected-deltas.test.js b14ba27d…
- fixtures/case-baselines/expected-deltas/04b45456….json 1728fa27…; …/ca841a01….json c4b50bd7…

## Допущения и пределы доказательства
- Карта `PHASE_RS` — привязка «фаза = RS, пишущий `GVL1.b_<phase>`» по F1 и v2-4bb8703, а не наблюдения. На каждом источнике она перепроверяется. Для R1 FBRs6 без Symbol (C-R1-2а) якорь сохраняется по пути блока. Если якорь заменят блоком с другим именем, получится ERROR (MISMATCH) или NOT APPLICABLE; в последнем случае без утверждённой дельты будет exit 4. Тихого PASS нет.
- NOT APPLICABLE также требует утверждённого объяснения (exit 4). Это моё расширение решения 2: удалённая фаза равна исчезнувшему покрытию. Если ведущий считает иначе, это одна строка в `reconcileDeltas`.
- Семантика FB/runtime не менялась. Изменены точка наблюдения и засева фаз, а также отчётность.
- STATE-кейсы с инъекциями, удалёнными R1, оставлены ERROR. Выбор новых точек инъекции — вопрос сценария, не стенда.
- Расхождение планов: текущий architect PLAN.md (v4) §8 сохраняет N3/FBRs2 при F1-ребейзе, а кандидат R1 его удаляет по R1-срезу. Это отмечено в reason черновика R1.

## Вопросы аналитику/Вадиму
Поведенческих нет.

## Что передать следующему и кому
- **Ведущему (решения):**
  - (а) утвердить или отклонить черновик F1 `expected-deltas/04b45456….json` (1 запись — переименованный stand-тест). Без утверждения F1 даёт exit 4 вместо 1. Альтернатива — вернуть прежнее имя теста, но тогда имя противоречит решению 1;
  - (б) черновик R1, особенно 2 BOOT-записи (это следствие S12, а не плановое удаление);
  - (в) подтвердить, что NOT APPLICABLE требует утверждения так же, как MISSING.
- **Архитектору:** для R1 нужны точки инъекции STATE:Safe-RnD-Run, STATE:Emergency-removal и STATE:conflicting-set-requests (входы `b_Step1_Set`, `b_Step3_Set_3`, `b_Step1_Set_2` удалены) либо их явное объявление в expected-deltas.
- **Тестировщику:** `test/current-code-checks.test.js` «Software package executes…» на R1 теперь падает только на 3 STATE ERROR выше (Step2/Step6 сняты механизмом). Остальные пины S2–S12 без изменений: 84 MISSING current-* из 8 файлов — их не объясняю. В `summary` появился ключ `NOT APPLICABLE`.
- **Ревьюеру:** diff `src/emergency-phase-matrix.js`, `src/current-code-checks.js`, `src/case-id-diff.js`, `scripts/software-check.js`, `test/sal-semantics.test.js` (SAL-SEM03), а также переименование в `test/stand-case-guards.test.js`.

## Дополнение — решения ведущего по E2-R1-stand-2 (2026-10-21)
- (1) F1 `expected-deltas/04b45456….json`: **APPROVED**, by «lead (main session)», date 2026-10-21, note «утверждено ведущим: переименование stand-самотеста по решению D1». sha256 файла после утверждения — ниже.
- (2) NOT APPLICABLE требует утверждения так же, как MISSING. Подтверждено, реализация не менялась.
- (3) R1 `expected-deltas/ca841a01….json` **не утверждён**: остаётся DRAFT. BOOT-записи снимет миграция манифеста, а 84 current-* — миграция S2. Черновик пересматривается после S2–S13 и решения архитектора по трём STATE-кейсам.
- В `test/stand-expected-deltas.test.js` тест последнего пункта (он появился в этом срезе и в базе его нет) заменён на «D2: committed expected-deltas load, are bound to the pinned baselines; F1 approved by lead, R1 still DRAFT». Тест фиксирует F1=APPROVED (1 запись harness, by lead), R1=DRAFT.
- Изолированный прогон F1 (`f1-approved-check.log`, `f1-approved-diffs.json`): копия «before» без .git плюс мои файлы.
  - harness PASS 236/236, historical PASS 75/75, current FAIL 503/850;
  - SAL-кейсы PASS 199, FAIL 1, NV 7, ERROR 0, N/A 0; относительно «до» 0 изменений по ID, статусам и содержимому;
  - дельты: 1, объяснено 1, **необъяснённых 0**, stale 0;
  - **exit 1** (как до среза).
- Единственный FAIL — прежний известный `STATE:conflicting-set-requests` («conflicting requests cannot report simultaneous Safe and Run», actual true, expected false).
- sha256 после утверждения: `expected-deltas/04b45456….json` 30d0d8e5861657a19986d8dd32dc976d293954b8db9f78340a391e0d0c4277c7; `test/stand-expected-deltas.test.js` 7bfa3ff59c912c5bfe81e3fbb778001b8974fc262be32f7cfce37c27a338970c.
