# HANDOFF v5 — E2-G1 (G1 v4 conditions C1–C4, m-8; v7 C1/C2/m-7; Q-V4-01/Q68 RUN-CONF; FBK-10)

Срез / роль / дата: E2 G1 v5 / v2-tester / 2026-10-22.

Источник (canonical F1 не менялся): SAL 04b45456…d28a3, SGVL dc103abe…a9104, diagram de02bbff…a603; HEAD a8f6de7.
Oracle:
- SCENARIO_DECISIONS.md ddee4552…9c07 (Q-T3-1 «А», Q-V4-01 «Б», вопрос 68 «Б», Q-V4-02 «В», Q-CA1-01 «Б»);
- CRITERIA_DELTA v7 — program/analyst/E2-G1-v4/CRITERIA_DELTA_v7.md 378a9f93…f8459 (JSON 4aa5e457…491e);
- поручения ведущего 2026-10-22: Q-V7-02 закрыт ответом 68 «Б» (R&D нет ≤ u1+599, есть на u1+601); FBK-10 «В» = SafetyFault + запрет подъёма, не Emergency;
- G1_REVIEW v4 (program/reviewer/E2-G1-v4/G1_REVIEW.md), C1–C4, m-8;
- v6/v5/v4 — как в HANDOFF_v4.
Reference 4495a1f: pinned SAL efddc60b…0dc334, SGVL 8020e3d6…b5e757 (A12, без изменений).
Программу, стенд, src/scripts, fixtures/expected-deltas не трогал. `npm run check:software` перезаписал SOFTWARE_CHECK_RESULTS.md/.json — штатный вывод скрипта, как в прежних прогонах.

## Сделано

