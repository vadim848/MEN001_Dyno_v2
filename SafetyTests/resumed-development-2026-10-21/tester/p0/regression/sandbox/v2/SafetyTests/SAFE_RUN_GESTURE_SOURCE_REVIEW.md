# Safe/Run physical gestures: source-only обзор

2026-10-19. Прочитан actual SAL после принятого earlySTO0fc39751… и reference
Prodoction4495a1f. Никаких code/test/runtime правок или новых исполняемых
трасс. Ниже статические причинные пути и условные сценарии, не fullBOOT
reachability и не счётчик независимых дефектов. Globalorder и нормализованные
canonical edges учтены parser. Аппаратные источники не исследуются.

`b_Step1` — текущая Safe boundary; `b_Step3` — Run/armed boundary,
`b_Step_RnD` — устойчивый R&D. Это существующее сопоставление state latch
экспортов, не вывод по одному имени и не объявление всех промежуточных
шагов самостоятельными режимами. Network3 остаётся внешним typed owner cut
для последующих component сценариев; Network4/fullgroup здесь не исполнялись.

## Safe blue / существующий соленоид

Actual Network2:

- FBDecouple3(order100) читает b_Step1; DecOut1→FBAnd7/AndIn1.
- FBAnd7(order101) AndIn2=in_Relase_Door_PB direct, выход
  GVL1.b_Set_Door_Unlock→Network1/FBOr4→FBRs6.
- FBAnd8(order104) = Safe AND NOT in_Door_Monitor, пишет
  b_Reset_Door_Unlock→FBOr3→FBRs6.Reset. Door роль сохраняется D-Niv.
- Final sole writer FBAndUnlockHold дополнительно требует heldblue,
  !green, latchedEStopOK и !currentPLCstop согласно01/07.

У Safe blue producer НЕТ TON500, release2000, chord250 или памяти новой
попытки. Существующая проверка current-unlock-hold.test.js прямо фиксирует
«Safe has no blue TON»; это actual hold producer regression, не принятие
BTN-004/BOOT-002. При typedSafeTRUE/DoorTRUE/healthyEStop/blueheld наentry
grant может появиться без предварительной очистки и500мс qualification.
Это условный source counterexample ожидаемой qualification, не полный старт.

Connector inputs не входят в Safe blue producer/finalUnlock. EMG-003
разрешает connector absence вSafe безfault и запрещает только повышение;
добавить connector gate вSafe blue было бы новым ошибочным ограничением.
Positive access сценарий: typedSafe, DoorTRUE, healthyEStop, connectorsFALSE,
корректно подготовленная blue — connector сам не запрещает доступ. Это НЕ
позитивное требование открыть при DoorFALSE: существующий reset выше имеет
приоритет. NCexternal loss имеет собственный Emergency контракт; не выдавать
его за то же самое, что штатное отсутствие connector вSafe.

## Safe BOTH → следующая ступень

Actual физический путь:

`b_Step1 & green & blue → Network2/FBAnd10(order238)
 → FBTon3(order26,1.0s) → FBAnd4(order27) → FBOr1(order239)
 → b_Step12_Set + FBDecouple5(order243) → SetTransition1/SetLockResetPB1`.

FBAnd4 также требует FBAnd3: исходная Safe guard цепь
FBAnd1(order1) объединяет Safe, NC1/2, externalInterLock1/2, connectors,
!PLCstop/!Mentee; далее TON1(0.1s), C1/C2 feedbackOFF,
TON2(0.1s), обаSTOfeedbackTRUE → FBAnd3. Эти исходные подтверждения
нельзя удалить при замене распознавания. Поздние preproducers→ранниеTON
создают реальные scan задержки; таймер1с не равен timestamp внешнего press.

BOTH здесь level-based AND; нет окна250 и release2000. При всех прочих
feedback/permissionsTrue перваяgreen, втораяblue через300мс всё ещё могут
дать совместный TON1с. По D-LATE-SECOND это невалидная попытка и не должна
давать StepUp. Удержание обеих наentry также не содержит собственного
rearm запрета. Эти сценарии надо проверять на actual component с continuous
observer, без подстановки нового recognizer/model вместо рабочего SAL.

