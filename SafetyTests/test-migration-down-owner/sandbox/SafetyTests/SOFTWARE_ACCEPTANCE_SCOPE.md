# Программная приёмка v2 — обязательные требования

2026-10-18. Это договор о полноте программной проверки, а не заявление о
соответствии. Все 41 ID из SPEC §§19–20 обязательны; отсутствие теста не PASS.
Аппаратная конфигурация и входы заданы. Hardware/native Verify/Build/CRC,
проводка, аппаратные mappings, глобальные параметры группы, физические времена,
загрузка и оборудование не являются gate текущей приёмки.

Обычные программные переменные и связи можно менять по утверждённому плану;
запрет глобальных параметров не запрещает программные globals. Заданные
таймеры не менять, кроме явно разрешённого D-CHORD250 программного окна.
SINGLE0.5/BOTH1 утверждены D-TIMING; последнее D-CHORD250 утверждает window250мс
включительно. BOTH1с считать от второй кнопки, обе непрерывноON. Release2с
не изменён. D-Q500 не разрешает chord500: после принятой single новой
попытки/up из тех же нажатий нет. Тихое округление250мс недопустимо.

Источники: последние явные решения пользователя для конкретного сценария →
утверждённые намеренные изменения → read-only reference сохраняемой полной
последовательности → предварительные/исторические материалы. Основа v2 —
исходная последовательность с устойчивой остановкой/продолжением R&D.
Наличие названия R&D в reference не требуется для сопоставления фаз.

## Матрица обязательных проверок

Новый отдельный RED этап2026-10-20, SAFE_RUN_GESTURE_TESTS_READY.md:
15 targeted tests=8PASS/7FAIL/0ERROR;14 actualSAL component cases7PASS/7FAIL
и1observer metaPASS. Source0fc39751… неизменён, demandedcone170blocks,
typed Network3 cuts/Network4+group outside. Это7 условных componentFAIL,
не7доказанных системных дефектов или fullreachability. Noqueue/And3-notready
preservation controls PASS. Native255 proposal B1 скорректирован, B2/B3 HOLD;
финальное независимое ревью ACCEPT как RED пакет (SAFE_RUN_GESTURE_TEST_REVIEW.md), исправление SAL не принято.
Полный пакет не перезапускался, сохранённый201/1/7 отчёт ниже относится
к accepted source ДО новых RED и не включает эти7FAIL. Все41ID обязательны.

Актуализация2026-10-19 после принятого scoped earlySTO: SAL
`0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909`, SGVL
`06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5`.
Сохранённый отчёт после STOP редактора BOOT preflight A:
193 harness/75 historical/413 current tests PASS;
сценарии201PASS/1FAIL/7NV/0ERROR. Эти числа прочитаны из отчёта, а не новый
запуск аналитика. Все41ID по-прежнему обязательны, весь проект не принят.

BOOT preflight A — report-only capability diagnostic; final independent
review ACCEPT, checkpoint96a9be9. Это не functional BOOT acceptance.
Два новых NV: UNSUPPORTED_UNBOUND_PROGRAM_INPUT (Network4
8unboundinputs/7usedphasewriters) и UNSUPPORTED_GROUP_LIFECYCLE (нет group
lifecycle/error/memory engine). Functional BOOT PASS=0, прежние cases не
изменены/не удалены. Это делает ограничения видимыми, не закрывает BOOT-001/002
и не заменяет программную модель/проверку; SAL/SGVL/runtime не менялись.

- [04 review](ITERATION_04_REVIEW.md), [05 review](ITERATION_05_REVIEW.md):
  реальные LV/HV Set gates и девять текущих разрешений, actual producers и
  first-fault/stale-positive controls; не полное покрытие всех повышений/STO.
- [03C review](ITERATION_03C_REVIEW.md): исправлен observed clock стенда,
  не логика кнопок установки. Clock PASS сам по себе не закрывает BTN.
- [03B review](ITERATION_03B_REVIEW.md), [R3 review](03B_R3_REVIEW.md):
  accepted actual physical R&D recognizer, native first-only WINDOW и effective
  master-pair resolver всех четырёх EStop pairs.145-block branch,26 given inputs,
  typed Network3 ownership cuts; actual timing/late/rearm/pulses проверены.
  Safe/Run/fullgroup reachability/PLC handshake не закрыты; Error=hoststub
  не доказательство native/group nofault. Все41 ID остаются обязательными.
- [06 review](ITERATION_06_REVIEW.md): реальный R&D energy Door guard заменён
  обоими InterLockNC, три соленоидных Door consumers сохранены. Прочие up
  guards/полный внешний launch и жизненный цикл требуют дальнейшей проверки.
- [07 review](ITERATION_07_REVIEW.md): конечный Unlock защищён EStopOK и
  текущим PLCstop, первый fault scan и отсутствие reopen после raw restore
  без reset проверены для Safe/R&D. NC2/Mentee/all transitions не закрыты.

