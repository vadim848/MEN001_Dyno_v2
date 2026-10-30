# Каталог сценариев v2 — компактный набор (утверждён Вадимом 2026-10-23, D-COMPACT)

Дата: 2026-10-23. Источник: решения Вадима (DECISIONS_DIGEST.md → SCENARIO_DECISIONS.md).
Заменяет ~1400 тестовых случаев (99 файлов) одним набором сценариев.

## Правила набора

1. **Один сценарий = одна проверка требования** на полной программе SAL, только через
   реальные входы (без подстановки внутренних сигналов и стадий).
2. **Старт всегда штатный:** запуск группы → Emergency → зелёная (Restart) → Safe.
3. **Время с допуском ±50 мс** (таймеры 0,1…5 с); для кнопок 0,5/1 с, фильтра 1 с (TMR-1) и окна 250 мс —
   проверка «до границы −50 мс нет / после +50 мс есть». Скан в скан не проверяем.
4. **Наблюдаем выходы и статус:** C1, C2, C3/BMS, STO1/2, Discharge LV/HV, Unlock,
   статусы для PLC (Safe/R&D/Run/Emergency/Config, Fault, Faulty, STS_COVER_LOCKED).
   Внутренние RS/стадии — только для проверки «ровно одно основное состояние».
5. **Инвариант во всех сценариях:** никогда не активны два основных состояния.
6. **Структура:** одна проверка native preflight + CRC + число блоков ≤ 512.
   Без поблочных слепков SHA/ID/порядка.
7. **Мутации:** только 12 критичных защит (раздел M), по одному убивающему сценарию.
8. **Кнопки:** BOTH = обе нажаты (вторая ≤ 250 мс), держать 1 с; down = зелёная 0,5 с.
   «Норма» = EStop OK, NC1∧NC2, connectors OK, Healthy норма, FBK по командам.

Колонка «Этап» — где реализуется: E2 (статусы/Emergency/полярность), E3 (STOP v2),
E4 (PLC/Config/heartbeat), E5/E6 (SafetyFault/watchdog), E7 (BOOT).

## K. Кнопки и жесты (11)

| ID | Исходно | События | Ожидается | Этап | Источник |
|---|---|---|---|---|---|
| K-01 | Safe | BOTH (вторая через 200 мс), держать 1 с | Safe→R&D начинается | E2 | D-TIMING, D-CHORD250 |
| K-02 | Safe | вторая через 300 мс | ни подъёма, ни fault | E2 | D-CHORD250 |
| K-03 | Safe | BOTH, отпустить одну через 0,8 с | ничего (не single, не подъём) | E2 | п.7 |
| K-04 | R&D | зелёная 0,4 с / 0,6 с | 0,4 — ничего; 0,6 — R&D→Safe | E2 | D-TIMING |
| K-05 | R&D | зелёная, синяя ровно через 500 мс | только down, без подъёма | E2 | D-Q500 |
| K-06 | R&D | зелёная, синяя через 300 мс (до принятия) | ничего, без fault | E2 | D-LATE-SECOND |
| K-07 | R&D | BOTH → Run; не отпуская, повтор | ровно одна ступень вверх | E2 | п.4–5 |
| K-08 | Safe | BOTH, отпустить; новый BOTH через 0,9 с / 1,1 с | 0,9 — нет; 1,1 — да | E2 | п.9, TMR-1-Q1 |
| K-09 | Safe | крышка 300 мс открыта при отпущенных кнопках, BOTH через 1,1 с после отпускания | подъём принимается | E2 | Q-REL-AFTER-PERMIT |
| K-10 | Run | BOTH | игнорируется | E2 | D-RUN-BOTH-IGNORE |
| K-11 | Safe/R&D | синяя 0,6 с (крышка закрыта, затем открыта) | Unlock в обоих случаях; в Run/Config/Emergency — нет | E2 | Q-ARCH-04/10 |

## C. Крышка, connector, interlock (10)

