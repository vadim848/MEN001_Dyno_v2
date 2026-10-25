# Handoff — пересборка E2b → E2c → E2d по PLAN v7.4.1 (v7.3 GATE_SPOIL + v7.4 E2d-COV-1), кандидаты G2

> **E2d — «до v7.5».** Вадим ответил на вопрос 76 «Б»: legacy R&D→Run по PLC (1,1) отключается уже в E2, архитектор готовит addendum v7.5.
> E2d собран по v7.4.1 до этого ответа и сдаётся как есть; после правки плана — пересборка (`make-e2d.mjs` поверх E2c). E2b и E2c — по v7.4.1, окончательные для этого плана.

Срез / роль / дата: E2b, E2c, E2d (стек E2) / v2-editor / 2026-10-22. Общий handoff стека; в `program/editor/E2b/` и `E2c/` — материалы срезов.

Основание: PLAN.md/PLAN.json v7.4.1. Ведущий назвал PLAN.json `74a3bc8b…`; во время сборки архитектор выпустил ревизию V73-C/V73-D
(PLAN.md `f247e310c096c8d59dc7a5f80fb1be7f8cf4276e2aa7d56b8f54b990727ce595`, PLAN.json `096ebdadf766c1d9ca97697a1ef05275e647c88ee96f5f13c3c895edab9dcdbb`):
только текст и план мутаций, `slices[E2b..E2d]` (resources, changes, newBlocks, order) по тексту v7.4.1 не изменились. Скрипты закреплены на этой ревизии;
`check:e2-delta` интерпретировал именно её. PLAN.json `74a3bc8b` в папке архитектора не сохранён — сверить с ним не могу (NV).
Ревью: `program/reviewer/E2-plan-v7/PLAN_REVIEW.md` «v7.3 / v7.4» — READY FOR EDITOR.

Старые кандидаты v7.2 не затёрты: `candidates/E2-v7.2/{E2b,E2c,E2d}/native` (SAL `386e208b…`, `b344870c…`, `365f2c2e…`),
материалы — `program/editor/E2-v7.2/{E2b,E2c,E2d}/`.

## SHA новых кандидатов (для `source.candidates`)

| Срез | База | SAL | SGVL | diagram | Crc SAL |
|---|---|---|---|---|---|
| E2b | E2a-RC `5733552a…660f3f` | `4f933433c4dcb6a4ddf3cbad1cad64897965c48f7832613d0481b0195fbce45e` | `7ae241165ec0321bcae684d726925b178bb8ef354ca68fce72160dbdc334129c` | `a413ca1f1ebfcaa7d94a4789770f14170e7528852f5c6a5af2ba0a8d16b45e94` | 987008561 |
| E2c | E2b | `ee8439ae2a58c4e51eba8bcba225831d4a024b06975c7eb3e19b8e859aaa4d97` | `281c9597365fb745553c57dad826fd12217cd07e3a8dc1ef0943782412800f18` | `66f94c13b187a9d0cc5348335ddaad6cdf3ec1b113f3340dd728b6e33820588a` | 3664285160 |
| E2d | E2c | `a5acf29175b041d243aac19e5ffee4c260f0c6cab3b538679c36ed1e59286c1b` | `140806334cf751348a301c82ed91b0e8f131bf05609727461ff2f16fdd295371` | `c5b28c07070559b78d8bfa581be7d99e892a6857f5f142ee9dab398fc55aa95b` | 4258899874 |

Пути: `SafetyTests/candidates/{E2b,E2c,E2d}/native/`. Canonical, PLC, tsproj, .sds, splcproj не трогал. ID матрицы не менялись.

## Inventory (план 227/229/230 FB, 1926/1944/1953 портов, 78/79/79 SAL-переменных, 63 Symbols — совпадает)

| | E2a-RC | E2b | E2c | E2d |
|---|---|---|---|---|
| FB | 217 | **227** | **229** | **230** |
| Порты | 1836 | **1926** | **1944** | **1953** |
| Symbols | 63 | 63 | 63 | 63 (Id без изменений) |
| SAL-переменные | 75 | **78** | **79** | **79** |
| wire | 277 | 291 | 292 | 293 (0 межсетевых) |

