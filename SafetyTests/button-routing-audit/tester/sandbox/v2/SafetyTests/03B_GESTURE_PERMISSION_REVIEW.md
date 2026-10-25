# 03B: shared energy Permit — фактический probe и semantic review

**FINAL ADJUDICATION / CLOSED:** `03B_GESTURE_REQUIREMENT_DECISION.md` подтверждает SPEC§5.1/EMG002/004 и §13/EMG007: R&D потеря любого ExternalInterLock/connector означает Emergency, shared E правильный inhibit новых жестов. Старый UnlockTRUE не является desired positive oracle. Door-only-solenoid решение не отменяло Emergency. Safe connector absence отдельно от R&D. CSE и netlist253 не меняются. Нижеследующий вариант разделения E — отвергнутая гипотеза, не план реализации. Downstream Emergency owner/sequence должен сохраняться; очистка SG/SU не закрывает весь аварийный контракт.

Статус **CLOSED, PLAN253 READY для согласованной передачи редактору**. SAL не изменён; source bf110ab..., SGVL508610.... Ранее доказанное E⇒NC остаётся верным. Исторические рассуждения ниже сохраняют trace пересмотра; их нормативные выводы заменены финальным решением выше.

## Фактический положительный контрпример

Прочитан полный validated source, затем выполнен тот же ограниченный компонентный граф, что в `current-unlock-estop-permit.test.js`: настоящие main EStop/PLC producer, grant producers R&D, grant RS и final07. State boundary b_Step_RnD=TRUE, False inputFALSE, DoorTRUE, ESNC1/2TRUE, PLCstopFALSE. При **NC1=NC2=LVconnector=HVconnector=FALSE** после настоящего Restart0→1→0, blueTRUE600ms получены **b_EStop_Ok=TRUE, out_Door_Unlock_Solonoeid=TRUE**. Это реальный producer/output trace со state cut, не полный BOOT.

Плановое E=RnD&&!False&&CurrentEnergyPermit&&!Mentee при тех же входахFALSE; A/Eligible/BlueEnableFALSE. Значит новый shared energy permission блокирует доступ, который реальная исходная ветвь разрешает. Final07 намеренно не содержит energy connector/InterLock gate.

Green Down также не содержит таких разрешений: Network12/And7 = And1(RnD&&!False) AND TON4(green500ms) AND !blue AND And18(!b_ResetPB_Lock&&!False). Далее OR2→Decouple1 выполняет исходные Down requests. InterLocks/connectors отсутствуют в этой квалификации. Учитывать existing ResetPB lock, не превращать это наблюдение в безусловный Down.

## Исправление decomposition

Gesture/state eligibility должно сохранять собственные исходные условия. Up acceptance отдельно требует настоящие energy permissions и Mentee contract; окончательный Unlock сохраняет final07. Нельзя автоматически добавить EStop/Mentee к green Down/blue event по имени «safety»: при изменении исходного oracle нужна точная утверждённая норма.

Технически консервативный вариант: Egesture=RnD&&!False; отдельный UpAllowed=Egesture&&CurrentPermit&&!Mentee, использовать его в FinishUp и как инвертированный Reset SU. Так retained SU очищается при потере Up permission, не превращаясь в запрос после восстановления. Остальные request lifetime и fault policies требуют проверки по утверждённым требованиям, а не молчаливого общего gate.

Ресурсный итог этого прямого варианта: прежний GATE_INTERLOCK_PAIR можно переиспользовать как UpAllowed AND3, поэтому compact снова254. Два самостоятельных STO Set guards дали бы256. Это не повод вернуть неправильный общий E. Нужно отдельное доказательство дальнейшей экономии/интеграции; future And7 retirement потенциально экономит1FB, но пока не входит в утверждённый план и нуждается в настоящем fanout audit послеretarget.

Для revised netlist обязательны парные actual probes: blue access и green Down при отсутствующих energy permissions, Up blocked при тех же значениях, здоровый Up positive, fault clears retained SU без отмены уже принятого одиночного события из-за late second, сохранение ResetPB lock/Door policy. Design evaluator не должен задавать energy PermitTRUE независимо от NC; одновременно он не должен применять этот Permit ко всем жестам.

Ни один будущий пакет не принимает текущие36PASS как закрытие этих сценариев: они запускались только на healthy boundary. Обязателен новый scope/бюджет и независимый review до SAL implementation. Запись остановлена.
