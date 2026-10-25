# Handoff — E2d по PLAN v7.6 (K-1 STATE_PF, K-2 HLT_LV.AndIn4), кандидат G2

Срез / роль / дата: E2d / v2-editor / 2026-10-22

Основание: PLAN.json **e5397b7373e57e661a9cb29781082a8b4f52bf41e82eeccace4a96ef1e7aff34** (V76-A, 30 пунктов E2d), PLAN.md `ba2d4d13…`.
Сборка выполнена по v7.6 `1a130826…` (PLAN.md `15f32dc2…`; архитектор сохранил их как `PLAN.v7_6-preV76A.*`, скрипт закреплён на них).
V76-A меняет только декларации (порты STATE_PF отдельными пунктами Reset ← RELEASE.TonOut, Set ← GATE_PF_SET.OrOut); **сверено: `check:e2-delta` на e5397b73 — PASS**
для того же кандидата, повторный staging даёт те же байты (SAL staged `585fea56…`). E2b/E2c не трогались.

Сохранность версий: прежний E2d 2276d773 — **`candidates/E2d-v7.5/native`** (= frozenMutantSources['E2d-v7.5']), его материалы — `program/editor/E2d-v7.5/`;
`candidates/E2d-v7.4.1/` не трогался. Целостность `candidates/E2d/native` после перерыва проверена: SHA совпадают с записанными при native save.

## Источник
E2c `candidates/E2c/native`, побайтно в `program/editor/E2d/source/`: SAL `ee8439ae2a58c4e51eba8bcba225831d4a024b06975c7eb3e19b8e859aaa4d97`, SGVL `281c9597…0f18`, diagram `66f94c13…588a`.

## Кандидат E2d v7.6 — `SafetyTests/candidates/E2d/native/`
- **SAL `e4cf767e912e946b86e4039d1fbe23c34d73689c6fee4baa45cbfb80f1bc86bc`** (Crc=3813921250)
- **SGVL `da69870c6721e7f27431b8fdc2007cbd747f4d0eae7b7eb8f7aea7394c315120`**
- **diagram `72fea99c6763c3e854860df3f5b3b25030075831a2fe496d34c22a625376ef60`**
Canonical, PLC, tsproj, .sds, splcproj не трогал; push не делал. ID матрицы не менялись.

## Inventory (план: 229 / 1938 / 294 / 79 / 63 / 183)
FB **229**, порты **1938**, wire **294** (0 межсетевых), SAL-переменные **79**, SGVL **63** (Id те же), globalRefs = SGVL FbPortUsages = **183** (+1 b_Step_RnD на HLT_LV.AndIn4, +1 MODE.OrIn4).

## Что сделано (`tools/make-e2d.mjs`)
- Всё из v7.5 (LvCurrentPermit/N2-FBAnd1 NC1/NC2 deactivate, MODE.OrIn4, GATE_020.AndIn8, FBAnd91.AndIn5/6, v7.4 NC1/NC2 на HV/STO-разрешениях, FBOr1.OrIn2 deactivate, удаление N12/FBAnd8/9/10).
- **K-1:** новые RndPhysicalCompact/GATE_PF_SET (safeOr: wire SPOIL_R, wire SPOIL_S), STATE_PF (safeRs, шаблон STATE_SU: Reset ← wire RELEASE.TonOut, Set ← wire GATE_PF_SET.OrOut, NC),
  GATE_SPOIL_PF (safeAnd: wire GATE_003, wire STATE_PF); GATE_SPOIL_R/S.AndIn1 := wire GATE_002, контакт NO (wire от GATE_003 снят);
  GATE_029.OrIn6 := wire GATE_SPOIL_PF; GATE_029.OrIn7 deactivate. Порядок: SPOIL_R(145), SPOIL_S, GATE_PF_SET, STATE_PF, GATE_SPOIL_PF, GATE_029(150) подряд.
- **K-2:** SafeResumption/HLT_LV.AndIn4 := b_Step_RnD (NC).
- Native save `tools/native-save.ps1` (229/1938/79/63, 25 меток); CRC вручную не менялся.

## Самопроверки G2 (не PASS требований)
- **Native reload:** nativeCrcValid=True, SGVL FileCrcMismatch=False, 2201 фигура, drift 0.
- **Preflight + binding audit** (source и кандидат) — PASS. **SELF_CHECK 33/33** (шаблон safeRs добавлен в проверку сигнатуры; правило порядка v7.6).
- Геометрия: фигуры без смещения внутри lanes; lane SafeResumption сдвинута на 1,4 (рост RndPhysicalCompact — подгонка высоты, R1-D-2 (b)); 3 новые фигуры без перекрытий;
  285/285 сохранённых connectors с теми же концами (1 перемаршрутизирован native), 7 удалено, 9 новых.
