# HANDOFF v4 — E2-G1 (тесты до кода, доработка по G1_REVIEW v3 N3–N7, m-2…m-6 и CRITERIA_DELTA v5/v6)

Срез / роль / дата: E2 G1 v4 / v2-tester / 2026-10-21.

Источник (canonical F1 не менялся): SAL 04b45456…d28a3, SGVL dc103abe…a9104; HEAD на момент финального прогона a8f6de7.
Oracle:
- SCENARIO_DECISIONS.md рабочая копия db129fd35810… (включает Q-T3-1 «А», Q-RC-RUNCONF-01 «В», Q-CA1-01 «Б», вопрос 66);
- CRITERIA_DELTA v5 — program/analyst/E2-G1-v3-questions/CRITERIA.md 29f4288f…9b47;
- CRITERIA_DELTA v6 (C-A1) — program/analyst/E2-G1-v3-CA1/CRITERIA_DELTA_v6.md 3d2d8fba…0f02 (JSON 7201ae65…dc4e);
- G1_REVIEW v3 (program/reviewer/E2-G1-v3/G1_REVIEW.md).
Reference 4495a1f: pinned SAL efddc60b…0dc334, SGVL 8020e3d6…b5e757; SHA проверяется в helper (A12).
Код программы, стенд, src/scripts, emergency-phase-matrix.js не трогал.

## Сделано

| Файл (SHA256, 12 знаков) | Изменение |
|---|---|
| test/helpers/e2-rule-l.js (265384670e58) | A11 снято: L2 и L4 без no-event. Новое: EMGRDL (v5 §2, сужено до ветки А по Q-T3-1 «А» / v6 §6), noRunAfter (N3, v6 §5). SS1 введён как Imm (v6 §3). REF_RUN_PLC + SS1 = 3; REF_SAFE_PLC (v6 §2) |
| test/helpers/e2-emergency.js (bbdec4f1f7f1) | N3: строка 118 заменена на noRunAfter. Run-down и R&D→Safe — через EMG-RD-L (q_N из STP-A/B). Свип около C2_FBK OFF — EMG-RD-L. Safe: L3-Safe вместо L2. Unlock FALSE в каждом скане Emergency. Инвариант «нет снятия SS1». Добавлены refSafeProfile, refRunTrace, downTa, qNrunDown, qNabort, T_DIS |
| test/current-e2a-emg-anchor.test.js (f15eda5fe162) | Добавлены E2-STAND: пересъём L3-Safe; N3 на reference; самопроверки EMG-RD-L и noRunAfter на синтетических профилях |
| test/current-e2a-emg-rd-sweep.test.js (36df7444f56a) **новый** | N6: свип EMG-RD-L в Run-down. Точки e: t_a−1 (L3/L1), t_a+1, t_a+1999, t_a+2001, t_s+4999, t_d+T_DIS−1, ожидание C2_FBK. Причины PLC и ES1. Сочетание PLC + HV-loss STP-D. DIAG: t_a, q_N(STO), q_N(Discharge) |
| test/current-e2b-cover-transitions.test.js (956ba26adb55) | N4: ветка (ii) N=u по v6 §4 — окно u+d_R−1 ≤ τ_X ≤ a+1+d_R; повышения энергии только в a/a+1. m-2: NC2. IL-05a и N=u: статус Run по v6 §5, без b_Step3. IL-05d(1)(3) — EMG-RD-L (STP-E/I, STP-G). IL-05b граница — L4 без no-event |
| test/current-e2b-interlock-run.test.js (5fc488f3cf3a) | IL-03: «Run left ≤ t0+1 / b_Step3» → noRunAfter (тот же дефект, что N3). SS1 в EMGREF(2) |
| test/current-e2b-connector-safe.test.js (941afdefe461) | EMG4-03 u+1: L4 без no-event. SS1 в EMGREF(2) |
| test/current-e2a-run-conf.test.js (abe7910b0e94) | RC-5 READY (v6 §1): нет Run ни в одном скане ≤ k+99; + сценарий (ii) C2_FBK u+30. RC-6: 1 скан (имя v3 сохранено), 20 мс (m-5), граница k+99 → Run k+201; STO снят и C2 ON до Run; нет SS1 и Emergency. Watchdog-часть RC-6 — этап E6 (Q-CA1-01 «Б»). RC-7: L4 без no-event, Run по статусу |
| test/current-e2d-release-permit.test.js (ccf17415bbfd) | N5: REL-01(e) с удержанием 3000 мс (≥ восстановление+1000+700) для LV/HV/оба, «оба» 2000 мс и эпизод [800, 2500) с удержанием 3600 мс. m-3: R&D 2001 → принято |
| test/current-e2d-unlock-cover.test.js (e4b410dd7bbe) | m-4: UNL-04 R&D с зелёной (NC1, закрыто). UNL-04 только при Door TRUE |
| test/current-e2d-unlock-door.test.js (45d07ebafbe8) **новый** | N7, UNL-05 (v5 §1): S/R × NC (a)–(d) × синяя 1000/3000; граница Door TRUE с s−1; DIAG Door FALSE только в s; падение Door во время Unlock в Safe (d=s+600/s+1000, закрыто/NC1); Door FALSE + in_Estop_PLC; Door FALSE + зелёная (S/R) |

