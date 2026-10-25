# CRITERIA_DELTA — изменения к REQ-CONSOLIDATION/CRITERIA v2 по новым ответам Вадима

Срез / роль / дата: E2-G1-questions / v2-analyst / 2026-10-21.
База: program/analyst/REQ-CONSOLIDATION/CRITERIA.md v2 **f2f11d77…aa3** (JSON 49d534c8…eb4) —
не изменялась (запись туда вне поручения). Ведущему: перенести дельту в CRITERIA v3 тем же
аналитиком либо считать этот файл действующим дополнением.
Источник решений: SCENARIO_DECISIONS.md **f363aae89acc653797d102dda45f90bbd1b1ee4c0a0afbfd98a86eac8931c64b**
(Q-ARCH-01 «А», Q-ARCH-03 «Б», Q-ARCH-05/Q-RC-11 «А», Q-ARCH-09 «В», Q-RC-14 «А»,
D-ARCH-POL-RENAME дополнение outPLC). Canonical SAL 04b45456…d28a3, SGVL dc103abe…a9104.
SCOPE: SOFTWARE_ACCEPTANCE_SCOPE.md 0e41f7dc…db9. Обозначения, R0, таймеры, границы — CRITERIA v2 §0.

Это критерии требований; имена маркеров/блоков/сигналов (кроме заданных Вадимом) — архитектору.

## 0. Общие условия

**R0 — дополнение (READY-D):** `in_Safety_Run` TRUE постоянно во всех функциональных
тестах. FALSE и переходы FALSE↔TRUE — только E7 (BOOT/group lifecycle) при наличии модели
группы. Основание и пределы — QUESTIONS.md §Q1/§Q2 (привязка к `//RunStop`, Network3/FBAnd1,
V14-Q20 историческая запись Вадима, Q-RC-10).

**Устойчивые состояния (уточнение §0):** Safe — через старт группы → Emergency → Restart
зелёной (EMG6-01); инъекция Set/памяти стадий как нормативный путь запрещена; вариант
«FALSE + объявленный Safe» — только диагностика вне покрытия ID (QUESTIONS.md §Q2).

**EMGREF-LV (новое, READY; Q-ARCH-01 «А», Q-RC-14 «А»)** — реакция «Emergency» из (1) устойчивого
R&D (C1 ON, C2 OFF, STO активен), включая идущий R&D→Safe, и (2) принятого Safe→R&D до
подтверждения R&D:
1. EMGREF (1)(2) без изменений: статус Emergency с e (≤ e+1), защёлка; нет нового повышения,
   STO не снимается, C2 не включается, Unlock FALSE; BOTH/CMD-UP/Bypass не исполняются.
2. Энергия по общей аварийной цепи с существующими таймингами: C3/BMS OFF и
   `out_LV_Discharge_Request` — в e (≤ e+1, как в Run); C1 OFF через 2 с — **дифференциально**:
   смещение «событие → C1 OFF» равно смещению при `in_Estop_PLC` в устойчивом Run
   (q−1: C1 ещё ON; q+1: OFF; q — наблюдение). Далее ветка STO/HV discharge/C2 OFF исполняется
   по цепи: нормативно — STO активен и C2 OFF непрерывно; момент `out_HV_Discharge_Request`
   — READY-D дифференциально с Run (отсутствие этой ветви в R&D = отступление от ответа «А»,
   вернуть аналитику, а не утверждать тестом).
3. (2) Safe→R&D: R&D не подтверждается ни в одном скане ≥ e даже при C1_FBK ON и LV исправно;
   C3/BMS не включаются. Момент C1 OFF в (2) — **BLOCKED Q-E2Q-01** (2 с по цепи или сразу);
   нормативно лишь «не позже, чем в (1)».
4. Конечное состояние: Emergency; C1, C2, C3/BMS OFF, STO активен, LV discharge выполнен.
   Restart → **только Safe** (EMG6-01-LV ниже).
