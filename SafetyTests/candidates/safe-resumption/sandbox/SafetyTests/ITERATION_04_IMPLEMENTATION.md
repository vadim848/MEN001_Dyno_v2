# Iteration04 — HV Set с текущими разрешениями

2026-10-19. База reviewed B1 checkpoint9ef945c, SAL SHA256
1fe206892664e46f8a8aa974c78d90eff2764cf0a664355b740974a9042fbfc9.
Новый SAL SHA256:
6ed0c79094a2530be3ab9323abb832d88e56d60c9bb19773f03a32367b6d7ad5.
SGVL SHA194b4b14511b9775ea12294fdab9518875c7aeb0f2a43994110550001dea8089
не изменён; git diff SGVL против checkpoint пуст.

## Реализация

Добавлен один native safeAnd FBAndHvSetPermit order5 с двумя прямыми
активными входами: предыдущий OR18 aggregate и существующий LV currentPermit.
Новый output — единственный путь Set HV RS. Старый OR18→HVRS обход удалён;
shared currentPermit одновременно сохраняет старый LV fanout. Все три
relationship edges сериализованы однократно на стороне output.

Старые orders>=5 сдвинуты+1, HVRS6, OR18=176, finalunlock209; старые1..4
сохранены. Три старых inputs OR18, producers Network5/Network12/AND6,
параметры таймеров и их fanout, Reset/discharge и contact polarities не
менялись. Запрет Set не создаёт Reset уже включённого HV.
SAL diff244 additions/206 removals включает механический shift204orders
и добавленный AND; новый SGVL symbol/alias/hardware mapping не создавался.
Embedded CRC остаётся recorded872783435, native regeneration не выполнялась.

## Проверки

Новые четыре current-hv-set-permit теста проверяют sole incoming Set,
полную binding validation, missing-new-binding negative, таблицу aggregate
FALSE/TRUE × все восемь текущих permission faults и сохранение latchedHV
при явно FALSE Reset. SGVL сравнивается с checkpoint с учётом Git LF/CRLF;
working SGVL SHA при реализации вообще не менялся.

Paired prehistory исполняет реальные producers Network5 и Network12, а
также третий прежний AND6 route. Real OR18 TRUE при ещё FALSE HV — начало
пары; следующий идентичный healthy scan включает HV. При каждом отдельном
NC1/NC2/external1/2/connector1/2/PLC/EStopOK fault на том же первом следующем
скане HV остаётся FALSE. Для третьего route upstream AND4 явно задан как
граница компонента, не выдаётся за полное принятие команды. Начальные Step2,
R&D и EStopOK заданы тестом; достижимость/внешний accepted launch не доказаны.

Metadata checks iteration01/02 обновлены до209 с сохранением assertions
непрерывности и относительного порядка. B1 audit добавил обязательность
входных bindings нового gate; sourceXML проверяется до срезания компонентов.

Полный npm run check:software:

- harness73/73; historical75/75; current33/33.
- cases166 PASS /35 FAIL /5 NOT VERIFIED /0 ERROR, exit1.
- Против same-oracle checkpoint154/47/5:12 FAIL→PASS, новых FAIL нет.

Улучшились PRIORITY:Step2 PLC,NC2,LVConnector,HVConnector,ExternalNC1/2
при обоих fallback. Это seeded phase observations, не доказательство
всей emergency sequence. Mentee, recognizer03A, lifecycle и иные остаточные
FAIL/NV не скрыты. Цель итерации ограничена новым HV Set при перечисленных
текущих fault inputs; текущую логику уже включённой энергии не обходили.

Аппаратные параметры, reference и fixture не менялись; native validation,
deployment и push не выполнялись. Готово к независимому ревью, запись остановлена.
