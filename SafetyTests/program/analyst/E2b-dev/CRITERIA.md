# E2b-dev — граница принятия (D-E2b-2) и старые оракулы крышки против V14-Q7 (D-E2d-1)

Роль: v2-analyst, 2026-10-22. Основание: `program/editor/E2b/HANDOFF.md` (D-E2b-2),
`program/editor/E2d/HANDOFF.md` (D-E2d-1).

| Источник | SHA256 |
|---|---|
| SafetyTests/SCENARIO_DECISIONS.md (до записи TD-08) | `8ab0b135b48061000111c756ea4b2968e56ee56e2a94d0b251908e18a2ef3284` |
| program/analyst/REQ-CONSOLIDATION/CRITERIA.md (IL-02, IL-05a, IL-05b) | `f2f11d77eba0d3b4441b42ff55666fbfc741bdd2867ebb763829328ad909eaa3` |
| program/analyst/E2-G1-questions/CRITERIA_DELTA.md (EMG4-03) | `a017cbde326bde62c1d1bda8381e5687d98fa35eb6c95e0e26d593985e6ea15f` |
| program/analyst/E2-G1-v2-questions/CRITERIA_DELTA_v4.md (§0.1 правило L, §C N=u) | `2b405938d002343a65afc73db8d2b83f172106462368121792c2539d70a60c04` |
| program/analyst/E2-G1-v3-CA1/CRITERIA_DELTA_v6.md (§4 N=u (ii)) | `3d2d8fba7c162b601da39c6094fb35fff115264243a05c35526140f8b3030f02` |
| program/analyst/E2-RC-D2/CRITERIA.md (LV-A1) | `dc8b9853296933382b79a5020c08eb90823d713fd21795bbab60260e37beafb1` |
| program/architect/E2-status/PLAN.md (v7.2) | `722aae404f0203842634d2c5919d9938e53dd9380ed28ebd95162d93f718b002` |
| program/editor/E2b/HANDOFF.md / E2d/HANDOFF.md | `73a07594…a955c7` / `af8182ea…f1cf147` |
| test/current-e2b-cover-transitions.test.js | `566d4115285c0c9cf3c2a03d1b4d41d63897492226bbdada48a0055154f5d1c9` |
| test/current-e2b-connector-safe.test.js | `941afdefe4618ab4236faacb6ce7fdaf296941ef49ffd7eb277bc594deee1234` |
| test/current-hv-set-permit.test.js | `a0abd7b267bec0ee36438cb64199c3432fc1dc87e38fa0751484e3e180a83ada` |
| test/current-step12-lv-permit.test.js | `94f706c882d3945e6d36b9529d03482e303b62d39d5f86e28a61f2c90d944b5b` |
| test/current-mentee-set-permit.test.js | `388a6ecac011e23082a6bc7b4d16053f9c80b69abc5906c87ea3493dfb422a94` |
| src/current-code-checks.js (PRIORITY) | `2c4b60c948ae02bbc0485eec818ed9055409da3037d0894b9076f198a1dbdb6d` |
| Кандидат E2b SAL / SGVL (справка, не oracle) | `386e208b…2cfec` / `5b031b0c…205d9` |
| Кандидат E2d SAL / SGVL (справка, не oracle) | `365f2c2ef0791e6d3b93812cb4920c4f1c93c067d2246f8132f9b08e7df6bd8a` / `d2b08a8d12ddf85f33f024f6593d9a3d64501962f7be4ba64b2a5b3935b3a969` |

Reference 4495a1f здесь ответа не даёт: в нём нет R&D, StartingRun и Safe→R&D при
открытой крышке. Нормы ниже выводятся из решений Вадима и прежних критериев.

---

## 1. D-E2b-2 — точка принятия A (TD-08, ждёт просмотра)

### 1.1 Что было

- Границы IL-02 / IL-05a (REQ-CONSOLIDATION §C): «c = u−1 → IL-02 (UP отклонён, R&D)»,
  u — наблюдение, «c = u+1 → IL-05a». Здесь u = первый скан C2 ON или снятого STO.
- Граница EMG4-03 (E2-G1-questions §I): «u−1 → EMG-003 (UP отклонён), u — наблюдение,
  u+1 → EMGREF-LV». Здесь u = первый скан C1 ON.
- Обе строки молча приравнивали принятие к первому выходу. Но принятие по вопросу 73 «А» —
  одно событие: грант, команда контактора, снятие STO. Внутри цепочки сканы идут по порядку,
  и защёлка принятого подъёма видна раньше выхода. Факт кандидатов E2b и E2d:

