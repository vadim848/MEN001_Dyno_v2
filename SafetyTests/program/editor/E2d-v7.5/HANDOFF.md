# Handoff — E2d по PLAN v7.5 (legacy PLC (1,1) R&D→Run отключён, вопрос 76 «Б»), кандидат G2

Срез / роль / дата: E2d / v2-editor / 2026-10-22

Основание: PLAN.md `fc825a1be66df38dc0627dce5c1578661be6ca6482885dfa1161d63ffd3c68fd`, PLAN.json `c26886a63f02a8220c27ad1588e15a2d46b87d99cc607849fbb1120c66bcb41a`,
«Addendum v7.5» и `slices[E2d]` (deleteBlocks, changes). E2b/E2c не менялись (см. `program/editor/E2b|E2c/HANDOFF.md`).
Прежний E2d по v7.4.1 сохранён как **E2d-v7.4.1**: `candidates/E2d-v7.4.1/native` (SAL `a5acf291…6c1b`), материалы и общий handoff стека v7.4.1 —
`program/editor/E2d-v7.4.1/`.

## Источник
E2c `candidates/E2c/native`, побайтно в `program/editor/E2d/source/`: SAL `ee8439ae2a58c4e51eba8bcba225831d4a024b06975c7eb3e19b8e859aaa4d97`,
SGVL `281c9597…0f18`, diagram `66f94c13…588a`. Preflight/binding PASS.

## Кандидат E2d (v7.5) — `SafetyTests/candidates/E2d/native/`
- **SAL `2276d7739ad958c51ae43d6af74981cfbc9421c0e782df7afe119e6eff4c8b1b`** (Crc=3789493881)
- **SGVL `140806334cf751348a301c82ed91b0e8f131bf05609727461ff2f16fdd295371`** (байтово как у E2d-v7.4.1: изменения SGVL те же — MODE.OrIn4 := b_Step12)
- **diagram `94e9b231cef30cf50ee6e61d0770d696f1e77a28ed1d286051ea653729e4cbfb`**
Canonical, PLC, tsproj, .sds, splcproj не трогал. ID матрицы не менялись.

## Inventory
FB 229 → **226**, порты 1944 → **1917**, SAL-переменные **79**, Symbols **63** (Id те же), wire 292 → 289, 0 межсетевых, safeTon 17 — как в плане.

## Что сделано (`tools/make-e2d.mjs`, закреплён на v7.5)
- Прежние пункты E2d: LvCurrentPermit.AndIn4/5 и N2/FBAnd1.AndIn5/6 deactivate; MODE.OrIn4 := b_Step12; GATE_020.AndIn8 := C2_FBK NO;
  FBAnd91.AndIn5/6 := C1_FBK / C2_FBK NO; v7.4 — HvSetPermit/Sto1SetPermit/Sto2SetPermit AndIn5/6 := in_InterLock_NC_1/2 NC (атомарно).
- **v7.5:** `Network12/FBOr1.OrIn2 deactivate` (FBOr1 = recRndC_SU); **удалены Network12/FBAnd8, FBAnd9, FBAnd10** (обёртки блоков,
  wire FBAnd8→FBAnd10, FBAnd9→FBAnd10, FBAnd10→FBOr1.OrIn2 и их connectors, фигуры блоков; SAL usages inPLC_RnD_Mode, inPLC_RnD_Mode_2 и in_False ×2 на этих портах;
  у inPLC_RnD_Mode/_2 остаются прочие потребители — проверено скриптом); **v7.2 FBOrFbk10C2 и FBAnd10.AndIn3 не строятся**.
- Порядок: только перенумерация после удаления, относительный порядок сохранён.
- Native save `tools/native-save.ps1` (226/1917/79/63; метки FBOrFbk10C2 сняты, 25 меток); CRC вручную не менялся.

## Самопроверки G2 (не PASS требований)
- Fresh reload: nativeCrcValid=True, SGVL FileCrcMismatch=False, 2177 фигур drift 0.
- Preflight + binding audit (source и кандидат) — PASS. **`SELF_CHECK.json` 33/33 PASS** (generic self-check дополнен: удалённые блоки = `deletedBlocks` плана,
  usages на портах удалённых блоков учитываются как плановое удаление; порядок — FBOrFbk10C2 и удалённые блоки отсутствуют).
