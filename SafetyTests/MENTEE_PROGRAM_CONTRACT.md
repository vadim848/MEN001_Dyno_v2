# Mentee: программный контракт и оставшиеся PRIORITY

2026-10-19, аналитик, read-only. Reference SAL Prodoction4495a1f и текущий v2
прочитаны напрямую через parser; аппаратные источники/настройки не исследуются.
Никакие SAL, тесты или SPEC этим документом не меняются.

## Исправление native pair семантики — 2026-10-19

Последующий принятый PLC pulse follow-up, source
dd9fd938fd5493795a7eea7b29cb027d7e994e2a55e2ad02d2ca66cb4beb6923:
оба LV/HV SetPermit сохраняют !Mentee и дополнены previous PLC producer
на existing AndIn4. Это узкая защита one-sample PLCstop/raw restore без
Restart,48 unchanged checks теперьPASS вместо36PASS/12FAIL. Она не является
новым Mentee recovery контрактом и не закрывает всю аварийную процедуру.
См. PLC_PULSE_IMPLEMENTATION_REVIEW.md/PLC_PULSE_CURRENT_RESULTS.json.

Первичные SDK metadata/IL свидетельства в 03B_NATIVE_PAIR_FIX_PLAN.md
исправляют прежний вывод этого отчёта: собственная строка slave порта
`Both Deactivated` НЕ означает его effective неактивность. Master
`Single-Channel Both Activated` активирует оба члена пары; slave использует
master.Deactivate2, а не свою строку инверсии. Main FBEstop1 поэтому включает
NC2 как EStopIn2 и инвертированный Mentee как EStopIn4. Это программная
native pair семантика, не физическая полярность/аппаратная валидация.

Прежний host runtime ошибочно трактовал own slave строки отдельно и мог
оставлять EStopOKTRUE при этих событиях. Ранее описанные traces — результаты
того адаптера с ограничением, не доказательство отсутствия native EStop
реакции. План R3/helper first-only и исправление effective pair в адаптере
ещё не считаются реализованными/принятыми данным уточнением.

Историческая05 сохранена честно: принят её конкретный source Set guard,
actual-producer firstscan checks и явный NOT Mentee. Эти факты не исчезают,
но обоснование «mainEStop игнорирует Mentee из-за own BothDeactivated»
отзывается. Новые выводы о native/recovery/coverage требуют pair-aware
runtime и повторных checks; таблицы/исторические статусы ниже читать с этой
поправкой, а не как актуальную effective activation модель.

## Что задаёт исходный код

`in_Mentee_EStop` в обоих SAL имеет одинаковые четыре программных потребителя:

| Потребитель | Операция | Вывод программного контракта |
|---|---|---|
| Network2/FBAnd5/AndIn2 | Make Contact(NO), т.е. программная инверсия. AndIn1 аналогично NOT in_Estop_PLC | MenteeFALSE является разрешающим уровнем, TRUE снимает это разрешение |
| Network2/FBAnd5 output→FBAnd1/AndIn7 | Guard исходной Step1 последовательности подключения | MenteeTRUE блокирует исходное начало перехода из Safe через этот guard |
| Network2/FBAnd5 output→FBAnd9/AndIn1 | Дополнительная разрешающая цепь с ES_NC1/2 | Сигнал не является лишь отображением |
| Network6/FBAnd10/AndIn3 | Make Contact(NO), вместе с NOT PLCstop, NC1/2 | MenteeTRUE снимает Run защитное разрешение |
| Network6 FBAnd10→FBAnd9→инверсия вFBAnd2; Step3 qualified черезFBAnd1 | Потеря общей цепи → FBDecouple1 → b_Step4_Set | При Run MenteeTRUE запускает существующую последовательность снятия, не обычный запрос режима |
| Network1/FBEstop1/EStopIn4 | Own slave BothDeactivated; master pair BothActivated, slave inversion по master.Deactivate2 | Effective active inverted Mentee по SDK; прежний host вывод о неактивности ошибочен, см. поправку выше |
| Network10/FBDecouple1/DecIn3 | Диагностический fanout | Не подменяет перечисленные действующие разрешения |

