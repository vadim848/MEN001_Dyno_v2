# E4-v14 — трассировка TotalControl v1.4 и скриншотов против действующих требований и canonical SAL

Срез / роль / дата: E4-v14 / v2-analyst / 2026-10-21. Подготовительный анализ,
без реализации. SAL/SGVL/PLC/тесты не менялись; SCENARIO_DECISIONS не менялся.

## Источники и SHA256

| Источник | SHA256 / commit |
|---|---|
| canonical SAL `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal` (CRC 1997263000) | 34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b |
| canonical SGVL `GVLs/GVL1.sgvl` | 517fdadd913007aa2690f1402676583ad16141c9ae64cb986554c87c10f22635 |
| canonical diagram | 7b5eb79439011cdf9a3206aa815dec4349a35cf8155bfac7492b7ffd75e578ce |
| v2 PLC `PLC_Dyno/POUs/MAIN.TcPOU` | 873d34ff21d9594cd2a25547cba735808802906080b2c8280aabd9a9cd7dcd7e |
| v2 PLC `DUTs/E_SafetyState.TcTLEO` | 6e4fda3709bbc9750e6547cad1534fde47d489e22a1fe1756154da989fb2c9f0 |
| v1.4 PDF | fe6ce64b8b8a942ee6445feff8781369f1c8ed00c9d6aaa37918350575dfdcb4 |
| jpeg таблица переходов (11.33.56) | ce358cd426420d2e61a81f71407fe216ca9034972809a2d99de1bbe40d101d99 |
| jpeg act_LogicMap (11.37.41) | 2d964dfa0c6ad8d2b50c1ae0150def891f907025059cdb0683ac894f705fa049 |
| SCENARIO_DECISIONS.md (прочитан) | 62be6ebf94fbcb0416bf0c0844cef9852db819ac23ac732d3375704edc1ada73 |
| SOFTWARE_ACCEPTANCE_SCOPE.md | 132e39ed4fe3f20fd8a642f7b10a3a3b9b94b3c42dc7280a57e3e2204d360dfb |
| SAFETY_STATE_MACHINE_SPEC.md | c065c7d2437b42a1ce5e2982309f17fc086d35a2ef6a0870b9ecc7957b3b2472 |
| reference | MEN001_Dyno 4495a1f6049f6a58ebfd436761faa84d17c8d643 (git archive в scratchpad, ветка не переключалась); reference SAL sha256 efddc60b…c334, CRC 197137056 |

Метод: `src/sal-parser.js` + `src/signal-bindings.js` (читатели/писатели
переменных, contact `Break Contact (NC)` = прямой, `Make Contact (NO)` = инверсия —
соглашение стенда, sal-runtime.js:69–77; семантика FB официально подтверждается
E0, здесь не доказывается). Это структурное чтение кода: динамические выводы
ниже помечены «структурно» и требуют проверки тестировщиком.

Обозначения статуса: **СОВП** — совпадает; **РАСХ** — расходится с решением
Вадима/кодом; **НОВОЕ** — нет ни в решениях, ни в коде; **НЕ ПОКР** — есть в коде
или решениях, но v1.4 не говорит; **ПРОТИВ** — внутреннее противоречие.
Приоритет: решения Вадима → SPEC §§19–20/SCOPE → reference → v1.4 (не нормативен
до подтверждения Вадима по каждому пункту, вопрос 1 ведущего).

## 1. Факты canonical SAL по PLC-сигналам (структурно)

Полярность = уровень программной переменной, не электрика.

