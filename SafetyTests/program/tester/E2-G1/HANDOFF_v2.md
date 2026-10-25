# HANDOFF v2 — E2-G1 (тесты до кода, доработка по G1_REVIEW C1/C2/C4, M1–M6 и новым ответам Вадима)

Срез / роль / дата: E2 G1 v2 / v2-tester / 2026-10-21.

Источник (canonical F1, не менялся; HEAD сейчас b580920, при старте 7d7aecd — SAL/SGVL те же):
SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3,
SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104,
diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603.
Oracle: SCENARIO_DECISIONS.md рабочая копия **bdf55216dab6e4aa3e3a1c01ae51f9441d2a3664c5ec8fd93955379bbbdb86fe**
(на старте 93d7c35e…, далее 64d1d638…; последние добавления — Q-E2Q-01/02, Q-RC-12/13/15/16/17/18/19,
Q-REL-AFTER-PERMIT — учтены). CRITERIA v2 f2f11d77…aa3 + analyst E2-G1-questions/CRITERIA_DELTA.md a017cbde…
(JSON 7e94b53b…), QUESTIONS.md cb959dd3…. G1_REVIEW.md — условия C1, C2, C4, замечания M1–M6. PLAN v2 — только имена.
Node v22.22.0. Код программы/стенда не трогал; scripts/sal-mutation-check.js не трогал.

## Сделано

| Файл (SHA256) | Тестов | Критерии |
|---|---|---|
| test/helpers/e2-lifecycle.js (82c15f54…f97e) | — | A1 TRUE, restart-жест, checks(), restartToSafe, SafetyFault-наблюдение |
| test/helpers/e2-emergency.js (f23069c8…13da) | — | генератор EMGREF/EMGREF-LV/EMGREF-RUN/EMG6-01 сценариев и свипа |
| test/current-e2a-status.test.js (c888809c…4af0) | 13 (1 DIAG) | E2-01 lifecycle ×3, E2-04 (3000 мс), дочерние фазы |
| test/current-e2a-emg-safe.test.js (ca9001f7…983f) | 24 | EMG6-01/EMGREF(+LV (2)) Safe, Safe→R&D; E2-01 |
| test/current-e2a-emg-rnd.test.js (f775a15a…504e) | 32 | EMGREF-LV (1) R&D, R&D→Safe; EMG4-03; E2-01 |
| test/current-e2a-emg-run.test.js (013bbf3c…4bc7) | 32 | EMGREF-RUN StartingRun, Run; EMG4-03; E2-01 |
| test/current-e2a-emg-rundown.test.js (c44e897d…019e) | 16 | то же для Run-down |
| test/current-e2a-sweep-estop.test.js (fdff3064…3334) | 42 | свип ES_NC_1/ES_NC_2/Mentee −3…+3 вокруг C2_FBK OFF |
| test/current-e2b-sweep-connector.test.js (ce249a50…1786) | 28 | свип LV/HV connector |
| test/current-e2a-race.test.js (df0686bd…519e) | 42 | E2-02 (+Q-E2Q-02 NV, +Q-RC-16 вариант Lr ×2) |
| test/current-e2a-rnd-cover-healthy.test.js (548a2c7c…a626) | 33 | IL-01, IL-02, IL-02b(a)(c), HLT-01/01b/02 (+SafetyFault NV), POL-01(b)(c) |
| test/current-e2a-run-conf.test.js (ca26320a…e41c) | 4 | RUN-CONF (MOD-002, Q-ARCH-09) |
| test/current-e2b-interlock-run.test.js (d222b4c0…283f) | 12 | IL-03 (сравнение по выходам, Restart → Safe) |
| test/current-e2b-cover-transitions.test.js (5e47ae47…75be) | 20 | IL-05a, IL-05b(1)(2), IL-02 границы, IL-05d(1)(3) |
| test/current-e2b-connector-safe.test.js (4bb2f141…9ef6) | 6 | EMG4-03 в Safe (EMG-003) и граница u−1/u+1 |
| test/current-e2c-stp-i.test.js (8a05ec4d…fc3d) | 8 | STP-I, STP-I(4) |
| test/current-e2c-hlt03.test.js (ebc9fd0a…caf3) | 5 | HLT-03 (a)–(d) |
| test/current-e2d-release-permit.test.js (c655eea8…ec6a) | 6 | Q-REL-AFTER-PERMIT «А» |