Здесь TRUE/FALSE — уровни программной переменной, не электрическая полярность
контакта. Контракт выведен из инверсии и потребления, не из имени EStop.
Reference Network5 начало уже активного Step2 использует EStopOK. После
уточнения pair semantics Mentee участвует в mainEStop; остаётся отдельно
проверить актуальность чтения разрешения в порядке скана, не делать вывод
о полном отсутствии Mentee пути из прежнего host поведения.

## Какие требования применимы

- Сохранение исходных разрешений: активный MenteeTRUE уже блокирует исходный
  Step1 запуск и инициирует Step4 в Run. Эти пути нельзя удалить/обойти.
- EMG-011/§13 — аварийное событие имеет приоритет над новым повышением энергии.
  Для Mentee принадлежность к защитному событию подтверждает именно Run→Step4
  цепь, а не только имя входа. Новый Set при этом уровне противоречит смыслу
  сохранённого защитного разрешения; требование не зависит от PLC handshake.
- EMG-001/002 не надо искусственно переименовывать в Mentee: они относятся
  к физическому EStop и external interlock. Effective EStopIn4 определяется
  реальным master pair, не активацией порта ради PASS. EMG-006 полный recovery
  из этого анализа не следует.
- Конкретные выходы/сроки всей аварийной процедуры, политика non-Run recovery
  и физический safe статус этим анализом не задаются.

## Четыре оставшихся FAIL и предел доказательства

emergency-phase-matrix.js задаёт событие Mentee как inputTRUE, восстановление
FALSE; это соответствует исходной программной инверсии. Для Step12 и Step2
фазы/latches установлены стендом, feedback фиксирован, Network4 исключён,
unconnected fallback FALSE/TRUE перебираются явно. Эти случаи не доказывают
достижимость seeded контекста на оборудовании и не являются аппаратным verdict.

Историческая статическая причина до05: общий FBAndLvCurrentPermit после04
содержит EStopOK, NC1/2, external1/2, connectors и NOT PLCstop, но не
NOT Mentee. Он используется LV/HV Set gates. Старый host не учитывал
effective активный EStopIn4. Поэтому четыре прежних FAIL не доказывают
четыре native дефекта; принятая05 добавила отдельный текущий NOT Mentee
guard, а native EStop/pair/recovery доказательство требует корректного адаптера.

Следующий пакет должен доказать программный дефект paired first-scan тестом:
при одинаковом реальном upstream producer/положительном Set запросе и ещё
выключенном LV/HV faultFALSE поднимает команду, faultTRUE запрещает новый Set
уже в первом наблюдаемом скане. Покрыть Step12 LV и Step2 HV, а также другой
реальный R&D HV writer; не ограничиться переписанным внутренним bool.
Проверить original Safe guard и Run→Step4 цепи как сохраняемые инварианты.
Уже включённый LV/HV не обнулять новым Set permission: аварийный Reset путь
сохраняется отдельно, порядок discharge не перепроектировать.

## Вопрос пользователю нужен ли сейчас

Для узкого запрета НОВОГО LV/HV Set при MenteeTRUE нового вопроса поведения
не требуется: исходный код однозначно использует FALSE как разрешение и TRUE
как защитное событие. Архитектор определяет допустимую программную реализацию
расширенного permit с учётом native числа входов/структуры, а не делает новый
вход EStop активным изменением конфигурации. Нельзя молча ослабить другие
восемь разрешений ради места в AND.

Вопрос понадобится лишь при расширении пакета до отсутствующей non-Run
аварийной процедуры: например, Step12 уже поднимает LV, затем MenteeTRUE —
какая полная последовательность снятия/квитирования нужна? Это вне узкого
Set запрета, не повод блокировать его сейчас и не новый нормативный oracle.
