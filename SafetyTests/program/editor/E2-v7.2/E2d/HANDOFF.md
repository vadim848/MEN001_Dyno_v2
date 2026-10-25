# Handoff — E2d (Safe-сторона, Q-REL, FBK-10 + addendum v7.1/v7.2 FBOrFbk10C2), кандидат G2 — итоговый стек E2

Срез / роль / дата: E2d / v2-editor / 2026-10-22

Основание: PLAN.md v7.2 `6557525a…` / PLAN.json `5198d426…`: §7 E2d, addendum v7.1 (FBAnd91.AndIn5/6), addendum v7.2 N7-1
(FBOrFbk10C2 вместо сырого гейта). Контакты по `repro/proto.mjs` e2d. Ревью v7 давало E2d «NEEDS CHANGES» (N7-1); правка v7.2
реализована как написана, отдельного ревью v7.2 я не видел — отметить на G3/G4.
Стек E2a-core → E2a-RC → E2b → E2c → **E2d** — кандидат для G3/G4 по решению ведущего.

## Источник
Кандидат E2c, побайтно в `program/editor/E2d/source/`: SAL `b344870c…8839`, SGVL `adf837d6…da35`, diagram `e58412af…7772`. Preflight/binding PASS.

## Кандидат (`SafetyTests/candidates/E2d/native/`, native save)
- SAL `365f2c2ef0791e6d3b93812cb4920c4f1c93c067d2246f8132f9b08e7df6bd8a` (Crc=912575781)
- SGVL `d2b08a8d12ddf85f33f024f6593d9a3d64501962f7be4ba64b2a5b3935b3a969`
- diagram `85c9a4788a6dd0eb3792bffae6ee0c2bd1a04b6065e78628464dcfdd68c34265`
Canonical/PLC/tsproj/.sds/splcproj не трогал. ID матрицы не менялись.

## Inventory
FB 227 → **228**, порты 1926 → **1935**, Symbols **63**, SAL-переменные **78**, wire 288 → 289, 0 межсетевых, safeTon 17.

## Что сделано (`tools/make-e2d.mjs`)
- N1/FBAndLvCurrentPermit.AndIn4/5 (NC1/NC2) и N2/FBAnd1.AndIn5/6 (NC1/NC2) — deactivate.
- SafeResumption/MODE.OrIn4 := b_Step12.
- GATE_020.AndIn8 := in_HV_C2_FBK NO (FBK-10).
- v7.1: N2/FBAnd91.AndIn5 := in_LV_C1_FBK NO, AndIn6 := in_HV_C2_FBK NO.
- v7.2: новый N12/FBOrFbk10C2 (safeOr: in_HV_C2_FBK NO, out_HV_C2 NC) → wire N12/FBAnd10.AndIn3; порядок — непосредственно перед N12/FBAnd10.

## Самопроверки (не PASS требований)
- Native: fresh reload nativeCrcValid=True, SGVL FileCrcMismatch=False, 2197 фигур drift 0, 21 метка.
- Preflight/binding PASS; `SELF_CHECK.json` 33/33 PASS.
- Геометрия: фигуры без изменений; 288 connectors с теми же концами (маршрут 5 в N12 перестроен native, D-2); 1 новая фигура, без перекрытий.
- Модель на реальном кандидате:
  - t22 (`model/t22.E2d.out.txt`) и **t23 (FBK-10 legacy, v7.2) совпадают с архитектором построчно**: POS Run u+600/u+600/u+601; мутант
    «сырой уровень» → Run never, R&D с C2=1; NEG unsolicited C2_FBK → R&D без C2; мутант FBAnd10.AndIn3 → S3.
  - t10 (`model/t10.E2d.out.txt`) — все строки = архитектор (включая «2 SU» и 9a/9b/10/11); t11 — = архитектор до тех же IL_SCOPE (блок удалён в v4).
  - Строки E2b (t18/t20/x1/x4, мутанты) повторены на E2d (`MODEL_E2B_ROWS_ON_E2D.*`): идентичны E2b.
  - Строки аналитика E2-RC-D2 §4 (`LV_EMG_ROWS.log`): e ≤ g2 — TRUE, C1 OFF; e ≥ g2+1 — запрос выдан снова цепью на e+2, далее S4→S5.
