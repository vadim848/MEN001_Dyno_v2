# Handoff — E2b (Emergency, крышка, connector, g7 по стадии, g10, Bypass (А), EMG6-01-BOOT), кандидат G2

Срез / роль / дата: E2b / v2-editor / 2026-10-22

Основание: PLAN.md v7.2 `6557525a…` / PLAN.json `5198d426…`, §6 и `slices[E2b]` (+ `mechanism.grants.g7/g10`, `mechanism.order`);
контакты новых блоков — по прототипу архитектора `repro/proto.mjs` (e2b + e2e). Пункты D-1, перенесённые в core
(FBOr1.OrIn4 := g7, L1-переносы FBAnd16/CONNECTORS/CONNECTOR_SCOPE), не повторялись. Решение ведущего: G3/G4 — на итоговом стеке
E2 (core+RC+b+c+d).

## Источник
Кандидат E2a-RC, побайтно в `program/editor/E2b/source/`, SHA сверены:
SAL `5733552a150bfd33df4211da8f97a8fc993ff990ad52c90a8d7758d950660f3f`, SGVL `253de7f39f2c4af83fa8642445a885d18ecfcdccec46fcbf96612d88a810b669`,
diagram `5fa942384352033814f2d51bf8c4a847098d6a3322d4b733995de64b7b759bb2`. Preflight + binding audit источника — PASS (`PREFLIGHT_SOURCE.json`).

## Кандидат (`SafetyTests/candidates/E2b/native/`, native save)
- SAL `386e208becc94f966c79629653b50c15ab96bd95bf95bf823aa1e7510ea2cfec` (Crc=338929284)
- SGVL `5b031b0ce47d6868b1fa7ae73c4977aec5650244a26f29d786973d9dcca205d9`
- diagram `3b3826f8b46113f62e857ebbcf0229e57d06cc144dd4154e6c67b0567d1bf86d`
Staging (CRC источника не тронут): `staged/` SAL `ba484163…`, SGVL `7114c451…`. Canonical, PLC, tsproj, .sds, splcproj не трогал.
ID матрицы: не менялись (кандидат до G3/G4).

## Inventory
| | E2a-RC | E2b | план |
|---|---|---|---|
| FB | 217 | **225** (+8) | 225 |
| Порты | 1836 | **1908** | 1908 |
| Symbols | 63 | **63** (те же Id) | 63 |
| SAL-переменные | 75 | **77** (+linkCoverClosed, +linkRunDownOwner) | 77 |
| wire | 277 | 287 (−1, +11), 0 межсетевых | — |
| global refs = SGVL usages | 167 | 177 = 177 | — |
| alias usages | 76 | 76 | — |

## Что сделано (`tools/make-e2b.mjs`)
- Новые блоки (шаблоны native safeAnd N6/FBAnd9 / safeOr N6/FBOr5; NC — прямой, NO — инверсный):
  N1/FBAndNotRunSu (b_Step3 NO, recRndC_SU NO); N1/FBOrIlRunOk (wire NotRunSu, linkCoverClosed, linkRunDownOwner);
  N6/STAGE_LVON (b_Step12, b_Step_RnD); N6/FBAndLvEmg (wire STAGE_LVON, b_EStop_Ok NO, in_False NO); N6/FBOrStep4 (wire N6/FBAnd2, wire FBAndLvEmg);
  N3/FBOrS12Reset (b_Step_RnD_Set, b_Step4_Set); N3/G10_EXIT (wire FBRs6, b_EStop_Ok, in_Reset_PB NO, recRndC_PrevG, C1_FBK NO, C2_FBK NO, out_LV_C1 NO, out_HV_C2 NO);
  N3/FBAndBootFbkOff (C1_FBK NO, C2_FBK NO, in_Reset_PB NO, recRndC_PrevG).
- Новые SAL-переменные: `linkCoverClosed` (источник N12/FBAnd16.AndOut; потребители FBOrIlRunOk.OrIn2, N6/HEALTHY_OK.AndIn3, GATE_020.AndIn6),
  `linkRunDownOwner` (N6/RUN_DOWN_OWNER.RsOut → FBOrIlRunOk.OrIn3).