- Геометрия: все фигуры на месте (сдвигов 0), 3 фигуры удалены, 289/289 сохранённых connectors с теми же концами и без перемаршрутизации, 3 удалены.
- **V74-A** (`V74A_CHECK.*`) — **28/28 PASS**: входы крышки NC1/NC2 в HvSetPermit/Sto1SetPermit/Sto2SetPermit остаются (по одному usage, Activated NC, singleton-обёртки), снятие с LvCurrentPermit/N2-FBAnd1 сохранено.
- **`check:e2-delta`** на PLAN.json c26886a6 по цепочке F1 → E2d (`E2_DELTA_CHECK.log/.json`): `E2-DELTA PASS: R1 E2a-core E2a-RC E2b E2c E2d = PASS`, FAIL 0, NV 1 — «plan declares no SHA for candidate E2d».
- **Модель c7 на реальных кандидатах** (`MODEL_C7.log`, `tools/c7-real.mjs` — копия repro/c7 без in-memory правки):
  - E2d v7.5: A (1,1) удержание 5 с, B импульс 300 мс (KF-5), C FFS «крышка 200 мс при (1,1)», F KF-3-DESC — **C2 0, STO 0, Run 0 (F: Run 103 мс до спуска, затем R&D)**;
    позитив D BOTH R&D→Run — C2/STO 3999, Run; позитив E PLC (1,0) Safe→R&D — S1→S12→R&D. **Совпадает с `repro/c7.out.txt` построчно.**
  - LEG11-OFF / M-E2d-23: на E2d-v7.4.1 и на E2c — A: C2 с +3, Run; C: C2 с +202, Run; F: C2, остаётся S3 — то есть оба дают нарушение (ожидаемый FAIL).
- Модель c4/c6 повторена на E2d v7.5 (`MODEL_V74.*`): без изменений против v7.4.1 (спойл-сценарии, V14-Q7, E2d-COV-1 и мутанты M-E2b-46/47, M-E2d-17…22 убиты).

## Регресс `check:software` (изолированно, E2d-v7.4.1 → E2d v7.5, один и тот же стенд — SHA тестов в песочницах совпадают)
current FAIL 359 → 341 (853 → 870 PASS); harness 269/276 и historical 75/75 без изменений; SAL cases без изменений (PASS 173, FAIL 6).
- FAIL→PASS 18 (+1 переименованный): `current-e2d-fbk-unsolicited` «E2d V76 …» ×16+1 (legacy (1,1) не исполняется: R&D, R&D(HV), HV Faulty, KF-1/KF-2/KF-3, после спуска из Run),
  `current-door-interlock` DOOR06 HV chain existing-PLC-levels ×2.
- **PASS→FAIL 1:** `current-door-interlock` «DOOR06 existing emergency/connector guards still prevent new HV; constant-FALSE False operand neutral» —
  проверка `existing-PLC-levels: healthy positive control … false !== true`: позитивный контроль ожидает подъём HV по legacy-уровням PLC, которых в v7.5 нет.
  Оракул устарел по вопросу 76 «Б» (как FBK10-PLC-B/REG в плане) — тестировщику заменить позитив кнопочным маршрутом, не ослабляя негативы.

## Отклонения / вопросы
- D-V75-1 (тестировщику): DOOR06 positive control legacy-маршрута — см. выше.
- Сохраняются вопросы стека v7.4.1 (из `program/editor/E2d-v7.4.1/HANDOFF.md`): D-V74-1 (REL01-e2-LATE R&D — определение принятия при SU на u−2), D-E2b-2, D-E2d-1 (SAL PRIORITY Step12 NC1/NC2).
  D-V74-2 (FFS legacy (1,1)) снят v7.5 (модель C: C2 0).

## Известные FAIL
FBK10-PLC-A (Safe (1,0)) и KF-1…KF-4 для (1,0) и спусков; k3/k4 (E5/E6); E3/E5/E6; D-V74-1, D-E2b-2, D-E2d-1, D-V75-1; стенд: пины подграфов, BOOT harness ×6.

## Команды (из `SafetyTests/`)
```
node program/editor/E2d/tools/make-e2d.mjs program/editor/E2d/source program/editor/E2d/staged
powershell.exe -NoProfile -STA -Command "& ([scriptblock]::Create([IO.File]::ReadAllText('program/editor/E2d/tools/native-save.ps1'))) -InputDir 'program/editor/E2d/staged' -OutputDir 'candidates/E2d/native' -ReportPath 'program/editor/E2d/NATIVE_SAVE.json' -StagingJson 'program/editor/E2d/STAGING.json'"
node program/editor/E2d/tools/self-check.mjs E2d program/editor/E2d/source program/editor/E2d/staged candidates/E2d/native program/editor/E2d/SELF_CHECK.json
node program/editor/E2d/tools/v74a-check.mjs program/editor/E2d/source candidates/E2d/native program/editor/E2d/V74A_CHECK.json
node scripts/e2-delta-check.mjs --out <scratch>/e2delta.json --chain F1=candidates/resumed-f1/native R1=candidates/E2-R1/native E2a-core=candidates/E2a/native E2a-RC=candidates/E2a-RC/native E2b=candidates/E2b/native E2c=candidates/E2c/native E2d=candidates/E2d/native
node program/editor/E2d/tools/c7-real.mjs
```

## Пределы
Offline native writers; NV: IDE Verify/Build, CRC проекта/target, input-rule IDE. Модель — runtime стенда; мутанты модельные. Самопроверки не заменяют G3.
Перенос в canonical — только по указанию ведущего после G4.
