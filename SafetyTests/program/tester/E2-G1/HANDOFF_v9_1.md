# HANDOFF v9.1 — E2-G1, инкремент поверх v9

Срез / роль / дата: E2 G1 v9.1 / v2-tester / 2026-10-23.

Что вошло:
- XPH-01;
- S4 (`outPLC_RnD`, вопрос 78 «А»);
- исправления по ревью G1 v9: N20, N21, m-26…m-30.

HANDOFF_v9 и baseline-v9 не менялись.

## Источник
- Canonical F1 не менялся: SAL `04b45456…d28a3`, SGVL `dc103abe…a9104`, diagram `de02bbff…a603`, HEAD `dbca5dd`.
- Oracle (SHA256, 12 знаков):
  - analyst/E2-G1-v9-q/CRITERIA.md `e7937f88d676` — XPH-01, READY;
  - analyst/E2-G1-v8-r/CRITERIA.md `37619c26d08d` — §1.4b S4, вопрос 78 «А»;
  - reviewer/E2-G1-v9/G1_REVIEW.md `b9d9eed1a7a3` — N20, N21, m-26…m-30;
  - SCENARIO_DECISIONS `76b72eb6b624`.
- Кандидаты прогонялись в sandbox вне репозитория, предварительно, это не G3:
  - E2d v7.5 — candidates/E2d-v7.5, `2276d773…`;
  - E2d v7.6 — candidates/E2d-v7.6, `e4cf767e…`;
  - E2d v7.7 — candidates/E2d: SAL `c2f9ccd7a901`, SGVL `d845bd26…`, diagram `8797b832…` (подтверждено ведущим; совпадают с корнем прогона).
