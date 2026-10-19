# Следующие проверки всех41 обязательных ID

2026-10-19. Срез ПОСЛЕ принятой07, checkpoint c69bc32. Прочитаны актуальные
WORK_STATUS_AND_PLAN, SOFTWARE_ACCEPTANCE_SCOPE, SPEC, SCENARIO_DECISIONS,
OPEN_SCENARIO_SOURCE_REVIEW, DISCHARGE_PROGRAM_CONTRACT и reference phase
доказательства. Рабочая03B уже редактируется, но НЕ принята и здесь не
засчитывается. Нормативные требования, SAL и тесты не меняются.

Покрытие принятой базы:01/02/B1-R2/03A/03C/04/05/06/07. Последний принятый
срез SALbf110ab452a5d9d3fcafd1acc5ab657b993e3e2828f384a63c1491c57b2cdcc6,
SGVL508610b92e60ae602a75952113b34f7a8bd9c3f283fbb93dfa45b6a532f0a3ba;
174/75/112 tests PASS,172PASS/29FAIL/5NV cases. Это исторический baseline
к текущей непринятой03B, не новые результаты. PASS частного случая не закрывает ID.

## Легенда ближайших малых пакетов

- B: завершить03B physical R&D integration, настоящий SAL+SGVL/order/causal
  tests и независимое ревью. Затем отдельно Safe/Run recognizer equivalence,
  если их действующие ветви не выполняют те же требования.
- L: accepted launch→early STO по EARLY_STO_PROGRAM_PLAN, separate Run
  confirmation; сначала red tests и review ordering/Reset/permissions.
- E: emergency owner и phase matrix: реальное достижение фаз, источник
  аварии, запрет команд/Unlock, продолжение снятия, восстановление.
- S: startup/ownership: программный group lifecycle, Network4 semantics,
  one-hot и реальные handoff/reset связи; не подменять seeded состояниями.
- U: полная штатная последовательность Safe↔R&D↔Run, каждый feedback и
  разрешение; исходные battery/BMS/source операции сохраняются по reference.
- D: нормальная остановка/разряд/coast, после согласования только неизвестной
  completion/отказной части. Известные отрицательные ограничения тестировать уже.
- A: cover access: существующие Door solenoid consumers, hold/arming,
  устойчивая открытая крышка, все emergency/transition ограничения.
- P: самостоятельный PLC request policy после ответа; raw held bits не
  считать новым request/handshake. Не удалять старый канал без решения.

Каждый пакет начинается actual-source red tests и structural audit всего
SAL/SGVL до cut; внедрение и независимое ревью отдельно. Эти коды — worklist,
не утверждение очередного решения реализации или права менять fixed timers.

## Реальные вопросы поведения — не задавать повторно известное

| Код | Только необходимый ответ пользователя | Что уже задано и не спрашивается |
|---|---|---|
| QP | R&D, физические кнопки отпущены, обаNC/прочие permissions healthy: новый Run11 после10 либо Safe00 сам запускает переход или ждёт физический жест? | Удерживаемый PLC код не новое событие; TwinSAFE проверяет permissions. Вопрос уже задан, ответа нет |
| QT | Новый полноценный green после очистки во время принятого StartingRun: ignore или abort-down; если abort — endpoint/completion | Новый up в переходе запрещён; late-second не rollback; реальная авария приоритетнее |
| QF | Вне startup/handoff недопустимое основное владение: Emergency или TransitionFault и какой recovery? | Safe+Run одновременно запрещены; исходный all-zero startup может установить Safe, не автоматически fault |
| QD | После исходной выдержки discharge завершать по timed процедуре или ждать отдельного программного подтверждения; если ждать — что является успехом? Затем только недостающие C2/discharge команды при отказе и ручной выход | Порядок discharge доC2OFF; R&D после C2OFF; timeout→TransitionFault/UnlockFALSE/latch/noauto уже задан. Не invent completion вход, новый timeout или polarity |
| QR | Новый valid BOTH в Run сам начинает down или игнорируется? | Не является up; chord не превращается в single; down имеет приоритет если его запрос действительно существует |

Release filter2с остаётся рабочим сохранённым значением/предварительным
параметром: не требовать повторного решения, чтобы проверить заданную логику.
Ответ о новом числе нужен ТОЛЬКО при предложении его изменить. Single0.5,
both1, inclusivewindow250, Q500 single priority, late before/after acceptance,
Door onlysolenoid/обаInterLock дляenergy и earlySTO уже согласованы.
Отдельный locked feedback отложен, не hidden NV. Вопросов о marker names,
native wire wrappers, group startup семантике или Network4 пользователь не
должен решать вместо технического исследования.

