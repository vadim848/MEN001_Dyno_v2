# Handoff — E2a-core (кольцо стадий, HEALTH_GUARD, полярность N11, переименование), кандидат G2

Срез / роль / дата: E2a-core / v2-editor / 2026-10-22

Основание:
- PLAN.md v4 `c57da896…` (= PLAN.v4.md), §3 E2a п.1–3, 5, без п.4 (E2a-RC) и без E2a-PLC.
- Во время работы архитектор выпустил v5: PLAN.md `b90eff7c…`, PLAN.json `2dfce7e0…`. По v5 E2a-core
  «без изменений», есть addendum A4. Скрипт staging закреплён на SHA v5.
- Ревью плана v4: A4-1…A4-5, A4-7 — правки документов архитектора, логику SAL не меняют. Разбор ниже.
- Состав, заданный ведущим. Сверх E2a п.1–3 он включает два пункта, которые PLAN v4/v5 относят к E2b
  (подробно в «Отклонениях», D-1):
  - g7 в Reset S1 (B3-4);
  - переносы порядка B3-1/B3-2.

## Источник

База — кандидат R1, скопирован побайтно в `program/editor/E2a/source/`, SHA сверены:
- SAL `ca841a01fe44f776a5868968fde70cce728657aaf411d6b8bfa6689cfadc7bb3`
- SGVL `4f205138337ea3de3660d5ef2d8978db438e3e8d19f2e9dd393ec7a5816cdb36`
- diagram `b82aa41a6ee065267852d78ccaff961714eca1e8e8c006f087de715fb2a137b6`

Native-structure preflight источника — PASS: 14 сетей, 215 FB, 1832 порта, 75 SAL-переменных, 277 wire,
0 межсетевых.

## Кандидат

Native-сохранён, лежит в `SafetyTests/candidates/E2a/native/`:
- SAL `5648e31cec9fea6d82ed2392a4be21a26c599eb4872969f5adab2ef3b87fd40b` (Crc=522332563)
- SGVL `e60698840e556dbd6d838958eadb8545735a81aaff8efbfceabc3613a4e08010` (Crc=99786432)
- diagram `27d7f20d890d48fc175fbd25af21a5b0c874ce4cf248b37ac73df26fe0624785`

Staging — текстовая правка, CRC источника не тронут, `program/editor/E2a/staged/`:
- SAL `84bec17e…58aa`
- SGVL `e432f732…96c5`
- diagram `6ccb01bb…1a13`

Прочее:
- Canonical `MEN001_Dyno/` не менялся: `git status MEN001_Dyno` пуст.
- PLC, tsproj, .sds и splcproj не трогал.

ID матрицы и их новый статус: не менялись. Это кандидат до G3/G4.

## Inventory

| | R1 | E2a-core | план |
|---|---|---|---|
| Сети | 14 (N4/5/9 пустые) | 14 | 14 |
| FB | 215 | **215** (−FBOr6, −FBOr11, +HEALTHY_OK, +HEALTH_GUARD) | 215 |
| Порты | 1832 | **1832** | 1832 |
| Symbols SGVL | 65 | **65**: те же имена и Id | 65 |
| SAL-переменные | 75 | **75**: те же Id, 4 атрибута `name` переименованы | 75 |
| wiredLink | 277 | 275 (−8, +6) | — |
| global refs = SGVL FbPortUsage | 163 = 163 | 168 = 168 (−6, +11) | — |
| SAL fbPortUsage / alias usage | 223 / 76 | 223 / 76 | — |
| Фигуры FB / порты / connectors | 215 / 1832 / 277 | 215 / 1832 / 275 | — |
| safeTon (таймеры) | 15 | 15, параметры без изменений | — |

## Что сделано

Все изменения сделаны скриптом `tools/make-e2a.mjs` строго по PLAN.json E2a-core и составу ведущего.