| Файл (SHA256, 12 знаков) | Изменение |
|---|---|
| test/helpers/e2-rule-l.js (651732ebdcb6) | C4: `absentErr` — 'absent' у Imm/Del → ERROR в L1/L2/L3/L4/EMGRDL (не пропуск). EMGRDL возвращает `ledger` (p.1 / p.2A / p.2AB / p.4 / missed-before-e / done-left / qN-null / base:no-qR / base:no-R / absent) и `nv`; `assertLedger` утверждает ожидаемый пункт и считает исполненные утверждения. C2/v7 §2: ветка `done-left` → diagnostic + t.todo «BLOCKED Q-V7-01», не судится L1/L2, исключена из L4. C3: `nuII` — оценщик N=u (ii) вынесен из теста; SS1, снятый в [a, a+1], меряется от возврата (Imm ≤ a+1+d_R), как STO/C2 |
| test/helpers/e2-emergency.js (5092c243d827) | C4: descentArea — предусловие g ≤ t_a < e (ERROR стенда), ожидаемые пункты ledger (Run-down: STO/Dis/C2 p.2A; R&D→Safe: C1 p.4); свип около C2_FBK OFF — предусловие t_a и ledger (STO/C2 p.4, Dis p.4 или done-left). `timeline(..., {inject})` для h ≠ e. Все тесты через `c.finish(t)` |
| test/helpers/e2-lifecycle.js (48582675cd15) | `checks()`: `c.nv(msg)` и `c.finish(t,title)` = `done`, затем `t.todo` только при нормативном PASS (NV не скрывает FAIL) |
| test/current-e2a-emg-rd-sweep.test.js (c19eaebb1ff9) | C1/v7 §1: q_N(STO) = min(t_a+2000, h), W_N [q_N, q_N+1]. Ledger для каждой точки. Новые: STP-D h=e=t_a+1, t_a+1999; STP-H (LV) h=e=t_a+1000; h<e (HV t_a+500, PLC t_a+1000 → STO p.4); h>e READY-D (PLC t_a+1, HV t_a+1000 → STO в [h, h+1]); DIAG h=e=t_a. SafetyFault после потери Healthy — NV без символа (A8). Предусловие t_a |
| test/current-e2b-cover-transitions.test.js (68081af1df74) | C3: N=u (ii) через RL.nuII (SS1 включён). C4: IL-05d — ledger для R и X (STP-E/I: STO p.4, Dis p.4/done-left, C2 p.2A; STP-G: STO p.4, Dis/C2 p.2A) |
| test/current-e2a-run-conf.test.js (fabf49de3014) | v7 §3/§4.1/§4.2. RC-1…RC-5 через K = max(k, u+500): нет Run ≤ u+599, Run на u+601 для (i) (ii) (iii) (v) (vi); (iv) HV до u+2999 → ≤ u+3099 / u+3101; RC-4. RC-6 после окна: u+550 (1 скан, 20 мс), u+599; внутри окна: u+51 (1 скан, 20 мс) → u+601. m-7: u, s_1, s_2 ∈ {a, a+1}, C2 ON в [u, Run−1], STO_DRi снят в [s_i, Run−1]. RC-7: t_f+1/t_f+50 (в окне) → нет Emergency, Run u+601; u+502/u+550/u+599 → Emergency (L1, L4, защёлка, Run нет, Restart → только Safe); DIAG u+500/u+501. R&D: нет ≤ u1+599, есть с u1+601; C1_FBK провал u1+51 → нет Emergency; u1+550 → Emergency (FBK-01, EMGREF-LV); DIAG LV-провал u1+550. Исправлен дефект harness v4 (см. ниже) |
| test/current-e2d-fbk-unsolicited.test.js (fe12a6ed7fa9) **новый** | FBK-10 (v7 §4.5, Q-V4-02 «В»): S1 (Safe, C1_FBK), S2 (Safe, C2_FBK), R (R&D, C2_FBK) × {FBK 3000 мс + BOTH; k3 без квитирования; k2 квитирование → подъём (позитивный контроль); k1 квитирование при FBK ON; 1 скан; + in_Estop_PLC}; R: зелёная → R&D→Safe исполняется (Q-RC-07). Состояние/энергия неизменны, нет Emergency. SafetyFault ≤ f+1 — NV (A8). k4 не написан (BLOCKED Q-V7-04) |
| test/current-e2a-emg-anchor.test.js (2b6510ecde24) | E2-STAND самотесты: absent → ERROR (5 правил); ledger и assertLedger (неверный/отсутствующий пункт → FAIL; done-left → NV без FAIL, skip/excl); синтетическая трасса Run-down: downTa → qNrunDown → EMGRDL → ledger — ветка А PASS, 4 исполненных утверждения, моменты цепи (Б) → FAIL; N=u (ii) SS1: возврат a+1+d_R PASS, a+2+d_R FAIL, никогда FAIL, неснятый не меряется |

Не изменены: summarize.mjs (07883b03012e), прочие current-e2*.

### Дефект harness v4, найденный при пересчёте RC-5
`scenario()` в run-conf вызывал `during` только после всего нажатия BOTH 1100 мс (≈ u+98). Освобождение C2_FBK на u+29 в RC-5(ii) никогда не срабатывало: вариант фактически был «C2_FBK никогда не ON». На canonical тест не исполнялся (падал на предусловии), поэтому ложного PASS не было. Сейчас трасса ведётся по сканам с нажатия, и K сверяется с замыслом входов («stand precondition … K=u+500»). Проверено в DIAG split: все предусловия K выполнены.

### Пункты поручения
- **C1 — сделано по v7 §1** (C1_STPD='min'). Промежуточный NV-режим остался в коде (`C1_STPD=null`) только для трассировки.
- **C2 — сделано по v7 §2.** Пункт `done-left` в ledger → BLOCKED Q-V7-01 (t.todo, не L1/L2, не L4). Нормативно остаётся p.4: Discharge TRUE в e−1 → TRUE в каждом скане ≥ e.
- **C3 — сделано.** Самотест показывает, что прежний код (SS1 при PX 'n/a' пропускался) пропустил бы поздний возврат SS1.
- **C4 — сделано:**
  - 'absent' → ERROR;
  - ledger утверждается в rd-sweep (7 точек × 2 причины + 6 STP-D/H), в Run-down/R&D→Safe emergencyChecks, в свипе около C2_FBK OFF, в IL-05d;
  - предусловие g ≤ t_a < e;
  - положительный контроль ветки А — синтетический (см. пределы).
