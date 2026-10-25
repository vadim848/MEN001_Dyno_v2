# HANDOFF — E2-G1 (тесты до кода)

Срез / роль / дата: E2 G1 / v2-tester / 2026-10-21.

Источник (canonical F1, HEAD 7d7aecd, не менялся):
SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3,
SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104,
diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603.
Oracle: SCENARIO_DECISIONS.md (рабочая копия, не закоммичена) — тесты выведены по
c1e7fe6cf7aa1adbf7fcc33452c393bddd6f2cc4dfc02140ab55e621c0fd7bdf; к моменту сдачи файл уже
fdbb6675e7eec72190c25e8f4bc814738e931f64d137d2fcf4ba747e2c3e24c7 (добавлены Q-ARCH-01/03; на написанные
утверждения не влияют, см. «Пределы»). CRITERIA.md v2 (сейчас f2f11d77…aa3); PLAN v2 c443079d…a39e и
MUTATION_PLAN_E2a…d v2 — только имена/мутации. Node v22.22.0.

## Сделано

| Файл | SHA256 | Тестов | Критерии |
|---|---|---|---|
| test/helpers/e2-lifecycle.js (новый; существующие helpers не менялись) | f8b15f38…d56 | — | — |
| test/current-e2a-status.test.js | 20ba98ba…d1a4 | 47 | E2-01, E2-04 (старт) |
| test/current-e2a-race.test.js | 281a2331…c1a7 | 40 | E2-02 |
| test/current-e2b-interlock-run.test.js | c9d93125…1b3c | 12 | IL-03 (бывш. IL-03b) |
| test/current-e2a-rnd-cover-healthy.test.js | 9fa8de79…ff7 | 32 | IL-01, IL-02, IL-02b(a)(c), HLT-01, HLT-01b, HLT-02, POL-01(b) |

Fixture: весь SAL + GVL1 (без вырезания подграфа и подмены границ; число блоков не фиксировано —
те же тесты пойдут на кандидате/мутантах через E2_SOURCE_ROOT), whole-source binding audit и
native-structure preflight до запуска. Lifecycle реальный (Restart → Safe → BOTH → R&D → BOTH →
Run → зелёная …); устойчивые Safe/R&D/Run достигаются один раз на процесс и выдаются копиями (fork).
Статус: если в источнике есть STS_SAFE/RND/RUN/EMG — читаются они; иначе (D2-A) вычисляется по
формуле PLAN v2 §2.5 над b_Step* и b_EStop_Ok. Имена входов — после D-ARCH-POL-RENAME
(in_LV/HV_Faulty_FBK); на источнике со старыми именами helper пишет тот же сырой уровень в
in_*_Healthy_FBK (таблица соответствия в create()). Поэтому мои 4 файла в миграции переименования
(PLAN §3 E2a п.5) не нуждаются — их можно вычеркнуть из списка 17.

Сценарии кратко: E2-01 — 3 полных lifecycle (зелёная удерживается/отпущена 550/800, повторный
R&D→Run, R&D→Safe), EStop в 7 фазах + Restart, in_Estop_PLC в R&D/Run, свип EStop −3…+3 скана
относительно C2_FBK OFF, старт при in_Safety_Run TRUE, дочерние фазы (зелёная в StartingRun, BOTH во
время R&D→Safe); на каждый сценарий отдельно «стадий ≤1», «ровно один статус + своевременность»,
«конечные состояния». E2-04 — старт группы до Restart: только Emergency, энергии нет.
E2-02 — L/H × {удерж., h=C2 OFF+50 | удерж., +300 | отпущ. 550, +300 | отпущ. 800, +300} × d=1…5.
IL-03 — NC1/NC2/оба × Door T/F × причина снята через 12000/100 мс; дифференциально против
in_Estop_PLC в том же скане + защёлка + нет повышения энергии/Unlock + конечное EMGREF-RUN.
IL/HLT — NC1/NC2/оба × Door T/F.

## ID матрицы и их статус (только факт)

