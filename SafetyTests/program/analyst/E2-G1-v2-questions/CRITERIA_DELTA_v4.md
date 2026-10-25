# CRITERIA_DELTA v4 — к REQ-CONSOLIDATION/CRITERIA v2 + E2-G1-questions/CRITERIA_DELTA

Срез / роль / дата: E2-G1-v2-questions / v2-analyst / 2026-10-21.
База (не изменялась): CRITERIA.md v2 **f2f11d77eba0d3b4441b42ff55666fbfc741bdd2867ebb763829328ad909eaa3**
(JSON 49d534c8…aeb4); E2-G1-questions/CRITERIA_DELTA.md **a017cbde326bde62c1d1bda8381e5687d98fa35eb6c95e0e26d593985e6ea15f**
(JSON 7e94b53b…5a2). Действует поверх обеих. При конфликте приоритет у v4.
Решения: SCENARIO_DECISIONS.md рабочая копия **bdf55216dab6e4aa3e3a1c01ae51f9441d2a3664c5ec8fd93955379bbbdb86fe**
(учтены Q-ARCH-04/08, Q-RC-12/13/15/16/17/18/19, Q-E2Q-01/02, Q-REL-AFTER-PERMIT «А»).
Canonical SAL 04b45456…d28a3, SGVL dc103abe…a9104, diagram de02bbff…a603; reference 4495a1f (`git show`).
SCOPE 7db88835…3a6. Обоснования и вопросы — QUESTIONS.md этой папки.
Это критерии требований. Имена сигналов, маркеров и блоков (SafetyFault, общий Fault) выбирает архитектор.
Обозначения, R0 (с дополнением in_Safety_Run TRUE), таймеры и q−1/q/q+1 — CRITERIA v2 §0 и дельта v3 §0.

## 0. Общие условия — изменения

### 0.1 Правило L — моменты аварийной реакции (заменяет абсолютные «≤ e+1»)
Введено вместо абсолютных «≤ e+1»/«≤ c+1» в EMGREF-LV(1)(2), IL-05a, EMG4-03 и «тот же скан» в EMGREF(3), IL-03, IL-05a.
Обоснование: QUESTIONS.md Т1, Т3, N2.
Обозначения: e — скан события; R — эталонная трасса с тем же исходным состоянием/фазой и `in_Estop_PLC` TRUE в e
(удерживается); τ(o) — первый скан изменения выхода o.
- Немедленные выходы (Imm): статус Emergency; C3/BMS OFF; `out_LV_Discharge_Request`; Unlock FALSE;
  отсутствие нового повышения (это инвариант каждого скана ≥ e).
- Выходы с выдержкой (Del): C1 OFF (2 с); STO, HV discharge, C2 OFF аварийной цепи.
- **L1 (межпричинно)** — причина X ≠ `in_Estop_PLC`/TRIGGER: ES_NC_1/2, Mentee, LV/HV connector, NC1/NC2, heartbeat,
  FBK-loss, WDG-05.
  - Imm: τ_X(o) ≤ τ_R(o).
  - Del: τ_R(o) − 1 ≤ τ_X(o) ≤ τ_R(o).
  - Отставание запрещено.
- **L2 (межсостояние)** — `in_Estop_PLC` в состоянии S ≠ устойчивый Run (R&D, R&D→Safe, Safe→R&D, StartingRun,
  фазы Run→R&D, откаты, Config/выход — когда в S задана общая цепь) против устойчивого Run:
  - Imm: τ_S(o) − e ≤ (τ_Run(o) − e) + 1.
  - Del: смещение от e в окне [d_Run, d_Run + 1], то есть q−1 ещё нет, q+1 есть, где q — момент в Run.
- **L3 (якорь)** — `in_Estop_PLC` в устойчивом Run на кандидате против reference 4495a1f, измеренного тем же
  helper'ом на стенде (числа с SHA reference закрепить в тесте):
  - Imm: ≤ ref + 1.
  - Del: [ref, ref + 1].
  - Справочно (canonical F1, split, не oracle): b_EStop_Ok +2, LV discharge +4, C1 OFF +2005, STO +7007,
    HV discharge +7009, C2 OFF +8010.
