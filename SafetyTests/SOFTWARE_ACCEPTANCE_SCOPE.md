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

Latest2026-10-20: D-STARTINGRUN-NO-COAST closes remainingabort5squestion:
STO→сразуDischarge→existinghold→C2OFF→C2FBKOFF, noSS1/no5s coast. Test
actualorder/C2ON-OFF/no cancelledlaunch revival; HealthyLossRunSS1 full5s
unchanged. Oldpendingabort5s snapshots superseded. LV_WORKING_TRANSFER_REVIEW
finalACCEPT exactworkingLV254/boundedcanonical; olderreviewPENDING superseded.
Whole41/BOOT/native and Run/StartingRun fullv2 still notaccepted. Completed295
inputintegrity proof stayshistorical; subsequentstatusdocs expecteddoc-onlydeltas.

### Actual working LV254 transfer — 2026-10-20

Рабочие SHA: SAL b7096fa3cf7349ea0be08f347180deb071a0f6b75612c4e5c8a7f45cf0557161,
SGVL4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5;
254blocks. FINAL_WORKING_EVIDENCE.json в lv-working-transfer: точные21files,
whole-sourceaudit и13structuralPASS;295canonicalinputs unchanged before/after
digest ccd7bd625a442c7cca585ca06fa486ec8c60ebc8747ac4a031d0086bd072de01.
Actualcanonical189/189harness,75/75historical,436/438current;
200casePASS/1STATEFAIL/7NV/0ERROR. ДваRunfailedchordFAIL сохранены.
LVnormalSafecompletion и действительный freshSafe→RnD newcycle реализованы
в bounded объёме; независимые LV16/Safe15/RnD69/earlySTO88/emergency40/SG3
core evidence сохранены. Старые «LVimplementationpending» и72f42… source
ниже — superseded исторические снимки. LV_WORKING_TRANSFER_REVIEW.md теперь
фиксирует итог **ACCEPT bounded working LV** после независимой проверки
фактического canonical прогона,295 входов,21 переноса и7 protected core.
Это не whole41/BOOT/native приёмка. Run/StartingRun/fullstopv2 pending,
один уточняющий выбор применимости5s приabort остаётся отдельным.

Latest stop answers2026-10-20: existingHVdischargehold→C2OFF→C2FBKOFF sufficient,
SS1timer2с/STOcoasttimer5с; StartingRunabort безSS1 STO→Discharge&delay→C2,
relevant waits без energizingcancelledlaunch. Критерии USER_STOP_SEQUENCE_HANDOFF.md;
соответствующие pending вопросы закрыты, actualsequence/timer start-hold-reset
coverage EMG008–010/STP001–004/MOD002/004 остаётся обязательным. Это не PASS
реализации и не HVtimeoutpolicy. LV bounded acceptance неpromotion/fullmigration.

### Принят bounded A1/A2 пакет — 2026-10-20

NEXT_EMERGENCY_EXECUTION_REVIEW.md: **ACCEPT,40PASS/0FAIL/0fixtureERROR**;
working SAL72f42d…/SGVLde0fa… без изменения кода этим пакетом.
Independent next-emergency-tests REPORT/RESULTS/VERIFIED_REPORT.json и
PACKAGE_IDENTITY фиксируют actual native producers, Set/Reset consumers и
непрерывные1мс traces. A1: Safe/RnD fresh-blue grant positive, heldblue при
NC2/Mentee one/ten-scan fault и восстановлении без Restart; Unlock/EStopFALSE
с первого fault до200мс после восстановления. A2: real pendingSet на Safe-Step12
LV, RnD HV/STO1/STO2, original-start Step2 LV/HV; paired здоровые controls,
fault/restore запрещают все новые nativeSet/выходные rises. Это расширяет
EMG001/005/007/011,CVR001/002, но не закрывает целиком этиID или все41.
InitialSafe/originalStep2 component boundary, семь inactiveN4cuts, noBOOT/group,
A3/полная аварийная completion/destination остаются открытыми.

Новый user-decision baseline: 8PASS/12FAIL/2NV/0ERROR, sourceunchanged;
USER_DECISIONS_BASELINE_REVIEW принят как ограниченный RED пакет тестов,
не как приёмка реализации. Frozen архивы сохраняются для сравнения кандидата.
LV normalcompletion вопрос отвечен D-LV-OFF-COMPLETE, implementation pending;
RunBOTH/StartingRun новые решения также не закрываются A1/A2PASS.

### Новые нормативные решения 2026-10-20 — реализация ещё не принята

