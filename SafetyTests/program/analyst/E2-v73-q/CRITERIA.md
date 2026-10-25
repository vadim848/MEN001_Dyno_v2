# E2-v73-q — t_a спуска по владельцу (V73-A, TD-09) и L2 Del в StartingRun (V73-B, TD-10)

Роль: v2-analyst, 2026-10-22. Основание: ревью v7.3/v7.4, `program/reviewer/E2-plan-v7/PLAN_REVIEW.md`
(V73-2, V73-3; условия V73-A, V73-B). Действует поверх REQ-CONSOLIDATION v2, CRITERIA_DELTA_v4 §0.1,
E2-G1-v3-questions §2 (EMG-RD-L), E2b-dev (TD-08). При конфликте приоритет у этого среза.

| Источник | SHA256 |
|---|---|
| SafetyTests/SCENARIO_DECISIONS.md (до записи TD-09/10) | `c62582a0c22070fff4e2e8b90bb9ca978aaa58f9d6f05ca6bcd000a355e21028` |
| SafetyTests/SCENARIO_DECISIONS.md (после записи TD-09/10) | `5a148eed902a019b5e078ccdae385447f9fafb4c2fa7fd2f1507c1d33720c8e6` |
| program/reviewer/E2-plan-v7/PLAN_REVIEW.md | `a3f9b8f8f0c606d4652e86bfd9af42b61955fc2111c806694caa20296db1aa6d` |
| program/architect/E2-status/PLAN.md (v7.3+v7.4) | `f247e310c096c8d59dc7a5f80fb1be7f8cf4276e2aa7d56b8f54b990727ce595` |
| program/analyst/REQ-CONSOLIDATION/CRITERIA.md (§0, §B STP-A, IL-05b) | `f2f11d77eba0d3b4441b42ff55666fbfc741bdd2867ebb763829328ad909eaa3` |
| program/analyst/E2-G1-v2-questions/CRITERIA_DELTA_v4.md (§0.1 правило L) | `2b405938d002343a65afc73db8d2b83f172106462368121792c2539d70a60c04` |
| program/analyst/E2-G1-v3-questions/CRITERIA.md (EMG-RD-L) | `29f4288f926ab2459f239ffe3414bbf94f5990d947efc1037c8c12e02ae29b47` |
| program/analyst/E2-G1-v3-CA1/CRITERIA_DELTA_v6.md (L2 вне Safe, SS1-EMG) | `3d2d8fba7c162b601da39c6094fb35fff115264243a05c35526140f8b3030f02` |
| program/analyst/E2b-dev/CRITERIA.md (TD-08, A) | `142b2b9dd820a6d2142d3594a2d095da75916b7fec9dd5c0edfe2363f3efee9a` |
| Canonical SAL / SGVL / diagram | `04b45456…d28a3` / `dc103abe…a9104` / `de02bbff…a603` |
| Кандидат E2b / E2d SAL (справка, не oracle) | `386e208b…2cfec` / `365f2c2e…df6bd8a` |

Reference 4495a1f ответа не даёт: в нём нет R&D, StartingRun и маркера владельца спуска.
Нормы выведены из решений Вадима и прежних критериев. Факты кандидатов — справка (модель
`sal-runtime`, скан 1 мс, плант A2), не oracle.

---

## 1. TA-OWNER — точка принятия нормального спуска Run→R&D (V73-A, TD-09, ждёт просмотра)

### 1.1 Определение

- **t_a := первый скан ≥ P, в котором `linkRunDownOwner` TRUE** (SAL-переменная на
  N6/RUN_DOWN_OWNER.RsOut). P — первый скан нажатия зелёной.
- t_a берётся по трассе **без события**: fork с той же базой и тем же жестом, как A в TD-08.
- Тест читает маркер по имени (`x.get('linkRunDownOwner')`).
  - Symbol отсутствует в источнике → **ERROR стенда/предусловия**.
  - Symbol есть, но не ставится, хотя спуск выполняется (выходы спуска меняются) → **ERROR предусловия**.
  - Переход на t_a(obs) (первое изменение STO/SS1/Discharge) в обоих случаях **запрещён**.
