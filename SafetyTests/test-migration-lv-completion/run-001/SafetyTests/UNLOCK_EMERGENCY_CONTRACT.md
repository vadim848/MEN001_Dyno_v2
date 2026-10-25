# Unlock: узкий аварийный контракт Safe/R&D

2026-10-19. Аналитик; direct read reference Prodoction4495a1f и текущего SAL.
Никаких SAL/tests/SPEC изменений. Рассматривается программный запрет конечной
команды при EStop, не redesign соленоида или снятия энергии.

## Однозначные требования

EMG-007 запрещает unlock в Emergency/переходах/до завершения снятия опасной
энергии. CVR-001/002 разрешают только квалифицированную held-blue без green
в допустимых Safe/R&D, не постоянный соленоид от режима. §12/EMG-006 не
разрешает возвращаться из аварии простым восстановлением входа без ручного
сброса. D-DOOR-INTERLOCK меняет energy guards, а existing DoorMonitor
grant/reset соленоида сохраняет. Никакого нового unlock поведения из пары
InterLock или её названия выводить нельзя.

## Реальные программные пути

В reference sole unlock writer — Network2/FBRs1. Set идёт от Safe и blue
через FBAnd7; Reset от Safe и NOT DoorMonitor через FBAnd8. Прямого запрета
EStop в этом latch нет. Поэтому сохранение исходного кода само по себе
не закрывает новое EMG-007 требование и не отменяет его.

В текущем v2 grant Safe/R&D объединяется Network1/FBOr4→FBRs6. Reset
FBOr3 объединяет два существующих door reset, NOT blue и green. Конечный
sole writer FBAndUnlockHold = grantLatch AND blue AND NOT green; в нём
нет EStopOK/аварийной памяти. Так ACC-C01-E-Step1/Step_RnD может сохранить
TRUE при удерживаемой blue через NC1 fault.

Одинаковый reference/v2 EStop компонент:

| Программный элемент | Реальная связь/реакция | Предел |
|---|---|---|
| in_ES_NC_1 | Активный FBEstop1/EStopIn1, прямое значение | FALSE снимает EStopOut |
| in_Estop_PLC | FBAnd1: NOT PLCstop AND NOT in_False_SI2_CH8 → активный EStopIn3 | PLCstopTRUE снимает EStopOut; не выводить physical meaning второго входа |
| FBEstop1/EStopOut | GVL1.b_EStop_Ok | Сохраняет отсутствие разрешения после восстановления NC1/PLC до подготовленного ручного Restart |
| in_Reset_PB | Restart FBEstop1 | Существующий component contract: high preparation, falling edge; green дополнительно запрещает unlock |
| in_ES_NC_2 | EStopIn2 Both Deactivated | По target имени не считать активным аварийным latch; другие исходные guard/Run цепи остаются |
| in_Mentee_EStop | EStopIn4 Both Deactivated | Отдельный MENTEE_PROGRAM_CONTRACT, не активировать порт этим пакетом |

Следовательно, для воспроизводимого NC1/PLC контрпримера существует уже
согласованный программный latched permission: b_EStop_Ok. Самостоятельный
raw NC1 guard снял бы выход при fault, но позволил бы возврат после raw
восстановления при старом latch. Это не соответствует указанному сценарию.
Точный native gate/reset и scan ordering — задача архитектора, не новое
требование пользователя. Изменение конфигурации EStopIn2/4 не разрешается.

## Приёмочные сценарии узкого пакета

1. Safe и отдельно R&D: реально подтверждённый held-blue unlock, greenFALSE,
   EStopOKTRUE. Fault NC1FALSE → конечный UnlockFALSE. Возврат NC1TRUE без
   ручного reset → остаётсяFALSE; предыдущий grant не обходит аварийную память.
2. То же для PLCstopTRUE, затем FALSE. Использовать действующий EStop
   компонент, не только принудительный внутренний b_EStop_Ok.
3. Авария раньше старого Set в скане либо одновременно с Set не может дать
   конечный UnlockTRUE. Проверить positive control с теми же producers и
   здоровым EStop, actual final writer и global order.
4. Отдельно b_EStop_OkFALSE при raw inputs restored: held-blue не открывает.
   Это component latch-boundary тест, не полный startup/recovery proof.
5. GreenON/blueOFF продолжают снимать выход; все существующие DoorMonitor
   grant/reset маршруты сохранены. Не требовать открытия при DoorFALSE,
   если существующий upstream reset это запрещает: новое решение требует
   СОХРАНИТЬ этот соленоидный контракт, а не устранить все зависимости Door.
6. Изменение InterLock/connector при неизменных legitimate Safe/R&D grant,
   healthy EStop и снятой опасной энергии не должно вводить новый запрет
   непосредственно через заимствованный energy currentPermit. В component
   final-gate тесте эти входы не разрешают/запрещают выход сами по себе.
   Полная цепь может иметь собственную существующую аварийную реакцию;
   её нельзя отключить ради такого positive control.

Использовать FBAndLvCurrentPermit для unlock неправильно: он включает
connector/interlock условия повышения, а отсутствие connector в Safe —
лишь запрет повышения EMG-003. Это не доказанный запрет штатного доступа.
Равным образом нельзя бессрочно открыть от условного «Safe mode» при
EStopOKFALSE или перед переходом в аварийное состояние.

## Что узкий пакет не закрывает

NC2/Mentee/external InterLock аварии не все снимают b_EStop_Ok в текущем
компоненте. Поэтому один EStopOK gate не закрывает целиком EMG-007 для всех
источников. Требуются отдельные программные traces аварийного owner/latch,
переходных фаз и завершения снятия энергии. Нельзя незаметно приравнять
все эти raw входы к energyPermit либо объявить простое rawAND полной
аварийной памятью. Исходная Emergency реакция на InterLock сохраняется.

Нового вопроса поведения для NC1/PLC запрета сейчас нет: source и требования
однозначны. Возможная будущая неоднозначность возникает лишь при попытке
расширить контракт доступа на конкретное external-interlock/open-cover
событие в Safe: сначала сопоставить фактический аварийный owner и утверждённые
реакции, не выводить физическую связь крышки и InterLock. Этот анализ не
просит аппаратных данных и не превращает будущий gap в blocker узкого пакета.

Тесты seeded Safe/R&D и исключённый Network4 фиксировать как ограничения;
первый model scan — не физическая гарантия времени. Независимое ревью должно
проверить, что закрытие двух FAIL не выдано за полное закрытие EMG-007.