5. Справочное наблюдение (стенд, split-диагностика, вариант injected-Safe, не oracle):
   `in_Estop_PLC` в Run: b_EStop_Ok FALSE +2, LV discharge +4, C1 OFF +2005, STO +7007,
   HV discharge +7009, C2 OFF +8010 мс. На canonical в R&D событие лишь сбрасывает b_EStop_Ok,
   LV остаётся — ожидаемый RED (срез EX).

**EMGREF-RUN** — без изменений; теперь применяется также к connector (Q-RC-14) в Run,
StartingRun, Run→R&D (все фазы).

Лимит v2 «энергия при Emergency в R&D/Safe→R&D/Config — Q-ARCH-01 (открыт)» **снят** для
R&D, R&D→Safe, Safe→R&D; для Config/выхода Config: connector — общая цепь (Q-RC-14 «по Q-ARCH-01»);
прочие причины в Config (NC, EStop, PLC, Mentee, heartbeat) — энергия не задана прямо,
**зависит от документации E4** (Config — V14-Q16, E4 заморожен); вопрос не задаю до E4.

## A. E2

**E2-01 — уточнение границ (READY).** Нормативный вариант — in_Safety_Run TRUE. В числе
запрещённых: скан без стадии внутри перехода, за которым ставится Safe (Network3/FBAnd1)
при активной другой стадии (наблюдение split: R&D→Run ⇒ b_Step1+b_Step3, затем C1/C2 OFF).

**E2-04 — уточнение (READY-D, Q-RC-10 + EMG6-01).** Safe из «ни одной стадии» допустим только
как выход из Emergency по EMG6-01 (Restart при снятой энергии и FBK OFF). Вне этого любой
скан «ни одной основной вне перехода» ⇒ Emergency, а не Safe; автоматическая инициализация
Safe (FBAnd1) во время работы запрещена. Старт группы: вариант `[in_Safety_Run true]` нормативен,
`[false]` — диагностика.

## B. E3 — STOP v2, abort, Healthy

**STP-D — дополнение (READY, Q-ARCH-05/Q-RC-11).** Потеря HV Healthy в SS1: дополнительно
SafetyFault (HealthyLost) для PLC; следующий подъём — только после квитирования E6-Q2.
Существующий fault HealthyLostDuringSS1 и его сброс (D-HEALTHY-FAULT-RESET-EDGE) не отменены;
разрешение UP определяет E6-Q2 (последнее решение). Единый или два флага — архитектору
(слияние блоков Q-ARCH-06 не разрешено). Спуск ошибкой не блокируется.

**STP-E — дополнение событием (3) (READY; Q-ARCH-03 «Б») — см. STP-I.** Ссылка «граница r»
теперь определена Q-ARCH-09 (ниже).

**STP-F — изменение.** Для HV: «нет fault/SafetyFault» без изменений (Q-RC-09, E2-Q2b). Для LV:
«нет SafetyFault» снято; **BLOCKED Q-E2Q-02** (выставляется ли SafetyFault при цепном R&D→Safe).
Последовательность и моменты — без изменений (READY).

**STP-G5 — РАЗБЛОКИРОВАН (READY, Q-ARCH-05 «А»).** Потеря LV или HV Healthy в устойчивом Run
(STP-G1): SafetyFault (HealthyLost) TRUE не позже прихода в R&D (G2) / в Safe (G3) и держится
до квитирования E6-Q2 (любая кнопка; затем обе отпущены 2 с; PLC не квитирует). Запрещено:
UP (BOTH/CMD) исполняется до квитирования; ошибка блокирует спуск (G3 R&D→Safe обязан идти).
Момент выставления раньше прихода в R&D — наблюдение.

**STP-H — без изменения статуса (BLOCKED Q-RC-15)** — но после ответа к нему добавится
SafetyFault (Q-RC-11 «в SS1»).