| Переход | p (первое нажатие) | Защёлка / стадия | Первый выход | Разница |
|---|---|---|---|---|
| R&D→Run | p | STATE_SU (`recRndC_SU`) с p+1000 | C2 ON и STO снят с p+1002 = u | A = u−2 |
| Safe→R&D | p | грант g2 (`b_Step12_Set`) в p+1000, стадия `b_Step12` с p+1001 | C1 ON с p+1002 = u1 | A = u1−1 |

Событие в u−1 (R&D→Run) приходится на уже принятый StartingRun. По IL-05a (Q-RC-03(a) «Б»)
это Emergency. Старая строка «u−1 → отказ» требовала отменить принятый подъём без аварии.
Значит, неверно определение в тесте, а не реакция кандидата.

### 1.2 Определение A (READY-D, TD-08)

A — первый скан ≥ p, в котором виден **любой** признак принятия. A меряется по трассе
**без события** (fork с той же базой и тем же жестом), как u в нынешних тестах.

- **R&D→Run:** STATE_SU (Symbol `recRndC_SU`), `out_HV_C2` TRUE, STO_DR1 или STO_DR2 снят.
  Это определение `a` из DIS-HOLD-HV (вопрос 73 «А», E2-plan-v5-questions §1). Тест
  читает `recRndC_SU` через `x.get`. Если Symbol нет в источнике — **ERROR стенда**, а не
  тихий переход на A = u. Legacy-путь PLC (1,1) SU не ставит (PLAN v7.2, таблица путей, строка N12/FBAnd10), там A = u.
- **Safe→R&D:** стадия `b_Step12` или `out_LV_C1` TRUE. Это LV-A1 из E2-RC-D2.
  Грант g2 — внутренний скан **до** A, он лежит в [.., A−1].
- Всегда A ≤ u. Разницу u − A писать в diagnostic, не нормировать.

### 1.3 IL-02-A / IL-05a-A — R&D→Run, крышка

Исходное состояние: устойчивый R&D (`L.cached('RnD',{c3:true})`), крышка закрыта, кнопки
отпущены ≥ 2 с. Входы: BOTH с p, отпускание в p+1100. В скане c: NC1, NC2 или обе FALSE и
удерживаются; Door TRUE (и FALSE для «both»). Ссылочная трасса R для правила L —
`in_Estop_PLC` TRUE с того же c, та же база.

| c | Норма | Статус | Факт E2b | Факт E2d |
|---|---|---|---|---|
| ≤ A−1 (в т.ч. A−1 = u−3) | Отказ (IL-02): ни в одном скане ≥ c нет C2 ON и снятия STO; только `b_Step_RnD`, C1 ON в каждом скане; нет Emergency/fault; после закрытия крышки удержание не исполняется | нормативно | PASS | PASS |
| A (= u−2) | Наблюдение. Допустимо (i): отказ, как строка выше. Или (ii): Emergency по IL-05a, правило L1 против R в c; C2/STO допустимы только как собственные выходы принятия — не позже u трассы без события, затем возврат по v6 §4. Запрещено: Run; C2 ON/STO снят без последующей защёлки Emergency | наблюдение (TD-08, TD-07) | (i), SU не ставится | (i), SU не ставится |
| A+1 … u−1 (= u−1) | IL-05a: Emergency по правилу L1 против R в c (Imm ≤ τ_R, Del [τ_R−1, τ_R]); L4; защёлка. Ни в одном скане ≥ c нет C2 ON / снятия STO / C1 ON / C3/BMS ON / Unlock. Run никогда. Restart → только Safe | **нормативно** (новое) | PASS (Emg в c+1, C2/STO не было) | PASS (то же) |
| u | То же, что строка выше: c ≥ A+1. Инвариант правила L: нового повышения нет **в скане c**. Скан u в трассе без события — первый выход; при событии в u его быть не должно (`in_Estop_PLC` в u его и не даёт) | **нормативно** (заменяет дизъюнкцию N=u v4 §C / v6 §4, если A < u) | PASS: C2/STO не включаются, Emg в u+1 | **FAIL**: C2 ON и STO сняты в u при NC1 FALSE в u; Emg в u+1; C2 до u+8009, STO до u+7005 |
| u+1, u+50, r−1 | IL-05a без изменений | нормативно | без изменений | без изменений |
| r+1 | IL-03 без изменений | нормативно | — | — |

Дизъюнкция N=u (CRITERIA_DELTA_v4 §C и v6 §4) теперь применяется к **c = A**, если
A < u. Если A = u (legacy-путь без SU), она остаётся при c = u без изменений.