SCENARIO_DECISIONS.md: D-LV-OFF-COMPLETE закрывает LV completion вопрос:
после отключения LV при RnD→Safe достаточно LV_C1_FBK FALSE, новых таймеров
не требуется. MOD005/STP005: проверить настоящий down→LV-off→feedbackOFF→Safe,
feedbackON запрещает преждевременный Safe, отсутствует повторное включение.
D-RUN-BOTH-IGNORE закрывает QR: полноценная новая BOTH в Run игнорируется;
BTN005–008/MOD004: нет single/down/up, новая попытка лишь после полной очистки.
D-STARTINGRUN-GREEN-DOWN закрывает QT в указанном контексте: после принятого
запуска и STO released новая green500 после очистки прерывает запуск и
выполняет Run→RnD. MOD002/004, STP001–004 и CVR005 проверяют реальный abort
owner/нормальную остановку; не immediateRnD и не новый discharge oracle.
Подробные позитивы/негативы и сохранившиеся границы:
USER_DECISIONS_2026_10_20_HANDOFF.md. Исторические pending QR/QT/LV строки
ниже заменены этими решениями в их точном контексте. QP/conflict/HV completion
и остальные неопределённые transition contexts остаются отдельными.

Актуально2026-10-20 после переноса и независимого post-working review:
рабочий SAL72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e,
SGVLde0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56.
Safe qualification/no-autoenergy приняты только в заявленном компонентном
объёме. Рабочий full:189/189 harness,75/75 historical,436/438 current;
200PASS/1STATEFAIL/7NV/0ERROR. Два Run invalid-chord FAIL сохранены.
Новый current-rnd-down-no-reenergy.test.js запускается штатным check:software:
4 проверки actual phase writers/первый Step2/2500мс удержание без нового Set,
исходный Step2 при обычном discharge FALSE/TRUE и fault-component clear/fresh
reentry. Seven explicit inactive N4 boundaries/initial state ограничивают proof;
это не нормальный RnD→Safe, полный BOOT или всё emergency/recovery покрытие.
Независимые Safe15/RnD69/earlySTO88 и prior baseline RED сохранены.
Снята только устаревшая проверка параметра выведенного Safe TON3;
замещающий BOTH1с/полный интервал/сбросы проверяются. Все41ID остаются обязательны.
Review: DOWN_EPISODE_OWNER_REVIEW.md; transfer/integrity — working-transfer/.

Ниже сохранены предыдущие снимки до этого переноса, не актуальные counts/source.

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

## Консолидация решений Вадима 2026-10-21 (действующая редакция ID)

Источник: SCENARIO_DECISIONS.md «Прямые ответы Вадима после снятия приостановки» (ea6b52d);
предложение аналитика SafetyTests/program/analyst/REQ-CONSOLIDATION/SCOPE_PROPOSAL.md,
критерии — CRITERIA.md/.json там же (§K: ID → критерии). Принято ведущим 2026-10-21.
Для перечисленных ниже ID действует новая формулировка; строки матрицы выше —
история покрытия. Ни один ID не удалён. Перечень расширен с 41 до 59 ID; v2 (ответы Q-RC-01…10, D-ARCH-POL, Q-ARCH-06) — до 62 ID.
Открытые вопросы, блокирующие часть критериев: QUESTIONS.md v2 (Q-RC-11…19, Q-ARCH-01/03/04/05/08, Q-REL-AFTER-PERMIT).

#### Изменённые формулировки существующих ID

