# Независимое ревью оптимизации03B —253 блока

2026-10-19. Read-only проверены optimized JSON, optimization proof,
optimize-compact-plan.js, replay evaluator и актуальные source bindings.
Генератор с записью JSON ревьюер не запускал; SAL/SGVL/артефакты не менял.

## Вердикт

Оптимизация принята как технический план, готовый для actual RED тестового
пакета. Существенных замечаний нет. Это не приёмка сериализованного SAL03B
или будущих STO guards; они пока не реализованы этим artifact.

Baseline254 JSON сохранён: самостоятельно проверен SHA
`eea0607a5f7b18863fb420fccf4e8be20ef847a2378f96d963856e9403b43e3d`.
Optimized source SHA соответствует reviewed07 SALbf110ab4… и SGVL508610b9…,
не старому pre06 источнику. Generator читает полный parsed/audited source,
проверяет oldPath/oldOrder и alias identities, sourceSHA фиксируется заново.

## Состоятельность удаления

Actual currentPermit — safeAnd order2. Его AndIn4/5 Activated direct
InterLockNC1/2 с настоящими SAL alias target bindings. Graph E на121
зависит от currentPermit, Eligible — от E, FinishUp — от Eligible.
CurrentPermit вычислен раньше в том же scan, не условно injected TRUE.
Следовательно при ETRUE оба NC уже TRUE, и удаляемый новый NC pair AND
не добавляет ограничения FinishUp на достижимой source boundary.

Матрица16 комбинаций корректно связывает permit=NC1&&NC2&&other permissions;
сравнивать с независимым PermitTRUE при NCFALSE было бы неверным oracle.
Evaluator теперь использует ту же причинную зависимость при явно здоровых
прочих permissions. Это допустимая design boundary, не полная actual SAL
эквивалентность всех аварийных фаз.

## Точная дельта и воспроизведение

Независимо сверено: удалён только новый GATE_INTERLOCK_PAIR;48→47 blocks,
254→253 unique sequential orders, canonical wires92→91, alias additions20→18.
FinishUp/AndIn5 deactivated без bindingSource; остальные активные native
inputs имеют typed source и соответствующую inverted flag полярность.
Существующий Network12/And16, его06 NC pair и три Door unlock consumers
не удаляются. Подлежащие переносуTON и shared HV fanout не оптимизировались.

Самостоятельные read-only replay запуски исходного и optimized JSON:
36/36 PASS каждый, старый254/new253 count подтверждён. Матрица16 и код
derivation проверены. Два свободных места до255 существуют арифметически;
это не доказательство корректности ещё не спроектированных STO guards.

## Условия следующего этапа

Actual RED→SAL integration должна воспроизвести физические входы/события,
retained requests/blue authorization/startup/rearm/inhibit и все timing
границы на03C fixed grids. Source templates/IDs/order map сверять заново
при любой следующей принятой правке07+. Whole-source B1 audit и сравнение
actual graph с typed plan обязательны до functional cut. PLC policy,
full launch/earlySTO, остальные41ID и native/hardware validation этим
design artifact не закрываются и не становятся скрытым gate.

## Нормативная сверка общего E завершена

2026-10-19. Analyst03B_GESTURE_REQUIREMENT_DECISION.md подтвердил, что
R&D currentPermit в общем eligibility реализует Emergency приоритет по
EMG-002/004/007. Наблюдаемое старое разрешение blue/down при NC/connector
fault не сохраняемый oracle. Door energy decision не отменяет Emergency;
Safe connector absence рассматривается отдельно. Поднятый permission риск
не опроверг доказательство FinishUp⇒E⇒NC1&&NC2 и не требует переписывать
оптимизацию. Нормативный HOLD закрыт.

Итог:253 план готов к actual-source реализации после checkpoint принятого
61-case RED пакета. Actual source acceptance ещё не выполнена. Emergency
sequence/transition owner после сброса normal SG/SU проверять downstream,
не объявлять корректными по одному E или design replay.
