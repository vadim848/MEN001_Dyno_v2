# Пересмотр структуры программных связей iteration01/02

2026-10-19. Независимая read-only сверка рабочего SAL SHA256
`85b99f594117b6752ff8ea84d6d24db0c5cb79e86003d2a2dc94510f2cc40323`,
исходной fixture и GVLs/GVL1.sgvl. Это корректность сериализованных
программных связей, а не новый gate аппаратной/native validation.

## Существенное замечание B1 — несовпадение модели связей

Namespace-aware XML audit обнаружил12 новых `inPort/fbPortGlobalVariableReference`
непосредственно под портом. У11 variableId совпадает с локальной SAL alias
variable, но соответствующей Variable в GVL1.sgvl нет. Например,
`GVL1.in_ES_NC_1`, ID c8733807-26ea-45fd-a6dd-1b39b3fe0286,
находится в SAL variable, а не в GVL1. То же относится к синей/зелёной,
остальным NC/interlocks/connectors и PLC EStop новым связям.

У одного `GVL1.b_EStop_Ok` ID действительно разрешается в GVL1.sgvl,
но TargetUsages не содержит нового port ID
e38bf21e-15b3-448f-89c8-2795d5bf62db.

Исходный сохранённый формат различает два механизма:

- Alias input привязывается SAL variable.targetUsages через
  variableHasTargetUsages/variableUsages/usages/variableUsagesHasUsages/
  fbPortUsage/functionBlockPort/fbPortUsageReferencesFunctionBlockPort/
  inPortMoniker. Например in_ES_NC_1 уже содержит такие original consumers.
- Истинный SGVL global ref сериализуется в
  fbPortGlobalVariableReferences/functionBlockPortHasFbPortGlobalVariableReferences/
  fbPortGlobalVariableReference. GVL1.sgvl хранит GUID variable и usage port IDs.

Новые12 bare references не следуют ни одному из этих сохранённых образцов;
у11 нет заявленной global declaration, у настоящего global usage не обновлён.
Нельзя выдавать эти связи за доказанно корректные по прохождению host tests.

## Почему стенд не обнаружил

SalRuntime.read извлекает из lastKnownPath только последнее имя и читает
`var:<name>`, не разрешая variableId через SGVL namespace. Parser находит
reference как вложенный XML-текст без проверки container relationship.
Поэтому несуществующий GVL1.in_ES_NC_1 получает правильное host значение,
маскируя различие global и SAL alias variables. GUID uniqueness/XML
well-formedness сами по себе не проверяют semantic binding.

Предыдущие приёмки iteration01/02 были узкими host логическими, но недостаточно
проверили эту структуру. Их структурная приёмка переоткрыта до устранения B1.
Логические контрпримеры/полезные тесты сохраняются; результаты не удаляются.

## Требуемое исправление и проверка

Архитектору уточнить точный native relationship format по SDK/reference.
Alias fanout оформлять existing SAL variable target usages, не создавать
несуществующий SGVL alias. Истинный SGVL ref должен иметь правильную обёртку
и согласованный usage index, либо использовать подтверждённую прямую связь
с existing producer. Hardware alias descriptors/источник и полярность
не менять; программный logical fanout находится в разрешённом объёме.

Добавить fail-closed structural checks: GUID resolution с учётом namespace,
контейнеры отношений, разрешение moniker/port ID, согласованность usage index;
негативная мутация отсутствующей global declaration обязана FAIL.
Повторить относящиеся current tests и согласованный пакет после исправления.

## Предел текущего доказательства

Прямые отличия XML, отсутствие11 SGVL declarations и missing usage одного
global подтверждены. Конкретное поведение native loader — reject, warning
или игнорирование bare element — этим отчётом не утверждается. Read-only
reflection установила наличие vendor checker
GlobalVariableReferenceExistsAtFbPortCheck в SALDesignerControl.dll,
но точный алгоритм loader/resolver ещё не исследован независимо полностью.
Нельзя подменить этот пробел выдуманным native Build результатом. Это не
основание оставлять несогласованную программную модель принятой.

## Повторное ревью B1 repair — 2026-10-19