Итого 323 теста, из них 322 нормативных (^E2[a-d] ) и 1 DIAG.

Условия ревью:
- **C1.** Нормативно `in_Safety_Run` TRUE постоянно, без инъекции: старт → Emergency → Restart → Safe (`boot`).
  `x.step` запрещает задавать `in_Safety_Run`. Вариант FALSE + declareSafe — только при `E2_INJECTED_SAFE=1`.
  Тогда все имена получают префикс `DIAG [injected-Safe, in_Safety_Run FALSE] `. В нормальном прогоне
  есть один DIAG-тест: E2-04 [in_Safety_Run false]. Режим `split` тоже получает префикс `DIAG [split] `.
  Под `^E2[a-d] ` диагностика не попадает. A1 исправлено: у `in_Safety_Run` два потребителя —
  `//RunStop` группы и `//Network3/FBAnd1/AndIn1`.
- **C2.** Каждый Emergency-сценарий завершается `restartToSafe`. Это emergencyIn (7 фаз × 8 причин),
  свип, IL-03, IL-05a, IL-05b-граница, IL-05d, EMG4-03 u+1. Перед Restart проверяется:
  энергия снята (C1/C2/C3/BMS OFF, STO активен, C1_FBK и C2_FBK OFF), Emergency удерживается.
  После Restart в течение 2000 мс нет R&D/Run/S12/Config и нет энергии. В конце — только b_Step1 и только STS_SAFE.
  Также проверяется отказной Restart: при активной причине на e+1000 (для R&D/Run это одновременно до C1_FBK OFF)
  Emergency сохраняется до финального Restart, отложенного выхода нет.
- **C4.** Написаны: EMGREF-LV (дифференциально с in_Estop_PLC в устойчивом Run; Q-E2Q-01 «А» снял блок —
  C1 OFF на q−1/q+1 и для Safe→R&D), STP-I (Q-ARCH-03), EMG4-03 (Q-RC-14), RUN-CONF (Q-ARCH-09),
  HLT-01/01b/02/03 (SafetyFault → NV), POL-01(b)(c) outPLC_*_Faulty, IL-05a/b.
- **M1.** IL-03 сравнивает только выходы; различия стадий/статусов выводятся через `t.diagnostic`.
- **M2.** HLT-01: assert, что C3 и BMS включены до потери LV (база R&D с ручным set MOD-C3).
- **M3.** Границы IL-02: N=u−1 нормативна (отклонено); N=u — наблюдение (см. вопросы); N=u+1 = IL-05a c=u+1.
- **M4.** В свип добавлены ES_NC_2, Mentee, LV/HV connector; E2-04 наблюдается 3000 мс.
- **M5.** Restart (A9): синяя отпущена, зелёная отпущена ≥10 сканов, затем нажатие 100 мс и отпускание. В свипе зелёная 600 мс отпускается до события.
- **M6.** `L.checks()` собирает все нарушенные проверки теста и выводит их списком. Предусловия по-прежнему прерывают тест.

Ответы Вадима после начала работы:
- Q-E2Q-01 «А» — C1 OFF в Safe→R&D через 2 с, проверка нормативна.
- Q-E2Q-02 «А» — SafetyFault в E2-02(L), NV.
- Q-RC-16 «А» — STP-I(4) и гонка с возвратом LV (вариант Lr).
- Q-RC-17 «Б» — IL-05d(1)(3).
- Q-REL-AFTER-PERMIT «А» — новый файл.
- Остальное (STP-H, Q-RC-12/19, Q-ARCH-04, Q-RC-13, Config) — BLOCKED_v2.md с этапом.

## ID матрицы и их новый статус (только факт)

На canonical все нормативные тесты E2 — FAIL, кроме 21 PASS и 2 NV (ниже). Затронутые ID: EMG-001/002/004/006,
EMG-012/MOD-006 (E2-01/02/04), MOD-002 (RUN-CONF, STP-I), MOD-005 (HLT-01/03), MOD-008/POL, STP-004 (E2-02),
CVR-004/006 (IL-*), EMG-003. Тесты написаны, RED; ничего не закрыто.

