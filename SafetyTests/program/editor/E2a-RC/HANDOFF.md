# Handoff — E2a-RC (окна WIN_C1/WIN_C2 + DIS-HOLD), кандидат G2

Срез / роль / дата: E2a-RC / v2-editor / 2026-10-22

Основание:
- PLAN v7: PLAN.md `35225c3c…` и PLAN.json `7422ab65…`, только §4 и `slices[E2a-RC]`.
  - Во время работы архитектор выпустил v7.2. Текущие PLAN.md `6557525a…` и PLAN.json `5198d426…`.
  - v7 сохранён как `PLAN.v7_1.*`, SHA те же (35225c3c/7422ab65). Скрипт staging закреплён на них.
  - По `slices[E2a-RC]` v7.2 отличается от v7 только текстом `disHold.e4` (T7-1). Логика E2a-RC не изменилась (сверено структурным diff).
- Ревью `program/reviewer/E2-plan-v7/PLAN_REVIEW.md`: E2a-RC READY FOR EDITOR.

## Источник

База — кандидат E2a-core, скопирован побайтно в `program/editor/E2a-RC/source/`, SHA сверены:
- SAL `5648e31cec9fea6d82ed2392a4be21a26c599eb4872969f5adab2ef3b87fd40b`
- SGVL `e60698840e556dbd6d838958eadb8545735a81aaff8efbfceabc3613a4e08010`
- diagram `27d7f20d890d48fc175fbd25af21a5b0c874ce4cf248b37ac73df26fe0624785`

Native-structure preflight источника и binding audit — PASS (`PREFLIGHT_SOURCE.json`):
14 сетей, 215 FB, 1832 порта, 75 SAL-переменных, 275 wire, 0 межсетевых.

## Кандидат

Native-сохранён, лежит в `SafetyTests/candidates/E2a-RC/native/`:
- SAL `5733552a150bfd33df4211da8f97a8fc993ff990ad52c90a8d7758d950660f3f` (Crc=1618144730)
- SGVL `253de7f39f2c4af83fa8642445a885d18ecfcdccec46fcbf96612d88a810b669` (Crc=1140635775)
- diagram `5fa942384352033814f2d51bf8c4a847098d6a3322d4b733995de64b7b759bb2` (Crc=3835986698)

Staging — текстовая правка, CRC источника не тронут, `program/editor/E2a-RC/staged/`:
- SAL `76303b53…2e6e`
- SGVL `0de79862…444c`
- diagram `d1e57c44…0df7`

Для `MUTATION_PLAN_E2a-RC.json` (`FILL_AT_G2`): `sourceSha256 = 5733552a150bfd33df4211da8f97a8fc993ff990ad52c90a8d7758d950660f3f`.
Файл архитектора я не правил.

Прочее:
- Canonical `MEN001_Dyno/` не менялся: `git status MEN001_Dyno` пуст.
- PLC, tsproj, .sds и splcproj не трогал.

ID матрицы и их новый статус: не менялись. Это кандидат до G3/G4.

## Inventory

| | E2a-core | E2a-RC | план |
|---|---|---|---|
| Сети | 14 | 14 | 14 |
| FB | 215 | **217** (+WIN_C2, +WIN_C1) | 217 |
| Порты in/out | 1832 | **1836** | 1836 |
| Symbols SGVL | 65 | **63** (−`b_Reset_HV_Discharg_Req2`, −`b_Reset_LV_Discharge_Req2`, остальные Id те же) | 63 |
| SAL-переменные | 75 | **75**, без изменений | 75 |
| wiredLink | 275 | 277 (−9, +11) | — |
| global refs = SGVL FbPortUsage | 168 = 168 | 167 = 167 | — |
| SAL fbPortUsage / alias usage | 223 / 76 | 223 / 76 | — |
| safeTon | 15 | 17; новые 0,5 с, параметры прежних без изменений | — |
| Фигуры FB / порты / param / connectors | 215 / 1832 / 17 / 275 | 217 / 1836 / 19 / 277 | — |

Ресурсы сходятся с планом, остановки по этому пункту не было.

## Что сделано

Все изменения сделаны скриптом `tools/make-e2a-rc.mjs` строго по PLAN v7 §4 и `slices[E2a-RC]`.

