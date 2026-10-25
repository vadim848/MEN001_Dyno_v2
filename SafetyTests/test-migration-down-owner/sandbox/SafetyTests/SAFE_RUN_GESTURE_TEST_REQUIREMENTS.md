# Safe/Run: tests-first требования известных сценариев

2026-10-19. Требования аналитика по SPEC§3.1/§15, BTN-001–008,
CVR-001/002, BOOT-002, D-TIMING/D-CHORD250/D-Q500/D-LATE-SECOND и
SAFE_RUN_GESTURE_SOURCE_REVIEW.md. Не новый oracle и не готовая архитектура.
Прежний genericcandidate260FB в SAFE_RUN_GESTURE_ARCHITECTURE_PLAN.md —
исторический budget blocker конкретной схемы. Новый counted255 plan
SAFE_RUN_GESTURE_COUNTED_PLAN.json подготовлен, но causal review ещё
NOT READY. Совпадение числа255 не доказывает owner/reset/ordering корректность;
редактирование SAL этим документом не разрешается без проверенного пакета.
Новые тесты/код здесь не создаются. QR/QT/QP/QF/QD не выбираются.

## Источник и границы исполнения

Baseline currentSAL0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909
и соответствующий SGVL06010caf…; фиксировать полные SHA при реальном запуске.
Fullsource binding audit доcut, executionorder реальный, canonical edges,
никакого name-only разрешения. Каждая source dependency задаётся входом
по реальному ID либо исполняемым producer, не implicitTRUE fallback.

Разрешён typed phase boundary b_Step1TRUE(Safe) либо b_Step3TRUE(Run),
остальные владельцыFALSE, но это НЕ fullBOOT/reachability. Моделировать
действующий EStop через настоящий Restart либо явно назвать healthyEStop
внешним component precondition. Не смешивать его Restart с normalStepDown.
Network4 не исполнять под непроверенным fallback. Срез обязан включать все
реальные producers наблюдаемых команд, конечные gates/RS; origin/cuts
протоколируются. Искусственно injected Set не единственное доказательство.

Common фон: NC1/2 и externalInterLock1/2TRUE, PLCstopFALSE, MenteeFALSE,
FalseInputFALSE, PLCmodecode неактивен для выбранной ветви; точный код
явно записать. Safe: C1/C2feedbackOFF, STOfeedbackTRUE, необходимые исходные
guardTON предварительно готовы. Run: qualified Step3, ResetPB_LockFALSE,
здоровые программные Healthy условия исходной цепи. DoorTRUE для позитивного
solenoid grant, DoorFALSE не превращать в новый energy veto. Feedback не
считать physical доказательством; питание/движение не управляются реально.

Непрерывный observer с первого sample фиксирует ВСЕ command/output pulses,
а не конечный snapshot. observed-fixed-scan-v1: first observed edge age0.
Основные exact границы1мс; дополнительные ближайшие точки сеток2/5/10мс
не обозначать точным249/251. Учитывать реальные causal delays между блоками:
qualificationtimer и consumed event различаются. Нельзя gracewindow скрыть
ранний pulse. Наблюдать timer expiry, внутренний event и конечный writer.

## Safe blue qualification и доступ

Actual producer N2/FBDecouple3→FBAnd7→b_Set_Door_Unlock→N1 grantlatch/
finalUnlock; reset N2/FBAnd8=Safe&&!Door остаётся. Новая qualifying попытка
готовится обеOFF непрерывно2000мс; фон остаётся stableSafe.

| Сценарий | Входы после initialconditions | Обязательное наблюдение |
|---|---|---|
| Healthy positive blue | Полная очистка; blueON greenOFF непрерывно500мс | До500 никакого acceptedblue/Unlock; при полном500 qualification и далее допустим heldUnlock через реальную causal цепь |
| Граница и прерывание | Blue499мс→OFF; затем новая очистка и blue500мс | Первая попытка не открывает; вторая positive, полный новый отсчёт |
| Held-at-entry | Blue ужеON на первомSafe sample | Нет acceptedblue/Unlock от дальнейшего удержания; обеOFF+полныйфильтр, новаяblue даёт positive |
| Release/rearm | После принятойblue отпустить; повторить до2000мс нейтрали | Unlock снимается; преждевременная попытка целиком отклоняется, удержание не легализует; полная новая очистка даёт positive |
| Connector absent access | Та же новая корректнаяblue, LV/HVconnector поочерёдно/обаFALSE вSafe | Отсутствие connector само не fault и не новый запрет доступа; positive при остальных исходных grantусловиях |
| Door existing reset | При неизменнойSafe/blue изменитьDoor | Поведение исходногоsolenoidreset сохранено; не требовать UnlockTRUE приDoorFALSE вопрекиреальномуreset |
| Green suppression | Ужеqualifiedblue; greenON | КонечныйUnlockFALSE, без новой команды изтойжеattempt; не выдумыватьsame-scanpulsewidth |