- **m-7 — сделано по v7 §3.**
- **Q-V4-01/Q68 — применено по v7 §4.1/§4.2 и уточнению ведущего** (Q-V7-02 закрыт).
- **FBK-10 — сделано** (E2d).
- **m-8** — фрагмент ниже. Сам файл стендовый, в него не писал.

## ID матрицы и их новый статус (только факт)

Ничего не закрыто. Затронуто:
- EMG-001/011, EMG-008/009, STP-001 (C1, STP-D/H combo);
- EMG-001/002/004/011 (ledger, C2 BLOCKED Q-V7-01);
- EMG-002/CVR-006 (N=u SS1);
- MOD-002/WDG-003 (RC-1…RC-7 по v7);
- MOD-001/WDG-001 (R&D окно, FBK-01);
- MOD-008/WDG-004 (FBK-10).

## Команды воспроизведения

```
cd SafetyTests
node --test --test-reporter=tap test/current-e2*.test.js > e2.tap               # ~90 с
node program/tester/E2-G1/summarize.mjs e2.tap                                  # NV / DIAG отдельно
node --test test/current-e2a-emg-anchor.test.js                                 # E2-STAND: 11/11
node --test $(ls test/current-*.test.js | grep -v current-e2)                   # вне E2: 479/479
npm run check:software
E2_LV_HEALTHY_MODE=split node --test test/current-e2a-run-conf.test.js          # DIAG: исполнение путей RUN-CONF на canonical
E2_SOURCE_ROOT=<корень кандидата> node --test test/current-e2*.test.js          # G3
```

Сохранено в program/tester/E2-G1/baseline-v5/:
- e2-g1v5.normative.tap;
- e2-g1v5.summary.jsonl;
- check-software-v5.out;
- non-e2.tap.

## Результаты

### `npm run check:software` — exit 4

| Стадия | Результат |
|---|---|
| harness | PASS 236/236 |
| historical | PASS 75/75 |
| current | FAIL: 961 / 539 pass / 410 fail |
| current SAL | {PASS 199, FAIL 1, NV 7, ERROR 0, NA 0} |
| case IDs | missing 0, statusChanged 0 |
| tests current vs baseline | missing 6, added 122, statusChanged 1 |
| expected deltas | deltas 7, explained 1, **unexplained 6** |

- **Exit 4 вызван мной.** Шесть UNEXPLAINED test-missing — переименованные тесты RUN-CONF. Их прежние имена утверждали заменённый oracle («Run at k+101», «RC-7 … Emergency»). Нужна запись в expected-deltas (фрагмент ниже), её утверждает ведущий. Без неё exit 4 останется.
- Тесты, указанные в F1-baseline: natural, 400 ms, STO FBK pinned, RC-6 k+50, RC-7 t_f+1, RC-7 t_f+50.
- Ещё три старых имени (RC-5(ii), RC-6 20 ms, RC-6 k+99) появились в v4 и в F1-baseline не входят.
- Имя (iv) «HV Faulty TRUE for 3000 ms … Run at k+101» сохранено: по v7 K = k = u+3000, oracle не изменился.
- harness «missing 1, added 9» — стенд, не мои файлы (как в v4).
- **Вне E2: 479/479, 0 not ok** (23 файла, включая current-code-checks). В стадии current software-check это 477, потому что current-code-checks считается в harness. Расхождение 477/479 из ревью v4 объясняется этим, а не чужими файлами.

### E2 (484 теста)

Нормативно: **PASS 41 / FAIL 410 / NV 12**. Отдельно DIAG/E2-STAND: **21 PASS**.

Сравнение с v4 по имени:
- изменённых статусов нет;
- удалено (переименовано) 9 RUN-CONF;
- добавлено 51.

