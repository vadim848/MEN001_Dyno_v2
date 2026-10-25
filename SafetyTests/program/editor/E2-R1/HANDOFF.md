# Handoff — E2-R1 (удаление неиспользуемой логики), кандидат

Срез / роль / дата: E2-R1 / v2-editor / 2026-10-21
Основание: PLAN.md §3 R1 и PLAN.json slices[R1] (architect/E2-status, v2); ревью
reviewer/E2-plan-v2/PLAN_REVIEW.md — R1 CONFIRMED с условиями C-R1-1…5; решение ведущего
по C-R1-2: вариант (а) — снять Symbol-binding `b_Step6` с N3/FBRs6.RsOut.

Источник (canonical F1, скопирован побайтно в `program/editor/E2-R1/source/`, SHA сверены):
SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3
SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104
diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603
Native-structure preflight источника: PASS (14 сетей, 242 FB, 2076 портов, 75 SAL-переменных, 307 wire, 0 межсетевых).

Кандидат (native-сохранённый, `SafetyTests/candidates/E2-R1/native/`):
SAL ca841a01fe44f776a5868968fde70cce728657aaf411d6b8bfa6689cfadc7bb3 (Crc=1331029666)
SGVL 4f205138337ea3de3660d5ef2d8978db438e3e8d19f2e9dd393ec7a5816cdb36 (Crc=2739962901)
diagram b82aa41a6ee065267852d78ccaff961714eca1e8e8c006f087de715fb2a137b6
Промежуточный staging (текстовая правка, CRC источника не тронут, `program/editor/E2-R1/staged/`):
SAL 773cdc4785e09b7b579bbec3a249b9fa1ad8160358a2ca8be1714fc99c10079d
SGVL 68cab9a96e7c15d539e5f28f2f8c73e5935256cbe2613bbcde291980d636cfc6
diagram f60deb4f8dc54a1f6b77150b57cf5fdb7741074960682cafbb346e39c232ec1e
Canonical `MEN001_Dyno/Safety_Dyno` не изменялся (`git status` по MEN001_Dyno пуст).

ID матрицы и их новый статус: не менялись (R1 — удаление неиспользуемой логики без ID; кандидат до G3/G4).

## Inventory

| | canonical F1 | кандидат R1 | дельта | план |
|---|---|---|---|---|
| Сети | 14 | 14 (Network4/5/9 пустые) | 0 | не задано |
| FB | 242 | 215 | −27 | 215 |
| Порты in/out | 2076 | 1832 | −244 | 1832 |
| Symbols SGVL | 85 | **65** | −20 | 66 → 65 по C-R1-2(а) |
| SAL-переменные | 75 | 75 | 0 | 75 |
| wiredLink | 307 | 277 | −30 (1 wire сохранён с переносом источника) | — |
| fbPortGlobalVariableReference = SGVL FbPortUsage | 209 = 209 | 163 = 163 | −46 | — |
| Фигуры диаграммы: FB / порты / connectors | 242 / 2076 / 307 | 215 / 1832 / 277 | | |

**65 Symbols вместо 66 по плану** — следствие решения ведущего C-R1-2(а): binding `b_Step6`
снят с N3/FBRs6.RsOut, Symbol удалён из SGVL. Три wire FBRs6.RsOut (→N3/FBOr9.OrIn2,
→N3/FBDecouple2.DecIn6, →N3/FBAnd2.AndIn4) сохранены.

## Сделано (строго по PLAN.json R1)

1. Удалены 27 FB с портами, параметрами, wire и фигурами: Network5 целиком (15: FBAnd1/2/3/5/7/10,
   FBDecouple1…4, FBTon1…4, FBOr2), N3/FBRs2, FBOr3, FBOr4; N4/FBDecouple1; N9/FBAnd1;
   N12/FBAnd12/13/14; N1/FBAnd3/9/11; N6/FBAnd10.
2. Удалены 30 wire (на/из удалённых портов) и их connectors. Wire `758fbb79…` (N1/FBAnd3→N1/FBOr12.OrIn2)
   сохранён с тем же Id и connector `68d689ba…`, источник перенесён на N1/FBAnd2.AndOut (п.3).
