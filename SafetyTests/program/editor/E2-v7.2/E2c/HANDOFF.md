# Handoff — E2c (HLT_LV, GATE_SG_SET, C-1, C-2), кандидат G2

Срез / роль / дата: E2c / v2-editor / 2026-10-22

Основание: PLAN.md v7.2 `6557525a…` / PLAN.json `5198d426…`, `slices[E2c]`; контакты по `repro/proto.mjs` e2c
(в прототипе `in_LV_Healthy_FBK` — та же переменная, переименованная в E2a-core в `in_LV_Faulty_FBK`, полярность та же).
Стек: E2b → E2c. Если E2b будет переделан (D-E2b-1…3), E2c пересобирается той же командой.

## Источник
Кандидат E2b (`candidates/E2b/native`), побайтно в `program/editor/E2c/source/`: SAL `386e208b…2cfec`, SGVL `5b031b0c…205d9`, diagram `3b3826f8…bf86d`.
Preflight/binding источника PASS.

## Кандидат (`SafetyTests/candidates/E2c/native/`, native save)
- SAL `b344870cac7505cadd7e78314e06e95344d069b69f72241e9861b35c63cc8839` (Crc=3449816745)
- SGVL `adf837d6e66c688bb4abd6ddd2256f60851daba973de76f3af9f5250268cda35`
- diagram `e58412af1c1f00bcd628058eb26f19fe0f24efb64ad8ddf01ba00123f0f67772`
Canonical/PLC/tsproj/.sds/splcproj не трогал. ID матрицы не менялись.

## Inventory
FB 225 → **227**, порты 1908 → **1926**, Symbols **63** (Id те же), SAL-переменные 77 → **78** (+linkHltLvLost), wire 287 → 288, 0 межсетевых.

## Что сделано (`tools/make-e2c.mjs`, тот же движок, что E2b)
- SafeResumption/HLT_LV (safeAnd: in_LV_Faulty_FBK NC, recRndC_SU NO, in_False NO) → SAL-переменная `linkHltLvLost`.
- RndPhysicalCompact/GATE_SG_SET (safeOr: linkSafeSgOwnerSet, linkHltLvLost) → wire STATE_SG.Set (usage linkSafeSgOwnerSet перенесён с STATE_SG.Set на GATE_SG_SET.OrIn1).
- GATE_020.AndIn7 := recRndC_SG NO (C-1); GATE_030.OrIn6 := linkHltLvLost (C-2).
- Порядок: STATE_SU → SG_OWNER_SET → HLT_LV → GATE_SG_SET → STATE_SG; прочее без изменений.

## Самопроверки (не PASS требований)
- Native: fresh reload nativeCrcValid=True, SGVL FileCrcMismatch=False, 2187 фигур drift 0, 17 меток.
- Preflight/binding PASS; `SELF_CHECK.json` 33/33 PASS.
- Геометрия: все фигуры и все 287 connectors без изменений, 2 новые фигуры в своих lanes без перекрытий, 1 новый connector.
- Модель (архитектурные t10/t11 на кандидате, `program/editor/E2d/model/t10.E2c.out.txt`, `t11.E2c.out.txt`):
  t10 #7 C-1 и #8 C-2 → S1/SAFE, «SU&SG ever=false», «S12 ever=false» (= архитектор; на E2b было S4 c C2=1/STO=1);
  t11 мутанты GATE_020.AndIn7 → SU&SG=true, GATE_030.OrIn6 → S12=true — убиты. Строки «2 SU»/«blueRnd» — артефакт границы R&D+2000 (см. E2b).
- Строки аналитика E2-RC-D2 §4 на E2c (`program/editor/E2d/LV_EMG_ROWS.log`) — как на E2b (повторная выдача на e+2).
- Регресс `check:software` (E2b → E2c, `regression/E2B_VS_E2C.*`): harness/historical без изменений; current FAIL 436 → 414;
  **PASS→FAIL 0**; FAIL→PASS 22 (`current-e2a-race` ×20, `current-e2a-rnd-cover-healthy` ×2, все переименованные). SAL cases без изменений.

## Известные FAIL
STP-I до E3; HLT-03 SafetyFault до E5; все отклонения E2b (D-E2b-1…4) сохраняются.

## Команды
```
node program/editor/E2c/tools/make-e2c.mjs program/editor/E2c/source program/editor/E2c/staged
(native save / reload — как E2b, tools/native-save.ps1 этого среза)
node program/editor/E2c/tools/self-check.mjs E2c program/editor/E2c/source program/editor/E2c/staged candidates/E2c/native program/editor/E2c/SELF_CHECK.json
```

## Пределы
Как E2b: offline native, модель стенда, G3 не заменяется.