- Входы: N1/FBAnd1.AndIn3 := wire FBOrIlRunOk; N1/FBAnd1.AndIn4 := linkSafeConnectorScope; HEALTHY_OK.AndIn3 := linkCoverClosed;
  N6/FBAnd9.AndIn2/3 deactivate; N6/FBDecouple1.DecIn1 := wire FBOrStep4 (g7 = b_Step4_Set по стадии); N3/FBRs8.Reset := wire FBOrS12Reset;
  GATE_001.AndIn5/6 deactivate; GATE_020.AndIn6 := linkCoverClosed; GATE_030.OrIn5 := wire BOTH.TonOut; N3/FBOr2.OrIn3 := wire G10_EXIT;
  **N1/FBAnd4.AndIn5 := b_Step1 (B5-1 (А))**; **N3/FBAnd1.AndIn3 := wire FBAndBootFbkOff (B5-2 / B6-1)**.
- Порядок: голова 15 (FBOrS12Reset 3-м); N12/FBAnd16, CONNECTORS, CONNECTOR_SCOPE, FBAndNotRunSu, FBOrIlRunOk — непосредственно перед N1/FBAnd1;
  N1/FBEstop1 → G10_EXIT → FBAndBootFbkOff → N3/FBAnd2 → N3/FBAnd1; G10_EXIT до writer PrevG N6/FBDecouple2; N6/FBAnd2 … STAGE_LVON → FBAndLvEmg → FBOrStep4 → N6/FBDecouple1;
  остальной относительный порядок сохранён.
- Native save `tools/native-save.ps1` (копия E2a: счётчики 225/1908/77/63, 14 меток), FixUp новых фигур/11 connectors; CRC вручную не менялся.

## Самопроверки (не PASS требований)
- Native: Load ok; fresh reload — nativeCrcValid=True, SGVL FileCrcMismatch=False, 2167 фигур drift 0; 14 native-меток (в т.ч. G10_EXIT.AndIn3=in_Reset_PB,
  N1/FBAnd1.AndIn4=linkSafeConnectorScope, HEALTHY_OK.AndIn3=linkCoverClosed, FBOrIlRunOk.OrIn3=linkRunDownOwner).
- Preflight/binding кандидата PASS; **`SELF_CHECK.json` 33/33 PASS** (generic `tools/self-check.mjs` по STAGING: источник/контакт каждого
  планового входа, нет висящих, singleton, 1:1 SAL-ref↔SGVL, единственный источник у Symbol и у внутренних SAL-переменных, точная wire-дельта,
  дельта usage SAL-переменных и Symbols только плановая, сохранение Id прежних usage, порядок, таймеры, сети, CRC, диаграмма 225/1908/287).
- Геометрия: фигуры без сдвигов (dx=0, размер 0, сдвиг lane 0 везде); 8 новых фигур в своих lanes без перекрытий; 276 сохранённых
  connectors с теми же портами-концами, маршрут 21 перестроен native layout (D-2); 1 удалён, 11 новых.
- **Модель на реальном кандидате** (`MODEL_E2B.json/.log`, runner `tools/cand-run.mjs`, рядом E2a-RC):
  - **t20 строка C (D-RC-1) на E2b выполняется**: min=1, S4, C1=0, C2=0 при δ ∈ {−1,0,+1,+2,+5}; δ=−2 (PLC до аварии) — снят на +2, далее цепь (как ревью x1 A/x8).
  - t18: HV/LV DIS-HOLD без изменений; BOOT: FBK ON + Restart → none/EMG, FBK OFF + Restart → S1/SAFE; Bypass в R&D 3 с — C2=0 (на E2a-RC 1).
  - t20 BOOT B6-1: FBK OFF на r+1 / r+2000 → через 3 с none/EMG, новый Restart → S1/SAFE (= t20 архитектора).
  - x1 ревьюера A–E совпадают с `x1.out.txt` (A: тайминги 1/2/3/2004/7008/7009/8010/8012 идентичны); B на кандидате доходит до Run (у ревьюера R&D — там в прототипе был гейт E2d v7.1, см. N7-1).
  - x4 ревьюера: во всех 9 строках «stays none/EMG» (= ревьюер).
  - Мутанты (deactivate): FBOr5.OrIn2, FBOr1.OrIn2, FBAndBootFbkOff.AndIn1, N3/FBAnd1.AndIn3, N1/FBAnd4.AndIn5, N12/FBAnd4.AndIn2, N2/FBAnd91.AndIn4,
    FBAndBootFbkOff.AndIn4, FBOrStep4.OrIn2 — убиты; **FBAndBootFbkOff.AndIn3 (!in_Reset_PB) этой строкой не убит** (как и у архитектора в t20).