Не изменены: e2-lifecycle.js (8c0f7ddf3e83), emg-rnd/run (689fd43ae786 / f8ad2b8bdc5d), sweep-estop (242113d7638a), status (c9195f3bb262), stp-i (747d283c71da), summarize.mjs (07883b03012e). Их поведение изменилось через helpers.

### Пункты поручения
- **N3.** Норма — v6 §5:
  - до e был Run → STS_RUN допустим только до первого скана Emergency, момент ограничен L1–L4 (в Run L3: статус ≤ +2);
  - до e был не Run → STS_RUN запрещён в любом скане ≥ e.
  - b_Step3 не используется как oracle (emergencyChecks, свип, IL-05a, N=u, IL-03, RC-7).
  - Reference 4495a1f проходит правило: E2-STAND N3 PASS. Вокруг e: +0 STS_RUN, +1 STS_EMG.
- **N4.** Ветка (ii) по v6 §4:
  - эталон R — тот же drive с NC TRUE, `in_Estop_PLC` с c_R = a_R+1;
  - Del: u+d_R−1 ≤ τ_X ≤ a+1+d_R; STO/C2 меряются от возврата после снятия в [a, a+1], n/a не бывает;
  - Imm, включая SS1: τ_X ≤ a+1+d_R;
  - повышение энергии с a+2 → FAIL.
- **N5.** Сделано, см. таблицу.
- **N6.** A11 снято.
  - q_N только нормативно: STP-A/B — STO t_a+2000, Discharge t_s+5000, C2 t_d+T_DIS; STP-E/I/G — по qNabort. t_s и t_d берутся из той же трассы.
  - Вадим ответил на Q-T3-1 «А», v6 §6: только ветка А, окно [min(q_N, e+q_R), +1]. Ветка Б → FAIL.
  - Дизъюнкция с проверкой смешения сохранена в коде как mode 'AB' и проверена самотестом. Нормативный режим — 'A'.
  - Свип и границы — в новом файле. No-event трасса — только t.diagnostic.
- **N7.** Сделано, см. таблицу.
- **m-1.** SS1 — Imm, инвариант «SS1 не снимается», L3 ≤ +4 (v6 §3).
- **m-2…m-5.** Сделано.
- **v6 §2.** EMG6-01 PLC в Safe переведён на L3-Safe: статус ≤ ref_Safe+1 = +2. Тест FAIL→PASS — ожидаемо по v6 §2: прежний RED был RED покрытия.
- **m-6. Исправление счёта harness.** В HANDOFF_v3 указано «harness 218/218», а check-software-v3.out показывает 227/227. Верно 227/227. Сейчас harness 236/236 (стенд добавил тесты, не я).
- **Вопрос 66 (a).** E2-тестов, ожидающих отдельную память HealthyLostDuringSS1 или сброс по кнопке, нет (grep пуст). Вне E2 тестов с этими именами grep тоже не нашёл. Если они есть под другими именами — не трогал.
- **Вопрос 66 (b).** LV Safe→R&D: 30 с от C1_FBK ON, затем откат в Safe + SafetyFault — этап E6, не написано (BLOCKED E6).

## ID матрицы и их новый статус (только факт)