- **V74-A 28/28 PASS** — входы крышки NC1/NC2 в HvSetPermit/Sto1SetPermit/Sto2SetPermit на месте (Activated NC, singleton-обёртки), снятие с LvCurrentPermit/N2-FBAnd1 сохранено.
- **`check:e2-delta` на PLAN.json e5397b73** (F1 → … → E2d, `E2_DELTA_CHECK.log/.json`): `E2-DELTA PASS: R1 E2a-core E2a-RC E2b E2c E2d = PASS`, FAIL 0, NV 1 — «plan declares no SHA for candidate E2d».
  (Ранее тот же кандидат прошёл и на 1a130826.)
- **c8 и c9 на реальных файлах** (`tools/c8-real.mjs`, `tools/c9-real.mjs` — копии repro архитектора; база = `candidates/E2d-v7.5`, v7.6 = `candidates/E2d`, мутанты исправления
  применены к модели реального v7.6, k1 = v7.6 без K-2): **`C8_REAL.out.txt` и `C9_REAL.out.txt` побайтно совпадают с `repro/c8.out.txt` и `repro/c9.out.txt`**:
  K-1 Safe ×2 и R&D ×2 → отказ; принятие r ≤ f−1, r = f; V14-Q7; одиночные зелёная/синяя; мутанты s.GATE_SPOIL_R/S, noOrIn6, noReset убиты;
  K-2: Faulty с p−200/p+900/A/A+1 → S12 в p+1001, C1 p+1002, R&D после снятия; HLT-01 сохранён, mutInv → R&D (убит); TD-15 — как у архитектора.

## Регресс `check:software` против E2d-v7.5 (один стенд: каталоги test в двух песочницах идентичны)
current FAIL 323 → 310 (PASS 989 → 991); harness 268/276 и historical 75/75 без изменений; SAL cases без изменений (PASS 173, FAIL 6).
С учётом переименований: **FAIL→PASS 13** — REL01-e2 K-1 [f−300, f+10) Safe LV/HV/оба и R&D NC1/NC2/оба ×6 (PASS с `# TODO NOT VERIFIED`: части про fault),
FBK-06-NEG ×5, FBK-06-POS ×1, K-2 WDG-02 ×1. **PASS→FAIL 0.**

## Отклонения / вопросы
Новых нет. Остаются из прежних handoff: D-V74-1 (REL01-e2-LATE, определение принятия), D-E2b-2, D-E2d-1 (SAL PRIORITY Step12 NC1/NC2), D-V75-1 (DOOR06 позитив legacy).

## Известные FAIL
По плану: K-1 на стеке E2b/E2c (до E2d), откат через 30 с и SafetyFault при удержании LV Faulty (E6), FBK10-PLC-A и KF-1…KF-4 для (1,0), k3/k4 (E5/E6), E3/E5/E6;
D-V74-1, D-E2b-2, D-E2d-1, D-V75-1; стенд: пины подграфов, BOOT harness.

## Команды (из `SafetyTests/`)
```
node program/editor/E2d/tools/make-e2d.mjs program/editor/E2d/source program/editor/E2d/staged
powershell.exe -NoProfile -STA -Command "& ([scriptblock]::Create([IO.File]::ReadAllText('program/editor/E2d/tools/native-save.ps1'))) -InputDir 'program/editor/E2d/staged' -OutputDir 'candidates/E2d/native' -ReportPath 'program/editor/E2d/NATIVE_SAVE.json' -StagingJson 'program/editor/E2d/STAGING.json'"
node program/editor/E2d/tools/self-check.mjs E2d program/editor/E2d/source program/editor/E2d/staged candidates/E2d/native program/editor/E2d/SELF_CHECK.json
node program/editor/E2d/tools/v74a-check.mjs program/editor/E2d/source candidates/E2d/native program/editor/E2d/V74A_CHECK.json
node scripts/e2-delta-check.mjs --out <scratch>/e2delta.json --chain F1=candidates/resumed-f1/native R1=candidates/E2-R1/native E2a-core=candidates/E2a/native E2a-RC=candidates/E2a-RC/native E2b=candidates/E2b/native E2c=candidates/E2c/native E2d=candidates/E2d/native
cd program/editor/E2d/tools && node c8-real.mjs && node c9-real.mjs
```

## Пределы
Offline native writers; NV: IDE Verify/Build, CRC проекта/target, input-rule IDE. Модель — runtime стенда; мутанты модельные. Самопроверки не заменяют G3.
Перенос в canonical — только по указанию ведущего после G4.