- **Строки аналитика E2-RC-D2 §4** (`LV_EMG_ROWS.log`, стенд `e2-lifecycle`, E2_SOURCE_ROOT): на E2b при e = g2+1/+2/+3/+10/+700 запрос LV
  снят на e−1/e и **выдан снова цепью на e+2**; стадия идёт S4→S5 (на p+9000 — S5, EMG); C1 при e ≥ g2+3 гаснет на e+2002, при e = g2+1/+2 не включается.
  На E2a-RC: «never re-issued», b_Step12/SR в Emergency. e ≤ g2 — без изменений (TRUE, C1 OFF).

## Регресс `check:software` (изолированно, E2a-RC → E2b, `regression/E2A_RC_VS_E2B.*`)
harness 254/261 → 254/261 (без изменений); historical 75/75; current FAIL 577 → 436; SAL cases PASS 178→177, FAIL 1→2.
С учётом переименованных тестов (суффиксы TODO): **FAIL→PASS 214, PASS→FAIL 73**.
PASS→FAIL по группам:
1. **Пины подграфа/структуры стенда (45)**: `current-plc-pulse-set-permit` ×37 (`Undeclared source cut //Network1/FBOrIlRunOk/OrOut`),
   `current-estop-native-pairs` R3PAIR ×5 и SAL-кейс `ESTOP:restart-fault-recovery` (подграф {N1/FBAnd1, FBEstop1} без новых входов AndIn3/4),
   `current-safe-run-gestures` ×2 (подграф, «Restart preparation failed», BOTH-fanout), `current-safe-input-slots` ×1 (GATE_001 без NC1/NC2 — по плану).
   В полной модели Restart работает (t18/t20/x4). Нужна перенастройка срезов стенда/тестов.
2. **Поведенческие расхождения с оракулом (28) — нужен разбор архитектора/аналитика/тестировщика:**
   - `current-e2b-rel01-e2` R&D NC1/NC2/обе ×21: эпизод крышки во время удержания BOTH (до квалификации) больше не отклоняет жест — подъём на Q+2.
     Причина — п.6 плана: NC1/NC2 сняты с GATE_001 (разрешение жеста) и проверяются только в GATE_020 в скане принятия. На E2a-RC было PASS.
     Сюда же `current-e2a-dis-hold` «refused BOTH with a permit episode» ×1 (жест принят → запрос снят законно).
   - `current-e2b-cover-transitions` IL-02 boundary N=u−1 и N=c=u ×4, `current-e2b-connector-safe` EMG4-03 boundary u−1 ×2: Emergency.
     Тест определяет принятие наблюдаемо (u = первый C2/STO или C1); внутренняя защёлка (SU / g2) — на u−2. Событие на u−1 приходится на
     StartingRun/S12 после принятия → по IL-05a/EMG-004 E2b даёт Emergency. Трасса: `SU` в p+1001, крышка в p+1002 → EOk FALSE p+1003 → S4.
     Нужна договорённость о моменте «принятия» (наблюдаемый u против a=u−2).
