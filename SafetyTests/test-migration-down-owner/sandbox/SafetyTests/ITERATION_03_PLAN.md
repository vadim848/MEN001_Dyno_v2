# Iteration03 draft — фактическая граница chord 250мс

2026-10-18, архитектор. Сначала реализовать/ревьюить независимую Iteration02.
Этот пакет НЕ разрешает заведомо неподдержанный параметр SAL.

## Согласованный контракт

Последний ответ пользователя задаёт inclusive window250мс, SINGLE500мс,
BOTH1000мс непрерывно от второй кнопки, симметрично порядку. При второй в500мс
одиночная уже квалифицирована; ретроспективного StepUp нет. Наличие зелёной
снимает конечный unlock, поэтому qualified blue single не обещает видимый
импульс соленоида на равном скане. Пользователь явно разрешил изменение
только этого программного времени; остальные timers не менять.

D-LATE-SECOND: вторая >250 до принятияsingle отменяет всю попытку БЕЗ fault,
ни single, ни StepUp до обе OFF+существующий release filter. После принятия
single вторая не отменяет/не откатывает/не прерывает начатый переход; запрещены
только новые команды до полной очистки. Green hold снимает Unlock output,
но это не rollback принятого события. Эти события проверять отдельно.

Аналитик должен завершить трассировку последнего решения в SPEC/DECISIONS
до записи новых oracle. Код/reference не переопределяет намеренное изменение.

## Маленький этап03A — воспроизведение текущего SAL

Добавить в current-code acceptance сценарии реальной Network12, обе очередности
первой кнопки, полное начальное отпускание/release preparation. Шаг моделирования
1мс: вторая на249/250/251мс; затем999/1000/1001мс от второй. Если адаптер
не поддерживает1мс без искажения состояния/таймеров, сначала исправить его
и проверить стенд; выборку240/250/260мс не выдавать за точные границы.

На249/250 допустима BOTH после1000мс; на251 запрещён StepUp этой попытки.
Первая кнопка удерживается весь сценарий; после истечения SINGLE не делать
неутверждённого вывода о конкретном downstream состоянии через internal request.
В отдельной ветви первыйsingle500, вторая500/510 → singlepriority/noStepUp.
Негативный assertion noStepUp не подменять предположением о видимом unlockpulse.
Добавить обе очередности, непрерывныйBOTH/drop-reset/no-double-accept checks
по актуальным согласованным требованиям. Исторические fixture не менять.
Зелёный прототип не заменяет эти текущие SAL контрпримеры: отсутствие window
в текущем Network12 должно остаться честным FAIL, пока реализация не исправлена.

## Этап03B — проверка поддержанного примитива продолжается

