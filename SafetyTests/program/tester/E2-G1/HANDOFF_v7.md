# HANDOFF v7 — E2-G1 (ревью G1 v6: N10–N15, m-11…m-13; дополнения ведущего LV-A1 и пины native)

Срез / роль / дата: E2 G1 v7 / v2-tester / 2026-10-22.

## Источник
- Canonical F1 не менялся: SAL `04b45456…d28a3`, SGVL `dc103abe…a9104`, diagram `de02bbff…a603`, HEAD `dbca5dd`.
- Oracle:
  - SCENARIO_DECISIONS.md `c26025c3…` (TD-05, TD-06; V14-Q12/Q13, D-STARTINGRUN-GREEN-DOWN);
  - analyst E2-G1-v6-q/CRITERIA.md `f86f8ed5…` (TD-06 §1, FBK10-K4 §2, KF-5 §3, KF-3-DESC §4);
  - analyst E2-plan-v7-TD/CRITERIA.md `7ea3793e…` (TD5-EOK, FBK10-PLC-A/B/границы/REG, KF-1…5);
  - analyst E2-RC-D2/CRITERIA.md `dc8b9853…` (LV-A1);
  - ревью reviewer/E2-G1-v6/G1_REVIEW.md `f07352f0…`;
  - architect/E2-status/PLAN.json `5198d426…` (только список delete — для разбора usage, не oracle).