Запрещённые реакции (сводно): Run в любом скане ≥ c; C2 ON или снятие STO в скане ≥ c
при c ≥ A+1; отказ без Emergency при c ≥ A+1; Emergency при c ≤ A−1; «R&D» с энергией
уровня Run после Restart.

Аварийные сочетания: ES_NC/`in_Estop_PLC` в том же c — общая цепь, исход как у R.
Connector (LV/HV) в R&D→Run в c ≥ A+1 — EMG4-03 (EMGREF-RUN), та же граница A.

### 1.4 EMG4-03-A — Safe→R&D, connector

Исходное состояние: устойчивый Safe (`L.cached('Safe')`), connectors TRUE, крышка закрыта.
Входы: BOTH с p, отпускание в p+1100. В скане e: `in_LV_Connector_Interlock` или
`in_HV_Connector_Interlock` FALSE и удерживается. R — `in_Estop_PLC` TRUE с e.

| e | Норма | Статус | Факт E2b = E2d |
|---|---|---|---|
| ≤ A−1 (в т.ч. A−1 = g2 = u1−2) | EMG-003: только `b_Step1`, C1 OFF в каждом скане ≥ e; нет `b_Step12`, нет R&D; нет Emergency/fault | нормативно | PASS (грант не выдаётся) |
| A (= u1−1) | Наблюдение. (i): Safe, C1 OFF в каждом скане, нет Emergency (`b_Step12` допустим только в самом A). (ii): EMGREF-LV по L1 против R; C1 ON допустим только как выход принятия не позже u1 трассы без события, затем C1 OFF по общей цепи (Q-E2Q-01, L2). Запрещено: R&D; C1 ON без Emergency | наблюдение | (ii): Emg в e+1, C1 не включается |
| A+1 (= u1) | EMGREF-LV: Emergency по L1/L4, защёлка; C1 ON ни в одном скане ≥ e; R&D никогда; Restart → только Safe | **нормативно** (новое) | PASS (Emg в e+1, C1 не включается) |
| u1+1 | EMGREF-LV, как в нынешнем тесте | нормативно | PASS (C1 OFF на e+2003) |

### 1.5 Что меняется в тестах (тестировщику)

`test/current-e2b-cover-transitions.test.js`:
- `upPoints()`: добавить `A` = первый скан ≥ p с `recRndC_SU` или C2 ON или STO снят.
  Отсутствует Symbol — ERROR предусловия.
- «IL-02 boundary N=u−1» → строка «c = A−1»: oracle прежний (отказ, R&D, LV, без Emergency).
- Новая строка «c ∈ [A+1, u]» (минимум c = A+1 и c = u, если u > A): oracle `il05a`, но
  предусловие «STO released or C2 ON before c» заменить на «A ≤ c−1». Нового повышения нет
  ни в одном скане ≥ c, **включая c** (сегмент `t ≥ c`, сравнение с c−1).
- «IL-02/IL-05a boundary N=c=u» → перенести на c = A, логику дизъюнкции не менять.
  Если A = u, тест остаётся как есть.
- Источник в заголовке: «TD-08 (TEAM-DEFAULT); IL-02, Q-RC-03(a), DIS-HOLD-HV a, LV-A1, TD-07».

`test/current-e2b-connector-safe.test.js`:
- `acc()`: A = первый скан ≥ p с `b_Step12` в `s.stages` или C1 ON.
- «u−1 → EMG-003» → «A−1 → EMG-003» (oracle прежний; дополнительно нет `b_Step12`).
- Новая строка «A+1 → EMGREF-LV» (oracle как в нынешнем «u+1», плюс C1 ON ни в одном скане ≥ e).
- Новая строка «A → наблюдение» (дизъюнкция 1.4, исход в diagnostic).
- Строку «u+1» оставить.

Ни одна проверка не ослабляется. Строка «c = A−1» строже прежней «u−1»: точка ближе к
защёлке. Строки A+1 и u добавляют норму, которой раньше не было.

---

## 2. D-E2d-1 — какие старые ожидания крышки заменены V14-Q7

### 2.1 Что сказал Вадим

- **V14-Q7 «Б1»:** Safe→R&D разрешён при открытой крышке, от кнопок и от PLC. Блокировку
  LV по крышке «пересмотреть именно для Safe→R&D». Для R&D→Run «closed + locked» (V14-Q5)
  остаётся обязательным.
- **Q-RC-03 (b1):** в Safe→R&D потеря крышки переход не меняет.
- **Q-RC-01, Q-RC-03(a), Q-RC-17:** в Run, StartingRun и прочих спусках — Emergency.
- **IL-01 / CFG-02:** вход в Config при открытой крышке запрещён (E4).

### 2.2 Важный факт кандидата