| Сигнал | Потребители (порт: контакт) | Смысл в программе |
|---|---|---|
| `in_Estop_PLC` (PLC_IO/IN_ESTOP_PLC) | N1/FBAnd1.AndIn1 NOT → FBEstop1.EStopIn3 (master пары 3/4) и 4 SetPermit.AndIn4; N2/FBAnd5 NOT; N6/FBAnd10 NOT; N1/FBAndLvCurrentPermit NOT; N1/FBAndUnlockHold NOT; GATE_001 NOT | TRUE = аварийный запрос PLC. Защёлка FBEstop1, Restart = `in_Reset_PB`. Совпадает с reference (там 3 потребителя: N1/FBAnd1, N2/FBAnd5, N6/FBAnd10); v2 добавил permit/unlock guards |
| `in_Mentee_EStop` | FBEstop1.EStopIn4 (slave пары 3/4, эффективно инвертирован по master — MENTEE_PROGRAM_CONTRACT поправка 03B); N2/FBAnd5 NOT; N6/FBAnd10 NOT; 4 SetPermit NOT; N12/FBAnd15 NOT; N10 диагностика | TRUE = запрос Mentee; участвует в защёлке FBEstop1 (native pair) |
| `inPLC_RnD_Mode` (bit1), `inPLC_RnD_Mode_2` (bit2) | см. §3 ниже: N2/FBAnd61/81→91, N12/FBAnd8/9/10, N12/FBAnd12/13/14, N6/FBAnd15/16/17, N1/FBAnd9..12→FBAnd2/3 | Уровневое декодирование 2-битного кода без фронта; отсутствуют в reference (v2-добавление) |
| `inPLC_BypassC1C2` | N1/FBAnd4.AndIn1 (прямой) → FBAnd5 (∧¬out_LV_C1)→FBOr17→FBAndLvSetPermit→FBRs1.Set (`out_LV_C1`); FBAnd6 (∧¬out_HV_C2)→FBOr18→FBAndHvSetPermit→FBRs2.Set (`out_HV_C2`); FBTon1 10 s → FBAnd7/8 → FBOr11/FBOr16 (Reset) | Один PLC-бит запрашивает Set обоих контакторов C1/C2 через только «текущие» permits (EStop/NC/connectors/Mentee/PLCstop), без режима/жеста; авто-сброс через 10 с. В reference нет (алиасы IN_Bypass1/2 без потребителей) |
| `in_Door_Monitor` | N2/FBAnd8 (inv), N12/FBAnd11→FBAnd2 (Unlock grant), N12/FBAnd17→FBAnd3 (Unlock reset) | Только unlock-логика (D-DOOR-INTERLOCK) |
| `in_InterLock_NC_1/2` | N2/FBAnd1.AndIn5/6, N6/FBAnd9.AndIn2/3, N1/FBAndLvCurrentPermit.AndIn4/5, N12/FBAnd16.AndIn1/3, GATE_001.AndIn5/6 | Энергетический guard обоих up; в Run — защитная цепь N6 |
| StatusToPLC | outPLC_C1_FBK, C2_FBK, EStop_MantiRob, EStop_NC1/NC2 (это `in_ES_NC_1/2`, не InterLock), HV/LV_Healthy, HV/LV_Interlock (connectors), STO_1/2; плюс out_Step1..6, outPLC_RnD, out_Step12, out_Safety_Armed, out_EStop_Status, out_Estop_OK, out_ReadyForStep2, out_TransitionStep | Статуса InterLock NC1/NC2 (cover) нет; состояния кнопок нет |
| Unlock writer | `out_Door_Unlock_Solonoeid` ← N1/FBAndUnlockHold: ¬in_Estop_PLC ∧ in_Relase_Door_PB ∧ ¬in_Reset_PB ∧ b_EStop_Ok ∧ FBRs6 | Ни одна комбинация PLC-битов не открывает крышку без физической синей (структурно) |

## 2. Построчная трассировка v1.4 §2–§9 и скриншотов