3. Перепривязки (3): N3/FBDecouple2.DecIn2 := SAL `in_False_SI2_CH8` (новый target usage);
   N1/FBAnd2.AndOut → N1/FBOr12.OrIn2 (wire внутри Network1); N6/FBAnd9.AndIn1 := SAL `out_EStop_Status`
   (новый target usage). Атрибуты портов (filter, контакт) не менялись. Межсетевых wire нет.
4. Деактивированы 19 портов PLAN.json R1.deactivate (`channelInterface="Deactivated"`, без deactivate1,
   без ссылок — тот же вид, что у всех 858 деактивированных портов canonical; все filter=2). У каждого был
   ровно один источник, и он удалялся (символ из deleteSymbols либо wire удалённого блока).
5. Удалены 19 Symbols deleteSymbols + `b_Step6` (C-R1-2а). Из SAL-переменных удалены только usages удалённых
   портов (in_ES_NC_1/2, in_Mentee_EStop, in_Estop_PLC, in_LV/HV_C1/C2_FBK, in_STO_DR1/2_FBK,
   in_LV/HV_Healthy_FBK, in_False_SI2_CH8, inPLC_RnD_Mode(_2), out_TransitionStep, out_Step3).
6. orderOfExecution: сжатие 1…215 без пропусков с сохранением относительного порядка F1
   (переносы I-ORD-2 и голова 14 — это E2a, в R1 не делались). Отображение — `program/editor/E2-R1/STAGING.json` (`orderMap`).
7. Native save/CRC (C-R1-5): установленные TwinSAFE writers (SALDesigner 1.4.16, GlobalVariableList),
   offline, `tools/native-save.ps1`. CRC вручную не менялся: в staging сохранён CRC источника,
   новые Crc записаны только native writer. Повторный native save даёт те же байты (детерминирован).

## Команды воспроизведения (из `SafetyTests/`)

```
node program/editor/E2-R1/tools/make-candidate.mjs program/editor/E2-R1/source program/editor/E2-R1/staged
powershell.exe -NoProfile -STA -Command "& ([scriptblock]::Create([IO.File]::ReadAllText('program/editor/E2-R1/tools/native-save.ps1'))) -InputDir 'program/editor/E2-R1/staged' -OutputDir 'candidates/E2-R1/native' -ReportPath 'program/editor/E2-R1/NATIVE_SAVE.json'"
powershell.exe -NoProfile -STA -Command "& ([scriptblock]::Create([IO.File]::ReadAllText('program/editor/E2-R1/tools/native-save.ps1'))) -InputDir 'candidates/E2-R1/native' -OutputDir 'program/editor/E2-R1/reload-unused' -ReportPath 'program/editor/E2-R1/NATIVE_FRESH_RELOAD.json' -Reload -GeometryFrom 'candidates/E2-R1/native'"
node program/editor/E2-R1/tools/self-check.mjs program/editor/E2-R1/source program/editor/E2-R1/staged candidates/E2-R1/native program/editor/E2-R1/SELF_CHECK.json
node program/editor/E2-R1/tools/r1-differential.mjs program/editor/E2-R1/source candidates/E2-R1/native program/editor/E2-R1/differential/seed101.json 4 101   (и 6 202, 6 303)
node program/editor/E2-R1/tools/regression-compare.mjs program/editor/E2-R1/regression/baseline/SOFTWARE_CHECK_RESULTS.json program/editor/E2-R1/regression/staged/SOFTWARE_CHECK_RESULTS.json program/editor/E2-R1/regression/STAGED_VS_BASELINE.json
```
Регресс: копия `SafetyTests` (без 9 крупных исторических папок, на которые test/src/scripts не ссылаются)
+ `MEN001_Dyno` в scratchpad; три файла canonical подменялись кандидатом; `npm run check:software`.

## Результаты самопроверок (не PASS требований)

- Native load/save: Load failed=False; counts networks=14 variables=75 blocks=215 ports=1832; SGVL count=65;
  native labels DecIn2=`in_False_SI2_CH8`, FBAnd9.AndIn1=`out_EStop_Status`, FBOr12.OrIn1=`out_Step2` видимы.