**4.1 Окна:**
- новый `Network12/WIN_C2` (safeTon, шаблон N12/FBTon3, Delay 0,5 с): TonIn — wire от N12/FBAnd4, NC;
- `N12/FBAnd6.AndIn1` := wire WIN_C2;
  - AndIn2 `in_HV_C2_FBK` NC и AndIn3 `in_HV_Faulty_FBK` NO — без изменений;
- `N12/FBTon3.TonIn` := wire FBAnd6. `FBTon3.TonOut` → wire `N12/FBDecouple2.DecIn1…4`. Прежний FBAnd6 → DecIn1…4 снят;
- новый `Network11/WIN_C1` (safeTon, шаблон N11/FBTon1, 0,5 с): TonIn — wire от N11/FBAnd1;
- `N11/FBAnd4.AndIn1` := wire WIN_C1;
  - AndIn2 `in_LV_C1_FBK` NC и AndIn3 `in_LV_Faulty_FBK` NO — без изменений;
- `N11/FBTon1.TonIn` := wire FBAnd4; `N11/FBAnd5.AndIn1` := wire FBTon1.
- Прежние таймеры 0,1 с (N12/FBTon3, N11/FBTon1) — те же блоки и параметры.

**4.2 DIS-HOLD:**
- `N1/FBOr5.OrIn2` := `b_Set_HV_C2_1`. Это второй targetUsage Symbol, источник N12/FBAnd4.AndOut;
- `N1/FBOr1.OrIn2` := `b_Step12_Set`. Это третий targetUsage;
- `N2/FBAnd91.AndIn4` := `b_EStop_Ok` (TD-05). Вход активирован, NC — прямой контакт, как у остальных входов FBAnd91;
- удалены Symbols `b_Reset_HV_Discharg_Req2` (источник N12/FBAnd6.AndOut) и `b_Reset_LV_Discharge_Req2` (источник N11/FBAnd4.AndOut):
  - до правки у каждого был ровно один потребитель — перепривязанные N1/FBOr5.OrIn2 и N1/FBOr1.OrIn2. Других потребителей нет, скрипт это проверяет (assert);
  - удалены source-ref на выходах и элементы `Variable` в SGVL.
- На выходы окон Symbols не переносились. Межсетевых wire нет.

**Порядок исполнения** (`PLAN.json order`, совпадает с `repro/proto.mjs`):
- N12: FBAnd4(154) → WIN_C2(155) → FBAnd6(156) → FBTon3(157) → FBDecouple2(158);
- N11: FBAnd1(98) → WIN_C1(99) → FBAnd4(100) → FBTon1(101) → FBAnd5(102);
- порядок 1…217 непрерывный, относительный порядок прочих блоков сохранён.

**Native save (`tools/native-save.ps1`):**
- копия инструмента E2a; изменены только ожидаемые счётчики (217/1836/63), метки и имена транзакций;
- фигуры новых блоков, портов (включая param) и 11 новых connectors создал `Diagram.FixUpDiagram`;
- CRC вручную не менялся.

## Команды воспроизведения (из `SafetyTests/`)

