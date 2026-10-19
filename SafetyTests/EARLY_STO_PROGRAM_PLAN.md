# Early STO: программная граница и пакет исследования

## Обновление после253 оптимизации: CONDITIONAL READY AFTER03B

Рабочий исходный checkpoint для этого плана — `c69bc32`, source SAL bf110ab.../SGVL508610..., плюс принятый design `03B_COMPACT_OPTIMIZED_PLAN.json`253. Активный SAL редактора не читался и не менялся. Условие передачи следующему редактору: actual03B принят, его source/SGVL hashes зафиксированы, все нижеследующие пути/порты и source closure повторно проверены. Старый раздел о нехватке блока ниже исторический: CSE освободил второе место, **253+2=255**. PLC-only early acceptance в данный пакет не входит.

### Точный интегрированный граф

1. Сохранить существующий Run confirmation Network12/FBAnd6→FBDecouple2, включая Ton3/C2_FBK/invertedHVHealthy, discharge-request reset, Step3 и ResetPB lock. Не переносить весь Decouple на SU. Его старые STO Set globals можно оставить как поздний legacy producer; ранний физический route добавляется отдельно, оба проходят единый per-drive guard.
2. Добавить настоящий физический accepted `RndPhysicalCompact/STATE_SU/RsOut` к свободному OrIn3 обоих существующих STO Set OR: FBOr8 port `270d8d89-2f99-4e2b-84ac-f4ecadcd4d3c`; FBOr10 `45bbd24a-adec-4b7e-bfb9-c31d26a9c676`. Только canonical direct edge; без нового OR и без raw PLC aggregate. STATE_SU должен сохранять approved acceptance permissions и emergency lifetime; обычный late second не отменяет уже принятое событие.
3. Новые safeAnd `FBAndSto1SetPermit`, `FBAndSto2SetPermit`, по три действующих входа: соответствующий полный Set OR; текущий `FBAndLvCurrentPermit/AndOut`; инвертированный raw `in_Mentee_EStop` через настоящий alias target usage. Остальные5входов Deactivated. НовыеGUID назначает deterministic editor manifest, template exact native AND, безaliasnamespaceglobalподмены.
4. Удалить существующий прямой canonical edge OR8→FBRs3/Set и OR10→FBRs4/Set. Подключить OR→свойguard→свойSet. Set port IDs: drive1 `a4eaf134-edc7-4df9-af82-bd9308d5a25b`, drive2 `8c62a62b-8092-4712-86b4-64f81f12292e`. Старые Reset wiring/ports, наружные STO aliases и диагностический fanout не переподключать.

### Порядок: недостаточно поставить новые gates перед ранними RS

Чтобы accepted SU текущего скана действительно дошёл до обоих выходов, из253 последовательности удалить четыре **existing** позиции RS3,RS4,OR8,OR10, сохранив относительный порядок всех остальных249 блоков. В хвосте назначить: order250 OR8,251 guard1,252 RS3,253 OR10,254 guard2,255 RS4. Это точный proposed порядок; E/SU и CurrentPermit находятся раньше. Каждый Set gate вычисляется непосредственно перед своим RS и читает текущий raw Mentee. Все прежние producers обоих OR сохранены. CurrentPermit raw NC/connectors/PLC предотвращает stale new Set даже если EStopOK дообновления предыдущего скана.

Изменение порядка существующих RS — существенная часть пакета, не скрытая metadata правка. Reset OR7/9 остаются в своих существующих относительных позициях и сохраняют все исходные inputs. После перемещения RS читает уже вычисленный текущий aggregate Reset; возможное снятие одного прежнего scan latency должно быть явно проверено/зафиксировано. Нельзя заявить unchanged reset timing только потому, что wire тот же. Network10 PLC индикация, если находится раньше tailRS, может читать предыдущее значение до следующего скана; это наблюдение также проверяется отдельно от наружного STO output.

Если actual traces выявят изменение сохранённых физических request durations/действий вне approved early launch/emergency response, этот ordering package возвращается архитектору; не ослаблять expected source sequence. Данный conditional READY означает точный reviewable пакет, а не доказанную эквивалентность до тестирования.