## Что сделано

- **E2b** (`program/editor/E2b/tools/make-e2b.mjs`): всё из v7.2-сборки (8 блоков, linkCoverClosed/linkRunDownOwner, g7 по стадии, g10, BOOT-гейт,
  Bypass (А), крышка в GATE_020/030, head15/L1) **плюс v7.3**:
  - SAL-переменная `linkConnectorsOk` (source SafeResumption/CONNECTORS.AndOut → GATE_SPOIL_S.AndIn3);
  - RndPhysicalCompact/GATE_SPOIL_R (AndIn1 wire GATE_003, AndIn2 b_Step_RnD NC, AndIn3 linkCoverClosed NO) → wire GATE_029.OrIn6 (Activated NC);
  - RndPhysicalCompact/GATE_SPOIL_S (AndIn1 wire GATE_003, AndIn2 b_Step1 NC, AndIn3 linkConnectorsOk NO) → wire GATE_029.OrIn7 (Activated NC);
  - порядок: GATE_003 (118) … GATE_SPOIL_R (145) → GATE_SPOIL_S (146) → GATE_029 (147).
  - Движок дополнен двумя правками из E2c-сборки (отложенная проверка «последний потребитель переменной», источник новой переменной на новом блоке) — на результат v7.2-пунктов не влияют (check:e2-delta PASS).
- **E2c** (`E2c/tools/make-e2c.mjs`) — тот же состав, что раньше (HLT_LV → linkHltLvLost, GATE_SG_SET, C-1, C-2), поверх новой E2b.
- **E2d** (`E2d/tools/make-e2d.mjs`) — прежний состав (LvCurrentPermit/N2-FBAnd1 NC1/NC2 deactivate, MODE.OrIn4, GATE_020.AndIn8, FBAnd91.AndIn5/6,
  FBOrFbk10C2) **плюс v7.4 атомарно в том же staging/native save**: Network1/FBAndHvSetPermit, FBAndSto1SetPermit, FBAndSto2SetPermit
  AndIn5 := in_InterLock_NC_1, AndIn6 := in_InterLock_NC_2 (Activated NC, новые targetUsages SAL-переменных). Порядок/wire не менялись.
- Native save — `tools/native-save.ps1` каждого среза (счётчики плана, +метки GATE_SPOIL_R/S.AndIn3, 6 меток v7.4); CRC вручную не менялся.

## Самопроверки G2 (не PASS требований)

| | E2b | E2c | E2d |
|---|---|---|---|
| Fresh reload: nativeCrcValid / SGVL CRC / drift | True / ok / 0 (2187 фигур) | True / ok / 0 (2207) | True / ok / 0 (2217) |
| Native-метки | 16 | 17 | 27 |
| Preflight + binding audit (source и кандидат) | PASS | PASS | PASS |
| `SELF_CHECK.json` | 33/33 | 33/33 | 33/33 |
| Геометрия: фигуры (dx/размер/сдвиг lane) | без изменений | без изменений | без изменений |
| Connectors: концы сохранённых | 276/276 | 291/291 | 292/292 |
| Новые фигуры без перекрытий, в своих lanes | 10 | 2 | 1 |

E2b order-проверка дополнена правилом v7.3 (SPOIL_R после GATE_003, R→S→GATE_029 подряд) — PASS.

**V74-A** (`E2d/V74A_CHECK.json/.log`, `tools/v74a-check.mjs`) — **28/28 PASS**: у `in_InterLock_NC_1/2` по одной обёртке
targetUsages/variableHasTargetUsages/variableUsages/usages; каждый usage-элемент — ровно один fbPortUsage/functionBlockPort/reference/moniker;
каждый из 6 новых портов встречается ровно один раз, Activated, `Break Contact (NC)`, без global-ref и wire, прочие атрибуты порта как в E2c;
одновременно удалены usages с LvCurrentPermit.AndIn4/5 и N2/FBAnd1.AndIn5/6 (порты Deactivated без контакта); дельта usages −2/+3 на переменную, Id прочих сохранены.