PLC10 ветвь FBAnd61/81/91 входит втотжеFBOr1 параллельно физической;
самостоятельная PLC policy QP не разрешена и здесь не выбирается. Не
считать её level-path обходом физического окна в тесте physical-only,
но сохранять видимость как отдельного обязательного gap.

## Green Restart ≠ Safe launch

Reference green `in_Reset_PB` читает FBEstop1.Restart и Network2/FBTon3,
тогда TON3=2.0с → FBAnd4 → b_Step2_Set, а blue только Safe unlock.
Reference не имеет новой устойчивой R&D остановки. Actualv2 green по-прежнему
Restart mainEStop, но Safe physicallaunch уже BOTH/Ton3=1.0с и Step12Set.
Это намеренное изменение последовательности дляR&D; нельзя вернуть
green-only energylaunch под лозунгом preserveoriginal. Нельзя также обернуть
Restart в новый commandrecognizer и лишить существующую процедуру аварийного
квитирования без отдельного доказательства: restart и normalgesture различны.

Нормативно singlegreen вустойчивомSafe оставляетSafe (§15), но физический
Restart продолжаетсвоюроль. При доступных источниках этот контракт определён,
нового вопроса пользователю для него не требуется.

## Run green down

Actual путь:

`green → Network6/FBTon2(order208,0.5s)
 → FBAnd24(order252: !ResetPB_Lock & !FalseInput & TON)
 → FBAnd23(order245: предыдущийAnd24 & Step3qualification & !blue)
 → FBOr5(order212) → FBDecouple2(order205)`.

Step3qualification = Network6/FBAnd1(order52): b_Step3 & !FalseInput.
Decouple2 общим source выдаёт ResetSTO_DR2_4/DR1_4,
SetHVDischargeRequest3 и ResetHVC2_4. Далее TON1(0.2с) и C2feedbackOFF
пишут Step12Set2. Это существующий normaldown request route, не доказанная
SS1/discharge normative последовательность. DISCHARGE_PROGRAM_CONTRACT
разбирает порядок отдельно; не смешивать gesture acceptance с завершением.

TON2 считает rawgreen даже когдаblueON и независимо от mode entry/arming.
Поэтому при typedRun и !Lock/!FalseInput новый down может появиться сразу
после отпусканияblue, если greenуже держалась0.5с; память необратимой
TwoButtonsAttempt/releasefilter здесь отсутствует. Длясценария «короткий
неудачный chord (<BOTH1с), затем осталасьgreen» запрет single уже задан
BTN-007 и не зависит от QR о НОВОМ полномBOTH вRun. Это можно проверять
без получения QR ответа. HeldgreenatRunentry также требует отдельного
BOOT/rearm сценария; существующий rawTON не доказывает его выполнение.

Run PLC01 через And15/16/17→Or5 — отдельный level path. В physical-only
trace держать код неактивным и явно записать фон; не объявлять это
доказательством отсутствия PLC-only handshake gap.

## Existing coverage / следующий узкий пакет

| Область | Уже есть | Что не закрыто |
|---|---|---|
| Safe solenoid | Actual01/07 hold/reset/EStop tests | Blue500qualification, entry/releasefilter/late/chord exclusivity вSafe |
| Safe BOTH | Actual guard/ownership и source mapping | Inclusive250, release2000, newevent/heldentry; настоящая подтверждающая цепь доStep12 |
| Run green | Исторические Network6 baseline/output suites читают pinnedfixture | Current physical request continuity/qualification/rearm/nochorddegradation сactualglobalorder |
| R&D | Принята03B/R3 branch, physicalcases | Не доказывает Safe/Run распознавание автоматически |

При будущем тестировании typedstate/ResetPB_Lock/FalseInput/feedback фон
задаются явно, полный sourcebinding audit доcut. Не подменять допустимый
Safeconnectorabsence R&D аварийным случаем. Исторические2.0с/старые1/2с
ожидания не нормативны текущимsingle0.5/both1/window250 решениям; существующие
заданные таймеры не менять без утверждённого пакета.

QR(validBOTHвRun) иQT(новыйGreenвоStartingRun) остаются pending, сценарии
выбораendpoint изних здесь НЕсозданы. Не нужны новые вопросы для явно заданных
Safequalification/invalidchord/heldentry требований. Слотыnative255 —
техническое ограничение реализации, не основание ослабить эти требования
или объявитьcomponentмодель полноценным исправлением.