## Safe BOTH / late qualification

Реальный физический маршрут N2/And10→TON3(1с)→And4(исходныеfeedbackguards)
→Or1→Step12Set/Transition1. Не требовать немедленного State_RnD изодного
event: последующая LV последовательность отдельный контракт. Наблюдать
неоднократные повторы и реальныеenergyoutputs где включены настоящиеconsumers.

| Сценарий | Последовательность | Oracle |
|---|---|---|
| Before/equal window | Послеfullrelease firstgreen/blue t0, second t249 либо250 | Одна chordattempt, никаких singles/Unlock; StepUp не раньше полной1000мс ОБЕИХ отsecond, затем одинevent при прочихguards |
| After window | То же secondt251 (и300) доsingle500 | Ниsingle ниStepUp, безfault; даже удержаниеобеихдольше1с не легализует; полнаяочисткапередновой |
| BOTH boundary | Validchord, обе999мс/1000мс отsecond | До1000 noStepUp, full1000 positive через actualcausal chain |
| Flicker | Validchord, однаOFFдо1000, потомобеON | Полныйновый1000 отвозврата; chordнепонижаетсявsingle |
| Late at/after single | Перваяодна500мс, втораяровно500 либо600 | Single ужеacceptedpriority, неchord/StepUp, никакойновойкоманды; greenснимаетUnlockотдельно |
| Piano/failedchord | Validchordменьше1с, затемостаётсяодна; swap11→10→11/01 | Никаких singles/up доfullrelease; послеочисткиhealthypositive |
| Held both atentry | ОбеONприtypedSafeentry | Нетup/Unlock доrelease+фильтр+новогоvalidgesture |

Дляgreen-first singleSafe §15 задаёт «остаётсяSafe»; не объявлять rawRestart
в mainEStop normalenergylaunch. Дляblue-first отслеживать отдельноqualified
event иheldUnlock. Эти сценарии не выбирают endpointизpendingQR/QT.

## Run green / invalidchord и повтор

Actual N6/TON2(rawgreen0.5с)→And24(!Lock/!False)→And23(Step3,!blue)
→Or5→Decouple2 пишет down/removalrequests. Testoracle normalStepDown не
означает, что существующий одновременный STO/discharge/C2 fanout признан
правильной полной остановкой. Её completion/таймаут QD остаются отдельно.

| Сценарий | Входы | Обязательное наблюдение |
|---|---|---|
| Green healthy | Fullrelease; greenодна499/500мс | До500 normaldownrequestFALSE; послеfull500 одноaccepteddown, последующийactualrequestfanoutнаблюдаетсяотдельно |
| Invalidchord→green | Обавокне<=250, вместе менее1000; blueOFF, greenдержитсядолго | Никакойsingle/down отоставшейсяgreen доочистки, даже еслиrawgreenTONдостиг500 |
| Invalidchord opposite | То же greenOFF, blueостаётся | Никакогоsingle/Unlock/down/up изfailedchord доочистки |
| Heldgreenatentry | GreenONнаfirstRunsample | Удержание не легализуется; обеOFFполныйfilter→новаяgreen500 даётpositive |
| Repeated/earlyrepress | Послеодногоaccepteddown новое нажатие безfullrelease | Нетвторогоacceptance; еслиownerfixedкакcomponentcut, явнонеобъявлятьотсутствиереальногоперехода |
| Recoverypositive | Полнаяочисткапослесрыва, новоезелёное500 | Отдельныйpositivecontrol, запретнеявляетсявечнымблокированием |

НЕвключатькакoracle новыйПОЛНЫЙvalidBOTH вRun: QR pending. Invalidchord,
не достигший1с, уже однозначно запрещён BTN-007 и не зависит отQR. Новый
полныйgreenпослеочисткивоStartingRun — QT, здесь не тестируется.

## Red criteria и приёмка будущего пакета

CurrentSafeBluegrant безTON, SafeBothlevelTON безwindow/release и RunrawTON
безirreversibleattempt дают source-bound ожиданияred на соответствующих
сценариях. Actualtest обязан воспроизвести конкретный ранний/недопустимый
event/output; missingbinding/error/fallbackне считаютсяbehaviorFAIL. Healthy
positive обязателен, иначе nooutputstub ошибочно пройдёт negatives.

Не считать числоусловныхred числомдефектовсистемы; повторныевариантысканирования
могутпредставлятьодинпропускrecognizer. Послеfixвсетежеoracles, structural
audit/fullpackage иindependentreview; другиеFAIL/NV видимы. Safeconnectors
непереноситьвR&D: тамихloss аварийный, sharedeligibilityобоснована03Bdecision.
Не удалятьисходныеfeedback/Reset/Restart/PLCпутирадиbudget; exactnativegraph
<=255 иowner/epochmodeentry доказатьдоSAL. Модельпрототипнереализация.
