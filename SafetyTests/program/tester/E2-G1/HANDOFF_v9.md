# HANDOFF v9 — E2-G1

Срез / роль / дата: E2 G1 v9 / v2-tester / 2026-10-22.

Что вошло:
- вопрос 76 «Б» (LEG11-OFF, Q76-N0…N8, P1…P5);
- TD-11, TD-12, TD-13, TD-14, TD-15;
- K-2 и UNL-LVF;
- FFS-BYP;
- условия ревью G1 v8: N18, m-19, m-20, m-23, m-24, F-76.

HANDOFF_v8 и baseline-v8 не менялись.

## Источник

**Canonical F1 не менялся:**
- SAL `04b45456…d28a3`, SGVL `dc103abe…a9104`, diagram `de02bbff…a603`;
- HEAD `dbca5dd`.

**Oracle (SHA256, 12 знаков):**
- SCENARIO_DECISIONS `0a7cea4a88d7` — вопрос 76 «Б», TD-07…TD-15;
- analyst/E2-Q76/CRITERIA.md `ff0d82aae815` (r2);
- analyst/E2-G1-v8-q/CRITERIA.md `6b784f96cde3`;
- analyst/E2-G1-v8-r/CRITERIA.md `8c9223cf5f11` — §1–§4, §4b;
- analyst/E2-v73-q `2ee04ebb`, E2b-dev `142b2b9d`;
- reviewer/E2-G1-v8/G1_REVIEW.md;
- architect PLAN.md `ba2d4d133d81` (v7.5+) и MUTATION_PLAN_E2d `4a04eaced001` — только цели мутаций и имена маркеров, не oracle.

**Кандидаты.** Запускались в sandbox вне репозитория, только для предварительной оценки (не G3):
- E2d v7.5: SAL `2276d773…`;
- замороженный мутант E2d v7.4.1: SAL `a5acf291…`;
- E2b v7.2 + мутант M-E2b-21.