**STP-I (новый, READY; Q-ARCH-03 «Б», Q-ARCH-05 «А») — потеря LV Healthy в StartingRun.**
Исходно: устойчивый R&D, оба Faulty FALSE, BOTH принят в u (R&D→Run), STO снят, C2 ON
командой, Run не подтверждён (r — скан подтверждения Run). Событие: `in_LV_Faulty_FBK` TRUE
в c ∈ {u+1, u+50, r−1}, удерживается.
| Момент | Ожидается | Запрещено |
|---|---|---|
| c (≤ c+1) | STO активирован; без SS1 | Run в любом скане ≥ c; SS1 |
| ≤ c+2 | Discharge (как STP-E) | — |
| t_d+T_DIS−1 / t_d+T_DIS (+1) | C2 ещё ON / C2 OFF (обязателен к q+1) | C2 OFF раньше |
| скан после C2_FBK OFF | R&D, затем без новой команды R&D→Safe (C1 OFF, C3/BMS OFF, C1_FBK OFF → Safe) | C1 OFF до C2_FBK OFF; Emergency |
Весь участок: не Emergency; Unlock FALSE; BOTH/CMD-UP и зелёная/CMD_R&D_TO_SAFE не исполняются
и не исполняются позже (V14-Q11, Q-RC-08 — READY-D); отменённый запуск не возобновляется.
SafetyFault (HealthyLost) TRUE не позже прихода в Safe, квитирование E6-Q2.
Границы: c = u−1 → HLT-01 (LV потеряна в R&D: UP не исполняется, R&D→Safe); c = r+1 → STP-G
(G3); u, r — наблюдение.
Аварийные сочетания: NC FALSE в том же скане или во время STP-I до STO — IL-05a (Emergency
приоритетнее, SPEC §13 п1); EStop/in_Estop_PLC/connector в любой момент STP-I → Emergency
(EMGREF-RUN до R&D, EMGREF-LV после прихода в R&D/в R&D→Safe); HV Faulty TRUE одновременно —
STP-I (LV определяет реакцию; WDG-03 30 с не ждётся).
(4) LV вернулась до R&D — **BLOCKED Q-RC-16** (дополнение в QUESTIONS.md).
Источник: Q-ARCH-03, D-STARTINGRUN-GREEN-DOWN (последовательность abort), E2-Q2a, Q-ARCH-05.
Следствие для плана E2c: изоляция HLT_LV.AndIn2 «игнор в StartingRun» противоречит ответу.

**RUN-CONF (новый, READY; Q-ARCH-09 «В»; ID MOD-002) — подтверждение Run.** Исходно StartingRun.
Run подтверждается, когда C2_FBK ON ∧ `in_HV_Faulty_FBK` FALSE непрерывно 100 мс: пусть k —
первый скан, где оба выполнены; Run нет на k+99, Run есть к k+101 (k+100 — наблюдение по
семантике TON). Негатив: C2_FBK ON при HV Faulty TRUE — Run нет (до WDG-03 30 с → откат);
C2_FBK OFF при HV исправно — Run нет (WDG-03 500 мс). Запрещено требовать выдержку 5 с и STO FBK
приводов (не восстанавливаются). Прерывание одного из условий внутри 100 мс — наблюдение
(перезапуск отсчёта не задан). r в STP-E/IL-05a/STP-I = скан подтверждения по этому правилу.

## C. Крышка

**IL-05d** — без изменения (BLOCKED Q-RC-17); вариант (1) включает теперь и abort STP-I.

## G. Watchdog / SafetyFault

**WDG-03 (READY-D)** — без изменений; Q-ARCH-09 подтвердил условия ожидания (C2_FBK, HV).

## H. Healthy в R&D

**HLT-01 — дополнение (READY, Q-RC-11 «А»):** при R&D→Safe по потере LV — SafetyFault
(HealthyLost) TRUE не позже прихода в Safe, держится до квитирования E6-Q2; спуск не
блокируется; UP из Safe до квитирования не исполняется (кнопки и PLC).
**HLT-01b** — то же при открытой крышке.
**HLT-02 — дополнение (READY):** HV Faulty TRUE в R&D — **нет SafetyFault** (E2-Q2b, Q-RC-11).
**HLT-03 — РАЗБЛОКИРОВАН (READY, Q-RC-11 «А»):** (a) после HLT-01 в Safe SafetyFault TRUE;
(b) BOTH/CMD_SAFE_TO_R&D до квитирования — не исполняются и не исполняются позже;
(c) любая кнопка (1 скан и 600 мс) — SafetyFault FALSE со скана нажатия, перехода нет;
(d) новый BOTH после отпускания обеих ≥ 2000 мс → Safe→R&D; при 1999 мс — не принят;
(e) PLC SafetyFault не снимает. Цепной случай после Run→R&D — Q-E2Q-02 (BLOCKED).
Config: Healthy игнорируется, SafetyFault нет (V14-Q19) — CFG-* без изменений.

