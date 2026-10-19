# Iteration06 — два InterLock NC вместо Door в energy guard

2026-10-19. Основание: latest D-DOOR-INTERLOCK после инженера Нива;
reviewed plan06, phaseA tests-first checkpoint e6ee0db. Это намеренная
программная смена energy condition, а не попытка получить зелёный отчёт.

SAL до:6ed0c79094a2530be3ab9323abb832d88e56d60c9bb19773f03a32367b6d7ad5.
После:23cb1dd91d983b309294936fa8563cf9d669427401d38337c6b3c9647875adf2.
SGVL SHA194b4b14511b9775ea12294fdab9518875c7aeb0f2a43994110550001dea8089
не изменён; git diff SGVL против checkpoint пуст.

## Минимальное изменение рабочего кода

Network12/FBAnd16 теперь `in_InterLock_NC_1 AND NOT in_False_SI2_CH8
AND in_InterLock_NC_2`. Существующий AndIn1 перепривязан с Door на NC1;
AndIn3 активирован прямым контактом NC2. AndIn2/инверсия FalseSI2 сохранены.
Удалён один Door target usage, добавлены два proper InterLock target usage.
Не использованы отдельные in_ES_NC_1/2 вместо нужных InterLock NC.

Door сохранил ровно три исходных потребителя: Network2/FBAnd8 и
Network12/FBAnd11/FBAnd17. Их source-код и truth tables сохранены. And16→And4
wire, downstream HV/feedback sequence, shared permits, Reset/discharge,
alias descriptors/source usages, SDS/channel mappings и source variable IDs
не менялись. Ноль новых blocks, прежние209 orders и все TON без изменений.
SAL diff20 additions/10 removals: только эти logical usages и один port flag.
Настоящие globals/SGVL не добавлялись, bare refs не создавались.

## Проверки и oracle migration

PhaseA35 tests:23PASS/12FAIL на старом SAL. После реализации те же35 PASS.
Дополнительный structural test проверяет exactDoor3targets, два InterLock
targets, False binding, полярности и block count209; итого36/36 PASS.
Обе actual source цепочки physical BOTH и existing PLC levels доходят через
And4→OR18→HV Set gate→RS. DoorFALSE+обаNC TRUE теперь поднимает HV;
каждый NC FALSE запрещает и upstream request, и новое HV при обоих Door.
PLC-level regression не является придуманным контрактом PLC handshake.

B1 metadata обновлены с точной разрешённой delta: прежние11 восстановленных
alias consumers плюс два новых NC consumers и единственное удаление Door
energy consumer. Все прочие consumers, alias descriptors и sources строго
сравниваются с pinned fixture. Это не ослабление binding integrity.

Startup-held negative case `BUTTON:open-cover-chord` не перекрашен в PASS:
он начинается с удерживаемых кнопок без release/arming, поэтому его запрет
остаётся требованием recognizer независимо от Door. Уточнена именно причина
запрета; Door больше не назван energy permission. Компонентные начальные
условия ready дополнены явно TRUE двумя NC. Их healthy значения не заменяют
самостоятельные отрицательные controls.

ACC-C02-F и общий coverage gap больше не требуют отдельного locked feedback
и не называют Door energy condition. NV оставлен как неполнота полного
phase coverage двух InterLock energy guards и отдельной Door solenoid logic.
Historical source fixtures и их qualitative reproductions не менялись.

## Результат и пределы

Full npm run check:software: harness174/174, historical75/75, current69/69;
166 PASS /35 FAIL /5 NOT VERIFIED /0 ERROR, exit1. Все существующие functional
case статусы относительно e6ee0db сохранены;12 новых phaseA дефектов закрыты
в отдельном current suite, а не спрятаны изменением общего счётчика cases.
Standalone candidate report перегенерирован с новым SAL SHA/clock metadata.

Fullsource B1 audit PASS до component cuts. Сохранены отрицательные EStop,
connector и False controls; Mentee05 не объявляется выполненным этой итерацией.
Safe source component проверен на отсутствие Door зависимости, полный внешний
accepted launch/весь lifecycle этим не доказан. Остаточные35FAIL, включая recognizer,
и coverage gaps видимы. Clock observed-fixed-scan-v1 не менялся.

Recorded CRC872783435 не объявляется regenerated. Reference, hardware,
проводка и .sal.diagram не менялись. Verify/Build/native/hardware validation,
deployment и push не выполнялись. Состояние передано на независимое ревью;
запись остановлена.

Финальная правка форматирования: удалены только пробелы на пустой строке11412
после удаления Door usage. Прежний pre-format SHA9d9ec836… заменён указанным
выше; программная структура не менялась. Door+B1 targeted55/55 PASS,
latest reports перегенерированы с финальным source SHA.