- program/editor/** не читал.

## Сделано

### Добавления (новые тесты)

| Файл (SHA, 12 знаков) | Что |
|---|---|
| current-e2d-xphase `db44b7900d6c` **новый** | **XPH-01:** Safe→R&D запускается legacy (1,0), удерживаемым.<br>• Жест в фазе: f ∈ {A1+10, A1+300, R−1} × δ ∈ {0, 250} × синяя/зелёная первой (12 тестов). Нет SU / C2 / снятия STO / Run до R+6000; R&D в том же скане, что X0; нет Emergency, SF — NV.<br>• f = R — DIAG.<br>• f = R+1 после чистых ≥ 2000 мс — обычный жест, подъём в [Q, Q+400].<br>• Повтор: g+1999 — игнор, g+2001 — принят.<br>• Вторая кнопка после R (×2); удержание через R ≥ 3000 мс.<br>• Фаза, запущенная BOTH: держится LV Faulty с A1+1 (WDG-02), очистка 2100 мс, жест в фазе (×2).<br>• Аварийные сочетания: in_Estop_PLC при удерживаемом BOTH → Emergency, причина 12 с, Restart → только Safe, жест не исполняется; крышка в фазе → Safe→R&D продолжается, подъёма нет до закрытия, новый жест после ≥ 2001 мс принят. |
| current-e2d-fbk-window-abort `f15ee479ef74` | **S4 (вопрос 78 «А», §1.4b).**<br>• (a) Safe→R&D по BOTH и по legacy (1,0): FALSE в [A1, K1+99] (K1 = u1+500); TRUE не позже τ_R+1 и K1+101; TRUE в каждом скане [τ_R+1, τ_R+3000].<br>• (b) SR удерживается HV Faulty: TRUE в [A−1, A+5000].<br>• (b) abort по STP-I: TRUE в [A−1, R_end]; цепной R&D→Safe после R_end — NV.<br>• (b) abort зелёной (STP-E, E3): TRUE в [A−1, R_end+3000].<br>• (c) StartingRun → Run: TRUE в [A−1, K+99]; FALSE с τ_Run+1 и в устойчивом Run.<br>• R&D→Safe, Run→R&D, WDG-03, Emergency — todo NV.<br>Без `outPLC_RnD` — ERROR стенда. |

### Правки существующих тестов (только перечисленные пункты)

| Пункт | Файл | Правка |
|---|---|---|
| **S4** (поручение) | fbk-window-abort | todo «E2d TD-14 S4 … BLOCKED Q-V8R-01» заменён проверками S4 выше. Единственная правка существующего теста по XPH/S4. |
| **N20** | fbk-window-abort, K-2 WDG-02 | Жест начинается через 300 сканов после старта драйвера, поэтому Faulty с p−200 теперь подаётся. Добавлено предусловие стенда по записанным входам: in_LV_Faulty_FBK впервые TRUE в скане fs0. |
| **m-28** | fbk-window-abort, K-2 «held» | Проверка принятия (C1 как в X0) отделена от отката. Добавлено «нет R&D в [t_f, t_f+30000]». Откат + SF на t_f+30001 — c.nv «E6», вердикт K-2 не смешан. Имя теста изменено. |
| **N21** | current-door-interlock `870b56f1fdc0` | «DOOR06 existing emergency/connector guards»: позитив оставлен только для физического маршрута. Для PLC (1,1) — запрет HV при всех исправных guards (вопрос 76). Цикл неисправностей — только физический маршрут, без ослабления. |
| **m-26** | fbk-unsolicited `eb7604fcba4f`, Q76-N2 | Новая строка: t = f+3000 при ещё включённом C2_FBK (FBK держится до f+4499), (1,1) удерживается 1500 мс. |
| **m-27** | fbk-unsolicited | V75-1: хвост «(0,0), зелёная → Safe с C1/C2 OFF к t+25000» и «нет подъёма в [t, t+25000]». Границы N5: проверка «Safe→R&D исполнен (нет отказа, Q-RC-18(b))». |
| **m-29** | fbk-window-abort, stp-i | Код не менялся. Проверки S1 в FBK-05 и STP-I имеют текст «S1 (TD-14 …»; все прочие нарушенные проверки — поведенческие. На G3 разделять по этому префиксу. |
| **m-30** | current-e2b-rel01-e2 `86d17ab3de7e` | REL01-e2-LATE-A без `recRndC_SU`: сначала проверки, не зависящие от A (нет первого подъёма ≥ s+1; нет нового подъёма ≥ s; при отказе нет Emergency), затем ERROR предусловия (c(false, …), без assert.fail). |

## ID матрицы (только факт)
Ничего не закрыто. Затронуты:
- MOD-004, MOD-001, MOD-002, BTN-001/002/006/007 — XPH-01;
- MOD-006, MOD-001, MOD-002, PLC-интерфейс — S4;
- MOD-001, WDG-002 — K-2;
- MOD-007 — DOOR06, вопрос 76.

## Команды воспроизведения
```
cd SafetyTests
node --test --test-reporter=tap test/current-e2*.test.js > e2.tap && node program/tester/E2-G1/summarize.mjs e2.tap
node --test --test-reporter=tap $(ls test/current-*.test.js | grep -v current-e2) > non-e2.tap
npm run check:software
# кандидат: корень с MEN001_Dyno/Safety_Dyno из candidates/<E2d-v7.5|E2d-v7.6|E2d>/native (вне репозитория), затем
E2_SOURCE_ROOT=<root> node --test test/current-e2d-xphase.test.js
E2_SOURCE_ROOT=<root> node --test --test-name-pattern="S4|K-2" test/current-e2d-fbk-window-abort.test.js
E2_SOURCE_ROOT=<root> node --test --test-name-pattern="LEG11|UNL-LVF" test/current-e2d-fbk-unsolicited.test.js test/current-e2d-unlock-door.test.js
E2_SOURCE_ROOT=<root> node --test $(ls test/current-*.test.js | grep -v current-e2)
```
baseline-v9.1/ содержит:
- F1: e2-g1v91.normative.tap / .summary.jsonl (1153), non-e2.tap, check-software-v91.out, f1-xph.tap, f1-s4.tap;
- кандидаты: cand-E2d-v7.{5,6,7}.{xph, s4k2, leg11-unl, non-e2}.tap.

## Результаты — canonical F1

### E2 — 1153 теста
Против v9: удалено или переименовано 5 (todo S4 и 4 имени K-2 «held»), добавлено 53, у сохранённых имён статус не менялся (0).

| Класс | PASS | FAIL | NV |
|---|---|---|---|
| нормативные (1102) | 95 | 936 | 71 |
| DIAG (42) | 42 | — | — |
| KF (9) | 0 | 9 | — |

FAIL 936 = 2 ERROR (TA-OWNER, TD-09) + 747 покрытие + 187 содержательных.
- XPH-01 на F1: 22 FAIL. Все — покрытие: R&D на F1 недостижим, R = undefined; фаза, начатая BOTH, на F1 закрывается сразу (D-ARCH-POL).
- S4 на F1: 6 FAIL. Покрытие: R&D/Run недостижимы, τ_R = undefined.

### Вне E2 — 487 / 463 / 24 fail
- Как в v9.
- Плюс «DOOR06 existing emergency/connector guards» pass→fail (N21): F1 по (1,1) поднимает HV — содержательный RED против вопроса 76.

### check:software — exit 1
- harness 284/284 PASS (D2 ERROR из v9 устранён стендом), historical 75/75.
- current: 1638 / 598 / 969.
- case IDs 0/0.
- tests: missing 33, added 826, statusChanged 7:
  - DOOR06 ×3 — вопрос 76;
  - EMG6-01 Safe fail→pass;
  - 2 rnd-down;
  - paired producer.
- expected deltas 34 / explained 34 / **unexplained 0**. Новых записей не нужно. statusChanged DOOR06 guards — информационно (вопрос 76).

## Результаты — кандидаты (предварительно, не G3)

| Набор | E2d v7.5 `2276d773` | E2d v7.6 `e4cf767e` | candidates/E2d `c2f9ccd7` («v7.7») |
|---|---|---|---|
| XPH-01 (23) | 17 FAIL / 4 PASS / 2 NV — жест исполняется (MOD-004) | 17 FAIL / 4 PASS / 2 NV — то же | **0 FAIL**, 6 PASS / 17 NV (NV — только символ SF) |
| S4 + K-2 (15) | 7 FAIL: S4 (a) legacy, (b) STP-I, (b) green-E3; **K-2 p−200 ×2, p+900 ×2** | 3 FAIL: только S4 (a) legacy, (b) STP-I, (b) green-E3; K-2 — PASS/NV | 3 FAIL — как v7.6 |
| LEG11 + UNL-LVF (119) | 11 FAIL: Q76-N4 ×2, N7(b), **UNL-LVF ×8** | 3 FAIL: N4 ×2, N7(b) | 3 FAIL — как v7.6 |
| вне E2 (487) | 50 FAIL | 50 FAIL | 50 FAIL |

**N20 / M-E2d-32.** Строка K-2 «Faulty с p−200» стимул теперь подаёт:
- на v7.5 — FAIL «K-2 RED: start refused by LV Faulty» (×2);
- на v7.6 и c2f9ccd7 — PASS/NV.

Вместе с UNL-LVF (8 FAIL на v7.5, 0 на v7.6) это убийцы M-E2d-32 по схеме «FAIL на старом источнике, PASS на новом». Точную дельту v7.5 → v7.6 подтверждает стенд.

**N21.** DOOR06 на всех трёх кандидатах PASS: оба «actual HV chain …/NC1true/NC2true» и «existing emergency/connector guards».

**Вне E2 на кандидатах — 50 FAIL, одинаково на трёх версиях.** Это не регресс поведения.
- Пины F1-identity: V2ID, MENTEE05 «original …», сборки F1.
- Маршрут legacy Network5 удалён в кандидатах (Q-ARCH-06): MENTEE05 paired legacy-Network5 ×6, «HV stale aggregate», «paired producer» — подграф отсутствует.
- Это класс D-E2b-4. Решение о переносе в V2ID или пометке N/A — за ведущим и стендом.

**S4 на кандидатах — содержательные находки, не атрибутированы, архитектору:**
- **(a) legacy (1,0).** `outPLC_RnD` TRUE на A1+601. При u1 = A1+2 это u1+599, а R&D подтверждён в тот же скан (τ_R = K1+99). R&D ≤ K1+99 противоречит RND-CONF-T. Путь BOTH — PASS. Значит, на legacy-пути (1,0) R&D подтверждается на 1 скан раньше нормы, и это отражается в S4.
- **(b) STP-I.** `outPLC_RnD` FALSE на A+602, внутри [A−1, R_end], во время abort по потере LV. Нарушает S4(b) «без единого FALSE-скана».
- **(b) green** — честный RED до E3: abort StartingRun зелёной не исполняется.

**XPH-01** исправлен на c2f9ccd7 и остаётся FAIL на v7.5/v7.6 (+1012, MOD-004, уже у архитектора).

## Допущения и пределы
- XPH-01:
  - фаза по legacy (1,0) удерживается до конца трассы, как в X0;
  - R — первый скан основного R&D трассы без жеста;
  - в аварийном сочетании причина держится 12 с: цепь Emergency завершается, как в EMG-тестах. При 6 с Restart отклонялся на кандидате — это не норма.
- S4: τ_R / τ_Run — первые сканы основного состояния (one-hot); K1 = u1+500, K = u+500 при планте A2 (FBK через 1 скан, норма).
- K-2 «held»: откат WDG-02 30 с — E6, только NV-наблюдение.
- Скан 1 мс, программная модель; native/IDE/Target не проверялись.

## Не сделано / остаток
- Пины подграфов (класс D-E2b-4; на кандидатах 50 FAIL вне E2) — решение за ведущим и стендом.
- Q76-N7(c), S4 для R&D→Safe / Run→R&D / WDG-03 / Emergency — NV.
- G3 не проводился.

## Вопросы
- Нет.

## Что передать
- **Ревьюеру (повторный G1 по N20/N21 и инкремент v9.1):** таблицы выше.
- **Архитектору:**
  - S4 (a) legacy: R&D на u1+599;
  - S4 (b) STP-I: FALSE на A+602;
  - XPH-01 исправлен на c2f9ccd7;
  - testFiles = 29 (+ current-e2d-xphase.test.js);
  - убийцы: M-E2d-32 — K-2 p−200 и UNL-LVF; MOD-004 — XPH-01.
- **Стенду:**
  - дельта v7.5 → v7.6 для M-E2d-32;
  - 50 FAIL вне E2 на кандидатах (D-E2b-4).