| # | v1.4 / скриншот | Статус | Действующий источник / код | Следствие |
|---|---|---|---|---|
| T01 | §2 Термины: Standard Safe→Run, Standard R&D→R&D, новый Safe, Emergency | СОВП | SPEC §2; в коде Run = Step3/`out_Safety_Armed`, PLC enum «Armed» | Синоним Armed=Run |
| T02 | §3 Три кнопки: красный E-STOP, зелёная SAFETY RESET, синяя RELEASE LOCK | СОВП | SPEC §3; `in_ES_NC_1/2`, `in_Reset_PB`, `in_Relase_Door_PB` | — |
| T03 | §3 Dual press = UP одна ступень | СОВП | Решения Вадима №3, №4 (250 мс, BOTH 1 с, одна ступень); BTN-005/006 | Документ оставляет тайминг открытым (§9) — у нас решено, не спрашивать |
| T04 | §3 «Short press SAFETY RESET = DOWN» | РАСХ (формулировка) | Решения Вадима №1, №5: зелёная непрерывно 0,5 с, «короткого нажатия недостаточно»; предложения Нива о коротком Reset отменены | Действует решение Вадима; v1.4 не меняет. Сообщить Вадиму как информацию, не вопрос |
| T05 | §3 RELEASE LOCK alone = open cover где разрешено; всегда требуется | СОВП | Решение №2 (blue 0,5 с), SPEC §5 п1, CVR-001/002 | — |
| T06 | §3 EMERGENCY STOP = emergency | СОВП | EMG-001 | — |
| T07 | §3 Note: UP физически или PLC, только при closed+locked; открытие только физически | Частично | UP от PLC: QP (только устойчивый R&D, теперь «на пересмотре»); от Safe — расширение; closed+locked=NC1∧NC2 — вопрос 5 ведущего; открытие только физически — СОВП (Unlock writer требует синей) | Критерий C08 READY; позитивы PLC BLOCKED |
| T08 | §4 Emergency: обесточено, защёлка, крышка закрыта; вход: физ. E-Stop, PLC, Mentee, watchdog | Частично | Физ./PLC/Mentee — FBEstop1 пары 1/2 и 3/4 (СОВП, EMG-001/006); watchdog — НОВОЕ, входа нет | §7 ниже |
| T09 | §4 Safe достигается «dis-engage the physical E-Stop (from Emergency)» | РАСХ | Решение Вадима №12: после EStop зелёная = FBEstop1.Restart (`in_Reset_PB`); SPEC §12 (снята энергия, feedback, квитирование) | Вопрос Q-E4V14-01 |
| T10 | §4 R&D: PS1 + battery + BMS включены, HV выкл.; PS2 HEALTH игнорируется; крышка открываема | Частично | PS1/LV C1 — MOD-001; battery C3 / BMS в коде включаются PLC-командами `in_C3_Manual_Set`/`in_RBM_Manual_Set` (N6/FBAnd5..8 в Run, FBAnd11..14/20..22 в R&D), не автоматически при входе; HV_Healthy читается N5/FBAnd3 (исходная последовательность), N6/FBAnd9 (только Step3), N7, N12/FBAnd6 (подтверждение StartingRun) — в устойчивом R&D не потребляется (структурно); крышка в R&D — CVR-002/003 СОВП | Battery/BMS — вопрос Q-E4V14-06; PS2 ignore — критерий C13 PENDING-V14 |
| T11 | §4 Run: полная мощность, крышка закрыта/заперта, RELEASE LOCK отклоняется | СОВП | SPEC §5 п3, EMG-007, CVR-001 | — |
| T12 | §4 R&D: dual press **или PLC из Safe**; Run: dual press или PLC из R&D; только closed+locked | РАСХ/НОВОЕ | QP (2026-10-21) — PLC достаточно только в устойчивом R&D, обе кнопки отпущены; Вадим поставил QP на пересмотр (E4). PLC Safe→R&D в QP не было | Позитивы BLOCKED (вопросы 1–2 ведущего, Q-E4V14-02..05) |
| T13 | §4 Свободный переход между состояниями без Emergency | СОВП | SPEC §4 | — |
| T14 | §5 Принцип: PLC может запросить любой переход; решает TwinSAFE; PLC не обходит gates | СОВП с SPEC §14/§17, MOD-007; **РАСХ с кодом** | `inPLC_BypassC1C2` — один PLC-бит запрашивает Set C1 и C2 без режима/жеста (SPEC §17: «Ни один одиночный PLC-бит не может непосредственно включить опасную энергию») | Критерий C09 READY; судьба сигнала — Q-E4V14-07 |
| T15 | §5 UP при открытой крышке отклоняется — ignored | СОВП (для кнопки) / требует проверки (PLC) | SCENARIO_DECISIONS: «Safe/R&D, крышка открыта, новый запрос вверх — состояние не меняется, fault нет»; SPEC §5 п7/11; CVR-004 (оба up маршрута, включая PLC). Код: PLC 10 в Safe → N2/FBAnd91 (только Step1 ∧ код) → `b_Step12_Set` — на уровне запроса InterLock не проверяется; энергия LV блокируется FBAndLvCurrentPermit. Возможна смена шага без энергии (структурно, не доказано) | Критерии C04, C05 READY |
| T16 | §5 Выход из Run требует подтверждённых нулевой скорости и нулевого тока | НОВОЕ | В SAL нет входов скорости/тока; утверждено SS1 2 с → STO → coast 5 с → разряд → C2 OFF (D-RUN-STOP-WAITS) | Вопрос 3 ведущего (не дублирую); C17 BLOCKED |
| T17 | §5 Открытие крышки и снятие аварии — только физически | СОВП | EMG-006, SPEC §12; Unlock writer требует синей | C07, C08 READY |
| T18 | §5 TwinSAFE сообщает PLC статус cover/latch | НОВОЕ | Нет выхода статуса InterLock NC; `outPLC_EStop_NC1/2` — это кнопка E-Stop, `outPLC_*_Interlock` — разъёмы | Вопросы 2 и 5 ведущего; C18 BLOCKED |
| T19 | §5 Emergency→Safe: engage/dis-engage физ. E-Stop; PLC нет; одинаково, нажимали ли гриб; крышка закрыта до RELEASE LOCK | PLC нет — СОВП; жест — РАСХ | Решение №12 (зелёная → FBEstop1.Restart), SPEC §12 | Q-E4V14-01 |
| T20 | §5 Safe→R&D: dual или PLC; LV (PS1+battery+BMS); только closed+locked; HV off | см. T10, T12, T15 | — | — |
| T21 | §5 R&D→Run: dual или PLC; cover-gated | Частично | Код: 11 → N12/FBAnd8/9/10 → FBOr1 (∥ физ. `recRndC_SU`) → FBDecouple3 → FBAnd4 (b_Step_RnD ∧ NC1∧NC2) → `b_Set_HV_C2_1`. Наблюдение: DecOut2 → `b_Set_Transition_3` → N1/FBOr15 без условия R&D (код 11 в любом режиме доходит до этого запроса; эффект не проверен) | C05 READY, C12 OBSERVE |
| T22 | §5 Run→R&D: short green; PLC да; ноль скорости/тока до снятия HV | Частично | Жест — решение №5 (0,5 с). Код: 01 ∧ Step3 → N6/FBAnd15/16/17 → FBOr5 (∥ физ. зелёная N6/FBAnd23) → FBDecouple2 (reset STO, discharge request, reset C2 + Ton1). SS1 по E3 ещё не реализован | C17 BLOCKED (вопрос 3 ведущего) |
| T23 | §5 R&D→Safe: short green; PLC да | РАСХ с кодом | Код: 00 ∧ R&D → N12/FBAnd12/13/14 → FBOr2. FBAnd14.AndIn4 = `in_False_SI2_CH8` **прямой** контакт (во всех прочих местах — инверсный), т.е. при FALSE ветвь недостижима (известно с 2026-10-19). PLC-пути R&D→Safe в canonical фактически нет | Q-E4V14-02 (00 = idle или R&D→Safe) |
| T24 | §5 Open cover: только синяя; Safe, R&D; отклонено в Run и Emergency | СОВП | CVR-001/002, EMG-007 | — |
| T25 | §5 Any→Emergency: E-Stop/PLC/driver/watchdog; PLC да; защёлка; восстановление физическое | Частично | E-Stop/PLC/Mentee СОВП (FBEstop1); watchdog НОВОЕ; жест восстановления — Q-E4V14-01 | C06, C07 READY |
| T26 | §6 Вход в Emergency: 4 источника, результат одинаков и защёлкивается | Частично | 3 из 4 через одну защёлку FBEstop1 (native pair семантика принята в 03B/R3; E0 переподтверждает по документации Beckhoff) | — |
| T27 | §6 Не физический источник: гриб не нажат, восстановление всё равно физическое | РАСХ (жест) | Текущий restart = зелёная, нажатие гриба не требуется | Q-E4V14-01 |
| T28 | §6 Шаг 1: engage/dis-engage гриба снимает защёлку → сразу Safe | РАСХ (жест) / СОВП (только Safe) | SPEC §12 п6 «только Safe, никогда автоматически R&D/Run»; условия §12 пп1–5 v1.4 не упоминает — SPEC сохраняется | Q-E4V14-01 |
| T29 | §6 Шаг 2: открытие крышки синей — физически | СОВП | CVR-002 | — |
| T30 | §6 Шаг 3: «Both UP-steps are physical only» | ПРОТИВ (внутри v1.4: §5/§8 разрешают PLC UP) | Остаток v1.2 (§10) | Вопрос 4 ведущего (не дублирую) |
| T31 | §6 Крышка заперта всё время Emergency; открываема только в Safe синей | СОВП | EMG-007, CVR-001 | — |
| T32 | §7 Heartbeat PLC↔TwinSAFE; потеря → автономный Emergency | НОВОЕ | Входа heartbeat нет. **Не путать** с E6 watchdog Вадима (C1/C2 feedback 500 мс, Healthy 30 с) | Q-E4V14-08; C16 BLOCKED |
| T33 | §7 Восстановление после watchdog-аварии = физическое | следует T19 | — | Q-E4V14-01 |
| T34 | §7 Таймаут — PLACEHOLDER | НОВОЕ, не задан | — | Q-E4V14-08 |
| T35 | §8 «Сейчас PLC видит только состояние кнопок» | Неточно | SAL экспортирует 11 StatusToPLC + шаги/режимы (§1); кнопки не экспортируются в SAL | Информация |
| T36 | §8 #1 CMD_RUN_TO_R&D | Частично | SAL: код 01 ∧ Step3. PLC CASE Armed→RnD пишет **10** (не 01) | §3 ниже; Q-E4V14-02 |
| T37 | §8 #2 CMD_R&D_TO_SAFE | РАСХ с кодом | Код 00 в R&D — ветвь мертва (T23); 00 = значение по умолчанию PLC | Q-E4V14-02 |
| T38 | §8 #3 CMD_SAFE_TO_R&D | Частично | SAL: код 10 ∧ Step1 (уровень) | C01, C04 READY; позитив BLOCKED |
| T39 | §8 #4 CMD_R&D_TO_RUN | Частично | SAL: код 11 ∧ R&D (уровень) | C02, C05 READY; позитив BLOCKED |
| T40 | §8 #5 CMD_TRIGGER_EMERGENCY, защёлка, не снимается PLC | СОВП | `in_Estop_PLC` → FBEstop1; снятие только Restart | C06, C07 READY |
| T41 | §8 #6 STS_COVER_LOCKED (read-only) | НОВОЕ | SPEC §14 называет его «возможным будущим расширением» | Вопросы 2, 5 ведущего |
| T42 | §8 «Each signal individually addressable» | РАСХ с кодом | Сейчас 2-битный уровень; новые сигналы = изменение process image группы, запрещено AGENTS.md без разрешения | Вопрос 2 ведущего; при «нет» — Q-E4V14-02/03 |
| T43 | §8 Note: UP с открытой крышкой молча отклоняется, «exactly as a button press» | СОВП | см. T15; для кнопки после восстановления нужен новый жест (EMG-003) | C04 READY |
| T44 | §9 Все программные переходы — запросы PLC, исполняет TwinSAFE | = T14 | — | — |
| T45 | §9 Hardwired E-Stop не меняется; PLC-авария дополнительна, E-Stop не через PLC | СОВП | `in_ES_NC_1/2` → FBEstop1 пара 1/2 напрямую; PLC — отдельная пара 3/4 | — |
| T46 | §9 Любой переход со снятием HV — ноль скорости/тока | = T16 | — | вопрос 3 ведущего |
| T47 | §9 Без нового железа; изменения TwinSAFE/PLC software **and configuration** | РАСХ с объёмом | AGENTS.md: group/target/process image не менять | вопрос 2 ведущего |
| T48 | §9 Обновить электрические схемы | вне объёма | — | — |
| T49 | §9 Подтвердить: таймаут watchdog; тайминг dual press; R&D с полным LV согласован с аварийным сбросом | Частично | Тайминг решён Вадимом (250/1000/500/2000); watchdog — Q-E4V14-08; LV/emergency drop — Q-E4V14-06 | — |
| T50 | §10 История версий | Не нормативна | Объясняет T30 (v1.2 physical-only UP) и снятие Post-E-Stop состояния в v1.3 | — |
| S1 | jpeg 11.33.56 — таблица переходов | СОВП с PDF §5 | Единственное отличие: Safe→R&D «Yes — cover-gated» (PDF «Yes»), текст условий идентичен — смысл тот же | — |
| S2 | jpeg 11.37.41 — PLC `MAIN.act_LogicMap` | Идентичен v2 MAIN.TcPOU стр. 118–157 (сверено) | См. §3 | Q-E4V14-02/03 |
| — | Не покрыто v1.4 | НЕ ПОКР | `inPLC_BypassC1C2` (Q-E4V14-07); `in_Safety_Run` (PLC RUN → N3/FBAnd1, BOOT); PLC-команды C3/BMS manual (Q-E4V14-06); `in_Door_Monitor` (только unlock, D-DOOR-INTERLOCK); DoorMonitor/Solenoid в PLC LED-логике | — |