- Регресс `check:software` (E2c → E2d, `regression/E2C_VS_E2D.*`): harness/historical без изменений; current FAIL 414 → 357;
  FAIL→PASS 61 (`e2d-fbk-unsolicited` ×32, `e2a-rnd-cover-healthy` ×15+6, `e2b-rel01-e2` ×5, `e2d-fbk-k3ack` ×2 …);
  **PASS→FAIL 4 + SAL-кейсы 4**: `current-mentee-set-permit` ×2, `current-hv-set-permit` ×1, `current-step12-lv-permit` ×1
  («in_InterLock_NC_1 true !== false»), SAL `PRIORITY:Step12:ExternalNC1/NC2:fallback=false/true`. Это старые оракулы «крышка снимает
  разрешение LV/HV тока»; E2d по плану снимает NC1/NC2 с FBAndLvCurrentPermit (V14-Q7). Тестировщику — переоценить по требованиям плана, не ослабляя.

## Итог стека E2 (core+RC+b+c+d) по `check:software` (только факт)
harness ERROR 254/261 (BOOT ×6 + Software package — как раньше); historical PASS 75/75; current FAIL 789 pass / 357 fail / 42 skip;
SAL cases PASS 173, FAIL 6, NV 5, ERROR 4, N/A 16. Крупнейшие группы FAIL: early-sto ×42 (план §12: замена ожидания тестировщиком),
fbk-k3ack ×39 (D5-2 known FAIL до E5/E6), plc-pulse ×37 (пин подграфа), rel01-e2 ×36 (D-E2b-1/3), fbk-unsolicited ×30, e2b-bypass ×21,
emg-rd-sweep ×17, cover-transitions ×14, e2-emergency ×13, dis-hold ×12, …

## Отклонения и вопросы (через ведущего)
- Все D-E2b-1…4 (см. `program/editor/E2b/HANDOFF.md`) остаются на итоговом стеке; часть REL01-e2 (×5) на E2d перешла в PASS.
- D-E2d-1: 4 старых теста/4 SAL-кейса PRIORITY Step12 NC1/NC2 против п. E2d (снятие NC1/NC2 с FBAndLvCurrentPermit) — к тестировщику/аналитику.
- D-E2d-2: v7.2 (N7-1) реализована без отдельного ревью v7.2 (видел только ревью v7) — ревьюеру на G4.

## Известные FAIL
FBK-10 k3/k4 (квитирование) до E5/E6; KF-1…KF-5 legacy PLC до E3/E4; E3 (STP-I, Healthy в Run), E5 (SafetyFault), E6 (watchdog, Q-RC-19); D-E2b-1…4, D-E2d-1.

## Команды
```
node program/editor/E2d/tools/make-e2d.mjs program/editor/E2d/source program/editor/E2d/staged
(native save / reload — tools/native-save.ps1 этого среза)
node program/editor/E2d/tools/self-check.mjs E2d program/editor/E2d/source program/editor/E2d/staged candidates/E2d/native program/editor/E2d/SELF_CHECK.json
CAND_DIR=<candDir> MUT_SCRATCH=<scratch> node program/editor/E2d/tools/arch/t10.mjs   (t11/t22/t23 так же; копии скриптов архитектора с runner cand-run.mjs)
node program/editor/E2d/tools/model-stack.mjs candidates/E2b/native candidates/E2d/native <scratch> program/editor/E2d/MODEL_E2B_ROWS_ON_E2D.json
```

## Пределы
Offline native (NV: IDE Verify/Build, CRC проекта/target, input-rule IDE); модель стенда; мутанты — модельные, раннер мутаций не запускался;
самопроверки не заменяют G3. Перенос в canonical — только по указанию ведущего после G4.