```
node program/editor/E2a-RC/tools/preflight.mjs program/editor/E2a-RC/source program/editor/E2a-RC/PREFLIGHT_SOURCE.json
node program/editor/E2a-RC/tools/make-e2a-rc.mjs program/editor/E2a-RC/source program/editor/E2a-RC/staged
powershell.exe -NoProfile -STA -Command "& ([scriptblock]::Create([IO.File]::ReadAllText('program/editor/E2a-RC/tools/native-save.ps1'))) -InputDir 'program/editor/E2a-RC/staged' -OutputDir 'candidates/E2a-RC/native' -ReportPath 'program/editor/E2a-RC/NATIVE_SAVE.json' -StagingJson 'program/editor/E2a-RC/STAGING.json'"
powershell.exe -NoProfile -STA -Command "& ([scriptblock]::Create([IO.File]::ReadAllText('program/editor/E2a-RC/tools/native-save.ps1'))) -InputDir 'candidates/E2a-RC/native' -OutputDir '<scratch>' -ReportPath 'program/editor/E2a-RC/NATIVE_FRESH_RELOAD.json' -Reload -GeometryFrom 'candidates/E2a-RC/native'"
node program/editor/E2a-RC/tools/preflight.mjs candidates/E2a-RC/native program/editor/E2a-RC/PREFLIGHT_NATIVE.json
node program/editor/E2a-RC/tools/self-check.mjs program/editor/E2a-RC/source program/editor/E2a-RC/staged candidates/E2a-RC/native program/editor/E2a-RC/SELF_CHECK.json
node program/editor/E2a-RC/tools/geom-check.mjs program/editor/E2a-RC/source/TwinSafeGroup1.sal.diagram candidates/E2a-RC/native/TwinSafeGroup1.sal.diagram program/editor/E2a-RC/GEOMETRY.json
node program/editor/E2a-RC/tools/conn-ends.mjs program/editor/E2a-RC/source/TwinSafeGroup1.sal.diagram candidates/E2a-RC/native/TwinSafeGroup1.sal.diagram program/editor/E2a-RC/CONNECTOR_ENDS.json
node program/editor/E2a-RC/tools/model-rc.mjs program/editor/E2a-RC/source candidates/E2a-RC/native <scratch>/rc-mut program/editor/E2a-RC/MODEL_RC.json
node program/editor/E2a-RC/tools/run-regression.mjs <label> <candidateDir> <sandboxParent outside repo> program/editor/E2a-RC/regression/<label>
node program/editor/E2a-RC/tools/regression-compare.mjs program/editor/E2a-RC/regression/e2a-core/SOFTWARE_CHECK_RESULTS.json program/editor/E2a-RC/regression/e2a-rc/SOFTWARE_CHECK_RESULTS.json program/editor/E2a-RC/regression/E2A_CORE_VS_E2A_RC.json
```

## Результаты самопроверок (это не PASS требований)

**Native** (`NATIVE_SAVE.log`, `NATIVE_FRESH_RELOAD.json/.log`):
- Load failed=False, counts 14/75/217/1836, SGVL 63.
- 8 native-меток видимы и совпадают, среди них:
  - N12/FBAnd6.AndIn2/3 = `in_HV_C2_FBK` / `in_HV_Faulty_FBK`;
  - N11/FBAnd4.AndIn2/3 = `in_LV_C1_FBK` / `in_LV_Faulty_FBK`.
- **Fresh reload кандидата:** nativeCrcValid=True (SAL+diagram), SGVL FileCrcMismatch=False, 2087 фигур, drift 0.
- **Детерминизм** (`NATIVE_RESAVE_DETERMINISM.log`):
  - повтор полного staged→native даёт те же байты SAL и SGVL;
  - diagram совпадает с точностью до Id элементов и CRC: FixUp создаёт новые фигуры и connectors со случайными Id;
  - повторный save кандидата без FixUp нормализует вырожденные точки нескольких connectors — тот же эффект, что в E2a D-2. Только представление.

**Preflight / binding audit кандидата** (`PREFLIGHT_NATIVE.json`): PASS. 277 wire, 0 межсетевых, singleton-обёртки.

**`SELF_CHECK.json` — 34/34 PASS:**
- staged ≡ native по семантике;
- счётчики 217/1836/63/75/14; wire 275−9+11; global refs = SGVL usages = 167;
- висящих ссылок нет; удалённые Symbols не встречаются ни по имени, ни по Id;
- связь SAL-ref ↔ SGVL-usage 1:1;
- у каждого Symbol ровно один источник и ≥1 потребитель; набор Symbols = источник минус 2, Id прежние;
- usage меняются только у `b_Set_HV_C2_1`, `b_Step12_Set` и `b_EStop_Ok` — у каждого +1 плановый target;
- у каждого входа один источник; активированные входы имеют источник, деактивированные — нет;
- удалённых блоков нет; новые — ровно WIN_C1 и WIN_C2:
  - сигнатура портов совпадает с native safeTon, единственное отличие — timing 0,5;
  - instanceName уникальны;
- источник и контакт каждого входа плана и соседних входов сверены поимённо, fan-out выходов точный;
- у сохранённых портов только плановые дельты; атрибуты меняются только у FBAnd91.AndIn4 (Deactivated → Activated NC);
- wire-дельта точная; SAL-переменные без изменений;
- порядок по плану; параметры прежних таймеров не изменились; атрибуты сетей не изменились;
- CRC в staging не тронут, native записал новые CRC;
- диаграмма: 217 FB-фигур, 1836 port shapes, 19 param shapes, 277 connectors, все разрешаются; фигуры в своих lanes.