| ID | Исходно | События | Ожидается | Этап | Источник |
|---|---|---|---|---|---|
| C-01 | Safe, крышка открыта | BOTH | Safe→R&D выполняется | E2 | V14-Q7 |
| C-02 | R&D, крышка открыта | BOTH | R&D→Run не выполняется, без fault | E2 | V14-Q5 |
| C-03 | Safe / R&D | NC1 → FALSE | не авария; R&D→Run запрещён | E2 | V14-Q21 |
| C-04 | Run | NC2 → FALSE | Emergency | E2 | Q-RC-01 |
| C-05 | StartingRun | NC1 → FALSE | Emergency | E2 | Q-RC-03a |
| C-06 | нормальный Run→R&D (в SS1) | NC1 → FALSE | спуск продолжается до R&D | E3 | Q-RC-03 b1 |
| C-07 | abort StartingRun / защитный спуск | NC1 → FALSE | Emergency | E3 | Q-RC-17 |
| C-08 | Safe | connector LV → FALSE, затем BOTH | подъёма нет, без fault | E2 | Q-RC-14, EMG-003 |
| C-09 | R&D / Run | connector HV → FALSE | Emergency | E2 | Q-RC-14 |
| C-10 | Safe | Door_Monitor FALSE, синяя 0,6 с | Unlock не выдаётся | E2 | UNL-05, D-DOOR-INTERLOCK |

## E. Emergency и аварийная цепь (12)

| ID | Исходно | События | Ожидается | Этап | Источник |
|---|---|---|---|---|---|
| E-01 | Run | EStop NC1 | Emergency; STO, C2 OFF, C1 OFF по аварийной цепи | E2 | EMG-001 |
| E-02 | R&D | in_Estop_PLC | Emergency; сразу C3/BMS OFF + LV discharge, C1 OFF через 2 с | E2 | Q-ARCH-01 |
| E-03 | Safe→R&D (C1 ON, не подтверждён) | Mentee | Emergency; подъём прекращён, C1 OFF через 2 с | E2 | Q-ARCH-01, Q-E2Q-01 |
| E-04 | Emergency (по PLC) | причина снята, зелёная | → Safe (только Safe) | E2 | V14-Q6, EMG6-01 |
| E-05 | Emergency | причина ещё активна, зелёная | остаётся Emergency | E2 | SPEC §12 |
| E-06 | старт группы с C1_FBK ON | Restart | не Safe | E2 | EMG6-01-BOOT |
| E-07 | нормальный Run→R&D, t+1 с | EStop | каждый шаг (STO, Discharge, C2 OFF) не позже нормального | E3 | Q-T3-1 |
| E-08 | любое | одновременно два основных состояния (не должно возникать) / ни одного | Emergency | E2 | E2, Q-RC-10 |
| E-09 | Run | C2_FBK пропал после окна 500 мс при команде ON | Emergency | E6 | Q-RC-19, Q-V4-01 |
| E-10 | Run→R&D | после команды C2 OFF FBK ON > 500 мс | Emergency | E6 | E6-Q1 |
| E-11 | Run→R&D / R&D→Safe / выход из Config | отказ отключения: C2 (или C1) FBK ON > 500 мс после команды OFF, FBK остаётся ON | Emergency (одно состояние); сразу C3/BMS OFF + LV discharge, C1 OFF через 2 с ±50 мс, STO удержан; залипший FBK цепь не задерживает | EMG-OFF | EMG-OFF-Q1 |
| E-12 | Run (установившийся) | C1 или C2 FBK пропал при команде ON (WD_EMG, как E-09) | Emergency (одно состояние); сразу C3/BMS OFF + LV discharge, C1 OFF через 2 с ±50 мс, STO удержан, C2 OFF по аварийной цепи | EMG-OFF | Q-EMGOFF-A1 |

## U. Подъём и подтверждение (9)