| ID | Было (суть) | Предлагается | Основание |
|---|---|---|---|
| EMG-002 | Потеря любого канала внешнего аварийного interlock → Emergency | Потеря in_InterLock_NC_1/2: Safe/R&D — только запрет R&D→Run без fault; Run — защитный спуск (последовательность — после Q-RC-01); Config — Emergency; переходы — после Q-RC-03. EStop in_ES_NC_1/2 — Emergency везде (EMG-001) | V14-Q21 |
| EMG-006 | Ручное восстановление в Safe; PLC не снимает | + «для всех источников (EStop, PLC, Mentee, heartbeat, Config, watchdog OFF) снятие — зелёная (FBEstop1.Restart) при выполненных SPEC §12; гриб нажимать не требуется; после Safe PLC-UP по новому фронту разрешён» | V14-Q6, V14-Q4 |
| EMG-010 | Discharge при подключённом C2; C2 OFF после подтверждения/отказной процедуры | «Discharge — отдельная команда после STO+5 с (abort: сразу после STO); C2 OFF после существующей выдержки разряда; R&D после C2_FBK OFF; C2_FBK ON > 500 мс после OFF → Emergency» | E2-Q1 уточнение, D-HV-TIMED-COMPLETE, E6-Q1 |
| EMG-012 | → Emergency/TransitionFault | «Двойное владение исключено по построению; обнаруженный конфликт → Emergency» (+ «ни одного» — после Q-RC-10) | E2 |
| CVR-004 | Повышение требует обоих NC | «R&D→Run и вход в Config требуют NC1∧NC2; Safe→R&D допускается при открытой крышке; Door не guard» (кнопки и PLC) | V14-Q7, V14-Q5, V14-Q16 |
| CVR-006 | Защитные реакции на NC сохраняются | Ссылка на новую трактовку EMG-002 / IL-* | V14-Q21 |
| MOD-001 | Safe→R&D включает LV последовательно | «…только C1/PS1 автоматически (C3/BMS — ручные команды PLC); R&D после C1_FBK ON ≤500 мс и LV Healthy ≤30 с; abort по V14-Q13» | V14-Q15, E6, V14-Q13 |
| MOD-002 | Run после interlock, C2, Healthy | + «отказ C2_FBK 500 мс / HV Healthy 30 с → откат в R&D + SafetyFault» | E6-Q1 |
| MOD-003 | Новое событие, не удерживаемый уровень | «Команда PLC засчитывается только по фронту в исходном устойчивом состоянии; удерживаемая/выставленная раньше игнорируется без ошибки; не повторяется» | V14-Q11 |
| MOD-004 | UP во время перехода не принимается | + «DOWN-исключения: StartingRun (зелёная/CMD_RUN_TO_R&D → abort), Safe→R&D (зелёная/CMD_R&D_TO_SAFE → Safe); прочие — после Q-RC-08» | V14-Q12/Q13 |
| MOD-005 | R&D→Safe снимает LV/battery/BMS | без изменения смысла; + «по команде CMD_R&D_TO_SAFE и при потере LV Healthy в R&D» | V14-Q11, E2-Q2 |
| MOD-006 | Однозначное владение режимами | «Emergency XOR Safe XOR R&D XOR Run XOR Config; по построению» | V14-Q16, E2 |
| MOD-007 | PLC передаёт запрос; одиночный бит не включает энергию | «Отдельные команды v1.4 §8; TwinSAFE проверяет; Bypass — запрос Config, проверяемый TwinSAFE; прежний 2-битный путь не создаёт переходов» | V14-Q2, V14-Q8–Q11, V14-Q16 |
| MOD-008 | Неоднозначный feedback запрещает повышение | + «HV Healthy в R&D игнорируется (ни разрешение, ни запрет до запуска)» | E2-Q2(b) |
| STP-001 | SS1/STO с подключённым C2 | «SS1 2 с → STO → 5 с → Discharge (команда) → выдержка → C2 OFF → C2_FBK OFF → R&D; одинаково для зелёной и CMD_RUN_TO_R&D; это и есть zero speed/current v1.4» | E2-Q1, V14-Q3 |
| STP-003 | Нет discharge completion до timeout → fault | **Утратил смысл в части «discharge completion timeout»**: входа DischargeComplete нет, завершение — выдержка (D-HV-TIMED-COMPLETE). Предлагается: «C2_FBK ON > 500 мс после команды OFF → Emergency; R&D не объявляется; без авто-продолжения» (пересекается с WDG-003 — можно ссылкой) | D-HV-TIMED-COMPLETE, E6-Q1 |
| BOOT-001 | Run не восстанавливается | + «Config не восстанавливается (после Q-RC-05); heartbeat при старте — проект E4 (HB-04)» | V14-Q16, V14-Q20 |

Без изменений: EMG-001, EMG-003, EMG-004, EMG-005, EMG-007, EMG-008, EMG-009,
EMG-011, BTN-001…008, CVR-001, CVR-002, CVR-003, CVR-005, STP-002, STP-004,
STP-005, BOOT-002 (новые критерии добавляются к ним, см. CRITERIA.md §K).

#### Новые ID

