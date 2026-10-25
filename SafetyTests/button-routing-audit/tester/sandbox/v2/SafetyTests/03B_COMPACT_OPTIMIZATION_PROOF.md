# 03B: исключение повторного нового InterLock AND

**SEMANTIC REVIEW CLOSED / PLAN READY:** аналитик подтвердил в `03B_GESTURE_REQUIREMENT_DECISION.md`: R&D потеря любого ExternalInterLock/connector — Emergency по SPEC§5.1/EMG002/004, shared E корректно запрещает новые жесты. Старый UnlockTRUE — source fact, не желаемый positive oracle. Safe доступ при отсутствии connector — другой scope. CSE и граф253 сохранены. Реальное аварийное поведение downstream и сохранение владельца аварийной последовательности проверяются фактическими тестами; очистка SG/SU сама по себе не доказывает полный EMG.

Статус: **READY для независимого ревью оптимизации**, не разрешение реализации SAL. Исходный компактный JSON254 сохранён побайтно; SHA256 `eea0607a5f7b18863fb420fccf4e8be20ef847a2378f96d963856e9403b43e3d`. Новый вариант — `03B_COMPACT_OPTIMIZED_PLAN.json`.

## Проверенный источник после07

- SAL SHA256 `bf110ab452a5d9d3fcafd1acc5ab657b993e3e2828f384a63c1491c57b2cdcc6`.
- SGVL SHA256 `508610b92e60ae602a75952113b34f7a8bd9c3f283fbb93dfa45b6a532f0a3ba`.
- `parseSalFile` сначала выполняет strict full-source binding validation. Генератор также проверяет все сохранённые oldPath/oldOrder и ID/name новых alias usages против актуального source.

`Network1/FBAndLvCurrentPermit`, safeAnd, order2: действующие прямые (Break Contact NC в DSL) AndIn4/AndIn5 принадлежат соответственно aliases `in_InterLock_NC_1` (`6ea0bd28-86ec-4253-af16-e7671d60bf50`) и `in_InterLock_NC_2` (`7609638c-62cd-4d5e-a440-a3e26594ec02`). Проверены channelInterface=Activated и настоящие variable.targetPorts. Новый E (GATE_001) исполняется order121; CurrentPermit вычислен раньше в том же скане. Это обязательная предпосылка, а не только булево совпадение имён.

E содержит CurrentPermit; Eligible содержит E; FinishUp содержит Eligible. Следовательно FinishUp ⇒ E ⇒ NC1 AND NC2. Дополнительный новый GATE_INTERLOCK_PAIR на последнем AND избыточен при допустимых реальных входах. 16 комбинаций NC1/NC2/прочих permissions/прочего eligibility проверяют равенство старого и сокращённого выражений; матрица записана в JSON. Контрфактический Permit=TRUE при NC1=FALSE либо NC2=FALSE **недостижим** у проверенного актуального источника.

## Точный delta

Удалён только новый GATE_INTERLOCK_PAIR, его два новых alias usages и wire к FinishUp/AndIn5. AndIn5 FinishUp деактивирован, bindingSource удалён. Остальные GUID/порты сохранены. Порядки после удалённой позиции145 уменьшены на1; относительный порядок всех оставшихся блоков сохранён. UpAllowed symbol удалён. Старый Network12/FBAnd16 с обоими InterLock остаётся без изменений; три исходных DoorMonitor solenoid consumers тоже.

47 planned blocks, reuse3TON: 209+47−3=**253**. Это освобождает два места до255 для будущих независимых STO Set guards. Само доказательство не решает порядок раннего STO и не включает эти guards.

## Воспроизведение

Из корня проекта:

```powershell
node SafetyTests/scripts/optimize-compact-plan.js
node SafetyTests/scripts/check-compact-plan.js
node SafetyTests/scripts/check-compact-plan.js SafetyTests/03B_COMPACT_OPTIMIZED_PLAN.json
```

Получено: source assertions PASS, equivalence matrix16/16, исходный replay36PASS/0FAIL, оптимизированный replay36PASS/0FAIL. Replay теперь сохраняет причинную зависимость Permit от NC1/NC2; остальные текущие Permit permissions явно заданы здоровыми на границе design replay. Нельзя независимо seed Permit=TRUE вопреки NC. Равенство всего actual SAL этим replay не заявляется.

Ограничения: это design netlist, SAL не изменён. Остальные metadata source templates и integration требуют обычного editor/full-source acceptance; actual graph tests включают новые зависимости и сохранённые старые output consumers. PLC-policy pending не разрешается оптимизацией. Нет утверждения native Build/CRC/аппаратной точности. Перед early-STO пакетом остаётся доказать same-scan Set/Reset порядок, текущие аварийные guards и lifetime принятого запуска.

Запись пакета остановлена для ревью.