Все перечисленные тесты на canonical FAIL, кроме 5 PASS (ниже). EMG-012/MOD-006 (E2-01/02/04),
STP-004 (E2-02), EMG-002/CVR-006 (IL-01/02/02b/03), MOD-005/MOD-008 (HLT-01/02), CVR-004 (IL-02),
POL-01 — написаны, RED.

## Команды воспроизведения

```
cd SafetyTests
F="test/current-e2a-status.test.js test/current-e2a-race.test.js test/current-e2b-interlock-run.test.js test/current-e2a-rnd-cover-healthy.test.js"
node --test --test-reporter=tap $F                       # нормативно (D-ARCH-POL)
E2_LV_HEALTHY_MODE=split node --test --test-reporter=tap $F   # ТОЛЬКО диагностика (A3)
E2_SOURCE_ROOT=<корень с MEN001_Dyno/Safety_Dyno> node --test $F   # кандидат на G3
node program/tester/E2-G1/summarize.mjs <file.tap>      # по строке на тест с первой ошибкой
npm run check:software
```
Сохранено в program/tester/E2-G1/: baseline/e2-g1.raw-false.{tap,summary.jsonl} (нормативный),
baseline/e2-g1.split.* (диагностика), check-software.out, current-stage.tap, summarize.mjs.

## Результаты

npm run check:software (exit 1): harness PASS 209/209; historical PASS 75/75; current FAIL
592 тестов / 466 pass / 126 fail (было 461/461: +131 новых, 461 прежних pass, все 126 not ok —
новые E2-тесты, прежних not ok нет); current SAL {PASS 199, FAIL 1, NOT VERIFIED 7, ERROR 0} —
без изменений (FAIL — прежний STATE:conflicting-set-requests).

Нормативно (raw FALSE = исправно), 131 тест: PASS 5 / FAIL 126 / NV 0.
PASS: `E2a E2-01 stages<=1: in_ES_NC_1 FALSE in Safe, Restart`; `E2a E2-01 exactly one status: in_ES_NC_1 FALSE in Safe, Restart`;
`E2a E2-01 exactly one status: in_ES_NC_1 FALSE in Safe->R&D, Restart`; `E2a E2-04 group start before Restart: status Emergency only [in_Safety_Run false]` и `[… true]`.
FAIL, дословно по группам:
- 118: `precondition not reached within 3000 ms: R&D after BOTH from Safe (t=6213, stages=b_Step12, statuses=STS_SAFE)`
  (в т.ч. в обёртках `scenario aborted (coverage incomplete): …` / `lifecycle precondition failed: …`) —
  canonical N11/FBAnd4.AndIn3 требует сырое TRUE для входа в R&D, противоречие D-ARCH-POL. Ожидаемый RED.
- 6: `Safe->R&D accepted with the cover open (V14-Q7, MOD1-01); stages=b_Step1 out_LV_C1=false` (IL-01).
- 1: `more than one stage memory active (E2-01; phase at injection: b_Step12 …) :: 't=3114: b_Step1+b_Step12'`.
- 1: `in_LV_Faulty_FBK present (D-ARCH-POL-RENAME)` (POL-01b; до E2a ожидаемо).

Диагностика (E2_LV_HEALTHY_MODE=split — прежняя условность стенда, не приёмка): PASS 33 / FAIL 98.
Показывает, что скрыто за RED полярности (дословно, t обобщено):
- S1∧S12 1 скан на входе в Safe→R&D: `'t=3114: b_Step1+b_Step12'`.
- EStop/in_Estop_PLC в Run и Run-down, свип −3…+3: `'t=…: b_Step3+b_Step4'` (далее S4∧S5, S5∧S6).
- in_Safety_Run TRUE: `'t=…: [STS_SAFE+STS_RUN] stages=b_Step1+b_Step3'` (2805 сканов).
- Lifecycle: `'Run->R&D by green (release held|550|800): R&D not reached within 15000 ms (STP-A last row), stages=b_Step12'`.
- E2-02: 18 × `Step4^Step12 forbidden (E2-Q1)` (d=1…3 при h=+300), 22 × `one stage per scan (E2-01) :: 't=…: b_Step3+b_Step4'`.
- IL-03: 12 × `'t=… stages: InterLock=b_Step3+b_Step4 vs in_Estop_PLC=b_Step3'` (на скан раньше, без защёлки).
- IL-02b(a): `R&D->Safe with the cover open (MOD5-01, V14-Q21a); stages=b_Step_RnD`; IL-02b(c):
  `transition continues to Safe (Q-RC-03 b1); stages=b_Step_RnD`; HLT-01/01b: `LV lost … -> Safe …; stages=b_Step_RnD`.