| ID | Исходно | События | Ожидается | Этап | Источник |
|---|---|---|---|---|---|
| U-01 | Safe | BOTH; C1_FBK через 50 мс; LV норма | C1 ON; R&D не раньше команда C1 + 500 мс + 100 мс непрерывно | E2 | вопрос 68 |
| U-02 | Safe | BOTH | LV Discharge снят в момент принятия | E2 | TD-01/вопрос 74 |
| U-03 | R&D | BOTH | в момент принятия: C2 ON, STO снят, HV Discharge снят | E2 | D-STO-LAUNCH, вопрос 73 |
| U-04 | StartingRun | C2_FBK + HV норма | Run не раньше команда + 600 мс | E2 | вопрос 68, RUNCONF |
| U-05 | StartingRun | HV норма пропадает на 30 мс после окна | отсчёт 100 мс заново, без аварии | E2 | Q-RC-RUNCONF-01 |
| U-06 | Safe | LV Faulty до жеста, BOTH | Safe→R&D начинается (затем откат по 30 с — U-WD) | E2 | вопрос 66(b), K-2 |
| U-07 | Safe→R&D / StartingRun | BOTH, начатый во время перехода | после прихода не исполняется | E2 | XPH-01, MOD-004 |
| U-08 | R&D | legacy PLC (1,1) | R&D→Run не выполняется | E2 | вопрос 76 |
| U-09 | Safe | крышка/connector пропали между нажатием первой и второй кнопки | жест отклоняется | E2 | K-1, TD-07 |

## D. Спуск (9)

| ID | Исходно | События | Ожидается | Этап | Источник |
|---|---|---|---|---|---|
| D-01 | Run | зелёная 0,5 с | STO в 2 с; команда HV Discharge в 4 с (выбег 2 с); выдержка 5 с; C2 OFF; R&D после C2_FBK OFF | E3 | D-RUN-STOP-WAITS, E2-Q1, TMR-1-Q1 |
| D-02 | Run→R&D | — | порядок строго: STO < Discharge < C2 OFF; ничего не одновременно | E3 | E2-Q1 |
| D-03 | StartingRun | зелёная 0,5 с | abort: сразу STO + Discharge, выдержка, C2 OFF, R&D; без SS1 и выбега | E3 | V14-Q12 |
| D-04 | Safe→R&D (C1 ON) | зелёная 0,5 с | abort в Safe: C1 OFF, C1_FBK OFF | E2 | V14-Q13 |
| D-05 | Run→R&D (в SS1) | зелёная ещё раз | игнорируется | E3 | Q-RC-08 |
| D-06 | R&D | зелёная 0,5 с | C1 OFF; Safe после C1_FBK OFF | E2 | D-LV-OFF-COMPLETE |
| D-07 | Run→R&D | — | HV Discharge держится уровнем до следующего принятого подъёма HV | E3 | Q-V7-01 |
| D-08 | Run→R&D, ожидание C2 OFF | LV Healthy пропал, C2_FBK OFF через 2 скана | ровно R&D, затем цепной R&D→Safe (не два состояния) | E2 | E2-Q1, E2-Q2 |
| D-09 | StartingRun | потеря LV Healthy | abort до R&D, затем R&D→Safe | E3 | Q-ARCH-03 |

## H. Healthy (7)

| ID | Исходно | События | Ожидается | Этап | Источник |
|---|---|---|---|---|---|
| H-01 | любое | сырое `in_LV_Faulty_FBK` FALSE / TRUE | FALSE = норма, TRUE = потеря (везде одинаково) | E2 | D-ARCH-POL |
| H-02 | Run | HV Faulty TRUE | немедленный STO, выбег 2 с, Discharge, выдержка 5 с, C2 OFF, R&D; SafetyFault | E3 | Q-RC-02, Q-ARCH-05, TMR-1-Q1 |
| H-03 | Run | LV Faulty TRUE | как H-02, затем R&D→Safe; SafetyFault | E3 | Q-RC-02 |
| H-04 | R&D | HV Faulty TRUE / FALSE | игнорируется | E2 | E2-Q2b |
| H-05 | R&D | LV Faulty TRUE | R&D→Safe; SafetyFault | E2 | E2-Q2a, Q-RC-11 |
| H-06 | Run→R&D в SS1 | LV Faulty TRUE | немедленный STO; затем R&D→Safe; SafetyFault | E3 | Q-RC-15 |
| H-07 | Run→R&D после STO | LV Faulty TRUE, потом вернулся | остановка без изменений; всё равно R&D→Safe | E3 | Q-RC-09, Q-RC-16 |

## W. Watchdog и SafetyFault (10)