| ID | Требование | Основание | Этап |
|---|---|---|---|
| CFG-001 | Вход в Config только из устойчивого Safe при NC1∧NC2 (прочие условия — Q-RC-05); иначе Bypass игнорируется без fault | V14-Q16 | E4 (слот статуса — E2) |
| CFG-002 | В Config C1/C2 ON, STO активен, Unlock FALSE; все команды кнопок/PLC, кроме аварийных, игнорируются | V14-Q16, V14-Q15 | E4 |
| CFG-003 | Config держится, пока Bypass TRUE; автоотключение 10 с удалено | V14-Q16, V14-Q17 | E4 |
| CFG-004 | Выход: Discharge → выдержка → C2/C1 OFF (последовательно или вместе) → оба FBK OFF → Safe; без SS1 | V14-Q18 | E4 |
| CFG-005 | В Config EStop/PLC/Mentee/connectors/NC → Emergency; LV/HV Healthy игнорируются | V14-Q19, V14-Q21(c) | E4 |
| PLC-001 | Отдельные команды перехода по фронту в исходном устойчивом состоянии; удерживаемая/ранняя игнорируется без ошибки, не повторяется | V14-Q11 | E4 |
| PLC-002 | Одновременные команды перехода → ни одна не исполняется, статус ошибки; снятие после 1 с непрерывно всех FALSE | V14-Q8, V14-Q10 | E4 |
| PLC-003 | CMD_TRIGGER_EMERGENCY всегда, выше всего | V14-Q9 | E4 (+E2 приоритет) |
| PLC-004 | При нажатой любой кнопке фронт PLC-команды перехода игнорируется навсегда | V14-Q14 | E4 |
| PLC-005 | STS_COVER_LOCKED = NC1∧NC2 | V14-Q5 | E4 |
| PLC-006 | DOWN-исключения в переходах (StartingRun abort, Safe→R&D abort) | V14-Q12, V14-Q13 | E3 (StartingRun), E4 (PLC) |
| HB-001 | Heartbeat 0,5 с; нет смены 3 с → Emergency во всех состояниях; защёлка, снятие по EMG-006 | V14-Q20 | E4 |
| WDG-001 | C1/C2 FBK ON ≤ 500 мс от команды ON; иначе откат в исходное состояние + SafetyFault | E6, E6-Q1 | E6 |
| WDG-002 | Healthy ≤ 30 с от FBK ON; иначе откат + SafetyFault | E6, E6-Q1 | E6 |
| WDG-003 | FBK OFF ≤ 500 мс от команды OFF; иначе Emergency | E6-Q1 | E6 (используется в E3) |
| WDG-004 | SafetyFault: любая кнопка квитирует и потребляет попытку; 2 с отпускания; PLC не квитирует; UP заблокирован | E6-Q2, п.13 | E5 |
| HLT-001 | R&D: потеря LV Healthy → R&D→Safe (не Emergency); HV Healthy игнорируется | E2-Q2 | E2 |
| STP-006 | Abort StartingRun: STO → сразу Discharge → выдержка → C2 OFF → FBK OFF → R&D; без SS1/выбега; не возобновляется | D-STARTINGRUN-NO-COAST, V14-Q12 | E3 |

Нумерацию/префиксы ведущий может изменить. Альтернатива без новых префиксов —
расширить MOD-007 (PLC-*), EMG-* (HB, WDG-003), MOD-006 (CFG-*), но тогда
закрытие одного ID потребует слишком разнородных сценариев; рекомендую новые ID.

#### Соответствие ID этапам E2–E7

| Этап | ID |
|---|---|
| E2 Safe+Armed / статусы / конфликт → Emergency | EMG-012, MOD-006 (вкл. слот Config), HLT-001, EMG-002/CVR-006 для Safe/R&D (IL-01/02), STP-004 (гонка E2-02, убить MU11), переоценка MU10 |
| E3 STOP v2 | STP-001, STP-002, STP-003, STP-004, STP-006, EMG-008, EMG-009, EMG-010, MOD-002 (abort), EMG-002/CVR-006 для Run (после Q-RC-01), EMG-007 в остановке |
| E4 команды PLC / Config / heartbeat | PLC-001…006, CFG-001…005, HB-001, MOD-003, MOD-004, MOD-007, CVR-004 (PLC-маршруты), EMG-006 (PLC не снимает), EMG-001 (PLC-источник), group/alias/mapping по V14-Q2 |
| E5 SafetyFault | WDG-004, BTN-001/007 (квитирование), статус ошибки в PLC (Q-RC-13) |
| E6 watchdog | WDG-001, WDG-002, WDG-003, MOD-001, MOD-002 (откаты), MOD-005 (OFF-отказ) |
| E7 BOOT/group | BOOT-001, BOOT-002, HB-001 при старте (HB-04), Config при рестарте |
| E8 | все |