- **L4** — статус Emergency не позже первого Del/Imm-выхода аварийной цепи той же трассы (E2-01).
- Правило L не ослабляет конечное состояние, защёлку, EMG6-01 и инварианты (2) EMGREF.
  Статус: READY-D.

### 0.2 «Подтверждённый FBK» (для FBK-*; Q-RC-19, E6)
- t_on — скан команды ON контактора k ∈ {C1 `out_LV_C1`, C2 `out_HV_C2`}.
- t_f — первый скан ≥ t_on с `in_LV_C1_FBK`/`in_HV_C2_FBK` ON при сохраняющейся команде ON, t_f ≤ t_on+500.
- С t_f FBK считается подтверждённым до команды OFF (скан o).
- Потеря — FBK FALSE в скане l, t_f < l < o; фильтр не задан, 1 скан достаточно.
- FBK, впервые пришедший после истечения 500 мс, не подтверждён.
Статус: READY-D (буквально; подтверждение Q-V4-01 необязательно).

## A. E2

**E2-02 — изменение (READY; Q-E2Q-02 «А», Q-RC-16 «А»).** (L): после R&D цепной R&D→Safe и **SafetyFault
HealthyLost TRUE не позже прихода в Safe**, держится до квитирования E6-Q2. Момент выставления раньше — наблюдение.
Вариант (Lr): LV вернулась до C2_FBK OFF и держится — цепной R&D→Safe всё равно, SafetyFault TRUE.
Снято «BLOCKED Q-E2Q-02».

## B. E3 — STOP v2, abort, Healthy

**STP-F — изменение (READY; Q-E2Q-02 «А», Q-RC-16 «А»).**
- LV: последовательность и моменты STP-A без изменений. После R&D — цепной R&D→Safe и SafetyFault HealthyLost
  TRUE не позже прихода в Safe.
- Восстановление LV до R&D (h+100 и h+3000) не отменяет цепной спуск.
- HV: без fault/SafetyFault (без изменений).
- Запрещено: сокращение/удлинение выдержек; Emergency; R&D остаётся при LV, потерянной в спуске.

**STP-G4 — РАЗБЛОКИРОВАН (READY; Q-RC-16 «А»).**
- Исходно: устойчивый Run.
- Событие: LV Faulty TRUE в h (≥ 100 мс), FALSE в h+3000 и держится (до C2_FBK OFF).
- Ожидается: моменты G1; по приходу в R&D — цепной R&D→Safe без команды; SafetyFault TRUE (G5).
- Запрещено: остаться в R&D; Run.
- Вариант «возврат после R&D, до C1_FBK OFF» — HLT-01 (R&D не возвращается).

**STP-H — РАЗБЛОКИРОВАН (READY; Q-RC-15 «Б», Q-ARCH-05, Q-RC-16).**
- Исходно: STP-A/B, SS1 идёт (t_a < h < t_a+2000).
- Событие: `in_LV_Faulty_FBK` TRUE в h ∈ {t_a+1, t_a+1000, t_a+1999}, удерживается ≥ 100 мс.

| Момент | Ожидается | Запрещено |
|---|---|---|
| h (≤ h+1) | STO активирован (SS1 оборван) | ждать t_a+2000 |
| t_s+4999 / t_s+5000 / t_s+5001 | нет Discharge / q — наблюдение / Discharge есть | Discharge раньше |
| t_d+T_DIS−1 / +T_DIS / +1 | C2 ON / q / C2 OFF | C2 OFF раньше |
| скан после C2_FBK OFF | R&D, затем без команды R&D→Safe (C1 OFF не раньше R&D, C3/BMS OFF, C1_FBK OFF → Safe) | C1 OFF до C2_FBK OFF; Emergency |

- Весь участок: LV C1 ON до R&D; Unlock FALSE; команды игнорируются (Q-RC-08).
- SafetyFault HealthyLost TRUE не позже прихода в R&D, держится до E6-Q2.
- LV Faulty→FALSE в h+100 не возвращает SS1, не сокращает выбег и не отменяет цепной спуск (Q-RC-16).
- Флаг HealthyLostDuringSS1 для LV — наблюдение (архитектор, Q-ARCH-06).
- Границы:
  - h = t_a−1 → STP-G (тот же итог);
  - h = t_s → STP-F (STO уже по SS1);
  - h = t_a — наблюдение.