`N1/FBAndLvCurrentPermit` — **общее** разрешение для LV Set (`FBAndLvSetPermit.AndIn2`) и
для HV Set (`FBAndHvSetPermit.AndIn2`). E2d снял с него NC1/NC2. Поэтому финальный гейт
HV Set тоже больше не видит крышку (`repro/permit-table.E2d.out.txt`). Крышка для HV
теперь проверяется только выше по цепи. Устойчивый подъём при открытой крышке
блокируется (кнопки и PLC (1,1): C2/STO 0 сканов, `repro/rnd-open-up.E2d.out.txt`). Но
защита в **первом скане** открытия пропала: при NC1 FALSE в скане u кандидат E2d
включает C2 и снимает STO в том же u. На E2b при том же входе C2 и STO не включаются.
`in_Estop_PLC` и ES_NC_1 в скане u тоже не дают подъёма (`repro/startingrun-release.E2d.out.txt`).

### 2.3 Классификация (без ослабления)

| Старое ожидание | Где | Решение | Новая норма | Источник |
|---|---|---|---|---|
| LV Set запрещён при NC1/NC2 FALSE (агрегат TRUE → `out_LV_C1` FALSE) | `current-step12-lv-permit` «LV truth table», строки `in_InterLock_NC_1/2`; `current-mentee-set-permit` «MENTEE05 LV: all previous eight», те же 2 строки | **заменено V14-Q7** для пути Safe→R&D | NC1/NC2 FALSE не мешает LV Set: `out_LV_C1` = агрегат. Остальные 6 строк (EOk, ES_NC_1/2, connectors, `in_Estop_PLC`) — без изменений. Цикл «уже установленный LV сохраняется» — без изменений | V14-Q7, Q-RC-03(b1), IL-01, IL-05b(2) |
| Первый скан неисправности запрещает «старый» LV Set | `current-step12-lv-permit` «paired real producer prehistory» (производитель N11/FBAnd1, путь Step12), строки NC1/NC2 | **заменено V14-Q7** | для NC1/NC2: Set исполняется, как без события. Остальные строки — без изменений | V14-Q7, Q-RC-03(b1) |
| Тот же LV-запрет на пути legacy Network5 (`b_Step2`) | агрегат FBOr17 ← FBAnd5 | **не заменено** | V14-Q7 касается только Safe→R&D. Network5 — исходная последовательность запуска до Run, удаляемая по Q-ARCH-06. Норма: `b_Step2` недостижим в v2 (доказательство R1). Если достижим — NC1/NC2 обязан запрещать на нём LV Set. Unit-строки на агрегате FBOr17 пути не различают; тест должен проверять маршрут, а не агрегат | V14-Q7 «именно для Safe→R&D», V14-Q5, Q-ARCH-06 |
| HV Set запрещён при NC1/NC2 FALSE, включая первый скан (агрегат TRUE → `out_HV_C2` FALSE) | `current-hv-set-permit` «HV truth table» (NC-строки), «stale aggregate paired first-fault scans» (NC-строки маршрутов RnD-Network12, legacy, AND6); `current-mentee-set-permit` «MENTEE05 HV: all previous eight» (NC-строки) | **НЕ заменено** — остаётся нормативным | Поведенческая форма (её проверять независимо от места гейта): в любом скане n с NC1 или NC2 FALSE в n нет нового `out_HV_C2` ON и нового снятия STO_DR1/2 (выход OFF в n−1 → OFF в n), по каждому маршруту подъёма HV (кнопки/SU, legacy PLC, повтор AND6). Место гейта выбирает архитектор; unit-тест можно перенацелить на настоящий гейт, норму — нельзя | V14-Q5, V14-Q7 (R&D→Run в силе), IL-02, IL-05a + правило L Imm «нет нового повышения в каждом скане ≥ e», §1.3 строка c = u |
| PRIORITY:Step12:ExternalNC1/NC2 (обе fallback) «no new LV command during fault» | `src/current-code-checks.js` | **заменено** (V14-Q7, Q-RC-03(b1)) | Стадия Step12 — переход Safe→R&D уже принят; крышка его не меняет. Ожидание: LV-команда идёт, как в контрольной трассе без события (`control`): `lvRiseDuringFault` = значению контрольной трассы, ни Emergency, ни fault. «no new HV command», «no unlock» — **без изменений** | V14-Q7, Q-RC-03(b1), IL-05b(2) |
| PRIORITY Step12 с LVConnector/HVConnector, NC1/NC2 ES, PLC, Mentee | там же | **не заменено** | без изменений (EMG4-03, EMGREF-LV) | Q-RC-14, Q-ARCH-01 |
| PRIORITY ExternalNC1/2 в прочих фазах (Step1, RnD, Step3…) | там же | **не заменено** | без изменений. В Safe нет поданной команды, в R&D LV уже ON, в Run — Emergency | IL-01, IL-02, IL-03 |