### Red tests до следующего SAL изменения

- Accepted physical SU при C2_FBK FALSE и обоих raw Healthy значениях: после одного полного accepted scan оба STO aliases TRUE, confirmation Step3 FALSE. Доказать actual acceptance marker, не seed raw BOTH или earlyPLCaggregate. После исходных feedback подтвердить прежние действия And6/Decouple2.
- Для drive1/2 отдельно: каждый oldSet producer, поздний legacy completion и новый SU; предыдущий OR TRUE, fault появляется в первом скане. NC1/NC2, каждыйInterLock, каждыйconnector, PLCstop, Mentee: новый Set запрещён обоим. Pairedhealthy тотжеproducer даёт SetTRUE. Сбросить RS доисходногоFALSE, чтобы проверять именно запрещённый новый Set, а не требовать несогласованного forceReset ужеlatchedвыхода.
- Отдельно ужеlatchedSTO и существующие Reset producers: текущие reset действия, восстановление безrestart, retainedSU/faultmemory, Reset/Set collision. Не вводить новый forceReset через Set gates и не заменять faultsequence очисткой acceptedrequest.
- Сравнить waveform наружных aliases, Network10 status, Step3, discharge reset и ResetPB lock в обычном исходном запуске/остановке; объяснить scan shifts, не скрывать их. Параметры всехтаймеров побайтно прежние.
- Полный bindingaudit source253→255 доsubgraph; union actualrecognizer+N12+N1producer/guard/RS+нужныеconsumers, nofallback. FullBOOT/group lifecycle остаётся открытым какв03B; аппаратная/native Buildвалидация не заявляется.

Запись плана остановлена для review после actual03B. Далее сохранён исходный bounded report для trace; его budget NOTREADY заменён настоящим conditional пакетом выше.

Статус: **NOT READY для редактора SAL**. Прямое подключение SU к свободным OR-входам технически возможно, но не решает порядок скана и аварийный приоритет. Данный документ не разрешает такую частичную реализацию.

## Источник и намерение

Прочитан рабочий `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`, SHA256 `ea2443b0ea92f95584496360e103f4f9a8b5fd61bb2f492f88a9a9d60628564e`, 209 блоков. После iteration07 требуется обновить источник и повторить карту. Основание поведения — утверждённый StartingRun: при принятом физическом R&D запуске разрешить момент без ожидания C2/HV Healthy; последующее подтверждение Run сохранить. PLC-only запуск пока не определён; агрегат старого PLC/physical OR не является доказанным событием принятия физического запуска.

## Установленные реальные связи

| Назначение | Путь / порядок | Связь |
|---|---|---|
| STO drive1 latch | Network1/FBRs3 / 10 | Reset=FBOr7; Set=FBOr8 |
| STO drive2 latch | Network1/FBRs4 / 11 | Reset=FBOr9; Set=FBOr10 |
| Reset aggregates | FBOr7 / 40; FBOr9 / 42 | три действующих старых глобальных запроса каждого привода |
| Set aggregates | FBOr8 / 41; FBOr10 / 43 | старый обычный Set + второй Set от Network12 |
| Обычный Set | Network5/FBDecouple3 / 44 | два независимых выхода от существующего FBTon3 |
| R&D completion | Network12/FBAnd6 / 130 | Ton3 AND C2_FBK AND NOT HV_Healthy_FBK |
| Completion fanout | Network12/FBDecouple2 / 131 | STO Set обоих приводов, Step3 Set, ResetPB lock |
| EStop | Network1/main ESTOP / 21 | PLC guard producer /95, поэтому PLC требует отдельной current-raw проверки |

`FBAnd6` также пишет `b_Reset_HV_Discharg_Req2`. Его ветвь, Ton3, Step3 и ResetPB lock нельзя переносить на ранний SU: это отменило бы существующее подтверждение/завершение.

Реальные выходные aliases `STO_DR1` и `STO_DR2` исходят непосредственно из FBRs3/4. Они же читаются Network10/FBDecouple2/DecIn3 и DecIn4 для PLC-индикации. Это не свободные внутренние сигналы, которые можно подменить без проверки потребителей.