- Аварийные сочетания: NC FALSE в спуске → IL-05d(3) Emergency; HV тоже потеряна → тот же исход (LV определяет
  цепной спуск); EStop и прочие → EMGREF-RUN (правило L).

**STP-G5 / HLT-03 цепной — РАЗБЛОКИРОВАН (READY; Q-E2Q-02 «А»).**
- HLT-03 (a)–(e) применяется к Safe, достигнутому цепным спуском из STP-F, STP-G3, STP-G4, STP-H, STP-I и E2-02(L).
- Наблюдается только через символ SafetyFault (до появления — NV, не PASS).

**STP-I(4) — РАЗБЛОКИРОВАН (READY; Q-RC-16 «А»).** LV вернулась до R&D → цепной R&D→Safe и SafetyFault всё равно.

**WDG-03 — READY (было READY-D; Q-RC-12 «А», Q-RC-17(2), Q-RC-19).**
- Исходно: R&D→Run принят в u, STO снят, C2 ON в t_on.
- Событие:
  - (a) C2_FBK не ON: ON в t_on+499 → продолжение; нет ON к q=t_on+500 (наблюдение) / q+1 → откат;
  - (b) C2_FBK ON в t_f, `in_HV_Faulty_FBK` TRUE непрерывно: FALSE в t_f+29999 → продолжение (далее RUN-CONF);
    TRUE до t_f+30000 (q) / +30001 → откат;
  - (c) C2_FBK не включался вовсе = (a).
- Откат:
  - STO в момент отката (≤ +1);
  - Discharge сразу после STO (≤ +1 от STO);
  - выдержка T_DIS (q−1 C2 ON, q+1 C2 OFF);
  - C2_FBK OFF → R&D; LV C1 ON сохраняется.
- SafetyFault TRUE не позже прихода в R&D, до E6-Q2; UP до квитирования не исполняется (WDG-06).
- Запрещено: SS1, выбег 5 с, Run, Emergency, возобновление запуска.
- Сочетания: NC FALSE в откате → Emergency (IL-05d(2)); C1_FBK пропал → Emergency (FBK-05); поздний C2_FBK
  после t_on+500 → откат продолжается, его пропадание Emergency не даёт (§0.2); EStop → EMGREF-RUN.
- Наблюдение: HV Faulty мигает внутри 30 с — порядок «30 с остановлен первым FALSE» против RUN-CONF 100 мс не задан.

## C. Крышка

**IL-02 / IL-05a — граница N=u: нормативная дизъюнкция (READY-D; QUESTIONS.md Т2).**
- Одна проверка в обоих критериях.
- Исход (i): ни в одном скане ≥ u нет снятия STO и C2 ON; R&D; нет Emergency/fault.
- Исход (ii): если STO снят или C2 ON в каком-либо скане ≥ u — Emergency по правилу L (эталон: `in_Estop_PLC`
  в StartingRun в u) и полная EMGREF-RUN.
- Запрещено: Run; снятие STO/C2 ON без последующей защёлки Emergency.
- Строка IL-02 «N (отклонён)» заменена.

**IL-03, IL-05a, IL-04, IL-05c — моменты по правилу L (L1)** вместо «тот же скан» (N2 ревью).

**IL-05d — РАЗБЛОКИРОВАН (READY; Q-RC-17 «Б»).** NC1, NC2 или оба FALSE (1 скан и устойчиво; Door TRUE/FALSE)
→ EMGREF-RUN по правилу L (эталон — `in_Estop_PLC` в той же фазе) и Restart → только Safe:

| Вариант | Фаза | Граница |
|---|---|---|
| (1) | abort StartingRun после события abort (STP-E, STP-I): разряд, выдержка, ожидание C2_FBK OFF | до abort — IL-05a (тоже Emergency); NC в скане прихода в R&D (C2_FBK OFF+1) — наблюдение; +1 после R&D → IL-02 (не авария) |
| (2) | откат WDG-03 | то же |
| (3) | защитный спуск STP-G / STP-H до R&D | после R&D цепной R&D→Safe → IL-05b(3) (не авария) |
| (4) | откат CFG-08 до Safe | EMGREF; энергия — общая цепь Config (E4); после Safe — IL-01 |

- Запрещено: продолжение спуска без Emergency.
- Без изменений: нормальный Run→R&D, Safe→R&D, R&D→Safe — IL-05b.
- Этапы: (1)(3) — E3; (2) — E6; (4) — E4/E6.