- Fresh native reload кандидата (новый процесс): **nativeCrcValid=True** (SAL+diagram), **SGVL FileCrcMismatch=False**,
  counts те же, геометрия 2079 фигур стабильна (delta 0).
- `SELF_CHECK.json`: 28/28 self-check PASS: staged ≡ native по семантике (блоки, порты, атрибуты, порядок, wire,
  ссылки, usages); native-structure preflight PASS (277 wire, 0 межсетевых); binding audit PASS (163 refs,
  277 edges); 1:1 global ref ↔ SGVL usage (163), у каждого Symbol ровно один источник и ≥1 потребитель;
  нет висящих ссылок/wire/usages/connectors; **C-R1-4**: ни один из 16 Id портов N4/FBDecouple1 не встречается
  в SAL/SGVL/diagram; ни один Id/имя 20 удалённых Symbols не остался; дельты сохранённых портов — только
  19 деактиваций, снятие `b_Step6` и 3 перепривязки; activated-входы все имеют источник, deactivated — ни одного;
  порядок 1…215 непрерывен, относительный порядок F1 сохранён; параметры таймеров сохранённых блоков не менялись;
  диаграмма: 215 FB-фигур, 1832 port-фигур, 277 connectors, все разрешаются.
- C-R1-4 уточнение: в canonical N4/FBDecouple1 несёт **семь** fbPortGlobalVariableReference — по одной на
  DecOut1…DecOut7 (b_Step3/4/5/6_Reset, b_Step1_Reset, b_Step1_Set, b_Step2_Set); на DecOut4 — одна
  (`b_Step6_Reset`). «Шесть» в ревью соответствует DecOut1…6 reference. Все семь ушли вместе с блоком,
  соответствующие 7 SGVL FbPortUsage удалены вместе с Symbols.
- Модельный дифференциал canonical ↔ native-кандидат (`differential/seed101|202|303.json/.log`,
  `tools/r1-differential.mjs`): 16 эпизодов, 489 539 сканов 1 мс, lock-step на стендовом runtime; в каждом скане
  сравнивались все 48 SAL-выходов и все 373 выходных порта 215 сохранённых блоков. **Расхождений 0.**
  Сценарий: boot/Restart → BOTH → S12/R&D → (C3/BMS) → BOTH → StartingRun/Run → green-спуск; одно случайное
  событие (EStop NC1/NC2, PLC EStop, Mentee, InterLock NC1/NC2, connectors, Healthy, Door Monitor,
  in_Safety_Run, PLC RnD/Bypass, C3/RBM, STO FBK) в случайной фазе + случайный хвост жестов. Покрытие стадий
  (биты S1 S12 SR S3 S4 S5 S6): S1, S12, SR, S3, S1+S3, S1+S4, S1+S5, S12+S6 и др.; устойчивый S3 в одиночку
  почти не достигался (9 сканов) — предел. `b_Step2` canonical ни разу не TRUE. Из удалённых выходов TRUE бывали
  только дубликаты (N1/FBAnd3/9/11, N6/FBAnd10, N12/FBAnd12/13 — их функции остаются в FBAnd2/10/12, N2/FBAnd9),
  N3/FBOr3 и N5/FBOr2/FBDecouple4 (следуют b_Step12_Set, единственный потребитель — Reset FBRs2). Ещё 6 эпизодов
  (seed 20261021, `differential/seed20261021.partial.log`) — 0 расхождений, прогон остановлен вручную, JSON нет.

## Регресс R1-01(b) — `npm run check:software` в изолированной копии (C-R1-3)

| Прогон | harness | historical | current | SAL cases |
|---|---|---|---|---|
| canonical F1 (baseline) | PASS 218/218 | PASS 75/75 | FAIL 483/784 (299 fail) | PASS 199, FAIL 1, NV 7, ERROR 0 |
| кандидат **native** | — | — | — | **прогон не состоялся**: стенд падает (см. Отклонение D-1) |
| кандидат **staged** (семантически ≡ native) | ERROR 196/202 | PASS 75/75 | FAIL 248/708 (460 fail) | PASS 194, FAIL 2, NV 5, ERROR 1 |

