# REQ-CONSOLIDATION — критерии по ID, v2 (ответы Вадима 2026-10-21)

Срез / роль / дата: REQ-CONSOLIDATION v2 / v2-analyst / 2026-10-21.
Источник: canonical F1 SAL 04b45456…d28a3, SGVL dc103abe…a9104, diagram de02bbff…a603
(пересчитаны, не менялись); HEAD 7d7aecd; SCENARIO_DECISIONS.md рабочая копия
**c1e7fe6cf7aa1adbf7fcc33452c393bddd6f2cc4dfc02140ab55e621c0fd7bdf** (не закоммичена,
раздел «Прямые ответы Вадима после снятия приостановки»). Прежняя версия —
CRITERIA.v1.md (SCENARIO_DECISIONS 42aaf5db…). Трассировка — TRACE.md; дельта
перечня ID — SCOPE_PROPOSAL.md; вопросы — QUESTIONS.md.

Это критерии требований, не план реализации: имена маркеров, блоков и новых
сигналов PLC↔TwinSAFE выбирает архитектор.

## Что изменилось против v1

- Разблокированы: E2-04 (Q-RC-10), STP-F (Q-RC-09), STP-G (Q-RC-02), IL-03
  (Q-RC-01, заменяет IL-03a/IL-03b), IL-05a/b/c (Q-RC-03), CFG-03 (Q-RC-05),
  CFG-08 (Q-RC-06), PLC-05 (Q-RC-04), PLC-10 (Q-RC-08), WDG-07 (Q-RC-07),
  EMG6-01 (Bypass через Restart — Q-RC-05), BOOT-C (Q-RC-05, Q-RC-10).
- **Заменено:** v1 IL-03a («в Run без защёлки Emergency, SS1 до STO») — неверно
  после Q-RC-01; v1 WDG-06(a) для **зелёной в R&D** — теперь Q-RC-07 (квитирует
  и спускает); v1 E2-02 «обязан убить MU11» — снято с поведенческого критерия.
- Полярность Healthy по D-ARCH-POL во всех критериях (§0, POL-01); имена после
  D-ARCH-POL-RENAME.
- Добавлены: IL-02b, HLT-01b (R&D при открытой крышке — замечание ревью E2),
  EMG4-01…03 (EMG-004), STP-H (BLOCKED), R1-01 (Q-ARCH-06), POL-01, BOOT-C,
  CFG-09/CFG-10 (BLOCKED), PLC-14 (BLOCKED).
- Новые вопросы: Q-RC-14…19 (QUESTIONS.md). Открытые у Вадима Q-ARCH-01/03/04/05/08,
  Q-RC-11/12/13, Q-REL-AFTER-PERMIT не дублируются; где критерий от них зависит —
  BLOCKED(<ID>).

## 0. Общие условия и обозначения

**Статусы:** READY — oracle однозначен из решений/требований; READY-D — выведен
из утверждённого требования (указано какого) без нового поведения; BLOCKED(Q) —
ждёт ответа; BLOCKED(ARCH) — Вадим делегировал выбор архитектору.

**Полярность Healthy (D-ARCH-POL, решение Вадима):** сырое **FALSE = Power Supply
исправен**, сырое **TRUE = потеря**. Имена после D-ARCH-POL-RENAME:
`in_LV_Faulty_FBK` (было `in_LV_Healthy_FBK`), `in_HV_Faulty_FBK` (было
`in_HV_Healthy_FBK`). Далее «LV/HV Healthy есть» = сырое FALSE, «потеря» =
сырое TRUE; тесты задают сырые значения явно и не выводят полярность из кода.

**R0 (исходные входы):** все входы заданы явно: in_ES_NC_1/2 TRUE,
in_InterLock_NC_1/2 TRUE, LV/HV connector TRUE, Mentee FALSE, in_Estop_PLC /
CMD_TRIGGER_EMERGENCY FALSE, in_False_SI2_CH8 FALSE (Q-MU06-01: константа),
кнопки FALSE, in_Door_Monitor TRUE, все CMD_* и Bypass FALSE, heartbeat
переключается каждые 500 мс, **in_LV_Faulty_FBK FALSE, in_HV_Faulty_FBK FALSE**,
feedback контакторов/STO следуют командам по модели стенда, если не сказано
иное. Скан 1 мс.

**Устойчивые состояния** достигаются реальными producers (жест или фронт команды
PLC от Safe), затем кнопки отпущены ≥ 2000 мс; не инъекцией Set. Группа
стартует в Emergency (Q-RC-10), Safe — через EMG6-01.

**Таймеры:** T_SINGLE 500, T_BOTH 1000 (от второй), T_WINDOW 250 включ.,
T_RELEASE 2000, T_SS1 2000, T_COAST 5000, T_DIS — существующая выдержка разряда
(Network8; число не менять), T_CMDERR 1000 (V14-Q10), T_HB 3000 / период 500
(V14-Q20), T_FBK 500, T_HEALTHY 30000 (E6).

**Границы q−1/q/q+1:** q — первый скан, на котором порог истёк. q−1 и q+1
нормативны; q нормативно только при «включительно» (окно 250 мс), иначе —
наблюдение по документированной семантике TON.

**EMGREF (→ Emergency):** (1) статус Emergency и защёлка, выход только EMG6-01;
(2) ни одного нового повышения энергии, снятия STO, Unlock FALSE; (3)
дифференциально — последовательность выходов совпадает с реакцией на
`in_Estop_PLC`/`CMD_TRIGGER_EMERGENCY` TRUE в том же состоянии и скане.
**EMGREF-RUN** (для причин, которым Вадим задал «как в устойчивом Run» —
Q-RC-01, Q-RC-03(a)): (1)+(2) и «снятие всей энергии» — конечное состояние
STO активен, C2 OFF, C1 OFF, C3/BMS OFF, Discharge выполнен; порядок и моменты —
как у `in_Estop_PLC` в устойчивом Run (дифференциально). Абсолютная аварийная
последовательность (SPEC §16 п9) этим не задаётся. Снятие энергии при Emergency
в R&D, Safe→R&D и Config — **Q-ARCH-01 (открыт у Вадима)**: для этих состояний
нормативны только (1)(2)(3).