**Кольцо стадий (п.1):**
- N3/FBOr1.OrIn3 := `b_Step12_Set` (g2);
- **N3/FBOr1.OrIn4 := `b_Step4_Set` (g7, B3-4, по указанию ведущего; PLAN E2a-core: «deactivate»)**;
- N3/FBOr5.OrIn2 := `b_Step4_Set`;
- N3/FBOr7.OrIn2 := `b_Step5_Set`;
- N3/FBOr9.OrIn2 := `b_Step6_Set`;
- N3/FBRs6.Reset := wire FBOr2;
- N3/FBOr11 удалён;
- N3/FBRs8.Set := `b_Step12_Set`;
- N3/FBOr16.OrIn1 := `b_Step_RnD_Set`;
- N3/FBRs7.Set := wire FBOr16;
- N3/FBOr6 удалён;
- N3/FBRs3.Set := `b_Step3_Set_2`;
- N3/FBOr13.OrIn2 := `b_Step4_Set`;
- N6/FBAnd18.AndIn4 := wire N6/FBAnd1 (NC, вход активирован);
- N6/RUN_DOWN_RESET.OrIn1 := `b_Step12_Set_2`;
- N7/FBAnd8.AndIn5 := `b_Step4` (NC, вход активирован).

У всех перепривязанных входов контакт NC — прямой, как в прототипе архитектора.

**HEALTH_GUARD:**
- новый N6/HEALTHY_OK (safeAnd, шаблон N6/FBAnd9): AndIn1 `in_LV_Faulty_FBK` NO, AndIn2 `in_HV_Faulty_FBK` NO;
- новый N6/HEALTH_GUARD (safeOr, шаблон N6/FBOr5): OrIn1 wire RUN_DOWN_OWNER, OrIn2 wire HEALTHY_OK;
- N6/FBAnd9.AndIn6 := wire HEALTH_GUARD (NC);
- AndIn7 деактивирован;
- SAL-usage LV/HV перенесены с FBAnd9.AndIn6/7 на HEALTHY_OK.AndIn1/2 (usage-элементы сохранены, изменён moniker).

**Полярность (п.2):** N11/FBAnd4.AndIn3 NC → NO.

**Переименование (п.3):**
- 4 атрибута `name`: `in_LV/HV_Healthy_FBK` → `in_LV/HV_Faulty_FBK`, `outPLC_LV/HV_Healthy` → `outPLC_LV/HV_Faulty`;
- Id и aliasDeviceIoUsage (sdsId 61 ch7/ch3, sds 89/90 ch1) не изменились;
- в SGVL и diagram этих имён нет.

**Порядок (п.5), всего 215, непрерывно 1…215:**
- голова 14: N3/FBOr2, FBOr1, FBOr16, FBOr13, FBOr5, FBOr7, FBOr9, FBRs1, FBRs8, FBRs7, FBRs3, FBRs4, FBRs5, FBRs6;
- N12/FBAnd15 сразу после N12/FBDecouple1;
- N3/FBAnd2 перед N3/FBAnd1;
- N2/FBAnd11 перед N2/FBAnd91;
- HEALTHY_OK, HEALTH_GUARD — перед N6/FBAnd9;
- **по указанию ведущего (B3-1/B3-2): N12/FBAnd16, SafeResumption/CONNECTORS, CONNECTOR_SCOPE — непосредственно перед N1/FBAnd1**;
- относительный порядок остальных блоков R1 сохранён.

HEALTH_GUARD (до FBAnd9) читает RUN_DOWN_OWNER (позиция 212) из предыдущего скана. Так и задумано
планом/прототипом. Это не отклонение.

**Native save (`tools/native-save.ps1`):**
- установленные writers SALDesigner 1.4.16 и GlobalVariableList, offline;
- фигуры новых блоков, портов и 6 новых wire создал `Diagram.FixUpDiagram` — тот же подход, что в принятом F1;
- CRC вручную не менялся: в staging сохранён CRC источника, новые Crc записал native writer;
- повторный native save детерминирован (те же байты).

## Команды воспроизведения (из `SafetyTests/`)