- PASS в split: IL-02 ×6, HLT-02 ×2, большинство «exactly one status» при EStop (derived-статус), E2-04 ×2,
  обе проверки дочерних фаз.

## Допущения и пределы доказательства

- A1 in_Safety_Run (нет в R0): основной вариант FALSE + **объявленная инъекция** начального Safe
  (одна запись памяти b_Step1 после Restart, как declareSafe в full-program-source.js); вариант TRUE —
  реальный старт без инъекции (отдельные тесты).
- A2 объект: C1/C2_FBK = команда с задержкой 1 скан, STO_FBK = !STO_DR. В E2-02 тест держит C2_FBK ON
  ≤ 305 мс после команды OFF (ниже 500 мс STP-C); в IL-02b(c)/дочерней фазе — C1_FBK ON; HV raw TRUE
  держит StartingRun.
- A3 полярность D-ARCH-POL нормативна; split — только диагностика.
- A4 переименование через таблицу соответствия (см. выше).
- A5 скан 1 мс, наблюдение после полного скана.
- A6 статус: опубликованный STS_* либо формула D2-A архитектора. При D2-A «ровно один статус»
  сводится к исключительности групп стадий и правилу Emergency — это соглашение наблюдения, не oracle;
  отдельная проверка «стадий ≤ 1» независима от него.
- A7 E2_SOURCE_ROOT для кандидата.
- Фаза инъекции EStop задана фиксированным смещением; фактически попавшая фаза печатается в сообщении.
- READY-D: «нет Emergency в нормальном lifecycle», «статус не раньше FBK» (SPEC §6, MOD1-01, MOD-002,
  STP-A, MOD5-01); зелёная в StartingRun / BOTH в R&D→Safe — только в безопасную сторону (STP-E,
  D-STARTINGRUN-GREEN-DOWN, MOD-004).
- «Нет fault» наблюдается только как b_EStop_Ok TRUE и не STS_EMG (SafetyFault нет в canonical).
- IL-03 после Restart требует лишь равенства с in_Estop_PLC (выход — EX). Q-ARCH-01 (ответ А получен после
  написания): тесты EStop в R&D/Safe→R&D не утверждают ни сохранение, ни снятие LV и куда ведёт Restart —
  противоречия нет, но и покрытия Q-ARCH-01 нет.
- Условные FAIL (split) не названы доказанными дефектами.

## Мутации (планы v2) — каким тестом убиваема