- Граница «≤ t_a(obs)−3» как oracle **не принимается**: она привязана к латентности реализации.
- t_a(obs) и разницу t_a(obs) − t_a писать в diagnostic, не нормировать.
- Путь PLC (CMD_RUN_TO_R&D, STP-B): то же определение, если путь ставит маркер. Иначе ERROR
  предусловия. Нормативно только после E4 (команды PLC заморожены).

Справка (E2b, E2d, без v7.3/с v7.3 одинаково; `repro/v7.3/owner*.mjs` ревьюера):
owner = P+501; HV discharge owner+3; STO и C2 OFF owner+4; стадия R&D P+705; SS1 owner+205.

### 1.2 Сам маркер против квалификации зелёной (BTN-003, READY-D)

Исходное состояние: устойчивый Run (R0, StartingRun → Run подтверждён, кнопки отпущены ≥ 2000 мс).
Вход: зелёная TRUE с P, удерживается ≥ 600 мс; синяя FALSE.
q_G — скан истечения T_SINGLE 500 от P по конвенции BTN-003 (тот же helper, что в тестах кнопок).

| Скан | Норма | Статус |
|---|---|---|
| ≤ q_G−1 | `linkRunDownOwner` FALSE; ни одного выхода спуска | нормативно (T_SINGLE, q−1) |
| q_G | маркер — наблюдение | наблюдение |
| q_G+1 | маркер TRUE (поставлен не позже q_G+1) | нормативно (q+1) |

Вариант: зелёная отпущена в P+499 (короче T_SINGLE) — маркер не ставится, Run сохраняется.
Источник: BTN-003 (single 0,5 с), REQ-CONSOLIDATION §0 (q−1/q/q+1), TD-09.

### 1.3 Границы, отсчитанные от t_a (замена t_a(obs) на owner; содержание норм прежнее)

Исходное состояние для всех: как 1.2; зелёная с P, отпускание P+600. Событие в скане c.

| Критерий | c = t_a−1 | c = t_a | c = t_a+1 | Источник |
|---|---|---|---|---|
| IL-05b(1): NC1, NC2 или обе FALSE, удерживаются | IL-03: Emergency (Run, Q-RC-01), правило L1 против R (`in_Estop_PLC` в том же c, устойчивый Run), защёлка, Restart → Safe | наблюдение: (i) IL-03 или (ii) IL-05b(1) | IL-05b(1): спуск продолжается по STP-A, итог R&D, нет Emergency/fault; затем R&D с открытой крышкой (IL-02/IL-02b) | Q-RC-01, Q-RC-03(b1), IL-05b |
| Healthy: `in_HV_Faulty_FBK` / `in_LV_Faulty_FBK` TRUE ≥ 100 мс | STP-G (защитный спуск из Run) | наблюдение: STP-G или STP-D/STP-H | STP-D (HV в SS1) / STP-H (LV в SS1) | Q-RC-02, Q-RC-15, REQ §B STP-G |
| `in_Estop_PLC` TRUE (и прочие причины L1) | L3 (устойчивый Run) / L1 против R | наблюдение | EMG-RD-L (Q-T3-1 «А») | E2-G1-v3-questions §2 |

Запрещено при c = t_a (любой исход): Run в любом скане ≥ c+1 без Emergency; новое повышение
энергии (C2 ON, снятие STO, C1 ON, Unlock) в скане ≥ c; Emergency, затем возврат в спуск без
Restart; смешение исходов (часть выходов по спуску, затем Emergency без причины).

Аварийные сочетания:
- крышка в c = t_a−1 одновременно с ES_NC/`in_Estop_PLC` — общая цепь, исход как у R (EMGREF-RUN);
- Healthy и крышка в одном c = t_a+1 — IL-05b(1) крышку игнорирует, действует STP-D/H;
  в c = t_a−1 — Emergency (IL-03) приоритетнее STP-G (E2-G1-v3-questions §2 «Emergency
  приоритетнее» для сочетания с STP-D; D-TEAM п.1);