Ничего не закрыто. Затронуто:
- EMG-001/002/004/006/011 (N3, EMG-RD-L, L3-Safe, SS1);
- EMG-002/CVR-006 (N=u);
- BTN-001/002, CVR-004 (REL-01);
- CVR-001/003/004/006 (UNL-05, UNL-04 R&D);
- MOD-002/WDG-003 (RC-5/RC-6);
- MOD-006.

## Команды воспроизведения

```
cd SafetyTests
node --test --test-reporter=tap test/current-e2*.test.js > e2.tap          # ~100 с
node program/tester/E2-G1/summarize.mjs e2.tap                             # NV / DIAG отдельно
node --test test/current-e2a-emg-anchor.test.js                            # E2-STAND: L3, L3-Safe, N3 на reference, самотесты
npm run check:software
E2_SOURCE_ROOT=<корень кандидата> node --test test/current-e2*.test.js     # G3
```

Сохранено в program/tester/E2-G1/baseline-v4/:
- e2-g1v4.normative.tap;
- e2-g1v4.summary.jsonl;
- check-software-v4.out.

## Результаты

### `npm run check:software` (exit 1)

| Стадия | Результат |
|---|---|
| harness | PASS 236/236 |
| historical | PASS 75/75 |
| current | FAIL: 919 tests / 525 pass / 384 fail |
| current SAL | {PASS 199, FAIL 1, NV 7, ERROR 0} |
| case IDs | missing 0, statusChanged 0 |
| tests current vs baseline | missing 0, added 74, statusChanged 1 (explained) |
| expected deltas | unexplained 0 |

- Вне E2: 23 файла, 477 тестов, 0 not ok. Все 384 fail — тесты E2, новых падений вне E2 нет. Два добавленных файла вне E2 не мои.
- Harness «missing 1, added 9» — стенд, не мои файлы.

### E2 (442 теста)

Нормативно: **PASS 35 / FAIL 384 / NV 10**. Отдельно DIAG/E2-STAND: **13 PASS**.

Сравнение с v3 по имени:
- изменился статус ровно одного теста: «E2a EMG6-01 EMGREF: in_Estop_PLC TRUE in Safe» FAIL→PASS (L3-Safe, v6 §2);
- удалённых нет;
- добавлено 62.

FAIL по причинам (дословно, сгруппировано):

| Число | Причина |
|---|---|
| 346 | `precondition not reached within 3000 ms: R&D after BOTH from Safe (… stages=b_Step12, statuses=STS_SAFE)` (182 в обёртке `scenario aborted (coverage incomplete)`, 161 прямо, 3 `lifecycle precondition failed`). Неполнота покрытия: полярность, R&D/Run недостижимы на canonical. Сюда входят все новые Run/R&D-тесты: свип EMG-RD-L, RC-5(ii)/RC-6, N=u NC2, REL-01(c) 2001, UNL-04/05 R&D |
| 8 | EMGREF-LV Safe→R&D `energy removed before Restart … {"out_LV_C1":true,…}` — как в v3 |
| 7 | REL-01(e) `permit absent at the qualification: … held gesture not executed after restoration` — LV/HV 2000 (как в v3) + 5 новых (3000 LV/HV/оба, 2000 оба, [800, 2500) 3600). Дефект canonical: удерживаемый жест исполняется после восстановления |
| 6 | IL-01 `Safe->R&D accepted with the cover open` |
| 4 | REL-PERMIT крышка |
| 4 | UNL-04 Safe с открытой крышкой: 3 `Unlock TRUE from s+501…`, 1 `precondition: Unlock TRUE after 1000 ms blue with the cover NC1` |
| 3 | UNL-05 с открытой крышкой NC1: граница Safe `s+501=false` ×1, падение Door `d-1=false` ×2. Та же причина, что UNL-04: guard крышки F1 запрещает Unlock (снимается Q-ARCH-04). Ожидаемый RED |
| 2 | EMG4-03 u+1 `EMGREF(1): status Emergency reached (first +never)` |
| 2 | IL-05b(2) `R&D reached with the cover open` |
| 2 | POL-01(b)(c) |

Итого 346+8+7+6+4+4+3+2+2+2 = 384.

PASS (35): прежние 30, плюс EMG6-01 PLC в Safe и 4 новых UNL-05 Safe:
- падение Door при закрытой крышке, d=s+600 и s+1000;
- Door FALSE + `in_Estop_PLC`;
- Door FALSE + зелёная.