| Мутация | Убивающий тест (имя начинается с) | Примечание |
|---|---|---|
| E2a-01 FBOr1.OrIn3 | `E2a E2-01 stages<=1: lifecycle…` | |
| E2a-02 FBOr13.OrIn3 | `E2a E2-01 stages<=1: lifecycle…`, `E2c HLT-01…` | |
| E2a-03 FBOr13.OrIn4 | `E2a E2-01 stages<=1: lifecycle…` | |
| E2a-04 FBOr13.OrIn2 | `E2a E2-01 stages<=1: Run-down with C2_FBK held … −3…+3` | |
| E2a-05 FBOr5.OrIn2 | `E2a E2-01 stages<=1: in_ES_NC_1 FALSE in Run` | |
| E2a-06 FBOr5.OrIn3 | `E2a E2-01 stages<=1: lifecycle…`, `E2a E2-02 …` | |
| E2a-07 FBOr16.OrIn2 | `E2a E2-01 endpoints…`, `E2a E2-02 …` (R&D не достигнут) | |
| E2a-08 FBOr16.OrIn1 | любой тест через R&D (precondition) | assertion, не ERROR |
| E2a-09 RUN_DOWN_RESET.OrIn1 | `E2a E2-01 endpoints: lifecycle…` (повторный R&D→Run) | |
| E2a-10 FBOr7.OrIn2, E2a-11 FBOr9.OrIn2 | `E2a E2-01 stages<=1: in_ES_NC_1 FALSE in Run` (удержание 10 с) | |
| E2a-12 FBRs8 Reset inv. | precondition R&D | |
| E2a-13 HEALTH_GUARD.OrIn1 | `E2a E2-02 …` | |
| E2a-14/15 HEALTHY_OK.AndIn1/2 inv. | precondition «steady Run» во всех Run-тестах | |
| E2a-16 N11/FBAnd4.AndIn3 inv. | precondition R&D | |
| E2a-17 swap-order | — | оператора нет: NV |
| E2b-01 FBOrIlRunOk.OrIn2 | precondition «steady Run» | |
| E2b-02 FBOrIlRunOk.OrIn1 | `E2d IL-01…`, `E2d IL-02…` | regex плана `^E2b ` их не учтёт — нужно `^E2[a-d] ` |
| E2b-03 FBOrIlRunOk.OrIn3 | **нет** | IL-05b(1) (крышка в Run-down) не написан — пробел |
| E2b-04 FBAndNotRunSu.AndIn2 | **нет** | IL-05a (крышка в StartingRun) не написан — пробел |
| E2b-05…09 | `E2b IL-03 …` | |
| E2b-10 FBAndSuEmg.AndIn1 | `E2a E2-01 stages<=1: in_ES_NC_1 FALSE in Run` | вероятно; проверить на G3 |
| E2b-11 FBOrStep4.OrIn2 | **нет** | EStop в StartingRun проверяет только стадии/статус; EMGREF-RUN в StartingRun (IL-05a/Q-ARCH-01) не написан |
| E2b-12 FBAnd1.AndIn4 | **нет** | EMG-004 (LV connector в R&D) не в объёме |
| E2c-01 HLT_LV.AndIn1 inv. | precondition «steady R&D» | |
| E2c-02 GATE_SG_SET.OrIn2 | `E2c HLT-01…`, `E2c HLT-01b…` | |
| E2c-03 GATE_SG_SET.OrIn1 | `E2a E2-01 endpoints…`, `E2d IL-02b(a)…` | |
| E2d-01 GATE_020.AndIn6 | `E2d IL-02…` (BOTH отклонён) | |
| E2d-02 GATE_030.OrIn5 | `E2d IL-02…` (удержание через закрытие) | |
| E2d-03/04 N1/FBAnd4 (Bypass) | **нет** | CFG-02 не в объёме |
| EQ: RUN_DOWN_RESET.OrIn2 (MU11), N7/FBAnd8.AndIn5, N6/FBAnd18.AndIn4 | — | эквивалентность — ревьюеру |

Для раннера: в планах testFiles заданы шаблонами (`current-e2a-*.test.js`), а раннер ищет точные
имена — нужно перечислить 4 файла явно; behaviouralTests — `^E2[a-d] `. Файл
current-e2a-rnd-cover-healthy.test.js содержит тесты E2c/E2d/E2a (по префиксам имён).

## Вопросы аналитику/Вадиму

1. in_Safety_Run (не в R0): в работе PLC в RUN (TRUE)? → каким значением задавать вход → от этого
   зависит, достижим ли Safe без инъекции (canonical с TRUE даёт S1∧S3 при входе в Run).
2. R0 v2 «Safe — через EMG6-01»: при in_Safety_Run FALSE canonical после Restart стадии не имеет;
   допустима ли объявленная инъекция Safe до EX/BOOT?

## Что передать дальше и кому

Ревьюеру G1: проверить oracle по ссылкам в шапках файлов. Архитектору: явные testFiles/regex,
пробелы E2b-03/04/11/12, E2d-03/04 — нужны тесты IL-05a/IL-05b/EMG-004/CFG-02 (отдельное поручение).
Аналитику: вопросы 1–2. Не написанное — BLOCKED.md.