3. Остаются FAIL тестов E2b-критериев (были FAIL и на E2a-RC): IL-05a/b/d (`cover-transitions` ×14 всего, в т.ч. L2 «Del +2004 vs +2005» — путь крышки
   опережает in_Estop_PLC на 1 скан (гипотеза: HEALTHY_OK.AndIn3 → FBAnd9 → g7 в том же скане; не атрибутировано); IL-05b: крышка на t_a−1 спуска → защитный спуск в R&D вместо Emergency),
   `rel01-e2` Safe connector ×15 (CONNECTOR_SCOPE = b_Step1 ∨ коннекторы — в S1 эпизод не снимает разрешение), `e2-emergency` ×13, `emg-rd-sweep` ×17, `e2b-bypass` ×21.
   FAIL→PASS: `e2-emergency` ×89, `e2b-bypass` 55 (переименованные), `e2d-release-permit` ×15, `interlock-run` ×12, `e2a-boot` ×10 и др.

## Отклонения и вопросы (архитектору через ведущего)
- **D-E2b-1 (существенно, блокирует G3 по REL01-e2):** п.6 (GATE_001.AndIn5/6 deactivate, крышка только в GATE_020) нарушает REL01-e2 в R&D
  (эпизод NC1/NC2 во время удержания BOTH). Реализовано строго по плану; правку не делал (повторная попытка вне плана запрещена).
- **D-E2b-2:** граничные тесты IL-02/EMG4-03 «u−1» — расхождение определения момента принятия (внутренний SU/g2 на u−2 против наблюдаемого u).
  Нужно решение аналитика (D-TEAM) / тестировщика.
- **D-E2b-3:** IL-05a L2 на 1 скан раньше эталона in_Estop_PLC (причина не атрибутирована), IL-05b крышка на t_a−1 → R&D вместо Emergency,
  REL01-e2 Safe connector — тесты E2b-критериев не проходят и на E2b.
- **D-E2b-4 (стенд):** пины подграфов (plc-pulse, R3PAIR, ESTOP-кейс, safe-run-gestures, SAFEINPUT GATE_001) — перенастроить.
- Наблюдение: архитектурные t10/t11 (`program/editor/E2d/model/`) на E2b/E2c: строки «2 SU» и «blueRnd» дают SU=0 / UL=0 из-за границы
  повторного взвода распознавателя R&D+2000 (выдержка 2500 в скрипте); на E2d (MODE.OrIn4 := b_Step12) совпадают с архитектором.

## Известные FAIL до E2c/E2d
HLT (t10 #7/#8: S4 c C2=1 STO=1) — до E2c; V14-Q7 Safe и Q-REL — до E2d; плюс D-E2b-1…3.

## Команды (из `SafetyTests/`)
```
node program/editor/E2b/tools/make-e2b.mjs program/editor/E2b/source program/editor/E2b/staged
powershell.exe -NoProfile -STA -Command "& ([scriptblock]::Create([IO.File]::ReadAllText('program/editor/E2b/tools/native-save.ps1'))) -InputDir 'program/editor/E2b/staged' -OutputDir 'candidates/E2b/native' -ReportPath 'program/editor/E2b/NATIVE_SAVE.json' -StagingJson 'program/editor/E2b/STAGING.json'"
powershell.exe ... -InputDir 'candidates/E2b/native' -OutputDir '<scratch>' -ReportPath 'program/editor/E2b/NATIVE_FRESH_RELOAD.json' -Reload -GeometryFrom 'candidates/E2b/native'
node program/editor/E2b/tools/self-check.mjs E2b program/editor/E2b/source program/editor/E2b/staged candidates/E2b/native program/editor/E2b/SELF_CHECK.json
node program/editor/E2b/tools/geom-check.mjs <source diagram> <candidate diagram> program/editor/E2b/GEOMETRY.json; node program/editor/E2b/tools/conn-ends.mjs …
node program/editor/E2b/tools/model-e2b.mjs candidates/E2a-RC/native candidates/E2b/native <scratch> program/editor/E2b/MODEL_E2B.json
E2_SOURCE_ROOT=<root с кандидатом> node program/editor/E2b/tools/lv-emg.mjs
node program/editor/E2b/tools/run-regression.mjs <label> <candDir> <sandboxParent> program/editor/E2b/regression/<label>; regression-compare.mjs …
```

## Пределы
Native — offline writers; NV: IDE Verify/Build, CRC проекта/target, input-rule в IDE. Модель — runtime стенда. Самопроверки не заменяют G3.
