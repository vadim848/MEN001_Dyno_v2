# Независимое ревью iteration04

2026-10-19. Проверены план04, актуальный EMG-011/решения, diff относительно
9ef945c, текущие HV/LV/CVR tests, binding validator и implementation report.
Редактор остановил запись до финального ревью. Ревьюер не менял реализацию.

SAL SHA256 проверен:
`6ed0c79094a2530be3ab9323abb832d88e56d60c9bb19773f03a32367b6d7ad5`.

## Вердикт

Принято в пределах запрета нового HV Set при перечисленных актуальных
разрешениях. Существенных незакрытых замечаний к iteration04 нет.

## Проверка кода и сценариев

Один новый AND order5 читает прежний OR18 aggregate и существующий
currentPermit order2 до HV RS6. Старый обход OR18→RS.Set удалён,
три изменённые/новые пары wire имеют однократные output-side relationships.
Старый fanout currentPermit→LV SetPermit сохранён. Новых SGVL/global/alias
связей нет; полная SAL/SGVL структура валидируется до выделения подграфа.
Удаление связи нового gate даёт ERROR, не permissive unconnected default.

Три прежних OR18 inputs, исходные producers/таймеры/fanout и Reset/discharge
сохранены. Старые orders>=5 сдвинуты+1 без изменения относительного порядка,
orders1..4 прежние; finalunlock209. Тесты метаданных обновлены с сохранением
assertions. SGVL diff пуст; CRLF→LF normalization сравнивает всё остальное
содержимое точно, не отбрасывает whitespace/узлы и не скрывает семантику.

Paired traces используют реальные Network5/Network12 и третий AND6 route.
Real aggregateTRUE при ещё FALSE HV предшествует первому следующему скану;
healthy control действительно включает out_HV_C2, каждый из восьми отдельных
permission faults препятствует включению в том же скане. AND6 upstream
явно срезан и задан как компонентная граница. Достижимость/внешний accepted
launch не объявлены доказанными. Компонентный уже latched HV без Reset
сохраняется, так что Set gate не подменяет существующий аварийный сброс.

Самостоятельный targeted запуск:4 HV +3 LV +6 CVR =13/13 PASS,0skip.
Прочитан полный результат редактора:73 harness/75 historical/33 current
tests PASS;166 PASS/35 FAIL/5NV/0ERROR. Сравнение использует один oracle:
9ef945c154/47/5 →166/35/5,12 Step2 fault cases стали PASS, новых FAIL нет.
Общий зелёный результат не заявляется.

## Пределы

Mentee, полный recognizer03B, lifecycle/Network4 и остальные требования
остаются открытыми. PRIORITY использует seeded phases/fallback и частичный
адаптер; это условные программные наблюдения, не полное доказательство
аварийной процедуры. DoorMonitor/StartingRun этим пакетом не изменены.
Заданные времена, аппаратная конфигурация, reference и fixture сохранены.
Native Verify/Build/CRC/аппаратная validation не выполнялись и не являются
скрытым gate этой приёмки. Embedded CRC остаётся исходным записанным,
.sal.diagram не обновлён, готовность загрузки не подтверждается.