## Команды воспроизведения

```
cd SafetyTests
node --test --test-reporter=tap test/current-e2*.test.js                       # нормативно (~75 с на canonical)
E2_LV_HEALTHY_MODE=split node --test --test-reporter=tap test/current-e2*.test.js   # ТОЛЬКО диагностика (~190 с)
E2_INJECTED_SAFE=1 node --test test/current-e2*.test.js                          # ТОЛЬКО диагностика (injected Safe)
E2_SOURCE_ROOT=<корень с MEN001_Dyno/Safety_Dyno> node --test test/current-e2*.test.js   # кандидат (G3)
E2_SAFETYFAULT_SYMBOL=<имя> ...                                                  # если имя SafetyFault не содержит safety_?fault
node program/tester/E2-G1/summarize.mjs <file.tap>
npm run check:software
```
Сохранено в program/tester/E2-G1/:
- baseline-v2/current-stage-v2.tap — TAP current-стадии из check:software;
- baseline-v2/e2-g1v2.normative.summary.jsonl (323 строки);
- baseline-v2/e2-g1v2.diag-split.{tap,summary.jsonl};
- check-software-v2.out, BLOCKED_v2.md.

Прежние baseline/, HANDOFF.md, BLOCKED.md — история v1.

## Результаты

`npm run check:software` (exit 1):

| Стадия | Результат |
|---|---|
| harness | PASS 215/215 (было 209: тесты добавлены не мной, стенд) |
| historical | PASS 75/75 |
| current | FAIL: 784 тестов / 483 pass / 299 fail / 2 todo |
| current SAL | {PASS 199, FAIL 1, NOT VERIFIED 7, ERROR 0} — без изменений, FAIL прежний STATE:conflicting-set-requests |

Прежние 461 тест current — все pass. Ни одного not ok вне E2: проверено по TAP — 0 строк not ok без префикса E2/DIAG.

Нормативно по новым тестам: 322 теста → **PASS 21 / FAIL 299 / NV 2** (+1 DIAG PASS, не в счёте).

PASS:
- E2-01 и EMG6-01 EMGREF в Safe для in_Estop_PLC, ES_NC_1, ES_NC_2, Mentee (8). ES и Mentee опережают in_Estop_PLC
  на 1 скан — допущение A10, выводится в diagnostic.
- E2-01 в Safe→R&D для 8 причин.
- E2-04 [true].
- EMG4-03 граница u−1 LV/HV.
- REL-PERMIT граница 1999 (отклонено) и контроль без крышки.

NV (todo; наблюдаемая часть PASS, «без fault» ненаблюдаемо): EMG4-03 Safe LV, HV.

FAIL, дословно по причинам:
- 272 (156 в обёртке `scenario aborted (coverage incomplete): …`, 116 прямо) и 3 (`lifecycle precondition failed: …`):
  `precondition not reached within 3000 ms: R&D after BOTH from Safe (t=…, stages=b_Step12, statuses=STS_SAFE)`.
  Причина — N11/FBAnd4.AndIn3 (D-ARCH-POL). Ожидаемый RED; он закрывает все сценарии через R&D.
- 8: `energy removed before Restart (… C1/C2_FBK OFF): {"out_LV_C1":true,"C1_FBK":true}` (+5/8 прочих нарушений в тех же тестах).
  Это EMGREF-LV Safe→R&D, все причины: canonical не снимает C1, после Restart остаётся b_Step12 (Q-ARCH-01).
- 6: `Safe->R&D accepted with the cover open (V14-Q7, MOD1-01); stages=b_Step1 out_LV_C1=false` (IL-01).
- 4 (3 + 1): REL-PERMIT `Safe->R&D accepted: the 2 s pause counts buttons only, the 300 ms cover episode does not restart it; stages=b_Step1`
  и `accepted (button release 2100 ms incl. the cover episode); stages=b_Step1`. Это Q-REL-AFTER-PERMIT, ожидаемый RED.
