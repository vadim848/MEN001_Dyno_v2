# Iteration06 — READY: два InterLock вместо Door в energy guard

2026-10-19. Последнее D-DOOR-INTERLOCK/DOOR_INTERLOCK_REQUIREMENT.md имеет
приоритет над прежним Door-current energy guard. Аналитический и прямой
SAL inventory сверены. Работать после стабильной точки03C/05 по владельцу.
Ноль новых блоков: 209 и все execution orders/timers сохраняются.

## Точный программный diff

Existing Network12/FBAnd16:

- AndIn1 Idd81ef182-5e01-48a2-8d5f-282848528028: удалить ТОЛЬКО logical
  target usage этого порта из in_Door_Monitor. Привязать сюда existing
  in_InterLock_NC_1 Id6ea0bd28-86ec-4253-af16-e7671d60bf50 через SAL alias
  targetUsages proper DSL wrappers. Direct Break Contact(NC) сохранить.
- AndIn2 Id35e64071-8f6b-4c1f-8506-2bfc448b557b: existing inverted
  in_False_SI2_CH8 не менять.
- AndIn3 Id6ae6a1d8-a205-467e-b645-f59830e5e7ef: Activated,
  deactivate1=Break Contact(NC), source existing in_InterLock_NC_2
  Id7609638c-62cd-4d5e-a440-a3e26594ec02 через новое target usage.

Итог: And16=InterLockNC1 && !FalseSI2CH8 && InterLockNC2.
And16→FBAnd4/AndIn2 wire и остальная HV/feedback последовательность unchanged.
Alias source descriptors/SDS/channel mapping неизменны. Истинных новых
SGVL declarations нет, никаких GVL1.in_* refs. Не перепутать in_ES_NC_1/2.

У DoorMonitor сохранить ровно существующие unlock consumers:
Network2/FBAnd8/AndIn1, Network12/FBAnd11/AndIn1, Network12/FBAnd17/AndIn1.
Никакой новой unlock политики и отдельного locked feedback. Reference не
менять: его старая energy зависимость намеренно superseded latest decision.

## Приёмка actual SAL

ФазаA до изменения SAL: добавить эти actual-code сценарии, запустить на
текущем source и сохранить RED baseline с SHA/наблюдениями. В частности
DoorFALSE+NC1/2TRUE при остальных permissions обязано воспроизвести старую
блокировку как FAIL нового требования. RED baseline не ослаблять; передать
владельцу готовый тестовый пакет для checkpoint, затем фазаB меняет SAL.

1. B1 fullsource validator, alias exact delta: один Door target удалён,
   два InterLock target добавлены; исходные descriptor/source и остальные
   consumers, SGVL, orders, TON и ранее принятые guards unchanged.
2. Component And16 таблица всех Door×NC1×NC2 и FalseSI2:
   выход соответствует NC1&&NC2&&!False, не зависит от Door. Positive
   DoorFALSE+обаNC TRUE обязателен. КаждыйNC FALSE блокирует при обоих Door.
3. Real chain physical BOTH и existing PLC-up путь каждый до And4/HV Set:
   DoorFALSE+обаNC TRUE+остальные прежние permissions → та же positive
   energization sequence, что DoorTRUE; каждыйNC FALSE нового HV не даёт.
   Это существующий PLC route regression, не утверждение новой PLC policy.
4. Safe→R&D existing source path проверить на отсутствие скрытой Door
   energy зависимости; не добавлять новый guard по аналогии с reference.
   Отличать обычный request от фактического out_LV_C1/out_HV_C2.
5. Все три unlock consumers и их таблицы/проводимость сохраняются: latest
   decision НЕ требует DoorFALSE grantUnlock и не меняет reset/hold logic.
6. Остальные EStop/connector/Mentee/False/input guards отрицательными
   controls остаются действующими. Не задействовать Door вместо interlock.
7. Full npm run check:software + независимое ревью. Старые active oracle,
   требующие блокировать энергию только DoorFALSE, обновлять с прямой
   трассировкой latest user decision; historical fixtures/reproductions
   сохранять. Не объявлять такую смену oracle «исправлением SAL под зелень».

Файлы редактора: рабочий SAL и affected actual tests/reports. Historical
reference/fixture, hardware config/проводку/mappings не менять. Native CRC
требует regeneration, Verify/Build/CRC и hardware validation вне scope.