- program/editor/** не читал. Кандидат E2a-RC SAL `5733552a…` (candidates/E2a-RC/native) запускался только для проверок, указанных ведущим.

## Сделано (SHA256, 12 знаков)

| Файл | Изменение |
|---|---|
| current-e2d-fbk-k3ack 91090e012a92 | **N10:** во всех liftIn — TEAM-DEFAULT TD-06: нет подъёма в [p, Q−1]; первый подъём ≤ Q+400; точный скан — diagnostic. Если к p−1 уже есть подъём от прежнего жеста, проверка момента явно «не оценивается», и тест FAIL (не ложное «Q−1000»). Имена: «[Q2, Q2+1]» → «≤ Q2+400 (TD-06)». **N14:** FBK10-K4 g−1 — SafetyFault TRUE в каждом скане [f+1, p2−1] (вкл. [g, p+1100] и паузу), FALSE с [p2, p2+1] до конца; NV до символа (A8) |
| current-e2d-fbk-window-abort c9f822a269e6 | **N11:** BOTH удерживается p..Q+1, отпускание с rb = Q+2; свежая зелёная в a = u+a_b (в a−1 зелёная FALSE, синяя отпущена), 600 мс. Стендовые предусловия проверяются по записанным входам в обеих трассах. На F1 (FBK-06): предусловия выполнены, u = Q+3, пауза перед зелёной 11 мс. **Допущение и вопрос аналитику — ниже** |
| current-e2d-fbk-unsolicited 5dc215187d40 | **N12(c):** FBK10-PLC-A — 2 базы (R-T5; Safe после boot) × {C1, C2, оба FBK} × t ∈ {f+1, f+100, f+3000}. FBK10-PLC-B — R&D(HV) × t, с проверками `b_Set_HV_C2_1` FALSE (NV при отсутствии символа), запрос HV TRUE, STO. Граница: импульс 50 мс, кончающийся в g−1 (7 тестов). DIAG: импульс, кончающийся в g (2). **N12(d):** FBK10-PLC-REG (1): R-T5, (1,0), C1_FBK с u1+{1, 250, 499}; нет R&D ≤ u1+599, R&D с u1+601 (TD-02), C1 удержан, нет возврата в Safe/Emergency. **N12(e):** 22 теста `KF-n known FAIL …`: KF-1 ×6, KF-2 ×5, KF-3 ×3, KF-3-DESC ×1, KF-4 ×1, KF-5 ×6 |
| current-e2a-dis-hold 6e17145ea5ca | **N12(a):** событие «Emergency в Safe + PLC (1,0)» помечено [TEAM-DEFAULT TD-05]. **N12(b):** TD5-EOK целиком: причина {ES_NC_1, ES_NC_2, Mentee} × t ∈ {E+1, E+50, E+2000} × {удержание 3000, импульс 50}. Проверки в каждом скане [t, t+3000]: нет S12/R&D/Run, запрос LV TRUE, C1/C2 OFF, STO, Emergency в [E, t+3000]. Затем рестарт с (0,0) → Safe и 3000 мс без подъёма. Плюс DIAG «фронт ровно в E» (3) и положительный контроль. **LV-A1 (ведущий, E2-RC-D2):** a1 = первый скан ≥ p, где `b_Step12` или `out_LV_C1` TRUE; judge не менялся; diagnostic g2−a1 по `b_Step12_Set`, если символ есть. Источник: «READY: вопрос 74 "А" + DIS-HOLD-HV; a1 — E2-RC-D2 LV-A1», не TEAM-DEFAULT |
| current-e2b-rel01-e2 aacb3e4c9732 | **N15:** «принят» по TD-06 — нет подъёма ≤ Q−1 и первый подъём ≤ Q+400, момент в diagnostic. Касается r = f−1, s = Q+2, паузы 2001 мс и контроля NC1/NC2. «Отклонён» — без изменений (наблюдение до ≥ Q+1500) |
| current-e2a-boot 3b661a32331c | **m-13:** ES06-01/BOOT-C с удерживаемым inPLC_RnD_Mode/_2 — в имени «[coincides with known FAIL KF-3 until E4]». Нормативное ожидание не менялось |
| current-plc-pulse-set-permit de9f1f81f892 | **m-12:** признак R1 = отсутствие `//Network5/FBAnd1` ∧ отсутствие писателя `b_Set_STO_DR1/2`. Отсутствие одного FBAnd1 → ERROR («Missing real block»), не SKIP |
| current-rnd-down-no-reenergy 4c43a471e439; helpers/rnd-down-source d2352971b97f | **N13(a):** вместо «Fixture ERROR» — «precondition unreachable (honest RED, not a fixture error) … on canonical F1 attributed to … //Network11/FBAnd4.AndIn3 <- in_LV_Healthy_FBK without inversion (D-ARCH-POL …)». **N13(b):** 2 новых теста «DIAG [LV raw TRUE only during the R&D preparation - declared bypass …]». Raw TRUE только от записи C1_FBK ON до достижения R&D, иначе R0 FALSE. Helper отдаёт `rawName()`. Нормативные тесты и их имена не изменены |
| current-native-bindings 965557cf535c; current-native-structure b2fd742c47c1; current-v2-identity 0b843e9be85a; helpers/native-ledger f053022e19a3 **новый** | **Пины native (ведущий, стенд F1-v3 §5), по образцу S2.** Три F1-identity-теста native-bindings (V2.aliases/wires, V2.sgvl, V2.plc) перенесены дословно в V2ID «moved from …». NATIVE: грамматика + 0 межсетевых wire — на любом источнике, счётчики в diagnostic. Точные счётчики F1 и точный ledger usage — новые V2ID-тесты. На не-F1 отсутствующие usage ledger дают NV (todo) с перечнем, не PASS. Список P0c/F1 retirements вынесен в helper без изменений |
| program/tester/E2-G1/summarize.mjs 685868c47399 | флаг `kf` для имён «KF-…» (known FAIL — отдельно от нормативных и DIAG) |

- current-e2*.test.js: по-прежнему **27 файлов**, новых нет.
- **m-11** (EARLYSTO R6-5, дополнение к HANDOFF_v6). Кроме заменённой проверки «old discharge Reset follows later feedback» сигнал `completionDischargeReset` (b_Reset_HV_Discharg_Req2) снят ещё из двух составных проверок EARLYSTO: «no completion at SU» и «no feedback-independent completion manufactured». Обе утверждали, что сброс запроса НЕ происходит рано без обратной связи. Это прямо противоречит вопросу 73 «А» (снятие при принятии). Прочие компоненты этих проверок сохранены.

## ID матрицы и их новый статус (только факт)
Ничего не закрыто.

Затронуто:
- MOD-008, WDG-004 — TD-06, K4 SafetyFault, FBK10-PLC-A/B, граница g−1, KF-1;
- MOD-001, MOD-002 — TD-06, REG(1), KF-5;
- MOD-001, MOD-005, EMG-011 — TD5-EOK;
- WDG-001, WDG-003 — FBK-05/06 стимул;
- BTN-001/002, EMG-003, CVR-004 — REL01-e2 мера;
- MOD-003, PLC-001, PLC-004, STP-004, STP-006, PLC-006, MOD-004, MOD-006 — KF-2…5 known FAIL;
- MOD-005 — LV-A1.

## Команды воспроизведения
```
cd SafetyTests
node --test --test-reporter=tap test/current-e2*.test.js > e2.tap && node program/tester/E2-G1/summarize.mjs e2.tap
node --test $(ls test/current-*.test.js | grep -v current-e2)
npm run check:software
# кандидат: sandbox стенда (src/stand-sandbox.js createSandbox, overlays SAL/SGVL/diagram из candidates/E2a-RC/native), затем
E2_SOURCE_ROOT=<sandbox root> node --test --test-name-pattern="DIS-HOLD-LV" test/current-e2a-dis-hold.test.js
(cd <sandbox>/SafetyTests && node --test test/current-native-structure.test.js test/current-native-bindings.test.js test/current-v2-identity.test.js)
```

Сохранено в program/tester/E2-G1/baseline-v7/:
- e2-g1v7.normative.tap / .summary.jsonl (888 тестов, включая FBK10-PLC-REG (2) и (1));
- non-e2.tap;
- check-software-v7.out.

## Результаты (canonical F1)

### E2 — 888 = 808 v6 + 80 новых; переименовано 63, статус ни одного переименованного или прежнего имени не изменился (0)

| Класс | PASS | FAIL | NV |
|---|---|---|---|
| нормативные (833) | 93 | 706 | 33 |
| DIAG (34) | 34 | — | — |
| KF (22) | 0 | 22 (14 — покрытие R&D, 8 — содержательно) | — |

**706 нормативных FAIL:**
- **560 — покрытие:** «precondition not reached …: R&D after BOTH from Safe (stages=b_Step12)» / «Safe after Restart (stages=b_Step12)». Это тот же дефект полярности D-ARCH-POL (N11/FBAnd4.AndIn3).
- **146 — содержательные RED на F1:**
  - K3-ACK/K4 (24): BOTH-1 после FBK OFF поднимает;
  - FBK-10 (8);
  - FBK10-PLC-A от boot Safe (9) и граница g−1 (3) — новое: legacy (1,0) при FBK ON → S12 на t+2, также импульсом, кончающимся в g−1;
  - REL01-e2 Safe (18 + контроль NC 2);
  - REL-PERMIT / REL-01 (11);
  - B43-01/02, B51-01 (25; из них 9 — «boundary C1 OFF не определима» из-за той же недостижимости);
  - EMG6-01-BOOT (9), EMGREF-LV / EMG4-03 (8 + 2), ES06/BOOT-C (2);
  - IL-01 (6), UNL-04/05 (7), POL-01 (2), MOD1-01 / FBK-01 / RND-CONF-T (4), IL-05b (2);
  - FBK-06 (4): abort Safe→R&D свежей зелёной не реализован, стадия b_Step12.
- **TD-06 на F1:** наблюдённые моменты Q+3 (REL-01, пауза 2001), Q+102 (s = Q+2 — подъём после восстановления разрешения). Ложный RED «Q2+3» из списка дефектов **убран**. В K3-ACK BOTH-2 момент «не оценивается»: подъём уже от BOTH-1.

**KF на F1 (ожидаемо, не скрыто):**
- KF-1 S1/S2: подъём после FBK OFF без квитирования, t+5; при удержании через g подъём уже при FBK ON (g−495, это дефект FBK10-PLC-A);
- KF-2 Safe ×3: S12 на b+102;
- KF-3 Emergency+рестарт: S12 в скане рестарта;
- остальные — покрытие (R&D недостижим).

### Вне E2 (24 файла) — 483 / 465 pass / 18 fail
- 481 → 483: +2 DIAG rnd-down (pass), −3 перенесённых native-bindings, +5 V2ID.
- not ok:
  - 16 × «EARLYSTO … DIS-HOLD fixedN» — норма 73 «А», F1 снимает запрос около u+101;
  - 2 × «current SAL: healthy LV completion later-off / already-off» — honest RED с новой классификацией (D-ARCH-POL);
  - их DIAG-варианты PASS: спуск без повторного включения и свежий R&D исполняются на F1.

### `npm run check:software` — exit 4
- harness 269/269 PASS, historical 75/75 PASS;
- current FAIL: 1369 / 590 pass / 746 fail; current SAL {PASS 199, FAIL 1, NV 7};
- case IDs: missing 0, statusChanged 0;
- tests current: missing 25, added 549, statusChanged 3:
  - EMG6-01 EMGREF in_Estop_PLC Safe: fail→pass, как и в v6;
  - 2 rnd-down: pass→fail.
- expected deltas 26: explained 23 (16 EARLYSTO внесены стендом), **unexplained 3** — перенос B1/PLC в V2ID (фрагмент ниже).
- Exit 4 только из-за этих трёх. До переноса был exit 1.

## Кандидат E2a-RC (5733552a…), только по поручениям ведущего
- **DIS-HOLD-LV, «R&D->Safe … no event»: PASS.** LV-A1: a1 = u1−1; g2 − a1 = −1 (diagnostic).
- Остальные 7 LV-строк: «Safe after Restart» не достигается (стадия R&D). Это предусловие E2b/E3, по аналитику. Аварийные сочетания EStop при e ≥ g2+1 — known FAIL до E2b, проверяются на стеке E2b.
- **native-bindings 17/17 и NATIVE 4 — исполняются и PASS.** NATIVE ledger — NV: 22 usage отсутствуют, список в diagnostic. V2ID — 10 FAIL, по замыслу (identity).
- **Usage 027370ee-… — НЕ Symbols b_Reset_HV_Discharg_Req2 / b_Reset_LV_Discharge_Req2.** Это target-usage `in_Mentee_EStop` → `//Network6/FBAnd10/AndIn3`; пара 027370ee/b70d16fe. Блок N6/FBAnd10 удалён в кандидате и стоит в delete-списке PLAN.json архитектора. Значит, usage исчезла вместе с плановым удалением потребителя.
- Все 22 отсутствующие usage (11 пар) — так же, потребители из delete-списка:
  - `in_Mentee_EStop` → N6/FBAnd10/AndIn3;
  - `in_Estop_PLC` → N6/FBAnd10/AndIn1;
  - `in_HV_C2_FBK` → N5/FBAnd2/AndIn3;
  - `in_False_SI2_CH8` → N5/FBAnd1, N5/FBAnd7, N9/FBAnd1, N12/FBAnd12, N12/FBAnd13, N12/FBAnd14, N1/FBAnd9, N1/FBAnd11 (Network5/* — «Network5/* (15)»).
- Вопроса сохранности по ним нет. Соответствие плану — по списку delete, а не доказательство delta: доказательство — дело стенда/ревью.

## Допущения и пределы
- A1–A9, A12 — как в v5/v6.
- **N11, стимул abort.** Свежая зелёная после паузы около 11 мс (< 2 с), без «полной очистки».
  - Тесты FBK-05/06 судят abort именно при таком стимуле — как STP-006 в dis-hold.
  - Если для abort нужна полная очистка 2 с (D-STARTINGRUN-GREEN-DOWN), точки u+10/300/499 кнопкой недостижимы: минимум rb+2001 ≈ u+2000 > w = u+500. Тогда они переходят на CMD_* (E4).
  - Вопрос 1 ниже.
- TD5-EOK, FBK10-PLC-A/B/REG(1), KF-3-DESC, KF-4, KF-5 используют базы R-T5 / R&D(HV) / Run через реальный жизненный цикл. На F1 эти базы недостижимы (покрытие).
- FBK10-PLC-A дополнительно на «Safe после boot». Критерий допускает невыданный запрос LV («если был выдан»); это вариант к R-T5, не замена.
- KF-тесты: ожидание по требованию; на E2 FAIL ожидаем. Имена вне regex `^E2[a-d]`, kill не ожидается.
- Не написано:
  - KF-1 для причин SafetyFault «конец окна без FBK (Q-V7-03)» и HealthyLost;
  - TD5-EOK t = E−1 (не нормируется).
- TD-05 и TD-06 «ждут просмотра» Вадимом. Тесты помечены TEAM-DEFAULT.
- N13 DIAG — объявленный обход дефекта. Нормативный RED сохранён.
- Мутации не прогонялись (G3).

## Вопросы аналитику / Вадиму
1. **Аналитику (FBK-05/06, N11).**
   - Исходно: принят R&D→Run (C2 ON в u) или Safe→R&D (C1 ON в u1); жест BOTH отпущен в Q+2.
   - Событие: зелёная 600 мс в u+10 / u+300 / u+499, то есть через 11…500 мс после отпускания обеих.
   - Вопрос: является ли такая зелёная «новой квалифицированной зелёной» abort (V14-Q12/Q13), или нужна полная очистка 2 с (D-STARTINGRUN-GREEN-DOWN «после полной очистки»)?
   - При «полной очистке» точки FBK-05/06 недостижимы кнопкой (ближайшая — около u+2000, после истечения окна w = u+500), и критерий §5 нужно переписать на CMD_* (E4).
   - Тот же вопрос касается STP-006 в dis-hold и IL-05d(1) (зелёная через 200 мс после BOTH).

## Что передать следующему и кому
- **Ведущему/стенду — фрагмент expected-deltas F1 (04b45456…json, `tests.current`):**
```json
[{"name":"B1 V2 physical aliases and required wires preserved through exact logical consumer delta","reason":"F1-identity-only test (V2.aliases/V2.wires assert the canonical F1 SHA) moved verbatim to test/current-v2-identity.test.js as 'V2ID moved from B1 \"V2 physical aliases and required wires preserved through exact logical consumer delta\"' (S2 identity split, lead 2026-10-22, stand expected-deltas-F1-v3 §5). Passes on F1 under the new name.","proposedBy":"v2-tester"},
 {"name":"B1 LV254 SGVL declarations and all source indices unchanged through exact composed target delta","reason":"F1-identity-only test (V2.sgvl) moved verbatim to current-v2-identity.test.js as 'V2ID moved from B1 \"LV254 SGVL declarations and all source indices unchanged through exact composed target delta\"' (S2 split). Passes on F1.","proposedBy":"v2-tester"},
 {"name":"PLC V2 native producer96, preserved contacts and exact whole graph fanout","reason":"F1-identity-only test (V2.plc) moved verbatim to current-v2-identity.test.js as 'V2ID moved from \"PLC V2 native producer96, preserved contacts and exact whole graph fanout\"' (S2 split). Passes on F1.","proposedBy":"v2-tester"}]
```
  - Прочие переименования v7 — в E2-файлах, которых нет в F1-baseline; дельт не требуют.
  - Добавленные DIAG rnd-down и V2ID — «added».
  - statusChanged (информационно): 2 rnd-down pass→fail — R0 / D-ARCH-POL, классификация N13.
- **Архитектору (C5, G3):**
  - testFiles = 27:
    - current-e2a-boot, current-e2a-dis-hold, current-e2a-emg-anchor, current-e2a-emg-rd-sweep, current-e2a-emg-rnd, current-e2a-emg-run, current-e2a-emg-rundown, current-e2a-emg-safe, current-e2a-race, current-e2a-rnd-cover-healthy, current-e2a-run-conf, current-e2a-status, current-e2a-sweep-estop;
    - current-e2b-bypass, current-e2b-connector-safe, current-e2b-cover-transitions, current-e2b-interlock-run, current-e2b-rel01-e2, current-e2b-sweep-connector;
    - current-e2c-hlt03, current-e2c-stp-i;
    - current-e2d-fbk-k3ack, current-e2d-fbk-unsolicited, current-e2d-fbk-window-abort, current-e2d-release-permit, current-e2d-unlock-cover, current-e2d-unlock-door
    - (все `.test.js`).
  - Регексп мутаций `^E2[a-d] ` — KF- и DIAG вне его.
  - Для M-E2a-35 убивающие — TD5-EOK; для M-E2d-12…16 — FBK10-PLC-A/B/граница/REG(1)/(2).
- **Ревьюеру:** N10–N15, m-11…m-13, LV-A1, перенос пинов native.