## A. E2 — однозначный статус

**E2-01 (READY) — один основной статус всегда.** В каждом скане всех трасс
активно ровно одно из {Emergency, Safe, R&D, Run, Config}; переходные фазы
(StartingRun, StoppingSS1, STOCoastWait, HVDischarging, HVDisconnecting,
StoppingToSafe, откаты E6, выход/откат Config) принадлежат ровно одному переходу.
Запрещено: два основных хотя бы 1 скан (вкл. Step3∧Step4, Step4∧Step12).
Источник: E2; V14-Q16; SPEC §14; MOD-006.

**E2-02 (READY) — гонка E1 даёт единственный исход R&D.** Исходно Run; принят
down (зелёная удерживается / отпущена после принятия на 550 и 800 мс / фронт
CMD_RUN_TO_R&D); последовательность в ожидании C2_FBK OFF после команды C2 OFF.
Событие: in_LV_Faulty_FBK→TRUE (L) или in_HV_Faulty_FBK→TRUE (H) в скане h;
C2_FBK OFF впервые в h+d, d ∈ {1..5}. Ожидается: E2-01 каждый скан; итог R&D;
затем (L) R&D→Safe по HLT-01, (H) устойчивый R&D. Запрещено: Step4∧Step12,
LV-запрос в защитной фазе, возврат в Run, Emergency. Источник: E2-Q1, E2-Q2,
Q-RC-09. **Изменение против v1:** «тест обязан убить MU11» снято с критерия —
это условие мутационного покрытия (C3 ревью E1), а не поведение. Ревью плана E2
показало вероятную эквивалентность MU11 в конфигурации E2a–E2d; решение по C3 —
ведущему, переоценка MU11 в E3/EX. Oracle гонки от этого не меняется.

**E2-03 (READY, условно на архитектуру) — обнаруженный конфликт → EMGREF.**
При раздельных памятях — инъекция двух основных → EMGREF; при однозначности по
построению — структурное доказательство недостижимости (ревьюер). Источник: E2.

**E2-04 (READY) — ни одного основного вне перехода → Emergency.** Старт группы:
первый скан и далее до EMG6-01 — Emergency (не Safe/R&D/Run/Config). Во время
работы: при архитектуре с раздельными памятями — инъекция «ни одного» вне
переходной фазы → EMGREF; при кодировании по построению — структурное
доказательство недостижимости. Источник: Q-RC-10.

## B. E3 — STOP v2, abort, Healthy в Run

Общее для B: исходно устойчивый Run (StartingRun → Run подтверждён), C2_FBK ON,
LV ON, оба Faulty FALSE, кнопки отпущены ≥ 2000 мс. t_a — скан принятия down.

**STP-A (READY) — нормальная остановка зелёной.** (без изменений против v1)
| Момент | Ожидается | Запрещено |
|---|---|---|
| t_a (+≤1 скан) | SS1 запрошен обоим приводам; C2/LV ON; Unlock FALSE | STO, Discharge, C2 OFF |
| t_a+1999 | STO ещё не активирован | Discharge, C2 OFF |
| t_a+2000 (q) / +2001 | STO активирован (обязателен к q+1) | Discharge |
| t_s+4999 (t_s — скан STO) | нет команды Discharge | C2 OFF |
| t_s+5000 / +5001 | команда Discharge (обязательна к q+1) | C2 OFF в том же скане |
| t_d+T_DIS−1 | C2 ещё ON | C2 OFF |
| t_d+T_DIS / +1 | команда C2 OFF | — |
| C2_FBK OFF в t_c+k (k=1,50,400) | R&D со скана после C2_FBK OFF; LV ON | R&D раньше C2_FBK OFF |
Всю последовательность: Unlock FALSE; LV C1 не снимается; BOTH, CMD-UP, зелёная
и CMD_R&D_TO_SAFE не принимаются и не исполняются позже (MOD-004, Q-RC-08);
E2-01. Источник: E2-Q1 «Уточнение Вадима», D-RUN-STOP-WAITS, D-HV-TIMED-COMPLETE,
V14-Q3, SPEC §8/§10. На canonical F1 ожидается RED (Network6 RUN_DOWN_OWNER).

**STP-B (READY)** — тот же oracle для фронта CMD_RUN_TO_R&D (единственная TRUE
команда перехода; см. PLC-05 о второй удерживаемой). Источник: V14-Q3, V14-Q11.

**STP-C (READY) — отказ C2 OFF.** C2_FBK ON после C2 OFF (t_c): t_c+499 — без
Emergency, R&D не объявлен; t_c+501 — EMGREF. Источник: E6-Q1.

**STP-D (READY) — потеря HV Healthy во время SS1.** in_HV_Faulty_FBK→TRUE в
h ∈ {t_a+1, t_a+1000, t_a+1999}. Ожидается: STO в h (≤ h+1), не ждать t_a+2000;
Discharge не раньше h+5000; возврат Faulty→FALSE в h+100 не возвращает SS1 и не
сокращает выбег; fault HealthyLostDuringSS1 зафиксирован (отдельный от
SafetyFault — Q-ARCH-06 слияние не разрешил); далее Discharge → T_DIS → C2 OFF →
C2_FBK OFF → R&D; fault сбрасывается изменением уровня любой кнопки после
завершения. Источник: SPEC §9, EMG-008/009, D-HEALTHY-FAULT-RESET-EDGE.
LV во время SS1 — STP-H.