## D. Config

**CFG-09 — РАЗБЛОКИРОВАН (READY; реализация E4).**
- (a) Q-ARCH-08 «Б». Исходно устойчивый Safe, NC1∧NC2. BOTH квалифицирован в b, фронт Bypass в b.
  - Ожидается: Safe→R&D (MOD1-01); Config нет; ошибки PLC нет; fault нет.
  - Bypass удерживается: в R&D игнор (CFG-02); после возврата в Safe Config нет без нового фронта (CFG-03).
  - Границы: фронт в b−1 (кнопки нажаты) → игнор по Q-RC-05(b), BOTH исполняется; в b+1 → переход, игнор
    (CFG-02). Итог одинаков.
- (b) Q-RC-18(a) «А». Bypass считается командой перехода для V14-Q8/Q-RC-04 в устойчивых Safe/R&D/Run:
  - Safe, крышка открыта, Bypass TRUE удерживается, фронт CMD_SAFE_TO_R&D → ошибка PLC-команд, Safe→R&D нет;
  - Safe, CMD_SAFE_TO_R&D TRUE удерживается, фронт Bypass → ошибка, Config нет;
  - R&D: Bypass TRUE + CMD_R&D_TO_RUN / CMD_R&D_TO_SAFE → ошибка;
  - Run: Bypass TRUE + CMD_RUN_TO_R&D → ошибка, Run→R&D по PLC не исполняется (зелёная — PLC-14);
  - снятие по V14-Q10: все команды, включая Bypass, FALSE 1 с (q−1 ошибка есть, q+1 нет);
  - в Config и в переходах ошибки нет (Q-RC-04).
  - Следствие для Вадима: PLC обязан снимать Bypass, иначе блокируются PLC-команды.

**CFG-10 — РАЗБЛОКИРОВАН (READY; Q-RC-19 «В»)** = FBK-07/FBK-08 ниже.

## E. Команды PLC

**PLC-14 — РАЗБЛОКИРОВАН (READY; Q-RC-18(b) «А»; реализация E4).**
- Исходно: устойчивый Safe или R&D, активна ошибка PLC-команд.
- Полный жест BOTH (после 2 с отпускания) → подъём исполняется при прочих разрешениях. Ошибка PLC не снимается
  (только V14-Q10).
- Зелёная 500 мс в R&D → R&D→Safe. READY-D: следствие принято ведущим, Вадим не возразил — не прямой ответ.
- Вход в Config при ошибке запрещён (CFG-03(g)).

## G. Watchdog / SafetyFault / статус

**FLT-01 (новый, READY; Q-RC-13 «Б»; этап E5, часть PLC — E4).**
- Общий бит Fault для PLC (имя — архитектор) = ошибка PLC-команд ∨ SafetyFault (откаты E6, HealthyLost).
- (a) Только SafetyFault: Fault TRUE; кнопка → SafetyFault FALSE → Fault FALSE в том же скане.
- (b) Только ошибка PLC: Fault TRUE; все CMD FALSE с f → Fault TRUE на f+999, FALSE к f+1001 (q — наблюдение).
- (c) Обе причины: снятие одной оставляет Fault TRUE; FALSE только после снятия обеих, в любом порядке.
- (d) PLC SafetyFault не снимает; кнопка ошибку PLC не снимает.
- (e) Fault не TRUE от причин вне списка: fault HealthyLostDuringSS1 сам по себе (без SafetyFault) — наблюдение;
  Emergency — не Fault (статус Emergency отдельно).

## FBK — потеря подтверждённого feedback контактора (Q-RC-19 «В»; ID MOD-008/EMG-011, CFG-10, WDG-001)

Общее: определение — §0.2. Реакция — EMGREF по правилу L: защёлка, нет нового повышения, Unlock FALSE,
Restart → только Safe (EMG6-01, после C1_FBK/C2_FBK OFF).
- Вид снятия энергии:
  - EMGREF-LV (Q-ARCH-01) — где C2 OFF и STO активен;
  - EMGREF-RUN — где C2 ON или STO снят;
  - Config — EMGREF, энергия по E4.
- Варианты потери: C1 и C2 отдельно; 1 скан и устойчиво.
- Вне FBK: до t_f — watchdog; после команды OFF — ожидаемый OFF / WDG-05.