Сохраняются без ослабления:
- Emergency при крышке в устойчивом Run (IL-03, Q-RC-01), в StartingRun (IL-05a, Q-RC-03(a))
  и в прочих спусках (IL-05d, Q-RC-17);
- R&D→Run только при закрытой крышке (IL-02, V14-Q5/Q7), включая первый скан открытия (выше);
- вход в Config при открытой крышке запрещён (CFG-02, E4).

### 2.4 Находка для архитектора (через ведущего)

**E2d-COV-1 (FAIL на E2d, нормативно).** R&D→Run, жест BOTH принят (SU в u−2). NC1 FALSE
с u. Ожидание: C2 OFF и STO активны в u и далее, Emergency по L1. Факт E2d: C2 ON и STO
сняты в u, Emergency в u+1, C2 держится до u+8009 — это повышение энергии при уже открытой
крышке. На E2b — PASS. Причина, скорее всего, в снятии NC1/NC2 с общего
`FBAndLvCurrentPermit`: HV-гейт остался без крышки в том же скане. Не атрибутировано.
Пересекается с D-E2b-3 («путь крышки и `in_Estop_PLC` расходятся на 1 скан»): сравнивать
оба на одной трассе.

### 2.5 Стенду / тестировщику

- `current-mentee-set-permit.test.js` читает canonical SAL жёстким путём
  (`../../MEN001_Dyno/...`) и не учитывает `E2_SOURCE_ROOT`. На моём корне E2d он даёт PASS,
  в регрессе редактора — FAIL. Результаты по кандидату из этого файла недостоверны, пока
  путь не исправлен (класс D-E2b-4).
- `current-hv-set-permit` «stale aggregate …» и `current-step12-lv-permit` «paired producer»
  на E2d падают уже на предусловии «real aggregate must assert» (пины подграфа, D-E2b-4).
  Они не отличают замену нормы от поломки среза стенда.

---

## 3. Пересечение с D-E2b-1 / D-E2b-3 (архитектор)

- D-E2b-1 (REL01-e2 в R&D, эпизод крышки при удержании BOTH): определение A на него не
  влияет. TD-07 по-прежнему действует: эпизод [s, r) до A — отказ, новый жест после
  восстановления.
- D-E2b-3: E2d-COV-1 — того же рода (момент действия крышки относительно `in_Estop_PLC`).
  Норма — правило L1 (Del [τ_R−1, τ_R], Imm ≤ τ_R) и инвариант «нет нового повышения ≥ e».
  Строку «IL-05b крышка на t_a−1 спуска → R&D вместо Emergency» этот срез не трогает.

## 4. ID

| ID | Критерии | Статус |
|---|---|---|
| EMG-002, CVR-006 | IL-02-A, IL-05a-A (§1.3), E2d-COV-1 | READY-D (TD-08 ждёт просмотра) |
| EMG-003, CVR-004 | IL-02-A c ≤ A−1, EMG4-03-A e ≤ A−1 | READY-D |
| EMG-004, EMG-005 | EMG4-03-A (§1.4) | READY-D |
| MOD-001, MOD-002 | A для Safe→R&D / R&D→Run | READY-D |
| MOD-001, CVR-004 | D-E2d-1 классификация (§2.3) | READY (V14-Q7, Q-RC-03(b1)) |

## 5. Воспроизведение (из `SafetyTests/`)

Корень: копия canonical `MEN001_Dyno/Safety_Dyno` с SAL/diagram/SGVL кандидата из
`candidates/<E2b|E2d>/native/`.
```
E2_SOURCE_ROOT=<root> node program/analyst/E2b-dev/repro/accept-boundary.mjs      > repro/accept-boundary.<c>.out.txt
E2_SOURCE_ROOT=<root> node program/analyst/E2b-dev/repro/permit-table.mjs         > repro/permit-table.<c>.out.txt
E2_SOURCE_ROOT=<root> node program/analyst/E2b-dev/repro/startingrun-release.mjs  > repro/startingrun-release.E2d.out.txt
E2_SOURCE_ROOT=<root> node program/analyst/E2b-dev/repro/rnd-open-up.mjs          > repro/rnd-open-up.E2d.out.txt
```
Это модель стенда `e2-lifecycle` / `sal-runtime`, скан 1 мс, плант A2, а не native-семантика.
Факты кандидатов — справка, не oracle.