- 2: `Emergency from u+2 and latched: … scans not Emergency, first t=… [STS_SAFE]` — EMG4-03 u+1: canonical не даёт Emergency по connector.
- 2: `R&D reached with the cover open (MOD1-01); stages=b_Step12` — IL-05b(2). Здесь RED даёт полярность, а не крышка: R&D не достигается и без события.
- 1: `in_LV_Faulty_FBK present (D-ARCH-POL-RENAME)` (+7) — POL-01(b).
- 1: `relay output symbols missing :: outPLC_LV_Faulty present …` — POL-01(c).

Диагностика `split` (обход полярности; не приёмка, условные контрпримеры, не доказанные дефекты): PASS 58 / FAIL 261 / todo 4.
- 169: `precondition: steady Run (only b_Step3, C1 ON, C2 ON, STO released); stages=b_Step1,b_Step3 C1=false C2=false STO=false/false`.
  При TRUE canonical при входе в Run ставит Safe через N3/FBAnd1 и снимает C1/C2 — это E2-01. Всё, что требует устойчивого Run, закрыто этим.
- EMGREF-LV в R&D: `energy removed before Restart … {"out_LV_C1":true,"out_C3_BatRelay":true,"out_RBM_Bat":true,"C1_FBK":true}`.
  В R&D→Safe: `after Restart never R&D…` / `still Emergency (latched) right before Restart; statuses=STS_RND`.
- StartingRun: `STO active not later than c+1 (STP-I/STP-E): STO at c+1 = true/true` (STP-I ×7);
  IL-05a `EMGREF(1): Emergency from c+1 and latched … [STS_RND] b_Step_RnD`.
- RUN-CONF ×4: `no Run at k+99 (Q-ARCH-09: 100 ms)` — canonical подтверждает Run раньше 100 мс от k.
- IL-02b(a)/HLT-01b/IL-02b(c)/HLT-01: R&D→Safe при открытой крышке или потере LV не идёт (`stages=b_Step_RnD`).
- PASS в split: IL-02 ×6, HLT-02 ×2, IL-02 граница N=u−1, IL-05b(2) ×2, дочерние фазы ×2, E2-01 при авариях в R&D/R&D→Safe/StartingRun.

## Мутации: для архитектора (планы E2a…E2d) и стенда

testFiles — точные имена, каждое в каждом плане E2a…E2d:
```
current-e2a-status.test.js, current-e2a-emg-safe.test.js, current-e2a-emg-rnd.test.js, current-e2a-emg-run.test.js,
current-e2a-emg-rundown.test.js, current-e2a-sweep-estop.test.js, current-e2b-sweep-connector.test.js,
current-e2a-race.test.js, current-e2a-rnd-cover-healthy.test.js, current-e2a-run-conf.test.js,
current-e2b-interlock-run.test.js, current-e2b-cover-transitions.test.js, current-e2b-connector-safe.test.js,
current-e2c-stp-i.test.js, current-e2c-hlt03.test.js, current-e2d-release-permit.test.js
```
behaviouralTests: `^E2[a-d] ` (с пробелом). DIAG-тесты не совпадают. Env-переменные E2_* в мутационном прогоне не задавать.
Тесты с t.todo (NV), если упали до todo, — FAIL; если прошли — `ok # TODO`. Убийством засчитывается только not ok.

Время: каждый файл — отдельный процесс, полная модель ≈0,34 мс/скан. На кандидате, где предусловия проходят,
полный пакет ≈ 3–4 мин на 19 ядрах (split-диагностика — 190 с). Для мутаций разумно ограничить testFiles по срезу.

Ожидаемые убийцы (утверждения; проверяются только на G3):
- E2b-03/04/11 — IL-05b(1), IL-05a и EMGREF-RUN в StartingRun (emg-run).
- E2b-12 — EMG4-03 (emg-rnd/emg-safe, connector-safe u+1).
- E2c-* — STP-I, HLT-01.
- E2a-17 и E2d-03/04 — как прежде, не убиваются (NV / E4).

## Q-REL-AFTER-PERMIT и MU24 (поручение ведущего)

