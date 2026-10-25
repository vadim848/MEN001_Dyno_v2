# B1 — исправление сериализации программных связей

2026-10-19. База рабочего SAL:85b99f594117b6752ff8ea84d6d24db0c5cb79e86003d2a2dc94510f2cc40323.
После repair SAL:1fe206892664e46f8a8aa974c78d90eff2764cf0a664355b740974a9042fbfc9.
GVL1.sgvl:194b4b14511b9775ea12294fdab9518875c7aeb0f2a43994110550001dea8089.

## Исправление проекта

11 добавленных01/02 потребителей alias теперь оформлены через существующие
SAL variable.targetUsages с исходной полной цепочкой DSL relationship.
Bare GVL1.in_* references удалены: такие символы не объявлены в SGVL.
Настоящий b_EStop_Ok использует wrapper fbPortGlobalVariableReferences /
functionBlockPortHasFbPortGlobalVariableReferences; его новый port GUID
добавлен ровно одним TargetUsage в существующую SGVL variable.
Declarations, SourceUsages и остальные usage indices SGVL сохранены.

Четыре новых прямых ребра записаны ровно один раз на стороне output.
Дублирующие input-side relationship records удалены. Исходный пример
fixture Network2/FBTon1→FBAnd2 подтверждает такой one-sided формат;
дублировать обе стороны XML не требуется. Alias descriptors, SDS/channel,
исходные потребители/source usages и единственный finalunlock writer
сохранены; точная разрешённая delta11 проверяется отдельно.

Изменение SAL:+130/−46 строк; SGVL:+3/−0. Логика контактов, orders1..208,
таймеры, аппаратная конфигурация не менялись. CRC SAL872783435 и
SGVL1640101759 остаются исходными recorded значениями, не новыми CRC.

## Закрытие false-green пути стенда

Добавлен структурный XML reader с деревом родителей и namespace/GUID audit.
Проверяются rootnamespace, wrappers, SGVL GUID и qualified path, индексы
портов, alias usage roles, существование/направление moniker, уникальные
GUID, conflicting producers и duplicate wire pairs. Новые active inputs
не могут потерять binding и стать разрешающим unconnected fallback.

parseSalFile автоматически валидирует полный рабочий источник до срезания
компонентов; current runtime требует validated resolved global symbols.
Совпадение basename alias с lastKnownPath не разрешает global reference.
Исторические и явные injected graphs имеют отдельный режим. Каждая прямая
wire relationship нормализуется output→input независимо от стороны записи.
Проверен исполняемый эквивалентный input-side вариант во временном файле.

Оригинальная fixture и repaired source проходят audit без исключений и без
allowlist. Девять отрицательных mutations отклонены до functional execution:
bare ref, alias GUID as global, missing GUID при знакомом basename, неверный
qualified path, missing SGVL usage, missing moniker, reverse direction,
missing relationship wrapper и duplicate wire pair. Это программная
структурная проверка, не native loader/Verify/hardware validation.

## Выявленные изменения наблюдений

Нормализация исходных односторонних wires устранила старое поведение,
когда провод из срезанного/ещё не исполнявшегося producer воспринимался
как unconnectedTRUE. Три harness component проверки теперь явно задают
выходы срезанных producers вместо неявного fallback; ожидания не ослаблены.
Исторический BTN03 получил явные20мс neutral prehistory, чтобы исходный
feedback-wire инициализировался до отсчёта hold. Без этой подготовки initial
held chord теперь воспроизводится на1010мс вместо прежнего1000мс;
настоящее значение TON1с не меняется. Fixture source не переписан.

На одинаковом новом нормализующем reader preB1 и repaired SAL дают одинаковые
статусы всех functional cases. Сравнение со старым reader выявило ровно два
условных изменения FAIL→PASS: PRIORITY:Step1:Mentee:fallback=true и
PRIORITY:Step6:Mentee:fallback=true. Они вызваны исправлением adapter wire
initialization, а не новым исправлением Mentee logic. Эти seeded/fallback
результаты не объявляются доказательством работоспособности всей системы.

## Проверки

Targeted01/02, wire/namespace audit и negative mutations проходят.
Полный npm run check:software после R2: harness73/73, historical75/75, current29/29;
functional cases154 PASS /47 FAIL /5 NOT VERIFIED /0 ERROR, exit1.
Незакрытые03A дефекты recognizer сохранены; никакого нового window helper
или изменения поведения жестов в B1 нет. DoorMonitor coverage wording
синхронизирован с решением пользователя: сохраняются обычный PLC input и
исходные защитные условия; separate locked guard не добавляется и не служит
скрытым блокером. Неполнота проверки исходных cover reactions остаётся NV.

Reference, историческая fixture, аппаратные mappings и .sal.diagram не менялись.
Native загрузка/Build/CRC, deployment и push не выполнялись. Состояние
передано на независимое ревью; дальнейшая запись остановлена.

## Доработка по R2 — эффективный XML namespace

Ревью подтвердило false PASS при дочернем wrapper с xmlns="urn:wrong":
первый вариант reader проверял только namespace корня. Исправлено наследование
default/prefix namespace на каждом узле. Чужой namespace, xmlns="", foreign
prefix, необъявленный prefix и чужой SGVL child теперь отклоняются до
функционального исполнения. Атрибуты namespace читаются как с двойными,
так и с одиночными кавычками. Поддержан исходный unprefixed DSL format;
prefixed spelling даже того же URI явно fail-closed как неподдерживаемый
функциональным parser, а не получает структурный PASS с последующим skip.

Добавлены шесть отрицательных namespace fixtures и проверка конфликтов
wire+alias, alias+global и двух aliases на один вход. Все19 binding tests
проходят; исходная fixture и repaired XML по-прежнему дают0errors.
Рабочий SAL/SGVL для исправления R2 не менялись, SHA прежние. Functional
результаты154/47/5 также прежние; увеличение числа current тестов — новый
контроль стенда, не программное исправление safety-логики.
