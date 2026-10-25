# Lock feedback — адресная программная трассировка

2026-10-19. Только чтение reference Prodoction4495a1f и v2. По последнему
поручению пользователя проверены существующие объявления, программные mapping
и потребители. Проводка, hardware configuration и глобальные параметры не
исследовались и не менялись. Тесты/рабочий код этим анализом не меняются.

## Последнее решение

Пользователь через координатора: «Если в оригинале он смотрел на DoorMonitor
и игнорировал Lock Feedback Safe, то это неверно, это надо исправлять».
Это не разрешает DoorMonitor-only приёмку и не доказывает, что найденный по
имени сигнал является пригодным locked feedback. Ранее отменённое «как в
оригинале» не считается утверждённым решением.

## Проверенные программные цепи

| Участок | Reference | v2 | Доказательство и предел |
|---|---|---|---|
| Входной DoorMonitor | GVL_Safety.DoorMonitorFromPLC, BOOL AT%I | То же | GVL_Safety.TcGVL:9 |
| Входной другой статус | GVL_Safety.SolonoidStatus, BOOL AT%I | То же | GVL_Safety.TcGVL:10; имя не задаёт locked polarity |
| Существующий program mapping | A14 Channel2 Input→DoorMonitorFromPLC; Channel1 Input→SolonoidStatus | То же | reference tsproj:11776–11777, v2:13131–13132; статические записи не физическая валидация |
| Передача DoorMonitor | MAIN:25 копирует DoorMonitorFromPLC в stTwinSAFE_OUT.DoorMonitor | MAIN:27 делает тот же copy | Явная программная assignment найдена |
| Другое поле интерфейса | ST_TwinSAFE_OUT.SolenoedMonitor:BOOL | То же | DUT:11; отдельное от SolonoidStatus поле |
| Передача SolonoidStatus→SolenoedMonitor | Assignment не найдена поиском PLC POUs/GVLs/DUTs | Assignment не найдена | Объявление/похожее имя не доказывает доставку значения |
| Интерфейс к TwinSAFE | SolenoedMonitor→Standard In Var15 | То же | reference tsproj:11813, v2:13199 |
| SDS15 | IN_BIT_SolenoidMonitor.sds:StandardAliasDevice, BIT, Manual | То же | Descriptor не содержит доказательства locked смысла/полярности или safe-квалификации |
| Использование SDS15 в SAL | Переменных с alias.sdsId15 нет | Переменных с alias.sdsId15 нет | parseSalFile variables search; соответствующая guard-цепь не обнаружена |
| SolenoedMonitor в MAIN | Читается в условии LED: DoorMonitor AND SolenoedMonitorFALSE | То же, дополнительно исключён R&D | ref MAIN:77, v2:80; LED-ветвь не доказывает обратную связь блокировки |
| SolonoidStatus в VISU | Отображается | Отображается | Найден read в Visualization.TcVIS; не acceptance guard |

Reference SAL DoorMonitor используется в Network2/FBAnd6 (guard) и FBAnd8
(reset unlock). Во v2 Network12/FBAnd16 передаёт DoorMonitor к FBAnd4,
который выдаёт HV request при R&D и request. Эти потребители подтверждают
использование DoorMonitor, но не closedANDlocked семантику входа. Подробная
исходная последовательность сохранена в REFERENCE_PHASE_MAPPING.md.

## Что установлено и чего не хватает

Есть отдельно объявленный/отображаемый входной статус и отдельно mapped поле
для solenoid monitor. В сохранённом программном коде не подтверждены ни copy
между ними, ни использование SDS15 как SAL guard. Нет найденного документа,
задающего для этих полей «TRUE = крышка закрыта и механически заблокирована»
либо обратную полярность. Нельзя по имени Solenoid считать статус safe lock
proof, подставлять DoorMonitor вместо locked или использовать команду Unlock
как обратную связь.

Адресный вопрос пользователю: какой из существующих программных сигналов
является требуемым Lock Feedback Safe — SolonoidStatus/SolenoedMonitor либо
иной (укажите имя или документ)? Какое значение подтверждает блокировку?
Нужен программный контракт, а не схема проводки. Если такого подтверждения
в существующем интерфейсе нет, зависимый guard нельзя завершить подстановкой
неподтверждённого сигнала; требуется решение о доступном программном входе.

До ответа не назначать неизвестный статус locked oracle. Требование о
closed+locked сохраняется, DoorMonitor-only не принимается. Блокируется
зависимая StartingRun permission часть; independent window/HV проверки
продолжаются. Аппаратная безопасность этим статическим анализом не заявляется.