Зависимости порядка: E3 использует WDG-003 (C2 OFF stuck → Emergency) — если
E6 позже, STP-C в E3 оставить RED/NV с пометкой; E5 (квитирование) нужен для
приёмки E6-откатов; E2 должен заложить Config в механизм статусов, иначе E4
повторно перестроит присвоение статусов.

### Дельта v2 консолидации (принята ведущим 2026-10-21)

Источник: program/analyst/REQ-CONSOLIDATION/SCOPE_PROPOSAL.md v2, CRITERIA.md v2 (§K), SCENARIO_DECISIONS c1e7fe6c…. При расхождении с таблицами выше действует v2.

#### v2: Правки строк «Изменённые формулировки»

| ID | Сейчас в SCOPE | Предлагается | Основание |
|---|---|---|---|
| EMG-002 | «Run — защитный спуск (после Q-RC-01); переходы — после Q-RC-03» | «Потеря in_InterLock_NC_1/2: Safe, R&D, Safe→R&D, R&D→Safe, нормальный Run→R&D — не авария (только запрет R&D→Run, начатый переход продолжается); Run, StartingRun, Config, выход Config — Emergency (защёлка, снятие энергии, выход по EMG-006). Прочие спуски — после Q-RC-17. EStop — EMG-001» | Q-RC-01, Q-RC-03, V14-Q21(a)(c) |
| EMG-004 | «Без изменений» | «После выхода из Safe потеря connector: Config и выход Config — Emergency; везде — без новых повышений, Unlock FALSE, восстановление не отменяет реакцию; вид реакции в R&D/Run/переходах — после Q-RC-14» | V14-Q19, SPEC §5.1, Q-RC-14 |
| EMG-006 | + «… после Safe PLC-UP по новому фронту» | + «Bypass, удерживаемый через Restart, Config не даёт (нужен новый фронт); группа стартует в Emergency» | Q-RC-05, Q-RC-10 |
| EMG-008 / EMG-009 | без изменений | + «HV Healthy в SS1 — немедленный STO (§9); потеря Healthy в устойчивом Run — тот же немедленный STO и спуск в R&D (не Step4); после STO — остановка без изменений» | Q-RC-02, Q-RC-09 |
| EMG-012 | «(+ «ни одного» — после Q-RC-10)» | «Двойное владение и отсутствие основного состояния вне перехода исключены по построению; обнаружение → Emergency; старт группы — Emergency» | E2, Q-RC-10 |
| MOD-003 | «по фронту в исходном устойчивом состоянии…» | + «то же для Bypass→Config (фронт в устойчивом Safe при закрытой крышке)» | Q-RC-05 |
| MOD-004 | «прочие — после Q-RC-08» | «прочие команды (кнопки и PLC) в переходах игнорируются без ошибки и без отложенного исполнения» | Q-RC-08 |
| MOD-005 | без изменения смысла | + «спуск разрешён при открытой крышке и при активной SafetyFault (зелёная квитирует и спускает; PLC-спуск SafetyFault не снимает)» | V14-Q21(a), Q-RC-03(b1), Q-RC-07 |
| MOD-008 | + «HV Healthy в R&D игнорируется» | + «полярность: сырое FALSE = исправен (in_LV/HV_Faulty_FBK)» | D-ARCH-POL(-RENAME) |
| STP-001 | без изменений | без изменений; добавить ссылку на защитный спуск STP-007 (см. §2) | Q-RC-02 |
| BOOT-001 | «Config не восстанавливается (после Q-RC-05)» | «Config не восстанавливается: после рестарта нужен новый фронт Bypass; группа стартует в Emergency» | Q-RC-05, Q-RC-10 |

#### v2: Правки «Новых ID»

