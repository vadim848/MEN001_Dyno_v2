# Независимое ревью iteration02 r2

2026-10-18. Проверены актуальные требования/решения, ITERATION_02_PLAN.md r2,
ITERATION_02_IMPLEMENTATION.md, реальный SAL diff против checkpoint f7b4f7e,
current-step12-lv-permit.test.js, сохранённые CVR tests и CHORD250 oracle.
Ревьюер не менял реализацию или тесты.

SAL SHA256 `85b99f594117b6752ff8ea84d6d24db0c5cb79e86003d2a2dc94510f2cc40323`.

## Вердикт

Принято для scoped LV Set inhibition по перечисленным разрешениям.
Существенных замечаний к реализации r2 не обнаружено. Все41 требования
проекта этим не закрываются; общий результат остаётся FAIL.

## Проверенные свойства и доказательство

Два новых AND выполняются в orders2/3 до LV RS4. Поэтому актуальные raw
NC1/NC2, external1/2, connectors и PLC EStop запрещают потребление stale
aggregate предыдущего скана до позднего EStop. Предыдущий EStopOK отдельно
сохраняет запрет до ручного восстановления. Старый вариант late gate после
producer для этого был недостаточен; в SAL его нет.

Old OR17→RS.Set заменён OR17→SetPermit→RS.Set с reciprocal links.
Другого output target, variable target либо global writer обхода на Set
не найдено. Выход LV остаётся у прежнего latch; Reset не менялся.
Network11 producer и его TON1 fanout сохранены, входы OR17 не менялись.
У старых блоков сохранён относительный порядок: прежние orders>=2 сдвинуты
на2, новые занимают2/3. Нет дополнительного модельного скана healthy latency.
Таймеры, переменные/alias и аппаратная/групповая конфигурация не менялись.
GUID/order inventory и прежний конечный unlock проверены тестами.

Самостоятельно запущены:

- current-step12-lv-permit:3/3 PASS;
- current-unlock-hold:6/6 PASS;
- candidate-acceptance-runner:6/6 PASS.

Paired producer тест действительно сначала получает aggregateTRUE при ещё
FALSE LV, затем один fault меняется непосредственно перед следующим сканом.
Для Step12 и унаследованной Network5 healthy control включает LV, каждый
проверяемый fault предотвращает включение в первом fault scan. Это не
инъекция output нового gate. Component truth table покрывает FALSE/TRUE
aggregate, все восемь разрешений и EStopOK; уже latched LV без Reset
сохраняется, поэтому изменение не подменяет прежнюю аварийную остановку.

Прочитан полный результат редактора:71 harness,75 historical,9 current
tests PASS;144 PASS /35 FAIL /3 NOT VERIFIED /0 ERROR. Сравнение до/после
проводилось с одним новым oracle250:118/61/3 →144/35/3 с reference case.
Поэтому26 устранённых FAIL относятся к SAL change, не к смене timing oracle.
Сравнение со старым агрегатом116/54 для этого вывода не использовано.

## Oracle и оставшийся объём

CHORD250 тесты симметрично используют240/250/260 и490/500/510мс, neutral2100,
StepUp допускается только delta<=250 после1000мс обеих кнопок. На500 single
TON наблюдается отдельно от green-gated Unlock. Старый R1 inclusive500
oracle устранён; реальные FAIL late chord сохранены.

Тесты ещё не доказывают event acceptance/отсутствие rollback полного перехода,
всю late-before-single реакцию без fault, rearm и внешнюю достижимость фаз.
Это честные coverage gaps, а не PASS новых D-LATE-SECOND требований.
Техническая реализация250мс не объявляется невозможной или native valid
без отдельного исследования; текущая итерация recognizer не реализует.

Mentee/HV, полная аварийная память и старт/жизненный цикл группы остаются
открытыми. Seeded phases/исключённый Network4 и partial adapter ограничивают
выводы PRIORITY. Native regeneration/Verify/Build/CRC и аппаратная validation
вне задания; исходный CRC после изменения устарел, .sal.diagram не обновлён.
Ни аппаратная безопасность, ни готовность загрузки не заявляются.