**`npm run check:e2-delta` по цепочке** (`E2d/E2_DELTA_CHECK.log/.json`, `scripts/e2-delta-check.mjs --chain F1 … E2d`):
`E2-DELTA PASS: R1=PASS E2a-core=PASS E2a-RC=PASS E2b=PASS E2c=PASS E2d=PASS`; FAIL-строк 0; NV — только «plan declares no SHA» для E2b/E2c/E2d (ожидаемо до записи SHA архитектором).

**Модель на реальных кандидатах** (`E2d/MODEL_V74.json/.log`, `tools/model-v74.mjs`; сценарии repro c4/c6 архитектора без in-memory правок):
- c4 на E2b и E2d: эпизод крышки 200 мс при удержании BOTH в R&D → R&D, новый жест → Run; connector-эпизод в Safe → S1, новый жест → R&D;
  V73-D различающий (крышка p+300…p+500, восстановлена до Q) → R&D, проба 1 скана на p+998 → R&D.
- V14-Q7 Safe + открытая крышка + BOTH: E2b → S1 (known FAIL до E2d), **E2d → R&D**; R&D + открытая крышка зелёная: E2b → R&D (known FAIL), **E2d → S1**;
  синяя в R&D с открытой крышкой → Unlock (оба); IL-02 BOTH при открытой крышке, восстановление при удержании → R&D (оба).
- Мутанты: GATE_029.OrIn6 (M-E2b-42) → Run в c4 и V73-D; OrIn7 (M-E2b-43) → R&D; SPOIL_R.AndIn3 (M-E2b-44) → подъём жестом невозможен;
  SPOIL_S.AndIn3 (M-E2b-45) → Safe→R&D невозможен; SPOIL_R.AndIn2 (M-E2b-46) на E2d → V14-Q7 ломается (S1); SPOIL_R.AndIn1 (M-E2b-47) на E2d →
  зелёная не спускает (R&D), синяя не даёт Unlock (UL=0) — все убиты.
- c6 (E2d-COV-1): SU 999, u 1001; NC1 или NC2 в u → C2 0 сканов, STO_DR1/DR2 0 сканов, EOk FALSE u+1 (= in_Estop_PLC в u); без события → Run, C2/STO 8499 сканов;
  M-E2d-17/18 (HvSetPermit.AndIn5/6) → C2 u+0…u+8006; M-E2d-19/20 (Sto1) → STO_DR1 u+0…u+7005; M-E2d-21/22 (Sto2) → STO_DR2 u+0…u+7005 — все убиты.
  Совпадает с `repro/c4.out.txt`, `c6.out.txt`.

## Регресс `check:software` (изолированно) против прежних v7.2-кандидатов

Новые: E2b current 792 PASS / 422 FAIL / 42 skip; E2c 791/406/42; E2d 846/344/42; harness 269/276 (те же 7 FAIL: BOOT ×6 + Software package); historical 75/75;
SAL cases E2b/E2c PASS 177, FAIL 2; E2d PASS 173, FAIL 6 (как v7.2).
Прежние v7.2 перепрогнаны на текущем стенде (`regression/<s>-v72-same-stand/`, сравнение `regression/V72_VS_V741_SAME_STAND.*`).
**Оговорка:** тестировщик менял тесты во время прогонов (у `current-e2b-cover-transitions.test.js` и `helpers/e2-emergency.js` разные SHA в двух песочницах;
`current-e2b-rel01-e2.test.js` — тот же). Сравнение по этим файлам — не чистое.

С учётом переименований:
- **E2b/E2c**: FAIL→PASS 44 (rel01-e2 R&D ×10+, переименованные ×30, e2-emergency ×3, dis-hold ×1); PASS→FAIL 1 — `IL-05a boundary c=r+1 NC1`
  («out_SS1_DR1/2@0»). **Не атрибутируется кандидату**: тест в песочницах разный; модельная трасса одинакова на v7.2 и v7.4.1 E2b (SS1 поднимается в r+1 в обоих).