Пробы — диагностика ревьюера, не oracle. Скрипты в scratchpad, результаты ниже.
1. **Новый RED-тест** — current-e2d-release-permit.test.js.

   | Вариант | Ожидание | canonical F1 |
   |---|---|---|
   | Safe, кнопки отпущены >2 с, крышка NC1/NC2/обе 300 мс, через 1700 мс BOTH 1100 | принято | FAIL (RED) |
   | синяя 100 мс, отпускание 2100 мс с эпизодом крышки внутри | принято | FAIL (RED) |
   | граница по кнопкам 1999 мс | отклонено | PASS |
   | контроль 2100 мс без крышки | принято | PASS |

2. **MU24 и ответ «А» совместимы.** В test/current-btn-release-after-permit.test.js кнопка удерживается во время
   эпизода крышки и отпускается после него. Значит, к попытке через 1999 мс обе кнопки отпущены только 1999 мс,
   и отказ требует п. 9/11 при любом отношении к крышке. Ответ «А» запрещает только сброс отсчёта из-за разрешения
   при уже отпущенных кнопках. Ожидания теста (1999 отклонить, 2001 принять) не меняются.

   Причина приёма на 1999 у MU24 (проба на F1 и MU24, полный SAL):
   - потеря разрешения (GATE_001 = 0) сбрасывает взвод STATE_A (`//RndPhysicalCompact/STATE_A`, Reset от GATE_001);
   - повторный взвод возможен только через GATE_016 = SNAP_P ∧ GATE_002 (обе отпущены) ∧ WINDOW.EStopOut ∧ RELEASE.TonOut;
   - у RELEASE (TON 2 с) вход GATE_008 включает GATE_001, поэтому F1 начинает отсчёт заново с отпускания
     или с возврата разрешения — в этом и дефект по «А»;
   - MU24 отключает GATE_016.AndIn4 (RELEASE), и STATE_A взводится через 1 мс после отпускания (t=1102 в пробе).
     Попытка на 1999 принимается.

   Без эпизода крышки STATE_A не сбрасывается, взвод идёт иным путём (GATE_014 тоже читает RELEASE), F1 и MU24 совпадают —
   это контроль ревьюера E1-f1-adopt. Проверено пробой:
   - сценарий Q-REL (кнопки отпущены, крышка 300 мс, BOTH через 1700): F1 отклоняет (дефект), MU24 принимает;
   - граница 1999 с эпизодом крышки: F1 отклоняет, MU24 принимает;
   - после принятой/квитирующей синей (blue 700 → BOTH через 1999/2001) F1 и MU24 совпадают.

   MU24 — не «не сбрасывать по разрешению». Это «взвод без 2 с отпускания после сброса по разрешению». Он случайно
   даёт правильный исход в сценарии «А», но нарушает п. 9 на границе 1999 мс.
3. **Чем убивать MU24 после исправления E2/E5:**
   - (а) Исправление убирает GATE_001 из входа RELEASE (отсчёт только по кнопкам), сброс STATE_A по разрешению
     сохраняется. Тогда GATE_016 остаётся путём повторного взвода. MU24 по-прежнему убивается границей с эпизодом
     крышки при отпускании 1999 мс: тест MU24 (кнопка удерживается во время эпизода) и `E2d REL-PERMIT boundary by
     buttons … 1999 ms -> rejected` (кнопки отпущены до эпизода). Оба ожидания совместимы с «А».
   - (б) Исправление убирает сброс STATE_A по разрешению. Тогда GATE_016 может стать недостижимым или избыточным,
     и MU24 — эквивалентным. Нужно структурное доказательство эквивалентности от ревьюера на G4 (как MU11) и новая
     мутация на новый guard взвода: удалить из него «обе кнопки отпущены 2 с» или вернуть GATE_001 в отсчёт.
     Новую мутацию убивают те же два теста: граница 1999 и сценарий Q-REL «принимается».
   - Без кандидата это прогноз, не результат. Проверить на G3 с мутантом по новому плану архитектора.

## Допущения и пределы доказательства

- A1 in_Safety_Run TRUE (R0 дополнение); старт группы на стенде = первый скан с начальными памятями, не native BOOT.
- A2 модель объекта. FBK повторяет команду с задержкой 1 скан. Удержания FBK в переходных фазах < 500 мс.
  Исключение — дочерняя фаза «R&D→Safe + BOTH»: C1_FBK удерживается > 500 мс, проверяется только «UP не исполнен»
  (это верно и при EMGREF по MOD5-01).