Свободные native OR-входы для добавочного физического запроса:

- Network1/FBOr8/OrIn3 `270d8d89-2f99-4e2b-84ac-f4ecadcd4d3c`.
- Network1/FBOr10/OrIn3 `45bbd24a-adec-4b7e-bfb9-c31d26a9c676`.

Предполагаемый источник — **принятый** SU физического recognizer с полными программными разрешениями, не raw BOTH и не PLC aggregate. Для true SGVL нужны реальное объявление, wrapped port-global reference и usage index; для прямого wire — один canonical edge. До завершения 03B точного источника принятого запуска в рабочем SAL нет.

## Почему одного добавочного AND пока недостаточно

Set OR41/43 исполняются после RS10/11. Простое добавление SU оставляет старые агрегаты до следующего скана, а сами RS ещё на один скан раньше. Более существенно: предыдущий TRUE Set может быть потреблён RS до вычисления актуальной аварии. Ограничить только SU до его записи недостаточно: уже записанный Set остаётся в цепи.

Два привода имеют разные старые Set aggregates и Reset aggregates. Общий новый AND с SU и permission не является gate для обоих полных Set producers. Два AND непосредственно перед Set каждого RS требуют **два** дополнительных блока: compact03B 254 + 2 = **256 >255**. Слияние двух Set aggregates без доказательства равенства меняет независимые старые пути и не разрешено этим планом.

Перенос OR+RS после recognizer также нельзя объявить готовым исправлением: требуется проследить Reset producers, старое относительное выполнение, наружные выходы и PLC-индикацию. Добавление raw fault в Reset потенциально меняет уже удерживаемый выход, а не только запрещает новый Set; это отдельное изменение, не эквивалент ранее принятым LV/HV Set guards. Здесь оно не предписывается.

## Минимальный следующий архитектурный пакет

1. После07 зафиксировать SHA и весь граф 03B с точным порядком SU, EStop/current raw permissions, обоих Set/Reset aggregates и RS.
2. Найти минимум один дополнительно экономимый блок с доказанным fanout/lifetime или обосновать иной общий native gate без слияния независимых старых запросов. Не удалять полный старый sequence ради бюджета.
3. Представить counted netlist для двух Set gates и точного same-scan порядка. Сохранить все старые Reset связи и confirmation fanout; никаких изменений времён.
4. Только после независимого ревью передавать SAL-пакет редактору. Pending PLC policy ограничивает PLC-only early acceptance, а не исследование физического пути.

## Приёмка будущего реального пакета

- Полная structural SAL/SGVL проверка до любого subgraph cut; число блоков <=255.
- Физический accepted SU при C2_FBK=FALSE и обоих raw значениях HV_Healthy: оба STO разрешаются в определённом программном скане; Step3/Run confirmation остаются FALSE до исходного подтверждения. До SU ни raw BOTH, ни новый PLC уровень не считаются этим событием.
- Положительный контроль того же trace с последующим C2/Healthy подтверждением: исходные discharge reset, Step3 и ResetPB действия действительно завершаются.
- Сохранённый TRUE от каждого старого Set producer отдельно и retained SU; затем первая текущая аварийная выборка: NC1, NC2, interlocks, PLC stop, Mentee и применимые исходные permissions. Не разрешать новый STO Set ни одного привода; парный здоровый trace обязан разрешать его. Не заменять проверку ожиданием нескольких сканов.
- Останов/сброс и восстановление без Reset: retained SU не обходит fault memory. Нормальные старые Set/Reset и оба наружных STO aliases проверяются отдельно, не только SGVL request.
- Запрошенное раннее разрешение не принимается за завершённый Run. Проверка программной обработки не заявляет физическую точность, аппаратную безопасность или native Build/CRC.

Точный технический остаток: одновременно совместить два независимых all-producer Set guards, same-scan физический acceptance и бюджет255. Текущая компактная схема оставляет один свободный блок; доказанного решения этого остатка пока нет. SAL, runtime и тесты данным исследованием не изменены.