```
node program/editor/E2a/tools/make-e2a.mjs program/editor/E2a/source program/editor/E2a/staged
powershell.exe -NoProfile -STA -Command "& ([scriptblock]::Create([IO.File]::ReadAllText('program/editor/E2a/tools/native-save.ps1'))) -InputDir 'program/editor/E2a/staged' -OutputDir 'candidates/E2a/native' -ReportPath 'program/editor/E2a/NATIVE_SAVE.json' -StagingJson 'program/editor/E2a/STAGING.json'"
powershell.exe -NoProfile -STA -Command "& ([scriptblock]::Create([IO.File]::ReadAllText('program/editor/E2a/tools/native-save.ps1'))) -InputDir 'candidates/E2a/native' -OutputDir 'program/editor/E2a/reload-unused' -ReportPath 'program/editor/E2a/NATIVE_FRESH_RELOAD.json' -Reload -GeometryFrom 'candidates/E2a/native'"
node program/editor/E2a/tools/self-check.mjs program/editor/E2a/source program/editor/E2a/staged candidates/E2a/native program/editor/E2a/SELF_CHECK.json
node program/editor/E2a/tools/geom-check.mjs program/editor/E2a/source/TwinSafeGroup1.sal.diagram candidates/E2a/native/TwinSafeGroup1.sal.diagram program/editor/E2a/GEOMETRY.json
node program/editor/E2a/tools/invariant.mjs program/editor/E2a/source candidates/E2a/native program/editor/E2a/INVARIANT.json
node program/editor/E2a/tools/run-regression.mjs <label> <candidateDir> <sandboxParent outside repo> program/editor/E2a/regression/<label>
node program/editor/E2a/tools/regression-compare.mjs program/editor/E2a/regression/r1/SOFTWARE_CHECK_RESULTS.json program/editor/E2a/regression/e2a-diag-oldnames/SOFTWARE_CHECK_RESULTS.json program/editor/E2a/regression/R1_VS_E2A_DIAG_OLDNAMES.json
```

## Результаты самопроверок (это не PASS требований)

**Native.**
- Load failed=False.
- Counts: networks=14, variables=75, blocks=215, ports=1832; SGVL count=65.
- Native-метки видимы:
  - HEALTHY_OK.AndIn1/2 = `in_LV/HV_Faulty_FBK`;
  - N11/FBAnd4.AndIn3 = `in_LV_Faulty_FBK`;
  - DecIn2 = `in_False_SI2_CH8`;
  - FBAnd9.AndIn1 = `out_EStop_Status`.
- **Fresh native reload кандидата** (`NATIVE_FRESH_RELOAD.json`):
  - nativeCrcValid=True (SAL+diagram);
  - SGVL FileCrcMismatch=False;
  - те же counts;
  - 2079 фигур, drift 0.

**`SELF_CHECK.json` — 36/36 PASS.**
- staged ≡ native по семантике.
- native-structure preflight PASS: 275 wire, 0 межсетевых, singleton-обёртки.
- binding audit PASS.
- Счётчики 215/1832/65/75/14. wire 277−8+6. global refs = SGVL usages = 168.
- Висящих ссылок, wire, usages и connectors нет.
- Связь SAL-ref ↔ SGVL-usage строго 1:1.
- У каждого Symbol ровно один источник и ≥1 потребитель; набор и Id Symbols не изменились.
- У каждого входа ≤1 источник. У активированных входов источник есть, у деактивированных нет и нет deactivate1.
- Удалены ровно FBOr6/FBOr11, добавлены ровно HEALTHY_OK/HEALTH_GUARD. Их сигнатура портов и атрибутов совпадает с native safeAnd/safeOr.
- Источник и контакт каждого входа плана, плюс соседних входов кольца, сверены поимённо.
- У сохранённых портов только плановые дельты. Wire-дельта точная.
- SAL-переменные: только 4 переименования и 2 переноса usage; alias не изменились.
- Порядок по плану.
- Параметры таймеров не изменились.
- Атрибуты сетей не изменились.
- CRC в staging не тронут.
- Для HEALTHY_OK.AndIn2 (filter 2) источник — FSoE safe input (sds 61). Подстановки стандартного сигнала нет.
- Диаграмма: 215 FB-фигур, 1832 порта, 275 connectors, всё разрешается, фигуры в своих lanes.

