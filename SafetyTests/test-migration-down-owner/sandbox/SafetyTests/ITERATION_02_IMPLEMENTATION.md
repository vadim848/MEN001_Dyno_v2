# Iteration02 r2 — LV Set permission и отдельная синхронизация oracle

2026-10-18. Локальная программная итерация после checkpoint f7b4f7e.
До изменения SAL SHA256 `74896fb6b3c08d829cb3bea8e7a7c0452ffde4b09ad262043f463f9ff4b10a5c`.
После: `85b99f594117b6752ff8ea84d6d24db0c5cb79e86003d2a2dc94510f2cc40323`.

## Реальное изменение SAL

Preflight обнаружил, что старый LV RS order2 потребляет OR17 предыдущего
скана. Предложенный первоначально gate после producer112 не устранял stale
Set. Реализация остановлена, архитектор подготовил r2; late gate не добавлялся.

Добавлены Network1/FBAndLvCurrentPermit order2 и FBAndLvSetPermit order3.
Первый проверяет EStopOK, текущие NC1/NC2, external1/2, LV/HV connectors и
отсутствие PLC EStop. Второй соединяет это разрешение со старым aggregate
OR17 и является единственным входом Set LV RS. Старый order>=2 сдвинут на+2:
LVRS4, EStop20, Step12 producer114, OR17 174, final unlock208. Относительный
порядок всех прежних блоков сохранён. Здоровая цепочка не получает лишний
скан задержки. Запрет Set не создаёт Reset уже включённого LV.

Inventory до изменения: единственный writer b_Set_LV_C1_1 —
Network11/FBAnd1/AndOut; reader Network1/FBOr17/OrIn3. Этот producer и его
существующий TON1 fanout сохранены. OR17 входы/другие producers не менялись.
Alias, переменные, таймеры и корневые аппаратные/групповые параметры неизменны.
Diff SAL против f7b4f7e:303 additions/207 removals, из них массовая замена
206 значений порядка исполнения и добавление двух стандартных AND.

Три новых теста current-step12-lv-permit: структурные bindings/soleincoming,
таблица FALSE/TRUE aggregate × восемь permission faults, сохранение latched
LV без Reset, paired prehistory с реальными producers Step12 и Network5.
В последнем тесте реальный producer/OR17 сначала формируют TRUE при ещё FALSE
LV; затем в первом следующем скане healthy включает LV, каждый отдельный
fault препятствует включению. Выход нового gate тестом не подставляется.
Внутренние начальные Step12/Step2 и healthy EStopOK заданы тестом; достижимость
этих фаз и принятие внешнего жеста этим не доказываются.

Шесть проверок iteration01 сохранены; metadata assertion206→208 сопровождается
проверкой относительных orders всех исходных блоков. Стандартный PowerShell
XML parser читает SAL; GUID уникальны, порядок1..208 непрерывен. CRC оставлен
исходным recorded872783435 и не считается актуальным подтверждением.

## Отдельное изменение oracle CHORD250

По последнему явному решению пользователя окно стало inclusive250мс,
single500мс и both1000мс сохранены. Это не изменение SAL recognizer.
ID IN/EDGE/LATE теперь означают240/250/260мс; добавлены отдельные490/500/510.
Все шесть задержек проверяются в обеих очередностях. Предшествует neutral2100.
StepUp ожидается только при delta<=250; его запрет при больших delta не
означает отмену уже принятой single. TON первой кнопки наблюдается отдельно
от выхода unlock; green подавляет unlock. Отдельный marker принятия single
в текущем SAL не связан, rollback/recovery полноценного перехода не доказан.
Положительные single/both, flicker и failedchord сценарии теперь также имеют
полный neutral перед попыткой: исправлена исходная precondition будущего
recognizer без ослабления негативных ожиданий. Старый Q500 report исторический,
его окно500 заменено последним решением250; single500 остаётся действующим.

## Результаты и сравнение

Полный `npm run check:software`: harness71/71, historical75/75, current9/9;
144 PASS /35 FAIL /3 NOT VERIFIED /0 ERROR, exit1. Новые реальные FAIL не скрыты.

Для отделения oracle от исправления выполнены одинаковые candidateButtonCoverChecks
и currentCodeChecks на SAL из `git show f7b4f7e:MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`
и рабочем SAL с новым oracle250. Pre02:117 PASS/61 FAIL/3NV; после143/35/3NV
(общий referenceEStopPASS добавляет по одному к PASS обеих сторон).
Новых FAIL нет;26 PRIORITY случаев стали PASS: Step1 NC1/PLC/NC2/external,
Step12 NC1/PLC/NC2/connectors/external, Step6 NC1/PLC/NC2/connectors/external
при обозначенных в ID fallback. Эти результаты условны по seeded phases,
Network4 исключён, group lifecycle не моделируется. Mentee/HV и другие
остаточные ошибки не объявляются исправленными.

Состояние готово к независимому ревью; запись остановлена. Native tooling,
hardware validation, push/deploy не выполнялись. .sal.diagram не изменён.