**Геометрия, R1-D-2 + дополнение D-2** (`GEOMETRY.json`, `CONNECTOR_ENDS.json`):
- (a) фигуры: 2064 сохранённые фигуры, у всех dx=0 и размер 0. В каждой lane одна общая величина сдвига;
- (b) lane Network11 выросла на 1,335 под WIN_C1. Из-за этого Network12 и RndPhysicalCompact сдвинуты на +1,335, SafeResumption — на +1,285. Сдвиг только от подгонки высоты lane;
- (c) 217 FB-фигур;
- новые фигуры: WIN_C1 (3; 214,275) в N11, WIN_C2 (10; 228,4) в N12 — внутри своих lanes, без перекрытий;
- connectors по D-2:
  - 266 сохранённых connectors сохранили оба порта-конца и wiredLinkMoniker;
  - 9 удалены вместе со своими wire, 11 созданы native;
  - маршрут (точки/jump) у 80 сохранённых изменён native layout: 15 в N12, 64 в RndPhysicalCompact, 1 в SafeResumption. Дополнение D-2 это допускает.

**Модельные сценарии архитектора t16/t18/t20 на реальном кандидате** (`MODEL_RC.json/.log`):
- стенд-runtime, 1 мс, плант FBK. Рядом прогнан E2a-core как база;
- мутанты — `deactivate-input` через `applyMutation`;
- строки BOOT/Bypass (E2b) опущены.

Результаты:
- **t16 совпадает с `repro/t16.out.txt` во всех 13 строках:**
  - Run@cmd+600; fbk700 → +802; HV-глитч и FBK-dip @560 → +663; HV faulty / без FBK → нет;
  - R&D — то же;
  - мутанты: окно bypass → +132, FBK → +600 (база без FBK — нет), HV → +600.
- **t18:**
  - HV: SU в a, запрос FALSE в a+2 = u;
  - отклонённый BOTH при открытой крышке — запрос TRUE;
  - мутант FBOr5.OrIn2 — запрос не снимается;
  - LV: g2 в a, запрос FALSE в a+1; мутант FBOr1.OrIn2 не снимает.
- **t20:**
  - B (отклонённый PLC при открытой крышке): min=1;
  - D (Safe, ES, PLC (1,0)): LV min=1, стадия S1, TD-05 работает. На E2a-core было S12;
  - E: u=a+2, reqOFF=a+2;
  - мутанты убиты: FBAnd4.AndIn2 → FALSE на +4; FBAnd91.AndIn4 → FALSE на +3, S12; FBOr5.OrIn2 → never;
  - **строка C расходится с t20** — см. D-RC-1.
- R6-4 (контекст M-E2a-32): Safe с запросом HV, BOTH Safe→R&D — запрос TRUE без перерыва, далее SR. Достижимость на реальном кандидате показана; сам rebind-мутант не прогонялся.
- **Отклонение скрипта от `repro/run.mjs`:**
  - toRnd: выдержка после жеста 3000 вместо 2500, для обеих баз;
  - причина: с окном R&D наступает на cmd+600, на 500 мс позже;
  - существующий распознаватель после входа в R&D принимает новый BOTH только с R&D+2001: на R&D+2000 нет, на +2001 есть (проверено свипом 2500…2503);
  - с выдержкой 2500 жест подъёма из t18/t20 приходится ровно на эту границу и не принимается.

## Регресс `check:software` в изолированной копии

- Стенд `createSandbox` в scratchpad вне репозитория, три файла кандидата наложены на canonical-пути. Тем же способом прогнана база E2a-core.
- Стенд текущий: понимает имена `*_Faulty`.
- Логи: `regression/e2a-core/`, `regression/e2a-rc/`; сравнение — `regression/E2A_CORE_VS_E2A_RC.json/.txt`.

| Прогон | harness | historical | current | SAL cases | exit |
|---|---|---|---|---|---|
| E2a-core | ERROR 245/252 | PASS 75/75 | FAIL 601 pass / 552 fail / 42 skip | PASS 176, FAIL 1, NV 5, ERROR 4, N/A 16 | 3 |
| **E2a-RC** | ERROR 251/260 | PASS 75/75 | FAIL 612 pass / 524 fail / 42 skip | PASS 178, FAIL 1, NV 5, ERROR 4, N/A 16 | 3 |

