# Независимое ревью iteration07 r2

2026-10-19. После STOP редактора проверены r2/RED checkpoint, actual
SAL+SGVL diff, native bindings, fault/control traces, изменения component
границ в старых тестах и implementation report. Код ревьюер не менял.

## Вердикт

Iteration07 r2 принята в пределах NC1/PLC запрета конечного Unlock.
Существенных незакрытых замечаний нет. Первоначальный ordering blocker
устранён программной связью, а не изменением first-fault oracle.

SAL SHA:
`bf110ab452a5d9d3fcafd1acc5ab657b993e3e2828f384a63c1491c57b2cdcc6`;
SGVL SHA:
`508610b92e60ae602a75952113b34f7a8bd9c3f283fbb93dfa45b6a532f0a3ba`.

## Реальная структура и причинность

Final AND имеет прежние grant/blue/!green и новые direct b_EStop_Ok на
AndIn4 и inverted rawPLC наAndIn5. True SGVL GUID разрешается через полные
wrappers, ровно один новый TargetUsage; PLC является existing SAL alias
с ровно одним новым logical target, не fake GVL global. Других source/
declaration/index изменений нет. Нет новых blocks/orders/timers/runtime
или energyPermit зависимости. Door consumers и Mentee05 не затронуты.

При NC1 fault EStop21 снимает OK до final209. При PLC fault EStop21 ещё
видит прежний healthy producer, но current rawPLC уже запрещает final209;
на следующем sample EStop21 читает снятый AND95 и удерживает запрет при
raw restoration. Односэмпловый pulse проверен отдельно. Тесты не подставляют
EStopOKFALSE и не заменяют первый sample ожиданием100мс. Оба реальных Safe/
R&D grant producers и manual high/falling Restart дают здоровый UnlockTRUE.

## Проверки и сохранение oracle

Самостоятельно57/57 targeted PASS:28 Unlock07 +19 B1 +6 CVR +4 HV.
28 RED сценариев с17PASS/11FAIL сталиPASS. Полная16-строчная component
таблица и actual fault traces взаимно дополняются. Component healthy grant
при отсутствующих energy connectors/InterLocks остаётся разрешённым;
full source имеет свои прежние аварийные реакции, которые тест не отменяет.

Old scoped grant/hold/wire tests теперь явно задают здоровые EStopOKTRUE/
PLCfalse на срезанной границе; их fault ожидания не ослаблены, проверяются
отдельно полными actual EStop компонентами. B1 exact alias delta расширена
на один PLC consumer, SGVL сравнение допускает только один новый07 usage
помимо ранее принятого B1; declaration/прочие indices сравниваются строго.
Пять active inputs проверены, old Door/blue/green таблицы сохранены.

Прочитан полный результат174 harness/75 historical/112 current tests PASS;
172 PASS/29 FAIL/5NV/0ERROR. Ровно ACC-C01-E-Step1 и Step_RnD сталиPASS,
новых FAIL/прочих status changes по отчёту нет. Все source hashes свежие.

## Предел приёмки

NC2/Mentee/external sources не все снимают EStopOK; весь EMG-007,
transition/energy-safe owner и recovery не закрыты этим gate. Основные29FAIL/
5NV, recognizer/merged PLC/full launch остаются открытыми. Actual initial
Safe/R&D заданы как component scope; полной reachability это не доказывает.
Native Verify/Build/CRC/аппаратная validation не выполнены и не скрытый gate;
recorded CRC не объявлен regenerated. Reference/hardware/.sal.diagram
не менялись, загрузка и безопасность оборудования не подтверждаются.
