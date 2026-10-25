# Независимое ревью плана06 — Door/InterLock

2026-10-19. Проверены latest AGENTS, D-DOOR-INTERLOCK,
DOOR_INTERLOCK_REQUIREMENT.md, ITERATION_06_PLAN.md и фактические alias
consumers/And16 порты рабочего SAL. Код/тесты ревьюер не менял.

## Вердикт

План принят к реализации после стабильной точки, указанной владельцем.
Существенных замечаний нет. Требование намеренно изменяет исходную energy
зависимость от Door и имеет приоритет над прежним Door-current решением.
Подтверждение требования не подтверждает аппаратную безопасность.

## Проверенные границы изменения

Actual v2 Door имеет ровно четыре consumers: три unlock и один And16 energy.
And16/AndIn1 с указанным GUID сейчас direct Door, AndIn2 inverted FalseSI2,
AndIn3 deactivated. План заменяет первый источник на in_InterLock_NC_1 и
активирует третий direct in_InterLock_NC_2, сохраняя inverted FalseSI2 и
проводимость And16→And4. Это именно InterLock, не ES_NC1/2.

У двух existing interlock variables используется подтверждённый direct
программный уровень TRUE=разрешение; вывод об электрической полярности не
делается. Alias source descriptors/mappings остаются прежними, меняются
только logical target usages по B1. Новых блоков/SGVL/orders/timers нет.
Все три Door unlock consumers, их контактные полярности/связи и final hold
gate сохраняются. Из energy DoorFALSE positive не выводится новый unlock
oracle. EStop/connector/Mentee и прежние interlock guards не обходятся.

## Достаточность запланированных тестов

Tests-first RED до изменения SAL сохраняет источник/SHA и показывает
DoorFALSE+обаNC TRUE failure текущего energy guard. Матрица всех Door/NC1/
NC2/FalseSI2 сочетаний докажет независимость energy от Door и запрет каждым
NC. Положительная actual physical и existing PLC route через And4→HV
необходима, как и отдельная Safe→R&D проверка отсутствия скрытой Door
зависимости. PLC route regression не назначает новую handshake policy.

Старые current expectations «DoorFALSE само запрещает энергию» должны
меняться только с трассировкой latest user decision; historical fixture
reproductions сохраняются. Точная alias delta remove1/add2 и неизменность
трёх unlock consumers, source descriptors, SGVL/timers/order должны
проверяться целым source audit до подграфов и независимым ревью реализации.

Новая energy таблица не закрывает всю аварийную последовательность или
Run confirmation. Общие FAIL/NV сохраняются до реального исправления;
native/hardware validation не становится скрытым gate.
