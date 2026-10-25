# Handoff — E2d по PLAN v7.7 (XPH-01: GATE_PHASE → GATE_PF_SET.OrIn3), кандидат G2

Срез / роль / дата: E2d / v2-editor / 2026-10-22…23

Основание: PLAN.json `ee6dd3a321c656af86bd91d4603673d8a882d39dcb2692746b0c97119dd2fd9e`, PLAN.md `7e9ad5268192efa0d97f44928190b7e33bff4455e1c67628155ac622e96f3317`
(Addendum v7.7, 34 пункта E2d). Ревьюер — READY FOR EDITOR; правки архитектора V77-A/B (текст и мутации) сборку не меняют.
База — E2c ee8439ae; E2b/E2c не трогались.

Сохранность версий: прежний E2d e4cf767e — `candidates/E2d-v7.6/native` (= frozenMutantSources['E2d-v7.6']; SHA сверен после перерыва), материалы — `program/editor/E2d-v7.6/`.
`candidates/E2d-v7.5/`, `candidates/E2d-v7.4.1/` не трогались. Целостность `candidates/E2d/native` после перерыва проверена — SHA те же, что при native save.

## Источник
E2c `candidates/E2c/native` → `program/editor/E2d/source/`: SAL `ee8439ae2a58c4e51eba8bcba225831d4a024b06975c7eb3e19b8e859aaa4d97`, SGVL `281c9597…0f18`, diagram `66f94c13…588a`.

## Кандидат E2d v7.7 — `SafetyTests/candidates/E2d/native/`
- **SAL `c2f9ccd7a901e40f1ad5a3db780898c32b19180d6993528ce34afaffdb903689`** (Crc=3019884222)
- **SGVL `d845bd26331cfb166e13094c2a4c9cf9918252bb2cb34b6644acccc4c4564433`**
- **diagram `8797b832fee722dc068dce8e7f37ce4390acc8303abea1237f670bd394d71469`**
Canonical, PLC, tsproj, .sds не трогал; push не делал. ID матрицы не менялись.

## Inventory (план: 230 / 1947 / 295 / 79 / 63 / 185)
FB **230**, порты **1947**, wire **295** (0 межсетевых), SAL **79**, SGVL **63** (Id те же), globalRefs = SGVL FbPortUsages = **185**.
Против E2d-v7.6: +1 FB, +9 портов, +1 wire GATE_PHASE → GATE_PF_SET.OrIn3, +2 SGVL usages (b_Step12, b_Step3).

## Что сделано (`tools/make-e2d.mjs`, закреплён на ee6dd3a3/7e9ad526)
- Всё из v7.6 (K-1, K-2, v7.5, v7.4 и прежние пункты E2d).
- **v7.7:** новый RndPhysicalCompact/GATE_PHASE (safeOr: b_Step12 NC, b_Step3 NC) → wire GATE_PF_SET.OrIn3 (Activated NC).
- Порядок: GATE_SPOIL_R(145), SPOIL_S, GATE_PHASE, GATE_PF_SET, STATE_PF, GATE_SPOIL_PF, GATE_029(151) подряд.
- Native save `tools/native-save.ps1` (230/1947/79/63); CRC вручную не менялся.

## Самопроверки G2 (не PASS требований)
- **Native reload:** nativeCrcValid=True, SGVL FileCrcMismatch=False, 2211 фигур, drift 0.
- **Preflight + binding** (source и кандидат) — PASS; **SELF_CHECK 33/33** (правило порядка v7.7).
- Геометрия: фигуры без смещения внутри lanes; lane SafeResumption сдвинута на 6,9 (рост RndPhysicalCompact, R1-D-2 (b)); 4 новые фигуры без перекрытий;
  285/285 сохранённых connectors с теми же концами.