## Матрица41 ID

«Нет» в вопросе означает: текущий gap — работа с кодом/стендом, а не ожидание
пользовательского разрешения. Вопрос блокирует лишь зависимое поведение.

| ID | Что осталось после принятых пакетов | Ближайший пакет проверки | Нужен ответ |
|---|---|---|---|
| EMG-001 | Все источники/фазы, начало аварии по настоящей цепи, не только seeded | E: вход аварии до/во время/после каждого перехода | Нет |
| EMG-002 | Полное latched поведение обоих externalNC вне Set guards | E: каждый канал отдельно, restore без квитирования | Нет |
| EMG-003 | Safe connector absent: nofault/upban/newgesture после возврата | U+B: healthy/отсутствует каждый/восстановлен без нового жеста | Нет |
| EMG-004 | R&D/переход/Run connector loss и аварийное владение | E: обе connector потери во всех послеSafe фазах | Нет |
| EMG-005 | Возврат всех защитных входов не отменяет аварийную последовательность | E: прерываемые fault/restore traces до окончания | Нет |
| EMG-006 | Полное ручное восстановление толькоSafe с подтверждениями; PLC не квитирует за оператора | E+S: complete recovery, held/stale commands | QF/QD только для новых conflict/discharge fault path; общий запрет рестарта известен |
| EMG-007 | После07 NC1/PLC Safe/R&D остальные источники, все переходы/энергия | A+E: полный actual owner/Unlock matrix | Нет для запрета; QD для определения завершения новой discharge ветви |
| EMG-008 | Healthy loss во времяSS1 без предварительной общей задержки | D: fault на разных точках SS1, firstscanSTO | Нет; программную семантику Healthy сверить по коду |
| EMG-009 | Coast не сокращается от восстановленияHealthy, SS1 не возвращается | D: fault/restore перед/на/после порога заданного timer | Нет |
| EMG-010 | Real discharge→C2OFF→feedback→R&D и отказная ветвь | D: сохранённые операции плюс согласованный completion | QD |
| EMG-011 | После LV/HV9guards ещё STO/otherraises, аварийный owner | L+E: реальные remaining producers с paired firstfault controls | Нет |
| EMG-012 | Full conflict detector/назначение fault и восстановление | S: все invalid combinations, startup отдельно | QF только точный destination/recovery |
| BTN-001 | Полный rearm до/после любых попыток, R&D03B ещё не accepted, Safe/Run отдельно | B: continuous release/прерывание/повтор | Нет |
| BTN-002 | Held-at-start и prematurepress полностью отклонены во всех режимах | B+S: первое наблюдение/entry/partialrelease | Нет |
| BTN-003 | Single green500 ровно один event и отсутствие раннегоevent, все ветви | B:499/500, holding, repeat, scan-grid | Нет; QT/QR лишь маршрутизация отдельных команд |
| BTN-004 | Blue500 qualification +held output, Safe/R&D | B+A:499/500,green suppression, fullgrantchain | Нет |
| BTN-005 | Inclusive250 обе очередности, >250 неchord, actual03B ещё не принято | B:249/250/251 и сетки2/5/10 | Нет |
| BTN-006 | BOTH1000 отвторой, flicker reset, непрерывное наблюдение | B:999/1000, выпадение каждой, повтор | Нет |
| BTN-007 | Failedchord/piano/swap не дают single до очистки | B:11→10/01→11, alternating pulses | Нет |
| BTN-008 | Однократность/late before и afteraccepted/очистка | B:300/500/600 обе очередности, nofault/norollback/nodouble | Нет; real emergency отдельно |
| CVR-001 | После01/07 полный recognizer и прочие аварии/переходы | B+A: qualified blue through solewriter | Нет |
| CVR-002 | Mode сам не включает Unlock; все entry/recovery combinations | A+B: Safe/R&D positive/negative grants | Нет |
| CVR-003 | Нет timeout/fault только из-за долгооткрытой крышки | A: Doorstate/blue-release/длительнаяустойчиваяфаза | Нет; не infer Door→NCphysical correlation |
| CVR-004 | После06 full externalaccepted up обоихмаршрутов, неcomponent request только | U+L: DoorFALSE/TRUE×bothNC, каждыйNCnegative, upstream/downstream | QP только PLC-onlyветка, physicaloracle задан |
| CVR-005 | Actual energyraise несовместим сUnlock во всех фазах | U+A: выходы целойцепи, неSet request как энергия | Нет |
| CVR-006 | Full InterLock защитная реакция, существующий Door соленоид контракт | E+A: источник/фаза/owner, триDoorconsumers | Нет; отдельного lockedloss нет в текущем объёме |
| MOD-001 | Реальные LV/battery/BMS подтверждения до устойчивогоR&D | U: reference phase mapping→positive/negative feedback | Нет; сначала код/сохранённая последовательность |
| MOD-002 | EarlySTO ещё не реализован, Runconfirmation отдельно | L: принятыйlaunch→STO, C2/Healthy→Run, fault/resetorder | Нет дляphysicallaunch; QP дляPLC-onlyacceptance |
| MOD-003 | Событийность обеихкоманд/маршрутов, PLC handshake | B+P: staleheld/repeat/новыйrequest | QP |
| MOD-004 | Новыеup вtransition +newdown policy | U+S: ownerbusy/новыйup/green | QT только новыйdown |
| MOD-005 | Штатное снятиеLV/battery/BMS доSafe, невозврат вобщуюupцепь | U: actual downproducer→feedback→Safe | Нет, referenceзадаётсохраняемыедействия; неизвестное послеtraceневыдумывать |
| MOD-006 | Основноеowner vs переходныефазы, handoff, zero/multihot | S: реальныеphaseentry/exit, неseededonly | QF только invaliddestination |
| MOD-007 | PLC не обходитguards и не включаетопаснуюэнергию одиночнымбитом | P+U: actualPLCmapper+SAL consumers+permissions | QP для независимогоfreshrequest; banheldbypassужеизвестен |
| MOD-008 | Все contradictory/missingfeedback запретыup и positivecontrols | U+L: каждыйреальныйfeedback guard | Нет, техническое связывание/полярности изкода |
| STP-001 | Штатный Run→R&D source/C2 приSS1, actualцепь | D: SS1/STO requests/feedback и sourceoutputs | QR только если инициаторBOTHвRun; greenизвестен |
| STP-002 | Реальные SS1/coast→discharge→C2OFF пути безобхода | D: timer/Healthy/controlflow и всеwriters | QD только dischargecompletion |
| STP-003 | Faultpredicate/timeoutсвязь и выходы/ручнойrecovery | D: реальныйcompletionpredicate+faulttrace | QD; fault/latch/UnlockFALSE/noauto не спрашивать |
| STP-004 | R&D только после согласованногоснятияHV иC2OFF | D+U: negativecompletion/feedback и positiveпоследовательность | QD |
| STP-005 | Safeтолько послеLVofffeedback | U: downcommand+реальныйFBKnegative/positive | Нет |
| BOOT-001 | Полныйstartup/restart/lifecycle, запретавтовосстановленияRun | S: rawrestartfromcontexts/полныйсброс/reset | Нет, неhardwaregate |
| BOOT-002 | Heldstartupвсехфизкнопок, rearmпослеочистки | S+B: первыйsample/partialrelease/fullfilter | Нет |

## Технические зависимости без нового поведения

Group lifecycle/Network4: исследовать полную исходную структуру и документированную
семантику; определить корректный программный запуск и наблюдение. Не принимать
unconnected fallback/seededowner как доказательство поведения установки и не
вводить требование native/hardware проверки как скрытый gate этого задания.
Если partial adapter не воспроизводит обязательный сценарий, нужен другой
программный способ проверки либо конкретный технический blocker, не вопрос
пользователю «что должен делать group» вместо изучения реализации.

Phaseowner/acceptedrequest: вывести реальный причинный путь из входов,
сохраняемых исходных операций и approved требований. Выбор внутренних имён,
wire endpoint, GUID, ordering, compactnativegraph — техническая работа.
Нельзя использовать это как повод повторно спросить earlySTO, Door/InterLock
или alreadyapproved timing. Реальные поведенческие альтернативы остаются
только в таблице вопросов; они не останавливают независимые пакеты.

Полное завершение — все41 ID с достаточными positive/negative actual-code
сценариями, закрытые существенные review замечания, все оставшиеся ограничения
видимы. Этот worklist не объявляет ни03B, ни целую систему принятой.