## 3. 2-битный код PLC: таблица против CASE против SAL

PLC (v2 MAIN = скриншот): `n_SafeSate : INT` объявлен в MAIN, **в PLC-коде
не присваивается нигде** (поиск по POUs/GVL/VISU); enum `E_SafetyState`:
RnD_2_Safe=0, Safe_2_RnD=1, RnD_2_Armed=2, Armed_2_RnD=3. CASE без ELSE,
выполняется каждый цикл MAIN (`act_LogicMap()` в MAIN:49).

| Функция | Комментарий-таблица (bit1,bit2) | CASE пишет | Декодирование canonical SAL (структурно) |
|---|---|---|---|
| Safe→RnD | 1,0 | 1,0 | 10 ∧ b_Step1 → N2/FBAnd91 → N2/FBOr1 (∥ физ. linkSafeAcceptedUp) → `b_Step12_Set`, Transition_1, SetLock_ResetPB_1 |
| RnD→Armed | 1,1 | 1,1 | 11 → N12/FBAnd10 → FBOr1 (∥ физ. recRndC_SU) → FBDecouple3 → FBAnd4 (∧ b_Step_RnD ∧ NC1∧NC2) → `b_Set_HV_C2_1`; DecOut2 → `b_Set_Transition_3` (без R&D) |
| RnD→Safe | 0,0 | 0,0 | 00 ∧ b_Step_RnD → N12/FBAnd14 — недостижимо (AndIn4 = прямой `in_False_SI2_CH8`) |
| Armed→RnD | **0,1** | **1,0** | 01 ∧ b_Step3 → N6/FBAnd17 → FBOr5 (∥ физ. зелёная) → FBDecouple2 (STO reset, discharge request, C2 reset). Код 10 в Step3 этот путь не запускает |
| (не названо) | — | — | 00 ∧ out_Step3 → N1/FBAnd2/3 → FBOr13/12 → `out_SS1_DR1/2`. В reference `out_SS1 = out_Step2 ∨ out_Step3`; в v2 Run-разрешение SS1 дополнительно требует код 00. Любой ненулевой код в Run снимает разрешение SS1 (по ARCHITECT.md: SS1 TRUE = разрешение Run, FALSE = SS1) |