Известный target проекта EL6900. Официальный Beckhoff TwinSAFE Logic FB v4.3,
§4.12.3: минимальная единица обычного TON0.1с; §4.12.4 расширение1/10мс
доступно EL6910/newer и не EL6900/KL6904.
[Документация производителя](https://download.beckhoff.com/download/Document/automation/twinsafe/twinsafe-logic-fb_en.pdf).
Поэтому добавить TON timing0.25 и объявить валидный SAL нельзя; host runtime
может считать250мс, но это не доказательство допустимости кода для target.
Не округлять молча до200/300мс, не менять hardware/global config, не подменять
таймер счетчиком сканов без гарантированного программного времени.

Ограничение выше относится к обычному TON/TOF, НЕ ко всем блокам EL6900.
Проверены альтернативы по официальным программным материалам: FB ESTOP
имеет Delay-Time selector без указанного в PDF шага; FB TWOHAND поддержан
EL6900 и имеет межгрупповое время до2500мс. Локальный установленный SDK
Resources.dll (Safety1.4.16) содержит сообщение проверки discrepancy range
100..2500мс с шагом10мс. Это свидетельство возможной реализуемости250мс,
но пока НЕ доказательство применения этого диапазона именно к intergroup
TWOHAND setting. Требуется установить точное поле/validator/serialization.
Вопрос пользователю о200/300 до завершения этой проверки преждевременен.

Перспективный путь: TWOHAND window250 → существующий BOTH TON1с, с отдельной
памятью однократности/очистки и single500. Ошибки TWOHAND/group ack не должны
превратить обычную позднюю вторую кнопку в fault вопреки D-LATE-SECOND.
Не подключать пользовательские кнопки к discrepancy-error паре вместо
межгруппового окна без доказательства её поведения. Возможный ESTOP off-delay
потребует явного initialization/restart и исключения ложного окна на startup;
пока эта альтернатива также НЕ READY к записи SAL.

### Результат точного исследования SDK

Исследовано read-only IL установленного vendor SDK Safety1.4.16:
`C:/Program Files (x86)/Beckhoff/TwinCAT/3.1/Components/Safety/1.4.16/v170/SALDesignerControl.dll`.
Ничего из publisher/verifier не вызывалось; прочитаны только metadata/IL.

- PublisherEL6900.BuildFunctionBlockDataSets RVA2000924, IL155D..15B2:
  межгрупповое поле выбирается lambda RVA2321859 по точной строке
  `Discrepancy between groups (ms)`; Timing преобразуется в integer/10 и
  записывается в byte54. Для250 это25, без округления.
- VerifierHSafetyPLC.VerifyFbTwoHand RVA2157708, IL0208..0263: то же поле,
  range100..2500, scale-10. IsGivenValueValid RVA2145840, IL028B..02F0,
  требует кратности10. Это ТОЧНО intergroup, не только channelpair.
- FBEStop Delay Time: VerifierHSafetyPLC.VerifyFbEstop RVA2154612,
  IL0155..017F: поле `Delay Time (ms)`, range100..30000, scale-10.
  PublisherEL6900 RVA2000924, IL05D3..0610: Timing integer/10. Поэтому250
  также представимо этим поддержанным типом, в отличие ordinary TON0.25.

TWOHAND как конечный recognizer не выбран: PDF §4.7 описывает intergroup
discrepancy diagnostic bit2 и ERROR→group behavior; недостаточно доказано,
что обычная поздняя вторая не потребует fault/ack. Игнорирование его Error
не гарантирует отсутствие group fault. Нельзя молча привязать эту семантику
к D-LATE-SECOND (late должно быть ignore без fault).

### Следующий reviewable technical proof: internal ESTOP off-delay250

Технически поддержанный путь найден; менять согласованное окно250 не требуется.
Создать именно внутренний window helper, не менять main safety EStop:
клонировать XML-форму текущего fBEstop с новыми GUID/instanceName, Delay
parameterPort timing250; единственный EStopIn1 активен, прямой, maxDeviation0;
EStopIn2..8 и EDM1/2 явно деактивированы. Restart и EStopIn1 только из
внутреннего recognizer, никаких новых aliases. MainEstop параметры не менять.
Имена/portNum/objectIndex/varId брать из существующего SAL, не выдумывать:
Delay Time(ms) portNum8/objectIndex0/varId0/timing250.

Внутренний протокол (не новый пользовательский жест): после полного разрешённого
release пройти Prepare: EStopIn1 TRUE, Restart TRUE один scan, затем Restart
FALSE; Ready только когда EStopOut TRUE. На startup Ready FALSE, выхода
window одного EStopDelOut недостаточно. При первой новой кнопке перевести
EStopIn1 FALSE, Restart FALSE: EStopOut FALSE, EStopDelOut удерживается250мс.
Вторая кнопка захватывается только в active attempt и текущем допустимом окне.
Потеря кнопки/невалидная поздняя вторая переводит попытку в WaitRelease,
оставшийся DelOut сам по себе не разрешает новый жест. Полное отпускание
и существующий filter снова разрешают Prepare. На acceptedSingle память
accepted не откатывать при второй: D-LATE-SECOND.

Это вспомогательный ESTOP с одним входом, без EDM и discrepancy, поэтому
обычная потеря EStopIn1 реализует документированный off-delay, а не
discrepancy error. Его synthetic Restart никогда не подключать к main EStop,
group ErrAck или машине. Group startup/stop не превращать в auto-accepted attempt.

До интеграции редактор должен подтвердить на фактическом serialized helper:
startup0outputs; prepare0→1→0; первыйinputloss→delay250; noError при всех
нормальных late/release последовательностях; reprepare послеexpiry иcancel;
никакой выход машины не управляется helper до accepted attempt. Точный
inclusive250 реализуется явным порядком capture/evaluate/commit, требует
проверки249/250/251, а не переноса host elapsed в несуществующий native clock.
При необходимости исправления адаптера сначала документировать elapsed
origin и validate его independently: текущий safeEstop считает offElapsed
включая первый loss scan, это может дать сдвиг boundary.

Полный recognizer SAL patch всё ещё требует отдельного точного графа
state memory/order и всех сохраняемых PLC bypass routes. Это не готовый
заменитель реализации и не предложение добавить неиспользуемый helper в
production SAL ради количества блоков. Stage03B proof снимает технический
вопрос представимости250, но не закрывает BTN/CVR без интеграционных тестов.
Native verification вне scope не выдаётся за выполненную.

StartingRun — другой пакет: разделение STO requests и Run confirmation не
решает неизвестный accepted-launch binding; см. REFERENCE_PHASE_MAPPING.