Принят scoped LV/HV PLC pulse follow-up: два existing SetPermit.AndIn4
получают предыдущий FBAnd1 PLC producer, текущие raw проверки сохраняются.
Исторический immutable baseline48=36PASS/12FAIL; unchanged48 checks теперь
PASS. PLC_PULSE_CURRENT_RESULTS.json содержит44 непрерывных chain cases и4
producer truth rows, ровно12 recoveryFAIL→PASS. См. PLC_PULSE_IMPLEMENTATION_REVIEW.md.
Нет forceReset уже latched outputs; main EStop/SGVL/runtime/timers/orders
не менялись. Это закрывает узкую pulse/recovery границу, не allEMG/fullBOOT/
достижимость. [EarlySTO review](EARLY_STO_IMPLEMENTATION_REVIEW.md) принимает
physical SU→actual torque permission N+2 без C2/HVHealthy ожидания: immutable88
baseline32PASS/56FAIL→unchanged88PASS. Два новых per-drive all-producer
4-input Set guards; исходный confirmation сохранён. Старые253 FB relativeorder,
Reset paths и восемь полных waveform traces сохранены; теперь255FB, SGVL/runtime
не менялись, default69 physical cases неизменны. Это не full accepted external
launch/groupowner/reachability proof. Полная исходная последовательность ещё
не завершена;
PLC-only policy/conflict destination/transition-down/discharge вопросы остаются.

«Частично» означает ограниченный исполняемый сценарий реального SAL либо
структурную проверку; это не закрытие всего ID. Точные результаты запуска и
SHA: SOFTWARE_CHECK_RESULTS.md/.json. Исторические fixture и отдельные модели
проверяют стенд/происхождение, но не закрывают текущий SAL. Нужные проверки
в таблице — backlog; эта таблица не утверждает, что они уже исполняются.