Выводы (структурные, для проверки тестировщиком; не доказанные дефекты):

1. **Противоречие таблица/CASE для Armed→RnD.** SAL и существующие тесты
   (sal-rundown-baseline/outputs: `inPLC_RnD_Mode_2: true`) следуют таблице (01).
   CASE пишет 10. При CASE как есть: в Run код 10 снимает SS1-разрешение
   (N1/FBAnd2/3), но не запускает последовательность N6 (нужен 01) — частичная
   реакция: Step3 сохраняется, SS1 снят, STO/discharge/C2 не начинаются, R&D не
   достигается. Это уже отмечено 2026-10-19 в SCENARIO_DECISIONS («комментарий не
   является доказательством программы»).
2. **Уровень, а не событие.** PLC переписывает пару каждый цикл из сохранённого
   `n_SafeSate`; SAL декодирует уровнем без R_TRIG. Следствия (структурно):
   (a) 10 удерживается → после любого возврата в Safe (зелёная R&D→Safe) условие
   10 ∧ Step1 снова истинно → повторный Safe→R&D без нового события — нарушает
   MOD-003 и no-up oracle (SCENARIO_DECISIONS, раздел «Дополнение no-up oracle»,
   проверялся только при PLC 00);
   (b) 11 удерживается → после Run→R&D повторный R&D→Run;
   (c) 01 удерживается → после повторного входа в Run немедленный Run→R&D и
   снятие SS1;
   (d) 11 удерживается в Run → SS1-разрешение снято на всё время Run, начатого
   по PLC (Run, но SS1 активен) — неоднозначное состояние для MOD-006.