| ID | Исходно | События | Ожидается | Этап | Источник |
|---|---|---|---|---|---|
| W-01 | Safe→R&D | C1_FBK не пришёл за 500 мс | откат в Safe; SafetyFault | E6 | E6-Q1 |
| W-02 | StartingRun | C2_FBK не пришёл за 500 мс | откат (abort) в R&D; SafetyFault | E6 | Q-RC-12 |
| W-03 | StartingRun | HV норма не подтверждена 30 с (мигает) | на 30 с откат в R&D; SafetyFault | E6 | Q-CA1-01 |
| W-04 | Safe→R&D | LV норма не подтверждена 30 с | откат в Safe; SafetyFault | E6 | 66(b) |
| W-05 | StartingRun | зелёная (abort), затем окно 500 мс истекло без FBK | SafetyFault всё равно | E6 | Q-V7-03 |
| W-06 | Safe, SafetyFault | BOTH | только квитирует; подъёма нет; новый BOTH после 1 с — подъём | E5 | E6-Q2, TMR-1-Q1 |
| W-07 | R&D, SafetyFault | зелёная 0,5 с | квитирует и спускает в Safe | E5 | Q-RC-07 |
| W-08 | R&D, SafetyFault | PLC-команда | не квитирует | E5 | E6-Q2 |
| W-09 | Safe | C1_FBK ON без команды | SafetyFault; подъём запрещён до FBK OFF; кнопка при FBK ON не квитирует | E5 | Q-V4-02, Q-V7-04 |
| W-10 | любая ошибка | — | один бит Fault для PLC = ошибка PLC OR SafetyFault | E5 | Q-RC-13 |

## P. Команды PLC (E4) (12)

| ID | Исходно | События | Ожидается | Этап | Источник |
|---|---|---|---|---|---|
| P-01 | Safe | фронт CMD_SAFE_TO_R&D | как BOTH (крышка может быть открыта) | E4 | v1.4 §8, V14-Q7 |
| P-02 | R&D, крышка открыта | фронт CMD_R&D_TO_RUN | не выполняется | E4 | V14-Q5 |
| P-03 | Run | фронт CMD_RUN_TO_R&D | как зелёная (D-01) | E4 | v1.4 §8, V14-Q3 |
| P-04 | StartingRun | фронт CMD_RUN_TO_R&D | abort (как D-03) | E4 | V14-Q12 |
| P-05 | Safe→R&D | фронт CMD_R&D_TO_SAFE | abort в Safe | E4 | V14-Q13 |
| P-06 | Safe→R&D | CMD_R&D_TO_RUN держится до прихода в R&D | не выполняется (нужен новый фронт) | E4 | V14-Q11 |
| P-07 | R&D | две команды TRUE (в т.ч. разные фронты) | ошибка, ни одна не выполняется; снятие — все FALSE 1 с | E4 | V14-Q8/Q10, Q-RC-04 |
| P-08 | любое, ошибка PLC | CMD_TRIGGER_EMERGENCY | Emergency | E4 | V14-Q9 |
| P-09 | R&D, зелёная нажата 200 мс | фронт команды | игнорируется и не откладывается | E4 | V14-Q14 |
| P-10 | ошибка PLC | BOTH кнопками | выполняется | E4 | Q-RC-18b |
| P-11 | любое | heartbeat остановлен 3 с | Emergency | E4 | V14-Q20 |
| P-12 | любое | STS_COVER_LOCKED; outPLC_RnD в StartingRun/abort/Safe→R&D | = NC1∧NC2; TRUE/TRUE/FALSE | E4 | V14-Q5, вопрос 78 |

## G. Config (7)

| ID | Исходно | События | Ожидается | Этап | Источник |
|---|---|---|---|---|---|
| G-01 | Safe, крышка закрыта | фронт Bypass | Config: C1+C2 ON, STO удержан, Unlock запрещён | E4 | V14-Q16 |
| G-02 | R&D / Safe с открытой крышкой / Bypass удерживался | Bypass | игнорируется | E4 | V14-Q16, Q-RC-05 |
| G-03 | Config | любые кнопки/PLC-команды | игнорируются; таймера 10 с нет | E4 | V14-Q16/Q17 |
| G-04 | Config | Bypass снят | Discharge → выдержка → C1/C2 OFF → Safe | E4 | V14-Q18 |
| G-05 | Config / выход из Config | NC1 / EStop / connector | Emergency | E4 | V14-Q19, Q-RC-03 |
| G-06 | Config | Healthy пропал | игнорируется | E4 | V14-Q19 |
| G-07 | вход в Config | C2_FBK не за 500 мс | откат в Safe; SafetyFault | E6 | Q-RC-06 |