Сравнение staged ↔ baseline (`regression/STAGED_VS_BASELINE.json/.txt`): **ни одного перехода FAIL→PASS или
PASS→FAIL, причина которого — поведение;** все переходы — структурные пины стенда на удалённые
элементы/инвентарь/SHA F1 (перечень ниже). Но из-за этих пинов ~237 тестов текущего пакета не дошли до
поведения, поэтому **вердикт R1-01(b) этим прогоном не доказан** — нужна миграция oracle тестировщиком
и повтор (G3). Единственный FAIL→PASS (`STATE:conflicting-set-requests`) — ложный: инжектируемый
`b_Step1_Set` удалён, конфликт больше не создаётся.

### Структурные oracle, которые придётся мигрировать (тестировщику / инженеру стенда)

| # | Где | Что пинует | Эффект на кандидате |
|---|---|---|---|
| S1 | `src/sal-parser.js` `elements()` (стенд) | не принимает самозакрытый `<Network …/>` (так native пишет пустую сеть) | Network4 «поглощает» Network5/6, Network9 — Network10; check:software падает в physical-rnd-source (`//Network4/FBDecouple2/DecIn6`) — **блокирует любой прогон на native-кандидате** |
| S2 | `test/helpers/v2-structural.js:9` | SHA canonical SAL 04b45456… | 8 файлов падают при загрузке (current-door-interlock, -early-sto-bindings, -hv-set-permit, -native-bindings, -rnd-compact, -step12-lv-permit, -unlock-hold, -v2-migration-negatives): 86 тестов ABSENT |
| S3 | `test/helpers/full-program-source.js` `createFullProgram({blockCount=242})` | число FB 242 | 16 (current-btn-release-after-permit) + 1 (current-unlock-estop-permit) |
| S4 | `test/helpers/e2-lifecycle.js` `STAGES_REQUIRED` ∋ `b_Step6` | Symbol `b_Step6` как точка наблюдения S6 | все E2-тесты: e2-emergency (16), e2a-status (2), e2b-connector-safe (4), e2d-release-permit (2); наблюдать S6 через порт `//Network3/FBRs6/RsOut` (следствие C-R1-2а) |
| S5 | `test/current-early-sto.test.js` | typed input boundary `b_Set_STO_DR1` (удалённый Symbol) | 87 |
| S6 | `test/current-plc-pulse-set-permit.test.js` | реальные блоки Network5 (`//Network5/FBAnd1`) | 8 — предмет теста удалён (retire/retarget) |
| S7 | `test/current-safe-run-gestures.test.js` | подготовка «ordinary Step2 outputs» | 5 |
| S8 | `test/current-mentee-set-permit.test.js` | MENTEE05 «legacy-Network5» агрегат (4) и потребители in_Mentee_EStop (∋ N6/FBAnd10.AndIn3) (1) | 5 |
| S9 | `test/current-rnd-down-no-reenergy.test.js` | поиск удалённого блока (`undefined.outputs`) | 4 |
| S10 | `test/current-native-structure.test.js` | точная singleton-грамматика/инвентарь и список P0c/F1 usage identities | 2 |
| S11 | `test/current-safe-input-slots.test.js` | «six native first-slot stop guards» (N6/FBAnd10.AndIn1 удалён) | 1 (5 !== 6) |
| S12 | `test/boot-preflight.test.js` (5) + `BOOT_PREFLIGHT_SOURCE_MANIFEST.json` | полный native-инвентарь F1, «Network4 lists eight unbound inputs» | BOOT:SOURCE_REJECTED ERROR; BOOT:UNSUPPORTED_UNBOUND_PROGRAM_INPUT / _GROUP_LIFECYCLE (NV) исчезают |
| S13 | `test/sal-semantics.test.js` SAL-SEM03 | неподключённые входы DECOUPLE Network4 (DEC-3) | 1 — предмет удалён |
| S14 | `src/current-code-checks.js:59,62,95` | STATE:* инжектируют `b_Step1_Set`, `b_Step3_Set_3`, `b_Step1_Set_2`, наблюдают `b_Step6` | STATE:Safe-RnD-Run и STATE:Emergency-removal PASS→FAIL; STATE:conflicting-set-requests FAIL→PASS (ложно) |
| S15 | `src/reference-behavior.js`/timer cases | TIMER://Network5/FBTon1…4 | 4 PASS-кейса исчезают (таймеры удалены по плану) |