## I. Emergency и connectors

**EMG6-01 — РАЗБЛОКИРОВАН для R&D/R&D→Safe/Safe→R&D (READY; Q-ARCH-01, V14-Q6).**
Исходно — EMGREF-LV после причины из списка Q-ARCH-01 / Q-RC-14. Restart (зелёная) при
устранённой причине, C1/C2 OFF, C1_FBK/C2_FBK OFF → **Safe**; запрещено: R&D, продолжение
Safe→R&D, Run, Config — даже если CMD_*/Bypass удерживаются. Restart при активной причине
или до C1_FBK OFF (в т.ч. в первые 2 с цепи) → остаётся Emergency, без последующего
отложенного выхода. Источники: ES_NC_1/2, in_Estop_PLC/TRIGGER, Mentee, LV/HV connector — каждый
отдельно. Источники в Config (кроме connector) — E4.

**EMG4-03 — РАЗБЛОКИРОВАН (READY; Q-RC-14 «А»).** `in_LV_Connector_Interlock` или
`in_HV_Connector_Interlock` FALSE (1 скан и устойчиво; LV и HV одинаково) в R&D, Safe→R&D,
R&D→Safe → EMGREF-LV; в StartingRun, Run, всех фазах Run→R&D (SS1, выбег, разряд, ожидание
C2_FBK OFF), abort StartingRun, защитном спуске STP-G → EMGREF-RUN; в Config и выходе
Config → EMGREF + общая цепь (EMG4-01). Восстановление connector не отменяет (EMG-005);
выход только Restart → Safe. **В Safe** — без изменений: только запрет подъёма, без fault и
без Emergency (EMG-003); граница: потеря в скане принятия Safe→R&D u: u−1 → EMG-003 (UP
отклонён), u+1 → EMGREF-LV, u — наблюдение. Источник: Q-RC-14, Q-ARCH-01, EMG-004.
**EMG4-02** — без изменений (инварианты остаются в силе внутри EMG4-03).
Замечание: Q-RC-14 в REQ-CONSOLIDATION/QUESTIONS.md закрыт ответом.

## J. Структурные

**POL-01(b) — дополнение (READY; D-ARCH-POL-RENAME, дополнение Вадима):** выходы статуса
в PLC `outPLC_LV_Healthy` → `outPLC_LV_Faulty`, `outPLC_HV_Healthy` → `outPLC_HV_Faulty`
(TRUE = неисправность). Структурно: старых имён нет, новые есть, число Symbols сохранено (кроме
объявленной дельты плана), alias usage/каналы не изменены, связанные PLC-переменные/links —
в границах V14-Q2. **POL-01(c) — изменение:** ретрансляция Network10 должна передавать сырое
значение Faulty (TRUE = неисправность) — сценарно: in_LV_Faulty_FBK TRUE ⇒ outPLC_LV_Faulty TRUE,
FALSE ⇒ FALSE (то же HV); прежнее «смысл для PLC вне критериев» снято.

## K. ID → критерии (изменённые строки)

| ID | READY / READY-D | BLOCKED |
|---|---|---|
| EMG-001 | + EMGREF-LV, EMG6-01 (R&D/Safe→R&D/R&D→Safe) | — |
| EMG-004 | EMG4-01, EMG4-02, **EMG4-03**, CFG-07 | — (было Q-RC-14) |
| EMG-006 | EMG6-01 (+R&D/Safe→R&D/R&D→Safe), EMG6-02, PLC-12 | Config не-connector (E4) |
| EMG-008/009 | STP-D (+SafetyFault), STP-F, STP-G, **STP-G5** | STP-H (Q-RC-15), STP-G4 (Q-RC-16) |
| EMG-012 / MOD-006 | E2-01, E2-04 (уточнены) | — |
| MOD-002 | STP-E, WDG-03, **RUN-CONF**, **STP-I** | — |
| MOD-005 | MOD5-01, HLT-01 (+SafetyFault), MOD-C3, WDG-07, **HLT-03** | HLT-03 цепной (Q-E2Q-02) |
| MOD-008 | HLT-02 (+нет SafetyFault), POL-01 (b/c изменены) | — |
| STP-004 | STP-A, STP-C, STP-E, STP-F (HV), E2-02 | STP-F LV-fault, E2-02(L)-fault (Q-E2Q-02) |
| BOOT-001/002 | BOOT-C (+R0 in_Safety_Run TRUE; FALSE — E7) | HB-04 (ARCH) |