Переходы E2a-core → E2a-RC.

**current: PASS→FAIL нет.**
- FAIL→PASS ×11:
  - `current-e2a-dis-hold` ×8 — HV по STP-A с событиями: Unlock, R&D→Safe→R&D, отклонённые BOTH/PLC и др.;
  - `current-e2d-fbk-unsolicited` FBK10-PLC-REG ×3.
- `current-e2a-run-conf` ×17 — FAIL→PASS с суффиксом `# TODO NOT VERIFIED`. В сравнении это пары ABSENT/FAIL по имени; части «no SafetyFault» и т.п. тест оставляет NV.

**harness: PASS→FAIL ×2** — `test/stand-sal-mutation-ops.test.js` (STAND-MUTOPS rewire):
- `Expected values to be strictly equal` и `'Missing expected exception.'`;
- тест стенда закреплён на canonical-связи N12/FBTon3.TonOut → FBAnd6.AndIn1 (`change.before === "//Network12/FBTon3/TonOut"`, no-op для FBTon3);
- срез меняет эту связь намеренно (FBAnd6.AndIn1 := WIN_C2). Это структурный пин стенда, не дефект кандидата. Инженеру стенда — перезакрепить при переносе;
- harness ABSENT→PASS ×8: OBS-TON для WIN_C1/WIN_C2.

**SAL cases:** +2 PASS (`TIMER://Network11/WIN_C1`, `TIMER://Network12/WIN_C2`). Прочие без изменений:
- FAIL `STATE:Run-RnD` (A4-3);
- ERROR `STATE:*` ×3 и `BOOT:SOURCE_REJECTED`;
- NV ×5.

**Оставшиеся FAIL тестов среза на кандидате:**
- `current-e2a-dis-hold`, 14:
  - 11 не доходят до предусловия «Safe/R&D после Restart, защитного спуска или abort». Стадии b_Step6/SR, Emergency вне Run — E2b/E3;
  - 1 «refused BOTH after FBK-10»: на стеке без E2d BOTH после FBK-10 принимается как подъём. Проверено трассой: SU, C2 ON, Run на +600. Значит, снятие запроса — следствие принятого подъёма. K3-ACK — это E2d;
  - **1 «DIS-HOLD-LV R&D→Safe … no event»: запрос LV FALSE на u1−1** — см. D-RC-2.
- `current-e2a-run-conf`, 4: RC-7 FBK-03 (u+502/550/599) и FBK-01 (u1+550) — потеря FBK после окна → Emergency. Это known FAIL плана: Q-RC-19 / E6.
- `current-native-bindings` ×3, `current-v2-identity` ×5, `current-native-structure` ×2 — пины на canonical F1 и P0/F1-дельту. Падают и на E2a-core.

## Отклонения и вопросы (архитектору через ведущего)

**D-RC-1. Строка C t20 на стеке «только E2a-RC» не выполняется (существенно).**
- Сценарий: устойчивый R&D с выставленным запросом HV, `in_ES_NC_1` FALSE, затем legacy PLC (1,1).
- Наблюдение на кандидате:
  - `out_HV_Discharge_Request` FALSE на +3/+4 при δ ∈ {−1, 0, +1, +2} и остаётся FALSE;
  - стадия остаётся SR; C1=1, C2=0, STO=0, EOk=0.
- На E2a-core (без DIS-HOLD) запрос TRUE без перерыва.
- Причина:
  - план опирается на «g7 переводит SR→S4 за ≤ 2 скана, после чего FBAnd4 = FALSE»;
  - на этом стеке SR→S4 в Emergency R&D не происходит — known FAIL «энергия в Emergency вне Run до E2b»;
  - поэтому `b_Set_HV_C2_1` (N12/FBAnd4: стадия R&D ∧ крышка ∧ legacy (1,1)) остаётся TRUE и держит Reset запроса.
- Ревью v7 §9 оговаривает: «стек только E2a-RC прототип не воспроизводит».
- Энергию это не добавляет: C2 и STO выключены. Но это снятие запроса разряда в Emergency, против DIS-HOLD-HV «Emergency keep TRUE».
- Гейт EOk на N12/FBAnd10, отвергнутый как неубиваемый, на этом стеке был бы убиваемым.
- Я реализовал строго по плану и ничего сверх плана не менял. Решение архитектору/ведущему:
  - либо принять как known FAIL до E2b и проверять строку C на стеке E2a-RC+E2b;
  - либо изменить план.