FAIL по причинам (дословно, сгруппировано):

| Число | Причина |
|---|---|
| 365 | `precondition not reached within 3000 ms: R&D after BOTH from Safe (… stages=b_Step12, statuses=STS_SAFE)`: 182 в обёртке `scenario aborted (coverage incomplete)`, 180 прямо, 3 `lifecycle precondition failed`. Это неполнота покрытия (R&D/Run недостижимы на canonical). Сюда входят все пути Run/R&D, включая новые RC-*, STP-D/H combo, FBK-10 (R) |
| 8 | EMGREF-LV Safe→R&D `energy removed before Restart …` — как в v4 |
| 7 | REL-01(e) `permit absent at the qualification … held gesture not executed after restoration` — как в v4 |
| 6 | IL-01 `Safe->R&D accepted with the cover open` |
| 3 + 1 | REL-PERMIT крышка |
| 3 + 1 + 1 | UNL-04 Safe с открытой крышкой: `Unlock TRUE from s+501…` ×3, `precondition: Unlock TRUE after 1000 ms blue with the cover NC1` ×1, UNL-05 граница ×1 |
| 2 | UNL-05 падение Door `precondition / normative: Unlock TRUE at d-1` |
| 2 | EMG4-03 u+1 `EMGREF(1) … first +never` |
| 2 | IL-05b(2) `R&D reached with the cover open` |
| 1 + 1 | POL-01 (`in_LV_Faulty_FBK present`, `outPLC_LV_Faulty present`) |
| 2 | **новые, v7 §4.2:** MOD1-01 `R&D at u1+601 and later; R&D first at u1+NaN` — canonical застревает в b_Step12 (та же причина, что 365, но проявляется как нормативная проверка, а не предусловие) |
| 1 | **новый, FBK-01 u1+550:** `EMGREF(1): status Emergency reached (first +never)` — на canonical провал C1_FBK после окна не даёт Emergency. Предусловие «R&D не подтверждён» выполнено тривиально (R&D недостижим), поэтому это условный контрпример, не доказанный дефект |
| 2 | **новые, FBK-10 k3 (S1/S2):** `k3: FBK OFF without acknowledgement - lift still forbidden; first lift t=…` — canonical исполняет BOTH после FBK OFF без квитирования. Дефект относительно Q-V4-02 «В» / v7 §4.5 (k3 READY) |
| 2 | **новые, FBK-10 1 скан (S1/S2):** `1 scan FBK ON sets the ban until FBK OFF + acknowledgement; first lift t=…` — тот же механизм (READY-D) |

Итого 410.

PASS (41): прежние 35, плюс FBK-10 k2 S1/S2, k1 S1/S2, +in_Estop_PLC S1/S2.

NV (12):
- прежние 10 (EMG4-03 Safe ×2, UNL-05 Safe ×8 — A8);
- FBK-10 (S1)/(S2) основной сценарий: наблюдаемые проверки PASS, SafetyFault ≤ f+1 — NV (A8).

BLOCKED Q-V7-01 (done-left) на canonical не проявляется: пути не исполняются.

## Допущения и пределы доказательства

- A1–A9, A12 — как в v4.
- **v7 §1 h > e** — READY-D: вывод аналитика, не прямая цитата.
- **Ledger.** Ожидаемые пункты выведены из нормативной цепи q_N и e+q_R (q_R по L3 ref: 7006/7008/8009). На границе t_a+2001 допускаются {p.4, p.2A}. Где запрос разряда может быть импульсом, допускаются {p.4, done-left}, при этом done-left даёт NV.
- **FBK-10.**
  - «Подъём исполнен» = команда C1 ON (Safe) / C2 ON или снятие STO (R&D).
  - Квитирование = синяя 100 мс + обе отпущены 2100 мс (E6-Q2 «любая кнопка»).
  - BOTH после FBK OFF без квитирования считается попыткой подъёма (k3). Сам жест мог бы быть и квитированием, но квитирование завершается только отпусканием на 2 с, так что подъём в том же жесте запрещён.