3. **Idle = 00 = «RnD_2_Safe».** По умолчанию `n_SafeSate=0` → CASE постоянно
   пишет 00. В canonical SAL 00 фактически служит нейтральным кодом: в R&D путь
   00 мёртв, в Run 00 — условие SS1-разрешения. Если ветвь «00 в R&D = R&D→Safe»
   сделать рабочей при уровневом декодировании, idle 00 постоянно сбрасывал бы
   R&D в Safe (R&D недостижим по PLC/кнопкам при 00). Значит, 00 не может
   одновременно быть idle и командой R&D→Safe — нужен ответ Вадима (Q-E4V14-02).
4. **Промежуточные коды.** CASE пишет оба бита в одном цикле PLC; переходы
   Safe_2_RnD→RnD_2_Armed (10→11) и RnD_2_Armed→Armed_2_RnD по CASE (11→10) меняют
   один бит. По таблице 11→01 — один бит; 11→00 и 10→01 — два бита. Доставляются
   ли оба бита в TwinSAFE атомарно (один кадр process image) — факт конфигурации,
   не исследуется (AGENTS.md). Если не атомарно, переходный 01 в Run запустит
   защёлкиваемую N6-последовательность за один скан, 10 в Safe — Safe→R&D.
   Это довод за событийный протокол с проверкой стабильности кода; выбор
   механизма — архитектор после ответов Вадима.