**Геометрия, R1-D-2** (`GEOMETRY.json`):
- (a) фигуры: все 2044 сохранённые фигуры на месте. Сдвиг lane = 0 для всех сетей, контейнеры не изменились;
- (b) сдвигов lanes нет;
- (c) 215 FB-фигур, ссылок на FBOr6/11 нет;
- новые фигуры: HEALTHY_OK (31, 135.625), HEALTH_GUARD (17, 163.125) — внутри N6, без перекрытия с другими FB;
- **(a) connectors — не выполнено буквально**, см. D-2.

**Модельная проверка инварианта «≤1 стадия / ровно 1 статус»** (`INVARIANT.json/.log`, `tools/invariant.mjs`):
- стенд-runtime, 1 мс, плант FBK; 25 сценариев архитектора (t10 #2–#11, t11, t15 L1, lifecycle, спуск, Healthy, N11);
- статус по D2-A над памятями стадий; S6 — через `//Network3/FBRs6/RsOut`;
- **E2a-core: 0 нарушений**, R1: 22;
- lifecycle S1 → SR → S3; спуск S3 → SR → S1;
- L1 R&D: EOk падает на e+1 (in_Estop_PLC), как в t15;
- N11: при LV Faulty S12 не уходит в SR, при норме уходит.

## Регресс `check:software` в изолированной копии

Как запускал:
- `createSandbox` стенда в scratchpad вне репозитория. В `candidates/E2a/sandbox` его создать нельзя: стенд запрещает sandbox внутри репозитория.
- Три файла кандидата наложены на пути canonical.
- Логи и результаты — в `regression/<label>/`.

| Прогон | harness | historical | current | SAL cases | exit |
|---|---|---|---|---|---|
| R1 (`r1/`) | ERROR 232/239 | PASS 75/75 | FAIL 334/961 | PASS 177, FAIL 0, NV 5, ERROR 4, N/A 16 | 3 |
| **E2a-core кандидат** (`e2a/`) | ERROR 232/239 | PASS 75/75 | FAIL 244/961 | **не построены**: падение до SAL-кейсов | 1 |
| E2a-core, диагностика со старыми 4 именами (`e2a-diag-oldnames/`, не кандидат) | ERROR 232/239 | PASS 75/75 | FAIL 334/961 | PASS 176, **FAIL 1**, NV 5, ERROR 4, N/A 16 | 3 |

**Кандидат.** `check:software` падает в `src/physical-rnd-source.js:33`:
`Error: Undeclared typed input boundary in_HV_Faulty_FBK` (вызов из `candidate-button-cover.js` → `software-check.js:46`).
- Причина — стендовый пин на старые имена. Файл стоит в plan renameImpact.testsAndStand (A-1).
- current: 91 тест PASS→FAIL, все из-за переименования. Без переименования ни один не меняется:
  - RNDPHYS ×69;
  - UNLOCK07 ×8;
  - SR-SB-*/SR-SC-* ×9;
  - R3PAIR ×2;
  - CVR ×2;
  - EARLYSTO ×1.
- 1 тест FAIL→PASS: `E2a POL-01(b) symbols renamed …`.

**Диагностика со старыми именами vs R1** (`R1_VS_E2A_DIAG_OLDNAMES.*`, `CURRENT_TESTS_R1_VS_E2A.json`):
- harness, historical и current — ни одного перехода по именам тестов;
- SAL-кейсы: один переход PASS→FAIL `STATE:Run-RnD`. Наблюдение `b_Step12_Set_2` → ожидалось Step12, получено Step_RnD. Это структурный пин стенда на старое отображение грантов: в кольце g6 = `b_Step12_Set_2` ставит SR, PLAN §2.1. Он относится к A4-3 v5: STATE-кейсы заменяются E2-01/02/03.

**Тесты среза E2.** На R1 и на кандидате все 474 E2*-теста падают на структурном пине S4:
`stage memory observation point missing: b_Step6`. Его вводит `test/helpers/e2-lifecycle.js` `STAGES_REQUIRED`; Symbol `b_Step6` снят в R1 решением C-R1-2(а).

Чтобы увидеть поведение, сделал **только диагностику** (`E2_TESTS_DIAG_B6.json`, `e2-tests-diag-b6-*.tap`):
- в копиях R1 и кандидата в scratchpad заново выставлен Symbol `b_Step6` на FBRs6.RsOut;
- запуск `test/current-e2*.test.js` с `E2_SOURCE_ROOT`.

Итоги:
- **ни одного PASS→FAIL**;
- E2a: 81 FAIL→PASS (E2-01 ×59, E2-02 ×20, POL-01(b)/(c)); 14 PASS→PASS;
- E2b: 37 FAIL→PASS; E2c: 2; E2d: 26.
- Остались **122 E2a FAIL**, все в известных FAIL/срезах:
  - E2a-RC (исключён) — 20: RUN-CONF ×17, MOD1-01 ×2, FBK-01 ×1;
  - HLT-01, E2c — 22: E2-02 «LV Healthy lost: R&D then R&D→Safe»;
  - выход из S6 / G10_EXIT и энергия в Emergency вне Run, E2b — 62: EMG6-01 EMGREF ×52, refused-Restart ×8, L3/L1 ×2;
  - EMG6-01 EMG-RD-L — 18. Плюс «Restart → only Safe» (E2b) — в них же **«shortened»**: STO_DR1/2 и out_HV_C2 на e+0 при аварии во время спуска Run→R&D, ожидалось окно нормального шага W_N. Причину не атрибутировал: на F1 тест не доходит до предусловия, на R1 падает раньше. По ревью v4 (w11) нарушений Q-T3-1 на стеке E2b нет. Нужна проверка тестировщика/архитектора на G3. Не утверждаю, что это норма или дефект E2a-core.

## Отклонения и вопросы (архитектору через ведущего)

- **D-1. Состав E2a-core.**
  - По указанию ведущего в кандидат включены:
    - N3/FBOr1.OrIn4 := `b_Step4_Set` (g7, E2b п.7, B3-4). PLAN.json v5 E2a-core говорит «OrIn4 deactivate»;
    - переносы порядка N12/FBAnd16, CONNECTORS, CONNECTOR_SCOPE перед N1/FBAnd1 (§2.2 «E2b», B3-1/B3-2).
  - Содержание — дословно из плана, не новое решение. Но в плане это граница срезов E2b.
  - Модель архитектора/ревьюера стек «R1+E2a+эти пункты без остального E2b» не прогоняла. Мой инвариант-прогон на нём — 0 нарушений.
  - Что следует:
    - при принятии E2b не должен повторять эти пункты;
    - мутации M-E2b-30/31/32 (FBOr1.OrIn4 и порядок FBAnd16/CONNECTOR_SCOPE) относятся к этому кандидату.
  - Если нужен строгий v5-состав, правка в `tools/make-e2a.mjs`: OrIn4 → `{deactivate:true}` и убрать 3 строки `moveBefore(…,'Network1/FBAnd1')`. Повтор native save — 1 команда. Без указания не делал.
- **D-2. R1-D-2(a) для connectors.**
  - Native writer с включёнными diagram rules (нужны для FixUpDiagram новых фигур) перекладывает 36 сохранённых connectors и обновляет jump-маркеры ещё у 22:
    - 34 — нормализация вырожденных точек (−1 точка) в N6, N12, RndPhysicalCompact, не связанная с E2a;
    - 2 — реальный обход новой фигуры HEALTH_GUARD (N6: FBAnd14→FBOr4, FBAnd15→FBAnd17).
  - Попытка вернуть точки R1 (`tools/restore-routes.mjs`, `ROUTE_RESTORE*.json/log`) не удалась: повторный native save без FixUp даёт **те же байты**, writer снова нормализует.
  - Это одна попытка, повторять не стал.
  - Фигуры (a), (b), (c) выполнены. Диаграмма — только представление (D-2(d)).
  - Решение «принять native routing» или «разместить новые фигуры иначе» — архитектору.
  - Ещё 2 старые линии N6 проходят через область фигуры HEALTH_GUARD (место выбрал FixUp). Это косметика.
- **D-3. A4-3 (STATE-кейсы стенда).** Решение в v5 есть: заменить E2-01/02/03. Реализация — у инженера стенда/тестировщика. Пока это ERROR ×3 и `STATE:Run-RnD` FAIL (структурный).
- **Условия ревью v4 A4-1…A4-5, A4-7** — правки документов архитектора: SHA, killer M-E2a-21, known FAIL, baselineResources, mu24, классификация §10a. SAL-логику не меняют. В v5 они отражены (§3.1 и PLAN.json baselineResources = R1/512). Решения, которого нет в плане, не требуют.
  - Для G3 из A4-7: ES-06 (N3/FBAnd1.AndIn2), убийца «загрузка без Restart → нет стадии». В кандидате: boot → none, после Restart → S1 (`INVARIANT.log`, последний сценарий).

## Известные FAIL (после E2a-core, по плану v5 §3.1 + наблюдения)

- Энергия в Emergency вне Run (R&D/S12/SU/StartingRun) и выход из S6 (G10) — до E2b. Видно в EMGREF/EMG4/IL-05a.
- REL-01(e) — до E2b.
- Legacy Bypass в S6 (B4-3) — до ответа/E4.
- HLT-01/HLT-01b/C-1/C-2 — до E2c. E2-02 race, t10 #7/#8: S4 с C2=1, STO=1.
- Healthy в устойчивом Run → Step4 — до E3. Модель: после импульса LV Faulty S4 держится ≥5 с при EOk=1, C2=1, STO=1. То же даёт полный прототип v4.
- STP-I — E3. SafetyFault/HLT-03 — E5.
- E2a-RC (окно 500 мс + 100 мс, R&D/Run) — до среза E2a-RC.
- E2a-PLC — до отдельного шага: PLC и tsproj по-прежнему со старыми именами.
- EMG-RD-L «shortened» — не атрибутировано, см. выше.
- Стенд/тесты (структурные, ожидаемые):
  - S4 `b_Step6` во всех E2-тестах;
  - пины на старые имена в `src/physical-rnd-source.js` и др. (renameImpact): 91 current-тест и падение `check:software`;
  - STATE ×4 (A4-3);
  - BOOT harness ×6 + «Software package…» (S12, как на R1).

## Допущения и пределы доказательства

- Native CRC — offline-проверка файлов установленными writers. **NV:** IDE Verify/Build, CRC проекта/target, input-rule в IDE, NV-страницы, допустимость пустых сетей.
- Инвариант и прогоны E2-тестов — модель стенда (`unconnectedInput:false`), а не native-семантика. Диагностические копии со старыми именами и с `b_Step6` — не кандидаты.
- Независимого тестировщика самопроверки не заменяют. Требования «PASS» не заявляю.
- PLAN.md менялся во время работы (v4 → v5). E2a-core в v5 объявлен неизменным; реализован по v4/v5 + состав ведущего.

## Что передать следующему и кому

- **Ведущему/архитектору:** D-1 (состав и граница с E2b), D-2 (routing connectors).
- **Инженеру стенда / тестировщику:** миграция пинов на имена `*_Faulty` (renameImpact), S4 `b_Step6`, A4-3. После этого — G3 на SHA `5648e31c…`. Подставить `sourceSha256` в MUTATION_PLAN_E2a (FILL_AT_G2).
- **Тестировщику:** проверить EMG-RD-L «shortened».
- **Ревьюеру (G4):** материалы этой папки. Перенос в canonical — только по указанию ведущего после G4.

## Заблокированные действия (ответ ведущему, 2026-10-22)

- Окно «3 consecutive actions were blocked» вызвал не я. Команд вида grep `</Network>`, grep `in_False_SI2_CH8` или head `.diagram` по canonical я не запускал.
- Заблокировано было одно моё действие: `sleep 600; cat …` (ожидание регресса). Его отклонил harness как «sleep followed by …», а не отказ в доступе к canonical. Блокировку я не обходил: заменил команду ожиданием через until-цикл по появлению логов, без доступа к canonical.
- Других отказов не было.
- Canonical я только читал, ничего в нём не менял (`git status MEN001_Dyno` пуст):
  - `git show HEAD:MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl | grep b_Step6` — посмотреть исходное определение Symbol;
  - `grep` по `Alias Devices` — найти SDS 61;
  - `cp` canonical SAL/diagram/SGVL в scratchpad (`f1root`) — прогнать тест EMG-RD-L на F1.