Ожидаемые структурные дельты, не являющиеся дефектом R1: S3, S5–S7, S9–S15 (пины на удалённое по плану),
S4 (следствие C-R1-2а), S2/S12 (SHA/manifest F1). S1 — дефект стенда, вскрытый native-сериализацией.

## Отклонения (требуют решения архитектора/ведущего; дальнейших попыток не делал)

- **D-1. Пустые сети.** План не говорит, что делать с сетями, ставшими пустыми (Network4 «ToBeDeleted»,
  Network5 «Safe», Network9 «Network8»). Я их сохранил (14 сетей, атрибуты не менялись). Native writer
  сериализует пустую сеть самозакрытым `<Network …/>`; стендовый парсер (S1) это не читает. Варианты:
  (а) инженер стенда чинит `sal-parser.js` (и прочие regex-читатели сетей); (б) архитектор дополняет R1
  удалением пустых сетей (сети, swimlanes, вероятно перенумерация networkOrderId) — это вне текущего плана.
- **D-2. Геометрия.** Внутри каждой swimlane все сохранённые фигуры сохранили взаимное положение
  (одинаковый сдвиг на lane, размеры 0). Но native layout при загрузке схлопнул пустые lanes (N4 −2.625,
  N5 −14, N9 −2.625 по высоте) и заново подогнал высоты lanes N6 (+14.735), N7 (+0.54), N11 (+3.165),
  RndPhysicalCompact (+0.05) под содержимое (в F1 высоты не соответствовали содержимому). Итог по
  абсолютному Y: N6 −16.625, N7 −1.89, N8 −1.35, N11 −3.975, N12/Rnd −0.81, SafeResumption −0.76;
  N1/N2/N3/N10 без сдвига; корень диаграммы −0.75 по высоте (`GEOMETRY_DELTA.txt`). Staging этих сдвигов
  не делал — их вносит native writer; native round-trip неизменённого canonical сдвигов не даёт. Требование
  «геометрия сохранённых фигур не сдвигается» в абсолютных координатах **не выполнено** для 7 сетей;
  обойти без изменения native-раскладки нельзя.
- **D-3. Symbols 65 вместо 66** — объявлено (C-R1-2а), не отклонение от решения ведущего.

## Допущения и пределы доказательства

- Native CRC: offline проверка CRC файлов SAL/diagram/SGVL установленными writers. **NV:** IDE Verify/Build,
  CRC проекта/target, проверка input-rule в IDE, допустимость пустых сетей и OR с одним активным входом
  при Verify (в canonical такие OR уже есть: N3/FBOr4). Download/target не трогались.
- DEC-3 («несвязанный вход DECOUPLE = FALSE») — DERIVED (C-R1-1); после R1 он из продукта ушёл вместе с N4.
- Модельный дифференциал — на стендовом runtime (не native-семантика), со стендовым допущением
  `unconnectedInput:false`; это самопроверка, не замена R1-01(b) тестировщика. Для чтения native-кандидата
  дифференциал во временной копии разворачивает `<Network …/>` в `<Network …></Network>` (обход S1).
- Регресс выполнен на текущем рабочем стенде (с незакоммиченными изменениями src/test других ролей) —
  одинаково для baseline и кандидата.

## Вопросы

Нет вопросов о поведении. Решения D-1/D-2 — архитектору через ведущего.

## Что передать следующему и кому

- Архитектору/ведущему: D-1 (пустые сети: чинить парсер или удалять сети), D-2 (принять native-сдвиг lanes).
- Инженеру стенда: S1 (`sal-parser.js` и иные regex-парсеры `<Network>`), S14/S15.
- Тестировщику (G3): миграция S2–S13 и полный регресс R1-01(b) на native SHA ca841a01…; затем сравнение
  вердиктов с baseline (`regression/baseline/`). До S1 прогон на native-кандидате невозможен.
- Ревьюеру (G4): C-R1-1…5 — материалы выше; перенос в canonical — только после G4 по указанию ведущего.