| ID | Фаза (команда ON, FBK подтверждён) | Ожидается при потере в l | Статус |
|---|---|---|---|
| FBK-01 | Safe→R&D: C1, после t_f, ожидание LV Healthy (≤ 30 с) | EMGREF-LV (вариант (2)); R&D не подтверждается | READY-D |
| FBK-02 | устойчивый R&D: C1 | EMGREF-LV (1) | READY |
| FBK-03 | StartingRun: C1 (подтверждён до запуска); C2 после своего t_f, вкл. окно RUN-CONF 100 мс | EMGREF-RUN; Run не подтверждается | READY-D (C1), READY-D (C2) |
| FBK-04 | устойчивый Run: C1 или C2 | EMGREF-RUN | READY |
| FBK-05 | Run→R&D (SS1, выбег, выдержка разряда; C2 до команды C2 OFF; C1 весь спуск), abort StartingRun, откат WDG-03, STP-G/STP-H, STP-I | EMGREF-RUN (эталон — `in_Estop_PLC` в той же фазе) | READY-D |
| FBK-06 | R&D→Safe и цепной R&D→Safe, HLT-01, откат WDG-01/02, abort Safe→R&D — до команды C1 OFF | потеря при l ≤ a−1 (ещё устойчивое состояние) → по FBK-01/02; a ≤ l < o — наблюдение; l ≥ o — ожидаемый OFF, не Emergency | READY-D / наблюдение |
| FBK-07 | Config: C1 и/или C2 после своих t_f | EMGREF; энергия — E4 (дельта v3 §0); не откат | READY (реакция), энергия BLOCKED E4 |
| FBK-08 | выход из Config до команд OFF; откат CFG-08 — контактор, который был подтверждён | EMGREF | READY-D |
| FBK-09 | Emergency уже защёлкнут (цепь ещё держит C1 до +2 с) | остаётся Emergency, нет повышения; моменты цепи — наблюдение | READY-D |

Границы с WDG (тесты):
- (1) FBK ON в t_on+k (k = 1, 10, 499), FALSE в t_f+1 (ON 1 скан) и t_f+50 → Emergency, не откат.
- (2) FBK не ON до t_on+500 → WDG-01/03/CFG-08: откат + SafetyFault, не Emergency.
- (3) FBK впервые ON в t_on+501 или позже, затем FALSE → откат продолжается, Emergency нет.
- (4) FBK OFF в скане команды OFF o или позже → нормальное завершение; FBK OFF в o−1, если o−1 ещё в
  подтверждённой фазе → Emergency (только когда o−1 < a, иначе наблюдение).
- (5) Восстановление FBK через 1–100 мс Emergency не отменяет (EMG-005).

Аварийные сочетания:
- FBK-loss вместе с NC/EStop/connector в одном скане → Emergency (один исход).
- FBK-loss в скане истечения Healthy 30 с → Emergency приоритетнее отката (SPEC §13 п.1).
- FBK-loss при активной SafetyFault → Emergency; SafetyFault снимается или нет — наблюдение.
Этапы: FBK-02/04 — E2/E3 (EX); FBK-01/06 — E6; FBK-03/05 — E3/E6; FBK-07/08 — E4/E6.

## Unlock

**UNL-04 (новый, READY; Q-ARCH-04 «А»; CVR-001/CVR-002/CVR-003; срез Unlock/E5).**
- Исходно: устойчивый Safe, NC1, NC2 или оба FALSE; Door TRUE/FALSE; EStop OK; `in_Estop_PLC` FALSE; кнопки
  отпущены ≥ 2 с.
- Синяя удерживается с s:
  - Unlock FALSE на s+499;
  - Unlock TRUE к s+501 (s+500 — наблюдение; BTN-004);
  - TRUE, пока синяя удерживается без зелёной;
  - отпускание → FALSE (SPEC §5 п.4).
- Запрещено: отказ Unlock из-за открытой крышки; Unlock до 500 мс; Unlock при нажатой зелёной; Unlock в Emergency
  или в переходах.
- Контроль: тот же сценарий при закрытой крышке — тот же результат.
- R&D с открытой крышкой — **BLOCKED Q-V4-03** (наблюдение F1).
- Прочие условия Unlock без изменений.