- A3 split и A1-injected — только диагностика.
- A5 скан 1 мс.
- A6 статус по D2-A, если STS_* нет.
- A8 SafetyFault наблюдается только через символ `/safety_?fault/i` или `E2_SAFETYFAULT_SYMBOL`. Нужно имя от архитектора.
- A9 жест Restart.
- **A10 (новое).** EMGREF(3) для причин ≠ in_Estop_PLC допускает опережение реакции на 0 или 1 скан. Отставание
  не допускается. Окно — e…до финального Restart. На F1 путь in_Estop_PLC → N1/FBAnd1 → FBEstop1 длиннее
  на 1 блок, поэтому ES/Mentee реагируют на 1 скан раньше. IL-03 и IL-05a сравнивают точно в тот же скан,
  как одобрено в G1. Вопрос аналитику ниже.
- Точки u, r, t_a, k, моменты abort — наблюдаются на no-event fork того же источника. Это опорные точки, не oracle.
- T_DIS = 1000 мс (Network8, запись в SCENARIO_DECISIONS).
- HLT-03 (d) 2000 включительно — явно в HLT-03(d) и WDG-06(b).
- Восстановление EMGREF-LV по моменту HV discharge: если разряда нет, только diagnostic (CRITERIA_DELTA).
- Защита от вакуума: перед проверками конечного состояния проверяется C3/BMS ON (IL-03, emg R&D/Run, HLT-01).
- Пределы:
  - программная модель SAL; не native CRC/Verify, не target, не hardware;
  - мутанты не прогонялись — кандидата нет;
  - E2-03 и E2-04 «во время работы» — структурное доказательство ревьюера;
  - пакет большой (322 теста), но число тестов не равно покрытию;
  - на canonical 272 из 299 FAIL — одно предусловие полярности, они не показывают остальные утверждения
    до кандидата (G3);
  - split частично раскрывает их (условно).

## Вопросы аналитику/Вадиму

1. **A10 / EMGREF(3).** Исходно: устойчивое состояние. Событие: in_ES_NC_1 (или Mentee, connector) против
   in_Estop_PLC в том же скане. На F1 физический EStop реагирует на 1 скан раньше PLC-команды.
   Не хватает: значит ли «в том же скане» точное совпадение, или допустимо опережение физической причины на 1 скан?
   Сейчас допускается опережение ≤ 1 скан.
2. **IL-02 N=u против IL-05a c=u.** Исходно: R&D, BOTH квалифицируется в скане u; крышка открывается в том же скане.
   IL-02 называет это «отклонён» нормативно, IL-05a — наблюдением. Не хватает: какой статус у этой границы?
   Сейчас — наблюдение.
3. **EMGREF-LV(2) «LV discharge в e (≤ e+1, как в Run)».** Справочное наблюдение аналитика: в Run +4.
   Сейчас проверяется дифференциально: момент ≤ момента в Run + 1. Абсолютное «≤ e+1» не проверяется.
4. **Q-RC-19 «В».** Нужен разбор по фазам (критерии) до написания тестов.

## Что передать следующему и кому

- **Ревьюеру G1 v2:** проверить oracle по шапкам файлов и helpers; A10; что DIAG исключены; восстановление C1–C4, M1–M6.
- **Архитектору:**
  - точные testFiles и `^E2[a-d] ` — во все MUTATION_PLAN_E2a…d;
  - имя символа SafetyFault (A8) и имена outPLC_*_Faulty;
  - прогноз по MU24 при исправлении Q-REL-AFTER-PERMIT (раздел выше);
  - IL-05a/b, STP-I, EMG4-03 теперь покрывают E2b-03/04/11/12, E2c-*.
- **Стенду:** отсутствующий файл из testFiles — ERROR, не пропуск (ревью C3); `ok # TODO` не считать kill.
- **Аналитику:** вопросы 1–4; BLOCKED_v2.md (STP-H/E3, IL-05d(2)(4), Q-RC-12/19, Q-ARCH-04 — по этапам).
