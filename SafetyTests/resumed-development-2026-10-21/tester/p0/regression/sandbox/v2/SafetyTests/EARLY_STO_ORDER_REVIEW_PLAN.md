# Early STO: минимальный порядок без tail relocation

Статус: **READY для архитектурного ревью, conditional после actual03B**. Только план. Параметры и SAL не менялись. Previous tail-вариант в EARLY_STO_PROGRAM_PLAN.md — альтернатива, не выбранная инструкция. User требует запуск без ожидания C2/Healthy; same-scan выхода он отдельно не задавал.

## Выбранный минимальный вариант

Сохранить относительный порядок **всех253** блоков accepted03B. Перед existing STO RS3 и RS4 вставить по одному safeAnd; новые позиции: guard1=10, RS3=11, guard2=12, RS4=13 (остальные исходные позиции сдвигаются численно на2 после них). Reset OR7/9, Set OR8/10, Network10 diagnostics остаются относительно RS/старых producers там же. Вставка без перемещения старых блоков сохраняет прежние one-scan Reset зависимости и PLC indication order. Total255.

Оба новых AND имеют **четыре** активных входа: свой существующий полный Set aggregate; CurrentPermit; !rawMentee; existing Network1/FBAnd1/AndOut (PLC producer previous sample). Остальные4деактивированы. Последний вход обязателен для short PLC pulse; три входа недостаточны. Native ports клонировать с правильным safeAnd типом и contact polarity, directedges canonical, Mentee fanout через истинный SALalias usage. Не менять CurrentPermit, mainESTOP или их порядок в этом пакете.

Сохранённые existing Set OR OrIn3 получают actual accepted physical SU, отдельный canonical edge на каждыйdrive. OR8/OR10 продолжают агрегировать все старые независимые writers. OR→RS прежние прямые edges заменяются OR→свойAND→свойRS. Reset wiring и наружные aliases не меняются. And6/Decouple2 confirmation/discharge reset/Step3/ResetPB остаются нетронуты; late legacy STO writers допустимы только через те же новые guards. PLC-only early launch policy не определяется.

## Точная программная задержка

SU принят в scanN после ранних Set OR/RS. ВN+1 OR впервые видит retainedSU, RS ещё прочитал старый OR. ВN+2 RS получает этот запрос через current-fault AND. Это две фиксированные программные передачи, **без** ожидания C2/Healthy или нового таймера. Нельзя называть её нулевым временем или обещать физическую задержку. Если исходный phase handoff снимаетSU раньшеN+1, integration должна сохранить принятую request lifetime — не seed TRUE вместо проверки.

Tail-вариант даёт sameacceptedscan, но перемещает старые RS после ResetOR, меняет прежнюю scan latency Reset и PLC status sampling. Поскольку same-scan не требование пользователя, минимальный вариант предпочтителен и требует меньше изменений исходной последовательности.

## Почему нужен fourth input

| Выборка | rawPLCstop | previous PLCproducer | Previous EStopOK | raw-only permission | Четвёртый guard |
|---|---|---|---|---|---|
| healthy | FALSE | TRUE | TRUE | TRUE | TRUE |
| faultN | TRUE | TRUE | TRUE | FALSE | FALSE |
| rawrestoreN+1 | FALSE | FALSE | TRUE | TRUE | FALSE |
| N+2 безRestart | FALSE | TRUE | FALSE | FALSE | FALSE |

MainESTOP позднее ранних RS, а PLCproducer позднее mainESTOP. Нельзя выдать rawrestore за восстановление разрешения. Fourth input переносит уже наблюдённый PLC stop до того, как EStop memory станет видна ранним guards. Current raw ban одновременно закрывает первый fault scan. Ужеlatched STO не принудительноReset этим Set gate; существующая аварийная последовательность остаётся владельцем остановки.

## Actual acceptance

После stable03B записать source hashes и exact port IDs. Для каждого drive/старого producer/SU проверить предыдущийORTRUE с RSFALSE: здоровый positive, первыйfault, pulsefault→rawrestore безRestart. Исполнять actual PLCproducer/mainESTOP, не seed b_EStop_Ok постоянноTRUE. Проверить каждый текущийrawfault и Mentee, сохранённый Reset/Set collision и alreadylatched outputs. Для accepted physicalSU ждать ровно документированную N→N+2 передачу при C2FALSE/Healthyraw обоих значений; Step3confirmation ещёFALSE. Наблюдать весь интервал; позднееfeedbackзавершение должно сохранять старые действия.

Сравнить reset/output/status waveforms до/после с одинаковыми trace; прежние относительные порядки не меняются, никаких таймеров/параметров. Полная structural validation доcut;255limit; groupBOOTgap отдельно. Все действия earlySTO ограничены физическимacceptedroute. Существующий похожий LV/HVgap оформлен отдельно PLC_PULSE_SET_GUARD_REVIEW.md и не объявляется закрытым этим пакетом.

Запись STOP для ревью. SAL/runtime/tests не изменены.