- крышка в c ≥ t_a+1 и затем `in_Estop_PLC` — EMG-RD-L по моменту `in_Estop_PLC`.

### 1.4 Нормы STP-A с новым t_a — без изменения содержания

STP-A (REQ-CONSOLIDATION §B) с t_a = owner: SS1 в t_a (+≤1); STO нет в t_a+1999, есть к t_a+2001;
Discharge t_s+5000/+5001; C2 OFF t_d+T_DIS; R&D после C2_FBK OFF.
EMG-RD-L: STO q_N = t_a+2000 с тем же t_a.

**Честный RED до E3 (не скрывать, не ослаблять):** на F1-цепи кандидатов E2b/E2d SS1 в owner+205
(норма ≤ owner+1), STO в owner+4 (норма ≥ owner+2000), HV discharge owner+3. Это known FAIL
EARLYSTO / STOP v2 (E3), а не следствие TD-09. Canonical F1 маркера не имеет: по TD-09 — ERROR
предусловия, не PASS и не FAIL логики.

### 1.5 Тестировщику

- `test/current-e2b-cover-transitions.test.js` (стр. 129–140): убрать fallback на t_a(obs) при
  отсутствии маркера. Нет Symbol → ERROR (`assert.fail('ERROR stand: linkRunDownOwner absent')`).
  Источник в заголовке: «TD-09 (TEAM-DEFAULT); REQ §B, IL-05b, Q-RC-03(b1), Q-RC-01».
- `test/helpers/e2-emergency.js` `downTa()` (первое изменение DOWN_KEYS) — заменить на маркер или
  оставить только для diagnostic t_a(obs). Затрагивает EMG-RD-L sweep
  (`current-e2a-emg-rd-sweep.test.js`) и STP-G/D/H-границы.
- Минимальный набор: 1.2 (q_G−1, q_G+1); 1.3 каждая строка c ∈ {t_a−1, t_a, t_a+1} для NC1, NC2, обе;
  HV и LV Faulty; `in_Estop_PLC` и ES_NC_1. Исход при c = t_a — `t.diagnostic`, дизъюнкция нормативна.
- Ни одна проверка не ослабляется: t_a−1 по owner на 3 скана раньше границы по t_a(obs), то есть строже.

---

## 2. L2-SU — момент Del-выходов при `in_Estop_PLC` в StartingRun (V73-B, TD-10, ждёт просмотра)

### 2.1 Что было

CRITERIA_DELTA_v4 §0.1 L2 Del: смещение от e в [d_Run, d_Run+1], где d_Run = τ_Run(o) − e —
момент того же выхода при `in_Estop_PLC` в устойчивом Run. Окно ввёл аналитик (Т3 (б)), не Вадим.
Факт E2b/E2d (`c3`, ревью V73-3): в StartingRun C1 OFF +2004, STO +7006, C2 OFF +8010 против
Run +2005 / +7007 / +8011 — на 1 скан раньше. NC1 в StartingRun = `in_Estop_PLC` в StartingRun
поскан (L1 выполнено). Причина — разный путь g7 (Run: N6/FBAnd9 читает статус прошлого скана;
SU: FBAndLvEmg по текущему `b_EStop_Ok`).

### 2.2 Норма (TD-10)

Исходное состояние: устойчивый R&D (R0), BOTH с p, отпускание p+1100; StartingRun — от A (TD-08,
`recRndC_SU`) до подтверждения Run (r) трассы без события. Событие: `in_Estop_PLC` TRUE в e,
удерживается. Эталон d_Run: `in_Estop_PLC` в устойчивом Run, та же база (`E.runRef()`).

Для каждого Del-выхода o ∈ {`out_LV_C1` OFF, STO_DR1/STO_DR2 активен, `out_HV_Discharge_Request`,
`out_HV_C2` OFF}, не достигшего цели до e:

| τ_SU(o) − e | Норма |
|---|---|
| ≤ d_Run−2 | **FAIL** (укороченная выдержка, Т1 п.3; Q-ARCH-01) |
| d_Run−1 | допустимо (TD-10) |
| d_Run | допустимо |
| d_Run+1 | допустимо (L2) |
| ≥ d_Run+2 или never | **FAIL** (отставание) |

- Выход уже в цели до e (STO активен и C2 OFF при e ∈ [A+1, u−1]) — остаётся в цели в каждом скане
  ≥ e (EMGREF(2), v3-questions §2 п.4).
- Imm-выходы (статус, C3/BMS OFF, LV discharge, Unlock FALSE, SS1 запрошен): L2 Imm без изменений,
  τ_SU − e ≤ d_Run + 1.
- L1 в StartingRun (NC1/NC2, ES_NC_1/2, Mentee, connector) против R = `in_Estop_PLC` в StartingRun
  в том же e: без изменений, Del [τ_R−1, τ_R]. **Дополнительно** нижняя граница Del для любой
  причины в StartingRun: τ_X(o) − e ≥ d_Run − 1 (композиция L1 и TD-10 не даёт −2; прежний
  минимум сохранён).
- L3, L4, конечное состояние, защёлка, Restart → только Safe — без изменений.
- Область: только StartingRun. В R&D, R&D→Safe, Safe→R&D, Run→R&D, abort, откатах — L2 Del
  прежний [d_Run, d_Run+1]. Опережение −1 там — FAIL до решения аналитика, не тихий допуск.

### 2.3 Границы и сочетания для тестировщика

- e в StartingRun: e = A+1, e = u (первый выход трассы без события), e = u+1, e = u+50, e = r−1.
  Строка e = A — по TD-08 (наблюдение), сюда не входит. e = r+1 — устойчивый Run (L3).
- Самотест правила (синтетический профиль): −2 → FAIL, −1 → PASS, 0 → PASS, +1 → PASS, +2 → FAIL;
  отсутствующий выход → ERROR anti-vacuity, не пропуск.
- Аварийные сочетания: `in_Estop_PLC` и NC1 в одном e — исход как у R; `in_Estop_PLC` в e = u
  одновременно с первым C2 ON трассы без события — нового повышения в скане ≥ e нет (инвариант L).
- `RL.L2pending` в `current-e2b-cover-transitions.test.js` (стр. 60–61, 119–120) — заменить на L2
  с окном TD-10 для SU; источник «TEAM-DEFAULT TD-10; CRITERIA_DELTA_v4 §0.1 L2; Т1 п.2–3».

Ожидание по фактам (справка): E2b/E2d в SU дают −1 для C1 OFF, STO, C2 OFF — в окне TD-10.

---

## 3. ID

| ID | Критерии | Статус |
|---|---|---|
| STP-001 | TA-OWNER §1.1, §1.4 (STP-A от owner) | READY-D (TD-09 ждёт просмотра); RED до E3 |
| BTN-003 | TA-OWNER §1.2 | READY-D |
| EMG-002, CVR-006 | §1.3 IL-05b/IL-03 по owner; §2.2 L2-SU / L1 в SU (IL-05a) | READY-D |
| EMG-008, EMG-009, STP-007 | §1.3 STP-G против STP-D/H по owner | READY-D (нормы E3) |
| EMG-001, EMG-011 | §1.3 EMG-RD-L по owner; §2.2 L2-SU | READY-D |
| MOD-002 | §2.2 (StartingRun) | READY-D |

BLOCKED: нет. Вопросов Вадиму: нет (QUESTIONS.md).

## 4. Пределы

- t_a = owner — определение меры, а не новая реакция. Если архитектор переименует или перенесёт
  маркер, определение следует за маркером принятия спуска; тест должен падать ERROR, а не молча
  переходить на t_a(obs).
- TD-10 — ослабление oracle на 1 скан в сторону более раннего снятия энергии, только в StartingRun.
- Все числа кандидатов — модель стенда, не native/target.