## Пауза отпускания

**REL-01 (новый, READY; Q-REL-AFTER-PERMIT «А»; BTN-001/BTN-002, CVR-004).**
Пауза «обе кнопки отпущены 2000 мс» считается только по кнопкам.
- (a) Safe:
  - кнопки отпущены > 2 с, крышка NC1, NC2 или обе FALSE 300 мс → TRUE;
  - через 1700 мс BOTH 1100 мс → Safe→R&D принят;
  - контроль IL-01: крышка в Safe — не разрешение.
- (b) **Основной вариант с разрешением, сохраняющимся после E2 (ответ N1):** Safe, LV или HV connector или оба FALSE
  300 мс при отпущенных кнопках (EMG-003: без fault) → BOTH через 1700 мс → принят. READY-D: обобщение «например».
- (c) R&D: NC1, NC2 или оба FALSE 300 мс → BOTH через 1700 мс → R&D→Run принят. READY-D.
- (d) Граница по кнопкам — с эпизодом и без:
  - отпускание 1999 мс → отклонено без fault;
  - 2000 мс — наблюдение;
  - 2001 мс → принято.
- (e) Разрешение должно присутствовать в момент принятия: эпизод, перекрывающий квалификацию BOTH → отклонено
  (EMG-003, IL-02). Удерживаемый жест после восстановления не исполняется; нужна новая попытка после 2 с
  отпускания (BTN-001/002).
- Запрещено: перезапуск отсчёта 2 с от возврата разрешения.
- Непригодные для эпизода разрешения — QUESTIONS.md N1 (EStop/PLC/Mentee/heartbeat → Emergency;
  SafetyFault/ошибка PLC — не эпизоды разрешения кнопок).
- MU24 совместим (HANDOFF_v2 тестировщика §Q-REL): убивается границей (d) при эпизоде во время удержания кнопки.

## I. Emergency

**EMGREF-LV — изменение (READY; Q-E2Q-01 «А»).**
- Вариант (2) Safe→R&D: C1 OFF через 2 с по общей цепи — правило L2 (q−1 ON, q+1 OFF относительно Run).
- C3/BMS OFF и LV discharge — L2 Imm. Абсолютное «≤ e+1» снято (Т3).
- BLOCKED Q-E2Q-01 снят.

**EMG4-03 — моменты по правилу L1** (connector против `in_Estop_PLC`); прочее без изменений.

## K. ID → критерии (изменённые строки к §K v2 и дельте v3)

| ID | READY / READY-D | BLOCKED / NV |
|---|---|---|
| EMG-001 | + правило L | — |
| EMG-002 / CVR-006 | IL-01…IL-05c, **IL-05d (1)–(4)**, граница IL-02/IL-05a N=u (дизъюнкция) | — (было Q-RC-17) |
| EMG-004 | EMG4-01…03 + правило L | — |
| EMG-006 | + Restart после FBK-*, IL-05d | Config — энергия E4 |
| EMG-008 / EMG-009 | STP-D, STP-F (+SafetyFault LV), STP-G, **STP-G4**, STP-G5, **STP-H** | SafetyFault — NV до символа |
| EMG-011 / MOD-008 | **FBK-01…09**, HLT-02, POL-01 | FBK-07 энергия (E4); FBK ON без команды (Q-V4-02) |
| CFG-005 / CFG-006 (Config-ID) | **CFG-10 = FBK-07/08**, IL-05d(4) | энергия E4 |
| MOD-007 / PLC-002 | **CFG-09 (a)(b)**, **PLC-14** | реализация E4 |
| MOD-002 / WDG-002/003 | **WDG-03 (READY)**, STP-I(4), FBK-03 | — |
| MOD-005 / HLT-001 | HLT-01, **HLT-03 цепной** | SafetyFault NV |
| STP-004 | E2-02 (+L, Lr, SafetyFault) | SafetyFault NV |
| STP-007 (защитный спуск) | STP-G1–G5, STP-H | — |
| WDG-004 | **FLT-01** | часть PLC — E4 |
| CVR-001/002/003 | **UNL-04** (Safe) | UNL-04 R&D (Q-V4-03) |
| BTN-001/002, CVR-004 | **REL-01** | — |

## Дельта для SOFTWARE_ACCEPTANCE_SCOPE (ведущему; v4 поверх «Дельты v3»)

