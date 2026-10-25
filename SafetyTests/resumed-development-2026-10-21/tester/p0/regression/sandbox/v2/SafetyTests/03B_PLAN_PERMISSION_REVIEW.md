# Независимое ревью03B — energy permission в общем recognizer

2026-10-19. Read-only проверены compact plan, актуальный07 SAL и реальные
blue/green producer зависимости с помощью принятого physicalRndSource.
Код/план/тесты ревьюер не менял.

## Уточнённый вердикт: неподтверждённый риск, нормативная сверка у аналитика

Compact graph задаёт E=RnD&&!False&&CurrentPermit&&!Mentee для всех
blue/green/chord/rearm и retained SG/SU. CurrentPermit включает NC1/2
external InterLock и оба energy connectors. Это добавляет не только up guard,
но запрет blue/down/очистки, отсутствующий в исходных соответствующих ветвях.
Но отсутствие запрета в source не делает его нормативным. SPEC§5.1/EMG-002
требует Emergency при любом external NC loss, EMG-004 — при connector loss
после Safe. Эти утверждённые требования выше permissive исходного кода.
Latest Door/NC energy decision не отменяет их.07 избегал energyPermit
запрета доступа в Safe; этот positive control нельзя переносить на R&D fault.

Техническая приёмка count/typing/replay253 не доказывала положительные
blue/down controls при CurrentPermitFALSE. Её доказательство E⇒NC корректно
для выбранного E. Source traces сами по себе не опровергают E как R&D
emergency inhibit и не отменяют оптимизацию. Прежний вывод «обязательно
переработать generic E» отозван как преждевременный. Нормативную сверку
выполняет аналитик; новые permissive fault oracles до неё не добавляются.
Полезные actual RED tests сохраняются.

## Статическая и динамическая проверка source

Actual Network12/FBAnd1=RnD&&!FalseSI2. Blue FBAnd2 использует этот общий
ветвевой enable, blueTON, !green и Door grantAnd11. Green FBAnd7 использует
тот же enable, greenTON, !blue и прежний And18 guard. Эти пути не получают
CurrentPermit/connector/InterLock energy inputs как общий recognizer enable.
Final Unlock после07 проверяет grant,blue,!green,EStopOK,!rawPLC.

Независимо воспроизведены восемь current-source sequences:

1. Реальный manual Restart, реальный Step12 LV setup; затем явная R&D
   ownership boundary, DoorTRUE, HVFALSE, остальные входы здоровы.
2. Один из in_InterLock_NC_1/2, in_LV_Connector_Interlock,
   in_HV_Connector_Interlock заданFALSE.
3. Blue после полного удержания600мс: actual blue requestTRUE и UnlockTRUE.
4. В отдельной идентичной последовательности green600мс: down requestTRUE,
   actual LVFALSE через прежний потребитель.

Во всех восьми наблюдениях EStopOKTRUE, CurrentPermitFALSE и demanded
unknown0. Compact E при этих же source inputs FALSE, значит новые
blue/down события не будут приняты; retained commands тоже могут очиститься.
Это конкретное различие программных зависимостей, не вывод по именам входов.

## Что этот контрпример НЕ утверждает

Явно удержанная R&D boundary не доказывает допустимость реального режима
после аварийной потери connector/InterLock или безопасность доступа.
Полная Emergency owner/lifecycle реакция остаётся отдельным обязательным
требованием; permissive старый source не отменяет утверждённый EMG-007.
Нельзя взять эти traces как новый нормативный oracle «открывать при любой
аварии» либо «разрешить full recovery без Reset». Электрика не исследовалась.

Нужно подтвердить scope general recognizer/access/down и energy-up permissions
по утверждённым требованиям/source. CurrentPermit требуется для up и может
обоснованно участвовать в общем R&D emergency inhibit. Если остаётся вопрос
конкретного Emergency/accepted-command исхода, вернуть аналитику, не закреплять
противоречивый oracle. Сама source зависимость blue/down доказана однозначно.

## Условия нового ревью

Сначала аналитик сопоставляет EMG-002/004, Door decision и07 Safe controls.
Новых положительных R&D unlock/down ожиданий при активной аварии не вводить
из одного старого source. Если аналитик подтверждает действующий emergency
inhibit, изменений графа только из-за этих восьми traces не требуется.
При отдельном подтверждённом конфликте архитектор пересматривает граф
адресно. Whole-source/full-package приёмка сохраняется. Новой hardware
проверки/gate этот аудит не создаёт, новый unlock алгоритм не назначает.

## FINAL — нормативный HOLD закрыт

Прочитан03B_GESTURE_REQUIREMENT_DECISION.md аналитика: R&D eligibility с
currentPermit обоснован утверждёнными EMG-002/004/007 и приоритетом Emergency.
Permissive старые fault singles не являются сохраняемым положительным oracle.
Нивовское изменение Door energy guards не отменяет эти аварийные требования;
физическая корреляция Door/NC из него не выводится. Safe connector absence
остаётся отдельным сценарием и не получает blanket запрет доступа.

Существенный defect shared E не подтверждён. Требование переработать E или
вернуть old permissive fault behavior снято окончательно; обязательного
нового вопроса пользователю нет. Оптимизация253 и ранее принятый actual RED
пакет61 сохраняют действие. Нормативный HOLD на этом основании закрыт:
можно переходить к source implementation после согласованного checkpoint.

Это не actual SAL acceptance. Сброс SG/SU нормального recognizer при
аварии не доказывает сохранение downstream emergency/transition owner:
интеграция обязана проверить реальные связи, causal ordering и сохранение
исходной safety sequence. Full-source B1, actual RED→green, полный пакет и
независимое ревью остаются обязательными; неизвестные downstream реакции
не подменяются булевой алгеброй или нормальным late-button правилом.