- **V74-A 28/28 PASS.**
- **`check:e2-delta` на ee6dd3a3** (F1 → … → E2d, `E2_DELTA_CHECK.log/.json`): `E2-DELTA PASS: R1 E2a-core E2a-RC E2b E2c E2d = PASS`, FAIL 0, NV 1 — «plan declares no SHA for candidate E2d».
- **c8, c9, c10 на реальных файлах** (`tools/c8-real.mjs`, `c9-real.mjs`, `c10-real.mjs`): **побайтно совпадают с `repro/c8.out.txt`, `c9.out.txt`, `c10.out.txt`**.
  - c8/c9: база `candidates/E2d-v7.5`, «v7.6»-строки — на реальном E2d v7.7 (то есть v7.7 сохраняет все результаты K-1/K-2/TD-15); мутанты исправления — на модели реального v7.7.
  - c10: v7.6 = `candidates/E2d-v7.6` (e4cf767e), v7.7 = `candidates/E2d`; мутанты GATE_PHASE.OrIn1/OrIn2 и GATE_PF_SET.OrIn3 — на модели реального v7.7.
    XPH f ∈ {A1+10, A1+300, R−1}, второй после R, удержание через R → нет SU/C2/STO/Run; f = R и R+1 — исполнение; повтор g+1999/g+2000 — игнор, g+2001 — принят;
    legacy (0,1) спуск + BOTH — закрыт; поскановая регрессия v7.6/v7.7 — identical.

## Регресс `check:software` против E2d-v7.6 (один стенд: каталоги test в двух песочницах идентичны)
current FAIL 330 → 313 (PASS 998 → 1000); harness 268/276, historical 75/75 и SAL cases (PASS 173, FAIL 6) без изменений.
С учётом переименований: **FAIL→PASS 17** — все `current-e2d-xphase.test.js` (15 переименованных с пометкой TODO + 2 «repeat g+1999 / g+2001»). **PASS→FAIL 0.**

## Отклонения / вопросы
Новых нет. Остаются из прежних handoff: D-V74-1, D-E2b-2, D-E2d-1, D-V75-1.

## Известные FAIL
Перенос в E6: терм recRndC_SU в GATE_PHASE (carryOver); откат 30 с и SafetyFault (E6); FBK10-PLC-A и KF-1…KF-4 для (1,0); k3/k4 (E5/E6); E3/E5/E6;
D-V74-1, D-E2b-2, D-E2d-1, D-V75-1; стенд: пины подграфов, BOOT harness.

## Команды (из `SafetyTests/`)
```
node program/editor/E2d/tools/make-e2d.mjs program/editor/E2d/source program/editor/E2d/staged
powershell.exe -NoProfile -STA -Command "& ([scriptblock]::Create([IO.File]::ReadAllText('program/editor/E2d/tools/native-save.ps1'))) -InputDir 'program/editor/E2d/staged' -OutputDir 'candidates/E2d/native' -ReportPath 'program/editor/E2d/NATIVE_SAVE.json' -StagingJson 'program/editor/E2d/STAGING.json'"
node program/editor/E2d/tools/self-check.mjs E2d program/editor/E2d/source program/editor/E2d/staged candidates/E2d/native program/editor/E2d/SELF_CHECK.json
node program/editor/E2d/tools/v74a-check.mjs program/editor/E2d/source candidates/E2d/native program/editor/E2d/V74A_CHECK.json
node scripts/e2-delta-check.mjs --out <scratch>/e2delta.json --chain F1=candidates/resumed-f1/native R1=candidates/E2-R1/native E2a-core=candidates/E2a/native E2a-RC=candidates/E2a-RC/native E2b=candidates/E2b/native E2c=candidates/E2c/native E2d=candidates/E2d/native
cd program/editor/E2d/tools && node c8-real.mjs && node c9-real.mjs && node c10-real.mjs
```

## Пределы
Offline native writers; NV: IDE Verify/Build, CRC проекта/target, input-rule IDE. Модель — runtime стенда; мутанты модельные. Самопроверки не заменяют G3.
Перенос в canonical — только по указанию ведущего после G4.
