# Независимое техническое ревью compact03B

2026-10-19. Проверены03B_COMPACT_NETLIST_PLAN.md/.json и реальные существующие
ТОN fanouts. Код/SAL/план ревьюер не менял. Это ревью проекта графа,
не native execution и не функциональная приёмка рабочего SAL03B.

## Вердикт

Compact graph условно принят как техническая основа интеграции; существенного
логического противоречия в проверенных сценариях не найдено. До записи SAL
обязательны source refresh после06/05, точные actual tests/red baseline,
сохранение native role chains и новое ревью результата. Нельзя считать
статические36 symbolic PASS закрытием требований фактического кода.

## Независимая проверка

JSON содержит48 blocks,10 SGVL declarations,254 unique sequential orders.
209−3 moved TON+48=254; остаётся один блок из заявленного лимита255.
Oversized290 graph не используется. Декларируемые block/port GUID уникальны.
У всех активных native inputs есть typed source; контактная полярность
совпадает с inverted flag, не наследуется случайно из template. У aliases
и globals разные механизмы, новые GVL alias symbols не выдуманы.

Проверены причинный порядок snapshot→facts→helper→TON→events→RS commits,
PrevG/PrevB update после вычисления EarlyLoss и snapshot старой памяти.
P/A/C/L — flags, не one-hot; требуемые reachable invariants сформулированы
отдельно. SG/SU retained до E loss сохраняют старый shared HV fanout.
BA reset при green/blue loss не сбрасывает consumed C и не создаёт повтор.
T удерживает one-off flicker, BOTH reset/restart не деградирует в single.
Ранний switch без sampled bothOFF ловится Prev+EarlyLoss.

Самостоятельно построен временный executable graph из nativePorts JSON и
current SalRuntime с03C clock (не SAL файл). Десять sampled traces обеих
очередностей249/250/251/500/600 дали ожидаемое:249/250 SU,251 L без команды,
500/600 green сохраняет SG без SU, blue квалифицируется без BA при green
и без SU. Это независимый ограниченный design check, не native validation;
все36 заявленных симуляций отдельно здесь не воспроизводились.

Actual существующие movedTON outputs имеют по одному прежнему consumer:
GREEN→And7/AndIn2, BLUE→And2/AndIn2, BOTH→OR1/OrIn1. Интеграция обязана
переподключить physical OR2/OR1 и blue authorization по плану, не оставить
старый duplicate writer. OR1→Decouple3→HV shared route и feedbackTON3
сохраняются. PLC other inputs не удаляются и не получают выдуманную policy.

Latest UpAllowed использует in_InterLock_NC_1/2, не ES_NC и не Door.
E явно включает !Mentee и прежний sharedPermit; Door остаётся в existing
unlock consumers. Это не заменяет полной проверки emergency destination.

## Условия до/после интеграции

Текущий JSON sourceSHA ещё pre06; после06/05 обновить его, весь old→new
order map, native templates, movedTON IDs и GUID collision audit против
действительно актуального source. Нельзя применять stale metadata молча.
Особенно сохранить05 third inputs Set gates и06 alias fanout delta.

Actual red/green tests должны покрыть startup/arming/inhibit/recovery,
blue hold/release/repress/green, retainedSG/SU до completion, one-off flicker,
piano, full release filter и no additional commands, обе очередности
before/at/after250 на фиксированных сетках. Проверять события во всех сканах,
включая первую выборку; не принимать один endpoint за отсутствие импульса.
После сериализации нужны whole-source B1 audit и comparison actual graph
с JSON/nativePort bindings, полный пакет и независимое ревью.

Fixed-scan proof не распространяется на arbitrary jump249→251/native
firmware/physical timing. Мerged PLC acceptance, Safe/Run recognizer,
early-STO/полный launch и остальные41ID этим bounded plan не закрыты.

## Дополнение: воспроизводимый design replay

Архитектор добавил scripts/check-compact-plan.js. Проверено, что он читает
сам netlist и исполняет primitives/order, а не возвращает сохранённые PASS.
Самостоятельный запуск пересчитал36/36 PASS,48 graph blocks/254 total.
Это расширяет независимое воспроизведение10 traces выше, но сохраняет
design-only/no-EDM/group-lifecycle ограничения и условие source refresh
после06/05. Actual SAL integration этим по-прежнему не принята.