| ID | Сейчас | Предлагается | Основание |
|---|---|---|---|
| EMG-002 | «…Прочие спуски — после Q-RC-17» (стр. 312) | «…Потеря NC в abort StartingRun, откате WDG-003, защитном спуске (STP-007) и откате входа в Config — Emergency. Нормальный Run→R&D, Safe→R&D, R&D→Safe — продолжаются» | Q-RC-17 |
| EMG-011 / MOD-008 | «каждый противоречивый/неподтверждённый feedback запрещает up» | + «Потеря подтверждённого C1_FBK/C2_FBK при сохраняющейся команде ON (R&D, Run, Config, фазы переходов после подтверждения) → Emergency; до подтверждения — watchdog (WDG-001), после команды OFF — WDG-003» | Q-RC-19, E6 |
| WDG-003 → MOD-002 | «отказ C2_FBK 500 мс / HV Healthy 30 с → откат в R&D + SafetyFault» (READY-D) | подтверждено: «…последовательностью abort StartingRun (STO → сразу Discharge → выдержка → C2 OFF → C2_FBK OFF → R&D), без SS1/выбега; также если C2_FBK не включался» | Q-RC-12 |
| STP-007 / EMG-008 | — | + «потеря LV Healthy в SS1 — как HV: немедленный STO, выбег, R&D, цепной R&D→Safe, SafetyFault; потеря LV в любом спуске запоминается до Safe (возврат не отменяет цепной спуск)» | Q-RC-15, Q-RC-16 |
| STP-002 / HLT-001 | «после STO — остановка без изменений» | + «потеря LV после STO: в конце цепной R&D→Safe и SafetyFault HealthyLost» | Q-E2Q-02 |
| EMG-006 | Restart → Safe | без изменения смысла; моменты аварийной реакции — правило L (CRITERIA_DELTA_v4 §0.1) | Q-ARCH-01, Q-E2Q-01 |
| WDG-004 | SafetyFault, квитирование | + «Один общий бит Fault для PLC = ошибка PLC-команд ∨ SafetyFault; причины снимаются по своим правилам; бит гаснет, когда сняты обе» | Q-RC-13 |
| CFG-001 / PLC-002 | вход по фронту; одновременные → ошибка | + «BOTH и фронт Bypass в одном скане → Safe→R&D, Bypass игнорируется; Bypass — команда перехода для правила одновременности; ошибка PLC не блокирует кнопки (вход в Config — блокирует)» | Q-ARCH-08, Q-RC-18 |
| CVR-001 | «Power-to-unlock только при удержании квалифицированной синей без зелёной» | + «в Safe — независимо от того, открыта ли уже крышка (как reference)» | Q-ARCH-04 |
| BTN-001 | «обе непрерывно отпущены полный release filter» | + «отсчёт только по кнопкам; временная потеря разрешения (крышка, connector в Safe) его не перезапускает» | Q-REL-AFTER-PERMIT |

Строка «Открытые вопросы…» (стр. 232): Q-RC-12…19, Q-ARCH-04/08, Q-REL-AFTER-PERMIT — отвечены.
Открыты: Q-V4-01…03 (низкий, не блокируют E2), E4-документация, E6-Q1 (политика выходов при истечении сверх
заданного откатами).

## Влияние на тесты G1 v2 (тестировщику через ведущего)

- A10 → правило L1 для всех причин, включая NC (IL-03, IL-05a, IL-05d): перевести с «тот же скан».
  Для Del-выходов опережение ≥ 2 сканов — FAIL.
- IL-02/IL-05a N=u: из наблюдения в нормативную дизъюнкцию (один тест).
- EMGREF-LV(2): «≤ Run+1» сохранить (L2). Добавить якорь L3 после измерения reference 4495a1f на стенде.
  Абсолютных «≤ e+1» не проверять.
- Новые нормативные: FBK-01…09 и границы (1)–(5); STP-H (E3); STP-G4; WDG-03 (E6); IL-05d(2)(4) (E6/E4);
  CFG-09, PLC-14 (E4); FLT-01 (E5, NV до имени); UNL-04 Safe (Unlock/E5); REL-01(b)(c)(e).
- SafetyFault везде — NV до символа архитектора. NV не считать PASS.