## Дельта для SOFTWARE_ACCEPTANCE_SCOPE (ведущему)

| ID | Сейчас в SCOPE | Предлагается | Основание |
|---|---|---|---|
| EMG-004 | «…вид реакции в R&D/Run/переходах — открыт» (строка 313) | «После выхода из Safe потеря LV или HV connector в любом состоянии/переходе (R&D, Run, Config, Safe→R&D, StartingRun, Run→R&D, R&D→Safe, выход Config) → Emergency: защёлка, общая аварийная цепь (Q-ARCH-01), выход только Restart → Safe. В Safe — запрет подъёма без fault (EMG-003)» | Q-RC-14, Q-ARCH-01 |
| EMG-006 | Restart → Safe | + «из Emergency, возникшей в R&D/Safe→R&D/R&D→Safe, — только в Safe после снятия LV (C1_FBK OFF)» | Q-ARCH-01 |
| HLT-001 | «R&D: LV → R&D→Safe; HV игнорируется» + цепной случай | + «SafetyFault (HealthyLost) при потере LV в R&D, квитирование E6-Q2; HV в R&D и Config — без ошибки; StartingRun: потеря LV → abort StartingRun → R&D → R&D→Safe + SafetyFault (не Emergency)» | Q-RC-11, Q-ARCH-03 |
| MOD-002 | «Run после interlock, C2, Healthy» + откат E6 | + «Run подтверждается через 0,1 с при C2_FBK ON и HV исправно (сырое in_HV_Faulty_FBK FALSE); выдержка 5 с и STO FBK reference не восстанавливаются (отступление подтверждено); потеря LV в StartingRun → abort (Q-ARCH-03)» | Q-ARCH-09, Q-ARCH-03 |
| STP-001/EMG-008 | — | + «потеря Healthy в Run/SS1 — SafetyFault (HealthyLost)» | Q-ARCH-05 |
| MOD-008 / POL | — | + «переименование outPLC_LV/HV_Healthy → outPLC_LV/HV_Faulty (TRUE = неисправность)» | D-ARCH-POL-RENAME |
| BOOT-001/002 | — | + «функциональные тесты при in_Safety_Run TRUE; RunStop FALSE / group lifecycle — E7» | QUESTIONS.md Q1 |

Распределение по этапам (предложение): EMGREF-LV/EMG6-01-LV/EMG4-03 — EX (как в PLAN E2);
STP-I, RUN-CONF, STP-G5, STP-D+ — E3; HLT-01+/HLT-03 — E2c (SafetyFault) или E5 (SafetyFault как
сигнал) — решение ведущего/архитектора; POL-01(b/c) — E2a (переименование).

## Влияние на тесты G1 (тестировщику через ведущего)

- Нормативный вариант всех файлов — in_Safety_Run TRUE без инъекции (QUESTIONS.md §Q2).
- HLT-01/HLT-01b: добавить SafetyFault TRUE и блок UP до квитирования; HLT-02: нет SafetyFault.
- POL-01: новые имена outPLC_*_Faulty и сценарная проверка ретрансляции.
- Тесты EStop в R&D/Safe→R&D: теперь нормативны EMGREF-LV и Restart → Safe (если срез EX
  поручен); до поручения — не утверждать противоположного.
- Наблюдение A1 HANDOFF («FBAnd1 — group-start fallback, единственный потребитель») неполно:
  второй потребитель — `//RunStop`.