program/editor/** не читал.

## Сделано (SHA256, 12 знаков)

| Файл | Изменение |
|---|---|
| current-e2d-fbk-unsolicited `f95c03fcdc56` | **LEG11-OFF (вопрос 76 «Б»), новый блок.** Q76-N1: импульс w ∈ {1, 50, 300, 499, 500, 501, 599, 600, 601, 1500} и удержание 10000 мс × C2_FBK (i)/(ii) × базы R&D(HV)/R&D; затем зелёная → Safe к t+25000. N1 V75-1: (1,0)→(1,1) после R&D по legacy (1,0) или по BOTH; граница r−1/r/r+1. Q76-N2 (вместо FBK10-PLC-B): t = f+1, f+100; (a) через g; (b) новый фронт в g+2100; фронт в g−1/g/g+1. Q76-N3 (синяя, зелёная 400). Q76-N4 (SafetyFault: BOTH-1 только квитирует, BOTH-2 поднимает). Q76-N5 + граница r±1. Q76-N6: Run по BOTH, t_a по маркеру (TD-09), граница r±1, позитив BOTH. Q76-N7 (a)(b); (c) — NV E6. Q76-N8: ES_NC_1/2/Mentee × E−1/E/E+1 через Restart; крышка NC1/NC2 × удержан/снят. Q76-P1, P2 (×2), P3 (×3), P5. **Удалено:** FBK10-PLC-B (3), FBK10-PLC-REG (2) (3), KF-1 (R) (2), KF-2 (1,1) (2), KF-3 (1,1), KF-3-DESC, KF-4, KF-5 (6). Их нормативные замены — выше. KF остаются только для (1,0): KF-1 S1/S2, KF-2 Safe, KF-3 (1,0). «Подъём HV» = C2 ∨ STO снят ∨ `b_Set_HV_C2_1` ∨ `recRndC_SU` ∨ SR/Run (два последних — если есть в источнике). SS1 в N6/N7/P2 не сравнивается |
| current-door-interlock `d4b00ed7837a` | **Вопрос 76:** DOOR06, маршрут «existing-PLC-levels» — ожидание HV/request FALSE при любых NC и Door. Физический маршрут — без изменений |
| current-e2d-first-fault-scan `82d9778bb911` | Маршрут legacy (1,1) удалён (N/A по вопросу 76; запрет проверяет LEG11-OFF). **FFS-BYP (TD v8-q §3.3):** (a) Safe × NC1/NC2/обе, Bypass удерживается 3000 мс; (b) R&D + Bypass + BOTH, NC с c ∈ {A−1, A, A+1, u}: дифференциально против трассы без Bypass в каждом скане + «нет нового C2/STO в скане ≥ c». (c) входит в (b) |
| helpers/e2-rule-l `98d6e2c109b9` | **TD-12:** `L1suLower` — граница d_Run−2, для C1 OFF ещё ≥ 2000. **TD-11:** `hv0(log,e,end)` и `hv0Discharge` (Discharge ∈ [0, d_Run+1] и держится; отсутствие → ERROR); `L2su(...,{hv0})` пропускает Discharge |
| helpers/e2-emergency `d2b1f4f105cb` | StartingRun: L2su с предусловием TD-11 (`hv0`), `L1suLower` TD-12. Для L1-причин при TD-11 у Discharge только τ_X ≤ τ_R |
| current-e2a-emg-anchor `03da29e8d8f0` | Самотесты: **TD-12** (−3 FAIL, −2/−1/0 PASS, C1 1999 FAIL, 2000 PASS); **TD-11** (hv0, раннее Discharge допустимо, позднее / снятое / never → FAIL, absent → ERROR) |
| current-e2b-cover-transitions `30b17750b291` | `ruleL`: TD-11 (трассы X и R) и TD-12. Ветвь (ii) c=A — L2su с hv0. **TD-15:** при c = A нет нового C2/STO в скане ≥ c ни в каком исходе. **m-23:** IL-05a-A c=A+1 для LV/HV connector, ES_NC_1/2, Mentee (5 тестов; Restart со снятием причины) |
| current-e2b-connector-safe `6617b2041af9` | **TD-15:** строка A — ни в каком исходе нет C1 ON в скане ≥ e (прежнее «C1 ≤ u в (ii)» отменено). Имя теста изменено |
| current-e2b-rel01-e2 `293e7745495a` | **TD-13 / N18:** REL01-e2-LATE-A, a := A по TD-08 на X0 (R&D: `recRndC_SU` ∨ C2 ∨ STO; Safe: b_Step12 ∨ C1). Без Symbol (R&D) — ERROR предусловия. Нового подъёма в скане ≥ s нет во всех строках. A ≤ s−1 → Emergency; A ≥ s+1 → отказ. **m-21:** при A = s исход (i) засчитывается при всех условиях: нет Emergency/SF, нет подъёма до конца, основное состояние неизменно, новый жест после 2001 мс принимается (u ≤ Q2+400). Иначе — (ii) Emergency |
| current-e2d-fbk-window-abort `45bae54f8fa5` | **TD-14 / N19:** FBK-05 разблокирован. Предикаты: «StartingRun удерживается» / «Safe→R&D удерживается» (§1.2). Признак отката — только выходы. «R&D» в 05 = R_end (C2 OFF ∧ C2_FBK OFF ∧ STO). `pos()`: Faulty снимается в R_end+1. R_end ≤ t_d+T_DIS+3000. S1/S2 — отдельные проверки и отдельные тесты TD-14 S1/S3, S2/S3; S4 — todo «BLOCKED Q-V8R-01». FBK-06: «не Safe» заменено на «C1 ON ∧ не R&D». **K-2 (m-25):** отказ старта при LV Faulty до жеста — сообщение «K-2 RED (WDG-02/MOD-001; content FAIL, not coverage)». Новые 8 тестов «E2d K-2 WDG-02»: Faulty с p−200/p+900/A/A+1 × {снять в t_f+29999 → R&D; удерживать → откат + SF в t_f+30001} |
| current-e2c-stp-i `db29422b9e63` | **TD-14:** tr := R_end; S1 в [c, R_end] — отдельной проверкой |
| current-e2d-unlock-door `297635f6d5a7` | **UNL-LVF (§4b, READY):** синяя 600/2000 мс; LV Faulty с ≤ P−200, P+250, P+499, P+500, P+501, P+700 и импульсы 100 мс в [P−100, P+600] (3 точки). Unlock = X0 в каждом скане, Safe, нет Emergency/SF/C1/C2/STO. 18 тестов |
| current-step12-lv-permit `77531f225c64` | **m-20:** в truth table возвращены строки «агрегат FALSE + NC1/NC2» |
| program/tester/E2-G1/summarize.mjs `b33e272fa225` | **m-24:** поле `stand` — FAIL с «ERROR stand» / «ERROR precondition» считается ERROR, а не содержательным RED |

Из v8 (до вопроса 76) уже в v9: TD-09/TD-10, TD-08, COV-1, REL01-e2-LATE, FFS, M-E2b-21. Сводка — HANDOFF_v8.

## ID матрицы и их новый статус (только факт)

Ничего не закрыто.

Затронуто:
- MOD-002/003/005/006/007/008, PLC-001/004, STP-004/006, WDG-004, EMG-011, CVR-004 — LEG11-OFF;
- MOD-001/002/006, STP-006, WDG-002/003 — TD-14, K-2;
- CVR-001/002, BTN-004 — UNL-LVF;
- EMG-001/002/003/004/005/011, CVR-004/006 — TD-11, TD-12, TD-13, TD-15, m-23;
- CFG-001 — FFS-BYP.

## Команды воспроизведения

```
cd SafetyTests
node --test --test-reporter=tap test/current-e2*.test.js > e2.tap && node program/tester/E2-G1/summarize.mjs e2.tap
node --test --test-reporter=tap $(ls test/current-*.test.js | grep -v current-e2) > non-e2.tap
npm run check:software
# кандидат: корень с MEN001_Dyno/Safety_Dyno/{TwinSafeGroup1/TwinSafeGroup1.sal(.diagram), GVLs/GVL1.sgvl} из candidates/<E2d|E2d-v7.4.1>/native (вне репозитория), затем
E2_SOURCE_ROOT=<root> node --test --test-reporter=tap test/current-e2*.test.js
E2_SOURCE_ROOT=<root> node --test --test-name-pattern="LEG11-OFF" test/current-e2d-fbk-unsolicited.test.js
```

Файлы в baseline-v9/:
- F1: e2-g1v9.normative.tap, e2-g1v9.summary.jsonl (1105), non-e2.tap, check-software-v9.out, f1-unl-lvf.tap;
- кандидаты: cand-E2d-v7.5.e2.tap / .summary.jsonl, cand-E2d-v7.5.leg11.tap, cand-E2d-v7.4.1.leg11.tap, cand-E2d-v7.5.unl-lvf.tap.

## Результаты — canonical F1

### E2 — 1105 тестов (без UNL-LVF; его прогон — отдельным файлом)

Против v8 (999): удалено или переименовано 65, добавлено 171, у сохранённых имён статус не менялся (0).

| Класс | PASS | FAIL | NV |
|---|---|---|---|
| нормативные (1055) | 95 | 907 | 53 |
| DIAG (41) | 41 | — | — |
| KF (9) | 0 | 9 | — |

**FAIL 907 = 2 ERROR + 720 покрытие + 185 содержательных RED.**
- **ERROR (TD-09, F1 без `linkRunDownOwner`):** «E2b TA-OWNER …» ×2. Остальные потребители маркера, `recRndC_SU` (TD-08/13/14) и LEG11-OFF на F1 падают раньше — на недостижимости R&D/Run (покрытие).
- **Новые содержательные RED на F1:**
  - K-2 WDG-02 (8). F1 объявляет R&D при LV Faulty TRUE — производная D-ARCH-POL, а не независимое свидетельство;
  - LEG11-OFF Q76-N5 (1): «Safe->R&D executed by BOTH … r=null». На F1 R&D недостижим (b_Step12, D-ARCH-POL). По сути это покрытие; классификатор относит тест к содержательным, потому что в тексте ошибки нет слова «precondition». Итого содержательных RED по существу — 184;
  - REL01-e2-LATE-A Safe (15), прежние Safe-строки.
- **m-19.** 9 RED FBK-06-NEG/POS (5 + 3 + 1) и 6 FBK-06-W на F1 — **производные D-ARCH-POL**: F1 объявляет R&D при LV Faulty TRUE. По §1 v7-q это не независимое свидетельство.
- UNL-LVF на F1: 18 NV. Наблюдаемые проверки проходят, нет только символа SafetyFault (A8).

### Вне E2 — 487 / 464 / 23 fail

- 16 EARLYSTO и 2 rnd-down — как раньше.
- D-E2d-1 (V14-Q7): MENTEE05 Step12 ×2 и paired producer.
- **Новое, вопрос 76:** DOOR06 «existing-PLC-levels/…/NC1true/NC2true» ×2, pass → fail. F1 поднимает HV по (1,1) — содержательный RED против вопроса 76.

### check:software — exit 3

- **harness: ERROR (283/284).** Падает «D2: committed expected-deltas load, are bound to the pinned baselines; F1 approved by lead, R1 still DRAFT». Это тест стенда про файл expected-deltas (34 записи после правки ведущего), не мой → **стенду**.
- historical 75/75.
- current 1590 / 598 / 939.
- case IDs 0/0.
- tests: missing 33, added 778, statusChanged 6: DOOR06 ×2, EMG6-01 Safe fail→pass, 2 rnd-down, paired producer.
- expected deltas 34 / explained 34 / **unexplained 0**. Новый фрагмент не требуется. Удалённые KF/FBK10-PLC-B/REG(2) в F1-baseline не входят.

## Кандидаты (предварительно, не G3)

**M-E2d-23 (V75-B), LEG11-OFF, набор убийц из 31 теста** (N1 hold 10000 / w = 50/300/601 × базы × FBK, V75-1 вкл. границы, N6 вкл. границы):

| Источник | Набор убийц | Весь LEG11 |
|---|---|---|
| замороженный E2d-v7.4.1 (`a5acf291…`) | **31/31 FAIL** | 78 FAIL / 18 PASS / 4 NV |
| E2d v7.5 (`2276d773…`) | **31/31 PASS** | 93 PASS / 3 FAIL / 4 NV |

- Формулировка: «killed by frozen mutant source». Точную дельту v7.4.1 → v7.5 подтверждает стенд (V75-B, условие 3).
- На v7.5 из LEG11 не проходят 3 теста, все по причинам вне вопроса 76:
  - Q76-N4 ×2 — BOTH-1 после FBK-10 поднимает (K3-ACK не реализован — тот же корень, что FBK-10 K3-ACK 27 RED);
  - Q76-N7(b) — abort зелёной в SR не исполняется (E3, честный RED).

**E2d v7.5, весь E2: PASS 648 / FAIL 172 / NV 235, KF 9 FAIL.**
- Группы FAIL: FBK-10 K3-ACK 27; FBK10-K4 9; FBK-10 9; EMG-RD-L 16 (E3); B43-02 18; FBK-05/06 -W/-NEG/-POS 25; K-2 WDG-02 6; STP-I 8; HLT-03 5; DIS-HOLD 11; прочие.
- ERROR — 0.
- REL01-e2 «[f−300, f+10)» Safe и R&D (по 3) — подъём при эпизоде, захватывающем первое нажатие. Это старый нормативный тест, на v7.5 он RED (архитектору).
- **UNL-LVF на v7.5:** 8 FAIL / 10 NV. Unlock не включается при LV Faulty с ≤ P−200 / P+250 / … — это K-2b, второй убийца M-E2d-32.
- **K-2 на v7.5:** 6 FAIL. FBK-06-NEG/POS теперь получают сообщение «K-2 RED», а не «precondition not reached».

**Наблюдение для аналитика (справка, не тест).** На v7.5 BOTH, нажатый в фазе Safe→R&D (b_Step12, запущенной legacy (1,0)) и удерживаемый до квалификации уже в R&D, запускает R&D→Run на +1012. Вопрос: допустимо ли исполнение жеста, начатого в другой фазе?

**M-E2b-21.** Убийца из v8 (FBK10-K4 S1/S2 «qualified while ON») проверен на E2b v7.2 + мутанте. Перепроверка на точном E2b v7.3 не делалась: кандидата v7.3 в candidates нет. Это предел, перепроверить на G3.

## Допущения и пределы

- A1–A9, A12. Скан 1 мс. Native/IDE/Target/hardware не проверялись.
- Стадия «S12 = R&D» аналитика (E2-Q76) наблюдается как b_Step_RnD / STS_RND.
- `b_Set_HV_C2_1` и `recRndC_SU` входят в «подъём HV», только если присутствуют в источнике.
- TD-11 и TD-12 — явные ослабления аналитика, применены строго в StartingRun и по предусловию.
- FBK-05: R_end — по TD-14 §1.3. Положительный хвост (новый BOTH после R_end) не написан, это по желанию.
- Q76-N7(c) и S4 — NV (E6 / Q-V8R-01).
- Q76-N8 Emergency: (1,1) удерживается через Restart 3000 мс. Проверяется «ни b_Step12, ни R&D» в последних 3000 сканах.
- FFS-BYP (b): A по `recRndC_SU`; без Symbol — ERROR.

## Не сделано / остаток

1. Пины подграфов (plc-pulse FBOrIlRunOk, R3PAIR, safe-run-gestures, SAFEINPUT GATE_001, hv «stale aggregate») не переписаны — решение по V2ID за ведущим и стендом. Поведенческие замены — FFS и FFS-BYP.
2. PRIORITY Step12 NC (src) — стенду.
3. Строки Healthy TD-09 §1.3 (STP-G против STP-D/H, нормы E3) не написаны.
4. Отдельная перепроверка M-E2b-21 на E2b v7.3 и формальный G3 — после ACCEPT G1 v9 и G2.

## Вопросы аналитику

1. BOTH, начатый в фазе Safe→R&D (по (1,0)) и квалифицированный в R&D: исполнять R&D→Run или нет? Факт v7.5 — исполняет.

## Что передать следующему и кому

- **Ревьюеру G1 v9:** всё перечисленное выше; kill-доказательство M-E2d-23; UNL-LVF / K-2 на v7.5.
- **Стенду:** harness D2 ERROR; точная дельта v7.4.1 → v7.5 (V75-B).
- **Архитектору:**
  - K-2 и K-2b на v7.5;
  - REL01-e2 [f−300, f+10) на v7.5;
  - K3-ACK на v7.5 (Q76-N4, 27 K3-ACK);
  - testFiles = 28.
  - Убийцы: M-E2d-23 → LEG11-OFF (31); M-E2d-32 → UNL-LVF и K-2 WDG-02; M-E2d-14/15/16 — «removed with v7.5».
- **Expected-deltas:** новых записей не требуется (unexplained 0). Информационно — statusChanged DOOR06 ×2 pass→fail (вопрос 76) и paired producer (D-E2d-1).