**STP-E (READY) — abort StartingRun.** (без изменений против v1) Исходно R&D,
принят R&D→Run, STO снят, Run не подтверждён. Событие в a: (1) новая зелёная
500 мс после полной очистки; (2) фронт CMD_RUN_TO_R&D. Ожидается: STO в a
(≤ a+1); Discharge сразу после STO (не позже a+2; на a+1999 Discharge уже есть);
без SS1; C2 OFF не раньше t_d+T_DIS; R&D после C2_FBK OFF. Запрещено: SS1,
Run, возобновление, повтор UP без нового события. Граница с подтверждением Run
(r): событие в r−1 → STP-E; r+1 → STP-A/B; r — наблюдение. Фронт CMD_RUN_TO_R&D
при удерживаемой CMD_R&D_TO_RUN исполняется (в переходе правило Q-RC-04 не
действует). Источник: D-STARTINGRUN-GREEN-DOWN, D-STARTINGRUN-NO-COAST, V14-Q12,
Q-RC-04.

**STP-F (READY) — Healthy после STO при нормальной остановке.** Исходно STP-A/B
после t_s (идёт выбег 5 с или выдержка разряда). Событие: LV или HV Faulty→TRUE
в h ∈ {t_s+1, t_s+2500, t_s+4999, t_d+1, t_d+T_DIS−1}. Ожидается: моменты
Discharge, C2 OFF и R&D те же, что в STP-A без события (выдержки не сокращаются
и не удлиняются); нет fault, нет Emergency, нет SafetyFault; LV C1 ON до R&D.
После R&D: LV потеряна → HLT-01 (цепной R&D→Safe без команды); HV → устойчивый
R&D (HLT-02). Восстановление до R&D — STP-G4 (BLOCKED). Источник: Q-RC-09,
E2-Q1, E2-Q2.

**STP-G (READY) — потеря Healthy в устойчивом Run, down не запрошен.**
Событие: Faulty→TRUE в h, удерживается ≥ 100 мс (1-скан провал — наблюдение:
фильтр не задан, reference реагирует на уровень).
- **G1 (общее):** STO в h (≤ h+1), без SS1-фазы 2 с (STO на h+1 обязателен);
  Discharge на t_s+5000 (t_s+4999 нет, t_s+5001 есть); C2 OFF на t_d+T_DIS (q−1
  нет, q+1 есть); R&D со скана после C2_FBK OFF. Не Emergency, не Step4: LV C1
  не снимается и C3/BMS не сбрасываются до R&D; Unlock FALSE весь спуск;
  возврат Faulty→FALSE не отменяет и не сокращает спуск, Run не возвращается.
  BOTH/зелёная/все CMD_* (кроме TRIGGER) в спуске игнорируются (Q-RC-08 п.1).
- **G2 HV:** после R&D — устойчивый R&D (HV игнорируется в R&D).
- **G3 LV (Faulty TRUE на момент R&D):** без новой команды R&D→Safe: C1 OFF не
  раньше скана R&D, C3/BMS OFF, C1_FBK OFF → Safe (MOD5-01). Запрещено: C1 OFF
  до C2_FBK OFF.
- **G4 (BLOCKED Q-RC-16):** LV потеряна в Run, восстановлена до прихода в R&D.
- **G5 (BLOCKED Q-ARCH-05):** выставляется ли fault/статус при G1.
- Граница с принятием down (t_a): событие в t_a−1 → STP-G; в t_a+1 → STP-D
  (HV в SS1) / STP-H (LV в SS1); в t_a — наблюдение.
Источник: Q-RC-02, E2-Q2, SPEC §9 (немедленный STO).

**STP-H (BLOCKED Q-RC-15)** — потеря LV Healthy во время SS1 нормальной
остановки (между t_a и t_s). SPEC §9 задаёт только HV.

## C. Потеря InterLock NC1/NC2 по состояниям

Варианты нарушения во всех C: NC1 FALSE; NC2 FALSE; оба; при Door TRUE и FALSE.
EStop-каналы in_ES_NC_1/2 не затрагиваются (EMGREF везде).

**IL-01 (READY) — Safe.** NC FALSE → нет Emergency/fault; Safe→R&D по BOTH и по
фронту CMD_SAFE_TO_R&D принимается (MOD1-01); вход в Config запрещён (CFG-02).
Источник: V14-Q21(a), V14-Q7.

**IL-02 (READY) — R&D, запрет подъёма.** NC FALSE → нет Emergency/fault, R&D и
LV сохраняются; BOTH и фронт CMD_R&D_TO_RUN отклоняются без fault; после
восстановления NC удерживаемый CMD/продолжающееся удержание не исполняется.
Границы: NC FALSE в N, UP в N−1 (→ StartingRun → IL-05a), N, N+1 (отклонён).
Источник: V14-Q21(a), V14-Q5, V14-Q11, CVR-004.

**IL-02b (READY) — R&D, открытая крышка не мешает спуску.** Устойчивый R&D,
NC1/NC2/оба FALSE, Door TRUE/FALSE. (a) зелёная 500 мс → R&D→Safe (MOD5-01);
(b) фронт CMD_R&D_TO_SAFE → то же; (c) крышка открылась в R&D→Safe (после
принятия, до C1_FBK OFF) → переход продолжается до Safe, C1 не возвращается;
(d) потеря LV Healthy при открытой крышке → HLT-01. Запрещено: отказ спуска,
обрыв начатого спуска с возвратом в R&D. Источник: V14-Q21(a) «только запрещает
R&D→Run», Q-RC-03(b1). На canonical ожидается RED (крышка в GATE_001 —
находка ревью плана E2, repro/rnd_cover).