| ID | Сейчас | Предлагается | Основание |
|---|---|---|---|
| CFG-001 | «прочие условия — Q-RC-05» | «Вход только по новому фронту Bypass в устойчивом Safe при NC1∧NC2, connectors в норме, нет SafetyFault, нет ошибки PLC, кнопки отпущены; иначе фронт игнорируется без fault и не исполняется позже» | Q-RC-05, Q-RC-07(b) |
| CFG-002 | без изменений | + «две TRUE-команды в Config ошибку PLC не ставят» | Q-RC-04 |
| CFG-005 | «… NC → Emergency» | + «в выходе Config — то же для NC и connectors» | Q-RC-03(b2), V14-Q19 |
| CFG-006 (новый) | — | «Нет C1_FBK/C2_FBK ON 500 мс при входе в Config → откат Discharge → выдержка → C1/C2 OFF → оба FBK OFF → Safe + SafetyFault; не Emergency; 30 с не применяется» | Q-RC-06 |
| PLC-002 | «Одновременные команды…» | «Ошибка, если в устойчивом Safe/R&D/Run две и более команды перехода TRUE одновременно (по уровню, независимо от моментов фронтов); ни одна не исполняется; в Config/переходах/Emergency не ставится; снятие после 1 с всех FALSE» | Q-RC-04, V14-Q8/Q10 |
| PLC-006 | «DOWN-исключения…» | + «прочие команды в переходах — игнор (MOD-004)» | Q-RC-08 |
| WDG-004 | «любая кнопка квитирует и потребляет попытку…» | + «исключение: в R&D квалифицированная зелёная квитирует и выполняет R&D→Safe; PLC-спуск выполняется, SafetyFault не снимает; при SafetyFault запрещены UP и вход в Config» | Q-RC-07 |
| HLT-001 | без изменений | + «цепной случай после Run→R&D (нормальная остановка, защитный спуск) — та же реакция по приходу в R&D» | Q-RC-02, Q-RC-09 |
| STP-006 | без изменений | без изменений | — |
| STP-007 (новый) | — | «Потеря LV/HV Healthy в устойчивом Run: немедленный STO → 5 с → Discharge → выдержка → C2 OFF → C2_FBK OFF → R&D (не Emergency, не Step4); LV — затем R&D→Safe без команды» | Q-RC-02 |
| POL-001 (новый, структурный) | — | «Сырое FALSE in_LV/HV_Faulty_FBK = исправен во всех guard-потребителях; имена переименованы без изменения каналов/alias; число Symbols сохранено» | D-ARCH-POL, D-ARCH-POL-RENAME |

Альтернатива нумерации: STP-007 — как часть EMG-008/STP-001; POL-001 — как
условие MOD-008. Рекомендую отдельные ID (разные сценарии и мутации).

#### v2: Этапы E2–E7 — изменения

| Этап | Добавить / уточнить |
|---|---|
| E2 | E2-04 (Q-RC-10, старт в Emergency); POL-001 и исправление N11/FBAnd4 (до E2-02, по ревью плана); IL-02b/HLT-01b (R&D при открытой крышке — спуск); R1-01 при применении R1; E2-02 без обязательства MU11 (решение C3 — ведущему) |
| E3 | STP-007 (Q-RC-02); STP-F (Q-RC-09); EMG-002 Run и StartingRun → Emergency (IL-03, IL-05a) вместо защитного спуска; IL-05b (продолжение Run→R&D) |
| E4 | CFG-001/006 (Q-RC-05/06), PLC-002 по уровням (Q-RC-04), MOD-004 игнор (Q-RC-08), IL-05c, EMG-004 в Config |
| E5 | WDG-004 с исключением Q-RC-07 |
| E6 | CFG-006 (watchdog входа Config); WDG-002 при полярности D-ARCH-POL |
| E7 | BOOT-001: старт в Emergency, Bypass/CMD с момента старта не исполняются |

### Дельта v3 консолидации (принята ведущим 2026-10-21)

Источник: program/analyst/E2-G1-questions/CRITERIA_DELTA.md (ответы Q-ARCH-01/03/05/09, Q-RC-11/14, переименование outPLC; in_Safety_Run TRUE нормативно). Действует поверх v2.
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

### Дельта v4 консолидации (принята ведущим 2026-10-21)

Источник: program/analyst/E2-G1-v2-questions/CRITERIA_DELTA_v4.md (правило L1/L2/L3, IL-02 N=u дизъюнкция, FBK-01…09 по Q-RC-19, REL-01, UNL-04, Q-RC-12/13/15/16/17/18, Q-E2Q-01/02). Действует поверх v3. Открыто: Q-V4-01…03.

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

### Дельта по вопросу 76 (KF-5), 2026-10-22

Источник: SCENARIO_DECISIONS «Вопрос 76 (KF-5)» (Вадим, «Б»); критерии program/analyst/E2-Q76/CRITERIA.md; план E2 v7.5.

| ID | Уточнение |
|---|---|
| MOD-007 | С E2 код PLC (1,1) не даёт R&D→Run, C2, снятия STO, SR и снятия запроса HV; до E4 R&D→Run — только физический BOTH. (1,0) и спуски (0,1) остаются до E4 (known FAIL KF-1…KF-3). |
| MOD-002 | PLC-only R&D→Run в E2 нет. |

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