- Тестировщику: строку C на кандидате E2a-RC ожидать FAIL.

**D-RC-2. LV DIS-HOLD — расхождение на 1 скан между планом и G1-оракулом.**
- План §4.2 / PLAN.json: сброс по g2 (`b_Step12_Set`), «LV at a+1 (≤ u1+1)», где a — скан g2.
- Тест `current-e2a-dis-hold.test.js` (a1 = u1 = первый скан `out_LV_C1`) требует TRUE в [d, u1−1].
- На кандидате:
  - g2 в u1−2 (модель t18: g2@13517, reqOFF@13518);
  - запрос FALSE в u1−1: тест «R&D→Safe … no event», first FALSE t=9719, u1=9720.
- Реализация совпадает с планом (FBOr1.OrIn2 := `b_Step12_Set`). Согласовать определение a1 — архитектору, тестировщику и аналитику.

**D-RC-3. Стенд, структурные пины:**
- STAND-MUTOPS rewire — на FBTon3 → FBAnd6;
- пины F1-identity — как на E2a-core.

**Наблюдение для тестировщика.**
- После входа в R&D новый BOTH принимается с R&D+2001, на R&D+2000 не принимается. Это существующий распознаватель, срез его не менял.
- Но R&D теперь на 500 мс позже (cmd+600). Сценарии с фиксированными задержками после Safe→R&D нужно отсчитывать от фактического входа в стадию.

## Известные FAIL (после E2a-RC)

- По плану (до E6):
  - потеря FBK после окна → перезапуск вместо Emergency (Q-RC-19; RC-7 FBK-03, FBK-01);
  - конец окна без FBK → откат + SafetyFault;
  - 30 с Healthy.
- KF-5 (N7-2, PLAN v7.2): legacy (1,1) короче окна — R&D с C2 ON без Run. Отдельно не прогонял.
- D-RC-1, строка C t20 (до E2b или решения архитектора).
- D-RC-2 — LV на 1 скан раньше оракула.
- Унаследованные от E2a-core:
  - энергия/стадии в Emergency вне Run, выход из S6 (E2b);
  - Healthy в устойчивом Run (E3); SafetyFault (E5);
  - REL-01(e); legacy Bypass в S6; E2a-PLC (PLC/tsproj со старыми именами);
  - BOOT harness ×6, STATE ×4.
- Стенд: STAND-MUTOPS rewire ×2 (D-RC-3), F1-пины.

## Допущения и пределы доказательства

- Native CRC — offline-проверка файлов установленными writers.
  - **NV:** IDE Verify/Build, CRC проекта/target, input-rule в IDE, NV-страницы.
  - Новых safe-input слотов нет: SAL-переменные не перемещались.
- Модель (t16/t18/t20, мутанты) — стенд-runtime (`unconnectedInput:false`), не native-семантика. Убиваемость мутантов модельная; раннер мутаций не запускался.
- Composite M-E2a-26 и rebind-мутанты M-E2a-32/33/34 не прогонялись — это задача G3.
- Самопроверки не заменяют независимого тестировщика. «PASS требований» не заявляю.

## Что передать следующему и кому

- **Ведущему / архитектору:** D-RC-1 (решение о стеке или known FAIL), D-RC-2 (определение a1 для LV). При необходимости обновить `MUTATION_PLAN_E2a-RC.json`: `sourceSha256 = 5733552a…660f3f`.
- **Инженеру стенда:** перезакрепить STAND-MUTOPS rewire под связь N12/WIN_C2 → FBAnd6 (D-RC-3).
- **Тестировщику (G3)** на SHA `5733552a…`:
  - мутации M-E2a-18…36 по плану, включая rebind/composite вручную;
  - строка C с δ-свипом — с учётом D-RC-1;
  - D-RC-2;
  - наблюдение о R&D+2000.
- **Ревьюеру (G4):** материалы этой папки. Перенос в canonical — только по указанию ведущего после G4.
- После этого ведущий передаёт E2b. База E2b по плану — этот кандидат.
