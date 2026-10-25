# DoorMonitor и два InterLockNC — действующее требование

2026-10-19. Последнее решение пользователя после инженера Нива, передано
координатором: «PLC Door Monitoring внутри Safety только для соленоида
открытия крышки, НЕ energy advance guard. Если участвует в energy advance,
заменить проверкой двух Interlock Normally Closed1/2».

Это заменяет D-DOOR-CURRENT в части energy guard. Никакой новый unlock
алгоритм, отдельный locked feedback, аппаратные mappings или конфигурация
этим решением не вводятся. Реальные программные потребители ниже прочитаны
напрямую из reference и текущего SAL; SAL/tests этим анализом не менялись.

## Точные программные символы

| Роль | Имя | Variable ID в reference и v2 | Программное разрешение |
|---|---|---|---|
| Обычный PLC door input | in_Door_Monitor | 8701a4e1-b93c-46b7-a5c9-d4a942d3f324 | Только существующая соленоидная логика; не energy guard |
| Первый Interlock | in_InterLock_NC_1 | 6ea0bd28-86ec-4253-af16-e7671d60bf50 | TRUE разрешает, FALSE запрещает |
| Второй Interlock | in_InterLock_NC_2 | 7609638c-62cd-4d5e-a440-a3e26594ec02 | TRUE разрешает, FALSE запрещает |

Оба InterLock читаются в существующих guard через Break Contact(NC), т.е.
без программной инверсии. Это значения программы, не исследование электрической
полярности. Не перепутать с отдельными in_ES_NC_1/2; их проверки сохраняются.

## Все найденные потребители DoorMonitor

| Источник / consumer | Путь результата | Категория и требуемое действие |
|---|---|---|
| Reference Network2/FBAnd6/AndIn1, direct | FBAnd1/AndIn2→Safe start chain | Energy; reference содержит старую зависимость, latest requirement намеренно меняет её, reference не редактировать |
| Reference Network2/FBAnd8/AndIn1, inverted | FBRs1/Reset→соленоид | Unlock reset, сохранить |
| v2 Network2/FBAnd8/AndIn1, inverted | b_Reset_Door_Unlock | Unlock reset, сохранить |
| v2 Network12/FBAnd11/AndIn1, direct | FBAnd2/AndIn4→b_Set_Door_Unlock_1 | Unlock grant, сохранить |
| v2 Network12/FBAnd16/AndIn1, direct | FBAnd4/AndIn2→b_Set_HV_C2_1 и launch feedback chain | Energy R&D→Run; убрать Door как разрешение, обеспечить оба InterLockNC по архитектурному пакету |
| v2 Network12/FBAnd17/AndIn1, direct | FBAnd3/AndIn2→b_Reset_Door_Unlock_1 | Unlock reset, сохранить |

Эти четыре v2 consumer получены по реальным alias variable ID/targetPorts,
не basename guess. Старый reference Safe guard не означает, что текущий v2
Safe должен получить новый Door guard: его сейчас нет в N2/FBAnd6. Проверить
все energy маршруты, не только одну заменённую клемму подграфа.

Существующие InterLock consumers: reference N2/FBAnd1 AndIn5/6 и
N6/FBAnd9 AndIn2/3; v2 те же плюс shared
N1/FBAndLvCurrentPermit AndIn4/5→LV/HV Set permission gates.
Они сохраняются. Наличие final gate не оправдывает лишний Door prohibition
на upstream R&D producer. Архитектор определяет native блоки/связи без
изменения hardware или ослабления прочих разрешений.

## Обязательные сценарии фактического SAL

Исходно Safe либо устойчивый R&D, новый допустимый запрос, другие разрешения
выполнены; проверять настоящий producer→consumer и достижимую цепь по scope.

| Door | InterLock1 | InterLock2 | Ожидание energy advance |
|---|---|---|---|
| FALSE | TRUE | TRUE | Door не препятствует принятию/повышению; positive control при прочих выполненных условиях |
| TRUE | TRUE | TRUE | То же, Door не меняет energy outcome |
| FALSE/TRUE | FALSE | TRUE | Повышение запрещено |
| FALSE/TRUE | TRUE | FALSE | Повышение запрещено |
| FALSE/TRUE | FALSE | FALSE | Повышение запрещено |

Повторить оба up маршрута Safe→R&D и R&D→Run. Физический gesture и PLC
request policy не смешивать: Q-PLC-REQUEST пока отдельный вопрос. Проверки
принятого launch могут быть scoped, но не выдаются за полный внешний handshake.
Дальнейший Run confirmation по C2/Healthy сохраняется отдельно от раннего
STO release; никакое прочее разрешение не отменено.

Сохранить regression всех трёх текущих unlock consumers DoorMonitor, hold
синей/green exclusion и запрет unlock в опасных/переходных контекстах по
существующим требованиям. Не выводить из новой energy таблицы новый unlock
oracle, т.к. эти выходы имеют другие условия. EMG-002 реакция на любой
InterLockFALSE и ручное восстановление сохраняются; запрет advance не
подменяет полную аварийную процедуру.

Трассировка: SPEC§5–7, CVR-004/006, EMG-002/011, MOD-001/002/007.
B1/native wire integrity и workflow03C не отменяются. Native/hardware
валидация не заявляется; тесты текущего кода и независимое ревью обязательны.