**IL-03 (READY) — Run → Emergency.** Устойчивый Run, кнопки отпущены; NC FALSE в
t (1 скан достаточно) → EMGREF-RUN; восстановление NC в t+100 не снимает
Emergency; выход только EMG6-01. Запрещено: защитный спуск в R&D вместо
Emergency, ожидание SS1 2 с как условие защёлки, Unlock. Источник: Q-RC-01
(заменяет V14-Q21(b) и v1 IL-03a/b). Граница с принятием down t_a — IL-05b.

**IL-04 (READY) — Config.** NC FALSE (1 скан) → EMGREF. Источник: V14-Q16,
V14-Q21(c).

**IL-05a (READY) — StartingRun → Emergency.** Принят R&D→Run, STO снят, Run не
подтверждён; NC FALSE в c → EMGREF-RUN: статус Emergency с c (≤ c+1),
STO восстанавливается и C2/C1/C3/BMS снимаются в тех же моментах относительно
события, что при in_Estop_PLC в устойчивом Run (дифференциально; абсолютный
момент STO не задаётся — в Run он определяется существующей аварийной цепью);
Run не подтверждается даже при C2_FBK/HV Healthy после c. Запрещено: STO снятым
и C2 ON бессрочно (находка ревью repro/su_cover), «R&D» при энергии уровня Run
после Restart, Restart при незавершённом снятии энергии. Границы: c = u−1 (u — принятие UP) → IL-02 (UP отклонён, R&D);
c = u+1 → IL-05a; c = r−1 (r — подтверждение Run) → IL-05a; c = r+1 → IL-03;
u и r — наблюдение. Источник: Q-RC-03(a).

**IL-05b (READY) — прочие переходы продолжаются.** NC FALSE (каждый вариант) во
время: (1) нормального Run→R&D (SS1, выбег, выдержка разряда, ожидание C2_FBK
OFF) — моменты STP-A без изменений, итог R&D, затем R&D с открытой крышкой
(IL-02/IL-02b); (2) Safe→R&D (до R&D) — переход продолжается (MOD1-01); (3)
R&D→Safe — IL-02b(c); (4) abort Safe→R&D (PLC-09b) и откат WDG-01/02 в Safe —
продолжаются (READY-D: крышка не условие в Safe, R&D и Safe→R&D). Нет Emergency,
нет fault. Граница с Run: NC FALSE в t_a−1 → IL-03 (Emergency); t_a+1 → (1);
t_a — наблюдение. Источник: Q-RC-03(b1), V14-Q7, V14-Q21(a).

**IL-05c (READY) — выход из Config → Emergency.** Bypass снят, идёт
Discharge/выдержка/размыкание C1/C2; NC FALSE → EMGREF. Источник: Q-RC-03(b2).

**IL-05d (BLOCKED Q-RC-17)** — крышка в прочих спусках: после события abort
StartingRun (STO уже восстановлен), откат WDG-03 из StartingRun, защитный спуск
STP-G, откат входа в Config (CFG-08).

## D. Config (V14-Q16…Q19, Q-RC-05/06)

**CFG-01 (READY) — вход, позитив.** Устойчивый Safe, NC1∧NC2, R0, нет
SafetyFault, нет ошибки PLC-команд, кнопки отпущены. Bypass FALSE→TRUE в b и
удерживается. Ожидается: Config (≤ b+2, скан фиксирует архитектор); C1 и C2 ON;
STO активен; Unlock FALSE; E2-01. Источник: V14-Q16, Q-RC-05.

**CFG-02 (READY) — вход, игнор.** Фронт Bypass в R&D, Run, StartingRun,
Safe→R&D, R&D→Safe, Run→R&D, Emergency, Safe с NC FALSE: ни C1/C2 ON сверх
текущих, нет смены состояния, нет fault. Источник: V14-Q16.

**CFG-03 (READY) — только фронт и прочие разрешения.** Нет входа в Config (нет
команд C1/C2 ON, нет fault) и после устранения препятствия без нового фронта:
(a) Bypass TRUE поднят в R&D, держится через R&D→Safe и 3000 мс устойчивого
Safe; (b) Bypass TRUE поднят в Safe при NC FALSE, затем NC→TRUE; (c) Bypass TRUE
держится через Emergency→Safe (EMG6-01); (d) Bypass TRUE с момента старта
группы, после EMG6-01; (e) фронт при LV или HV connector FALSE; (f) фронт при
активной SafetyFault (и после квитирования без нового фронта); (g) фронт при
активной ошибке PLC-команд (и после её снятия без нового фронта); (h) фронт при
нажатой зелёной/синей (< и ≥ 500 мс, вкл. Unlock TRUE) и после отпускания.
Позитив для каждого (a)–(h): Bypass FALSE ≥ 1 скан, затем новый фронт при
выполненных условиях → CFG-01. Граница (h): кнопка FALSE в r — фронт в r−1
игнор, в r → вход. Источник: Q-RC-05(a)(b), V14-Q14, Q-RC-07(b).

**CFG-04 (READY) — в Config всё прочее игнорируется.** Зелёная 500/2000 мс, синяя
500/2000 мс, BOTH 1000 мс, фронты всех CMD_* перехода, in_C3_Manual_Set,
in_RBM_Manual_Set; две и более CMD_* TRUE одновременно. Ожидается: Config, C1/C2
ON, STO активен, Unlock FALSE, нет SafetyFault, **нет статуса ошибки PLC**
(Q-RC-04); после отпускания/сброса — нет отложенного исполнения. Источник:
V14-Q16, V14-Q15, Q-RC-04.

**CFG-05 (READY) — без автоотключения.** Bypass TRUE 9999/10000/10001/60000 мс:
Config, C1/C2 ON. Источник: V14-Q17.