- **E2d**: FAIL→PASS 48 (вкл. hv-set-permit, mentee-set-permit, first-fault-scan ×2); PASS→FAIL 7: тот же IL-05a c=r+1 (см. выше) и
  **`current-e2b-rel01-e2` REL01-e2-LATE R&D NC1/NC2/обе ×6 (s = Q+2 и s = l0, тест не менялся) — эффект v7.4** (D-V74-1).
- Остаются FAIL «E2d FFS legacy PLC (1,1) NC1/NC2 в e=u» (C2 включается на e+301 после восстановления крышки без Restart) — FAIL и на v7.2 (имя теста сменилось);
  корень — legacy-путь без защёлки SU (KF-4): крышка не даёт Emergency, а v7.4 лишь блокирует C2 пока крышка открыта.

## Отклонения и вопросы (через ведущего)

- **D-V74-1 (аналитику/тестировщику):** REL01-e2-LATE R&D (крышка с s = l0 = первый лифт, или Q+2): по v7.4 подъём принят внутренне (SU на u−2),
  C2/STO заблокированы разрешениями (0 сканов энергии), затем Emergency → S4 (как c6). Оракул допускает только «refused без Emergency» или
  «accepted (наблюдаемый лифт) с Emergency». Третьего исхода «принят, энергии нет, Emergency» в дизъюнкции нет; на v7.2 тест проходил, потому что C2 успевал включиться.
  Реализация по плану; вопрос определения (как D-E2b-2).
- **D-V74-2:** FFS legacy (1,1) — вне v7.4 (KF-4/E4), повторно отмечаю: после восстановления крышки legacy-уровень снова включает C2 без Restart.
- Ревизия плана во время работы — см. «Основание» (74a3bc8b → 096ebdad, только текст/мутации).

## Известные FAIL (на стеке E2d v7.4.1)
D-E2b-2 (граница u−1, определение принятия), D-E2d-1 (старые оракулы PRIORITY Step12 NC1/NC2 — SAL FAIL 6), D-V74-1/2; k3/k4 (E5/E6);
KF-1…KF-5 legacy PLC (E3/E4); E3 (STP-I, Healthy в Run), E5 (SafetyFault), E6 (watchdog, Q-RC-19); стенд: пины подграфов (plc-pulse, R3PAIR, safe-run-gestures), BOOT harness ×6.

## Команды (из `SafetyTests/`)
```
node program/editor/E2b/tools/make-e2b.mjs program/editor/E2b/source program/editor/E2b/staged
powershell.exe -NoProfile -STA -Command "& ([scriptblock]::Create([IO.File]::ReadAllText('program/editor/E2b/tools/native-save.ps1'))) -InputDir 'program/editor/E2b/staged' -OutputDir 'candidates/E2b/native' -ReportPath 'program/editor/E2b/NATIVE_SAVE.json' -StagingJson 'program/editor/E2b/STAGING.json'"
(то же для E2c/E2d: make-e2c.mjs / make-e2d.mjs, source = предыдущий кандидат; reload с -Reload -GeometryFrom)
node program/editor/<S>/tools/self-check.mjs <S> program/editor/<S>/source program/editor/<S>/staged candidates/<S>/native program/editor/<S>/SELF_CHECK.json
node program/editor/E2d/tools/v74a-check.mjs program/editor/E2d/source candidates/E2d/native program/editor/E2d/V74A_CHECK.json
node scripts/e2-delta-check.mjs --chain F1=candidates/resumed-f1/native R1=candidates/E2-R1/native E2a-core=candidates/E2a/native E2a-RC=candidates/E2a-RC/native E2b=candidates/E2b/native E2c=candidates/E2c/native E2d=candidates/E2d/native
node program/editor/E2d/tools/model-v74.mjs candidates/E2b/native candidates/E2d/native <scratch> program/editor/E2d/MODEL_V74.json
node program/editor/<S>/tools/run-regression.mjs <label> <candDir> <sandboxParent> program/editor/<S>/regression/<label>; regression-compare.mjs …
```

## Пределы
Offline native writers; NV: IDE Verify/Build, CRC проекта/target, input-rule IDE. Модель — runtime стенда, мутанты модельные (раннер мутаций не запускался).
Самопроверки не заменяют G3. Перенос в canonical — только по указанию ведущего после G4.
