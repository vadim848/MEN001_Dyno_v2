# Независимое ревью03B Phase A actual-source пакета

2026-10-19. Read-only проверены current-rnd-physical-integration.test.js,
helpers/physical-rnd-source.js, RED baseline и TESTS_READY. Код/SAL/план
ревьюер не менял. Это приёмка tests-first пакета, не реализации recognizer.

## Проверенные свойства

Whole-source binding audit предшествует динамическому замыканию dependencies.
Выбираются настоящие writers исходных request и физических outputs, затем
их зависимости. Для Decouple учитывается требуемый канал, а важные alias/
globals/wires разрешаются типизированно; unknown demanded input приводит
к ошибке, не permissive fallback. Network3 ownership отделён явно и задан
через существующие phase variables, не выдуманные acceptance markers.

Actual main Restart выполняется high/falling. LV setup поднимается через
real Step12 producer→OR→SetPermit→RS с положительным output control,
а не прямым присваиванием энергии. Потом задаётся устойчивая R&D boundary.
Это не доказательство полного перехода/reachability/PLC handshake, что
scope явно сохраняет. Наблюдаются source requests, HV request и реальные
HV/LV/Unlock outputs, frames и rising edges по каждому scan.

Таймерные before/at/after и обе очередности используют observed clock03C;
500мс minimum не превращён в обязательную FALSE на500 или новую норму501/502.
Реальная историческая consumer latency названа отдельно. Cases включают
late300/500/600, flicker, piano, retained levels, full/short release,
reentry, inhibit и актуальные Door/NC/07 controls. Fake planned state
module не используется как исполнение actual SAL.

## R1 — пропуск самой выборки held reentry

В первоначальном тесте reentry with held chord `mark=frames.length` ставился
после `sample({b_Step_RnD:true})`. Односкановый запрещённый up непосредственно
на reentry исключался из проверяемой slice; будущая импульсная реализация
могла получить ложный PASS. Нужно наблюдать начиная до entry sample либо
проверять его явно/rise counter. Требование не меняется, исправляется
наблюдатель. Передано редактору/владельцу; итоговая приёмка после доработки.

Других существенных замечаний по выполненной сверке пока нет. Stateful
phase boundary, partial group lifecycle/Network4 и no-EDM ограничения
остаются пределами evidence; native/hardware validation не заявляется.

## Повторное ревью — R1 закрыт

Редактор остановил запись после переноса mark ДО entry sample. Теперь сам
первый frame обязан иметь timestamp entry и raw.RnDTRUE, а запрет Up
включает его и все следующие1500мс. Endpoint/initial-edge loophole устранён,
исходный reentry дефект SAL остался настоящим FAIL.

Самостоятельный полный targeted запуск воспроизвёл61:28PASS/33FAIL/0skip.
После R1 отдельно воспроизведена reentry последовательность новым helper:
entry timestamp совпадает с первой проверяемой frame, RnDTRUE, demanded
unknown0, legacy forbidden Up наблюдается. Полный повтор редактора после
R1 дал прежние28/33, source/runtime SHA не менялись. Нового oracle нет.

Итоговый вердикт: actual-source RED пакет принят к checkpoint перед03B
реализацией. Существенных незакрытых замечаний нет. Dynamic closure104,
явные26 inputs и real energy setup делают пакет полезным source evidence,
но не доказывают полный Network3 lifecycle/reachability или merged PLC
policy. 33FAIL — честное новое покрытие прежнего SAL, не исправления.
Перед последующей приёмкой actual253 integration нужны тот же пакет,
полный software pipeline, exact netlist/binding/order audit и независимое
ревью. Hardware/native validation не заявляется и не является gate.