**CFG-06 (READY) — выход.** Bypass TRUE→FALSE в x (и импульс FALSE 1 скан).
Discharge (≤ x+1) раньше любой команды OFF контактора; нет OFF до t_d+T_DIS
(q−1 запрещено, q+1 обязательно); вариант A: C2 OFF, C1 OFF после C2_FBK OFF;
вариант B: C1 и C2 OFF в одном скане ≥ t_d+T_DIS; Safe только при C1_FBK OFF ∧
C2_FBK OFF; без SS1; STO активен; Unlock FALSE до Safe. Bypass снова TRUE во
время выхода — игнор, выход продолжается; после Safe он не даёт Config без
нового фронта (CFG-03). Любые команды перехода во время выхода — игнор (Q-RC-08
п.3). FBK ON > 500 мс после OFF → EMGREF. Крышка — IL-05c. Источник: V14-Q18,
E6-Q1, Q-RC-05, Q-RC-08. Архитектор выбрал вариант B (эскиз E4); тест проверяет
выбранный и инварианты обоих.

**CFG-07 (READY) — аварии в Config.** ES_NC_1/2 FALSE; in_Estop_PLC/TRIGGER;
Mentee; LV connector FALSE; HV connector FALSE (EMG4-01); NC (IL-04); heartbeat
3 с (HB-02) → EMGREF. LV и HV Faulty TRUE на 1 скан, 5 с, переключение 100 мс
10 с → игнор: Config, C1/C2 ON, нет fault/Emergency/SafetyFault. Источник: V14-Q19.

**CFG-08 (READY) — отказ T_FBK при входе в Config.** C1_FBK (вариант 1), C2_FBK
(2) или оба (3) не ON за 500 мс от своей команды ON (t_on). FBK ON в t_on+499 →
Config сохраняется. Нет FBK к t_on+500 (q) / t_on+501 → откат: Discharge →
T_DIS → C1/C2 OFF (порядок как выбранный вариант CFG-06) → оба FBK OFF → Safe;
SafetyFault TRUE; не Emergency. FBK, пришедший после начала отката, Config не
возвращает. Bypass удерживается — после Safe Config не входит (CFG-03).
Квитирование — WDG-06. Healthy в Config не проверяется (30 с не применяется).
FBK OFF > 500 мс после OFF в откате → EMGREF. Источник: Q-RC-06, E6-Q1/Q2.

**CFG-09 (BLOCKED Q-RC-18(a), Q-ARCH-08)** — Bypass одновременно с другой
командой: фронт Bypass и фронт CMD_SAFE_TO_R&D/BOTH в одном скане (Q-ARCH-08);
Bypass, удерживаемый TRUE в Safe (крышка открыта), и фронт CMD_SAFE_TO_R&D —
ошибка по Q-RC-04 или нет (Q-RC-18(a)).

**CFG-10 (BLOCKED Q-RC-19)** — C1_FBK или C2_FBK пропал в Config без команды OFF.

## E. Команды PLC (V14-Q8…Q14, Q-RC-04, Q-RC-08)

Команды перехода по v1.4 §8: CMD_SAFE_TO_R&D, CMD_R&D_TO_RUN, CMD_R&D_TO_SAFE,
CMD_RUN_TO_R&D; CMD_TRIGGER_EMERGENCY; STS_COVER_LOCKED; статус ошибки PLC
(имя/агрегация — Q-RC-13).

**PLC-01 (READY) — позитив по фронту в исходном устойчивом состоянии.** Для
каждой команды: исходное состояние, кнопки не нажаты, нет ошибки PLC, **все
прочие команды перехода FALSE**, нет SafetyFault (для UP), прочие разрешения.
Фронт в e → переход принят (≤ e+2). Safe→R&D — и при NC FALSE (V14-Q7);
R&D→Run — только NC1∧NC2; R&D→Safe — MOD5-01, также при открытой крышке
(IL-02b) и при SafetyFault (WDG-07); Run→R&D — STP-B. Также сразу после
Emergency→Safe (V14-Q4). Источник: V14-Q11, V14-Q4, V14-Q7, Q-RC-04.

**PLC-02 (READY) — удерживаемая команда не повторяется.** (a) CMD_SAFE_TO_R&D →
R&D, удерживается (единственная TRUE); зелёная → Safe; 2500 мс после Safe: нет
Safe→R&D, нет ошибки. (b) CMD_R&D_TO_RUN удерживается через зелёный Run→R&D:
после R&D 2500 мс нет StartingRun. (c) CMD_R&D_TO_SAFE удерживается через BOTH
Safe→R&D: R&D 2500 мс. (d) CMD_RUN_TO_R&D удерживается через BOTH R&D→Run:
StartingRun не прерывается, Run сохраняется. Источник: V14-Q11, MOD-003.

**PLC-03 (READY) — фронт вне исходного состояния игнорируется без ошибки.** Как
v1 (единственная TRUE команда); переходные фазы — PLC-10. Источник: V14-Q11.

**PLC-04 (READY) — одновременные фронты → ошибка.** В Safe, R&D, Run: 6 пар,
4 тройки, четвёрка фронтов в одном скане e (включая пару, где одна валидна) → ни
одна не исполнена, ошибка TRUE не позже e+1, состояние неизменно. Источник: V14-Q8.

**PLC-05 (READY) — ошибка по уровням в устойчивых состояниях.** (a) Пример
Вадима: CMD_SAFE_TO_R&D → R&D, удерживается; фронт CMD_R&D_TO_RUN в g → R&D→Run
не исполнен, ошибка ≤ g+1; снятие по PLC-06. (b) То же для каждой пары, где
удерживаемая поднята в любом раньшем скане, в Safe, R&D, Run. (c) **Следствие
(READY-D):** Run при удерживаемой CMD_R&D_TO_RUN + фронт CMD_RUN_TO_R&D → ошибка,
Run→R&D по PLC не исполняется (зелёная/EStop/TRIGGER работают). (d) Две TRUE
во время перехода (StartingRun, Run→R&D, Safe→R&D, R&D→Safe, выход/откат Config)
и в Config/Emergency — ошибки нет (Q-RC-04 «нет»); исключения abort (STP-E,
PLC-09b) исполняются. (e) **Следствие (READY-D):** если по приходу в устойчивое
Safe/R&D/Run две команды всё ещё TRUE — ошибка ставится с первого устойчивого
скана (скан прихода — наблюдение, +1 нормативно). (f) TRIGGER + одна команда —
ошибки нет. Источник: Q-RC-04, V14-Q8, V14-Q9.