## B. Старт и рестарт (3)

| ID | Исходно | События | Ожидается | Этап | Источник |
|---|---|---|---|---|---|
| B-01 | запуск группы | — | Emergency; энергии нет | E7 | Q-RC-10, SPEC §4 |
| B-02 | запуск при нажатых кнопках | отпускание, затем BOTH | подъём только после 1 с паузы | E7 | BOOT-002, TMR-1-Q1 |
| B-03 | рестарт из Run/перехода | Restart | только Safe, Run не восстанавливается | E7 | BOOT-001 |

## N. Реле аккумулятора C3/BMS — включение только по новой команде (19, Q-C3-1)

Критерии: `SafetyTests/program/analyst/Q-C3-1_CRITERIA.md`. BMS проверяется так же, как C3 (кроме C3-12/13 — независимость). «cmd» = пара Set/Reset от PLC (`in_C3_Manual_Set`/`in_RBM_Manual_Set`). C3-10 (команда в переходе Safe→R&D → нет ON) и ON в StartingRun/Run→R&D — рекомендации команды (D-TEAM-DEFAULTS); C3-19 — необязательный (PLC такую комбинацию не даёт).

| ID | Исходно | События | Ожидается | Этап | Источник |
|---|---|---|---|---|---|
| C3-01 | R&D, C3+BMS ON (cmd ON given in R&D) | in_Estop_PLC (variant: ES_NC_1 FALSE); cmd stays ON | Emergency; C3 and BMS OFF ≤50 ms; LV discharge at once, C1 OFF 2 s | Q-C3-1 | Niv #1 item 1, Q-ARCH-01 (E-02) |
| C3-02 | after C3-01, cmd C3/BMS held ON | EStop OK, green Restart → Safe, BOTH → R&D | C3/BMS OFF ≥3 s after R&D status and stay OFF (no ON at R&D-confirm scan) | Q-C3-1 | Niv item 2, Q-C3-1 |
| C3-03 | R&D, C3+BMS ON | green 0.6 s (R&D→Safe), cmd held ON; in Safe BOTH → R&D | OFF ≤50 ms after down accepted; OFF in Safe; OFF ≥3 s after R&D status | Q-C3-1 | Niv item 3, Q-C3-1 |
| C3-04 | end of C3-02 (R&D, held ON, outputs OFF) | cmd OFF 200 ms, then cmd ON (both channels) | ON ≤50 ms after the new edge; before the edge OFF | Q-C3-1 | Niv item 4, Q-C3-1 |
| C3-05 | R&D, C3+BMS ON | BOTH → Run (confirmed), stay 2 s, green → Run→R&D → R&D | C3/BMS ON continuously, no OFF scan | Q-C3-1 | Niv item 4 (unchanged), Q-C3-1 |
| C3-06 | Safe, cmd OFF | cmd ON in Safe, hold 3 s | C3/BMS OFF ≥3 s | Q-C3-1 | Niv item 5 (unchanged) |
| C3-07 | end of C3-06 (Safe, cmd ON given in Safe, held) | BOTH → R&D; after 3 s cmd OFF 200 ms → cmd ON | OFF ≥3 s after R&D status; ON ≤50 ms after new edge | Q-C3-1 | Q-C3-1 «данной в R&D/Run» |
| C3-08 | Run (stable), cmd OFF, C3/BMS OFF | cmd ON | ON ≤50 ms | Q-C3-1 | Q-C3-1 «в R&D/Run» |
| C3-09 | end of C3-02 (R&D, held ON, outputs OFF) | BOTH → StartingRun → Run, cmd still held; after 3 s in Run cmd OFF 200 ms → cmd ON | OFF through StartingRun and ≥3 s in Run; ON ≤50 ms after new edge in Run | Q-C3-1 | Q-C3-1 (CR-2) |
| C3-10 | Safe, cmd OFF | BOTH → Safe→R&D; cmd ON at (a) 100 ms after rise accepted, (b) R&D status −50 ms; held | OFF ≥3 s after R&D status (edge was not in R&D) | Q-C3-1 | Q-C3-1 «данной в R&D/Run»; status still Safe (Q-LED-3a context) |
| C3-11 | Safe, cmd OFF | BOTH → R&D; cmd ON at R&D status +50 ms | ON ≤50 ms after edge | Q-C3-1 | Q-C3-1 (boundary pair with C3-10b) |
| C3-12 | R&D, cmd OFF both | C3 cmd ON only; after 1 s BMS cmd ON; after 1 s C3 cmd OFF | C3 ON, BMS OFF; then both ON; then C3 OFF, BMS stays ON | Q-C3-1 | CR-7, CR-8 |
| C3-13 | after C3-01: C3 cmd held ON, BMS cmd OFF in Safe | BOTH → R&D; BMS cmd ON at R&D +1 s | C3 OFF ≥3 s (held); BMS ON ≤50 ms after its edge; C3 unaffected | Q-C3-1 | CR-2, CR-8 |
| C3-14 | R&D, C3+BMS ON | green 0.6 s (R&D→Safe); during R&D→Safe cmd OFF 200 ms → cmd ON; reach Safe; BOTH → R&D (held) | OFF from down acceptance, OFF in Safe, OFF ≥3 s in R&D | Q-C3-1 | CR-5 (reset-dominant, recRndC_SG), CR-2 |
| C3-15 | Run, C3+BMS ON | ES_NC_1 FALSE; in Emergency chain cmd OFF 200 ms → cmd ON; EStop OK, Restart → Safe → BOTH → R&D (held) | OFF ≤50 ms; OFF in Emergency; OFF ≥3 s in R&D | Q-C3-1 | Q-ARCH-01 (CR-4), CR-2 |
| C3-16 | R&D, C3+BMS ON (variant: Run) | cmd OFF | OFF ≤50 ms | Q-C3-1 | reference FBAnd12/FBAnd3 (unchanged manual off) |
| C3-17 | group start with cmd ON from scan 0 | Emergency → Restart → Safe → BOTH → R&D | OFF ≥3 s after R&D status | Q-C3-1 | Q-C3-1 (held through Emergency; catalog rule 2) |
| C3-18 | end of C3-02 path but cmd OFF in Safe before rise | BOTH → R&D (cmd OFF); cmd ON at R&D +1 s | OFF until edge; ON ≤50 ms after edge | Q-C3-1 | Q-C3-1 |
| C3-19 | R&D, C3 OFF; non-PLC combination | Set=T while Reset=T (200 ms), then Reset=F with Set held | OFF throughout and ≥3 s after Reset falls | Q-C3-1 | Q-C3-1 literal (Set fires only on Set FALSE→TRUE); TD-safety; optional (PLC never produces) |