5. **PLC-запрос в Safe не проверяет InterLock на уровне запроса** (N2/FBAnd91:
   только Step1 ∧ код), энергия блокируется позже (FBAndLvCurrentPermit). v1.4
   и действующее «состояние не меняется» требуют отказа без смены шага → C04.

## 4. Прежние PLC-решения: что v1.4 подтверждает / заменяет / оставляет открытым

Все они 2026-10-21 поставлены Вадимом «на пересмотр» (E4) и не являются oracle
до его подтверждения. Таблица — вход для вопроса 1 ведущего, не решение.

| Решение | v1.4 | Итог |
|---|---|---|
| QP: в устойчивом R&D нового PLC-запроса up/down достаточно, физ. жест не нужен, guards сохраняются | Подтверждает и **расширяет** на Safe→R&D (UP из Safe) и R&D→Safe | При подтверждении v1.4 — QP заменяется более широким правилом; расширение на Safe — новое |
| QP-уточнение: PLC-запрос игнорируется, если хотя бы одна кнопка нажата; отпускание не исполняет старый запрос | Не упоминает | ОТКРЫТО → Q-E4V14-04 |
| Fresh-event / no-repeat (удерживаемый код не повторяется) | Косвенно («request», «individually addressable»); явно не говорит | Норматив MOD-003 (SPEC §20) действует независимо; механизм — архитектор |
| No-queue (отклонённый запрос не исполняется позже) | Для открытой крышки: «rejected — ignored», «silently rejected exactly as a button press» | Для крышки подтверждает; для прочих отказов (нажатые кнопки, переходная фаза) — MOD-004/QP, на пересмотре |
| Handshake/strobe | Не упоминает; вместо этого — отдельные сигналы + STS_COVER_LOCKED | ОТКРЫТО (вопрос 2 ведущего) |
| Q-PLC-REQUEST (PLC без физ. жеста?) | Да, для всех 4 ступеней; противоречит собственному §6 шаг 3 | Ответ по существу дан QP; противоречие — вопрос 4 ведущего |
| Мигание ламп как guard | Не упоминает | Закрыто Вадимом ранее («Верно»: не guard) |
| PLC не снимает Emergency (EMG-006) | Подтверждает | СОВП |
| D-DOOR-INTERLOCK (NC1∧NC2 для энергии) | «closed + locked» | Вопрос 5 ведущего + уточнение Q-E4V14-09 |

## 5. Затронутые ID

Центральные: MOD-003, MOD-007, CVR-004, EMG-006. Связанные: MOD-002, MOD-004,
MOD-006, MOD-001, MOD-005, MOD-008, EMG-001, EMG-002, EMG-003, EMG-007,
EMG-011, CVR-001, CVR-005, STP-001..004, BOOT-001. Критерии — CRITERIA.md.