**PLC-06 (READY) — снятие ошибки.** Как v1: все команды FALSE с f → ошибка на
f+999, снята на f+1000 (q)/обязательно f+1001; импульс в f+500 перезапускает
отсчёт и не исполняется; после снятия одиночный фронт исполняется,
удерживавшаяся — нет; кнопки ошибку не снимают. Снятие идёт и вне устойчивых
состояний (V14-Q10 не ограничивает состоянием). Источник: V14-Q10, V14-Q11.

**PLC-07 (READY) — CMD_TRIGGER_EMERGENCY всегда.** Как v1 → EMGREF во всех
состояниях/фазах, при ошибке PLC, SafetyFault, нажатых кнопках, с любыми
командами. Источник: V14-Q9, V14-Q19, SPEC §13.

**PLC-08 (READY) — кнопка нажата → PLC-фронт игнорируется навсегда.** Как v1.
Источник: V14-Q14.

**PLC-09 (READY) — исключения для переходов.** (a) CMD_RUN_TO_R&D в StartingRun →
STP-E. (b) Safe→R&D принят, C1 ON, R&D не установлен: фронт CMD_R&D_TO_SAFE или
новая зелёная 500 мс → C1 OFF, C1_FBK OFF, Safe; не возобновляется. Границы как
v1. Источник: V14-Q12, V14-Q13.

**PLC-10 (READY) — прочие команды в переходах игнорируются.** Без ошибки, без
отложенного исполнения (после прихода в целевое состояние 2500 мс — нет
перехода от этого события, в т.ч. при удержании зелёной/команды через приход):
(1) зелёная 500/2000 мс или фронт CMD_R&D_TO_SAFE во время Run→R&D (SS1, выбег,
выдержка, ожидание C2_FBK OFF) и защитного спуска STP-G — моменты STP-A/STP-G
не меняются; (2) фронт CMD_R&D_TO_SAFE во время StartingRun — запуск
продолжается; (3) любые фронты команд перехода и зелёная во время R&D→Safe и
выхода/отката Config. TRIGGER — PLC-07. Источник: Q-RC-08, V14-Q11.

**PLC-11 (READY) — STS_COVER_LOCKED = NC1∧NC2.** Как v1. Источник: V14-Q5.

**PLC-12 (READY) — PLC не открывает крышку и не снимает Emergency.** Как v1.

**PLC-13 (READY-D) — прежний 2-битный путь не создаёт переходов.** Как v1.

**PLC-14 (BLOCKED Q-RC-18(b))** — жесты кнопок вверх (BOTH) при активной ошибке
PLC-команд.

## F. Heartbeat (V14-Q20)

**HB-01, HB-02, HB-03 (READY)** — без изменений против v1 (HB-02 добавить
состояния выхода Config и защитного спуска STP-G).

**HB-04 (BLOCKED ARCH)** — старт группы до первого импульса. Эскиз архитектора
(E4): группа в Emergency, пока heartbeat не меняется 3 с — причина активна,
Restart невозможен. Совместимо с Q-RC-10 и V14-Q20; критерий будет выведен
после финального плана E4 (граница «Restart в первые 3 с после старта без
импульса» — проверить, что эскиз её закрывает).

## G. Watchdog E6 и SafetyFault

**WDG-01 (READY)** — Safe→R&D, нет C1_FBK ON за 500 мс → откат в Safe +
SafetyFault. Как v1.

**WDG-02 (READY)** — Safe→R&D, C1_FBK ON в t_f, **in_LV_Faulty_FBK TRUE с момента
до C1 ON**: FALSE в t_f+29999 → R&D; TRUE до t_f+30000/+30001 → откат + SafetyFault.
Позитив: Faulty FALSE уже до C1 ON → R&D после C1_FBK ON без ожидания (минимальная
выдержка не задана; исходная 5-с выдержка reference Network5 удалена по
Q-ARCH-06 — наблюдение, не oracle). Источник: E6, E6-Q1, D-ARCH-POL.

**WDG-03 (READY-D)** — R&D→Run, нет C2_FBK ON за 500 мс / in_HV_Faulty_FBK TRUE
30 с от C2_FBK ON → откат последовательностью STP-E + SafetyFault; не Emergency.
Подтверждение — Q-RC-12 (открыт, низкий).

**WDG-04 (READY)** — 30 с не применяется к SS1 и к Config (Q-RC-06).

**WDG-05 (READY)** — отказ при отключении → EMGREF (включая откат CFG-08,
выход Config, STP-G). Как v1.