## M. Мутации (12 критичных защит)

Для каждой — мутация «условие убрано/инвертировано» и убивающий сценарий:
EStop NC1/NC2 → E-01; in_Estop_PLC → E-02; NC1∧NC2 в подъёме HV → C-02; NC в Run → C-04;
connector → C-09; STO снимается только при принятом подъёме → U-03; C2 ON только при
принятом подъёме → U-03; Unlock запрещён в Run → K-11; Restart только в Safe → E-04;
FBK-подтверждение Run → U-04; LV полярность → H-01; DOWN-порядок STO<Discharge<C2 → D-02.

## Итого

**109 сценариев** (K11+C10+E12+U9+D9+H7+W10+P12+G7+B3+N19; прежняя цифра «100» — ошибка подсчёта) + 1 структурная проверка + 12 мутаций.
По этапам: E2 ≈ 45, E3 ≈ 14, E4 ≈ 20, E5/E6 ≈ 15, E7 = 3 (часть сценариев — в нескольких этапах).

## Что уходит в архив (не удаляется из git)

- 14 файлов прототипов/моделей и 16 исторических `sal-*` — не проверяют текущий SAL.
- 13 из 16 самопроверок стенда (остаются: семантика FB, runtime, delta/CRC).
- Существующие `current-*` и `current-e2*` — после переноса нужных сценариев в каталог.
- Структурные слепки (SHA/ID портов/порядок), скановые свипы q−1/q/q+1, тесты «ради мутаций».
- Решения TD-02…TD-15 о скановых допусках теряют смысл при допуске ±50 мс.