NV (10):
- EMG4-03 Safe LV/HV (2);
- UNL-05 Safe (a)–(d) × 1000/3000 (8) — «нет SafetyFault» без символа (A8). Наблюдаемые проверки (Unlock FALSE, Safe, нет Emergency, нет энергии) PASS.

## Допущения и пределы доказательства

- A1–A9, A12 — как в v3. **A11 снято.** A13 (мой временный эталон N=u) не вводилось — заменено v6 §4.
- **t_a, t_s, t_d** — сканы той же трассы: t_a — первое изменение down-выхода после зелёной, наблюдение. q_N из них считается нормативно по STP-A/B. T_DIS = 1000 (Network8).
- **EMG-RD-L, интерпретация L1.** Для причин ≠ PLC база Б = окно L1 против `in_Estop_PLC` той же фазы, q_R — из устойчивого Run. При ветке А это не влияет на норматив.
- **EMG-RD-L п.4** применён буквально ко всем Del-выходам области, включая `out_HV_Discharge_Request`.
- **Нормальный шаг, наступивший до e.** Если шаг выполнен в W_N до e и выход потом покинул цель (импульс запроса), повторное утверждение судится базовым правилом. Если шаг не выполнен в W_N — FAIL. Это моё уточнение v5 для случая q_N+1 < e; прошу аналитика подтвердить.
- **IL-05d (1b).** q_N(STO) = наблюдаемый скан возврата STO. STO на ev всё равно n/a.
- **UNL-05, падение Door.** После d+1 Unlock FALSE проверяется до конца наблюдения при Door FALSE. Возврат Door — Q-T3-2b, не написан.
- **Пределы:**
  - Новый код Run/R&D-путей (EMG-RD-L, N4, N3 в Run-фазах) на canonical не исполняется: все такие тесты падают на предусловии.
  - На reference R&D/нормальной остановки нет: проба — t_a не найден.
  - Корректность этих путей подтверждена только самотестами на синтетических профилях и N3/L3 на reference. Первая поведенческая проверка — на кандидате (G3).
  - Мутации не прогонялись: кандидата нет.
  - Программная модель SAL, не native/Target/hardware.

## Вопросы аналитику/Вадиму

1. Аналитику: подтвердить два уточнения EMG-RD-L:
   - нормальный шаг до e и импульс запроса Discharge;
   - п.4 для `out_HV_Discharge_Request`.

   Исходно: Run-down, событие после t_s+5000 или в ожидании C2_FBK. Не хватает: должен ли запрос разряда, уже отработавший, удерживаться/повторяться.
2. BLOCKED E6:
   - RC-6 watchdog 30 с (Q-CA1-01 «Б»);
   - LV Safe→R&D 30 с от C1_FBK ON → откат в Safe + SafetyFault (вопрос 66 (b)).

   Не написаны в E2.
3. Q-T3-2b (UNL-05: Door снова TRUE при удерживаемой синей; падение Door в R&D) — открыт, только наблюдение.

## Что передать следующему и кому

- **Ревьюеру (G1 v4):**
  - helpers e2-rule-l.js и e2-emergency.js;
  - новые emg-rd-sweep и unlock-door;
  - N=u (ii), REL-01(e), RC-5/RC-6, E2-STAND самотесты.
- **Архитектору:**
  - testFiles в MUTATION_PLAN_E2a…d — **20 файлов**: прежние 18 + `current-e2a-emg-rd-sweep.test.js` и `current-e2d-unlock-door.test.js`;
  - behaviouralTests `^E2[a-d] ` (E2-STAND/DIAG не совпадают);
  - мутации Door, которые должен убивать UNL-05: `N2/FBAnd8.AndIn1`, Door в `N12/FBAnd2`, с вариантами (a)–(c).
- **Редактору (через ведущего):**
  - REL-01(e) дефект подтверждён и при удержании 3000/3600 мс;
  - EMG-RD-L — ветка А: шаги спуска не позже нормальных, ветка «момент цепи» = FAIL;
  - SS1 — Imm ≤ +4 в Run, без снятия после e.
- **Ведущему:**
  - тесты вне E2, проверяющие HealthyLostDuringSS1 или сброс по кнопке, grep по именам не нашёл, ничего не трогал;
  - счёт harness исправлен (m-6).