**WDG-06 (READY, изменено) — квитирование SafetyFault.**
(a) Исходно Safe с SafetyFault (WDG-01/02, CFG-08): зелёная (1 скан и 600 мс)
или синяя (1 скан и 600 мс) → SafetyFault FALSE со скана нажатия; нет перехода,
нет Unlock, удержание не становится командой.
(a') Исходно R&D с SafetyFault (WDG-03): синяя (1 скан, 600 мс) → как (a), Unlock
FALSE; зелёная 1 скан / 300 мс → квитирует (со скана нажатия), спуска нет;
**зелёная ≥ 500 мс → квитирует и выполняет R&D→Safe (WDG-07)**.
(b) Новая попытка после квитирующего нажатия без спуска: обе отпущены непрерывно
1999 мс → жест отклонён; 2000 мс → принимается.
(c) PLC SafetyFault не снимает; UP-фронт при SafetyFault не исполняется и после
квитирования; нужен новый фронт после 2000 мс отпускания кнопок.
(d) Пока активна — BOTH UP и вход в Config не исполняются (Q-RC-07(b)).
(e) TRIGGER и EStop работают.
Источник: E6-Q2, Q-RC-07 (исключение для зелёной в R&D), п.13.

**WDG-07 (READY) — спуск при активной SafetyFault.** Исходно R&D после отката
WDG-03, SafetyFault TRUE, кнопки отпущены ≥ 2000 мс. (a) Зелёная 500 мс →
R&D→Safe (MOD5-01); SafetyFault FALSE со скана нажатия (WDG-06(a')); спуск
принимается на квалификации 500 мс, а не после 2-с отпускания; после Safe
UP — обычный жест/фронт после 2000 мс отпускания. (b) Фронт CMD_R&D_TO_SAFE
(единственная TRUE) → R&D→Safe; **SafetyFault остаётся TRUE** в Safe (READY-D:
E6-Q2 «PLC ошибку не квитирует»; Q-RC-07 «предполагается остаётся до кнопки»);
UP (BOTH, CMD_SAFE_TO_R&D) отклоняется до квитирования кнопкой; Bypass —
CFG-03(f). (c) Потеря LV Healthy в R&D при SafetyFault → HLT-01, SafetyFault
остаётся (READY-D, та же норма). Источник: Q-RC-07(a)(b), E6-Q2.

## H. Healthy в R&D (E2-Q2)

**HLT-01 (READY) — LV потеряна в R&D → Safe.** Устойчивый R&D, in_LV_Faulty_FBK
TRUE ≥ 100 мс в h: R&D→Safe (C1 OFF, C3/BMS OFF, C1_FBK OFF → Safe); не Emergency.
Faulty→FALSE после h R&D не возвращает. 1-скан — наблюдение. Цепной случай после
Run→R&D/STP-G/E2-02 — тот же oracle с h = скан прихода в R&D. Источник: E2-Q2(a),
D-LV-OFF-COMPLETE, V14-Q15, Q-RC-02, Q-RC-09.

**HLT-01b (READY)** — HLT-01 при NC1/NC2 FALSE (IL-02b(d)).

**HLT-02 (READY) — HV Healthy в R&D игнорируется.** in_HV_Faulty_FBK постоянно
FALSE, постоянно TRUE, переключение 100 мс: нет перехода/fault/Emergency; приём
R&D→Run от его значения до запуска не зависит. Источник: E2-Q2(b).

**HLT-03 (BLOCKED Q-RC-11)** — статус/квитирование при HLT-01.

## I. Emergency и connectors

**EMG6-01 (READY).** Источники по отдельности: ES_NC_1/2, in_Estop_PLC/TRIGGER,
Mentee, heartbeat, NC в Run/StartingRun/Config/выходе Config (IL-03, IL-05a,
IL-04, IL-05c), connector в Config (EMG4-01), WDG-05, E2-03/E2-04. После
устранения причины, при снятой энергии и FBK OFF: нажатие+отпускание зелёной →
Safe; не R&D/Run/Config, даже если CMD_* или **Bypass** удерживаются (Q-RC-05:
нужен новый фронт). Restart при активной причине или FBK ON → Emergency.
PLC Emergency не снимает. Connector вне Config — EMG4-03. Снятие энергии в
Emergency из R&D/Safe→R&D/Config — Q-ARCH-01: Restart из этих состояний
проверяется после ответа. Источник: V14-Q6, решение №12, SPEC §12, Q-RC-05.

**EMG6-02 (READY)** — после EMG6-01 новый фронт CMD_SAFE_TO_R&D исполняется.

**EMG4-01 (READY) — connector в Config.** LV или HV connector FALSE (1 скан) в
Config и в выходе Config → EMGREF. Источник: V14-Q19 (выход — READY-D: Q-RC-03(b2)
аналогия «как в самом Config» дана для крышки; для connector — EMG-004 «после
выхода из Safe»).

**EMG4-02 (READY) — общие инварианты после выхода из Safe.** LV или HV connector
FALSE в R&D, Safe→R&D, StartingRun, Run, Run→R&D, R&D→Safe, на 1 скан и
устойчиво: ни одного нового повышения (C1/C2 ON, снятие STO), BOTH/CMD-UP/Bypass
не принимаются; Unlock FALSE; восстановление connector не отменяет начатую
реакцию (EMG-005) и не возобновляет подъём без нового события. Источник: SPEC
§5.1, EMG-004/005/011.

**EMG4-03 (BLOCKED Q-RC-14)** — вид реакции на потерю connector вне Config:
защёлка Emergency (EMGREF, Restart) или защитный спуск; по состояниям.

## J. Safe→R&D / R&D→Safe, структурные

**MOD1-01 (READY).** Safe→R&D (BOTH или CMD): C1 ON; C1_FBK ON (≤ 500 мс) и
in_LV_Faulty_FBK FALSE (≤ 30 с от FBK) → R&D. C3/BMS не включаются; R&D без их
FBK; C2 OFF, STO активен; Unlock FALSE; NC FALSE не мешают. На canonical ожидается
RED по полярности (N11/FBAnd4.AndIn3 читает сырое TRUE как исправно — D-ARCH-POL).
Источник: V14-Q7, V14-Q15, E6, D-ARCH-POL.

**MOD5-01 (READY).** R&D→Safe (зелёная 500 мс или CMD_R&D_TO_SAFE): C1 OFF,
C3/BMS OFF, C1_FBK OFF → Safe; C1_FBK ON > 500 мс → EMGREF. Также при открытой
крышке и SafetyFault. Источник: D-LV-OFF-COMPLETE, V14-Q15, E6-Q1, IL-02b, WDG-07.

**MOD-C3 (READY)** — как v1.

**MU06-S (READY, структурно)** — как v1 (Q-MU06-01/02).

**POL-01 (READY) — полярность и переименование.** (a) Все guard-потребители LV/HV
Healthy трактуют сырое FALSE как исправно, TRUE как потерю (Run hold, запуск,
подтверждение Run, SS1, вход в R&D, HLT, watchdog 30 с); ни одного прямого
контакта с противоположным смыслом (структурно + сценарии MOD1-01, STP-D, STP-G,
HLT-01). (b) После D-ARCH-POL-RENAME символы называются in_LV_Faulty_FBK /
in_HV_Faulty_FBK; аппаратные каналы/alias usage не изменены; число Symbols
сохранено (кроме объявленной дельты плана). (c) Ретрансляция статуса в PLC
(Network10) — не guard, передаёт сырое значение; её смысл для PLC вне этих
критериев. Источник: D-ARCH-POL, D-ARCH-POL-RENAME.

**R1-01 (READY, условие изменения) — удаление исходной power-on
последовательности.** Если архитектор применяет R1 (Network5, Network4, Step2
и их таймеры): (a) ревьюер подтверждает доказательство неиспользуемости в v2
(выходы Network4 = FALSE) до редактирования; (b) полный регресс: каждый READY
критерий даёт тот же вердикт до и после R1 (новый FAIL — дефект R1); (c) никакой
путь в Run/R&D не создаётся и не исчезает, кроме Safe→Step2→Run, неиспользуемого
в v2; (d) объявленная дельта FB/портов/Symbols совпадает с native результатом.
R2 (DECOUPLE fan-out) и слияние HL fault/SafetyFault не разрешены. Источник:
Q-ARCH-06.

**BOOT-C (READY) — старт группы.** Первый скан — Emergency (E2-04); Bypass и
CMD_* TRUE с момента старта после EMG6-01 не дают Config/переходов (Q-RC-05,
V14-Q11); Config и Run после рестарта не восстанавливаются. Heartbeat при старте —
HB-04. Источник: Q-RC-10, Q-RC-05, V14-Q11, BOOT-001.

## K. ID → критерии и статус

| ID | READY / READY-D | BLOCKED |
|---|---|---|
| EMG-001 | PLC-07, CFG-07, HB-02, EMG6-01 | — |
| EMG-002 | IL-01, IL-02, IL-02b, IL-03, IL-04, IL-05a, IL-05b, IL-05c | IL-05d (Q-RC-17) |
| EMG-003 | E4-v14 C04(d,e), CFG-03(e) | — |
| EMG-004 | EMG4-01, EMG4-02, CFG-07 | EMG4-03 (Q-RC-14) |
| EMG-005 | HB-03, EMG6-01, EMG4-02 | — |
| EMG-006 | EMG6-01, EMG6-02, PLC-12 | Restart из R&D/Safe→R&D/Config (Q-ARCH-01) |
| EMG-007 | PLC-12, CFG-04, CFG-06, STP-A, STP-E, STP-G, WDG-06 | — |
| EMG-008 / EMG-009 | STP-D, STP-F, STP-G | STP-H (Q-RC-15), STP-G4 (Q-RC-16), STP-G5 (Q-ARCH-05) |
| EMG-010 | STP-A, STP-C, STP-E, STP-G, CFG-06, CFG-08 | — |
| EMG-011 | PLC-07, IL-02, CFG-02, CFG-03, EMG4-02 | PLC-14 (Q-RC-18) |
| EMG-012 | E2-01, E2-02, E2-03, E2-04 | — |
| BTN-001/007 | WDG-06 | — |
| BTN-003 | STP-A, STP-E(1), PLC-09(b), WDG-07(a) | — |
| CVR-001 | CFG-04, PLC-12 | — |
| CVR-004 | IL-01, IL-02, MOD1-01, PLC-01, CFG-01 | — |
| CVR-005 | PLC-08, CFG-03(h) | — |
| CVR-006 | IL-01…IL-05c | IL-05d |
| MOD-001 | MOD1-01, WDG-01, WDG-02 | — |
| MOD-002 | STP-E, WDG-03 (READY-D) | — |
| MOD-003 | PLC-01, PLC-02, PLC-03, PLC-05, PLC-06, CFG-03 | — |
| MOD-004 | PLC-03, PLC-09, PLC-10, STP-A, STP-E | — |
| MOD-005 | MOD5-01, HLT-01, MOD-C3, WDG-07 | HLT-03 (Q-RC-11) |
| MOD-006 | E2-01, E2-04, CFG-01 | — |
| MOD-007 | PLC-01, PLC-04, PLC-05, PLC-12, PLC-13, CFG-01…03 | CFG-09 (Q-RC-18, Q-ARCH-08) |
| MOD-008 | HLT-02, POL-01 | — |
| STP-001 | STP-A, STP-B, STP-D, STP-G | STP-H |
| STP-002 | STP-A, STP-F | — |
| STP-003 | STP-C, WDG-05 | — |
| STP-004 | STP-A, STP-C, STP-E, STP-F, E2-02 | — |
| STP-005 | MOD5-01, PLC-09(b), CFG-06, IL-02b | — |
| BOOT-001 / BOOT-002 | BOOT-C, CFG-03(d) | HB-04 (ARCH) |
| Новые CFG-*, PLC-*, HB-*, WDG-*, HLT-*, STP-006 | см. SCOPE_PROPOSAL.md | CFG-10 (Q-RC-19) |
| Изменение структуры | R1-01, POL-01, MU06-S | — |

Предел: критерии не утверждают соответствия canonical F1; большинство ожидается
RED (интерфейс PLC, Config, heartbeat, watchdog, STOP v2, полярность N11).
Аппаратная валидация не заявляется.