- **RC-*.** K сверяется с замыслом входов только по стимульным провалам (HV Faulty, C2_FBK OFF при команде ON). Провал FBK из-за собственной команды OFF программы — поведение кандидата, его судит m-7.
- **Пределы (существенно):**
  - Пути Run/R&D на canonical не исполняются ни в normative, ни в DIAG split. В split-режиме Run тоже недостижим (`steady Run … stages=b_Step1,b_Step3`), исполнены только RUN-CONF/R&D до Run.
  - EMG-RD-L/ledger/STP-D combo, N=u (ii) и RC-* проверены только E2-STAND самотестами на синтетических трассах и DIAG split.
  - Положительный контроль ветки А на реальной трассе возможен только на кандидате (G3). Число исполненных EMG-RD-L-утверждений печатается диагностикой `EMG-RD-L executed assertions (C4): N` — в G3 его нужно собрать.
  - Программная модель SAL, не native/Target/hardware.
  - Мутации не прогонялись: кандидата нет.
- Не написано (не в E2 или BLOCKED):
  - WDG-01/03 откат в конце окна (E6);
  - watchdog 30 с (E6);
  - FBK-05/06 SafetyFault в abort (BLOCKED Q-V7-03);
  - FBK-07/08 Config (E4);
  - FBK-10 k4 (BLOCKED Q-V7-04), бит Fault PLC (E4/E5);
  - LV-провал после окна до R&D — DIAG.

## m-8 — фрагмент для expected-deltas F1 (стенду/ведущему)

Файл: fixtures/case-baselines/expected-deltas/04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3.json.

(1) Шесть MISSING. Добавить в `tests.current` (схема expected-deltas-v1; объясняет exit только при approval APPROVED):

```json
[
 {"name":"E2a RUN-CONF natural: C2_FBK ON one scan after the command, HV healthy: no Run <= u+99, Run at k+101, not at k+99","reason":"Renamed to 'E2a RUN-CONF RC-5 (i) natural: …: no Run <= u+599, Run at u+601 …': oracle replaced by CRITERIA_DELTA v7 §4.1 (Q-V4-01 'Б', question 68 'Б': FBK window 500 ms + 100 ms). Test file current-e2a-run-conf.test.js (G1 v5).","proposedBy":"v2-tester"},
 {"name":"E2a RUN-CONF C2_FBK delayed 400 ms (HV healthy): no Run while C2_FBK OFF; then Run at k+101, not at k+99","reason":"Renamed to 'E2a RUN-CONF RC-5 (iii) C2_FBK delayed 400 ms (ON from u+400): no Run <= u+599, Run at u+601 …' (v7 §4.1: K = u+500).","proposedBy":"v2-tester"},
 {"name":"E2a RUN-CONF drives STO FBK pinned to \"STO active\" (in_STO_DRx_FBK TRUE): Run still confirmed at k+101 (RC-4: STO FBK not required)","reason":"Renamed to 'E2a RUN-CONF RC-4 … Run at K+101 = u+601 …' (v7 §4.1 RC-4).","proposedBy":"v2-tester"},
 {"name":"E2a RUN-CONF RC-6 HV Faulty TRUE for 1 scan at k+50 (before Run): count restarts - no Run <= (k+51)+99, Run at (k+51)+101, no Emergency (Q-RC-RUNCONF-01 \"В\")","reason":"v7 §4.1 RC-6: k+50 = u+51 now lies inside the 500 ms window (count not affected, Run u+601) - renamed 'E2a RUN-CONF RC-6 (v7) HV Faulty TRUE 1 scan at u+51 (inside the window) …'; the after-window case is the new 'u+550' test.","proposedBy":"v2-tester"},
 {"name":"E2a RUN-CONF RC-7 (FBK-03) C2_FBK FALSE 1 scan at t_f+1 with the C2 command kept, before Run: Emergency (rule L1 vs in_Estop_PLC), Run never, Restart -> only Safe","reason":"Oracle inverted by Q-V4-01 'Б' (v7 §4.1 RC-7): a drop inside the window is not an emergency - renamed 'E2a RUN-CONF RC-7 (v7) C2_FBK FALSE 1 scan at t_f+1 inside the 500 ms window …: not an emergency, no rollback, Run at u+601'.","proposedBy":"v2-tester"},
 {"name":"E2a RUN-CONF RC-7 (FBK-03) C2_FBK FALSE 1 scan at t_f+50 with the C2 command kept, before Run: Emergency (rule L1 vs in_Estop_PLC), Run never, Restart -> only Safe","reason":"As t_f+1: renamed '… at t_f+50 inside the 500 ms window …: not an emergency …'; Emergency now at u+502/u+550/u+599 (new tests).","proposedBy":"v2-tester"}
]
```