Проверен ремонт SAL SHA
`1fe206892664e46f8a8aa974c78d90eff2764cf0a664355b740974a9042fbfc9`
и SGVL SHA
`194b4b14511b9775ea12294fdab9518875c7aeb0f2a43994110550001dea8089`.
Все11 alias consumers перенесены в правильные SAL targetUsages; настоящий
EStopOK имеет исходную wrapper chain и новый SGVL TargetUsage. Четыре wire
edges записаны один раз на стороне output; исходная fixture действительно
использует one-sided wire. Ранее требовавшаяся двойная запись была неверным
структурным oracle: обе стороны теперь нормализует reader без дублирования
DSL relationships. Этот пересмотр основан на исходном коде, не на ослаблении
функциональных ожиданий.

Самостоятельный targeted запуск:12 binding +3 LV +6 CVR =21/21 PASS.
Проверены точные11 добавлений consumers, неизменность alias channel/source,
SGVL delta ровно один usage, single wire и отсутствие старого RS.Set обхода.
Подготовка20мс neutral в историческом BTN03 явно названа инициализацией
connected feedback, не Armed или двухсекундной очисткой; тест не заявляет
first-sample startup. Исправление reader объясняет два условных Mentee
FAIL→PASS и не является новым исправлением аварийного поведения SAL.

### R2 — неполная проверка XML namespaces

Самостоятельная отрицательная проба:
заменить первый `<fbPortGlobalVariableReferences>` на
`<fbPortGlobalVariableReferences xmlns="urn:wrong">`.
Текущий validateSalBindings возвращает PASS без ошибок. Reader проверяет
только namespace корня, но не унаследованный namespace вложенных отношений;
regex parser всё равно видит знакомые local tags. Это оставляет false-green
путь по той же категории сериализованных программных связей.

Нужен effective namespace tracking/reject foreign DSL namespaces и негативный
тест. Конфликт различных producers alias/global/wire уже проверяется через
общий producers Set; желательно отдельными отрицательными тестами закрепить
wire+alias и два alias на один input. Базовый исходный проект должен продолжать
проходить без allowlist. R2 передан редактору/владельцу.

Промежуточный вердикт: конкретные12 связей исправлены, но структурная приёмка
01/02 остаётся переоткрытой до закрытия R2. Native loader/Verify/CRC результаты
не заявляются, аппаратная проверка не добавляется как gate.

## FINAL — R2 закрыт, B1 принят

2026-10-19. Повторно проверены изменения validator и negative tests после
остановки записи редактора. Reader отслеживает effective/inherited default
и prefixed namespaces; каждый SAL/SGVL node проверяется против ожидаемого
URI. Foreign/cleared namespace, в том числе single-quoted declaration,
undeclared prefix и foreign SGVL child отклоняются. Даже prefixed spelling
правильного URI сейчас явно fail-closed unsupported: regex functional
parser не может молча пропустить такую конструкцию после положительного
audit. Это ограничение поддерживаемого формата, не утверждение невалидности
всех namespace-equivalent native документов.

Отдельные негативные комбинации two aliases, wire+alias и global+alias
получают ERROR именно Conflicting producers; runtime priority не маскирует
второй источник. Исходная fixture и текущий исправленный проект проходят
без allowlist. Структурный audit выполняется до текущего parse/subgraph,
global references получают разрешённые символы, а current runtime требует
успешного audit/resolved globals.

Самостоятельный targeted повтор:19 binding tests +3 LV +6 CVR =28/28 PASS,
0 skip. Полный результат редактора прочитан:73 harness/75 historical/
29 current tests PASS;154 PASS/47 FAIL/5NV/0ERROR. Native loader/Verify/Build
не выполнялись и не выдаются за доказательство. SAL/SGVL SHA после R2
не изменились относительно repair, указанного выше.

Итог: B1 и R2 закрыты. Структурная переприёмка scoped iteration01/02
восстановлена на исправленном SAL/SGVL вместе с сохранёнными логическими
проверками. Существенных незакрытых замечаний в этом repair нет.
Оставшиеся47 FAIL/5NV общего проекта сохраняются; это не полная приёмка
TwinSAFE-программы, не подтверждение новых CRC и не аппаратная валидация.