| ID | Текущее покрытие фактического кода | Что требуется для закрытия |
|---|---|---|
| EMG-001 | Частично ACC-C01-E и PRIORITY по seeded фазам | Каждая допустимая фаза, вход EStop во время перехода, начало аварии, отсутствие нового повышения |
| EMG-002 | Частично PRIORITY ExternalNC1/2 | Оба канала отдельно, в режимах и переходах, фиксация аварии |
| EMG-003 | Нет полной positive/negative цепи | Safe: каждый connector отсутствует, up отклонён без fault; восстановление без нового жеста не запускает |
| EMG-004 | Частично PRIORITY connectors | Потеря после Safe в каждой фазе, аварийное владение и запрет новых повышений |
| EMG-005 | Частично ESTOP/ACC-C01-E | Возврат каждого защитного входа не отменяет начатую аварийную последовательность |
| EMG-006 | Частично EStop component/reference | Полная ручная процедура после снятия энергии, только Safe, PLC не снимает аварийную память |
| EMG-007 | 07r2 actual final gate: Safe/R&D NC1/PLC firstscan и latched no-reopen; ACC-C01-E два FAIL закрыты | Остальные NC2/Mentee/источники, все переходные фазы и завершение снятия опасной энергии; не считать 07 полным закрытием |
| EMG-008 | Исторические трассы не закрывают candidate | Healthy loss во время SS1: непосредственный выбор STO без предварительного общего ожидания |
| EMG-009 | Нет полной candidate проверки | Возврат Healthy после аварийного выбора не возвращает SS1 и не сокращает заданный coast wait |
| EMG-010 | Исторические Run-down трассы | Разряд до C2 OFF, completion/отказная процедура и feedback до R&D; недостающий oracle через аналитика |
| EMG-011 | Приняты02/04/05/PLC pulse LV/HV guards; earlySTO два all-producer per-drive4input guards, actual fault/restore controls | Полная emergency ownership/recovery, все фазовые/entry paths и остальные raises не закрыты; component guard не full41 proof |
| EMG-012 | Частично STATE conflicting-set | Все недопустимые комбинации; запрет неоднозначного владения. Точный destination Q-FAULT-DESTINATION |
| BTN-001 | Принята03B actual R&D release/rearm | Другие режимы/full lifecycle/owner handoffs |
| BTN-002 | Принята03B R&D held-at-start/prematurepress | Полный group startup и другие режимы, cut не reachability |
| BTN-003 | Принята03B R&D SINGLE500/однократность | Safe/Run и полный owner lifecycle |
| BTN-004 | Принята03B R&D blue500/held gate | Safe qualification и полный lifecycle/доступ |
| BTN-005 | Приняты03B/R3 R&D WINDOW250 inclusive, обе очередности, effective pair inputs | Другие режимы/entry/реальные owner paths |
| BTN-006 | Принята03B R&D BOTH1000 от второй, continuity/reset | Другие режимы и cross-mode traces |
| BTN-007 | Принята03B R&D failedchord/piano/swap | Другие режимы и полный lifecycle |
| BTN-008 | Принята03B R&D late300/500/600/repeat/rearm в branch | Полный accepted-transition rollback/другие режимы; branch не весь ID |
| CVR-001 | 01/07 и03B R&D qualification, actual writer/hold/green | Safe qualification и все emergency/transition/lifecycle контексты |
| CVR-002 | 01 Safe/R&D hold/release;07 сохраняет legitimate positive grants и latched no-reopen | Все входы/entry/recovery режима и полная квалификация; mode сам не должен включать соленоид |
| CVR-003 | Нет полной candidate проверки | Открыта неограниченно в Safe/R&D без fault/таймера закрытия; команды не запускают закрытие |
| CVR-004 | Принята06: actual R&D producer Door independence и обаNC, real path/structural checks; старый startup negative остаётся recognizer gap | Полный внешний gesture/PLC acceptance и оба up маршрута; DoorFALSE+обаNCtrue positive при прочих разрешениях, каждыйNCfalse negative независимоDoor |
| CVR-005 | ACC-C02-X, iteration01 gate | Unlock и фактическое повышение не сосуществуют; внутренний request не считать энергией |
| CVR-006 | 06 сохранила три Door solenoid consumers,04/05 сохраняют обаNC в energy Set guards | Полная реакция на InterLock loss EMG-002/все фазы ещё не закрыта; Door только unlock, отдельный locked-loss не вводить |
| MOD-001 | STATE Safe-RnD-Run ownership only | Сохранённая исходная LV последовательность, каждый feedback/прерывание, R&D лишь после подтверждений |
| MOD-002 | Принят earlySTO: physical SU→actualSTO N+2 без C2/HVHealthy wait, старый Runconfirmation/Reset сохранены;88 checks | Полная достижимость acceptedlaunch/owner, feedback/failure во всех фазах и PLC-only policy не закрыты; N+2 не физическое нулевое время |
| MOD-003 | Частично held commands; Q-PLC-REQUEST | Новый жест/handshake для каждого шага, удерживаемый PLC уровень не повторяет; самостоятельный новый PLC запрос без физического жеста требует решения |
| MOD-004 | Нет полного candidate покрытия | Новые up в переходах отклонены; down поведение Q-TRANSITION-DOWN |
| MOD-005 | Исторические RnD-Safe traces | Сопоставить исходную LV/battery/BMS последовательность и вставку R&D, завершение перед Safe |
| MOD-006 | Частично STATE ownership | Основные режимы однозначны; промежуточные фазы не маскируются; reset/конфликты |
| MOD-007 | Частично инъекция requests | Проверка внешних PLC requests через реальные permissions; одиночный бит не включает энергию напрямую |
| MOD-008 | Частично Network12 | Каждый противоречивый/неподтверждённый feedback запрещает up, positive controls |
| STP-001 | Историческая остановка, не candidate acceptance | Реальный Run-down сохраняет исходную последовательность SS1/STO, источник/C2 при SS1 |
| STP-002 | Исторические selected chains | После заданного SS1/coast разряд до C2 OFF; альтернативные пути не обходят |
| STP-003 | Пробел точной отказной политики | Заданный timeout: fault, нет автоматического продолжения; C2/discharge политика Q-COMPLETION |
| STP-004 | Частично state mapping | До завершения разряда и C2 OFF R&D не объявляется; новый launch не обходит |
| STP-005 | Частично state mapping | Safe не объявляется до feedback снятия LV по сохранённой последовательности |
| BOOT-001 | EStop component, full lifecycle gap | Старт/рестарт из контекстов Run/transition не восстанавливает Run автоматически |
| BOOT-002 | BUTTON held-at-start, branch only | Полный программный startup/entry с held buttons: новая попытка только после отпускания и фильтра |

## Условия приёмки

Для каждого ID нужны положительные и отрицательные сценарии, последовательность
входов, ожидаемые состояния/выходы и источник oracle. Проверять current SAL,
SHA/версию, scan semantics, начальное состояние и явные допущения. Seeded
компоненты дополнять проверкой настоящих producers/consumers; не выдавать
искусственную инъекцию Set за достижимость полного перехода.

Ошибки стенда исправляются с объяснением; FAIL не скрываются. Неизвестное
поведение спрашивать через аналитика, зависимое изменение удерживать, остальные
продолжать. Coverage gap/открытый обязательный oracle не считается PASS.
Все согласованные программные требования пройдены и существенные замечания
независимого ревью закрыты — условие программного завершения. Ограничения
адаптера (Network4/group lifecycle и прочие) фиксируются; если они закрывают
обязательный сценарий от проверки, нужен другой программный способ доказательства,
а не аппаратный/native gate и не замена прототипом.