(2) statusChanged 1. Схема v1 и `reconcileDeltas` не имеют записи для смены статуса: она информационная, на exit не влияет, а запись в `tests.current` с этим именем стала бы STALE. Предлагаю стенду необязательное информационное поле (нужна поддержка в src/case-id-diff.js — решение стенда/ведущего):

```json
"statusChanges": {"current": [
 {"name":"E2a EMG6-01 EMGREF: in_Estop_PLC TRUE in Safe -> Emergency latch, energy chain, Restart -> only Safe","from":"fail","to":"pass","reason":"CRITERIA_DELTA_v6 §2 (L3-Safe): L2 is not applicable in Safe; status <= ref_Safe+1 (+2) vs reference 4495a1f re-measured by E2-STAND. The former RED was a coverage RED (G1 v3 §2.7, G1 v4 §7), not a defect fix.","proposedBy":"v2-tester"}]}
```

До поддержки этого поля формулировка «statusChanged 1 (explained)» означает: объяснено в HANDOFF_v4/v5, а не машинным подтверждением.

## Вопросы аналитику/Вадиму

1. Аналитику (FBK-10, k3). Исходно: Safe, FBK ON без команды в f…f+2999, затем OFF. Событие: BOTH 1 с после 2,1 с без отдельного квитирования. Тест считает этот жест попыткой подъёма (запрещён), а не квитированием. Подтвердить, что первый же BOTH не является одновременно квитированием и подъёмом. На исполнение k3 READY это не влияет, пока ответ «квитирование завершается отпусканием 2 с».
2. Открыты без изменений: Q-V7-01 (done-left), Q-V7-03, Q-V7-04, Q-T3-2b.

## Что передать следующему и кому

- **Ревьюеру (G1 v5):**
  - rule-l (absentErr, ledger, nuII, done-left);
  - emergency (t_a, ledger, inject);
  - rd-sweep (C1, combo);
  - run-conf (v7 §3/§4, исправленный driver);
  - fbk-unsolicited (FBK-10);
  - E2-STAND самотесты.
- **Ведущему / стенду:**
  - утвердить и внести фрагмент (1) в expected-deltas — иначе check:software exit 4;
  - (2) — по решению стенда.
- **Архитектору (MUTATION_PLAN E2a…d):**
  - testFiles = **21** (+ current-e2d-fbk-unsolicited.test.js);
  - мутанты ревью §3 п.3 (i)–(x) + v7 (xi) STO при STP-D в t_a+2000, (xii) STO на e+7006, (xiii) снять «FBK OFF» из разрешения подъёма, (xiv) квитирование снимает запрет при FBK ON, (xv) FBK-10 → Emergency;
  - для RC: окно 500 мс → 0 / 100 мс, отсчёт 100 мс от k < w, провал FBK после окна без Emergency.
- **Редактору (через ведущего):**
  - FBK-10 k3/1-скан — RED на canonical: запрет подъёма не держится до квитирования;
  - Run/R&D только после окна 500 мс + 100 мс;
  - RC-7 в окне — не Emergency;
  - STO при STP-D/H в [h, h+1] и в Emergency.
